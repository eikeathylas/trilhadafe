<?php

/**
 * ==========================================================
 * TRILHA DA FÉ - MOTOR DE REGRAS DE NEGÓCIO (SILENT HOOK)
 * DATA: 27/02/2026
 * ==========================================================
 */

function runDailyNotificationCheck()
{
    try {
        // 1. Recupera a conexão global iniciada no validation.php
        $conect = $GLOBALS["local"];

        // Se a conexão ainda não existir (ex: erro no database.php), aborta silenciosamente
        if (!$conect) return;

        $hoje = date('m-d');
        $amanha = date('Y-m-d', strtotime('+1 day'));

        // --- REGRA 1: ANIVERSÁRIOS DE ALUNOS ---
        // Alvos: Catequistas da Turma (Role 3) e Coordenador da Turma (Person)
        $sqlAlunos = "
            SELECT p.person_id, p.full_name, c.coordinator_id, c.org_id, c.name as class_name
            FROM people.persons p
            JOIN education.enrollments e ON p.person_id = e.student_id
            JOIN education.classes c ON e.class_id = c.class_id
            WHERE to_char(p.birth_date, 'MM-DD') = :hoje
              AND e.status = 'ACTIVE' AND e.deleted IS FALSE
        ";

        $stmtA = $conect->prepare($sqlAlunos);
        $stmtA->execute(['hoje' => $hoje]);
        $aniversariantes = $stmtA->fetchAll(PDO::FETCH_ASSOC);

        var_dump($aniversariantes); // Debug: Verificar alunos encontrados

        foreach ($aniversariantes as $aluno) {
            $msg = "Hoje é aniversário do aluno(a) {$aluno['full_name']} da turma {$aluno['class_name']}.";

            // Notifica Role de Catequista (Target Val 3)
            createSystemNotification($aluno['org_id'], "Aniversário de Aluno", $msg, 'SUCCESS', 'ROLE', 3);

            // Notifica especificamente o professor (Target Person)
            if (!empty($aluno['coordinator_id'])) {
                createSystemNotification($aluno['org_id'], "Seu Aluno faz aniversário!", $msg, 'SUCCESS', 'PERSON', $aluno['coordinator_id']);
            }
        }

        // --- REGRA 2: ANIVERSÁRIOS DE PROFESSORES ---
        // Alvos: Secretaria e Coordenação (Role 2)
        $sqlProfs = "
            SELECT p.person_id, p.full_name, pr.org_id
            FROM people.persons p
            JOIN people.person_roles pr ON p.person_id = pr.person_id
            WHERE to_char(p.birth_date, 'MM-DD') = :hoje
              AND pr.role_id = 3 
              AND pr.is_active IS TRUE AND pr.deleted IS FALSE
        ";

        $stmtP = $conect->prepare($sqlProfs);
        $stmtP->execute(['hoje' => $hoje]);
        $profs = $stmtP->fetchAll(PDO::FETCH_ASSOC);

        foreach ($profs as $prof) {
            $msg = "Hoje é aniversário do Professor(a) {$prof['full_name']}. Notifique a paróquia!";
            createSystemNotification($prof['org_id'], "Aniversário de Professor", $msg, 'INFO', 'ROLE', 2);
        }

        // --- REGRA 3: EVENTOS ACADÊMICOS (AGENDA) ---
        // Alvos: Todos (ALL) se houver suspensão de aula amanhã
        $sqlEvents = "SELECT title, org_id FROM organization.events WHERE event_date = :amanha AND is_academic_blocker = TRUE AND deleted IS FALSE";

        $stmtE = $conect->prepare($sqlEvents);
        $stmtE->execute(['amanha' => $amanha]);
        $bloqueios = $stmtE->fetchAll(PDO::FETCH_ASSOC);

        foreach ($bloqueios as $ev) {
            $msg = "Amanhã não haverá aula devido ao evento: {$ev['title']}.";
            createSystemNotification($ev['org_id'], "Suspensão de Aulas", $msg, 'WARNING', 'ALL');
        }
    } catch (Exception $e) {
        // Grava no log do servidor sem interromper a tela do usuário
        error_log("Erro no Cron de Notificações: " . $e->getMessage());
    }
}

// Execução imediata ao incluir o arquivo
runDailyNotificationCheck();
