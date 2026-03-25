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
    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only">

        <div class="d-none d-md-flex align-items-center mb-4 mt-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page"
                        style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Cursos
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">

                <div class="col-12 d-md-none mb-3 mt-2">
                    <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Buscar Curso</h5>
                </div>

                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Curso
                        </label>
                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <span class="input-group-text border-0 bg-transparent ps-3">
                                <i class="fas fa-search text-muted"></i>
                            </span>
                            <input type="text" id="busca-texto" class="form-control border-0 bg-transparent shadow-none" placeholder="Ex: Primeira Eucaristia, Crisma..." style="height: 48px;">
                        </div>
                    </div>

                    <div class="col-12 col-md-auto mt-3 mt-md-0 d-grid" data-slug="cursos.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center" style="height: 48px; border-radius: 12px; min-width: 180px;" onclick="modalCurso()">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Novo Curso</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4 bg-transparent-card overflow-hidden">
            <div class="card-body p-0 p-md-4">
                <div class="table-responsive list-table-cursos">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary border-2" role="status"></div>
                        <p class="mt-3 small fw-medium">Sincronizando banco de dados...</p>
                    </div>
                </div>
                <div class="pagination-cursos pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalCurso" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 text-center" id="modalLabel" style="letter-spacing: -0.5px;">
                        <i class="fas fa-layer-group me-3 opacity-75"></i> Gerenciar Curso
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <input type="hidden" id="course_id">

                    <div class="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-10 z-2 shadow-sm text-center">
                        <div class="modern-tabs-wrapper">
                            <ul class="nav nav-pills gap-2 justify-content-center" id="courseTab" role="tablist" style="flex-wrap: nowrap;">
                                <li class="nav-item">
                                    <button class="nav-link active fw-bold px-4 rounded-pill" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                        <i class="fas fa-circle-info me-2 opacity-75"></i> Dados Gerais
                                    </button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="grade-tab" data-bs-toggle="tab" data-bs-target="#tab-grade" type="button">
                                        <i class="fas fa-list-check me-2 opacity-75"></i> Grade Curricular
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content p-4">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="form-floating">
                                        <input type="text" id="course_name" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body" placeholder=" " style="height: 58px;">
                                        <label class="text-muted fw-bold small text-uppercase">Nome do Curso *</label>
                                    </div>
                                </div>
                                <div class="col-12 mt-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Descrição</label>
                                    <textarea id="course_description" class="form-control bg-white text-body fw-medium border-0 shadow-none rounded-4 p-3" rows="4" style="min-height: 200px;" placeholder="Breve resumo do conteúdo..."></textarea>
                                </div>

                                <div class="col-12 mt-4">
                                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                                        <div class="row g-3">
                                            <div class="col-12 col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Idade Mín.</label>
                                                <input type="number" id="min_age" class="form-control border-0 shadow-none text-center bg-white text-body fw-bold rounded-4" style="height: 48px;">
                                            </div>
                                            <div class="col-12 col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Idade Máx.</label>
                                                <input type="number" id="max_age" class="form-control border-0 shadow-none text-center bg-white text-body fw-bold rounded-4" style="height: 48px;">
                                            </div>
                                            <div class="col-12 col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Carga Total</label>
                                                <div class="input-group bg-white rounded-4 overflow-hidden border-0 shadow-none">
                                                    <input type="text" id="total_workload" class="form-control border-0 shadow-none text-center fw-bold text-primary bg-transparent" readonly style="height: 48px;">
                                                    <span class="input-group-text border-0 text-muted bg-transparent pe-3"><i class="fas fa-clock"></i></span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-grade">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner" data-slug="cursos.save">
                                <label class="form-label small fw-bold text-primary text-uppercase mb-3 ms-1"><i class="fas fa-plus-circle me-2"></i>Adicionar Disciplina</label>
                                <div class="row g-3 align-items-end">
                                    <div class="col-12 col-md-5">
                                        <select id="curr_subject" class="form-control border-0 shadow-none bg-white text-body fw-bold rounded-4" style="height: 48px;"></select>
                                    </div>
                                    <div class="col-6 col-md-2">
                                        <input type="number" id="curr_hours" class="form-control border-0 shadow-none rounded-4 text-center bg-white text-body fw-bold" placeholder="Hrs" style="height: 48px;">
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="d-flex align-items-center justify-content-center bg-white rounded-4 shadow-none px-3 border-0" style="height: 48px;">
                                            <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                                                <input class="form-check-input shadow-none m-0 border-secondary" type="checkbox" id="curr_mandatory" checked style="width: 40px; height: 20px; cursor: pointer;">
                                                <label class="form-check-label small fw-bold ms-2 text-muted text-uppercase" for="curr_mandatory" style="cursor: pointer;">Obrigatória</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-2 d-grid">
                                        <button class="btn btn-primary rounded-4 fw-bold shadow-sm transition-all hover-scale" onclick="addSubjectToGrid()" style="height: 48px;">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div id="lista-grade" class="d-flex flex-column gap-2"></div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="salvarCurso(this)" data-slug="cursos.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade no-print" id="modalTemplateAula" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 position-relative d-flex justify-content-center w-100 shadow-sm" style="z-index: 1090;">
                    <div class="d-flex align-items-center justify-content-center text-center flex-column">
                        <h5 class="modal-title fw-bold text-white mb-0 d-flex align-items-center" id="modalTemplateAulaLabel" style="letter-spacing: -0.5px;">
                            <i class="fas fa-map-location-dot me-3 opacity-75"></i> Planejamento de Curso
                        </h5>
                        <small class="text-white opacity-75 mt-1 fw-medium">Organize e planeje o roteiro dos encontros.</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" onclick="closeTemplateModal()"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <div class="sticky-top d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-10 shadow-sm" style="background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); z-index: 10;" data-slug="cursos.template">
                        <div class="d-flex gap-2">
                            <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center px-4 rounded-pill transition-all hover-scale" onclick="addPlan()">
                                <i class="fas fa-plus-circle me-2"></i> Adicionar Encontro
                            </button>
                            <button class="btn btn-outline-primary fw-bold shadow-sm d-flex align-items-center px-4 rounded-pill transition-all hover-scale" onclick="addDefaultModel()">
                                <i class="fas fa-wand-magic-sparkles me-2"></i> Gerar Padrão
                            </button>
                        </div>

                        <div class="d-none d-md-flex gap-2">
                            <input type="file" id="importFileXlsx" accept=".xlsx" class="d-none">
                            <button class="btn btn-light text-primary border border-secondary border-opacity-25 px-3 rounded-pill shadow-sm small fw-bold transition-all hover-bg-light" onclick="$('#importFileXlsx').click()">
                                <i class="fas fa-file-import me-1"></i> Importar
                            </button>
                            <button class="btn btn-light text-primary border border-secondary border-opacity-25 px-3 rounded-pill shadow-sm small fw-bold transition-all hover-bg-light" onclick="exportPlansXlsx()">
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

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" onclick="closeTemplateModal()" style="height: 48px;">
                        Fechar
                    </button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="closeTemplateModal()" data-slug="cursos.template" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
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