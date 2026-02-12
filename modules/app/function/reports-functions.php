<?php

/**
 * Função principal que roteia as chamadas de relatórios
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

            case 'ata_resultados':
                return _reportAtaResultados($filters);

            case 'auditoria':
                return _reportAuditoria($filters);

            case 'ficha_cadastral_vazia':
                return success("Template pronto.", []);

            default:
                return failure("Relatório não implementado: " . $reportType);
        }
    } catch (Exception $e) {
        logSystemError("painel", "reports", "getReportDataF", "exception", $e->getMessage(), $filters);
        return failure("Erro crítico ao processar relatório.");
    }
}

// =========================================================
// FUNÇÕES DE APOIO (QUERIES)
// =========================================================

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
                    SELECT 1 FROM people.person_roles pr 
                    WHERE pr.person_id = p.person_id AND pr.org_id = :oid AND pr.deleted IS FALSE
                  ))";

        // Filtro de Status
        if (isset($data['status']) && $data['status'] !== "") {
            $where .= " AND p.is_active = :status";
            $params[':status'] = ($data['status'] == '1' ? 'TRUE' : 'FALSE');
        }

        // Filtro de Gênero
        if (!empty($data['gender'])) {
            $where .= " AND p.gender = :gender";
            $params[':gender'] = $data['gender'];
        }

        // Filtro de Função Específica
        if (!empty($data['role'])) {
            $where .= " AND EXISTS (
                SELECT 1 FROM people.person_roles pr 
                JOIN people.roles r ON pr.role_id = r.role_id 
                WHERE pr.person_id = p.person_id AND r.role_name = :role AND pr.deleted IS FALSE
            )";
            $params[':role'] = $data['role'];
        }

        $sql = "SELECT 
                    p.full_name, 
                    p.email, 
                    p.phone_mobile, 
                    p.is_active,
                    COALESCE(
                        (SELECT r.role_name 
                         FROM people.person_roles pr 
                         JOIN people.roles r ON pr.role_id = r.role_id 
                         WHERE pr.person_id = p.person_id AND pr.is_active IS TRUE AND pr.deleted IS FALSE
                         ORDER BY 
                            CASE r.role_name
                                WHEN 'PRIEST' THEN 10
                                WHEN 'SECRETARY' THEN 8
                                WHEN 'CATECHIST' THEN 6
                                WHEN 'PARENT' THEN 4
                                WHEN 'STUDENT' THEN 2
                                ELSE 1
                            END DESC 
                         LIMIT 1), 
                        'Sem Vínculo'
                    ) as main_role
                FROM people.persons p
                $where
                ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute($params);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($result as &$row) {
            $row['is_active'] = ($row['is_active'] === true || $row['is_active'] === 't');
        }

        return success("Dados carregados.", $result);
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
        $month = (int)$data['month'];

        if ($month < 1 || $month > 12) return failure("Mês inválido.");

        $sql = "SELECT 
                    p.full_name, 
                    p.phone_mobile,
                    EXTRACT(DAY FROM p.birth_date) as day,
                    (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM p.birth_date)) as age_turning
                FROM people.persons p
                WHERE p.deleted IS FALSE AND p.is_active IS TRUE
                AND EXTRACT(MONTH FROM p.birth_date) = :m
                ORDER BY day ASC, p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute([':m' => $month]);
        return success("Aniversariantes carregados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportAniversariantes", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar aniversariantes.");
    }
}

/**
 * Relatório: Lista de Presença (Diário em Branco)
 */
function _reportListaPresenca($data)
{
    try {
        $conect = $GLOBALS["local"];
        $classId = (int)$data['class_id'];

        if (!$classId) return failure("Turma não selecionada.");

        $sql = "SELECT 
                    p.full_name,
                    p.person_id
                FROM education.enrollments e
                JOIN people.persons p ON e.student_id = p.person_id
                WHERE e.class_id = :cid 
                AND e.deleted IS FALSE 
                AND e.status = 'ACTIVE'
                AND p.deleted IS FALSE
                ORDER BY p.full_name ASC";

        $stmt = $conect->prepare($sql);
        $stmt->execute([':cid' => $classId]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (empty($result)) return failure("Nenhum catequizando ativo nesta turma.");

        return success("Dados carregados.", $result);
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportListaPresenca", "sql", $e->getMessage(), $data);
        return failure("Erro ao processar lista de presença.");
    }
}

/**
 * Relatório: Ata de Resultados
 */
function _reportAtaResultados($data)
{
    // Por enquanto utiliza a mesma base da lista de presença, 
    // mas preparado para receber joins de notas no futuro.
    return _reportListaPresenca($data);
}

/**
 * Relatório: Log de Auditoria
 */
function _reportAuditoria($data)
{
    try {
        $conect = $GLOBALS["local"];

        $sql = "SELECT 
                    cl.operation as action_type, 
                    cl.table_name, 
                    cl.record_id,
                    to_char(cl.changed_at, 'DD/MM/YYYY HH24:MI') as date,
                    COALESCE(u.name, 'Sistema') as user_name
                FROM security.change_logs cl
                LEFT JOIN security.users u ON cl.user_id = u.user_id
                ORDER BY cl.changed_at DESC 
                LIMIT 100";

        $stmt = $conect->prepare($sql);
        $stmt->execute();
        return success("Logs carregados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (Exception $e) {
        logSystemError("painel", "reports", "_reportAuditoria", "sql", $e->getMessage(), $data);
        return failure("Erro ao carregar logs de auditoria.");
    }
}
