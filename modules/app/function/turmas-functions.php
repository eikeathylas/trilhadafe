<?php

// =========================================================
// GESTÃO DE TURMAS (CRUD)
// =========================================================

function getAllClasses($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => $data['limit'],
            ':page' => $data['page']
        ];

        $where = "WHERE c.deleted IS FALSE";

        if (!empty($data['search'])) {
            $where .= " AND (c.name ILIKE :search OR co.name ILIKE :search OR p.full_name ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['year'])) {
            $where .= " AND c.year_cycle = :year";
            $params[':year'] = (int)$data['year'];
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                c.class_id,
                c.name,
                c.year_cycle,
                c.status,
                c.max_capacity,
                co.name as course_name,
                p.full_name as coordinator_name,
                p.profile_photo_url as coordinator_photo,
                l.name as location_name,
                
                -- Contagem de alunos matriculados ativos
                (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = c.class_id AND e.deleted IS FALSE AND e.status = 'ACTIVE') as enrolled_count,
                
                -- Resumo dos horários para listagem
                (
                    SELECT STRING_AGG(
                        CASE cs.week_day 
                            WHEN 0 THEN 'Dom' WHEN 1 THEN 'Seg' WHEN 2 THEN 'Ter' 
                            WHEN 3 THEN 'Qua' WHEN 4 THEN 'Qui' WHEN 5 THEN 'Sex' WHEN 6 THEN 'Sáb' 
                        END || ' ' || TO_CHAR(cs.start_time, 'HH24:MI'), 
                    ', ')
                    FROM education.class_schedules cs 
                    WHERE cs.class_id = c.class_id AND cs.is_active IS TRUE
                ) as schedule_summary
            FROM education.classes c
            JOIN education.courses co ON c.course_id = co.course_id
            LEFT JOIN people.persons p ON c.coordinator_id = p.person_id
            LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
            $where
            ORDER BY c.year_cycle DESC, c.name ASC
            LIMIT :limit OFFSET :page
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
        return failure("Ocorreu um erro ao listar as turmas.", null, false, 500);
    }
}

function getClassData($id)
{
    try {
        $conect = $GLOBALS["local"];

        // 1. Dados da Turma
        $sql = "SELECT * FROM education.classes WHERE class_id = :id AND deleted IS FALSE LIMIT 1";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $id]);
        $class = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$class) return failure("Turma não encontrada.");

        // 2. Horários
        $sqlSched = "SELECT * FROM education.class_schedules WHERE class_id = :id AND is_active IS TRUE ORDER BY week_day, start_time";
        $stmtSched = $conect->prepare($sqlSched);
        $stmtSched->execute(['id' => $id]);
        $class['schedules'] = $stmtSched->fetchAll(PDO::FETCH_ASSOC);

        return success("Dados carregados.", $class);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getClassData", "sql", $e->getMessage(), ['id' => $id]);
        return failure("Erro ao buscar dados da turma.");
    }
}

