<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8">
    <title>Certificados - <?php echo htmlspecialchars($classData['name']); ?></title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="./assets/css/report-print.css?v=<?php echo time(); ?>">

    <style>
        @import url('https://fonts.googleapis.com/css2?family=Pinyon+Script&family=Inter:wght@400;600;800&display=swap');

        /* Sobrescrita do report-print.css forçando Paisagem (Landscape) */
        .page {
            width: 297mm !important;
            height: 210mm !important;
            padding: 20mm !important;
        }

        @media print {
            @page {
                size: A4 landscape;
                margin: 0 !important;
            }
        }

        /* Estilos Visuais Internos do Certificado */
        .border-inner {
            border: 10px double #d4af37;
            height: 100%;
            width: 100%;
            box-sizing: border-box;
            padding: 15mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }

        .logo {
            max-height: 80px;
            margin-bottom: 20px;
        }

        .title {
            font-size: 38pt;
            font-weight: 800;
            color: #1e293b;
            margin: 0;
            letter-spacing: 2px;
            text-transform: uppercase;
        }

        .subtitle {
            font-size: 14pt;
            color: #64748b;
            margin-top: 5px;
            margin-bottom: 40px;
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
            margin: 20px 0;
            border-bottom: 1px solid #ccc;
            width: 80%;
            display: inline-block;
        }

        .signatures {
            display: flex;
            justify-content: space-between;
            width: 80%;
            margin-top: auto;
            padding-bottom: 10mm;
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
    </style>
</head>

<body>

    <div id="reportRoot">
        <?php if (empty($students)): ?>
            <div class="empty-state-box" style="width: 297mm; max-width: 90vw;">
                <h2>Nenhum certificado disponível.</h2>
                <p>Não há alunos com status 'Concluído' nesta turma.</p>
            </div>
        <?php endif; ?>

        <?php foreach ($students as $student): ?>
            <div class="page">
                <div class="border-inner">
                    <img src="./assets/img/trilhadafe.png" alt="Logo Paróquia" class="logo">

                    <h1 class="title">Certificado de Conclusão</h1>
                    <div class="subtitle">Iniciação à Vida Cristã</div>

                    <div class="body-text">
                        Certificamos para os devidos fins que<br>
                        <div class="student-name"><?php echo htmlspecialchars($student['full_name']); ?></div><br>
                        concluiu com êxito a etapa de <strong><?php echo htmlspecialchars($classData['course_name']); ?></strong><br>
                        na turma <?php echo htmlspecialchars($classData['name']); ?>, participando ativamente dos encontros pastorais.
                    </div>

                    <div class="signatures">
                        <div class="sig-block">
                            <div class="sig-line"></div>
                            <div class="sig-name"><?php echo htmlspecialchars($classData['priest_name'] ?? 'Pároco Responsável'); ?></div>
                            <div class="sig-role">Pároco</div>
                        </div>
                        <div class="sig-block">
                            <div class="sig-line"></div>
                            <div class="sig-name"><?php echo $dataAtual; ?></div>
                            <div class="sig-role">Data de Emissão</div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>

    <?php include "./assets/components/Scripts.php"; ?>

    <script>
        $(document).ready(() => {
            // Aciona a impressão utilizando a base arquitetural correta pós renderização
            setTimeout(() => {
                window.print();
            }, 500);
        });
    </script>
</body>

</html>