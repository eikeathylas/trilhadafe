# 📋 ROADMAP DETALHADO + CHECKLIST DE IMPLEMENTAÇÃO

## 🗓️ TIMELINE: 8 DIAS DE DESENVOLVIMENTO

### DIA 1: PREPARAÇÃO + BANCO DE DADOS
**Tempo Estimado: 2 horas**

- [ ] **1.1** Fazer backup completo da BD Staff
  - Comando: `pg_dump trilhadafe_staff > backup_$(date +%Y%m%d_%H%M%S).sql`
  - Armazenar em local seguro

- [ ] **1.2** Fazer backup da BD Local (de cada paróquia)
  - Comando: `pg_dump pe_trilhadafe_db > backup_local_$(date +%Y%m%d_%H%M%S).sql`

- [ ] **1.3** Aplicar script SQL (parte 1)
  - Executar: `SQL_E_PATCHES_COMPLETOS.md` → "PARTE 1: SQL COMPLETO PARA BD STAFF"
  - Verificar: Tabelas `dioceses`, `parishes`, `users_parishes` criadas
  - Validar: `SELECT COUNT(*) FROM dioceses;` (deve retornar 1 - Diocese Caruaru)

- [ ] **1.4** Testar integridade de dados
  - Query: Verificar se paróquias migraram: `SELECT COUNT(*) FROM parishes;`
  - Query: Verificar usuários vinculados: `SELECT COUNT(*) FROM users_parishes;`
  - Query: Executar scripts de validação (final do SQL)

**Checklist SQL**:
```sql
-- Deve retornar 1
SELECT COUNT(*) FROM dioceses WHERE name = 'Diocese Caruaru';

-- Deve retornar todas as paróquias antigas
SELECT COUNT(*) FROM parishes;

-- Deve retornar todos os vínculos de usuários
SELECT COUNT(*) FROM users_parishes;

-- Deve estar vazio (não deve haver usuários sem paróquia)
SELECT u.id FROM users u 
LEFT JOIN users_parishes up ON up.user_id = u.id 
WHERE up.id IS NULL AND u.deleted IS FALSE;
```

---

### DIA 2: BACKEND - AUTENTICAÇÃO

**Tempo Estimado: 3 horas**

- [ ] **2.1** Reescrever `/login/app/function/authFunctions.php`
  - Remover: Lógica de "múltiplos clientes"
  - Adicionar: Auto-detecção de paróquia (via users_parishes)
  - Testar: GET http://localhost/login/index.php
  - Validar: Tela de login carrega sem erros

- [ ] **2.2** Criar `/login/app/function/parishFunctions.php` (cópia renomeada)
  - Cópia: Pegar `clientFunctions.php` como base
  - Renomear: `validateClientAccess()` → `validateParishAccess()`
  - Atualizar: Todas as referências (clients → parishes, id_client → parish_id)
  - Testar: Função retorna dados corretos (diocese_id, parish_name)

- [ ] **2.3** Atualizar `/login/app/controller/indexController.php`
  - Remover: Função `toEnter()` antigo (com seleção de paróquia)
  - Adicionar: Novo `toEnter()` (automático)
  - Atualizar: `include` para referenciar `parishFunctions.php`
  - Testar: POST /login/app/validation/validation.php?validator=toEnter

- [ ] **2.4** Testar fluxo de login (sem UI ainda)
  - Usar Postman/Insomnia:
    ```
    POST http://localhost/login/app/validation/validation.php?validator=login
    {
      "email": "eike@dev",
      "password": "eikebenizio"
    }
    ```
  - Resposta esperada: user_id, name, diocese_id, parish_id
  - Testar também: `validateParishAccess()` manualmente

**Arquivos Modificados**: 2
**Testes Requeridos**: 5

---

### DIA 3: FRONTEND - SIMPLIFICAÇÃO DO LOGIN

**Tempo Estimado: 2 horas**

