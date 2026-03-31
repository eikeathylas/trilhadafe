<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Gerador de Certificados</title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="./assets/css/report-print.css?v=<?php echo time(); ?>">

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Inter:wght@400;600;800;900&display=swap');

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
            flex-direction: column;
            align-items: center;
            gap: 30px;
            padding: 40px 0;
        }

        /* Sobrescrita do report-print.css forçando Paisagem (Landscape) */
        .page {
            width: 297mm !important;
            height: 210mm !important;
            padding: 12mm !important;
            /* Respiro externo */
            box-sizing: border-box !important;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            /* Blindagem anti-vazamento */
            background-color: #ffffff;
        }

        /* Estilos Visuais Internos do Certificado */
        .border-inner {
            border: 10px double #d4af37;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: 8mm 15mm;
            /* Equilíbrio das margens internas */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            /* Centraliza verticalmente */
            text-align: center;
        }

        .logo {
            max-height: 110px;
            /* Logo aumentada */
            margin-bottom: 15px;
        }

        .title {
            font-size: 38pt;
            font-weight: 900;
            /* Mais espesso */
            color: #000000;
            /* Preto absoluto */
            margin: 0;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 14pt;
            color: #64748b;
            margin-top: 5px;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 4px;
        }

        .body-text {
            font-size: 16pt;
            color: #334155;
            line-height: 1.8;
        }

        .student-name {
            font-family: 'Pinyon Script', cursive;
            font-size: 48pt;
            color: #0f172a;
            margin: 15px 0;
            border-bottom: 1px solid #ccc;
            width: 80%;
            display: inline-block;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            width: 80%;
            margin-top: auto;
            padding-bottom: 2mm;
            /* Mais afastado da borda de baixo */
        }

        .sig-block {
            text-align: center;
            width: 40%;
        }

        .sig-line {
            border-top: 1px solid #000;
            margin-bottom: 10px;
        }

        .sig-name {
            font-weight: 600;
            font-size: 12pt;
            color: #0f172a;
        }

        .sig-role {
            font-size: 10pt;
            color: #64748b;
        }

        @media print {
            @page {
                size: A4 landscape;
                margin: 0 !important;
            }

            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            #document-content {
                padding: 0 !important;
                /* Remove margem que gera páginas extras */
                gap: 0 !important;
            }

            .page {
                margin: 0 !important;
                box-shadow: none !important;
                page-break-after: always;
                page-break-inside: avoid;
                width: 297mm !important;
                height: 209.5mm !important;
                /* Fração menor para não ativar folha fantasma */
            }

            #loader {
                display: none !important;
            }
        }
    </style>
</head>

<body>

    <div id="loader">
        <div class="spinner-border text-light" role="status" style="width: 3rem; height: 3rem;"></div>
        <h5 class="mt-3 fw-bold text-white opacity-75">Gerando Certificados...</h5>
    </div>

    <div id="document-content">
    </div>

    <?php include "./assets/components/Scripts.php"; ?>

    <script>
        $(document).ready(async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const classId = urlParams.get('id');

            if (!classId) {
                alert("Identificador da turma não fornecido.");
                window.close();
                return;
            }

            const token = window.defaultApp ? window.defaultApp.userInfo.token : localStorage.getItem("tf_token");

            try {
                // 1. Busca os Dados da Turma
                const classReq = await window.ajaxValidator({
                    validator: "getClassById",
                    token: token,
                    id: classId
                });

                if (!classReq.status) {
                    alert(classReq.alert || "Turma não encontrada.");
                    window.close();
                    return;
                }

                const classData = classReq.data;
                const courseName = classData.course_name_text || "Iniciação à Vida Cristã";
                const className = classData.name || "";

                const hojeDate = new Date();
                const hojeStr = hojeDate.toLocaleDateString('pt-BR');

                // 2. Busca os Alunos da Turma
                const studentsReq = await window.ajaxValidator({
                    validator: "getClassStudents",
                    token: token,
                    class_id: classId
                });

                let alunosConcluidos = [];
                if (studentsReq.status && studentsReq.data) {
                    // Filtra apenas alunos com status 'COMPLETED'
                    alunosConcluidos = studentsReq.data.filter(s => s.status === 'COMPLETED');
                }

                const container = $("#document-content");

                // 3. Renderiza o HTML
                if (alunosConcluidos.length === 0) {
                    container.html(`
                        <div class="empty-state-box" style="width: 297mm; max-width: 90vw; background: #fff; padding: 40px; border-radius: 8px;">
                            <h2>Nenhum certificado disponível.</h2>
                            <p>Não há alunos com status 'Concluído' (COMPLETED) nesta turma.</p>
                        </div>
                    `);
                } else {
                    let htmlCertificados = '';

                    alunosConcluidos.forEach(aluno => {
                        htmlCertificados += `
                            <div class="page">
                                <div class="border-inner">
                                    <img src="./assets/img/trilhadafe.png" alt="Logo Paróquia" class="logo">

                                    <h1 class="title">Certificado de Conclusão</h1>
                                    <div class="subtitle">Iniciação à Vida Cristã</div>

                                    <div class="body-text">
                                        Certificamos para os devidos fins que<br>
                                        <div class="student-name">${aluno.student_name}</div><br>
                                        concluiu com êxito a etapa de <strong>${courseName}</strong><br>
                                        na turma ${className}, participando ativamente dos encontros pastorais.
                                    </div>

                                    <div class="signatures">
                                        <div class="sig-block">
                                            <div class="sig-line"></div>
                                            <div class="sig-name">Pároco Responsável</div>
                                            <div class="sig-role">Pároco</div>
                                        </div>
                                        <div class="sig-block">
                                            <div class="sig-line"></div>
                                            <div class="sig-name">${hojeStr}</div>
                                            <div class="sig-role">Data de Emissão</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    });

                    container.html(htmlCertificados);
                }

                // 4. Exibe e Aciona Impressão
                document.title = `Certificados - ${className}`;
                $("#loader").hide();
                container.css("display", "flex");

                setTimeout(() => {
                    window.print();
                }, 800);

            } catch (error) {
                console.error("Falha de comunicação:", error);
                alert("Falha ao comunicar com o servidor.");
                window.close();
            }
        });
    </script>
</body>

</html>