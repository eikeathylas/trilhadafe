<?php

/**
 * TRILHA DA FÉ - Funções de Dados para Relatórios
 * Ajustado para suportar metadados de lotação e coordenação.
 */

function getReportDataF($reportType, $filters)
{
    try {
        switch ($reportType) {
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
                        ['full_name' => 'Teste de Layout A', 'main_role' => 'STUDENT', 'is_active' => '1'],
                        ['full_name' => 'Teste de Layout B', 'main_role' => 'CATECHIST', 'is_active' => '1'],
                        ['full_name' => 'Teste de Layout C', 'main_role' => 'STUDENT', 'is_active' => '0'],
                    ],
                    'metadata' => []
                ];
                echo json_encode(['status' => true, 'data' => $data]);
                exit;

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
                    JOIN education.academic_years ay ON c.academic_year_id = ay.year_id
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
