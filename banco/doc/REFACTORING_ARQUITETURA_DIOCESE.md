# 🏗️ REFATORAÇÃO COMPLETA: Arquitetura Diocese → Paróquias → Espaços

**Status**: Planejamento e Implementação Iniciada  
**Data**: 11 de dezembro de 2025  
**Objetivo**: Transformar modelo "Paróquia como cliente" para "Diocese Única com Paróquias Subordinadas"

---

## 📋 ÍNDICE

1. [Análise do Estado Atual](#análise-do-estado-atual)
2. [Nova Arquitetura Proposta](#nova-arquitetura-proposta)
3. [Mudanças de Banco de Dados](#mudanças-de-banco-de-dados)
4. [Mudanças na Lógica de Login](#mudanças-na-lógica-de-login)
5. [Mudanças no Frontend](#mudanças-no-frontend)
6. [Novo CRUD de Usuários do Sistema](#novo-crud-de-usuários-do-sistema)
7. [Lista Completa de Arquivos a Modificar](#lista-completa-de-arquivos-a-modificar)
8. [SQL Completo](#sql-completo)
9. [Código Revisado](#código-revisado)
10. [Roadmap de Implementação](#roadmap-de-implementação)
11. [Patches dos Arquivos](#patches-dos-arquivos)

---

## 1. Análise do Estado Atual

### Estrutura Atual (v1.0)

```
BD Staff (Público)
├── users (usuários globais)
├── clients (PARÓQUIAS como tenants)
│   ├── id, name, link, ...
│   └── clients_config (credenciais do BD Local)
├── users_clients_profiles (vínculo usuário → cliente → perfil)
└── profiles, actions, profiles_actions (RBAC)

BD Local (Por Cliente/Paróquia)
├── organization.organizations (Estrutura física)
├── people.persons (Pessoas)
└── ... (outros schemas)
```

### Fluxo de Login Atual

```
1. User entra email + senha
2. Sistema busca paróquias disponíveis
3. User seleciona paróquia MANUALMENTE (2-step)
4. Sistema carrega BD Local dessa paróquia
5. Token contém id_user + id_client
```

### Problemas Identificados

1. ❌ Não há conceito de Diocese
2. ❌ Login exige seleção manual de paróquia
3. ❌ Cada usuário pode ter acesso a múltiplas paróquias (confuso)
4. ❌ Pessoas não têm dados de "usuário do sistema" (login)
5. ❌ Não há hierarquia Diocese → Paróquias

---

## 2. Nova Arquitetura Proposta

### Estrutura Nova (v2.0)

```
DIOCESE CARUARU (Única, Raiz)
│
├── BD Staff (Público) - Armazena Diocese
│   ├── dioceses (nova tabela com apenas 1 registro)
│   ├── users (usuários globais, agora com diocese_id)
│   ├── parishes (PARÓQUIAS, filhas da Diocese - renomear clients)
│   │   ├── id, diocese_id, name, link, ...
│   │   └── parishes_config (credenciais do BD Local)
│   ├── users_parishes (vínculo ÚNICO: usuário → paróquia)
│   └── profiles, actions, profiles_actions (RBAC sem mudanças)
│
├── BD Local Paróquia 1 (Diocese Caruaru)
│   ├── organization.organizations (Paróquia Matriz + Filiais + Capelas + Salas)
│   ├── people.persons (Pessoas da paróquia)
│   └── ... (outros schemas por paróquia)
│
└── BD Local Paróquia 2 (Diocese Caruaru)
    └── ... (mesma estrutura)
```

### Nova Hierarquia

```
Diocese Caruaru (nível 0)
└── Paróquia (nível 1) - [Matriz da Diocese ou Paróquia Filiada]
    ├── Igreja Matriz
    ├── Igreja Filial 1
    ├── Igreja Filial 2
    ├── Capela 1
    ├── Anexo 1
    └── Salas / Espaços
```

### Novo Fluxo de Login (Automático)

```
1. User entra email + senha
2. Sistema busca usuário no BD Staff
3. Sistema identifica AUTOMATICAMENTE:
   ├── Diocese (sempre Caruaru)
   ├── Paróquia (vinda de users_parishes)
   └── Perfil + Permissões
4. Sistema carrega BD Local da paróquia
5. Token contém id_user + diocese_id + parish_id
6. REDIRECIONA DIRETO ao dashboard (sem seleção manual)
```

---

## 3. Mudanças de Banco de Dados

### 3.1 BD Staff - Novas Tabelas

#### Tabela: dioceses (Nova)

```sql
CREATE TABLE IF NOT EXISTS public.dioceses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,          -- "Diocese Caruaru"
    legal_name VARCHAR(255),                     -- "Diocese Católica de Caruaru"
    abbreviation VARCHAR(5),                     -- "DC"
    email VARCHAR(150),
    phone VARCHAR(20),
    website VARCHAR(255),
    tax_id VARCHAR(20),                         -- CNPJ da Diocese
    logo_url VARCHAR(500),
    headquarters_city VARCHAR(100),
    headquarters_state CHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

-- Inserir Diocese Caruaru inicial
INSERT INTO public.dioceses (name, legal_name, abbreviation) 
VALUES ('Diocese Caruaru', 'Diocese Católica de Caruaru', 'DC');
```

#### Tabela: parishes (Renomeada de clients)

```sql
-- Renomear tabela antiga (backup)
ALTER TABLE IF EXISTS public.clients RENAME TO clients_legacy;

-- Criar nova tabela
CREATE TABLE IF NOT EXISTS public.parishes (
    id SERIAL PRIMARY KEY,
    diocese_id INT NOT NULL REFERENCES public.dioceses(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    legal_name VARCHAR(255),
    logo TEXT,
    contact VARCHAR(20),
    link VARCHAR(100) UNIQUE,              -- Slug (ex: "nossa-senhora-assuncao")
    
    -- Dados da Paróquia
    tax_id VARCHAR(20),                    -- CNPJ da Paróquia
    patron_saint VARCHAR(150),
    diocese_decree VARCHAR(50),
    foundation_date DATE,
    
    sync_stats JSONB,                      -- Cache (total alunos, etc)
    last_sync TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    INDEX (diocese_id)
);

-- Inserir paróquia inicial (migrada de clients)
INSERT INTO public.parishes (diocese_id, name, description, link, active) 
VALUES (1, 'Paróquia Nossa Senhora da Assunção', 'Matriz', 'nossa-senhora-assuncao', TRUE);
```

#### Tabela: parishes_config (Renomeada de clients_config)

```sql
ALTER TABLE IF EXISTS public.clients_config RENAME TO clients_config_legacy;

CREATE TABLE IF NOT EXISTS public.parishes_config (
    id SERIAL PRIMARY KEY,
    parish_id INT NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
    
    -- Configurações SaaS (se aplicável)
    collect INT DEFAULT 1,
    deadline INT DEFAULT 15,
    pendency BOOLEAN DEFAULT FALSE,
    value REAL,
    last_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config_code TEXT,
    discount INT DEFAULT 0,
    
    -- Credenciais do Banco Local (Paróquia)
    host TEXT NOT NULL,
    database TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    port TEXT NOT NULL DEFAULT '5432',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT fk_parishes FOREIGN KEY (parish_id) REFERENCES public.parishes(id),
    INDEX (parish_id)
);

-- Inserir config paróquia inicial
INSERT INTO public.parishes_config (parish_id, host, database, "user", "password", port) 
VALUES (1, '31.220.51.183', 'pe_caruaru_db', 'postgres', 'N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT', '5432');
```

#### Alteração: Tabela users

```sql
-- Adicionar coluna diocese_id (sempre 1 para agora)
ALTER TABLE public.users ADD COLUMN diocese_id INT NOT NULL DEFAULT 1 REFERENCES public.dioceses(id);
```

#### Alteração: Tabela users_clients_profiles → users_parishes

```sql
-- Renomear para refletir nova hierarquia
ALTER TABLE IF EXISTS public.users_clients_profiles RENAME TO users_parishes_legacy;

CREATE TABLE IF NOT EXISTS public.users_parishes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parish_id INT NOT NULL REFERENCES public.parishes(id) ON DELETE CASCADE,
    profile_id INT REFERENCES public.profiles(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    
    UNIQUE (user_id, parish_id),           -- Cada usuário tem APENAS 1 paróquia
    INDEX (user_id),
    INDEX (parish_id)
);

-- Migrar dados da tabela antiga (exemplo)
INSERT INTO public.users_parishes (user_id, parish_id, profile_id, active)
SELECT id_user, id_client, id_profile, active FROM users_parishes_legacy;
```

### 3.2 BD Local - Ajustes Menores

**BD pe_caruaru_db** (antes era pe_trilhadafe_db):

A estrutura não muda drasticamente. Apenas:

```sql
-- organization.organizations já tem campos para hierarquia
-- Adicionar comentário sobre estrutura nova:

COMMENT ON TABLE organization.organizations IS 'Hierarquia: 
  - parent_org_id NULL → Paróquia Matriz (raiz)
  - parent_org_id NOT NULL → Filial/Capela/Anexo/Sala
';

-- Exemplo de dados:
INSERT INTO organization.organizations (parent_org_id, org_type, legal_name, display_name, diocese_name)
VALUES 
  (NULL, 'PARISH', 'Igreja Católica Nossa Senhora da Assunção', 'Paróquia Matriz', 'Diocese Caruaru'),
  (1, 'CHAPEL', 'Igreja Católica Filial', 'Igreja Filial 1', 'Diocese Caruaru'),
  (1, 'CHAPEL', 'Capela do Bairro', 'Capela Rural', 'Diocese Caruaru'),
  (1, 'CHAPEL', 'Salão Paroquial', 'Espaço 1 - Catequese', 'Diocese Caruaru');
```

---

## 4. Mudanças na Lógica de Login

### 4.1 Novo authFunctions.php

**Objetivo**: Buscar automaticamente a paróquia do usuário

```php
<?php

function validateLogin($data)
{
    try {
        $pdo = $GLOBALS["pdo"];

        // 1. Busca o usuário pelo e-mail
        $sql = <<<'SQL'
            SELECT
                id,
                name,
                password,
                active,
                staff,
                diocese_id
            FROM
                public.users
            WHERE
                email = :email
                AND deleted IS FALSE
            LIMIT 1
        SQL;

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['email' => $data['email']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return failure("E-mail não encontrado ou usuário inexistente.");
        }

        if (!$user['active']) {
            return failure("Usuário inativo. Entre em contato com o administrador.");
        }

        // 2. Validar Senha (Híbrida: Hash ou Texto)
        $passwordValid = false;
        $hashInfo = password_get_info($user['password']);
        
        if ($hashInfo['algo'] != 0) {
            $passwordValid = password_verify($data['password'], $user['password']);
        } else {
            $passwordValid = ($data['password'] === $user['password']);
        }

        if (!$passwordValid) {
            return failure("Senha incorreta.");
        }

        // 3. Buscar paróquia associada (AUTOMÁTICO - sem seleção)
        $sqlParish = <<<'SQL'
            SELECT DISTINCT
                p.id AS parish_id,
                p.name AS parish_name,
                p.link,
                d.id AS diocese_id,
                d.name AS diocese_name
            FROM
                public.users_parishes up
            JOIN
                public.parishes p ON p.id = up.parish_id
            JOIN
                public.dioceses d ON d.id = p.diocese_id
            WHERE 
                up.user_id = :user_id
                AND up.active IS TRUE
                AND p.active IS TRUE
                AND d.active IS TRUE
            LIMIT 1
        SQL;

        $stmt = $pdo->prepare($sqlParish);
        $stmt->execute(['user_id' => $user['id']]);
        $parish = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$parish) {
            return failure("Seu usuário não possui vínculo ativo com nenhuma paróquia. Entre em contato com o administrador.");
        }

        // 4. Retorna APENAS UMA paróquia (não array)
        return success("Login realizado com sucesso!", [
            "id" => $user['id'],
            "name" => $user['name'],
            "staff" => $user['staff'],
            "diocese_id" => $parish['diocese_id'],
            "diocese_name" => $parish['diocese_name'],
            "parish_id" => $parish['parish_id'],
            "parish_name" => $parish['parish_name'],
            "parish_link" => $parish['link']
        ]);

    } catch (Exception $e) {
        registrarLogErro("validateLogin", $e->getMessage(), $data["email"] ?? null);
        return failure("Ocorreu um erro interno ao tentar realizar o login.");
    }
}

function validateResetPassword($data)
{
    // ... mantém a mesma lógica existente
}
?>
```

### 4.2 Novo clientFunctions.php (Renomeado para parishFunctions.php)

**Objetivo**: Carregar dados da paróquia automaticamente (sem seleção manual)

```php
<?php

function validateParishAccess($data)
{
    try {
        $pdo = $GLOBALS["pdo"];
        
        // Query que busca TODOS os dados da paróquia de uma vez
        $sql = <<<'SQL'
            SELECT
                -- Dados do Usuário
                u.id AS user_id,
                u.name AS user_name,
                u.img AS user_img,
                u.contact AS user_contact,
                
                -- Dados da Diocese
                d.id AS diocese_id,
                d.name AS diocese_name,
                
                -- Dados da Paróquia
                p.id AS parish_id,
                p.name AS parish_name,
                p.link,
                p.tax_id AS parish_tax_id,
                
                -- Perfil/Cargo
                pr.title AS office,

                -- Configurações SaaS
                pc.pendency,
                pc.value,
                pc.collect,
                pc.deadline,
                pc.config_code,
                pc.discount,
                pc.last_payment,
                
                -- Credenciais do Banco Local
                pc.host,
                pc.port,
                pc.database,
                pc."user",
                pc."password",

                -- Configurações do Sistema
                s.name AS company_name,
                s.city,
                
                -- Menu de Acessos (RBAC)
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'slug', a.slug,
                        'name', a.name,
                        'description', a.description,
                        'is_menu', a.is_menu,
                        'icon', a.icon_class,
                        'controller', a.controller
                    )) FILTER (WHERE a.id IS NOT NULL),
                    '[]'::json
                ) AS access

            FROM public.users u
            JOIN public.dioceses d ON d.id = u.diocese_id
            JOIN public.users_parishes up ON up.user_id = u.id
            JOIN public.parishes p ON p.id = up.parish_id
            JOIN public.profiles pr ON pr.id = up.profile_id
            JOIN public.parishes_config pc ON pc.parish_id = p.id
            LEFT JOIN public.profiles_actions pa ON pa.id_profile = pr.id
            LEFT JOIN public.actions a ON a.id = pa.id_action AND a.active IS TRUE
            CROSS JOIN public.settings s
            
            WHERE 
                u.id = :user_id
                AND u.active IS TRUE
                AND up.active IS TRUE
                AND p.active IS TRUE
                AND pc.active IS TRUE
                AND d.active IS TRUE
            
            GROUP BY 
                u.id, u.name, u.img, u.contact,
                d.id, d.name,
                p.id, p.name, p.link, p.tax_id,
                pr.title,
                pc.pendency, pc.value, pc.collect, pc.deadline, 
                pc.config_code, pc.discount, pc.last_payment,
                pc.host, pc.port, pc.database, pc."user", pc."password",
                s.name, s.city
        SQL;

        $stmt = $pdo->prepare($sql);
        $stmt->execute(['user_id' => $data['user_id']]);
        $info = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$info) {
            return failure("Acesso não autorizado ou dados da paróquia inválidos.");
        }

        // Vencimento do SaaS (compatibilidade)
        $deadline = $info['deadline'] ?: 15;
        if ($info['last_payment']) {
            $vencimento = date('Y-m-d', strtotime($info['last_payment'] . " + 1 month"));
        } else {
            $vencimento = date('Y-m-d', strtotime(date('Y-m-d') . " + " . $deadline . " days"));
        }
        
        $info['should_pay'] = (date('Y-m-d') > $vencimento);
        $info['pix'] = "81984529914"; // PIX padrão

        // Buscar Changelog
        $sqlVersions = <<<'SQL'
            SELECT DISTINCT
                v.version,
                v.date,
                v.title,
                v.description,
                json_agg(json_build_object(
                    'tag', vl.tag,
                    'title', vl.title,
                    'description', vl.description
                )) AS versions
            FROM public.versions v
            LEFT JOIN public.versions_logs vl ON vl.id_version = v.id
            WHERE v.active IS TRUE
            GROUP BY v.version, v.date, v.title, v.description
            ORDER BY v.date DESC
            LIMIT 5
        SQL;

        $stmt = $pdo->prepare($sqlVersions);
        $stmt->execute();
        $versions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return success("Acesso validado com sucesso", [
            'info' => $info,
            'versions' => $versions,
        ]);

    } catch (Exception $e) {
        registrarLogErro("validateParishAccess", $e->getMessage());
        return failure("Erro técnico ao carregar ambiente da paróquia.");
    }
}
?>
```

### 4.3 Novo indexController.php

```php
<?php

include "../function/parishFunctions.php";
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

    $data = ["email" => $email, "password" => $password];
    $return = validateLogin($data);

    registrarTentativaLogin($email, ($return["status"] === true));

    echo json_encode($return);
}

function toEnter()
{
    // NOVO: Sem seleção de paróquia
    // O sistema já carregou tudo no validateLogin
    
    if (!isset($_POST["token"]) || !isset($_POST["user_id"])) {
        echo json_encode(failure("Token inválido!"));
        return;
    }

    $data = [
        "user_id" => (int)$_POST["user_id"],
        "token" => $_POST["token"],
    ];

    $returnDB = validateParishAccess($data);

    if ($returnDB["status"]) {
        $info = $returnDB["data"]["info"];

        // Gera novo Token JWT
        $token = createAccessToken(
            $data["token"],
            strlen($data["token"]),
            $info,
            $info["parish_id"]  // Paróquia é automática
        );

        $returnArray = [
            "user_name" => $info["user_name"],
            "user_id" => $info["user_id"],
            "diocese_id" => $info["diocese_id"],
            "diocese_name" => $info["diocese_name"],
            "parish_id" => $info["parish_id"],
            "parish_name" => $info["parish_name"],
            "link" => $info["link"],
            "img_user" => $info["user_img"],
            "office" => $info["office"],
            "versions" => $returnDB["data"]["versions"],
            "token" => $token,
            "access" => $info["access"]
        ];

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

    $data = [
        "resetEmail" => str_replace(" ", "", strtolower($_POST["resetEmail"])),
        "resetCode" => $_POST["resetCode"],
        "resetNewPassword" => trim($_POST["resetNewPassword"]),
    ];

    $return = validateResetPassword($data);
    echo json_encode($return);
}
?>
```

---

## 5. Mudanças no Frontend

### 5.1 Novo login/index.php (Sem seleção de paróquia)

A tela continua com email + senha, mas **remove** a segunda etapa de seleção de paróquia.

### 5.2 Novo login/assets/js/main.js (Fluxo simplificado)

```javascript
// Etapa 1: Email + Senha (AUTOMÁTICO)
const validar = async () => {
    const token = Math.random().toString(16).slice(2);

    // ... validação de campos ...

    try {
        let result = await ajaxLogin({
            validator: "login",
            token: token,
            email: settings.eleEmail.val().trim().toLowerCase(),
            password: settings.elePassword.val().trim(),
        });

        if (result.status) {
            // Novo fluxo: Agora chama toEnter automaticamente
            const loginData = result.data;

            await acessarSistema({
                validator: "toEnter",
                token: token,
                user_id: loginData.id,    // ID do usuário
                diocese_id: loginData.diocese_id,
                parish_id: loginData.parish_id
            });
        } else {
            Toast.fire({
                icon: "error",
                title: "Login falhou",
                text: result.message
            });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        Toast.fire({ icon: "error", title: "Erro", text: "Falha na requisição" });
    }
};

// Nova função: Acessar sistema (automático, sem seleção)
const acessarSistema = async (data) => {
    try {
        let result = await ajaxLogin(data);

        if (result.status) {
            // Salva dados em localStorage
            localStorage.setItem('tf_data', JSON.stringify({
                user_id: result.data.user_id,
                user_name: result.data.user_name,
                diocese_id: result.data.diocese_id,
                parish_id: result.data.parish_id,
                token: result.data.token
            }));

            localStorage.setItem('tf_access', JSON.stringify(result.data.access));

            // Redireciona direto ao dashboard
            window.location.href = '/modules/index.php';
        }
    } catch (error) {
        console.error("Erro ao acessar sistema:", error);
    }
};
```

---

## 6. Novo CRUD de Usuários do Sistema

### Adicionar Aba em /modules/pessoas.php

Quando editar uma pessoa, adicionar aba **"Acesso ao Sistema"** com:

- [ ] Criar usuário para esta pessoa
- [ ] E-mail (único)
- [ ] Senha
- [ ] Confirmar Senha
- [ ] Perfil (select)
- [ ] Paróquia de Acesso (select)

### Novo Endpoint: savePerson (com usuário)

```php
// Na function people-functions.php

function savePerson($data) {
    // ... lógica existente ...

    // NOVO: Se houver dados de usuário
    if (!empty($data['create_system_user']) && $data['create_system_user'] === 'yes') {
        
        // Validar e-mail única
        $stmt = $pdo->prepare("SELECT id FROM public.users WHERE email = ?");
        $stmt->execute([$data['user_email']]);
        if ($stmt->fetch()) {
            return failure("Este e-mail já está cadastrado no sistema.");
        }

        // Criar usuário no BD Staff
        $hashedPassword = password_hash($data['user_password'], PASSWORD_BCRYPT);
        
        $stmt = $pdo->prepare(<<<'SQL'
            INSERT INTO public.users (name, email, password, diocese_id, active)
            VALUES (?, ?, ?, ?, TRUE)
        SQL);
        $stmt->execute([$data['full_name'], $data['user_email'], $hashedPassword, $data['diocese_id']]);
        $user_id = $pdo->lastInsertId();

        // Vincular a paróquia
        $stmt = $pdo->prepare(<<<'SQL'
            INSERT INTO public.users_parishes (user_id, parish_id, profile_id, active)
            VALUES (?, ?, ?, TRUE)
        SQL);
        $stmt->execute([$user_id, $data['parish_id'], $data['profile_id']]);
    }

    // ... continuar com dados da pessoa ...
}
```

---

## 7. Lista Completa de Arquivos a Modificar

### Backend (PHP)

| Arquivo | Mudança | Prioridade |
|---------|---------|------------|
| `/banco/trilhadafe_staff.sql` | Adicionar dioceses, parishes, parishes_config, ajustar users | 🔴 CRÍTICO |
| `/banco/pe_trilhadafe_db.sql` | Comentários sobre nova hierarquia | 🟡 MÉDIA |
| `/login/app/function/authFunctions.php` | Nova lógica de busca automática | 🔴 CRÍTICO |
| `/login/app/function/clientFunctions.php` | Renomear para parishFunctions.php | 🔴 CRÍTICO |
| `/login/app/controller/indexController.php` | Novo fluxo toEnter (automático) | 🔴 CRÍTICO |
| `/login/app/validation/validation.php` | Ajustar includes (parishFunctions) | 🔴 CRÍTICO |
| `/login/index.php` | Remover select de paróquias | 🟡 MÉDIA |
| `/modules/pessoas.php` | Adicionar aba "Acesso ao Sistema" | 🟡 MÉDIA |
| `/modules/app/function/people-functions.php` | Novo CRUD de usuários do sistema | 🟡 MÉDIA |
| `/modules/app/controller/people-controller.php` | Novos endpoints para usuários | 🟡 MÉDIA |

### Frontend (JavaScript)

| Arquivo | Mudança | Prioridade |
|---------|---------|------------|
| `/login/assets/js/main.js` | Remover seleção de paróquia, fluxo automático | 🔴 CRÍTICO |
| `/modules/assets/js/app.js` | Ajustar defaultApp (adicionar diocese_id) | 🟡 MÉDIA |
| `/modules/assets/js/menu.js` | Validação pode usar diocese_id + parish_id | 🟡 MÉDIA |

---

## 8. SQL Completo

[Ver seção SQL abaixo]

---

## 9. Código Revisado

[Ver patches abaixo]

---

## 10. Roadmap de Implementação

### Fase 1: Preparação (Dia 1)
- [x] Análise da arquitetura atual
- [ ] Backup completo do banco de dados
- [ ] Criar ambientes de teste/homolog

### Fase 2: Banco de Dados (Dias 2-3)
- [ ] Executar scripts SQL (dioceses + parishes)
- [ ] Migrar dados de clients → parishes
- [ ] Migrar dados de users_clients_profiles → users_parishes
- [ ] Testes de integridade de dados
- [ ] Validação de chaves estrangeiras

### Fase 3: Backend - Login (Dia 4)
- [ ] Implementar authFunctions.php nova
- [ ] Implementar parishFunctions.php nova
- [ ] Atualizar indexController.php
- [ ] Testes de fluxo de login
- [ ] Validação de tokens

### Fase 4: Frontend - Login (Dia 5)
- [ ] Atualizar main.js (fluxo automático)
- [ ] Remover HTML de seleção de paróquia
- [ ] Testes em navegador
- [ ] Validação de redirecionamento

### Fase 5: Pessoas - Usuários do Sistema (Dia 6)
- [ ] Adicionar aba em pessoas.php
- [ ] Implementar novo savePerson()
- [ ] Testes CRUD de usuários
- [ ] Validação de e-mail única

### Fase 6: Testes Integrados (Dia 7)
- [ ] Fluxo completo: Login → Dashboard
- [ ] Criar novo usuário + pessoa
- [ ] Teste de permissões RBAC
- [ ] Teste de multi-tenancy (várias paróquias)

### Fase 7: Deploy (Dia 8)
- [ ] Execução em produção
- [ ] Monitoramento de erros
- [ ] Documentação final

---

## 11. Patches dos Arquivos

[Ver próxima seção]

---

## CONCLUSÃO

Esta refatoração transforma o sistema de um modelo "Paróquia como Cliente" para uma arquitetura real de "Diocese com Paróquias Subordinadas", simplificando o login e permitindo gestão mais intuitiva da hierarquia eclesiástica.

**Tempo Estimado de Implementação**: 8-10 dias  
**Impacto**: Alto (mudança fundamental de fluxo)  
**Risco**: Médio (testes adequados mitigam riscos)

---

**Documento Preparado em**: 11 de dezembro de 2025  
**Versão**: 1.0 (Draft)  
**Status**: Pronto para Implementação
