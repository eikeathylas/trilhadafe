-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - STAFF DB (CENTRAL)
-- DATA: 04/12/2025
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
COMMENT ON TABLE public.login_attempts IS 'Segurança: Bloqueio de ataques de força bruta.';

CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    origem TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    ip TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.error_logs IS 'Logs de erros de negócio (User level).';

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
COMMENT ON TABLE public.system_error_logs IS 'Logs técnicos (Dev level) com snapshot dos dados.';

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
    staff BOOLEAN DEFAULT FALSE,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE public.users IS 'Usuários globais. O login é validado aqui.';
COMMENT ON COLUMN public.users.staff IS 'SuperAdmin. Acesso irrestrito a configurações de servidor.';

CREATE TABLE IF NOT EXISTS public.clients (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    logo TEXT,
    contact TEXT,
    link TEXT UNIQUE,   -- Slug (ex: ribeirao)
    sync_stats JSONB,   -- Cache de dados globais (ex: total de alunos)
    last_sync TIMESTAMP,
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE public.clients IS 'Tabela de Tenants (Clientes/Cidades).';

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
COMMENT ON TABLE public.clients_config IS 'Credenciais de conexão com o banco da cidade específica.';

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
    parent_id INTEGER,               -- Auto-relacionamento (Pai/Filho)
    slug TEXT NOT NULL UNIQUE,       -- Código único (ex: 'dashboard.view_stats')
    name TEXT NOT NULL,              -- Nome visível
    description TEXT,
    is_menu BOOLEAN DEFAULT FALSE,   -- Aparece no menu lateral?
    icon_class TEXT,                 -- Classe do ícone
    controller TEXT,                 -- Controlador PHP
    create_in TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_in TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_action_parent FOREIGN KEY (parent_id) REFERENCES public.actions (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.actions IS 'Catálogo hierárquico de funcionalidades.';

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
-- 3. INSERT (POPULAÇÃO COM IDs EXPLÍCITOS E CORREÇÃO)
-- ==========================================================

-- 3.1 Configurações Básicas
INSERT INTO public.settings (name, email, contact, city) VALUES ('Trilha da Fé', 'contato@trilhadafe.com', '000', 'Sede Tecnologia');

-- 3.2 Usuário Admin (DEV)
-- Nota: Senha '123' apenas para teste inicial.
INSERT INTO public.users (name, email, password, img, staff) VALUES
('Eike Benízio', 'eike@dev', 'eikebenizio', 'avatar.jpg', TRUE),
('Teste Dev', 'teste@dev', 'teste@dev', 'avatar.jpg', TRUE);

-- 3.3 Cliente Inicial
INSERT INTO public.clients (name, description) VALUES ('Caruaru - PE', 'Diocese de Caruaru - PE');

-- 3.4 Conexão com Banco Local (pe_ribeirao_db)
INSERT INTO public.clients_config (id_client, host, "database", "user", "password", port) 
VALUES (1, '31.220.51.183', 'pe_caruaru_db', 'postgres', 'N8GCOjHT0ArVUq8vWNVtz0sv3wMPC6mBx7ytPfL18wsoUQZqdT', '5432');

-- 3.5 Perfis
INSERT INTO public.profiles (id, title, description, staff, active) VALUES
(99, 'DEV', 'Acesso Supremo (Desenvolvedor)', TRUE, TRUE),
(50, 'PÁROCO', 'Administrador da Paróquia', FALSE, TRUE),
(40, 'COORDENADOR', 'Gestão Pedagógica e Pastoral', FALSE, TRUE),
(30, 'CATEQUISTA', 'Professor/Evangelizador', FALSE, TRUE),
(10, 'ALUNO/RESPONSÁVEL', 'Portal do Fiel', FALSE, TRUE);

-- 3.6 AÇÕES (COM IDs FIXOS PARA EVITAR ERROS)
-- Estrutura: Menu Principal -> Sub-ações

-- Dashboard (ID 1)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) 
VALUES (1, 'dashboard', 'Painel Principal', 'Visão geral com gráficos, indicadores e alertas do sistema.', TRUE, 'icon-home', 'DashboardController');

-- Filhos do Dashboard (2, 3)
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(2, 1, 'dashboard.view_students_stats', 'Ver Gráfico de Alunos', 'Permite visualizar estatísticas de matrícula.', FALSE),
(3, 1, 'dashboard.view_finance_stats', 'Ver Gráfico Financeiro', 'Permite visualizar entradas e saídas no painel.', FALSE);


-- Acadêmico (ID 4)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) 
VALUES (4, 'academico', 'Secretaria Escolar', 'Gestão de matrículas, documentos e solicitações web.', TRUE, 'icon-book', 'AcademicController');

