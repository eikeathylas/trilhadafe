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

        <div class="d-none d-md-flex align-items-center mb-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                            <i class="fas fa-file-lines" style="font-size: 1.1rem;"></i>
                        </div>
                        Central de Relatórios
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card no-print">

            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">


                    <div class="col-12 d-md-none mb-2 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Central de Relatórios</h5>
                    </div>

                    <div class="col-12 col-md flex-grow-1">


                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> O que você procura?
                        </label>

                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <input type="text" id="reportSearch" class="form-control shadow-sm" placeholder="Buscar por nome ou descrição..." style="border-radius: 12px 0 0 12px !important; height: 48px;">
                            <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                <i class="fas fa-search text-muted"></i>
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

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 m-0 text-center" id="reportTitle" style="letter-spacing: -0.5px;">
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4 p-md-5 bg-body">
                    <p id="reportDesc" class="text-muted small mb-4 lh-sm fw-medium text-center"></p>

                    <form id="formReport">
                        <div id="reportFiltersArea" class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-0">
                        </div>
                    </form>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" id="btnGenerateReport" style="height: 48px;" data-slug="relatorios.export">
                        <i class="fas fa-file-invoice me-2 opacity-75"></i> Gerar Relatório
                    </button>
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