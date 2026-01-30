<?php

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
        $recordId = (string)$data['id_record'];

        // --- 1. QUERY BASE ---
        $sql = "SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                FROM security.change_logs l 
                WHERE l.schema_name = :schema AND l.table_name = :table AND l.record_id = :id";

        // --- 2. LOGICA DE UNION PARA TABELAS RELACIONADAS ---

        if ($table === 'persons') {
            // Vínculos (Person Roles) - Busca pelo person_id dentro do JSON
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'people' AND l.table_name = 'person_roles' 
                      AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";

            // Família (Family Ties)
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'people' AND l.table_name = 'family_ties' 
                      AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
        }

        if ($table === 'courses') {
            // Grade Curricular (Curriculum) - Busca pelo course_id
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'education' AND l.table_name = 'curriculum' 
                      AND (l.new_values->>'course_id' = :id OR l.old_values->>'course_id' = :id)";
        }

        $sql .= " ORDER BY changed_at DESC, log_id DESC";

        $stmt = $conectLocal->prepare($sql);
        $stmt->bindValue(':schema', $schema);
        $stmt->bindValue(':table', $table);
        $stmt->bindValue(':id', $recordId);
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) return success("Nenhum histórico encontrado.", []);

        // --- 3. ENRIQUECIMENTO DE DADOS (IDs -> Nomes) ---
        $userIds = [];
        $roleIds = [];
        $subjectIds = [];

        foreach ($logs as $log) {
            if ($log['user_id']) $userIds[] = $log['user_id'];

            if ($log['table_name'] === 'person_roles') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                if (isset($old['role_id'])) $roleIds[] = $old['role_id'];
                if (isset($new['role_id'])) $roleIds[] = $new['role_id'];
            }

            if ($log['table_name'] === 'curriculum') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                if (isset($old['subject_id'])) $subjectIds[] = $old['subject_id'];
                if (isset($new['subject_id'])) $subjectIds[] = $new['subject_id'];
            }
        }

        // Busca Nomes de Usuários (Banco Staff)
        $usersMap = [];
        if (!empty($userIds)) {
            $uIds = array_unique($userIds);
            $placeholders = implode(',', array_fill(0, count($uIds), '?'));
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN ($placeholders)");
            $stmtU->execute(array_values($uIds));
            while ($row = $stmtU->fetch(PDO::FETCH_ASSOC)) $usersMap[$row['id']] = $row['name'];
        }

        // Busca Nomes de Cargos (Banco Local)
        $rolesMap = [];
        if (!empty($roleIds)) {
            $rIds = array_unique($roleIds);
            $placeholders = implode(',', array_fill(0, count($rIds), '?'));
            $stmtR = $conectLocal->prepare("SELECT role_id, description_pt as nome FROM people.roles WHERE role_id IN ($placeholders)");
            $stmtR->execute(array_values($rIds));
            while ($row = $stmtR->fetch(PDO::FETCH_ASSOC)) $rolesMap[$row['role_id']] = $row['nome'];
        }

        // Busca Nomes de Disciplinas (Banco Local)
        $subjectsMap = [];
        if (!empty($subjectIds)) {
            $sIds = array_unique($subjectIds);
            $placeholders = implode(',', array_fill(0, count($sIds), '?'));
            $stmtS = $conectLocal->prepare("SELECT subject_id, name FROM education.subjects WHERE subject_id IN ($placeholders)");
            $stmtS->execute(array_values($sIds));
            while ($row = $stmtS->fetch(PDO::FETCH_ASSOC)) $subjectsMap[$row['subject_id']] = $row['name'];
        }

        // --- 4. PROCESSAMENTO FINAL DO JSON ---
        foreach ($logs as &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema';
            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');

            // Traduz IDs de Cargo para Nome no JSON (Person Roles)
            if ($log['table_name'] === 'person_roles') {
                $injectRoleName = function ($jsonStr) use ($rolesMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['role_id']) && isset($rolesMap[$arr['role_id']])) {
                        $arr['vinculo'] = $rolesMap[$arr['role_id']];
                    }
                    return json_encode($arr);
                };
                $log['old_values'] = $injectRoleName($log['old_values']);
                $log['new_values'] = $injectRoleName($log['new_values']);
            }

            // Traduz IDs de Disciplina para Nome no JSON (Curriculum)
            if ($log['table_name'] === 'curriculum') {
                $injectSubjectName = function ($jsonStr) use ($subjectsMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['subject_id']) && isset($subjectsMap[$arr['subject_id']])) {
                        $arr['disciplina'] = $subjectsMap[$arr['subject_id']];
                    }
                    return json_encode($arr);
                };
                $log['old_values'] = $injectSubjectName($log['old_values']);
                $log['new_values'] = $injectSubjectName($log['new_values']);
            }
        }

        return success("Histórico recuperado.", $logs);
    } catch (Exception $e) {
        // Log de erro no banco e retorno amigável
        logSystemError("painel", "audit", "getHistory", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar o histórico de alterações.");
    }
}

function rollbackChange($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['id_user'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['id_user']]);
        }

        $sqlLog = "SELECT schema_name, table_name, record_id, old_values FROM security.change_logs WHERE log_id = :id";
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

        if ($table === 'curriculum') {
            $conect->rollBack();
            return failure("Para alterar a grade, edite o curso diretamente.");
        }

        // Mapeamento correto das chaves primárias
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
            'subjects' => 'subject_id',
            'courses' => 'course_id',
            'classes' => 'class_id',
            'person_roles' => 'link_id', // CORREÇÃO: Chave correta da tabela de vínculos
            'family_ties' => 'tie_id'
        ];

        $pkColumn = isset($pkMap[$table]) ? $pkMap[$table] : rtrim($table, 's') . "_id";

        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            if ($col === $pkColumn) continue;
            if (in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;

            if (is_array($val) || is_object($val)) $val = json_encode($val);
            if (is_bool($val)) $val = $val ? 'TRUE' : 'FALSE';

            $setFields[] = "\"$col\" = :$col";
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
        logSystemError("painel", "audit", "rollbackChange", "sql", $e->getMessage(), $data);
        return failure("Erro ao restaurar as alterações.");
    }
}
