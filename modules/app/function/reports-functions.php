<?php

/**
 * Função Roteadora (Fachada)
 */
function getReportDataF($type, $filters)
{
    try {
        switch ($type) {
            case 'pessoas_lista':
                return _reportPessoasLista($filters);
            case 'aniversariantes':
                return _reportAniversariantes($filters);
            case 'lista_presenca':
                return _reportListaPresenca($filters);
            case 'ata_resultados':
                return _reportAtaResultados($filters);
            case 'ficha_cadastral_vazia':
                return success("Template pronto.", []);
            case 'auditoria':
                return _reportAuditoria($filters);
            default:
                return failure("Relatório não implementado: " . $type);
        }
    } catch (Exception $e) {
        logSystemError("painel", "reports", "getReportDataF", "exception", $e->getMessage(), $filters);
        return failure("Erro ao processar relatório.");
    }
}

/**
 * Relatório 1: Lista de Pessoas
 * Baseado em: people.persons e people.roles
 */
function _reportPessoasLista($f)
{
    $conect = $GLOBALS["local"];
    $params = [];
    $where = "WHERE p.deleted IS FALSE";

    if (!empty($f['org_id'])) {
        $where .= " AND (p.org_id_origin = :oid OR EXISTS (
                        SELECT 1 FROM people.person_roles pr 
                        WHERE pr.person_id = p.person_id AND pr.org_id = :oid AND pr.deleted IS FALSE
                    ))";
        $params[':oid'] = $f['org_id'];
    }

    if (isset($f['status']) && $f['status'] !== "") {
        $where .= " AND p.is_active = :status";
        $params[':status'] = ($f['status'] == '1' ? 'TRUE' : 'FALSE');
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
}

/**
 * Relatório 2: Aniversariantes
 */
function _reportAniversariantes($f)
{
    $conect = $GLOBALS["local"];
    $month = (int)$f['month'];

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
    return success("Dados carregados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
}

/**
 * Relatório 3: Lista de Presença
 * TABELA CORRIGIDA: education.enrollments
 */
function _reportListaPresenca($f)
{
    $conect = $GLOBALS["local"];

    if (empty($f['class_id'])) return failure("Selecione uma turma.");

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
    $stmt->execute([':cid' => $f['class_id']]);
    return success("Dados carregados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function _reportAtaResultados($f)
{
    return _reportListaPresenca($f);
}

/**
 * Relatório 5: Auditoria
 * TABELA CORRIGIDA: security.change_logs
 */
function _reportAuditoria($f)
{
    $conect = $GLOBALS["local"];

    $sql = "SELECT 
                cl.operation as action_type, 
                cl.table_name, 
                TO_CHAR(cl.changed_at, 'DD/MM/YYYY HH24:MI') as date,
                u.name as user_name
            FROM security.change_logs cl
            LEFT JOIN security.users u ON cl.user_id = u.user_id
            ORDER BY cl.changed_at DESC 
            LIMIT 100";

    $stmt = $conect->prepare($sql);
    $stmt->execute();
    return success("Logs carregados.", $stmt->fetchAll(PDO::FETCH_ASSOC));
}
