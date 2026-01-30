<?php

date_default_timezone_set('America/Recife');

function getStaff()
{
    if (isset($GLOBALS["staff"]) && $GLOBALS["staff"] instanceof PDO) {
        return $GLOBALS["staff"];
    }

    // Configurações do Banco Central (Staff)
    $host = "145.223.94.211";
    $port = "5432";
    $dbname = "trilhadafe_staff";
    $user = "postgres";
    $pass = "vSoj3WaPHUaa6MrADKtzayy46ub5YS69S2K3JXrQtqkeV8VtYv";

    // $host = "localhost";
    // $port = "5432";
    // $dbname = "trilhadafe_staff";
    // $user = "postgres";
    // $pass = "159753";

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);


    $pdo->exec("SET TIME ZONE 'America/Recife'");

    $GLOBALS["staff"] = $pdo;
    return $pdo;
}

function getLocal($conexao)
{
    if (isset($GLOBALS["local"]) && $GLOBALS["local"] instanceof PDO) {
        return $GLOBALS["local"];
    }

    // Se $conexao vier como array (do novo decodeAccessToken), montamos a string DSN
    if (is_array($conexao)) {
        $dsnString = "pgsql:host={$conexao['host']};port={$conexao['port']};dbname={$conexao['database']}";
        $user = $conexao['user'];
        $pass = $conexao['password'];

        $pdo = new PDO($dsnString, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
    } else {
        // Suporte legado se vier string
        $pdo = new PDO($conexao, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);
    }

    $pdo->exec("SET TIME ZONE 'America/Recife'");

    $GLOBALS["local"] = $pdo;
    return $pdo;
}
