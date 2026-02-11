<?php

function getAllSubjects($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

        $where = "WHERE deleted IS FALSE AND org_id = :oid";
        $params = [':limit' => $data['limit'], ':page' => $data['page'], ':oid' => $orgId];

        if (!empty($data['search'])) {
            $where .= " AND name ILIKE :search";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                subject_id,
                name,
                syllabus_summary,
                is_active
            FROM education.subjects
            $where
            ORDER BY name ASC
            LIMIT :limit OFFSET :page
        SQL;

        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($key, $val, $type);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) $row['is_active'] = (bool)$row['is_active'];

        return success("Disciplinas listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getAllSubjects", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao listar as disciplinas. Contate o suporte.", null, false, 500);
    }
}

function getSubjectData($id)
{
    try {
        $conect = $GLOBALS["local"];
        $stmt = $conect->prepare("SELECT * FROM education.subjects WHERE subject_id = :id AND deleted IS FALSE LIMIT 1");
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$res) return failure("Disciplina não encontrada.");
        return success("Dados carregados.", $res);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getSubjectData", "sql", $e->getMessage(), ['id' => $id]);
        return failure("Ocorreu um erro ao buscar os dados. Contate o suporte.", null, false, 500);
    }
}

function upsertSubject($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $params = [
            'name' => $data['name'],
            'syllabus' => $data['syllabus_summary'] ?? null
        ];

        if (!empty($data['subject_id'])) {
            $sql = "UPDATE education.subjects SET name=:name, syllabus_summary=:syllabus WHERE subject_id=:id";
            $params['id'] = $data['subject_id'];
            $msg = "Disciplina atualizada!";
        } else {
            if (empty($data['org_id'])) {
                $conect->rollBack();
                return failure("Organização não definida.");
            }
            $sql = "INSERT INTO education.subjects (org_id, name, syllabus_summary) VALUES (:oid, :name, :syllabus)";
            $params['oid'] = $data['org_id'];
            $msg = "Disciplina criada!";
        }

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "upsertSubject", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar a disciplina. Contate o suporte.", null, false, 500);
    }
}

function removeSubject($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $stmt = $conect->prepare("UPDATE education.subjects SET deleted = TRUE, is_active = FALSE WHERE subject_id = :id");
        $stmt->execute(['id' => $data['id']]);
        $conect->commit();
        return success("Disciplina removida com sucesso.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "removeSubject", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao remover a disciplina. Contate o suporte.", null, false, 500);
    }
}

function toggleSubjectStatus($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $stmt = $conect->prepare("UPDATE education.subjects SET is_active = :active WHERE subject_id = :id");
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();
        $conect->commit();
        return success("Status atualizado com sucesso.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "toggleSubjectStatus", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao atualizar o status. Contate o suporte.", null, false, 500);
    }
}
