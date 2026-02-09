<?php

// =========================================================
// DIÁRIO DE CLASSE (MODEL V5.4 - FIX EVENT COLUMNS)
// =========================================================

/**
 * 1. Lista as turmas disponíveis para o usuário logado
 */
function getTeacherClassesF($userId, $roleLevel, $yearId = null)
{
    try {
        $conect = $GLOBALS["local"];
        $yearFilter = "";
        $params = [];

        if (!empty($yearId)) {
            $yearFilter = "AND c.academic_year_id = :yid";
            $params['yid'] = $yearId;
        } else {
            $yearFilter = "AND ay.is_active IS TRUE";
        }

        $superUsers = ['ADMIN', 'MANAGER', 'SECRETARY', 'DEV', 'STAFF', 'ROOT', 'PAROCO', 'COORD'];

        if (in_array(strtoupper($roleLevel), $superUsers)) {
            // VISÃO GERAL
            $sql = "SELECT c.class_id, c.name as class_name, co.name as course_name, ay.name as year_name, l.name as location_name
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
                    LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                    WHERE c.deleted IS FALSE AND c.status = 'ACTIVE' $yearFilter
                    ORDER BY c.name ASC";
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
        } else {
            // VISÃO PROFESSOR
            $stmtP = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid");
            $stmtP->execute(['uid' => $userId]);
            $personId = $stmtP->fetchColumn();

            if (!$personId) return success("Nenhuma turma encontrada.", []);

            $params['pid'] = $personId;
            $sql = "SELECT DISTINCT c.class_id, c.name as class_name, co.name as course_name, ay.name as year_name, l.name as location_name
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
                    LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                    LEFT JOIN education.class_schedules cs ON c.class_id = cs.class_id
                    WHERE c.deleted IS FALSE AND c.status = 'ACTIVE' $yearFilter
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

/**
 * 2. Lista as disciplinas da turma
 */
function getClassSubjectsF($classId)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT s.subject_id, s.name as subject_name, cur.workload_hours
                FROM education.classes c
                JOIN education.curriculum cur ON c.course_id = cur.course_id
                JOIN education.subjects s ON cur.subject_id = s.subject_id
                WHERE c.class_id = :cid AND s.deleted IS FALSE
                ORDER BY s.name ASC";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $classId]);
        return success("Disciplinas carregadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassSubjectsF", "sql", $e->getMessage(), ['class_id' => $classId]);
        return failure("Erro ao carregar disciplinas.");
    }
}

/**
 * 3. SMART LOGIC: Metadados (Grade Horária e Limites)
 */
function getDiarioMetadataF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];
        $subjectId = (int)$data['subject_id'];

        // A. Busca a Grade de Horários
        // Mapeia week_day (DB) -> day_of_week (JS)
        $sqlSched = "SELECT day_of_week, start_time, end_time 
                     FROM education.class_schedules 
                     WHERE class_id = :cid AND subject_id = :sid AND is_active IS TRUE";
        $stmt = $conect->prepare($sqlSched);
        $stmt->execute(['cid' => $classId, 'sid' => $subjectId]);
        $schedules = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // B. Limites do Ano Letivo
        $sqlYear = "SELECT ay.start_date, ay.end_date 
                    FROM education.classes c 
                    JOIN education.academic_years ay ON ay.year_id = c.academic_year_id 
                    WHERE c.class_id = :cid LIMIT 1";
        $stmtY = $conect->prepare($sqlYear);
        $stmtY->execute(['cid' => $classId]);
        $limits = $stmtY->fetch(PDO::FETCH_ASSOC);

        $minDate = $limits['start_date'] ?? date('Y-01-01');
        $maxDate = $limits['end_date'] ?? date('Y-12-31');

        return success("Configurações carregadas.", [
            'schedules' => $schedules,
            'min_date' => $minDate,
            'max_date' => $maxDate
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getDiarioMetadataF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar configurações.");
    }
}

