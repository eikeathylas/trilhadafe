<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestão de Turmas - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>
    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only">

        <div class="d-none d-md-flex align-items-center mb-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page"
                        style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Turmas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">

                <div class="col-12 d-md-none mb-3">
                    <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Buscar Turma</h4>
                </div>

                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md-9">
                        <label class="form-label d-none d-md-flex" for="busca-texto">
                            <i class="fas fa-search opacity-50"></i> Buscar Turma
                        </label>
                        <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Ex: Nome da turma, curso ou coordenador...">
                    </div>

                    <div class="col-12 col-md-3 mt-3 mt-md-0">
                        <button class="btn btn-primary fw-bold shadow-sm w-100" style="height: 50px;" onclick="modalTurma()">
                            <i class="fas fa-plus me-2"></i>
                            <span class="d-none d-md-inline">Nova Turma</span>
                            <span class="d-inline d-md-none">Adicionar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>


        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body px-0 pt-4">
                <div class="table-responsive list-table-turmas">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                        <p class="mt-3 fw-medium">Carregando turmas...</p>
                    </div>
                </div>
                <div class="pagination paginationButtons pagination-turmas mt-3 text-center justify-content-center"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalTurma" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center" id="modalLabel">
                        <i class="fas fa-people-group me-3 opacity-75"></i> Gerenciar Turma
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0"> <input type="hidden" id="class_id">

                    <div class="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-10 z-2 shadow-sm">
                        <div class="modern-tabs-wrapper">
                            <ul class="nav nav-pills gap-1" id="turmaTab" role="tablist" style="flex-wrap: nowrap;">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active fw-medium" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab" aria-selected="true">
                                        <i class="fas fa-circle-info me-2"></i> Dados Gerais
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link fw-medium" id="horario-tab" data-bs-toggle="tab" data-bs-target="#tab-horarios" type="button" role="tab" aria-selected="false" tabindex="-1">
                                        <i class="fas fa-clock me-2"></i> Grade Horária
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link fw-medium" id="alunos-tab" data-bs-toggle="tab" data-bs-target="#tab-alunos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                        <i class="fas fa-user-graduate me-2"></i> Catequizandos
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content p-4">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-12 col-md-8">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome da Turma *</label>
                                    <input type="text" id="class_name" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none" placeholder="Ex: Eucaristia Sábado Manhã">
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Curso Vinculado *</label>
                                    <select id="sel_course" class="form-control border-0 shadow-none"></select>
                                </div>

                                <div class="col-12">
                                    <div class="card border-0 rounded-3 bg-secondary bg-opacity-10 p-3">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Coordenador / Catequista</label>
                                                <select id="sel_coordinator" class="form-control border-0 shadow-none"></select>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Auxiliar de Turma</label>
                                                <select id="sel_assistant" class="form-control border-0 shadow-none"></select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-6 col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Capacidade</label>
                                    <input type="number" id="class_capacity" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none">
                                </div>
                                <div class="col-6 col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Status</label>
                                    <select id="class_status" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none">
                                        <option value="ACTIVE">Ativa</option>
                                        <option value="PLANNED">Planejada</option>
                                        <option value="FINISHED">Encerrada</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Sala Principal</label>
                                    <select id="sel_location" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none"></select>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-horarios">
                            <div class="card border-0 rounded-3 bg-secondary bg-opacity-10 p-3 mb-4">
                                <div class="row g-2 align-items-end">
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small fw-bold text-muted text-uppercase mb-2">Dia</label>
                                        <select id="sched_day" class="form-control border-0 shadow-none">
                                            <option value="6">Sábado</option>
                                            <option value="0">Domingo</option>
                                        </select>
                                    </div>
                                    <div class="col-3 col-md-2">
                                        <label class="form-label small fw-bold text-muted text-uppercase mb-2">Início</label>
                                        <input type="time" id="sched_start" class="form-control border-0 shadow-none px-2">
                                    </div>
                                    <div class="col-3 col-md-2">
                                        <label class="form-label small fw-bold text-muted text-uppercase mb-2">Fim</label>
                                        <input type="time" id="sched_end" class="form-control border-0 shadow-none px-2">
                                    </div>
                                    <div class="col-10 col-md-4">
                                        <label class="form-label small fw-bold text-muted text-uppercase mb-2">Sala Local</label>
                                        <select id="sel_location_sched" class="form-control border-0 shadow-none"></select>
                                    </div>
                                    <div class="col-2 col-md-1">
                                        <button class="btn btn-primary w-100 rounded-3" onclick="addSchedule()" style="height: 38px;">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-horarios" class="d-flex flex-column gap-2">
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-alunos">
                            <div class="d-flex gap-2 mb-4">
                                <div class="flex-grow-1">
                                    <select id="sel_new_student" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none" placeholder="Busque o catequizando..."></select>
                                </div>
                                <button class="btn btn-primary fw-bold px-3 shadow-sm rounded-3" onclick="matricularAluno(this)">
                                    <i class="fas fa-plus me-2"></i> Matricular
                                </button>
                            </div>

                            <div id="lista-alunos" class="d-flex flex-column gap-2">
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarTurma(this)">
                        <i class="fas fa-save me-2"></i> Salvar Turma
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade no-print" id="modalHistoricoAluno" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-secondary bg-opacity-75 py-3 px-4">
                    <h5 class="modal-title fs-5 fw-bold text-white d-flex align-items-center" id="modalLabel">
                        <i class="fas fa-clock-rotate-left me-3 opacity-75"></i>
                        Histórico: <span id="hist_student_name" class="ms-1 fw-light"></span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="hist_enrollment_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-4">
                        <div class="card-body p-3">
                            <label class="form-label small fw-bold text-uppercase text-primary mb-2" style="letter-spacing: 0.5px;">
                                <i class="fas fa-pen-to-square me-1"></i> Nova Ocorrência / Status
                            </label>
                            <div class="row g-2 align-items-center">
                                <div class="col-12 col-md-4">
                                    <select id="hist_action" class="form-control border-0 shadow-none">
                                        <option value="COMMENT">Apenas Observação</option>
                                        <option value="SUSPENDED">Suspender</option>
                                        <option value="DROPPED">Desistência / Abandono</option>
                                        <option value="TRANSFERRED">Transferido</option>
                                        <option value="ACTIVE">Reativar Matrícula</option>
                                        <option value="COMPLETED">Concluiu o Curso</option>
                                    </select>
                                </div>
                                <div class="col-12 col-md-6">
                                    <input type="text" id="hist_obs" class="form-control border-0 shadow-none" placeholder="Motivo ou detalhe...">
                                </div>
                                <div class="col-12 col-md-2">
                                    <button class="btn btn-primary fw-bold w-100 shadow-sm" onclick="addHistoryItem(this)">
                                        <i class="fas fa-check"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="d-flex align-items-center mb-3">
                        <hr class="flex-grow-1 opacity-10">
                        <span class="mx-3 small fw-bold text-uppercase text-muted" style="letter-spacing: 1px;">Linha do Tempo</span>
                        <hr class="flex-grow-1 opacity-10">
                    </div>

                    <div id="lista-historico-detalhe" class="d-flex flex-column gap-3" style="max-height: 350px; overflow-y: auto; padding-right: 5px;">
                        <div class="text-center py-5 opacity-50">
                            <span class="material-symbols-outlined fs-1">manage_search</span>
                            <p class="mt-2 small mb-0">Carregando movimentos...</p>
                        </div>
                    </div>

                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent text-center justify-content-center">
                    <button type="button" class="btn btn-light fw-bold px-5 rounded-3 border" data-bs-dismiss="modal">Fechar Histórico</button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/turmas.js?v=<?php echo time(); ?>"></script>

</body>

</html>