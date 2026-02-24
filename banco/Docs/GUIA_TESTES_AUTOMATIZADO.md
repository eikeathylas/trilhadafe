# 🧪 GUIA DE TESTES AUTOMATIZADO - Diocese Refactor

## PARTE 1: TESTES SQL

### ✅ Teste 1.1: Verificar Diocese
```sql
-- Deve retornar exatamente 1 diocese
SELECT COUNT(*) FROM dioceses;

-- Deve retornar os dados da Diocese Caruaru
SELECT * FROM dioceses WHERE name = 'Diocese Caruaru';

-- Resultado esperado:
-- id | name           | legal_name                      | abbreviation | headquarters_city | headquarters_state | active
-- 1  | Diocese Caruaru | Diocese Católica de Caruaru    | DC           | Caruaru          | PE                | t
```

### ✅ Teste 1.2: Verificar Paróquias Migradas
```sql
-- Verificar se paróquias foram migradas de clients → parishes
SELECT COUNT(*) FROM parishes;

-- Deve retornar todas as paróquias com diocese_id
SELECT id, name, diocese_id, link, active FROM parishes ORDER BY id;

-- Validar: Todas devem ter diocese_id = 1
SELECT id, name, diocese_id FROM parishes WHERE diocese_id != 1;
-- Resultado esperado: 0 linhas
```

### ✅ Teste 1.3: Verificar Configurações de Paróquias
```sql
-- Cada paróquia deve ter config (credenciais do BD local)
SELECT 
    p.id, 
    p.name, 
    pc.host, 
    pc.database, 
    pc."user",
    pc.port
FROM parishes p
LEFT JOIN parishes_config pc ON pc.parish_id = p.id
WHERE pc.id IS NULL;

-- Resultado esperado: 0 linhas (todas têm config)
```

### ✅ Teste 1.4: Verificar Vínculos Usuários-Paróquias
```sql
-- Verificar se usuários foram vinculados a paróquias
SELECT COUNT(*) FROM users_parishes;

-- Validar: Sem usuários órfãos (sem paróquia)
SELECT u.id, u.name, u.email
FROM users u
LEFT JOIN users_parishes up ON up.user_id = u.id
WHERE up.id IS NULL AND u.deleted IS FALSE;

-- Resultado esperado: 0 linhas

-- Verificar: UNIQUE constraint funcionando
SELECT user_id, COUNT(*) as parish_count
FROM users_parishes
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Resultado esperado: 0 linhas (cada usuário tem apenas 1 paróquia)
```

### ✅ Teste 1.5: Verificar Integridade Referencial
```sql
-- Todos os user_id em users_parishes devem existir em users
SELECT up.user_id
FROM users_parishes up
LEFT JOIN users u ON u.id = up.user_id
WHERE u.id IS NULL;

-- Resultado esperado: 0 linhas

-- Todos os parish_id em users_parishes devem existir em parishes
SELECT up.parish_id
FROM users_parishes up
LEFT JOIN parishes p ON p.id = up.parish_id
WHERE p.id IS NULL;

-- Resultado esperado: 0 linhas

-- Todos os diocese_id em parishes devem existir em dioceses
SELECT p.diocese_id
FROM parishes p
LEFT JOIN dioceses d ON d.id = p.diocese_id
WHERE d.id IS NULL;

-- Resultado esperado: 0 linhas
```

### ✅ Teste 1.6: Verificar Usuários de Teste
```sql
-- Buscar usuários de teste criados
SELECT id, name, email, diocese_id FROM users 
WHERE email IN ('eike@dev', 'teste@dev');

-- Resultado esperado: 2 linhas

-- Verificar vínculo de teste
SELECT u.email, p.name as parish_name
FROM users u
JOIN users_parishes up ON up.user_id = u.id
JOIN parishes p ON p.id = up.parish_id
WHERE u.email IN ('eike@dev', 'teste@dev');

-- Resultado esperado: 2 linhas com vínculo correto
```

---

## PARTE 2: TESTES PHP - AUTENTICAÇÃO

### ✅ Teste 2.1: Teste Manual (Postman/Insomnia)

**Request 1: Login com email/senha válidos**
```
POST http://localhost/login/app/validation/validation.php?validator=login
Content-Type: application/json

{
  "email": "eike@dev",
  "password": "eikebenizio",
  "token": "test_token_123"
}
```

