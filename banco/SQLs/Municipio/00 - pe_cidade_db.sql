-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - BANCO LOCAL (V4.0)
-- DATA: 06/02/2026
-- DESCRIÇÃO: Estrutura completa com módulos Acadêmico, Eventos e Anexos.
-- ==========================================================

-- 1. Remove Schemas de Negócio (Ordem de Dependência)
DROP SCHEMA IF EXISTS communication CASCADE;    -- Marketing/Blog
DROP SCHEMA IF EXISTS events_commerce CASCADE;  -- Festas e Vendas
DROP SCHEMA IF EXISTS finance CASCADE;          -- Tesouraria
DROP SCHEMA IF EXISTS pastoral CASCADE;         -- Liturgia
DROP SCHEMA IF EXISTS sacraments CASCADE;       -- Cartório
DROP SCHEMA IF EXISTS education CASCADE;        -- Escola/Catequese

-- 2. Remove Schemas de Segurança e Núcleo
DROP SCHEMA IF EXISTS security CASCADE;         -- Auditoria e Logs
DROP SCHEMA IF EXISTS people CASCADE;           -- CRM (Pessoas)
DROP SCHEMA IF EXISTS organization CASCADE;     -- Estrutura Física

-- 3. Remove Extensões
DROP EXTENSION IF EXISTS "pgcrypto";

-- 4. Recria Schemas
CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS people;
CREATE SCHEMA IF NOT EXISTS security; 
CREATE SCHEMA IF NOT EXISTS education;
CREATE SCHEMA IF NOT EXISTS sacraments;
CREATE SCHEMA IF NOT EXISTS pastoral;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS events_commerce;
CREATE SCHEMA IF NOT EXISTS communication;

-- ==========================================================
-- SCHEMA: ORGANIZATION
-- Responsabilidade: Estrutura Física, Jurídica e Agenda
-- ==========================================================

-- Enum: Tipos de Organização
CREATE TYPE organization.org_type_enum AS ENUM ('PARISH', 'DIOCESE', 'CHAPEL', 'CONVENT', 'MONASTERY', 'SEMINARY', 'CURIA', 'RETREAT_HOUSE');

-- 1. Tabela de Organizações
CREATE TABLE organization.organizations (
    org_id SERIAL PRIMARY KEY,
    parent_org_id INT REFERENCES organization.organizations(org_id),
    
    org_type VARCHAR(50) NOT NULL DEFAULT 'PARISH',
    
    -- Identificação Legal
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20), -- CNPJ
    
    -- Dados Eclesiásticos
    diocese_name VARCHAR(200),
    patron_saint VARCHAR(150),
    decree_number VARCHAR(50),
    foundation_date DATE,
    closure_date DATE,
    
    -- Contatos
    phone_main VARCHAR(20),
    phone_secondary VARCHAR(20),
    email_contact VARCHAR(150),
    website_url VARCHAR(255),
    
    -- Endereço Principal
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    zip_code VARCHAR(20),
    geo_coordinates VARCHAR(50),
    
    -- Controle
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE organization.organizations IS 'Cadastro das unidades eclesiásticas (Paróquias, Capelas, Dioceses).';
COMMENT ON COLUMN organization.organizations.parent_org_id IS 'Hierarquia: Se for uma Capela, aponta para a Paróquia Matriz.';
COMMENT ON COLUMN organization.organizations.decree_number IS 'Número do decreto canônico de criação da paróquia.';
COMMENT ON COLUMN organization.organizations.tax_id IS 'CNPJ da Mitra ou da unidade específica.';

