<?php

// =========================================================
// DASHBOARD FUNCTIONS (Model) - V4.2 (Master View Fix)
// =========================================================

/**
 * Busca estatísticas gerais para os Cards e Avisos
 */
function getDashboardStatsData($data)
{
    try {
        $conect = $GLOBALS["local"];

        $stats = [];

        // 1. Total de Pessoas (Exclui falecidos)
        $sql = "SELECT COUNT(*) as total FROM people.persons WHERE deceased IS FALSE AND deleted IS FALSE";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $stats['total_pessoas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Turmas Ativas (Ano Corrente)
        $sql = "SELECT COUNT(*) as total FROM education.classes 
                WHERE is_active IS TRUE AND deleted IS FALSE 
                AND academic_year_id = EXTRACT(YEAR FROM CURRENT_DATE)";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $stats['total_turmas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 3. Próxima Missa
        $sql = "SELECT date_time FROM pastoral.celebrations 
                WHERE date_time >= CURRENT_TIMESTAMP AND status = 'SCHEDULED' 
                ORDER BY date_time ASC LIMIT 1";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $missa = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($missa) {
            $timestamp = strtotime($missa['date_time']);
            $diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            $dia = $diaSemana[date('w', $timestamp)];
            $hora = date('H:i', $timestamp);
            $stats['proxima_missa'] = "$dia $hora";
        } else {
            $stats['proxima_missa'] = "Sem agendamento";
        }

        // 4. Financeiro (Entradas do Mês)
        $sql = "SELECT SUM(amount) as total FROM finance.transactions 
                WHERE transaction_type = 'CREDIT' 
                AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $totalFinanceiro = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        $stats['financeiro_mes'] = "R$ " . number_format($totalFinanceiro ?? 0, 2, ',', '.');

        // 5. Avisos (Status PUBLISHED)
        $sql = "SELECT title, summary, TO_CHAR(published_at, 'DD/MM') as date_fmt 
                FROM communication.posts 
                WHERE status = 'PUBLISHED' 
                ORDER BY published_at DESC LIMIT 3";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $avisos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats['avisos'] = [];
        if ($avisos) {
            foreach ($avisos as $aviso) {
                $stats['avisos'][] = [
                    'date' => $aviso['date_fmt'],
                    'title' => $aviso['title'],
                    'summary' => mb_strimwidth($aviso['summary'], 0, 50, "...")
                ];
            }
        }

        // 6. Aniversariantes (Próximos 30 dias)
        $sql = "SELECT full_name, TO_CHAR(birth_date, 'DD/MM') as birth_fmt, profile_photo_url
                FROM people.persons 
                WHERE birth_date IS NOT NULL AND deleted IS FALSE
                AND TO_CHAR(birth_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') 
                AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')
                ORDER BY TO_CHAR(birth_date, 'MM-DD') ASC";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $aniversariantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats['aniversariantes'] = [];
        if ($aniversariantes) {
            foreach ($aniversariantes as $aniversariante) {
                $stats['aniversariantes'][] = [
                    'name' => $aniversariante['full_name'],
                    'birth_date' => $aniversariante['birth_fmt'],
                    'photo_url' => $aniversariante['profile_photo_url']
                ];
            }
        }

        return success("Dados do dashboard carregados.", $stats);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getDashboardStatsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao buscar dados do dashboard.");
    }
}

/**
 * Busca as paróquias disponíveis para o usuário (Multitenancy)
 * CORREÇÃO: Consulta direta ao Banco Staff, sem dependência do Banco Local.
 */
function getMyParishesData($data)
{
    try {
        // 1. Garante conexão Local (Onde estão as paróquias/unidades)
        if (!isset($GLOBALS["local"])) {
            return failure("Erro: Conexão com banco local não estabelecida.");
        }
        $conectLocal = $GLOBALS["local"];

        // 2. Garante conexão Staff (Para verificar permissão Global de DEV)
        $conectStaff = getStaff();
        if (!$conectStaff) {
            return failure("Erro de conexão com o servidor central.");
        }

        $userId = $data['user_id']; // ID Global do usuário

        // --------------------------------------------------------------------
        // PASSO A: VERIFICA SE É SUPER USUÁRIO (DEV / STAFF) NO BANCO CENTRAL
        // --------------------------------------------------------------------
        $sqlUser = "SELECT staff FROM users WHERE id = :uid";
        $stmtUser = $conectStaff->prepare($sqlUser);
        $stmtUser->execute(['uid' => $userId]);
        $resStaff = $stmtUser->fetch(PDO::FETCH_ASSOC);

        // Trata retorno booleano do Postgres
        $isGlobalAdmin = ($resStaff && ($resStaff['staff'] === true || $resStaff['staff'] === 't' || $resStaff['staff'] === 1));

        $parishes = [];

        // --------------------------------------------------------------------
        // PASSO B: BUSCA AS UNIDADES NO BANCO LOCAL (BASEADO NA PERMISSÃO)
        // --------------------------------------------------------------------

        if ($isGlobalAdmin) {
            // ====================================================
            // CENÁRIO 1: DEV / STAFF (Vê TODAS as paróquias LOCAIS)
            // ====================================================
            // O Dev precisa ver todas as unidades cadastradas neste banco de dados
            $sql = "SELECT org_id as id, display_name as name 
                    FROM organization.organizations 
                    WHERE is_active IS TRUE AND deleted IS FALSE AND org_type = 'PARISH'
                    ORDER BY display_name ASC";

            $stmt = $conectLocal->prepare($sql);
            $stmt->execute();
            $parishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            // ====================================================
            // CENÁRIO 2: USUÁRIO COMUM (Vê apenas paróquias vinculadas)
            // ====================================================

            // Primeiro, precisamos descobrir o 'person_id' local deste usuário global
            $stmtP = $conectLocal->prepare("SELECT person_id FROM security.users WHERE user_id = :uid");
            $stmtP->execute(['uid' => $userId]);
            $personId = $stmtP->fetchColumn();

            if (!$personId) {
                return success("Nenhum vínculo local encontrado.", []);
            }

            // Busca organizações onde ele tem cargo ativo
            $sql = "SELECT DISTINCT o.org_id as id, o.display_name as name
                    FROM organization.organizations o
                    JOIN people.person_roles pr ON o.org_id = pr.org_id
                    WHERE pr.person_id = :pid 
                    AND pr.is_active IS TRUE AND pr.deleted IS FALSE
                    AND o.is_active IS TRUE AND o.deleted IS FALSE
                    AND org_type = 'PARISH'
                    ORDER BY o.display_name ASC";

            $stmt = $conectLocal->prepare($sql);
            $stmt->execute(['pid' => $personId]);
            $parishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return success("Unidades carregadas.", $parishes);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getMyParishesData", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar lista de unidades.");
    }
}

/**
 * Busca os próximos eventos da agenda paroquial (Widget)
 */
function getUpcomingEventsData($data)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = "
            SELECT 
                event_id,
                title,
                description,
                TO_CHAR(event_date, 'DD/MM') as date_fmt,
                TO_CHAR(event_date, 'Dy') as day_fmt,
                start_time,
                is_academic_blocker
            FROM organization.events
            WHERE event_date >= CURRENT_DATE 
            AND deleted IS FALSE
            ORDER BY event_date ASC
        ";

        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Mapa de tradução dos dias da semana
        $weekMap = [
            'Sun' => 'Dom',
            'Mon' => 'Seg',
            'Tue' => 'Ter',
            'Wed' => 'Qua',
            'Thu' => 'Qui',
            'Fri' => 'Sex',
            'Sat' => 'Sáb',
            'dom' => 'Dom',
            'seg' => 'Seg',
            'ter' => 'Ter',
            'qua' => 'Qua',
            'qui' => 'Qui',
            'sex' => 'Sex',
            'sáb' => 'Sáb'
        ];

        foreach ($events as &$ev) {
            $dayKey = trim($ev['day_fmt']);
            $ev['day_week'] = $weekMap[$dayKey] ?? $dayKey;

            // Garante booleano para o Javascript
            $ev['is_academic_blocker'] = ($ev['is_academic_blocker'] === true || $ev['is_academic_blocker'] === 't');

            // Trunca descrição longa
            if (!empty($ev['description'])) {
                $ev['description'] = mb_strimwidth($ev['description'], 0, 40, "...");
            }
        }

        return success("Agenda carregada.", $events);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getUpcomingEventsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar agenda.");
    }
}
