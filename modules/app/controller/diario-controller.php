<?php

include_once "../function/diario-functions.php";


function getMyClasses()
{
    if (!verifyToken()) return;

    $userId = getAuthUserId();
    $roleLevel = strtoupper($_POST['role'] ?? 'USER');
    $yearId = $_POST['year'] ?? null;
    $orgId = $_POST['org_id'] ?? 0;

    echo json_encode(getTeacherClassesF($userId, $roleLevel, $yearId, $orgId));
}

function getClassPhases()
{
    if (!verifyToken()) return;
    $classId = $_POST['class_id'] ?? 0;
    echo json_encode(getClassPhasesF($classId));
}

function getClassHistory()
{
    if (!verifyToken()) return;
    echo json_encode(getClassHistoryF($_POST));
}


function getDiarioMetadata()
{
    if (!verifyToken()) return;
    echo json_encode(getDiarioMetadataF($_POST));
}

function checkDateContent()
{
    if (!verifyToken()) return;
    echo json_encode(checkDateContentF($_POST));
}

function getStudentsForDiary()
{
    if (!verifyToken()) return;
    $data = [
        'class_id' => $_POST['class_id'],
        'date' => $_POST['date'],
    ];
    echo json_encode(getStudentsForDiaryF($data));
}

function saveClassDiary()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(saveClassSessionF($data));
}

function deleteClassDiary()
{
    if (!verifyToken()) return;
    $data = $_POST;
    $data['user_id'] = getAuthUserId();
    echo json_encode(deleteClassSessionF($data));
}
