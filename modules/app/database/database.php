<?php

function getStaff()
{
    if (isset($GLOBALS["staff"]) && $GLOBALS["staff"] instanceof PDO) {
        return $GLOBALS["staff"];
    }

    // Configurações do Banco Central (Staff)
    $host = "31.220.51.183"; // 31.220.51.183
    $port = "5432";
    $dbname = "trilhadafe";
    $user = "postgres";
    $pass = "N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT"; // N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT

    $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

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

    $GLOBALS["local"] = $pdo;
    return $pdo;
}
