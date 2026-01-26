<?php

// =========================================================
// INSTITUIÇÕES
// =========================================================

function getAllDiocese($data)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = <<<'SQL'
            SELECT 
                org_id,
                display_name,
                org_type,
                address_city || ' - ' || address_state as city_state,
                phone_main,
                is_active
            FROM organization.organizations
            WHERE deleted IS FALSE AND org_type = 'DIOCESE'
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ajuste de tipos
        foreach ($result as &$row) {
            $row['is_active'] = (bool)$row['is_active'];
        }

        return success("Dioceses listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "organization", "getAllDiocese", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar dioceses.", null, false, 500);
    }
}

function getAllOrganizations($data)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = <<<'SQL'
            SELECT 
                COUNT(*) OVER() as total_registros,
                org_id,
                display_name,
                org_type,
                address_city || ' - ' || address_state as city_state,
                phone_main,
                is_active
            FROM organization.organizations
            WHERE deleted IS FALSE AND org_type != 'DIOCESE'
            ORDER BY org_id ASC
            LIMIT :limit OFFSET :page
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->bindValue(':limit', $data['limit'], PDO::PARAM_INT);
        $stmt->bindValue(':page', $data['page'], PDO::PARAM_INT);
        $stmt->execute();

        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Ajuste de tipos
        foreach ($result as &$row) {
            $row['is_active'] = (bool)$row['is_active'];
        }

        return success("Organizações listadas.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "organization", "getAllOrganizations", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar organizações.", null, false, 500);
    }
}

function getOrganizationData($orgId)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = <<<'SQL'
            SELECT *
            FROM organization.organizations
            WHERE org_id = :id AND deleted IS FALSE
            LIMIT 1
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $orgId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$result) {
            return failure("Organização não encontrada.");
        }

        return success("Dados carregados.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "organization", "getOrganizationData", "sql", $e->getMessage(), ['org_id' => $orgId]);
        return failure("Erro ao buscar dados.", null, false, 500);
    }
}

function upsertOrganization($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA: Identifica o usuário para o Trigger do Banco
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $params = [
            'legal_name' => $data['legal_name'],
            'display_name' => $data['display_name'],
            'org_type' => $data['org_type'],
            'tax_id' => $data['tax_id'],
            'phone_main' => $data['phone_main'],
            'phone_secondary' => $data['phone_secondary'] ?? null,
            'email_contact' => $data['email_contact'] ?? null,
            'website_url' => $data['website_url'] ?? null,
            'patron_saint' => $data['patron_saint'] ?? null,
            'decree_number' => $data['decree_number'] ?? null,
            'diocese_name' => $data['diocese_name'] ?? null,
            'foundation_date' => !empty($data['foundation_date']) ? $data['foundation_date'] : null,
            'address_street' => $data['address_street'],
            'address_number' => $data['address_number'],
            'address_district' => $data['address_district'],
            'address_city' => $data['address_city'],
            'address_state' => $data['address_state'],
            'zip_code' => $data['zip_code']
        ];

        if (!empty($data['org_id'])) {
            $sql = <<<'SQL'
                UPDATE organization.organizations
                SET
                    legal_name = :legal_name,
                    display_name = :display_name,
                    org_type = :org_type,
                    tax_id = :tax_id,
                    phone_main = :phone_main,
                    phone_secondary = :phone_secondary,
                    email_contact = :email_contact,
                    website_url = :website_url,
                    patron_saint = :patron_saint,
                    decree_number = :decree_number,
                    diocese_name = :diocese_name,
                    foundation_date = :foundation_date,
                    address_street = :address_street,
                    address_number = :address_number,
                    address_district = :address_district,
                    address_city = :address_city,
                    address_state = :address_state,
                    zip_code = :zip_code,
                    updated_at = CURRENT_TIMESTAMP
                WHERE org_id = :org_id
            SQL;
            $params['org_id'] = $data['org_id'];
            $msg = "Instituição atualizada!";
        } else {
            $sql = <<<'SQL'
                INSERT INTO organization.organizations 
                (legal_name, display_name, org_type, tax_id, phone_main, phone_secondary, email_contact, website_url, patron_saint, decree_number, diocese_name, foundation_date, address_street, address_number, address_district, address_city, address_state, zip_code)
                VALUES 
                (:legal_name, :display_name, :org_type, :tax_id, :phone_main, :phone_secondary, :email_contact, :website_url, :patron_saint, :decree_number, :diocese_name, :foundation_date, :address_street, :address_number, :address_district, :address_city, :address_state, :zip_code)
            SQL;
            $msg = "Instituição criada!";
        }

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "upsertOrganization", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar.", null, false, 500);
    }
}

function removeOrganization($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.organizations SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE org_id = :id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Instituição movida para a lixeira.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "removeOrganization", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover.", null, false, 500);
    }
}

function toggleOrganizationFunc($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.organizations SET is_active = :active WHERE org_id = :id";
        $stmt = $conect->prepare($sql);
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "toggleOrganization", "sql", $e->getMessage(), $data);
        return failure("Erro ao atualizar status.", null, false, 500);
    }
}


