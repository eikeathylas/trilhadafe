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
    
    <style>
        /* Fix Z-Index do Summernote em Modais */
        .note-modal-backdrop { z-index: 1065 !important; }
        .note-modal-content { z-index: 1070 !important; }
        .note-popover { z-index: 1070 !important; }
        .note-editor.fullscreen { z-index: 1070 !important; }
        
        /* Ajuste do Modal */
        .modal-content { border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.15); }
        .modal-header { border-bottom: 1px solid rgba(0,0,0,0.05); }
        .modal-footer { border-top: 1px solid rgba(0,0,0,0.05); background-color: transparent !important; }
        
        /* Accordion Customizado */
        .custom-accordion .accordion-button:not(.collapsed) {
            background-color: #f8f9fa;
            color: #4e73df;
            box-shadow: none;
        }
        .custom-accordion .accordion-button:focus { box-shadow: none; }
        .hover-scale:hover { transform: scale(1.1); transition: 0.2s; }
    </style>
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
                
                <div class="modal-body">
                    <input type="hidden" id="course_id">

                    <ul class="nav nav-tabs nav-tabs-custom mb-4" id="courseTab" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                <i class="fas fa-info-circle me-2"></i> Dados Gerais
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
                                    <label class="form-label fw-bold">Nome do Curso <span class="text-danger">*</span></label>
                                    <input type="text" id="course_name" class="form-control" placeholder="Ex: Iniciação à Vida Cristã">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Descrição</label>
                                    <textarea id="course_description" class="form-control" rows="3" placeholder="Objetivos e detalhes do curso..."></textarea>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Idade Mínima</label>
                                    <div class="input-group">
                                        <input type="number" id="min_age" class="form-control" placeholder="Ex: 9">
                                        <span class="input-group-text">anos</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Idade Máxima</label>
                                    <div class="input-group">
                                        <input type="number" id="max_age" class="form-control" placeholder="Ex: 12">
                                        <span class="input-group-text">anos</span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Carga Total Estimada</label>
                                    <div class="input-group">
                                        <input type="text" id="total_workload" class="form-control bg-light" readonly>
                                        <span class="input-group-text"><i class="fas fa-clock"></i></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-grade">
                            
                            <div class="card border border-dashed bg-light mb-4">
                                <div class="card-body p-3">
                                    <h6 class="card-title text-muted text-uppercase small fw-bold mb-3">
                                        <i class="fas fa-plus-circle me-1"></i> Adicionar Disciplina à Grade
                                    </h6>
                                    <div class="row g-2 align-items-end">
                                        <div class="col-md-6">
                                            <label class="form-label small mb-1">Disciplina</label>
                                            <select id="curr_subject" class="form-control"></select>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label small mb-1">Carga Horária</label>
                                            <div class="input-group input-group-sm">
                                                <input type="number" id="curr_hours" class="form-control" placeholder="20">
                                                <span class="input-group-text">h</span>
                                            </div>
                                        </div>
                                        <div class="col-md-3 d-flex align-items-center justify-content-between">
                                            <div class="form-check form-switch pt-2">
                                                <input class="form-check-input" type="checkbox" id="curr_mandatory" checked>
                                                <label class="form-check-label small" for="curr_mandatory">Obrigatória</label>
                                            </div>
                                            <button class="btn btn-primary btn-sm px-3" onclick="addSubjectToGrid()">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive rounded border">
                                <table class="table table-hover align-middle mb-0">
                                    <thead class="bg-light text-secondary small text-uppercase">
                                        <tr>
                                            <th class="ps-3 py-3 border-0">Disciplina</th>
                                            <th class="text-center py-3 border-0">Carga</th>
                                            <th class="text-center py-3 border-0">Tipo</th>
                                            <th class="text-end pe-3 py-3 border-0">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-grade" class="bg-white border-top"></tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer border-top-0 pt-0">
                    <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary px-4 btn-save" onclick="salvarCurso()">
                        <i class="fas fa-check me-2"></i> Salvar Curso
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalTemplateAula" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                    <div class="d-flex flex-column">
                        <h5 class="modal-title fs-5" id="modalTemplateAulaLabel">Planejamento</h5>
                        <small class="opacity-75" style="font-size: 0.8rem;">Organize o conteúdo programático de cada encontro</small>
                    </div>
                    <button type="button" class="btn-close btn-close-white" onclick="closeTemplateModal()"></button>
                </div>
                
                <div class="modal-body bg-light">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <button class="btn btn-success btn-sm shadow-sm" onclick="addPlan()">
                            <i class="fas fa-plus-circle me-1"></i> Adicionar Encontro
                        </button>
                        
                        <div class="btn-group shadow-sm">
                            <button class="btn btn-white btn-sm border text-secondary" onclick="importPlans()">
                                <i class="fas fa-file-upload me-1"></i> Importar
                            </button>
                            <button class="btn btn-white btn-sm border text-secondary" onclick="exportPlans()">
                                <i class="fas fa-file-download me-1"></i> Baixar
                            </button>
                        </div>
                        <input type="file" id="importFile" accept=".json" class="d-none">
                    </div>

                    <div id="accordionPlans" class="accordion custom-accordion"></div>
                </div>

                <div class="modal-footer border-top-0">
                    <button type="button" class="btn btn-primary px-4" onclick="closeTemplateModal()">
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