<?php

function getTeacherClassesF($userId, $roleLevel, $yearId, $orgId)
{
    try {
        $conect = $GLOBALS["local"];
        $yearFilter = "";

        // Parâmetros base obrigatórios
        $params = [
            'oid' => $orgId
        ];

        // Filtro de Ano (Opcional ou Obrigatório dependendo do fluxo)
        if (!empty($yearId)) {
            $yearFilter = "AND c.year_id = :yid";
            $params['yid'] = $yearId;
        } else {
            // Se não vier ano, pega os ativos (fallback)
            $yearFilter = "AND ay.is_active IS TRUE";
        }

        $superUsers = [/*'ADMIN', 'MANAGER', 'SECRETARY', */'DEV' /*, 'STAFF', 'ROOT', 'PAROCO', 'COORD' */];

        if (in_array(strtoupper($roleLevel), $superUsers)) {
            // ADMIN: Vê todas as turmas da Org e Ano
            $sql = "SELECT c.class_id, c.name as class_name, co.name as course_name, ay.name as year_name, l.name as location_name
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.year_id = ay.year_id
                    LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                    WHERE c.deleted IS FALSE 
                    AND c.status = 'ACTIVE' 
                    AND c.org_id = :oid 
                    $yearFilter
                    ORDER BY c.name ASC";

            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
        } else {
            // PROFESSOR: Vê turmas onde está vinculado na Org e Ano
            $stmtP = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid");
            $stmtP->execute(['uid' => $userId]);
            $personId = $stmtP->fetchColumn();

            if (!$personId) return success("Nenhuma turma encontrada.", []);

            $params['pid'] = $personId;

            $sql = "SELECT DISTINCT c.class_id, c.name as class_name, co.name as course_name, ay.name as year_name, l.name as location_name
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.year_id = ay.year_id
                    LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                    LEFT JOIN education.class_schedules cs ON c.class_id = cs.class_id
                    WHERE c.deleted IS FALSE 
                    AND c.status = 'ACTIVE' 
                    AND c.org_id = :oid
                    $yearFilter
                    AND (c.coordinator_id = :pid OR c.class_assistant_id = :pid OR cs.instructor_id = :pid)
                    ORDER BY c.name ASC";

            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
        }

        return success("Turmas carregadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getTeacherClassesF", "sql", $e->getMessage(), ['user_id' => $userId]);
        return success("Erro ao listar.", []);
    }
}

function getClassPhasesF($classId)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT p.phase_id, p.name as phase_name, cur.workload_hours
                FROM education.classes c
                JOIN education.curriculum cur ON c.course_id = cur.course_id
                JOIN education.phases p ON cur.phase_id = p.phase_id
                WHERE c.class_id = :cid AND p.deleted IS FALSE
                ORDER BY p.name ASC";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $classId]);
        return success("Fases carregadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassPhasesF", "sql", $e->getMessage(), ['class_id' => $classId]);
        return failure("Erro ao carregar fases.");
    }
}

