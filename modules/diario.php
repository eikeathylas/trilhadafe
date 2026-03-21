<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diário de Classe - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css" rel="stylesheet">
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
                    <li class="breadcrumb-item active" aria-current="page">Diário de Classe</li>
                </ol>
            </nav>

            <div class="card border-0 shadow-sm mb-4 rounded-4 bg-transparent-card">
                <div class="card-body p-3 p-md-4">
                    <div class="row g-3 align-items-end justify-content-center">

                        <div class="col-12 col-md-5">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="sel_filter_class" style="letter-spacing: 0.5px;">
                                <i class="fas fa-users me-1 opacity-50"></i> 1. Selecione a Turma
                            </label>
                            <select id="sel_filter_class" class="form-control" placeholder="Buscando turmas..."></select>
                        </div>

                        <div class="col-12 col-md-5">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="sel_filter_subject" style="letter-spacing: 0.5px;">
                                <i class="fas fa-book-open me-1 opacity-50"></i> 2. Selecione a Disciplina
                            </label>
                            <select id="sel_filter_subject" class="form-control" disabled placeholder="Primeiro selecione a turma..."></select>
                        </div>

                        <div class="col-12 col-md-2 mt-4 mt-md-0">
                            <button id="btn_new_session" class="btn btn-primary fw-bold w-100 shadow-sm" disabled onclick="openSessionModal()" style="height: 42px;">
                                <i class="fas fa-plus me-2"></i> Nova Aula
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-0">
                    <div class="table-responsive list-table-diario" style="max-height: 600px;">
                        <div class="text-center py-5 text-muted opacity-50">
                            <i class="fas fa-arrow-up mb-2 d-block" style="font-size: 2rem;"></i>
                            Selecione Turma e Disciplina acima para visualizar o diário.
                        </div>
                    </div>
                    <div class="pagination paginationButtons pagination-diario mt-3 text-center justify-content-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalSession" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <div class="d-flex align-items-center">
                        <div class="bg-white bg-opacity-20 p-2 rounded-3 me-3">
                            <i class="fas fa-book-open text-white fs-4"></i>
                        </div>
                        <div>
                            <h5 class="modal-title fw-bold text-white mb-0" id="modalSessionLabel">Diário de Classe</h5>
                            <div class="small text-white opacity-75">Registro de conteúdo e frequência</div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-3 p-md-4">
                    <input type="hidden" id="session_id">

                    <div class="row g-4">
                        <div class="col-lg-8">
                            <div class="card border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 h-100 overflow-hidden">
                                <div class="card-header bg-transparent border-0 pt-4 px-4 pb-3">
                                    <div class="row align-items-center">
                                        <div class="col-md-7">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                                <i class="far fa-calendar-check me-1"></i> Data e Hora da Aula
                                            </label>
                                            <div class="input-group">
                                                <input type="text" id="diario_date" class="form-control fw-bold border-0 bg-body shadow-none" placeholder="Toque para selecionar..." readonly style="height: 45px;">
                                                <span class="input-group-text border-0 bg-body text-muted" id="date-status-icon"></span>
                                            </div>
                                            <small id="date-msg" class="d-block mt-2 fw-bold text-truncate" style="font-size: 0.75rem;"></small>
                                        </div>
                                        <div class="col-md-5 text-end d-none d-md-block mt-3">
                                            <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill fw-medium">
                                                <i class="fas fa-magic me-1"></i> Preenchimento Inteligente
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="card-body p-0 border-top border-secondary border-opacity-10 bg-body">
                                    <textarea id="diario_content" class="border-0"></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="card border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 h-100 d-flex flex-column">
                                <div class="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3 px-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="m-0 fw-bold text-body d-flex align-items-center">
                                            <i class="fas fa-user-check me-2 text-success"></i>Frequência
                                        </h6>
                                        <span class="badge bg-secondary bg-opacity-10 text-muted fw-normal rounded-pill" style="font-size: 0.7rem;">Padrão: Presente</span>
                                    </div>
                                </div>

                                <div class="card-body p-0 attendance-scroll bg-transparent" style="max-height: 450px; overflow-y: auto;">
                                    <div id="lista-alunos" class="p-2 px-3">
                                        <div class="text-center py-5 text-muted opacity-50">
                                            <span class="material-symbols-outlined spin fs-1">sync</span>
                                            <p class="mt-2 small mb-0">Carregando lista...</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="card-footer bg-transparent border-top border-secondary border-opacity-10 p-3">
                                    <button class="btn btn-primary w-100 shadow-sm rounded-3 fw-bold py-2 d-flex align-items-center justify-content-center transition-all" onclick="salvarDiario(this)">
                                        <i class="fas fa-cloud-upload-alt me-2"></i> Salvar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/lang/summernote-pt-BR.min.js"></script>

    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://npmcdn.com/flatpickr/dist/l10n/pt.js"></script>

    <script src="assets/js/diario.js?v=<?php echo time(); ?>"></script>

</body>

</html>