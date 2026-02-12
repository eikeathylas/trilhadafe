<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Cursos - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>
    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">

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

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Painel</a></li>
                    <li class="breadcrumb-item active">Escola da Fé</li>
                    <li class="breadcrumb-item active" aria-current="page">Gestão de Cursos</li>
                </ol>
            </nav>

            <div class="card list-commanded mb-4">
                <div class="card-header border-bottom-0 bg-transparent px-0 pb-0">
                    <div class="row align-items-end">
                        <div class="col-md-8">
                            <label class="form-label title">Buscar Curso:</label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Ex: Primeira Eucaristia, Crisma...">
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn-filter mt-4" onclick="modalCurso()">
                                <i class="fas fa-plus mr-1"></i> Novo Curso
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-cursos"></div>
                    <div class="pagination paginationButtons pagination-cursos mt-3 text-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalCurso" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title fs-5" id="modalLabel">Gerenciar Curso</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="course_id">

                    <ul class="nav nav-tabs nav-tabs-custom mb-4" id="courseTab" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                <i class="fas fa-info-circle me-2"></i> Dados
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" id="grade-tab" data-bs-toggle="tab" data-bs-target="#tab-grade" type="button">
                                <i class="fas fa-layer-group me-2"></i> Grade Curricular
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content" id="courseTabContent">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label opacity-75 small fw-bold">NOME DO CURSO <span class="text-danger">*</span></label>
                                    <input type="text" id="course_name" class="form-control" placeholder="Ex: Iniciação à Vida Cristã">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label opacity-75 small fw-bold">DESCRIÇÃO</label>
                                    <textarea id="course_description" class="form-control" rows="3"></textarea>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label opacity-75 small fw-bold">IDADE MÍNIMA</label>
                                    <input type="number" id="min_age" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label opacity-75 small fw-bold">IDADE MÁXIMA</label>
                                    <input type="number" id="max_age" class="form-control">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label opacity-75 small fw-bold">CARGA TOTAL</label>
                                    <div class="input-group">
                                        <input type="text" id="total_workload" class="form-control" readonly style="opacity: 0.7;">
                                        <span class="input-group-text border-start-0 bg-transparent"><i class="fas fa-clock"></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-grade">

                            <div class="p-3 mb-4 rounded border border-dashed d-flex flex-wrap align-items-end gap-3" style="background-color: rgba(128,128,128, 0.03);">
                                <div class="flex-grow-1" style="min-width: 250px;">
                                    <label class="form-label small mb-1 opacity-75">ADICIONAR DISCIPLINA</label>
                                    <select id="curr_subject" class="form-control"></select>
                                </div>
                                <div style="width: 100px;">
                                    <label class="form-label small mb-1 opacity-75">HORAS</label>
                                    <input type="number" id="curr_hours" class="form-control text-center" placeholder="20">
                                </div>
                                <div class="d-flex align-items-center pb-2">
                                    <div class="form-check form-switch me-3">
                                        <input class="form-check-input" type="checkbox" id="curr_mandatory" checked>
                                        <label class="form-check-label small" for="curr_mandatory">Obrigatória</label>
                                    </div>
                                    <button class="btn btn-primary btn-sm px-3 shadow-sm btn-hover-effect" onclick="addSubjectToGrid()">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="table-responsive rounded border">
                                <table class="table table-hover align-middle mb-0" id="table-grade">
                                    <thead style="background-color: rgba(128,128,128,0.05);">
                                        <tr>
                                            <th class="ps-3 py-3 border-0 small opacity-75">DISCIPLINA</th>
                                            <th class="text-center py-3 border-0 small opacity-75">CARGA</th>
                                            <th class="text-center py-3 border-0 small opacity-75">TIPO</th>
                                            <th class="text-end pe-3 py-3 border-0 small opacity-75">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-grade"></tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-outline-secondary btn-hover-effect" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary px-4 btn-save btn-hover-effect" onclick="salvarCurso()">
                        <i class="fas fa-save me-2"></i> Salvar Curso
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalTemplateAula" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white border-0">
                    <div class="d-flex flex-column">
                        <h5 class="modal-title fs-5" id="modalTemplateAulaLabel">Planejamento</h5>
                        <small class="opacity-75" style="font-size: 0.8rem;">Organize o conteúdo programático</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white" onclick="closeTemplateModal()"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <div class="d-flex justify-content-between align-items-center p-3 border-bottom" style="background-color: rgba(128,128,128, 0.05);">
                        <div>
                            <button class="btn btn-success btn-sm shadow-sm btn-hover-effect me-2" onclick="addPlan()">
                                <i class="fas fa-plus-circle me-1"></i> Adicionar Encontro
                            </button>
                            <button class="btn btn-outline-primary btn-sm shadow-sm btn-hover-effect" onclick="addDefaultModel()">
                                <i class="fas fa-magic me-1"></i> Modelo Padrão
                            </button>
                        </div>

                        <!-- <div class="btn-group shadow-sm">
                            <button class="btn btn-outline-secondary btn-sm border bg-body btn-hover-effect" onclick="importPlansXlsx()">
                                <i class="fas fa-file-excel text-success me-1"></i> Importar XLSX
                            </button>
                            <button class="btn btn-outline-secondary btn-sm border bg-body btn-hover-effect" onclick="exportPlansXlsx()">
                                <i class="fas fa-download text-primary me-1"></i> Baixar XLSX
                            </button>
                        </div> -->
                        <input type="file" id="importFileXlsx" accept=".xlsx" class="d-none">
                    </div>

                    <div id="accordionPlans" class="accordion accordion-flush"></div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-primary px-4 btn-hover-effect" onclick="closeTemplateModal()">
                        <i class="fas fa-check me-2"></i> Concluir Planejamento
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
    <script src="assets/js/cursos.js?v=<?php echo time(); ?>"></script>

</body>

</html>