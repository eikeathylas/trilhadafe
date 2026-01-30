<?php

function getAllPeople($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => $data['limit'],
            ':page' => $data['page']
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

        $sqlRoles = <<<'SQL'
            SELECT DISTINCT r.role_name 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        SQL;
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles'] = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

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
        // Transforma vazio, espaços duplos e strings "null" em NULL real
        $sanitize = function ($val) {
            if (is_string($val)) {
                $val = trim(preg_replace('/\s+/', ' ', $val));
                return ($val === '' || $val === 'null') ? null : $val;
            }
            return $val;
        };

        // --- LIMPEZA DE SACRAMENTOS ---
        // Remove chaves com valores falsos ou vazios para não salvar JSON inútil
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
            'is_pcd' => filter_var($data['is_pcd'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
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

        // --- 2. VÍNCULOS (CORREÇÃO TOTAL: LINK_ID E DEDUPLICAÇÃO) ---
        $rolesToCheck = ['STUDENT', 'CATECHIST', 'PRIEST', 'PARENT'];

        foreach ($rolesToCheck as $roleName) {
            $shouldBeActive = filter_var($data['role_' . strtolower($roleName)] ?? false, FILTER_VALIDATE_BOOLEAN);

            // Pega ID do Cargo
            $stmtGetId = $conect->prepare("SELECT role_id FROM people.roles WHERE role_name = ?");
            $stmtGetId->execute([$roleName]);
            $rid = $stmtGetId->fetchColumn();

            if ($rid) {
                // Busca TODOS os registros (link_id) para detectar duplicatas
                $stmtCheck = $conect->prepare("SELECT link_id, deleted, is_active FROM people.person_roles WHERE person_id = :pid AND role_id = :rid ORDER BY link_id ASC");
                $stmtCheck->execute(['pid' => $personId, 'rid' => $rid]);
                $allLinks = $stmtCheck->fetchAll(PDO::FETCH_ASSOC);

                if ($shouldBeActive) {
                    if (empty($allLinks)) {
                        // A: Não existe -> INSERT
                        $conect->prepare("INSERT INTO people.person_roles (person_id, org_id, role_id, is_active) VALUES (:pid, 1, :rid, TRUE)")
                            ->execute(['pid' => $personId, 'rid' => $rid]);
                    } else {
                        // B: Existe (1 ou mais) -> Usa o primeiro, atualiza e apaga o resto
                        $first = array_shift($allLinks); // Pega o primeiro da lista

                        $isDeleted = ($first['deleted'] === true || $first['deleted'] === 't');
                        $isActive = ($first['is_active'] === true || $first['is_active'] === 't');

                        // Só faz UPDATE se realmente precisar (evita log falso)
                        if ($isDeleted || !$isActive) {
                            $conect->prepare("UPDATE people.person_roles SET deleted = FALSE, is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE link_id = :id")
                                ->execute(['id' => $first['link_id']]);
                        }

                        // Limpeza de duplicatas (se houver mais de 1 registro)
                        foreach ($allLinks as $duplicate) {
                            $conect->prepare("DELETE FROM people.person_roles WHERE link_id = :id")->execute(['id' => $duplicate['link_id']]);
                        }
                    }
                } else {
                    // C: Desativar -> Garante que TODOS estejam deletados
                    if (!empty($allLinks)) {
                        foreach ($allLinks as $link) {
                            $isDeleted = ($link['deleted'] === true || $link['deleted'] === 't');
                            if (!$isDeleted) {
                                $conect->prepare("UPDATE people.person_roles SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE link_id = :id")
                                    ->execute(['id' => $link['link_id']]);
                            }
                        }
                    }
                }
            }
        }

        // --- 3. FAMÍLIA (Revisado) ---
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

                if (
                    $isDeleted || $existing['relationship_type'] !== $newType ||
                    $existing['is_financial_responsible'] !== ($newFin === 'TRUE') ||
                    $existing['is_legal_guardian'] !== ($newLeg === 'TRUE')
                ) {

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
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "people", "upsertPerson", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar o cadastro. Contate o suporte.", null, false, 500);
    }
}

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

        $params = [];
        $where = "WHERE deceased IS FALSE AND deleted IS FALSE";

        if (!empty($search)) {
            $where .= " AND (full_name ILIKE :search OR tax_id ILIKE :search)";
            $params['search'] = "%" . $search . "%";
        }

        $sql = <<<SQL
            SELECT 
                person_id as id, 
                full_name as title,
                tax_id 
            FROM people.persons 
            $where
            ORDER BY full_name ASC 
            LIMIT 20
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "searchPeopleForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de pessoas.", null, false, 500);
    }
}

function getStudentsForSelect($search)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [];
        // Filtra por Role STUDENT
        $where = "WHERE p.deleted IS FALSE AND p.is_active IS TRUE 
                  AND EXISTS (
                      SELECT 1 FROM people.person_roles pr 
                      JOIN people.roles r ON pr.role_id = r.role_id 
                      WHERE pr.person_id = p.person_id 
                      AND pr.deleted IS FALSE 
                      AND pr.is_active IS TRUE
                      AND r.role_name = 'STUDENT'
                  )";

        if (!empty($search)) {
            $where .= " AND (p.full_name ILIKE :search OR p.tax_id ILIKE :search)";
            $params['search'] = "%" . $search . "%";
        }

        $sql = <<<SQL
            SELECT 
                p.person_id as id, 
                p.full_name as title,
                p.tax_id 
            FROM people.persons p 
            $where
            ORDER BY p.full_name ASC 
            LIMIT 20
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "getStudentsForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de alunos.");
    }
}

// [NOVO] Função para buscar apenas catequistas (usada no modal de Turmas)
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
