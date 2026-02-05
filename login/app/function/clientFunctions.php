<?php

function validateClientAccess($data)
{
    try {
        $conect = $GLOBALS["pdo"];
        
        // 1. Query Principal
        // Busca dados do usuário, do cliente (paróquia), configurações financeiras e credenciais do banco
        // Também já traz o JSON de permissões (Menu)
        $sql = <<<'SQL'
            WITH user_context AS (
                SELECT
                    (:id_user)::INTEGER AS id_user,
                    (:id_client)::INTEGER AS id_client
            )
            SELECT
                -- Dados do Usuário
                u.id AS id_user,
                u.name AS name_user,
                u.img AS img_user,
                u.contact AS contact_user,
                
                -- Dados do Cliente (Paróquia)
                c.id AS id_client,
                c.name AS name_client,
                c.link,
                
                -- Perfil/Cargo
                p.title AS office,

                -- Configurações Financeiras (SaaS)
                cc.pendency,
                cc.value,
                cc.collect,
                cc.deadline,
                cc.config_code,
                cc.discount,
                cc.last_payment,
                cc.created_at,
                
                -- Credenciais do Banco da Cidade (Tenant DB)
                cc.host,
                cc.port,
                cc.database,
                cc.user,
                cc.password,

                -- Configurações da Empresa (Settings)
                s.name AS company_name,
                s.city,
                
                -- Lista de Acessos (Menu Lateral)
                -- Agrupa todas as ações permitidas para este perfil em um JSON
                TO_JSON(ARRAY_AGG(DISTINCT jsonb_build_object(
                    'slug', a.slug,
                    'name', a.name,
                    'description', a.description,
                    'is_menu', a.is_menu,
                    'icon', a.icon_class,
                    'controller', a.controller
                ))) AS access

            FROM user_context uc
            JOIN public.users u ON u.id = uc.id_user
            JOIN public.users_clients_profiles ucp ON ucp.id_user = u.id AND ucp.id_client = uc.id_client
            JOIN public.profiles p ON p.id = ucp.id_profile
            JOIN public.clients c ON c.id = ucp.id_client
            JOIN public.clients_config cc ON cc.id_client = c.id
            JOIN public.profiles_actions pa ON pa.id_profile = p.id
            JOIN public.actions a ON a.id = pa.id_action
            CROSS JOIN public.settings s
            
            WHERE 
                u.active IS TRUE
                AND ucp.active IS TRUE
                AND c.active IS TRUE
                AND cc.active IS TRUE
                AND a.active IS TRUE
            
            GROUP BY 
                u.id, u.name, u.img, u.contact,
                c.id, c.name, c.link,
                p.title,
                cc.pendency, cc.value, cc.collect, cc.deadline, cc.config_code, cc.discount, cc.last_payment, cc.created_at,
                cc.host, cc.port, cc.database, cc.user, cc.password,
                s.name, s.city
        SQL;

        $info = executeSQL([
            "retorno" => true,
            "multiplo" => false, // Retorna apenas 1 linha (o contexto do usuário)
            "sql" => $sql,
            "parametros" => [
                "id_user" => $data["id_user"],
                "id_client" => $data["id_client"],
            ],
        ]);

        if (!$info) {
            return failure("Acesso não autorizado ou configuração inválida para esta paróquia.");
        }

        // 2. Lógica de Vencimento (Mantida apenas para controle interno)
        // Se last_payment for nulo, conta a partir da criação + deadline
        $deadline = $info['deadline'] ?: 15;
        
        if ($info['last_payment']) {
            $vencimento = date('Y-m-d', strtotime($info['last_payment'] . " + 1 month"));
        } else {
            $vencimento = date('Y-m-d', strtotime($info['created_at'] . " + " . $deadline . " days"));
        }
            
        $hoje = date('Y-m-d');
        
        // Define se está inadimplente (apenas flag, não bloqueia no código novo)
        $info['should_pay'] = ($hoje > $vencimento);
        
        // Define chave PIX padrão caso precise exibir (compatibilidade)
        $info['pix'] = "81984529914"; 

        // 3. Busca o Changelog (Últimas versões)
        $sqlVersions = <<<'SQL'
            WITH version_base AS (
                SELECT DISTINCT
                    v.version,
                    v.date,
                    v.title,
                    v.description,
                    vl.tag AS tag_version,
                    vl.title AS title_version,
                    vl.description AS description_version
                FROM public.versions v
                LEFT JOIN public.versions_logs vl ON vl.id_version = v.id
                WHERE v.active IS TRUE
                ORDER BY v.date DESC
                LIMIT 5
            )
            SELECT
                vb.version,
                vb.date,
                vb.title,
                vb.description,
                json_agg(json_build_object(
                    'tag_version', vb.tag_version,
                    'title_version', vb.title_version,
                    'description_version', vb.description_version
                )) AS versions
            FROM version_base vb
            GROUP BY vb.version, vb.date, vb.title, vb.description
            ORDER BY vb.date DESC
        SQL;

        $versions = executeSQL([
            "retorno" => true,
            "multiplo" => true,
            "sql" => $sqlVersions,
            "parametros" => [],
        ]);

        // Retorna tudo pronto para o Controller
        return success("Acesso validado com sucesso", [
            'info' => $info,
            'versions' => $versions,
        ]);

    } catch (Exception $e) {
        // Registra o erro no log do banco Staff
        registrarLogErro("validateClientAccess", $e->getMessage());
        return failure("Erro técnico ao carregar ambiente do cliente.");
    }
}