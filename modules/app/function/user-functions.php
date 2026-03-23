<?php

/**
 * Busca listagem cruzada Staff + Local com Perfis Temporais
 */
function getUsuariosParoquia($data)
{
    try {
        $conectStaff = getStaff();
        $conectLocal = $GLOBALS["local"];
        $idClient = (int)$data['id_client'];

        $params = [
            ':oid' => $idClient,
            ':limit' => (int)$data['limit'],
            ':page' => (int)$data['page']
        ];

        $where = "WHERE up.id_client = :oid AND u.deleted IS FALSE AND u.staff IS FALSE";

        if (!empty($data['search'])) {
            $where .= " AND (u.name ILIKE :search OR u.email ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['profile_filter'])) {
            $where .= " AND up.id_profile = :profile_filter";
            $params[':profile_filter'] = (int)$data['profile_filter'];
        }

        $sqlStaff = "SELECT 
                    COUNT(*) OVER() as total_registros,
                    u.id, u.name, u.email, u.img, up.id_profile as main_profile_id, p.title as main_profile_name
                FROM public.users u
                JOIN public.users_clients_profiles up ON u.id = up.id_user
                JOIN public.profiles p ON up.id_profile = p.id
                $where
                ORDER BY u.name ASC
                LIMIT :limit OFFSET :page";

        $stmtStaff = $conectStaff->prepare($sqlStaff);
        foreach ($params as $key => $val) {
            $stmtStaff->bindValue($key, $val, is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR);
        }
        $stmtStaff->execute();
        $usuarios = $stmtStaff->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($usuarios) && $conectLocal) {
            $userIds = array_column($usuarios, 'id');
            $inQuery = implode(',', array_fill(0, count($userIds), '?'));

            // [CORREÇÃO] SQL cruzando dados locais para trazer nomes de anos e cargos
            $sqlLocal = "SELECT 
                            su.user_id, 
                            pp.profile_photo_url,
                            (SELECT json_agg(json_build_object(
                                'year_id', uy.year_id, 
                                'year_name', ay.name,
                                'profile_id', uy.id_profile,
                                'profile_name', prof.title
                             ))
                             FROM security.users_years uy 
                             JOIN education.academic_years ay ON uy.year_id = ay.year_id 
                             JOIN public.profiles prof ON uy.id_profile = prof.id
                             WHERE uy.user_id = su.user_id AND uy.deleted IS FALSE) as vinculos_temporais
                         FROM security.users su
                         JOIN people.persons pp ON su.person_id = pp.person_id
                         WHERE su.user_id IN ($inQuery)";

            $stmtLocal = $conectLocal->prepare($sqlLocal);
            $stmtLocal->execute($userIds);
            $localData = $stmtLocal->fetchAll(PDO::FETCH_ASSOC);

            $localMap = [];
            foreach ($localData as $ld) {
                $localMap[$ld['user_id']] = $ld;
            }

            foreach ($usuarios as &$u) {
                if (isset($localMap[$u['id']])) {
                    $u['img'] = $localMap[$u['id']]['profile_photo_url'] ?: $u['img'];
                    $vinculos = json_decode($localMap[$u['id']]['vinculos_temporais'] ?: '[]', true);
                    $u['anos_ids'] = $localMap[$u['id']]['vinculos_temporais'] ?: '[]';

                    $exibicao = [];
                    foreach ($vinculos as $v) {
                        $exibicao[] = $v['year_name'] . " (" . $v['profile_name'] . ")";
                    }
                    $u['anos_letivos'] = !empty($exibicao) ? implode('<br>', $exibicao) : 'Acesso Geral';
                }
            }
        }

        return success("Usuários listados.", $usuarios);
    } catch (Exception $e) {
        logSystemError("painel", "usuarios", "getUsuariosParoquia", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar usuários.");
    }
}

/**
 * Busca dados detalhados isolados de um único usuário
 */
