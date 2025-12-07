<?php

/**
 * Busca o histórico
 */
function getHistory($data)
{
    try {
        $conectLocal = $GLOBALS["local"];
        $conectStaff = getStaff();

        if (empty($data['table']) || empty($data['id_record'])) {
            return failure("Parâmetros insuficientes.");
        }

        $parts = explode('.', $data['table']);
        $schema = count($parts) === 2 ? $parts[0] : 'public';
        $table = count($parts) === 2 ? $parts[1] : $data['table'];

        $sql = <<<'SQL'
            SELECT 
                l.log_id,
                l.operation,
                l.user_id,
                TO_CHAR(l.changed_at, 'DD/MM/YYYY HH24:MI:SS') as date_fmt,
                l.old_values,
                l.new_values
            FROM security.change_logs l
            WHERE l.schema_name = :schema
              AND l.table_name = :table 
              AND l.record_id = :id
            ORDER BY l.changed_at DESC
        SQL;

        $stmt = $conectLocal->prepare($sql);
        $stmt->bindValue(':schema', $schema);
        $stmt->bindValue(':table', $table);
        $stmt->bindValue(':id', (string)$data['id_record']);
        $stmt->execute();

        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) {
            return success("Nenhum histórico encontrado.", []);
        }

        $userIds = array_unique(array_column($logs, 'user_id'));
        $usersMap = [];

        if (!empty($userIds)) {
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));
            $sqlUsers = "SELECT id, name FROM public.users WHERE id IN ($placeholders)";
            $stmtUsers = $conectStaff->prepare($sqlUsers);
            $stmtUsers->execute(array_values($userIds));
            while ($row = $stmtUsers->fetch(PDO::FETCH_ASSOC)) {
                $usersMap[$row['id']] = $row['name'];
            }
        }

        foreach ($logs as &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema / Desconhecido';
        }

        return success("Histórico recuperado.", $logs);
    } catch (Exception $e) {
        return failure("Erro ao buscar histórico: " . $e->getMessage());
    }
}

/**
 * Realiza o Rollback (Desfazer)
 */
function rollbackChange($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['id_user'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['id_user']]);
        }

        $sqlLog = "SELECT schema_name, table_name, record_id, old_values, operation FROM security.change_logs WHERE log_id = :id";
        $stmt = $conect->prepare($sqlLog);
        $stmt->execute(['id' => $data['log_id']]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$log || empty($log['old_values'])) {
            $conect->rollBack();
            return failure("Não há dados anteriores para restaurar.");
        }

        $oldData = json_decode($log['old_values'], true);
        $schema = $log['schema_name'];
        $table = $log['table_name'];
        $recordId = $log['record_id'];

        // === CORREÇÃO DO ERRO SQL ===
        // Mapa manual de Chaves Primárias para tabelas que fogem do padrão
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
            // Adicione outras exceções aqui conforme criar tabelas novas
        ];

        if (isset($pkMap[$table])) {
            $pkColumn = $pkMap[$table];
        } else {
            // Tentativa automática (padrão): nome da tabela no singular + _id
            // ex: courses -> course_id
            $pkColumn = rtrim($table, 's') . "_id";
        }

        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            if ($col === $pkColumn) continue;
            if (in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;

            $setFields[] = "\"$col\" = :$col";

            // Tratamento de booleano
            if (is_bool($val)) {
                $val = $val ? 'TRUE' : 'FALSE';
            }

            $params[$col] = $val;
        }

        if (empty($setFields)) {
            $conect->rollBack();
            return failure("Nenhum dado válido para restaurar.");
        }

        $sqlRestore = "UPDATE \"$schema\".\"$table\" SET " . implode(', ', $setFields) . ", updated_at = CURRENT_TIMESTAMP WHERE \"$pkColumn\" = :pk_val";

        $params['pk_val'] = $recordId;

        $stmtRestore = $conect->prepare($sqlRestore);
        $stmtRestore->execute($params);

        $conect->commit();
        return success("Dados restaurados com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        // Retorna o erro detalhado para facilitar debug, mas em produção pode simplificar
        return failure("Erro ao restaurar: " . $e->getMessage());
    }
}
