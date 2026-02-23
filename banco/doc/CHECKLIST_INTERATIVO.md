# ✅ CHECKLIST INTERATIVO - Diocese Refactor

> Copie este arquivo para seu projeto e marque conforme progride!

---

## 📋 PRÉ-REQUISITOS

### Ambiente
- [ ] PostgreSQL instalado e funcionando
- [ ] PHP 7.0+ instalado
- [ ] Git configurado (para versionamento)
- [ ] Postman/Insomnia instalado (para testar APIs)
- [ ] VS Code ou editor de preferência

### Preparação
- [ ] Acessado BD Staff: `trilhadafe_staff`
- [ ] Acessado BD Local: `pe_trilhadafe_db`
- [ ] Permissão de criação de tabelas
- [ ] Permissão de alteração de dados
- [ ] Conhecimento básico de SQL
- [ ] Conhecimento básico de PHP

### Documentação Lida
- [ ] QUICK_START.md
- [ ] INDEX_DOCUMENTACAO.md
- [ ] RESUMO_EXECUTIVO.md
- [ ] Escolhi meu role (backend/frontend/qa)

---

## 📅 DIA 1: PREPARAÇÃO + SQL

### Checklist DIA 1.1: Backups
```
⏱️  Tempo estimado: 30 minutos

□ Criar pasta: /backups/pre_refactor/
  mkdir -p /backups/pre_refactor

□ Backup BD Staff
  pg_dump trilhadafe_staff > /backups/pre_refactor/trilhadafe_staff_$(date +%Y%m%d_%H%M%S).sql
  
□ Backup BD Local
  pg_dump pe_trilhadafe_db > /backups/pre_refactor/pe_trilhadafe_db_$(date +%Y%m%d_%H%M%S).sql

□ Backup código
  git tag pre_refactor_dioceses
  git commit -m "Pre-refactor backup"

□ Verificar backups criados
  ls -la /backups/pre_refactor/

□ Testar restore (opcional)
  # NÃO rodar em produção! Apenas em ambiente de teste
  # psql -U admin -d test_restore < backup.sql

Status: ✅ PRONTO PARA PRÓXIMO PASSO
```

### Checklist DIA 1.2: Aplicar SQL
```
⏱️  Tempo estimado: 45 minutos

□ Abrir: SQL_E_PATCHES_COMPLETOS.md
□ Copiar: PARTE 1 (SQL COMPLETO)
□ Executar em psql ou pgAdmin

□ Verificar cada script:
  ✓ CREATE TABLE dioceses
  ✓ INSERT Diocese Caruaru
  ✓ ALTER TABLE users ADD diocese_id
  ✓ ALTER TABLE clients RENAME TO parishes
  ✓ CREATE TABLE parishes_config
  ✓ ALTER TABLE users_clients_profiles RENAME
  ✓ CREATE TABLE users_parishes + UNIQUE

□ Rodar queries de validação:
  
  Query 1: SELECT COUNT(*) FROM dioceses;
  Resultado esperado: 1 ✅
  
  Query 2: SELECT COUNT(*) FROM parishes;
  Resultado esperado: N (quantidade de paróquias) ✅
  
  Query 3: SELECT COUNT(*) FROM users_parishes;
  Resultado esperado: M (quantidade de vínculos) ✅
  
  Query 4: SELECT * FROM dioceses;
  Resultado esperado: Diocese Caruaru com dados ✅
  
  Query 5: SELECT COUNT(*) FROM parishes WHERE diocese_id IS NULL;
  Resultado esperado: 0 (nenhuma nula) ✅

Status: ✅ SQL APLICADO E VALIDADO
```

### Checklist DIA 1.3: Validação de Integridade
```
⏱️  Tempo estimado: 15 minutos

□ Verificar usuários órfãos (sem paróquia)
  SELECT u.id, u.email FROM users u
  LEFT JOIN users_parishes up ON up.user_id = u.id
  WHERE up.id IS NULL AND u.deleted IS FALSE;
  
  Resultado esperado: 0 linhas ✅

□ Verificar UNIQUE constraint
  SELECT user_id, COUNT(*) as parish_count FROM users_parishes
  GROUP BY user_id HAVING COUNT(*) > 1;
  
  Resultado esperado: 0 linhas (cada user tem apenas 1) ✅

□ Verificar referencial integrity
  SELECT up.parish_id FROM users_parishes up
  LEFT JOIN parishes p ON p.id = up.parish_id
  WHERE p.id IS NULL;
  
  Resultado esperado: 0 linhas ✅

Status: ✅ INTEGRIDADE VALIDADA - PROSSEGUIR
```

