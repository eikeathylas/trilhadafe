<?php
// Configurações de Erro (Útil para desenvolvimento)
error_reporting(1);

// Permissões de Acesso (CORS)
header('Access-Control-Allow-Origin: *');

// 1. Inclusão das Dependências
include "../database/database.php"; // Conexão com o Banco Staff
include "../tools/tools.php";       // Ferramentas de segurança e utilitários
include "../mail/mail.php";         // Função de envio de e-mail (Recuperação de senha)

// Nota: pixFunctions.php foi removido pois não há mais cobrança no login.

// 2. Inclusão do Controlador Principal
// O indexController já carrega authFunctions.php e clientFunctions.php internamente
include "../controller/indexController.php";

// 3. Roteamento (Router)
$validator = $_POST["validator"] ?? null;

switch ($validator) {
    case "login":
        // Valida usuário/senha e retorna lista de paróquias
        login();
        break;

    case "toEnter":
        // Escolhe a paróquia e gera o Token de Acesso
        toEnter();
        break;

    case "sendMail":
        // Envia código de verificação para resetar senha
        sendMail();
        break;

    case "resetPassword":
        // Efetiva a troca de senha
        resetPassword();
        break;

    default:
        // Se a ação não existir, exibe página 404
        echo defaul();
        break;
}

exit;

// Página de Erro (404)
function defaul()
{
    // Ajuste o caminho da imagem conforme sua estrutura de pastas real
    // Geralmente: ../../assets/img/trilhadafe.png
    return <<<'TEXT'
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Trilha da Fé - Página não encontrada</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                background-color: #f9f9f9;
                padding: 2rem;
                color: #606060;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            img {
                margin-bottom: 30px;
                max-width: 250px;
                height: auto;
                border-radius: 30px;
            }
            p {
                color: #5C8EF1; /* Azul do Tema */
                font-weight: 700;
                font-size: 20px;
                margin-bottom: 10px;
            }
            a {
                color: #FFD966; /* Dourado do Tema */
                text-decoration: none;
                font-weight: 600;
                border: 1px solid #FFD966;
                padding: 10px 20px;
                border-radius: 5px;
                transition: all 0.3s;
            }
            a:hover {
                background-color: #FFD966;
                color: #fff;
            }
        </style>
    </head>
    <body>
        <img src="../../assets/img/trilhadafe.png" alt="Logo Trilha da Fé" />
        
        <p>Ops! Ação inválida ou página não encontrada.</p>
        <br>
        <a href="../../index.php">Voltar para o Login</a>
    </body>
    </html>
    TEXT;
}