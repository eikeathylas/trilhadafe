<?php

include "../functions/dashboard-functions.php";

function getDashboardStats()
{
    // 1. Validação de Segurança
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Sessão inválida."));
        return;
    }

    // 2. Conecta no Banco da Cidade (Tenant)
    // A função getTenantConnection está no tenant.php (incluído pelo validation.php)
    $connection = getTenantConnection($_POST["token"]);

    if ($connection['status'] === false) {
        echo json_encode(failure("Erro de conexão: " . $connection['message']));
        return;
    }

    $pdo = $connection['pdo'];

    // 3. Busca os dados
    // Passamos a conexão PDO para a função SQL
    $data = fetchDashboardStats($pdo);

    if ($data) {
        echo json_encode(success("Dados carregados", $data));
    } else {
        echo json_encode(failure("Erro ao calcular estatísticas."));
    }
}