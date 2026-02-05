# 🗄️ SQL COMPLETO + PATCHES DE CÓDIGO

## PARTE 1: SQL COMPLETO PARA BD STAFF

```sql
-- ============================================================
-- SCRIPT REFATORAÇÃO: Diocese → Paróquias
-- Data: 11/12/2025
-- ============================================================

-- ============================================================
-- 1. CRIAR TABELA: dioceses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.dioceses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    legal_name VARCHAR(255),
    abbreviation VARCHAR(5),
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(255),
    tax_id VARCHAR(20),
    logo_url VARCHAR(500),
    headquarters_city VARCHAR(100),
    headquarters_state CHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

COMMENT ON TABLE public.dioceses IS 'Dioceses. Para este projeto: sempre haverá apenas 1 (Diocese Caruaru)';

-- Inserir Diocese Caruaru
INSERT INTO public.dioceses (name, legal_name, abbreviation, headquarters_city, headquarters_state)
VALUES ('Diocese Caruaru', 'Diocese Católica de Caruaru', 'DC', 'Caruaru', 'PE')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. ALTER TABLE: users (Adicionar diocese_id)
-- ============================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS diocese_id INT NOT NULL DEFAULT 1 
REFERENCES public.dioceses(id);

-- ============================================================
-- 3. RENOMEAR: clients → parishes (com backup)
-- ============================================================
-- Backup da tabela antiga
ALTER TABLE IF EXISTS public.clients RENAME TO clients_legacy;

-- Criar nova tabela parishes
CREATE TABLE IF NOT EXISTS public.parishes (
    id SERIAL PRIMARY KEY,
    diocese_id INT NOT NULL DEFAULT 1 REFERENCES public.dioceses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    legal_name VARCHAR(255),
    logo TEXT,
    contact VARCHAR(20),
    link VARCHAR(100) UNIQUE,
    tax_id VARCHAR(20),
    patron_saint VARCHAR(150),
    diocese_decree VARCHAR(50),
    foundation_date DATE,
    sync_stats JSONB,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    INDEX (diocese_id)
);

COMMENT ON TABLE public.parishes IS 'Paróquias subordinadas à Diocese. Antes chamada clients.';

-- Migrar dados da tabela antiga (se existir)
INSERT INTO public.parishes (id, diocese_id, name, description, link, active)
SELECT id, 1, name, description, link, active 
FROM public.clients_legacy 
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. RENOMEAR: clients_config → parishes_config
-- ============================================================
ALTER TABLE IF EXISTS public.clients_config RENAME TO clients_config_legacy;

CREATE TABLE IF NOT EXISTS public.parishes_config (
    id SERIAL PRIMARY KEY,
    parish_id INT NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
    collect INT DEFAULT 1,
    deadline INT DEFAULT 15,
    pendency BOOLEAN DEFAULT FALSE,
    value REAL,
    last_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config_code TEXT,
    discount INT DEFAULT 0,
    host TEXT NOT NULL,
    database TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    port TEXT NOT NULL DEFAULT '5432',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    INDEX (parish_id)
);

COMMENT ON TABLE public.parishes_config IS 'Configurações de cada paróquia (credenciais do BD local, SaaS, etc)';

-- Migrar dados
INSERT INTO public.parishes_config (id, parish_id, collect, deadline, pendency, value, last_payment, config_code, discount, host, database, "user", "password", port, active)
SELECT id, id_client, collect, deadline, pendency, value, last_payment, config_code, discount, host, database, "user", "password", port, active
FROM public.clients_config_legacy
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. REMOVER: users_clients_profiles → users_parishes
-- ============================================================
ALTER TABLE IF EXISTS public.users_clients_profiles RENAME TO users_parishes_legacy;

CREATE TABLE IF NOT EXISTS public.users_parishes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parish_id INT NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
    profile_id INT REFERENCES public.profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, parish_id),
    INDEX (user_id),
    INDEX (parish_id)
);

COMMENT ON TABLE public.users_parishes IS 'Vínculo: Cada usuário tem APENAS 1 paróquia. Antes era users_clients_profiles.';

-- Migrar dados (mapear id_client → parish_id)
INSERT INTO public.users_parishes (user_id, parish_id, profile_id, active)
SELECT id_user, id_client, id_profile, active 
FROM public.users_parishes_legacy
ON CONFLICT (user_id, parish_id) DO NOTHING;

-- ============================================================
-- 6. UPDATE: Remover FKs antigos (se não renomeados)
-- ============================================================
-- Se ainda houver constraints antigos, remover:
ALTER TABLE IF EXISTS public.users_token DROP CONSTRAINT IF EXISTS fk_clients;
ALTER TABLE IF EXISTS public.users_token DROP CONSTRAINT IF EXISTS fk_users;

-- Re-criar constraints atualizadas:
ALTER TABLE public.users_token ADD CONSTRAINT fk_users_token 
  FOREIGN KEY (id_user) REFERENCES public.users(id) ON DELETE CASCADE;

-- Renomear coluna id_client para parish_id se ainda existir:
ALTER TABLE public.users_token RENAME COLUMN IF EXISTS id_client TO parish_id;

-- Adicionar FK:
ALTER TABLE public.users_token ADD CONSTRAINT fk_parishes_token 
  FOREIGN KEY (parish_id) REFERENCES public.parishes(id) ON DELETE CASCADE;

-- ============================================================
-- 7. POPULAR DADOS INICIAIS
-- ============================================================
-- Usuários de teste
INSERT INTO public.users (name, email, password, diocese_id, staff, active)
VALUES 
  ('Eike Benízio', 'eike@dev', 'eikebenizio', 1, TRUE, TRUE),
  ('Teste Dev', 'teste@dev', 'teste@dev', 1, TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Vincular usuários à paróquia
INSERT INTO public.users_parishes (user_id, parish_id, profile_id, active)
SELECT u.id, 1, 99, TRUE 
FROM public.users u 
WHERE u.email IN ('eike@dev', 'teste@dev')
ON CONFLICT (user_id, parish_id) DO NOTHING;

-- ============================================================
-- 8. VALIDAR INTEGRIDADE
-- ============================================================
-- Verificar se todas as paróquias têm config
SELECT p.id, p.name, COUNT(pc.id) as config_count
FROM public.parishes p
LEFT JOIN public.parishes_config pc ON pc.parish_id = p.id
GROUP BY p.id
HAVING COUNT(pc.id) = 0;

-- Verificar se todos os usuários têm vínculo
SELECT u.id, u.name, COUNT(up.id) as parish_count
FROM public.users u
LEFT JOIN public.users_parishes up ON up.user_id = u.id
GROUP BY u.id
HAVING COUNT(up.id) = 0;

-- ============================================================
-- 9. LIMPEZA (opcional, após validação)
-- ============================================================
-- DROP TABLE IF EXISTS public.clients_legacy;
-- DROP TABLE IF EXISTS public.clients_config_legacy;
-- DROP TABLE IF EXISTS public.users_parishes_legacy;

```

