<?php

/**
 * Busca o histórico e cruza com o Banco Staff para pegar os nomes
 */
function getHistory($data)
{
    try {
        $conectLocal = $GLOBALS["local"];
        $conectStaff = getStaff(); // Garante conexão com o Staff

        if (empty($data['table']) || empty($data['id_record'])) {
            return failure("Parâmetros insuficientes.");
        }

        // Separa Schema.Tabela
        $parts = explode('.', $data['table']);
        $schema = count($parts) === 2 ? $parts[0] : 'public';
        $table = count($parts) === 2 ? $parts[1] : $data['table'];

        // 1. Busca os Logs no Banco Local
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

        // 2. Extrai IDs de usuários únicos para buscar no Staff
        $userIds = array_unique(array_column($logs, 'user_id'));
        $usersMap = [];

        if (!empty($userIds)) {
            // Cria placeholders (?,?,?) para o IN
            $placeholders = implode(',', array_fill(0, count($userIds), '?'));

            $sqlUsers = "SELECT id, name FROM public.users WHERE id IN ($placeholders)";
            $stmtUsers = $conectStaff->prepare($sqlUsers);
            $stmtUsers->execute(array_values($userIds)); // Passa os IDs como array indexado

            // Cria mapa: [1 => 'Eike', 2 => 'João']
            while ($row = $stmtUsers->fetch(PDO::FETCH_ASSOC)) {
                $usersMap[$row['id']] = $row['name'];
            }
        }

        // 3. Mescla os nomes nos logs
        foreach ($logs as &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Usuário Desconhecido';
        }

        return success("Histórico recuperado.", $logs);
    } catch (Exception $e) {
        // Usa log do sistema (se disponível) ou retorna erro
        // logSystemError(...)
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

        // 1. Configura Auditoria para o Rollback (Quem está desfazendo?)
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
            return failure("Não há dados anteriores para restaurar.");
        }

        $oldData = json_decode($log['old_values'], true);
        $schema = $log['schema_name'];
        $table = $log['table_name'];
        $recordId = $log['record_id'];

        // 3. Identifica a PK de forma inteligente
        // Tenta remover o 's' final (organizations -> org_id)
        // Se falhar, você pode adicionar exceções manuais aqui
        $pkColumn = rtrim($table, 's') . "_id";

        // Exceções conhecidas (caso seus nomes de tabela sejam irregulares)
        if ($table === 'people') $pkColumn = 'person_id';
        if ($table === 'users') $pkColumn = 'id';

        // 4. Monta o UPDATE dinamicamente
        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            // Pula a PK (não alteramos o ID)
            if ($col === $pkColumn) continue;

            // Pula campos de controle que devem ser atuais
            if (in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;

            $setFields[] = "\"$col\" = :$col"; // Aspas protegem nomes reservados

            // Tratamento especial para Booleanos no PostgreSQL (evita erro de tipo)
            if (is_bool($val)) {
                $val = $val ? 'TRUE' : 'FALSE';
            }

            $params[$col] = $val;
        }

        if (empty($setFields)) {
            $conect->rollBack();
            return failure("Nenhum dado válido para restaurar.");
        }

        // Adiciona updated_at atualizado
        $sqlRestore = "UPDATE \"$schema\".\"$table\" SET " . implode(', ', $setFields) . ", updated_at = CURRENT_TIMESTAMP WHERE \"$pkColumn\" = :pk_val";

        $params['pk_val'] = $recordId;

        $stmtRestore = $conect->prepare($sqlRestore);
        $stmtRestore->execute($params);

        $conect->commit();
        return success("Dados restaurados para a versão selecionada.");
    } catch (Exception $e) {
        $conect->rollBack();
        return failure("Erro ao restaurar: " . $e->getMessage());
    }
}
