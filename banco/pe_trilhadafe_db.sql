-- ==========================================================
-- SCRIPT DE RESET TOTAL (DROP) - ARQUITETURA V2.0
-- ==========================================================

-- 1. Remove Schemas de Negócio (Dependentes)
DROP SCHEMA IF EXISTS communication CASCADE;   -- Marketing/Blog
DROP SCHEMA IF EXISTS events_commerce CASCADE; -- Festas e Vendas
DROP SCHEMA IF EXISTS finance CASCADE;         -- Tesouraria
DROP SCHEMA IF EXISTS pastoral CASCADE;        -- Liturgia
DROP SCHEMA IF EXISTS sacraments CASCADE;      -- Cartório
DROP SCHEMA IF EXISTS education CASCADE;       -- Escola/Catequese

-- 2. Remove Schemas de Segurança e Núcleo
DROP SCHEMA IF EXISTS security CASCADE;        -- Auditoria
DROP SCHEMA IF EXISTS people CASCADE;          -- CRM (Pessoas)
DROP SCHEMA IF EXISTS organization CASCADE;    -- Estrutura Física

-- 3. Remove Extensões
DROP EXTENSION IF EXISTS "pgcrypto";

-- Log Visual
DO $$ BEGIN
    RAISE NOTICE 'Banco de dados limpo com sucesso. Todos os schemas foram removidos.';
END $$;



-- ==========================================================
-- SCHEMA: ORGANIZATION
-- Responsabilidade: Estrutura Física e Jurídica
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS organization;

-- Enum: Define a natureza canônica e jurídica da unidade
CREATE TYPE organization.org_type_enum AS ENUM (
    'PARISH',         -- Paróquia (Pública, com território definido)
    'CHAPEL',         -- Capela / Comunidade (Vinculada a uma Paróquia)
    'CONVENT',        -- Convento (Residencial, vida religiosa)
    'MONASTERY',      -- Mosteiro (Vida contemplativa)
    'SEMINARY',       -- Seminário (Formação de padres)
    'CURIA',          -- Cúria / Sede Administrativa da Diocese
    'RETREAT_HOUSE'   -- Casa de Retiro (Hospedagem temporária)
);

-- Tabela Principal: As Entidades
CREATE TABLE organization.organizations (
    org_id SERIAL PRIMARY KEY,
    parent_org_id INT REFERENCES organization.organizations(org_id), -- Auto-relacionamento (Ex: Capela X pertence à Paróquia Y)
    
    -- Classificação
    org_type organization.org_type_enum NOT NULL DEFAULT 'PARISH',
    
    -- Identificação Jurídica e Civil
    legal_name VARCHAR(255) NOT NULL,    -- Razão Social (Ex: Mitra Arquidiocesana...)
    display_name VARCHAR(255) NOT NULL,  -- Nome Fantasia (Ex: Paróquia São José)
    tax_id VARCHAR(20),                  -- CNPJ
    
    -- Identificação Eclesiástica (Canônica)
    diocese_name VARCHAR(200),           -- Diocese a que pertence
    patron_saint VARCHAR(150),           -- Padroeiro (Define datas festivas)
    decree_number VARCHAR(50),           -- Nº do Decreto de Criação/Ereção Canônica
    foundation_date DATE,                -- Data de fundação
    closure_date DATE,                   -- Se preenchido, a unidade foi suprimida (fechada)
    
    -- Contatos Oficiais
    phone_main VARCHAR(20),
    phone_secondary VARCHAR(20),
    email_contact VARCHAR(150),
    website_url VARCHAR(255),
    
    -- Endereço Físico
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),       -- Bairro
    address_city VARCHAR(100),
    address_state CHAR(2),
    zip_code VARCHAR(20),                -- CEP
    geo_coordinates VARCHAR(50),         -- Latitude/Longitude (Para mapas no App)
    
    -- Controle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE       -- Soft Delete
);

-- Documentação Tabela Organizations
COMMENT ON TABLE organization.organizations IS 'Cadastro das unidades eclesiásticas (Paróquias, Capelas, Conventos).';
COMMENT ON COLUMN organization.organizations.parent_org_id IS 'Hierarquia: Se for uma Capela, aponta para a Paróquia Matriz (org_id pai).';
COMMENT ON COLUMN organization.organizations.org_type IS 'Natureza da instituição. Define regras de negócio (ex: Convento tem celas, Paróquia tem dízimo).';
COMMENT ON COLUMN organization.organizations.decree_number IS 'Dado jurídico canônico: documento oficial do Bispo que criou a paróquia.';
COMMENT ON COLUMN organization.organizations.closure_date IS 'Histórico: Data de encerramento das atividades (Supressão da Paróquia).';


