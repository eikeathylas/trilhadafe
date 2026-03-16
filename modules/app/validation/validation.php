<?php
error_reporting(0);

header('Access-Control-Allow-Origin: *');

include "../database/database.php";
include "../tools/tools.php";

// Controladores
include "../controller/session-controller.php";
include "../controller/audit-controller.php";

include "../controller/dashboard-controller.php";
include "../controller/organization-controller.php";
include "../controller/people-controller.php";
include "../controller/academic-controller.php";
include "../controller/course-controller.php";
include "../controller/turmas-controller.php";
include "../controller/diario-controller.php";
include "../controller/events-controller.php";
include "../controller/user-controller.php";

include "../controller/reports-controller.php";

include "../controller/notification-controller.php";

$validator = $_POST["validator"] ?? null;

switch ($validator) {

	// MÓDULO: SESSÃO & SEGURANÇA (app.js)
	case "token":
		validateSessionToken();
		break;
	case "confirm":
		confirmSessionToken();
		break;
	case "getGlobalContext":
		getGlobalContext();
		break;

	// MÓDULO: NOTIFICAÇÕES E WEB PUSH (notifications.js)
	case "getNotifications":
		getNotifications();
		break;

	case "markRead":
		if (isset($_POST['bulk']) && $_POST['bulk'] === 'true') {
			markAllNotificationsRead();
		} else {
			markNotificationRead();
		}
		break;

	case "deleteNotification":
		$_POST['delete'] = 'true';
		markNotificationRead();
		break;

	case "clearNotifications":
		$_POST['delete'] = 'true';
		markAllNotificationsRead();
		break;

	case "savePushSubscription":
		savePushSubscription(); //
		break;

	case "removePushSubscription":
		removePushSubscription(); //
		break;

	// MÓDULO: DASHBOARD (dashboard.js)
	case "getDashboardStats":
		getDashboardStats();
		break;
	case "getUpcomingEvents":
		getUpcomingEvents();
		break;

	// MÓDULO: AUDITORIA (audit.js)
	case "getAuditLog":
		getAuditLog();
		break;
	case "rollbackAuditLog":
		rollbackAuditLog();
		break;

	// MÓDULO: ORGANIZAÇÃO - INSTITUIÇÕES (organizacao.js)
	case "getDiocese":
		getDiocese();
		break;
	case "getOrganizations":
		getOrganizations();
		break;
	case "getOrgById":
		getOrgById();
		break;
	case "saveOrganization":
		saveOrganization();
		break;
	case "deleteOrganization":
		deleteOrganization();
		break;
	case "toggleOrganization":
		toggleOrganization();
		break;

	// MÓDULO: ORGANIZAÇÃO - LOCAIS/SALAS (organizacao.js)
	case "getLocations":
		getLocations();
		break;
	case "saveLocation":
		saveLocation();
		break;
	case "deleteLocation":
		deleteLocation();
		break;
	case "toggleLocation":
		toggleLocation();
		break;
	case "getResponsiblesList":
		getResponsiblesList();
		break;

	// MÓDULO: PESSOAS (Secretaria)
	case "getPeople":
		getPeople();
		break;
	case "getPerson":
		getPerson();
		break;
	case "savePerson":
		savePerson();
		break;
	case "deletePerson":
		deletePerson();
		break;
	case "togglePerson":
		togglePerson();
		break;
	case "getRelativesList":
		getRelativesList();
		break;
	case "uploadAttachment":
		uploadAttachment();
		break;
	case "removeAttachment":
		removeAttachment();
		break;

	// MÓDULO: ACADÊMICO (Disciplinas)
	case "getSubjects":
		getSubjects();
		break;
	case "getSubjectById":
		getSubjectById();
		break;
	case "saveSubject":
		saveSubject();
		break;
	case "deleteSubject":
		deleteSubject();
		break;
	case "toggleSubject":
		toggleSubject();
		break;

	// MÓDULO: ACADÊMICO (Cursos)
	case "getCourses":
		getCourses();
		break;
	case "getCourseById":
		getCourseById();
		break;
	case "saveCourse":
		saveCourse();
		break;
	case "deleteCourse":
		deleteCourse();
		break;
	case "toggleCourse":
		toggleCourse();
		break;
	case "getCoursesList":
		getCoursesList();
		break;
	case "getSubjectsSelect":
		getSubjectsSelect();
		break;

	// MÓDULO: TURMAS (turmas.js)
	case "getClasses":
		getClasses();
		break;
	case "getClassById":
		getClassById();
		break;
	case "saveClass":
		saveClass();
		break;
	case "deleteClass":
		deleteClass();
		break;
	case "toggleClass":
		toggleClass();
		break;
	case "getStudentsList":
		getStudentsList();
		break;
	case "getCatechistsList":
		getCatechistsList();
		break;
	case "getClassStudents":
		getClassStudents();
		break;
	case "enrollStudent":
		enrollStudent();
		break;
	case "deleteEnrollment":
		deleteEnrollment();
		break;
	case "getEnrollmentHistory":
		getEnrollmentHistory();
		break;
	case "addEnrollmentHistory":
		addEnrollmentHistory();
		break;
	case "deleteEnrollmentHistory":
		deleteEnrollmentHistory();
		break;

	// MÓDULO: DIÁRIO DE CLASSE (diario.js)
	case "getMyClasses":
		getMyClasses();
		break;
	case "getClassSubjects":
		getClassSubjects();
		break;
	case "getClassHistory":
		getClassHistory();
		break;
	case "getDiarioMetadata":
		getDiarioMetadata();
		break;
	case "checkDateContent":
		checkDateContent();
		break;
	case "getStudentsForDiary":
		getStudentsForDiary();
		break;
	case "saveClassDiary":
		saveClassDiary();
		break;
	case "deleteClassDiary":
		deleteClassDiary();
		break;

	// MÓDULO: EVENTOS
	case "getAllEvents":
		getAllEvents();
		break;
	case "getEventData":
		getEventData();
		break;
	case "upsertEvent":
		upsertEvent();
		break;
	case "removeEvent":
		removeEvent();
		break;
	case "toggleEventBlocker":
		toggleEventBlocker();
		break;

	// MÓDULO: USUÁRIOS DA PARÓQUIA
	case "getUsuarios":
		getUsuarios();
		break;
	case "saveUsuarioInfo":
		saveUsuarioInfo();
		break;
	case "resetUsuarioPassword":
		resetUsuarioPassword();
		break;
	case "getUsuarioHistorico":
		getUsuarioHistorico();
		break;

	// MÓDULO: RELATÓRIOS (relatorios.js)
	case "getReportData":
		getReportData();
		break;

	// ROTAS PADRÃO
	case "ping":
		echo json_encode(ping());
		break;

	default:
		echo defaul();
		break;
}
exit;


