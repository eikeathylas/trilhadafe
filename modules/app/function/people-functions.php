<?php

// =========================================================
// GESTÃO DE PESSOAS (MODEL) - V4.5 (Fixed Catch Returns)
// =========================================================

function getAllPeople($data)
{
    try {
        $conect = $GLOBALS["local"];

        $params = [
            ':limit' => (int)$data['limit'],
            ':page' => (int)$data['page']
        ];

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
        return failure("Erro ao listar pessoas.", null, false, 500);
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
        $sqlRoles = "SELECT DISTINCT r.role_name, r.role_id, r.description_pt 
                     FROM people.person_roles pr
                     JOIN people.roles r ON pr.role_id = r.role_id
                     WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE";
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles_data'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
        $person['roles'] = array_column($person['roles_data'], 'role_name');

        // Busca Família
        $sqlFamily = "SELECT ft.tie_id, ft.relative_id, ft.relationship_type, ft.is_financial_responsible, ft.is_legal_guardian, p.full_name as relative_name
                      FROM people.family_ties ft
                      JOIN people.persons p ON p.person_id = ft.relative_id
                      WHERE ft.person_id = :id AND ft.deleted IS FALSE";
        $stmtFamily = $conect->prepare($sqlFamily);
        $stmtFamily->execute(['id' => $personId]);
        $person['family'] = $stmtFamily->fetchAll(PDO::FETCH_ASSOC);

        // [AJUSTE] Busca Anexos com Data Formatada (DD/MM/YYYY HH:mm)
        $sqlAttach = "SELECT 
                        attachment_id, 
                        file_name, 
                        file_path, 
                        description, 
                        TO_CHAR(uploaded_at, 'DD/MM/YYYY HH24:MI') as uploaded_at 
                      FROM people.person_attachments 
                      WHERE person_id = :id AND deleted IS FALSE 
                      ORDER BY uploaded_at DESC";

        $stmtAttach = $conect->prepare($sqlAttach);
        $stmtAttach->execute(['id' => $personId]);
        $person['attachments'] = $stmtAttach->fetchAll(PDO::FETCH_ASSOC);

        // Castings e JSONs
        $person['is_pcd'] = (bool)$person['is_pcd'];
        $person['sacraments_info'] = json_decode($person['sacraments_info'] ?? '{}', true);

        if (!isset($person['sacraments_info']['eucharist_date']) && !empty($person['eucharist_date'])) {
            $person['sacraments_info']['eucharist_date'] = $person['eucharist_date'];
        }
        if (!isset($person['sacraments_info']['eucharist_place']) && !empty($person['eucharist_place'])) {
            $person['sacraments_info']['eucharist_place'] = $person['eucharist_place'];
        }

        foreach ($person['family'] as &$fam) {
            $fam['is_financial_responsible'] = (bool)$fam['is_financial_responsible'];
            $fam['is_legal_guardian'] = (bool)$fam['is_legal_guardian'];
        }

        return success("Dados carregados.", $person);
    } catch (Exception $e) {
        logSystemError("painel", "people", "getPersonData", "sql", $e->getMessage(), ['id' => $personId]);
        return failure("Erro ao carregar cadastro.", null, false, 500);
    }
}

