<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Diário de Classe - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/dark.css" id="flatpickr-theme-dark" disabled>
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css" rel="stylesheet">
</head>

<body>
    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only">

        <div class="d-none d-md-flex align-items-center mb-4 mt-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Diário de Classe
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">

                    <div class="col-12 d-md-none mb-0 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Diário de Classe</h5>
                    </div>

                    <div class="col-12 col-md-5 flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" for="sel_filter_class" style="letter-spacing: 0.5px;">
                            <i class="fas fa-users opacity-50 me-1"></i> 1. Selecione a Turma
                        </label>
                        <select id="sel_filter_class" class="form-control shadow-sm" style="height: 48px; border-radius: 12px;">
                            <option value="">Buscando turmas...</option>
                        </select>
                    </div>

                    <div class="col-12 col-md-5 flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" for="sel_filter_subject" style="letter-spacing: 0.5px;">
                            <i class="fas fa-book-open opacity-50 me-1"></i> 2. Selecione a Disciplina
                        </label>
                        <select id="sel_filter_subject" class="form-control shadow-sm" disabled style="height: 48px; border-radius: 12px;">
                            <option value="">Primeiro selecione a turma...</option>
                        </select>
                    </div>

                    <div class="col-12 mt-3 mt-md-0 col-md-2 d-grid d-md-block" data-slug="diario.create">
                        <button id="btn_new_session" class="btn btn-primary fw-bold w-100 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" disabled onclick="openSessionModal()" style="height: 48px; border-radius: 12px;">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Nova Aula</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-0 pt-md-4 px-md-3">
                <div class="table-responsive list-table-diario" style="max-height: 70vh;" data-slug="diario.list">
                    <div class="text-center py-5 text-muted opacity-50">
                        <i class="fas fa-arrow-up mb-3 d-block" style="font-size: 2.5rem;"></i>
                        <h6 class="fw-bold text-body">Selecione Turma e Disciplina</h6>
                        <p class="small text-secondary">Utilize os filtros acima para visualizar ou lançar o diário.</p>
                    </div>
                </div>
                <div class="pagination-diario pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade modal-fullscreen-native" id="modalSession" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 shadow-sm position-relative" style="z-index: 1090;">
                    <div class="d-flex align-items-center">
                        <div class="bg-white bg-opacity-25 d-flex align-items-center justify-content-center rounded-circle me-3" style="width: 48px; height: 48px;">
                            <i class="fas fa-book-open text-white fs-5"></i>
                        </div>
                        <div>
                            <h5 class="modal-title fw-bold text-white mb-0 lh-1" id="modalSessionLabel" style="letter-spacing: -0.5px;">Diário de Classe</h5>
                            <div class="small text-white opacity-75 mt-1 fw-medium">Registro de conteúdo e frequência</div>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-3 p-md-4 bg-body">
                    <input type="hidden" id="session_id">

                    <div class="d-flex flex-column flex-lg-row w-100 gap-3 gap-lg-0 wrapper-diario">

                        <div id="pane-editor" class="d-flex flex-column" style="flex-basis: 60%; min-width: 30%;">
                            <div class="card border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 h-100 overflow-hidden shadow-inner">
                                <div class="card-header bg-transparent border-0 pt-4 px-4 pb-3">
                                    <div class="row align-items-center">
                                        <div class="col-md-7">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" for="diario_date" style="letter-spacing: 0.5px;">
                                                <i class="far fa-calendar-check opacity-50 me-1"></i> Data e Hora da Aula
                                            </label>
                                            <div class="input-group bg-white shadow-sm rounded-4 overflow-hidden border-0">
                                                <input type="text" id="diario_date" class="form-control fw-bold border-0 text-body shadow-none px-4 bg-transparent" placeholder="Toque para selecionar..." readonly style="height: 52px; cursor: pointer;">
                                                <span class="input-group-text border-0 bg-transparent px-3 pe-4" id="date-status-icon"></span>
                                            </div>
                                            <small id="date-msg" class="d-block mt-2 fw-bold text-truncate text-body ms-2" style="font-size: 0.75rem;"></small>
                                        </div>
                                        <div class="col-md-5 text-end d-none d-md-block mt-4">
                                            <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-3 py-2 rounded-pill fw-bold">
                                                <i class="fas fa-magic me-1"></i> Preenchimento Inteligente
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div class="card-body p-3 p-md-4 pt-0 d-flex flex-column">
                                    <div class="summernote-wrapper flex-grow-1">
                                        <textarea id="diario_content" class="w-100"></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="resizer d-none d-lg-flex mx-1" id="dragMe"></div>

                        <div id="pane-attendance" class="d-flex flex-column" style="flex-basis: 40%; min-width: 25%;">
                            <div class="card border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 h-100 d-flex flex-column shadow-inner">
                                <div class="card-header bg-transparent border-bottom border-secondary border-opacity-10 py-3 px-4">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <h6 class="m-0 fw-bold text-body d-flex align-items-center">
                                            <i class="fas fa-user-check me-2 text-success opacity-75"></i>Frequência
                                        </h6>
                                        <span class="badge bg-secondary bg-opacity-10 text-muted fw-bold border border-secondary border-opacity-10 rounded-pill px-2 py-1" style="font-size: 0.7rem;">Padrão: Presente</span>
                                    </div>
                                </div>

                                <div class="card-body p-0 attendance-scroll bg-transparent" style="max-height: 480px; overflow-y: auto; overflow-x: hidden;">
                                    <div id="lista-alunos" class="p-0">
                                        <div class="text-center py-5 text-muted opacity-50">
                                            <span class="material-symbols-outlined spin fs-1">sync</span>
                                            <p class="mt-2 small mb-0 fw-medium">Carregando lista...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button class="btn btn-primary shadow-sm rounded-4 fw-bold px-5 d-flex align-items-center justify-content-center transition-all w-100 w-md-auto hover-scale" onclick="salvarDiario(this)" style="height: 48px; min-width: 220px;" data-slug="diario.save">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
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

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (document.documentElement.getAttribute('data-theme') === 'escuro') {
                document.getElementById('flatpickr-theme-dark').removeAttribute('disabled');
            }
        });
    </script>

    <script src="assets/js/diario.js?v=<?php echo time(); ?>"></script>

</body>

</html>