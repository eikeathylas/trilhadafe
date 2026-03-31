<?php

function getAllClasses($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

        $params = [
            ':limit' => (int)$data['limit'],
            ':offset' => (int)$data['page'],
            ':oid' => $orgId
        ];

        $where = "WHERE c.deleted IS FALSE AND c.org_id = :oid";

        if (!empty($data['search'])) {
            $where .= " AND (c.name ILIKE :search OR co.name ILIKE :search OR p.full_name ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['year'])) {
            $where .= " AND c.year_id = :year";
            $params[':year'] = (int)$data['year'];
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                c.class_id, c.name, y.name as year_name, c.status, c.max_capacity,
                co.name as course_name, p.full_name as coordinator_name,
                p.profile_photo_url as coordinator_photo, pa.full_name as assistant_name,
                l.name as location_name, c.is_active, c.is_graduating_class,
                (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = c.class_id AND e.deleted IS FALSE AND e.status = 'ACTIVE') as enrolled_count,
                (SELECT STRING_AGG(CASE cs.day_of_week WHEN 0 THEN 'Dom' WHEN 1 THEN 'Seg' WHEN 2 THEN 'Ter' WHEN 3 THEN 'Qua' WHEN 4 THEN 'Qui' WHEN 5 THEN 'Sex' WHEN 6 THEN 'Sáb' END || ' ' || TO_CHAR(cs.start_time, 'HH24:MI'), ', ') FROM education.class_schedules cs WHERE cs.class_id = c.class_id AND cs.is_active IS TRUE) as schedule_summary
            FROM education.classes c
            LEFT JOIN education.academic_years y ON c.year_id = y.year_id
            JOIN education.courses co ON c.course_id = co.course_id
            LEFT JOIN people.persons p ON c.coordinator_id = p.person_id
            LEFT JOIN people.persons pa ON c.class_assistant_id = pa.person_id
            LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
            $where
            ORDER BY y.name DESC, c.name ASC
            LIMIT :limit OFFSET :offset
        SQL;

        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($key, $val, $type);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return success("Turmas listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getAllClasses", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar turmas.", null, false, 500);
    }
}

function getClassData($id)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = <<<SQL
            SELECT 
                c.*, 
                co.name as course_name_text,
                p.full_name as coordinator_name_text,
                pa.full_name as assistant_name_text,
                l.name as location_name_text
            FROM education.classes c 
            LEFT JOIN education.courses co ON c.course_id = co.course_id
            LEFT JOIN people.persons p ON c.coordinator_id = p.person_id
            LEFT JOIN people.persons pa ON c.class_assistant_id = pa.person_id
            LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
            WHERE c.class_id = :id AND c.deleted IS FALSE LIMIT 1
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) return failure("Turma não encontrada.");

        $sqlYear = "SELECT start_date, end_date FROM education.academic_years WHERE year_id = :yid";
        $stmtYear = $conect->prepare($sqlYear);
        $stmtYear->execute(['yid' => $class['year_id']]);
        $yearData = $stmtYear->fetch(PDO::FETCH_ASSOC);

        $sqlSched = "SELECT schedule_id, day_of_week, TO_CHAR(start_time, 'HH24:MI') as start_time, TO_CHAR(end_time, 'HH24:MI') as end_time, location_id 
                     FROM education.class_schedules 
                     WHERE class_id = :id AND is_active IS TRUE 
                     ORDER BY day_of_week, start_time";
        $stmtSched = $conect->prepare($sqlSched);
        $stmtSched->execute(['id' => $id]);
        $schedules = $stmtSched->fetchAll(PDO::FETCH_ASSOC);

        if ($yearData && $yearData['start_date'] && $yearData['end_date']) {
            foreach ($schedules as &$sch) {
                $sqlGen = "SELECT COUNT(*) FROM generate_series(:sd::date, :ed::date, '1 day'::interval) serie(d) WHERE EXTRACT(DOW FROM serie.d) = :dow";
                $stmtGen = $conect->prepare($sqlGen);
                $stmtGen->execute([
                    'sd' => $yearData['start_date'],
                    'ed' => $yearData['end_date'],
                    'dow' => $sch['day_of_week']
                ]);
                $sch['total_classes'] = $stmtGen->fetchColumn();

                $sqlRec = "SELECT COUNT(*) FROM education.class_sessions WHERE class_id = :cid AND EXTRACT(DOW FROM session_date) = :dow AND deleted IS FALSE";
                $stmtRec = $conect->prepare($sqlRec);
                $stmtRec->execute([
                    'cid' => $id,
                    'dow' => $sch['day_of_week']
                ]);
                $sch['recorded_classes'] = $stmtRec->fetchColumn();
            }
        }

        $class['schedules'] = $schedules;

        return success("Dados carregados.", $class);
    } catch (Exception $e) {
        return failure("Erro ao carregar dados da turma.");
    }
}

