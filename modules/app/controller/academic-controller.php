<?php

include "../function/academic-functions.php";

function getPhases()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? 0,
        "search" => $_POST["search"] ?? ""
    ];

    echo json_encode(getAllPhases($data));
}

function getPhaseById()
{
    if (!verifyToken()) return;

    echo json_encode(getPhaseData($_POST["id"] ?? 0));
}

function savePhase()
{
    if (!verifyToken()) return;

    $data = $_POST['data'] ?? [];
    $data['user_id'] = getAuthUserId();
    $data['org_id'] = $_POST["org_id"] ?? 0;

    echo json_encode(upsertPhase($data));
}

function deletePhase()
{
    if (!verifyToken()) return;

    $data = ["id" => $_POST["id"] ?? 0, "user_id" => getAuthUserId(),];
    echo json_encode(removePhase($data));
}

function togglePhase()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];
    echo json_encode(togglePhaseStatus($data));
}
