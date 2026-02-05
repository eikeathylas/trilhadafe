<?php

// =========================================================
// GESTÃO DE PESSOAS (MODEL) - V3.0 (Sync Staff IDs Corretos)
// =========================================================

function getAllPeople($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => (int)$data['limit'],
            ':page' => (int)$data['page']
        ];

        // Filtros Dinâmicos
        $where = "WHERE p.deleted IS FALSE";

        if (!empty($data['search'])) {
            $where .= " AND (p.full_name ILIKE :search OR p.tax_id ILIKE :search OR p.email ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['role_filter'])) {
            $where .= " AND EXISTS (
                SELECT 1 FROM people.person_roles pr 
                JOIN people.roles r ON pr.role_id = r.role_id 
                WHERE pr.person_id = p.person_id 
                AND pr.deleted IS FALSE 
                AND pr.is_active IS TRUE
                AND r.role_name = :role_filter
            )";
            $params[':role_filter'] = $data['role_filter'];
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                p.person_id,
                p.full_name,
                p.religious_name,
                p.profile_photo_url,
                p.email,
                p.phone_mobile,
                p.is_active,
                (
                    SELECT STRING_AGG(DISTINCT r.description_pt, ', ')
                    FROM people.person_roles pr
                    JOIN people.roles r ON pr.role_id = r.role_id
                    WHERE pr.person_id = p.person_id 
                    AND pr.deleted IS FALSE 
                    AND pr.is_active IS TRUE
                ) as roles_list,
                (
                    SELECT STRING_AGG(DISTINCT r.role_name, ',')
                    FROM people.person_roles pr
                    JOIN people.roles r ON pr.role_id = r.role_id
                    WHERE pr.person_id = p.person_id 
                    AND pr.deleted IS FALSE 
                    AND pr.is_active IS TRUE
                ) as roles_codes
            FROM people.persons p
            $where
            ORDER BY p.full_name ASC
            LIMIT :limit OFFSET :page
        SQL;

        $stmt = $conect->prepare($sql);
        foreach ($params as $key => $val) {
            $type = is_int($val) ? PDO::PARAM_INT : PDO::PARAM_STR;
            $stmt->bindValue($key, $val, $type);
        }
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) {
            $row['is_active'] = (bool)$row['is_active'];
            $row['roles_array'] = !empty($row['roles_codes']) ? explode(',', $row['roles_codes']) : [];
        }

        return success("Pessoas listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "people", "getAllPeople", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar pessoas.");
    }
}

function getPersonData($personId)
{
    try {
        $conect = $GLOBALS["local"];

        $stmt = $conect->prepare("SELECT * FROM people.persons WHERE person_id = :id AND deleted IS FALSE LIMIT 1");
        $stmt->execute(['id' => $personId]);
        $person = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$person) return failure("Pessoa não encontrada.");

        // Busca Cargos
        $sqlRoles = <<<'SQL'
            SELECT DISTINCT r.role_name, r.role_id, r.description_pt 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        SQL;
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles_data'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
        $person['roles'] = array_column($person['roles_data'], 'role_name');

        // Busca Família
        $sqlFamily = <<<'SQL'
            SELECT 
                ft.tie_id,
                ft.relative_id,
                ft.relationship_type,
                ft.is_financial_responsible,
                ft.is_legal_guardian,
                p.full_name as relative_name
            FROM people.family_ties ft
            JOIN people.persons p ON p.person_id = ft.relative_id
            WHERE ft.person_id = :id AND ft.deleted IS FALSE
        SQL;
        $stmtFamily = $conect->prepare($sqlFamily);
        $stmtFamily->execute(['id' => $personId]);
        $person['family'] = $stmtFamily->fetchAll(PDO::FETCH_ASSOC);

        // Castings
        $person['is_pcd'] = (bool)$person['is_pcd'];
        $person['sacraments_info'] = json_decode($person['sacraments_info'] ?? '{}', true);

        foreach ($person['family'] as &$fam) {
            $fam['is_financial_responsible'] = (bool)$fam['is_financial_responsible'];
            $fam['is_legal_guardian'] = (bool)$fam['is_legal_guardian'];
        }

        return success("Dados carregados.", $person);
    } catch (Exception $e) {
        logSystemError("painel", "people", "getPersonData", "sql", $e->getMessage(), ['id' => $personId]);
        return failure("Erro ao carregar cadastro.");
    }
}

