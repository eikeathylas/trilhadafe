<?php

// =========================================================
// GESTÃO DE CURSOS (EDUCATION.COURSES)
// =========================================================

function getAllCourses($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => $data['limit'],
            ':page' => $data['page']
        ];

        $where = "WHERE c.deleted IS FALSE";

        if (!empty($data['search'])) {
            $where .= " AND c.name ILIKE :search";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        // Soma dinâmica (SUM) da carga horária direto da grade curricular
        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                c.course_id,
                c.name,
                c.min_age,
                c.max_age,
                c.is_active,
                -- Calcula o total de horas somando as matérias vinculadas
                COALESCE((
                    SELECT SUM(cur.workload_hours) 
                    FROM education.curriculum cur 
                    WHERE cur.course_id = c.course_id
                ), 0) as total_workload_hours,
                -- Conta quantas matérias tem
                (
                    SELECT COUNT(*) 
                    FROM education.curriculum cur 
                    WHERE cur.course_id = c.course_id
                ) as subjects_count
            FROM education.courses c
            $where
            ORDER BY c.name ASC
            LIMIT :limit OFFSET :page
        SQL;

        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($key, $val, $type);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) {
            $row['is_active'] = (bool)$row['is_active'];
        }

        return success("Cursos listados.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getAllCourses", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao listar os cursos.", null, false, 500);
    }
}

function getCourseData($courseId)
{
    try {
        $conect = $GLOBALS["local"];

        // 1. Dados do Curso
        $sqlCourse = "SELECT * FROM education.courses WHERE course_id = :id AND deleted IS FALSE LIMIT 1";
        $stmt = $conect->prepare($sqlCourse);
        $stmt->execute(['id' => $courseId]);
        $course = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$course) return failure("Curso não encontrado.");

        // 2. Grade Curricular
        $sqlCurriculum = <<<'SQL'
            SELECT 
                cur.curriculum_id,
                cur.subject_id,
                s.name as subject_name,
                cur.workload_hours,
                cur.is_mandatory
            FROM education.curriculum cur
            JOIN education.subjects s ON s.subject_id = cur.subject_id
            WHERE cur.course_id = :id
            ORDER BY s.name ASC
        SQL;

        $stmtCur = $conect->prepare($sqlCurriculum);
        $stmtCur->execute(['id' => $courseId]);
        $curriculum = $stmtCur->fetchAll(PDO::FETCH_ASSOC);

        // 3. Planos de Aula
        foreach ($curriculum as &$item) {
            $item['is_mandatory'] = (bool)$item['is_mandatory'];

            // [CORREÇÃO] Adicionado 'plan_id' na query
            $sqlPlans = "SELECT plan_id, title, content, meeting_number FROM education.curriculum_plans WHERE curriculum_id = :cid AND deleted IS FALSE ORDER BY meeting_number ASC";

            $stmtPlans = $conect->prepare($sqlPlans);
            $stmtPlans->execute(['cid' => $item['curriculum_id']]);
            $item['plans'] = $stmtPlans->fetchAll(PDO::FETCH_ASSOC);
        }

        $course['curriculum'] = $curriculum;
        $course['is_active'] = (bool)$course['is_active'];

        return success("Dados carregados.", $course);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getCourseData", "sql", $e->getMessage(), ['id' => $courseId]);
        return failure("Erro ao carregar dados.", null, false, 500);
    }
}

