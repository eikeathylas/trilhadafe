<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fases - Trilha da Fé</title>
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
                            <i class="fas fa-book-open" style="font-size: 1.1rem;"></i>
                        </div>
                        Gestão de Fases
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">

            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">


                    <div class="col-12 d-md-none mb-2 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Buscar Fase</h5>
                    </div>

                    <div class="col-12 col-md flex-grow-1">


                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Fase
                        </label>
                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Ex: Bíblia, Liturgia, História da Igreja..." style="border-radius: 12px 0 0 12px !important; height: 48px;">
                            <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                <i class="fas fa-search text-muted"></i>
                            </span>
                        </div>
                    </div>

                    <div class="col-12 col-md-auto d-grid mt-3 mt-md-0" data-slug="fases.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="modalFase()" style="height: 48px; border-radius: 12px; min-width: 160px;">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Nova Fase</span>
                        </button>
                    </div>

                </div>
            </div>

        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4 bg-transparent-card overflow-hidden">
            <div class="card-body p-0 p-md-4">
                <div class="table-responsive list-table-fases">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary border-2" role="status"></div>
                        <p class="mt-3 small fw-medium">Sincronizando banco de dados...</p>
                    </div>
                </div>
                <div class="pagination-fases pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalFase" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 text-center m-0" id="modalLabel" style="letter-spacing: -0.5px;">
                        <i class="fas fa-book-open me-3 opacity-75"></i> Nova Fase
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4 p-md-5 bg-body">
                    <input type="hidden" id="phase_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-0">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome da Fase <span class="text-danger">*</span></label>
                                <input type="text" id="phase_name" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" placeholder="Ex: Querigma" style="height: 52px;">
                            </div>

                            <div class="col-12 mt-4">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Ementa / Resumo</label>
                                <textarea id="phase_summary" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body p-3" rows="6" style="min-height: 250px;" placeholder="Descreva brevemente o que será ensinado..."></textarea>
                                <small class="text-muted d-block mt-3 lh-sm opacity-75 fw-medium ms-1" style="font-size: 0.75rem;">
                                    <i class="fas fa-circle-info me-1"></i> Esta ementa aparecerá no plano de ensino do curso.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="salvarFase(this)" data-slug="fases.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/fases.js?v=<?php echo time(); ?>"></script>

</body>

</html>