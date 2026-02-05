<?php

include_once "../function/diario-functions.php";

// =========================================================
// DIÁRIO DE CLASSE (CONTROLLER V3)
// =========================================================

function getMyClasses()
{
    // 1. Validação de Token
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }

    // 2. Conexão
    getLocal($decoded["conexao"]);

    // 3. Parâmetros
    $userId = $decoded['id_user'];
    // Força MAIÚSCULO para evitar erro de comparação (admin vs ADMIN)
    $roleLevel = strtoupper($_POST['role'] ?? 'USER');
    $yearId = $_POST['year'] ?? null;

    // 4. Execução
    echo json_encode(getTeacherClassesF($userId, $roleLevel, $yearId));
}

function getClassSubjects()
{
    if (!verifyToken()) return;
    $classId = $_POST['class_id'] ?? 0;
    echo json_encode(getClassSubjectsF($classId));
}

function getClassHistory()
{
    if (!verifyToken()) return;
    echo json_encode(getClassHistoryF($_POST));
}

function getClassDailyInfo()
{
    if (!verifyToken()) return;
    echo json_encode(getClassDailyInfoF($_POST));
}

function saveDailyLog()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(saveClassSessionF($data));
}

function deleteDailyLog()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId(); // Pega ID do usuário para auditoria
    echo json_encode(deleteClassSessionF($data));
}
