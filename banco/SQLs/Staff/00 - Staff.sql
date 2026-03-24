-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - STAFF DB (CENTRAL V2.3)
-- DATA: 04/02/2026
-- DESCRIÇÃO: Banco responsável por login, roteamento e permissões.
-- ==========================================================

-- ==========================================================
-- 1. DROP (LIMPEZA TOTAL)
-- ==========================================================
DROP TABLE IF EXISTS public.users_token CASCADE;
DROP TABLE IF EXISTS public.users_clients_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles_actions CASCADE;
DROP TABLE IF EXISTS public.actions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.clients_config CASCADE;
DROP TABLE IF EXISTS public.versions_logs CASCADE;
DROP TABLE IF EXISTS public.versions CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.system_error_logs CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;
DROP TABLE IF EXISTS public.login_attempts CASCADE;

-- ==========================================================
-- 2. CREATE (ESTRUTURA)
-- ==========================================================

-- 2.1 LOGS E SEGURANÇA
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address TEXT NOT NULL,
    email TEXT,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON public.login_attempts (email, ip_address, attempt_time);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    origem TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    ip TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.system_error_logs (
    id SERIAL PRIMARY KEY,
    scope TEXT,
    module TEXT,
    action TEXT,
    error_type TEXT,
    error_message TEXT,
    input_data JSONB,
    ip TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 CONFIGURAÇÕES GLOBAIS
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT,
    city TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.versions (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.versions_logs (
    id SERIAL PRIMARY KEY,
    id_version INTEGER NOT NULL,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_versions FOREIGN KEY (id_version) REFERENCES public.versions (id)
);

-- 2.3 USUÁRIOS E CLIENTES (TENANTS)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    img TEXT,
    hash TEXT,
    contact TEXT,
    staff BOOLEAN DEFAULT FALSE, -- SuperAdmin
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo TEXT,
    contact TEXT,
    link TEXT UNIQUE,   -- Slug (ex: ribeirao)
    sync_stats JSONB,   -- Cache de dados
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.clients_config (
    id SERIAL PRIMARY KEY,
    id_client INTEGER NOT NULL,
    collect INTEGER DEFAULT 1,
    deadline INTEGER DEFAULT 15,
    pendency BOOLEAN DEFAULT FALSE,
    value REAL,
    last_payment TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config_code TEXT,
    discount INTEGER DEFAULT 0,
    
    -- Credenciais do Banco Local
    host TEXT NOT NULL,
    "database" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    port TEXT NOT NULL DEFAULT '5432',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id)
);

-- 2.4 PERMISSÕES E AÇÕES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    staff BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.actions (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_menu BOOLEAN DEFAULT FALSE,
    icon_class TEXT,
    controller TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_action_parent FOREIGN KEY (parent_id) REFERENCES public.actions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.profiles_actions (
    id SERIAL PRIMARY KEY,
    id_profile INTEGER,
    id_action INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_profiles FOREIGN KEY (id_profile) REFERENCES public.profiles (id),
    CONSTRAINT fk_actions FOREIGN KEY (id_action) REFERENCES public.actions (id)
);

CREATE TABLE IF NOT EXISTS public.users_clients_profiles (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_client INTEGER NOT NULL,
    id_profile INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_users FOREIGN KEY (id_user) REFERENCES public.users (id),
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id),
    CONSTRAINT fk_profiles FOREIGN KEY (id_profile) REFERENCES public.profiles (id)
);

CREATE TABLE IF NOT EXISTS public.users_token (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_client INTEGER NOT NULL,
    token TEXT NOT NULL,
    ip TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_users FOREIGN KEY (id_user) REFERENCES public.users (id),
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id)
);

-- ==========================================================
-- 3. INSERT (POPULAÇÃO)
-- ==========================================================

-- 3.1 Configurações Básicas
INSERT INTO public.settings (name, email, contact, city) VALUES ('Trilha da Fé', 'contato@trilhadafe.com', '000', 'Sede Tecnologia');

