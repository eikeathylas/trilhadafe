<?php
include "../function/audit-functions.php";


function getAuditLog()
{
    if (!verifyToken()) return;
    
    $data = [
        "table" => $_POST["table"] ?? null,
        "id_record" => $_POST["id_record"] ?? null,
        "id_user" => getAuthUserId(),
    ];

    echo json_encode(getHistory($data));
}


function rollbackAuditLog()
{
    if (!verifyToken()) return;

    $data = [
        "log_id" => $_POST["log_id"] ?? null,
        "id_user" => getAuthUserId(),
    ];

    echo json_encode(rollbackChange($data));
}