function upsertPerson($data, $files = [])
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

        // Extração de dados da Eucaristia do JSON
        $sacramentsJson = $data['sacraments_info'] ?? null;
        $sacArray = [];
        if ($sacramentsJson) {
            $sacArray = json_decode($sacramentsJson, true);
            if (is_array($sacArray)) {
                // Remove valores vazios
                foreach ($sacArray as $k => $v) if ($v === "" || $v === null || $v === 'null') unset($sacArray[$k]);
            }
        }

        $eucDate = !empty($data['eucharist_date']) ? $data['eucharist_date'] : ($sacArray['eucharist_date'] ?? null);
        $eucPlace = !empty($data['eucharist_place']) ? $sanitize($data['eucharist_place']) : ($sanitize($sacArray['eucharist_place'] ?? null));

        // Reconstrói JSON limpo para salvar
        $sacramentsJson = !empty($sacArray) ? json_encode($sacArray) : null;

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
            'eucharist_date' => $eucDate,
            'eucharist_place' => $eucPlace
        ];

        $personId = null;
        if (!empty($data['person_id'])) {
            // UPDATE
            $sql = <<<'SQL'
                UPDATE people.persons SET
                    full_name = :full_name, religious_name = :religious_name, birth_date = :birth_date,
                    gender = :gender, tax_id = :tax_id, national_id = :national_id, email = :email,
                    phone_mobile = :phone_mobile, phone_landline = :phone_landline, zip_code = :zip_code,
                    address_street = :address_street, address_number = :address_number, address_district = :address_district,
                    address_city = :address_city, address_state = :address_state, is_pcd = :is_pcd,
                    pcd_details = :pcd_details, sacraments_info = :sacraments_info, 
                    eucharist_date = :eucharist_date, eucharist_place = :eucharist_place,
                    updated_at = CURRENT_TIMESTAMP
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
                (org_id_origin, full_name, religious_name, birth_date, gender, tax_id, national_id, email, phone_mobile, phone_landline, zip_code, address_street, address_number, address_district, address_city, address_state, is_pcd, pcd_details, profile_photo_url, sacraments_info, eucharist_date, eucharist_place)
                VALUES 
                (:org_id, :full_name, :religious_name, :birth_date, :gender, :tax_id, :national_id, :email, :phone_mobile, :phone_landline, :zip_code, :address_street, :address_number, :address_district, :address_city, :address_state, :is_pcd, :pcd_details, :profile_photo_url, :sacraments_info, :eucharist_date, :eucharist_place)
                RETURNING person_id
            SQL;
            $paramsPerson['org_id'] = $orgId;
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsPerson);
            $personId = $stmt->fetchColumn();
            $msg = "Pessoa cadastrada com sucesso!";
        }

        // --- GESTÃO DE FOTO DE PERFIL (UPLOAD) ---
        if (isset($files["profile_photo"]) && $files["profile_photo"]["error"] === UPLOAD_ERR_OK) {
            $clientId = $data['id_client'] ?? 0;

            if ($clientId > 0 && $personId) {
                // Estrutura: assets/uploads/{client}/{person}/perfil/
                $relativeDir = "assets/uploads/" . $clientId . "/" . $personId . "/perfil/";
                $targetDir = __DIR__ . "/../../" . $relativeDir;

                if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

                // Limpeza: Apaga foto antiga
                $stmtOld = $conect->prepare("SELECT profile_photo_url FROM people.persons WHERE person_id = :id");
                $stmtOld->execute(['id' => $personId]);
                $oldPath = $stmtOld->fetchColumn();

                if ($oldPath) {
                    $fullOldPath = __DIR__ . "/../../" . $oldPath;
                    if (file_exists($fullOldPath) && is_file($fullOldPath)) unlink($fullOldPath);
                }

                // Salva Nova
                $ext = strtolower(pathinfo($files["profile_photo"]["name"], PATHINFO_EXTENSION));
                $newFilename = time() . "_" . uniqid() . "." . $ext;

                if (move_uploaded_file($files["profile_photo"]["tmp_name"], $targetDir . $newFilename)) {
                    $dbPath = $relativeDir . $newFilename;
                    $conect->prepare("UPDATE people.persons SET profile_photo_url = :url WHERE person_id = :id")
                        ->execute(['url' => $dbPath, 'id' => $personId]);
                }
            }
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
                        $conect->prepare("INSERT INTO people.person_roles (person_id, org_id, role_id, is_active, deleted) VALUES (:pid, 1, :rid, TRUE, FALSE) ON CONFLICT (person_id, role_id) DO UPDATE SET is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP")->execute(['pid' => $personId, 'rid' => $rid]);
                    } else {
                        $conect->prepare("UPDATE people.person_roles SET is_active = FALSE, deleted = TRUE WHERE person_id = :pid AND role_id = :rid")->execute(['pid' => $personId, 'rid' => $rid]);
                    }
                }
            }
        }

        // --- 3. FAMÍLIA ---
        $newFamilyList = !empty($data['family_json']) ? json_decode($data['family_json'], true) : [];
        $processedIds = [];

        foreach ($newFamilyList as $fam) {
            $relId = $fam['relative_id'];
            $processedIds[] = $relId;
            $newType = $fam['relationship_type'];
            $newFin = filter_var($fam['is_financial_responsible'], FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE';
            $newLeg = filter_var($fam['is_legal_guardian'], FILTER_VALIDATE_BOOLEAN) ? 'TRUE' : 'FALSE';

            // Verifica se vínculo já existe (ignora deleted para reativar)
            $stmtCheck = $conect->prepare("SELECT tie_id, deleted, relationship_type, is_financial_responsible, is_legal_guardian FROM people.family_ties WHERE person_id = :pid AND relative_id = :rid");
            $stmtCheck->execute(['pid' => $personId, 'rid' => $relId]);
            $existing = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                // Atualiza se mudou algo ou se estava deletado
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

        // Soft delete em quem foi removido da lista
        if (!empty($processedIds)) {
            $inQuery = implode(',', array_map('intval', $processedIds));
            $conect->prepare("UPDATE people.family_ties SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE person_id = :pid AND relative_id NOT IN ($inQuery)")->execute(['pid' => $personId]);
        } else {
            $conect->prepare("UPDATE people.family_ties SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE person_id = :pid")->execute(['pid' => $personId]);
        }

        $conect->commit();

        // Sincroniza Login
        syncUserLogin($personId);

        return success($msg, ['person_id' => $personId]);
    } catch (Exception $e) {
        if ($conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "people", "upsertPerson", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao salvar o cadastro.", null, false, 500);
    }
}

function savePersonAttachment($data, $files)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // [AUDITORIA] Garante que o banco saiba quem está inserindo
        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $personId = $data['person_id'];
        $clientId = isset($data['id_client']) ? (int)$data['id_client'] : 0;
        $desc = $data['description'] ?? 'Documento sem título';

        if (!isset($files['file']) || $files['file']['error'] !== UPLOAD_ERR_OK) {
            return failure("Nenhum arquivo enviado ou erro no upload.", null, false, 400);
        }

        if ($clientId <= 0 || empty($personId)) {
            return failure("Dados de cliente ou pessoa inválidos.", null, false, 400);
        }

        $relativeDir = "assets/uploads/" . $clientId . "/" . $personId . "/documentos/";
        $targetDir = __DIR__ . "/../../" . $relativeDir;

        if (!is_dir($targetDir)) {
            if (!mkdir($targetDir, 0755, true)) {
                return failure("Erro ao criar diretório de armazenamento.", null, false, 500);
            }
        }

        $file = $files['file'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

        if (!in_array($ext, $allowed)) {
            return failure("Formato não permitido. Use PDF, Imagem ou Word.", null, false, 400);
        }

        $newName = time() . "_" . uniqid() . "." . $ext;
        $targetFile = $targetDir . $newName;
        $webPath = $relativeDir . $newName;

        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            $sql = "INSERT INTO people.person_attachments (person_id, file_name, file_path, description, uploaded_by) 
                    VALUES (:pid, :name, :path, :desc, :uid)";
            $stmt = $conect->prepare($sql);
            $stmt->execute([
                'pid' => $personId,
                'name' => $file['name'],
                'path' => $webPath,
                'desc' => $desc,
                'uid' => $data['user_id']
            ]);

            $conect->commit();
            return success("Documento anexado com sucesso.");
        } else {
            return failure("Falha ao mover arquivo para o servidor.", null, false, 500);
        }
    } catch (Exception $e) {
        if (isset($conect) && $conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "people", "savePersonAttachment", "io", $e->getMessage(), $data);
        return failure("Erro interno ao salvar anexo.", null, false, 500);
    }
}

