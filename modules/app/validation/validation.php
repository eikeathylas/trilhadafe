<?php
error_reporting(0);

header('Access-Control-Allow-Origin: *');

include "../tools/tools.php";
include "../database/database.php";

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
include "../controller/reports-controller.php";
include "../controller/notification-controller.php";

$validator = $_POST["validator"] ?? null;

switch ($validator) {

	// =========================================================
	// MÓDULO: SESSÃO & SEGURANÇA (app.js)
	// =========================================================
	case "token":
		validateSessionToken();
		break;
	case "confirm":
		confirmSessionToken();
		break;
	case "getGlobalContext":
		getGlobalContext();
		break;

	// =========================================================
	// MÓDULO: NOTIFICAÇÕES E WEB PUSH (notifications.js)
	// =========================================================
	case "getNotifications":
		getNotifications(); //
		break;

	case "markRead":
		// Atende tanto leitura individual quanto em massa (via parâmetro 'bulk')
		if (isset($_POST['bulk']) && $_POST['bulk'] === 'true') {
			markAllNotificationsRead(); //
		} else {
			markNotificationRead(); //
		}
		break;

	case "deleteNotification":
		// Força a flag de deleção lógica antes de chamar o controller
		$_POST['delete'] = 'true';
		markNotificationRead(); //
		break;

	case "clearNotifications":
		// Limpeza total da gaveta (Deleção lógica em massa)
		$_POST['delete'] = 'true';
		markAllNotificationsRead(); //
		break;

	case "savePushSubscription":
		savePushSubscription(); //
		break;

	case "removePushSubscription":
		removePushSubscription(); //
		break;
	// =========================================================
	// MÓDULO: DASHBOARD (dashboard.js)
	// =========================================================
	case "getDashboardStats":
		getDashboardStats();
		break;
	case "getUpcomingEvents":
		getUpcomingEvents();
		break;

	// =========================================================
	// MÓDULO: AUDITORIA (audit.js)
	// =========================================================
	case "getAuditLog":
		getAuditLog();
		break;
	case "rollbackAuditLog":
		rollbackAuditLog();
		break;

	// =========================================================
	// MÓDULO: ORGANIZAÇÃO - INSTITUIÇÕES (organizacao.js)
	// =========================================================
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

	// =========================================================
	// MÓDULO: ORGANIZAÇÃO - LOCAIS/SALAS (organizacao.js)
	// =========================================================
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

	// =========================================================
	// MÓDULO: PESSOAS (Secretaria)
	// =========================================================
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

	// =========================================================
	// MÓDULO: ACADÊMICO (Disciplinas)
	// =========================================================
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

	// =========================================================
	// MÓDULO: ACADÊMICO (Cursos)
	// =========================================================
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

	// =========================================================
	// MÓDULO: TURMAS (turmas.js)
	// =========================================================
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

	// =========================================================
	// MÓDULO: DIÁRIO DE CLASSE (diario.js)
	// =========================================================
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

	// =========================================================
	// MÓDULO: EVENTOS
	// =========================================================
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

	// =========================================================
	// MÓDULO: RELATÓRIOS (relatorios.js)
	// =========================================================
	case "getReportData":
		getReportData();
		break;

	// =========================================================
	// ROTAS PADRÃO
	// =========================================================
	case "ping":
		echo json_encode(ping());
		break;

	default:
		echo defaul();
		break;
}

exit;

// =========================================================
// FUNÇÕES AUXILIARES INTERNAS
// =========================================================

function defaul()
{
	return <<<'TEXT'
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trilha da Fé - 404</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                background-color: #f8f9fc;
                padding: 2rem;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            img {
                margin-bottom: 30px;
                max-width: 300px;
                opacity: 0.8;
            }
            p {
                color: #5a5c69;
                font-weight: 700;
                font-size: 1.2rem;
            }
            a {
                color: #5C8EF1;
                text-decoration: none;
                font-weight: 600;
                border: 1px solid #5C8EF1;
                padding: 10px 25px;
                border-radius: 8px;
                margin-top: 20px;
                transition: 0.3s;
            }
            a:hover {
                background-color: #5C8EF1;
                color: white;
            }
        </style>
    </head>
    <body>
        <img src="../../assets/img/404.svg" alt="Página não encontrada" onerror="this.style.display='none'"/>
        <p>Ops! A rota solicitada não foi encontrada no sistema.</p>
        <a href="../../index.php">Voltar ao Início</a>
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
		"server_time" => date("Y-m-d H:i:s")
	]);
}