**FIM DO DIA 1** ✅

---

## 🔧 DIA 2: BACKEND - AUTENTICAÇÃO

### Checklist DIA 2.1: authFunctions.php
```
⏱️  Tempo estimado: 45 minutos

□ Abrir arquivo:
  /login/app/function/authFunctions.php

□ Ler: SQL_E_PATCHES_COMPLETOS.md → PATCH 1

□ Modificações:
  ✓ Remover: Lógica de "múltiplos clientes"
  ✓ Remover: Array $clients
  ✓ Adicionar: Query auto-detecção de paróquia
  ✓ Adicionar: LIMIT 1 na query
  ✓ Retornar: user_id, diocese_id, parish_id

□ Testar com Postman:
  POST http://localhost/login/app/validation/validation.php?validator=login
  {
    "email": "eike@dev",
    "password": "eikebenizio",
    "token": "test123"
  }
  
  Esperado:
  {
    "status": true,
    "data": {
      "id": 1,
      "diocese_id": 1,
      "parish_id": 1,
      ...
    }
  } ✅

□ Testar erro: Email inválido
  Esperado: status false ✅

Status: ✅ authFunctions.php REESCRITO
```

### Checklist DIA 2.2: parishFunctions.php
```
⏱️  Tempo estimado: 45 minutos

□ Arquivo: /login/app/function/clientFunctions.php

□ Ação 1: Renomear
  Para: parishFunctions.php
  (ou copiar + deletar original)

□ Ação 2: Atualizar toda a função
  Ler: SQL_E_PATCHES_COMPLETOS.md → PATCH 2

□ Modificações principais:
  ✓ validateClientAccess() → validateParishAccess()
  ✓ id_client → parish_id
  ✓ name_client → parish_name
  ✓ id_client em JOINs → parish_id
  ✓ users_clients_profiles → users_parishes
  ✓ Adicionar: diocese_id e diocese_name ao retorno

□ Testar com Postman:
  POST http://localhost/login/app/validation/validation.php?validator=toEnter
  {
    "user_id": 1,
    "token": "test123"
  }
  
  Esperado:
  {
    "status": true,
    "data": {
      "parish_id": 1,
      "diocese_id": 1,
      ...
    }
  } ✅

Status: ✅ parishFunctions.php CRIADO/RENOMEADO
```

### Checklist DIA 2.3: indexController.php
```
⏱️  Tempo estimado: 30 minutos

□ Abrir: /login/app/controller/indexController.php

□ Ler: SQL_E_PATCHES_COMPLETOS.md → PATCH 3

□ Modificação 1: Include
  Mudar: include "../function/clientFunctions.php"
  Para: include "../function/parishFunctions.php"

□ Modificação 2: Função toEnter()
  ✓ Remover: Parsing de tokenFull
  ✓ Remover: Extração de user_id com regex
  ✓ Remover: Extração de client_id
  ✓ Adicionar: Chamada direta a validateParishAccess()
  ✓ Simplificar: Sem seleção manual

□ Testar: POST toEnter
  (ja testado acima)

Status: ✅ indexController.php SIMPLIFICADO
```

### Checklist DIA 2.4: Testes de Integração Backend
```
⏱️  Tempo estimado: 30 minutos

□ Criar: /login/test_auth.php
  Copiar código do GUIA_TESTES_AUTOMATIZADO.md → PARTE 2.2

□ Executar:
  cd /xampp/htdocs/trilha-da-fe/login
  php test_auth.php

□ Resultado esperado:
  ✅ 1️⃣ Testando validateLogin()...
  ✅ Login bem-sucedido
  ✅ 2️⃣ Testando validateParishAccess()...
  ✅ Parish access bem-sucedido
  ✅ 3️⃣ Testando login com email inválido...
  ✅ Rejeitado corretamente
  🎉 TESTES CONCLUÍDOS

Status: ✅ BACKEND FUNCIONAL
```

