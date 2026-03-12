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

        // --- 1. QUERY BASE (Registro Principal) ---
        $sql = "SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                FROM security.change_logs l 
                WHERE l.schema_name = :schema AND l.table_name = :table AND l.record_id = :id";

        // --- 2. UNIONS (Relacionamentos) ---
        if ($table === 'persons') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'people' AND l.table_name = 'person_roles' AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'people' AND l.table_name = 'family_ties' AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'people' AND l.table_name = 'person_attachments' AND (l.new_values->>'person_id' = :id OR l.old_values->>'person_id' = :id)";
        } elseif ($table === 'courses') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'education' AND l.table_name = 'curriculum' 
                      AND (l.new_values->>'course_id' = :id OR l.old_values->>'course_id' = :id)";

            $sql .= " UNION ALL 
                      SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name 
                      FROM security.change_logs l 
                      WHERE l.schema_name = 'education' AND l.table_name = 'curriculum_plans' 
                      AND (
                          l.new_values->>'curriculum_id' IN (SELECT CAST(curriculum_id AS TEXT) FROM education.curriculum WHERE course_id = CAST(:id AS INTEGER))
                          OR
                          l.old_values->>'curriculum_id' IN (SELECT CAST(curriculum_id AS TEXT) FROM education.curriculum WHERE course_id = CAST(:id AS INTEGER))
                      )";
        } elseif ($table === 'organizations') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'organization' AND l.table_name = 'locations' AND (l.new_values->>'org_id' = :id OR l.old_values->>'org_id' = :id)";
        } elseif ($table === 'class_sessions') {
            $sql .= " UNION ALL SELECT l.log_id, l.operation, l.user_id, l.changed_at, l.old_values, l.new_values, l.table_name, l.schema_name FROM security.change_logs l WHERE l.schema_name = 'education' AND l.table_name = 'attendance' AND (l.new_values->>'session_id' = :id OR l.old_values->>'session_id' = :id)";
        }

        $sql .= " ORDER BY changed_at DESC, log_id DESC";

        $stmt = $conectLocal->prepare($sql);
        $stmt->execute([':schema' => $schema, ':table' => $table, ':id' => $recordId]);
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($logs)) return success("Nenhum histórico encontrado.", []);

        // --- 3. COLETA DE DADOS AUXILIARES (Batch Querying) ---
        $userIds = $roleIds = $subjectIds = $peopleIds = $orgIds = [];

        foreach ($logs as $log) {
            if ($log['user_id']) $userIds[] = $log['user_id'];

            // Decodificação segura com Null Coalescing e supressão de nulos puros
            $old = !empty($log['old_values']) ? json_decode($log['old_values'], true) : [];
            $new = !empty($log['new_values']) ? json_decode($log['new_values'], true) : [];

            if ($log['table_name'] === 'classes') {
                if (!empty($old['coordinator_id'])) $peopleIds[] = $old['coordinator_id'];
                if (!empty($new['coordinator_id'])) $peopleIds[] = $new['coordinator_id'];
                if (!empty($old['class_assistant_id'])) $peopleIds[] = $old['class_assistant_id'];
                if (!empty($new['class_assistant_id'])) $peopleIds[] = $new['class_assistant_id'];
            } elseif ($log['table_name'] === 'person_roles') {
                if (!empty($old['role_id'])) $roleIds[] = $old['role_id'];
                if (!empty($new['role_id'])) $roleIds[] = $new['role_id'];
            } elseif (in_array($log['table_name'], ['family_ties', 'attendance'])) {
                if (!empty($old['relative_id'])) $peopleIds[] = $old['relative_id'];
                if (!empty($new['relative_id'])) $peopleIds[] = $new['relative_id'];
                if (!empty($old['student_id'])) $peopleIds[] = $old['student_id'];
                if (!empty($new['student_id'])) $peopleIds[] = $new['student_id'];
            } elseif (in_array($log['table_name'], ['curriculum', 'class_sessions'])) {
                if (!empty($old['subject_id'])) $subjectIds[] = $old['subject_id'];
                if (!empty($new['subject_id'])) $subjectIds[] = $new['subject_id'];
            } elseif ($log['table_name'] === 'locations') {
                if (!empty($old['org_id'])) $orgIds[] = $old['org_id'];
                if (!empty($new['org_id'])) $orgIds[] = $new['org_id'];
            }
        }

        // Helpers para buscar em lote
        $usersMap    = !empty($userIds) ? fetchMap($conectStaff, "SELECT id, name FROM public.users WHERE id IN (" . implode(',', array_unique($userIds)) . ")", 'id', 'name') : [];
        $rolesMap    = !empty($roleIds) ? fetchMap($conectLocal, "SELECT role_id, description_pt as nome FROM people.roles WHERE role_id IN (" . implode(',', array_unique($roleIds)) . ")", 'role_id', 'nome') : [];
        $peopleMap   = !empty($peopleIds) ? fetchMap($conectLocal, "SELECT person_id, full_name FROM people.persons WHERE person_id IN (" . implode(',', array_unique($peopleIds)) . ")", 'person_id', 'full_name') : [];
        $subjectsMap = !empty($subjectIds) ? fetchMap($conectLocal, "SELECT subject_id, name FROM education.subjects WHERE subject_id IN (" . implode(',', array_unique($subjectIds)) . ")", 'subject_id', 'name') : [];
        $orgMap      = !empty($orgIds) ? fetchMap($conectLocal, "SELECT org_id, display_name FROM organization.organizations WHERE org_id IN (" . implode(',', array_unique($orgIds)) . ")", 'org_id', 'display_name') : [];

        // --- 4. PROCESSAMENTO E NORMALIZAÇÃO ---
        $tempAdded = [];
        $tempRemoved = [];

        foreach ($logs as $index => &$log) {
            $uid = $log['user_id'];
            $log['user_name'] = $usersMap[$uid] ?? 'Sistema';

            $date = new DateTime($log['changed_at']);
            $log['date_fmt'] = $date->format('d/m/Y H:i:s');
            $log['target_name'] = "";
            $log['__exclude'] = false;

            // Arrays pré-decodificados para facilitar validações de título (seguros contra null)
            $oldArr = !empty($log['old_values']) ? json_decode($log['old_values'], true) : [];
            $newArr = !empty($log['new_values']) ? json_decode($log['new_values'], true) : [];

            // --- PLANOS DE AULA ---
            if ($log['table_name'] === 'curriculum_plans') {
                $meetingNum = $newArr['meeting_number'] ?? $oldArr['meeting_number'] ?? '?';
                $title = $newArr['title'] ?? $oldArr['title'] ?? "Encontro $meetingNum";
                $log['target_name'] = "Plano: " . $title;

                $cleanContent = function ($vals) {
                    if (empty($vals)) return null;
                    $arr = json_decode($vals, true);
                    if (is_array($arr)) {
                        if (isset($arr['content'])) $arr['content'] = empty($arr['content']) ? "[Vazio]" : "[Conteúdo HTML atualizado]";
                        unset($arr['curriculum_id'], $arr['plan_id'], $arr['created_at']);
                        return json_encode($arr);
                    }
                    return $vals;
                };
                $log['old_values'] = $cleanContent($log['old_values']);
                $log['new_values'] = $cleanContent($log['new_values']);
            }

            // --- FREQUÊNCIA (ATTENDANCE) ---
            elseif ($log['table_name'] === 'attendance') {
                $sid = $newArr['student_id'] ?? $oldArr['student_id'] ?? null;
                $log['target_name'] = $sid && isset($peopleMap[$sid]) ? $peopleMap[$sid] : "Catequizando (ID $sid)";

                $humanizeAttendance = function ($json) {
                    if (empty($json)) return null;
                    $arr = json_decode($json, true);
                    if (!is_array($arr)) return $json;

                    $new = [];
                    foreach ($arr as $key => $val) {
                        if (in_array($key, ['attendance_id', 'session_id', 'student_id', 'created_at', 'updated_at', 'deleted'])) continue;

                        if ($key === 'is_present') {
                            $boolVal = filter_var($val, FILTER_VALIDATE_BOOLEAN);
                            $new['Presença'] = $boolVal ? '<span class="badge bg-success">Presente</span>' : '<span class="badge bg-danger">Ausente</span>';
                        } elseif ($key === 'justification' && !empty($val)) {
                            $new['Justificativa'] = $val;
                        } elseif ($key === 'absence_type') {
                            $mapType = ['UNJUSTIFIED' => 'Não Justificada', 'JUSTIFIED' => 'Justificada', 'RECURRENT' => 'Recorrente'];
                            $new['Tipo de Falta'] = $mapType[$val] ?? $val;
                        } elseif ($key === 'student_observation' && !empty($val)) {
                            $new['Observação'] = $val;
                        } else {
                            $new[$key] = $val;
                        }
                    }
                    return json_encode($new);
                };

                $log['old_values'] = $humanizeAttendance($log['old_values']);
                $log['new_values'] = $humanizeAttendance($log['new_values']);
            }

            // --- GRADES CURRICULARES (CURRICULUM) ---
            elseif ($log['table_name'] === 'curriculum') {
                $sId = $newArr['subject_id'] ?? $oldArr['subject_id'] ?? 0;

                if ($log['operation'] === 'INSERT') $tempAdded['s' . $sId] = $index;
                if ($log['operation'] === 'DELETE') $tempRemoved['s' . $sId] = $index;

                $inject = function ($j) use ($subjectsMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (isset($a['subject_id'], $subjectsMap[$a['subject_id']])) $a['disciplina'] = $subjectsMap[$a['subject_id']];
                        unset($a['subject_id'], $a['course_id'], $a['curriculum_id'], $a['lesson_plan_template']);
                        return json_encode($a);
                    }
                    return $j;
                };

                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
                $log['target_name'] = $subjectsMap[$sId] ?? "Grade";
            }

            // --- TURMAS (CLASSES) ---
            elseif ($log['table_name'] === 'classes') {
                $injectNames = function ($j) use ($peopleMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (!empty($a['coordinator_id']) && isset($peopleMap[$a['coordinator_id']])) $a['coordinator_id'] = $peopleMap[$a['coordinator_id']];
                        if (!empty($a['class_assistant_id']) && isset($peopleMap[$a['class_assistant_id']])) $a['class_assistant_id'] = $peopleMap[$a['class_assistant_id']];
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $injectNames($log['old_values']);
                $log['new_values'] = $injectNames($log['new_values']);
            }

            // --- VÍNCULOS (PERSON_ROLES) ---
            elseif ($log['table_name'] === 'person_roles') {
                $rId = $newArr['role_id'] ?? $oldArr['role_id'] ?? 0;
                if ($rId && isset($rolesMap[$rId])) $log['target_name'] = $rolesMap[$rId];

                if ($log['operation'] === 'INSERT') $tempAdded['r' . $rId] = $index;
                elseif ($log['operation'] === 'DELETE') $tempRemoved['r' . $rId] = $index;

                $inject = function ($j) use ($rolesMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (isset($a['role_id'], $rolesMap[$a['role_id']])) $a['vinculo'] = $rolesMap[$a['role_id']];
                        unset($a['role_id'], $a['person_id'], $a['org_id'], $a['link_id']);
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- ANEXOS (PERSON_ATTACHMENTS) ---
            elseif ($log['table_name'] === 'person_attachments') {
                $nomeArq = $newArr['file_name'] ?? $oldArr['file_name'] ?? 'Arquivo';
                $desc = $newArr['description'] ?? $oldArr['description'] ?? '';
                $log['target_name'] = $desc ?: $nomeArq;

                $inject = function ($j) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        unset($a['person_id'], $a['attachment_id'], $a['file_path'], $a['uploaded_by']);
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- DIÁRIO (CLASS_SESSIONS) ---
            elseif ($log['table_name'] === 'class_sessions') {
                $log['target_name'] = "Dados da Aula";
                $inject = function ($j) use ($subjectsMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (isset($a['subject_id'], $subjectsMap[$a['subject_id']])) $a['disciplina'] = $subjectsMap[$a['subject_id']];
                        unset($a['subject_id'], $a['class_id'], $a['signed_by_user_id']);
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- LAÇOS FAMILIARES (FAMILY_TIES) ---
            elseif ($log['table_name'] === 'family_ties') {
                $inject = function ($j) use ($peopleMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (isset($a['relative_id'], $peopleMap[$a['relative_id']])) $a['relative_name'] = $peopleMap[$a['relative_id']];
                        unset($a['person_id'], $a['tie_id'], $a['relative_id']);
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }

            // --- LOCAIS (LOCATIONS) ---
            elseif ($log['table_name'] === 'locations') {
                $inject = function ($j) use ($orgMap) {
                    if (empty($j)) return null;
                    $a = json_decode($j, true);
                    if (is_array($a)) {
                        if (isset($a['org_id'], $orgMap[$a['org_id']])) $a['instituicao'] = $orgMap[$a['org_id']];

                        foreach (['resources', 'resources_detail'] as $f) {
                            if (isset($a[$f]) && is_string($a[$f])) {
                                $dec = json_decode($a[$f], true);
                                if (json_last_error() === JSON_ERROR_NONE) $a[$f] = $dec;
                            }
                        }
                        unset($a['org_id'], $a['location_id']);
                        return json_encode($a);
                    }
                    return $j;
                };
                $log['old_values'] = $inject($log['old_values']);
                $log['new_values'] = $inject($log['new_values']);
            }
        }

        // --- 5. FILTRAGEM (Remoção de logs espelhos) ---
        foreach ($tempAdded as $key => $addIndex) {
            if (isset($tempRemoved[$key])) {
                $remIndex = $tempRemoved[$key];
                $logAdd = &$logs[$addIndex];
                $logRem = &$logs[$remIndex];

                if (substr($logAdd['changed_at'], 0, 19) === substr($logRem['changed_at'], 0, 19)) {
                    if (str_starts_with($key, 'r') || (str_starts_with($key, 's') && $logAdd['new_values'] === $logRem['old_values'])) {
                        $logAdd['__exclude'] = true;
                        $logRem['__exclude'] = true;
                    }
                }
            }
        }

        $finalLogs = array_filter($logs, fn($l) => !$l['__exclude']);
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
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['id_user']]);
        }

        $stmt = $conect->prepare("SELECT schema_name, table_name, record_id, old_values FROM security.change_logs WHERE log_id = :id");
        $stmt->execute(['id' => $data['log_id']]);
        $log = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$log || empty($log['old_values'])) {
            $conect->rollBack();
            return failure("Não há dados anteriores para restaurar.");
        }

        // Garante que decodificará um array de forma segura
        $oldData = json_decode($log['old_values'], true) ?: [];
        $schema = $log['schema_name'];
        $table = $log['table_name'];
        $recordId = $log['record_id'];

        $pkMap = [
            'organizations'      => 'org_id',
            'persons'            => 'person_id',
            'users'              => 'id',
            'locations'          => 'location_id',
            'subjects'           => 'subject_id',
            'courses'            => 'course_id',
            'classes'            => 'class_id',
            'class_sessions'     => 'session_id',
            'attendance'         => 'attendance_id',
            'person_roles'       => 'link_id',
            'family_ties'        => 'tie_id',
            'person_attachments' => 'attachment_id'
        ];

        $pkColumn = $pkMap[$table] ?? rtrim($table, 's') . "_id";
        $setFields = [];
        $params = [];

        foreach ($oldData as $col => $val) {
            // Ignora a chave primária e colunas sensíveis ao tempo/identidade virtual
            if ($col === $pkColumn || in_array($col, ['updated_at', 'created_at', 'deleted'])) continue;

            // Ignora colunas formatadas que não existem fisicamente na tabela original
            if (in_array($col, ['vinculo', 'relative_name', 'disciplina', 'instituicao', 'aluno', 'aluno_nome'])) continue;

            // Tratamento rígido de tipos para a montagem de parâmetros PDO
            if (is_array($val) || is_object($val)) {
                $val = json_encode($val);
            } elseif (is_bool($val)) {
                $val = $val ? 'TRUE' : 'FALSE';
            }

            $setFields[] = "\"$col\" = :$col";
            $params[$col] = $val;
        }

        if (empty($setFields)) {
            $conect->rollBack();
            return failure("Nenhum dado válido para restaurar.");
        }

        $sqlRestore = "UPDATE \"$schema\".\"$table\" SET " . implode(', ', $setFields) . ", updated_at = CURRENT_TIMESTAMP WHERE \"$pkColumn\" = :pk_val";
        $params['pk_val'] = $recordId;

        $conect->prepare($sqlRestore)->execute($params);
        $conect->commit();

        return success("Dados restaurados com sucesso!");
    } catch (Exception $e) {
        if (isset($conect) && $conect->inTransaction()) {
            $conect->rollBack();
        }
        logSystemError("painel", "audit", "rollbackChange", "sql", $e->getMessage(), $data);
        return failure("Erro ao restaurar as alterações.");
    }
}

/**
 * Helper interno para extrair mapeamentos em lote com código limpo.
 */
function fetchMap($conn, $query, $keyField, $valField)
{
    $map = [];
    $stmt = $conn->prepare($query);
    $stmt->execute();
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $map[$row[$keyField]] = $row[$valField];
    }
    return $map;
}
