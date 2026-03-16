<?php

/**
 * Busca listagem cruzada Staff + Local com Perfis Temporais
 * Padrão: Staff define login | Local define foto e perfil por ano
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

        // Filtro Staff: Apenas usuários ativos desta paróquia (id_client)
        $where = "WHERE up.id_client = :oid AND u.active IS TRUE AND up.active IS TRUE AND u.deleted IS FALSE AND u.staff IS FALSE";

        if (!empty($data['search'])) {
            $where .= " AND (u.name ILIKE :search OR u.email ILIKE :search)";
            $params[':search'] = "%" . $data['search'] . "%";
        }

        if (!empty($data['profile_filter'])) {
            $where .= " AND up.id_profile = :profile_filter";
            $params[':profile_filter'] = (int)$data['profile_filter'];
        }

        // 1. BUSCA NO BANCO STAFF (LOGIN BASE)
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

        // 2. BUSCA NO BANCO LOCAL (FOTO E VÍNCULOS POR ANO)
        if (!empty($usuarios) && $conectLocal) {
            $userIds = array_column($usuarios, 'id');
            $inQuery = implode(',', array_fill(0, count($userIds), '?'));

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
                             WHERE uy.user_id = su.user_id) as vinculos_temporais
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
                    // Foto Local sobrepõe a do Staff se existir
                    $u['img'] = $localMap[$u['id']]['profile_photo_url'] ?: $u['img'];

                    $vinculos = json_decode($localMap[$u['id']]['vinculos_temporais'] ?: '[]', true);
                    $u['anos_ids'] = $localMap[$u['id']]['vinculos_temporais'] ?: '[]';

                    // Formatação para a coluna "Anos Letivos" (Padronizado com perfil)
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
 * Update com sincronização Staff/Local e Perfis Temporais
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

        // 1. ATUALIZA STAFF (LOGIN BASE)
        $conectStaff->prepare("UPDATE public.users SET email = :email, updated_at = CURRENT_TIMESTAMP WHERE id = :id")
            ->execute(['email' => $email, 'id' => $idUser]);

        $conectStaff->prepare("UPDATE public.users_clients_profiles SET id_profile = :profile, updated_at = CURRENT_TIMESTAMP WHERE id_user = :id_user AND id_client = :id_client")
            ->execute(['profile' => $mainProfile, 'id_user' => $idUser, 'id_client' => $idClient]);

        // 2. ATUALIZA LOCAL (VÍNCULOS POR ANO)
        if ($conectLocal) {
            // Sincroniza e-mail no banco local
            $conectLocal->prepare("UPDATE security.users SET email = :em WHERE user_id = :uid")->execute(['em' => $email, 'uid' => $idUser]);

            // Grava os vínculos temporais (Ano + Perfil)
            $conectLocal->prepare("DELETE FROM security.users_years WHERE user_id = :uid")->execute(['uid' => $idUser]);

            if (!empty($data['years_mapping']) && is_array($data['years_mapping'])) {
                $stmtY = $conectLocal->prepare("INSERT INTO security.users_years (user_id, year_id, id_profile) VALUES (:uid, :yid, :pid)");
                foreach ($data['years_mapping'] as $map) {
                    $stmtY->execute([
                        'uid' => $idUser,
                        'yid' => (int)$map['year_id'],
                        'pid' => (int)$map['profile_id']
                    ]);
                }
            }

            // REGISTRO DE LOG (Item 4 solicitado)
            $conectLocal->prepare("INSERT INTO security.change_logs (action_type, user_id, description) VALUES ('UPDATE', :author, 'Atualização de perfis temporais por ano letivo')")
                ->execute(['author' => $data['author_id']]);
        }

        $conectStaff->commit();
        if ($conectLocal) $conectLocal->commit();

        return success("Usuário e perfis atualizados com sucesso.");
    } catch (Exception $e) {
        if ($conectStaff->inTransaction()) $conectStaff->rollBack();
        if ($conectLocal && $conectLocal->inTransaction()) $conectLocal->rollBack();
        logSystemError("painel", "usuarios", "updateUsuarioParoquia", "sql", $e->getMessage(), $data);
        return failure("Erro ao salvar alterações.");
    }
}

/**
 * Reset de senha padrão
 */
function resetPasswordUsuario($data)
{
    try {
        $conectStaff = getStaff();
        $conectStaff->beginTransaction();
        $conectStaff->prepare("UPDATE public.users SET password = :pass, updated_at = CURRENT_TIMESTAMP WHERE id = :id_user")->execute(['pass' => 'mudar123', 'id_user' => (int)$data['id_user']]);
        $conectStaff->commit();
        return success("Senha resetada para o padrão.");
    } catch (Exception $e) {
        if ($conectStaff->inTransaction()) $conectStaff->rollBack();
        return failure("Erro ao resetar senha.");
    }
}

/**
 * Histórico de auditoria local
 */
function getHistoricoAuditoriaUsuario($data)
{
    try {
        $conectLocal = $GLOBALS["local"];
        $sql = "SELECT log_id, table_name, operation, changed_at FROM audit.audit_logs WHERE user_id = :id_user ORDER BY changed_at DESC LIMIT 50";
        $stmt = $conectLocal->prepare($sql);
        $stmt->execute([':id_user' => (int)$data['id_user']]);
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($history as &$h) {
            $h['date_fmt'] = date('d/m/Y H:i', strtotime($h['changed_at']));
            $h['operation'] = str_replace(['INSERT', 'UPDATE', 'DELETE'], ['Criação', 'Alteração', 'Exclusão'], $h['operation']);
            $h['module_name'] = str_replace(['people.persons', 'security.users'], ['Pessoas', 'Segurança'], $h['table_name']);
        }
        return success("OK", $history);
    } catch (Exception $e) {
        return failure("Erro no histórico.");
    }
}
