<?php

include "../function/clientFunctions.php";
include "../function/authFunctions.php";

function login()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido!"));
        return;
    }

    $email = str_replace(" ", "", strtolower($_POST["email"]));

    $password = trim($_POST["password"]);

    if (verificarBloqueioLogin($email)) {
        echo json_encode(failure("Muitas tentativas de login falhas. Por favor, aguarde 15 minutos."));
        return;
    }

    $data = [
        "email" => $email,
        "password" => $password,
    ];

    $return = validateLogin($data);

    registrarTentativaLogin($email, ($return["status"] === true));

    echo json_encode($return);
}

function toEnter()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido!"));
        return;
    }

    $tokenFull = $_POST["token"];
    $clientId = str_replace(" ", "", $_POST["clients"]);
    
    $parts = explode("@", $tokenFull);
    
    if(count($parts) < 2) {
        echo json_encode(failure("Formato de dados de acesso inválido."));
        return;
    }

    $data = [
        "id_client" => $clientId,
        "id_user" => $parts[1],
        "token" => $parts[0],
        "length" => strlen($parts[0]),
    ];

    $returnDB = validateClientAccess($data);

    if ($returnDB["status"]) {
        $info = $returnDB["data"]["info"];

        $token_n = createAccessToken($data["token"], $data["length"], $info, $data["id_client"]);

        $returnArray = array(
            "name_user" => $info["name_user"],
            "contact_user" => $info["contact_user"],
            "id_client" => $info["id_client"],
            "name_client" => $info["name_client"],
            "img_user" => $info["img_user"],
            "office" => $info["office"],
            "link" => $info["link"],
            "versions" => $returnDB["data"]["versions"],
            "token" => $token_n,
            "access" => $info["access"]
        );

        echo json_encode(success("Acesso liberado! Redirecionando...", $returnArray));
    } else {
        echo json_encode($returnDB);
    }
}

function resetPassword()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido!"));
        return;
    }
    
    if ($_POST["resetNewPassword"] !== $_POST["resetConfirmNewpassword"]) {
        echo json_encode(failure("As senhas informadas não conferem."));
        return;
    }

    $data = array(
        "resetEmail" => str_replace(" ", "", strtolower($_POST["resetEmail"])),
        "resetCode" => $_POST["resetCode"],
        "resetNewPassword" => trim($_POST["resetNewPassword"]),
    );

    $return = validateResetPassword($data);
    echo json_encode($return);
}