/**
 * 4. SMART LOGIC: Verifica Data (Com Hora), Feriados e Plano
 */
function checkDateContentF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = $data['class_id'];
        $subjectId = $data['subject_id'];
        $dateTime = $data['date']; // TIMESTAMP (YYYY-MM-DD HH:MM)

        $dateOnly = substr($dateTime, 0, 10);
        $orgId = 1;

        // [CORREÇÃO AQUI]: Ajustado para as colunas reais da tabela organization.events
        // title (não name), event_date (não start/end), is_academic_blocker (não is_blocking)
        $sqlEvent = "SELECT title FROM organization.events 
                     WHERE org_id = :oid 
                       AND event_date = :dt 
                       AND is_academic_blocker IS TRUE 
                       AND deleted IS FALSE 
                     LIMIT 1";

        $stmtEv = $conect->prepare($sqlEvent);
        $stmtEv->execute(['oid' => $orgId, 'dt' => $dateOnly]);
        $event = $stmtEv->fetch(PDO::FETCH_ASSOC);

        if ($event) {
            return success("Data bloqueada.", ['status' => 'BLOCKED', 'reason' => $event['title']]);
        }

        // B. Verifica se já existe aula (Edição)
        $sqlSession = "SELECT session_id, description, content_type, session_date FROM education.class_sessions 
                       WHERE class_id = :cid AND subject_id = :sid AND session_date = :dt AND deleted IS FALSE";
        $stmtSess = $conect->prepare($sqlSession);
        $stmtSess->execute(['cid' => $classId, 'sid' => $subjectId, 'dt' => $dateTime]);
        $existing = $stmtSess->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // Busca Frequência
            $sqlAtt = "SELECT student_id, is_present, justification FROM education.attendance WHERE session_id = :sid";
            $stmtAtt = $conect->prepare($sqlAtt);
            $stmtAtt->execute(['sid' => $existing['session_id']]);
            $attendance = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($attendance as &$att) {
                $att['is_present'] = ($att['is_present'] === true || $att['is_present'] === 't');
            }

            return success("Aula existente.", [
                'status' => 'EXISTING',
                'session_id' => $existing['session_id'],
                'content' => $existing['description'],
                'attendance' => $attendance
            ]);
        }

        // C. Nova Aula: Busca Próximo Plano
        $sqlCount = "SELECT COUNT(*) FROM education.class_sessions 
                     WHERE class_id = :cid AND subject_id = :sid AND session_date < :dt AND deleted IS FALSE";
        $stmtCount = $conect->prepare($sqlCount);
        $stmtCount->execute(['cid' => $classId, 'sid' => $subjectId, 'dt' => $dateTime]);
        $prevCount = $stmtCount->fetchColumn();

        $meetingNum = $prevCount + 1;

        $sqlPlan = "SELECT cp.content 
                    FROM education.curriculum_plans cp
                    JOIN education.curriculum cur ON cp.curriculum_id = cur.curriculum_id
                    JOIN education.classes c ON c.course_id = cur.course_id
                    WHERE c.class_id = :cid AND cur.subject_id = :sid AND cp.meeting_number = :num AND cp.deleted IS FALSE
                    LIMIT 1";
        $stmtPlan = $conect->prepare($sqlPlan);
        $stmtPlan->execute(['cid' => $classId, 'sid' => $subjectId, 'num' => $meetingNum]);
        $template = $stmtPlan->fetchColumn();

        return success("Nova aula.", [
            'status' => 'NEW',
            'sequence' => $meetingNum,
            'template' => $template ?: ''
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "checkDateContentF", "sql", $e->getMessage(), $data);
        return failure("Erro na verificação de conteúdo.");
    }
}

/**
 * 5. Lista Alunos para o Diário
 */
