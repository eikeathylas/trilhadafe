<?php

// Mesma chave usada no login (tools.php). Mantenha sincronizado!
define('TOKEN_SECRET_KEY', 'TrilhaDaFe_SecureKey_2025_$#@!'); 

function getTenantConnection($token) {
    try {
        // 1. Decodifica Base64
        $dataFull = base64_decode($token);
        
        // 2. Separa o Vetor de Inicialização (IV) dos dados criptografados
        // O AES-256-CBC usa um IV de 16 bytes
        $iv_length = openssl_cipher_iv_length('aes-256-cbc');
        $iv = substr($dataFull, 0, $iv_length);
        $encrypted = substr($dataFull, $iv_length);
        
        // 3. Descriptografa
        $decrypted = openssl_decrypt($encrypted, 'aes-256-cbc', TOKEN_SECRET_KEY, OPENSSL_RAW_DATA, $iv);
        
        if ($decrypted === false) {
            throw new Exception("Token corrompido ou chave inválida.");
        }

        // 4. Explode os dados (Separador usado no login: _x_)
        // Ordem: [0]Host, [1]Port, [2]DBName, [3]User, [4]Pass, [5]UserId
        $params = explode('_x_', $decrypted);
        
        if (count($params) < 6) {
            throw new Exception("Token incompleto.");
        }

        $host = $params[0];
        $port = $params[1];
        $dbname = $params[2];
        $user = $params[3];
        $password = $params[4];
        $userId = $params[5];

        // 5. Conecta no Banco da Cidade (Tenant)
        $dsn = "pgsql:host={$host};port={$port};dbname={$dbname};user={$user};password={$password}";
        $pdo = new PDO($dsn);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        return [
            "status" => true,
            "pdo" => $pdo,
            "id_user" => $userId,
            "dbname" => $dbname // Útil para debug
        ];

    } catch (Exception $e) {
        return [
            "status" => false,
            "message" => $e->getMessage()
        ];
    }
}