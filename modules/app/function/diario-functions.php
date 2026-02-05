<?php

// =========================================================
// DIÁRIO DE CLASSE (MODEL V3) - HISTÓRICO E DISCIPLINAS
// =========================================================

/**
 * 1. Lista as turmas disponíveis para o usuário logado
 * Regra: Filtra pelo Ano Letivo selecionado no Menu Global
 */
function getTeacherClassesF($userId, $roleLevel, $yearId = null)
{
    try {
        $conect = $GLOBALS["local"];

        // Configura Filtro de Ano
        $yearFilter = "";
        $params = [];

        if (!empty($yearId)) {
            $yearFilter = "AND c.academic_year_id = :yid";
            $params['yid'] = $yearId;
        } else {
            $yearFilter = "AND ay.is_active IS TRUE";
        }

        // LISTA DE PERMISSÃO TOTAL (Expandida)
        // Se seu usuário for 'ROOT' ou 'COORD', ele agora vê tudo.
        $superUsers = ['ADMIN', 'MANAGER', 'SECRETARY', 'DEV', 'STAFF', 'ROOT', 'PAROCO', 'COORD'];

        if (in_array(strtoupper($roleLevel), $superUsers)) {
            // ===================================
            // MODO VISÃO GERAL (Vê tudo)
            // ===================================
            $sql = "
                SELECT 
                    c.class_id, 
                    c.name as class_name, 
                    co.name as course_name,
                    ay.name as year_name,
                    l.name as location_name
                FROM education.classes c
                JOIN education.courses co ON c.course_id = co.course_id
                JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
                LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                WHERE c.deleted IS FALSE 
                  AND c.status = 'ACTIVE' 
                  $yearFilter
                ORDER BY c.name ASC
            ";
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
        } else {
            // ===================================
            // MODO PROFESSOR (Vê apenas suas turmas)
            // ===================================

            $stmtP = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid");
            $stmtP->execute(['uid' => $userId]);
            $personId = $stmtP->fetchColumn();

            // CORREÇÃO: Se não tiver person_id, retorna vazio em vez de erro fatal
            // Isso permite que o sistema carregue (mesmo que vazio) sem travar a tela
            if (!$personId) {
                return success("Usuário sem vínculo de pessoa (Nenhuma turma encontrada).", []);
            }

            $params['pid'] = $personId;

            $sql = "
                SELECT DISTINCT
                    c.class_id, 
                    c.name as class_name, 
                    co.name as course_name,
                    ay.name as year_name,
                    l.name as location_name
                FROM education.classes c
                JOIN education.courses co ON c.course_id = co.course_id
                JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
                LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                LEFT JOIN education.class_schedules cs ON c.class_id = cs.class_id
                WHERE c.deleted IS FALSE 
                  AND c.status = 'ACTIVE' 
                  $yearFilter
                  AND (
                      c.coordinator_id = :pid 
                      OR c.class_assistant_id = :pid
                      OR cs.instructor_id = :pid
                  )
                ORDER BY c.name ASC
            ";
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
        }

        return success("Turmas carregadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getTeacherClassesF", "sql", $e->getMessage(), ['user_id' => $userId]);
        // Retorna array vazio em caso de erro SQL para não quebrar o selectize
        return success("Erro ao listar.", []);
    }
}

/**
 * 2. Lista as disciplinas vinculadas à turma
 */
function getClassSubjectsF($classId)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = "
            SELECT 
                s.subject_id,
                s.name as subject_name,
                cur.workload_hours
            FROM education.classes c
            JOIN education.curriculum cur ON c.course_id = cur.course_id
            JOIN education.subjects s ON cur.subject_id = s.subject_id
            WHERE c.class_id = :cid 
              AND s.deleted IS FALSE
            ORDER BY s.name ASC
        ";

        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $classId]);

        return success("Disciplinas carregadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        return failure("Erro ao carregar disciplinas.");
    }
}

/**
 * 3. Busca o histórico de aulas
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

        $sql = "
            SELECT 
                COUNT(*) OVER() as total_registros,
                sess.session_id,
                sess.session_date,
                sess.description,
                sess.content_type,
                (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = sess.class_id AND e.status = 'ACTIVE') as total_students,
                (SELECT COUNT(*) FROM education.attendance a WHERE a.session_id = sess.session_id AND a.is_present IS TRUE) as present_count
            FROM education.class_sessions sess
            WHERE sess.class_id = :cid 
              AND sess.subject_id = :sid
              AND sess.deleted IS FALSE
            ORDER BY sess.session_date DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Histórico carregado.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar histórico.");
    }
}

/**
 * 4. Carrega dados para o Modal
 */