function upsertClass($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // Auditoria
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        // --- 1. SALVAR TURMA ---
        $params = [
            'course_id' => $data['course_id'],
            'main_location_id' => !empty($data['main_location_id']) ? $data['main_location_id'] : null,
            'coordinator_id' => !empty($data['coordinator_id']) ? $data['coordinator_id'] : null,
            'name' => $data['name'],
            'year_cycle' => $data['year_cycle'],
            'max_capacity' => !empty($data['max_capacity']) ? $data['max_capacity'] : null,
            'status' => $data['status'] ?? 'PLANNED'
        ];

        if (!empty($data['class_id'])) {
            // UPDATE
            $sql = <<<'SQL'
                UPDATE education.classes SET 
                    course_id = :course_id, 
                    main_location_id = :main_location_id, 
                    coordinator_id = :coordinator_id,
                    name = :name, 
                    year_cycle = :year_cycle, 
                    max_capacity = :max_capacity, 
                    status = :status,
                    updated_at = CURRENT_TIMESTAMP
                WHERE class_id = :class_id
            SQL;
            $params['class_id'] = $data['class_id'];
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
            $classId = $data['class_id'];
            $msg = "Turma atualizada com sucesso!";
        } else {
            // INSERT
            $orgId = 1; // Fixo por enquanto
            $sql = <<<'SQL'
                INSERT INTO education.classes 
                (course_id, org_id, main_location_id, coordinator_id, name, year_cycle, max_capacity, status)
                VALUES 
                (:course_id, :org_id, :main_location_id, :coordinator_id, :name, :year_cycle, :max_capacity, :status)
                RETURNING class_id
            SQL;
            $params['org_id'] = $orgId;
            $stmt = $conect->prepare($sql);
            $stmt->execute($params);
            $classId = $stmt->fetchColumn();
            $msg = "Turma criada com sucesso!";
        }

        // --- 2. SALVAR HORÁRIOS (SMART SYNC) ---
        // A. Busca existentes
        $sqlGet = "SELECT schedule_id, week_day, start_time, end_time, location_id FROM education.class_schedules WHERE class_id = :id";
        $stmtGet = $conect->prepare($sqlGet);
        $stmtGet->execute(['id' => $classId]);

        $existingItems = [];
        while ($row = $stmtGet->fetch(PDO::FETCH_ASSOC)) {
            // Cria uma chave única para identificar o horário
            $key = $row['week_day'] . '-' . substr($row['start_time'], 0, 5) . '-' . substr($row['end_time'], 0, 5);
            $existingItems[$key] = $row;
        }

        // B. Processa novos
        $incomingList = !empty($data['schedules_json']) ? json_decode($data['schedules_json'], true) : [];
        $processedKeys = [];

        foreach ($incomingList as $sch) {
            $wd = (int)$sch['week_day'];
            $st = substr($sch['start_time'], 0, 5); // HH:MM
            $et = substr($sch['end_time'], 0, 5);
            $lid = !empty($sch['location_id']) ? $sch['location_id'] : null;

            $key = $wd . '-' . $st . '-' . $et;
            $processedKeys[] = $key;

            // Se já existe um horário IDÊNTICO (Dia + Hora), verifica se mudou a SALA
            if (isset($existingItems[$key])) {
                $current = $existingItems[$key];
                if ($current['location_id'] != $lid) {
                    // Atualiza só a sala
                    $conect->prepare("UPDATE education.class_schedules SET location_id = :lid WHERE schedule_id = :sid")
                        ->execute(['lid' => $lid, 'sid' => $current['schedule_id']]);
                }
            } else {
                // Novo Horário
                $sqlIns = "INSERT INTO education.class_schedules (class_id, week_day, start_time, end_time, location_id) VALUES (:cid, :wd, :st, :et, :lid)";
                $conect->prepare($sqlIns)->execute([
                    'cid' => $classId,
                    'wd' => $wd,
                    'st' => $st,
                    'et' => $et,
                    'lid' => $lid
                ]);
            }
        }

        // C. Remove os que sumiram da lista
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
        return failure("Ocorreu um erro ao salvar a turma.", null, false, 500);
    }
}