- [ ] **3.1** Atualizar `/login/assets/js/main.js`
  - Remover: Seleção de paróquia (Selectize)
  - Remover: Função `acessarSistema()` antigo
  - Remover: Lógica de etapa 2 (seleção)
  - Adicionar: Chamada automática de toEnter() após validarLogin()
  - Adicionar: localStorage com dados diocese_id + parish_id

- [ ] **3.2** Simplificar `/login/index.php`
  - Remover: `<div id="etapa2">` (seleção de paróquia)
  - Remover: `<select id="clients">` Selectize
  - Manter: Apenas email + password + botão entrar
  - Testar: HTML valida sem erros

- [ ] **3.3** Testar login completo (UI)
  - Abrir: http://localhost/login/
  - Login: eike@dev / eikebenizio
  - Esperado: Redirect automático para /modules/index.php (sem popup)
  - Validar: localStorage contém diocese_id

- [ ] **3.4** Testar logout + relogin
  - Clicar logout
  - Verificar: localStorage limpo
  - Relogar: Mesmo usuário (sem seleção de paróquia)

**Arquivos Modificados**: 2
**Testes Requeridos**: 4

---

### DIA 4: DASHBOARD + CONFIGURAÇÕES

**Tempo Estimado: 2 horas**

- [ ] **4.1** Atualizar `/modules/assets/js/app.js`
  - Adicionar: `diocese_id` ao `defaultApp`
  - Adicionar: `diocese_name` ao `defaultApp`
  - Atualizar: Carregamento de localStorage (incluir diocese)
  - Testar: Console mostra defaultApp.diocese_id

- [ ] **4.2** Verificar referências de `id_client` nos controllers
  - Buscar: Todos os arquivos em `/modules/app/controller/`
  - Encontrar: Referências a `id_client` → renomear para `parish_id`
  - Arquivos críticos:
    - dashboard-controller.php
    - academic-controller.php
    - people-controller.php
  - Testar: Dashboard carrega sem erros

- [ ] **4.3** Atualizar header/navbar do módulo
  - Elemento: Mostrar "Diocese Caruaru" (se aplicável)
  - Elemento: Mostrar nome da paróquia atual
  - Testar: Elementos aparecem corretamente na UI

- [ ] **4.4** Testar navegação entre módulos
  - Clickar: Turmas → Pessoas → Disciplinas → Organização
  - Esperado: Sem erros de referência
  - Validar: localStorage mantém diocese_id e parish_id

**Arquivos Modificados**: 3-5
**Testes Requeridos**: 4

---

### DIA 5: NOVO CRUD - USUÁRIOS DO SISTEMA

**Tempo Estimado: 3 horas**

- [ ] **5.1** Criar `/modules/app/function/user-functions.php`
  - Função: `createSystemUser($data)`
  - Função: `deleteSystemUser($user_id)`
  - Função: `updateSystemUserProfile($user_id, $profile_id)`
  - Validações: Email único, senha mínimo 8 chars, confirmar senha
  - Testar: Criar usuário via Postman

- [ ] **5.2** Atualizar `/modules/pessoas.php`
  - Adicionar: Nova aba "Acesso ao Sistema" (tab button)
  - Conteúdo: Formulário para criar usuário
  - Campos:
    - Email (obrigatório, único)
    - Senha (obrigatório, mínimo 8)
    - Confirmar Senha
    - Perfil (select com profiles)
    - Checkbox "Remover acesso ao sistema" (soft delete)
  - Testar: Aba carrega, formulário exibe

- [ ] **5.3** Atualizar `/modules/assets/js/pessoas.js`
  - Adicionar: Event listener para form "Acesso ao Sistema"
  - Adicionar: AJAX POST para `createSystemUser`
  - Validação: Email format, senha match
  - Toast: Sucesso/erro após submit
  - Testar: Salvar novo usuário via modal

- [ ] **5.4** Testar permissão de acesso
  - Permissão: Apenas admin pode criar usuários
  - Teste: Login como user não-admin → aba não aparece
  - Teste: Login como admin → aba aparece
  - Validar: Banco registra novo usuário em public.users