---

## PARTE 2: PATCHES DE CÓDIGO (Diffs)

### PATCH 1: /login/app/function/authFunctions.php

```diff
--- a/login/app/function/authFunctions.php
+++ b/login/app/function/authFunctions.php
@@ -20,7 +20,8 @@ function validateLogin($data)
                 id,
                 name,
                 password,
                 active,
-                staff
+                staff,
+                diocese_id
             FROM
                 public.users
             WHERE
@@ -50,7 +51,7 @@ function validateLogin($data)
         }
 
         // 3. Busca os Clientes (Paróquias)
-        $sqlClients = <<<'SQL'
+        $sqlParish = <<<'SQL'
             SELECT DISTINCT
-                c.id AS id_client,
-                c.name AS name_client,
+                p.id AS parish_id,
+                p.name AS parish_name,
+                p.link,
+                d.id AS diocese_id,
+                d.name AS diocese_name
             FROM
-                public.users_clients_profiles ucp
+                public.users_parishes up
             JOIN
-                public.clients c ON c.id = ucp.id_client
+                public.parishes p ON p.id = up.parish_id
             JOIN
-                public.clients_config cc ON cc.id_client = c.id
+                public.dioceses d ON d.id = p.diocese_id
             WHERE 
-                ucp.id_user = :id_user
-                AND ucp.active IS TRUE
-                AND c.active IS TRUE
-                AND cc.active IS TRUE
+                up.user_id = :user_id
+                AND up.active IS TRUE
+                AND p.active IS TRUE
+                AND d.active IS TRUE
             ORDER BY
-                c.name ASC
+                p.name ASC
+             LIMIT 1
         SQL;
 
-        $clients = executeSQL([
-            "retorno" => true,
+        $stmt = $pdo->prepare($sqlParish);
+        $stmt->execute(['user_id' => $user['id']]);
+        $parish = $stmt->fetch(PDO::FETCH_ASSOC);
+
+        if (!$parish) {
+            return failure("Seu usuário não possui vínculo ativo com nenhuma paróquia.");
+        }
+
+        // Retorna dados automáticos (sem array de paróquias)
+        return success("Login realizado com sucesso!", [
+            "id" => $user['id'],
+            "name" => $user['name'],
             "multiplo" => true,
-            "sql" => $sqlClients,
-            "parametros" => ["id_user" => $user['id']]
+            "staff" => $user['staff'],
+            "diocese_id" => $parish['diocese_id'],
+            "diocese_name" => $parish['diocese_name'],
+            "parish_id" => $parish['parish_id'],
+            "parish_name" => $parish['parish_name'],
+            "parish_link" => $parish['link']
         ]);
-
-        if (!$clients) {
-            return failure("Seu usuário não possui vínculo ativo com nenhuma paróquia.");
-        }
-
-        return success("Login realizado com sucesso!", [
-            "id" => $user['id'],
-            "name" => $user['name'],
-            "staff" => $user['staff'],
-            "information" => $clients
-        ]);
 
     } catch (Exception $e) {
         registrarLogErro("validateLogin", $e->getMessage(), $data["email"] ?? null);
```

