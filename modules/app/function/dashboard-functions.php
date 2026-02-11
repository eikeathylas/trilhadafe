<?php

function getDashboardStatsData($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];
        $yearId = (int)$data['year_id'];

        $stats = [];

        // 1. Total de Pessoas (Vinculadas à Org)
        // Conta quem foi criado na org OU tem vínculo ativo nela
        $sql = "SELECT COUNT(DISTINCT p.person_id) as total 
                FROM people.persons p
                LEFT JOIN people.person_roles pr ON p.person_id = pr.person_id AND pr.org_id = :oid
                WHERE p.deleted IS FALSE AND p.deceased IS FALSE
                AND (p.org_id_origin = :oid OR pr.role_id IS NOT NULL)";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $stats['total_pessoas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Turmas Ativas (Da Org e Ano Selecionado)
        $sql = "SELECT COUNT(*) as total FROM education.classes 
                WHERE is_active IS TRUE AND deleted IS FALSE 
                AND org_id = :oid
                AND academic_year_id = :yid";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId, 'yid' => $yearId]);
        $stats['total_turmas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // // 3. Próxima Missa (Da Org)
        // $sql = "SELECT date_time FROM pastoral.celebrations 
        //         WHERE org_id = :oid AND date_time >= CURRENT_TIMESTAMP AND status = 'SCHEDULED' 
        //         ORDER BY date_time ASC LIMIT 1";
        // $stmt = $conect->prepare($sql);
        // $stmt->execute(['oid' => $orgId]);
        // $missa = $stmt->fetch(PDO::FETCH_ASSOC);

        // if ($missa) {
        //     $timestamp = strtotime($missa['date_time']);
        //     $diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        //     $dia = $diaSemana[date('w', $timestamp)];
        //     $hora = date('H:i', $timestamp);
        //     $stats['proxima_missa'] = "$dia $hora";
        // } else {
        //     $stats['proxima_missa'] = "Sem agendamento";
        // }

        // // 4. Financeiro (Entradas do Mês na Org)
        // $sql = "SELECT SUM(amount) as total FROM finance.transactions 
        //         WHERE org_id = :oid
        //         AND transaction_type = 'CREDIT' 
        //         AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        //         AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        // $stmt = $conect->prepare($sql);
        // $stmt->execute(['oid' => $orgId]);
        // $totalFinanceiro = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        // $stats['financeiro_mes'] = "R$ " . number_format($totalFinanceiro ?? 0, 2, ',', '.');

        // // 5. Avisos (Da Org)
        // $sql = "SELECT title, summary, TO_CHAR(published_at, 'DD/MM') as date_fmt 
        //         FROM communication.posts 
        //         WHERE org_id = :oid AND status = 'PUBLISHED' 
        //         ORDER BY published_at DESC LIMIT 3";
        // $stmt = $conect->prepare($sql);
        // $stmt->execute(['oid' => $orgId]);
        // $avisos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // $stats['avisos'] = [];
        // if ($avisos) {
        //     foreach ($avisos as $aviso) {
        //         $stats['avisos'][] = [
        //             'date' => $aviso['date_fmt'],
        //             'title' => $aviso['title'],
        //             'summary' => mb_strimwidth($aviso['summary'], 0, 50, "...")
        //         ];
        //     }
        // }

        // 6. Aniversariantes (Da Org)
        $sql = "SELECT DISTINCT p.full_name, TO_CHAR(p.birth_date, 'DD/MM') as birth_fmt, p.profile_photo_url, TO_CHAR(p.birth_date, 'MM-DD') as birth_md
                FROM people.persons p
                LEFT JOIN people.person_roles pr ON p.person_id = pr.person_id AND pr.org_id = :oid
                WHERE p.birth_date IS NOT NULL AND p.deleted IS FALSE
                AND (p.org_id_origin = :oid OR pr.role_id IS NOT NULL)
                AND TO_CHAR(p.birth_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') 
                AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')
                ORDER BY birth_md ASC";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
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


function getUpcomingEventsData($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

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
            WHERE org_id = :oid
            AND event_date >= CURRENT_DATE 
            AND deleted IS FALSE
            ORDER BY event_date ASC
        ";

        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

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
            $ev['is_academic_blocker'] = ($ev['is_academic_blocker'] === true || $ev['is_academic_blocker'] === 't');
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
