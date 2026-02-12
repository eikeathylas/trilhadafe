<?php

// Importa as funções de banco de dados (Model) relacionadas a relatórios
include "../function/reports-functions.php";

/**
 * Rota unificada para busca de dados de relatórios (PDF)
 * Chamado por: validator='getReportData' em validation.php
 * Origem: relatorios.js -> generatePDF()
 */
function getReportData()
{
    // 1. Validação de Segurança (Token de Sessão)
    if (!verifyToken()) return;

    // 2. Coleta de parâmetros do POST
    $reportType = $_POST['report_type'] ?? null;
    $filters = $_POST['filters'] ?? [];

    // 3. Validação básica de entrada
    if (empty($reportType)) {
        echo json_encode(failure("O tipo de relatório não foi especificado."));
        return;
    }

    // 4. Injeção de metadados de segurança e auditoria nos filtros
    // Garante que o ID do utilizador e a organização ativa sejam considerados no SQL
    $filters['user_id'] = getAuthUserId();

    // Se o org_id não vier explicitamente nos filtros, tenta capturar do contexto
    if (empty($filters['org_id']) && isset($_POST['org_id'])) {
        $filters['org_id'] = $_POST['org_id'];
    }

    // 5. Chamada da Função de Negócio (Model) e retorno em JSON
    echo json_encode(getReportDataF($reportType, $filters));
}
