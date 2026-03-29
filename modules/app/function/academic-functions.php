<?php

function getAllPhases($data)
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
                phase_id,
                name,
                syllabus_summary,
                is_active
            FROM education.phases
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

        return success("Fases listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getAllPhases", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao listar as fases. Contate o suporte.", null, false, 500);
    }
}

function getPhaseData($id)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = <<<SQL
            SELECT
                *
            FROM
                education.phases
            WHERE
                phase_id = :id
                AND deleted IS FALSE
            ORDER BY name ASC
            LIMIT 1
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$res) return failure("Fase não encontrada.");
        return success("Dados carregados.", $res);
    } catch (Exception $e) {
        logSystemError("painel", "education", "getPhaseData", "sql", $e->getMessage(), ['id' => $id]);
        return failure("Ocorreu um erro ao buscar os dados. Contate o suporte.", null, false, 500);
    }
}

function upsertPhase($data)
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

        if (!empty($data['phase_id'])) {
            $sql = "UPDATE education.phases SET name=:name, syllabus_summary=:syllabus, updated_at=CURRENT_TIMESTAMP WHERE phase_id=:id";
            $params['id'] = $data['phase_id'];
            $msg = "Fase atualizada!";
        } else {
            if (empty($data['org_id'])) {
                $conect->rollBack();
                return failure("Organização não definida.");
            }
            $sql = "INSERT INTO education.phases (org_id, name, syllabus_summary) VALUES (:oid, :name, :syllabus)";
            $params['oid'] = $data['org_id'];
            $msg = "Fase criada!";
        }

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "upsertPhase", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar a fase. Contate o suporte.", null, false, 500);
    }
}

function removePhase($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $stmt = $conect->prepare("UPDATE education.phases SET deleted = TRUE, is_active = FALSE WHERE phase_id = :id");
        $stmt->execute(['id' => $data['id']]);
        $conect->commit();
        return success("Fase removida com sucesso.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "removePhase", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao remover a fase. Contate o suporte.", null, false, 500);
    }
}

function togglePhaseStatus($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $stmt = $conect->prepare("UPDATE education.phases SET is_active = :active WHERE phase_id = :id");
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();
        $conect->commit();
        return success("Status atualizado com sucesso.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "education", "togglePhaseStatus", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao atualizar o status. Contate o suporte.", null, false, 500);
    }
}
