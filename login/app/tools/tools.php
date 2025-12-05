<?php

define('TOKEN_SECRET_KEY', 'TrilhaDaFe_SecureKey_2025_$#@!'); // 32 caracteres


function executeSQL($dados, $idConexao = "pdo")
{
    $conect = $GLOBALS[$idConexao];
    $query = $conect->prepare($dados["sql"]);
    $query->execute($dados["parametros"]);

    if ($dados["retorno"]) {
        if ($dados["multiplo"]) {
            return $query->fetchAll(PDO::FETCH_ASSOC);
        }
        return $query->fetch(PDO::FETCH_ASSOC);
    }

    return true;
}


function success($alert, $data = null, $access = null, $encod = false, $code = 200)
{
    $response = [
        "status" => true,
        "code" => $code,
        "alert" => $alert,
        "data" => $encod ? base64_encode($data) : $data,
        "encod" => $encod
    ];

    if (!is_null($access)) {
        $response["access"] = $access;
    }

    return $response;
}

function failure($alert, $data = null, $encod = false, $code = 403)
{
    return [
        "status" => false,
        "code" => $code,
        "alert" => $alert,
        "data" => $encod ? base64_encode($data) : $data,
        "encod" => $encod
    ];
}


function getIp()
{
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    return $ip;
}

function timeNow()
{
    date_default_timezone_set('America/recife');
    $date = date('Y-m-d H:i:s');
    return $date;
}

function registrarTentativaLogin($email, $sucesso)
{
    $sql = <<<'SQL'
        INSERT INTO
            public.login_attempts
        (
            ip_address,
            email,
            success
        )
        VALUES
        (:ip, :email, :success)
    SQL;

    $params = [
        'ip' => getIp(),
        'email' => $email,
        'success' => $sucesso ? "TRUE" : "FALSE",
    ];

    executeSQL([
        'retorno' => false,
        'multiplo' => false,
        'sql' => $sql,
        'parametros' => $params,
    ]);
}

function verificarBloqueioLogin($email)
{
    $conect = $GLOBALS['pdo'];

    $sql = <<<'SQL'
        SELECT
            COUNT(*) AS tentativas
        FROM
            public.login_attempts
        WHERE
            ip_address = :ip
            AND email = :email
            AND success IS FALSE
            AND attempt_time > NOW() - INTERVAL '15 minutes'
    SQL;

    $params = [
        'ip' => getIp(),
        'email' => $email,
    ];

    $dados = executeSQL([
        'retorno' => true,
        'multiplo' => false,
        'sql' => $sql,
        'parametros' => $params,
    ]);

    return $dados['tentativas'] >= 5;
}

function registrarLogErro($origem, $mensagem, $email = null)
{
    try {
        $conect = $GLOBALS['pdo'];

        $sql = <<<'SQL'
            INSERT INTO public.error_logs (
                origem,
                mensagem,
                ip,
                email
            ) VALUES (
                :origem,
                :mensagem,
                :ip,
                :email
            )
        SQL;

        $params = [
            'origem' => $origem,
            'mensagem' => $mensagem,
            'ip' => getIp(),
            'email' => $email,
        ];

        executeSQL([
            'retorno' => false,
            'multiplo' => false,
            'sql' => $sql,
            'parametros' => $params,
        ]);
    } catch (Exception $e) {
        // Evita loop infinito caso o log também falhe
        error_log("Erro ao registrar log: " . $e->getMessage());
    }
}

function createAccessToken($token, $len, $return, $id_client)
{
    // Monta os dados a serem protegidos
    $data = implode('_x_', [
        $return['host'],
        $return['port'],
        $return['database'],
        $return['user'],
        $return['password'],
        $return['id_user']
    ]);

    // Criptografa com AES-256-CBC
    $iv = openssl_random_pseudo_bytes(16);
    $encrypted = openssl_encrypt($data, 'aes-256-cbc', TOKEN_SECRET_KEY, OPENSSL_RAW_DATA, $iv);

    // Junta IV + dado criptografado e codifica em base64
    $tokenFinal = base64_encode($iv . $encrypted);

    // Grava no banco
    $sql = <<<'SQL'
        UPDATE public.users_token
        SET update_in = CURRENT_TIMESTAMP, active = FALSE
        WHERE id_user = :id_user AND active IS TRUE
    SQL;

    executeSQL([
        'retorno' => false,
        'multiplo' => false,
        'sql' => $sql,
        'parametros' => ['id_user' => $return['id_user']],
    ]);

    $sql = <<<'SQL'
        INSERT INTO public.users_token (
            id_user, id_client, token, ip
        ) VALUES (
            :id_user, :id_client, :token, :ip
        )
    SQL;

    executeSQL([
        'retorno' => false,
        'multiplo' => false,
        'sql' => $sql,
        'parametros' => [
            'id_user' => $return['id_user'],
            'id_client' => $id_client,
            'token' => $tokenFinal,
            'ip' => getIp(),
        ],
    ]);

    return $tokenFinal;
}
