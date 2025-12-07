<?php

/**
 * Busca o histórico e cruza com o Banco Staff para pegar os nomes
 */
function getHistory($data)
{
    try {
        $conectLocal = $GLOBALS["local"];
        $conectStaff = getStaff();

        if (empty($data['table']) || empty($data['id_record'])) {
            // Em erros de validação simples, podemos retornar a mensagem direta ou genérica, 
            // mas como é erro de "uso" do sistema, vou manter genérica para seguir o padrão estrito.
            throw new Exception("Parâmetros insuficientes (Tabela ou ID faltando).");
        }

        $parts = explode('.', $data['table']);
        $schema = count($parts) === 2 ? $parts[0] : 'public';
        $table = count($parts) === 2 ? $parts[1] : $data['table'];

        // 1. Busca os Logs no Banco Local
        $sql = <<<'SQL'
            SELECT 
                l.log_id,
                l.operation,
                l.user_id,
                l.changed_at,
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

        // 2. Extrai IDs de usuários únicos para buscar no Staff
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

        // 3. Mescla os nomes nos logs e formata data
        foreach ($logs as &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema';

            // Data formatada pelo PHP (Timezone Correto)
            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');
        }

        return success("Histórico recuperado.", $logs);
    } catch (Exception $e) {
        logSystemError("painel", "audit", "getHistory", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao buscar o histórico. Contate o suporte.", null, false, 500);
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

        // 1. Configura Auditoria para o Rollback
        if (!empty($data['id_user'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['id_user']]);
        }

        // 2. Busca o Log Original
        $sqlLog = "SELECT schema_name, table_name, record_id, old_values, operation FROM security.change_logs WHERE log_id = :id";
        $stmt = $conect->prepare($sqlLog);
        $stmt->execute(['id' => $data['log_id']]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$log || empty($log['old_values'])) {
            $conect->rollBack();
            // Erros de lógica de negócio podem ser retornados diretamente ou padronizados.
            // Para manter o padrão estrito, vou logar como erro e dar mensagem genérica, 
            // mas aqui talvez fosse útil saber que "não há dados". Vou manter a mensagem genérica.
            throw new Exception("Tentativa de rollback em registro sem dados antigos.");
        }

        $oldData = json_decode($log['old_values'], true);
        $schema = $log['schema_name'];
        $table = $log['table_name'];
        $recordId = $log['record_id'];

        // 3. Identifica a PK
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
        ];

        $pkColumn = isset($pkMap[$table]) ? $pkMap[$table] : rtrim($table, 's') . "_id";

        // 4. Monta o UPDATE dinamicamente
        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            // Pula a PK e campos de controle
            if ($col === $pkColumn) continue;
            if (in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;

            // [CORREÇÃO] Trata Array/JSON antes de passar para o SQL
            if (is_array($val) || is_object($val)) {
                $val = json_encode($val);
            }

            // [CORREÇÃO] Trata Booleano
            if (is_bool($val)) {
                $val = $val ? 'TRUE' : 'FALSE';
            }

            $setFields[] = "\"$col\" = :$col";
            $params[$col] = $val;
        }

        if (empty($setFields)) {
            $conect->rollBack();
            throw new Exception("Nenhum campo válido encontrado para restauração.");
        }

        // Adiciona updated_at atualizado
        $sqlRestore = "UPDATE \"$schema\".\"$table\" SET " . implode(', ', $setFields) . ", updated_at = CURRENT_TIMESTAMP WHERE \"$pkColumn\" = :pk_val";

        $params['pk_val'] = $recordId;

        $stmtRestore = $conect->prepare($sqlRestore);
        $stmtRestore->execute($params);

        $conect->commit();
        return success("Dados restaurados com sucesso!");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "audit", "rollbackChange", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao restaurar os dados. Contate o suporte.", null, false, 500);
    }
}
