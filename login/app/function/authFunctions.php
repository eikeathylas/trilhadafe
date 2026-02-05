<?php

function validateLogin($data)
{
    try {
        $conect = $GLOBALS["pdo"];

        // 1. Busca os dados do usuário pelo e-mail
        // Convertido para Heredoc conforme solicitado
        $sqlUser = <<<'SQL'
            SELECT
                id,
                name,
                password,
                active,
                staff
            FROM
                public.users
            WHERE
                email = :email
                AND deleted IS FALSE
            LIMIT 1
        SQL;

        $stmt = $conect->prepare($sqlUser);
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch();

        if (!$user) {
            return failure("E-mail não encontrado ou usuário inexistente.");
        }

        if (!$user['active']) {
            return failure("Usuário inativo. Entre em contato com o administrador.");
        }

        // 2. Validação da Senha (Híbrida: Hash ou Texto)
        $passwordValid = false;
        
        // Verifica se é Hash
        $hashInfo = password_get_info($user['password']);
        
        if ($hashInfo['algo'] != 0) {
            // É Hash
            $passwordValid = password_verify($data['password'], $user['password']);
        } else {
            // É Texto Puro (Legado/Dev)
            $passwordValid = ($data['password'] === $user['password']);
        }

        if (!$passwordValid) {
            return failure("Senha incorreta.");
        }

        // 3. Busca os Clientes (Paróquias)
        $sqlClients = <<<'SQL'
            SELECT DISTINCT
                c.id AS id_client,
                c.name AS name_client,
                c.link
            FROM
                public.users_clients_profiles ucp
            JOIN
                public.clients c ON c.id = ucp.id_client
            JOIN
                public.clients_config cc ON cc.id_client = c.id
            WHERE 
                ucp.id_user = :id_user
                AND ucp.active IS TRUE
                AND c.active IS TRUE
                AND cc.active IS TRUE
            ORDER BY
                c.name ASC
        SQL;

        $clients = executeSQL([
            "retorno" => true,
            "multiplo" => true,
            "sql" => $sqlClients,
            "parametros" => ["id_user" => $user['id']]
        ]);

        if (!$clients) {
            return failure("Seu usuário não possui vínculo ativo com nenhuma paróquia.");
        }

        return success("Login realizado com sucesso!", [
            "id" => $user['id'],
            "name" => $user['name'],
            "staff" => $user['staff'],
            "information" => $clients
        ]);

    } catch (Exception $e) {
        registrarLogErro("validateLogin", $e->getMessage(), $data["email"] ?? null);
        return failure("Ocorreu um erro interno ao tentar realizar o login.");
    }
}

function validateResetPassword($data)
{
    try {
        $conect = $GLOBALS["pdo"];
        
        // Criptografa nova senha
        $newHash = password_hash($data['resetNewPassword'], PASSWORD_DEFAULT);

        // Query de Update (Heredoc)
        $sql = <<<'SQL'
            UPDATE
                public.users 
            SET 
                password = :password, 
                hash = NULL, 
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                hash = :code 
                AND email = :email
                AND active IS TRUE
                AND deleted IS FALSE
        SQL;

        $stmt = $conect->prepare($sql);
        $stmt->execute([
            "password" => $newHash,
            "code" => $data["resetCode"],
            "email" => $data["resetEmail"]
        ]);

        if ($stmt->rowCount() > 0) {
            return success("Sua senha foi redefinida com sucesso! Você já pode fazer login.");
        } else {
            return failure("Código de verificação inválido ou expirado. Tente solicitar novamente.");
        }

    } catch (Exception $e) {
        registrarLogErro("validateResetPassword", $e->getMessage(), $data["resetEmail"] ?? null);
        return failure("Erro técnico ao redefinir a senha.");
    }
}