function getDiarioMetadataF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];
        $phaseId = (int)$data['phase_id'];

        // 1. Busca Dados da Turma (Org e Datas Limites)
        $sqlClass = "SELECT c.org_id, ay.start_date, ay.end_date 
                     FROM education.classes c
                     JOIN education.academic_years ay ON c.year_id = ay.year_id
                     WHERE c.class_id = :cid LIMIT 1";
        $stmtClass = $conect->prepare($sqlClass);
        $stmtClass->execute(['cid' => $classId]);
        $classData = $stmtClass->fetch(PDO::FETCH_ASSOC);

        if (!$classData) return failure("Dados da turma não encontrados.");

        $orgId = $classData['org_id'];
        $minDate = $classData['start_date'];
        $maxDate = $classData['end_date'];

        // 2. Busca Grade Horária
        $sqlSched = "SELECT day_of_week, start_time, end_time 
                     FROM education.class_schedules 
                     WHERE class_id = :cid AND is_active IS TRUE";
        $stmtSched = $conect->prepare($sqlSched);
        $stmtSched->execute(['cid' => $classId]);
        $rawSchedules = $stmtSched->fetchAll(PDO::FETCH_ASSOC);

        $schedules = [];
        $validDates = [];

        if (!empty($rawSchedules)) {
            // Formata Grade
            $schedules = array_map(function ($row) {
                return [
                    'day_of_week' => $row['day_of_week'],
                    'start_time' => $row['start_time'],
                    'end_time' => $row['end_time']
                ];
            }, $rawSchedules);

            // GERA AS DATAS VÁLIDAS (Generate Series)
            $daysOfWeek = array_column($rawSchedules, 'day_of_week');
            $dowString = implode(',', array_unique($daysOfWeek));

            if (!empty($dowString) && $minDate && $maxDate) {
                $sqlGen = "SELECT DISTINCT to_char(serie.data, 'YYYY-MM-DD') as valid_date
                           FROM generate_series(:start::date, :end::date, '1 day'::interval) AS serie(data)
                           WHERE EXTRACT(DOW FROM serie.data) IN ($dowString)
                           ORDER BY 1";
                $stmtGen = $conect->prepare($sqlGen);
                $stmtGen->execute(['start' => $minDate, 'end' => $maxDate]);
                $validDates = $stmtGen->fetchAll(PDO::FETCH_COLUMN);
            }
        }

        // 3. Busca Feriados (Da Organização da Turma)
        $holidays = [];
        if ($orgId && $minDate && $maxDate) {
            $sqlHol = "SELECT to_char(event_date, 'YYYY-MM-DD') as date, title 
                       FROM organization.events 
                       WHERE org_id = :oid 
                         AND event_date BETWEEN :start AND :end 
                         AND deleted IS FALSE
                         AND is_academic_blocker IS TRUE";
            $stmtHol = $conect->prepare($sqlHol);
            $stmtHol->execute(['oid' => $orgId, 'start' => $minDate, 'end' => $maxDate]);
            while ($row = $stmtHol->fetch(PDO::FETCH_ASSOC)) {
                $holidays[$row['date']] = $row['title'];
            }
        }

        // 4. Busca Registros Existentes (Diários já lançados)
        $existingDates = [];
        $sqlExist = "SELECT to_char(session_date, 'YYYY-MM-DD') as date 
                     FROM education.class_sessions 
                     WHERE class_id = :cid AND phase_id = :pid AND deleted IS FALSE";
        $stmtExist = $conect->prepare($sqlExist);
        $stmtExist->execute(['cid' => $classId, 'pid' => $phaseId]);
        $existingDates = $stmtExist->fetchAll(PDO::FETCH_COLUMN);

        return success("Configurações carregadas.", [
            'schedules' => $schedules,
            'valid_dates' => $validDates,
            'existing_dates' => $existingDates,
            'holidays' => $holidays,
            'min_date' => $minDate ?? date('Y-01-01'),
            'max_date' => $maxDate ?? date('Y-12-31')
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getDiarioMetadataF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar configurações.");
    }
}

function checkDateContentF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = $data['class_id'];
        $phaseId = $data['phase_id'];
        $dateTime = $data['date'];
        $dateOnly = substr($dateTime, 0, 10);
        $userId = isset($data['user_id']) ? $data['user_id'] : (function_exists('getAuthUserId') ? getAuthUserId() : null);

        // 1. Busca o ID da Organização da Turma
        $stmtOrg = $conect->prepare("SELECT org_id FROM education.classes WHERE class_id = :cid");
        $stmtOrg->execute(['cid' => $classId]);
        $orgId = $stmtOrg->fetchColumn();

        if (!$orgId) return failure("Erro: Turma sem organização vinculada.");

        // A. Verifica Feriados
        $sqlEvent = "SELECT title FROM organization.events 
                     WHERE org_id = :oid AND CAST(event_date AS DATE) = CAST(:dt AS DATE) AND is_academic_blocker IS TRUE AND deleted IS FALSE LIMIT 1";
        $stmtEv = $conect->prepare($sqlEvent);
        $stmtEv->execute(['oid' => $orgId, 'dt' => $dateOnly]);
        $event = $stmtEv->fetch(PDO::FETCH_ASSOC);

        if ($event) {
            return success("Data bloqueada.", ['status' => 'BLOCKED', 'reason' => $event['title']]);
        }

        // B. Verifica Aulas Existentes e Cria a Cronologia Global deste Professor
        $sqlAll = "SELECT session_id, session_date, description, content_type 
                   FROM education.class_sessions 
                   WHERE class_id = :cid AND phase_id = :pid AND signed_by_user_id = :uid AND deleted IS FALSE 
                   ORDER BY session_date ASC, session_id ASC";
        $stmtAll = $conect->prepare($sqlAll);
        $stmtAll->execute(['cid' => $classId, 'pid' => $phaseId, 'uid' => $userId]);
        $allSessions = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

        $existingSessions = [];
        $seq = 1;
        foreach ($allSessions as $sess) {
            $sessDateOnly = substr($sess['session_date'], 0, 10);
            if ($sessDateOnly === $dateOnly) {
                $sess['sequence'] = $seq;
                $existingSessions[] = $sess;
            }
            $seq++;
        }
        $next_sequence = count($allSessions) + 1;

        // Se houver sessões para esta data, busca presenças de cada uma
        if (count($existingSessions) > 0) {
            foreach ($existingSessions as &$sess) {
                $sqlAtt = "SELECT student_id, is_present, justification, absence_type FROM education.attendance WHERE session_id = :sid";
                $stmtAtt = $conect->prepare($sqlAtt);
                $stmtAtt->execute(['sid' => $sess['session_id']]);
                $attendance = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

                foreach ($attendance as &$att) {
                    $att['is_present'] = ($att['is_present'] === true || $att['is_present'] === 't');
                }
                $sess['attendance'] = $attendance;
            }
        }

        // C. Prepara Títulos baseados nos Planos de Aula (education.curriculum_plans)
        $sqlPlans = "SELECT cp.meeting_number, cp.title, cp.content 
                    FROM education.curriculum_plans cp
                    JOIN education.curriculum cur ON cp.curriculum_id = cur.curriculum_id
                    JOIN education.classes c ON c.course_id = cur.course_id
                    WHERE c.class_id = :cid AND cur.phase_id = :pid AND cp.deleted IS FALSE
                    ORDER BY cp.meeting_number ASC";
        $stmtPlans = $conect->prepare($sqlPlans);
        $stmtPlans->execute(['cid' => $classId, 'pid' => $phaseId]);
        $plansList = $stmtPlans->fetchAll(PDO::FETCH_ASSOC);

        $plans = [];
        foreach ($plansList as $p) {
            $plans[$p['meeting_number']] = $p;
        }

        // Vincula Título para sessões existentes desta data
        if (count($existingSessions) > 0) {
            foreach ($existingSessions as &$sess) {
                $s_seq = $sess['sequence'];
                $sess['title'] = isset($plans[$s_seq]) ? $plans[$s_seq]['title'] : "Encontro $s_seq";
            }
        }

        // Prever as próximas opções
        $newOptions = [];
        for ($i = 0; $i < 5; $i++) {
            $n_seq = $next_sequence + $i;
            if (isset($plans[$n_seq])) {
                $newOptions[] = [
                    'sequence' => $n_seq,
                    'title' => $plans[$n_seq]['title'],
                    'content' => $plans[$n_seq]['content']
                ];
            } else {
                $newOptions[] = [
                    'sequence' => $n_seq,
                    'title' => "Encontro $n_seq (Novo)",
                    'content' => ''
                ];
            }
        }

        return success("Verificação concluída.", [
            'status' => 'OK',
            'sessions' => $existingSessions,
            'new_options' => $newOptions
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "checkDateContentF", "sql", $e->getMessage(), $data);
        return failure("Erro na verificação.");
    }
}