-- Tabela de Locais: Espaços Físicos dentro da Organização
CREATE TABLE organization.locations (
    location_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(150) NOT NULL,          -- Ex: "Sala 1", "Altar Mor", "Refeitório"
    description TEXT,                    -- Detalhes de como chegar ou uso
    capacity INT DEFAULT 0,              -- Capacidade máxima de pessoas (Segurança)
    
    -- Características Físicas (Flags)
    is_accessible BOOLEAN DEFAULT FALSE,  -- Tem rampa/elevador? (Importante para inclusão)
    is_lodging BOOLEAN DEFAULT FALSE,     -- É alojamento/cela/dormitório?
    is_consecrated BOOLEAN DEFAULT FALSE, -- É espaço sagrado? (Altar/Capela do Santíssimo)
    has_ac BOOLEAN DEFAULT FALSE,         -- Tem Ar-Condicionado?
    has_ceiling_fan BOOLEAN DEFAULT FALSE,-- Tem Ventilador de Teto?
    
    -- Inventário Rápido (JSON)
    -- Exemplo: {"projetor": true, "bancos": 50, "instrumentos": ["teclado", "violão"]}
    resources_detail JSONB,
    
    photo_url VARCHAR(255),               -- Foto do espaço (para reservas ou eventos)
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Locations
COMMENT ON TABLE organization.locations IS 'Salas, Prédios e Espaços Físicos gerenciáveis dentro de uma unidade.';
COMMENT ON COLUMN organization.locations.is_consecrated IS 'Define se o local é sagrado (restringe festas/eventos profanos neste local).';
COMMENT ON COLUMN organization.locations.is_lodging IS 'Define se o local serve para dormir (Celas de monjas, quartos de retiro).';
COMMENT ON COLUMN organization.locations.resources_detail IS 'Campo flexível (JSON) para listar patrimônio fixo da sala (Projetor, Som, Cadeiras).';

-- ==========================================================
-- SCHEMA: PEOPLE
-- Responsabilidade: Gestão de Pessoas, Vínculos e Famílias
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS people;

-- 1. Tabela Mestra de Pessoas (Prontuário Único)
CREATE TABLE people.persons (
    person_id SERIAL PRIMARY KEY,
    org_id_origin INT REFERENCES organization.organizations(org_id), -- Onde nasceu o cadastro
    
    -- Identificação
    full_name VARCHAR(200) NOT NULL,
    religious_name VARCHAR(150),         -- Nome Social ou Religioso (Ex: Irmã Dulce)
    
    -- Dados Civis
    birth_date DATE,
    gender CHAR(1),                      -- 'M', 'F'
    tax_id VARCHAR(20),                  -- CPF
    national_id VARCHAR(20),             -- RG ou Passaporte
    nationality VARCHAR(50) DEFAULT 'Brasileira',
    place_of_birth VARCHAR(100),         -- Naturalidade (Cidade/Estado)
    civil_status VARCHAR(20),            -- Solteiro, Casado, Viúvo, Religioso
    
    -- Filiação (Texto legado para documentos rápidos)
    father_name VARCHAR(200),
    mother_name VARCHAR(200),
    
    -- Contatos
    email VARCHAR(150),
    phone_mobile VARCHAR(20),            -- Celular (Principal)
    phone_landline VARCHAR(20),          -- Fixo
    
    -- Endereço Residencial
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    zip_code VARCHAR(20),
    
    -- Perfil e Inclusão
    profile_photo_url VARCHAR(255),
    is_pcd BOOLEAN DEFAULT FALSE,        -- Pessoa com Deficiência?
    pcd_details TEXT,                    -- Ex: "Cadeirante", "Autismo Nível 1"
    dietary_restrictions TEXT,           -- Ex: "Alergia a Glúten" (Importante para merenda/retiros)
    
    -- Status Vital
    deceased BOOLEAN DEFAULT FALSE,
    death_date DATE,                     -- Se falecido, data do óbito
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Persons
COMMENT ON TABLE people.persons IS 'Cadastro central de indivíduos (CRM). Base para alunos, padres e fiéis.';
COMMENT ON COLUMN people.persons.religious_name IS 'Nome utilizado no dia a dia religioso (Freis, Freiras) ou Nome Social.';
COMMENT ON COLUMN people.persons.org_id_origin IS 'Organização que realizou o cadastro inicial (Proprietária do dado).';
COMMENT ON COLUMN people.persons.dietary_restrictions IS 'Alergias ou restrições alimentares. Vital para gestão de eventos e escola.';


-- 2. Catálogo de Cargos (Roles)
CREATE TABLE people.roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE, -- Identificador (PRIEST, STUDENT, PARENT)
    description_pt VARCHAR(100) NOT NULL,  -- Exibição (Pároco, Catequizando, Responsável)
    
    -- Flags de Permissão e Natureza
    is_clergy BOOLEAN DEFAULT FALSE,       -- É membro do clero? (Habilita funções litúrgicas)
    is_administrative BOOLEAN DEFAULT FALSE, -- Tem acesso ao painel admin?
    is_student BOOLEAN DEFAULT FALSE       -- É estudante? (Aparece em diários)
);

-- Documentação Tabela Roles
COMMENT ON TABLE people.roles IS 'Tipos de vínculos possíveis (Padre, Aluno, Funcionário).';


-- 3. Vínculos Pessoa <-> Organização (Quem é o quê e Onde)
CREATE TABLE people.person_roles (
    link_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    role_id INT NOT NULL REFERENCES people.roles(role_id),
    
    start_date DATE DEFAULT CURRENT_DATE, -- Data de início (Posse/Matrícula)
    end_date DATE,                        -- Data de fim (Desligamento/Formatura)
    is_active BOOLEAN DEFAULT TRUE,
    
    notes TEXT                            -- Ex: "Transferido da Paróquia X"
);

-- Documentação Tabela Person Roles
COMMENT ON TABLE people.person_roles IS 'Histórico de funções. Permite que uma pessoa seja Aluno em 2020 e Catequista em 2025.';


-- 4. Vínculos Familiares (Family Ties) - NOVO!
CREATE TABLE people.family_ties (
    tie_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id),        -- O indivíduo principal (Ex: O Aluno)
    relative_id INT NOT NULL REFERENCES people.persons(person_id),      -- O Parente (Ex: O Pai)
    
    relationship_type VARCHAR(50) NOT NULL, -- FATHER, MOTHER, SIBLING, SPOUSE, GRANDPARENT, GUARDIAN (Tutor)
    is_financial_responsible BOOLEAN DEFAULT FALSE, -- É quem paga o boleto?
    is_legal_guardian BOOLEAN DEFAULT FALSE,        -- É quem assina documentos/autoriza saída?
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Family Ties
COMMENT ON TABLE people.family_ties IS 'Grafo de relacionamentos familiares. Essencial para lógica escolar (quem busca, quem paga).';
COMMENT ON COLUMN people.family_ties.is_legal_guardian IS 'Se TRUE, esta pessoa pode autorizar passeios e retirar o aluno da escola.';


-- 5. Histórico de Status (RH e Vida Acadêmica)
CREATE TABLE people.status_history (
    log_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    status_type VARCHAR(50) NOT NULL,    -- VACATION, SICK_LEAVE, SUSPENDED, SABBATICAL
    start_date DATE NOT NULL,
    end_date DATE,
    
    reason TEXT,
    document_url VARCHAR(255),           -- Atestado ou Documento
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Status History
COMMENT ON TABLE people.status_history IS 'Linha do tempo de ocorrências (Férias, Doenças, Afastamentos).';

-- ==========================================================
-- SCHEMA: SECURITY
-- Responsabilidade: Auditoria, Logs de Erro e Rastreabilidade
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS security;

-- 1. Tabela de Auditoria (Audit Trail / Change Data Capture)
-- Registra O QUE mudou, QUEM mudou e QUANDO mudou.
CREATE TABLE security.change_logs (
    log_id BIGSERIAL PRIMARY KEY,
    
    schema_name TEXT NOT NULL,           -- Ex: 'people'
    table_name TEXT NOT NULL,            -- Ex: 'persons'
    operation TEXT NOT NULL,             -- 'INSERT', 'UPDATE', 'DELETE'
    
    record_id TEXT,                      -- O ID do registro afetado (convertido para texto)
    user_id INT,                         -- O ID do usuário que fez a ação (se disponível na sessão)
    ip_address VARCHAR(45),              -- IP de origem (IPv4 ou IPv6)
    
    old_values JSONB,                    -- Como era antes (NULL no INSERT)
    new_values JSONB,                    -- Como ficou depois (NULL no DELETE)
    
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Change Logs
COMMENT ON TABLE security.change_logs IS 'Log de Auditoria Central. Grava snapshot dos dados antes e depois de alterações.';
COMMENT ON COLUMN security.change_logs.record_id IS 'ID da linha afetada. Armazenado como texto para aceitar qualquer tipo de PK.';
COMMENT ON COLUMN security.change_logs.old_values IS 'Dados originais (Snapshot JSON). Útil para desfazer (rollback) erros manuais.';


-- 2. Tabela de Logs de Erro do Sistema (Exceptions)
-- Útil para você (desenvolvedor) saber quando o PHP/Front quebrou.
CREATE TABLE security.error_logs (
    error_id BIGSERIAL PRIMARY KEY,
    org_id INT,                          -- Em qual paróquia deu erro?
    user_id INT,                         -- Quem estava usando?
    
    error_code VARCHAR(50),              -- Ex: '500', 'SQL_STATE_23505'
    error_message TEXT,                  -- "Duplicate key value violates unique constraint"
    stack_trace TEXT,                    -- Caminho do arquivo/linha onde o erro ocorreu
    
    request_uri VARCHAR(255),            -- Qual página/API estava sendo acessada
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Error Logs
COMMENT ON TABLE security.error_logs IS 'Registro de falhas técnicas e exceções do sistema para debug.';


-- 3. Tabela de Acesso (Login History)
-- Para segurança: saber quem logou e de onde.
CREATE TABLE security.access_logs (
    access_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    org_id INT NOT NULL,
    
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    
    ip_address VARCHAR(45),
    user_agent TEXT,                     -- Navegador/Dispositivo (Chrome, iPhone)
    status VARCHAR(20) DEFAULT 'SUCCESS' -- SUCCESS, FAILED_PASSWORD, BLOCKED
);

-- Documentação Tabela Access Logs
COMMENT ON TABLE security.access_logs IS 'Histórico de sessões de usuários. Importante para investigação forense.';


-- ==========================================================
-- 4. FUNÇÃO GATILHO (TRIGGER) PARA AUDITORIA AUTOMÁTICA
-- ==========================================================
-- Esta função é o motor que preenche a tabela 'change_logs' sozinha.

CREATE OR REPLACE FUNCTION security.log_changes() RETURNS TRIGGER AS $$
DECLARE
    v_record_id TEXT;
    v_pk_column TEXT;
BEGIN
    -- Argumento 0: Nome da coluna Primary Key da tabela alvo
    v_pk_column := TG_ARGV[0];

    -- Captura o ID baseado na operação
    IF (TG_OP = 'DELETE') THEN
        IF v_pk_column IS NOT NULL THEN
            v_record_id := row_to_json(OLD)->>v_pk_column;
        ELSE
            v_record_id := 'UNKNOWN';
        END IF;
        
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, old_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'DELETE', v_record_id, row_to_json(OLD)::jsonb);
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        IF v_pk_column IS NOT NULL THEN
            v_record_id := row_to_json(NEW)->>v_pk_column;
        ELSE
            v_record_id := 'UNKNOWN';
        END IF;
        
        -- Só grava se houve mudança real nos dados (Ignora updates falsos)
        IF row_to_json(OLD)::jsonb IS DISTINCT FROM row_to_json(NEW)::jsonb THEN
            INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, old_values, new_values)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'UPDATE', v_record_id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        END IF;
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        IF v_pk_column IS NOT NULL THEN
            v_record_id := row_to_json(NEW)->>v_pk_column;
        ELSE
            v_record_id := 'UNKNOWN';
        END IF;
        
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, new_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'INSERT', v_record_id, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Documentação Função
COMMENT ON FUNCTION security.log_changes IS 'Gatilho genérico. Deve ser acionado passando o nome da PK como argumento.';

-- ==========================================================
-- SCHEMA: EDUCATION
-- Responsabilidade: Gestão Pedagógica, Cursos e Diários
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS education;

-- 1. Disciplinas (Matérias Isoladas)
-- Ex: "Novo Testamento", "Liturgia", "Orações Básicas"
CREATE TABLE education.subjects (
    subject_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(150) NOT NULL,
    syllabus_summary TEXT,           -- Ementa (Resumo do que é ensinado)
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Subjects
COMMENT ON TABLE education.subjects IS 'Cadastro de matérias/disciplinas independentes.';


-- 2. Cursos / Etapas (O Produto Educacional)
-- Ex: "Primeira Eucaristia - Ano 1", "Curso de Noivos", "Crisma"
CREATE TABLE education.courses (
    course_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    
    min_age INT,                     -- Trava de sistema: Idade mínima
    max_age INT,                     -- Trava de sistema: Idade máxima
    total_workload_hours INT,        -- Carga horária total exigida
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Courses
COMMENT ON TABLE education.courses IS 'Etapas formativas. Agrupa disciplinas e define requisitos de idade.';
COMMENT ON COLUMN education.courses.min_age IS 'Idade mínima do aluno para matrícula. Usado na validação automática.';


-- 3. Grade Curricular (Vínculo Curso <-> Disciplina)
-- Define: O Curso "Crisma" é composto por "Bíblia" (20h) e "Moral" (10h).
CREATE TABLE education.curriculum (
    curriculum_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES education.courses(course_id),
    subject_id INT NOT NULL REFERENCES education.subjects(subject_id),
    
    workload_hours INT DEFAULT 0,    -- Quantas horas dessa matéria neste curso?
    is_mandatory BOOLEAN DEFAULT TRUE -- É obrigatória para se formar?
);

-- Documentação Tabela Curriculum
COMMENT ON TABLE education.curriculum IS 'Matriz curricular. Define quais matérias compõem um curso.';


-- 4. Turmas (Classes) - A Materialização do Curso no Tempo
-- Ex: "Turma Sábado Manhã - 2025"
CREATE TABLE education.classes (
    class_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES education.courses(course_id),
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    main_location_id INT REFERENCES organization.locations(location_id), -- Sala padrão
    coordinator_id INT REFERENCES people.persons(person_id),             -- Catequista Responsável
    
    name VARCHAR(100) NOT NULL,
    year_cycle INT NOT NULL,         -- Ano Letivo (Ex: 2025)
    semester INT,                    -- Semestre (1 ou 2, opcional)
    
    start_date DATE,
    end_date DATE,
    
    max_capacity INT,                -- Vagas limitadas nesta turma
    status VARCHAR(20) DEFAULT 'PLANNED' -- PLANNED, ACTIVE, FINISHED, CANCELLED
);

-- Documentação Tabela Classes
COMMENT ON TABLE education.classes IS 'Turmas abertas para um ciclo letivo.';
COMMENT ON COLUMN education.classes.max_capacity IS 'Limite de vagas. Se NULL, é ilimitado.';


-- 5. Grade Horária da Turma (Schedules)
-- Ex: "Todo Sábado, das 08h às 09h, Aula de Bíblia na Sala 1"
CREATE TABLE education.class_schedules (
    schedule_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    
    week_day INT NOT NULL,           -- 0=Domingo, 1=Segunda... 6=Sábado
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    subject_id INT REFERENCES education.subjects(subject_id),    -- Qual matéria é dada neste horário?
    location_id INT REFERENCES organization.locations(location_id), -- Sala específica (pode ser diferente da padrão)
    instructor_id INT REFERENCES people.persons(person_id),      -- Professor específico deste horário
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Class Schedules
COMMENT ON TABLE education.class_schedules IS 'Grade de horários recorrente da turma.';
COMMENT ON COLUMN education.class_schedules.subject_id IS 'Permite que a turma tenha matérias diferentes em horários diferentes.';


-- 6. Solicitações de Matrícula (Fila de Espera / Site)
CREATE TABLE education.registration_requests (
    request_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Dados "Sujos" (Digitados pelo usuário no site)
    candidate_name VARCHAR(200) NOT NULL,
    candidate_birth_date DATE,
    parent_name VARCHAR(200),
    parent_contact VARCHAR(100),
    
    desired_course_id INT REFERENCES education.courses(course_id),
    
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, WAITLIST
    rejection_reason TEXT,
    
    processed_by_user_id INT,             -- Quem analisou (Staff)
    created_student_id INT REFERENCES people.persons(person_id) -- Se aprovado, vira ID real
);

-- Documentação Tabela Registration Requests
COMMENT ON TABLE education.registration_requests IS 'Pré-matrículas vindas de formulários externos. Aguardam aprovação.';


-- 7. Matrículas (Enrollments)
-- O Vínculo Oficial Aluno <-> Turma
CREATE TABLE education.enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, DROPPED (Desistiu), COMPLETED, TRANSFERRED
    
    final_grade NUMERIC(5,2),            -- Média Final
    final_result VARCHAR(20),            -- APPROVED, REPROVED
    
    notes TEXT                           -- Observações pedagógicas do aluno nesta turma
);

-- Documentação Tabela Enrollments
COMMENT ON TABLE education.enrollments IS 'Registro oficial do aluno na turma.';
COMMENT ON COLUMN education.enrollments.status IS 'Estado atual do aluno (Ativo, Desistente, etc).';


-- 8. Diário de Classe (Sessões/Aulas)
-- O registro do "Dia Letivo".
CREATE TABLE education.class_sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    
    date_held DATE NOT NULL,             -- Data da aula
    topic_taught TEXT,                   -- Conteúdo ministrado
    
    session_type VARCHAR(20) DEFAULT 'REGULAR', -- REGULAR, MAKEUP (Reposição), EXTRA_CLASS
    observations TEXT,                   -- Ocorrências gerais do dia
    
    recorded_by_user_id INT              -- Quem preencheu o diário?
);

-- Documentação Tabela Class Sessions
COMMENT ON TABLE education.class_sessions IS 'Diário de classe. Representa um dia de aula ou evento letivo.';


-- 9. Chamada / Frequência (Attendance)
CREATE TABLE education.attendance (
    attendance_id BIGSERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES education.class_sessions(session_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    
    is_present BOOLEAN DEFAULT FALSE,    -- Veio ou não?
    is_excused BOOLEAN DEFAULT FALSE,    -- Falta abonada/justificada?
    justification TEXT                   -- Motivo (Ex: Atestado Médico)
);

-- Documentação Tabela Attendance
COMMENT ON TABLE education.attendance IS 'Registro individual de presença por aula.';


-- 10. Avaliações e Notas (Assessments) - Opcional para Catequese, Obrigatório para Teologia
CREATE TABLE education.assessments (
    assessment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    subject_id INT REFERENCES education.subjects(subject_id), -- Prova de qual matéria?
    
    title VARCHAR(150) NOT NULL,         -- Ex: "Prova Bimestral", "Trabalho sobre Santos"
    max_score NUMERIC(5,2) DEFAULT 10.00,
    weight INT DEFAULT 1,                -- Peso na média
    due_date DATE
);

CREATE TABLE education.student_grades (
    grade_id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES education.assessments(assessment_id),
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    
    score_obtained NUMERIC(5,2),         -- Nota tirada
    comments TEXT,                       -- Feedback do professor
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Grades
COMMENT ON TABLE education.student_grades IS 'Notas individuais dos alunos nas avaliações.';

-- ==========================================================
-- SCHEMA: SACRAMENTS
-- Responsabilidade: Registro Canônico e Livros de Tombo
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS sacraments;

-- Enum: Tipos de Livros Oficiais
CREATE TYPE sacraments.sacrament_type_enum AS ENUM (
    'BAPTISM',        -- Batismo
    'CONFIRMATION',   -- Crisma / Confirmação
    'MARRIAGE',       -- Matrimônio
    'DEATH',          -- Óbito / Exéquias
    'HOLY_ORDERS'     -- Ordem (Raro em paróquia, mas necessário para averbação)
);

-- 1. Livros de Registro (O Livro Físico na Estante)
-- Ex: "Livro de Batismos nº 45 (2020-2024)"
CREATE TABLE sacraments.registry_books (
    book_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    sacrament_type sacraments.sacrament_type_enum NOT NULL,
    book_number VARCHAR(20) NOT NULL,    -- Ex: "45-B", "LIVRO X"
    
    opening_date DATE,                   -- Quando o livro foi aberto
    closing_date DATE,                   -- Quando o livro foi encerrado (encadernado)
    
    status VARCHAR(20) DEFAULT 'OPEN',   -- OPEN, CLOSED, ARCHIVED
    location_shelf VARCHAR(50)           -- Onde está guardado fisicamente? (Ex: "Armário A, Prateleira 2")
);

-- Documentação Tabela Registry Books
COMMENT ON TABLE sacraments.registry_books IS 'Catálogo dos livros físicos de registro canônico.';
COMMENT ON COLUMN sacraments.registry_books.status IS 'OPEN (Em uso), CLOSED (Cheio/Encerrado).';


-- 2. Registros de Batismo (A Porta de Entrada)
CREATE TABLE sacraments.baptisms (
    baptism_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Quem foi batizado?
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    
    -- Dados da Cerimônia
    celebration_date DATE NOT NULL,
    celebrant_id INT REFERENCES people.persons(person_id), -- Padre/Diácono
    celebrant_text VARCHAR(200),         -- Caso seja um padre de fora não cadastrado
    
    -- Padrinhos (Dados Canônicos - Texto é obrigatório pois nem sempre têm cadastro)
    godfather_name VARCHAR(200),
    godmother_name VARCHAR(200),
    godfather_id INT REFERENCES people.persons(person_id), -- Opcional: Link se já for cadastrado
    godmother_id INT REFERENCES people.persons(person_id), -- Opcional: Link se já for cadastrado
    
    -- Dados do Livro de Tombo (Indexação)
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),             -- Folha
    entry_number VARCHAR(20),            -- Termo/Número do Assento
    
    -- Campos Críticos
    margin_notes TEXT,                   -- Averbações (Casou, Crismou, Ordenou)
    is_conditional BOOLEAN DEFAULT FALSE,-- Batismo sob condição? (Dúvida se já foi batizado)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Baptisms
COMMENT ON TABLE sacraments.baptisms IS 'Assentos de Batismo. Documento base da vida cristã.';
COMMENT ON COLUMN sacraments.baptisms.margin_notes IS 'Espaço para averbações canônicas obrigatórias (Ex: Casamento em 2030, Crisma em 2020).';
COMMENT ON COLUMN sacraments.baptisms.is_conditional IS 'Se TRUE, o batismo foi realizado "si non es baptizatus" (sob condição).';


-- 3. Registros de Crisma (Confirmação)
CREATE TABLE sacraments.confirmations (
    confirmation_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    
    celebration_date DATE NOT NULL,
    bishop_name VARCHAR(200),            -- Quem crismou? (Geralmente o Bispo)
    
    sponsor_name VARCHAR(200),           -- Padrinho/Madrinha de Crisma
    sponsor_id INT REFERENCES people.persons(person_id),
    
    -- Livro de Tombo
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    
    baptism_place VARCHAR(255),          -- Onde foi batizado? (Para notificar a paróquia de origem)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Confirmations
COMMENT ON TABLE sacraments.confirmations IS 'Assentos de Crisma (Sacramento da Confirmação).';
COMMENT ON COLUMN sacraments.confirmations.baptism_place IS 'Nome da paróquia de batismo. Necessário para enviar a notificação de averbação.';


-- 4. Registros de Matrimônio (Casamentos)
CREATE TABLE sacraments.marriages (
    marriage_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Os Noivos
    husband_id INT NOT NULL REFERENCES people.persons(person_id),
    wife_id INT NOT NULL REFERENCES people.persons(person_id),
    
    celebration_date DATE NOT NULL,
    celebrant_id INT REFERENCES people.persons(person_id),
    
    -- Testemunhas (Padrinhos de Casamento)
    witness_1_name VARCHAR(200),
    witness_2_name VARCHAR(200),
    
    -- Registro Civil (Obrigatório para efeitos legais)
    civil_registry_date DATE,
    civil_registry_details TEXT,         -- Cartório, Livro, Folha do Casamento Civil
    
    -- Livro de Tombo Religioso
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    
    -- Status Canônico
    status VARCHAR(20) DEFAULT 'VALID',  -- VALID, ANNULLED (Nulo), DISSOLVED (Dissolvido)
    annulment_details TEXT,              -- Se anulado, dados do Tribunal Eclesiástico
    
    margin_notes TEXT,                   -- Averbações
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Marriages
COMMENT ON TABLE sacraments.marriages IS 'Assentos de Matrimônio.';
COMMENT ON COLUMN sacraments.marriages.civil_registry_details IS 'Dados do Cartório Civil. Necessário para que o casamento religioso tenha efeito civil.';
COMMENT ON COLUMN sacraments.marriages.status IS 'Status jurídico do vínculo. Importante para casos de nulidade.';


-- 5. Registros de Óbito (Exéquias)
CREATE TABLE sacraments.deaths (
    death_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    
    death_date DATE NOT NULL,
    burial_date DATE,                    -- Data do sepultamento
    
    cemetery_name VARCHAR(200),          -- Onde foi sepultado
    burial_location VARCHAR(100),        -- Jazigo/Gaveta
    
    sacraments_received TEXT,            -- Recebeu unção? Confessou antes?
    
    -- Livro de Tombo
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Deaths
COMMENT ON TABLE sacraments.deaths IS 'Registro de Óbitos e Exéquias realizadas na paróquia.';
COMMENT ON COLUMN sacraments.deaths.sacraments_received IS 'Histórico pastoral: O falecido recebeu a Unção dos Enfermos ou Viático antes de morrer?';

-- ==========================================================
-- SCHEMA: PASTORAL
-- Responsabilidade: Liturgia, Missas, Intenções e Atendimentos
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS pastoral;

-- 1. Tipos de Celebração
-- Ex: "Santa Missa", "Adoração ao Santíssimo", "Batizado Comunitário", "Novena"
CREATE TABLE pastoral.celebration_types (
    type_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(100) NOT NULL,
    default_duration_minutes INT DEFAULT 60,
    allows_intentions BOOLEAN DEFAULT TRUE, -- Pode pedir intenção paga para este tipo?
    allows_collections BOOLEAN DEFAULT TRUE -- Tem coleta de oferta?
);

-- Documentação Tabela Celebration Types
COMMENT ON TABLE pastoral.celebration_types IS 'Catálogo de ritos religiosos da paróquia.';
COMMENT ON COLUMN pastoral.celebration_types.allows_intentions IS 'Define se a secretária pode lançar intenções (Ex: Na Missa pode, na Via Sacra talvez não).';


-- 2. Grade de Horários Fixa (Template)
-- Ex: "Todo Domingo às 08:00 na Matriz"
CREATE TABLE pastoral.schedules (
    schedule_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    type_id INT NOT NULL REFERENCES pastoral.celebration_types(type_id),
    
    location_id INT REFERENCES organization.locations(location_id), -- Onde?
    celebrant_id INT REFERENCES people.persons(person_id),          -- Padre fixo da escala (Opcional)
    
    week_day INT NOT NULL,           -- 0=Domingo, 1=Segunda...
    start_time TIME NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Schedules
COMMENT ON TABLE pastoral.schedules IS 'Grade horária fixa/recorrente. Usada para gerar as celebrações reais.';


-- 3. A Celebração Real (O Evento no Tempo)
-- Ex: "Missa do dia 25/12/2025 às 10:00"
CREATE TABLE pastoral.celebrations (
    celebration_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    type_id INT NOT NULL REFERENCES pastoral.celebration_types(type_id),
    
    date_time TIMESTAMP NOT NULL,
    location_id INT REFERENCES organization.locations(location_id),
    main_celebrant_id INT REFERENCES people.persons(person_id), -- Quem presidiu de fato?
    
    -- Dados Litúrgicos do Dia
    liturgical_color VARCHAR(20),        -- GREEN, WHITE, RED, VIOLET, ROSE, BLACK
    liturgical_feast VARCHAR(150),       -- Ex: "Natal do Senhor", "Tempo Comum - 3º Domingo"
    gospel_reference VARCHAR(100),       -- Ex: "João 3, 16" (Para histórico de homilias)
    homily_summary TEXT,                 -- Resumo do que foi pregado (Para Blog/Site)
    
    -- Estatísticas
    attendance_count INT,                -- Quantas pessoas vieram (Contador manual)
    communion_count INT,                 -- Quantas hóstias consumidas (Gestão de estoque)
    
    status VARCHAR(20) DEFAULT 'SCHEDULED' -- SCHEDULED, HAPPENED, CANCELLED
);

-- Documentação Tabela Celebrations
COMMENT ON TABLE pastoral.celebrations IS 'O evento litúrgico específico. Vincula a agenda financeira e espiritual.';
COMMENT ON COLUMN pastoral.celebrations.liturgical_color IS 'Cor dos paramentos (Verde, Roxo, etc).';
COMMENT ON COLUMN pastoral.celebrations.communion_count IS 'Número de comunhões. Útil para prever compra de hóstias.';


-- 4. Intenções de Missa (Súplicas e Espórtulas)
-- O "Livro de Intenções Digital"
CREATE TABLE pastoral.mass_intentions (
    intention_id BIGSERIAL PRIMARY KEY,
    celebration_id INT NOT NULL REFERENCES pastoral.celebrations(celebration_id),
    
    requested_by_person_id INT REFERENCES people.persons(person_id), -- Quem pediu?
    target_name VARCHAR(255) NOT NULL,   -- Por quem é a oração? (Ex: "Alma de José")
    
    intention_type VARCHAR(50),          -- DECEASED (Falecido), HEALTH (Saúde), THANKSGIVING (Ação de Graças), BIRTHDAY
    
    -- Financeiro (Integração)
    donation_amount NUMERIC(10,2) DEFAULT 0.00, -- Valor da espórtula (pode ser zero)
    is_paid BOOLEAN DEFAULT FALSE,       -- Já pagou?
    transaction_id BIGINT,               -- ID da transação no schema Finance (quando houver link)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Mass Intentions
COMMENT ON TABLE pastoral.mass_intentions IS 'Pedidos de oração lidos durante a celebração.';
COMMENT ON COLUMN pastoral.mass_intentions.target_name IS 'Nome da pessoa ou causa pela qual se reza.';
COMMENT ON COLUMN pastoral.mass_intentions.transaction_id IS 'Link para o lançamento no caixa, garantindo auditoria financeira.';


-- 5. Atendimentos Pastorais (Agenda do Padre)
-- Confissões, Aconselhamento, Visitas a Enfermos
CREATE TABLE pastoral.pastoral_visits (
    visit_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    priest_id INT NOT NULL REFERENCES people.persons(person_id), -- Quem atendeu?
    person_id INT REFERENCES people.persons(person_id),          -- Quem foi atendido?
    
    visit_type VARCHAR(50),              -- CONFESSION, SICK_VISIT, COUNSELING, HOUSE_BLESSING
    date_time TIMESTAMP NOT NULL,
    
    location_type VARCHAR(20),           -- CHURCH_OFFICE, HOME, HOSPITAL
    address_detail VARCHAR(255),         -- Se for externa (casa/hospital)
    
    notes_private TEXT,                  -- Anotações sigilosas do padre (Cuidado com LGPD!)
    status VARCHAR(20) DEFAULT 'SCHEDULED' -- SCHEDULED, COMPLETED, NO_SHOW (Faltou)
);

-- Documentação Tabela Pastoral Visits
COMMENT ON TABLE pastoral.pastoral_visits IS 'Agenda de atendimentos individuais do clero.';
COMMENT ON COLUMN pastoral.pastoral_visits.notes_private IS 'Campo sensível. Deve ter restrição de visualização apenas para o padre.';

-- ==========================================================
-- SCHEMA: FINANCE
-- Responsabilidade: Tesouraria, Dízimo, Contas a Pagar/Receber
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS finance;

-- 1. Contas Bancárias e Caixas (Onde o dinheiro está?)
-- Ex: "Cofre da Matriz", "Conta Corrente BB", "Caixinha da Secretaria"
CREATE TABLE finance.accounts (
    account_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'BANK', -- BANK, CASH, SAFE, INVESTMENT
    
    -- Dados Bancários (Opcional)
    bank_name VARCHAR(50),
    agency_number VARCHAR(20),
    account_number VARCHAR(20),
    
    current_balance NUMERIC(15,2) DEFAULT 0.00, -- Saldo Atualizado via Trigger/App
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Accounts
COMMENT ON TABLE finance.accounts IS 'Locais de armazenamento de valores (Caixas físicos ou contas bancárias).';


-- 2. Plano de Contas / Categorias (De onde vem e para onde vai?)
-- Ex: "Dízimo", "Conta de Luz", "Manutenção Predial", "Venda de Livros"
CREATE TABLE finance.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organization.organizations(org_id), -- Pode ser NULL se for categoria padrão do sistema
    parent_category_id INT REFERENCES finance.categories(category_id), -- Subcategorias (Despesas -> Energia)
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,        -- INCOME (Entrada), EXPENSE (Saída)
    
    is_system_default BOOLEAN DEFAULT FALSE -- Se TRUE, o usuário não pode apagar (Ex: Dízimo)
);

-- Documentação Tabela Categories
COMMENT ON TABLE finance.categories IS 'Plano de Contas Contábil/Gerencial.';


-- 3. Centros de Custo (Opcional, mas estratégico)
-- Ex: "Departamento de Catequese", "Festa do Padroeiro 2025", "Secretaria"
CREATE TABLE finance.cost_centers (
    center_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),                 -- Código contábil rápido
    budget_limit NUMERIC(15,2),       -- Orçamento (Budget) para este centro
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Cost Centers
COMMENT ON TABLE finance.cost_centers IS 'Agrupadores de despesas/receitas para relatórios gerenciais (Por setor/projeto).';


-- 4. O Coração: Transações (Livro Caixa)
CREATE TABLE finance.transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Classificação
    account_id INT NOT NULL REFERENCES finance.accounts(account_id),     -- Saiu de onde?
    category_id INT NOT NULL REFERENCES finance.categories(category_id), -- É o quê?
    cost_center_id INT REFERENCES finance.cost_centers(center_id),       -- Para qual setor?
    
    -- Envolvidos
    person_id INT REFERENCES people.persons(person_id), -- Quem pagou/recebeu? (Dizimista, Fornecedor)
    
    -- Valores
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,    -- Sempre positivo
    transaction_type VARCHAR(20),     -- CREDIT (Entrada), DEBIT (Saída), TRANSFER (Entre contas)
    
    -- Datas
    due_date DATE NOT NULL,           -- Vencimento / Competência
    payment_date DATE,                -- Data da Baixa (Se NULL, está "Aberto/Pendente")
    
    -- Comprovantes
    document_number VARCHAR(50),      -- Nº Nota Fiscal, Nº Recibo
    document_url VARCHAR(255),        -- Scan do comprovante
    
    -- Controle
    is_reconciled BOOLEAN DEFAULT FALSE, -- Conciliado com extrato bancário?
    created_by_user_id INT,           -- Auditoria rápida
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Transactions
COMMENT ON TABLE finance.transactions IS 'Registro financeiro unificado (Contas a Pagar, Receber e Realizadas).';
COMMENT ON COLUMN finance.transactions.payment_date IS 'Se preenchido, a transação foi efetivada. Se NULL, é uma previsão (A Pagar/Receber).';


-- 5. Gestão de Dízimo (Específico da Igreja)
-- Controla o compromisso do fiel, não o pagamento em si (o pagamento vai pra transactions).
CREATE TABLE finance.tithe_profiles (
    profile_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    
    start_date DATE DEFAULT CURRENT_DATE,
    preferred_day INT,                -- Dia de preferência para oferta (Ex: dia 10)
    committed_value NUMERIC(10,2),    -- Valor compromissado (opcional, estatístico)
    
    envelope_number INT,              -- Número do carnê/envelope físico (se usar)
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Tithe Profiles
COMMENT ON TABLE finance.tithe_profiles IS 'Perfil do Dizimista. Gerencia numeração de envelopes e histórico de fidelidade.';

-- Visualização de Histórico (View Auxiliar Sugerida - Lógica)
-- "Para saber se o dizimista está em dia, cruzamos finance.tithe_profiles com finance.transactions filtrando pela categoria Dízimo".

-- ==========================================================
-- SCHEMA: EVENTS_COMMERCE
-- Responsabilidade: Festas, Bingos, Trilhas e Sistema Cashless (Vendas)
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS events_commerce;

-- 1. O Evento (A Campanha)
-- Ex: "Quermesse 2025", "Trilha da Fé - Edição 1", "Bingo Beneficente"
CREATE TABLE events_commerce.events (
    event_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),          -- FUNDRAISER, SOCIAL, RETREAT, PILGRIMAGE
    
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    
    location_id INT REFERENCES organization.locations(location_id), -- Se for na igreja
    external_location_text VARCHAR(255), -- Se for em chácara/rua
    
    financial_goal NUMERIC(15,2),    -- Meta de arrecadação (Para o termômetro no dashboard)
    status VARCHAR(20) DEFAULT 'PLANNED' -- PLANNED, ACTIVE, FINISHED, CANCELLED
);

-- Documentação Tabela Events
COMMENT ON TABLE events_commerce.events IS 'Cadastro das campanhas e festas.';


-- 2. Ingressos e Inscrições (Tickets)
-- Controle de Acesso e Venda Antecipada
CREATE TABLE events_commerce.tickets (
    ticket_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    
    -- Quem comprou?
    owner_person_id INT REFERENCES people.persons(person_id),
    guest_name VARCHAR(150),         -- Para pessoas de fora sem cadastro
    
    -- Quem vendeu? (Estratégico para metas)
    seller_person_id INT REFERENCES people.persons(person_id),
    
    -- Segurança
    qr_code_hash UUID DEFAULT gen_random_uuid(), -- O Segredo do QR Code
    batch_name VARCHAR(50),          -- "Lote Promocional", "Lote 1"
    
    -- Financeiro
    price_sold NUMERIC(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id BIGINT,           -- Link com finance.transactions
    
    -- Controle de Portaria
    validation_date TIMESTAMP,       -- Quando entrou
    validated_by_user_id INT,        -- Quem bipou (Staff)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Tickets
COMMENT ON TABLE events_commerce.tickets IS 'Ingressos individuais. Possui Hash seguro para validação via App.';
COMMENT ON COLUMN events_commerce.tickets.seller_person_id IS 'Vendedor do ingresso. Usado para ranking de vendas e comissões.';


-- 3. Doações Físicas (Entrada "1kg de Alimento")
CREATE TABLE events_commerce.donations_in_kind (
    donation_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    
    donor_person_id INT REFERENCES people.persons(person_id),
    
    item_name VARCHAR(100) NOT NULL, -- "Arroz", "Óleo", "Prenda de Bingo"
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_measure VARCHAR(20),        -- KG, UN, LITRO
    
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by_user_id INT          -- Staff que recebeu na porta
);

-- Documentação Tabela Donations In Kind
COMMENT ON TABLE events_commerce.donations_in_kind IS 'Registro de arrecadação de itens físicos durante campanhas.';


-- ==========================================================
-- SISTEMA CASHLESS (CONSUMO NA PRAÇA DE ALIMENTAÇÃO)
-- ==========================================================

-- 4. Cartões de Consumo (A "Carteira" do Fiel)
CREATE TABLE events_commerce.cards (
    card_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Vínculo (Pode ser anônimo ou nominal)
    person_id INT REFERENCES people.persons(person_id),
    
    -- Identificadores
    card_uuid UUID DEFAULT gen_random_uuid(), -- Chip Interno / QR Code do Cartão
    display_code VARCHAR(50),                 -- Código impresso (Ex: "CARTAO-0105")
    
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE,           -- False = Bloqueado (Perda/Roubo)
    last_used_at TIMESTAMP
);

-- Documentação Tabela Cards
COMMENT ON TABLE events_commerce.cards IS 'Meio de pagamento interno da festa (Cartão/Pulseira recarregável).';


-- 5. Barracas e Pontos de Venda (Vendors)
CREATE TABLE events_commerce.vendors (
    vendor_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    
    name VARCHAR(100) NOT NULL,               -- "Barraca do Pastel", "Pescaria"
    responsible_person_id INT REFERENCES people.persons(person_id),
    
    commission_rate NUMERIC(5,2) DEFAULT 0.00, -- % que fica para a Igreja (Ex: 20%)
    fixed_fee NUMERIC(15,2) DEFAULT 0.00,      -- Taxa fixa de aluguel da barraca (Ex: R$ 200,00)
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Vendors
COMMENT ON TABLE events_commerce.vendors IS 'Estabelecimentos comerciais dentro do evento.';
COMMENT ON COLUMN events_commerce.vendors.commission_rate IS 'Porcentagem de cada venda que é retida automaticamente pela igreja.';


-- 6. Cardápio / Produtos (Products)
CREATE TABLE events_commerce.products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES events_commerce.vendors(vendor_id),
    
    name VARCHAR(100) NOT NULL,      -- "Pastel de Carne", "Refrigerante"
    unit_price NUMERIC(10,2) NOT NULL,
    
    stock_quantity INT,              -- Controle de Estoque (Opcional)
    is_available BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Products
COMMENT ON TABLE events_commerce.products IS 'Itens à venda em cada barraca.';


-- 7. Transações de Consumo (O Log Financeiro da Festa)
CREATE TABLE events_commerce.transactions (
    log_id BIGSERIAL PRIMARY KEY,
    card_id INT NOT NULL REFERENCES events_commerce.cards(card_id),
    
    transaction_type VARCHAR(20) NOT NULL, -- LOAD (Recarga), PURCHASE (Compra), REFUND (Estorno), CASHOUT (Devolução sobrou)
    
    amount NUMERIC(15,2) NOT NULL,         -- Valor total movimentado
    
    -- Detalhe da Compra (Se for PURCHASE)
    vendor_id INT REFERENCES events_commerce.vendors(vendor_id),
    products_json JSONB,                   -- Snapshot: [{"item": "Pastel", "qtd": 2, "price": 10.00}]
    
    -- Divisão de Receita (Split de Pagamento)
    church_fee_amount NUMERIC(15,2) DEFAULT 0.00, -- Parte da Igreja
    vendor_net_amount NUMERIC(15,2) DEFAULT 0.00, -- Parte do Barraqueiro
    
    operator_user_id INT,                  -- Quem operou a máquina/caixa
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Transactions
COMMENT ON TABLE events_commerce.transactions IS 'Extrato detalhado de consumo. Fonte da verdade para acerto de contas.';
COMMENT ON COLUMN events_commerce.transactions.products_json IS 'Lista dos itens comprados no momento da transação (para não depender de preços futuros).';
COMMENT ON COLUMN events_commerce.transactions.church_fee_amount IS 'Lucro retido pela igreja nesta operação específica.';

-- ==========================================================
-- SCHEMA: COMMUNICATION
-- Responsabilidade: Blog, Notícias, Banners do App e Mídia
-- ==========================================================

CREATE SCHEMA IF NOT EXISTS communication;

-- 1. Categorias de Conteúdo
-- Ex: "Homilias", "Avisos Paroquiais", "Prestação de Contas", "Fotos da Festa"
CREATE TABLE communication.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,      -- URL amigável (ex: 'avisos-semanais')
    color_hex VARCHAR(7),            -- Cor da etiqueta no site (ex: '#FF0000')
    
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Categories
COMMENT ON TABLE communication.categories IS 'Taxonomia para organizar as notícias e avisos.';


-- 2. Postagens (Artigos e Notícias)
CREATE TABLE communication.posts (
    post_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    -- Autoria
    author_id INT NOT NULL REFERENCES people.persons(person_id), -- Quem escreveu?
    category_id INT REFERENCES communication.categories(category_id),
    
    -- Conteúdo
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,      -- Ex: 'resultado-bingo-2025'
    summary TEXT,                    -- Resumo para listagens (Lead)
    content_html TEXT,               -- O texto completo (HTML do editor rico)
    
    cover_image_url VARCHAR(255),    -- Imagem de destaque (Thumbnail)
    
    -- Controle de Publicação
    status VARCHAR(20) DEFAULT 'DRAFT', -- DRAFT (Rascunho), PUBLISHED, ARCHIVED
    published_at TIMESTAMP,          -- Agendamento (Pode publicar no futuro)
    
    -- Engajamento
    allow_comments BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,       -- Contador simples de visualizações
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documentação Tabela Posts
COMMENT ON TABLE communication.posts IS 'Gerenciador de Conteúdo (CMS). Centraliza homilias e notícias.';
COMMENT ON COLUMN communication.posts.slug IS 'Identificador para URL (SEO). Deve ser único por organização.';
COMMENT ON COLUMN communication.posts.content_html IS 'Corpo da notícia. Armazena HTML sanitizado vindo de editores WYSIWYG.';
COMMENT ON COLUMN communication.posts.published_at IS 'Data de exibição pública. Se for futura, o post fica agendado.';


-- 3. Anexos e Galeria (Media)
-- Fotos da galeria ou PDF do boletim semanal
CREATE TABLE communication.attachments (
    attachment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES communication.posts(post_id) ON DELETE CASCADE,
    
    file_url VARCHAR(255) NOT NULL,  -- Link do S3 / Uploads
    file_type VARCHAR(50),           -- IMAGE, PDF, VIDEO_LINK, AUDIO (Podcast)
    
    caption VARCHAR(200),            -- Legenda da foto
    display_order INT DEFAULT 0      -- Ordem de aparição na galeria
);

-- Documentação Tabela Attachments
COMMENT ON TABLE communication.attachments IS 'Arquivos vinculados ao post (Galeria de fotos ou PDFs para download).';


-- 4. Banners do App / Site (Destaques)
-- Gerencia o "Carrossel" da Home
CREATE TABLE communication.banners (
    banner_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    title VARCHAR(150),              -- Título interno
    image_desktop_url VARCHAR(255),  -- Banner largo
    image_mobile_url VARCHAR(255),   -- Banner alto (para celular)
    
    target_link VARCHAR(255),        -- Para onde vai ao clicar? (Link interno ou externo)
    
    start_date TIMESTAMP,            -- Quando começa a aparecer?
    end_date TIMESTAMP,              -- Quando some automaticamente?
    
    display_order INT DEFAULT 0,     -- Ordem no slide
    is_active BOOLEAN DEFAULT TRUE
);

-- Documentação Tabela Banners
COMMENT ON TABLE communication.banners IS 'Gestão de publicidade interna. Controla os slides da página inicial do App/Site.';
COMMENT ON COLUMN communication.banners.target_link IS 'Deep link para área do app (ex: /app/doacao) ou URL externa.';

-- ==========================================================
-- SCRIPT DE POPULAÇÃO (SEED) - ARQUITETURA V2.0
-- ==========================================================

-- ----------------------------------------------------------
-- 1. ORGANIZATION (A IGREJA E SALAS)
-- ----------------------------------------------------------
INSERT INTO organization.organizations (org_id, org_type, legal_name, display_name, tax_id, diocese_name, patron_saint, phone_main)
VALUES 
(1, 'PARISH', 'Mitra Arquidiocesana - Paróquia São José', 'Paróquia São José Operário', '12.345.678/0001-99', 'Diocese de Ribeirão', 'São José', '(16) 3636-1010');

INSERT INTO organization.locations (location_id, org_id, name, capacity, has_ac, has_ceiling_fan, resources_detail)
VALUES 
(1, 1, 'Igreja Matriz', 400, FALSE, TRUE, '{"som": true, "projetor": true}'),
(2, 1, 'Salão Paroquial', 200, TRUE, FALSE, '{"cozinha": true, "palco": true}'),
(3, 1, 'Sala 1 - Catequese', 30, FALSE, TRUE, '{"quadro": true}'),
(4, 1, 'Sala 2 - Catequese', 30, FALSE, TRUE, '{"quadro": true}');


-- ----------------------------------------------------------
-- 2. PEOPLE (CARGOS E PESSOAS)
-- ----------------------------------------------------------
-- Cargos
INSERT INTO people.roles (role_id, role_name, description_pt, is_clergy, is_administrative, is_student) VALUES
(1, 'PRIEST', 'Pároco', TRUE, TRUE, FALSE),
(2, 'SECRETARY', 'Secretária(o)', FALSE, TRUE, FALSE),
(3, 'CATECHIST', 'Catequista', FALSE, TRUE, FALSE),
(4, 'STUDENT', 'Catequizando', FALSE, FALSE, TRUE),
(5, 'PARENT', 'Responsável/Pai', FALSE, FALSE, FALSE),
(6, 'VENDOR', 'Barraqueiro', FALSE, FALSE, FALSE);

-- Pessoas
INSERT INTO people.persons (person_id, org_id_origin, full_name, religious_name, gender, birth_date, email, is_pcd, pcd_details) VALUES
-- 1. O Padre
(1, 1, 'Roberto Ferreira', 'Pe. Beto', 'M', '1975-05-20', 'padre.beto@trilha.com', FALSE, NULL),
-- 2. A Secretária
(2, 1, 'Maria de Lurdes', NULL, 'F', '1980-03-10', 'sec.maria@trilha.com', FALSE, NULL),
-- 3. A Catequista
(3, 1, 'Ana Clara Silva', NULL, 'F', '1995-08-15', 'ana.catequese@trilha.com', FALSE, NULL),
-- 4. O Pai (Doador)
(4, 1, 'José da Silva', NULL, 'M', '1982-01-01', 'jose.pai@gmail.com', FALSE, NULL),
-- 5. O Aluno (Filho do José)
(5, 1, 'Enzo Gabriel Silva', NULL, 'M', '2015-02-10', NULL, FALSE, NULL),
-- 6. A Aluna PCD
(6, 1, 'Valentina Santos', NULL, 'F', '2014-11-05', 'mae.valentina@gmail.com', TRUE, 'Deficiência Auditiva Leve'),
-- 7. O Barraqueiro
(7, 1, 'Carlos do Pastel', NULL, 'M', '1970-06-20', NULL, FALSE, NULL);

-- Vínculos de Função
INSERT INTO people.person_roles (person_id, org_id, role_id) VALUES
(1, 1, 1), -- Pe. Beto é Pároco
(2, 1, 2), -- Maria é Secretária
(3, 1, 3), -- Ana é Catequista
(4, 1, 5), -- José é Pai
(5, 1, 4), -- Enzo é Aluno
(6, 1, 4), -- Valentina é Aluna
(7, 1, 6); -- Carlos é Barraqueiro

-- Vínculos Familiares (NOVO!)
INSERT INTO people.family_ties (person_id, relative_id, relationship_type, is_legal_guardian) VALUES
(5, 4, 'FATHER', TRUE); -- José é pai do Enzo


-- ----------------------------------------------------------
-- 3. EDUCATION (ESCOLA)
-- ----------------------------------------------------------
-- Disciplinas
INSERT INTO education.subjects (subject_id, org_id, name) VALUES 
(1, 1, 'Novo Testamento'),
(2, 1, 'Orações e Ritos');

-- Curso
INSERT INTO education.courses (course_id, org_id, name, min_age, max_age) VALUES 
(1, 1, 'Eucaristia I', 9, 12);

-- Grade (O curso tem essas matérias)
INSERT INTO education.curriculum (course_id, subject_id, workload_hours) VALUES 
(1, 1, 20), (1, 2, 10);

-- Turma
INSERT INTO education.classes (class_id, course_id, org_id, main_location_id, coordinator_id, name, year_cycle, status) VALUES 
(1, 1, 1, 3, 3, 'Turma Sábado Manhã', 2025, 'ACTIVE');

-- Horário (Sábado 09:00 na Sala 1)
INSERT INTO education.class_schedules (class_id, week_day, start_time, end_time, subject_id, location_id, instructor_id) VALUES 
(1, 6, '09:00:00', '10:30:00', 1, 3, 3);

-- Matrículas
INSERT INTO education.enrollments (class_id, student_id, status) VALUES 
(1, 5, 'ACTIVE'), -- Enzo
(1, 6, 'ACTIVE'); -- Valentina

-- Diário de Classe (Aula passada)
INSERT INTO education.class_sessions (session_id, class_id, date_held, topic_taught) VALUES 
(1, 1, CURRENT_DATE - INTERVAL '7 days', 'Introdução aos Evangelhos');

-- Chamada
INSERT INTO education.attendance (session_id, student_id, is_present) VALUES 
(1, 5, TRUE),  -- Enzo veio
(1, 6, FALSE); -- Valentina faltou


-- ----------------------------------------------------------
-- 4. SACRAMENTS (CARTÓRIO)
-- ----------------------------------------------------------
INSERT INTO sacraments.registry_books (book_id, org_id, sacrament_type, book_number, status) VALUES 
(1, 1, 'BAPTISM', 'Livro 10-A', 'OPEN');

-- Registro de Batismo do Enzo (feito anos atrás)
INSERT INTO sacraments.baptisms (org_id, person_id, celebrant_id, celebration_date, godfather_name, book_id, page_number, entry_number) VALUES 
(1, 5, 1, '2016-05-20', 'Padrinho Exemplo', 1, '50', '1002');


-- ----------------------------------------------------------
-- 5. PASTORAL (LITURGIA)
-- ----------------------------------------------------------
INSERT INTO pastoral.celebration_types (type_id, org_id, name) VALUES (1, 1, 'Santa Missa');

-- Missa Agendada para amanhã
INSERT INTO pastoral.celebrations (celebration_id, org_id, type_id, date_time, location_id, main_celebrant_id, status) VALUES 
(1, 1, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', 1, 1, 'SCHEDULED');

-- Intenção de Missa (Paga pelo pai do Enzo)
INSERT INTO pastoral.mass_intentions (celebration_id, requested_by_person_id, target_name, intention_type, donation_amount, is_paid) VALUES 
(1, 4, 'Pela saúde da família Silva', 'HEALTH', 20.00, TRUE);


-- ----------------------------------------------------------
-- 6. FINANCE (TESOURARIA)
-- ----------------------------------------------------------
INSERT INTO finance.accounts (account_id, org_id, name, current_balance) VALUES 
(1, 1, 'Conta Corrente Principal', 10000.00),
(2, 1, 'Cofre Secretaria', 500.00);

INSERT INTO finance.categories (category_id, org_id, name, type) VALUES 
(1, 1, 'Dízimo', 'INCOME'),
(2, 1, 'Taxas/Emolumentos', 'INCOME'),
(3, 1, 'Energia Elétrica', 'EXPENSE');

-- Transação: Dízimo do José
INSERT INTO finance.transactions (org_id, account_id, category_id, person_id, description, amount, transaction_type, due_date, payment_date) VALUES 
(1, 1, 1, 4, 'Dízimo Março', 100.00, 'CREDIT', CURRENT_DATE, CURRENT_DATE);


-- ----------------------------------------------------------
-- 7. EVENTS_COMMERCE (FESTAS)
-- ----------------------------------------------------------
-- Evento
INSERT INTO events_commerce.events (event_id, org_id, name, start_date, status) VALUES 
(1, 1, 'Quermesse 2025', CURRENT_TIMESTAMP, 'ACTIVE');

-- Barraca do Pastel (Carlos é o responsável, 15% pra igreja)
INSERT INTO events_commerce.vendors (vendor_id, event_id, name, responsible_person_id, commission_rate) VALUES 
(1, 1, 'Barraca do Pastel', 7, 15.00);

-- Produto
INSERT INTO events_commerce.products (product_id, vendor_id, name, unit_price) VALUES 
(1, 1, 'Pastel Carne', 10.00);

-- Cartão Cashless (José carregou R$ 50)
INSERT INTO events_commerce.cards (card_id, org_id, person_id, display_code, current_balance) VALUES 
(1, 1, 4, 'CARD-001', 50.00);

-- Transação 1: José compra 1 Pastel (R$ 10,00)
-- Igreja ganha 1.50 (15%), Carlos ganha 8.50
INSERT INTO events_commerce.transactions (card_id, vendor_id, transaction_type, amount, church_fee_amount, vendor_net_amount, products_json) VALUES 
(1, 1, 'PURCHASE', 10.00, 1.50, 8.50, '[{"item": "Pastel Carne", "qtd": 1, "price": 10.00}]');

-- Atualiza saldo do cartão (simulação)
UPDATE events_commerce.cards SET current_balance = 40.00 WHERE card_id = 1;


-- ----------------------------------------------------------
-- 8. COMMUNICATION (BLOG)
-- ----------------------------------------------------------
INSERT INTO communication.categories (category_id, org_id, name, slug) VALUES 
(1, 1, 'Avisos', 'avisos');

INSERT INTO communication.posts (org_id, author_id, category_id, title, slug, summary, content_html, is_published) VALUES 
(1, 1, 1, 'Bem-vindos ao Trilha da Fé', 'bem-vindos', 'Lançamento do sistema.', '<p>Olá mundo!</p>', TRUE);