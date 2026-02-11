<?php

function getAllEventsF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];
        $year = (int)$data['year'];

        $params = [
            ':limit' => (int)$data['limit'],
            ':offset' => (int)$data['page'],
            ':oid' => $orgId
        ];

        $where = "WHERE org_id = :oid AND deleted IS FALSE";

        // Filtro de Texto
        if (!empty($data['search'])) {
            $where .= " AND (title ILIKE :search OR description ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        // Filtro de Ano (Obrigatório para não misturar agendas)
        if ($year > 0) {
            $where .= " AND EXTRACT(YEAR FROM event_date) = :year";
            $params[':year'] = $year;
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                event_id,
                title,
                description,
                TO_CHAR(event_date, 'DD/MM/YYYY') as date_fmt,
                event_date,
                TO_CHAR(start_time, 'HH24:MI') as start_time,
                TO_CHAR(end_time, 'HH24:MI') as end_time,
                is_academic_blocker
            FROM organization.events
            $where
            ORDER BY event_date ASC
            LIMIT :limit OFFSET :offset
        SQL;

        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($key, $val, $type);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) {
            $row['is_academic_blocker'] = ($row['is_academic_blocker'] === true || $row['is_academic_blocker'] === 't');
        }

        return success("Eventos listados.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "organization", "getAllEvents", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar eventos.");
    }
}

function getEventDataF($id)
{
    // ... (Mantém inalterado, pois busca por ID primário) ...
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT * FROM organization.events WHERE event_id = :id AND deleted IS FALSE LIMIT 1";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $id]);
        $event = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) return failure("Evento não encontrado.");
        return success("Dados carregados.", $event);
    } catch (Exception $e) {
        return failure("Erro ao carregar evento.");
    }
}

function upsertEventF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $params = [
            'title' => $data['title'],
            'desc' => $data['description'] ?? null,
            'dt' => $data['event_date'],
            'st' => !empty($data['start_time']) ? $data['start_time'] : null,
            'et' => !empty($data['end_time']) ? $data['end_time'] : null,
            'block' => ($data['is_academic_blocker'] === 'true' || $data['is_academic_blocker'] === true) ? 'TRUE' : 'FALSE'
        ];

        if (!empty($data['event_id'])) {
            // UPDATE
            $sql = "UPDATE organization.events 
                    SET title=:title, description=:desc, event_date=:dt, start_time=:st, end_time=:et, is_academic_blocker=:block, updated_at=CURRENT_TIMESTAMP 
                    WHERE event_id=:id";
            $params['id'] = $data['event_id'];
            $msg = "Evento atualizado com sucesso!";
        } else {
            // INSERT (Usa org_id do contexto)
            if (empty($data['org_id'])) {
                $conect->rollBack();
                return failure("Erro: Organização não identificada.");
            }
            $params['org_id'] = $data['org_id'];
            $sql = "INSERT INTO organization.events (org_id, title, description, event_date, start_time, end_time, is_academic_blocker) 
                    VALUES (:org_id, :title, :desc, :dt, :st, :et, :block)";
            $msg = "Evento criado com sucesso!";
        }

        $conect->prepare($sql)->execute($params);
        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "upsertEvent", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar evento.");
    }
}

function removeEventF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.events SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE event_id = :id";
        $conect->prepare($sql)->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Evento removido.");
    } catch (Exception $e) {
        $conect->rollBack();
        return failure("Erro ao excluir evento.");
    }
}

function toggleEventBlockerF($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.events SET is_academic_blocker = :block, updated_at = CURRENT_TIMESTAMP WHERE event_id = :id";
        $status = ($data['is_blocker'] === 'true' || $data['is_blocker'] === true) ? 'TRUE' : 'FALSE';

        $conect->prepare($sql)->execute([
            'block' => $status,
            'id' => $data['id']
        ]);

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        return failure("Erro ao atualizar status.");
    }
}
