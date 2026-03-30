<?php


function getAllPeople($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

        $params = [
            ':limit' => (int)$data['limit'],
            ':page' => (int)$data['page'],
            ':oid' => $orgId
        ];

        // Filtro de Organização: Origem OU Vínculo Ativo
        $where = "WHERE p.deleted IS FALSE 
                  AND (
                      p.org_id_origin = :oid 
                      OR EXISTS (
                          SELECT 1 FROM people.person_roles pr 
                          WHERE pr.person_id = p.person_id 
                          AND pr.org_id = :oid 
                          AND pr.deleted IS FALSE
                      )
                  )";

        if (!empty($data['search'])) {
            // [CORREÇÃO] Inclusão do phone_mobile na busca textual
            $where .= " AND (p.full_name ILIKE :search OR p.tax_id ILIKE :search OR p.email ILIKE :search OR p.phone_mobile ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['role_filter'])) {
            // [CORREÇÃO] Comparação direta pelo role_id (mais rápido, sem JOIN) e Cast para INT
            $where .= " AND EXISTS (
                SELECT 1 FROM people.person_roles pr 
                WHERE pr.person_id = p.person_id 
                AND pr.deleted IS FALSE 
                AND pr.is_active IS TRUE
                AND pr.role_id = :role_filter
            )";
            $params[':role_filter'] = (int)$data['role_filter'];
        }

        $sql = <<<SQL
            SELECT 
                COUNT(*) OVER() as total_registros,
                p.person_id,
                p.full_name,
                p.tax_id,
                p.birth_date,
                p.religious_name,
                p.profile_photo_url,
                p.email,
                p.phone_mobile,
                p.is_active,
                p.wants_whatsapp_group,
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
            ORDER BY p.full_name ASC, p.birth_date DESC
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

        // Busca Vínculos (Roles)
        $sqlRoles = "SELECT DISTINCT r.role_name, r.role_id, r.description_pt 
                     FROM people.person_roles pr
                     JOIN people.roles r ON pr.role_id = r.role_id
                     WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE";
        $stmtRoles = $conect->prepare($sqlRoles);
        $stmtRoles->execute(['id' => $personId]);
        $person['roles_data'] = $stmtRoles->fetchAll(PDO::FETCH_ASSOC);
        $person['roles'] = array_column($person['roles_data'], 'role_name');

        // Busca Família
        $sqlFamily = "SELECT ft.tie_id, ft.relative_id, ft.relationship_type, ft.is_financial_responsible, ft.is_legal_guardian, 
                     p.full_name as relative_name, p.profile_photo_url
                    FROM people.family_ties ft
                    JOIN people.persons p ON p.person_id = ft.relative_id
                    WHERE ft.person_id = :id AND ft.deleted IS FALSE";
        $stmtFamily = $conect->prepare($sqlFamily);
        $stmtFamily->execute(['id' => $personId]);
        $person['family'] = $stmtFamily->fetchAll(PDO::FETCH_ASSOC);

        // Busca Anexos com Auditoria de Usuário
        $sqlAtt = "SELECT a.attachment_id, a.file_name, a.file_path, a.description, TO_CHAR(a.uploaded_at, 'DD/MM/YYYY HH24:MI') as created_at_fmt, u.name as uploader_name
                   FROM people.person_attachments a
                   LEFT JOIN security.users u ON a.uploaded_by = u.user_id
                   WHERE a.person_id = :id AND a.deleted IS FALSE ORDER BY a.uploaded_at DESC";
        $stmtAtt = $conect->prepare($sqlAtt);
        $stmtAtt->execute(['id' => $personId]);
        $person['attachments'] = $stmtAtt->fetchAll(PDO::FETCH_ASSOC);

        // Castings e Tratamento de JSON
        $person['is_pcd'] = ($person['is_pcd'] === 't' || $person['is_pcd'] === true);
        $person['sacraments_info'] = json_decode($person['sacraments_info'] ?? '{}', true);

        // Garante compatibilidade de campos de Eucaristia
        if (empty($person['sacraments_info']['eucharist']['date'])) {
            $person['sacraments_info']['eucharist']['date'] = $person['eucharist_date'] ?? "";
            $person['sacraments_info']['eucharist']['place'] = $person['eucharist_place'] ?? "";
        }

        // Busca Padrinho/Madrinha
        $stmtGod = $conect->prepare("SELECT * FROM people.person_godparents WHERE person_id = :id");
        $stmtGod->execute(['id' => $personId]);
        $godparent = $stmtGod->fetch(PDO::FETCH_ASSOC);

        if ($godparent) {
            $person['sacraments_info']['godparent'] = [
                'type' => $godparent['godparent_type'],
                'name' => $godparent['name'],
                'phone' => $godparent['phone'],
                'dob' => $godparent['birth_date'],
                'address' => $godparent['address'],
                'married' => ($godparent['marital_status'] === 'MARRIED'),
                'single' => ($godparent['marital_status'] === 'SINGLE')
            ];
        }

        foreach ($person['family'] as &$fam) {
            $fam['is_financial_responsible'] = ($fam['is_financial_responsible'] === 't' || $fam['is_financial_responsible'] === true);
            $fam['is_legal_guardian'] = ($fam['is_legal_guardian'] === 't' || $fam['is_legal_guardian'] === true);
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
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$data['user_id']]);
        }

        $sanitize = function ($val) {
            if (is_string($val)) {
                $val = trim(preg_replace('/\s+/', ' ', $val));
                return ($val === '' || $val === 'null') ? null : $val;
            }
            return $val;
        };

        // Processamento de Sacramentos (JSON vindo do JS)
        $sacArray = json_decode($data['sacraments_json'] ?? '{}', true);
        $eucDate = !empty($sacArray['eucharist']['date']) ? $sacArray['eucharist']['date'] : null;
        $eucPlace = $sanitize($sacArray['eucharist']['place'] ?? null);

        // Extrai Padrinho para tabela própria e remove do JSON
        $godparentData = $sacArray['godparent'] ?? null;
        unset($sacArray['godparent']);

        // Booleano literal para interpolação direta (wants_whatsapp_group)
        $wantsWa = (isset($data['wants_whatsapp_group']) && ($data['wants_whatsapp_group'] === 'true' || $data['wants_whatsapp_group'] === true)) ? 'TRUE' : 'FALSE';

        // Booleano real para bindValue (is_pcd) [CORREÇÃO CRÍTICA]
        $isPcd = (isset($data['is_pcd']) && ($data['is_pcd'] === 'true' || $data['is_pcd'] === true));

        $paramsPerson = [
            'full_name'         => $sanitize($data['full_name']),
            'religious_name'    => $sanitize($data['religious_name'] ?? null),
            'birth_date'        => !empty($data['birth_date']) ? $data['birth_date'] : null,
            'gender'            => $sanitize($data['gender'] ?? null),
            'tax_id'            => $sanitize($data['tax_id'] ?? null),
            'national_id'       => $sanitize($data['national_id'] ?? null),
            'email'             => $sanitize($data['email'] ?? null),
            'phone_mobile'      => $sanitize($data['phone_mobile'] ?? null),
            'phone_landline'    => $sanitize($data['phone_landline'] ?? null),
            'zip_code'          => $sanitize($data['zip_code'] ?? null),
            'address_street'    => $sanitize($data['address_street'] ?? null),
            'address_number'    => $sanitize($data['address_number'] ?? null),
            'address_district'  => $sanitize($data['address_district'] ?? null),
            'address_city'      => $sanitize($data['address_city'] ?? null),
            'address_state'     => $sanitize($data['address_state'] ?? null),
            'is_pcd'            => $isPcd ? 1 : 0, // 1/0 é universal para boolean em PDO
            'pcd_details'       => $sanitize($data['pcd_details'] ?? null),
            'sacraments_info'   => json_encode($sacArray),
            'eucharist_date'    => $eucDate,
            'eucharist_place'   => $eucPlace
        ];

        if (!empty($data['person_id'])) {
            $personId = $data['person_id'];
            $sql = "UPDATE people.persons SET full_name=:full_name, religious_name=:religious_name, birth_date=:birth_date, gender=:gender, tax_id=:tax_id, national_id=:national_id, email=:email, phone_mobile=:phone_mobile, wants_whatsapp_group=$wantsWa, phone_landline=:phone_landline, zip_code=:zip_code, address_street=:address_street, address_number=:address_number, address_district=:address_district, address_city=:address_city, address_state=:address_state, is_pcd=(:is_pcd::boolean), pcd_details=:pcd_details, sacraments_info=:sacraments_info, eucharist_date=:eucharist_date, eucharist_place=:eucharist_place, updated_at=CURRENT_TIMESTAMP WHERE person_id = :person_id";
            $paramsPerson['person_id'] = $personId;
            $conect->prepare($sql)->execute($paramsPerson);
            $msg = "Cadastro atualizado!";
        } else {
            $sql = "INSERT INTO people.persons (org_id_origin, full_name, religious_name, birth_date, gender, tax_id, national_id, email, phone_mobile, wants_whatsapp_group, phone_landline, zip_code, address_street, address_number, address_district, address_city, address_state, is_pcd, pcd_details, sacraments_info, eucharist_date, eucharist_place) VALUES (:org_id, :full_name, :religious_name, :birth_date, :gender, :tax_id, :national_id, :email, :phone_mobile, $wantsWa, :phone_landline, :zip_code, :address_street, :address_number, :address_district, :address_city, :address_state, (:is_pcd::boolean), :pcd_details, :sacraments_info, :eucharist_date, :eucharist_place) RETURNING person_id";
            $paramsPerson['org_id'] = $data['org_id'];
            $stmt = $conect->prepare($sql);
            $stmt->execute($paramsPerson);
            $personId = $stmt->fetchColumn();
            $msg = "Pessoa cadastrada!";
        }

        // 4. Foto de Perfil
        if (isset($files["profile_photo"]) && $files["profile_photo"]["error"] === UPLOAD_ERR_OK) {
            $clientId = $data['id_client'] ?? 1;
            $relativeDir = "assets/uploads/$clientId/$personId/perfil/";
            $targetDir = __DIR__ . "/../../" . $relativeDir;
            if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
            $ext = strtolower(pathinfo($files["profile_photo"]["name"], PATHINFO_EXTENSION));
            $newFile = time() . "_" . uniqid() . "." . $ext;
            if (move_uploaded_file($files["profile_photo"]["tmp_name"], $targetDir . $newFile)) {
                $conect->prepare("UPDATE people.persons SET profile_photo_url = ? WHERE person_id = ?")->execute([$relativeDir . $newFile, $personId]);
            }
        }

        // 5. Vínculos (Roles)
        $rolesMap = ['role_student' => 'STUDENT', 'role_catechist' => 'CATECHIST', 'role_priest' => 'PRIEST', 'role_parent' => 'PARENT', 'role_secretary' => 'SECRETARY'];
        foreach ($rolesMap as $key => $roleName) {
            if (isset($data[$key])) {
                $active = ($data[$key] === 'true' || $data[$key] === true);
                $rid = $conect->query("SELECT role_id FROM people.roles WHERE role_name = '$roleName'")->fetchColumn();
                if ($rid) {
                    if ($active) {
                        $conect->prepare("INSERT INTO people.person_roles (person_id, org_id, role_id, is_active, deleted) VALUES (?, ?, ?, TRUE, FALSE) ON CONFLICT (person_id, role_id) DO UPDATE SET is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP")->execute([$personId, $data['org_id'], $rid]);
                    } else {
                        $conect->prepare("UPDATE people.person_roles SET is_active = FALSE, deleted = TRUE WHERE person_id = ? AND role_id = ?")->execute([$personId, $rid]);
                    }
                }
            }
        }

        // 6. Família (JSON)
        $newFamilyList = json_decode($data['family_json'] ?? '[]', true);
        $processedIds = [];
        foreach ($newFamilyList as $fam) {
            $relId = $fam['relative_id'];
            $processedIds[] = $relId;
            $isLeg = (isset($fam['is_legal_guardian']) && ($fam['is_legal_guardian'] === true || $fam['is_legal_guardian'] === 'true'));
            $exists = $conect->query("SELECT tie_id FROM people.family_ties WHERE person_id = $personId AND relative_id = $relId")->fetchColumn();
            if ($exists) {
                $conect->prepare("UPDATE people.family_ties SET relationship_type = ?, is_legal_guardian = ?, deleted = FALSE WHERE tie_id = ?")->execute([$fam['relationship_type'], $isLeg ? 1 : 0, $exists]);
            } else {
                $conect->prepare("INSERT INTO people.family_ties (person_id, relative_id, relationship_type, is_legal_guardian) VALUES (?, ?, ?, ?)")->execute([$personId, $relId, $fam['relationship_type'], $isLeg ? 1 : 0]);
            }
        }
        $notIn = !empty($processedIds) ? "AND relative_id NOT IN (" . implode(',', array_map('intval', $processedIds)) . ")" : "";
        $conect->prepare("UPDATE people.family_ties SET deleted = TRUE WHERE person_id = :pid $notIn")->execute(['pid' => $personId]);

        // 7. Padrinhamento (Tabela Dedicada para Auditoria)
        if (!empty($godparentData['name'])) {
            $gType = $sanitize($godparentData['type'] ?? null);
            $gName = $sanitize($godparentData['name']);
            $gPhone = $sanitize($godparentData['phone'] ?? null);
            $gDob = !empty($godparentData['dob']) ? $godparentData['dob'] : null;
            $gAddress = $sanitize($godparentData['address'] ?? null);

            $gMarital = null;
            if (isset($godparentData['married']) && ($godparentData['married'] === true || $godparentData['married'] === 'true')) $gMarital = 'MARRIED';
            elseif (isset($godparentData['single']) && ($godparentData['single'] === true || $godparentData['single'] === 'true')) $gMarital = 'SINGLE';

            $sqlGodparent = "INSERT INTO people.person_godparents (person_id, godparent_type, name, phone, birth_date, address, marital_status)
                             VALUES (:pid, :type, :name, :phone, :dob, :addr, :marital)
                             ON CONFLICT (person_id) DO UPDATE SET 
                                godparent_type = EXCLUDED.godparent_type,
                                name = EXCLUDED.name,
                                phone = EXCLUDED.phone,
                                birth_date = EXCLUDED.birth_date,
                                address = EXCLUDED.address,
                                marital_status = EXCLUDED.marital_status,
                                updated_at = CURRENT_TIMESTAMP";

            $conect->prepare($sqlGodparent)->execute([
                'pid' => $personId,
                'type' => $gType,
                'name' => $gName,
                'phone' => $gPhone,
                'dob' => $gDob,
                'addr' => $gAddress,
                'marital' => $gMarital
            ]);
        } else {
            $conect->prepare("DELETE FROM people.person_godparents WHERE person_id = :pid")->execute(['pid' => $personId]);
        }

        $conect->commit();
        if (function_exists('syncUserLogin')) syncUserLogin($personId, $data['id_client'] ?? 1);
        return success($msg);
    } catch (Exception $e) {
        if ($conect->inTransaction()) $conect->rollBack();
        logSystemError("painel", "people", "upsertPerson", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar cadastro.", null, false, 500);
    }
}

