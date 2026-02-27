<?php

// =========================================================
// GESTÃO DE NOTIFICAÇÕES E WEB PUSH (CONTROLLER)
// =========================================================

/**
 * Busca as notificações do usuário logado (ativas e não lidas + recentes)
 */
function getNotifications()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $orgId = $_POST["org_id"] ?? 2;
    $userId = $decoded["id_user"];

    echo json_encode(fetchUserNotifications($userId, $orgId));
}

/**
 * Marca uma notificação específica como lida ou deletada
 */
function markNotificationRead()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $notificationId = $_POST["id"] ?? 0;
    $userId = $decoded["id_user"];

    echo json_encode(setNotificationRead($userId, $notificationId));
}

/**
 * Marca todas as notificações como lidas ou limpa a gaveta (delete)
 */
function markAllNotificationsRead()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token não informado.", null, false, 401));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $orgId = $_POST["org_id"] ?? 2;
    $userId = $decoded["id_user"];

    echo json_encode(setAllNotificationsRead($userId, $orgId));
}

/**
 * Salva a assinatura do navegador para envio de Web Push
 */
function savePushSubscription()
{
    if (!isset($_POST["token"]) || !isset($_POST["subscription"])) {
        echo json_encode(failure("Dados incompletos.", null, false, 400));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $userId = $decoded["id_user"];
    $subData = json_decode($_POST["subscription"], true);
    $userAgent = $_POST["userAgent"] ?? 'Desconhecido';

    echo json_encode(insertPushSubscription($userId, $subData, $userAgent));
}

/**
 * Remove a assinatura do Web Push (Logout ou Desativação)
 */
function removePushSubscription()
{
    if (!isset($_POST["token"]) || !isset($_POST["endpoint"])) {
        echo json_encode(failure("Dados incompletos.", null, false, 400));
        return;
    }

    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }

    getLocal($decoded["conexao"]);

    $userId = $decoded["id_user"];
    $endpoint = $_POST["endpoint"];

    echo json_encode(deletePushSubscription($userId, $endpoint));
}


// =========================================================
// CAMADA DE DADOS E QUERIES (PDO)
// =========================================================

function fetchUserNotifications($userId, $orgId)
{
    try {
        $conect = $GLOBALS["local"];

        $roleLevel = strtoupper($_POST['role'] ?? 'USER');
        $superUsers = ['DEV', 'STAFF', 'ROOT', 'ADMIN'];
        $isDev = in_array($roleLevel, $superUsers);

        $stmtUser = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid LIMIT 1");
        $stmtUser->execute(['uid' => $userId]);
        $personId = $stmtUser->fetchColumn() ?: 0;

        if (!$isDev && !$personId) {
            return success("Nenhuma notificação.", []);
        }

        $sql = "
            SELECT DISTINCT
                n.notification_id,
                n.title,
                n.message,
                n.type,
                n.action_url,
                n.created_at,
                r.read_at
            FROM communication.notifications n
            JOIN communication.notification_targets t ON n.notification_id = t.notification_id
            LEFT JOIN communication.notification_reads r 
                ON n.notification_id = r.notification_id 
                AND r.user_id = :uid 
                AND r.deleted IS FALSE
            WHERE n.org_id = :oid
              AND n.is_active IS TRUE 
              AND n.deleted IS FALSE 
              AND t.deleted IS FALSE
              AND (
                  :is_dev = TRUE
                  OR t.target_type = 'ALL'
                  OR (t.target_type = 'PERSON' AND t.target_val = :pid)
                  OR (t.target_type = 'ROLE' AND t.target_val IN (
                      SELECT role_id FROM people.person_roles 
                      WHERE person_id = :pid AND is_active IS TRUE AND deleted IS FALSE
                  ))
              )
            ORDER BY n.created_at DESC
            LIMIT 30
        ";

        $stmt = $conect->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':oid', $orgId, PDO::PARAM_INT);
        $stmt->bindValue(':is_dev', $isDev, PDO::PARAM_BOOL);
        $stmt->bindValue(':pid', $personId, PDO::PARAM_INT);
        $stmt->execute();

        $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $now = time();
        foreach ($notifications as &$notif) {
            $time = strtotime($notif['created_at']);
            $diff = $now - $time;
            if ($diff < 60) $notif['time_ago'] = "agora mesmo";
            elseif ($diff < 3600) $notif['time_ago'] = floor($diff / 60) . " min atrás";
            elseif ($diff < 86400) $notif['time_ago'] = floor($diff / 3600) . "h atrás";
            elseif ($diff < 172800) $notif['time_ago'] = "ontem";
            else $notif['time_ago'] = date("d/m", $time);
        }

        return success("Notificações carregadas.", $notifications);
    } catch (Exception $e) {
        logSystemError("painel", "notifications", "fetchUserNotifications", "sql", $e->getMessage(), ['user_id' => $userId]);
        return failure("Erro ao buscar notificações.", null, false, 500);
    }
}

