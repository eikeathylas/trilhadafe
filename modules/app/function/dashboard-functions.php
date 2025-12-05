<?php

function getDashboardStatsData($data)
{
    try {
        $conect = $GLOBALS["local"];

        $stats = [];

        // 1. Total de Pessoas
        // Conta todos que não estão marcados como falecidos
        $sql = <<<'SQL'
            SELECT COUNT(*) as total 
            FROM people.persons 
            WHERE deceased IS FALSE
        SQL;
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $stats['total_pessoas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 2. Turmas Ativas
        // Conta turmas ativas do ano corrente
        $sql = <<<'SQL'
            SELECT COUNT(*) as total 
            FROM education.classes 
            WHERE status = 'ACTIVE' 
            AND year_cycle = EXTRACT(YEAR FROM CURRENT_DATE)
        SQL;
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $stats['total_turmas'] = $stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // 3. Próxima Missa
        // Pega a próxima celebração agendada
        $sql = <<<'SQL'
            SELECT date_time 
            FROM pastoral.celebrations 
            WHERE date_time >= CURRENT_TIMESTAMP 
            AND status = 'SCHEDULED' 
            ORDER BY date_time ASC 
            LIMIT 1
        SQL;
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

        // 4. Financeiro (Entradas Mês)
        $sql = <<<'SQL'
            SELECT SUM(amount) as total 
            FROM finance.transactions 
            WHERE transaction_type = 'CREDIT' 
            AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        SQL;
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        $totalFinanceiro = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
        $stats['financeiro_mes'] = "R$ " . number_format($totalFinanceiro ?? 0, 2, ',', '.');

        // 5. Avisos (CORRIGIDO)
        // Ajustado para usar a coluna 'status' em vez de 'is_published'
        $sql = <<<'SQL'
            SELECT title, summary, TO_CHAR(published_at, 'DD/MM') as date_fmt 
            FROM communication.posts 
            WHERE status = 'PUBLISHED' 
            ORDER BY published_at DESC 
            LIMIT 3
        SQL;
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

        return success("Dados do dashboard carregados.", $stats);
    } catch (Exception $e) {
        logSystemError("painel", "dashboard", "getDashboardStatsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao buscar dados do dashboard.", null, false, 500);
    }
}
