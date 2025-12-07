<?php
// Configurações de Erro (Útil para debug)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Headers
header('Access-Control-Allow-Origin: *');

// 1. Dependências Essenciais
include "../tools/tools.php";       // Ferramentas (success, failure, getIp, decodeAccessToken)
include "../database/database.php"; // Conexão com Banco (getStaff, getLocal)

// 2. Controllers do Trilha da Fé
include "../controller/session-controller.php";       // Sessão e Login
include "../controller/dashboard-controller.php";     // Tela Inicial
include "../controller/audit-controller.php";         // Auditoria (Raio)
include "../controller/organization-controller.php";  // Organização e Salas

// 3. Captura da Ação
$validator = $_POST["validator"] ?? null;

// 4. Roteamento
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

	// =========================================================
	// MÓDULO: DASHBOARD (dashboard.js)
	// =========================================================
	case "getDashboardStats":
		getDashboardStats();
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
		getResponsiblesList(); // Preenche select de responsáveis
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

	// Opcional: Validar token se quiser segurança extra no ping
	// $decoded = decodeAccessToken($_POST["token"]);
	// if (!$decoded) return failure("Token inválido.");

	return success("Sistema operacional", [
		"status" => "ok",
		"version" => "2.0.0",
		"server_time" => date("Y-m-d H:i:s")
	]);
}
