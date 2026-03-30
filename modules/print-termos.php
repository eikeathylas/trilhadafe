<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Termos LGPD e Uso de Imagem</title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="./assets/css/report-print.css?v=<?php echo time(); ?>">

    <style>
        /* Loading State (Adaptado para o fundo escuro do canvas) */
        #loader {
            display: flex;
            height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background-color: var(--bg-canvas);
        }

        #document-content {
            display: none;
        }

        /* Estética Específica dos Termos (Modernizada e Blindada) */
        .term-title {
            text-align: center;
            text-transform: uppercase;
            font-size: 14pt;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 2px solid #1e293b;
            padding-bottom: 15px;
            margin-top: 0;
            margin-bottom: 25px;
            letter-spacing: -0.5px;
        }

        .term-text {
            text-align: justify;
            font-size: 11pt;
            line-height: 1.6;
            color: #334155;
            margin-bottom: 15px;
        }

        @media print {
            #loader {
                display: none !important;
            }

            /* Garante que o Bootstrap não tente inverter as cores na impressão */
            * {
                color: #000 !important;
            }
        }
    </style>
</head>

<body>

    <div id="loader">
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;"></div>
        <h5 class="mt-3 fw-bold text-white opacity-75">Gerando Documento Seguro...</h5>
    </div>

    <div id="document-content" id="reportRoot" style="display: none; flex-direction: column; align-items: center; gap: 30px; padding: 40px 0;">

        <div class="page">
            <div class="page-body">
                <h2 class="term-title">Termo de Consentimento - Tratamento de Dados (LGPD)</h2>

                <div class="info-block">
                    <strong>CATEQUIZANDO / PAROQUIANO:</strong> <span class="lbl_nome"></span><br>
                    <strong>DATA DE NASCIMENTO:</strong> <span class="lbl_nascimento"></span><br>
                    <strong>CPF:</strong> <span class="lbl_cpf"></span> &nbsp;|&nbsp; <strong>RG:</strong> <span class="lbl_rg"></span>
                </div>

                <p class="term-text">Em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>, autorizo a Paróquia a realizar o tratamento de meus dados pessoais (ou do menor pelo qual sou responsável), incluindo coleta, armazenamento, uso e compartilhamento estritamente para os fins eclesiásticos, pastorais, sacramentais e administrativos.</p>

                <p class="term-text">Declaro estar ciente de que os dados serão mantidos em segurança no sistema paroquial e nos livros de registro, podendo ser utilizados para emissão de certificados, envio de comunicações pastorais e registros em instâncias diocesanas, conforme preceitua o Código de Direito Canônico.</p>

                <p class="term-text">Tenho ciência de que posso revogar este consentimento a qualquer momento, mediante solicitação formal à secretaria paroquial, resguardados os dados de guarda obrigatória por lei ou por normativas canônicas.</p>

                <div class="signature-block">
                    <div class="signature-line"></div>
                    <strong style="color: #0f172a;">Assinatura do Titular ou Responsável Legal</strong><br>
                    <small class="lbl_responsavel" style="color: #475569; font-size: 10pt;"></small>
                </div>
            </div>
            <div class="page-footer">
                <div class="footer-note">Documento gerado pelo sistema Trilha da Fé em <span class="lbl_hoje"></span>.</div>
            </div>
        </div>

        <div class="page">
            <div class="page-body">
                <h2 class="term-title">Termo de Autorização de Uso de Imagem e Voz</h2>

                <div class="info-block">
                    <strong>CATEQUIZANDO / PAROQUIANO:</strong> <span class="lbl_nome"></span><br>
                    <strong>DATA DE NASCIMENTO:</strong> <span class="lbl_nascimento"></span>
                </div>

                <p class="term-text">Por meio deste instrumento, autorizo expressamente e de forma gratuita a Paróquia a utilizar minha imagem e voz (ou do menor pelo qual sou responsável), captadas durante encontros de catequese, celebrações litúrgicas, retiros, eventos pastorais e festividades da comunidade.</p>

                <p class="term-text">A presente autorização abrange a publicação e exibição em materiais impressos, murais, boletins, bem como em mídias digitais oficiais da Paróquia, tais como site, Facebook, Instagram, YouTube e grupos de WhatsApp, com o propósito exclusivo de evangelização, memória pastoral e divulgação das atividades paroquiais.</p>

                <p class="term-text">Esta autorização é concedida em caráter definitivo, sem limitação de tempo ou território, isentando a Paróquia de qualquer ônus ou indenização decorrente do uso da referida imagem, desde que respeitada a dignidade e a moral cristã.</p>

                <div class="signature-block">
                    <div class="signature-line"></div>
                    <strong style="color: #0f172a;">Assinatura do Titular ou Responsável Legal</strong><br>
                    <small class="lbl_responsavel" style="color: #475569; font-size: 10pt;"></small>
                </div>
            </div>
            <div class="page-footer">
                <div class="footer-note">Documento gerado pelo sistema Trilha da Fé em <span class="lbl_hoje"></span>.</div>
            </div>
        </div>

    </div>

    <?php include "./assets/components/Scripts.php"; ?>

    <script>
        $(document).ready(async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const personId = urlParams.get('id');

            if (!personId) {
                alert("Identificador do catequizando não fornecido.");
                window.close();
                return;
            }

            try {
                // Chama a API respeitando a arquitetura de roteamento e segurança
                const result = await window.ajaxValidator({
                    validator: "getPerson",
                    token: window.defaultApp ? window.defaultApp.userInfo.token : localStorage.getItem("tf_token"),
                    id: personId
                });

                if (result.status) {
                    const p = result.data;

                    // Formatação de Datas
                    let dataNasc = "___/___/_____";
                    if (p.birth_date) {
                        const parts = p.birth_date.split("-");
                        dataNasc = `${parts[2]}/${parts[1]}/${parts[0]}`;
                    }

                    const hojeDate = new Date();
                    const hojeStr = hojeDate.toLocaleDateString('pt-BR');

                    // Busca o Responsável Legal (se houver)
                    let responsavel = "_______________________________________________________";
                    if (Array.isArray(p.family)) {
                        const respObj = p.family.find(fam => fam.is_legal_guardian === true);
                        if (respObj && respObj.relative_name) {
                            responsavel = respObj.relative_name;
                        }
                    }

                    // Injeção no DOM
                    $(".lbl_nome").text(p.full_name || "");
                    $(".lbl_cpf").text(p.tax_id || "_________________________");
                    $(".lbl_rg").text(p.national_id || "_________________________");
                    $(".lbl_nascimento").text(dataNasc);
                    $(".lbl_responsavel").text(responsavel);
                    $(".lbl_hoje").text(hojeStr);

                    // Exibe o documento e oculta o loader
                    $("#loader").hide();
                    $("#document-content").css("display", "flex");

                    // Aciona a impressão logo após renderizar a tela
                    setTimeout(() => {
                        window.print();
                    }, 500);

                } else {
                    alert(result.alert || "Ocorreu um erro ao carregar os dados da pessoa.");
                    window.close();
                }
            } catch (error) {
                console.error("Falha de comunicação:", error);
                alert("Falha ao comunicar com o servidor.");
            }
        });
    </script>
</body>

</html>