**Resposta Esperada (200)**:
```json
{
  "status": true,
  "message": "Login realizado com sucesso!",
  "data": {
    "id": 1,
    "name": "Eike Benízio",
    "staff": true,
    "diocese_id": 1,
    "diocese_name": "Diocese Caruaru",
    "parish_id": 1,
    "parish_name": "Paróquia X",
    "parish_link": "paroquia-x"
  }
}
```

**Request 2: Login com email inválido**
```
POST http://localhost/login/app/validation/validation.php?validator=login
Content-Type: application/json

{
  "email": "invalido@dev",
  "password": "qualquer_senha",
  "token": "test_token_123"
}
```

**Resposta Esperada (401)**:
```json
{
  "status": false,
  "message": "E-mail ou senha incorretos."
}
```

**Request 3: toEnter (novo fluxo automático)**
```
POST http://localhost/login/app/validation/validation.php?validator=toEnter
Content-Type: application/json

{
  "user_id": 1,
  "token": "test_token_123"
}
```

**Resposta Esperada (200)**:
```json
{
  "status": true,
  "message": "Acesso liberado! Redirecionando...",
  "data": {
    "user_id": 1,
    "user_name": "Eike Benízio",
    "diocese_id": 1,
    "diocese_name": "Diocese Caruaru",
    "parish_id": 1,
    "parish_name": "Paróquia X",
    "link": "paroquia-x",
    "img_user": "...",
    "office": "Administrador",
    "token": "eyJ0eXAiOiJKV1QiLC...",
    "access": [...],
    "versions": [...]
  }
}
```

---

### ✅ Teste 2.2: Script PHP de Teste

Criar arquivo `/login/test_auth.php`:

```php
<?php
// test_auth.php - Teste de autenticação

include "app/database/database.php";
include "app/function/authFunctions.php";
include "app/function/parishFunctions.php";
include "app/tools/tools.php";

echo "🧪 TESTE DE AUTENTICAÇÃO - DIOCESES\n";
echo str_repeat("=", 50) . "\n\n";

// Teste 1: validateLogin
echo "1️⃣ Testando validateLogin()...\n";
$result = validateLogin([
    "email" => "eike@dev",
    "password" => "eikebenizio"
]);

if ($result["status"]) {
    echo "✅ Login bem-sucedido\n";
    echo "   User ID: {$result['data']['id']}\n";
    echo "   Diocese ID: {$result['data']['diocese_id']}\n";
    echo "   Parish ID: {$result['data']['parish_id']}\n\n";
} else {
    echo "❌ Login falhou: {$result['message']}\n\n";
}

// Teste 2: validateParishAccess
echo "2️⃣ Testando validateParishAccess()...\n";
if ($result["status"]) {
    $access_result = validateParishAccess([
        "user_id" => $result['data']['id']
    ]);
    
    if ($access_result["status"]) {
        echo "✅ Parish access bem-sucedido\n";
        echo "   Parish: {$access_result['data']['info']['parish_name']}\n";
        echo "   Office: {$access_result['data']['info']['office']}\n\n";
    } else {
        echo "❌ Parish access falhou: {$access_result['message']}\n\n";
    }
}

// Teste 3: Email inválido
echo "3️⃣ Testando login com email inválido...\n";
$fail_result = validateLogin([
    "email" => "invalido@test.com",
    "password": "qualquer_coisa"
]);

if (!$fail_result["status"]) {
    echo "✅ Rejeitado corretamente: {$fail_result['message']}\n\n";
} else {
    echo "❌ Deveria ter falhado!\n\n";
}

echo "🎉 TESTES CONCLUÍDOS\n";
?>
```

**Executar**:
```bash
cd /xampp/htdocs/trilha-da-fe/login
php test_auth.php
```

**Saída Esperada**:
```
🧪 TESTE DE AUTENTICAÇÃO - DIOCESES
==================================================

1️⃣ Testando validateLogin()...
✅ Login bem-sucedido
   User ID: 1
   Diocese ID: 1
   Parish ID: 1

2️⃣ Testando validateParishAccess()...
✅ Parish access bem-sucedido
   Parish: Paróquia X
   Office: Administrador

3️⃣ Testando login com email inválido...
✅ Rejeitado corretamente: E-mail ou senha incorretos.

🎉 TESTES CONCLUÍDOS
```

---

## PARTE 3: TESTES FRONTEND

### ✅ Teste 3.1: Teste Manual no Browser

