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
            $yearFilter = "AND c.academic_year_id = :yid";
            $params['yid'] = $yearId;
        } else {
            // Se não vier ano, pega os ativos (fallback)
            $yearFilter = "AND ay.is_active IS TRUE";
        }

        $superUsers = ['ADMIN', 'MANAGER', 'SECRETARY', 'DEV', 'STAFF', 'ROOT', 'PAROCO', 'COORD'];

        if (in_array(strtoupper($roleLevel), $superUsers)) {
            // ADMIN: Vê todas as turmas da Org e Ano
            $sql = "SELECT c.class_id, c.name as class_name, co.name as course_name, ay.name as year_name, l.name as location_name
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
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
                    JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
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

function getDiarioMetadataF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];
        $subjectId = (int)$data['subject_id'];

        // 1. Busca Dados da Turma (Org e Datas Limites)
        $sqlClass = "SELECT c.org_id, ay.start_date, ay.end_date 
                     FROM education.classes c
                     JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
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
        // [CORREÇÃO] Removido o ID fixo. Usa o ID obtido da turma ($classData['org_id'])
        if ($orgId && $minDate && $maxDate) {
            $sqlHol = "SELECT to_char(event_date, 'YYYY-MM-DD') as date, title 
                       FROM organization.events 
                       WHERE org_id = :oid 
                         AND event_date BETWEEN :start AND :end 
                         AND deleted IS FALSE";
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
                     WHERE class_id = :cid AND subject_id = :sid AND deleted IS FALSE";
        $stmtExist = $conect->prepare($sqlExist);
        $stmtExist->execute(['cid' => $classId, 'sid' => $subjectId]);
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
        $subjectId = $data['subject_id'];
        $dateTime = $data['date'];
        $dateOnly = substr($dateTime, 0, 10);

        // 1. Busca o ID da Organização da Turma
        $stmtOrg = $conect->prepare("SELECT org_id FROM education.classes WHERE class_id = :cid");
        $stmtOrg->execute(['cid' => $classId]);
        $orgId = $stmtOrg->fetchColumn();

        if (!$orgId) return failure("Erro: Turma sem organização vinculada.");

        // A. Verifica Feriados
        $sqlEvent = "SELECT title FROM organization.events 
                     WHERE org_id = :oid AND event_date = :dt AND is_academic_blocker IS TRUE AND deleted IS FALSE LIMIT 1";
        $stmtEv = $conect->prepare($sqlEvent);
        $stmtEv->execute(['oid' => $orgId, 'dt' => $dateOnly]);
        $event = $stmtEv->fetch(PDO::FETCH_ASSOC);

        if ($event) {
            return success("Data bloqueada.", ['status' => 'BLOCKED', 'reason' => $event['title']]);
        }

        // B. Verifica Aula Existente
        $sqlSession = "SELECT session_id, description, content_type, session_date FROM education.class_sessions 
                       WHERE class_id = :cid AND subject_id = :sid AND session_date = :dt AND deleted IS FALSE";
        $stmtSess = $conect->prepare($sqlSession);
        $stmtSess->execute(['cid' => $classId, 'sid' => $subjectId, 'dt' => $dateTime]);
        $existing = $stmtSess->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
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

        // C. Nova Aula
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
        return failure("Erro na verificação.");
    }
}
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
        $date = $data['date'];
        $content = $data['content'];

        if (empty($sessionId)) {
            $check = $conect->prepare("SELECT session_id FROM education.class_sessions WHERE class_id = :c AND subject_id = :s AND session_date = :d AND deleted IS FALSE");
            $check->execute(['c' => $classId, 's' => $subjectId, 'd' => $date]);
            if ($check->rowCount() > 0) {
                $conect->rollBack();
                return failure("Já existe uma aula nesta data.");
            }

            $sqlIns = "INSERT INTO education.class_sessions (class_id, subject_id, session_date, description, content_type, signed_by_user_id, signed_at) 
                       VALUES (:cid, :sid, :dt, :desc, 'DOCTRINAL', :uid, CURRENT_TIMESTAMP) RETURNING session_id";
            $stmt = $conect->prepare($sqlIns);
            $stmt->execute(['cid' => $classId, 'sid' => $subjectId, 'dt' => $date, 'desc' => $content, 'uid' => $data['user_id']]);
            $sessionId = $stmt->fetchColumn();
        } else {
            $sqlUpd = "UPDATE education.class_sessions SET description = :desc, session_date = :dt, updated_at = CURRENT_TIMESTAMP WHERE session_id = :id";
            $conect->prepare($sqlUpd)->execute(['desc' => $content, 'dt' => $date, 'id' => $sessionId]);
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
                    'pres' => ($att['is_present'] === 'true' || $att['is_present'] === true) ? 'TRUE' : 'FALSE',
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
