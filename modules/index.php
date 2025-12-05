<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="assets/img/favicon.png" type="image/x-icon">
    <title>Dashboard - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>

    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <div class="menu-btn-only">
            <span class="material-symbols-outlined">chevron_left</span>
        </div>
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">

        <div class="main-only">

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item active" aria-current="page">Visão Geral</li>
                </ol>
            </nav>

            <div class="list-commanded">

                <div class="row">

                    <div class="col-sm-12 col-md-6 col-xxl-3 mb-3">
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

                    <div class="col-sm-12 col-md-6 col-xxl-3 mb-3">
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

                    <div class="col-sm-12 col-md-6 col-xxl-3 mb-3">
                        <div class="card card-stats border-left-warning shadow h-100 py-2">
                            <div class="card-body">
                                <div class="row no-gutters align-items-center">
                                    <div class="col mr-2">
                                        <div class="text-xs font-weight-bold text-gold text-uppercase mb-1">
                                            Próxima Celebração
                                        </div>
                                        <div class="h5 mb-0 font-weight-bold text-gray-800" id="dash-proximas-missas">...</div>
                                    </div>
                                    <div class="col-auto">
                                        <span class="material-symbols-outlined icon-widget-gray">church</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-sm-12 col-md-6 col-xxl-3 mb-3 permission-finance" style="display:none;">
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

                <hr class="my-4">

                <div class="row">
                    <div class="col-lg-6 mb-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                                <h6 class="m-0 font-weight-bold txt-theme">
                                    <i class="fa-solid fa-bullhorn mr-2"></i> Mural de Avisos
                                </h6>
                            </div>
                            <div class="card-body">
                                <ul id="lista-avisos" class="list-group list-group-flush">
                                    <li class="list-group-item text-center text-muted">Carregando avisos...</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6 mb-4">
                        <div class="card shadow mb-4">
                            <div class="card-header py-3">
                                <h6 class="m-0 font-weight-bold txt-theme">
                                    <i class="fa-solid fa-rocket mr-2"></i> Acesso Rápido
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <a href="matriculas.php" class="btn btn-outline-primary mb-2 text-start btn-shortcut" data-permission="matriculas">
                                        <i class="fas fa-user-plus mr-2"></i> Nova Matrícula
                                    </a>

                                    <a href="meus-diarios.php" class="btn btn-outline-success mb-2 text-start btn-shortcut" data-permission="meus-diarios">
                                        <i class="fas fa-clipboard-check mr-2"></i> Fazer Chamada
                                    </a>

                                    <a href="liturgia.php" class="btn btn-outline-warning mb-2 text-start btn-shortcut" data-permission="liturgia">
                                        <i class="fas fa-calendar-plus mr-2"></i> Agendar Missa
                                    </a>

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