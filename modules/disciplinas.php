<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Disciplinas - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>
    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <div class="menu-btn-only">
            <span class="material-symbols-outlined">chevron_left</span>
        </div>
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">
        <div class="main-only">

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="index.php">Painel</a></li>
                    <li class="breadcrumb-item active">Escola da Fé</li>
                    <li class="breadcrumb-item active" aria-current="page">Disciplinas</li>
                </ol>
            </nav>

            <div class="card list-commanded mb-4">
                <div class="card-header border-bottom-0 bg-transparent px-0 pb-0">
                    <div class="row align-items-end">
                        <div class="col-md-8">
                            <label class="form-label title">Buscar Disciplina:</label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Ex: Bíblia, Liturgia, História da Igreja...">
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn-filter mt-4" onclick="modalDisciplina()">
                                <i class="fas fa-plus mr-1"></i> Nova Disciplina
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-disciplinas">
                    </div>
                    <div class="pagination paginationButtons pagination-disciplinas mt-3 text-center"></div>
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