-- 3.2 Usuário Admin (DEV)
INSERT INTO public.users (name, email, password, staff) VALUES
('Eike Benízio', 'eike@dev', 'eikebenizio', TRUE),
('Teste Dev', 'teste@dev', 'teste@dev', TRUE);

-- 3.3 Cliente Inicial
INSERT INTO public.clients (name, description) VALUES ('Caruaru - PE', 'Diocese de Caruaru - PE');

-- 3.4 Conexão com Banco Local
INSERT INTO public.clients_config (id_client, host, "database", "user", "password", port) 
VALUES (1, '145.223.94.211', 'pe_caruaru_db', 'postgres', 'vSoj3WaPHUaa6MrADKtzayy46ub5YS69S2K3JXrQtqkeV8VtYv', '5432');

-- 3.5 Perfis (AJUSTADO CONFORME SOLICITADO)
INSERT INTO public.profiles (id, title, description, staff, active) VALUES
(99, 'DEV', 'Acesso Supremo (Desenvolvedor)', TRUE, TRUE),
(50, 'PÁROCO', 'Administrador da Paróquia', FALSE, TRUE),
(40, 'COORDENADOR', 'Gestão Pedagógica e Pastoral', FALSE, TRUE),
(30, 'CATEQUISTA', 'Professor/Evangelizador', FALSE, TRUE),
(10, 'ALUNO/RESPONSÁVEL', 'Portal do Fiel', FALSE, TRUE);

-- ==========================================================
-- 3.6 AÇÕES (MENUS PRINCIPAIS - IDs 1 a 99)
-- ==========================================================
DELETE FROM public.profiles_actions;
DELETE FROM public.actions;

INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) VALUES 
(1,  'dashboard',   'Painel Principal',     'Visão geral e gráficos.', TRUE, 'icon-home', 'DashboardController'),
(2,  'eventos',     'Eventos e Festas',     'Gestão de calendário.', TRUE, 'icon-ticket', 'EventsController'),
(3,  'relatorios',  'Relatórios',           'Análise de dados e exportação.', TRUE, 'icon-description', 'ReportsController'),
(4,  'diario',      'Diário de Classe',     'Área do professor/frequência.', TRUE, 'icon-calendar', 'AcademicController'),
(5,  'turmas',      'Gestão de Turmas',     'Administração de salas e alunos.', TRUE, 'icon-group', 'AcademicController'),
(6,  'cursos',      'Cursos e Grades',      'Definição formativa.', TRUE, 'icon-school', 'AcademicController'),
(7,  'disciplinas', 'Disciplinas',          'Cadastro de matérias.', TRUE, 'icon-list', 'AcademicController'),
(8,  'pessoas',     'Diretório de Pessoas', 'Prontuário único.', TRUE, 'icon-user', 'PeopleController'),
(9,  'organizacao', 'Organização',          'Estrutura física e dados.', TRUE, 'icon-building', 'OrganizationController'),
(10, 'usuarios',    'Usuários',             'Gerenciamento de acessos.', TRUE, 'icon-users', 'UsersController'),
(11, 'ajuda',       'Ajuda e Suporte',      'Base de conhecimento.', TRUE, 'icon-help', 'HelpController');

-- ==========================================================
-- 3.6.1 SUB-AÇÕES (MICRO-PERMISSÕES)
-- ==========================================================

-- BLOCO 100: DASHBOARD
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(101, 1, 'dashboard.view_students_stats', 'Ver Gráfico de Alunos', 'Acesso ao gráfico de matrículas.', FALSE),
(102, 1, 'dashboard.view_finance_stats',  'Ver Gráfico Financeiro', 'Acesso ao resumo de caixa.', FALSE);

-- BLOCO 200: EVENTOS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(201, 2, 'eventos.list',    'Listar Eventos',   'Ver a lista e calendário.', FALSE),
(202, 2, 'eventos.modal',   'Abrir Modal',      'Acesso à janela do formulário.', FALSE),
(203, 2, 'eventos.create',  'Cadastrar Evento', 'Botão de criar novo evento.', FALSE),
(204, 2, 'eventos.edit',    'Editar Evento',    'Botão de editar (Caneta).', FALSE),
(205, 2, 'eventos.save',    'Salvar Evento',    'Permissão para gravar no banco.', FALSE),
(206, 2, 'eventos.history', 'Ver Histórico',    'Acesso ao log de auditoria.', FALSE),
(207, 2, 'eventos.delete',  'Excluir Evento',   'Botão de lixeira.', FALSE);

