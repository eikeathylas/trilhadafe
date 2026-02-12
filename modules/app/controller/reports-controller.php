<?php

// Importa as funções de banco de dados (Model)
include "../function/reports-functions.php";

/**
 * Busca os dados para geração de relatórios PDF
 * Chamado por: validator='getReportData' (via relatorios.js)
 */
function getReportData()
{
    if (!verifyToken()) return;

    $reportType = $_POST['report_type'] ?? null;
    $filters = $_POST['filters'] ?? [];

    if (empty($reportType)) {
        echo json_encode(failure("Tipo de relatório não especificado."));
        return;
    }

    // Injeta ID do usuário e Organização para logs/filtros de segurança
    $filters['user_id'] = getAuthUserId();
    
    // Se não vier org_id do front, tenta pegar da sessão (segurança)
    if (empty($filters['org_id'])) {
        // Assumindo que você tenha uma função para pegar a org ativa da sessão, 
        // caso contrário confia no que vem do front se validado.
        // $filters['org_id'] = getActiveOrgId(); 
    }

    echo json_encode(getReportDataF($reportType, $filters));
}