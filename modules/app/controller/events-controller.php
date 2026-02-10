<?php

// Importa as funções de banco de dados (Model)
include "../function/events-functions.php";

/**
 * Lista eventos com paginação e busca
 * Chamado por: validator='getAllEvents'
 */
function getAllEvents()
{
    if (!verifyToken()) return;
    echo json_encode(getAllEventsF($_POST));
}

/**
 * Busca dados de um evento específico para edição
 * Chamado por: validator='getEventData'
 */
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

/**
 * Cria ou Atualiza um evento (Upsert)
 * Chamado por: validator='upsertEvent'
 */
function upsertEvent()
{
    if (!verifyToken()) return;

    $data = $_POST;
    // Injeta o ID do usuário logado para auditoria
    $data['user_id'] = getAuthUserId();

    echo json_encode(upsertEventF($data));
}

/**
 * Exclusão lógica (Lixeira)
 * Chamado por: validator='removeEvent'
 */
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

/**
 * [NOVO] Alterna status de bloqueio acadêmico
 * Chamado por: validator='toggleEventBlocker'
 */
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