### PATCH 2: /login/app/function/clientFunctions.php → parishFunctions.php

```diff
--- a/login/app/function/clientFunctions.php
+++ b/login/app/function/parishFunctions.php
@@ -1,14 +1,14 @@
 <?php
 
-function validateClientAccess($data)
+function validateParishAccess($data)
 {
     try {
-        $conect = $GLOBALS["pdo"];
+        $pdo = $GLOBALS["pdo"];
         
         // 1. Query Principal
         $sql = <<<'SQL'
             WITH user_context AS (
-                SELECT
-                    (:id_user)::INTEGER AS id_user,
-                    (:id_client)::INTEGER AS id_client
+                SELECT
+                    (:user_id)::INTEGER AS user_id
             )
             SELECT
                 -- Dados do Usuário
@@ -18,29 +18,40 @@ function validateClientAccess($data)
                 u.contact AS contact_user,
                 
                 -- Dados da Diocese
+                d.id AS diocese_id,
+                d.name AS diocese_name,
+                
-                -- Dados do Cliente (Paróquia)
-                c.id AS id_client,
-                c.name AS name_client,
-                c.link,
+                -- Dados da Paróquia
+                p.id AS parish_id,
+                p.name AS parish_name,
+                p.link,
+                p.tax_id AS parish_tax_id,
                 
                 -- Perfil/Cargo
                 p.title AS office,
                 
                 -- Configurações Financeiras (SaaS)
-                cc.pendency,
-                cc.value,
-                cc.collect,
-                cc.deadline,
-                cc.config_code,
-                cc.discount,
-                cc.last_payment,
-                cc.created_at,
+                pc.pendency,
+                pc.value,
+                pc.collect,
+                pc.deadline,
+                pc.config_code,
+                pc.discount,
+                pc.last_payment,
                 
-                -- Credenciais do Banco da Cidade (Tenant DB)
-                cc.host,
-                cc.port,
-                cc.database,
-                cc.user,
-                cc.password,
+                -- Credenciais do Banco Local (Paróquia)
+                pc.host,
+                pc.port,
+                pc.database,
+                pc."user",
+                pc."password",
 
                 -- Configurações da Empresa (Settings)
                 s.name AS company_name,
@@ -60,40 +71,50 @@ function validateClientAccess($data)
                 ))) AS access
 
             FROM user_context uc
             JOIN public.users u ON u.id = uc.id_user
-            JOIN public.users_clients_profiles ucp ON ucp.id_user = u.id AND ucp.id_client = uc.id_client
-            JOIN public.profiles p ON p.id = ucp.id_profile
-            JOIN public.clients c ON c.id = ucp.id_client
-            JOIN public.clients_config cc ON cc.id_client = c.id
+            JOIN public.dioceses d ON d.id = u.diocese_id
+            JOIN public.users_parishes up ON up.user_id = u.id
+            JOIN public.parishes p ON p.id = up.parish_id
+            JOIN public.profiles pr ON pr.id = up.profile_id
+            JOIN public.parishes_config pc ON pc.parish_id = p.id
             JOIN public.profiles_actions pa ON pa.id_profile = p.id
             JOIN public.actions a ON a.id = pa.id_action
             CROSS JOIN public.settings s
             
             WHERE 
                 u.active IS TRUE
-                AND ucp.active IS TRUE
-                AND c.active IS TRUE
-                AND cc.active IS TRUE
+                AND up.active IS TRUE
+                AND p.active IS TRUE
+                AND pc.active IS TRUE
+                AND d.active IS TRUE
                 AND a.active IS TRUE
             
             GROUP BY 
-                u.id, u.name, u.img, u.contact,
-                c.id, c.name, c.link,
-                p.title,
-                cc.pendency, cc.value, cc.collect, cc.deadline, cc.config_code, cc.discount, cc.last_payment, cc.created_at,
-                cc.host, cc.port, cc.database, cc.user, cc.password,
+                u.id, u.name, u.img, u.contact,
+                d.id, d.name,
+                p.id, p.name, p.link, p.tax_id,
+                pr.title,
+                pc.pendency, pc.value, pc.collect, pc.deadline, 
+                pc.config_code, pc.discount, pc.last_payment,
+                pc.host, pc.port, pc.database, pc."user", pc."password",
                 s.name, s.city
         SQL;
 
-        $info = executeSQL([
-            "retorno" => true,
-            "multiplo" => false,
-            "sql" => $sql,
-            "parametros" => [
-                "id_user" => $data["id_user"],
-                "id_client" => $data["id_client"],
-            ],
-        ]);
+        $stmt = $pdo->prepare($sql);
+        $stmt->execute(['user_id' => $data['user_id']]);
+        $info = $stmt->fetch(PDO::FETCH_ASSOC);
 
         if (!$info) {
-            return failure("Acesso não autorizado ou configuração inválida para esta paróquia.");
+            return failure("Acesso não autorizado ou dados da paróquia inválidos.");
         }
 
         // ... resto da função mantém a mesma lógica ...
```

