<?php

// Importa as funções de modelo
include "../function/dashboard-functions.php";

/**
 * 1. Rota: Estatísticas Gerais do Dashboard
 * Retorna contadores, próximo evento, financeiro e avisos.
 */
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
    // Decifra a string de conexão do cliente atual e conecta no PDO global
    getLocal($decoded["conexao"]);

    // 5. Preparação dos dados para a função
    $data = [
        "id_user" => $decoded["id_user"],
        "org_id" => $_POST["org_id"],
        "year_id" => $_POST["year_id"],
    ];

    // 6. Chamada da Função Model e Retorno JSON
    echo json_encode(getDashboardStatsData($data));
}

/**
 * 3. Rota: Agenda de Eventos (Widget)
 * Busca os próximos eventos na tabela organization.events
 */
function getUpcomingEvents()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);

    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido ou expirado.", null, false, 401));
        return;
    }

    // Conecta no banco da paróquia atual
    getLocal($decoded["conexao"]);

    $data = [
        "user_id" => $decoded["id_user"],
        "org_id" => $_POST["org_id"],
    ];

    echo json_encode(getUpcomingEventsData($data));
}
