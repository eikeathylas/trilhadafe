<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
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

            <div class="card border-0 shadow-sm mb-4" style="margin: 3px; border-radius: 10px;">
                <div class="card-body py-3">
                    <div class="row g-2 g-md-3 align-items-end justify-content-center">
                        <div class="col-12 col-md-5">
                            <label class="form-label fw-bold text-secondary small text-uppercase mb-1">1. Selecione a Turma</label>
                            <select id="sel_filter_class" class="form-control" placeholder="Buscando turmas..."></select>
                        </div>
                        <div class="col-12 col-md-5">
                            <label class="form-label fw-bold text-secondary small text-uppercase mb-1">2. Selecione a Disciplina</label>
                            <select id="sel_filter_subject" class="form-control" disabled placeholder="Primeiro selecione a turma..."></select>
                        </div>
                        <div class="col-12 col-md-2">
                            <button id="btn_new_session" class="btn btn-success w-100 shadow-sm d-flex align-items-center justify-content-center" disabled onclick="openSessionModal()">
                                <i class="fas fa-plus me-2"></i> Lançar Aula
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-0">
                    <div class="table-responsive list-table-diario">
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
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content border-0">
                <div class="modal-header bg-primary text-white">
                    <div>
                        <h5 class="modal-title fs-5" id="modalSessionLabel">Diário de Classe</h5>
                        <div class="small opacity-75">Registro de conteúdo e frequência</div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body">
                    <input type="hidden" id="session_id">

                    <div class="row g-3">

                        <div class="col-lg-8">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-header bg-white border-bottom-0 pt-3">
                                    <div class="row align-items-center">
                                        <div class="col-md-7">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-1">Data e Hora da Aula</label>
                                            <div class="input-group">
                                                <input type="text" id="diario_date" class="form-control fw-bold border-end-0" placeholder="Toque para selecionar..." readonly>
                                                <span class="input-group-text border-start-0 text-muted" id="date-status-icon"></span>
                                            </div>
                                            <small id="date-msg" class="d-block mt-1 fw-bold" style="font-size: 0.8rem;"></small>
                                        </div>
                                        <div class="col-md-5 text-end d-none d-md-block">
                                            <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                                                <i class="fas fa-info-circle me-1"></i> Auto-Plano
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="card-body p-0 border-top">
                                    <textarea id="diario_content"></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="col-lg-4">
                            <div class="card border-0 shadow-sm h-100">
                                <div class="card-header bg-white border-bottom py-3">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="m-0 fw-bold text-secondary"><i class="fas fa-user-check me-2"></i>Frequência</h6>
                                        <small class="text-muted">Padrão: Presente</small>
                                    </div>
                                </div>
                                <div class="card-body p-0 attendance-scroll bg-body-tertiary">
                                    <div id="lista-alunos" class="p-2">
                                        <div class="text-center py-4 text-muted small">Carregando lista...</div>
                                    </div>
                                </div>
                                <div class="card-footer border-top p-3">
                                    <button class="btn btn-primary w-100 shadow-sm py-2" id="btn-save-diario" onclick="salvarDiario()">
                                        <i class="fas fa-save me-2"></i> Salvar Diário
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