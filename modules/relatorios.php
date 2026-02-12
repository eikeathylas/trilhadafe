<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Relatórios - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>

    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">

        <div class="main-only">

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Painel</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Relatórios</li>
                </ol>
            </nav>

            <div class="d-flex justify-content-between align-items-center mb-4 mt-3">
                <div>
                    <h4 class="fw-bold mb-1 title">Central de Relatórios</h4>
                    <p class="text-muted small mb-0">Selecione uma categoria para gerar documentos PDF.</p>
                </div>
            </div>

            <ul class="nav nav-pills mb-4 gap-2" id="pills-tab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link active rounded-pill px-4" id="pills-sec-tab" data-bs-toggle="pill" data-bs-target="#pills-sec" type="button" role="tab">
                        <i class="fas fa-users me-2"></i> Secretaria
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link rounded-pill px-4" id="pills-acad-tab" data-bs-toggle="pill" data-bs-target="#pills-acad" type="button" role="tab">
                        <i class="fas fa-graduation-cap me-2"></i> Escola da Fé
                    </button>
                </li>
                <li class="nav-item" role="presentation">
                    <button class="nav-link rounded-pill px-4" id="pills-admin-tab" data-bs-toggle="pill" data-bs-target="#pills-admin" type="button" role="tab">
                        <i class="fas fa-chart-pie me-2"></i> Gestão
                    </button>
                </li>
            </ul>

            <div class="tab-content" id="pills-tabContent">

                <div class="tab-pane fade show active" id="pills-sec" role="tabpanel">
                    <div class="row g-3">

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('pessoas_lista')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-primary bg-opacity-10 text-primary">
                                        <span class="material-symbols-outlined">group</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Lista de Pessoas</h6>
                                        <p class="small text-muted mb-0">Filtre por função, gênero e status.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('aniversariantes')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-warning bg-opacity-10 text-warning">
                                        <span class="material-symbols-outlined">cake</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Aniversariantes</h6>
                                        <p class="small text-muted mb-0">Relação mensal para avisos e murais.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('ficha_cadastral_vazia')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-secondary bg-opacity-10 text-secondary">
                                        <span class="material-symbols-outlined">description</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Ficha Cadastral (Vazia)</h6>
                                        <p class="small text-muted mb-0">Para preenchimento manual.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="tab-pane fade" id="pills-acad" role="tabpanel">
                    <div class="row g-3">

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('lista_presenca')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-success bg-opacity-10 text-success">
                                        <span class="material-symbols-outlined">checklist</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Diário de Classe</h6>
                                        <p class="small text-muted mb-0">Lista de presença para catequistas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('ata_resultados')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-info bg-opacity-10 text-info">
                                        <span class="material-symbols-outlined">history_edu</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Ata Final</h6>
                                        <p class="small text-muted mb-0">Situação final dos alunos por turma.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="tab-pane fade" id="pills-admin" role="tabpanel">
                    <div class="row g-3">

                        <div class="col-12 col-md-6 col-lg-4">
                            <div class="mobile-card h-100 cursor-pointer hover-scale" onclick="openReportConfig('auditoria')">
                                <div class="d-flex align-items-center gap-3">
                                    <div class="icon-circle bg-danger bg-opacity-10 text-danger">
                                        <span class="material-symbols-outlined">policy</span>
                                    </div>
                                    <div>
                                        <h6 class="fw-bold mb-1">Log de Auditoria</h6>
                                        <p class="small text-muted mb-0">Histórico de ações no sistema.</p>
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

    <div class="modal fade" id="modalReportConfig" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title fw-bold" id="reportTitle">Configurar Relatório</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-2">
                    <p id="reportDesc" class="text-muted small mb-4">Selecione os filtros abaixo.</p>

                    <form id="formReport">
                        <input type="hidden" id="reportType">

                        <div id="reportFiltersArea"></div>

                        <div class="mt-4 d-flex gap-2">
                            <button type="button" id="btn-report-view" class="btn btn-outline-primary flex-grow-1" onclick="processReport('view')">
                                <i class="fas fa-eye me-2"></i> Visualizar
                            </button>
                            <button type="button" id="btn-report-download" class="btn btn-primary flex-grow-1" onclick="processReport('download')">
                                <i class="fas fa-download me-2"></i> Baixar PDF
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js"></script>

    <script src="assets/js/relatorios.js?v=<?php echo time(); ?>"></script>

</body>

</html>