<?php

// Importa as funções de negócio da auditoria
include "../function/audit-functions.php";

/**
 * Rota: getAuditLog
 * Objetivo: Listar o histórico de alterações de um registro específico.
 */
function getAuditLog()
{
    // 1. Validação de Token
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    // 2. Decodificação
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    // 3. Conexão com o Banco Local
    getLocal($decoded["conexao"]);

    // 4. Preparação dos dados
    $data = [
        "table" => $_POST["table"] ?? null,
        "id_record" => $_POST["id_record"] ?? null,
        "id_user" => $decoded["id_user"]
    ];

    // 5. Execução
    echo json_encode(getHistory($data));
}

/**
 * Rota: rollbackAuditLog
 * Objetivo: Desfazer uma alteração específica (Voltar no tempo).
 */
function rollbackAuditLog()
{
    // 1. Validação de Token
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    // 2. Decodificação
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    // 3. Conexão com o Banco Local
    getLocal($decoded["conexao"]);

    // 4. Preparação dos dados
    $data = [
        "log_id" => $_POST["log_id"] ?? null,
        "id_user" => $decoded["id_user"]
    ];

    // 5. Execução
    echo json_encode(rollbackChange($data));
}