-- Filhos do Acadêmico (5, 6)
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(5, 4, 'academico.create_student', 'Cadastrar Aluno', 'Permite registrar novos alunos manualmente.', FALSE),
(6, 4, 'academico.approve_registration', 'Aprovar Matrícula Web', 'Permite analisar solicitações vindas do site.', FALSE);


-- Financeiro (ID 7)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) 
VALUES (7, 'financeiro', 'Financeiro', 'Controle de caixa, dízimo, ofertas e contas a pagar.', TRUE, 'icon-money', 'FinanceController');

-- Estrutura/Paróquia (ID 8)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (8, 'organizacao', 'Minha Paróquia', 'Gestão da estrutura física, dados jurídicos da paróquia e cadastro de salas/locais.', TRUE, 'icon-building', 'OrganizationController');

-- Disciplinas (ID 9)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (9, 'disciplinas', 'Disciplinas', 'Cadastro de matérias base (Ex: Bíblia, Liturgia) e ementas.', TRUE, 'icon-list', 'AcademicController');

-- cursos (ID 10)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (10, 'cursos', 'Cursos e Grades', 'Definição de etapas formativas (Ex: Eucaristia I), requisitos de idade e matriz curricular.', TRUE, 'icon-school', 'AcademicController');

-- Turmas (ID 11)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (11, 'turmas', 'Gestão de Turmas', 'Abertura de turmas anuais, alocação de catequistas e enturmação de alunos.', TRUE, 'icon-group', 'AcademicController');

-- Pessoas (ID 12)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (12, 'meus-diarios', 'Diário de Classe', 'Área do professor/catequista para registro de presença e conteúdo ministrado.', TRUE, 'icon-calendar', 'AcademicController');

-- Diários (ID 13)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (13, 'pessoas', 'Diretório de Pessoas', 'Prontuário único de fiéis, alunos, pais, catequistas e clero com histórico completo.', TRUE, 'icon-user', 'PeopleController');

-- Liturgia (ID 14)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (14, 'liturgia', 'Liturgia e Missas', 'Agenda de celebrações, gestão de sacramentos (Batismo/Casamento) e intenções.', TRUE, 'icon-church', 'PastoralController');

-- Eventos (ID 15)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (15, 'eventos', 'Eventos e Festas', 'Gestão de quermesses, venda de ingressos, controle de barracas e caixa.', TRUE, 'icon-ticket', 'EventsController');

-- Comunicação (ID 16)
INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller)
VALUES (16, 'comunicacao', 'Site e App', 'Gerenciamento de notícias, banners do aplicativo e notificações push.', TRUE, 'icon-rss', 'CommunicationController');

-- CORREÇÃO DA SEQUÊNCIA AUTOMÁTICA (ESSENCIAL!)
-- Atualiza o contador interno do PostgreSQL para que o próximo ID inserido automaticamente seja o 16
--SELECT setval('public.actions_id_seq', (SELECT MAX(id) FROM public.actions));

-- 3.7 PERMISSÕES (VINCULANDO PERFIS ÀS AÇÕES)

-- DEV (1): Vê tudo
INSERT INTO public.profiles_actions (id_profile, id_action) 
SELECT 99, id FROM public.actions;

-- PÁROCO (2): Vê Dashboard, Financeiro, Liturgia e Estrutura
INSERT INTO public.profiles_actions (id_profile, id_action) VALUES 
(50, 1), -- Dashboard
(50, 2), -- Graf. Aluno
(50, 3), -- Graf. Financeiro
(50, 7), -- Financeiro
(50, 8), -- Organização
(50, 11), -- Pessoas
(50, 13), -- Liturgia
(50, 14), -- Eventos
(50, 15); -- Comunicação

-- CATEQUISTA (3): Vê Dashboard Limitado e Acadêmico
INSERT INTO public.profiles_actions (id_profile, id_action) VALUES 
(30, 1), -- Dashboard
(30, 2), -- Graf. Aluno (NÃO VÊ O 3 - FINANCEIRO)
(30, 4), -- Acadêmico (Tela)
(30, 5), -- Cadastrar Aluno (Ação)
(30, 10), -- Turmas
(30, 12); -- Diários

-- 3.8 VÍNCULO FINAL
INSERT INTO public.users_clients_profiles (id_user, id_client, id_profile) VALUES 
(1, 1, 99),
(2, 1, 50);