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

        // --- BLOCO PESSOAS ---
        if ($table === 'persons') {
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'people' AND l.table_name = 'person_roles' 
                      AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";

            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'people' AND l.table_name = 'family_ties' 
                      AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
        }

        // --- BLOCO CURSOS ---
        if ($table === 'courses') {
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'education' AND l.table_name = 'curriculum' 
                      AND (l.new_values->>'course_id' = :id OR l.old_values->>'course_id' = :id)";
        }

        // --- BLOCO ORGANIZAÇÕES (NOVO) ---
        if ($table === 'organizations') {
            // Busca alterações em Locais (Salas) vinculados a esta organização
            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'organization' AND l.table_name = 'locations' 
                      AND (l.new_values->>'org_id' = :id OR l.old_values->>'org_id' = :id)";
        }

        $sql .= " ORDER BY changed_at DESC, log_id DESC";

        $stmt = $conectLocal->prepare($sql);
        $stmt->bindValue(':schema', $schema);
        $stmt->bindValue(':table', $table);
        $stmt->bindValue(':id', $recordId);
        $stmt->execute();
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) return success("Nenhum histórico encontrado.", []);

        // --- 2. COLETA DE DADOS PARA TRADUÇÃO ---
        $userIds = [];
        $roleIds = [];
        $subjectIds = [];
        $relativeIds = [];
        $orgIds = []; // [NOVO] IDs de Organizações
        $locationIds = []; // [NOVO] IDs de Locais

        foreach ($logs as $log) {
            if ($log['user_id']) $userIds[] = $log['user_id'];

            $old = json_decode($log['old_values'] ?? '{}', true);
            $new = json_decode($log['new_values'] ?? '{}', true);

            // Pessoas & Parentes
            if ($log['table_name'] === 'person_roles') {
                if (isset($old['role_id'])) $roleIds[] = $old['role_id'];
                if (isset($new['role_id'])) $roleIds[] = $new['role_id'];
            }
            if ($log['table_name'] === 'family_ties') {
                if (isset($old['relative_id'])) $relativeIds[] = $old['relative_id'];
                if (isset($new['relative_id'])) $relativeIds[] = $new['relative_id'];
            }
            // Cursos
            if ($log['table_name'] === 'curriculum') {
                if (isset($old['subject_id'])) $subjectIds[] = $old['subject_id'];
                if (isset($new['subject_id'])) $subjectIds[] = $new['subject_id'];
            }
            // Organizações e Locais [NOVO]
            if ($log['table_name'] === 'locations') {
                // Se o log for de um local, podemos querer saber o nome da org (se mudou de org)
                if (isset($old['org_id'])) $orgIds[] = $old['org_id'];
                if (isset($new['org_id'])) $orgIds[] = $new['org_id'];
            }
            // Se estamos auditando uma turma ou evento que aponta para local
            if (isset($old['location_id'])) $locationIds[] = $old['location_id'];
            if (isset($new['location_id'])) $locationIds[] = $new['location_id'];
        }

        // --- 3. BUSCAS NO BANCO ---
        
        // Usuários
        $usersMap = [];
        if (!empty($userIds)) {
            $uIds = array_unique($userIds);
            $placeholders = implode(',', array_fill(0, count($uIds), '?'));
            $stmtU = $conectStaff->prepare("SELECT id, name FROM public.users WHERE id IN ($placeholders)");
            $stmtU->execute(array_values($uIds));
            while ($row = $stmtU->fetch(PDO::FETCH_ASSOC)) $usersMap[$row['id']] = $row['name'];
        }

        // Parentes (Pessoas)
        $relativesMap = [];
        if (!empty($relativeIds)) {
            $relIds = array_unique($relativeIds);
            $placeholders = implode(',', array_fill(0, count($relIds), '?'));
            $stmtRel = $conectLocal->prepare("SELECT person_id, full_name FROM people.persons WHERE person_id IN ($placeholders)");
            $stmtRel->execute(array_values($relIds));
            while ($row = $stmtRel->fetch(PDO::FETCH_ASSOC)) $relativesMap[$row['person_id']] = $row['full_name'];
        }

        // Cargos
        $rolesMap = [];
        if (!empty($roleIds)) {
            $rIds = array_unique($roleIds);
            $placeholders = implode(',', array_fill(0, count($rIds), '?'));
            $stmtR = $conectLocal->prepare("SELECT role_id, description_pt as nome FROM people.roles WHERE role_id IN ($placeholders)");
            $stmtR->execute(array_values($rIds));
            while ($row = $stmtR->fetch(PDO::FETCH_ASSOC)) $rolesMap[$row['role_id']] = $row['nome'];
        }

        // Disciplinas
        $subjectsMap = [];
        if (!empty($subjectIds)) {
            $sIds = array_unique($subjectIds);
            $placeholders = implode(',', array_fill(0, count($sIds), '?'));
            $stmtS = $conectLocal->prepare("SELECT subject_id, name FROM education.subjects WHERE subject_id IN ($placeholders)");
            $stmtS->execute(array_values($sIds));
            while ($row = $stmtS->fetch(PDO::FETCH_ASSOC)) $subjectsMap[$row['subject_id']] = $row['name'];
        }

        // Organizações [NOVO]
        $orgMap = [];
        if (!empty($orgIds)) {
            $oIds = array_unique($orgIds);
            $placeholders = implode(',', array_fill(0, count($oIds), '?'));
            $stmtO = $conectLocal->prepare("SELECT org_id, display_name FROM organization.organizations WHERE org_id IN ($placeholders)");
            $stmtO->execute(array_values($oIds));
            while ($row = $stmtO->fetch(PDO::FETCH_ASSOC)) $orgMap[$row['org_id']] = $row['display_name'];
        }

        // Locais [NOVO]
        $locMap = [];
        if (!empty($locationIds)) {
            $lIds = array_unique($locationIds);
            $placeholders = implode(',', array_fill(0, count($lIds), '?'));
            $stmtL = $conectLocal->prepare("SELECT location_id, name FROM organization.locations WHERE location_id IN ($placeholders)");
            $stmtL->execute(array_values($lIds));
            while ($row = $stmtL->fetch(PDO::FETCH_ASSOC)) $locMap[$row['location_id']] = $row['name'];
        }

        // --- 4. PROCESSAMENTO E FILTRAGEM ---
        
        $tempRolesAdded = []; 
        $tempRolesRemoved = [];

        foreach ($logs as $index => &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = isset($usersMap[$uid]) ? $usersMap[$uid] : 'Sistema';
            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');
            $log['__exclude'] = false;

            // Tratamento Cargos (Pessoas)
            if ($log['table_name'] === 'person_roles') {
                $old = json_decode($log['old_values'] ?? '{}', true);
                $new = json_decode($log['new_values'] ?? '{}', true);
                $rId = $new['role_id'] ?? $old['role_id'] ?? 0;
                $isSoftDelete = ($log['operation'] === 'UPDATE' && isset($new['deleted']) && $new['deleted'] == true);

                if ($log['operation'] === 'INSERT') $tempRolesAdded[$rId] = $index;
                elseif ($log['operation'] === 'DELETE' || $isSoftDelete) $tempRolesRemoved[$rId] = $index;

                $injectRoleName = function ($jsonStr) use ($rolesMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['role_id']) && isset($rolesMap[$arr['role_id']])) {
                        $arr['vinculo'] = $rolesMap[$arr['role_id']];
                        unset($arr['role_id'], $arr['person_id'], $arr['org_id'], $arr['deleted'], $arr['is_active'], $arr['link_id']);
                    }
                    return json_encode($arr);
                };
                $log['old_values'] = $injectRoleName($log['old_values']);
                $log['new_values'] = $injectRoleName($log['new_values']);
            }

            // Tratamento Família (Pessoas)
            if ($log['table_name'] === 'family_ties') {
                $injectRelativeName = function ($jsonStr) use ($relativesMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['relative_id']) && isset($relativesMap[$arr['relative_id']])) {
                        $arr['relative_name'] = $relativesMap[$arr['relative_id']];
                    }
                    unset($arr['person_id'], $arr['tie_id'], $arr['deleted'], $arr['relative_id']);
                    return json_encode($arr);
                };
                $log['old_values'] = $injectRelativeName($log['old_values']);
                $log['new_values'] = $injectRelativeName($log['new_values']);
            }

            // Tratamento Locais (Organizações) [NOVO]
            if ($log['table_name'] === 'locations') {
                $injectOrgName = function ($jsonStr) use ($orgMap) {
                    if (!$jsonStr) return null;
                    $arr = json_decode($jsonStr, true);
                    if (isset($arr['org_id']) && isset($orgMap[$arr['org_id']])) {
                        $arr['instituicao'] = $orgMap[$arr['org_id']];
                    }
                    unset($arr['org_id'], $arr['location_id'], $arr['deleted']);
                    return json_encode($arr);
                };
                $log['old_values'] = $injectOrgName($log['old_values']);
                $log['new_values'] = $injectOrgName($log['new_values']);
            }

            // Tratamento Grade (Cursos)
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

        // --- 5. FILTRO FINAL (REMOVE ADICIONADO/REMOVIDO NO MESMO SEGUNDO) ---
        foreach ($tempRolesAdded as $rId => $addIndex) {
            if (isset($tempRolesRemoved[$rId])) {
                $remIndex = $tempRolesRemoved[$rId];
                $timeAdd = substr($logs[$addIndex]['changed_at'], 0, 19); 
                $timeRem = substr($logs[$remIndex]['changed_at'], 0, 19);
                
                if ($timeAdd === $timeRem) {
                    $logs[$addIndex]['__exclude'] = true;
                    $logs[$remIndex]['__exclude'] = true;
                }
            }
        }

        $finalLogs = array_filter($logs, function ($l) {
            return !$l['__exclude'];
        });

        return success("Histórico recuperado.", array_values($finalLogs));

    } catch (Exception $e) {
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

        // Mapeamento correto das chaves primárias (ATUALIZADO)
        $pkMap = [
            'organizations' => 'org_id',
            'persons' => 'person_id',
            'users' => 'id',
            'locations' => 'location_id',
            'subjects' => 'subject_id',
            'courses' => 'course_id',
            'classes' => 'class_id',
            'person_roles' => 'link_id',
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