function deletePersonAttachment($data)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // [AUDITORIA] Garante que o banco saiba quem está removendo
        if (!empty($data['user_id'])) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sql = "UPDATE people.person_attachments SET deleted = TRUE WHERE attachment_id = :id";
        $stmt = $conect->prepare($sql);
        $stmt->execute(['id' => $data['attachment_id']]);

        $conect->commit();
        return success("Anexo removido.");
    } catch (Exception $e) {
        if (isset($conect) && $conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "people", "deletePersonAttachment", "sql", $e->getMessage(), $data);
        return failure("Erro ao remover anexo.", null, false, 500);
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
        if ($conect->inTransaction()) $conect->rollBack();
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

        $status = ($data['active'] === 'true' || $data['active'] === true);
        $statusBool = $status ? 'TRUE' : 'FALSE';

        $stmt = $conect->prepare("UPDATE people.persons SET is_active = :active WHERE person_id = :id");
        $stmt->bindValue(':active', $status, PDO::PARAM_BOOL);
        $stmt->bindValue(':id', $data['id'], PDO::PARAM_INT);
        $stmt->execute();

        // 3. Atualiza Usuário (Local)
        $stmtGet = $conect->prepare("SELECT user_id, email FROM security.users WHERE person_id = :pid");
        $stmtGet->execute(['pid' => $data['id']]);
        $localUser = $stmtGet->fetch(PDO::FETCH_ASSOC);

        if ($localUser) {
            $stmtUpUser = $conect->prepare("UPDATE security.users SET is_active = :st WHERE user_id = :uid");
            $stmtUpUser->execute(['st' => $statusBool, 'uid' => $localUser['user_id']]);

            // 4. Atualiza Staff (Global)
            $conectStaff = getStaff();
            if ($conectStaff && !empty($localUser['email'])) {
                try {
                    $conectStaff->beginTransaction();
                    $stmtS = $conectStaff->prepare("SELECT id FROM users WHERE email = :email");
                    $stmtS->execute(['email' => $localUser['email']]);
                    $staffId = $stmtS->fetchColumn();

                    if ($staffId) {
                        $conectStaff->prepare("UPDATE users SET active = :st, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                            ->execute(['st' => $statusBool, 'id' => $staffId]);

                        $clientId = 1;
                        $conectStaff->prepare("UPDATE users_clients_profiles SET active = :st, updated_at = CURRENT_TIMESTAMP WHERE id_user = :uid AND id_client = :cid")
                            ->execute(['st' => $statusBool, 'uid' => $staffId, 'cid' => $clientId]);
                    }
                    $conectStaff->commit();
                } catch (Exception $eStaff) {
                    $conectStaff->rollBack();
                    logSystemError("painel", "people", "togglePersonStatus_Staff", "sql", $eStaff->getMessage(), $data);
                }
            }
        }

        $conect->commit();
        return success("Status atualizado.");
    } catch (Exception $e) {
        if ($conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "people", "togglePersonStatus", "sql", $e->getMessage(), $data);
        return failure("Ocorreu um erro ao atualizar o status.", null, false, 500);
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
        return failure("Erro na busca de alunos.", null, false, 500);
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

        $sql = "SELECT p.person_id as id, p.full_name as title FROM people.persons p $where ORDER BY p.full_name ASC LIMIT 20";
        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "getCatechistsForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de catequistas.", null, false, 500);
    }
}
function syncUserLogin($personId)
{
    try {
        $conect = $GLOBALS["local"];
        $conectStaff = getStaff();

        $stmtP = $conect->prepare("SELECT full_name, email, tax_id FROM people.persons WHERE person_id = :id");
        $stmtP->execute(['id' => $personId]);
        $person = $stmtP->fetch(PDO::FETCH_ASSOC);

        if (!$person || empty($person['email']) || !filter_var($person['email'], FILTER_VALIDATE_EMAIL)) return;

        $stmtRoles = $conect->prepare("SELECT r.role_name FROM people.person_roles pr JOIN people.roles r ON pr.role_id = r.role_id WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE");
        $stmtRoles->execute(['id' => $personId]);
        $roles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

        $roleLevel = null;
        if (in_array('PRIEST', $roles)) $roleLevel = 'MANAGER';
        elseif (in_array('SECRETARY', $roles)) $roleLevel = 'SECRETARY';
        elseif (in_array('CATECHIST', $roles)) $roleLevel = 'TEACHER';

        if (!$roleLevel) return;

        $cpfLimpo = preg_replace('/[^0-9]/', '', $person['tax_id'] ?? '');
        $rawPassword = !empty($cpfLimpo) ? $cpfLimpo : 'mudar123';
        $hash = $rawPassword;

        $staffUserId = null;

        if ($conectStaff) {
            try {
                $conectStaff->beginTransaction();
                $stmtS = $conectStaff->prepare("SELECT id FROM users WHERE email = :email");
                $stmtS->execute(['email' => $person['email']]);
                $staffUserId = $stmtS->fetchColumn();

                if ($staffUserId) {
                    $conectStaff->prepare("UPDATE users SET name = :name, email = :email, password = :pass, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                        ->execute(['name' => $person['full_name'], 'email' => $person['email'], 'pass' => $hash, 'id' => $staffUserId]);
                } else {
                    $conectStaff->prepare("INSERT INTO users (name, email, password, create_in, updated_at) VALUES (:name, :email, :pass, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                        ->execute(['name' => $person['full_name'], 'email' => $person['email'], 'pass' => $hash]);
                    $staffUserId = $conectStaff->lastInsertId();
                }

                $clientId = 1;
                $profileId = ($roleLevel == 'MANAGER') ? 50 : (($roleLevel == 'SECRETARY') ? 40 : 30);

                $stmtLink = $conectStaff->prepare("SELECT id FROM users_clients_profiles WHERE id_user = :uid AND id_client = :cid");
                $stmtLink->execute(['uid' => $staffUserId, 'cid' => $clientId]);

                if (!$stmtLink->fetchColumn()) {
                    $conectStaff->prepare("INSERT INTO users_clients_profiles (id_user, id_client, id_profile, create_in, updated_at) VALUES (:uid, :cid, :pid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                        ->execute(['uid' => $staffUserId, 'cid' => $clientId, 'pid' => $profileId]);
                }
                $conectStaff->commit();
            } catch (Exception $eStaff) {
                $conectStaff->rollBack();
                return;
            }
        }

        if ($staffUserId) {
            try {
                $conect->beginTransaction();
                $stmtL = $conect->prepare("SELECT user_id FROM security.users WHERE person_id = :id");
                $stmtL->execute(['id' => $personId]);

                if ($stmtL->fetchColumn()) {
                    $conect->prepare("UPDATE security.users SET email = :em, role_level = :rl, name = :nm WHERE user_id = :uid")
                        ->execute(['em' => $person['email'], 'rl' => $roleLevel, 'nm' => $person['full_name'], 'uid' => $stmtL->fetchColumn()]);
                } else {
                    $conect->prepare("INSERT INTO security.users (user_id, org_id, person_id, name, email, role_level) VALUES (:uid, 1, :pid, :name, :email, :role)")
                        ->execute(['uid' => $staffUserId, 'pid' => $personId, 'name' => $person['full_name'], 'email' => $person['email'], 'role' => $roleLevel]);
                }
                $conect->commit();
            } catch (Exception $eLocal) {
                $conect->rollBack();
            }
        }
    } catch (Exception $e) {
    }
}