### PATCH 3: /login/app/controller/indexController.php

```diff
--- a/login/app/controller/indexController.php
+++ b/login/app/controller/indexController.php
@@ -1,6 +1,6 @@
 <?php
 
-include "../function/clientFunctions.php";
+include "../function/parishFunctions.php";
 include "../function/authFunctions.php";
 
 function login()
@@ -28,33 +28,34 @@ function login()
 
 function toEnter()
 {
+    // NOVO: Sem seleção de paróquia
+    // O sistema já carregou dados automáticos no validateLogin
+    
     if (!isset($_POST["token"])) {
         echo json_encode(failure("Token inválido!"));
         return;
     }
 
-    $tokenFull = $_POST["token"];
-    // CLIENTS: Aqui também voltamos para o seu padrão (sem espaços)
-    $clientId = str_replace(" ", "", $_POST["clients"]);
+    $data = [
+        "user_id" => (int)$_POST["user_id"],
+        "token" => $_POST["token"],
+    ];
+
+    $returnDB = validateParishAccess($data);
     
-    $parts = explode("@", $tokenFull);
+    if ($returnDB["status"]) {
+        $info = $returnDB["data"]["info"];
+
+        // Gera token JWT (mesmo fluxo anterior)
+        $token = createAccessToken(
+            $data["token"],
+            strlen($data["token"]),
+            $info,
+            $info["parish_id"]  // Paróquia é automática
+        );
+
+        $returnArray = [
+            "user_name" => $info["user_name"],
+            "user_id" => $info["user_id"],
+            "diocese_id" => $info["diocese_id"],
+            "diocese_name" => $info["diocese_name"],
+            "parish_id" => $info["parish_id"],
+            "parish_name" => $info["parish_name"],
+            "link" => $info["link"],
+            "img_user" => $info["user_img"],
+            "office" => $info["office"],
+            "versions" => $returnDB["data"]["versions"],
+            "token" => $token,
+            "access" => $info["access"]
+        ];
+
+        echo json_encode(success("Acesso liberado! Redirecionando...", $returnArray));
+    } else {
+        echo json_encode($returnDB);
+    }
-    
-    if(count($parts) < 2) {
-        echo json_encode(failure("Formato de dados de acesso inválido."));
-        return;
-    }
-
-    $data = [
-        "id_client" => $clientId,
-        "id_user" => $parts[1],
-        "token" => $parts[0],
-        "length" => strlen($parts[0]),
-    ];
-
-    $returnDB = validateClientAccess($data);
-
-    if ($returnDB["status"]) {
-        $info = $returnDB["data"]["info"];
-
-        $token_n = createAccessToken($data["token"], $data["length"], $info, $data["id_client"]);
-
-        $returnArray = array(
-            "name_user" => $info["name_user"],
-            "contact_user" => $info["contact_user"],
-            "id_client" => $info["id_client"],
-            "name_client" => $info["name_client"],
-            "img_user" => $info["img_user"],
-            "office" => $info["office"],
-            "link" => $info["link"],
-            "versions" => $returnDB["data"]["versions"],
-            "token" => $token_n,
-            "access" => $info["access"]
-        );
-
-        echo json_encode(success("Acesso liberado! Redirecionando...", $returnArray));
-    } else {
-        echo json_encode($returnDB);
-    }
 }
 
 function resetPassword()
```

