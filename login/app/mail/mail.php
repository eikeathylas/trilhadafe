<?php

function sendMail()
{
    // 1. Validação de Entrada
    if (!isset($_POST["token"])) {
        echo json_encode(failure('Token inválido!'));
        return;
    }

    if (empty($_POST["email"])) {
        echo json_encode(failure('E-mail não fornecido.'));
        return;
    }

    $hash = rand(100000, 999999);
    $email = str_replace(" ", "", strtolower($_POST["email"]));

    try {
        // 2. Transação com o Banco de Dados
        $conect = $GLOBALS['pdo'];
        $conect->beginTransaction();

        $sql = <<<'SQL'
            UPDATE users 
            SET hash = :hash, updated_at = CURRENT_TIMESTAMP 
            WHERE email = :email
        SQL;

        $loginPayload = [
            'retorno'    => false,
            'multiplo'   => false,
            'sql'        => $sql,
            'parametros' => [
                'hash'  => $hash,
                'email' => $email,
            ],
        ];

        executeSQL($loginPayload);
        $conect->commit();

    } catch (Exception $e) {
        if ($conect->inTransaction()) {
            $conect->rollBack();
        }
        echo json_encode(failure('Erro ao gerar código de verificação.'));
        return;
    }

    // 3. Template de E-mail Moderno e Responsivo
    $subject = 'Código de verificação EaCode';
    $message = <<<MAIL
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="background-color: #F4F5F7; padding: 40px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
                
                <tr>
                    <td style="padding: 40px 30px; text-align: center; border-bottom: 4px solid #FF7622;">
                        <img src="https://painel.eacode.com.br/login/assets/img/logo-dark.png" alt="EaCode" style="max-width: 160px; height: auto;">
                    </td>
                </tr>

                <tr>
                    <td style="padding: 40px 30px; text-align: center; color: #333333;">
                        <h2 style="margin-top: 0; color: #1E293B; font-size: 24px;">Código de Verificação</h2>
                        
                        <p style="font-size: 16px; line-height: 1.6; color: #64748B; margin-bottom: 30px;">
                            Olá!<br>
                            Você solicitou a redefinição de senha para o seu painel de controle <b>EaCode</b>. Use o código de 6 dígitos abaixo para continuar:
                        </p>
                        
                        <div style="background-color: #FFF4ED; border: 2px dashed #FF7622; border-radius: 8px; padding: 25px; margin: 0 auto 30px auto; max-width: 250px;">
                            <span style="font-size: 38px; font-weight: bold; color: #FF7622; letter-spacing: 8px; display: block;">{$hash}</span>
                        </div>
                        
                        <p style="font-size: 14px; line-height: 1.5; color: #94A3B8;">
                            Não informe esse código a ninguém.<br>
                            Se você não solicitou esta alteração, por favor, ignore este e-mail.
                        </p>
                    </td>
                </tr>

                <tr>
                    <td style="background-color: #F8FAFC; padding: 20px; text-align: center; font-size: 13px; color: #94A3B8; border-top: 1px solid #E2E8F0;">
                        &copy; 2026 EaCode. Todos os direitos reservados.
                    </td>
                </tr>

            </table>
        </div>
    </body>
    </html>
    MAIL;

    // 4. Integração com a API de E-mail (cURL)
    $payload = json_encode([
        "subject" => $subject,
        "body"    => $message,
        "to"      => $email,
        "from"    => "eacode@painel.eacode.com.br",
        "headers" => [
            "Content-Type" => "text/html; charset=utf-8"
        ]
    ]);

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => "https://api.smtplw.com.br/v1/messages",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING       => "",
        CURLOPT_MAXREDIRS      => 10,
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_HTTP_VERSION   => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST  => "POST",
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            "Content-Type: application/json",
            "x-auth-token: a623cdd4bda09fad431736f0e7584f86"
        ],
    ]);

    $response = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);

    // 5. Retorno Dinâmico
    if ($err) {
        echo json_encode(failure("Erro na comunicação com o servidor de e-mail."));
    } else {
        echo json_encode(success('E-mail enviado com sucesso. Verifique sua caixa de entrada e o spam.'));
    }
}