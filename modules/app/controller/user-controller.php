<?php

include "../function/user-functions.php";

/**
 * Lista todos os usuários da paróquia com paginação e filtros
 */
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

/**
 * Busca dados detalhados e isolados de um único usuário para a Edição
 */
function getUsuarioDetails()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0
    ];

    echo json_encode(getUsuarioDetailsData($data));
}

/**
 * Cria ou Atualiza um usuário, sincronizando perfis e banco Staff/Local
 */
function saveUsuarioInfo()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"       => $_POST["id_user"] ?? 0,
        "person_id"     => $_POST["person_id"] ?? 0, // Necessário para criar novo login
        "id_client"     => $_POST["id_client"] ?? 0,
        "email"         => strtolower(trim($_POST["email"] ?? "")),
        "profile"       => (int)($_POST["profile"] ?? 0),
        "years_mapping" => $_POST["years_mapping"] ?? [], // Array de vínculos temporais
        "author_id"     => getAuthUserId() // Auditoria: quem está salvando
    ];

    echo json_encode(updateUsuarioParoquia($data));
}

/**
 * Deleta (Soft/Hard Delete) um usuário do sistema
 */
function deleteUsuario()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0,
        "author_id" => getAuthUserId() // Auditoria
    ];

    echo json_encode(deleteUsuarioParoquia($data));
}

/**
 * Reseta a senha do usuário para o padrão do sistema (Staff)
 */
function resetUsuarioPassword()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0,
        "author_id" => getAuthUserId() // Auditoria
    ];

    echo json_encode(resetPasswordUsuario($data));
}

/**
 * Busca o rastro de auditoria específico deste usuário (timeline)
 */
function getUsuarioHistorico()
{
    if (!verifyToken()) return;

    $data = [
        "id_user"   => $_POST["id_user"] ?? 0,
        "id_client" => $_POST["id_client"] ?? 0
    ];

    echo json_encode(getHistoricoAuditoriaUsuario($data));
}

// =========================================================
// ROTAS DE APOIO E PERFIS (DROPDOWNS / SELECTIZE)
// =========================================================

/**
 * Busca anos letivos ativos para popular o Selectize
 */
function getAnosLetivosDropdown()
{
    if (!verifyToken()) return;

    echo json_encode(fetchAnosLetivosDropdown());
}

/**
 * Busca Pessoas no banco local por Nome ou CPF para vincular a um novo usuário
 */
function searchPessoasDropdown()
{
    if (!verifyToken()) return;

    $data = [
        "search" => $_POST["search"] ?? ""
    ];

    echo json_encode(fetchPessoasDropdown($data));
}

/**
 * Busca a lista de perfis mestres disponíveis no sistema (Resolve o bug do hardcode)
 */
function getProfilesList()
{
    if (!verifyToken()) return;

    echo json_encode(fetchProfilesList());
}

/**
 * Busca a matriz de permissões (features) vinculadas a um perfil específico para auditoria visual
 */
function getProfilePermissions()
{
    if (!verifyToken()) return;

    $id_profile = $_POST["id_profile"] ?? 0;

    echo json_encode(fetchProfilePermissions($id_profile));
}