// =========================================================
// LOCAIS
// =========================================================

function getAllLocations($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => $data['limit'],
            ':page' => $data['page']
        ];

        $whereOrg = "";
        if (!empty($data['org_id'])) {
            $whereOrg = "AND l.org_id = :org_id";
            $params[':org_id'] = $data['org_id'];
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                l.*,
                o.display_name as org_name,
                p.full_name as responsible_name
            FROM organization.locations l
            JOIN organization.organizations o ON o.org_id = l.org_id
            LEFT JOIN people.persons p ON p.person_id = l.responsible_id
            WHERE l.deleted IS FALSE
            $whereOrg
            ORDER BY l.name ASC
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
            $row['is_accessible'] = (bool)$row['is_accessible'];
            $row['has_ac'] = (bool)$row['has_ac'];
            $row['is_consecrated'] = (bool)$row['is_consecrated'];
            $row['is_active'] = (bool)$row['is_active'];
            $row['resources'] = json_decode($row['resources_detail'] ?? '{}', true);
        }

        return success("Locais listados.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "organization", "getAllLocations", "sql", $e->getMessage(), $data);
        return failure("Erro ao listar locais.", null, false, 500);
    }
}

function upsertLocation($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $resources = [
            'whiteboard' => filter_var($data['has_whiteboard'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'projector' => filter_var($data['has_projector'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'sound' => filter_var($data['has_sound'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'wifi' => filter_var($data['has_wifi'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'kitchen' => filter_var($data['has_kitchen'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'parking' => filter_var($data['has_parking'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'fan' => filter_var($data['has_fan'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'water' => filter_var($data['has_water'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'computer' => filter_var($data['has_computer'] ?? false, FILTER_VALIDATE_BOOLEAN),
        ];

        $params = [
            'name' => $data['name'],
            'capacity' => (int)$data['capacity'],
            'has_ac' => filter_var($data['has_ac'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
            'is_accessible' => filter_var($data['is_accessible'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
            'is_sacred' => filter_var($data['is_consecrated'] ?? false, FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE',
            'resources_detail' => json_encode($resources),
            'address_street' => !empty($data['address_street']) ? $data['address_street'] : null,
            'address_number' => !empty($data['address_number']) ? $data['address_number'] : null,
            'address_district' => !empty($data['address_district']) ? $data['address_district'] : null,
            'zip_code' => !empty($data['zip_code']) ? $data['zip_code'] : null,
            'responsible_id' => !empty($data['responsible_id']) ? $data['responsible_id'] : null
        ];

        if (!empty($data['location_id'])) {
            $sql = <<<'SQL'
                UPDATE organization.locations
                SET
                    name = :name,
                    capacity = :capacity,
                    has_ac = :has_ac,
                    is_accessible = :is_accessible,
                    is_consecrated = :is_sacred,
                    resources_detail = :resources_detail,
                    address_street = :address_street,
                    address_number = :address_number,
                    address_district = :address_district,
                    zip_code = :zip_code,
                    responsible_id = :responsible_id,
                    updated_at = CURRENT_TIMESTAMP
                WHERE location_id = :location_id
            SQL;
            $params['location_id'] = $data['location_id'];
            $msg = "Local atualizado!";
        } else {
            if (empty($data['org_id'])) {
                $conect->rollBack();
                return failure("Selecione uma instituição.");
            }
            $sql = <<<'SQL'
                INSERT INTO organization.locations 
                (org_id, name, capacity, has_ac, is_accessible, is_consecrated, resources_detail, address_street, address_number, address_district, zip_code, responsible_id)
                VALUES 
                (:org_id, :name, :capacity, :has_ac, :is_accessible, :is_sacred, :resources_detail, :address_street, :address_number, :address_district, :zip_code, :responsible_id)
            SQL;
            $params['org_id'] = $data['org_id'];
            $msg = "Local criado!";
        }

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        $conect->commit();
        return success($msg);
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "upsertLocation", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar local.", null, false, 500);
    }
}

function removeLocation($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.locations SET deleted = TRUE, is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE location_id = :id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['id']]);

        $conect->commit();
        return success("Local removido.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "removeLocation", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover local.", null, false, 500);
    }
}

function toggleLocationFunc($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // AUDITORIA
        if (!empty($data['user_id'])) {
            $stmtAudit = $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)");
            $stmtAudit->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE organization.locations SET is_active = :active WHERE location_id = :id";
        $stmt = $conect->prepare($sql);
        $status = ($data['active'] === 'true' || $data['active'] === true);
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        $conect->rollBack();
        logSystemError("painel", "organization", "toggleLocation", "sql", $e->getMessage(), $data);
        return failure("Erro ao atualizar status.", null, false, 500);
    }
}

function getPeopleForSelect()
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT person_id, full_name FROM people.persons WHERE deceased IS FALSE ORDER BY full_name ASC";
        $stmt = $conect->query($sql);
        return success("Pessoas listadas", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        return failure("Erro ao listar pessoas.");
    }
}