-- BLOCO 300: RELATÓRIOS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(301, 3, 'relatorios.list',   'Listar Relatórios', 'Ver listagem de relatórios.', FALSE),
(302, 3, 'relatorios.export', 'Exportar Dados',    'Botão de exportar PDF/Excel.', FALSE);

-- BLOCO 400: DIÁRIO DE CLASSE
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(401, 4, 'diario.list',    'Listar Diários',    'Ver o histórico de aulas.', FALSE),
(402, 4, 'diario.modal',   'Abrir Modal',       'Acesso ao preenchimento da aula.', FALSE),
(403, 4, 'diario.create',  'Cadastrar Diário',  'Pode iniciar uma nova aula.', FALSE),
(404, 4, 'diario.edit',    'Editar Diário',     'Pode alterar aula já dada.', FALSE),
(405, 4, 'diario.save',    'Salvar Diário',     'Permite salvar presença e conteúdo.', FALSE),
(406, 4, 'diario.history', 'Ver Histórico',     'Auditoria da aula.', FALSE),
(407, 4, 'diario.delete',  'Excluir Diário',    'Excluir registro da aula.', FALSE);

-- BLOCO 500: TURMAS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(501, 5, 'turmas.list',    'Listar Turmas',    'Ver turmas ativas.', FALSE),
(502, 5, 'turmas.modal',   'Abrir Modal',      'Acesso às abas da turma.', FALSE),
(503, 5, 'turmas.create',  'Criar Turma',      'Botão de Nova Turma.', FALSE),
(504, 5, 'turmas.edit',    'Editar Turma',     'Alterar coordenador e local.', FALSE),
(505, 5, 'turmas.save',    'Salvar Turma',     'Salvar dados gerais da turma.', FALSE),
(506, 5, 'turmas.history', 'Ver Histórico',    'Log de alterações na turma.', FALSE),
(507, 5, 'turmas.delete',  'Excluir Turma',    'Remover turma.', FALSE),
(508, 5, 'turmas.enroll',  'Matricular Aluno', 'Vincular catequizando à turma.', FALSE),
(509, 5, 'turmas.drop',    'Remover Aluno',    'Desvincular catequizando.', FALSE);

-- BLOCO 600: CURSOS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(601, 6, 'cursos.list',     'Listar Cursos',    'Visualizar grades.', FALSE),
(602, 6, 'cursos.modal',    'Abrir Modal',      'Janela de curso.', FALSE),
(603, 6, 'cursos.create',   'Criar Curso',      'Novo curso.', FALSE),
(604, 6, 'cursos.edit',     'Editar Curso',     'Alterar curso.', FALSE),
(605, 6, 'cursos.save',     'Salvar Curso',     'Gravar curso.', FALSE),
(606, 6, 'cursos.history',  'Ver Histórico',    'Auditoria de curso.', FALSE),
(607, 6, 'cursos.delete',   'Excluir Curso',    'Excluir curso.', FALSE),
(608, 6, 'cursos.template', 'Template Padrão',  'Gerir roteiro de aulas.', FALSE);

-- BLOCO 700: DISCIPLINAS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(701, 7, 'disciplinas.list',    'Listar Materiais', 'Ver lista.', FALSE),
(702, 7, 'disciplinas.modal',   'Abrir Modal',      'Janela.', FALSE),
(703, 7, 'disciplinas.create',  'Criar Disc.',      'Nova.', FALSE),
(704, 7, 'disciplinas.edit',    'Editar Disc.',     'Alterar.', FALSE),
(705, 7, 'disciplinas.save',    'Salvar Disc.',     'Gravar.', FALSE),
(706, 7, 'disciplinas.history', 'Histórico',        'Auditoria.', FALSE),
(707, 7, 'disciplinas.delete',  'Excluir',          'Lixeira.', FALSE);

