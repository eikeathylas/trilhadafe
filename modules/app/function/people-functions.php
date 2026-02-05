<?php

// =========================================================
// GESTÃO DE PESSOAS (MODEL) - V2.1 (Com Automação de Login)
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

        // Busca Cargos para preencher o Selectize
        $sqlRoles = <<<'SQL'
            SELECT DISTINCT r.role_name, r.role_id, r.description_pt 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        SQL;
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles_data'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC); // Dados completos para o front
        $person['roles'] = array_column($person['roles_data'], 'role_name'); // Apenas array de nomes para check rápido

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

        // 1. Injeção do Usuário para Auditoria
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        // --- HELPER: SANITIZAÇÃO ---
        $sanitize = function ($val) {
            if (is_string($val)) {
                $val = trim(preg_replace('/\s+/', ' ', $val));
                return ($val === '' || $val === 'null') ? null : $val;
            }
            return $val;
        };

        // --- LIMPEZA DE SACRAMENTOS ---
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

        // --- 2. VÍNCULOS (Processamento Básico) ---
        // A lógica complexa de checkboxes foi substituída por `savePersonRole` individual no novo padrão,
        // mas mantemos aqui caso o front ainda envie `role_STUDENT` etc.
        $rolesToCheck = ['STUDENT', 'CATECHIST', 'PRIEST', 'PARENT'];
        foreach ($rolesToCheck as $roleName) {
            if (isset($data['role_' . strtolower($roleName)])) {
                $shouldBeActive = filter_var($data['role_' . strtolower($roleName)], FILTER_VALIDATE_BOOLEAN);

                // Busca ID do cargo
                $stmtGetId = $conect->prepare("SELECT role_id FROM people.roles WHERE role_name = ?");
                $stmtGetId->execute([$roleName]);
                $rid = $stmtGetId->fetchColumn();

                if ($rid) {
                    if ($shouldBeActive) {
                        // Upsert (Insert ou Ativação)
                        $conect->prepare("
                            INSERT INTO people.person_roles (person_id, org_id, role_id, is_active, deleted) 
                            VALUES (:pid, 1, :rid, TRUE, FALSE)
                            ON CONFLICT (person_id, role_id) 
                            DO UPDATE SET is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP
                        ")->execute(['pid' => $personId, 'rid' => $rid]);
                    } else {
                        // Soft Delete
                        $conect->prepare("UPDATE people.person_roles SET is_active = FALSE, deleted = TRUE WHERE person_id = :pid AND role_id = :rid")
                            ->execute(['pid' => $personId, 'rid' => $rid]);
                    }
                }
            }
        }

        // --- 3. FAMÍLIA (Mantido) ---
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

        // Remoção de familiares
        foreach ($dbFamily as $relId => $existing) {
            if (!in_array($relId, $processedIds)) {
                if (!($existing['deleted'] === true || $existing['deleted'] === 't')) {
                    $conect->prepare("UPDATE people.family_ties SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE tie_id = :id")->execute(['id' => $existing['tie_id']]);
                }
            }
        }

        $conect->commit();

        // [AUTOMACAO] Sincroniza Login (Se mudou email/cpf)
        syncUserLogin($personId);

        return success($msg, ['person_id' => $personId]);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "people", "upsertPerson", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar o cadastro.");
    }
}

// [IMPORTANTE] Função para adicionar Cargo individualmente (Usada em alguns contextos)
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

        // [AUTOMACAO] Verifica se precisa criar login ao dar o cargo
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
        // Soft delete no vínculo
        $conect->prepare("UPDATE people.person_roles SET deleted = TRUE, is_active = FALSE WHERE link_id = :id")->execute(['id' => $data['link_id']]);

        // Opcional: Se remover o cargo de Catequista, poderíamos desativar o login, 
        // mas por segurança mantemos o usuário ativo até decisão manual.

        return success("Vínculo removido.");
    } catch (Exception $e) {
        return failure("Erro ao remover vínculo.");
    }
}

// =========================================================
// [NOVO] AUTOMAÇÃO DE LOGIN (LÓGICA CENTRAL)
// =========================================================

function syncUserLogin($personId)
{
    try {
        $conect = $GLOBALS["local"];

        // 1. Busca dados da pessoa
        $stmtP = $conect->prepare("SELECT full_name, email, tax_id FROM people.persons WHERE person_id = :id");
        $stmtP->execute(['id' => $personId]);
        $person = $stmtP->fetch(PDO::FETCH_ASSOC);

        // Regra: Só cria login se tiver E-mail válido
        if (!$person || empty($person['email']) || !filter_var($person['email'], FILTER_VALIDATE_EMAIL)) return;

        // 2. Verifica Cargos Ativos
        $stmtRoles = $conect->prepare("
            SELECT r.role_name 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        ");
        $stmtRoles->execute(['id' => $personId]);
        $roles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

        // 3. Define Nível de Acesso (Hierarquia)
        $roleLevel = null;
        if (in_array('PRIEST', $roles)) $roleLevel = 'MANAGER'; // Padre = Admin Local
        elseif (in_array('SECRETARY', $roles)) $roleLevel = 'SECRETARY';
        elseif (in_array('CATECHIST', $roles)) $roleLevel = 'TEACHER'; // Catequista = Diário

        // Se não tiver cargo de liderança, não cria/atualiza usuário (Aluno/Pai não loga por enquanto)
        if (!$roleLevel) return;

        // 4. Upsert na tabela de Usuários
        $stmtUser = $conect->prepare("SELECT user_id, email FROM security.users WHERE person_id = :id");
        $stmtUser->execute(['id' => $personId]);
        $existingUser = $stmtUser->fetch(PDO::FETCH_ASSOC);

        if ($existingUser) {
            // ATUALIZAÇÃO: Se o email mudou na ficha, muda no login
            // Também atualiza o nível de permissão caso tenha sido promovido
            $conect->prepare("UPDATE security.users SET email = :em, role_level = :rl, updated_at = CURRENT_TIMESTAMP WHERE user_id = :uid")
                ->execute([
                    'em' => $person['email'],
                    'rl' => $roleLevel,
                    'uid' => $existingUser['user_id']
                ]);
        } else {
            // CRIAÇÃO: Gera senha baseada no CPF (apenas números)
            $cpfLimpo = preg_replace('/[^0-9]/', '', $person['tax_id'] ?? '');

            // Senha padrão se não tiver CPF: "mudar123"
            $rawPassword = !empty($cpfLimpo) ? $cpfLimpo : 'mudar123';
            $hash = password_hash($rawPassword, PASSWORD_DEFAULT);

            $sqlIns = "INSERT INTO security.users (org_id, person_id, name, email, password_hash, role_level, force_password_change) 
                       VALUES (1, :pid, :name, :email, :hash, :role, TRUE)";

            $conect->prepare($sqlIns)->execute([
                'pid' => $personId,
                'name' => $person['full_name'],
                'email' => $person['email'],
                'hash' => $hash,
                'role' => $roleLevel
            ]);
        }
    } catch (Exception $e) {
        // Falha silenciosa para não travar o cadastro da pessoa (mas loga o erro técnico)
        // O usuário pode ser criado manualmente depois se falhar aqui.
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
        // Otimizado para buscar apenas quem tem cargo STUDENT
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
