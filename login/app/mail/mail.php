<?php

function sendMail()
{

    if (!isset($_POST["token"])) {
        return json_encode(failure('Token inválido!'));
    }
    $hash = rand(100000, 999999);
    $email = str_replace(" ", "", strtolower($_POST["email"]));


    $conect = $GLOBALS['pdo'];
    $conect->beginTransaction();

    $sql = <<<'SQL'
        UPDATE
            users u
        SET
            hash = :hash,
            updated_at = CURRENT_TIMESTAMP
        WHERE
            u.email = :email
    SQL;

    $login = array(
        'retorno' => false,
        'multiplo' => false,
        'sql' => $sql,
        'parametros' => array(
            'hash' => $hash,
            'email' => $email,
        ),
    );

    executeSQL($login);
    $conect->commit();



    $subject = 'Código de verificação EaCode';
    $message = <<<MAIL
        <div>
            <div>
                <div>
                    <table width="650" bgcolor="#EBE6F0" border="0" align="center" cellpadding="0" cellspacing="0" style="margin: 0 auto">
                        <tbody>
                            <tr height="72" align="center" valign="middle" bgcolor="#FF7622">
                                <td colspan="4"></td>
                            </tr>
                            <tr height="72" align="center" valign="top">
                                <!-- <td width="650" style="background: #FF7622; border-radius: 0px 0px 70% 70%; height: 370px; position: absolute;"> -->
                                    <td width="39">
                                        <div style="left: 0px;
                                                    height: 200px;
                                                    background: #FF7622;
                                                    border-radius: 0px 0px 0px 50px;">
                                        </div>
                                    </td>
                                    <td bgcolor="#FFFFFF">
                                        <table width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                                            <tbody>
                                                <tr bgcolor="#FFFFFF" align="center" style="position: sticky;">
                                                    <td width="5"></td>
                                                    <td style="padding-left: 40px; padding-right: 40px">
                                                        <br>
                                                        <br>
                                                        <img src="https://painel.eacode.com.br/login/assets/img/logo-dark.png" alt="EaCode" class="CToWUd" data-bit="iit">
                                                        <br>
                                                        <br>
                                    
                                                        <font color="#FF7622" size="+2" style="font-size: 32px; font-family: 'Archivo', 'Work Sans', 'Open Sans', 'Arial', sans-serif, EmojiFont">
                                                            <b>Código de validação</b>
                                                        </font>
                                                        <br>
                                                        <br>
                                    
                                                        <font color="#73737D" size="3" style="font-size: 16px; line-height: 25px; font-family: 'Work Sans', 'Open Sans', 'Arial', sans-serif, EmojiFont">
                                                            Olá!<br><br>
                                    
                                                            Seu <b>código de verificação</b> para redefinir a senha do painel de controle EaCode é: <b>$hash</b><br><br>
                                    
                                                            Não informe esse código a ninguém.<br><br>
                                    
                                                            Um abraço,<br>
                                                            <b>EaCode</b>
                                                        </font>
                                                        <br>
                                                        <br>
                                                    </td>
                                                    <td width="5"></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </td>
                                    <td width="39">
                                        <div style="left: 0px;
                                                    height: 200px;
                                                    background: #FF7622;
                                                    border-radius: 0px 0px 50px 0px;">
                                        </div>
                                    </td>
                                <!-- </td> -->
                            </tr>
                            <tr align="center">
                                <td colspan="3" style="padding-left: 70px; padding-right: 70px">
                                    <br>
                                    <br>
                                    <!-- <a href="#" style="text-decoration:none" title="EaCode" target="_blank" data-saferedirecturl="">
                                        <font color="#FF5000" size="3" style="font-size:16px;line-height:25px;font-family:'Work Sans','Open Sans','Arial',sans-serif,EmojiFont">
                                            <img src="https://painel.eacode.com.br/login/assets/img/pix.png" alt="EaCode" class="CToWUd" data-bit="iit">
                                        </font>
                                    </a> -->
                                    <br>
                                    <br>
                                    <br>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    MAIL;



    $ch = curl_init();
    curl_setopt_array($ch, array(
        CURLOPT_URL => "https://api.smtplw.com.br/v1/messages",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => "POST",
        CURLOPT_POSTFIELDS => json_encode(array(
            "subject" => $subject,
            "body" => $message,
            "to" => $email,
            "from" => "eacode@painel.eacode.com.br",
            "headers" => array(
                "Content-Type" => "text/html; charset=iso-8859-1",
                "X-Custom-Header" => "my-custom-header-value"
            ),
        )),
        CURLOPT_HTTPHEADER => array(
            "Content-Type: application/json",
            "x-auth-token: a623cdd4bda09fad431736f0e7584f86"
        )
    ));
    curl_exec($ch);
    curl_close($ch);

    echo json_encode(success('E-mail enviado'));
}
