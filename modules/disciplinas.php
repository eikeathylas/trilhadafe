<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disciplinas - Trilha da Fé</title>
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
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page"
                        style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Disciplinas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">

                <div class="col-12 d-md-none mb-3">
                    <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Buscar Disciplina</h4>
                </div>

                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md-9">
                        <label class="form-label d-none d-md-flex" for="busca-texto">
                            <i class="fas fa-search opacity-50"></i> Buscar Disciplina
                        </label>
                        <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Ex: Bíblia, Liturgia, História da Igreja...">
                    </div>

                    <div class="col-12 col-md-3 mt-3 mt-md-0">
                        <button class="btn btn-primary fw-bold shadow-sm w-100" style="height: 50px;" onclick="modalDisciplina()">
                            <i class="fas fa-plus me-2"></i>
                            <span class="d-none d-md-inline">Nova Disciplina</span>
                            <span class="d-inline d-md-none">Adicionar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body px-0 pt-4">
                <div class="table-responsive list-table-disciplinas">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                        <p class="mt-3 fw-medium">Carregando disciplinas...</p>
                    </div>
                </div>
                <div class="pagination paginationButtons pagination-disciplinas mt-3 text-center justify-content-center"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalDisciplina" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center" id="modalLabel">
                        <i class="fas fa-book-open me-3 opacity-75"></i> Gerenciar Disciplina
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="subject_id">

                    <div class="card border-0 shadow-sm mb-0 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-10">
                        <div class="card-body p-3 p-md-4">
                            <div class="mb-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Nome da Matéria <span class="text-danger">*</span></label>
                                <input type="text" id="subject_name" class="form-control border-0 shadow-none" placeholder="Ex: Novo Testamento">
                            </div>

                            <div class="mb-0">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Ementa / Resumo</label>
                                <textarea id="subject_summary" class="form-control border-0 shadow-none" rows="4" placeholder="Descreva brevemente o que será ensinado..."></textarea>
                                <small class="text-muted d-block mt-2 lh-sm opacity-75">
                                    <i class="fas fa-circle-info me-1"></i> Aparecerá no plano de ensino do curso.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarDisciplina(this)">
                        <i class="fas fa-save me-2"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/disciplinas.js?v=<?php echo time(); ?>"></script>

</body>

</html>