function defaul()
{
	return <<<'TEXT'
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>404 - Rota Não Encontrada | Trilha da Fé</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
            :root {
                --primary: #5C8EF1;
                --primary-hover: #4A75CC;
                --text-dark: #1E293B;
                --text-muted: #64748B;
                --bg-color: #F8FAFC;
                --card-bg: #FFFFFF;
            }
            body {
                font-family: 'Inter', system-ui, -apple-system, sans-serif;
                background-color: var(--bg-color);
                color: var(--text-dark);
                margin: 0;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            }
            main {
                max-width: 480px;
                width: 100%;
                background: var(--card-bg);
                padding: 40px 30px;
                border-radius: 16px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                animation: slideUp 0.4s ease-out forwards;
            }
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            img {
                max-width: 180px;
                height: auto;
                margin-bottom: 24px;
            }
            h1 {
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0 0 10px 0;
                color: var(--text-dark);
                letter-spacing: -0.025em;
            }
            p {
                font-size: 0.95rem;
                color: var(--text-muted);
                line-height: 1.6;
                margin: 0 0 30px 0;
            }
            .actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .btn {
                text-decoration: none;
                font-weight: 600;
                padding: 10px 20px;
                border-radius: 8px;
                transition: all 0.2s ease;
                font-size: 0.9rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            .btn-primary {
                background-color: var(--primary);
                color: #ffffff;
                box-shadow: 0 4px 6px rgba(92, 142, 241, 0.2);
            }
            .btn-primary:hover {
                background-color: var(--primary-hover);
                transform: translateY(-2px);
                box-shadow: 0 6px 12px rgba(92, 142, 241, 0.3);
            }
            .btn-outline {
                background-color: transparent;
                color: var(--text-muted);
                border: 1px solid #E2E8F0;
            }
            .btn-outline:hover {
                background-color: #F1F5F9;
                color: var(--text-dark);
                border-color: #CBD5E1;
            }
        </style>
    </head>
    <body>
        <main>
            <img src="../../assets/img/404.svg" alt="Erro 404 - Rota não encontrada" onerror="this.style.display='none'"/>
            <h1>Rota não encontrada</h1>
            <p>O endpoint que você tentou acessar não existe ou está temporariamente indisponível. Verifique a URL ou retorne ao sistema.</p>
            <div class="actions">
                <a href="javascript:history.back()" class="btn btn-outline">Voltar</a>
                <a href="../../dashboard.php" class="btn btn-primary">Ir para o Painel</a>
            </div>
        </main>
    </body>
    </html>
    TEXT;
}

function ping()
{
	if (!isset($_POST["token"])) {
		return failure("Token não informado.", null, false, 401);
	}

	return success("Sistema operacional", [
		"status" => "ok",
		"version" => "1.0.0",
		"system" => "Trilha da Fé",
		"ip" => getIp(),
		"server_time" => date("Y-m-d H:i:s")
	]);
}
