<?php

function fetchDashboardStats($pdo)
{
    try {
        $stats = [];

        // 1. Total de Pessoas (Fiéis/Alunos)
        // Ignora falecidos
        $sqlPessoas = "SELECT COUNT(*) as total FROM people.persons WHERE deceased IS FALSE";
        $stmt = $pdo->query($sqlPessoas);
        $stats['total_pessoas'] = $stmt->fetch()['total'];

        // 2. Turmas Ativas (Ano Atual)
        // Pega turmas do ano corrente que estão com status 'ACTIVE'
        $sqlTurmas = "SELECT COUNT(*) as total FROM education.classes WHERE status = 'ACTIVE' AND year_cycle = EXTRACT(YEAR FROM CURRENT_DATE)";
        $stmt = $pdo->query($sqlTurmas);
        $stats['total_turmas'] = $stmt->fetch()['total'];

        // 3. Próxima Missa/Celebração
        // Pega a primeira missa agendada a partir de "agora"
        $sqlMissa = "SELECT date_time, liturgical_feast FROM pastoral.celebrations WHERE date_time >= CURRENT_TIMESTAMP AND status = 'SCHEDULED' ORDER BY date_time ASC LIMIT 1";
        $stmt = $pdo->query($sqlMissa);
        $missa = $stmt->fetch();

        if ($missa) {
            // Formata: "Dom 19:00"
            $timestamp = strtotime($missa['date_time']);
            $diaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            $dia = $diaSemana[date('w', $timestamp)];
            $hora = date('H:i', $timestamp);
            $stats['proxima_missa'] = "$dia $hora";
        } else {
            $stats['proxima_missa'] = "Sem agendamento";
        }

        // 4. Financeiro (Entradas do Mês Atual)
        // Soma todas as transações de entrada (CREDIT) do mês corrente
        $sqlFin = "SELECT SUM(amount) as total 
                   FROM finance.transactions 
                   WHERE transaction_type = 'CREDIT' 
                   AND EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                   AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)";
        $stmt = $pdo->query($sqlFin);
        $totalFinanceiro = $stmt->fetch()['total'];

        // Formata para R$ (O PHP faz isso melhor que o JS)
        $stats['financeiro_mes'] = "R$ " . number_format($totalFinanceiro ?? 0, 2, ',', '.');

        // 5. Avisos Recentes (Blog/Notícias)
        // Pega os últimos 3 posts publicados
        $sqlAvisos = "SELECT title, summary, TO_CHAR(published_at, 'DD/MM') as date_fmt 
                      FROM communication.posts 
                      WHERE is_published IS TRUE 
                      ORDER BY published_at DESC LIMIT 3";
        $stmt = $pdo->query($sqlAvisos);
        $avisos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats['avisos'] = [];
        foreach ($avisos as $aviso) {
            $stats['avisos'][] = [
                'date' => $aviso['date_fmt'],
                'title' => $aviso['title'],
                'summary' => mb_strimwidth($aviso['summary'], 0, 50, "...") // Corta texto longo
            ];
        }

        return $stats;
    } catch (PDOException $e) {
        // Em produção, use error_log($e->getMessage())
        return [
            'total_pessoas' => 0,
            'total_turmas' => 0,
            'proxima_missa' => 'Erro',
            'financeiro_mes' => 'R$ 0,00',
            'avisos' => []
        ];
    }
}
