<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disciplinas - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">
        <div class="main-only">

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Painel</a></li>
                    <li class="breadcrumb-item active">Escola da Fé</li>
                    <li class="breadcrumb-item active" aria-current="page">Disciplinas</li>
                </ol>
            </nav>

            <div class="card list-commanded border-0 shadow-sm mb-4 rounded-4">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex flex-column flex-md-row gap-3 align-items-md-end">

                        <div class="flex-grow-1">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search me-1 opacity-50"></i> Buscar Disciplina
                            </label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Ex: Bíblia, Liturgia, História da Igreja...">
                        </div>

                        <div class="d-grid d-md-block mt-2 mt-md-0">
                            <button class="btn btn-primary fw-bold shadow-sm px-4" style="height: 42px;" onclick="modalDisciplina()">
                                <i class="fas fa-plus me-2"></i> Nova Disciplina
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-disciplinas" style="max-height: 600px;">
                        <div class="text-center py-5"><span class="loader"></span></div>
                    </div>
                    <div class="pagination paginationButtons pagination-disciplinas mt-3 text-center justify-content-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalDisciplina" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white" id="modalLabel">Gerenciar Disciplina</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="subject_id">

                    <div class="mb-3">
                        <label class="form-label">Nome da Matéria <span class="text-danger">*</span></label>
                        <input type="text" id="subject_name" class="form-control" placeholder="Ex: Novo Testamento">
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Ementa / Resumo</label>
                        <textarea id="subject_summary" class="form-control" rows="4" placeholder="Descreva brevemente o que será ensinado..."></textarea>
                        <small class="text-muted">Aparecerá no plano de ensino do curso.</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save" onclick="salvarDisciplina()">
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