<?php

include "../function/organization-functions.php";


function getDiocese()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0
    ];

    echo json_encode(getAllDiocese($data));
}

function getOrganizations()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0
    ];

    echo json_encode(getAllOrganizations($data));
}

function getOrgById()
{
    if (!verifyToken()) return;

    $id = $_POST["id"] ?? 0;

    echo json_encode(getOrganizationData($id));
}

function saveOrganization()
{
    if (!verifyToken()) return;

    $data = json_decode($_POST['data'] ?? [], true);

    $data['user_id'] = getAuthUserId();

    echo json_encode(upsertOrganization($data));
}

function deleteOrganization()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(removeOrganization($data));
}

function toggleOrganization()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(toggleOrganizationFunc($data));
}

function getLocations()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 10,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? null
    ];

    echo json_encode(getAllLocations($data));
}

function saveLocation()
{
    if (!verifyToken()) return;

    $data = $_POST['data'] ?? [];
    $data['user_id'] = getAuthUserId();

    echo json_encode(upsertLocation($data));
}

function deleteLocation()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(removeLocation($data));
}

function toggleLocation()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(toggleLocationFunc($data));
}

function getResponsiblesList()
{
    if (!verifyToken()) return;

    echo json_encode(getPeopleForSelect());
}