- [ ] **5.5** Testar login do novo usuário criado
  - Criar: Novo user via aba
  - Logout: Usuário atual
  - Login: Com novo email/senha criado
  - Esperado: Acesso ao sistema normal

**Arquivos Novos**: 1
**Arquivos Modificados**: 2
**Testes Requeridos**: 8

---

### DIA 6: AUDITORIA + TESTES DE INTEGRIDADE

**Tempo Estimado: 2 horas**

- [ ] **6.1** Validar logs de auditoria
  - Tabela: `security.audit_logs` (BD local)
  - Teste: Criar pessoa → Verificar audit_logs
  - Teste: Criar usuário → Verificar audit_logs BD Staff
  - Verificar: JSON antigo/novo está correto

- [ ] **6.2** Testar referencial integrity
  - Query: Verificar se todas as paróquias têm config
    ```sql
    SELECT p.id FROM parishes p
    LEFT JOIN parishes_config pc ON pc.parish_id = p.id
    WHERE pc.id IS NULL;
    ```
  - Query: Verificar se todos os usuários tem paróquia
    ```sql
    SELECT u.id FROM users u
    LEFT JOIN users_parishes up ON up.user_id = u.id
    WHERE up.id IS NULL AND u.deleted IS FALSE;
    ```

- [ ] **6.3** Testar soft deletes
  - Deletar: Uma pessoa
  - Verificar: `people.persons.deleted = TRUE`
  - Verificar: Não aparece em listagem
  - Query admin: Verificar dados ainda existem

- [ ] **6.4** Testar múltiplas sessões
  - Login: User A em browser 1
  - Login: User B em browser 2 (modo anônimo)
  - Esperado: Cada um vê apenas seus dados (isolamento por paróquia)
  - Testar: localStorage não interfere entre browsers

**Testes Requeridos**: 8

---

### DIA 7: INTEGRAÇÃO FINAL + ROLLBACK

**Tempo Estimado: 2.5 horas**

- [ ] **7.1** Script de rollback (se necessário)
  - Criar: `ROLLBACK_DIOCESES.sql`
  - Conteúdo:
    ```sql
    -- Restaurar dados antigos
    ALTER TABLE users_parishes RENAME TO users_parishes_novo;
    ALTER TABLE users_parishes_legacy RENAME TO users_parishes;
    
    -- Etc... (reverter todas as mudanças)
    ```
  - Armazenar: Em local seguro para emergência

- [ ] **7.2** Performance testing
  - Teste: Login com 100 usuários simultâneos
  - Teste: Listar 10.000 pessoas
  - Métrica: Response time < 500ms (sem cache)
  - Otimizar: Adicionar indexes se necessário

- [ ] **7.3** Teste de segurança
  - Teste: Força bruta no login (deve bloquear)
  - Teste: SQL injection (prepared statements protegem)
  - Teste: XSS (validar outputs)
  - Teste: CSRF (verificar tokens nos forms)

- [ ] **7.4** Documentação final
  - Atualizar: README.md com novo fluxo de login
  - Criar: MIGRATION_GUIDE.md (para outros ambientes)
  - Documentar: Novas tabelas (dioceses, parishes)

**Documentos Criados**: 2
**Testes Requeridos**: 6

---

### DIA 8: DEPLOY + MONITORAMENTO

**Tempo Estimado: 1.5 horas**

- [ ] **8.1** Backup final antes de deploy
  - Backup: BD Staff
  - Backup: Todas as BDs locais
  - Backup: Código antigo (git tag)

- [ ] **8.2** Aplicar código em produção
  - Push: Código ao repositório principal
  - Deploy: PHP files
  - Deploy: SQL (com cuidado - testar em staging primeiro)
  - Verificar: Permissões de arquivos

- [ ] **8.3** Testar em produção
  - Login: Com credenciais reais
  - Dashboard: Verificar dados
  - Criar: Nova pessoa/turma/etc
  - Verificar: Auditoria funciona

