<?php
include "../function/events-functions.php";


function getAllEvents()
{
    if (!verifyToken()) return;
    echo json_encode(getAllEventsF($_POST));
}

function getEventData()
{
    if (!verifyToken()) return;

    $id = $_POST['id'] ?? 0;
    if (empty($id)) {
        echo json_encode(failure("ID do evento não fornecido."));
        return;
    }

    echo json_encode(getEventDataF($id));
}

function upsertEvent()
{
    if (!verifyToken()) return;

    $data = $_POST;
    $data['user_id'] = getAuthUserId();

    echo json_encode(upsertEventF($data));
}

function removeEvent()
{
    if (!verifyToken()) return;

    $data = $_POST;
    $data['user_id'] = getAuthUserId();

    if (empty($data['id'])) {
        echo json_encode(failure("ID inválido."));
        return;
    }

    echo json_encode(removeEventF($data));
}

function toggleEventBlocker()
{
    if (!verifyToken()) return;

    $data = $_POST;
    $data['user_id'] = getAuthUserId();

    if (empty($data['id'])) {
        echo json_encode(failure("ID inválido."));
        return;
    }

    echo json_encode(toggleEventBlockerF($data));
}