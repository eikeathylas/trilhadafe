<?php

include "../function/academic-functions.php";


function getSubjects()
{
    if (!verifyToken()) return;

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
    if (!verifyToken()) return;

    echo json_encode(getSubjectData($_POST["id"] ?? 0));
}

function saveSubject()
{
    if (!verifyToken()) return;

    $data = $_POST['data'] ?? [];
    $data['user_id'] = getAuthUserId();
    $data['org_id'] = $_POST["org_id"] ?? 0;

    echo json_encode(upsertSubject($data));
}

function deleteSubject()
{
    if (!verifyToken()) return;

    $data = ["id" => $_POST["id"] ?? 0, "user_id" => getAuthUserId(),];
    echo json_encode(removeSubject($data));
}

function toggleSubject()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];
    echo json_encode(toggleSubjectStatus($data));
}