function removeClass($data)
{
    try {
        $conect = $GLOBALS["local"];
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

        $stmt = $conect->prepare("UPDATE education.classes SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE class_id = :id");
        $stmt->execute(['status' => $newStatus, 'id' => $data['id']]);

        $conect->commit();
        return success("Status atualizado para $newStatus.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "toggleClassStatus", "sql", $e->getMessage(), $data);
        return failure("Erro ao atualizar status.");
    }
}

// =========================================================
// GESTÃO DE ALUNOS E MATRÍCULAS (ABA 3)
// =========================================================

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
        return success("Alunos listados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "education", "getClassStudentsF", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar alunos.");
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

        // 1. Verifica duplicidade
        $check = $conect->prepare("SELECT enrollment_id FROM education.enrollments WHERE class_id = :cid AND student_id = :sid AND deleted IS FALSE");
        $check->execute(['cid' => $data['class_id'], 'sid' => $data['student_id']]);
        if ($check->fetch()) {
            $conect->rollBack();
            return failure("Este aluno já está matriculado nesta turma.");
        }

        // 2. Validação de Capacidade (NOVO)
        $sqlCap = "SELECT max_capacity, (SELECT COUNT(*) FROM education.enrollments WHERE class_id = :cid AND status = 'ACTIVE' AND deleted IS FALSE) as total FROM education.classes WHERE class_id = :cid";
        $stmtCap = $conect->prepare($sqlCap);
        $stmtCap->execute(['cid' => $data['class_id']]);
        $capInfo = $stmtCap->fetch(PDO::FETCH_ASSOC);

        if ($capInfo && $capInfo['max_capacity'] > 0 && $capInfo['total'] >= $capInfo['max_capacity']) {
            $conect->rollBack();
            return failure("A turma atingiu a capacidade máxima ({$capInfo['max_capacity']} alunos).");
        }

        // 3. Cria Matrícula
        $sql = "INSERT INTO education.enrollments (class_id, student_id, status) VALUES (:cid, :sid, 'ACTIVE') RETURNING enrollment_id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['cid' => $data['class_id'], 'sid' => $data['student_id']]);
        $enrollId = $stmt->fetchColumn();

        // 4. Cria Histórico Inicial
        $sqlHist = "INSERT INTO education.enrollment_history (enrollment_id, action_type, observation, created_by_user_id) VALUES (:eid, 'ENROLLED', 'Matrícula Inicial', :uid)";
        $conect->prepare($sqlHist)->execute(['eid' => $enrollId, 'uid' => $data['user_id']]);

        $conect->commit();
        return success("Aluno matriculado com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "enrollStudentF", "sql", $e->getMessage(), $data);
        return failure("Erro ao matricular aluno.");
    }
}

function getEnrollmentHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conectStaff = getStaff();

        $sql = <<<'SQL'
            SELECT 
                h.*,
                TO_CHAR(h.action_date, 'DD/MM/YYYY') as action_date_fmt,
                h.created_by_user_id
            FROM education.enrollment_history h
            WHERE h.enrollment_id = :eid AND h.deleted IS FALSE
            ORDER BY h.created_at DESC
        SQL;
        $stmt = $conect->prepare($sql);
        $stmt->execute(['eid' => $data['enrollment_id']]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $userIds = array_unique(array_column($logs, 'created_by_user_id'));
        $usersMap = [];
        if (!empty($userIds)) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN ($placeholders)");
            $stmtU->execute(array_values($userIds));
            while ($r = $stmtU->fetch(PDO::FETCH_ASSOC)) $usersMap[$r['id']] = $r['name'];
        }

        foreach ($logs as &$log) {
            $log['user_name'] = $usersMap[$log['created_by_user_id']] ?? 'Sistema';
        }

        return success("Histórico carregado.", $logs);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getEnrollmentHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao buscar histórico.");
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

        if ($data['action_type'] !== 'COMMENT') {
            $sqlUp = "UPDATE education.enrollments SET status = :st WHERE enrollment_id = :eid";
            $conect->prepare($sqlUp)->execute(['st' => $data['action_type'], 'eid' => $data['enrollment_id']]);
        }

        $conect->commit();
        return success("Registro adicionado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "addEnrollmentHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao registrar no histórico.");
    }
}

function deleteEnrollmentHistoryF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "UPDATE education.enrollment_history SET deleted = TRUE WHERE history_id = :id";
        $conect->prepare($sql)->execute(['id' => $data['id']]);
        return success("Item apagado.");
    } catch (Exception $e) {
        logSystemError("painel", "education", "deleteEnrollmentHistoryF", "sql", $e->getMessage(), $data);
        return failure("Erro ao apagar registro.");
    }
}

function deleteEnrollmentF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "UPDATE education.enrollments SET deleted = TRUE, status = 'DROPPED' WHERE enrollment_id = :id";
        $conect->prepare($sql)->execute(['id' => $data['id']]);
        return success("Matrícula removida.");
    } catch (Exception $e) {
        logSystemError("painel", "education", "deleteEnrollmentF", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover matrícula.");
    }
}