**FIM DO DIA 2** ✅

---

## 🎨 DIA 3: FRONTEND - LOGIN

### Checklist DIA 3.1: main.js
```
⏱️  Tempo estimado: 45 minutos

□ Abrir: /login/assets/js/main.js

□ Ler: SQL_E_PATCHES_COMPLETOS.md → PATCH 5

□ Remover:
  ✓ Selectize initialization
  ✓ Função acessarSistema() antigo
  ✓ Lógica de etapa 2 (seleção paróquia)
  ✓ Popula select code

□ Adicionar:
  ✓ Nova função acessarSistema() que chama toEnter()
  ✓ Fazer login automático após validar()
  ✓ Salvar diocese_id em localStorage

□ Testar: Abrir browser
  http://localhost/login/
  
  Ações:
  1. Digitar email: eike@dev
  2. Digitar senha: eikebenizio
  3. Clicar "Entrar"
  
  Esperado:
  ✅ Sem popup de seleção
  ✅ Spinner por 2-3 seg
  ✅ Redirect para /modules/index.php
  ✅ localStorage contém diocese_id

□ Verificar localStorage (DevTools)
  JSON.parse(localStorage.getItem('tf_data'))
  
  Esperado:
  {
    "diocese_id": 1,
    "parish_id": 1,
    ...
  } ✅

Status: ✅ main.js SIMPLIFICADO
```

### Checklist DIA 3.2: index.php
```
⏱️  Tempo estimado: 15 minutos

□ Abrir: /login/index.php

□ Remover:
  ✓ <div id="etapa2"> (seleção de paróquia)
  ✓ <select id="clients"> (Selectize)
  ✓ Botões da etapa 2
  ✓ Scripts do Selectize

□ Manter:
  ✓ Email input
  ✓ Password input
  ✓ Botão Entrar
  ✓ Scripts de validação

□ Testar: Abrir página
  http://localhost/login/
  
  Esperado:
  ✅ Apenas email + senha
  ✅ Sem select/popup
  ✅ HTML válido

Status: ✅ index.php SIMPLIFICADO
```

### Checklist DIA 3.3: Teste Completo UI
```
⏱️  Tempo estimado: 30 minutos

□ Teste 1: Login válido
  Email: eike@dev
  Senha: eikebenizio
  Resultado: Dashboard aberto ✅

□ Teste 2: Email inválido
  Email: invalid@test.com
  Resultado: Toast de erro ✅

□ Teste 3: Senha inválida
  Email: eike@dev
  Senha: errada
  Resultado: Toast de erro ✅

□ Teste 4: Logout
  Clicar logout
  localStorage deletado ✅
  Redireciona /login ✅

□ Teste 5: Relogin
  Fazer login novamente
  Funcionando ✅

□ Teste 6: localStorage
  DevTools → Application → localStorage
  tf_data contém: diocese_id ✅
  tf_access contém: menu ✅
  tf_time contém: timestamp ✅

Status: ✅ FRONTEND FUNCIONAL
```

**FIM DO DIA 3** ✅

---

## 📊 DIA 4: DASHBOARD

### Checklist DIA 4.1: app.js
```
⏱️  Tempo estimado: 30 minutos

□ Abrir: /modules/assets/js/app.js

□ Encontrar: defaultApp object

□ Adicionar campos:
  ✓ diocese_id
  ✓ diocese_name
  ✓ parish_id
  ✓ parish_name

□ Atualizar: Carregamento de localStorage
  Adicionar: diocese_id e parish_id ao JSON.parse

□ Testar: Console.log
  Digite no console: defaultApp.diocese_id
  Resultado: 1 ✅
  
  Digite: defaultApp.parish_id
  Resultado: 1 ✅

Status: ✅ app.js ATUALIZADO
```

