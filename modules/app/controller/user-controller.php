<?php

include "../function/user-functions.php";


function getUsuarios()
{
    if (!verifyToken()) return;

    $data = [
        "limit"          => $_POST["limit"] ?? 20,
        "page"           => $_POST["page"] ?? 0,
        "id_client"      => $_POST["id_client"] ?? 0, // ID Client oficial do Staff
        "search"         => $_POST["search"] ?? "",
        "profile_filter" => $_POST["profile_filter"] ?? ""
    ];

    echo json_encode(getUsuariosParoquia($data));
}


function saveUsuarioInfo()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0,
        "email"     => strtolower(trim($_POST["email"] ?? "")),
        "profile"   => (int)$_POST["profile"],
        "years"     => $_POST["years"] ?? [], // Array de IDs vindo do Selectize
        "author_id" => getAuthUserId() // Auditoria: quem está salvando
    ];

    echo json_encode(updateUsuarioParoquia($data));
}


function resetUsuarioPassword()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0,
        "author_id" => getAuthUserId()
    ];

    echo json_encode(resetPasswordUsuario($data));
}


function getUsuarioHistorico()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0
    ];

    echo json_encode(getHistoricoAuditoriaUsuario($data));
}
