<?php
include '../function/turmas-functions.php';


function getClasses()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "org_id" => $_POST["org_id"] ?? 0,
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

    $data = $_POST ?? [];
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
        "active" => $_POST["active"],
        "user_id" => getAuthUserId()
    ];

    echo json_encode(toggleClassStatus($data));
}

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


function toggleConclusionClass()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "conclude" => $_POST["conclude"] ?? 'false',
        "user_id" => getAuthUserId()
    ];

    echo json_encode(toggleConclusionClassF($data));
}