### Checklist DIA 4.2: Controllers
```
⏱️  Tempo estimado: 1 hora

□ Buscar referências id_client
  grep -r "id_client" /modules/app/controller/

□ Arquivos encontrados:
  - [ ] dashboard-controller.php
  - [ ] academic-controller.php
  - [ ] people-controller.php
  - [ ] course-controller.php
  - [ ] organization-controller.php
  - [ ] turmas-controller.php

□ Para cada arquivo:
  ✓ Encontrar id_client
  ✓ Substituir por parish_id
  ✓ Verificar lógica
  ✓ Testar (click em módulo)

□ Testar navegação:
  Dashboard → Pessoas ✅
  Dashboard → Turmas ✅
  Dashboard → Organizacao ✅
  Dashboard → Disciplinas ✅

Status: ✅ CONTROLLERS ATUALIZADOS
```

### Checklist DIA 4.3: Navbar/Header
```
⏱️  Tempo estimado: 30 minutos

□ Abrir: /modules/assets/components/Sidebar.php (ou Head.php)

□ Adicionar exibição:
  Mostrar: "Diocese Caruaru"
  Mostrar: "Paróquia [nome]"
  
  Exemplo:
  <span>Diocese: <%= defaultApp.diocese_name %></span>
  <span>Paróquia: <%= defaultApp.parish_name %></span>

□ Testar: Dashboard
  Navbar exibe diocese e paróquia ✅

Status: ✅ DASHBOARD CONFIGURADO
```

**FIM DO DIA 4** ✅

---

## 👥 DIA 5: CRUD USUÁRIOS DO SISTEMA

### Checklist DIA 5.1: user-functions.php
```
⏱️  Tempo estimado: 45 minutos

□ Criar arquivo:
  /modules/app/function/user-functions.php

□ Copiar código:
  SQL_E_PATCHES_COMPLETOS.md → PARTE 3

□ Adicionar funções:
  ✓ createSystemUser($data)
  ✓ deleteSystemUser($user_id)
  ✓ updateSystemUserProfile($user_id, $profile_id)

□ Implementar validações:
  ✓ Email único (SELECT FROM public.users WHERE email)
  ✓ Senha mínimo 8 caracteres
  ✓ Senha confirmada igual
  ✓ Hash com bcrypt: password_hash()

□ Testar com Postman:
  POST .../app/validation/validation.php?validator=createSystemUser
  {
    "email": "novo@dev",
    "password": "senha1234",
    "confirm_password": "senha1234",
    "person_name": "Novo User",
    "diocese_id": 1,
    "parish_id": 1,
    "profile_id": 2
  }
  
  Esperado: 200 OK com user_id ✅

Status: ✅ user-functions.php PRONTO
```

### Checklist DIA 5.2: pessoas.php - Nova Aba
```
⏱️  Tempo estimado: 45 minutos

□ Abrir: /modules/pessoas.php

□ Localizar: Modal de edição de pessoa

□ Adicionar aba:
  HTML:
  <button class="nav-link" data-toggle="tab" data-target="#acesso">
    Acesso ao Sistema
  </button>
  
  <div class="tab-pane" id="acesso">
    <form id="formAcessoSistema">
      <input name="email" type="email" placeholder="E-mail">
      <input name="password" type="password" placeholder="Senha">
      <input name="confirm" type="password" placeholder="Confirmar">
      <select name="profile_id"><!-- profiles --></select>
      <button type="submit">Criar Usuário</button>
      <button type="button" onclick="deleteSystemUser()">Remover Acesso</button>
    </form>
  </div>

□ Adicionar: Verificação de permissão
  Aba visível APENAS se user tem permissão para criar usuários

□ Testar: Modal pessoa
  ✅ Aba "Acesso ao Sistema" visível
  ✅ Formulário exibe corretamente

Status: ✅ MODAL NOVA ABA PRONTO
```

### Checklist DIA 5.3: pessoas.js
```
⏱️  Tempo estimado: 45 minutos

□ Abrir: /modules/assets/js/pessoas.js

□ Adicionar:
  ✓ Event listener para #formAcessoSistema
  ✓ Função validar campos (email, senha)
  ✓ AJAX POST para createSystemUser
  ✓ Toast sucesso/erro
  ✓ Função deleteSystemUser()

□ Código exemplo:
  $('#formAcessoSistema').on('submit', function(e) {
    e.preventDefault();
    let data = {
      email: $('[name=email]').val(),
      password: $('[name=password]').val(),
      confirm_password: $('[name=confirm]').val(),
      ...
    };
    $.post(..., data, function(resp) {
      if (resp.status) {
        Toast.fire({icon: 'success', title: 'Usuário criado'});
      }
    });
  });

□ Testar: Modal pessoa
  Preencher formulário Acesso ao Sistema ✅
  Clicar Criar Usuário ✅
  Toast de sucesso ✅
  Verificar BD: novo user em public.users ✅

Status: ✅ CRUD USUÁRIOS FUNCIONAL
```