-- BLOCO 800: PESSOAS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(801, 8, 'pessoas.list',             'Listar Pessoas',    'Acesso ao diretório.', FALSE),
(802, 8, 'pessoas.modal',            'Abrir Modal',       'Pode abrir o prontuário.', FALSE),
(803, 8, 'pessoas.create',           'Cadastrar Pessoa',  'Nova pessoa.', FALSE),
(804, 8, 'pessoas.edit',             'Editar Pessoa',     'Alterar dados.', FALSE),
(805, 8, 'pessoas.save',             'Salvar Pessoa',     'Gravar alterações.', FALSE),
(806, 8, 'pessoas.history',          'Ver Histórico',     'Log da pessoa.', FALSE),
(807, 8, 'pessoas.delete',           'Excluir Pessoa',    'Remover cadastro.', FALSE),
(808, 8, 'pessoas.tab_contact',      'Aba Contato',       'Ver dados de contato.', FALSE),
(809, 8, 'pessoas.tab_family',       'Aba Família',       'Ver/editar vínculos familiares.', FALSE),
(810, 8, 'pessoas.tab_sacraments',   'Aba Sacramentos',   'Ver/editar dados religiosos.', FALSE),
(811, 8, 'pessoas.tab_attachments',  'Aba Anexos',        'Acesso aos documentos PDF/Img.', FALSE);

-- BLOCO 900: ORGANIZAÇÃO (MINHA PARÓQUIA)
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(901, 9, 'organizacao.create',       'Criar Diocese',          'Criar Diocese.', FALSE),
(902, 9, 'organizacao.view',         'Ver Dados da Diocese',   'Pode ler as informações gerais da Diocese.', FALSE),
(903, 9, 'organizacao.edit',         'Editar Dados',           'Pode alterar configurações da Diocese.', FALSE),
(904, 9, 'organizacao.save',         'Salvar a Diocese',       'Pode gravar configurações vitais da Diocese.', FALSE),
(905, 9, 'organizacao.create_paroc', 'Criar Paróquia',         'Criar Paróquia.', FALSE),
(906, 9, 'organizacao.view_paroc',   'Ver Dados de Paróquia',  'Pode ler as informações gerais de Paróquia.', FALSE),
(907, 9, 'organizacao.edit_paroc',   'Editar Dados de Paróquia', 'Pode alterar configurações de Paróquia.', FALSE),
(908, 9, 'organizacao.save_paroc',   'Salvar Paróquia',        'Pode gravar configurações vitais de Paróquia.', FALSE),
(909, 9, 'organizacao.create_loc',   'Criar Locais',           'Criar Locais.', FALSE),
(910, 9, 'organizacao.view_loc',     'Ver Dados de Locais',    'Pode ler as informações gerais de Locais.', FALSE),
(911, 9, 'organizacao.edit_loc',     'Editar Dados de Locais', 'Pode alterar configurações de Locais.', FALSE),
(912, 9, 'organizacao.save_loc',     'Salvar Locais',          'Pode gravar configurações vitais de Locais.', FALSE);

-- BLOCO 1000: USUÁRIOS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(1001, 10, 'usuarios.list',    'Listar Acessos',           'Ver quem tem acesso.', FALSE),
(1002, 10, 'usuarios.modal',   'Abrir Modal',              'Janela de permissão.', FALSE),
(1003, 10, 'usuarios.create',  'Criar Usuário',            'Novo acesso.', FALSE),
(1004, 10, 'usuarios.edit',    'Editar Usuário',           'Alterar e-mail/perfil.', FALSE),
(1005, 10, 'usuarios.save',    'Salvar Usuário',           'Gravar no banco.', FALSE),
(1006, 10, 'usuarios.actions', 'Histórico de ações',       'O que o usuário fez.', FALSE),
(1007, 10, 'usuarios.history', 'Histórico de alterações',  'O que mudaram no usuário.', FALSE),
(1008, 10, 'usuarios.delete',  'Excluir Usuário',          'Revogar acesso.', FALSE);