function upsertCourse($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        // --- 1. SALVAR CURSO ---
        $paramsCourse = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'min_age' => !empty($data['min_age']) ? (int)$data['min_age'] : null,
            'max_age' => !empty($data['max_age']) ? (int)$data['max_age'] : null,
            'total_workload_hours' => !empty($data['total_workload_hours']) ? (int)$data['total_workload_hours'] : 0
        ];

        if (!empty($data['course_id'])) {
            $sql = "UPDATE education.courses SET name=:name, description=:description, min_age=:min_age, max_age=:max_age, total_workload_hours=:total_workload_hours, updated_at=CURRENT_TIMESTAMP WHERE course_id=:course_id";
            $paramsCourse['course_id'] = $data['course_id'];
            $conect->prepare($sql)->execute($paramsCourse);
            $courseId = $data['course_id'];
            $msg = "Curso atualizado!";
        } else {
            $sql = "INSERT INTO education.courses (org_id, name, description, min_age, max_age, total_workload_hours) VALUES (1, :name, :description, :min_age, :max_age, :total_workload_hours) RETURNING course_id";
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsCourse);
            $courseId = $stmt->fetchColumn();
            $msg = "Curso criado!";
        }

        // --- 2. SALVAR GRADE CURRICULAR ---
        $currList = !empty($data['curriculum_json']) ? json_decode($data['curriculum_json'], true) : [];
        $processedIds = [];

        foreach ($currList as $item) {
            $curriculumId = $item['curriculum_id'] ?? null;
            $subjectId = $item['subject_id'];

            // Verifica ID se não veio do front (caso raro de inserção concorrente, ou segurança)
            if (!$curriculumId) {
                $stmtCheck = $conect->prepare("SELECT curriculum_id FROM education.curriculum WHERE course_id = :cid AND subject_id = :sid");
                $stmtCheck->execute(['cid' => $courseId, 'sid' => $subjectId]);
                $curriculumId = $stmtCheck->fetchColumn();
            }

            if ($curriculumId) {
                // UPDATE
                $conect->prepare("UPDATE education.curriculum SET workload_hours = :h, is_mandatory = :m, updated_at = CURRENT_TIMESTAMP WHERE curriculum_id = :id")
                    ->execute(['h' => (int)$item['workload_hours'], 'm' => ($item['is_mandatory'] ? 'TRUE' : 'FALSE'), 'id' => $curriculumId]);
            } else {
                // INSERT
                $stmtIns = $conect->prepare("INSERT INTO education.curriculum (course_id, subject_id, workload_hours, is_mandatory) VALUES (:cid, :sid, :h, :m) RETURNING curriculum_id");
                $stmtIns->execute(['cid' => $courseId, 'sid' => $subjectId, 'h' => (int)$item['workload_hours'], 'm' => ($item['is_mandatory'] ? 'TRUE' : 'FALSE')]);
                $curriculumId = $stmtIns->fetchColumn();
            }

            $processedIds[] = $curriculumId;

            // --- 3. SALVAR PLANOS DE AULA (SMART SYNC) ---

            // A. Busca IDs existentes no banco para este item da grade
            $stmtExisting = $conect->prepare("SELECT plan_id FROM education.curriculum_plans WHERE curriculum_id = :cid");
            $stmtExisting->execute(['cid' => $curriculumId]);
            $existingPlanIds = $stmtExisting->fetchAll(PDO::FETCH_COLUMN, 0); // Array [10, 11, 12...]

            $processedPlanIds = []; // IDs que vieram do front e foram tratados

            if (!empty($item['plans']) && is_array($item['plans'])) {
                foreach ($item['plans'] as $idx => $plan) {
                    $meetingNum = $idx + 1; // A ordem é definida pelo índice do array vindo do front
                    $planTitle = $plan['title'] ?? ('Encontro ' . $meetingNum);
                    $planContent = $plan['content'] ?? '';
                    $planId = !empty($plan['plan_id']) ? $plan['plan_id'] : null;

                    if ($planId && in_array($planId, $existingPlanIds)) {
                        // --- UPDATE (Existe no front e no banco) ---
                        $stmtUpdPlan = $conect->prepare("UPDATE education.curriculum_plans SET title = :t, content = :c, meeting_number = :nm, updated_at = CURRENT_TIMESTAMP WHERE plan_id = :id");
                        $stmtUpdPlan->execute([
                            't' => $planTitle,
                            'c' => $planContent,
                            'nm' => $meetingNum,
                            'id' => $planId
                        ]);
                        $processedPlanIds[] = $planId;
                    } else {
                        // --- INSERT (Não tem ID ou é ID novo) ---
                        $stmtInsPlan = $conect->prepare("INSERT INTO education.curriculum_plans (curriculum_id, meeting_number, title, content) VALUES (:cid, :nm, :t, :c)");
                        $stmtInsPlan->execute([
                            'cid' => $curriculumId,
                            'nm' => $meetingNum,
                            't' => $planTitle,
                            'c' => $planContent
                        ]);
                        // Não precisamos guardar o ID do insert aqui para a lógica de delete
                    }
                }
            }

            // B. DELETE (Estava no banco, mas não veio no array do front)
            // Diff: Tudo que estava no banco MENOS o que foi processado/atualizado
            $idsToDelete = array_diff($existingPlanIds, $processedPlanIds);

            if (!empty($idsToDelete)) {
                $inQuery = implode(',', array_map('intval', $idsToDelete));

                // Em vez de DELETE FROM, fazemos UPDATE deleted = TRUE
                $sqlSoftDelete = "UPDATE education.curriculum_plans SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE plan_id IN ($inQuery)";
                $conect->exec($sqlSoftDelete);
            }
        }

        // Remove itens da grade excluídos
        if (!empty($processedIds)) {
            $inQuery = implode(',', array_map('intval', $processedIds));
            $conect->prepare("DELETE FROM education.curriculum WHERE course_id = :cid AND curriculum_id NOT IN ($inQuery)")->execute(['cid' => $courseId]);
        } else {
            $conect->prepare("DELETE FROM education.curriculum WHERE course_id = :cid")->execute(['cid' => $courseId]);
        }

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "upsertCourse", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar curso.", null, false, 500);
    }
}

function removeCourse($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE education.courses SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE course_id = :id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Curso movido para a lixeira.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "removeCourse", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao remover o curso. Contate o suporte.", null, false, 500);
    }
}

function toggleCourseStatus($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE education.courses SET is_active = :active, updated_at = CURRENT_TIMESTAMP WHERE course_id = :id";
        $stmt = $conect->prepare($sql);
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "toggleCourseStatus", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao atualizar o status. Contate o suporte.", null, false, 500);
    }
}

function searchCoursesForSelect($search)
{
    try {
        $conect = $GLOBALS["local"];
        $params = [];
        $where = "WHERE deleted IS FALSE AND is_active IS TRUE";

        if (!empty($search)) {
            $where .= " AND name ILIKE :search";
            $params['search'] = "%" . $search . "%";
        }

        $sql = "SELECT course_id as id, name as title FROM education.courses $where ORDER BY name ASC LIMIT 20";
        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "education", "searchCoursesForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de cursos.");
    }
}

function searchSubjects($search = '')
{
    try {
        $conect = $GLOBALS["local"];
        $params = [];
        $where = "WHERE deleted IS FALSE AND is_active IS TRUE";

        if (!empty($search)) {
            $where .= " AND name ILIKE :search";
            $params[':search'] = "%" . $search . "%";
        }

        $sql = "SELECT subject_id as id, name as title FROM education.subjects $where ORDER BY name ASC LIMIT 100";
        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->execute();

        return success("Disciplinas listadas.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "education", "searchSubjects", "sql", $e->getMessage(), ["search" => $search]);
        return failure("Erro ao buscar disciplinas.", []);
    }
}
