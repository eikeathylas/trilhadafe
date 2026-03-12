<?php
include "../function/reports-functions.php";

function getReportData()
{
    if (!verifyToken()) return;

    $reportType = $_POST['report_type'] ?? null;
    $filters = $_POST['filters'] ?? [];

    if (empty($reportType)) {
        echo json_encode(failure("O tipo de relatório não foi especificado."));
        return;
    }

    $filters['user_id'] = getAuthUserId();

    if (empty($filters['org_id']) && isset($_POST['org_id'])) {
        $filters['org_id'] = $_POST['org_id'];
    }

    echo json_encode(getReportDataF($reportType, $filters));
}
