<?php

/**
 * Busca o histórico e cruza com dados relacionados
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
        $recordId = (string)$data['id_record'];

        // 1. Query Base (Logs da própria tabela)
        $sql = "SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name 
                FROM security.change_logs l 
                WHERE l.schema_name = :schema AND l.table_name = :table AND l.record_id = :id";

        // 2. Lógica Especial para CURSOS (Busca também a Grade Curricular)
        if ($table === 'courses') {
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'education' AND l.table_name = 'curriculum' 
                      AND (l.new_values->>'course_id' = :id OR l.old_values->>'course_id' = :id)";
        }

        $sql .= " ORDER BY changed_at DESC";

        $stmt = $conectLocal->prepare($sql);
        $stmt->bindValue(':schema', $schema);
        $stmt->bindValue(':table', $table);
        $stmt->bindValue(':id', $recordId);
        $stmt->execute();

        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) {
            return success("Nenhum histórico encontrado.", []);
        }

        // --- ENRIQUECIMENTO DE DADOS (NOMES) ---

        $userIds = [];
        $subjectIds = [];

        foreach ($logs as $log) {
            if ($log['user_id']) $userIds[] = $log['user_id'];

            // Se for log de curriculum, cata o subject_id para traduzir
            if ($log['table_name'] === 'curriculum') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                if (isset($old['subject_id'])) $subjectIds[] = $old['subject_id'];
                if (isset($new['subject_id'])) $subjectIds[] = $new['subject_id'];
            }
        }

        // Busca Nomes de Usuários (Staff)
        $usersMap = [];
        if (!empty($userIds)) {
            $uIds = array_unique($userIds);
            $placeholders = implode(',', array_fill(0, count($uIds), '?'));
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN ($placeholders)");
            $stmtU->execute(array_values($uIds));
            while ($row = $stmtU->fetch(PDO::FETCH_ASSOC)) $usersMap[$row['id']] = $row['name'];
        }

        // Busca Nomes de Disciplinas (Local) - Para trocar ID por Nome
        $subjectsMap = [];
        if (!empty($subjectIds)) {
            $sIds = array_unique($subjectIds);
            $placeholders = implode(',', array_fill(0, count($sIds), '?'));
            $stmtS = $conectLocal->prepare("SELECT subject_id, name FROM education.subjects WHERE subject_id IN ($placeholders)");
            $stmtS->execute(array_values($sIds));
            while ($row = $stmtS->fetch(PDO::FETCH_ASSOC)) $subjectsMap[$row['subject_id']] = $row['name'];
        }

        // Processamento Final
        foreach ($logs as &$log) {
            // 1. Nome do Usuário
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema';

            // 2. Data Formatada
            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');

            // 3. Tradução de IDs técnicos para Nomes (Ex: subject_id: 1 -> subject_id: "Bíblia")
            if ($log['table_name'] === 'curriculum') {
                $log['operation'] = 'GRADE ' . $log['operation']; // Marca visualmente como alteração de grade

                $replaceSubject = function ($jsonStr) use ($subjectsMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['subject_id']) && isset($subjectsMap[$arr['subject_id']])) {
                        // Cria um campo virtual legível
                        $arr['disciplina'] = $subjectsMap[$arr['subject_id']];
                        unset($arr['subject_id']); // Remove o ID técnico
                        unset($arr['course_id']);  // Remove o ID do curso (redundante)
                    }
                    return json_encode($arr);
                };

                $log['old_values'] = $replaceSubject($log['old_values']);
                $log['new_values'] = $replaceSubject($log['new_values']);
            }
        }

        return success("Histórico recuperado.", $logs);
    } catch (Exception $e) {
        return failure("Erro ao buscar histórico: " . $e->getMessage());
    }
}

// Função rollbackChange MANTIDA IGUAL (Não precisa mexer nela)
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

        // Se for rollback de Grade Curricular, o processo é diferente (Insert/Delete)
        // Para simplificar e evitar erros de integridade em chaves compostas, 
        // vamos BLOQUEAR rollback direto na grade via botão individual e sugerir edição manual.
        // Ou, para funcionar, precisamos tratar INSERT como DELETE e vice-versa.

        if ($table === 'curriculum') {
            $conect->rollBack();
            return failure("Para alterar a grade, edite o curso diretamente.");
        }

        // Mapa de PKs
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
            'subjects' => 'subject_id',
            'courses' => 'course_id',
            'classes' => 'class_id'
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
        return failure("Erro ao restaurar: " . $e->getMessage());
    }
}
