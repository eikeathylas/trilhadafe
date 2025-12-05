<?php

function executeSQL($dados, $idConexao = "local")
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

function success($alert, $data = null, $access = null, $encod = false)
{
    if ($access != null) {
        return array(
            "status" => true,
            "alert" => $alert,
            "access" => $access,
            "data" => $encod ? base64_encode($data) : $data,
            "encod" => $encod
        );
    } else {
        return array(
            "status" => true,
            "alert" => $alert,
            "data" => $encod ? base64_encode($data) : $data,
            "encod" => $encod
        );
    }
}

function failure($alert, $data = null, $encod = false)
{
    return  array(
        "status" => false,
        "alert" => $alert,
        "data" => $encod ? base64_encode($data) : $data,
        "encod" => $encod
    );
}

function getIp()
{
    if (!empty($_SERVER["HTTP_CLIENT_IP"])) {
        $ip = $_SERVER["HTTP_CLIENT_IP"];
    } elseif (!empty($_SERVER["HTTP_X_FORWARDED_FOR"])) {
        $ip = $_SERVER["HTTP_X_FORWARDED_FOR"];
    } else {
        $ip = $_SERVER["REMOTE_ADDR"];
    }
    return $ip;
}

function decodeAccessToken($token)
{
    $decoded = base64_decode($token);
    $iv = substr($decoded, 0, 16);
    $cipher = substr($decoded, 16);

    $decrypted = openssl_decrypt($cipher, 'aes-256-cbc', TOKEN_SECRET_KEY, OPENSSL_RAW_DATA, $iv);

    if (!$decrypted) {
        return json_encode(['result' => false, 'error' => 'Falha ao decodificar token']);
    }

    $parts = explode('_x_', $decrypted);

    return [
        'result'   => "true",
        'host'     => $parts[0],
        'port'     => $parts[1],
        'database' => $parts[2],
        'user'     => $parts[3],
        'password' => $parts[4],
        'id_user'  => $parts[5],
        'conexao'  => "pgsql:host={$parts[0]} port={$parts[1]} dbname={$parts[2]} user={$parts[3]} password={$parts[4]}"
    ];
}

function timeNow()
{
    date_default_timezone_set("America/recife");
    $date = date("Y-m-d H:i:s");
    return $date;
}

function logSystemError($scope, $module, $action, $errorType, $message, $input = null)
{
    getStaff();

    $conect = $GLOBALS["staff"];
    if (!$conect) return;


    $sql = <<<'SQL'
        INSERT INTO public.system_error_logs (
            scope,
            module,
            action,
            error_type,
            error_message,
            input_data,
            ip
        ) VALUES (
            :scope,
            :module,
            :action,
            :error_type,
            :error_message,
            :input_data,
            :ip
        )
    SQL;

    executeSQL([
        "retorno" => false,
        "multiplo" => false,
        "sql" => $sql,
        "parametros" => [
            "scope" => $scope,
            "module" => $module,
            "action" => $action,
            "error_type" => $errorType,
            "error_message" => $message,
            "input_data" => $input ? json_encode($input) : null,
            "ip" => getIp(),
        ],
    ], "staff");
}
