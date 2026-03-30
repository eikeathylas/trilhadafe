<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Termos LGPD e Uso de Imagem</title>
    <?php include "./assets/components/Head.php"; ?>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f0f2f5;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 10mm auto;
            background: white;
            box-sizing: border-box;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
            text-align: center;
            text-transform: uppercase;
            font-size: 16px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }

        p {
            text-align: justify;
            margin-bottom: 15px;
            font-size: 14px;
        }

        .info-block {
            background: #f9f9f9;
            padding: 15px;
            border: 1px solid #ddd;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .signature-block {
            margin-top: 50px;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 60%;
            margin: 0 auto 10px auto;
            padding-top: 5px;
        }

        .footer-note {
            font-size: 11px;
            text-align: center;
            color: #777;
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }

        /* Ocultar elementos de carregamento na impressão */
        #loader {
            display: flex;
            height: 100vh;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        }

        #document-content {
            display: none;
        }

        @media print {
            body {
                background: none;
            }

            .page {
                margin: 0;
                padding: 10mm;
                width: 100%;
                border: none;
                min-height: auto;
                box-shadow: none;
            }

            .page-break {
                page-break-before: always;
            }

            #loader {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div id="loader">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;"></div>
        <h5 class="mt-3 fw-bold text-secondary">Gerando Documento Seguro...</h5>
    </div>

    <div id="document-content">
        <div class="page">
            <h2>Termo de Consentimento - Tratamento de Dados (LGPD)</h2>

            <div class="info-block">
                <strong>CATEQUIZANDO / PAROQUIANO:</strong> <span class="lbl_nome"></span><br>
                <strong>DATA DE NASCIMENTO:</strong> <span class="lbl_nascimento"></span><br>
                <strong>CPF:</strong> <span class="lbl_cpf"></span> | <strong>RG:</strong> <span class="lbl_rg"></span>
            </div>

            <p>Em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong>, autorizo a Paróquia a realizar o tratamento de meus dados pessoais (ou do menor pelo qual sou responsável), incluindo coleta, armazenamento, uso e compartilhamento estritamente para os fins eclesiásticos, pastorais, sacramentais e administrativos.</p>

            <p>Declaro estar ciente de que os dados serão mantidos em segurança no sistema paroquial e nos livros de registro, podendo ser utilizados para emissão de certificados, envio de comunicações pastorais e registros em instâncias diocesanas, conforme preceitua o Código de Direito Canônico.</p>

            <p>Tenho ciência de que posso revogar este consentimento a qualquer momento, mediante solicitação formal à secretaria paroquial, resguardados os dados de guarda obrigatória por lei ou por normativas canônicas.</p>

            <div class="signature-block">
                <div class="signature-line"></div>
                <strong>Assinatura do Titular ou Responsável Legal</strong><br>
                <small class="lbl_responsavel"></small>
            </div>

            <div class="footer-note">Documento gerado pelo sistema Trilha da Fé em <span class="lbl_hoje"></span>.</div>
        </div>

        <div class="page-break"></div>

        <div class="page">
            <h2>Termo de Autorização de Uso de Imagem e Voz</h2>

            <div class="info-block">
                <strong>CATEQUIZANDO / PAROQUIANO:</strong> <span class="lbl_nome"></span><br>
                <strong>DATA DE NASCIMENTO:</strong> <span class="lbl_nascimento"></span>
            </div>

            <p>Por meio deste instrumento, autorizo expressamente e de forma gratuita a Paróquia a utilizar minha imagem e voz (ou do menor pelo qual sou responsável), captadas durante encontros de catequese, celebrações litúrgicas, retiros, eventos pastorais e festividades da comunidade.</p>

            <p>A presente autorização abrange a publicação e exibição em materiais impressos, murais, boletins, bem como em mídias digitais oficiais da Paróquia, tais como site, Facebook, Instagram, YouTube e grupos de WhatsApp, com o propósito exclusivo de evangelização, memória pastoral e divulgação das atividades paroquiais.</p>

            <p>Esta autorização é concedida em caráter definitivo, sem limitação de tempo ou território, isentando a Paróquia de qualquer ônus ou indenização decorrente do uso da referida imagem, desde que respeitada a dignidade e a moral cristã.</p>

            <div class="signature-block">
                <div class="signature-line"></div>
                <strong>Assinatura do Titular ou Responsável Legal</strong><br>
                <small class="lbl_responsavel"></small>
            </div>

            <div class="footer-note">Documento gerado pelo sistema Trilha da Fé em <span class="lbl_hoje"></span>.</div>
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
                // Chama a API respeitando a arquitetura de roteamento e segurança (Token)
                const result = await window.ajaxValidator({
                    validator: "getPerson",
                    token: window.defaultApp.userInfo.token,
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
                    $("#document-content").show();

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