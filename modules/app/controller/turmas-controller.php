<?php

include "../function/turmas-functions.php";

// =========================================================
// GESTÃO DE TURMAS (CRUD)
// =========================================================

/**
 * Lista as turmas com filtros (Ano, Busca, Paginação)
 */
function getClasses()
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

    getLocal($decoded["conexao"]);

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "year" => $_POST["year"] ?? null
    ];

    echo json_encode(getAllClasses($data));
}

/**
 * Busca dados completos de uma turma (para edição)
 */
function getClassById()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $id = $_POST["id"] ?? 0;

    echo json_encode(getClassData($id));
}

/**
 * Salva (Cria ou Atualiza) uma turma e sua grade horária
 */
function saveClass()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
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

    echo json_encode(upsertClass($data));
}

/**
 * Exclui (Soft Delete) uma turma
 */
function deleteClass()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
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
        "user_id" => $decoded["id_user"] // Auditoria
    ];

    echo json_encode(removeClass($data));
}

/**
 * Ativa/Desativa uma turma
 */
function toggleClass()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
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
        "user_id" => $decoded["id_user"] // Auditoria
    ];

    echo json_encode(toggleClassStatus($data));
}


// =========================================================
// GESTÃO DE ALUNOS E MATRÍCULAS
// =========================================================

/**
 * Lista alunos matriculados em uma turma
 */
function getClassStudents()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    echo json_encode(getClassStudentsF($_POST));
}

/**
 * Matricula um aluno na turma
 */
function enrollStudent()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = $_POST;
    $data['user_id'] = $decoded['id_user']; // Auditoria

    echo json_encode(enrollStudentF($data));
}

/**
 * Remove (Cancela) a matrícula de um aluno
 */
function deleteEnrollment()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = $_POST;
    $data['user_id'] = $decoded['id_user']; // Auditoria

    echo json_encode(deleteEnrollmentF($data));
}


// =========================================================
// HISTÓRICO E OCORRÊNCIAS
// =========================================================

/**
 * Busca histórico acadêmico da matrícula (ocorrências)
 */
function getEnrollmentHistory()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    echo json_encode(getEnrollmentHistoryF($_POST));
}

/**
 * Adiciona um registro no histórico (Ex: Suspensão, Obs)
 */
function addEnrollmentHistory()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = $_POST;
    $data['user_id'] = $decoded['id_user']; // Auditoria

    echo json_encode(addEnrollmentHistoryF($data));
}

/**
 * Apaga um registro do histórico (apenas o log, não reverte status)
 */
function deleteEnrollmentHistory()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $data = $_POST;
    $data['user_id'] = $decoded['id_user']; // Auditoria

    echo json_encode(deleteEnrollmentHistoryF($data));
}
