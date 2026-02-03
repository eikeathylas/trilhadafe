<?php

// UTILIZE INCLUDE_ONCE PARA EVITAR CONFLITOS COM O VALIDATION.PHP
include '../function/turmas-functions.php';

// =========================================================
// 1. GESTÃO DE TURMAS (CRUD)
// =========================================================

function getClasses()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "year" => $_POST["year"] ?? null
    ];

    echo json_encode(getAllClasses($data));
}

function getClassById()
{
    if (!verifyToken()) return;
    echo json_encode(getClassData($_POST["id"] ?? 0));
}

function saveClass()
{
    if (!verifyToken()) return;

    $data = $_POST['data'] ?? [];
    $data['user_id'] = getAuthUserId();

    echo json_encode(upsertClass($data));
}

function deleteClass()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId()
    ];

    echo json_encode(removeClass($data));
}

function toggleClass()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"], // JS envia 'true'/'false' string ou bool
        "user_id" => getAuthUserId()
    ];

    echo json_encode(toggleClassStatus($data));
}

// =========================================================
// 2. AUXILIARES E FILTROS
// =========================================================

function getAcademicYearsList()
{
    if (!verifyToken()) return;
    echo json_encode(getAcademicYearsF());
}

// =========================================================
// 3. GESTÃO DE ALUNOS (MATRÍCULAS)
// =========================================================

function getClassStudents()
{
    if (!verifyToken()) return;
    echo json_encode(getClassStudentsF($_POST));
}

function enrollStudent()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(enrollStudentF($data));
}

function deleteEnrollment()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(deleteEnrollmentF($data));
}

// =========================================================
// 4. HISTÓRICO E OCORRÊNCIAS
// =========================================================

function getEnrollmentHistory()
{
    if (!verifyToken()) return;
    echo json_encode(getEnrollmentHistoryF($_POST));
}

function addEnrollmentHistory()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(addEnrollmentHistoryF($data));
}

function deleteEnrollmentHistory()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(deleteEnrollmentHistoryF($data));
}

// =========================================================
// HELPERS PRIVADOS (PADRÃO DE SEGURANÇA)
// =========================================================

function verifyToken()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return false;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado. Token inválido.", null, false, 401));
        return false;
    }

    getLocal($decoded["conexao"]);
    return true;
}

function getAuthUserId()
{
    if (!isset($_POST["token"])) return null;
    $decoded = decodeAccessToken($_POST["token"]);
    return $decoded['id_user'] ?? null;
}