function upsertClass($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $params = [
            'course_id' => $data['course_id'],
            'main_location_id' => !empty($data['main_location_id']) ? $data['main_location_id'] : null,
            'coordinator_id' => !empty($data['coordinator_id']) ? $data['coordinator_id'] : null,
            'class_assistant_id' => !empty($data['class_assistant_id']) ? $data['class_assistant_id'] : null,
            'name' => $data['name'],
            'year_id' => $data['year_id'],
            'max_capacity' => !empty($data['max_capacity']) ? $data['max_capacity'] : null,
            'status' => $data['status'] ?? 'PLANNED',
            'is_graduating_class' => (isset($data['is_graduating_class']) && ($data['is_graduating_class'] === 'true' || $data['is_graduating_class'] === true)) ? 'true' : 'false'
        ];

        if (!empty($data['class_id'])) {
            $sql = "UPDATE education.classes SET course_id=:course_id, main_location_id=:main_location_id, coordinator_id=:coordinator_id, class_assistant_id=:class_assistant_id, name=:name, year_id=:year_id, max_capacity=:max_capacity, status=:status, is_graduating_class=:is_graduating_class, updated_at=CURRENT_TIMESTAMP WHERE class_id=:class_id";
            $params['class_id'] = $data['class_id'];
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
            $classId = $data['class_id'];
            $msg = "Turma atualizada com sucesso!";
        } else {
            if (empty($data['org_id'])) {
                $conect->rollBack();
                return failure("Organização não definida.");
            }
            $params['org_id'] = $data['org_id'];
            $sql = "INSERT INTO education.classes (course_id, org_id, main_location_id, coordinator_id, class_assistant_id, name, year_id, max_capacity, status, is_graduating_class) VALUES (:course_id, :org_id, :main_location_id, :coordinator_id, :class_assistant_id, :name, :year_id, :max_capacity, :status, :is_graduating_class) RETURNING class_id";
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
            $classId = $stmt->fetchColumn();
            $msg = "Turma criada com sucesso!";
        }

        $sqlGet = "SELECT schedule_id, day_of_week, TO_CHAR(start_time, 'HH24:MI') as start_time, TO_CHAR(end_time, 'HH24:MI') as end_time, location_id FROM education.class_schedules WHERE class_id = :id";
        $stmtGet = $conect->prepare($sqlGet);
        $stmtGet->execute(['id' => $classId]);

        $existingItems = [];
        while ($row = $stmtGet->fetch(PDO::FETCH_ASSOC)) {
            $key = $row['day_of_week'] . '-' . $row['start_time'] . '-' . $row['end_time'];
            $existingItems[$key] = $row;
        }

        $incomingList = !empty($data['schedules_json']) ? json_decode($data['schedules_json'], true) : [];
        $processedKeys = [];

        foreach ($incomingList as $sch) {
            $wd = (int)$sch['day_of_week'];
            $st = substr($sch['start_time'], 0, 5);
            $et = substr($sch['end_time'], 0, 5);
            $lid = !empty($sch['location_id']) ? $sch['location_id'] : null;

            $key = $wd . '-' . $st . '-' . $et;
            $processedKeys[] = $key;

            if (isset($existingItems[$key])) {
                $current = $existingItems[$key];
                if ($current['location_id'] != $lid) {
                    $conect->prepare("UPDATE education.class_schedules SET location_id = :lid WHERE schedule_id = :sid")
                        ->execute(['lid' => $lid, 'sid' => $current['schedule_id']]);
                }
            } else {
                $sqlIns = "INSERT INTO education.class_schedules (class_id, day_of_week, start_time, end_time, location_id) VALUES (:cid, :wd, :st, :et, :lid)";
                $conect->prepare($sqlIns)->execute([
                    'cid' => $classId,
                    'wd' => $wd,
                    'st' => $st,
                    'et' => $et,
                    'lid' => $lid
                ]);
            }
        }

        foreach ($existingItems as $key => $item) {
            if (!in_array($key, $processedKeys)) {
                $conect->prepare("DELETE FROM education.class_schedules WHERE schedule_id = :id")->execute(['id' => $item['schedule_id']]);
            }
        }

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "upsertClass", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar a turma.");
    }
}