### Checklist DIA 5.4: Teste E2E
```
⏱️  Tempo estimado: 45 minutos

□ Login como admin
  Email: eike@dev / Senha: eikebenizio

□ Abrir: Módulo Pessoas

□ Selecionar: Uma pessoa existente

□ Clicar aba: "Acesso ao Sistema"

□ Preencher:
  Email: novo_user_teste@dev
  Senha: senha_teste_123
  Confirmar: senha_teste_123
  Perfil: (escolher qualquer um)

□ Clicar: "Criar Usuário"

□ Verificar:
  ✅ Toast de sucesso
  ✅ novo_user_teste@dev em public.users
  ✅ Vínculo em users_parishes

□ Logout

□ Login com novo user:
  Email: novo_user_teste@dev
  Senha: senha_teste_123

□ Verificar:
  ✅ Login aceito
  ✅ Dashboard abre
  ✅ localStorage contém dados

Status: ✅ E2E COMPLETO
```

**FIM DO DIA 5** ✅

---

## 🧪 DIA 6: TESTES

### Checklist DIA 6.1: Testes SQL
```
⏱️  Tempo estimado: 30 minutos

□ Abrir: GUIA_TESTES_AUTOMATIZADO.md → PARTE 1

□ Executar Query 1.1: Diocese
  SELECT COUNT(*) FROM dioceses;
  Esperado: 1 ✅

□ Executar Query 1.2: Paróquias
  SELECT COUNT(*) FROM parishes;
  Esperado: N (múltiplo) ✅

□ Executar Query 1.3: Config
  SELECT COUNT(*) FROM parishes p
  LEFT JOIN parishes_config pc ON pc.parish_id = p.id
  WHERE pc.id IS NULL;
  Esperado: 0 ✅

□ Executar Query 1.4: Vínculos
  SELECT user_id, COUNT(*) FROM users_parishes
  GROUP BY user_id HAVING COUNT(*) > 1;
  Esperado: 0 (UNIQUE funciona) ✅

□ Executar Query 1.5: Integridade
  SELECT... (vários selects)
  Esperado: 0 linhas em tudo ✅

□ Executar Query 1.6: Usuários teste
  SELECT * FROM users WHERE email IN ('eike@dev', 'teste@dev');
  Esperado: 2 linhas ✅

Status: ✅ TESTES SQL PASSANDO
```

### Checklist DIA 6.2: Auditoria
```
⏱️  Tempo estimado: 30 minutos

□ Criar: Nova pessoa em Pessoas module

□ Verificar BD Local:
  SELECT * FROM security.audit_logs 
  WHERE table_name = 'persons' 
  ORDER BY created_at DESC LIMIT 1;
  
  Esperado: Registro com old_data/new_data JSON ✅

□ Deletar: Pessoa criada (soft delete)

□ Verificar:
  Pessoa tem deleted = TRUE ✅
  Não aparece em listagem ✅
  Ainda existe no banco ✅

□ Testes cruzados:
  Criar turma → audit_logs registra ✅
  Editar organização → audit_logs registra ✅

Status: ✅ AUDITORIA FUNCIONAL
```

### Checklist DIA 6.3: Testes Manuais
```
⏱️  Tempo estimado: 30 minutos

□ Teste de Permissão
  Login como user comum
  Aba "Acesso ao Sistema" NÃO aparece ✅
  
  Login como admin
  Aba "Acesso ao Sistema" APARECE ✅

□ Teste de Validação
  Tenta criar user com email inválido
  Erro: "E-mail inválido" ✅
  
  Tenta criar com senha < 8 chars
  Erro: "Mínimo 8 caracteres" ✅
  
  Tenta email já existente
  Erro: "E-mail já cadastrado" ✅

□ Teste de Logout
  Após logout, localStorage limpo ✅
  Tela redireciona para /login ✅

Status: ✅ VALIDAÇÕES FUNCIONAM
```

