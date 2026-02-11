<?php

include_once "../function/diario-functions.php";


function getMyClasses()
{
    // 1. Validação de Token (Manual para pegar payload extra se necessário)
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
    $roleLevel = strtoupper($_POST['role'] ?? 'USER');
    $yearId = $_POST['year'] ?? null;
    $orgId = $_POST['org_id'] ?? 0; // [NOVO] Captura o contexto da organização

    // 4. Execução (Passando orgId para filtrar as turmas corretamente)
    echo json_encode(getTeacherClassesF($userId, $roleLevel, $yearId, $orgId));
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

// --- NOVAS FUNÇÕES DA LÓGICA SMART (V4/V5) ---

/**
 * Carrega regras da turma (horários, dias permitidos) e datas limites
 * Chamado pelo JS: validator: 'getDiarioMetadata'
 */
function getDiarioMetadata()
{
    if (!verifyToken()) return;
    echo json_encode(getDiarioMetadataF($_POST));
}

/**
 * Verifica se a data é feriado, se já tem aula ou busca o próximo plano
 * Chamado pelo JS: validator: 'checkDateContent'
 */
function checkDateContent()
{
    if (!verifyToken()) return;
    echo json_encode(checkDateContentF($_POST));
}

/**
 * Busca lista de alunos para a frequência (Separado para performance)
 * Chamado pelo JS: validator: 'getStudentsForDiary'
 */
function getStudentsForDiary()
{
    if (!verifyToken()) return;
    $classId = $_POST['class_id'] ?? 0;
    echo json_encode(getStudentsForDiaryF($classId));
}

/**
 * Salva o diário (Sessão + Frequência + Auditoria)
 * Chamado pelo JS: validator: 'saveClassDiary'
 */
function saveClassDiary()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId(); // Injeta ID do usuário logado para auditoria
    echo json_encode(saveClassSessionF($data));
}

/**
 * Exclui aula (Soft Delete)
 * Chamado pelo JS: validator: 'deleteClassDiary'
 */
function deleteClassDiary()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(deleteClassSessionF($data));
}
