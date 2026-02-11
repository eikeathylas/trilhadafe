<?php

include "../function/people-functions.php";

// =========================================================
// GESTÃO DE PESSOAS (CONTROLLER)
// =========================================================

/**
 * Lista pessoas com paginação e filtros
 */
function getPeople()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = [
        "limit" => $_POST["limit"] ?? 20,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "role_filter" => $_POST["role_filter"] ?? ""
    ];

    echo json_encode(getAllPeople($data));
}

/**
 * Busca dados completos de uma pessoa (incluindo família, vínculos e anexos)
 */
function getPerson()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $id = $_POST["id"] ?? 0;

    echo json_encode(getPersonData($id));
}

/**
 * Cria ou Atualiza uma Pessoa (Com Upload de Foto de Perfil)
 * A lógica de upload foi movida para people-functions.php -> upsertPerson
 */
function savePerson()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    // Recebe os dados do formulário
    $data = $_POST;

    // Injeta ID do usuário logado para Auditoria
    $data['user_id'] = $decoded['id_user'];

    // Injeta ID do Cliente (Tenant) para estrutura de pastas
    // Prioriza o Token para segurança, mas aceita POST se necessário
    $data['id_client'] = $decoded['id_client'] ?? ($_POST['id_client'] ?? 0);

    // Passamos $_FILES para que a função upsertPerson gerencie o upload
    echo json_encode(upsertPerson($data, $_FILES));
}

/**
 * Exclui (Soft Delete) uma pessoa
 */
function deletePerson()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => $decoded["id_user"]
    ];

    echo json_encode(removePerson($data));
}

/**
 * Ativa/Desativa uma pessoa
 */
function togglePerson()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"], // 'true' ou 'false'
        "user_id" => $decoded["id_user"]
    ];

    echo json_encode(togglePersonStatus($data));
}

// =========================================================
// GESTÃO DE DOCUMENTOS (ANEXOS)
// =========================================================

/**
 * Upload de Anexo (Documento)
 */
function uploadAttachment()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = $_POST;
    $data['user_id'] = $decoded['id_user']; // Auditoria

    // Injeta ID do Cliente para estrutura de pastas
    $data['id_client'] = $decoded['id_client'] ?? ($_POST['id_client'] ?? 0);

    // O Model espera ($data, $files)
    echo json_encode(savePersonAttachment($data, $_FILES));
}

/**
 * Remove um Anexo
 */
function removeAttachment()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = [
        "attachment_id" => $_POST["id"] ?? 0,
        "user_id" => $decoded["id_user"]
    ];

    echo json_encode(deletePersonAttachment($data));
}

// =========================================================
// HELPERS DE SELEÇÃO (DROPDOWNS)
// =========================================================

function getRelativesList()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $search = $_POST['search'] ?? '';

    echo json_encode(searchPeopleForSelect($search));
}

function getStudentsList()
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

    echo json_encode(getStudentsForSelect($_POST['search'] ?? ''));
}

function getCatechistsList()
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

    echo json_encode(getCatechistsForSelect($_POST['search'] ?? ''));
}