**FIM DO DIA 6** ✅

---

## 🔗 DIA 7: INTEGRAÇÃO

### Checklist DIA 7.1: Testes de Performance
```
⏱️  Tempo estimado: 30 minutos

□ Teste: Login response time
  time curl -X POST http://localhost/login/app/validation/validation.php?validator=login \
  -d '{"email":"eike@dev","password":"eikebenizio"}'
  
  Esperado: < 100ms ✅

□ Teste: Parish access response time
  time curl -X POST http://localhost/login/app/validation/validation.php?validator=toEnter \
  -d '{"user_id":1}'
  
  Esperado: < 200ms ✅

□ Teste: Listar 5000+ pessoas
  Dashboard → Pessoas → Scroll
  
  Esperado: < 2 segundos para carregar ✅

□ Teste: Múltiplas requisições simultâneas
  (usar Apache Bench ou similar)
  
  ab -n 100 -c 10 http://localhost/modules/index.php
  
  Esperado: Sem erros ✅

Status: ✅ PERFORMANCE OK
```

### Checklist DIA 7.2: Testes de Segurança
```
⏱️  Tempo estimado: 30 minutos

□ Teste: Brute Force
  5 tentativas de login falhadas
  
  Esperado: 5ª tentativa bloqueada ✅

□ Teste: SQL Injection
  Email: admin' OR '1'='1
  
  Esperado: Erro normal (prepared statements protegem) ✅

□ Teste: XSS
  Email: <script>alert('xss')</script>
  
  Esperado: Não executa script ✅

□ Teste: CSRF
  Token validation em forms
  
  Esperado: Form rejeitado sem token ✅

Status: ✅ SEGURANÇA OK
```

### Checklist DIA 7.3: Rollback Script
```
⏱️  Tempo estimado: 30 minutos

□ Criar: ROLLBACK_DIOCESES.sql

□ Conteúdo:
  ✓ DROP TABLE dioceses CASCADE
  ✓ DROP TABLE parishes_config
  ✓ ALTER TABLE parishes RENAME TO clients
  ✓ ALTER TABLE users_parishes RENAME TO users_clients_profiles
  ✓ ALTER TABLE users DROP COLUMN diocese_id
  ✓ INSERT dados antigos se necessário

□ Testar (em BD test apenas!):
  psql -U admin -d test_db -f ROLLBACK_DIOCESES.sql
  
  Esperado: 0 erros ✅

□ Tempo de rollback:
  Esperado: < 2 minutos ✅

Status: ✅ ROLLBACK PRONTO
```

### Checklist DIA 7.4: Documentação Final
```
⏱️  Tempo estimado: 30 minutos

□ Atualizar: README.md
  ✓ Novo fluxo de login
  ✓ Novo modelo de dados
  ✓ Novo CRUD usuários

□ Criar: MIGRATION_GUIDE.md
  ✓ Para outros ambientes
  ✓ Passo-a-passo
  ✓ Testes necessários

□ Criar: KNOWN_ISSUES.md (se houver)
  ✓ Problemas encontrados
  ✓ Soluções aplicadas

□ Atualizar: CHANGELOG.md
  ✓ Versão 2.0 - Diocese refactor
  ✓ Data: 11/12/2025
  ✓ Todas as mudanças

Status: ✅ DOCUMENTAÇÃO COMPLETA
```

**FIM DO DIA 7** ✅

---

## 🚀 DIA 8: DEPLOY

### Checklist DIA 8.1: Pré-Deploy
```
⏱️  Tempo estimado: 30 minutos

□ Backup final BD Staff
  pg_dump trilhadafe_staff > backup_pre_deploy_final.sql

□ Backup final BD Local
  pg_dump pe_trilhadafe_db > backup_pre_deploy_final_local.sql

□ Tag Git final
  git tag deploy_dioceses_v1.0
  git commit -m "Ready for production deploy"

□ Verificação final:
  ✓ Todos os 23+ testes passando ✅
  ✓ Documentação atualizada ✅
  ✓ Rollback script pronto ✅
  ✓ Equipe notificada ✅

Status: ✅ PRONTO PARA DEPLOY
```

