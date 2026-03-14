<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
                    <h4 class="fw-bold mb-1 title fs-3">Central de Relatórios</h4>
                    <p class="text-muted small mb-0 opacity-75">Gestão modular e centralizada de documentos.</p>
                </div>
            </div>

            <div class="card border-0 shadow-sm mb-4 rounded-4 bg-transparent-card no-print">
                <div class="card-body p-3 p-md-4">
                    <div class="row align-items-end">
                        <div class="col-12 col-md-6">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="reportSearch" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search me-1 opacity-50"></i> O que você procura?
                            </label>
                            <div class="input-group">
                                <input type="text" id="reportSearch" class="form-control border-end-0" placeholder="Buscar por nome ou descrição..." style="height: 45px;">
                                <span class="input-group-text bg-transparent border-start-0 clear-search-btn" id="clearSearchBtn" title="Limpar busca" style="cursor: pointer;">
                                    <span class="material-symbols-outlined text-danger opacity-75">close</span>
                                </span>
                            </div>
                        </div>
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
                <div class="bg-secondary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                    <span class="material-symbols-outlined text-muted" style="font-size: 48px;">search_off</span>
                </div>
                <h5 class="fw-bold text-body">Nenhum relatório encontrado</h5>
                <p class="text-muted small mx-auto" style="max-width: 300px;">Não encontramos resultados para a sua busca. Tente usar outras palavras-chave.</p>
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

    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="assets/relatorios/headReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/footerReport.js?v=<?php echo time(); ?>"></script>
    <script src="assets/relatorios/relatorios.js?v=<?php echo time(); ?>"></script>
</body>

</html>