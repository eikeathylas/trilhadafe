<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="assets/img/favicon.png" type="image/x-icon">
    <title>Dashboard - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>

    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
    <style>
        /* =========================================
           ESTILOS DOS WIDGETS (AGENDA & AVISOS)
           ========================================= */

        /* Header dos Cards */
        .widget-header {
            background-color: var(--white);
            border-bottom: 1px solid var(--borda);
            transition: background-color 0.3s ease, border-color 0.3s ease;
        }

        /* Box de Data (Widget Agenda) */
        .event-date-box {
            background-color: var(--body);
            /* Usa fundo da página como base */
            border-radius: 8px;
            padding: 5px 10px;
            text-align: center;
            min-width: 60px;
            border: 1px solid transparent;
            transition: background-color 0.3s ease;
        }

        .event-day {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--descricao);
            line-height: 1;
        }

        .event-num {
            font-size: 1.2rem;
            font-weight: 800;
            color: var(--black);
            line-height: 1.1;
        }

        /* Estado: Bloqueado/Sem Aula (Feriados) */
        .event-blocked .event-date-box {
            background-color: rgba(231, 74, 59, 0.1);
            /* Vermelho bem claro */
            color: var(--danger);
            border-color: rgba(231, 74, 59, 0.2);
        }

        .event-blocked .event-num,
        .event-blocked .event-day {
            color: var(--danger) !important;
        }

        /* =========================================
           MODO ESCURO (DARK MODE)
           ========================================= */
        [data-theme="escuro"] .widget-header {
            background-color: #1f2937;
            /* Cinza Escuro ou var(--padrao1) conforme preferência */
            border-bottom-color: #374151;
        }

        [data-theme="escuro"] .event-date-box {
            background-color: rgba(255, 255, 255, 0.05);
            /* Translucido claro sobre fundo escuro */
        }

        [data-theme="escuro"] .event-num {
            color: var(--white);
        }

        [data-theme="escuro"] .text-black {
            color: var(--white) !important;
        }
    </style>
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <div class="menu-btn-only">
            <span class="material-symbols-outlined">chevron_left</span>
        </div>
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">

        <div class="main-only">

            <div class="d-flex align-items-center mb-4">
                <nav aria-label="breadcrumb" class="w-100">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item active" aria-current="page">Visão Geral</li>
                    </ol>
                </nav>
            </div>

            <div class="list-commanded">

                <div class="row">

                    <div class="col-sm-12 col-md-6 col-xxl-6 mb-3">
                        <div class="card card-stats border-left-primary shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold txt-theme text-uppercase mb-1">
                                            Total de Pessoas
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800" id="dash-total-pessoas">...</div>
                                    </div>
                                    <div class="col-auto">
                                        <span class="material-symbols-outlined icon-widget-gray">group</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-sm-12 col-md-6 col-xxl-6 mb-3">
                        <div class="card card-stats border-left-success shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                            Turmas Ativas
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800" id="dash-turmas-ativas">...</div>
                                    </div>
                                    <div class="col-auto">
                                        <span class="material-symbols-outlined icon-widget-gray">school</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-sm-12 col-md-6 col-xxl-3 mb-3 permission-finance d-none">
                        <div class="card card-stats border-left-danger shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-danger text-uppercase mb-1">
                                            Entradas (Mês)
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800" id="dash-financeiro">R$ ...</div>
                                    </div>
                                    <div class="col-auto">
                                        <span class="material-symbols-outlined icon-widget-gray">payments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <hr class="my-4 hr">

                <div class="row">

                    <div class="col-lg-8 mb-4">
                        <div class="card shadow mb-4 h-100">
                            <div class="card-header widget-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 class="m-0 font-weight-bold txt-theme">
                                    <i class="fa-solid fa-bullhorn mr-2"></i> Mural de Avisos
                                </h6>
                            </div>
                            <div class="card-body p-0">
                                <ul id="lista-avisos" class="list-group list-group-flush">
                                    <li class="list-group-item text-center text-muted py-5">
                                        <span class="loader-sm"></span> Carregando avisos...
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4 mb-4">
                        <div class="card shadow mb-4 h-100">
                            <div class="card-header widget-header py-3 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 font-weight-bold text-black">
                                    <i class="fas fa-calendar-alt mr-2 text-warning"></i> Próximos Eventos
                                </h6>
                                <small class="txt-theme fw-bold" style="cursor:pointer; font-size: 0.8rem;" onclick="window.location.href='eventos.php'">Ver todos</small>
                            </div>
                            <div class="card-body p-0">
                                <div id="lista-eventos" class="list-group list-group-flush">
                                    <div class="text-center py-5 text-muted small">
                                        <span class="loader-sm"></span> Carregando agenda...
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>

            <?php include "./assets/components/Footer.php"; ?>

        </div>

    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/dashboard.js?v=<?php echo time(); ?>"></script>

</body>

</html>