function getStudentsForDiaryF($data)
{

    try {
        $conect = $GLOBALS["local"];
        $classId = $data['class_id'];

        // Pega a data da sessão. Se não houver, assume a data atual.
        $date = !empty($data['date']) ? $data['date'] : date('Y-m-d');

        // Filtro de data: A matrícula deve ter sido criada ATÉ o dia da sessão da aula
        $sql = "SELECT e.student_id, p.full_name, p.profile_photo_url 
                FROM education.enrollments e
                JOIN people.persons p ON p.person_id = e.student_id
                WHERE e.class_id = :cid AND e.status = 'ACTIVE' AND e.deleted IS FALSE
                AND e.enrollment_date::date <= :dt
                ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute([
            'cid' => $classId,
            'dt'  => $date
        ]);
        $dados = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return success("Catequizandos listados", $dados);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getStudentsForDiaryF", "sql", $e->getMessage(), ['class_id' => $classId]);
        return failure("Erro ao buscar catequizandos.");
    }
}

function saveClassSessionF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sessionId = !empty($data['session_id']) ? (int)$data['session_id'] : null;
        $classId = $data['class_id'];
        $phaseId = $data['phase_id'];
        $date = $data['date'];
        $content = $data['content'];

        if (empty($sessionId)) {
            // Removida a trava que impedia gravar mais de uma vez na mesma data
            $sqlIns = "INSERT INTO education.class_sessions (class_id, phase_id, session_date, description, content_type, signed_by_user_id, signed_at) 
                       VALUES (:cid, :pid, :dt, :desc, 'DOCTRINAL', :uid, CURRENT_TIMESTAMP) RETURNING session_id";
            $stmt = $conect->prepare($sqlIns);
            $stmt->execute(['cid' => $classId, 'pid' => $phaseId, 'dt' => $date, 'desc' => $content, 'uid' => $data['user_id']]);
            $sessionId = $stmt->fetchColumn();
        } else {
            $sqlUpd = "UPDATE education.class_sessions SET description = :desc, session_date = :dt, updated_at = CURRENT_TIMESTAMP WHERE session_id = :id";
            $conect->prepare($sqlUpd)->execute(['desc' => $content, 'dt' => $date, 'id' => $sessionId]);
        }

        $attendanceList = json_decode($data['attendance_json'], true);

        // NOVA REGRA DE NEGÓCIO: Só salva se tiver alunos na lista
        if (!is_array($attendanceList) || count($attendanceList) === 0) {
            $conect->rollBack();
            return failure("Não é possível registrar o encontro: A turma não possui estudantes ativos nesta data.");
        }

        $sqlAtt = "INSERT INTO education.attendance (session_id, student_id, is_present, justification, absence_type, updated_at) 
                   VALUES (:sess, :stud, :pres, :just, :abtype, CURRENT_TIMESTAMP)
                   ON CONFLICT (session_id, student_id) 
                   DO UPDATE SET is_present = EXCLUDED.is_present, justification = EXCLUDED.justification, absence_type = EXCLUDED.absence_type, updated_at = CURRENT_TIMESTAMP";
        $stmtAtt = $conect->prepare($sqlAtt);

        foreach ($attendanceList as $att) {
            $stmtAtt->execute([
                'sess' => $sessionId,
                'stud' => $att['student_id'],
                'pres' => ($att['is_present'] === 'true' || $att['is_present'] === true) ? 'TRUE' : 'FALSE',
                'just' => $att['justification'] ?? null,
                'abtype' => $att['absence_type'] ?? 'UNJUSTIFIED'
            ]);
        }

        $conect->commit();
        return success("Diário salvo com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "diario", "saveClassSessionF", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar diário.");
    }
}

function getClassHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $userId = isset($data['user_id']) ? $data['user_id'] : (function_exists('getAuthUserId') ? getAuthUserId() : null);

        // Define e Mapeia Sequência Cronológica Absoluta do Professor
        $sqlAll = "SELECT session_id FROM education.class_sessions 
                   WHERE class_id = :cid AND phase_id = :pid AND signed_by_user_id = :uid AND deleted IS FALSE 
                   ORDER BY session_date ASC, session_id ASC";
        $stmtAll = $conect->prepare($sqlAll);
        $stmtAll->execute(['cid' => $data['class_id'], 'pid' => $data['phase_id'], 'uid' => $userId]);
        $allSessions = $stmtAll->fetchAll(PDO::FETCH_COLUMN);

        $sessionSequence = [];
        $seq = 1;
        foreach ($allSessions as $sid) {
            $sessionSequence[$sid] = $seq++;
        }

        // Resgata Planos de Aula (Currículo)
        $sqlPlans = "SELECT cp.meeting_number, cp.title 
                    FROM education.curriculum_plans cp
                    JOIN education.curriculum cur ON cp.curriculum_id = cur.curriculum_id
                    JOIN education.classes c ON c.course_id = cur.course_id
                    WHERE c.class_id = :cid AND cur.phase_id = :pid AND cp.deleted IS FALSE";
        $stmtPlans = $conect->prepare($sqlPlans);
        $stmtPlans->execute(['cid' => $data['class_id'], 'pid' => $data['phase_id']]);
        $plansList = $stmtPlans->fetchAll(PDO::FETCH_ASSOC);

        $plans = [];
        foreach ($plansList as $p) {
            $plans[$p['meeting_number']] = $p['title'];
        }

        $params = [
            'cid' => $data['class_id'],
            'pid' => $data['phase_id'],
            'uid' => $userId,
            'limit' => (int)$data['limit'],
            'offset' => (int)$data['page']
        ];

        // Consulta filtrada e ordenada para a listagem
        $sql = "SELECT 
                    COUNT(*) OVER() as total_registros,
                    sess.session_id,
                    to_char(sess.session_date, 'YYYY-MM-DD HH24:MI') as session_date, 
                    sess.description, 
                    (SELECT COUNT(*) FROM education.attendance a WHERE a.session_id = sess.session_id AND a.is_present IS TRUE) as present_count,
                    (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = sess.class_id AND e.status = 'ACTIVE') as total_students
                FROM education.class_sessions sess
                WHERE sess.class_id = :cid AND sess.phase_id = :pid AND sess.signed_by_user_id = :uid AND sess.deleted IS FALSE
                ORDER BY sess.session_date DESC, sess.session_id DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Aplica o título correto baseado na sequência da aula daquele professor
        foreach ($history as &$h) {
            $s_seq = $sessionSequence[$h['session_id']] ?? 0;
            $h['title'] = isset($plans[$s_seq]) ? $plans[$s_seq] : "Encontro $s_seq";
        }

        return success("Histórico carregado.", $history);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar histórico.");
    }
}

function deleteClassSessionF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE education.class_sessions SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE session_id = :sid";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['sid' => $data['session_id']]);

        $conect->commit();
        return success("Aula removida.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "diario", "deleteClassSessionF", "sql", $e->getMessage(), $data);
        return failure("Erro ao excluir.");
    }
}
