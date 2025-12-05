<?php

// Configurações do Banco Central (Staff)
// É este banco que valida o login e diz qual paróquia o usuário vai acessar.

$host = "31.220.51.183"; // 31.220.51.183
$port = "5432";
$dbname = "trilhadafe";
$user = "postgres";
$password = "N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT"; // N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT

try {
    // String de conexão (DSN) para PostgreSQL
    $conexao = "pgsql:host={$host};port={$port};dbname={$dbname};user={$user};password={$password}";
    
    // Criação da instância PDO
    $pdo = new PDO($conexao);
    
    // Configurações de Erro e Retorno
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    // Se falhar, mata o processo e devolve JSON para o JavaScript mostrar o alerta
    die(json_encode([
        "status" => false,
        "alert" => "Erro crítico: Falha na conexão com o Banco Staff."
        // "debug" => $e->getMessage() // Descomente se precisar ver o erro real na tela
    ]));
}