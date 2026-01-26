<?php

// Inclui as funções criadas acima
include '../function/session-functions.php';

/**
 * Chamado a cada 5 minutos pelo JS
 * Verifica se pode continuar logado
 */
function validateSessionToken() {
    if (!isset($_POST['token'])) {
        echo json_encode(failure("Token não informado."));
        return;
    }

    $check = checkTokenValidity($_POST['token']);

    if ($check['valid']) {
        echo json_encode(success("Sessão ativa.", ['logout' => false]));
    } else {
        // Se caiu aqui, o front deve deslogar
        $motivo = $check['reason'] ?? 'unknown';
        
        // Mensagem personalizada para bloqueio financeiro
        if ($motivo === 'financial_block') {
            echo json_encode(success("Acesso suspenso. Contate o financeiro.", ['logout' => true, 'reason' => 'financial']));
        } else {
            echo json_encode(success("Sessão expirada.", ['logout' => true, 'reason' => 'timeout']));
        }
    }
}

/**
 * Chamado a cada 10 minutos pelo JS
 * Apenas diz ao banco "Estou vivo"
 */
function confirmSessionToken() {
    if (!isset($_POST['token'])) {
        echo json_encode(failure("Token não informado."));
        return;
    }

    $refreshed = refreshSession($_POST['token']);

    if ($refreshed) {
        echo json_encode(success("Sessão renovada."));
    } else {
        // Se não renovou, provavelmente o token já caiu
        echo json_encode(failure("Falha ao renovar sessão.", null, false, 401));
    }
}