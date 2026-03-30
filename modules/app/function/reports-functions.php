<?php

/**
 * TRILHA DA FÉ - Funções de Dados para Relatórios
 * Ajustado para suportar metadados de lotação e coordenação.
 */

function getReportDataF($reportType, $filters)
{
    try {
        switch ($reportType) {
            // --- NOVOS RELATÓRIOS OFICIAIS ---
            case 'lista_estudantes':
                return _reportGenericPeople($filters, 'STUDENT');
            case 'lista_professores':
                return _reportGenericPeople($filters, 'CATECHIST');
            case 'lista_pessoas':
                return _reportGenericPeople($filters, null);
            case 'lista_pendencias':
                return _reportPendencias($filters);
            case 'lista_turmas':
                return _reportTurmas($filters);
            case 'lista_fases':
                return _reportFases($filters);
            case 'lista_encontros':
                return _reportEncontros($filters);

                // --- RELATÓRIOS LEGADOS ---
            case 'pessoas_lista':
                return _reportPessoasLista($filters);

            case 'aniversariantes':
                return _reportAniversariantes($filters);

            case 'lista_presenca':
                return _reportListaPresenca($filters);

            case 'auditoria':
                return _reportAuditoria($filters);

            case 'relatorio_modelo':
                $data = [
                    'list' => [
                        ['full_name' => 'Eike Benízio', 'email' => 'eike@admin.com', 'tax_id' => '123.456.789-00', 'birth_date_fmt' => '03/08/1999', 'phone_mobile' => '(81) 98254-9914', 'is_active' => '1'],
                        ['full_name' => 'Maria Silva', 'email' => 'maria@silva.com', 'tax_id' => '000.000.000-00', 'birth_date_fmt' => '10/05/1985', 'phone_mobile' => '(11) 99999-9999', 'is_active' => '1'],
                        ['full_name' => 'João Inativo', 'email' => '', 'tax_id' => '', 'birth_date_fmt' => '', 'phone_mobile' => '', 'is_active' => '0'],
                    ],
                    'metadata' => []
                ];
                return success("Dados gerados.", $data);

            default:
                return failure("Relatório não implementado: " . $reportType);
        }
    } catch (Exception $e) {
        logSystemError("painel", "reports", "getReportDataF", "exception", $e->getMessage(), $filters);
        return failure("Erro ao processar dados do relatório.");
    }
}

/**
 * Relatório: Lista de Presença / Diário de Classe
 * Agora inclui metadados de lotação, curso e coordenação.
 */
function _reportListaPresenca($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];

        if (!$classId) return failure("Turma não selecionada.");

        // 1. Busca Metadados da Turma (Lotação, Coordenação, Local)
        $sqlMeta = "SELECT 
                        c.name as class_name,
                        co.name as course_name,
                        ay.name as year_name,
                        l.name as location_name,
                        p.full_name as coordinator_name,
                        c.max_capacity,
                        (SELECT COUNT(*) FROM education.enrollments e2 
                         WHERE e2.class_id = c.class_id AND e2.status = 'ACTIVE' AND e2.deleted IS FALSE) as current_enrollments
                    FROM education.classes c
                    JOIN education.courses co ON c.course_id = co.course_id
                    JOIN education.academic_years ay ON c.year_id = ay.year_id
                    LEFT JOIN organization.locations l ON c.main_location_id = l.location_id
                    LEFT JOIN people.persons p ON c.coordinator_id = p.person_id
                    WHERE c.class_id = :cid AND c.deleted IS FALSE";

        $stmtMeta = $conect->prepare($sqlMeta);
        $stmtMeta->execute([':cid' => $classId]);
        $metadata = $stmtMeta->fetch(PDO::FETCH_ASSOC);

        if (!$metadata) return failure("Turma não encontrada.");

        // 2. Busca Lista de Alunos Matriculados
        $sqlStudents = "SELECT 
                            p.full_name,
                            p.person_id
                        FROM education.enrollments e
                        JOIN people.persons p ON e.student_id = p.person_id
                        WHERE e.class_id = :cid 
                        AND e.deleted IS FALSE 
                        AND e.status = 'ACTIVE'
                        ORDER BY p.full_name ASC";

        $stmtStudents = $conect->prepare($sqlStudents);
        $stmtStudents->execute([':cid' => $classId]);
        $students = $stmtStudents->fetchAll(PDO::FETCH_ASSOC);

        // Retorna um objeto híbrido: metadados + lista
        return success("Dados carregados.", [
            'metadata' => $metadata,
            'list' => $students
        ]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportListaPresenca", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar lista de presença.");
    }
}

/**
 * Relatório: Lista Geral de Pessoas
 */