-- 2. Locais e Salas
CREATE TABLE organization.locations (
    location_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 0,
    
    responsible_id INT, -- FK criada via ALTER TABLE depois de PEOPLE
    
    -- Endereço
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    zip_code VARCHAR(20),
    
    -- Atributos
    is_accessible BOOLEAN DEFAULT FALSE,
    is_lodging BOOLEAN DEFAULT FALSE,
    is_consecrated BOOLEAN DEFAULT FALSE,
    has_ac BOOLEAN DEFAULT FALSE,
    has_ceiling_fan BOOLEAN DEFAULT FALSE,

    resources_detail JSONB, 
    photo_url VARCHAR(255),
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- 3. [NOVO] Eventos Paroquiais (Agenda)
CREATE TABLE organization.events (
    event_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) DEFAULT 1,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    
    -- Impacto Acadêmico (Solicitado)
    is_academic_blocker BOOLEAN DEFAULT FALSE, -- TRUE = Bloqueia lançamento de aulas neste dia
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE organization.locations IS 'Espaços físicos gerenciáveis (Salas de Aula, Igreja, Salão).';
COMMENT ON COLUMN organization.locations.is_consecrated IS 'Define se o local é sagrado (restringe uso para eventos profanos).';
COMMENT ON COLUMN organization.locations.resources_detail IS 'JSON com inventário fixo (Ex: {"projetor": true, "cadeiras": 50}).';
COMMENT ON TABLE organization.events IS 'Agenda oficial da paróquia (Ex: Padroeiro, Feriados). Pode bloquear aulas.';

-- ==========================================================
-- SCHEMA: PEOPLE
-- Responsabilidade: Gestão de Pessoas, Vínculos, Famílias e Anexos
-- ==========================================================

-- 1. Pessoas (Tabela Mestra)
CREATE TABLE people.persons (
    person_id SERIAL PRIMARY KEY,
    org_id_origin INT REFERENCES organization.organizations(org_id),
    
    full_name VARCHAR(200) NOT NULL,
    religious_name VARCHAR(150),
    birth_date DATE,
    gender CHAR(1),
    
    tax_id VARCHAR(20),      -- CPF
    national_id VARCHAR(20), -- RG
    
    nationality VARCHAR(50) DEFAULT 'Brasileira',
    place_of_birth VARCHAR(100),
    civil_status VARCHAR(20),
    
    email VARCHAR(150),
    phone_mobile VARCHAR(20),
    phone_landline VARCHAR(20),
    
    zip_code VARCHAR(20),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    
    profile_photo_url VARCHAR(255),
    
    is_pcd BOOLEAN DEFAULT FALSE,
    pcd_details TEXT,
    dietary_restrictions TEXT,

    sacraments_info JSONB,
    
    -- [NOVO] Campos de Eucaristia (Solicitado)
    eucharist_date DATE,
    eucharist_place VARCHAR(255),
    
    deceased BOOLEAN DEFAULT FALSE,
    death_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

ALTER TABLE organization.locations ADD CONSTRAINT fk_location_responsible FOREIGN KEY (responsible_id) REFERENCES people.persons(person_id);

COMMENT ON TABLE people.persons IS 'Cadastro único de indivíduos (CRM). Centraliza dados de padres, alunos, funcionários e fiéis.';
COMMENT ON COLUMN people.persons.religious_name IS 'Nome social ou religioso (Ex: Padre João, Irmã Maria).';
COMMENT ON COLUMN people.persons.sacraments_info IS 'JSON declaratório dos sacramentos recebidos (Ex: {"batismo": true, "crisma": false}).';

-- 2. Cargos e Funções
CREATE TABLE people.roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description_pt VARCHAR(100) NOT NULL,
    is_clergy BOOLEAN DEFAULT FALSE,
    is_administrative BOOLEAN DEFAULT FALSE,
    is_student BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE people.roles IS 'Catálogo de funções possíveis no sistema (Padre, Catequista, Aluno).';

-- 3. Vínculos Pessoa <-> Organização
CREATE TABLE people.person_roles (
    link_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES people.roles(role_id),
    
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
ALTER TABLE people.person_roles ADD CONSTRAINT unique_person_role UNIQUE (person_id, role_id);

COMMENT ON TABLE people.person_roles IS 'Associação N:N. Uma pessoa pode ter múltiplos papéis (Ex: Pai e Catequista).';

-- 4. Vínculos Familiares
CREATE TABLE people.family_ties (
    tie_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    relative_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    relationship_type VARCHAR(50) NOT NULL,
    is_financial_responsible BOOLEAN DEFAULT FALSE,
    is_legal_guardian BOOLEAN DEFAULT FALSE,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE people.family_ties IS 'Grafo de parentesco. Essencial para controle de retirada de alunos.';
COMMENT ON COLUMN people.family_ties.is_legal_guardian IS 'Se TRUE, o parente tem autoridade legal sobre o aluno.';

-- 5. Histórico de Status (RH)
CREATE TABLE people.status_history (
    log_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    status_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    reason TEXT,
    document_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. [NOVO] Anexos e Documentos (Solicitado)
CREATE TABLE people.person_attachments (
    attachment_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT, -- ID do usuário que enviou
    deleted BOOLEAN DEFAULT FALSE
);

COMMENT ON TABLE people.status_history IS 'Log de afastamentos e ocorrências de RH para funcionários/clero.';
COMMENT ON TABLE people.person_attachments IS 'Documentos digitalizados vinculados à pessoa (RG, Certidões).';


-- ==========================================================
-- SCHEMA: EDUCATION
-- Responsabilidade: Gestão Pedagógica, Cursos e Diários
-- ==========================================================

-- 1. Anos Letivos
CREATE TABLE education.academic_years (
    year_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    visible_to_teachers BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE education.academic_years IS 'Ciclos letivos. Agrupa as turmas por período.';

-- 2. Disciplinas
CREATE TABLE education.subjects (
    subject_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(150) NOT NULL,
    syllabus_summary TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.subjects IS 'Matérias ou Temas ensinados.';

-- 3. Cursos
CREATE TABLE education.courses (
    course_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    min_age INT,
    max_age INT,
    total_workload_hours INT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.courses IS 'Produtos educacionais (Ex: Catequese 1ª Eucaristia, Crisma).';

-- 4. Grade Curricular
CREATE TABLE education.curriculum (
    curriculum_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES education.courses(course_id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES education.subjects(subject_id),
    workload_hours INT DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    
    -- [NOVO] Template de Plano de Aula (Solicitado)
    lesson_plan_template TEXT, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

COMMENT ON TABLE education.curriculum IS 'Associação Curso x Disciplina. Define a ementa do curso.';
COMMENT ON COLUMN education.curriculum.lesson_plan_template IS 'Modelo HTML (Summernote) usado como base para novas aulas desta disciplina.';


CREATE TABLE education.curriculum_plans (
    plan_id SERIAL PRIMARY KEY,
    curriculum_id INT NOT NULL REFERENCES education.curriculum(curriculum_id) ON DELETE CASCADE,
    meeting_number INT NOT NULL,
    title VARCHAR(255),
    content TEXT,
    
    -- Campos Padrão de Controle
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_curriculum_plans_curr ON education.curriculum_plans(curriculum_id);
CREATE INDEX idx_curriculum_plans_del ON education.curriculum_plans(deleted);

-- Comentários
COMMENT ON TABLE education.curriculum_plans IS 'Detalhes de cada encontro/aula de uma disciplina.';
COMMENT ON COLUMN education.curriculum_plans.content IS 'Conteúdo HTML do Summernote.';

-- 5. Turmas
CREATE TABLE education.classes (
    class_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES education.courses(course_id),
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    academic_year_id INT NOT NULL REFERENCES education.academic_years(year_id),
    
    main_location_id INT REFERENCES organization.locations(location_id),
    coordinator_id INT REFERENCES people.persons(person_id),
    class_assistant_id INT REFERENCES people.persons(person_id),
    
    name VARCHAR(100) NOT NULL,
    semester INT,
    
    start_date DATE,
    end_date DATE,
    max_capacity INT,
    
    status VARCHAR(20) DEFAULT 'PLANNED',
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.classes IS 'Instância de um curso em um ano letivo.';
COMMENT ON COLUMN education.classes.coordinator_id IS 'Catequista principal responsável pela turma.';
COMMENT ON COLUMN education.classes.class_assistant_id IS 'Auxiliar ou monitor da turma.';

-- 6. Grade Horária Fixa
CREATE TABLE education.class_schedules (
    schedule_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id) ON DELETE CASCADE,
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject_id INT REFERENCES education.subjects(subject_id),
    location_id INT REFERENCES organization.locations(location_id),
    instructor_id INT REFERENCES people.persons(person_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT check_day_of_week CHECK (day_of_week BETWEEN 0 AND 6)
);
COMMENT ON TABLE education.class_schedules IS 'Planejamento semanal fixo (Ex: Todo Sábado às 09:00).';

-- 7. Solicitações de Matrícula
CREATE TABLE education.registration_requests (
    request_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    candidate_name VARCHAR(200) NOT NULL,
    candidate_birth_date DATE,
    parent_name VARCHAR(200),
    parent_contact VARCHAR(100),
    desired_course_id INT REFERENCES education.courses(course_id),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    rejection_reason TEXT,
    processed_by_user_id INT,
    created_student_id INT REFERENCES people.persons(person_id),
    deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.registration_requests IS 'Fila de espera ou inscrições via site.';

-- 8. Matrículas
CREATE TABLE education.enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    final_grade NUMERIC(5,2),
    final_result VARCHAR(20),
    notes TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.enrollments IS 'Vínculo oficial do aluno com a turma.';

-- 9. Histórico Acadêmico
CREATE TABLE education.enrollment_history (
    history_id BIGSERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES education.enrollments(enrollment_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    action_date DATE DEFAULT CURRENT_DATE,
    observation TEXT,
    created_by_user_id INT,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.enrollment_history IS 'Log de alterações de status da matrícula (Auditoria pedagógica).';

-- 10. Diário de Classe: Sessões
CREATE TABLE education.class_sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    subject_id INT REFERENCES education.subjects(subject_id),
    
    session_date TIMESTAMP NOT NULL,
    description TEXT, -- Conteúdo (Aqui entra o Plano de Aula preenchido)
    
    content_type VARCHAR(50) DEFAULT 'DOCTRINAL',
    status VARCHAR(20) DEFAULT 'PUBLISHED',
    
    signed_by_user_id INT,
    signed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT unique_class_date UNIQUE (class_id, session_date)
);
CREATE INDEX idx_sessions_subject ON education.class_sessions(subject_id);
CREATE INDEX idx_sessions_class ON education.class_sessions(class_id);
CREATE INDEX idx_sessions_date ON education.class_sessions(session_date);
ALTER TABLE education.class_sessions ADD CONSTRAINT unique_class_date_subject UNIQUE (class_id, session_date, subject_id);


COMMENT ON TABLE education.class_sessions IS 'Diário de Classe. Representa um dia letivo/encontro.';
COMMENT ON COLUMN education.class_sessions.description IS 'Relatório do que foi ensinado na aula.';
COMMENT ON COLUMN education.class_sessions.signed_by_user_id IS 'Usuário (Catequista) que preencheu o diário.';

-- 11. Diário de Classe: Frequência
CREATE TABLE education.attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES education.class_sessions(session_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    
    absence_type VARCHAR(50),
    justification TEXT,
    student_observation TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    
    CONSTRAINT unique_attendance_student UNIQUE (session_id, student_id)
);
CREATE INDEX idx_attendance_session ON education.attendance(session_id);
CREATE INDEX idx_attendance_student ON education.attendance(student_id);

COMMENT ON TABLE education.attendance IS 'Lista de presença dos alunos em uma sessão específica.';

-- 12. Avaliações
CREATE TABLE education.assessments (
    assessment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id),
    subject_id INT REFERENCES education.subjects(subject_id),
    title VARCHAR(150) NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 10.00,
    weight INT DEFAULT 1,
    due_date DATE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE education.assessments IS 'Provas, Trabalhos ou Atividades avaliativas.';

CREATE TABLE education.student_grades (
    grade_id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES education.assessments(assessment_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id),
    score_obtained NUMERIC(5,2),
    comments TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE education.student_grades IS 'Notas dos alunos nas avaliações.';


-- ==========================================================
-- SCHEMA: SACRAMENTS
-- Responsabilidade: Registro Canônico e Livros de Tombo
-- ==========================================================

CREATE TYPE sacraments.sacrament_type_enum AS ENUM ('BAPTISM', 'CONFIRMATION', 'MARRIAGE', 'DEATH', 'HOLY_ORDERS');

CREATE TABLE sacraments.registry_books (
    book_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    sacrament_type sacraments.sacrament_type_enum NOT NULL,
    book_number VARCHAR(20) NOT NULL,
    opening_date DATE,
    closing_date DATE,
    status VARCHAR(20) DEFAULT 'OPEN',
    location_shelf VARCHAR(50)
);
COMMENT ON TABLE sacraments.registry_books IS 'Livros de Tombo físicos onde são feitos os registros.';

CREATE TABLE sacraments.baptisms (
    baptism_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    celebration_date DATE NOT NULL,
    celebrant_id INT REFERENCES people.persons(person_id),
    celebrant_text VARCHAR(200),
    godfather_name VARCHAR(200),
    godmother_name VARCHAR(200),
    godfather_id INT REFERENCES people.persons(person_id),
    godmother_id INT REFERENCES people.persons(person_id),
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    margin_notes TEXT,
    is_conditional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.baptisms IS 'Assento de Batismo.';

CREATE TABLE sacraments.confirmations (
    confirmation_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    celebration_date DATE NOT NULL,
    bishop_name VARCHAR(200),
    sponsor_name VARCHAR(200),
    sponsor_id INT REFERENCES people.persons(person_id),
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    baptism_place VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.confirmations IS 'Assento de Crisma.';

CREATE TABLE sacraments.marriages (
    marriage_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    husband_id INT NOT NULL REFERENCES people.persons(person_id),
    wife_id INT NOT NULL REFERENCES people.persons(person_id),
    celebration_date DATE NOT NULL,
    celebrant_id INT REFERENCES people.persons(person_id),
    witness_1_name VARCHAR(200),
    witness_2_name VARCHAR(200),
    civil_registry_date DATE,
    civil_registry_details TEXT,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'VALID',
    annulment_details TEXT,
    margin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.marriages IS 'Assento de Matrimônio.';

CREATE TABLE sacraments.deaths (
    death_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    death_date DATE NOT NULL,
    burial_date DATE,
    cemetery_name VARCHAR(200),
    burial_location VARCHAR(100),
    sacraments_received TEXT,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.deaths IS 'Registro de Óbito e Exéquias.';


-- ==========================================================
-- SCHEMA: PASTORAL
-- Responsabilidade: Liturgia, Missas, Intenções e Atendimentos
-- ==========================================================

CREATE TABLE pastoral.celebration_types (
    type_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(100) NOT NULL,
    default_duration_minutes INT DEFAULT 60,
    allows_intentions BOOLEAN DEFAULT TRUE,
    allows_collections BOOLEAN DEFAULT TRUE
);

CREATE TABLE pastoral.schedules (
    schedule_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    type_id INT NOT NULL REFERENCES pastoral.celebration_types(type_id),
    location_id INT REFERENCES organization.locations(location_id),
    celebrant_id INT REFERENCES people.persons(person_id),
    day_of_week INT NOT NULL,
    start_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE pastoral.celebrations (
    celebration_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    type_id INT NOT NULL REFERENCES pastoral.celebration_types(type_id),
    date_time TIMESTAMP NOT NULL,
    location_id INT REFERENCES organization.locations(location_id),
    main_celebrant_id INT REFERENCES people.persons(person_id),
    liturgical_color VARCHAR(20),
    liturgical_feast VARCHAR(150),
    gospel_reference VARCHAR(100),
    homily_summary TEXT,
    attendance_count INT,
    communion_count INT,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);
COMMENT ON TABLE pastoral.celebrations IS 'Eventos litúrgicos (Missas, Celebrações da Palavra).';

CREATE TABLE pastoral.mass_intentions (
    intention_id BIGSERIAL PRIMARY KEY,
    celebration_id INT NOT NULL REFERENCES pastoral.celebrations(celebration_id),
    requested_by_person_id INT REFERENCES people.persons(person_id),
    target_name VARCHAR(255) NOT NULL,
    intention_type VARCHAR(50),
    donation_amount NUMERIC(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE pastoral.mass_intentions IS 'Intenções de Missa (Sétimo dia, Saúde, Graça alcançada).';

CREATE TABLE pastoral.pastoral_visits (
    visit_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    priest_id INT NOT NULL REFERENCES people.persons(person_id),
    person_id INT REFERENCES people.persons(person_id),
    visit_type VARCHAR(50),
    date_time TIMESTAMP NOT NULL,
    location_type VARCHAR(20),
    address_detail VARCHAR(255),
    notes_private TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);
COMMENT ON TABLE pastoral.pastoral_visits IS 'Agenda de visitas do padre (Doentes, Bênçãos).';


-- ==========================================================
-- SCHEMA: FINANCE
-- Responsabilidade: Tesouraria, Dízimo, Contas a Pagar/Receber
-- ==========================================================

CREATE TABLE finance.accounts (
    account_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'BANK',
    bank_name VARCHAR(50),
    agency_number VARCHAR(20),
    account_number VARCHAR(20),
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE finance.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organization.organizations(org_id),
    parent_category_id INT REFERENCES finance.categories(category_id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    is_system_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE finance.cost_centers (
    center_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    budget_limit NUMERIC(15,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE finance.transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    account_id INT NOT NULL REFERENCES finance.accounts(account_id),
    category_id INT NOT NULL REFERENCES finance.categories(category_id),
    cost_center_id INT REFERENCES finance.cost_centers(center_id),
    person_id INT REFERENCES people.persons(person_id),
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(20),
    due_date DATE NOT NULL,
    payment_date DATE,
    document_number VARCHAR(50),
    document_url VARCHAR(255),
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_by_user_id INT, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE finance.transactions IS 'Movimentações financeiras (O Livro Caixa).';

CREATE TABLE finance.tithe_profiles (
    profile_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT NOT NULL REFERENCES people.persons(person_id),
    start_date DATE DEFAULT CURRENT_DATE,
    preferred_day INT,
    committed_value NUMERIC(10,2),
    envelope_number INT,
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE finance.tithe_profiles IS 'Cadastro de Dizimistas e seus compromissos.';


-- ==========================================================
-- SCHEMA: EVENTS_COMMERCE
-- Responsabilidade: Festas, Bingos, Trilhas e Sistema Cashless
-- ==========================================================

CREATE TABLE events_commerce.events (
    event_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    event_type VARCHAR(50),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location_id INT REFERENCES organization.locations(location_id),
    external_location_text VARCHAR(255),
    financial_goal NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'PLANNED'
);

CREATE TABLE events_commerce.tickets (
    ticket_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    owner_person_id INT REFERENCES people.persons(person_id),
    guest_name VARCHAR(150),
    seller_person_id INT REFERENCES people.persons(person_id),
    qr_code_hash UUID DEFAULT gen_random_uuid(),
    batch_name VARCHAR(50),
    price_sold NUMERIC(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id BIGINT,
    validation_date TIMESTAMP,
    validated_by_user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events_commerce.donations_in_kind (
    donation_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    donor_person_id INT REFERENCES people.persons(person_id),
    item_name VARCHAR(100) NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_measure VARCHAR(20),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by_user_id INT
);

CREATE TABLE events_commerce.cards (
    card_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    person_id INT REFERENCES people.persons(person_id),
    card_uuid UUID DEFAULT gen_random_uuid(),
    display_code VARCHAR(50),
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP
);
COMMENT ON TABLE events_commerce.cards IS 'Cartões de consumo (Cashless) para quermesses.';

CREATE TABLE events_commerce.vendors (
    vendor_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id),
    name VARCHAR(100) NOT NULL,
    responsible_person_id INT REFERENCES people.persons(person_id),
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    fixed_fee NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE events_commerce.vendors IS 'Barracas ou Pontos de Venda dentro do evento.';

CREATE TABLE events_commerce.products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES events_commerce.vendors(vendor_id),
    name VARCHAR(100) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    stock_quantity INT,
    is_available BOOLEAN DEFAULT TRUE
);

CREATE TABLE events_commerce.transactions (
    log_id BIGSERIAL PRIMARY KEY,
    card_id INT NOT NULL REFERENCES events_commerce.cards(card_id),
    transaction_type VARCHAR(20) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    vendor_id INT REFERENCES events_commerce.vendors(vendor_id),
    products_json JSONB,
    church_fee_amount NUMERIC(15,2) DEFAULT 0.00,
    vendor_net_amount NUMERIC(15,2) DEFAULT 0.00,
    operator_user_id INT,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================
-- SCHEMA: COMMUNICATION
-- Responsabilidade: Blog, Notícias, Banners do App e Mídia
-- ==========================================================

CREATE TABLE communication.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE communication.categories IS 'Taxonomia para organizar notícias e avisos.';

CREATE TABLE communication.posts (
    post_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    author_id INT NOT NULL REFERENCES people.persons(person_id),
    category_id INT REFERENCES communication.categories(category_id),
    
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    summary TEXT,
    content_html TEXT,
    cover_image_url VARCHAR(255),
    
    status VARCHAR(20) DEFAULT 'DRAFT',
    published_at TIMESTAMP,
    allow_comments BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE communication.posts IS 'CMS: Notícias, Homilias e Avisos.';

CREATE TABLE communication.attachments (
    attachment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES communication.posts(post_id) ON DELETE CASCADE,
    file_url VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    caption VARCHAR(200),
    display_order INT DEFAULT 0
);

CREATE TABLE communication.banners (
    banner_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    title VARCHAR(150),
    image_desktop_url VARCHAR(255),
    image_mobile_url VARCHAR(255),
    target_link VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE communication.banners IS 'Slideshow da Home do Site/App.';

CREATE TABLE communication.notifications (
    notification_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    action_url VARCHAR(500),
    module_context VARCHAR(100),
    
    -- Sem FK, pois um alerta pode ser gerado pelo sistema central ou por um DEV
    created_by_user_id INT, 
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE communication.notifications IS 'Mensagens centrais do sistema. Gravadas apenas 1 vez para economizar espaço.';
COMMENT ON COLUMN communication.notifications.module_context IS 'Identificador do módulo gerador para categorização visual.';

CREATE TABLE communication.notification_targets (
    target_id SERIAL PRIMARY KEY,
    notification_id INT NOT NULL REFERENCES communication.notifications(notification_id) ON DELETE CASCADE,
    
    target_type VARCHAR(50) NOT NULL, -- 'ALL', 'ROLE', 'PERSON'
    target_val INT,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE communication.notification_targets IS 'Define a granularidade da notificação sem duplicar a mensagem principal.';

CREATE TABLE communication.notification_reads (
    read_id BIGSERIAL PRIMARY KEY,
    notification_id INT NOT NULL REFERENCES communication.notifications(notification_id) ON DELETE CASCADE,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_notification_reads_unique ON communication.notification_reads(notification_id, user_id);
CREATE INDEX idx_notification_reads_user ON communication.notification_reads(user_id);
COMMENT ON TABLE communication.notification_reads IS 'Grava apenas quando o usuário abre/lê a notificação para apagar a bolinha vermelha (badge).';

-- ==========================================================
-- SCHEMA: SECURITY LOGS (AUDITORIA FINAL)
-- ==========================================================

CREATE TABLE IF NOT EXISTS security.users (
    user_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) DEFAULT 1,
    person_id INT REFERENCES people.persons(person_id), 
    
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    -- [REMOVIDO] password_hash - Agora somente no Staff DB
    
    role_level VARCHAR(50) DEFAULT 'USER', -- ADMIN, MANAGER, SECRETARY, TEACHER
    is_active BOOLEAN DEFAULT TRUE,
    force_password_change BOOLEAN DEFAULT FALSE,
    
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON security.users(email);
CREATE INDEX IF NOT EXISTS idx_users_person ON security.users(person_id);

COMMENT ON TABLE security.users IS 'Tabela de autenticação (Login). Vinculada a uma Pessoa Física.';
COMMENT ON COLUMN security.users.person_id IS 'Link com o cadastro completo da pessoa.';
COMMENT ON COLUMN security.users.role_level IS 'Nível de permissão no sistema (ACL).';

CREATE TABLE IF NOT EXISTS security.change_logs (
    log_id BIGSERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id TEXT,
    user_id INT, 
    ip_address VARCHAR(45),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE security.change_logs IS 'Audit Trail. Grava snapshot dos dados antes e depois de cada UPDATE/DELETE.';

CREATE TABLE IF NOT EXISTS security.error_logs (
    error_id BIGSERIAL PRIMARY KEY,
    org_id INT,
    user_id INT,
    error_code VARCHAR(50),
    error_message TEXT,
    stack_trace TEXT,
    request_uri VARCHAR(255),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE security.error_logs IS 'Log de erros de aplicação (Backend Catch).';

CREATE TABLE IF NOT EXISTS security.access_logs (
    access_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL, 
    org_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS'
);
COMMENT ON TABLE security.access_logs IS 'Histórico de acessos e logins.';

CREATE TABLE security.push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL, -- Removida a FK
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE security.push_subscriptions IS 'Credenciais do navegador do usuário para disparos nativos de Web Push (Celular/Desktop).';


-- ============================================================================
-- 1. FUNÇÃO DE AUDITORIA (PADRÃO SECURITY)
-- ============================================================================
CREATE OR REPLACE FUNCTION security.log_changes() RETURNS TRIGGER AS $$
DECLARE
    v_record_id TEXT;
    v_pk_column TEXT;
    v_user_id INT;
BEGIN
    -- 1. Tenta identificar o usuário da sessão (Setado pelo PHP)
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    -- 2. Identifica a coluna de ID passada como argumento
    v_pk_column := TG_ARGV[0];

    -- 3. Lógica por Operação
    IF (TG_OP = 'DELETE') THEN
        -- Pega o ID do registro antigo dinamicamente
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING OLD;
        
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, old_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'DELETE', v_record_id, v_user_id, to_jsonb(OLD));
        
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Pega o ID do registro novo
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING NEW;
        
        -- Só registra se houver mudança real nos dados (Ignora updates falsos)
        IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
            INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, old_values, new_values)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'UPDATE', v_record_id, v_user_id, to_jsonb(OLD), to_jsonb(NEW));
        END IF;
        
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        -- Pega o ID do registro novo
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING NEW;
        
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'INSERT', v_record_id, v_user_id, to_jsonb(NEW));
        
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 2. TRIGGERS DE AUDITORIA
-- ============================================================================

-- Organização
DROP TRIGGER IF EXISTS audit_trigger_organizations ON organization.organizations;
CREATE TRIGGER audit_trigger_organizations AFTER INSERT OR UPDATE OR DELETE ON organization.organizations FOR EACH ROW EXECUTE FUNCTION security.log_changes('org_id');

DROP TRIGGER IF EXISTS audit_trigger_locations ON organization.locations;
CREATE TRIGGER audit_trigger_locations AFTER INSERT OR UPDATE OR DELETE ON organization.locations FOR EACH ROW EXECUTE FUNCTION security.log_changes('location_id');

DROP TRIGGER IF EXISTS audit_trigger_org_events ON organization.events;
CREATE TRIGGER audit_trigger_org_events AFTER INSERT OR UPDATE OR DELETE ON organization.events FOR EACH ROW EXECUTE FUNCTION security.log_changes('event_id');

-- Pessoas
DROP TRIGGER IF EXISTS audit_trigger_persons ON people.persons;
CREATE TRIGGER audit_trigger_persons AFTER INSERT OR UPDATE OR DELETE ON people.persons FOR EACH ROW EXECUTE FUNCTION security.log_changes('person_id');

DROP TRIGGER IF EXISTS audit_trigger_person_roles ON people.person_roles;
CREATE TRIGGER audit_trigger_person_roles AFTER INSERT OR UPDATE OR DELETE ON people.person_roles FOR EACH ROW EXECUTE FUNCTION security.log_changes('link_id');

DROP TRIGGER IF EXISTS audit_trigger_family_ties ON people.family_ties;
CREATE TRIGGER audit_trigger_family_ties AFTER INSERT OR UPDATE OR DELETE ON people.family_ties FOR EACH ROW EXECUTE FUNCTION security.log_changes('tie_id');

DROP TRIGGER IF EXISTS audit_trigger_person_attachments ON people.person_attachments;
CREATE TRIGGER audit_trigger_person_attachments AFTER INSERT OR UPDATE OR DELETE ON people.person_attachments FOR EACH ROW EXECUTE FUNCTION security.log_changes('attachment_id');

-- Educacional (Geral)
DROP TRIGGER IF EXISTS audit_trigger_academic_years ON education.academic_years;
CREATE TRIGGER audit_trigger_academic_years AFTER INSERT OR UPDATE OR DELETE ON education.academic_years FOR EACH ROW EXECUTE FUNCTION security.log_changes('year_id');

DROP TRIGGER IF EXISTS audit_trigger_subjects ON education.subjects;
CREATE TRIGGER audit_trigger_subjects AFTER INSERT OR UPDATE OR DELETE ON education.subjects FOR EACH ROW EXECUTE FUNCTION security.log_changes('subject_id');

DROP TRIGGER IF EXISTS audit_trigger_courses ON education.courses;
CREATE TRIGGER audit_trigger_courses AFTER INSERT OR UPDATE OR DELETE ON education.courses FOR EACH ROW EXECUTE FUNCTION security.log_changes('course_id');

DROP TRIGGER IF EXISTS audit_trigger_curriculum ON education.curriculum;
CREATE TRIGGER audit_trigger_curriculum AFTER INSERT OR UPDATE OR DELETE ON education.curriculum FOR EACH ROW EXECUTE FUNCTION security.log_changes('curriculum_id');

-- [NOVO] Trigger para Planos de Aula (Importante para o novo módulo)
DROP TRIGGER IF EXISTS audit_trigger_curriculum_plans ON education.curriculum_plans;
CREATE TRIGGER audit_trigger_curriculum_plans AFTER INSERT OR UPDATE OR DELETE ON education.curriculum_plans FOR EACH ROW EXECUTE FUNCTION security.log_changes('plan_id');

-- Turmas e Diário
DROP TRIGGER IF EXISTS audit_trigger_classes ON education.classes;
CREATE TRIGGER audit_trigger_classes AFTER INSERT OR UPDATE OR DELETE ON education.classes FOR EACH ROW EXECUTE FUNCTION security.log_changes('class_id');

DROP TRIGGER IF EXISTS audit_trigger_class_schedules ON education.class_schedules;
CREATE TRIGGER audit_trigger_class_schedules AFTER INSERT OR UPDATE OR DELETE ON education.class_schedules FOR EACH ROW EXECUTE FUNCTION security.log_changes('schedule_id');

DROP TRIGGER IF EXISTS audit_trigger_enrollments ON education.enrollments;
CREATE TRIGGER audit_trigger_enrollments AFTER INSERT OR UPDATE OR DELETE ON education.enrollments FOR EACH ROW EXECUTE FUNCTION security.log_changes('enrollment_id');

DROP TRIGGER IF EXISTS audit_trigger_class_sessions ON education.class_sessions;
CREATE TRIGGER audit_trigger_class_sessions AFTER INSERT OR UPDATE OR DELETE ON education.class_sessions FOR EACH ROW EXECUTE FUNCTION security.log_changes('session_id');

-- Frequência e Notas
DROP TRIGGER IF EXISTS audit_trigger_attendance ON education.attendance;
CREATE TRIGGER audit_trigger_attendance AFTER INSERT OR UPDATE OR DELETE ON education.attendance FOR EACH ROW EXECUTE FUNCTION security.log_changes('attendance_id');

DROP TRIGGER IF EXISTS audit_trigger_assessments ON education.assessments;
CREATE TRIGGER audit_trigger_assessments AFTER INSERT OR UPDATE OR DELETE ON education.assessments FOR EACH ROW EXECUTE FUNCTION security.log_changes('assessment_id');

DROP TRIGGER IF EXISTS audit_trigger_enrollment_history ON education.enrollment_history;
CREATE TRIGGER audit_trigger_enrollment_history AFTER INSERT OR UPDATE OR DELETE ON education.enrollment_history FOR EACH ROW EXECUTE FUNCTION security.log_changes('history_id');

-- Segurança
DROP TRIGGER IF EXISTS audit_trigger_users ON security.users;
CREATE TRIGGER audit_trigger_users AFTER INSERT OR UPDATE OR DELETE ON security.users FOR EACH ROW EXECUTE FUNCTION security.log_changes('user_id');


-- Triggers de Auditoria
DROP TRIGGER IF EXISTS audit_trigger_notifications ON communication.notifications;
CREATE TRIGGER audit_trigger_notifications 
AFTER INSERT OR UPDATE OR DELETE ON communication.notifications 
FOR EACH ROW EXECUTE FUNCTION security.log_changes('notification_id');

DROP TRIGGER IF EXISTS audit_trigger_notification_targets ON communication.notification_targets;
CREATE TRIGGER audit_trigger_notification_targets 
AFTER INSERT OR UPDATE OR DELETE ON communication.notification_targets 
FOR EACH ROW EXECUTE FUNCTION security.log_changes('target_id');

DROP TRIGGER IF EXISTS audit_trigger_notification_reads ON communication.notification_reads;
CREATE TRIGGER audit_trigger_notification_reads 
AFTER INSERT OR UPDATE OR DELETE ON communication.notification_reads 
FOR EACH ROW EXECUTE FUNCTION security.log_changes('read_id');

DROP TRIGGER IF EXISTS audit_trigger_push_subscriptions ON security.push_subscriptions;
CREATE TRIGGER audit_trigger_push_subscriptions 
AFTER INSERT OR UPDATE OR DELETE ON security.push_subscriptions 
FOR EACH ROW EXECUTE FUNCTION security.log_changes('subscription_id');

-- ==========================================================
-- POPULAÇÃO INICIAL (SEED)
-- ==========================================================

-- 1. Organização
INSERT INTO organization.organizations (org_id, parent_org_id, org_type, legal_name, display_name, tax_id, diocese_name, patron_saint, phone_main)
VALUES 
(1, NULL, 'DIOCESE', 'Diocese Caruaru', 'Diocese Caruaru', '12.345.678/0001-99', 'Diocese de Recife', 'São José', '(16) 3636-1010'),
(2, 1, 'PARISH', 'Mitra Arquidiocesana - Paróquia São José', 'Paróquia São José Operário', '12.345.678/0001-99', 'Diocese de Caruaru', 'São José', '(16) 3636-1010');

INSERT INTO organization.locations (location_id, org_id, name, capacity, has_ac, has_ceiling_fan, resources_detail)
VALUES 
(1, 2, 'Igreja Matriz', 400, FALSE, TRUE, '{"som": true, "projetor": true}'),
(2, 2, 'Salão Paroquial', 200, TRUE, FALSE, '{"cozinha": true, "palco": true}'),
(3, 2, 'Sala 1 - Catequese', 30, FALSE, TRUE, '{"quadro": true}'),
(4, 2, 'Sala 2 - Catequese', 30, FALSE, TRUE, '{"quadro": true}');

-- [NOVO] Eventos Iniciais
INSERT INTO organization.events (org_id, title, description, event_date, is_academic_blocker) VALUES 
(2, 'Padroeiro São José', 'Festa litúrgica solene.', '2026-03-19', TRUE),
(2, 'Corpus Christi', 'Procissão nas ruas.', '2026-06-19', FALSE);

-- 2. Pessoas
INSERT INTO people.roles (role_id, role_name, description_pt, is_clergy, is_administrative, is_student) VALUES
(1, 'PRIEST', 'Clero (Padre/Diácono)', TRUE, TRUE, FALSE),
(2, 'SECRETARY', 'Secretária(o)', FALSE, TRUE, FALSE),
(3, 'CATECHIST', 'Catequista', FALSE, TRUE, FALSE),
(4, 'STUDENT', 'Catequizando (Aluno)', FALSE, FALSE, TRUE),
(5, 'PARENT', 'Responsável / Familiar', FALSE, FALSE, FALSE),
(6, 'VENDOR', 'Barraqueiro', FALSE, FALSE, FALSE);

INSERT INTO people.persons (person_id, org_id_origin, full_name, religious_name, gender, birth_date, email, is_pcd, pcd_details) VALUES
(1, 2, 'Roberto Ferreira', 'Pe. Beto', 'M', '1975-05-20', 'padre.beto@trilha.com', FALSE, NULL),
(2, 2, 'Maria de Lurdes', NULL, 'F', '1980-03-10', 'sec.maria@trilha.com', FALSE, NULL),
(3, 2, 'Ana Clara Silva', NULL, 'F', '1995-08-15', 'ana.catequese@trilha.com', FALSE, NULL),
(4, 2, 'José da Silva', NULL, 'M', '1982-01-01', 'jose.pai@gmail.com', FALSE, NULL),
(5, 2, 'Enzo Gabriel Silva', NULL, 'M', (CURRENT_DATE - INTERVAL '40 years'), NULL, FALSE, NULL),
(6, 2, 'Valentina Santos', NULL, 'F', '2014-11-05', 'mae.valentina@gmail.com', TRUE, 'Deficiência Auditiva Leve'),
(7, 2, 'Carlos do Pastel', NULL, 'M', '1970-06-20', NULL, FALSE, NULL),
(8, 2, 'Maria das Dores', NULL, 'F', (CURRENT_DATE - INTERVAL '40 years'), NULL, FALSE, NULL),
(9, 2, 'Pedro Henrique', NULL, 'M', (CURRENT_DATE - INTERVAL '12 years' + INTERVAL '2 days'), NULL, FALSE, NULL),
(10, 2, 'Irmã Lúcia', NULL, 'F', (CURRENT_DATE - INTERVAL '60 years' - INTERVAL '5 days'), NULL, FALSE, NULL);

INSERT INTO people.person_roles (person_id, org_id, role_id) VALUES
(1, 2, 1), (2, 2, 2), (3, 2, 3), (4, 2, 5), (5, 2, 4), (6, 2, 4), (7, 2, 6), (8, 2, 5), (9, 2, 4), (10, 2, 3);

INSERT INTO people.family_ties (person_id, relative_id, relationship_type, is_legal_guardian) VALUES
(5, 4, 'FATHER', TRUE);

-- 3. Educação
INSERT INTO education.academic_years (year_id, org_id, name, start_date, end_date, is_active) VALUES
(2026, 2, '2026', '2026-01-01', '2026-12-31', FALSE);

INSERT INTO education.subjects (org_id, name, syllabus_summary) VALUES 
(2, 'Novo Testamento', 'Estudo dos Evangelhos e Atos dos Apóstolos.'),
(2, 'Antigo Testamento', 'História da Salvação e Profetas.'),
(2, 'Liturgia Básica', 'Cores litúrgicas, tempos e ritos da Missa.');

INSERT INTO education.courses (org_id, name, min_age, max_age) VALUES 
(2, 'Primeira Eucaristia', 9, 12),
(2, 'Crisma (Jovens)', 14, 18);

-- [NOVO] Grade Curricular com Template de Plano de Aula
INSERT INTO education.curriculum (course_id, subject_id, workload_hours, lesson_plan_template) VALUES 
(1, 1, 30, '<b>ACOLHIDA:</b><br>...'), 
(1, 3, 30, '<b>ACOLHIDA:</b><br>...');

INSERT INTO education.curriculum (course_id, subject_id, workload_hours) VALUES 
(2, 1, 40), (2, 2, 40);

-- Turma (Com Academic Year ID)
INSERT INTO education.classes (class_id, course_id, org_id, main_location_id, coordinator_id, name, academic_year_id, status) VALUES 
(1, 1, 2, 3, 3, 'Turma Sábado Manhã', 2026, 'ACTIVE');

INSERT INTO education.class_schedules (class_id, day_of_week, start_time, end_time, subject_id, location_id, instructor_id) VALUES 
(1, 6, '09:00:00', '10:30:00', 1, 3, 3);

INSERT INTO education.enrollments (class_id, student_id, status) VALUES 
(1, 5, 'ACTIVE'), (1, 6, 'ACTIVE');

-- Diário: Apenas insert do registro mestre
INSERT INTO education.class_sessions (session_id, class_id, session_date, description) VALUES 
(1, 1, CURRENT_DATE - INTERVAL '7 days', 'Introdução aos Evangelhos');

INSERT INTO education.attendance (session_id, student_id, is_present) VALUES 
(1, 5, TRUE), (1, 6, FALSE);

INSERT INTO education.registration_requests (org_id, candidate_name, candidate_birth_date, parent_name, parent_contact, desired_course_id, status) VALUES 
(2, 'Lucas da Silva (Site)', '2015-03-10', 'Mãe do Lucas', '1199999999', 1, 'PENDING'),
(2, 'Júlia Roberta (Site)', '2014-07-20', 'Pai da Júlia', '1188888888', 1, 'PENDING');

-- 4. Sacramentos
INSERT INTO sacraments.registry_books (book_id, org_id, sacrament_type, book_number, status) VALUES 
(1, 2, 'BAPTISM', 'Livro 10-A', 'OPEN');
INSERT INTO sacraments.baptisms (org_id, person_id, celebrant_id, celebration_date, godfather_name, book_id, page_number, entry_number) VALUES 
(2, 5, 1, '2016-05-20', 'Padrinho Exemplo', 1, '50', '1002');

-- 5. Pastoral
INSERT INTO pastoral.celebration_types (type_id, org_id, name) VALUES (1, 2, 'Santa Missa');
INSERT INTO pastoral.celebrations (celebration_id, org_id, type_id, date_time, location_id, main_celebrant_id, status) VALUES 
(1, 2, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', 1, 1, 'SCHEDULED');
INSERT INTO pastoral.mass_intentions (celebration_id, requested_by_person_id, target_name, intention_type, donation_amount, is_paid) VALUES 
(1, 4, 'Pela saúde da família Silva', 'HEALTH', 20.00, TRUE);

-- 6. Finanças
INSERT INTO finance.accounts (account_id, org_id, name, current_balance) VALUES 
(1, 2, 'Conta Corrente Principal', 10000.00), (2, 2, 'Cofre Secretaria', 500.00);
INSERT INTO finance.categories (category_id, org_id, name, type) VALUES 
(1, 2, 'Dízimo', 'INCOME'), (2, 2, 'Taxas/Emolumentos', 'INCOME'), (3, 2, 'Energia Elétrica', 'EXPENSE');
INSERT INTO finance.transactions (org_id, account_id, category_id, person_id, description, amount, transaction_type, due_date, payment_date) VALUES 
(2, 1, 1, 4, 'Dízimo Março', 100.00, 'CREDIT', CURRENT_DATE, CURRENT_DATE),
(2, 1, 2, 1, 'Compra de Velas (Altar)', 150.00, 'DEBIT', CURRENT_DATE, CURRENT_DATE),
(2, 1, 3, 1, 'Conta de Água', 89.90, 'DEBIT', CURRENT_DATE, CURRENT_DATE),
(2, 1, 1, 1, 'Oferta Missa Domingo', 345.50, 'CREDIT', CURRENT_DATE, CURRENT_DATE);

-- 7. Festas
INSERT INTO events_commerce.events (event_id, org_id, name, start_date, status) VALUES 
(1, 2, 'Quermesse 2026', CURRENT_TIMESTAMP, 'ACTIVE');
INSERT INTO events_commerce.vendors (vendor_id, event_id, name, responsible_person_id, commission_rate) VALUES 
(1, 1, 'Barraca do Pastel', 7, 15.00);
INSERT INTO events_commerce.products (product_id, vendor_id, name, unit_price) VALUES 
(1, 1, 'Pastel Carne', 10.00);
INSERT INTO events_commerce.cards (card_id, org_id, person_id, display_code, current_balance) VALUES 
(1, 2, 4, 'CARD-001', 50.00);
INSERT INTO events_commerce.transactions (card_id, vendor_id, transaction_type, amount, church_fee_amount, vendor_net_amount, products_json) VALUES 
(1, 1, 'PURCHASE', 10.00, 1.50, 8.50, '[{"item": "Pastel Carne", "qtd": 1, "price": 10.00}]');
UPDATE events_commerce.cards SET current_balance = 40.00 WHERE card_id = 1;

-- 8. Blog
INSERT INTO communication.categories (category_id, org_id, name, slug) VALUES 
(1, 2, 'Avisos', 'avisos');

-- =================================================================
-- AJUSTE DE SEQUÊNCIAS (RESETS)
-- Executar após os INSERTS manuais para evitar erro de ID duplicado
-- =================================================================

-- 1. Organization
SELECT setval(pg_get_serial_sequence('organization.organizations', 'org_id'), COALESCE(MAX(org_id), 1)) FROM organization.organizations;
SELECT setval(pg_get_serial_sequence('organization.locations', 'location_id'), COALESCE(MAX(location_id), 1)) FROM organization.locations;
-- Nota: 'organization.events' não teve ID manual inserido no script anterior (usou o sequence), mas se quiser garantir:
SELECT setval(pg_get_serial_sequence('organization.events', 'event_id'), COALESCE(MAX(event_id), 1)) FROM organization.events;

-- 2. People
SELECT setval(pg_get_serial_sequence('people.roles', 'role_id'), COALESCE(MAX(role_id), 1)) FROM people.roles;
SELECT setval(pg_get_serial_sequence('people.persons', 'person_id'), COALESCE(MAX(person_id), 1)) FROM people.persons;

-- 3. Education
SELECT setval(pg_get_serial_sequence('education.academic_years', 'year_id'), COALESCE(MAX(year_id), 1)) FROM education.academic_years;
-- education.subjects não teve ID manual, mas por garantia:
SELECT setval(pg_get_serial_sequence('education.subjects', 'subject_id'), COALESCE(MAX(subject_id), 1)) FROM education.subjects;
SELECT setval(pg_get_serial_sequence('education.courses', 'course_id'), COALESCE(MAX(course_id), 1)) FROM education.courses;
SELECT setval(pg_get_serial_sequence('education.classes', 'class_id'), COALESCE(MAX(class_id), 1)) FROM education.classes;
SELECT setval(pg_get_serial_sequence('education.class_sessions', 'session_id'), COALESCE(MAX(session_id), 1)) FROM education.class_sessions;

-- 4. Sacraments
SELECT setval(pg_get_serial_sequence('sacraments.registry_books', 'book_id'), COALESCE(MAX(book_id), 1)) FROM sacraments.registry_books;
-- baptisms usou sequence automático, mas por garantia:
SELECT setval(pg_get_serial_sequence('sacraments.baptisms', 'baptism_id'), COALESCE(MAX(baptism_id), 1)) FROM sacraments.baptisms;

-- 5. Pastoral
SELECT setval(pg_get_serial_sequence('pastoral.celebration_types', 'type_id'), COALESCE(MAX(type_id), 1)) FROM pastoral.celebration_types;
SELECT setval(pg_get_serial_sequence('pastoral.celebrations', 'celebration_id'), COALESCE(MAX(celebration_id), 1)) FROM pastoral.celebrations;

-- 6. Finance
SELECT setval(pg_get_serial_sequence('finance.accounts', 'account_id'), COALESCE(MAX(account_id), 1)) FROM finance.accounts;
SELECT setval(pg_get_serial_sequence('finance.categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM finance.categories;
-- transactions usou sequence automático, mas por garantia:
SELECT setval(pg_get_serial_sequence('finance.transactions', 'transaction_id'), COALESCE(MAX(transaction_id), 1)) FROM finance.transactions;

-- 7. Events Commerce (Festas)
SELECT setval(pg_get_serial_sequence('events_commerce.events', 'event_id'), COALESCE(MAX(event_id), 1)) FROM events_commerce.events;
SELECT setval(pg_get_serial_sequence('events_commerce.vendors', 'vendor_id'), COALESCE(MAX(vendor_id), 1)) FROM events_commerce.vendors;
SELECT setval(pg_get_serial_sequence('events_commerce.products', 'product_id'), COALESCE(MAX(product_id), 1)) FROM events_commerce.products;
SELECT setval(pg_get_serial_sequence('events_commerce.cards', 'card_id'), COALESCE(MAX(card_id), 1)) FROM events_commerce.cards;

-- 8. Communication
SELECT setval(pg_get_serial_sequence('communication.categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM communication.categories;
SELECT setval(pg_get_serial_sequence('communication.notifications', 'notification_id'), COALESCE(MAX(notification_id), 1)) FROM communication.notifications;
SELECT setval(pg_get_serial_sequence('communication.notification_targets', 'target_id'), COALESCE(MAX(target_id), 1)) FROM communication.notification_targets;
SELECT setval(pg_get_serial_sequence('communication.notification_reads', 'read_id'), COALESCE(MAX(read_id), 1)) FROM communication.notification_reads;
SELECT setval(pg_get_serial_sequence('security.push_subscriptions', 'subscription_id'), COALESCE(MAX(subscription_id), 1)) FROM security.push_subscriptions;