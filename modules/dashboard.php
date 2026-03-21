<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">

        <div class="main-only">

            <div class="d-flex align-items-center mb-4">
                <nav aria-label="breadcrumb" class="w-100">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.2rem;">
                            Visão Geral do Sistema
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="list-commanded">

                <div class="row g-3 mb-4">

                    <div class="col-6 col-lg">
                        <div class="card border-0 shadow-sm rounded-4 bg-transparent-card h-100 transition-all">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px;">Catequizandos</p>
                                        <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-catequizandos">...</h3>
                                    </div>
                                    <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                        <span class="material-symbols-outlined fs-2">local_library</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-6 col-lg">
                        <div class="card border-0 shadow-sm rounded-4 bg-transparent-card h-100 transition-all">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px;">Professores</p>
                                        <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-professores">...</h3>
                                    </div>
                                    <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                        <span class="material-symbols-outlined fs-2">co_present</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-6 col-lg permission-admin">
                        <div class="card border-0 shadow-sm rounded-4 bg-transparent-card h-100 transition-all">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px;">Turmas</p>
                                        <h3 class="fw-bold mb-0 text-body dash-num" id="dash-turmas-ativas">...</h3>
                                    </div>
                                    <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                        <span class="material-symbols-outlined fs-2">class</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-6 col-lg permission-admin">
                        <div class="card border-0 shadow-sm rounded-4 bg-transparent-card h-100 transition-all">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px;">Usuários</p>
                                        <h3 class="fw-bold mb-0 text-body dash-num" id="dash-total-usuarios">...</h3>
                                    </div>
                                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                        <span class="material-symbols-outlined fs-2">admin_panel_settings</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-12 col-xl-auto permission-finance d-none">
                        <div class="card border-0 shadow-sm rounded-4 bg-transparent-card h-100 transition-all" style="min-width: 250px;">
                            <div class="card-body p-3">
                                <div class="d-flex align-items-center justify-content-between">
                                    <div>
                                        <p class="small fw-bold text-uppercase text-muted mb-1" style="letter-spacing: 0.5px;">Entradas (Mês)</p>
                                        <h3 class="fw-bold mb-0 text-success" id="dash-financeiro">R$ ...</h3>
                                    </div>
                                    <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                        <span class="material-symbols-outlined fs-2">payments</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <hr class="my-4 border-secondary border-opacity-10">

                <div class="row g-4 mb-5">

                    <div class="col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card">
                            <div class="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3 px-4">
                                <h6 class="m-0 fw-bold text-body d-flex align-items-center">
                                    <i class="fa-solid fa-bullhorn me-2 text-info fs-5"></i> Mural de Avisos
                                </h6>
                            </div>
                            <div class="card-body p-3 bg-light bg-opacity-50 rounded-bottom-4">
                                <div id="lista-avisos">
                                    <div class="text-center py-5 text-muted small">
                                        <span class="loader-sm"></span>
                                        <p class="mt-2 mb-0">Carregando avisos...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card">
                            <div class="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3 px-4 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 fw-bold text-body d-flex align-items-center">
                                    <i class="fas fa-calendar-alt me-2 text-primary fs-5"></i> Agenda de Eventos
                                </h6>
                                <button class="btn btn-sm btn-link text-primary fw-bold text-decoration-none p-0" style="font-size: 0.75rem;" onclick="window.location.href='eventos.php'">Ver todos</button>
                            </div>
                            <div class="card-body p-3 bg-light bg-opacity-50 rounded-bottom-4">
                                <div id="lista-eventos">
                                    <div class="text-center py-5 text-muted small">
                                        <span class="loader-sm"></span>
                                        <p class="mt-2 mb-0">Carregando agenda...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card border-0 shadow-sm rounded-4 h-100 bg-transparent-card">
                            <div class="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3 px-4 d-flex justify-content-between align-items-center">
                                <h6 class="m-0 fw-bold text-body d-flex align-items-center">
                                    <i class="fas fa-gift me-2 text-danger fs-5"></i> Aniversariantes
                                </h6>
                                <span class="badge bg-danger-subtle text-danger rounded-pill">Este mês</span>
                            </div>
                            <div class="card-body p-3 bg-light bg-opacity-50 rounded-bottom-4">
                                <div id="lista-aniversariantes">
                                    <div class="text-center py-5 text-muted small">
                                        <span class="loader-sm"></span>
                                        <p class="mt-2 mb-0">Buscando aniversariantes...</p>
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