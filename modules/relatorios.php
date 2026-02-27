<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Relatórios - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>
    <div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only no-print">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">
        <div class="main-only">

            <div class="d-flex justify-content-between align-items-center mb-4 no-print mt-5">
                <div>
                    <h4 class="fw-bold mb-1 title">Central de Relatórios</h4>
                    <p class="text-muted small mb-0">Gestão modular e centralizada de documentos.</p>
                </div>
            </div>

            <div class="row mb-4 no-print">
                <div class="col-12 col-md-6">
                    <div class="input-group shadow-sm">
                        <span class="input-group-text border-end-0 text-muted">
                            <span class="material-symbols-outlined">search</span>
                        </span>
                        <input type="text" id="reportSearch" class="form-control border-start-0 border-end-0" placeholder="Buscar por nome ou descrição...">
                        <span class="input-group-text border-start-0 clear-search-btn" id="clearSearchBtn" title="Limpar busca">
                            <span class="material-symbols-outlined text-danger">close</span>
                        </span>
                    </div>
                </div>
            </div>

            <div class="nav-pills-wrapper mb-4 no-print">
                <ul class="nav nav-pills gap-2" id="pills-tab" role="tablist">
                </ul>
            </div>

            <div id="reportsContainer" class="row g-3 no-print">
            </div>

            <div id="emptyState" class="text-center py-5 no-print" style="display: none;">
                <span class="material-symbols-outlined text-muted" style="font-size: 48px;">search_off</span>
                <h6 class="fw-bold mt-3 text-secondary">Nenhum relatório encontrado</h6>
                <p class="text-muted small">Não encontramos resultados para a sua busca. Tente usar outras palavras.</p>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade no-print" id="modalReportConfig" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow">
                <div class="modal-header border-bottom-0 pb-0">
                    <h5 class="modal-title fw-bold" id="reportTitle">Configurar Relatório</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body pt-2">
                    <p id="reportDesc" class="text-muted small mb-4"></p>
                    <form id="formReport">
                        <div id="reportFiltersArea"></div>

                        <div class="mt-4 d-flex gap-2">
                            <button type="button" class="btn btn-primary flex-grow-1" id="btnGenerateReport">Visualizar Relatório</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="assets/relatorios/headReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/footerReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/relatorios.js?v=<?php echo time(); ?>"></script>
</body>

</html>