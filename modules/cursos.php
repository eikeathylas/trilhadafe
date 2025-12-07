<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Cursos - Trilha da Fé</title>

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
                    <div class="table-responsive list-table-cursos">
                    </div>
                    <div class="pagination paginationButtons pagination-cursos mt-3 text-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalCurso" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white" id="modalLabel">Gerenciar Curso</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="course_id">

                    <ul class="nav nav-tabs mb-3" id="courseTab" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                <i class="fas fa-info-circle mr-2"></i> Dados do Curso
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" id="grade-tab" data-bs-toggle="tab" data-bs-target="#tab-grade" type="button">
                                <i class="fas fa-list-ol mr-2"></i> Grade Curricular
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content pt-3" id="courseTabContent">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-md-12">
                                    <label class="form-label">Nome do Curso <span class="text-danger">*</span></label>
                                    <input type="text" id="course_name" class="form-control" placeholder="Ex: Iniciação Cristã de Adultos">
                                </div>
                                <div class="col-md-12">
                                    <label class="form-label">Descrição / Objetivo</label>
                                    <textarea id="course_description" class="form-control" rows="2"></textarea>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Idade Mínima</label>
                                    <input type="number" id="min_age" class="form-control" placeholder="Ex: 9">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Idade Máxima</label>
                                    <input type="number" id="max_age" class="form-control" placeholder="Ex: 12">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Carga Horária Total (h)</label>
                                    <input type="text" id="total_workload" class="form-control" readonly disabled>
                                    <small class="text-muted" style="font-size: 0.75rem;">Calculado automaticamente pela grade.</small>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-grade">
                            <div class="alert alert-info border-0 shadow-sm mb-3 py-2">
                                <small><i class="fas fa-info-circle me-1"></i> Adicione as disciplinas que compõem este curso.</small>
                            </div>

                            <div class="card bg-light border-0 mb-3">
                                <div class="card-body py-2">
                                    <div class="row align-items-end g-2">
                                        <div class="col-md-6">
                                            <label class="form-label small fw-bold">Disciplina:</label>
                                            <select id="curr_subject" class="form-control"></select>
                                        </div>
                                        <div class="col-md-3">
                                            <label class="form-label small fw-bold">Carga (h):</label>
                                            <input type="number" id="curr_hours" class="form-control form-control-sm" placeholder="Ex: 20">
                                        </div>
                                        <div class="col-md-2 text-center">
                                            <div class="form-check form-switch d-inline-block">
                                                <input class="form-check-input" type="checkbox" id="curr_mandatory" checked>
                                                <label class="form-check-label small" for="curr_mandatory">Obrigatória</label>
                                            </div>
                                        </div>
                                        <div class="col-md-1">
                                            <button class="btn btn-sm btn-success w-100" onclick="addSubjectToGrid()" title="Adicionar">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Disciplina</th>
                                            <th class="text-center" width="100">Horas</th>
                                            <th class="text-center" width="120">Tipo</th>
                                            <th class="text-center" width="80">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-grade">
                                        <tr>
                                            <td colspan="4" class="text-center text-muted py-3">Nenhuma disciplina adicionada.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save" onclick="salvarCurso()">
                        <i class="fas fa-save me-2"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/cursos.js?v=<?php echo time(); ?>"></script>

</body>

</html>