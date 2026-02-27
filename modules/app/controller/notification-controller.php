<?php

// =========================================================
// GESTÃO DE NOTIFICAÇÕES E WEB PUSH (CONTROLLER)
// =========================================================

// Exibir todos os erros para desenvolvimento (remover em produção)
error_reporting(E_ALL);


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

    // Executa a checagem de regras de negócio antes de listar
    runDailyNotificationCheck();

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

        // Roda a checagem diária de regras antes de listar
        runDailyNotificationCheck();

        $roleLevel = strtoupper($_POST['role'] ?? 'USER');
        $superUsers = ['DEV', 'STAFF', 'ROOT', 'ADMIN'];
        $isDev = in_array($roleLevel, $superUsers);

        $stmtUser = $conect->prepare("SELECT person_id FROM security.users WHERE user_id = :uid LIMIT 1");
        $stmtUser->execute(['uid' => $userId]);
        $personId = $stmtUser->fetchColumn() ?: 0;

        if (!$isDev && !$personId) {
            return success("Nenhuma notificação.", []);
        }

        // Query corrigida: o.display_name em vez de o.name
        $sql = "
            SELECT DISTINCT
                n.notification_id,
                n.title,
                n.message,
                n.type,
                n.action_url,
                n.created_at,
                r.read_at,
                t.target_type,
                t.target_val,
                o.display_name as org_name
            FROM communication.notifications n
            JOIN communication.notification_targets t ON n.notification_id = t.notification_id
            JOIN organization.organizations o ON n.org_id = o.org_id
            LEFT JOIN communication.notification_reads r 
                ON n.notification_id = r.notification_id 
                AND r.user_id = :uid 
            WHERE n.org_id = :oid
              AND n.is_active IS TRUE 
              AND n.deleted IS FALSE 
              AND t.deleted IS FALSE
              AND (r.deleted IS FALSE OR r.deleted IS NULL)
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
            LIMIT 60
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
            // Cálculo de tempo
            $time = strtotime($notif['created_at']);
            $diff = $now - $time;
            if ($diff < 60) $notif['time_ago'] = "agora mesmo";
            elseif ($diff < 3600) $notif['time_ago'] = floor($diff / 60) . " min atrás";
            elseif ($diff < 86400) $notif['time_ago'] = floor($diff / 3600) . "h atrás";
            elseif ($diff < 172800) $notif['time_ago'] = "ontem";
            else $notif['time_ago'] = date("d/m", $time);

            // --- LÓGICA DE AUDITORIA PARA DEV ---
            if ($isDev) {
                $detail = "";

                if ($notif['target_type'] === 'ALL') {
                    $detail = "PARA TODOS";
                } elseif ($notif['target_type'] === 'ROLE') {
                    // Ajustado para people.roles e coluna role_name
                    $st = $conect->prepare("SELECT role_name FROM people.roles WHERE role_id = :rid");
                    $st->execute(['rid' => $notif['target_val']]);
                    $roleName = $st->fetchColumn() ?: "ID: " . $notif['target_val'];
                    $detail = "ROLE: " . $roleName;
                } elseif ($notif['target_type'] === 'PERSON') {
                    $st = $conect->prepare("SELECT full_name FROM people.persons WHERE person_id = :pid");
                    $st->execute(['pid' => $notif['target_val']]);
                    $personName = $st->fetchColumn() ?: "ID: " . $notif['target_val'];
                    $detail = "PESSOA: " . $personName;
                }

                $notif['message'] .= "<br><small style='color: #6c757d; font-weight: bold;'>[AUDIT] Unidade: {$notif['org_name']} | Destino: {$detail}</small>";
            }

            if (!$isDev) {
                unset($notif['target_type'], $notif['target_val'], $notif['org_name']);
            }
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

        $sql = "
            INSERT INTO communication.notification_reads (notification_id, user_id, deleted)
            VALUES (:nid, :uid, :del::BOOLEAN)
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

        $sql = "
            INSERT INTO communication.notification_reads (notification_id, user_id, deleted)
            SELECT DISTINCT n.notification_id, :uid::INTEGER, :del::BOOLEAN
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

// =========================================================
// MOTOR DE REGRAS SILENCIOSO (RUN ON FETCH)
// =========================================================