-- BLOCO 1100: AJUDA
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(1101, 11, 'ajuda.secretary', 'FAQ Secretaria', 'Manuais de gestão.', FALSE),
(1102, 11, 'ajuda.professor', 'FAQ Professor',  'Manuais de sala de aula.', FALSE);


-- ----------------------------------------------------------
-- PERFIL 99: DEV (Acesso Supremo)
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 99, id FROM public.actions;

-- ----------------------------------------------------------
-- PERFIL 50: PÁROCO (Administrador da Paróquia)
-- Tem acesso a todos os módulos, relatórios, usuários e configuração da paróquia.
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 50, id FROM public.actions 
WHERE id IN (
    -- Menus
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11,
    -- Dashboard (Total)
    101, 102,
    -- Eventos, Relatórios, Diário, Turmas, Cursos, Disciplinas, Pessoas (Gestão Total)
    201, 202, 203, 204, 205, 206, 207,
    301, 302,
    401, 402, 403, 404, 405, 406, 407,
    501, 502, 503, 504, 505, 506, 507, 508, 509,
    601, 602, 603, 604, 605, 606, 607, 608,
    701, 702, 703, 704, 705, 706, 707,
    801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811,
    -- Paróquia (Gestão total)
    901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912,
    -- Usuários (Pode criar novos coordenadores/catequistas)
    1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008,
    -- Ajuda
    1101, 1102
);

-- ----------------------------------------------------------
-- PERFIL 40: COORDENADOR (Gestão Pedagógica/Pastoral e Eventos)
-- Não vê "Usuários", "Minha Paróquia" e "Gráfico Financeiro".
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 40, id FROM public.actions 
WHERE id IN (
    -- Menus Permitidos
    1, 2, 3, 4, 5, 6, 7, 8, 11,
    -- Dashboard (Apenas Estatísticas de Alunos)
    101,
    -- Eventos, Relatórios, Diário, Turmas, Cursos, Disciplinas, Pessoas (Gestão Total)
    201, 202, 203, 204, 205, 206, 207,
    301, 302,
    401, 402, 403, 404, 405, 406, 407,
    501, 502, 503, 504, 505, 506, 507, 508, 509,
    601, 602, 603, 604, 605, 606, 607, 608,
    701, 702, 703, 704, 705, 706, 707,
    801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811,
    -- Ajuda (Ambos)
    1101, 1102
);

-- ----------------------------------------------------------
-- PERFIL 30: CATEQUISTA (Professor / Acesso Restrito)
-- Foca no Diário. Pode VER as Turmas e Pessoas, mas não alterar.
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 30, id FROM public.actions 
WHERE id IN (
    -- Menus Permitidos
    1, 4, 5, 8, 11,
    -- Dashboard (Apenas Estatísticas de Alunos)
    101,
    -- Diário (Gestão Total do Diário)
    401, 402, 403, 404, 405, 406, 407,
    -- Turmas (Visualizar Lista e Modal, Sem Permissão de Edição/Matrícula)
    501, 502,
    -- Pessoas (Visualizar Lista, Modal e Abas Básicas. Sem Histórico Sensível ou Edição)
    801, 802, 808, 809, 810,
    -- Ajuda (Apenas Professor)
    1102
);

-- 3.8 VÍNCULO FINAL (Super Admins)
INSERT INTO public.users_clients_profiles (id_user, id_client, id_profile) VALUES 
(1, 1, 99),
(2, 1, 99);

-- ==========================================================
-- 4. AJUSTE DE SEQUÊNCIA (CRÍTICO PARA NÃO TRAVAR O SISTEMA)
-- ==========================================================
-- Como inserimos IDs manualmente, precisamos avisar ao Postgres onde o contador deve continuar.

SELECT setval('public.profiles_id_seq', (SELECT MAX(id) FROM public.profiles));
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));
SELECT setval('public.clients_id_seq', (SELECT MAX(id) FROM public.clients));
SELECT setval('public.actions_id_seq', (SELECT MAX(id) FROM public.actions));