<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatórios - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>

    <div id="sidebar-only" class="sidebar-only no-print">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only px-0 px-md-3">

        <div class="d-none d-md-flex align-items-center mb-4 mt-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Central de Relatórios
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-4 rounded-sm-0 rounded-md-4 bg-transparent-card no-print">
            <div class="card-body p-3 p-md-4">

                <div class="col-12 d-md-none mb-3">
                    <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Central de Relatórios</h4>
                </div>

                <div class="row align-items-end">
                    <div class="col-12 col-md-6 col-lg-5">
                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 d-none d-md-block" for="reportSearch" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search me-1 opacity-50"></i> O que você procura?
                        </label>
                        <div class="input-group shadow-sm" style="border-radius: 12px; overflow: hidden;">
                            <span class="input-group-text bg-body border-end-0 border-secondary border-opacity-25 text-muted d-md-none">
                                <i class="fas fa-search"></i>
                            </span>
                            <input type="text" id="reportSearch" class="form-control border-start-0 border-end-0 bg-body border-secondary border-opacity-25 shadow-none" placeholder="Buscar por nome ou descrição..." style="height: 45px;">
                            <span class="input-group-text bg-body border-start-0 border-secondary border-opacity-25 clear-search-btn d-none" id="clearSearchBtn" title="Limpar busca" style="cursor: pointer; transition: opacity 0.2s;">
                                <i class="fas fa-times-circle text-secondary opacity-50"></i>
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <div class="nav-pills-wrapper mb-4 no-print px-3 px-md-0">
            <ul class="nav nav-pills gap-2 flex-nowrap overflow-auto hide-scrollbar" id="pills-tab" role="tablist" style="scroll-behavior: smooth;">
            </ul>
        </div>

        <div id="reportsContainer" class="row g-3 g-md-4 mb-5 no-print px-3 px-md-0">
        </div>

        <div id="emptyState" class="text-center py-5 no-print" style="display: none;">
            <div class="bg-secondary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3 shadow-inner">
                <span class="material-symbols-outlined text-secondary opacity-75" style="font-size: 48px;">search_off</span>
            </div>
            <h5 class="fw-bold text-body" style="letter-spacing: -0.5px;">Nenhum relatório encontrado</h5>
            <p class="text-muted small mx-auto opacity-75" style="max-width: 300px;">Tente buscar por outras palavras-chave ou navegue pelas categorias acima.</p>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade no-print" id="modalReportConfig" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-md">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-body pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <h5 class="modal-title fw-bold text-body fs-4" id="reportTitle" style="letter-spacing: -0.5px;">
                    </h5>
                    <button type="button" class="btn-close shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body pt-2 px-4 pb-4 bg-body">
                    <p id="reportDesc" class="text-secondary small mb-4 lh-sm opacity-75"></p>

                    <form id="formReport">
                        <div id="reportFiltersArea" class="rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 p-4 shadow-inner mb-4">
                        </div>

                        <div class="d-grid mt-2">
                            <button type="button" class="btn btn-primary fw-bold shadow-sm rounded-pill py-2 d-flex align-items-center justify-content-center" id="btnGenerateReport" style="height: 48px;">
                                <i class="fas fa-file-invoice me-2"></i> Gerar Relatório
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

    <script src="assets/relatorios/headReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/footerReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/relatorios.js?v=<?php echo time(); ?>"></script>

    <style>
        /* Oculta scrollbar da lista de abas no mobile (estilo swipeable) */
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }

        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Ajuste do botão de limpar busca */
        #clearSearchBtn:hover i {
            color: var(--bs-danger) !important;
            opacity: 1 !important;
        }
    </style>

</body>

</html>