function removeClass($data)
{
    try {
        $conect = $GLOBALS["local"];

        $check = $conect->prepare("SELECT enrollment_id FROM education.enrollments WHERE class_id = :id AND status = 'ACTIVE'");
        $check->execute(['id' => $data['id']]);
        if ($check->rowCount() > 0) return failure("Não é possível excluir: Existem alunos matriculados.");

        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $stmt = $conect->prepare("UPDATE education.classes SET deleted = TRUE, status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE class_id = :id");
        $stmt->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Turma movida para a lixeira.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "removeClass", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover a turma.");
    }
}

function toggleClassStatus($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $newStatus = ($data['active'] === 'true' || $data['active'] === true) ? 'ACTIVE' : 'PLANNED';
        $newBool = ($data['active'] === 'true' || $data['active'] === true) ? 'TRUE' : 'FALSE';

        $stmt = $conect->prepare("UPDATE education.classes SET status = :status, is_active = $newBool, updated_at = CURRENT_TIMESTAMP WHERE class_id = :id");
        $stmt->execute(['status' => $newStatus, 'id' => $data['id']]);

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "toggleClassStatus", "sql", $e->getMessage(), $data);
        return failure("Erro ao atualizar status.");
    }
}

function getClassStudentsF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = <<<'SQL'
            SELECT 
                e.enrollment_id,
                e.student_id,
                p.full_name as student_name,
                TO_CHAR(e.enrollment_date, 'DD/MM/YYYY') as enrollment_date_fmt,
                e.status,
                e.final_grade
            FROM education.enrollments e
            JOIN people.persons p ON p.person_id = e.student_id
            WHERE e.class_id = :cid AND e.deleted IS FALSE
            ORDER BY p.full_name ASC
        SQL;
        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $data['class_id']]);
        return success("Catequizandos listados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "education", "getClassStudentsF", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar catequizandos.");
    }
}

function enrollStudentF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $check = $conect->prepare("SELECT enrollment_id FROM education.enrollments WHERE class_id = :cid AND student_id = :sid AND deleted IS FALSE");
        $check->execute(['cid' => $data['class_id'], 'sid' => $data['student_id']]);
        if ($check->fetch()) {
            $conect->rollBack();
            return failure("Este catequizando já está matriculado nesta turma.");
        }

        $sqlCap = "SELECT max_capacity, org_id, name as class_name, coordinator_id, (SELECT COUNT(*) FROM education.enrollments WHERE class_id = :cid AND status = 'ACTIVE' AND deleted IS FALSE) as total FROM education.classes WHERE class_id = :cid";
        $stmtCap = $conect->prepare($sqlCap);
        $stmtCap->execute(['cid' => $data['class_id']]);
        $capInfo = $stmtCap->fetch(PDO::FETCH_ASSOC);

        if ($capInfo && $capInfo['max_capacity'] > 0 && $capInfo['total'] >= $capInfo['max_capacity']) {
            $conect->rollBack();
            return failure("A turma atingiu a capacidade máxima.");
        }

        $enrollDate = !empty($data['enrollment_date']) ? $data['enrollment_date'] : date('Y-m-d');

        $sql = "INSERT INTO education.enrollments (class_id, student_id, status, enrollment_date) VALUES (:cid, :sid, 'ACTIVE', :ed) RETURNING enrollment_id";
        $stmt = $conect->prepare($sql);
        $stmt->execute([
            'cid' => $data['class_id'],
            'sid' => $data['student_id'],
            'ed'  => $enrollDate
        ]);
        $enrollId = $stmt->fetchColumn();

        $sqlHist = "INSERT INTO education.enrollment_history (enrollment_id, action_type, observation, created_by_user_id) VALUES (:eid, 'ENROLLED', 'Matrícula Inicial', :uid)";
        $conect->prepare($sqlHist)->execute(['eid' => $enrollId, 'uid' => $data['user_id']]);

        // =========================================================
        // NOTIFICAÇÃO DE SISTEMA (AVISA O PROFESSOR DA TURMA)
        // =========================================================
        if ($capInfo && !empty($capInfo['coordinator_id'])) {
            $stmtS = $conect->prepare("SELECT full_name FROM people.persons WHERE person_id = :sid");
            $stmtS->execute(['sid' => $data['student_id']]);
            $studentName = $stmtS->fetchColumn();

            $msg = "O aluno(a) {$studentName} foi matriculado(a) na sua turma: {$capInfo['class_name']}.";

            $sqlNotif = "INSERT INTO communication.notifications (org_id, title, message, type, action_url, module_context) 
                         VALUES (:oid, 'Novo Aluno Matriculado', :msg, 'INFO', '#', 'SYSTEM') RETURNING notification_id";
            $stmtNotif = $conect->prepare($sqlNotif);
            $stmtNotif->execute([
                'oid' => $capInfo['org_id'],
                'msg' => $msg
            ]);
            $notifId = $stmtNotif->fetchColumn();

            if ($notifId) {
                $sqlTarget = "INSERT INTO communication.notification_targets (notification_id, target_type, target_val) 
                              VALUES (:nid, 'PERSON', :tval)";
                $conect->prepare($sqlTarget)->execute([
                    'nid' => $notifId,
                    'tval' => $capInfo['coordinator_id']
                ]);
            }
        }

        $conect->commit();
        return success("Catequizando matriculado com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "enrollStudentF", "sql", $e->getMessage(), $data);
        return failure("Erro ao matricular catequizando.");
    }
}

