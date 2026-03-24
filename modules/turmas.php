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

        <div class="d-none d-md-flex align-items-center mb-4 mt-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Turmas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">

                    <div class="col-12 d-md-none mb-2">
                        <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Turmas</h4>
                    </div>

                    <div class="col-12 col-md flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Turma
                        </label>
                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <span class="input-group-text border-0 bg-transparent ps-3">
                                <i class="fas fa-search text-muted"></i>
                            </span>
                            <input type="text" id="busca-texto" class="form-control border-0 bg-transparent shadow-none" placeholder="Nome da turma, curso ou local..." style="height: 48px;">
                        </div>
                    </div>

                    <div class="col-12 col-md-auto d-grid" data-slug="turmas.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center" onclick="modalTurma()" style="height: 48px; border-radius: 12px; min-width: 160px;">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Nova Turma</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <div class="card list-commanded border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4 bg-transparent-card overflow-hidden">
            <div class="card-body p-0 p-md-4">
                <div class="list-table-turmas">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary border-2" role="status"></div>
                        <p class="mt-2 small fw-medium">Sincronizando banco de dados...</p>
                    </div>
                </div>

                <div class="pagination-turmas mt-4 pb-4 pb-md-0 w-100"></div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Footer.php"; ?>

    <div class="modal fade" id="modalTurma" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5" id="modalLabel">
                        <i class="fas fa-layer-group me-3 opacity-75"></i> Configurar Turma
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-10 z-2 shadow-sm text-center">
                    <div class="modern-tabs-wrapper">
                        <ul class="nav nav-pills gap-1" id="turmaTab" role="tablist" style="flex-wrap: nowrap;">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active fw-medium" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab" aria-selected="true">
                                    <i class="fas fa-id-card me-2"></i> Geral
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link fw-medium" id="horario-tab" data-bs-toggle="tab" data-bs-target="#tab-horarios" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-clock me-2"></i> Grade
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link fw-medium" id="alunos-tab" data-bs-toggle="tab" data-bs-target="#tab-alunos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-users-viewfinder me-2"></i> Alunos
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="modal-body p-0 modal-body-scrollable bg-body">
                    <input type="hidden" id="class_id">

                    <div class="tab-content p-4">
                        <div class="tab-pane fade show active" id="tab-dados" role="tabpanel">
                            <div class="row g-3">
                                <div class="col-12">
                                    <div class="form-floating">
                                        <input type="text" id="class_name" class="form-control border-0 bg-secondary bg-opacity-10 rounded-3 shadow-none" placeholder=" " style="height: 58px;">
                                        <label class="text-muted fw-bold small text-uppercase">Nome da Turma *</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-muted text-uppercase mb-1 ms-1">Curso / Catequese</label>
                                    <select id="sel_course" class="form-control"></select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold text-muted text-uppercase mb-1 ms-1">Coordenador Principal</label>
                                    <select id="sel_coordinator" class="form-control"></select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold text-muted text-uppercase mb-1 ms-1">Auxiliar</label>
                                    <select id="sel_assistant" class="form-control"></select>
                                </div>
                                <div class="col-6">
                                    <div class="form-floating">
                                        <input type="number" id="class_capacity" class="form-control border-0 bg-secondary bg-opacity-10 rounded-3 shadow-none" placeholder=" " style="height: 58px;">
                                        <label class="text-muted fw-bold small text-uppercase">Capacidade</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-floating">
                                        <select id="class_status" class="form-select border-0 bg-secondary bg-opacity-10 rounded-3 shadow-none" style="height: 58px;">
                                            <option value="ACTIVE">Ativa</option>
                                            <option value="PLANNED">Planejada</option>
                                            <option value="FINISHED">Encerrada</option>
                                        </select>
                                        <label class="text-muted fw-bold small text-uppercase">Estado Atual</label>
                                    </div>
                                </div>
                                <div class="col-12">
                                    <label class="form-label small fw-bold text-muted text-uppercase mb-1 ms-1">Sala Padrão da Turma</label>
                                    <select id="sel_location" class="form-control"></select>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-horarios" role="tabpanel">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 mb-3 shadow-inner" data-slug="turmas.edit">
                                <label class="form-label small fw-bold text-primary text-uppercase mb-3 ms-1">Adicionar Período</label>
                                <div class="row g-2">
                                    <div class="col-12 col-md-4">
                                        <select id="sched_day" class="form-select border-0 rounded-3 shadow-sm px-2" style="height: 48px;">
                                            <option value="6">Sábado</option>
                                            <option value="0">Domingo</option>
                                            <option value="1">Segunda</option>
                                            <option value="2">Terça</option>
                                            <option value="3">Quarta</option>
                                            <option value="4">Quinta</option>
                                            <option value="5">Sexta</option>
                                        </select>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <input type="time" id="sched_start" class="form-control border-0 rounded-3 shadow-sm" style="height: 48px;">
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <input type="time" id="sched_end" class="form-control border-0 rounded-3 shadow-sm" style="height: 48px;">
                                    </div>
                                    <div class="col-12 col-md-2">
                                        <button class="btn btn-primary w-100 fw-bold rounded-3 shadow-sm h-100" onclick="addSchedule()">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <div class="col-12 mt-2">
                                        <select id="sel_location_sched" class="form-control"></select>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-horarios" class="d-flex flex-column gap-2" style="max-height: 250px; overflow-y: auto;"></div>
                        </div>

                        <div class="tab-pane fade" id="tab-alunos" role="tabpanel">
                            <div class="bg-primary bg-opacity-10 p-3 rounded-4 mb-4 border border-primary border-opacity-10" data-slug="turmas.enroll">
                                <label class="form-label small fw-bold text-primary text-uppercase mb-2 ms-1">Efetuar Matrícula</label>
                                <div class="d-flex gap-2">
                                    <div class="flex-grow-1">
                                        <select id="sel_new_student" class="form-control"></select>
                                    </div>
                                    <button class="btn btn-primary px-3 rounded-3 shadow-sm" onclick="matricularAluno(this)" style="height: 48px;">
                                        <i class="fas fa-user-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="lista-alunos" class="d-flex flex-column gap-2" style="max-height: 350px; overflow-y: auto;"></div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarTurma(this)" data-slug="turmas.save">
                        <i class="fas fa-save me-2"></i> Salvar Turma
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div class="modal fade no-print" id="modalHistoricoAluno" tabindex="-1" aria-hidden="true" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-secondary bg-opacity-75 py-3 px-4 text-white">
                    <h5 class="modal-title fw-bold d-flex align-items-center">
                        <i class="fas fa-clock-rotate-left me-3"></i> Histórico: <span id="hist_student_name" class="ms-1 fw-light text-white"></span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 bg-body">
                    <input type="hidden" id="hist_enrollment_id">

                    <div class="bg-secondary bg-opacity-10 p-3 rounded-4 mb-4 border border-secondary border-opacity-10" data-slug="turmas.enroll">
                        <label class="form-label small fw-bold text-uppercase text-primary mb-2">Nova Ocorrência</label>
                        <select id="hist_action" class="form-control mb-2 shadow-sm border-0" style="height: 45px;">
                            <option value="COMMENT">Apenas Observação</option>
                            <option value="SUSPENDED">Suspender</option>
                            <option value="DROPPED">Desistência / Abandono</option>
                            <option value="TRANSFERRED">Transferido</option>
                            <option value="ACTIVE">Reativar Matrícula</option>
                            <option value="COMPLETED">Concluiu o Curso</option>
                        </select>
                        <div class="input-group">
                            <input type="text" id="hist_obs" class="form-control border-0 shadow-sm" placeholder="Motivo ou detalhe..." style="height: 45px;">
                            <button class="btn btn-primary px-3 shadow-sm" onclick="addHistoryItem(this)"><i class="fas fa-check"></i></button>
                        </div>
                    </div>

                    <div id="lista-historico-detalhe" class="ps-2"></div>
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