function getUsuarioDetailsData($data)
{
    try {
        $conectStaff = getStaff();
        $conectLocal = $GLOBALS["local"];

        $idUser = (int)$data['id_user'];
        $idClient = (int)$data['id_client'];

        $sqlStaff = "SELECT u.id, u.name, u.email, u.img, up.id_profile as main_profile_id
                     FROM public.users u
                     JOIN public.users_clients_profiles up ON u.id = up.id_user
                     WHERE u.id = :uid AND up.id_client = :cid AND u.deleted IS FALSE";

        $stmtStaff = $conectStaff->prepare($sqlStaff);
        $stmtStaff->execute(['uid' => $idUser, 'cid' => $idClient]);
        $user = $stmtStaff->fetch(PDO::FETCH_ASSOC);

        if (!$user) return failure("Usuário não encontrado ou inativo.");

        if ($conectLocal) {
            $sqlLocal = "SELECT pp.profile_photo_url,
                                (SELECT json_agg(json_build_object('year_id', uy.year_id, 'profile_id', uy.id_profile))
                                 FROM security.users_years uy WHERE uy.user_id = su.user_id AND uy.deleted IS FALSE) as anos_ids
                         FROM security.users su
                         JOIN people.persons pp ON su.person_id = pp.person_id
                         WHERE su.user_id = :uid";

            $stmtLocal = $conectLocal->prepare($sqlLocal);
            $stmtLocal->execute(['uid' => $idUser]);
            $localData = $stmtLocal->fetch(PDO::FETCH_ASSOC);

            if ($localData) {
                $user['img'] = $localData['profile_photo_url'] ?: $user['img'];
                $user['anos_ids'] = $localData['anos_ids'] ?: '[]';
            }
        }

        return success("Dados do usuário.", $user);
    } catch (Exception $e) {
        logSystemError("painel", "usuarios", "getUsuarioDetailsData", "sql", $e->getMessage(), $data);
        return failure("Erro ao buscar dados do usuário.");
    }
}

/**
 * Create ou Update de Usuários com Tratamento de Conflitos e Logs
 */