### PATCH 4: /login/app/validation/validation.php

```diff
--- a/login/app/validation/validation.php
+++ b/login/app/validation/validation.php
@@ -3,7 +3,7 @@
 error_reporting(1);
 
 header('Access-Control-Allow-Origin: *');
 
 include "../database/database.php";
 include "../tools/tools.php";
 include "../mail/mail.php";
 
```

### PATCH 5: /login/assets/js/main.js (Parte do novo fluxo)

```javascript
// NOVO: Fluxo Simplificado (sem seleção de paróquia)

const validar = async () => {
    const token = Math.random().toString(16).slice(2);

    settings.eleEmail.removeClass("is-invalid");
    settings.elePassword.removeClass("is-invalid");
    $("#emailError, #passwordError").addClass("d-none");

    if (!validarInput(settings.eleEmail.val(), "e-mail")) {
        settings.eleEmail.addClass("is-invalid");
        $("#emailError").removeClass("d-none");
        settings.eleEmail.focus();
        return;
    }

    if (!validarInput(settings.elePassword.val(), "senha")) {
        settings.elePassword.addClass("is-invalid");
        $("#passwordError").removeClass("d-none");
        settings.elePassword.focus();
        return;
    }

    setButton(true, settings.btnLogin, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Autenticando...');

    try {
        let result = await ajaxLogin({
            validator: "login",
            token: token,
            email: settings.eleEmail.val().trim().toLowerCase(),
            password: settings.elePassword.val().trim(),
        });

        if (result.status) {
            let jsonData = result.data;

            // NOVO: Chamar toEnter automaticamente (sem seleção)
            await acessarSistema({
                validator: "toEnter",
                token: token,
                user_id: jsonData.id,
                diocese_id: jsonData.diocese_id,
                parish_id: jsonData.parish_id
            });
        } else {
            Toast.fire({
                icon: "error",
                title: "Login falhou",
                text: result.message
            });
            setButton(false, settings.btnLogin, '<i class="fas fa-sign-in-alt"></i> Entrar');
        }
    } catch (error) {
        console.error("Erro no login:", error);
        Toast.fire({
            icon: "error",
            title: "Erro na requisição",
            text: "Falha ao comunicar com o servidor"
        });
        setButton(false, settings.btnLogin, '<i class="fas fa-sign-in-alt"></i> Entrar');
    }
};

// NOVO: Função para acessar sistema automaticamente
const acessarSistema = async (data) => {
    try {
        let result = await ajaxLogin(data);

        if (result.status) {
            // Salva dados em localStorage
            localStorage.setItem('tf_data', JSON.stringify({
                user_id: result.data.user_id,
                user_name: result.data.user_name,
                diocese_id: result.data.diocese_id,
                diocese_name: result.data.diocese_name,
                parish_id: result.data.parish_id,
                parish_name: result.data.parish_name,
                img: result.data.img_user,
                office: result.data.office,
                token: result.data.token
            }));

            localStorage.setItem('tf_access', JSON.stringify(result.data.access));
            localStorage.setItem('tf_time', Date.now());

            // Redireciona direto ao dashboard
            window.location.href = '/modules/index.php';
        } else {
            Toast.fire({
                icon: "error",
                title: "Acesso negado",
                text: result.message
            });
            setButton(false, settings.btnLogin, '<i class="fas fa-sign-in-alt"></i> Entrar');
        }
    } catch (error) {
        console.error("Erro ao acessar sistema:", error);
        Toast.fire({
            icon: "error",
            title: "Erro na requisição",
            text: "Falha ao comunicar com o servidor"
        });
        setButton(false, settings.btnLogin, '<i class="fas fa-sign-in-alt"></i> Entrar');
    }
};

// REMOVER: Função acessar() e etapa de seleção de paróquia
// A função btnAcessar.click e a lógica de popula select devem ser REMOVIDAS
```