function upsertPerson($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sanitize = function ($val) {
            if (is_string($val)) {
                $val = trim(preg_replace('/\s+/', ' ', $val));
                return ($val === '' || $val === 'null') ? null : $val;
            }
            return $val;
        };

        $sacramentsJson = $data['sacraments_info'] ?? null;
        if ($sacramentsJson) {
            $sac = json_decode($sacramentsJson, true);
            if (is_array($sac)) {
                foreach ($sac as $k => $v) {
                    if ($v === "" || $v === false || $v === 'false' || $v === null || $v === 'null') {
                        unset($sac[$k]);
                    }
                }
                $sacramentsJson = empty($sac) ? null : json_encode($sac);
            }
        }

        // --- 1. SALVAR DADOS PESSOAIS ---
        $paramsPerson = [
            'full_name' => $sanitize($data['full_name']),
            'religious_name' => $sanitize($data['religious_name'] ?? null),
            'birth_date' => !empty($data['birth_date']) ? $data['birth_date'] : null,
            'gender' => $sanitize($data['gender'] ?? null),
            'tax_id' => $sanitize($data['tax_id'] ?? null),
            'national_id' => $sanitize($data['national_id'] ?? null),
            'email' => $sanitize($data['email'] ?? null),
            'phone_mobile' => $sanitize($data['phone_mobile'] ?? null),
            'phone_landline' => $sanitize($data['phone_landline'] ?? null),
            'zip_code' => $sanitize($data['zip_code'] ?? null),
            'address_street' => $sanitize($data['address_street'] ?? null),
            'address_number' => $sanitize($data['address_number'] ?? null),
            'address_district' => $sanitize($data['address_district'] ?? null),
            'address_city' => $sanitize($data['address_city'] ?? null),
            'address_state' => $sanitize($data['address_state'] ?? null),
            'is_pcd' => isset($data['is_pcd']) ? ($data['is_pcd'] === 'true' || $data['is_pcd'] === true ? 'TRUE' : 'FALSE') : 'FALSE',
            'pcd_details' => $sanitize($data['pcd_details'] ?? null),
            'profile_photo_url' => $sanitize($data['profile_photo_url'] ?? null),
            'sacraments_info' => $sacramentsJson,
        ];

        if (!empty($data['person_id'])) {
            // UPDATE
            $sql = <<<'SQL'
                UPDATE people.persons SET
                    full_name = :full_name, religious_name = :religious_name, birth_date = :birth_date,
                    gender = :gender, tax_id = :tax_id, national_id = :national_id, email = :email,
                    phone_mobile = :phone_mobile, phone_landline = :phone_landline, zip_code = :zip_code,
                    address_street = :address_street, address_number = :address_number, address_district = :address_district,
                    address_city = :address_city, address_state = :address_state, is_pcd = :is_pcd,
                    pcd_details = :pcd_details, sacraments_info = :sacraments_info, updated_at = CURRENT_TIMESTAMP
            SQL;

            if (!empty($data['profile_photo_url'])) {
                $sql .= ", profile_photo_url = :profile_photo_url";
            } else {
                unset($paramsPerson['profile_photo_url']);
            }

            $sql .= " WHERE person_id = :person_id";
            $paramsPerson['person_id'] = $data['person_id'];
            $conect->prepare($sql)->execute($paramsPerson);
            $personId = $data['person_id'];
            $msg = "Cadastro atualizado!";
        } else {
            // INSERT
            $orgId = 1;
            $sql = <<<'SQL'
                INSERT INTO people.persons 
                (org_id_origin, full_name, religious_name, birth_date, gender, tax_id, national_id, email, phone_mobile, phone_landline, zip_code, address_street, address_number, address_district, address_city, address_state, is_pcd, pcd_details, profile_photo_url, sacraments_info)
                VALUES 
                (:org_id, :full_name, :religious_name, :birth_date, :gender, :tax_id, :national_id, :email, :phone_mobile, :phone_landline, :zip_code, :address_street, :address_number, :address_district, :address_city, :address_state, :is_pcd, :pcd_details, :profile_photo_url, :sacraments_info)
                RETURNING person_id
            SQL;
            $paramsPerson['org_id'] = $orgId;
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsPerson);
            $personId = $stmt->fetchColumn();
            $msg = "Pessoa cadastrada com sucesso!";
        }

        // --- 2. VÍNCULOS ---
        $rolesToCheck = ['STUDENT', 'CATECHIST', 'PRIEST', 'PARENT'];
        foreach ($rolesToCheck as $roleName) {
            if (isset($data['role_' . strtolower($roleName)])) {
                $shouldBeActive = filter_var($data['role_' . strtolower($roleName)], FILTER_VALIDATE_BOOLEAN);
                $stmtGetId = $conect->prepare("SELECT role_id FROM people.roles WHERE role_name = ?");
                $stmtGetId->execute([$roleName]);
                $rid = $stmtGetId->fetchColumn();

                if ($rid) {
                    if ($shouldBeActive) {
                        $conect->prepare("
                            INSERT INTO people.person_roles (person_id, org_id, role_id, is_active, deleted) 
                            VALUES (:pid, 1, :rid, TRUE, FALSE)
                            ON CONFLICT (person_id, role_id) 
                            DO UPDATE SET is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP
                        ")->execute(['pid' => $personId, 'rid' => $rid]);
                    } else {
                        $conect->prepare("UPDATE people.person_roles SET is_active = FALSE, deleted = TRUE WHERE person_id = :pid AND role_id = :rid")
                            ->execute(['pid' => $personId, 'rid' => $rid]);
                    }
                }
            }
        }

        // --- 3. FAMÍLIA ---
        $stmtFam = $conect->prepare("SELECT tie_id, relative_id, relationship_type, is_financial_responsible, is_legal_guardian, deleted FROM people.family_ties WHERE person_id = :pid");
        $stmtFam->execute(['pid' => $personId]);
        $dbFamily = [];
        while ($row = $stmtFam->fetch(PDO::FETCH_ASSOC)) {
            $dbFamily[$row['relative_id']] = $row;
        }

        $newFamilyList = !empty($data['family_json']) ? json_decode($data['family_json'], true) : [];
        $processedIds = [];

        foreach ($newFamilyList as $fam) {
            $relId = $fam['relative_id'];
            $processedIds[] = $relId;

            $newType = $fam['relationship_type'];
            $newFin = filter_var($fam['is_financial_responsible'], FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE';
            $newLeg = filter_var($fam['is_legal_guardian'], FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE';

            if (isset($dbFamily[$relId])) {
                $existing = $dbFamily[$relId];
                $isDeleted = ($existing['deleted'] === true || $existing['deleted'] === 't');

                if ($isDeleted || $existing['relationship_type'] !== $newType || $existing['is_financial_responsible'] !== ($newFin === 'TRUE') || $existing['is_legal_guardian'] !== ($newLeg === 'TRUE')) {
                    $conect->prepare("UPDATE people.family_ties SET relationship_type = :t, is_financial_responsible = :f, is_legal_guardian = :l, deleted = FALSE, updated_at = CURRENT_TIMESTAMP WHERE tie_id = :id")
                        ->execute(['t' => $newType, 'f' => $newFin, 'l' => $newLeg, 'id' => $existing['tie_id']]);
                }
            } else {
                $conect->prepare("INSERT INTO people.family_ties (person_id, relative_id, relationship_type, is_financial_responsible, is_legal_guardian) VALUES (:pid, :rid, :t, :f, :l)")
                    ->execute(['pid' => $personId, 'rid' => $relId, 't' => $newType, 'f' => $newFin, 'l' => $newLeg]);
            }
        }

        foreach ($dbFamily as $relId => $existing) {
            if (!in_array($relId, $processedIds)) {
                if (!($existing['deleted'] === true || $existing['deleted'] === 't')) {
                    $conect->prepare("UPDATE people.family_ties SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE tie_id = :id")->execute(['id' => $existing['tie_id']]);
                }
            }
        }

        $conect->commit();

        // [AUTOMACAO] Sincroniza Login
        syncUserLogin($personId);

        return success($msg, ['person_id' => $personId]);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "people", "upsertPerson", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar o cadastro.");
    }
}

function savePersonRole($data)
{
    try {
        $conect = $GLOBALS["local"];

        $conect->prepare("
            INSERT INTO people.person_roles (person_id, org_id, role_id, is_active, deleted) 
            VALUES (:pid, 1, :rid, TRUE, FALSE)
            ON CONFLICT (person_id, role_id) 
            DO UPDATE SET is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP
        ")->execute(['pid' => $data['person_id'], 'rid' => $data['role_id']]);

        syncUserLogin($data['person_id']);

        return success("Vínculo adicionado.");
    } catch (Exception $e) {
        return failure("Erro ao salvar vínculo.");
    }
}

function removePersonRole($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->prepare("UPDATE people.person_roles SET deleted = TRUE, is_active = FALSE WHERE link_id = :id")->execute(['id' => $data['link_id']]);
        return success("Vínculo removido.");
    } catch (Exception $e) {
        return failure("Erro ao remover vínculo.");
    }
}

// =========================================================
// [NOVO] AUTOMAÇÃO DE LOGIN (SYNC LOCAL & STAFF - CORRIGIDO)
// =========================================================

function syncUserLogin($personId)
{
    try {
        $conect = $GLOBALS["local"];
        $conectStaff = getStaff();

        // 1. Busca dados da pessoa
        $stmtP = $conect->prepare("SELECT full_name, email, tax_id FROM people.persons WHERE person_id = :id");
        $stmtP->execute(['id' => $personId]);
        $person = $stmtP->fetch(PDO::FETCH_ASSOC);

        if (!$person || empty($person['email']) || !filter_var($person['email'], FILTER_VALIDATE_EMAIL)) return;

        // 2. Define Perfil com base no Cargo
        $stmtRoles = $conect->prepare("
            SELECT r.role_name 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        ");
        $stmtRoles->execute(['id' => $personId]);
        $roles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

        $roleLevel = null;
        $profileId = null;

        // IDs Staff (V2.2): 50=Paroco, 40=Coord, 30=Catequista
        if (in_array('PRIEST', $roles)) {
            $roleLevel = 'MANAGER';
            $profileId = 50;
        } elseif (in_array('SECRETARY', $roles)) {
            $roleLevel = 'SECRETARY';
            $profileId = 40;
        } elseif (in_array('CATECHIST', $roles)) {
            $roleLevel = 'TEACHER';
            $profileId = 30;
        }

        if (!$roleLevel) return;

        // Senha
        $cpfLimpo = preg_replace('/[^0-9]/', '', $person['tax_id'] ?? '');
        $rawPassword = !empty($cpfLimpo) ? $cpfLimpo : 'mudar123';
        $hash = $rawPassword;

        // -----------------------------------------------------
        // 3. SINCRONIA LOCAL (security.users)
        // -----------------------------------------------------
        try {
            $conect->beginTransaction();
            $stmtUser = $conect->prepare("SELECT user_id, email FROM security.users WHERE person_id = :id");
            $stmtUser->execute(['id' => $personId]);
            $existingLocal = $stmtUser->fetch(PDO::FETCH_ASSOC);
            $oldEmail = $existingLocal ? $existingLocal['email'] : null;

            if ($existingLocal) {
                $conect->prepare("UPDATE security.users SET email = :em, role_level = :rl, password_hash = :pass, name = :nm, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")
                    ->execute(['em' => $person['email'], 'rl' => $roleLevel, 'pass' => $hash, 'nm' => $person['full_name'], 'uid' => $existingLocal['user_id']]);
            } else {
                $sqlIns = "INSERT INTO security.users (org_id, person_id, name, email, password_hash, role_level, force_password_change) VALUES (1, :pid, :name, :email, :hash, :role, TRUE)";
                $conect->prepare($sqlIns)->execute(['pid' => $personId, 'name' => $person['full_name'], 'email' => $person['email'], 'hash' => $hash, 'role' => $roleLevel]);
            }
            $conect->commit();
        } catch (Exception $eLocal) {
            $conect->rollBack();
            logSystemError("painel", "security", "syncUserLogin_Local", "sql", $eLocal->getMessage(), ['person_id' => $personId]);
        }

        // -----------------------------------------------------
        // 4. SINCRONIA STAFF (users & users_clients_profiles)
        // -----------------------------------------------------
        if ($conectStaff) {
            try {
                $conectStaff->beginTransaction();

                $staffUserId = null;

                // A. Busca usuário no Staff (Pelo Email Antigo ou Novo)
                if ($oldEmail) {
                    $stmtS = $conectStaff->prepare("SELECT id FROM users WHERE email = :email");
                    $stmtS->execute(['email' => $oldEmail]);
                    $staffUserId = $stmtS->fetchColumn();
                }
                if (!$staffUserId) {
                    $stmtS = $conectStaff->prepare("SELECT id FROM users WHERE email = :email");
                    $stmtS->execute(['email' => $person['email']]);
                    $staffUserId = $stmtS->fetchColumn();
                }

                // B. Upsert na tabela `users` do Staff (Coluna 'create_in')
                if ($staffUserId) {
                    $conectStaff->prepare("UPDATE users SET name = :name, email = :email, password = :pass, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                        ->execute(['name' => $person['full_name'], 'email' => $person['email'], 'pass' => $hash, 'id' => $staffUserId]);
                } else {
                    $sqlStaffIns = "INSERT INTO users (name, email, password, create_in, updated_at) VALUES (:name, :email, :pass, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id";
                    $stmtIns = $conectStaff->prepare($sqlStaffIns);
                    $stmtIns->execute(['name' => $person['full_name'], 'email' => $person['email'], 'pass' => $hash]);
                    $staffUserId = $stmtIns->fetchColumn();
                }

                // C. Upsert na tabela `users_clients_profiles`
                // OBS: ID do Cliente é 1 (Caruaru) conforme seu INSERT
                $clientId = 1;

                if ($staffUserId && $profileId) {
                    $stmtLink = $conectStaff->prepare("SELECT id FROM users_clients_profiles WHERE id_user = :uid AND id_client = :cid");
                    $stmtLink->execute(['uid' => $staffUserId, 'cid' => $clientId]);
                    $linkId = $stmtLink->fetchColumn();

                    if ($linkId) {
                        // Atualiza (create_in não muda)
                        $conectStaff->prepare("UPDATE users_clients_profiles SET id_profile = :pid, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                            ->execute(['pid' => $profileId, 'id' => $linkId]);
                    } else {
                        // Cria Vínculo
                        $conectStaff->prepare("INSERT INTO users_clients_profiles (id_user, id_client, id_profile, created_at, updated_at) VALUES (:uid, :cid, :pid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                            ->execute(['uid' => $staffUserId, 'cid' => $clientId, 'pid' => $profileId]);
                    }
                }

                $conectStaff->commit();
            } catch (Exception $eStaff) {
                $conectStaff->rollBack();
                logSystemError("painel", "security", "syncUserLogin_Staff", "sql", $eStaff->getMessage(), ['person_id' => $personId]);
            }
        }
    } catch (Exception $e) {
        logSystemError("painel", "security", "syncUserLogin", "sql", $e->getMessage(), ['person_id' => $personId]);
    }
}

// =========================================================
// HELPERS DE SELECT & OUTROS
// =========================================================

function removePerson($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE people.persons SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE person_id = :id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Cadastro movido para a lixeira.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "people", "removePerson", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao remover o cadastro. Contate o suporte.", null, false, 500);
    }
}

function togglePersonStatus($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE people.persons SET is_active = :active WHERE person_id = :id";
        $stmt = $conect->prepare($sql);
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "people", "togglePersonStatus", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao atualizar o status. Contate o suporte.", null, false, 500);
    }
}

function searchPeopleForSelect($search)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT person_id as id, full_name as title, tax_id FROM people.persons WHERE deleted IS FALSE AND (full_name ILIKE :s OR tax_id ILIKE :s) LIMIT 20";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['s' => "%$search%"]);
        return success("Busca ok", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "searchPeopleForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de pessoas.", null, false, 500);
    }
}

function getStudentsForSelect($search)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT p.person_id as id, p.full_name as title, p.tax_id 
                FROM people.persons p 
                JOIN people.person_roles pr ON p.person_id = pr.person_id
                JOIN people.roles r ON pr.role_id = r.role_id
                WHERE p.deleted IS FALSE AND pr.deleted IS FALSE AND r.role_name = 'STUDENT'
                AND (p.full_name ILIKE :s OR p.tax_id ILIKE :s) LIMIT 20";

        $stmt = $conect->prepare($sql);
        $stmt->execute(['s' => "%$search%"]);
        return success("Busca ok", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "getStudentsForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de alunos.");
    }
}

function getCatechistsForSelect($search = "")
{
    try {
        $conect = $GLOBALS["local"];

        $params = [];
        $where = "WHERE p.deleted IS FALSE AND p.is_active IS TRUE 
                  AND EXISTS (
                      SELECT 1 FROM people.person_roles pr 
                JOIN people.roles r ON pr.role_id = r.role_id
                      WHERE pr.person_id = p.person_id 
                      AND pr.deleted IS FALSE 
                      AND pr.is_active IS TRUE
                      AND r.role_name = 'CATECHIST'
                  )";

        if (!empty($search)) {
            $where .= " AND p.full_name ILIKE :search";
            $params['search'] = "%" . $search . "%";
        }

        $sql = <<<SQL
            SELECT 
                p.person_id as id, 
                p.full_name as title
            FROM people.persons p 
            $where
            ORDER BY p.full_name ASC 
            LIMIT 20
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "getCatechistsForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de catequistas.");
    }
}
