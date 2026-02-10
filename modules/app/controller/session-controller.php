<?php

include '../function/session-functions.php';


function validateSessionToken()
{
    if (!isset($_POST['token'])) {
        echo json_encode(failure("Token não informado."));
        return;
    }

    $check = checkTokenValidity($_POST['token']);

    if ($check['valid']) {
        echo json_encode(success("Sessão ativa.", ['logout' => false]));
    } else {
        $motivo = $check['reason'] ?? 'unknown';

        if ($motivo === 'financial_block') {
            echo json_encode(success("Acesso suspenso. Contate o financeiro.", ['logout' => true, 'reason' => 'financial']));
        } else {
            echo json_encode(success("Sessão expirada.", ['logout' => true, 'reason' => 'timeout']));
        }
    }
}

function confirmSessionToken()
{
    if (!isset($_POST['token'])) {
        echo json_encode(failure("Token não informado."));
        return;
    }

    $refreshed = refreshSession($_POST['token']);

    if ($refreshed) {
        echo json_encode(success("Sessão renovada."));
    } else {
        echo json_encode(failure("Falha ao renovar sessão.", null, false, 401));
    }
}

function getGlobalContext()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    echo json_encode(getGlobalContextF($decoded['id_user']));
}