**Passo 1**: Abrir http://localhost/login/
- [ ] Página carrega sem erros console
- [ ] Elementos visíveis: Email, Senha, Botão Entrar
- [ ] NÃO há select de paróquias visível

**Passo 2**: Inserir credenciais
- [ ] Email: eike@dev
- [ ] Senha: eikebenizio
- [ ] Clicar "Entrar"

**Passo 3**: Verificar fluxo automático
- [ ] Spinner apareça por 2-3 segundos
- [ ] Sem popup de seleção de paróquia (NOVO)
- [ ] Redirect automático para /modules/index.php
- [ ] localStorage contém `diocese_id` e `parish_id`

**Teste localStorage**:
```javascript
// Abrir DevTools (F12) → Console
JSON.parse(localStorage.getItem('tf_data'))
// Resultado esperado:
{
  "user_id": 1,
  "user_name": "Eike Benízio",
  "diocese_id": 1,
  "diocese_name": "Diocese Caruaru",
  "parish_id": 1,
  "parish_name": "Paróquia X",
  "img": "...",
  "office": "Administrador",
  "token": "..."
}
```

### ✅ Teste 3.2: Teste de Erro de Login

**Teste 1**: Email inválido
- Email: invalido@test.com
- Senha: qualquer_coisa
- [ ] Toast de erro: "E-mail ou senha incorretos."
- [ ] Permanece na página de login
- [ ] localStorage vazio

**Teste 2**: Senha inválida
- Email: eike@dev
- Senha: senha_errada
- [ ] Toast de erro: "E-mail ou senha incorretos."
- [ ] Permanece na página de login

**Teste 3**: Usuário sem paróquia
- (Criar usuário sem vínculo no BD)
- Email: orphan@test.com
- Senha: test1234
- [ ] Toast de erro: "Seu usuário não possui vínculo ativo com nenhuma paróquia."

### ✅ Teste 3.3: Teste de Logout + Relogin

**Passo 1**: Fazer logout
- [ ] Clique no botão logout
- [ ] Tela redireciona para /login/
- [ ] localStorage deletado (verificar console)

**Passo 2**: Relogar
- [ ] Email: eike@dev
- [ ] Senha: eikebenizio
- [ ] Mesmo usuário (sem seleção)
- [ ] Acesso normalmente

---

## PARTE 4: TESTES DE INTEGRAÇÃO

### ✅ Teste 4.1: Fluxo Completo (E2E)

**Cenário**: Novo usuário cria conta de sistema

1. **Admin loga e acessa Pessoas**
   - [ ] Login com eike@dev / eikebenizio
   - [ ] Vai para Módulo Pessoas
   - [ ] Abre modal de pessoa existente

2. **Admin acessa aba "Acesso ao Sistema"**
   - [ ] Aba visível (permissão verificada)
   - [ ] Formulário com campos: Email, Senha, Confirmar, Perfil

3. **Admin cria novo usuário**
   - Email: novo_user@dev
   - Senha: senha123456
   - Confirmar: senha123456
   - Perfil: (selecionar um)
   - [ ] Salva com sucesso
   - [ ] Toast: "Usuário criado com sucesso"
   - [ ] Banco: Novo registro em public.users

4. **Admin faz logout**
   - [ ] localStorage limpo

5. **Novo usuário loga**
   - Email: novo_user@dev
   - Senha: senha123456
   - [ ] Login aceito
   - [ ] Dashboard carrega normalmente
   - [ ] localStorage com novos dados

### ✅ Teste 4.2: Permissão de Acesso

**Teste 1**: Admin pode criar usuários
- [ ] Login como admin
- [ ] Aba "Acesso ao Sistema" VISÍVEL
- [ ] Criar usuário funciona

**Teste 2**: User comum NÃO pode
- [ ] Login como user comum
- [ ] Aba "Acesso ao Sistema" INVISÍVEL
- [ ] Formulário não exibido

### ✅ Teste 4.3: Validações de Entrada

**Teste 1**: Email inválido
- Email: abc123
- [ ] Erro: "E-mail inválido"
- [ ] Não submete

**Teste 2**: Email duplicado
- Email: eike@dev (já existe)
- Senha: teste1234
- [ ] Erro: "E-mail já cadastrado"
- [ ] Não insere no banco

**Teste 3**: Senha muito curta
- Email: novo@dev
- Senha: abc
- [ ] Erro: "Mínimo 8 caracteres"

