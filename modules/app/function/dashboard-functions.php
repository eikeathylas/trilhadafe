<?php

/**
 * Obtém as estatísticas do Dashboard com suporte a novos cards de métricas
 * Refatorado para incluir contagens por Role (Perfil)
 */
function getDashboardStatsData($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];
        $yearId = (int)$data['year_id'];

        $stats = [];

        // 1. Total de Pessoas (Geral da Unidade)
        $sql = "SELECT COUNT(DISTINCT p.person_id) as total 
                FROM people.persons p
                LEFT JOIN people.person_roles pr ON p.person_id = pr.person_id AND pr.org_id = :oid
                WHERE p.deleted IS FALSE AND p.deceased IS FALSE
                AND (p.org_id_origin = :oid OR pr.role_id IS NOT NULL)";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $stats['total_pessoas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 2. Turmas Ativas (Ano Corrente)
        $sql = "SELECT COUNT(*) as total FROM education.classes 
                WHERE is_active IS TRUE AND deleted IS FALSE 
                AND org_id = :oid AND year_id = :yid";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId, 'yid' => $yearId]);
        $stats['total_turmas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // --- NOVAS MÉTRICAS REFATORADAS ---

        // 3. Total de Usuários (Administrativo/Operacional - Role 1)
        $sql = "SELECT
                    COUNT(DISTINCT pr.person_id) AS total
                FROM
                    people.person_roles pr
                JOIN security.users su ON su.person_id = pr.person_id
                WHERE
                    pr.org_id = :oid
                    AND pr.role_id = 1"; 
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $stats['total_usuarios'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 4. Total de Catequizandos (Estudantes - Role 2)
        $sql = "SELECT COUNT(DISTINCT person_id) as total FROM people.person_roles 
                WHERE org_id = :oid AND role_id = 2"; 
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $stats['total_catequizandos'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 5. Total de Professores (Catequistas - Role 3)
        $sql = "SELECT COUNT(DISTINCT person_id) as total FROM people.person_roles 
                WHERE org_id = :oid AND role_id = 3"; 
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $stats['total_professores'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

        // 6. Aniversariantes dos próximos 30 dias
        $sql = "SELECT DISTINCT p.full_name, TO_CHAR(p.birth_date, 'DD/MM') as birth_fmt, 
                       p.profile_photo_url, TO_CHAR(p.birth_date, 'MM-DD') as birth_md
                FROM people.persons p
                LEFT JOIN people.person_roles pr ON p.person_id = pr.person_id AND pr.org_id = :oid
                WHERE p.birth_date IS NOT NULL AND p.deleted IS FALSE
                AND (p.org_id_origin = :oid OR pr.role_id IS NOT NULL)
                AND TO_CHAR(p.birth_date, 'MM-DD') BETWEEN TO_CHAR(CURRENT_DATE, 'MM-DD') 
                AND TO_CHAR(CURRENT_DATE + INTERVAL '30 days', 'MM-DD')
                ORDER BY birth_md ASC, p.full_name ASC LIMIT 10";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $aniversariantes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats['aniversariantes'] = [];
        foreach ($aniversariantes as $aniv) {
            $stats['aniversariantes'][] = [
                'name' => $aniv['full_name'],
                'birth_date' => $aniv['birth_fmt'],
                'photo_url' => $aniv['profile_photo_url']
            ];
        }

        return success("Estatísticas do dashboard atualizadas.", $stats);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getDashboardStatsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar métricas do dashboard.");
    }
}

/**
 * Obtém a agenda de eventos futuros padronizada
 */
function getUpcomingEventsData($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

        $sql = "SELECT event_id, title, description, 
                       TO_CHAR(event_date, 'DD/MM') as date_fmt,
                       TO_CHAR(event_date, 'Dy') as day_fmt,
                       start_time, is_academic_blocker
                FROM organization.events
                WHERE org_id = :oid AND event_date >= CURRENT_DATE AND deleted IS FALSE
                ORDER BY event_date ASC, title ASC LIMIT 5";

        $stmt = $conect->prepare($sql);
        $stmt->execute(['oid' => $orgId]);
        $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $weekMap = [
            'Sun' => 'Dom', 'Mon' => 'Seg', 'Tue' => 'Ter', 'Wed' => 'Qua', 
            'Thu' => 'Qui', 'Fri' => 'Sex', 'Sat' => 'Sáb'
        ];

        foreach ($events as &$ev) {
            $dayKey = trim($ev['day_fmt']);
            $ev['day_week'] = $weekMap[$dayKey] ?? $dayKey;
            $ev['is_academic_blocker'] = ($ev['is_academic_blocker'] === true || $ev['is_academic_blocker'] === 't');
            $ev['description'] = $ev['description'] ? mb_strimwidth($ev['description'], 0, 50, "...") : "";
        }

        return success("Agenda carregada com sucesso.", $events);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getUpcomingEventsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar agenda de eventos.");
    }
}