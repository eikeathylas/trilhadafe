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

        // --- BLOCOS DE UNION (Filhos) ---
        // Pessoas (Cargos e Família)
        if ($table === 'persons') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'people' AND l.table_name = 'person_roles' AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'people' AND l.table_name = 'family_ties' AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
        }
        // Cursos (Grade)
        if ($table === 'courses') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'education' AND l.table_name = 'curriculum' AND (l.new_values->>'course_id' = :id OR l.old_values->>'course_id' = :id)";
        }
        // Instituições (Locais)
        if ($table === 'organizations') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'organization' AND l.table_name = 'locations' AND (l.new_values->>'org_id' = :id OR l.old_values->>'org_id' = :id)";
        }
        // Diário (Presença) - Traz logs de presença ao abrir o log da aula
        if ($table === 'class_sessions') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'education' AND l.table_name = 'attendance' AND (l.new_values->>'session_id' = :id OR l.old_values->>'session_id' = :id)";
        }

        $sql .= " ORDER BY changed_at DESC, log_id DESC";

        $stmt = $conectLocal->prepare($sql);
        $stmt->execute([':schema' => $schema, ':table' => $table, ':id' => $recordId]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) return success("Nenhum histórico encontrado.", []);

        // --- 2. COLETA DE IDs (Para tradução) ---
        $userIds = [];
        $roleIds = [];
        $subjectIds = [];
        $peopleIds = [];
        $orgIds = [];

        foreach ($logs as $log) {
            if ($log['user_id']) $userIds[] = $log['user_id'];
            $old = json_decode($log['old_values'] ?? '{}', true);
            $new = json_decode($log['new_values'] ?? '{}', true);

            // TURMAS
            if ($log['table_name'] === 'classes') {
                if (!empty($old['coordinator_id'])) $peopleIds[] = $old['coordinator_id'];
                if (!empty($new['coordinator_id'])) $peopleIds[] = $new['coordinator_id'];
                if (!empty($old['class_assistant_id'])) $peopleIds[] = $old['class_assistant_id'];
                if (!empty($new['class_assistant_id'])) $peopleIds[] = $new['class_assistant_id'];
            }
            // CARGOS
            if ($log['table_name'] === 'person_roles') {
                if (!empty($old['role_id'])) $roleIds[] = $old['role_id'];
                if (!empty($new['role_id'])) $roleIds[] = $new['role_id'];
            }
            // FAMILIA / PRESENÇA (Aluno)
            if ($log['table_name'] === 'family_ties' || $log['table_name'] === 'attendance') {
                if (!empty($old['relative_id'])) $peopleIds[] = $old['relative_id'];
                if (!empty($new['relative_id'])) $peopleIds[] = $new['relative_id'];
                if (!empty($old['student_id'])) $peopleIds[] = $old['student_id'];
                if (!empty($new['student_id'])) $peopleIds[] = $new['student_id'];
            }
            // CURSO/GRADE e DIÁRIO (Disciplina)
            if ($log['table_name'] === 'curriculum' || $log['table_name'] === 'class_sessions') {
                if (!empty($old['subject_id'])) $subjectIds[] = $old['subject_id'];
                if (!empty($new['subject_id'])) $subjectIds[] = $new['subject_id'];
            }
            // LOCAIS
            if ($log['table_name'] === 'locations') {
                if (!empty($old['org_id'])) $orgIds[] = $old['org_id'];
                if (!empty($new['org_id'])) $orgIds[] = $new['org_id'];
            }
        }

        // --- 3. BUSCAS NO BANCO (MAPS) ---
        $usersMap = [];
        if (!empty($userIds)) {
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN (" . implode(',', array_unique($userIds)) . ")");
            $stmtU->execute();
            while ($row = $stmtU->fetch(PDO::FETCH_ASSOC)) $usersMap[$row['id']] = $row['name'];
        }
        $rolesMap = [];
        if (!empty($roleIds)) {
            $stmtR = $conectLocal->prepare("SELECT role_id, description_pt as nome FROM people.roles WHERE role_id IN (" . implode(',', array_unique($roleIds)) . ")");
            $stmtR->execute();
            while ($row = $stmtR->fetch(PDO::FETCH_ASSOC)) $rolesMap[$row['role_id']] = $row['nome'];
        }
        $peopleMap = [];
        if (!empty($peopleIds)) {
            $stmtP = $conectLocal->prepare("SELECT person_id, full_name FROM people.persons WHERE person_id IN (" . implode(',', array_unique($peopleIds)) . ")");
            $stmtP->execute();
            while ($row = $stmtP->fetch(PDO::FETCH_ASSOC)) $peopleMap[$row['person_id']] = $row['full_name'];
        }
        $subjectsMap = [];
        if (!empty($subjectIds)) {
            $stmtS = $conectLocal->prepare("SELECT subject_id, name FROM education.subjects WHERE subject_id IN (" . implode(',', array_unique($subjectIds)) . ")");
            $stmtS->execute();
            while ($row = $stmtS->fetch(PDO::FETCH_ASSOC)) $subjectsMap[$row['subject_id']] = $row['name'];
        }
        $orgMap = [];
        if (!empty($orgIds)) {
            $stmtO = $conectLocal->prepare("SELECT org_id, display_name FROM organization.organizations WHERE org_id IN (" . implode(',', array_unique($orgIds)) . ")");
            $stmtO->execute();
            while ($row = $stmtO->fetch(PDO::FETCH_ASSOC)) $orgMap[$row['org_id']] = $row['display_name'];
        }

        // --- 4. PROCESSAMENTO E FILTRAGEM ---
        $tempAdded = [];
        $tempRemoved = [];

        foreach ($logs as $index => &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema';
            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');
            $log['target_name'] = ""; // Título do Card no Modal
            $log['__exclude'] = false;

            // --- INJEÇÃO EM TURMAS ---
            if ($log['table_name'] === 'classes') {
                $injectNames = function ($j) use ($peopleMap) {
                    $a = json_decode($j, true);
                    if (!empty($a['coordinator_id']) && isset($peopleMap[$a['coordinator_id']])) $a['coordinator_id'] = $peopleMap[$a['coordinator_id']];
                    if (!empty($a['class_assistant_id']) && isset($peopleMap[$a['class_assistant_id']])) $a['class_assistant_id'] = $peopleMap[$a['class_assistant_id']];
                    return json_encode($a);
                };
                $log['old_values'] = $injectNames($log['old_values']);
                $log['new_values'] = $injectNames($log['new_values']);
            }

            // --- CARGOS ---
            if ($log['table_name'] === 'person_roles') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                $rId = $new['role_id'] ?? $old['role_id'] ?? 0;

                if ($rId && isset($rolesMap[$rId])) {
                    $log['target_name'] = $rolesMap[$rId];
                }

                if ($log['operation'] === 'INSERT') $tempAdded['r' . $rId] = $index;
                elseif ($log['operation'] === 'DELETE') $tempRemoved['r' . $rId] = $index;

                $inject = function ($j) use ($rolesMap) {
                    $a = json_decode($j, true);
                    if (isset($a['role_id']) && isset($rolesMap[$a['role_id']])) $a['vinculo'] = $rolesMap[$a['role_id']];
                    if (is_array($a)) unset($a['role_id'], $a['person_id'], $a['org_id'], $a['link_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- DIÁRIO / SESSÕES ---
            if ($log['table_name'] === 'class_sessions') {
                $log['target_name'] = "Dados da Aula";
                $inject = function ($j) use ($subjectsMap) {
                    $a = json_decode($j, true);
                    if (isset($a['subject_id']) && isset($subjectsMap[$a['subject_id']])) {
                        $a['disciplina'] = $subjectsMap[$a['subject_id']];
                    }
                    if (is_array($a)) unset($a['subject_id'], $a['class_id'], $a['signed_by_user_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- PRESENÇA (ATTENDANCE) ---
            if ($log['table_name'] === 'attendance') {
                // Recupera ID do aluno para definir o Título do Card
                $oldArr = json_decode($log['old_values'] ?? '{}', true);
                $newArr = json_decode($log['new_values'] ?? '{}', true);
                $sid = $newArr['student_id'] ?? $oldArr['student_id'];

                if ($sid && isset($peopleMap[$sid])) {
                    $log['target_name'] = $peopleMap[$sid];
                } else {
                    $log['target_name'] = "Aluno (ID $sid)";
                }

                $inject = function ($j) use ($peopleMap) {
                    $a = json_decode($j, true);
                    // Remove IDs técnicos para limpar a visualização
                    if (is_array($a)) unset($a['student_id'], $a['session_id'], $a['attendance_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- GRADE CURRICULAR ---
            if ($log['table_name'] === 'curriculum') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                $sId = $new['subject_id'] ?? $old['subject_id'] ?? 0;

                if ($log['operation'] === 'INSERT') $tempAdded['s' . $sId] = $index;
                if ($log['operation'] === 'DELETE') $tempRemoved['s' . $sId] = $index;

                $inject = function ($j) use ($subjectsMap) {
                    $a = json_decode($j, true);
                    if (isset($a['subject_id']) && isset($subjectsMap[$a['subject_id']])) $a['disciplina'] = $subjectsMap[$a['subject_id']];
                    if (is_array($a)) unset($a['subject_id'], $a['course_id'], $a['curriculum_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- FAMÍLIA ---
            if ($log['table_name'] === 'family_ties') {
                $inject = function ($j) use ($peopleMap) {
                    $a = json_decode($j, true);
                    if (isset($a['relative_id']) && isset($peopleMap[$a['relative_id']])) $a['relative_name'] = $peopleMap[$a['relative_id']];
                    if (is_array($a)) unset($a['person_id'], $a['tie_id'], $a['relative_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- LOCAIS ---
            if ($log['table_name'] === 'locations') {
                $inject = function ($j) use ($orgMap) {
                    $a = json_decode($j, true);
                    if (isset($a['org_id']) && isset($orgMap[$a['org_id']])) $a['instituicao'] = $orgMap[$a['org_id']];
                    if (is_array($a)) unset($a['org_id'], $a['location_id']);
                    return json_encode($a);
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }
        }

        // --- 5. FILTRAGEM FINAL ---
        foreach ($tempAdded as $key => $addIndex) {
            if (isset($tempRemoved[$key])) {
                $remIndex = $tempRemoved[$key];
                $logAdd = $logs[$addIndex];
                $logRem = $logs[$remIndex];

                if (substr($logAdd['changed_at'], 0, 19) === substr($logRem['changed_at'], 0, 19)) {
                    if (strpos($key, 'r') === 0 || (strpos($key, 's') === 0 && $logAdd['new_values'] === $logRem['old_values'])) {
                        $logs[$addIndex]['__exclude'] = true;
                        $logs[$remIndex]['__exclude'] = true;
                    }
                }
            }
        }

        $finalLogs = array_filter($logs, function ($l) {
            return !$l['__exclude'];
        });

        return success("Histórico recuperado.", array_values($finalLogs));
    } catch (Exception $e) {
        logSystemError("painel", "audit", "getHistory", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar o histórico.");
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

        // PK Map - Mapeia tabelas para suas Primary Keys
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
            'subjects' => 'subject_id',
            'courses' => 'course_id',
            'classes' => 'class_id',
            'class_sessions' => 'session_id',
            'attendance' => 'attendance_id',
            'person_roles' => 'link_id',
            'family_ties' => 'tie_id'
        ];

        $pkColumn = isset($pkMap[$table]) ? $pkMap[$table] : rtrim($table, 's') . "_id";
        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            if ($col === $pkColumn) continue;
            if (in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;
            // Ignora campos injetados visualmente
            if (in_array($col, ['vinculo', 'relative_name', 'disciplina', 'instituicao', 'aluno', 'aluno_nome'])) continue;

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
