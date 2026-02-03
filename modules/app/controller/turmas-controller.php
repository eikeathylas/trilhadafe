<?php

// UTILIZE INCLUDE_ONCE PARA EVITAR CONFLITOS COM O VALIDATION.PHP
include_once "../function/turmas-functions.php";
include_once "../function/people-functions.php";
include_once "../function/course-functions.php";
// include_once "../function/organization-functions.php"; // Geralmente carregado pelo organization-controller

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

function getStudentsList()
{
    if (!verifyToken()) return;
    $search = $_POST['search'] ?? '';
    echo json_encode(getStudentsForSelect($search));
}

function getCoursesList()
{
    if (!verifyToken()) return;
    $search = $_POST['search'] ?? '';
    // Verifica se a função existe para evitar erro caso o include falhe
    if (function_exists('searchCoursesForSelect')) {
        echo json_encode(searchCoursesForSelect($search));
    } else {
        echo json_encode(['status' => false, 'alert' => 'Função de cursos não encontrada.']);
    }
}

function getCatechistsList()
{
    if (!verifyToken()) return;
    $search = $_POST['search'] ?? '';
    // Assume que existe uma função para buscar catequistas/pessoas
    if (function_exists('getCatechistsForSelect')) {
        echo json_encode(getCatechistsForSelect($search));
    } else {
        // Fallback: Busca pessoas gerais se não tiver filtro especifico
        echo json_encode(getStudentsForSelect($search));
    }
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