- [ ] **8.4** Monitoramento pós-deploy (24h)
  - Logs: Verificar erros no servidor
  - Performance: Monitor response times
  - Usuários: Coletar feedback
  - Rollback: Se necessário (plano de contingência)

- [ ] **8.5** Comunicado aos usuários
  - Email: Notificar sobre novo fluxo de login
  - Email: Credenciais de teste (se aplicável)
  - Documentação: Novo guia de uso

**Testes Requeridos**: 4
**Comunicações**: 1

---

## 📊 RESUMO EXECUTIVO

| Dia | Atividade | Horas | Status |
|-----|-----------|-------|--------|
| 1 | Preparação + SQL | 2h | ⏳ |
| 2 | Backend Auth | 3h | ⏳ |
| 3 | Frontend Login | 2h | ⏳ |
| 4 | Dashboard | 2h | ⏳ |
| 5 | CRUD Usuários | 3h | ⏳ |
| 6 | Testes | 2h | ⏳ |
| 7 | Integração | 2.5h | ⏳ |
| 8 | Deploy | 1.5h | ⏳ |
| **TOTAL** | | **18 horas** | |

---

## 🚨 PONTOS CRÍTICOS (HIGH RISK)

### Risk 1: Migração de Dados
**Problema**: Paróquias antigas têm usuários sem a restrição UNIQUE
**Solução**: Script de migração valida e consolida dados antes de aplicar constraint
**Mitigação**: Backup completo antes de cada passo SQL

### Risk 2: Dois BDs (Staff + Local)
**Problema**: Mudanças devem ser coerentes em ambas
**Solução**: Scripts SQL separados por BD, testes cross-DB
**Mitigação**: Documentar qual tabela fica em qual BD

### Risk 3: Referências em Código
**Problema**: `id_client`, `name_client` espalhados no código
**Solução**: `grep -r "id_client" modules/` para encontrar todos
**Mitigação**: Usar Find & Replace com cuidado, testar cada módulo

### Risk 4: localStorage
**Problema**: Código antigo pode esperar `id_client`, novo espera `parish_id`
**Solução**: Manter compatibilidade ou limpar localStorage antes de deploy
**Mitigação**: localStorage.clear() no primeiro acesso após deploy

---

## ✅ CHECKLIST FINAL PRÉ-DEPLOY

- [ ] SQL testado em staging (100% integridade)
- [ ] authFunctions.php reescrito e testado
- [ ] parishFunctions.php criado e testado
- [ ] indexController.php simplificado e testado
- [ ] main.js sem seleção de paróquia, fluxo automático
- [ ] pessoas.php com aba "Acesso ao Sistema"
- [ ] user-functions.php CRUD funcional
- [ ] Todos os 4 cores da auditoria funcionando
- [ ] Performance aceitável (< 500ms login)
- [ ] Segurança validada (força bruta, SQLi, XSS)
- [ ] Documentação atualizada (README + MIGRATION_GUIDE)
- [ ] Plano de rollback pronto (com script SQL)
- [ ] Backup de produção realizado
- [ ] Equipe treinada no novo fluxo
- [ ] Monitoramento ativo após deploy

---

## 📞 SUPORTE PÓS-DEPLOY

**Se der erro:**

1. Verificar `/tmp/` ou logs do servidor PHP
2. Executar `SELECT * FROM dioceses;` (deve ter 1 registro)
3. Executar `SELECT COUNT(*) FROM users_parishes;` (deve ter values)
4. Testar login via Postman (isolar problema)
5. Se não conseguir, executar ROLLBACK_DIOCESES.sql

**Contatos úteis:**
- PostgreSQL: psql -U user -d trilhadafe_staff -c "SELECT 1;"
- PHP: php -r "phpinfo();"
- Nginx/Apache: service status

---

**Próximo Passo**: DIA 1 - Backup + Aplicar SQL

Boa sorte! 🚀
