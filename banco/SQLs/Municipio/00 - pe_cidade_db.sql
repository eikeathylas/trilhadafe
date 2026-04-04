-- ==========================================================
-- SCRIPT MESTRE: TRILHA DA FÉ - BANCO DE DADOS (FINAL IDEAL V5.0)
-- ARQUIVO: database_schema_final.sql
-- DESCRIÇÃO: Estrutura completa reestruturada para suportar o Roadmap Estratégico.
-- INCLUI: Módulos de Catequese, Sacramentos, Financeiro, Eventos,
-- Comunicação, Assistente IA (GuIA), Ação Social (Cáritas),
-- Geolocalização, LGPD e Certificados.
-- ==========================================================

-- ==========================================================
-- 1. LIMPEZA E PREPARAÇÃO DE SCHEMAS
-- ==========================================================
DROP SCHEMA IF EXISTS public CASCADE;           -- Core Global / Permissões
DROP SCHEMA IF EXISTS communication CASCADE;    -- Marketing, Notificações e IA (GuIA)
DROP SCHEMA IF EXISTS events_commerce CASCADE;  -- Festas, Cashless e Loja Permanente
DROP SCHEMA IF EXISTS finance CASCADE;          -- Tesouraria e Dízimo Digital
DROP SCHEMA IF EXISTS pastoral CASCADE;         -- Liturgia e Missas
DROP SCHEMA IF EXISTS sacraments CASCADE;       -- Cartório (Batismo, Casamento)
DROP SCHEMA IF EXISTS education CASCADE;        -- Catequese, Diário e Certificados
DROP SCHEMA IF EXISTS security CASCADE;         -- Auditoria, Logs e LGPD
DROP SCHEMA IF EXISTS people CASCADE;           -- CRM (Pessoas e Famílias)
DROP SCHEMA IF EXISTS organization CASCADE;     -- Estrutura Física e Geolocalização
DROP SCHEMA IF EXISTS social CASCADE;           -- Ação Social (Cáritas)

CREATE SCHEMA organization;
CREATE SCHEMA people;
CREATE SCHEMA security; 
CREATE SCHEMA education;
CREATE SCHEMA sacraments;
CREATE SCHEMA pastoral;
CREATE SCHEMA finance;
CREATE SCHEMA events_commerce;
CREATE SCHEMA communication;
CREATE SCHEMA social;
CREATE SCHEMA public;

-- Extensões Úteis para UUIDs (Necessário para Certificados e Cashless)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- SCHEMA: ORGANIZATION
-- ==========================================================

CREATE TYPE organization.org_type_enum AS ENUM ('PARISH', 'DIOCESE', 'CHAPEL', 'CONVENT', 'MONASTERY', 'SEMINARY', 'CURIA', 'RETREAT_HOUSE');

CREATE TABLE organization.organizations (
    org_id SERIAL PRIMARY KEY,
    parent_org_id INT REFERENCES organization.organizations(org_id),
    
    org_type organization.org_type_enum NOT NULL DEFAULT 'PARISH',
    legal_name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20), 
    diocese_name VARCHAR(200),
    patron_saint VARCHAR(150),
    decree_number VARCHAR(50),
    
    phone_main VARCHAR(20),
    phone_secondary VARCHAR(20),
    email_contact VARCHAR(150),
    website_url VARCHAR(255),
    logo_url VARCHAR(255), 
    
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    address_city VARCHAR(100),
    address_state CHAR(2),
    zip_code VARCHAR(20),
    latitude NUMERIC(10,8),   
    longitude NUMERIC(11,8),  
    
    foundation_date DATE,
    closure_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE organization.organizations IS 'Cadastro das unidades eclesiásticas (Paróquias, Capelas, Dioceses). Suporta geolocalização.';
COMMENT ON COLUMN organization.organizations.parent_org_id IS 'Hierarquia: Se for uma Capela, aponta para a Paróquia Matriz.';
COMMENT ON COLUMN organization.organizations.latitude IS 'Coordenada Y para plotagem no mapa de paróquias/doações.';
CREATE INDEX idx_org_parent ON organization.organizations(parent_org_id);

