<?php

include "../function/people-functions.php";

function getPeople()
{
    if (!verifyToken()) return;

    $data = [
        "limit" => $_POST["limit"] ?? 20,
        "page" => $_POST["page"] ?? 0,
        "org_id" => $_POST["org_id"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "role_filter" => $_POST["role_filter"] ?? ""
    ];

    echo json_encode(getAllPeople($data));
}

function getPerson()
{
    if (!verifyToken()) return;

    $id = $_POST["id"] ?? 0;

    echo json_encode(getPersonData($id));
}

function savePerson()
{
    if (!verifyToken()) return;

    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    $data['id_client'] = $decoded['id_client'] ?? ($_POST['id_client'] ?? 0);

    echo json_encode(upsertPerson($data, $_FILES));
}

function deletePerson()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(removePerson($data));
}

function togglePerson()
{
    if (!verifyToken()) return;

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"],
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(togglePersonStatus($data));
}

function uploadAttachment()
{
    if (!verifyToken()) return;

    $data = $_POST;
    $data['user_id'] = getAuthUserId(); // Auditoria

    // Injeta ID do Cliente para estrutura de pastas
    $data['id_client'] = $decoded['id_client'] ?? ($_POST['id_client'] ?? 0);

    // O Model espera ($data, $files)
    echo json_encode(savePersonAttachment($data, $_FILES));
}

function removeAttachment()
{
    if (!verifyToken()) return;

    $data = [
        "attachment_id" => $_POST["id"] ?? 0,
        "user_id" => getAuthUserId(),
    ];

    echo json_encode(deletePersonAttachment($data));
}

function getRelativesList()
{
    if (!verifyToken()) return;

    $search = $_POST['search'] ?? '';

    echo json_encode(searchPeopleForSelect($search));
}

function getStudentsList()
{
    if (!verifyToken()) return;

    echo json_encode(getStudentsForSelect($_POST['search'] ?? ''));
}

function getCatechistsList()
{
    if (!verifyToken()) return;

    echo json_encode(getCatechistsForSelect($_POST['search'] ?? ''));
}
