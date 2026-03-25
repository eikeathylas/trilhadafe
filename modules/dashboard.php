<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>
    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only">
        <div class="d-none d-md-flex align-items-center mb-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                            <i class="fas fa-chart-pie" style="font-size: 1.1rem;"></i>
                        </div>
                        Visão Geral do Sistema
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-4 rounded-sm-0 rounded-md-4 bg-transparent-card p-3 p-md-4">
            <div class="row g-3">

                <div class="col-6 col-lg">
                    <div class="card border border-secondary border-opacity-10 shadow-sm rounded-4 h-100 transition-all hover-lift">
                        <div class="card-body p-3 p-md-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px; font-size: 0.7rem;">Catequizandos</p>
                                    <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-catequizandos" style="letter-spacing: -1px;">...</h3>
                                </div>
                                <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                                    <span class="material-symbols-outlined fs-2">local_library</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-6 col-lg" data-slug="">
                    <div class="card border border-secondary border-opacity-10 shadow-sm rounded-4 h-100 transition-all hover-lift">
                        <div class="card-body p-3 p-md-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px; font-size: 0.7rem;">Catequistas</p>
                                    <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-professores" style="letter-spacing: -1px;">...</h3>
                                </div>
                                <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                                    <span class="material-symbols-outlined fs-2">co_present</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-6 col-lg permission-admin">
                    <div class="card border border-secondary border-opacity-10 shadow-sm rounded-4 h-100 transition-all hover-lift">
                        <div class="card-body p-3 p-md-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px; font-size: 0.7rem;">Turmas Ativas</p>
                                    <h3 class="fw-bold mb-0 text-body dash-num" id="dash-turmas-ativas" style="letter-spacing: -1px;">...</h3>
                                </div>
                                <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                                    <span class="material-symbols-outlined fs-2">class</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-6 col-lg permission-admin">
                    <div class="card border border-secondary border-opacity-10 shadow-sm rounded-4 h-100 transition-all hover-lift">
                        <div class="card-body p-3 p-md-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px; font-size: 0.7rem;">Usuários</p>
                                    <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-usuarios" style="letter-spacing: -1px;">...</h3>
                                </div>
                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                                    <span class="material-symbols-outlined fs-2">admin_panel_settings</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-xl-auto permission-finance d-none">
                    <div class="card border border-secondary border-opacity-10 shadow-sm rounded-4 h-100 transition-all hover-lift" style="min-width: 250px;">
                        <div class="card-body p-3 p-md-4">
                            <div class="d-flex align-items-center justify-content-between">
                                <div>
                                    <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px; font-size: 0.7rem;">Entradas (Mês)</p>
                                    <h3 class="fw-bold mb-0 text-success dash-num" id="dash-financeiro" style="letter-spacing: -1px;">R$ ...</h3>
                                </div>
                                <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width: 48px; height: 48px;">
                                    <span class="material-symbols-outlined fs-2">payments</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-4 rounded-sm-0 rounded-md-4 bg-transparent-card p-3 p-md-4 mb-5 pb-5">
            <div class="row g-3">

                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card overflow-hidden">
                        <div class="card-header border-bottom border-secondary border-opacity-10 py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 class="m-0 fw-bold text-body d-flex align-items-center" style="letter-spacing: -0.3px;">
                                <i class="fa-solid fa-bullhorn me-2 text-info fs-5"></i> Mural de Avisos
                            </h6>
                        </div>
                        <div class="card-body p-3 p-md-4 bg-secondary bg-opacity-10 rounded-bottom-4 shadow-inner">
                            <div id="lista-avisos">
                                <div class="text-center py-5 text-muted small opacity-75">
                                    <div class="spinner-border text-info border-2" style="width: 2rem; height: 2rem;" role="status"></div>
                                    <p class="mt-3 mb-0 fw-medium">Buscando informes...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card overflow-hidden">
                        <div class="card-header border-bottom border-secondary border-opacity-10 py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 class="m-0 fw-bold text-body d-flex align-items-center" style="letter-spacing: -0.3px;">
                                <i class="fas fa-calendar-alt me-2 text-primary fs-5"></i> Agenda da Paróquia
                            </h6>
                            <button class="btn btn-sm btn-light bg-secondary bg-opacity-10 text-primary fw-bold text-decoration-none border-0 shadow-none px-3 rounded-pill transition-all" style="font-size: 0.75rem;" onclick="window.location.href='eventos.php'">Ver Todos</button>
                        </div>
                        <div class="card-body p-3 p-md-4 bg-secondary bg-opacity-10 rounded-bottom-4 shadow-inner">
                            <div id="lista-eventos">
                                <div class="text-center py-5 text-muted small opacity-75">
                                    <div class="spinner-border text-primary border-2" style="width: 2rem; height: 2rem;" role="status"></div>
                                    <p class="mt-3 mb-0 fw-medium">Carregando calendário...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card overflow-hidden">
                        <div class="card-header border-bottom border-secondary border-opacity-10 py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 class="m-0 fw-bold text-body d-flex align-items-center" style="letter-spacing: -0.3px;">
                                <i class="fas fa-gift me-2 text-danger fs-5"></i> Aniversariantes
                            </h6>
                            <span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25 rounded-pill px-2 py-1" style="font-size: 0.7rem;">Este Mês</span>
                        </div>
                        <div class="card-body p-3 p-md-4 bg-secondary bg-opacity-10 rounded-bottom-4 shadow-inner">
                            <div id="lista-aniversariantes">
                                <div class="text-center py-5 text-muted small opacity-75">
                                    <div class="spinner-border text-danger border-2" style="width: 2rem; height: 2rem;" role="status"></div>
                                    <p class="mt-3 mb-0 fw-medium">Gerando felicitações...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/dashboard.js?v=<?php echo time(); ?>"></script>
</body>

</html>