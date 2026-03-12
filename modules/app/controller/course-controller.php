<?php

include "../function/course-functions.php";


function getCourses()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? 0,
        "search" => $_POST["search"] ?? ""
    ];

    echo json_encode(getAllCourses($data));
}

function getCourseById()
{
    if (!verifyToken()) return;

    $id = $_POST["id"] ?? 0;

    echo json_encode(getCourseData($id));
}

function saveCourse()
{
    if (!verifyToken()) return;

    // Recebe o objeto 'data' enviado pelo JS
    $data = $_POST['data'] ?? [];

    // Injeta ID do usuário para auditoria
    $data['user_id'] = getAuthUserId();
    $data['org_id'] = $_POST["org_id"] ?? 0;

    echo json_encode(upsertCourse($data));
}

function deleteCourse()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(removeCourse($data));
}

function toggleCourse()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(toggleCourseStatus($data));
}

function getCoursesList()
{
    if (!verifyToken()) return;

    $search = $_POST['search'] ?? '';

    echo json_encode(searchCoursesForSelect($search));
}

function getSubjectsSelect()
{
    if (!verifyToken()) return;

    $search = $_POST["search"] ?? "";

    echo json_encode(searchSubjects($search));
}
