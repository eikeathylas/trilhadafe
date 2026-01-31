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

        // CORREÇÃO: Cálculo dinâmico da carga horária total
        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                c.course_id,
                c.name,
                c.min_age,
                c.max_age,
                c.is_active,
                -- Soma real das horas baseada na grade curricular
                COALESCE((
                    SELECT SUM(cur.workload_hours) 
                    FROM education.curriculum cur 
                    WHERE cur.course_id = c.course_id
                ), 0) as total_workload_hours,
                -- Contagem de disciplinas vinculadas
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

        if (!$course) {
            return failure("Curso não encontrado.");
        }

        // 2. Grade Curricular (Disciplinas Vinculadas)
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
        $course['curriculum'] = $stmtCur->fetchAll(PDO::FETCH_ASSOC);

        // Castings
        $course['is_active'] = (bool)$course['is_active'];
        foreach ($course['curriculum'] as &$item) {
            $item['is_mandatory'] = (bool)$item['is_mandatory'];
        }

        return success("Dados carregados.", $course);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getCourseData", "sql", $e->getMessage(), ['id' => $courseId]);
        return failure("Ocorreu um erro ao carregar os dados. Contate o suporte.", null, false, 500);
    }
}

function upsertCourse($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
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
            // UPDATE
            $sql = <<<'SQL'
                UPDATE education.courses SET
                    name = :name,
                    description = :description,
                    min_age = :min_age,
                    max_age = :max_age,
                    total_workload_hours = :total_workload_hours,
                    updated_at = CURRENT_TIMESTAMP
                WHERE course_id = :course_id
            SQL;

            $paramsCourse['course_id'] = $data['course_id'];
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsCourse);
            $courseId = $data['course_id'];
            $msg = "Curso atualizado com sucesso!";
        } else {
            // INSERT
            $orgId = 1; // ID da Paróquia (Contexto)

            $sql = <<<'SQL'
                INSERT INTO education.courses 
                (org_id, name, description, min_age, max_age, total_workload_hours)
                VALUES 
                (:org_id, :name, :description, :min_age, :max_age, :total_workload_hours)
                RETURNING course_id
            SQL;

            $paramsCourse['org_id'] = $orgId;
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsCourse);
            $courseId = $stmt->fetchColumn();
            $msg = "Curso criado com sucesso!";
        }

        // --- 2. SALVAR GRADE CURRICULAR ---
        // Estratégia: Limpar vínculos antigos e recriar (Snapshot da grade)

        $sqlClean = "DELETE FROM education.curriculum WHERE course_id = :id";
        $conect->prepare($sqlClean)->execute(['id' => $courseId]);

        if (!empty($data['curriculum_json'])) {
            $curriculumList = json_decode($data['curriculum_json'], true);

            foreach ($curriculumList as $item) {
                $sqlIns = <<<'SQL'
                    INSERT INTO education.curriculum (course_id, subject_id, workload_hours, is_mandatory)
                    VALUES (:cid, :sid, :hours, :mandatory)
                SQL;

                $conect->prepare($sqlIns)->execute([
                    'cid' => $courseId,
                    'sid' => $item['subject_id'],
                    'hours' => (int)$item['workload_hours'],
                    'mandatory' => filter_var($item['is_mandatory'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE'
                ]);
            }
        }

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "upsertCourse", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar o curso. Contate o suporte.", null, false, 500);
    }
}

function removeCourse($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
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

        // AUDITORIA
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

// Helper para preencher Selects de Cursos (Para telas futuras como Turmas)
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

        $sql = <<<SQL
            SELECT 
                course_id as id, 
                name as title
            FROM education.courses 
            $where
            ORDER BY name ASC 
            LIMIT 20
        SQL;

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

        // Mantemos apenas as colunas que existem na tabela education.subjects
        $where = "WHERE deleted IS FALSE AND is_active IS TRUE";

        if (!empty($search)) {
            $where .= " AND name ILIKE :search";
            $params[':search'] = "%" . $search . "%";
        }

        // CORREÇÃO: Removido 'workload_hours' que não existe nesta tabela
        $sql = <<<SQL
            SELECT 
                subject_id as id, 
                name as title
            FROM education.subjects 
            $where
            ORDER BY name ASC 
            LIMIT 100
        SQL;

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
