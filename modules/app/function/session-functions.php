<?php

function checkTokenValidity($token)
{
    try {
        // Usa a conexão global STAFF (definida no database.php)
        $conect = getStaff();

        // SQL Híbrido: Checa Tempo e Financeiro em uma única ida ao banco
        $sql = <<<'SQL'
            SELECT 
                ut.id,
                ut.active as token_active,
                cc.pendency as client_pendency,
                
                -- Regra 1: Vida máxima de 24h (Hard Limit)
                (NOW() - ut.created_at) > INTERVAL '24 hours' as expired_hard,
                
                -- Regra 2: Inatividade de 15min (Soft Limit)
                (NOW() - COALESCE(ut.updated_at, ut.created_at)) > INTERVAL '15 minutes' as expired_soft
                
            FROM public.users_token ut
            JOIN public.clients_config cc ON cc.id_client = ut.id_client
            WHERE ut.token = :token
                AND ut.active IS TRUE
            LIMIT 1
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute(['token' => $token]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // 1. Token não existe
        if (!$result) {
            return ['valid' => false, 'reason' => 'not_found'];
        }

        // 2. Token já estava inativo
        if (!$result['token_active']) {
            return ['valid' => false, 'reason' => 'inactive_token'];
        }

        // 3. Bloqueio Financeiro (Expulsão Imediata)
        if ($result['client_pendency']) {
            return ['valid' => false, 'reason' => 'financial_block'];
        }

        // 4. Expirou por Tempo (24h ou 15min ocioso)
        if ($result['expired_hard'] || $result['expired_soft']) {
            // Desativa no banco para não ser usado mais
            $upSql = "UPDATE public.users_token SET active = FALSE WHERE id = :id";
            $upStmt = $conect->prepare($upSql);
            $upStmt->execute(['id' => $result['id']]);

            return ['valid' => false, 'reason' => 'expired_time'];
        }

        // Tudo certo
        return ['valid' => true];
    } catch (Exception $e) {
        // Loga erro silencioso no servidor
        // error_log("Erro Sessão: " . $e->getMessage());
        return ['valid' => false, 'error' => 'server_error'];
    }
}

function refreshSession($token)
{
    try {
        $conect = getStaff();

        // Apenas atualiza o 'updated_at' para zerar o contador de inatividade (15min)
        $sql = <<<'SQL'
            UPDATE public.users_token 
            SET updated_at = NOW() 
            WHERE token = :token 
              AND active IS TRUE
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute(['token' => $token]);

        return $stmt->rowCount() > 0;
    } catch (Exception $e) {
        return false;
    }
}

function getMyParishesData($data)
{
    try {
        if (!isset($GLOBALS["local"])) return failure("Erro: Conexão local não estabelecida.");
        $conectLocal = $GLOBALS["local"];

        $conectStaff = getStaff();
        if (!$conectStaff) return failure("Erro de conexão com o servidor central.");

        $userId = $data['user_id'];

        $sqlUser = "SELECT staff FROM users WHERE id = :uid";
        $stmtUser = $conectStaff->prepare($sqlUser);
        $stmtUser->execute(['uid' => $userId]);
        $resStaff = $stmtUser->fetch(PDO::FETCH_ASSOC);

        $isGlobalAdmin = ($resStaff && ($resStaff['staff'] === true || $resStaff['staff'] === 't' || $resStaff['staff'] === 1));
        $parishes = [];

        if ($isGlobalAdmin) {
            $sql = "SELECT org_id as id, display_name as name 
                    FROM organization.organizations 
                    WHERE is_active IS TRUE AND deleted IS FALSE AND org_type = 'PARISH'
                    ORDER BY display_name ASC";
            $stmt = $conectLocal->prepare($sql);
            $stmt->execute();
            $parishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            $stmtP = $conectLocal->prepare("SELECT person_id FROM security.users WHERE user_id = :uid");
            $stmtP->execute(['uid' => $userId]);
            $personId = $stmtP->fetchColumn();

            if (!$personId) return success("Nenhum vínculo local encontrado.", []);

            $sql = "SELECT DISTINCT o.org_id as id, o.display_name as name
                    FROM organization.organizations o
                    JOIN people.person_roles pr ON o.org_id = pr.org_id
                    WHERE pr.person_id = :pid 
                    AND pr.is_active IS TRUE AND pr.deleted IS FALSE
                    AND o.is_active IS TRUE AND o.deleted IS FALSE
                    AND org_type = 'PARISH'
                    ORDER BY o.display_name ASC";
            $stmt = $conectLocal->prepare($sql);
            $stmt->execute(['pid' => $personId]);
            $parishes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return success("Unidades carregadas.", $parishes);
    } catch (Exception $e) {
        return failure("Erro ao carregar lista de unidades.");
    }
}

function getAcademicYearsF()
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT year_id, name, is_active, (CASE WHEN year_id = EXTRACT(YEAR FROM CURRENT_DATE) THEN TRUE ELSE FALSE END) as now FROM education.academic_years WHERE deleted IS FALSE ORDER BY name ASC";
        $stmt = $conect->query($sql);
        return success("Anos listados", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        return failure("Erro ao listar anos letivos.");
    }
}

function getGlobalContextF($userId)
{
    // Reutiliza as lógicas existentes para garantir consistência
    $resParishes = getMyParishesData(['user_id' => $userId]);
    $resYears = getAcademicYearsF();

    // Se alguma falhar, retornamos erro geral
    if (!$resParishes['status'] || !$resYears['status']) {
        return failure("Erro ao carregar contexto inicial.");
    }

    return success("Contexto carregado.", [
        'parishes' => $resParishes['data'],
        'years' => $resYears['data']
    ]);
}