function _reportPessoasLista($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)$data['org_id'];

        $params = [':oid' => $orgId];
        $where = "WHERE p.deleted IS FALSE AND (p.org_id_origin = :oid OR EXISTS (
                    SELECT 1 FROM people.person_roles pr WHERE pr.person_id = p.person_id AND pr.org_id = :oid AND pr.deleted IS FALSE
                  ))";

        if (!empty($data['role'])) {
            $where .= " AND EXISTS (SELECT 1 FROM people.person_roles pr2 JOIN people.roles r ON pr2.role_id = r.role_id 
                        WHERE pr2.person_id = p.person_id AND r.role_name = :role AND pr2.deleted IS FALSE)";
            $params[':role'] = $data['role'];
        }

        $sql = "SELECT p.full_name, p.email, p.phone_mobile, p.is_active,
                (SELECT r.role_name FROM people.person_roles pr3 JOIN people.roles r ON pr3.role_id = r.role_id 
                 WHERE pr3.person_id = p.person_id AND pr3.is_active IS TRUE LIMIT 1) as main_role
                FROM people.persons p $where ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados carregados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportPessoasLista", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar lista de pessoas.");
    }
}

/**
 * Relatório: Aniversariantes do Mês
 */
function _reportAniversariantes($data)
{
    try {
        $conect = $GLOBALS["local"];
        $month = (int)($data['month'] ?? date('m'));

        $sql = "SELECT p.full_name, p.phone_mobile, EXTRACT(DAY FROM p.birth_date) as day,
                (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.birth_date)) as age_turning
                FROM people.persons p
                WHERE p.deleted IS FALSE AND p.is_active IS TRUE
                AND EXTRACT(MONTH FROM p.birth_date) = :m
                ORDER BY day ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute([':m' => $month]);
        return success("Dados carregados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportAniversariantes", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar aniversariantes.");
    }
}

/**
 * Relatório: Log de Auditoria
 */
function _reportAuditoria($data)
{
    try {
        $conect = $GLOBALS["local"];
        $sql = "SELECT cl.operation as action_type, cl.table_name, cl.record_id,
                to_char(cl.changed_at, 'DD/MM/YYYY HH24:MI') as date, COALESCE(u.name, 'Sistema') as user_name
                FROM security.change_logs cl LEFT JOIN security.users u ON cl.user_id = u.user_id
                ORDER BY cl.changed_at DESC LIMIT 100";
        $stmt = $conect->prepare($sql);
        $stmt->execute();
        return success("Logs carregados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportAuditoria", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar auditoria.");
    }
}
/**
 * Gerador de Listagem de Pessoas (Estudantes, Professores, Geral)
 */
function _reportGenericPeople($data, $roleType)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)($data['org_id'] ?? 0);
        $search = $data['search'] ?? '';
        $status = $data['status'] ?? 'ALL';
        $params = [];

        $sql = "SELECT p.person_id, p.full_name, p.email, p.phone_mobile, to_char(p.birth_date, 'DD/MM/YYYY') as birth_date_fmt, p.is_active, p.tax_id 
                FROM people.persons p ";

        $where = "WHERE p.deleted IS FALSE ";

        if ($orgId > 0) {
            $where .= " AND p.org_id_origin = :oid ";
            $params[':oid'] = $orgId;
        }

        if (!empty($search)) {
            $where .= " AND p.full_name ILIKE :search ";
            $params[':search'] = "%" . $search . "%";
        }

        if ($status === 'ACTIVE') {
            $where .= " AND p.is_active IS TRUE ";
        } elseif ($status === 'INACTIVE') {
            $where .= " AND p.is_active IS FALSE ";
        }

        if ($roleType) {
            $sql .= " INNER JOIN people.person_roles pr ON pr.person_id = p.person_id INNER JOIN people.roles r ON pr.role_id = r.role_id ";
            $where .= " AND r.role_name = :role AND pr.deleted IS FALSE AND pr.is_active IS TRUE ";
            $params[':role'] = $roleType;
        }

        $sql .= $where . " ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados gerados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportGenericPeople", "sql", $e->getMessage(), $data);
        return failure("Erro ao gerar listagem de pessoas.");
    }
}

/**
 * Gerador de Pendências (Falta de Documentação)
 */