function savePersonAttachment($data, $files)
{
    try {
        $conect = $GLOBALS["local"];
        $conect->beginTransaction();

        // Ensure user_id exists
        $userId = !empty($data['user_id']) ? (int)$data['user_id'] : null;

        // [AUDITORIA] Garante que o banco saiba quem está inserindo
        if ($userId) {
            $conect->prepare("SELECT set_config('app.current_user_id', :uid, true)")->execute(['uid' => (string)$userId]);
        }

        $personId = $data['person_id'];
        $clientId = isset($data['id_client']) ? (int)$data['id_client'] : 1; // Default to 1 if not set
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
            // [FIX] Ensure :uid is mapped to $userId, even if null
            $sql = "INSERT INTO people.person_attachments (person_id, file_name, file_path, description, uploaded_by) 
                    VALUES (:pid, :name, :path, :desc, :uid)";
            $stmt = $conect->prepare($sql);
            $stmt->execute([
                'pid' => $personId,
                'name' => $file['name'],
                'path' => $webPath,
                'desc' => $desc,
                'uid' => $userId
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
        $sql = "SELECT p.person_id as id, p.full_name as title, p.tax_id, p.profile_photo_url  FROM people.persons p WHERE p.deleted IS FALSE AND (p.full_name ILIKE :s OR p.tax_id ILIKE :s) ORDER BY p.full_name ASC LIMIT 20";
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
        $sql = "SELECT p.person_id as id, p.full_name as title, p.tax_id, p.profile_photo_url 
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

        $sql = "SELECT p.person_id as id, p.full_name as title, p.profile_photo_url FROM people.persons p $where ORDER BY p.full_name ASC LIMIT 20";
        $stmt = $conect->prepare($sql);
        $stmt->execute($params);

        return success("Busca realizada.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "people", "getCatechistsForSelect", "sql", $e->getMessage(), ['search' => $search]);
        return failure("Erro na busca de catequistas.", null, false, 500);
    }
}

function syncUserLogin($personId, $clientId)
{
    try {
        $conect = $GLOBALS["local"];
        $conectStaff = getStaff();

        // 1. Busca dados da Pessoa
        $stmtP = $conect->prepare("SELECT full_name, profile_photo_url, email, tax_id, org_id_origin FROM people.persons WHERE person_id = :id");
        $stmtP->execute(['id' => $personId]);
        $person = $stmtP->fetch(PDO::FETCH_ASSOC);

        // Validação: Sem e-mail, não cria login
        if (!$person || empty($person['email']) || !filter_var($person['email'], FILTER_VALIDATE_EMAIL)) return;

        // 2. Define o Nível de Acesso baseado nos Cargos
        $stmtRoles = $conect->prepare("SELECT r.role_name FROM people.person_roles pr JOIN people.roles r ON pr.role_id = r.role_id WHERE pr.person_id = :id AND pr.deleted IS FALSE AND pr.is_active IS TRUE");
        $stmtRoles->execute(['id' => $personId]);
        $roles = $stmtRoles->fetchAll(PDO::FETCH_COLUMN);

        $roleLevel = null;
        $profileId = 10; // Padrão Fiel/Aluno

        if (in_array('PRIEST', $roles)) {
            $roleLevel = 'MANAGER';
            $profileId = 50;
        } elseif (in_array('SECRETARY', $roles)) {
            $roleLevel = 'SECRETARY';
            $profileId = 40;
        } elseif (in_array('CATECHIST', $roles)) {
            $roleLevel = 'TEACHER';
            $profileId = 30;
        } elseif (in_array('STUDENT', $roles) || in_array('PARENT', $roles)) {
            $roleLevel = 'USER';
            $profileId = 10;
        }

        // Se não tiver nenhum cargo dos mapeados, encerra
        if (!$roleLevel) return;

        // Configuração de IDs e Senha Inicial
        $orgId = !empty($person['org_id_origin']) ? $person['org_id_origin'] : 1;
        $cpfLimpo = preg_replace('/[^0-9]/', '', $person['tax_id'] ?? '');
        $hash = !empty($cpfLimpo) ? $cpfLimpo : 'mudar123';

        // 3. Verifica login local
        $stmtLocal = $conect->prepare("SELECT user_id FROM security.users WHERE person_id = :id");
        $stmtLocal->execute(['id' => $personId]);
        $localUserId = $stmtLocal->fetchColumn();

        $staffUserId = $localUserId ? $localUserId : null;

        // 4. Sincronização com Banco STAFF
        if ($conectStaff) {
            try {
                $conectStaff->beginTransaction();

                if (!$staffUserId) {
                    $stmtS = $conectStaff->prepare("SELECT id FROM users WHERE email = :email");
                    $stmtS->execute(['email' => $person['email']]);
                    $staffUserId = $stmtS->fetchColumn();
                }

                if ($staffUserId) {
                    // [CORREÇÃO] Não sobrescreve a senha no UPDATE!
                    $conectStaff->prepare("UPDATE users SET name = :name, email = :email, img = :img, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
                        ->execute(['name' => $person['full_name'], 'email' => $person['email'], 'img' => $person['profile_photo_url'], 'id' => $staffUserId]);
                } else {
                    // [CORREÇÃO] Senha definida apenas no INSERT
                    $conectStaff->prepare("INSERT INTO users (name, email, password, img, created_at, updated_at) VALUES (:name, :email, :pass, :img, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                        ->execute(['name' => $person['full_name'], 'email' => $person['email'], 'pass' => $hash, 'img' => $person['profile_photo_url']]);
                    $staffUserId = $conectStaff->lastInsertId();
                }

                // Vínculo Client/Profile no Staff
                $stmtLink = $conectStaff->prepare("SELECT id FROM users_clients_profiles WHERE id_user = :uid AND id_client = :cid");
                $stmtLink->execute(['uid' => $staffUserId, 'cid' => $clientId]);

                if (!$stmtLink->fetchColumn()) {
                    $conectStaff->prepare("INSERT INTO users_clients_profiles (id_user, id_client, id_profile, created_at, updated_at) VALUES (:uid, :cid, :pid, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)")
                        ->execute(['uid' => $staffUserId, 'cid' => $clientId, 'pid' => $profileId]);
                } else {
                    $conectStaff->prepare("UPDATE users_clients_profiles SET id_profile = :pid, updated_at = CURRENT_TIMESTAMP WHERE id_user = :uid AND id_client = :cid")
                        ->execute(['uid' => $staffUserId, 'cid' => $clientId, 'pid' => $profileId]);
                }

                $conectStaff->commit();
            } catch (Exception $eStaff) {
                if ($conectStaff->inTransaction()) $conectStaff->rollBack();
                logSystemError("painel", "people", "syncUserLogin_Staff", "sql", $eStaff->getMessage(), ['person_id' => $personId]);
                return; // Impede salvar no local se falhar no Staff
            }
        }

        // 5. Sincronização Local (security.users) e Perfil Temporal
        if ($staffUserId) {
            try {
                // [CORREÇÃO] Protege o bloco local com Transaction
                $conect->beginTransaction();

                // Atualiza ou Insere na security.users
                $sqlSecurity = "INSERT INTO security.users (user_id, org_id, person_id, name, email, role_level, updated_at) 
                                VALUES (:uid, :oid, :pid, :name, :email, :role, CURRENT_TIMESTAMP)
                                ON CONFLICT (user_id) DO UPDATE 
                                SET email = EXCLUDED.email, 
                                    name = EXCLUDED.name, 
                                    role_level = EXCLUDED.role_level,
                                    updated_at = CURRENT_TIMESTAMP";

                $conect->prepare($sqlSecurity)->execute([
                    'uid' => $staffUserId,
                    'oid' => $orgId,
                    'pid' => $personId,
                    'name' => $person['full_name'],
                    'email' => $person['email'],
                    'role' => $roleLevel
                ]);

                // GRAVAÇÃO DO PERFIL POR ANO (security.users_years)
                // [CORREÇÃO] Filtro deleted IS FALSE adicionado
                $stmtYear = $conect->prepare("SELECT year_id FROM education.academic_years WHERE is_active IS TRUE AND deleted IS FALSE LIMIT 1");
                $stmtYear->execute();
                $currentYearId = $stmtYear->fetchColumn();

                if ($currentYearId) {
                    $sqlYearProfile = "INSERT INTO security.users_years (user_id, year_id, id_profile) 
                                       VALUES (:uid, :yid, :pid)
                                       ON CONFLICT (user_id, year_id) DO UPDATE SET id_profile = EXCLUDED.id_profile";
                    $conect->prepare($sqlYearProfile)->execute([
                        'uid' => $staffUserId,
                        'yid' => $currentYearId,
                        'pid' => $profileId
                    ]);
                }

                $conect->commit();
            } catch (Exception $eLocal) {
                if ($conect->inTransaction()) $conect->rollBack();
                logSystemError("painel", "people", "syncUserLogin_Local", "sql", $eLocal->getMessage(), ['person_id' => $personId]);
            }
        }
    } catch (Exception $e) {
        logSystemError("painel", "people", "syncUserLogin_General", "exception", $e->getMessage(), ['person_id' => $personId]);
    }
}
