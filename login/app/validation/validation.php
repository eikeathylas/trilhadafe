<?php
error_reporting(1);

header('Access-Control-Allow-Origin: *');

include "../database/database.php";
include "../tools/tools.php";
include "../mail/mail.php";
include "../controller/indexController.php";

$validator = $_POST["validator"] ?? null;

switch ($validator) {
    case "login":
        login();
        break;

    case "toEnter":
        toEnter();
        break;

    case "sendMail":
        sendMail();
        break;

    case "resetPassword":
        resetPassword();
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
                <a href="../../index.php" class="btn btn-primary">Ir para o Painel</a>
            </div>
        </main>
    </body>
    </html>
    TEXT;
}
