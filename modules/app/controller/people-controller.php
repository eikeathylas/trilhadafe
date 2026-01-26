<?php

include "../function/people-functions.php";

// =========================================================
// GESTÃO DE PESSOAS (CRUD)
// =========================================================

/**
 * Lista pessoas com paginação e filtros
 */
function getPeople()
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

    $data = [
        "limit" => $_POST["limit"] ?? 20,
        "page" => $_POST["page"] ?? 0,
        "search" => $_POST["search"] ?? "",
        "role_filter" => $_POST["role_filter"] ?? ""
    ];

    echo json_encode(getAllPeople($data));
}

/**
 * Busca dados completos de uma pessoa (incluindo família e vínculos)
 */
function getPerson()
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

    $id = $_POST["id"] ?? 0;

    echo json_encode(getPersonData($id));
}

/**
 * Cria ou Atualiza uma Pessoa (Com Upload de Foto)
 */
function savePerson()
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

    // Recebe os dados do formulário
    // Nota: Como tem upload de arquivo, os dados vêm no $_POST direto, não em $_POST['data']
    $data = $_POST;

    // Injeta ID do usuário logado para Auditoria
    $data['user_id'] = $decoded['id_user'];

    // --- LÓGICA DE UPLOAD DE FOTO ---
    if (isset($_FILES["profile_photo"]) && $_FILES["profile_photo"]["error"] === UPLOAD_ERR_OK) {

        // Valida se o ID do cliente foi enviado para criar a pasta correta
        $id_client = isset($_POST["id_client"]) ? intval($_POST["id_client"]) : 0;

        if ($id_client > 0) {
            // Define diretório: modules/assets/img/{id_client}/people/
            $targetDir = __DIR__ . "/../../assets/img/" . $id_client . "/people/";

            // Cria a pasta se não existir
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }

            // Gera nome único para evitar cache e colisão
            $extension = pathinfo($_FILES["profile_photo"]["name"], PATHINFO_EXTENSION);
            $filename = time() . "_" . uniqid() . "." . $extension;
            $targetFile = $targetDir . $filename;

            // Move o arquivo
            if (move_uploaded_file($_FILES["profile_photo"]["tmp_name"], $targetFile)) {
                // Salva o caminho relativo no banco
                $data['profile_photo_url'] = "assets/img/" . $id_client . "/people/" . $filename;
            } else {
                // Se falhar o upload, avisa mas não impede o cadastro (opcional)
                echo json_encode(failure("Falha ao salvar a foto de perfil."));
                return;
            }
        }
    }

    // // --- LÓGICA DE UPLOAD DE FOTO (MELHORADA) ---
    // // Verifica se foi enviado um ficheiro e se não é um erro de "nenhum ficheiro"
    // if (isset($_FILES["profile_photo"]) && $_FILES["profile_photo"]["error"] !== UPLOAD_ERR_NO_FILE) {

    //     // 1. Verificar Erros do PHP no Upload
    //     if ($_FILES["profile_photo"]["error"] !== UPLOAD_ERR_OK) {
    //         $msg = "Erro no envio do ficheiro. Código: " . $_FILES["profile_photo"]["error"];
    //         echo json_encode(failure($msg));
    //         return;
    //     }

    //     $id_client = isset($_POST["id_client"]) ? intval($_POST["id_client"]) : 0;

    //     if ($id_client > 0) {
    //         // 2. Definição do Caminho Absoluto
    //         // Ajustamos para garantir que aponta para a raiz correta do projeto
    //         // __DIR__ é a pasta onde está este ficheiro. O "../../../" volta para a raiz.
    //         // Verifica se a estrutura de pastas corresponde a isso.
    //         $basePath = __DIR__ . "/../../assets/img/" . $id_client . "/people/";

    //         // 3. Criação de Pasta com Permissões Totais (0777)
    //         if (!is_dir($basePath)) {
    //             // O 'true' ativa o modo recursivo (cria as pastas pai se necessário)
    //             if (!mkdir($basePath, 0777, true)) {
    //                 // Se falhar, captura o erro nos logs do servidor
    //                 error_log("Erro Crítico: Não foi possível criar a pasta em: " . $basePath);
    //                 echo json_encode(failure("Falha interna: Não foi possível criar a diretoria de imagens."));
    //                 return;
    //             }
    //             // Garante permissões mesmo se a pasta já existir mas estiver restrita
    //             chmod($basePath, 0777);
    //         }

    //         // 4. Sanitização do Nome do Ficheiro
    //         $extension = pathinfo($_FILES["profile_photo"]["name"], PATHINFO_EXTENSION);
    //         // Nome seguro: timestamp + id único
    //         $newFilename = time() . "_" . uniqid() . "." . strtolower($extension);
    //         $targetFile = $basePath . $newFilename;

    //         // 5. Mover o Ficheiro
    //         if (move_uploaded_file($_FILES["profile_photo"]["tmp_name"], $targetFile)) {
    //             // SUCESSO: Guarda o caminho relativo para o HTML acessar
    //             $data['profile_photo_url'] = "assets/img/" . $id_client . "/people/" . $newFilename;
    //         } else {
    //             // FALHA: Diagnóstico
    //             error_log("Falha no move_uploaded_file. Temp: " . $_FILES["profile_photo"]["tmp_name"] . " -> Destino: " . $targetFile);

    //             // Verifica permissões da pasta para debug
    //             $perms = substr(sprintf('%o', fileperms($basePath)), -4);
    //             error_log("Permissões da pasta de destino: " . $perms);

    //             echo json_encode(failure("Falha ao gravar o ficheiro no disco. Verifique o log de erros."));
    //             return;
    //         }
    //     } else {
    //         echo json_encode(failure("ID do cliente inválido para upload."));
    //         return;
    //     }
    // }

    echo json_encode(upsertPerson($data));
}

/**
 * Exclui (Soft Delete) uma pessoa
 */
function deletePerson()
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

    $data = [
        "id" => $_POST["id"] ?? 0,
        "user_id" => $decoded["id_user"]
    ];

    echo json_encode(removePerson($data));
}

/**
 * Ativa/Desativa uma pessoa
 */
function togglePerson()
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

    $data = [
        "id" => $_POST["id"] ?? 0,
        "active" => $_POST["active"], // 'true' ou 'false'
        "user_id" => $decoded["id_user"]
    ];

    echo json_encode(togglePersonStatus($data));
}

/**
 * Busca lista para o Select de Família (Busca Parente)
 * Diferente do getPeople, este é otimizado para dropdown (apenas ID e Nome)
 */
function getRelativesList()
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

    $search = $_POST['search'] ?? '';

    echo json_encode(searchPeopleForSelect($search));
}


function getStudentsList()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    echo json_encode(getStudentsForSelect($_POST['search'] ?? ''));
}

function getCatechistsList()
{
    if (!isset($_POST["token"])) {
        echo json_encode(failure("Token inválido.", null, false, 401));
        return;
    }
    $decoded = decodeAccessToken($_POST["token"]);
    if (!$decoded || !isset($decoded["conexao"])) {
        echo json_encode(failure("Acesso negado.", null, false, 401));
        return;
    }
    getLocal($decoded["conexao"]);

    echo json_encode(getCatechistsForSelect($_POST['search'] ?? ''));
}