function _reportPendencias($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)($data['org_id'] ?? 0);
        $search = $data['search'] ?? '';
        $params = [];

        $sql = "SELECT p.person_id, p.full_name, p.phone_mobile, p.tax_id, p.national_id 
                FROM people.persons p 
                WHERE p.deleted IS FALSE AND p.is_active IS TRUE AND (p.tax_id IS NULL OR p.tax_id = '' OR p.national_id IS NULL OR p.national_id = '') ";

        if ($orgId > 0) {
            $sql .= " AND p.org_id_origin = :oid ";
            $params[':oid'] = $orgId;
        }

        if (!empty($search)) {
            $sql .= " AND p.full_name ILIKE :search ";
            $params[':search'] = "%" . $search . "%";
        }

        $sql .= " ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados gerados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportPendencias", "sql", $e->getMessage(), $data);
        return failure("Erro ao gerar listagem de pendências.");
    }
}

/**
 * Gerador de Listagem de Turmas
 */
function _reportTurmas($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)($data['org_id'] ?? 0);
        $search = $data['search'] ?? '';
        $status = $data['status'] ?? 'ALL';
        $params = [];

        $sql = "SELECT c.class_id, c.name as turma_name, co.name as curso_name, 
                       COALESCE(p.full_name, 'Sem Coordenador') as coordinator_name,
                       (SELECT COUNT(*) FROM education.enrollments e WHERE e.class_id = c.class_id AND e.status = 'ACTIVE' AND e.deleted IS FALSE) as total_alunos,
                       c.max_capacity, c.is_active
                FROM education.classes c
                JOIN education.courses co ON c.course_id = co.course_id
                LEFT JOIN people.persons p ON c.coordinator_id = p.person_id
                WHERE c.deleted IS FALSE ";

        if ($orgId > 0) {
            $sql .= " AND c.org_id = :oid ";
            $params[':oid'] = $orgId;
        }

        if (!empty($search)) {
            $sql .= " AND c.name ILIKE :search ";
            $params[':search'] = "%" . $search . "%";
        }

        if ($status === 'ACTIVE') {
            $sql .= " AND c.is_active IS TRUE ";
        } elseif ($status === 'INACTIVE') {
            $sql .= " AND c.is_active IS FALSE ";
        }

        $sql .= " ORDER BY c.name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados gerados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportTurmas", "sql", $e->getMessage(), $data);
        return failure("Erro ao gerar listagem de turmas.");
    }
}

/**
 * Gerador de Listagem de Fases
 */
function _reportFases($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)($data['org_id'] ?? 0);
        $search = $data['search'] ?? '';
        $status = $data['status'] ?? 'ALL';
        $params = [];

        $sql = "SELECT f.phase_id, f.name as fase_name, f.syllabus_summary, f.is_active,
                       (SELECT COUNT(*) FROM education.curriculum cur WHERE cur.phase_id = f.phase_id) as total_usos
                FROM education.phases f
                WHERE f.deleted IS FALSE ";

        if ($orgId > 0) {
            $sql .= " AND f.org_id = :oid ";
            $params[':oid'] = $orgId;
        }

        if (!empty($search)) {
            $sql .= " AND f.name ILIKE :search ";
            $params[':search'] = "%" . $search . "%";
        }

        if ($status === 'ACTIVE') {
            $sql .= " AND f.is_active IS TRUE ";
        } elseif ($status === 'INACTIVE') {
            $sql .= " AND f.is_active IS FALSE ";
        }

        $sql .= " ORDER BY f.name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados gerados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportFases", "sql", $e->getMessage(), $data);
        return failure("Erro ao gerar listagem de fases.");
    }
}

/**
 * Gerador de Listagem de Encontros (Diário)
 */
function _reportEncontros($data)
{
    try {
        $conect = $GLOBALS["local"];
        $orgId = (int)($data['org_id'] ?? 0);
        $search = $data['search'] ?? '';
        $params = [];

        $sql = "SELECT cs.session_id, to_char(cs.session_date, 'DD/MM/YYYY') as data_encontro, 
                       cs.description, c.name as turma_name, COALESCE(f.name, 'Geral') as fase_name,
                       (SELECT COUNT(*) FROM education.attendance a WHERE a.session_id = cs.session_id AND a.is_present IS TRUE) as total_presentes
                FROM education.class_sessions cs
                JOIN education.classes c ON cs.class_id = c.class_id
                LEFT JOIN education.phases f ON cs.phase_id = f.phase_id
                WHERE cs.deleted IS FALSE ";

        if ($orgId > 0) {
            $sql .= " AND c.org_id = :oid ";
            $params[':oid'] = $orgId;
        }

        if (!empty($search)) {
            $sql .= " AND (c.name ILIKE :search OR f.name ILIKE :search OR cs.description ILIKE :search) ";
            $params[':search'] = "%" . $search . "%";
        }

        $sql .= " ORDER BY cs.session_date DESC LIMIT 500";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        return success("Dados gerados.", ['list' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportEncontros", "sql", $e->getMessage(), $data);
        return failure("Erro ao gerar listagem de encontros.");
    }
}
