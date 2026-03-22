<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cursos - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>

    <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js"></script>
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">
        <div class="main-only">

            <div class="d-flex align-items-center mb-4">
                <nav aria-label="breadcrumb" class="w-100">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.2rem;">
                            Gestão de Cursos
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="card border-0 shadow-sm mb-4 rounded-4 bg-transparent-card">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex flex-column flex-md-row gap-3 align-items-md-end">

                        <div class="flex-grow-1">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search me-1 opacity-50"></i> Buscar Curso
                            </label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Ex: Primeira Eucaristia, Crisma...">
                        </div>

                        <div class="d-grid d-md-block mt-2 mt-md-0">
                            <button class="btn btn-primary fw-bold shadow-sm px-4" style="height: 42px;" onclick="modalCurso()">
                                <i class="fas fa-plus me-2"></i> Novo Curso
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-cursos" style="max-height: 600px;">
                        <div class="text-center py-5 opacity-50">
                            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                            <p class="mt-3 fw-medium">Carregando cursos...</p>
                        </div>
                    </div>
                    <div class="pagination paginationButtons pagination-cursos mt-3 text-center justify-content-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalCurso" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center" id="modalLabel">
                        <i class="fas fa-layer-group me-3 opacity-75"></i> Gerenciar Curso
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0">
                    <input type="hidden" id="course_id">

                    <div class="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-10">
                        <div class="modern-tabs-wrapper">
                            <ul class="nav nav-pills gap-1" id="courseTab" role="tablist" style="flex-wrap: nowrap;">
                                <li class="nav-item">
                                    <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                        <i class="fas fa-circle-info me-2"></i> Dados Gerais
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" id="grade-tab" data-bs-toggle="tab" data-bs-target="#tab-grade" type="button">
                                        <i class="fas fa-list-check me-2"></i> Grade Curricular
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content p-4">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Nome do Curso *</label>
                                    <input type="text" id="course_name" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none" placeholder="Ex: Iniciação à Vida Cristã">
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Descrição</label>
                                    <textarea id="course_description" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none" rows="3" placeholder="Breve resumo do conteúdo..."></textarea>
                                </div>

                                <div class="col-12">
                                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3">
                                        <div class="row g-3">
                                            <div class="col-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Idade Mín.</label>
                                                <input type="number" id="min_age" class="form-control bg-body border-0 shadow-none text-center">
                                            </div>
                                            <div class="col-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Idade Máx.</label>
                                                <input type="number" id="max_age" class="form-control bg-body border-0 shadow-none text-center">
                                            </div>
                                            <div class="col-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Carga Total</label>
                                                <div class="input-group">
                                                    <input type="text" id="total_workload" class="form-control bg-body border-0 shadow-none text-center fw-bold text-primary" readonly>
                                                    <span class="input-group-text border-0 bg-body text-muted"><i class="fas fa-clock"></i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-grade">

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 mb-4">
                                <div class="row g-3 align-items-end">
                                    <div class="col-12 col-md-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Adicionar Disciplina</label>
                                        <select id="curr_subject" class="form-control border-0 shadow-none"></select>
                                    </div>
                                    <div class="col-6 col-md-2">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Horas</label>
                                        <input type="number" id="curr_hours" class="form-control border-0 shadow-none text-center" placeholder="20">
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="form-check form-switch mb-2">
                                            <input class="form-check-input shadow-none" type="checkbox" id="curr_mandatory" checked>
                                            <label class="form-check-label small fw-bold" for="curr_mandatory">Obrigatória</label>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-1">
                                        <button class="btn btn-primary w-100 rounded-3" onclick="addSubjectToGrid()" style="height: 38px;">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="lista-grade" class="d-flex flex-column gap-2">
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm btn-save" onclick="salvarCurso(this)">
                        <i class="fas fa-save me-2"></i> Salvar Curso
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade no-print" id="modalTemplateAula" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <div class="d-flex align-items-center">
                        <div class="bg-opacity-20 p-2 rounded-3 me-3">
                            <i class="fas fa-map-location-dot text-white fs-4"></i>
                        </div>
                        <div class="d-flex flex-column">
                            <h5 class="modal-title fw-bold text-white mb-0" id="modalTemplateAulaLabel">Planejamento de Curso</h5>
                            <small class="text-white opacity-75">Organize o roteiro de encontros e temas</small>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white shadow-none" onclick="closeTemplateModal()"></button>
                </div>

                <div class="modal-body p-0">
                    <div class="sticky-top d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-10 shadow-sm" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); z-index: 10;">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center px-3" onclick="addPlan()">
                                <i class="fas fa-plus-circle me-2"></i> Adicionar Encontro
                            </button>
                            <button class="btn btn-outline-primary fw-bold shadow-sm d-flex align-items-center px-3 bg-body" onclick="addDefaultModel()">
                                <i class="fas fa-wand-magic-sparkles me-2"></i> Gerar Modelo Padrão
                            </button>
                        </div>

                        <div class="d-none d-md-flex gap-2">
                            <input type="file" id="importFileXlsx" accept=".xlsx" class="d-none">
                            <button class="btn btn-link text-muted text-decoration-none small fw-bold" onclick="$('#importFileXlsx').click()">
                                <i class="fas fa-file-import me-1"></i> Importar
                            </button>
                            <button class="btn btn-link text-muted text-decoration-none small fw-bold" onclick="exportPlansXlsx()">
                                <i class="fas fa-file-export me-1"></i> Exportar
                            </button>
                        </div>
                    </div>

                    <div id="accordionPlans" class="accordion accordion-flush p-3 p-md-4">
                        <div class="text-center py-5 opacity-50">
                            <span class="material-symbols-outlined fs-1 spin">auto_mode</span>
                            <p class="mt-2 fw-medium">Carregando roteiro...</p>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" onclick="closeTemplateModal()">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-3 shadow-sm transition-all" onclick="closeTemplateModal()">
                        <i class="fas fa-check-double me-2"></i> Concluir Planejamento
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
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/lang/summernote-pt-BR.min.js"></script>
    <script src="assets/js/cursos.js?v=<?php echo time(); ?>"></script>

</body>

</html>