function setNotificationRead($userId, $notificationId)
{
    try {
        $conect = $GLOBALS["local"];
        $isDelete = isset($_POST['delete']) && $_POST['delete'] === 'true';

        // Correção do ON CONFLICT para casar com a constraint (notification_id, user_id)
        $sql = "
            INSERT INTO communication.notification_reads (notification_id, user_id, deleted)
            VALUES (:nid, :uid, :del)
            ON CONFLICT (notification_id, user_id) 
            DO UPDATE SET 
                deleted = EXCLUDED.deleted,
                read_at = CURRENT_TIMESTAMP
        ";

        $stmt = $conect->prepare($sql);
        $stmt->bindValue(':nid', $notificationId, PDO::PARAM_INT);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':del', $isDelete, PDO::PARAM_BOOL);
        $stmt->execute();

        return success($isDelete ? "Removida." : "Marcada como lida.");
    } catch (Exception $e) {
        logSystemError("painel", "notifications", "setNotificationRead", "sql", $e->getMessage(), ['user_id' => $userId]);
        return failure("Erro ao atualizar.", null, false, 500);
    }
}

function setAllNotificationsRead($userId, $orgId)
{
    try {
        $conect = $GLOBALS["local"];
        $isDelete = isset($_POST['delete']) && $_POST['delete'] === 'true';

        $roleLevel = strtoupper($_POST['role'] ?? 'USER');
        $superUsers = ['DEV', 'STAFF', 'ROOT', 'ADMIN'];
        $isDev = in_array($roleLevel, $superUsers);

        $stmtUser = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid LIMIT 1");
        $stmtUser->execute(['uid' => $userId]);
        $personId = $stmtUser->fetchColumn() ?: 0;

        // Query otimizada para inserção/atualização em massa respeitando a unicidade
        $sql = "
            INSERT INTO communication.notification_reads (notification_id, user_id, deleted)
            SELECT DISTINCT n.notification_id, :uid::INTEGER, :del
            FROM communication.notifications n
            JOIN communication.notification_targets t ON n.notification_id = t.notification_id
            WHERE n.org_id = :oid
              AND n.is_active IS TRUE AND n.deleted IS FALSE AND t.deleted IS FALSE
              AND (
                  :is_dev = TRUE
                  OR t.target_type = 'ALL'
                  OR (t.target_type = 'PERSON' AND t.target_val = :pid)
                  OR (t.target_type = 'ROLE' AND t.target_val IN (
                      SELECT role_id FROM people.person_roles 
                      WHERE person_id = :pid AND is_active IS TRUE AND deleted IS FALSE
                  ))
              )
            ON CONFLICT (notification_id, user_id) 
            DO UPDATE SET 
                deleted = EXCLUDED.deleted,
                read_at = CURRENT_TIMESTAMP
        ";

        $stmt = $conect->prepare($sql);
        $stmt->bindValue(':uid', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':oid', $orgId, PDO::PARAM_INT);
        $stmt->bindValue(':del', $isDelete, PDO::PARAM_BOOL);
        $stmt->bindValue(':is_dev', $isDev, PDO::PARAM_BOOL);
        $stmt->bindValue(':pid', $personId, PDO::PARAM_INT);
        $stmt->execute();

        return success($isDelete ? "Gaveta limpa." : "Todas lidas.");
    } catch (Exception $e) {
        logSystemError("painel", "notifications", "setAllNotificationsRead", "sql", $e->getMessage(), ['user_id' => $userId]);
        return failure("Erro ao processar.", null, false, 500);
    }
}

function insertPushSubscription($userId, $subData, $userAgent)
{
    try {
        $conect = $GLOBALS["local"];
        $endpoint = $subData['endpoint'] ?? null;
        $p256dh = $subData['keys']['p256dh'] ?? null;
        $auth = $subData['keys']['auth'] ?? null;

        if (!$endpoint || !$p256dh || !$auth) return failure("Chaves inválidas.");

        $sql = "
            INSERT INTO security.push_subscriptions (user_id, endpoint, p256dh_key, auth_key, user_agent)
            VALUES (:uid, :endpoint, :p256dh, :auth, :ua)
            ON CONFLICT (endpoint) DO UPDATE 
            SET user_id = EXCLUDED.user_id, is_active = TRUE, deleted = FALSE, updated_at = CURRENT_TIMESTAMP
        ";

        $conect->prepare($sql)->execute(['uid' => $userId, 'endpoint' => $endpoint, 'p256dh' => $p256dh, 'auth' => $auth, 'ua' => $userAgent]);
        return success("Inscrição salva.");
    } catch (Exception $e) {
        logSystemError("painel", "notifications", "insertPushSubscription", "sql", $e->getMessage(), ['user_id' => $userId]);
        return failure("Erro ao salvar.", null, false, 500);
    }
}

function deletePushSubscription($userId, $endpoint)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "UPDATE security.push_subscriptions SET deleted = TRUE, is_active = FALSE WHERE endpoint = :endpoint AND user_id = :uid";
        $conect->prepare($sql)->execute(['endpoint' => $endpoint, 'uid' => $userId]);
        return success("Removido.");
    } catch (Exception $e) {
        logSystemError("painel", "notifications", "deletePushSubscription", "sql", $e->getMessage(), ['user_id' => $userId]);
        return failure("Erro ao remover.", null, false, 500);
    }
}
