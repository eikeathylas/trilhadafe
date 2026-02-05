-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - STAFF DB (CENTRAL V2.2)
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
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.versions (
    id SERIAL PRIMARY KEY,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.versions_logs (
    id SERIAL PRIMARY KEY,
    id_version INTEGER NOT NULL,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
    
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id)
);

-- 2.4 PERMISSÕES E AÇÕES (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    staff BOOLEAN DEFAULT FALSE,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_action_parent FOREIGN KEY (parent_id) REFERENCES public.actions (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.profiles_actions (
    id SERIAL PRIMARY KEY,
    id_profile INTEGER,
    id_action INTEGER,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_profiles FOREIGN KEY (id_profile) REFERENCES public.profiles (id),
    CONSTRAINT fk_actions FOREIGN KEY (id_action) REFERENCES public.actions (id)
);

CREATE TABLE IF NOT EXISTS public.users_clients_profiles (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_client INTEGER NOT NULL,
    id_profile INTEGER,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
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
INSERT INTO public.users (name, email, password, img, staff) VALUES
('Eike Benízio', 'eike@dev', 'eikebenizio', 'avatar.jpg', TRUE),
('Teste Dev', 'teste@dev', 'teste@dev', 'avatar.jpg', TRUE);

-- 3.3 Cliente Inicial
INSERT INTO public.clients (name, description) VALUES ('Caruaru - PE', 'Diocese de Caruaru - PE');

-- 3.4 Conexão com Banco Local
INSERT INTO public.clients_config (id_client, host, "database", "user", "password", port) 
VALUES (1, '145.223.94.211', 'pe_caruaru_db', 'postgres', 'vSoj3WaPHUaa6MrADKtzayy46ub5YS69S2K3JXrQtqkeV8VtYv', '5432');

-- 3.5 Perfis
INSERT INTO public.profiles (id, title, description, staff, active) VALUES
(99, 'DEV', 'Acesso Supremo (Desenvolvedor)', TRUE, TRUE),
(50, 'PÁROCO', 'Administrador da Paróquia', FALSE, TRUE),
(40, 'COORDENADOR', 'Gestão Pedagógica e Pastoral', FALSE, TRUE),
(30, 'CATEQUISTA', 'Professor/Evangelizador', FALSE, TRUE),
(10, 'ALUNO/RESPONSÁVEL', 'Portal do Fiel', FALSE, TRUE);

-- 3.6 AÇÕES (MENU)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) VALUES 
(1, 'dashboard', 'Painel Principal', 'Visão geral.', TRUE, 'icon-home', 'DashboardController'),
(4, 'academico', 'Secretaria Escolar', 'Gestão de matrículas.', TRUE, 'icon-book', 'AcademicController'),
(7, 'financeiro', 'Financeiro', 'Controle de caixa.', TRUE, 'icon-money', 'FinanceController'),
(8, 'organizacao', 'Minha Paróquia', 'Estrutura física.', TRUE, 'icon-building', 'OrganizationController'),
(9, 'disciplinas', 'Disciplinas', 'Cadastro de matérias.', TRUE, 'icon-list', 'AcademicController'),
(10, 'cursos', 'Cursos e Grades', 'Definição formativa.', TRUE, 'icon-school', 'AcademicController'),
(11, 'turmas', 'Gestão de Turmas', 'Abertura de turmas.', TRUE, 'icon-group', 'AcademicController'),
(12, 'diario', 'Diário de Classe', 'Área do professor.', TRUE, 'icon-calendar', 'AcademicController'),
(13, 'pessoas', 'Diretório de Pessoas', 'Prontuário único.', TRUE, 'icon-user', 'PeopleController'),
(14, 'liturgia', 'Liturgia e Missas', 'Agenda de celebrações.', TRUE, 'icon-church', 'PastoralController'),
(15, 'eventos', 'Eventos e Festas', 'Gestão de quermesses.', TRUE, 'icon-ticket', 'EventsController'),
(16, 'comunicacao', 'Site e App', 'Gerenciamento de notícias.', TRUE, 'icon-rss', 'CommunicationController');

-- Sub-ações
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(2, 1, 'dashboard.view_students_stats', 'Ver Gráfico de Alunos', 'Visualizar estatísticas.', FALSE),
(3, 1, 'dashboard.view_finance_stats', 'Ver Gráfico Financeiro', 'Visualizar caixa.', FALSE),
(5, 4, 'academico.create_student', 'Cadastrar Aluno', 'Registrar novos alunos.', FALSE),
(6, 4, 'academico.approve_registration', 'Aprovar Matrícula Web', 'Analisar solicitações.', FALSE);

-- 3.7 PERMISSÕES

-- DEV (99)
INSERT INTO public.profiles_actions (id_profile, id_action) SELECT 99, id FROM public.actions;

-- PÁROCO (50)
INSERT INTO public.profiles_actions (id_profile, id_action) VALUES 
(50, 1), (50, 2), (50, 3), (50, 7), (50, 8), (50, 11), (50, 13), (50, 14), (50, 15);

-- CATEQUISTA (30) - Com acesso ao DIÁRIO (12)
INSERT INTO public.profiles_actions (id_profile, id_action) VALUES 
(30, 1), -- Dashboard
(30, 2), -- Graf. Aluno
(30, 4), -- Secretaria (Visualização básica)
(30, 5), -- Cadastrar Aluno
(30, 10), -- Cursos (Ver grade)
(30, 11), -- Turmas (Ver suas turmas)
(30, 12); -- Diário de Classe

-- 3.8 VÍNCULO FINAL (Super Admins)
INSERT INTO public.users_clients_profiles (id_user, id_client, id_profile) VALUES 
(1, 1, 99),
(2, 1, 99); -- Ajustado para 99 (Dev) para facilitar testes

-- 4. AJUSTE DE SEQUÊNCIA (CRÍTICO)
-- Garante que próximos inserts não dêem erro de ID duplicado
SELECT setval('public.actions_id_seq', (SELECT MAX(id) FROM public.actions));