function deleteEnrollmentF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE education.enrollments SET deleted = TRUE, status = 'DROPPED', updated_at = CURRENT_TIMESTAMP WHERE enrollment_id = :id";
        $conect->prepare($sql)->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Matrícula removida.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "deleteEnrollmentF", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover matrícula.");
    }
}

function getEnrollmentHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        // Restaurando o padrão arquitetural correto do sistema
        $conectStaff = getStaff();

        $enrollmentId = $data['enrollment_id'];

        $stmtEnc = $conect->prepare("SELECT student_id, class_id FROM education.enrollments WHERE enrollment_id = :eid");
        $stmtEnc->execute(['eid' => $enrollmentId]);
        $encData = $stmtEnc->fetch(PDO::FETCH_ASSOC);

        if (!$encData) return failure("Matrícula não encontrada.");

        // 1. Busca os lançamentos normais de matrícula
        $sqlHist = "SELECT 
                        h.history_id,
                        h.action_type,
                        h.observation,
                        h.created_at as action_date,
                        h.created_by_user_id,
                        'HISTORY' as source_table,
                        NULL as subject_name
                    FROM education.enrollment_history h
                    WHERE h.enrollment_id = :eid AND h.deleted IS FALSE";
        $stmtH = $conect->prepare($sqlHist);
        $stmtH->execute(['eid' => $enrollmentId]);
        $historyRecords = $stmtH->fetchAll(PDO::FETCH_ASSOC);

        // 2. Busca as FALTAS no diário de classe (Refatorado para "Fases" em vez de "Disciplinas")
        $sqlAbs = "SELECT 
                        a.session_id as history_id,
                        'ABSENCE' as action_type,
                        COALESCE(a.justification, 'Falta não justificada') as observation,
                        s.session_date as action_date,
                        s.signed_by_user_id as created_by_user_id,
                        'ATTENDANCE' as source_table,
                        ph.name as subject_name
                    FROM education.attendance a
                    JOIN education.class_sessions s ON a.session_id = s.session_id
                    LEFT JOIN education.phases ph ON s.phase_id = ph.phase_id
                    WHERE a.student_id = :sid 
                      AND s.class_id = :cid 
                      AND a.is_present IS FALSE 
                      AND s.deleted IS FALSE
                    LIMIT 0"; // LIMIT 0 para desativar temporariamente a busca de faltas.
        $stmtA = $conect->prepare($sqlAbs);
        $stmtA->execute([
            'sid' => $encData['student_id'],
            'cid' => $encData['class_id']
        ]);
        $absenceRecords = $stmtA->fetchAll(PDO::FETCH_ASSOC);

        // Mescla e ordena por data descrescente (Mais recente no topo)
        $logs = array_merge($historyRecords, $absenceRecords);
        usort($logs, function ($a, $b) {
            return strtotime($b['action_date']) - strtotime($a['action_date']);
        });

        $userIds = array_unique(array_filter(array_column($logs, 'created_by_user_id')));
        $usersMap = [];

        // Proteção contra falha no Staff DB
        if (!empty($userIds) && $conectStaff) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN ($placeholders)");
            $stmtU->execute(array_values($userIds));
            while ($r = $stmtU->fetch(PDO::FETCH_ASSOC)) {
                $usersMap[$r['id']] = $r['name'];
            }
        }

        foreach ($logs as &$log) {
            $log['user_name'] = $usersMap[$log['created_by_user_id']] ?? 'Sistema / Professor';
            $log['action_date_fmt'] = date('d/m/Y', strtotime($log['action_date']));

            if ($log['action_type'] === 'ABSENCE') {
                $subj = $log['subject_name'] ? " ({$log['subject_name']})" : "";
                $log['observation'] = "Falta registrada no diário" . $subj . " - Motivo: " . $log['observation'];
            }
        }

        return success("Histórico carregado.", $logs);
    } catch (Exception $e) {
        return failure("Erro ao buscar histórico: " . $e->getMessage());
    }
}

function addEnrollmentHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "INSERT INTO education.enrollment_history (enrollment_id, action_type, observation, created_by_user_id) VALUES (:eid, :act, :obs, :uid)";
        $conect->prepare($sql)->execute([
            'eid' => $data['enrollment_id'],
            'act' => $data['action_type'],
            'obs' => $data['observation'],
            'uid' => $data['user_id']
        ]);

        // Grava ativamente a observação na tabela principal para Forçar o Log Visual da Auditoria
        if ($data['action_type'] !== 'COMMENT') {
            $sqlUp = "UPDATE education.enrollments SET status = :st, updated_at = CURRENT_TIMESTAMP, notes = :obs WHERE enrollment_id = :eid";
            $conect->prepare($sqlUp)->execute(['st' => $data['action_type'], 'obs' => $data['observation'], 'eid' => $data['enrollment_id']]);
        } else {
            $sqlUp = "UPDATE education.enrollments SET updated_at = CURRENT_TIMESTAMP, notes = :obs WHERE enrollment_id = :eid";
            $conect->prepare($sqlUp)->execute(['obs' => $data['observation'], 'eid' => $data['enrollment_id']]);
        }

        $conect->commit();
        return success("Registro adicionado.");
    } catch (Exception $e) {
        $conect->rollBack();
        return failure("Erro ao registrar no histórico.");
    }
}

function deleteEnrollmentHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = "UPDATE education.enrollment_history SET deleted = TRUE WHERE history_id = :id RETURNING enrollment_id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['id']]);
        $enrollmentId = $stmt->fetchColumn();

        if ($enrollmentId) {
            $conect->prepare("UPDATE education.enrollments SET updated_at = CURRENT_TIMESTAMP, notes = 'Uma ocorrência/observação foi removida do histórico.' WHERE enrollment_id = :eid")->execute(['eid' => $enrollmentId]);
        }

        return success("Item apagado.");
    } catch (Exception $e) {
        return failure("Erro ao apagar registro.");
    }
}

function toggleConclusionClassF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $classId = (int)$data['id'];
        $isConcluding = ($data['conclude'] === 'true' || $data['conclude'] === true);

        if ($isConcluding) {
            // 1. Conclui a Turma
            $conect->prepare("UPDATE education.classes SET status = 'COMPLETED', is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE class_id = :id")->execute(['id' => $classId]);

            // 2. Conclui todos os Alunos Ativos
            $conect->prepare("UPDATE education.enrollments SET status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP WHERE class_id = :id AND status = 'ACTIVE' AND deleted IS FALSE")->execute(['id' => $classId]);
            $msg = "Turma concluída com sucesso! Os alunos ativos foram promovidos a concluintes.";
        } else {
            // 1. Reabre a Turma
            $conect->prepare("UPDATE education.classes SET status = 'ACTIVE', is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE class_id = :id")->execute(['id' => $classId]);

            // 2. Reativa os Alunos Concluintes
            $conect->prepare("UPDATE education.enrollments SET status = 'ACTIVE', updated_at = CURRENT_TIMESTAMP WHERE class_id = :id AND status = 'COMPLETED' AND deleted IS FALSE")->execute(['id' => $classId]);
            $msg = "A conclusão da turma foi revertida. Turma e alunos estão ativos novamente.";
        }

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        if ($conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "turmas", "toggleConclusionClass", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar a conclusão da turma.", null, false, 500);
    }
}
