<?php

$port = "5432";
$dbname = "trilhadafe_staff";
$user = "postgres";

$host = "145.223.94.211";
$password = "vSoj3WaPHUaa6MrADKtzayy46ub5YS69S2K3JXrQtqkeV8VtYv";
// $host = "localhost";
// $password = "159753";

try {
    $conexao = "pgsql:host={$host};port={$port};dbname={$dbname};user={$user};password={$password}";
    
    $pdo = new PDO($conexao);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    die(json_encode([
        "status" => false,
        "alert" => "Erro crítico: Falha na conexão."
    ]));
}