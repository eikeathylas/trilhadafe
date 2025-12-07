<?php

include "../function/course-functions.php";

// =========================================================
// GESTÃO DE CURSOS (EDUCATION.COURSES)
// =========================================================

/**
 * Lista cursos com paginação e busca
 */
function getCourses()
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
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "search" => $_POST["search"] ?? ""
    ];

    echo json_encode(getAllCourses($data));
}

/**
 * Busca dados de um curso específico (incluindo grade curricular)
 */
function getCourseById()
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

    echo json_encode(getCourseData($id));
}

/**
 * Cria ou Atualiza um Curso (e sua grade)
 */
function saveCourse()
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

    $data = $_POST['data'] ?? [];
    $data['user_id'] = $decoded['id_user']; // Auditoria

    echo json_encode(upsertCourse($data));
}

/**
 * Exclui (Soft Delete) um curso
 */
function deleteCourse()
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
        "user_id" => $decoded["id_user"] // Auditoria
    ];

    echo json_encode(removeCourse($data));
}

/**
 * Ativa/Desativa um curso
 */
function toggleCourse()
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
        "active" => $_POST["active"],
        "user_id" => $decoded["id_user"] // Auditoria
    ];

    echo json_encode(toggleCourseStatus($data));
}

/**
 * Busca lista simples para Selects (AJAX)
 */
function getCoursesList()
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

    echo json_encode(searchCoursesForSelect($search));
}