function getStudentsForDiaryF($classId)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT e.student_id, p.full_name, p.profile_photo_url 
                FROM education.enrollments e
                JOIN people.persons p ON p.person_id = e.student_id
                WHERE e.class_id = :cid AND e.status = 'ACTIVE' AND e.deleted IS FALSE
                ORDER BY p.full_name ASC";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $classId]);
        return success("Alunos listados", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getStudentsForDiaryF", "sql", $e->getMessage(), ['class_id' => $classId]);
        return failure("Erro ao buscar alunos.");
    }
}

/**
 * 6. Salvar Diário
 */
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
        $subjectId = $data['subject_id'];
        $dateTime = $data['date'];
        $content = $data['content'];

        if (empty($sessionId)) {
            $check = $conect->prepare("SELECT session_id FROM education.class_sessions WHERE class_id = :c AND subject_id = :s AND session_date = :d AND deleted IS FALSE");
            $check->execute(['c' => $classId, 's' => $subjectId, 'd' => $dateTime]);
            if ($check->rowCount() > 0) {
                $conect->rollBack();
                return failure("Já existe uma aula neste horário exato.");
            }

            $sqlIns = "INSERT INTO education.class_sessions (class_id, subject_id, session_date, description, content_type, signed_by_user_id, signed_at) 
                       VALUES (:cid, :sid, :dt, :desc, 'DOCTRINAL', :uid, CURRENT_TIMESTAMP) RETURNING session_id";
            $stmt = $conect->prepare($sqlIns);
            $stmt->execute(['cid' => $classId, 'sid' => $subjectId, 'dt' => $dateTime, 'desc' => $content, 'uid' => $data['user_id']]);
            $sessionId = $stmt->fetchColumn();
        } else {
            $sqlUpd = "UPDATE education.class_sessions SET description = :desc, session_date = :dt, updated_at = CURRENT_TIMESTAMP WHERE session_id = :id";
            $conect->prepare($sqlUpd)->execute(['desc' => $content, 'dt' => $dateTime, 'id' => $sessionId]);
        }

        $attendanceList = json_decode($data['attendance_json'], true);
        if (is_array($attendanceList)) {
            $sqlAtt = "INSERT INTO education.attendance (session_id, student_id, is_present, justification, updated_at) 
                       VALUES (:sess, :stud, :pres, :just, CURRENT_TIMESTAMP)
                       ON CONFLICT (session_id, student_id) 
                       DO UPDATE SET is_present = EXCLUDED.is_present, justification = EXCLUDED.justification, updated_at = CURRENT_TIMESTAMP";
            $stmtAtt = $conect->prepare($sqlAtt);

            foreach ($attendanceList as $att) {
                $stmtAtt->execute([
                    'sess' => $sessionId,
                    'stud' => $att['student_id'],
                    'pres' => ($att['present'] === 'true' || $att['present'] === true) ? 'TRUE' : 'FALSE',
                    'just' => $att['justification'] ?? null
                ]);
            }
        }

        $conect->commit();
        return success("Diário salvo com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "diario", "saveClassSessionF", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar diário.");
    }
}

/**
 * 7. Histórico Simplificado
 */
function getClassHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $params = [
            'cid' => $data['class_id'],
            'sid' => $data['subject_id'],
            'limit' => (int)$data['limit'],
            'offset' => (int)$data['page']
        ];

        $sql = "SELECT 
                    COUNT(*) OVER() as total_registros,
                    sess.session_id,
                    to_char(sess.session_date, 'YYYY-MM-DD HH24:MI') as session_date, 
                    sess.description, 
                    (SELECT COUNT(*) FROM education.attendance a WHERE a.session_id = sess.session_id AND a.is_present IS TRUE) as present_count,
                    (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = sess.class_id AND e.status = 'ACTIVE') as total_students
                FROM education.class_sessions sess
                WHERE sess.class_id = :cid AND sess.subject_id = :sid AND sess.deleted IS FALSE
                ORDER BY sess.session_date DESC
                LIMIT :limit OFFSET :offset";
        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Histórico carregado.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar histórico.");
    }
}

/**
 * 8. Excluir Aula
 */
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
