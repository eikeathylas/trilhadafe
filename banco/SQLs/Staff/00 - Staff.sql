-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - STAFF DB (CENTRAL V2.4)
-- DATA: 06/02/2026
-- DESCRIÇÃO: Banco responsável por login, roteamento, permissões
-- e agora com Painel DEV e Dicionário de Dados.
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
DROP TABLE IF EXISTS public.users_versions_read CASCADE; -- [NOVO] Controle de Leitura
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
COMMENT ON TABLE public.login_attempts IS 'Registo de tentativas de autenticação para prevenção de ataques de força bruta.';

CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    origem TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    ip TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.error_logs IS 'Logs genéricos de erros capturados no sistema.';

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
COMMENT ON TABLE public.system_error_logs IS 'Logs estruturados de falhas profundas com armazenamento do payload (JSONB) para o Painel DEV.';

-- 2.2 CONFIGURAÇÕES GLOBAIS E VERSÕES
CREATE TABLE IF NOT EXISTS public.settings (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    contact TEXT,
    city TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE public.settings IS 'Configurações globais e institucionais da plataforma Trilha da Fé.';

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
COMMENT ON TABLE public.versions IS 'Controlo dos lançamentos de novas versões (Release Notes) do sistema.';

CREATE TABLE IF NOT EXISTS public.versions_logs (
    id SERIAL PRIMARY KEY,
    id_version INTEGER NOT NULL,
    tag TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_versions FOREIGN KEY (id_version) REFERENCES public.versions (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.versions_logs IS 'Detalhes e funcionalidades específicas lançadas dentro de uma versão.';

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
COMMENT ON TABLE public.users IS 'Tabela central de autenticação global. Contém as credenciais primárias.';
COMMENT ON COLUMN public.users.staff IS 'Se TRUE, o utilizador é um administrador da plataforma (Sede).';

-- [NOVO] Tabela para impedir que a notificação de atualização apareça repetidamente
CREATE TABLE IF NOT EXISTS public.users_versions_read (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_version INTEGER NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uvr_user FOREIGN KEY (id_user) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_uvr_version FOREIGN KEY (id_version) REFERENCES public.versions (id) ON DELETE CASCADE,
    CONSTRAINT uk_user_version UNIQUE (id_user, id_version)
);
COMMENT ON TABLE public.users_versions_read IS 'Gere as confirmações de leitura das notas de atualização por utilizador.';

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
COMMENT ON TABLE public.clients IS 'Registo de Inquilinos (Tenants/Dioceses/Paróquias) utilizando o sistema.';

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
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.clients_config IS 'Configurações de roteamento de base de dados e gestão de assinaturas do cliente.';

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
COMMENT ON TABLE public.profiles IS 'Perfis de acesso mestres (Ex: Pároco, Secretária, Catequista).';

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
COMMENT ON TABLE public.actions IS 'Lista de Módulos (Menus) e Micro-permissões (Ações) do sistema.';

CREATE TABLE IF NOT EXISTS public.profiles_actions (
    id SERIAL PRIMARY KEY,
    id_profile INTEGER,
    id_action INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_profiles FOREIGN KEY (id_profile) REFERENCES public.profiles (id) ON DELETE CASCADE,
    CONSTRAINT fk_actions FOREIGN KEY (id_action) REFERENCES public.actions (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.profiles_actions IS 'Matriz RBAC: Associa as permissões (ações) aos perfis.';

CREATE TABLE IF NOT EXISTS public.users_clients_profiles (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_client INTEGER NOT NULL,
    id_profile INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_users FOREIGN KEY (id_user) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id) ON DELETE CASCADE,
    CONSTRAINT fk_profiles FOREIGN KEY (id_profile) REFERENCES public.profiles (id)
);
COMMENT ON TABLE public.users_clients_profiles IS 'Vínculo essencial: Qual Utilizador acede a qual Cliente utilizando qual Perfil.';

CREATE TABLE IF NOT EXISTS public.users_token (
    id SERIAL PRIMARY KEY,
    id_user INTEGER NOT NULL,
    id_client INTEGER NOT NULL,
    token TEXT NOT NULL,
    ip TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_users FOREIGN KEY (id_user) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT fk_clients FOREIGN KEY (id_client) REFERENCES public.clients (id) ON DELETE CASCADE
);
COMMENT ON TABLE public.users_token IS 'Gestão das sessões ativas (Tokens JWT/Bearer) dos utilizadores.';

-- ==========================================================
-- 3. INSERT (POPULAÇÃO INICIAL)
-- ==========================================================

-- 3.1 Configurações Básicas
INSERT INTO public.settings (name, email, contact, city) VALUES ('Trilha da Fé', 'contato@trilhadafe.com', '000', 'Sede Tecnologia');

-- 3.2 Usuário Admin (DEV)
INSERT INTO public.users (id, name, email, password, staff) VALUES
(1, 'Eike Benízio', 'eike@dev', 'eikebenizio', TRUE),
(2, 'Geovane da Silva', 'geo@eu', '********', TRUE);

-- 3.3 Cliente Inicial
INSERT INTO public.clients (id, name, description) VALUES (1, 'Caruaru - PE', 'Diocese de Caruaru - PE');

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

-- ==========================================================
-- 3.6 AÇÕES (MENUS PRINCIPAIS E PAINEL DEV)
-- ==========================================================

INSERT INTO public.actions (id, slug, name, description, is_menu, icon_class, controller) VALUES 
(1,  'dashboard',   'Painel Principal',     'Visão geral e gráficos.', TRUE, 'icon-home', 'DashboardController'),
(2,  'eventos',     'Calendário',           'Gestão de calendário.', TRUE, 'icon-calendar-day', 'EventsController'),
(3,  'relatorios',  'Relatórios',           'Análise de dados e exportação.', TRUE, 'icon-file-lines', 'ReportsController'),
(4,  'diario',      'Diário de Encontros',     'Área do professor/frequência.', TRUE, 'icon-chalkboard-user', 'AcademicController'),
(5,  'turmas',      'Gestão de Turmas',     'Administração de salas e alunos.', TRUE, 'icon-graduation-cap', 'AcademicController'),
(6,  'cursos',      'Cursos e Planejamento',      'Definição formativa.', TRUE, 'icon-book', 'AcademicController'),
(7,  'fases',       'Fases da Iniciação',   'Cadastro de fases.', TRUE, 'icon-book-open', 'AcademicController'),
(8,  'pessoas',     'Diretório de Pessoas', 'Prontuário único.', TRUE, 'icon-user', 'PeopleController'),
(9,  'organizacao', 'Entidades',          'Estrutura física e dados.', TRUE, 'icon-building', 'OrganizationController'),
(10, 'usuarios',    'Usuários',             'Gerenciamento de acessos.', TRUE, 'icon-users', 'UsersController'),
(11, 'ajuda',       'Ajuda e Suporte',      'Base de conhecimento.', TRUE, 'icon-circle-question', 'HelpController');

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

-- BLOCO 300: RELATÓRIOS E EXTRAÇÕES
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(301, 3, 'relatorios.list',        'Listar Relatórios',    'Permissão base para acessar a central.', FALSE),
(302, 3, 'relatorios.export',      'Exportar Dados',       'Botão de gerar e exportar PDF/Excel.', FALSE),
(303, 3, 'relatorios.estudantes',  'Rel. Catequizandos',   'Acesso à lista de alunos.', FALSE),
(304, 3, 'relatorios.professores', 'Rel. Catequistas',     'Acesso à lista de educadores.', FALSE),
(305, 3, 'relatorios.pessoas',     'Rel. Diretório',       'Acesso à lista geral de pessoas.', FALSE),
(306, 3, 'relatorios.pendencias',  'Rel. Pendências',      'Acesso à lista de falta de documentos.', FALSE),
(307, 3, 'relatorios.encontros',   'Rel. Encontros',       'Acesso ao histórico do diário.', FALSE),
(308, 3, 'relatorios.turmas',      'Rel. Turmas',          'Acesso à listagem de turmas ativas.', FALSE),
(309, 3, 'relatorios.fases',       'Rel. Fases',           'Acesso à listagem de matrizes.', FALSE),
(310, 3, 'relatorios.modelo',      'Rel. Modelo',          'Acesso ao modelo de testes e layout.', FALSE);

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
    
-- BLOCO 700: FASES DA INICIAÇÃO
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(701, 7, 'fases.list',    'Listar Fases',    'Ver lista.', FALSE),
(702, 7, 'fases.modal',   'Abrir Modal',     'Janela.', FALSE),
(703, 7, 'fases.create',  'Criar Fase',      'Nova.', FALSE),
(704, 7, 'fases.edit',    'Editar Fase',     'Alterar.', FALSE),
(705, 7, 'fases.save',    'Salvar Fase',     'Gravar.', FALSE),
(706, 7, 'fases.history', 'Histórico',       'Auditoria.', FALSE),
(707, 7, 'fases.delete',  'Excluir',         'Lixeira.', FALSE);

-- BLOCO 800: PESSOAS
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(801, 8, 'pessoas.list',            'Listar Pessoas',    'Acesso ao diretório.', FALSE),
(802, 8, 'pessoas.modal',           'Abrir Modal',       'Pode abrir o prontuário.', FALSE),
(803, 8, 'pessoas.create',          'Cadastrar Pessoa',  'Nova pessoa.', FALSE),
(804, 8, 'pessoas.edit',            'Editar Pessoa',     'Alterar dados.', FALSE),
(805, 8, 'pessoas.save',            'Salvar Pessoa',     'Gravar alterações.', FALSE),
(806, 8, 'pessoas.history',         'Ver Histórico',     'Log da pessoa.', FALSE),
(807, 8, 'pessoas.delete',          'Excluir Pessoa',    'Remover cadastro.', FALSE),
(808, 8, 'pessoas.tab_contact',     'Aba Contato',       'Ver dados de contato.', FALSE),
(809, 8, 'pessoas.tab_family',      'Aba Família',       'Ver/editar vínculos familiares.', FALSE),
(810, 8, 'pessoas.tab_sacraments',  'Aba Sacramentos',   'Ver/editar dados religiosos.', FALSE),
(811, 8, 'pessoas.tab_attachments', 'Aba Anexos',        'Acesso aos documentos PDF/Img.', FALSE),
(812, 8, 'pessoas.tab_godparents',  'Aba Padrinhamento', 'Ver/editar padrinhos e madrinhas.', FALSE);

-- BLOCO 900: ORGANIZAÇÃO (MINHA PARÓQUIA)
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(901, 9, 'organizacao.create',       'Criar Diocese',          'Criar Diocese.', FALSE),
(902, 9, 'organizacao.history',         'Histórico de alterações da Diocese',   'Pode ler as informações gerais da Diocese.', FALSE),
(903, 9, 'organizacao.edit',         'Editar Dados',           'Pode alterar configurações da Diocese.', FALSE),
(904, 9, 'organizacao.save',         'Salvar a Diocese',       'Pode gravar configurações vitais da Diocese.', FALSE),
(905, 9, 'organizacao.create_paroc', 'Criar Paróquia',         'Criar Paróquia.', FALSE),
(906, 9, 'organizacao.history_paroc',   'Histórico de alterações de Paróquia',  'Pode ler as informações gerais de Paróquia.', FALSE),
(907, 9, 'organizacao.edit_paroc',   'Editar Dados de Paróquia', 'Pode alterar configurações de Paróquia.', FALSE),
(908, 9, 'organizacao.save_paroc',   'Salvar Paróquia',        'Pode gravar configurações vitais de Paróquia.', FALSE),
(909, 9, 'organizacao.create_loc',   'Criar Locais',           'Criar Locais.', FALSE),
(910, 9, 'organizacao.history_loc',     'Histórico de alterações de Locais',    'Pode ler as informações gerais de Locais.', FALSE),
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
(1008, 10, 'usuarios.delete',  'Excluir Usuário',          'Revogar acesso.', FALSE),
(1009, 10, 'usuarios.password','Alterar Senha',          'Permite alterar a senha do usuário.', FALSE);

-- BLOCO 1100: AJUDA
INSERT INTO public.actions (id, parent_id, slug, name, description, is_menu) VALUES 
(1101, 11, 'ajuda.secretary', 'FAQ Secretaria', 'Manuais de gestão.', FALSE),
(1102, 11, 'ajuda.professor', 'FAQ Professor',  'Manuais de sala de aula.', FALSE);


-- ----------------------------------------------------------
-- PERFIL 99: DEV (Acesso Supremo)
-- Inclui automaticamente o novo Menu DEV (12) e subações.
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 99, id FROM public.actions;

-- ----------------------------------------------------------
-- PERFIL 50: PÁROCO (Administrador da Paróquia)
-- Tem acesso a todos os módulos, mas NÃO tem acesso ao painel DEV (12, 1201, 1202)
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
    301, 302, 303, 304, 305, 306, 307, 308, 309, 310,
    401, 402, 403, 404, 405, 406, 407,
    501, 502, 503, 504, 505, 506, 507, 508, 509,
    601, 602, 603, 604, 605, 606, 607, 608,
    701, 702, 703, 704, 705, 706, 707,
    801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812,
    -- Paróquia (Gestão total)
    901, 902, 903, 904, 905, 906, 907, 908, 909, 910, 911, 912,
    -- Usuários (Pode criar novos coordenadores/catequistas)
    1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009,
    -- Ajuda
    1101, 1102
);

-- ----------------------------------------------------------
-- PERFIL 40: COORDENADOR (Gestão Pedagógica/Pastoral e Eventos)
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
    801, 802, 803, 804, 805, 806, 807, 808, 809, 810, 811, 812,
    -- Ajuda (Ambos)
    1101, 1102
);

-- ----------------------------------------------------------
-- PERFIL 30: CATEQUISTA (Professor / Acesso Restrito)
-- ----------------------------------------------------------
INSERT INTO public.profiles_actions (id_profile, id_action)
SELECT 30, id FROM public.actions 
WHERE id IN (
    -- Menus Permitidos
    2, 4, 11,
    -- Eventos (Apenas Estatísticas de Alunos)
    201,
    -- Diário (Gestão Total do Diário)
    401, 402, 403, 404, 405, 406, 407,
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

SELECT setval('public.profiles_id_seq', (SELECT MAX(id) FROM public.profiles));
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));
SELECT setval('public.clients_id_seq', (SELECT MAX(id) FROM public.clients));
SELECT setval('public.actions_id_seq', (SELECT MAX(id) FROM public.actions));