---

## PARTE 3: NOVO ARQUIVO PARA CRUD DE USUÁRIOS

### Novo Endpoint: /modules/app/function/user-functions.php

```php
<?php

function createSystemUser($data) {
    try {
        $staff_pdo = $GLOBALS["pdo"];  // BD Staff
        $local_pdo = $GLOBALS["conexao"];  // BD Local
        
        // 1. Validar e-mail único no BD Staff
        $stmt = $staff_pdo->prepare("SELECT id FROM public.users WHERE email = ?");
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            return failure("Este e-mail já está cadastrado no sistema.");
        }
        
        // 2. Validar senha (mínimo 8 caracteres)
        if (strlen($data['password']) < 8) {
            return failure("Senha deve ter no mínimo 8 caracteres.");
        }
        
        if ($data['password'] !== $data['confirm_password']) {
            return failure("As senhas não conferem.");
        }
        
        // 3. Criar usuário no BD Staff
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
        
        $stmt = $staff_pdo->prepare(<<<'SQL'
            INSERT INTO public.users 
            (name, email, password, diocese_id, active)
            VALUES (?, ?, ?, ?, TRUE)
        SQL);
        $stmt->execute([
            $data['person_name'],
            $data['email'],
            $hashedPassword,
            $data['diocese_id']
        ]);
        
        $user_id = $staff_pdo->lastInsertId();
        
        // 4. Vincular à paróquia
        $stmt = $staff_pdo->prepare(<<<'SQL'
            INSERT INTO public.users_parishes 
            (user_id, parish_id, profile_id, active)
            VALUES (?, ?, ?, TRUE)
        SQL);
        $stmt->execute([
            $user_id,
            $data['parish_id'],
            $data['profile_id']
        ]);
        
        return success("Usuário do sistema criado com sucesso!", [
            "user_id" => $user_id,
            "email" => $data['email']
        ]);
        
    } catch (Exception $e) {
        return failure("Erro ao criar usuário: " . $e->getMessage());
    }
}

function deleteSystemUser($user_id) {
    try {
        $pdo = $GLOBALS["pdo"];
        
        // Soft delete
        $stmt = $pdo->prepare("UPDATE public.users SET deleted = TRUE WHERE id = ?");
        $stmt->execute([$user_id]);
        
        return success("Usuário removido com sucesso.");
        
    } catch (Exception $e) {
        return failure("Erro ao remover usuário: " . $e->getMessage());
    }
}

?>
```

---

## CONCLUSÃO DO PATCH

Todos os arquivos críticos foram listados com seus patches. O próximo passo é aplicá-los sequencialmente no seu ambiente de teste.

**Arquivos Críticos (Implementar Primeiro)**:
1. SQL (BD Staff)
2. authFunctions.php
3. parishFunctions.php
4. indexController.php
5. main.js (login)

**Arquivos Secundários (Depois)**:
6. pessoas.php (aba novo usuário)
7. people-functions.php (CRUD usuários)
8. app.js (atualizar defaultApp)