### Checklist DIA 8.2: Deploy em Produção
```
⏱️  Tempo estimado: 30 minutos

□ Step 1: Parar servidores (opcional)
  systemctl stop apache2  (ou nginx)

□ Step 2: Aplicar SQL em produção
  psql -U admin -d trilhadafe_staff < SQL_MIGRATION.sql
  
  Verificar: Sem erros ✅

□ Step 3: Deploy código
  git pull origin main
  (ou copiar arquivos modificados)

□ Step 4: Testar
  Abrir: http://localhost/login/
  Login com eike@dev ✅
  Dashboard abre ✅

□ Step 5: Iniciar servidores
  systemctl start apache2

□ Step 6: Verificar logs
  tail -f /var/log/apache2/error.log
  tail -f /var/log/php-fpm.log
  
  Esperado: Sem erros críticos ✅

Status: ✅ DEPLOY COMPLETO
```

### Checklist DIA 8.3: Monitoramento Pós-Deploy (24h)
```
⏱️  Tempo estimado: 24 horas contínuas

□ Primeiro 1 hora (crítica):
  ✓ Login testado múltiplas vezes
  ✓ Dashboard funciona
  ✓ Módulos acessáveis
  ✓ Logs sem erros

□ Primeiras 8 horas:
  ✓ Usuários conseguem fazer login
  ✓ Performance aceitável
  ✓ Nenhum erro em logs
  ✓ Auditoria registrando

□ Próximas 16 horas:
  ✓ Colher feedback de usuários
  ✓ Monitorar performance
  ✓ Verificar integridade de dados
  ✓ Tudo normal? ✅

Status: ✅ MONITORAMENTO COMPLETO
```

### Checklist DIA 8.4: Comunicação aos Usuários
```
⏱️  Tempo estimado: 30 minutos

□ Email 1: Notificação de deploy
  Assunto: "Novo fluxo de login - Diocese"
  Conteúdo:
  - Login agora é automático (sem seleção de paróquia)
  - Mais rápido e intuitivo
  - Se tiver dúvida, contate support

□ Email 2: Documentação
  Guia: "Como usar o novo sistema de login"
  Prints da nova tela

□ Slack/Teams: Anúncio
  "Deploy concluído com sucesso! ✅"

Status: ✅ COMUNICAÇÃO COMPLETA
```

### Checklist DIA 8.5: Se der Erro (Contingência)
```
⏱️  Tempo estimado: 15 minutos (rollback)

□ Identificar erro
  Verificar logs ✅

□ Se erro for PEQUENO:
  Fix + redeploy código apenas ✅

□ Se erro for CRÍTICO:
  1. Parar servidor
  2. Restaurar BD backup
     psql -U admin -d trilhadafe_staff < backup_pre_deploy.sql
  3. Reapplicar código antigo (git checkout)
  4. Iniciar servidor
  5. Testar
  
  Tempo: ~15 minutos ✅

□ Se rollback:
  Comunicar stakeholders imediatamente
  Reanalisar problema
  Planejar v2.0

Status: ✅ CONTINGÊNCIA PRONTA
```

**FIM DO DIA 8** ✅

---

## 🎉 RESUMO FINAL

### Checklist Geral Concluída
```
Testes SQL:          6/6   ✅
Testes PHP:          3/3   ✅
Testes Frontend:     3/3   ✅
Testes Integração:   3/3   ✅
Testes Performance:  2/2   ✅
Testes Segurança:    3/3   ✅
────────────────────────────
TOTAL:              23/23  ✅

Documentação:       100%   ✅
Código:             100%   ✅
Rollback:           100%   ✅
Deploy:             100%   ✅

PROJETO CONCLUÍDO COM SUCESSO! 🎉
```

### Próximos Passos
- [ ] Repouso merecido ☕
- [ ] Verificar feedback de usuários
- [ ] Planejar v2.0 (suporte múltiplas dioceses)
- [ ] Documentar lições aprendidas

---

**Checklist Criado**: 11/12/2025  
**Status**: PRONTO PARA USO  

Boa sorte! 🚀