function getClassDailyInfoF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];
        $subjectId = (int)$data['subject_id'];
        $sessionId = !empty($data['session_id']) ? (int)$data['session_id'] : null;

        // Ementa
        $sqlInfo = "SELECT s.syllabus_summary FROM education.subjects s WHERE s.subject_id = :sid LIMIT 1";
        $stmtInfo = $conect->prepare($sqlInfo);
        $stmtInfo->execute(['sid' => $subjectId]);
        $info = $stmtInfo->fetch(PDO::FETCH_ASSOC);

        // Sessão
        $session = null;
        if ($sessionId) {
            $stmtSess = $conect->prepare("SELECT * FROM education.class_sessions WHERE session_id = :id AND deleted IS FALSE");
            $stmtSess->execute(['id' => $sessionId]);
            $session = $stmtSess->fetch(PDO::FETCH_ASSOC);
        }

        // Alunos
        if ($sessionId) {
            $sqlStudents = "
                SELECT 
                    p.person_id as student_id,
                    p.full_name,
                    p.profile_photo_url,
                    a.is_present,
                    a.absence_type,
                    a.justification
                FROM education.enrollments e
                JOIN people.persons p ON e.student_id = p.person_id
                LEFT JOIN education.attendance a ON a.student_id = e.student_id AND a.session_id = :sid
                WHERE e.class_id = :cid AND e.status = 'ACTIVE' AND e.deleted IS FALSE
                ORDER BY p.full_name ASC
            ";
            $stmtStd = $conect->prepare($sqlStudents);
            $stmtStd->execute(['cid' => $classId, 'sid' => $sessionId]);
        } else {
            $sqlStudents = "
                SELECT 
                    p.person_id as student_id,
                    p.full_name,
                    p.profile_photo_url,
                    NULL as is_present,
                    NULL as absence_type,
                    NULL as justification
                FROM education.enrollments e
                JOIN people.persons p ON e.student_id = p.person_id
                WHERE e.class_id = :cid AND e.status = 'ACTIVE' AND e.deleted IS FALSE
                ORDER BY p.full_name ASC
            ";
            $stmtStd = $conect->prepare($sqlStudents);
            $stmtStd->execute(['cid' => $classId]);
        }

        $students = $stmtStd->fetchAll(PDO::FETCH_ASSOC);

        return success("Dados carregados.", [
            'info' => $info,
            'session' => $session,
            'students' => $students
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "diario", "getClassDailyInfoF", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar dados.");
    }
}

/**
 * 5. Salva a Aula
 */
function saveClassSessionF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $classId = (int)$data['class_id'];
        $subjectId = (int)$data['subject_id'];
        $sessionId = !empty($data['session_id']) ? (int)$data['session_id'] : null;

        $date = $data['date'];
        $desc = $data['description'];
        $type = $data['content_type'] ?? 'DOCTRINAL';
        $userId = $data['user_id'];

        if ($sessionId) {
            $sqlUp = "UPDATE education.class_sessions 
                      SET session_date = :dt, description = :desc, content_type = :type, updated_at = CURRENT_TIMESTAMP 
                      WHERE session_id = :sid";
            $conect->prepare($sqlUp)->execute(['dt' => $date, 'desc' => $desc, 'type' => $type, 'sid' => $sessionId]);
        } else {
            // Validação de Duplicidade
            $check = $conect->prepare("SELECT session_id FROM education.class_sessions WHERE class_id = :cid AND subject_id = :sub AND session_date = :dt AND deleted IS FALSE");
            $check->execute(['cid' => $classId, 'sub' => $subjectId, 'dt' => $date]);

            if ($check->rowCount() > 0) {
                $conect->rollBack();
                return failure("Já existe uma aula registrada para esta disciplina nesta data.");
            }

            $sqlIns = "INSERT INTO education.class_sessions (class_id, subject_id, session_date, description, content_type, signed_by_user_id, signed_at) 
                       VALUES (:cid, :sub, :dt, :desc, :type, :uid, CURRENT_TIMESTAMP) RETURNING session_id";
            $stmt = $conect->prepare($sqlIns);
            $stmt->execute(['cid' => $classId, 'sub' => $subjectId, 'dt' => $date, 'desc' => $desc, 'type' => $type, 'uid' => $userId]);
            $sessionId = $stmt->fetchColumn();
        }

        // Chamada
        $attendanceList = json_decode($data['attendance_json'], true);

        if (is_array($attendanceList)) {
            $sqlAtt = "
                INSERT INTO education.attendance (session_id, student_id, is_present, absence_type, justification, updated_at)
                VALUES (:sid, :stid, :pres, :atype, :just, CURRENT_TIMESTAMP)
                ON CONFLICT (session_id, student_id) 
                DO UPDATE SET 
                    is_present = EXCLUDED.is_present, 
                    absence_type = EXCLUDED.absence_type, 
                    justification = EXCLUDED.justification, 
                    updated_at = CURRENT_TIMESTAMP
            ";
            $stmtAtt = $conect->prepare($sqlAtt);

            foreach ($attendanceList as $att) {
                $isPresent = ($att['is_present'] === 'true' || $att['is_present'] === true) ? 'TRUE' : 'FALSE';
                $absType = ($isPresent === 'TRUE') ? null : ($att['absence_type'] ?? null);
                $just = ($isPresent === 'TRUE') ? null : ($att['justification'] ?? null);

                $stmtAtt->execute([
                    'sid' => $sessionId,
                    'stid' => $att['student_id'],
                    'pres' => $isPresent,
                    'atype' => $absType,
                    'just' => $just
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