CREATE TABLE organization.locations (
    location_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    responsible_id INT, -- FK criada via ALTER TABLE após people.persons
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    capacity INT DEFAULT 0,
    
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_district VARCHAR(100),
    zip_code VARCHAR(20),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    
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
COMMENT ON TABLE organization.locations IS 'Espaços físicos gerenciáveis (Salas de Aula, Igreja, Salão).';
COMMENT ON COLUMN organization.locations.is_consecrated IS 'Define se o local é sagrado (restringe uso para eventos profanos).';

CREATE TABLE organization.events (
    event_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_academic_blocker BOOLEAN DEFAULT FALSE, 
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE organization.events IS 'Agenda oficial e calendário base da paróquia (Ex: Padroeiro, Feriados). Pode bloquear aulas.';

-- ==========================================================
-- SCHEMA: PEOPLE
-- ==========================================================

CREATE TABLE people.persons (
    person_id SERIAL PRIMARY KEY,
    org_id_origin INT REFERENCES organization.organizations(org_id),
    
    full_name VARCHAR(200) NOT NULL,
    religious_name VARCHAR(150),
    birth_date DATE,
    gender CHAR(1),
    tax_id VARCHAR(20),      
    national_id VARCHAR(20), 
    nationality VARCHAR(50) DEFAULT 'Brasileira',
    place_of_birth VARCHAR(100),
    civil_status VARCHAR(20),
    
    email VARCHAR(150),
    phone_mobile VARCHAR(20),
    phone_landline VARCHAR(20),
    wants_whatsapp_group BOOLEAN DEFAULT FALSE,
    
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
    eucharist_date DATE,
    eucharist_place VARCHAR(255),
    
    deceased BOOLEAN DEFAULT FALSE,
    death_date DATE,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
-- Adiciona FK cruzada de locations
ALTER TABLE organization.locations ADD CONSTRAINT fk_location_responsible FOREIGN KEY (responsible_id) REFERENCES people.persons(person_id);
CREATE INDEX idx_persons_name ON people.persons(full_name);
CREATE INDEX idx_persons_tax_id ON people.persons(tax_id);
COMMENT ON TABLE people.persons IS 'Cadastro único de indivíduos (CRM). Centraliza padres, alunos, pais e fiéis.';

CREATE TABLE people.roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description_pt VARCHAR(100) NOT NULL,
    is_clergy BOOLEAN DEFAULT FALSE,
    is_administrative BOOLEAN DEFAULT FALSE,
    is_student BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE people.roles IS 'Catálogo de funções possíveis no sistema (Padre, Catequista, Aluno).';

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
ALTER TABLE people.person_roles ADD CONSTRAINT unique_person_role UNIQUE (person_id, role_id, org_id);
COMMENT ON TABLE people.person_roles IS 'Associação N:N determinando o que a pessoa é na paróquia (Pai, Aluno, Padre).';

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
CREATE INDEX idx_family_person ON people.family_ties(person_id);
COMMENT ON TABLE people.family_ties IS 'Grafo de parentesco. Essencial para o Portal dos Pais e responsabilidade legal.';

CREATE TABLE people.person_godparents (
    godparent_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    godparent_type VARCHAR(20), 
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    birth_date DATE,
    address TEXT,
    marital_status VARCHAR(20), 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_person_godparent UNIQUE (person_id)
);
COMMENT ON TABLE people.person_godparents IS 'Registro de Padrinho ou Madrinha vinculado a um catequizando/fiel.';

CREATE TABLE people.status_history (
    log_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id),
    
    status_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    reason TEXT,
    document_url VARCHAR(255),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE people.status_history IS 'Log de afastamentos e ocorrências de RH para funcionários/clero.';

CREATE TABLE people.person_attachments (
    attachment_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    uploaded_by INT, 
    
    deleted BOOLEAN DEFAULT FALSE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE people.person_attachments IS 'Documentos digitalizados vinculados à pessoa (RG, Certidões).';

-- ==========================================================
-- SCHEMA: SECURITY (Acessos, Auditoria e LGPD)
-- ==========================================================

CREATE TABLE security.users (
    user_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT REFERENCES people.persons(person_id) ON DELETE SET NULL, 
    
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    force_password_change BOOLEAN DEFAULT FALSE,
    role_level VARCHAR(50) DEFAULT 'USER',
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON security.users(email);
CREATE INDEX idx_users_person ON security.users(person_id);
COMMENT ON TABLE security.users IS 'Tabela de acesso ao sistema (login) local do tenant.';

CREATE TABLE security.privacy_consents (
    consent_id SERIAL PRIMARY KEY,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    accepted_by_user_id INT REFERENCES security.users(user_id),
    
    consent_type VARCHAR(50) NOT NULL DEFAULT 'IMAGE_RIGHTS', -- IMAGE_RIGHTS, DATA_PROCESSING
    terms_version VARCHAR(20) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);
COMMENT ON TABLE security.privacy_consents IS 'Retenção do aceite de LGPD e uso de imagem para alunos e paroquianos (Roadmap).';

CREATE TABLE security.change_logs (
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
CREATE INDEX idx_change_logs_table ON security.change_logs(table_name, record_id);
COMMENT ON TABLE security.change_logs IS 'Audit Trail. Grava snapshot imutável de alterações (Triggers) no banco.';

CREATE TABLE security.error_logs (
    error_id BIGSERIAL PRIMARY KEY,
    org_id INT,
    user_id INT,
    error_code VARCHAR(50),
    error_message TEXT,
    stack_trace TEXT,
    request_uri VARCHAR(255),
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE security.error_logs IS 'Log de erros de aplicação capturados no Backend.';

CREATE TABLE security.access_logs (
    access_id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES security.users(user_id) ON DELETE CASCADE, 
    org_id INT NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'SUCCESS'
);
COMMENT ON TABLE security.access_logs IS 'Histórico de acessos, logins e logouts.';

CREATE TABLE security.push_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES security.users(user_id) ON DELETE CASCADE, 
    endpoint TEXT NOT NULL UNIQUE,
    p256dh_key VARCHAR(255) NOT NULL,
    auth_key VARCHAR(255) NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE security.push_subscriptions IS 'Credenciais do navegador do usuário para disparos de Web Push Notifications.';

-- ==========================================================
-- SCHEMA: EDUCATION (Catequese e Certificados)
-- ==========================================================

CREATE TABLE education.academic_years (
    year_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(50) NOT NULL,
    start_date DATE,
    end_date DATE,
    
    visible_to_teachers BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suporte ao RBAC de usuários condicionado ao Ano Letivo
CREATE TABLE security.users_years (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES security.users(user_id) ON DELETE CASCADE,
    year_id INTEGER NOT NULL REFERENCES education.academic_years(year_id) ON DELETE CASCADE,
    id_profile INTEGER NOT NULL, 
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_user_year UNIQUE (user_id, year_id)
);
CREATE INDEX idx_users_years_user_year ON security.users_years(user_id, year_id, id_profile);

CREATE TABLE education.phases (
    phase_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(150) NOT NULL,
    syllabus_summary TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.phases IS 'Fases da Iniciação Cristã (Ex: Querigma, Catecumenato).';

CREATE TABLE education.courses (
    course_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
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

CREATE TABLE education.curriculum (
    curriculum_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES education.courses(course_id) ON DELETE CASCADE,
    phase_id INT NOT NULL REFERENCES education.phases(phase_id) ON DELETE CASCADE,
    
    workload_hours INT DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT TRUE,
    lesson_plan_template TEXT, 
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE education.curriculum_plans (
    plan_id SERIAL PRIMARY KEY,
    curriculum_id INT NOT NULL REFERENCES education.curriculum(curriculum_id) ON DELETE CASCADE,
    
    meeting_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX idx_curriculum_plans_curr ON education.curriculum_plans(curriculum_id);
COMMENT ON TABLE education.curriculum_plans IS 'Planos de aula detalhados por encontro. Alimenta o Diário Eletrônico.';

CREATE TABLE education.classes (
    class_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES education.courses(course_id) ON DELETE CASCADE,
    year_id INT NOT NULL REFERENCES education.academic_years(year_id) ON DELETE CASCADE,
    
    coordinator_id INT REFERENCES people.persons(person_id) ON DELETE SET NULL,
    class_assistant_id INT REFERENCES people.persons(person_id) ON DELETE SET NULL,
    main_location_id INT REFERENCES organization.locations(location_id) ON DELETE SET NULL,
    
    name VARCHAR(100) NOT NULL,
    shift VARCHAR(20) CHECK (shift IN ('MORNING', 'AFTERNOON', 'NIGHT', 'FULL_TIME')),
    start_time TIME,
    end_time TIME,
    max_capacity INT,
    status VARCHAR(20) DEFAULT 'PLANNED',
    is_graduating_class BOOLEAN DEFAULT FALSE,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE education.classes IS 'Instância de um curso em um ano letivo (Turmas).';

CREATE TABLE education.class_schedules (
    schedule_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id) ON DELETE CASCADE,
    
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    phase_id INT REFERENCES education.phases(phase_id),
    location_id INT REFERENCES organization.locations(location_id),
    instructor_id INT REFERENCES people.persons(person_id),
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education.registration_requests (
    request_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    candidate_name VARCHAR(200) NOT NULL,
    candidate_birth_date DATE,
    parent_name VARCHAR(200),
    parent_contact VARCHAR(100),
    desired_course_id INT REFERENCES education.courses(course_id),
    
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDING',
    rejection_reason TEXT,
    processed_by_user_id INT REFERENCES security.users(user_id),
    created_student_id INT REFERENCES people.persons(person_id),
    
    deleted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP
);

CREATE TABLE education.enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    final_grade NUMERIC(5,2),
    final_result VARCHAR(20),
    notes TEXT,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX idx_enroll_student ON education.enrollments(student_id);

CREATE TABLE education.enrollment_history (
    history_id BIGSERIAL PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES education.enrollments(enrollment_id) ON DELETE CASCADE,
    
    action_type VARCHAR(50) NOT NULL,
    action_date DATE DEFAULT CURRENT_DATE,
    observation TEXT,
    created_by_user_id INT REFERENCES security.users(user_id),
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE education.class_sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id) ON DELETE CASCADE,
    phase_id INT REFERENCES education.phases(phase_id),
    
    session_date TIMESTAMP NOT NULL,
    description TEXT, 
    content_type VARCHAR(50) DEFAULT 'DOCTRINAL',
    status VARCHAR(20) DEFAULT 'PUBLISHED',
    
    signed_by_user_id INT REFERENCES security.users(user_id),
    signed_at TIMESTAMP,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX idx_sessions_phase ON education.class_sessions(phase_id);
CREATE INDEX idx_sessions_date ON education.class_sessions(session_date);
COMMENT ON TABLE education.class_sessions IS 'Diário de Classe: Registro efetivo de um encontro ministrado.';

CREATE TABLE education.attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_id INT NOT NULL REFERENCES education.class_sessions(session_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    is_present BOOLEAN NOT NULL DEFAULT FALSE,
    absence_type VARCHAR(50),
    justification TEXT,
    student_observation TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT unique_attendance_student UNIQUE (session_id, student_id)
);
CREATE INDEX idx_attendance_session ON education.attendance(session_id);

CREATE TABLE education.assessments (
    assessment_id SERIAL PRIMARY KEY,
    class_id INT NOT NULL REFERENCES education.classes(class_id) ON DELETE CASCADE,
    phase_id INT REFERENCES education.phases(phase_id),
    
    title VARCHAR(150) NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 10.00,
    weight INT DEFAULT 1,
    due_date DATE,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education.student_grades (
    grade_id SERIAL PRIMARY KEY,
    assessment_id INT NOT NULL REFERENCES education.assessments(assessment_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    score_obtained NUMERIC(5,2),
    comments TEXT,
    graded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE education.certificates (
    certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES education.courses(course_id) ON DELETE CASCADE,
    class_id INT REFERENCES education.classes(class_id),
    
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issued_by_user_id INT REFERENCES security.users(user_id),
    pdf_url VARCHAR(255),
    is_valid BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE education.certificates IS 'Emissão e validação autêntica de certificados (Roadmap V2).';

-- ==========================================================
-- SCHEMA: SACRAMENTS (Cartório Paroquial)
-- ==========================================================

CREATE TYPE sacraments.sacrament_type_enum AS ENUM ('BAPTISM', 'CONFIRMATION', 'MARRIAGE', 'DEATH', 'HOLY_ORDERS');

CREATE TABLE sacraments.registry_books (
    book_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
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
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    
    celebration_date DATE NOT NULL,
    celebrant_id INT REFERENCES people.persons(person_id),
    celebrant_text VARCHAR(200),
    godfather_name VARCHAR(200),
    godmother_name VARCHAR(200),
    godfather_id INT REFERENCES people.persons(person_id),
    godmother_id INT REFERENCES people.persons(person_id),
    
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    margin_notes TEXT,
    is_conditional BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.baptisms IS 'Assento do Livro de Batismo.';

CREATE TABLE sacraments.confirmations (
    confirmation_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    
    celebration_date DATE NOT NULL,
    bishop_name VARCHAR(200),
    sponsor_name VARCHAR(200),
    sponsor_id INT REFERENCES people.persons(person_id),
    
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    baptism_place VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.confirmations IS 'Assento do Livro de Crisma.';

CREATE TABLE sacraments.marriages (
    marriage_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    
    husband_id INT NOT NULL REFERENCES people.persons(person_id),
    wife_id INT NOT NULL REFERENCES people.persons(person_id),
    celebrant_id INT REFERENCES people.persons(person_id),
    
    celebration_date DATE NOT NULL,
    witness_1_name VARCHAR(200),
    witness_2_name VARCHAR(200),
    
    civil_registry_date DATE,
    civil_registry_details TEXT,
    
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'VALID',
    annulment_details TEXT,
    margin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE sacraments.marriages IS 'Assento do Livro de Matrimônio.';

CREATE TABLE sacraments.deaths (
    death_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    book_id INT REFERENCES sacraments.registry_books(book_id),
    
    death_date DATE NOT NULL,
    burial_date DATE,
    cemetery_name VARCHAR(200),
    burial_location VARCHAR(100),
    sacraments_received TEXT,
    
    page_number VARCHAR(10),
    entry_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================
-- SCHEMA: PASTORAL (Missas e Visitas)
-- ==========================================================

CREATE TABLE pastoral.celebration_types (
    type_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    default_duration_minutes INT DEFAULT 60,
    allows_intentions BOOLEAN DEFAULT TRUE,
    allows_collections BOOLEAN DEFAULT TRUE
);

CREATE TABLE pastoral.schedules (
    schedule_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    type_id INT NOT NULL REFERENCES pastoral.celebration_types(type_id) ON DELETE CASCADE,
    
    location_id INT REFERENCES organization.locations(location_id),
    celebrant_id INT REFERENCES people.persons(person_id),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE pastoral.celebrations (
    celebration_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
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
COMMENT ON TABLE pastoral.celebrations IS 'Missas e Celebrações da Palavra (Agenda Litúrgica).';

CREATE TABLE pastoral.mass_intentions (
    intention_id BIGSERIAL PRIMARY KEY,
    celebration_id INT NOT NULL REFERENCES pastoral.celebrations(celebration_id) ON DELETE CASCADE,
    requested_by_person_id INT REFERENCES people.persons(person_id),
    
    target_name VARCHAR(255) NOT NULL,
    intention_type VARCHAR(50),
    donation_amount NUMERIC(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id BIGINT, -- Conexão com finance.transactions (resolvido por lógica na app)
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE pastoral.mass_intentions IS 'Intenções de Missa (Sétimo dia, Saúde) geradoras de receitas.';

CREATE TABLE pastoral.pastoral_visits (
    visit_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    priest_id INT NOT NULL REFERENCES people.persons(person_id),
    person_id INT REFERENCES people.persons(person_id),
    
    visit_type VARCHAR(50),
    date_time TIMESTAMP NOT NULL,
    location_type VARCHAR(20),
    address_detail VARCHAR(255),
    notes_private TEXT,
    status VARCHAR(20) DEFAULT 'SCHEDULED'
);


-- ==========================================================
-- SCHEMA: FINANCE (Tesouraria Global e Dízimo)
-- ==========================================================

CREATE TABLE finance.accounts (
    account_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) DEFAULT 'BANK',
    bank_name VARCHAR(50),
    agency_number VARCHAR(20),
    account_number VARCHAR(20),
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE finance.accounts IS 'Contas bancárias, carteiras e cofres da paróquia.';

CREATE TABLE finance.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    parent_category_id INT REFERENCES finance.categories(category_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- INCOME, EXPENSE
    is_system_default BOOLEAN DEFAULT FALSE
);
COMMENT ON TABLE finance.categories IS 'Plano de Contas DRE (Dízimos, Ofertas, Contas a Pagar).';

CREATE TABLE finance.cost_centers (
    center_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    budget_limit NUMERIC(15,2),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE finance.transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    account_id INT NOT NULL REFERENCES finance.accounts(account_id),
    category_id INT NOT NULL REFERENCES finance.categories(category_id),
    cost_center_id INT REFERENCES finance.cost_centers(center_id),
    person_id INT REFERENCES people.persons(person_id),
    
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    transaction_type VARCHAR(20), -- CREDIT, DEBIT
    
    due_date DATE NOT NULL,
    payment_date DATE,
    document_number VARCHAR(50),
    document_url VARCHAR(255),
    
    -- Colunas de Integração de Pagamento Digital (Dízimo Online)
    payment_method VARCHAR(50),      
    gateway_reference VARCHAR(100),  
    gateway_webhook_status JSONB,    
    
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_by_user_id INT REFERENCES security.users(user_id), 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE finance.transactions IS 'Movimentações financeiras (O Livro Caixa). Suporta Integrações de Pagamento.';

CREATE TABLE finance.tithe_profiles (
    profile_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    start_date DATE DEFAULT CURRENT_DATE,
    preferred_day INT,
    committed_value NUMERIC(10,2),
    envelope_number INT,
    
    is_active BOOLEAN DEFAULT TRUE
);
COMMENT ON TABLE finance.tithe_profiles IS 'Cadastro de Dizimistas (Dízimo).';


-- ==========================================================
-- SCHEMA: EVENTS_COMMERCE (Quermesses e Loja Paroquial)
-- ==========================================================

CREATE TABLE events_commerce.events (
    event_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(150) NOT NULL,
    description TEXT,
    event_type VARCHAR(50), 
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    location_id INT REFERENCES organization.locations(location_id),
    external_location_text VARCHAR(255),
    
    expected_audience INT DEFAULT 0,
    expected_expense NUMERIC(15,2) DEFAULT 0.00,
    financial_goal NUMERIC(15,2),
    status VARCHAR(20) DEFAULT 'PLANNED', 
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
COMMENT ON TABLE events_commerce.events IS 'Tabela mestre de eventos, quermesses, bingos e retiros.';

CREATE TABLE events_commerce.event_configs (
    config_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id) ON DELETE CASCADE,
    
    allow_online_sales BOOLEAN DEFAULT TRUE,
    allow_cashless BOOLEAN DEFAULT TRUE,
    currency_symbol VARCHAR(5) DEFAULT 'R$',
    tax_rate_online NUMERIC(5,2) DEFAULT 0.00, 
    max_tickets_per_person INT DEFAULT 5,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events_commerce.ticket_batches (
    batch_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL, 
    description TEXT,
    price NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    quantity_available INT NOT NULL,
    quantity_sold INT DEFAULT 0,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE events_commerce.tickets (
    ticket_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id) ON DELETE CASCADE,
    batch_id INT REFERENCES events_commerce.ticket_batches(batch_id),
    owner_person_id INT REFERENCES people.persons(person_id),
    seller_person_id INT REFERENCES people.persons(person_id), 
    
    guest_name VARCHAR(150), 
    qr_code_hash UUID DEFAULT gen_random_uuid(),
    price_sold NUMERIC(10,2) DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    transaction_id BIGINT, 
    
    checkin_status BOOLEAN DEFAULT FALSE,
    checkin_date TIMESTAMP,
    validated_by_user_id INT REFERENCES security.users(user_id),
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events_commerce.donations_in_kind (
    donation_id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events_commerce.events(event_id) ON DELETE CASCADE,
    donor_person_id INT REFERENCES people.persons(person_id),
    
    item_name VARCHAR(100) NOT NULL,
    quantity NUMERIC(10,2) DEFAULT 1,
    unit_measure VARCHAR(20), 
    
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_by_user_id INT REFERENCES security.users(user_id),
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE events_commerce.cards (
    card_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    person_id INT REFERENCES people.persons(person_id),
    
    card_uuid UUID DEFAULT gen_random_uuid(),
    display_code VARCHAR(50), 
    current_balance NUMERIC(15,2) DEFAULT 0.00,
    
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE events_commerce.cards IS 'Cartões RFID/NFC de consumo pré-pagos (Cashless) de Quermesses.';

CREATE TABLE events_commerce.vendors (
    vendor_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    event_id INT REFERENCES events_commerce.events(event_id) ON DELETE CASCADE,
    responsible_person_id INT REFERENCES people.persons(person_id),
    
    name VARCHAR(100) NOT NULL, 
    is_permanent_store BOOLEAN DEFAULT FALSE, 
    commission_rate NUMERIC(5,2) DEFAULT 0.00, 
    fixed_fee NUMERIC(15,2) DEFAULT 0.00, 
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE events_commerce.vendors IS 'PDVs. Suporta barracas de quermesse E Lojinha Paroquial Permanente (Roadmap V4).';

CREATE TABLE events_commerce.products (
    product_id SERIAL PRIMARY KEY,
    vendor_id INT NOT NULL REFERENCES events_commerce.vendors(vendor_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    stock_quantity INT, 
    is_available BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE
);

CREATE TABLE events_commerce.transactions (
    log_id BIGSERIAL PRIMARY KEY,
    card_id INT NOT NULL REFERENCES events_commerce.cards(card_id) ON DELETE CASCADE,
    vendor_id INT REFERENCES events_commerce.vendors(vendor_id) ON DELETE SET NULL,
    
    transaction_type VARCHAR(20) NOT NULL, 
    amount NUMERIC(15,2) NOT NULL,
    products_json JSONB, 
    
    church_fee_amount NUMERIC(15,2) DEFAULT 0.00, 
    vendor_net_amount NUMERIC(15,2) DEFAULT 0.00, 
    
    operator_user_id INT REFERENCES security.users(user_id), 
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================================
-- SCHEMA: COMMUNICATION E IA (GuIA)
-- ==========================================================

CREATE TABLE communication.categories (
    category_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    color_hex VARCHAR(7),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE communication.posts (
    post_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES people.persons(person_id),
    category_id INT REFERENCES communication.categories(category_id) ON DELETE SET NULL,
    
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
COMMENT ON TABLE communication.posts IS 'CMS: Notícias, Homilias e Avisos do site paroquial/Portal.';

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
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    
    title VARCHAR(150),
    image_desktop_url VARCHAR(255),
    image_mobile_url VARCHAR(255),
    target_link VARCHAR(255),
    
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE communication.notifications (
    notification_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    created_by_user_id INT REFERENCES security.users(user_id), 
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'INFO',
    action_url VARCHAR(500),
    module_context VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE communication.notification_targets (
    target_id SERIAL PRIMARY KEY,
    notification_id INT NOT NULL REFERENCES communication.notifications(notification_id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- ALL, CLASS, PERSON, ROLE
    target_val INT,
    
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE communication.notification_targets IS 'Hierarquia de avisos do Roadmap (Alvo: Todos, Grupos ou Turma).';

CREATE TABLE communication.notification_reads (
    read_id BIGSERIAL PRIMARY KEY,
    notification_id INT NOT NULL REFERENCES communication.notifications(notification_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES security.users(user_id) ON DELETE CASCADE,
    
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE
);
CREATE UNIQUE INDEX idx_notification_reads_unique ON communication.notification_reads(notification_id, user_id);

CREATE TABLE communication.ai_chat_sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id INT NOT NULL REFERENCES security.users(user_id) ON DELETE CASCADE,
    
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    context_module VARCHAR(100)
);
COMMENT ON TABLE communication.ai_chat_sessions IS 'Roadmap V4: Sessões do Assistente de Inteligência Artificial (GuIA).';

CREATE TABLE communication.ai_chat_messages (
    message_id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES communication.ai_chat_sessions(session_id) ON DELETE CASCADE,
    
    role VARCHAR(20) NOT NULL, -- USER, ASSISTANT
    content TEXT NOT NULL,
    tokens_used INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- SCHEMA: SOCIAL (Cáritas Paroquial - Roadmap V4)
-- ==========================================================

CREATE TABLE social.assisted_families (
    family_id SERIAL PRIMARY KEY,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    representative_person_id INT NOT NULL REFERENCES people.persons(person_id) ON DELETE CASCADE,
    
    vulnerability_index NUMERIC(5,2),
    housing_condition VARCHAR(100),
    monthly_income NUMERIC(10,2),
    
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE social.assisted_families IS 'Famílias assistidas pela pastoral social (Cáritas).';

CREATE TABLE social.distributions (
    dist_id BIGSERIAL PRIMARY KEY,
    family_id INT NOT NULL REFERENCES social.assisted_families(family_id) ON DELETE CASCADE,
    org_id INT NOT NULL REFERENCES organization.organizations(org_id) ON DELETE CASCADE,
    delivered_by_user_id INT REFERENCES security.users(user_id),
    
    item_type VARCHAR(100) NOT NULL, -- Ex: Cesta Básica, Remédio
    quantity NUMERIC(10,2) DEFAULT 1,
    distribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE social.distributions IS 'Registro de entregas e ajuda continuada.';

-- ==========================================================
-- SCHEMA: PUBLIC (Configurações Core e Mock do SaaS Global)
-- ==========================================================

CREATE TABLE public.profiles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    status INT DEFAULT 1
);
COMMENT ON TABLE public.profiles IS '[STAFF MOCK] Perfis mestres globais do sistema.';

CREATE TABLE public.features (
    id SERIAL PRIMARY KEY,
    module VARCHAR(50),
    title VARCHAR(100),
    description TEXT
);
COMMENT ON TABLE public.features IS '[STAFF MOCK] Matriz de permissões/funcionalidades.';

CREATE TABLE public.profiles_features (
    id_profile INT REFERENCES public.profiles(id) ON DELETE CASCADE,
    id_feature INT REFERENCES public.features(id) ON DELETE CASCADE,
    PRIMARY KEY (id_profile, id_feature)
);
COMMENT ON TABLE public.profiles_features IS '[STAFF MOCK] Relacionamento Perfil x Permissão.';

-- CREATE TABLE public.users (
--     id SERIAL PRIMARY KEY,
--     name VARCHAR(150) NOT NULL,
--     email VARCHAR(150) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     img VARCHAR(255),
--     active BOOLEAN DEFAULT TRUE,
--     deleted BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- COMMENT ON TABLE public.users IS '[STAFF MOCK] Tabela de autenticação global.';

-- CREATE TABLE public.users_clients_profiles (
--     id SERIAL PRIMARY KEY,
--     id_user INT REFERENCES public.users(id) ON DELETE CASCADE,
--     id_client INT,
--     id_profile INT REFERENCES public.profiles(id),
--     active BOOLEAN DEFAULT TRUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );
-- COMMENT ON TABLE public.users_clients_profiles IS '[STAFF MOCK] Vínculo entre usuário global e a paróquia.';

-- ==========================================================
-- TRIGGERS DE AUDITORIA DE SEGURANÇA (LOG CHANGES)
-- ==========================================================

CREATE OR REPLACE FUNCTION security.log_changes() RETURNS TRIGGER AS $$
DECLARE
    v_record_id TEXT;
    v_pk_column TEXT;
    v_user_id INT;
BEGIN
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::INT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    v_pk_column := TG_ARGV[0];

    IF (TG_OP = 'DELETE') THEN
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING OLD;
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, old_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'DELETE', v_record_id, v_user_id, to_jsonb(OLD));
        RETURN OLD;
        
    ELSIF (TG_OP = 'UPDATE') THEN
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING NEW;
        IF to_jsonb(OLD) IS DISTINCT FROM to_jsonb(NEW) THEN
            INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, old_values, new_values)
            VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'UPDATE', v_record_id, v_user_id, to_jsonb(OLD), to_jsonb(NEW));
        END IF;
        RETURN NEW;
        
    ELSIF (TG_OP = 'INSERT') THEN
        EXECUTE 'SELECT ($1).' || v_pk_column || '::text' INTO v_record_id USING NEW;
        INSERT INTO security.change_logs (schema_name, table_name, operation, record_id, user_id, new_values)
        VALUES (TG_TABLE_SCHEMA, TG_TABLE_NAME, 'INSERT', v_record_id, v_user_id, to_jsonb(NEW));
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 2. TRIGGERS DE AUDITORIA (AUDIT TRAIL COMPLETO V5.0)
-- ============================================================================

-- ==========================================
-- Organização
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_organizations ON organization.organizations;
CREATE TRIGGER audit_trigger_organizations AFTER INSERT OR UPDATE OR DELETE ON organization.organizations FOR EACH ROW EXECUTE FUNCTION security.log_changes('org_id');

DROP TRIGGER IF EXISTS audit_trigger_locations ON organization.locations;
CREATE TRIGGER audit_trigger_locations AFTER INSERT OR UPDATE OR DELETE ON organization.locations FOR EACH ROW EXECUTE FUNCTION security.log_changes('location_id');

DROP TRIGGER IF EXISTS audit_trigger_org_events ON organization.events;
CREATE TRIGGER audit_trigger_org_events AFTER INSERT OR UPDATE OR DELETE ON organization.events FOR EACH ROW EXECUTE FUNCTION security.log_changes('event_id');

-- ==========================================
-- Pessoas e Vínculos
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_persons ON people.persons;
CREATE TRIGGER audit_trigger_persons AFTER INSERT OR UPDATE OR DELETE ON people.persons FOR EACH ROW EXECUTE FUNCTION security.log_changes('person_id');

DROP TRIGGER IF EXISTS audit_trigger_person_roles ON people.person_roles;
CREATE TRIGGER audit_trigger_person_roles AFTER INSERT OR UPDATE OR DELETE ON people.person_roles FOR EACH ROW EXECUTE FUNCTION security.log_changes('link_id');

DROP TRIGGER IF EXISTS audit_trigger_family_ties ON people.family_ties;
CREATE TRIGGER audit_trigger_family_ties AFTER INSERT OR UPDATE OR DELETE ON people.family_ties FOR EACH ROW EXECUTE FUNCTION security.log_changes('tie_id');

DROP TRIGGER IF EXISTS audit_trigger_person_attachments ON people.person_attachments;
CREATE TRIGGER audit_trigger_person_attachments AFTER INSERT OR UPDATE OR DELETE ON people.person_attachments FOR EACH ROW EXECUTE FUNCTION security.log_changes('attachment_id');

DROP TRIGGER IF EXISTS audit_trigger_person_godparents ON people.person_godparents;
CREATE TRIGGER audit_trigger_person_godparents AFTER INSERT OR UPDATE OR DELETE ON people.person_godparents FOR EACH ROW EXECUTE FUNCTION security.log_changes('godparent_id');

DROP TRIGGER IF EXISTS audit_trigger_status_history ON people.status_history;
CREATE TRIGGER audit_trigger_status_history AFTER INSERT OR UPDATE OR DELETE ON people.status_history FOR EACH ROW EXECUTE FUNCTION security.log_changes('log_id');

-- ==========================================
-- Segurança e LGPD
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_users ON security.users;
CREATE TRIGGER audit_trigger_users AFTER INSERT OR UPDATE OR DELETE ON security.users FOR EACH ROW EXECUTE FUNCTION security.log_changes('user_id');

DROP TRIGGER IF EXISTS audit_trigger_users_years ON security.users_years;
CREATE TRIGGER audit_trigger_users_years AFTER INSERT OR UPDATE OR DELETE ON security.users_years FOR EACH ROW EXECUTE FUNCTION security.log_changes('id');

DROP TRIGGER IF EXISTS audit_trigger_privacy_consents ON security.privacy_consents;
CREATE TRIGGER audit_trigger_privacy_consents AFTER INSERT OR UPDATE OR DELETE ON security.privacy_consents FOR EACH ROW EXECUTE FUNCTION security.log_changes('consent_id');

DROP TRIGGER IF EXISTS audit_trigger_push_subscriptions ON security.push_subscriptions;
CREATE TRIGGER audit_trigger_push_subscriptions AFTER INSERT OR UPDATE OR DELETE ON security.push_subscriptions FOR EACH ROW EXECUTE FUNCTION security.log_changes('subscription_id');

-- ==========================================
-- Educação (Catequese)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_academic_years ON education.academic_years;
CREATE TRIGGER audit_trigger_academic_years AFTER INSERT OR UPDATE OR DELETE ON education.academic_years FOR EACH ROW EXECUTE FUNCTION security.log_changes('year_id');

DROP TRIGGER IF EXISTS audit_trigger_phases ON education.phases;
CREATE TRIGGER audit_trigger_phases AFTER INSERT OR UPDATE OR DELETE ON education.phases FOR EACH ROW EXECUTE FUNCTION security.log_changes('phase_id');

DROP TRIGGER IF EXISTS audit_trigger_courses ON education.courses;
CREATE TRIGGER audit_trigger_courses AFTER INSERT OR UPDATE OR DELETE ON education.courses FOR EACH ROW EXECUTE FUNCTION security.log_changes('course_id');

DROP TRIGGER IF EXISTS audit_trigger_curriculum ON education.curriculum;
CREATE TRIGGER audit_trigger_curriculum AFTER INSERT OR UPDATE OR DELETE ON education.curriculum FOR EACH ROW EXECUTE FUNCTION security.log_changes('curriculum_id');

DROP TRIGGER IF EXISTS audit_trigger_curriculum_plans ON education.curriculum_plans;
CREATE TRIGGER audit_trigger_curriculum_plans AFTER INSERT OR UPDATE OR DELETE ON education.curriculum_plans FOR EACH ROW EXECUTE FUNCTION security.log_changes('plan_id');

DROP TRIGGER IF EXISTS audit_trigger_classes ON education.classes;
CREATE TRIGGER audit_trigger_classes AFTER INSERT OR UPDATE OR DELETE ON education.classes FOR EACH ROW EXECUTE FUNCTION security.log_changes('class_id');

DROP TRIGGER IF EXISTS audit_trigger_class_schedules ON education.class_schedules;
CREATE TRIGGER audit_trigger_class_schedules AFTER INSERT OR UPDATE OR DELETE ON education.class_schedules FOR EACH ROW EXECUTE FUNCTION security.log_changes('schedule_id');

DROP TRIGGER IF EXISTS audit_trigger_registration_requests ON education.registration_requests;
CREATE TRIGGER audit_trigger_registration_requests AFTER INSERT OR UPDATE OR DELETE ON education.registration_requests FOR EACH ROW EXECUTE FUNCTION security.log_changes('request_id');

DROP TRIGGER IF EXISTS audit_trigger_enrollments ON education.enrollments;
CREATE TRIGGER audit_trigger_enrollments AFTER INSERT OR UPDATE OR DELETE ON education.enrollments FOR EACH ROW EXECUTE FUNCTION security.log_changes('enrollment_id');

DROP TRIGGER IF EXISTS audit_trigger_enrollment_history ON education.enrollment_history;
CREATE TRIGGER audit_trigger_enrollment_history AFTER INSERT OR UPDATE OR DELETE ON education.enrollment_history FOR EACH ROW EXECUTE FUNCTION security.log_changes('history_id');

DROP TRIGGER IF EXISTS audit_trigger_class_sessions ON education.class_sessions;
CREATE TRIGGER audit_trigger_class_sessions AFTER INSERT OR UPDATE OR DELETE ON education.class_sessions FOR EACH ROW EXECUTE FUNCTION security.log_changes('session_id');

DROP TRIGGER IF EXISTS audit_trigger_attendance ON education.attendance;
CREATE TRIGGER audit_trigger_attendance AFTER INSERT OR UPDATE OR DELETE ON education.attendance FOR EACH ROW EXECUTE FUNCTION security.log_changes('attendance_id');

DROP TRIGGER IF EXISTS audit_trigger_assessments ON education.assessments;
CREATE TRIGGER audit_trigger_assessments AFTER INSERT OR UPDATE OR DELETE ON education.assessments FOR EACH ROW EXECUTE FUNCTION security.log_changes('assessment_id');

DROP TRIGGER IF EXISTS audit_trigger_student_grades ON education.student_grades;
CREATE TRIGGER audit_trigger_student_grades AFTER INSERT OR UPDATE OR DELETE ON education.student_grades FOR EACH ROW EXECUTE FUNCTION security.log_changes('grade_id');

DROP TRIGGER IF EXISTS audit_trigger_certificates ON education.certificates;
CREATE TRIGGER audit_trigger_certificates AFTER INSERT OR UPDATE OR DELETE ON education.certificates FOR EACH ROW EXECUTE FUNCTION security.log_changes('certificate_id');

-- ==========================================
-- Sacramentos (Cartório Paroquial)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_registry_books ON sacraments.registry_books;
CREATE TRIGGER audit_trigger_registry_books AFTER INSERT OR UPDATE OR DELETE ON sacraments.registry_books FOR EACH ROW EXECUTE FUNCTION security.log_changes('book_id');

DROP TRIGGER IF EXISTS audit_trigger_baptisms ON sacraments.baptisms;
CREATE TRIGGER audit_trigger_baptisms AFTER INSERT OR UPDATE OR DELETE ON sacraments.baptisms FOR EACH ROW EXECUTE FUNCTION security.log_changes('baptism_id');

DROP TRIGGER IF EXISTS audit_trigger_confirmations ON sacraments.confirmations;
CREATE TRIGGER audit_trigger_confirmations AFTER INSERT OR UPDATE OR DELETE ON sacraments.confirmations FOR EACH ROW EXECUTE FUNCTION security.log_changes('confirmation_id');

DROP TRIGGER IF EXISTS audit_trigger_marriages ON sacraments.marriages;
CREATE TRIGGER audit_trigger_marriages AFTER INSERT OR UPDATE OR DELETE ON sacraments.marriages FOR EACH ROW EXECUTE FUNCTION security.log_changes('marriage_id');

DROP TRIGGER IF EXISTS audit_trigger_deaths ON sacraments.deaths;
CREATE TRIGGER audit_trigger_deaths AFTER INSERT OR UPDATE OR DELETE ON sacraments.deaths FOR EACH ROW EXECUTE FUNCTION security.log_changes('death_id');

-- ==========================================
-- Pastoral (Liturgia)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_pastoral_schedules ON pastoral.schedules;
CREATE TRIGGER audit_trigger_pastoral_schedules AFTER INSERT OR UPDATE OR DELETE ON pastoral.schedules FOR EACH ROW EXECUTE FUNCTION security.log_changes('schedule_id');

DROP TRIGGER IF EXISTS audit_trigger_celebrations ON pastoral.celebrations;
CREATE TRIGGER audit_trigger_celebrations AFTER INSERT OR UPDATE OR DELETE ON pastoral.celebrations FOR EACH ROW EXECUTE FUNCTION security.log_changes('celebration_id');

DROP TRIGGER IF EXISTS audit_trigger_mass_intentions ON pastoral.mass_intentions;
CREATE TRIGGER audit_trigger_mass_intentions AFTER INSERT OR UPDATE OR DELETE ON pastoral.mass_intentions FOR EACH ROW EXECUTE FUNCTION security.log_changes('intention_id');

DROP TRIGGER IF EXISTS audit_trigger_pastoral_visits ON pastoral.pastoral_visits;
CREATE TRIGGER audit_trigger_pastoral_visits AFTER INSERT OR UPDATE OR DELETE ON pastoral.pastoral_visits FOR EACH ROW EXECUTE FUNCTION security.log_changes('visit_id');

-- ==========================================
-- Financeiro e Dízimo
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_accounts ON finance.accounts;
CREATE TRIGGER audit_trigger_accounts AFTER INSERT OR UPDATE OR DELETE ON finance.accounts FOR EACH ROW EXECUTE FUNCTION security.log_changes('account_id');

DROP TRIGGER IF EXISTS audit_trigger_categories ON finance.categories;
CREATE TRIGGER audit_trigger_categories AFTER INSERT OR UPDATE OR DELETE ON finance.categories FOR EACH ROW EXECUTE FUNCTION security.log_changes('category_id');

DROP TRIGGER IF EXISTS audit_trigger_cost_centers ON finance.cost_centers;
CREATE TRIGGER audit_trigger_cost_centers AFTER INSERT OR UPDATE OR DELETE ON finance.cost_centers FOR EACH ROW EXECUTE FUNCTION security.log_changes('center_id');

DROP TRIGGER IF EXISTS audit_trigger_transactions ON finance.transactions;
CREATE TRIGGER audit_trigger_transactions AFTER INSERT OR UPDATE OR DELETE ON finance.transactions FOR EACH ROW EXECUTE FUNCTION security.log_changes('transaction_id');

DROP TRIGGER IF EXISTS audit_trigger_tithe_profiles ON finance.tithe_profiles;
CREATE TRIGGER audit_trigger_tithe_profiles AFTER INSERT OR UPDATE OR DELETE ON finance.tithe_profiles FOR EACH ROW EXECUTE FUNCTION security.log_changes('profile_id');

-- ==========================================
-- Festas, Cashless e Comércio (Events Commerce)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_commerce_events ON events_commerce.events;
CREATE TRIGGER audit_trigger_commerce_events AFTER INSERT OR UPDATE OR DELETE ON events_commerce.events FOR EACH ROW EXECUTE FUNCTION security.log_changes('event_id');

DROP TRIGGER IF EXISTS audit_trigger_event_configs ON events_commerce.event_configs;
CREATE TRIGGER audit_trigger_event_configs AFTER INSERT OR UPDATE OR DELETE ON events_commerce.event_configs FOR EACH ROW EXECUTE FUNCTION security.log_changes('config_id');

DROP TRIGGER IF EXISTS audit_trigger_ticket_batches ON events_commerce.ticket_batches;
CREATE TRIGGER audit_trigger_ticket_batches AFTER INSERT OR UPDATE OR DELETE ON events_commerce.ticket_batches FOR EACH ROW EXECUTE FUNCTION security.log_changes('batch_id');

DROP TRIGGER IF EXISTS audit_trigger_tickets ON events_commerce.tickets;
CREATE TRIGGER audit_trigger_tickets AFTER INSERT OR UPDATE OR DELETE ON events_commerce.tickets FOR EACH ROW EXECUTE FUNCTION security.log_changes('ticket_id');

DROP TRIGGER IF EXISTS audit_trigger_donations ON events_commerce.donations_in_kind;
CREATE TRIGGER audit_trigger_donations AFTER INSERT OR UPDATE OR DELETE ON events_commerce.donations_in_kind FOR EACH ROW EXECUTE FUNCTION security.log_changes('donation_id');

DROP TRIGGER IF EXISTS audit_trigger_cards ON events_commerce.cards;
CREATE TRIGGER audit_trigger_cards AFTER INSERT OR UPDATE OR DELETE ON events_commerce.cards FOR EACH ROW EXECUTE FUNCTION security.log_changes('card_id');

DROP TRIGGER IF EXISTS audit_trigger_vendors ON events_commerce.vendors;
CREATE TRIGGER audit_trigger_vendors AFTER INSERT OR UPDATE OR DELETE ON events_commerce.vendors FOR EACH ROW EXECUTE FUNCTION security.log_changes('vendor_id');

DROP TRIGGER IF EXISTS audit_trigger_products ON events_commerce.products;
CREATE TRIGGER audit_trigger_products AFTER INSERT OR UPDATE OR DELETE ON events_commerce.products FOR EACH ROW EXECUTE FUNCTION security.log_changes('product_id');

DROP TRIGGER IF EXISTS audit_trigger_commerce_transactions ON events_commerce.transactions;
CREATE TRIGGER audit_trigger_commerce_transactions AFTER INSERT OR UPDATE OR DELETE ON events_commerce.transactions FOR EACH ROW EXECUTE FUNCTION security.log_changes('log_id');

-- ==========================================
-- Comunicação e IA (Portal e GuIA)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_comm_categories ON communication.categories;
CREATE TRIGGER audit_trigger_comm_categories AFTER INSERT OR UPDATE OR DELETE ON communication.categories FOR EACH ROW EXECUTE FUNCTION security.log_changes('category_id');

DROP TRIGGER IF EXISTS audit_trigger_comm_posts ON communication.posts;
CREATE TRIGGER audit_trigger_comm_posts AFTER INSERT OR UPDATE OR DELETE ON communication.posts FOR EACH ROW EXECUTE FUNCTION security.log_changes('post_id');

DROP TRIGGER IF EXISTS audit_trigger_comm_attachments ON communication.attachments;
CREATE TRIGGER audit_trigger_comm_attachments AFTER INSERT OR UPDATE OR DELETE ON communication.attachments FOR EACH ROW EXECUTE FUNCTION security.log_changes('attachment_id');

DROP TRIGGER IF EXISTS audit_trigger_comm_banners ON communication.banners;
CREATE TRIGGER audit_trigger_comm_banners AFTER INSERT OR UPDATE OR DELETE ON communication.banners FOR EACH ROW EXECUTE FUNCTION security.log_changes('banner_id');

DROP TRIGGER IF EXISTS audit_trigger_notifications ON communication.notifications;
CREATE TRIGGER audit_trigger_notifications AFTER INSERT OR UPDATE OR DELETE ON communication.notifications FOR EACH ROW EXECUTE FUNCTION security.log_changes('notification_id');

DROP TRIGGER IF EXISTS audit_trigger_notification_targets ON communication.notification_targets;
CREATE TRIGGER audit_trigger_notification_targets AFTER INSERT OR UPDATE OR DELETE ON communication.notification_targets FOR EACH ROW EXECUTE FUNCTION security.log_changes('target_id');

DROP TRIGGER IF EXISTS audit_trigger_notification_reads ON communication.notification_reads;
CREATE TRIGGER audit_trigger_notification_reads AFTER INSERT OR UPDATE OR DELETE ON communication.notification_reads FOR EACH ROW EXECUTE FUNCTION security.log_changes('read_id');

DROP TRIGGER IF EXISTS audit_trigger_ai_chat_sessions ON communication.ai_chat_sessions;
CREATE TRIGGER audit_trigger_ai_chat_sessions AFTER INSERT OR UPDATE OR DELETE ON communication.ai_chat_sessions FOR EACH ROW EXECUTE FUNCTION security.log_changes('session_id');

-- ==========================================
-- Ação Social (Cáritas)
-- ==========================================
DROP TRIGGER IF EXISTS audit_trigger_assisted_families ON social.assisted_families;
CREATE TRIGGER audit_trigger_assisted_families AFTER INSERT OR UPDATE OR DELETE ON social.assisted_families FOR EACH ROW EXECUTE FUNCTION security.log_changes('family_id');

DROP TRIGGER IF EXISTS audit_trigger_social_distributions ON social.distributions;
CREATE TRIGGER audit_trigger_social_distributions AFTER INSERT OR UPDATE OR DELETE ON social.distributions FOR EACH ROW EXECUTE FUNCTION security.log_changes('dist_id');

-- ============================================================================

-- ==========================================================
-- POPULAÇÃO INICIAL (SEED) - ATUALIZADO PARA V5.0 (ROADMAP)
-- ==========================================================

-- 1. Organização (Com Geolocalização)
INSERT INTO organization.organizations (org_id, parent_org_id, org_type, legal_name, display_name, tax_id, diocese_name, patron_saint, phone_main, email_contact, website_url, address_street, address_number, address_district, address_city, address_state, zip_code, latitude, longitude, is_active)
VALUES
(1, NULL, 'DIOCESE', 'Diocese de Caruaru', 'Diocese de Caruaru', '10.426.680/0001-38', 'Diocese de Caruaru', 'Nossa Senhora das Dores', '(81) 3721-0911', 'curia@diocesedecaruaru.org', 'https://diocesedecaruaru.org', 'Rua Bispo Cardoso Ayres', 's/n', 'Centro', 'Caruaru', 'PE', '55002-120', -8.2833, -35.9761, TRUE),
(2, 1, 'PARISH', 'Diocese de Caruaru - Paróquia de Nossa Senhora da Assunção', 'Paróquia de Nossa Senhora da Assunção', '10.426.680/0014-52', 'Diocese de Caruaru', 'Indianópolis', '(81) 2104-1165', '', '', 'R. Alcídes de Farias Leite', 's/n', 'Indianópolis', 'Caruaru', 'PE', '55024-153', -8.2888, -35.9880, TRUE);

INSERT INTO organization.locations (location_id, org_id, name, capacity, has_ac)
VALUES 
(1, 2, 'Igreja Matriz', 400, FALSE),
(2, 2, 'Colégio Jesus Salvador', 200, TRUE);

INSERT INTO organization.events (org_id, title, description, event_date, is_academic_blocker) VALUES 
(2, 'Confraternização Universal', 'Feriado Nacional - Ano Novo', '2026-01-01', TRUE),
(2, 'Carnaval', 'Ponto Facultativo Nacional', '2026-02-17', TRUE),
(2, 'Data Magna de Pernambuco', 'Feriado Estadual (Lei 16.059/17)', '2026-03-06', TRUE),
(2, 'Paixão de Cristo', 'Feriado Nacional Religioso', '2026-04-03', TRUE),
(2, 'Tiradentes', 'Feriado Nacional Civil', '2026-04-21', TRUE),
(2, 'Dia Mundial do Trabalho', 'Feriado Nacional', '2026-05-01', TRUE),
(2, 'Emancipação de Caruaru', 'Feriado Municipal', '2026-05-18', TRUE),
(2, 'Corpus Christi', 'Feriado Municipal em Caruaru e Ponto Facultativo', '2026-06-04', TRUE),
(2, 'São João', 'Feriado Estadual em Pernambuco', '2026-06-24', TRUE),
(2, 'São Pedro', 'Feriado Municipal em Caruaru', '2026-06-29', TRUE),
(2, 'Independência do Brasil', 'Feriado Nacional', '2026-09-07', TRUE),
(2, 'Nossa Senhora das Dores', 'Padroeira de Caruaru - Feriado Municipal', '2026-09-15', TRUE),
(2, 'Nossa Senhora Aparecida', 'Padroeira do Brasil - Feriado Nacional', '2026-10-12', TRUE),
(2, 'Dia do Comerciário', 'Feriado para o setor em Caruaru (Terceira Segunda de Outubro)', '2026-10-19', FALSE),
(2, 'Finados', 'Feriado Nacional Religioso', '2026-11-02', TRUE),
(2, 'Proclamação da República', 'Feriado Nacional', '2026-11-15', TRUE),
(2, 'Consciência Negra', 'Feriado Nacional (Zumbi dos Palmares)', '2026-11-20', TRUE),
(2, 'Natal', 'Feriado Nacional Religioso', '2026-12-25', TRUE);

-- 2. Pessoas e LGPD
INSERT INTO people.roles (role_id, role_name, description_pt, is_clergy, is_administrative, is_student) VALUES
(1, 'PRIEST', 'Clero (Padre/Diácono)', TRUE, TRUE, FALSE),
(2, 'SECRETARY', 'Secretária(o)', FALSE, TRUE, FALSE),
(3, 'CATECHIST', 'Catequista', FALSE, TRUE, FALSE),
(4, 'STUDENT', 'Catequizando (Aluno)', FALSE, FALSE, TRUE),
(5, 'PARENT', 'Responsável / Familiar', FALSE, FALSE, FALSE),
(6, 'VENDOR', 'Lojista', FALSE, FALSE, FALSE);

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

-- LGPD: Aceite de termos pelo responsável
INSERT INTO security.privacy_consents (person_id, consent_type, terms_version, ip_address) VALUES 
(4, 'IMAGE_RIGHTS', 'v1.0', '192.168.1.100');

-- 3. Educação (Catequese)
INSERT INTO education.academic_years (year_id, org_id, name, start_date, end_date, is_active) VALUES
(2026, 2, '2026', '2026-01-01', '2026-12-31', TRUE);

INSERT INTO education.phases (org_id, name, syllabus_summary) VALUES 
(2, 'Querigma', 'Foco no anúncio básico, apresentação de Jesus como amigo e Deus como Pai amoroso, utilizando histórias, recursos visuais e orações simples.'),
(2, 'Catecumenato', 'Aprofundamento na cultura cristã, manuseio da Bíblia, Credo, orações fundamentais (Pai Nosso), os 10 Mandamentos, bem-aventuranças e compreensão da Missa.'),
(2, 'Purificação e Iluminação', 'Foco na espiritualidade, exame de consciência, compreensão da transubstanciação, e preparação para a Primeira Confissão e Eucaristia.'),
(2, 'Mistagogia', 'Pós-eucarística, ensinando a vivenciar o cristianismo no dia a dia e a participar ativamente da comunidade.');

INSERT INTO education.courses (org_id, name, min_age, max_age) VALUES 
(2, 'Primeira Eucaristia', 9, 12);

INSERT INTO education.curriculum (curriculum_id, course_id, phase_id, workload_hours) VALUES 
(1, 1, 2, 40) ON CONFLICT (curriculum_id) DO NOTHING;

INSERT INTO education.curriculum_plans (plan_id, curriculum_id, meeting_number, title, content) VALUES 
(1, 1, 1, 'Deus nos chama pelo nome', '<p>Leitura de Isaías 43,1</p>'),
(2, 1, 2, 'A Criação do Mundo', '<p>Leitura de Gênesis 1</p>');

INSERT INTO education.classes (class_id, course_id, org_id, main_location_id, coordinator_id, name, year_id, max_capacity, status) VALUES 
(1, 1, 2, 2, 3, 'Turma ano I - Sábado Manhã', 2026, 20, 'ACTIVE');

INSERT INTO education.class_schedules (class_id, day_of_week, start_time, end_time, phase_id, location_id, instructor_id) VALUES 
(1, 6, '09:00:00', '10:30:00', 1, 2, 3);

INSERT INTO education.enrollments (class_id, student_id, status) VALUES 
(1, 5, 'ACTIVE'), (1, 6, 'ACTIVE');

INSERT INTO education.class_sessions (session_id, class_id, session_date, description) VALUES 
(1, 1, CURRENT_DATE - INTERVAL '7 days', 'Introdução aos Evangelhos');

INSERT INTO education.attendance (session_id, student_id, is_present) VALUES 
(1, 5, TRUE), (1, 6, FALSE);

INSERT INTO education.registration_requests (org_id, candidate_name, candidate_birth_date, parent_name, parent_contact, desired_course_id, status) VALUES 
(2, 'Lucas da Silva (Site)', '2015-03-10', 'Mãe do Lucas', '1199999999', 1, 'PENDING');

-- 4. Sacramentos
INSERT INTO sacraments.registry_books (book_id, org_id, sacrament_type, book_number, status) VALUES 
(1, 2, 'BAPTISM', 'Livro 10-A', 'OPEN');

INSERT INTO sacraments.baptisms (org_id, person_id, celebrant_id, celebration_date, godfather_name, book_id, page_number, entry_number) VALUES 
(2, 5, 1, '2016-05-20', 'Padrinho Exemplo', 1, '50', '1002');

-- 5. Pastoral e Ação Social (Cáritas)
INSERT INTO pastoral.celebration_types (type_id, org_id, name) VALUES (1, 2, 'Santa Missa');
INSERT INTO pastoral.celebrations (celebration_id, org_id, type_id, date_time, location_id, main_celebrant_id, status) VALUES 
(1, 2, 1, CURRENT_TIMESTAMP + INTERVAL '1 day', 1, 1, 'SCHEDULED');
INSERT INTO pastoral.mass_intentions (celebration_id, requested_by_person_id, target_name, intention_type, donation_amount, is_paid) VALUES 
(1, 4, 'Pela saúde da família Silva', 'HEALTH', 20.00, TRUE);

-- Cáritas: Família Assistida
INSERT INTO social.assisted_families (family_id, org_id, representative_person_id, vulnerability_index, housing_condition, monthly_income) VALUES 
(1, 2, 8, 8.5, 'Alugada', 1200.00);
INSERT INTO social.distributions (family_id, org_id, item_type, quantity, distribution_date) VALUES 
(1, 2, 'Cesta Básica', 1, CURRENT_DATE);

-- 6. Finanças e Dízimo
INSERT INTO finance.accounts (account_id, org_id, name, current_balance) VALUES 
(1, 2, 'Conta Corrente Principal', 10000.00), (2, 2, 'Cofre Secretaria', 500.00);

INSERT INTO finance.categories (category_id, org_id, name, type) VALUES 
(1, 2, 'Dízimo', 'INCOME'), (2, 2, 'Taxas/Emolumentos', 'INCOME'), (3, 2, 'Energia Elétrica', 'EXPENSE');

INSERT INTO finance.tithe_profiles (profile_id, org_id, person_id, preferred_day, committed_value) VALUES 
(1, 2, 4, 10, 100.00);

INSERT INTO finance.transactions (org_id, account_id, category_id, person_id, description, amount, transaction_type, due_date, payment_date) VALUES 
(2, 1, 1, 4, 'Dízimo Março', 100.00, 'CREDIT', CURRENT_DATE, CURRENT_DATE),
(2, 1, 2, 1, 'Compra de Velas (Altar)', 150.00, 'DEBIT', CURRENT_DATE, CURRENT_DATE),
(2, 1, 3, 1, 'Conta de Água', 89.90, 'DEBIT', CURRENT_DATE, CURRENT_DATE);

-- 7. Festas e Loja Paroquial Permanente (Eventos Commerce V5.0)
INSERT INTO events_commerce.events (event_id, org_id, name, start_date, status) VALUES 
(1, 2, 'Quermesse 2026', CURRENT_TIMESTAMP, 'ACTIVE');

INSERT INTO events_commerce.vendors (vendor_id, org_id, event_id, name, responsible_person_id, is_permanent_store, commission_rate) VALUES 
(1, 2, 1, 'Barraca do Pastel', 7, FALSE, 15.00),
(2, 2, NULL, 'Lojinha Paroquial (Secretaria)', 2, TRUE, 0.00);

INSERT INTO events_commerce.products (product_id, vendor_id, name, unit_price) VALUES 
(1, 1, 'Pastel Carne', 10.00),
(2, 2, 'Terço de Madeira', 15.00);

INSERT INTO events_commerce.cards (card_id, org_id, person_id, display_code, current_balance) VALUES 
(1, 2, 4, 'CARD-001', 40.00);

INSERT INTO events_commerce.transactions (card_id, vendor_id, transaction_type, amount, church_fee_amount, vendor_net_amount, products_json) VALUES 
(1, 1, 'PURCHASE', 10.00, 1.50, 8.50, '[{"item": "Pastel Carne", "qtd": 1, "price": 10.00}]');

-- 8. Blog e IA
INSERT INTO communication.categories (category_id, org_id, name, slug) VALUES 
(1, 2, 'Avisos', 'avisos');


-- ==========================================================
-- MOCK SEED: PREENCHIMENTO DO ESQUEMA STAFF (Para Ambiente Local)
-- ==========================================================

INSERT INTO public.profiles (id, title, status) VALUES
(10, 'Fiel / Aluno', 1),
(30, 'Catequista / Professor', 1),
(40, 'Coordenador / Secretaria', 1),
(50, 'Pároco / Administrador', 1),
(99, 'Desenvolvedor / Manager', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.features (id, module, title, description) VALUES
(1, 'USUARIOS', 'Acessar Módulo de Usuários', 'Permite visualizar a lista de acessos e pessoas da paróquia'),
(2, 'USUARIOS', 'Gerenciar Acessos', 'Permite criar, editar, alterar perfis e excluir usuários do sistema'),
(3, 'CATEQUESE', 'Acessar Diário de Classe', 'Permite lançar frequências e preencher conteúdo das aulas'),
(4, 'CATEQUESE', 'Criar Turmas', 'Permite criar novas turmas e associar catequistas e alunos'),
(5, 'FINANCEIRO', 'Acessar Financeiro', 'Permite visualizar o fluxo de caixa, despesas e dízimo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles_features (id_profile, id_feature) VALUES
(99, 1), (99, 2), (99, 3), (99, 4), (99, 5),
(50, 1), (50, 2), (50, 3), (50, 4), (50, 5),
(40, 1), (40, 3), (40, 4),
(30, 3)
ON CONFLICT DO NOTHING;


-- =================================================================
-- AJUSTE DE SEQUÊNCIAS (RESETS - ATUALIZADO V5.0)
-- =================================================================

-- 1. Public (Staff Mock)
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), COALESCE(MAX(id), 1)) FROM public.profiles;
SELECT setval(pg_get_serial_sequence('public.features', 'id'), COALESCE(MAX(id), 1)) FROM public.features;
-- SELECT setval(pg_get_serial_sequence('public.users', 'id'), COALESCE(MAX(id), 1)) FROM public.users;
-- SELECT setval(pg_get_serial_sequence('public.users_clients_profiles', 'id'), COALESCE(MAX(id), 1)) FROM public.users_clients_profiles;

-- 2. Organization
SELECT setval(pg_get_serial_sequence('organization.organizations', 'org_id'), COALESCE(MAX(org_id), 1)) FROM organization.organizations;
SELECT setval(pg_get_serial_sequence('organization.locations', 'location_id'), COALESCE(MAX(location_id), 1)) FROM organization.locations;
SELECT setval(pg_get_serial_sequence('organization.events', 'event_id'), COALESCE(MAX(event_id), 1)) FROM organization.events;

-- 3. People
SELECT setval(pg_get_serial_sequence('people.roles', 'role_id'), COALESCE(MAX(role_id), 1)) FROM people.roles;
SELECT setval(pg_get_serial_sequence('people.persons', 'person_id'), COALESCE(MAX(person_id), 1)) FROM people.persons;
SELECT setval(pg_get_serial_sequence('people.person_godparents', 'godparent_id'), COALESCE(MAX(godparent_id), 1)) FROM people.person_godparents;
SELECT setval(pg_get_serial_sequence('people.family_ties', 'tie_id'), COALESCE(MAX(tie_id), 1)) FROM people.family_ties;

-- 4. Security (LGPD e Usuários)
SELECT setval(pg_get_serial_sequence('security.users', 'user_id'), COALESCE(MAX(user_id), 1)) FROM security.users;
SELECT setval(pg_get_serial_sequence('security.privacy_consents', 'consent_id'), COALESCE(MAX(consent_id), 1)) FROM security.privacy_consents;

-- 5. Education
SELECT setval(pg_get_serial_sequence('education.academic_years', 'year_id'), COALESCE(MAX(year_id), 1)) FROM education.academic_years;
SELECT setval(pg_get_serial_sequence('education.phases', 'phase_id'), COALESCE(MAX(phase_id), 1)) FROM education.phases;
SELECT setval(pg_get_serial_sequence('education.courses', 'course_id'), COALESCE(MAX(course_id), 1)) FROM education.courses;
SELECT setval(pg_get_serial_sequence('education.curriculum', 'curriculum_id'), COALESCE(MAX(curriculum_id), 1)) FROM education.curriculum;
SELECT setval(pg_get_serial_sequence('education.curriculum_plans', 'plan_id'), COALESCE(MAX(plan_id), 1)) FROM education.curriculum_plans;
SELECT setval(pg_get_serial_sequence('education.classes', 'class_id'), COALESCE(MAX(class_id), 1)) FROM education.classes;
SELECT setval(pg_get_serial_sequence('education.class_sessions', 'session_id'), COALESCE(MAX(session_id), 1)) FROM education.class_sessions;
SELECT setval(pg_get_serial_sequence('education.registration_requests', 'request_id'), COALESCE(MAX(request_id), 1)) FROM education.registration_requests;

-- 6. Sacraments
SELECT setval(pg_get_serial_sequence('sacraments.registry_books', 'book_id'), COALESCE(MAX(book_id), 1)) FROM sacraments.registry_books;
SELECT setval(pg_get_serial_sequence('sacraments.baptisms', 'baptism_id'), COALESCE(MAX(baptism_id), 1)) FROM sacraments.baptisms;

-- 7. Pastoral
SELECT setval(pg_get_serial_sequence('pastoral.celebration_types', 'type_id'), COALESCE(MAX(type_id), 1)) FROM pastoral.celebration_types;
SELECT setval(pg_get_serial_sequence('pastoral.celebrations', 'celebration_id'), COALESCE(MAX(celebration_id), 1)) FROM pastoral.celebrations;

-- 8. Finance (Com Dízimo)
SELECT setval(pg_get_serial_sequence('finance.accounts', 'account_id'), COALESCE(MAX(account_id), 1)) FROM finance.accounts;
SELECT setval(pg_get_serial_sequence('finance.categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM finance.categories;
SELECT setval(pg_get_serial_sequence('finance.tithe_profiles', 'profile_id'), COALESCE(MAX(profile_id), 1)) FROM finance.tithe_profiles;
SELECT setval(pg_get_serial_sequence('finance.transactions', 'transaction_id'), COALESCE(MAX(transaction_id), 1)) FROM finance.transactions;

-- 9. Events Commerce (Festas e Lojinha)
SELECT setval(pg_get_serial_sequence('events_commerce.events', 'event_id'), COALESCE(MAX(event_id), 1)) FROM events_commerce.events;
SELECT setval(pg_get_serial_sequence('events_commerce.vendors', 'vendor_id'), COALESCE(MAX(vendor_id), 1)) FROM events_commerce.vendors;
SELECT setval(pg_get_serial_sequence('events_commerce.products', 'product_id'), COALESCE(MAX(product_id), 1)) FROM events_commerce.products;
SELECT setval(pg_get_serial_sequence('events_commerce.cards', 'card_id'), COALESCE(MAX(card_id), 1)) FROM events_commerce.cards;

-- 10. Communication
SELECT setval(pg_get_serial_sequence('communication.categories', 'category_id'), COALESCE(MAX(category_id), 1)) FROM communication.categories;
SELECT setval(pg_get_serial_sequence('communication.notifications', 'notification_id'), COALESCE(MAX(notification_id), 1)) FROM communication.notifications;

-- 11. Social (Cáritas)
SELECT setval(pg_get_serial_sequence('social.assisted_families', 'family_id'), COALESCE(MAX(family_id), 1)) FROM social.assisted_families;