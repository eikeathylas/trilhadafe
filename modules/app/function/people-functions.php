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

        // Filtro por Função
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
                -- Agrega os nomes dos cargos em uma string (ex: "Aluno, Pai")
                (
                    SELECT STRING_AGG(r.description_pt, ', ')
                    FROM people.person_roles pr
                    JOIN people.roles r ON pr.role_id = r.role_id
                    WHERE pr.person_id = p.person_id 
                    AND pr.deleted IS FALSE 
                    AND pr.is_active IS TRUE
                ) as roles_list,
                -- Agrega os códigos dos cargos para lógica de cor no front
                (
                    SELECT STRING_AGG(r.role_name, ',')
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
        return failure("Ocorreu um erro ao listar os dados. Contate o suporte.", null, false, 500);
    }
}

function getPersonData($personId)
{
    try {
        $conect = $GLOBALS["local"];

        // 1. Dados Pessoais
        $sqlPerson = "SELECT * FROM people.persons WHERE person_id = :id AND deleted IS FALSE LIMIT 1";
        $stmt = $conect->prepare($sqlPerson);
        $stmt->execute(['id' => $personId]);
        $person = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$person) {
            return failure("Pessoa não encontrada.");
        }

        // 2. Vínculos (Roles) Ativos
        $sqlRoles = <<<'SQL'
            SELECT r.role_name 
            FROM people.person_roles pr
            JOIN people.roles r ON pr.role_id = r.role_id
            WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE
        SQL;
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles'] = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

        // 3. Família
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

        // Ajuste de tipos
        $person['is_pcd'] = (bool)$person['is_pcd'];
        $person['sacraments_info'] = json_decode($person['sacraments_info'] ?? '{}', true);

        foreach ($person['family'] as &$fam) {
            $fam['is_financial_responsible'] = (bool)$fam['is_financial_responsible'];
            $fam['is_legal_guardian'] = (bool)$fam['is_legal_guardian'];
        }

        return success("Dados carregados.", $person);
    } catch (Exception $e) {
        logSystemError("painel", "people", "getPersonData", "sql", $e->getMessage(), ['id' => $personId]);
        return failure("Ocorreu um erro ao carregar os dados. Contate o suporte.", null, false, 500);
    }
}

function upsertPerson($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        // --- 1. SALVAR PESSOA ---
        $paramsPerson = [
            'full_name' => $data['full_name'],
            'religious_name' => $data['religious_name'] ?? null,
            'birth_date' => !empty($data['birth_date']) ? $data['birth_date'] : null,
            'gender' => $data['gender'] ?? null,
            'tax_id' => $data['tax_id'] ?? null,
            'national_id' => $data['national_id'] ?? null,
            'email' => $data['email'] ?? null,
            'phone_mobile' => $data['phone_mobile'] ?? null,
            'phone_landline' => $data['phone_landline'] ?? null,
            'zip_code' => $data['zip_code'] ?? null,
            'address_street' => $data['address_street'] ?? null,
            'address_number' => $data['address_number'] ?? null,
            'address_district' => $data['address_district'] ?? null,
            'address_city' => $data['address_city'] ?? null,
            'address_state' => $data['address_state'] ?? null,
            'is_pcd' => filter_var($data['is_pcd'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
            'pcd_details' => $data['pcd_details'] ?? null,
            'profile_photo_url' => $data['profile_photo_url'] ?? null,
            'sacraments_info' => $data['sacraments_info'] ?? null,
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

            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsPerson);
            $personId = $data['person_id'];
            $msg = "Cadastro atualizado!";
        } else {
            // INSERT
            $orgId = 1; // ID da Paróquia

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

        // --- 2. SALVAR VÍNCULOS ---
        // Limpa anteriores
        $sqlCleanRoles = "UPDATE people.person_roles SET deleted = TRUE, is_active = FALSE WHERE person_id = :pid AND org_id = 1";
        $conect->prepare($sqlCleanRoles)->execute(['pid' => $personId]);

        $rolesToCheck = ['STUDENT', 'CATECHIST', 'PRIEST', 'PARENT'];
        foreach ($rolesToCheck as $roleName) {
            if (filter_var($data['role_' . strtolower($roleName)] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                $stmtRole = $conect->prepare("SELECT role_id FROM people.roles WHERE role_name = ?");
                $stmtRole->execute([$roleName]);
                $roleId = $stmtRole->fetchColumn();

                if ($roleId) {
                    $sqlInsRole = "INSERT INTO people.person_roles (person_id, org_id, role_id) VALUES (:pid, 1, :rid)";
                    $conect->prepare($sqlInsRole)->execute(['pid' => $personId, 'rid' => $roleId]);
                }
            }
        }

        // --- 3. SALVAR FAMÍLIA ---
        if (!empty($data['family_json'])) {
            $familyList = json_decode($data['family_json'], true);

            // Limpa anteriores
            $sqlCleanFam = "UPDATE people.family_ties SET deleted = TRUE WHERE person_id = :pid";
            $conect->prepare($sqlCleanFam)->execute(['pid' => $personId]);

            foreach ($familyList as $fam) {
                $sqlInsFam = <<<'SQL'
                    INSERT INTO people.family_ties (person_id, relative_id, relationship_type, is_financial_responsible, is_legal_guardian)
                    VALUES (:pid, :rid, :type, :fin, :legal)
                SQL;
                $conect->prepare($sqlInsFam)->execute([
                    'pid' => $personId,
                    'rid' => $fam['relative_id'],
                    'type' => $fam['relationship_type'],
                    'fin' => filter_var($fam['is_financial_responsible'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
                    'legal' => filter_var($fam['is_legal_guardian'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE'
                ]);
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