function runDailyNotificationCheck()
{
    try {
        $conect = $GLOBALS["local"];
        if (!$conect) return;

        $hoje = date('m-d');
        $amanha = date('Y-m-d', strtotime('+1 day'));

        // --- REGRA 1: ANIVERSÁRIOS DE ALUNOS ---
        $sqlAlunos = "
            SELECT p.person_id, p.full_name, c.coordinator_id, c.org_id, c.name as class_name
            FROM people.persons p
            JOIN education.enrollments e ON p.person_id = e.student_id
            JOIN education.classes c ON e.class_id = c.class_id
            WHERE to_char(p.birth_date, 'MM-DD') = :hoje
              AND e.status = 'ACTIVE' AND e.deleted IS FALSE
        ";

        $stmtA = $conect->prepare($sqlAlunos);
        $stmtA->execute(['hoje' => $hoje]);
        $aniversariantes = $stmtA->fetchAll(PDO::FETCH_ASSOC);

        foreach ($aniversariantes as $aluno) {
            $title = "Aniversário: " . $aluno['full_name'];
            $msg = "Hoje é aniversário do aluno(a) {$aluno['full_name']} da turma {$aluno['class_name']}.";

            // Tenta inserir (createSystemNotification cuidará da duplicidade)
            createSystemNotification($aluno['org_id'], $title, $msg, 'SUCCESS', 'ROLE', 3);
            if (!empty($aluno['coordinator_id'])) {
                createSystemNotification($aluno['org_id'], "Aniversário de Aluno", $msg, 'SUCCESS', 'PERSON', $aluno['coordinator_id']);
            }
        }

        // --- REGRA 2: ANIVERSÁRIOS DE PROFESSORES ---
        $sqlProfs = "
            SELECT p.person_id, p.full_name, pr.org_id
            FROM people.persons p
            JOIN people.person_roles pr ON p.person_id = pr.person_id
            WHERE to_char(p.birth_date, 'MM-DD') = :hoje
              AND pr.role_id = 3 AND pr.is_active IS TRUE AND pr.deleted IS FALSE
        ";

        $stmtP = $conect->prepare($sqlProfs);
        $stmtP->execute(['hoje' => $hoje]);
        $profs = $stmtP->fetchAll(PDO::FETCH_ASSOC);

        foreach ($profs as $prof) {
            $title = "Aniversário Prof: " . $prof['full_name'];
            $msg = "Hoje é aniversário do Professor(a) {$prof['full_name']}. Notifique a paróquia!";
            createSystemNotification($prof['org_id'], $title, $msg, 'INFO', 'ROLE', 2);
        }

        // --- REGRA 3: EVENTOS ACADÊMICOS ---
        $sqlEvents = "SELECT title, org_id FROM organization.events WHERE event_date = :amanha AND is_academic_blocker = TRUE AND deleted IS FALSE";

        $stmtE = $conect->prepare($sqlEvents);
        $stmtE->execute(['amanha' => $amanha]);
        $bloqueios = $stmtE->fetchAll(PDO::FETCH_ASSOC);

        foreach ($bloqueios as $ev) {
            $title = "Lembrete: Sem aula amanhã";
            $msg = "Amanhã não haverá aula devido ao evento: {$ev['title']}.";
            createSystemNotification($ev['org_id'], $title, $msg, 'WARNING', 'ALL');
        }
    } catch (Exception $e) {
        error_log("Erro no Cron de Notificações: " . $e->getMessage());
    }
}

/**
 * Insere uma nova notificação se ela ainda não existir hoje para o alvo
 */
function createSystemNotification($orgId, $title, $message, $type, $targetType, $targetVal = null, $url = '#')
{
    try {
        $conect = $GLOBALS["local"];

        // TRAVA DE DUPLICIDADE: Verifica se essa regra já foi disparada HOJE para esse público
        $sqlCheck = "
            SELECT COUNT(n.notification_id) 
            FROM communication.notifications n
            JOIN communication.notification_targets t ON n.notification_id = t.notification_id
            WHERE n.org_id = :oid 
              AND n.title = :title 
              AND t.target_type = :ttype 
              AND (t.target_val = :tval OR (t.target_val IS NULL AND :tval IS NULL))
              AND n.created_at::DATE = CURRENT_DATE
        ";

        $stmtCheck = $conect->prepare($sqlCheck);
        $stmtCheck->execute([
            'oid'   => $orgId,
            'title' => $title,
            'ttype' => $targetType,
            'tval'  => $targetVal
        ]);

        if ($stmtCheck->fetchColumn() > 0) return false;

        // 1. Insere o corpo da notificação
        $sql = "INSERT INTO communication.notifications (org_id, title, message, type, action_url, module_context) 
                VALUES (:oid, :title, :msg, :type, :url, 'SYSTEM') RETURNING notification_id";

        $stmt = $conect->prepare($sql);
        $stmt->execute([
            'oid'   => $orgId,
            'title' => $title,
            'msg'   => $message,
            'type'  => $type,
            'url'   => $url
        ]);
        $notifId = $stmt->fetchColumn();

        if (!$notifId) return false;

        // 2. Vincula a notificação ao alvo
        $sqlTarget = "INSERT INTO communication.notification_targets (notification_id, target_type, target_val) 
                      VALUES (:nid, :ttype, :tval)";

        $stmtTarget = $conect->prepare($sqlTarget);
        $stmtTarget->execute([
            'nid'   => $notifId,
            'ttype' => $targetType,
            'tval'  => $targetVal
        ]);

        return true;
    } catch (Exception $e) {
        error_log("Erro ao criar notificação de sistema: " . $e->getMessage());
        return false;
    }
}