**Teste 4**: Senhas não conferem
- Email: novo@dev
- Senha: test1234
- Confirmar: teste5678
- [ ] Erro: "Senhas não conferem"

---

## PARTE 5: TESTES DE PERFORMANCE

### ✅ Teste 5.1: Tempo de Login

**Medição 1**: Login simples (validateLogin)
```bash
# No terminal, medir tempo de resposta
time curl -X POST http://localhost/login/app/validation/validation.php?validator=login \
  -H "Content-Type: application/json" \
  -d '{"email":"eike@dev","password":"eikebenizio","token":"test"}'
```

**Esperado**: < 100ms

**Medição 2**: Acesso à paróquia (validateParishAccess)
```bash
time curl -X POST http://localhost/login/app/validation/validation.php?validator=toEnter \
  -H "Content-Type: application/json" \
  -d '{"user_id":1,"token":"test"}'
```

**Esperado**: < 200ms

### ✅ Teste 5.2: Listagem de Pessoas

**Teste**: Dashboard com 5.000+ pessoas
- [ ] Página carrega em < 2 segundos
- [ ] Scroll suave
- [ ] Sem lag ao buscar

```sql
-- Query de teste
SELECT COUNT(*) FROM people.persons;
```

---

## PARTE 6: TESTES DE SEGURANÇA

### ✅ Teste 6.1: Brute Force Protection

**Teste**: 5 tentativas de login falhadas
```bash
for i in {1..5}; do
  curl -X POST http://localhost/login/app/validation/validation.php?validator=login \
    -H "Content-Type: application/json" \
    -d '{"email":"eike@dev","password":"wrong","token":"test"}'
  echo "Tentativa $i"
  sleep 1
done
```

**Esperado**: 
- Tentativas 1-4: Erro normal
- Tentativa 5: Bloqueado ("Muitas tentativas")

### ✅ Teste 6.2: SQL Injection

**Teste**: Email com SQL malicioso
```json
{
  "email": "admin' OR '1'='1",
  "password": "anything",
  "token": "test"
}
```

**Esperado**: 
- [ ] Erro normal ("E-mail não encontrado")
- [ ] Sem acesso ao banco
- [ ] Prepared statements protegem

### ✅ Teste 6.3: XSS Protection

**Teste**: Email com script
```json
{
  "email": "<script>alert('xss')</script>@test.com",
  "password": "test",
  "token": "test"
}
```

**Esperado**:
- [ ] Não executa script
- [ ] Email tratado como literal

---

## PARTE 7: CHECKLIST FINAL

**SQL**:
- [ ] Teste 1.1 - Diocese (1 registro)
- [ ] Teste 1.2 - Paróquias migradas
- [ ] Teste 1.3 - Configurações paróquias
- [ ] Teste 1.4 - Vínculos usuários
- [ ] Teste 1.5 - Integridade referencial
- [ ] Teste 1.6 - Usuários de teste

**PHP**:
- [ ] Teste 2.1 - Postman login/toEnter
- [ ] Teste 2.2 - Script PHP teste_auth.php

**Frontend**:
- [ ] Teste 3.1 - Login manual
- [ ] Teste 3.2 - Erros de login
- [ ] Teste 3.3 - Logout e relogin

**Integração**:
- [ ] Teste 4.1 - Fluxo E2E
- [ ] Teste 4.2 - Permissões
- [ ] Teste 4.3 - Validações

**Performance**:
- [ ] Teste 5.1 - Tempo de login
- [ ] Teste 5.2 - Listagem de pessoas

**Segurança**:
- [ ] Teste 6.1 - Brute force
- [ ] Teste 6.2 - SQL injection
- [ ] Teste 6.3 - XSS

---

## COMO RODAR TODOS OS TESTES

```bash
#!/bin/bash
# run_all_tests.sh

echo "🧪 Iniciando suite de testes..."

# SQL Tests
echo "📊 Rodando testes SQL..."
psql -U seu_user -d trilhadafe_staff -f SQL_TESTES.sql

# PHP Tests
echo "🐘 Rodando testes PHP..."
cd /xampp/htdocs/trilha-da-fe/login
php test_auth.php

# Nota: Frontend/Integração devem ser feitos manualmente no browser
echo "🌐 Abra http://localhost/login/ para testes de frontend"
echo ""
echo "✅ Suite de testes concluída!"
```

---

**Próxima Etapa**: Execute todos os testes ANTES de fazer push para produção! 🚀