function updateUsuarioParoquia($data)
{
    try {
        $conectStaff = getStaff();
        $conectLocal = $GLOBALS["local"];

        $conectStaff->beginTransaction();
        if ($conectLocal) $conectLocal->beginTransaction();

        $idUser = (int)$data['id_user'];
        $idClient = (int)$data['id_client'];
        $email = strtolower(trim($data['email']));
        $mainProfile = (int)$data['profile'];
        $authorId = (int)$data['author_id'];

        $roleLevel = ($mainProfile == 50) ? 'MANAGER' : (($mainProfile == 40) ? 'SECRETARY' : (($mainProfile == 30) ? 'TEACHER' : 'USER'));

        if ($idUser === 0) {
            // ==========================================
            // 1. CRIAR NOVO USUÁRIO (INSERT OU RESTAURAR)
            // ==========================================
            $personId = (int)$data['person_id'];
            if (!$personId) throw new Exception("Pessoa não selecionada para vínculo.");

            $stmtP = $conectLocal->prepare("SELECT full_name, profile_photo_url, tax_id FROM people.persons WHERE person_id = :pid");
            $stmtP->execute(['pid' => $personId]);
            $person = $stmtP->fetch(PDO::FETCH_ASSOC);

            if (!$person) throw new Exception("Pessoa não encontrada no diretório.");

            // [CORREÇÃO] Checa Unique Constraint de e-mail no Staff para reativar
            $stmtCheck = $conectStaff->prepare("SELECT id FROM public.users WHERE email = :em");
            $stmtCheck->execute(['em' => $email]);
            $existingStaffId = $stmtCheck->fetchColumn();

            if ($existingStaffId) {
                $idUser = $existingStaffId;
                $conectStaff->prepare("UPDATE public.users SET name = :nm, img = :img, active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                    ->execute(['nm' => $person['full_name'], 'img' => $person['profile_photo_url'], 'id' => $idUser]);
            } else {
                $cpfLimpo = preg_replace('/[^0-9]/', '', $person['tax_id'] ?? '');
                $hash = !empty($cpfLimpo) ? $cpfLimpo : 'mudar123';

                $stmtIn = $conectStaff->prepare("INSERT INTO public.users (name, email, password, img, active, deleted, created_at, updated_at) VALUES (:nm, :em, :pass, :img, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id");
                $stmtIn->execute(['nm' => $person['full_name'], 'em' => $email, 'pass' => $hash, 'img' => $person['profile_photo_url']]);
                $idUser = $stmtIn->fetchColumn();
            }

            $stmtLink = $conectStaff->prepare("SELECT id FROM public.users_clients_profiles WHERE id_user = :uid AND id_client = :cid");
            $stmtLink->execute(['uid' => $idUser, 'cid' => $idClient]);
            if ($stmtLink->fetchColumn()) {
                $conectStaff->prepare("UPDATE public.users_clients_profiles SET id_profile = :pid, active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id_user = :uid AND id_client = :cid")
                    ->execute(['uid' => $idUser, 'cid' => $idClient, 'pid' => $mainProfile]);
            } else {
                $conectStaff->prepare("INSERT INTO public.users_clients_profiles (id_user, id_client, id_profile, active, created_at, updated_at) VALUES (:uid, :cid, :pid, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                    ->execute(['uid' => $idUser, 'cid' => $idClient, 'pid' => $mainProfile]);
            }

            if ($conectLocal) {
                // [CORREÇÃO] Upsert Local (conflict no user_id)
                $sqlLocal = "INSERT INTO security.users (user_id, org_id, person_id, name, email, role_level, is_active, deleted, updated_at) 
                             VALUES (:uid, :oid, :pid, :nm, :em, :rl, TRUE, FALSE, CURRENT_TIMESTAMP)
                             ON CONFLICT (user_id) DO UPDATE 
                             SET email = EXCLUDED.email, name = EXCLUDED.name, role_level = EXCLUDED.role_level, is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP";

                $conectLocal->prepare($sqlLocal)->execute([
                    'uid' => $idUser,
                    'oid' => $idClient,
                    'pid' => $personId,
                    'nm' => $person['full_name'],
                    'em' => $email,
                    'rl' => $roleLevel
                ]);

                // Log local explícito
                $conectLocal->prepare("INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values) VALUES ('security', 'users', 'INSERT', :rid, :author, :desc)")
                    ->execute(['rid' => (string)$idUser, 'author' => $authorId, 'desc' => json_encode(['info' => "Criação manual do acesso deste usuário no sistema"])]);
            }
        } else {
            // ==========================================
            // 2. ATUALIZAR USUÁRIO EXISTENTE (UPDATE)
            // ==========================================
            $stmtCheck = $conectStaff->prepare("SELECT id FROM public.users WHERE email = :em AND id != :id");
            $stmtCheck->execute(['em' => $email, 'id' => $idUser]);
            if ($stmtCheck->fetchColumn()) throw new Exception("Este e-mail já está em uso por outro usuário global.");

            $conectStaff->prepare("UPDATE public.users SET email = :email, updated_at = CURRENT_TIMESTAMP WHERE id = :id")->execute(['email' => $email, 'id' => $idUser]);
            $conectStaff->prepare("UPDATE public.users_clients_profiles SET id_profile = :profile, updated_at = CURRENT_TIMESTAMP WHERE id_user = :id_user AND id_client = :id_client")->execute(['profile' => $mainProfile, 'id_user' => $idUser, 'id_client' => $idClient]);

            if ($conectLocal) {
                // [CORREÇÃO] Atualizando e-mail e nível local
                $conectLocal->prepare("UPDATE security.users SET email = :em, role_level = :rl, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")->execute(['em' => $email, 'rl' => $roleLevel, 'uid' => $idUser]);

                $conectLocal->prepare("INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values) VALUES ('security', 'users', 'UPDATE', :rid, :author, :desc)")
                    ->execute(['rid' => (string)$idUser, 'author' => $authorId, 'desc' => json_encode(['info' => "Atualização das permissões bases e e-mail de login"])]);
            }
        }

        // ==========================================
        // 3. GRAVAR VÍNCULOS COM SOFT DELETE + REATIVAÇÃO
        // ==========================================
        if ($conectLocal) {
            // Passo 1: Inativa os vínculos acadêmicos atuais em lote (Soft Delete)
            $conectLocal->prepare("UPDATE security.users_years SET is_active = FALSE, deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")
                ->execute(['uid' => $idUser]);

            if (!empty($data['years_mapping']) && is_array($data['years_mapping'])) {

                // Passo 2: Insere os novos ou REATIVA os existentes (Upsert)
                $sqlUpsert = "INSERT INTO security.users_years (user_id, year_id, id_profile, is_active, deleted, created_at, updated_at) 
                              VALUES (:uid, :yid, :pid, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                              ON CONFLICT (user_id, year_id) DO UPDATE 
                              SET id_profile = EXCLUDED.id_profile, is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP";

                $stmtY = $conectLocal->prepare($sqlUpsert);
                foreach ($data['years_mapping'] as $map) {
                    $stmtY->execute(['uid' => $idUser, 'yid' => (int)$map['year_id'], 'pid' => (int)$map['profile_id']]);
                }

                $conectLocal->prepare("INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values) VALUES ('security', 'users_years', 'UPDATE', :rid, :author, :desc)")
                    ->execute(['rid' => (string)$idUser, 'author' => $authorId, 'desc' => json_encode(['info' => "Anos letivos e funções vinculados com sucesso"])]);
            }
        }

        $conectStaff->commit();
        if ($conectLocal) $conectLocal->commit();

        return success("Usuário e perfis salvos com sucesso.");
    } catch (Exception $e) {
        if (isset($conectStaff) && $conectStaff->inTransaction()) $conectStaff->rollBack();
        if (isset($conectLocal) && $conectLocal->inTransaction()) $conectLocal->rollBack();
        return failure($e->getMessage() ?: "Erro ao salvar usuário.");
    }
}

/**
 * Remove o usuário (Soft Delete)
 */
function deleteUsuarioParoquia($data)
{
    try {
        $conectStaff = getStaff();
        $conectLocal = $GLOBALS["local"];

        $conectStaff->beginTransaction();
        if ($conectLocal) $conectLocal->beginTransaction();

        $idUser = (int)$data['id_user'];
        $idClient = (int)$data['id_client'];
        $authorId = (int)$data['author_id'];

        // [CORREÇÃO] Soft Delete no Staff
        $conectStaff->prepare("UPDATE public.users SET deleted = TRUE, active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = :id")->execute(['id' => $idUser]);
        $conectStaff->prepare("UPDATE public.users_clients_profiles SET active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id_user = :uid AND id_client = :cid")->execute(['uid' => $idUser, 'cid' => $idClient]);

        if ($conectLocal) {
            // [CORREÇÃO] Soft Delete local
            $conectLocal->prepare("UPDATE security.users_years SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")->execute(['uid' => $idUser]);
            $conectLocal->prepare("UPDATE security.users SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")->execute(['uid' => $idUser]);

            $conectLocal->prepare("INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values) VALUES ('security', 'users', 'DELETE', :rid, :author, :desc)")
                ->execute(['rid' => (string)$idUser, 'author' => $authorId, 'desc' => json_encode(['info' => "Inativou/removeu o acesso de um usuário do sistema local"])]);
        }

        $conectStaff->commit();
        if ($conectLocal) $conectLocal->commit();

        return success("Usuário removido com sucesso.");
    } catch (Exception $e) {
        if (isset($conectStaff) && $conectStaff->inTransaction()) $conectStaff->rollBack();
        if (isset($conectLocal) && $conectLocal->inTransaction()) $conectLocal->rollBack();
        return failure("Erro ao excluir usuário.");
    }
}

/**
 * Reset de senha padrão
 */
function resetPasswordUsuario($data)
{
    try {
        $conectStaff = getStaff();
        $conectLocal = $GLOBALS["local"];
        $conectStaff->beginTransaction();

        $conectStaff->prepare("UPDATE public.users SET password = :pass, updated_at = CURRENT_TIMESTAMP WHERE id = :id_user")->execute(['pass' => 'mudar123', 'id_user' => (int)$data['id_user']]);

        if ($conectLocal) {
            $conectLocal->prepare("INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values) VALUES ('security', 'users', 'UPDATE', :rid, :author, :desc)")
                ->execute(['rid' => (string)$data['id_user'], 'author' => $data['author_id'], 'desc' => json_encode(['info' => "Redefiniu a senha do usuário para o padrão", 'visual_id' => 'PASSWORD_RESET'])]);
        }

        $conectStaff->commit();
        return success("Senha resetada para o padrão.");
    } catch (Exception $e) {
        if ($conectStaff->inTransaction()) $conectStaff->rollBack();
        return failure("Erro ao resetar senha.");
    }
}

/**
 * Auditoria Traduzida e Focada no que ELA (user_id) FEZ no sistema.
 * Agora com ENRIQUECIMENTO RELACIONAL (Transforma IDs em Nomes).
 */
function getHistoricoAuditoriaUsuario($data)
{
    try {
        $conectLocal = $GLOBALS["local"];
        $idUser = (int)$data['id_user'];

        // Tenta buscar old_values caso exista na estrutura da trigger
        $checkOldCol = $conectLocal->query("SELECT column_name FROM information_schema.columns WHERE table_schema='security' AND table_name='change_logs' AND column_name='old_values'")->fetchColumn();
        $oldColSql = $checkOldCol ? "old_values" : "NULL as old_values";

        $sql = "SELECT log_id, schema_name, table_name, operation, changed_at, new_values, $oldColSql
                FROM security.change_logs cl
                WHERE cl.user_id = :uid
                ORDER BY cl.changed_at DESC LIMIT 50";

        $stmt = $conectLocal->prepare($sql);
        $stmt->execute(['uid' => $idUser]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $formattedHistory = [];

        // Helper interno para buscar nomes no banco de forma segura
        $fetchName = function ($table, $colName, $idCol, $val) use ($conectLocal) {
            if (!$val) return null;
            try {
                $s = $conectLocal->prepare("SELECT $colName FROM $table WHERE $idCol = ? LIMIT 1");
                $s->execute([$val]);
                return $s->fetchColumn();
            } catch (Exception $e) {
                return null;
            }
        };

        foreach ($history as $h) {
            $dateFmt = date('d/m/Y', strtotime($h['changed_at'])) . ' às ' . date('H:i', strtotime($h['changed_at']));
            $op = strtoupper($h['operation']);
            $table = strtolower($h['table_name']);

            $newVals = json_decode($h['new_values'] ?? '{}', true);
            $oldVals = json_decode($h['old_values'] ?? '{}', true);

            // ==========================================
            // MOTOR DE ENRIQUECIMENTO DE DADOS
            // Transformando IDs frios em Nomes Humanos
            // ==========================================
            if ($table === 'attendance') {
                if (!empty($newVals['student_id'])) {
                    $nome = $fetchName('people.persons', 'full_name', 'person_id', $newVals['student_id']);
                    if ($nome) $newVals['student_name'] = $nome;
                }
            }
            if ($table === 'class_sessions' || $table === 'attendance') {
                if (!empty($newVals['class_id'])) {
                    $turma = $fetchName('education.classes', 'name', 'class_id', $newVals['class_id']) ?: $fetchName('education.classes', 'name', 'id', $newVals['class_id']);
                    if ($turma) $newVals['class_name'] = $turma;
                }
            }

            $icon = "fas fa-check-circle";
            $color = "secondary";
            $title = "Ação de Sistema";

            // ==========================================
            // TÍTULOS INTELIGENTES BASEADOS NO CONTEXTO
            // ==========================================
            if ($table === 'attendance') {
                $primeiroNome = isset($newVals['student_name']) ? explode(' ', $newVals['student_name'])[0] : "um aluno";
                if ($op === 'INSERT') {
                    $title = "Lançou frequência para " . $primeiroNome;
                    $icon = "fas fa-user-check";
                    $color = "success";
                } elseif ($op === 'UPDATE') {
                    $title = "Alterou a frequência de " . $primeiroNome;
                    $icon = "fas fa-edit";
                    $color = "primary";
                } elseif ($op === 'DELETE') {
                    $title = "Removeu o registro de frequência";
                    $icon = "fas fa-trash-alt";
                    $color = "danger";
                }
            } elseif ($table === 'class_sessions') {
                $nomeTurma = $newVals['class_name'] ?? "uma turma";
                if ($op === 'INSERT') {
                    $title = "Registrou uma nova aula na " . $nomeTurma;
                    $icon = "fas fa-chalkboard-teacher";
                    $color = "success";
                } elseif ($op === 'UPDATE') {
                    $title = "Editou o registro de aula da " . $nomeTurma;
                    $icon = "fas fa-edit";
                    $color = "primary";
                } elseif ($op === 'DELETE') {
                    $title = "Removeu uma aula da " . $nomeTurma;
                    $icon = "fas fa-trash-alt";
                    $color = "danger";
                }
            } elseif ($table === 'users') {
                $title = ($op === 'INSERT') ? "Criou um Acesso" : (($op === 'UPDATE') ? "Alterou Permissões" : "Removeu um Acesso");
                $icon = "fas fa-user-shield";
                $color = ($op === 'DELETE') ? "danger" : "info";
            } else {
                // Fallback Padrão
                $modulos = ['users_years' => 'Vínculo Letivo', 'persons' => 'Pessoa', 'person_roles' => 'Cargo'];
                $nomeModulo = $modulos[$table] ?? $table;
                if ($op === 'INSERT') {
                    $title = "Adicionou registro em " . $nomeModulo;
                    $color = "success";
                } elseif ($op === 'UPDATE') {
                    $title = "Atualizou registro em " . $nomeModulo;
                    $color = "primary";
                } elseif ($op === 'DELETE') {
                    $title = "Deletou registro em " . $nomeModulo;
                    $color = "danger";
                }
            }

            // Garante que o frontend receba os JSONs atualizados e enriquecidos
            $formattedHistory[] = [
                'log_id' => $h['log_id'],
                'date_fmt' => $dateFmt,
                'title' => $title,
                'operation' => $op,
                'icon' => $icon,
                'color' => $color,
                'new_values' => json_encode($newVals),
                'old_values' => json_encode($oldVals)
            ];
        }

        return success("Histórico", $formattedHistory);
    } catch (Exception $e) {
        logSystemError("painel", "usuarios", "getHistorico", "sql", $e->getMessage(), $data);
        return failure("Erro no histórico.");
    }
}

// =========================================================
// ROTAS DE APOIO (Inalteradas, mas garantindo que estejam aqui)
// =========================================================

function fetchAnosLetivosDropdown()
{
    try {
        $conect = $GLOBALS["local"];
        $stmt = $conect->query("SELECT year_id as id, name FROM education.academic_years WHERE is_active IS TRUE AND deleted IS FALSE ORDER BY name DESC");
        return success("Anos", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        return failure("Erro.");
    }
}

function fetchPessoasDropdown($data)
{
    try {
        $conect = $GLOBALS["local"];
        $search = "%" . ($data['search'] ?? '') . "%";
        $stmt = $conect->prepare("SELECT person_id, full_name, tax_id FROM people.persons WHERE deleted IS FALSE AND is_active IS TRUE AND (full_name ILIKE :s OR tax_id ILIKE :s) LIMIT 20");
        $stmt->execute(['s' => $search]);
        $pessoas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($pessoas as &$p) {
            $p['full_name'] = $p['full_name'] . ($p['tax_id'] ? " - CPF: " . $p['tax_id'] : "");
        }
        return success("Pessoas", $pessoas);
    } catch (Exception $e) {
        return failure("Erro.");
    }
}
