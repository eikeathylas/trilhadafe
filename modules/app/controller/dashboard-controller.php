<?php

include "../functions/dashboard-functions.php";

function getDashboardStats()
{
    // 1. Validação de presença do Token
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    // 2. Decodificação do Token
    $decoded = decodeAccessToken($_POST["token"]);

    // 3. Validação da integridade do Token
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido ou expirado.", null, false, 401));
        return;
    }

    // 4. Conexão com o Banco Local (Tenant)
    // Usa os dados que estavam criptografados no token
    getLocal($decoded["conexao"]);

    // 5. Preparação dos dados para a função
    $data = [
        "id_user" => $decoded["id_user"]
    ];

    var_dump($data);
    exit;

    // 6. Chamada da Função e Retorno JSON
    // A função getDashboardStatsData está no dashboard-functions.php
    echo json_encode(getDashboardStatsData($data));
}
