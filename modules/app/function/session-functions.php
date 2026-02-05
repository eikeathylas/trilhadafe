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
