<?php
// Configurações de Erro
error_reporting(1);
// ini_set('display_errors', 1);

// Headers
header('Access-Control-Allow-Origin: *');

// 1. Dependências Essenciais
include "../tools/tools.php";       // Ferramentas (success, failure, getIp)
include "../database/tenant.php";   // [IMPORTANTE] Conector do Banco da Cidade

// 2. Controllers (Adicionaremos mais conforme criarmos os módulos)
include "../controller/dashboard-controller.php";
// include "../controller/turmas-controller.php"; // Futuro
// include "../controller/pessoas-controller.php"; // Futuro

// 3. Captura da Ação
$validator = $_POST["validator"] ?? null;

// 4. Roteamento
switch ($validator) {

	// --- Módulo Dashboard ---
	case "getDashboardStats":
		getDashboardStats();
		break;

	// --- Futuros Módulos (Exemplos) ---
	/*
    case "createTurma":
        createTurma();
        break;
    case "getAlunos":
        getAlunos();
        break;
    */




	// ===============================================
	//      ROTAS PADRÃO
	// ===============================================
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
        <title>EaCode - 404</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                background-color: #f9f9f9;
                padding: 2rem;
            }
            img {
                margin-bottom: 50px;
            }
            p {
                color: #000000;
                font-weight: 800;
                font-size: 20px;
            }
            .h-ajust {
                height: 50vh !important;
            }
            .w-ajust {
                width: 100% !important;
            }
        </style>
    </head>
    <body>
        <img class="w-ajust h-ajust" src="../../assets/img/404.svg" alt="404 SVG" />
        <p>Infelizmente a página que você está procurando não foi encontrada.</p>
        <p>Verifique o URL ou <a href="../../index.php">volte para a página inicial</a>.</p>
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
		"server_time" => timeNow()
	]);
}
