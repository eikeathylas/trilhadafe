<?php

include "../function/academic-functions.php";

// =========================================================
// DISCIPLINAS (SUBJECTS)
// =========================================================

function getSubjects()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? 0,
        "search" => $_POST["search"] ?? ""
    ];

    echo json_encode(getAllSubjects($data));
}

function getSubjectById()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    echo json_encode(getSubjectData($_POST["id"] ?? 0));
}

function saveSubject()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    $data = $_POST['data'] ?? [];
    $data['user_id'] = $decoded['id_user']; // Auditoria
    $data['org_id'] = $_POST["org_id"] ?? 0;

    echo json_encode(upsertSubject($data));
}

function deleteSubject()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    $data = ["id" => $_POST["id"] ?? 0, "user_id" => $decoded["id_user"]];
    echo json_encode(removeSubject($data));
}

function toggleSubject()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => $decoded["id_user"]
    ];
    echo json_encode(toggleSubjectStatus($data));
}
