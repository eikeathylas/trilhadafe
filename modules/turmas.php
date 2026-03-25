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
                    <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                            <i class="fas fa-graduation-cap" style="font-size: 1.1rem;"></i>
                        </div>
                        Gestão de Turmas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">

            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">


                    <div class="col-12 d-md-none mb-2 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Turmas</h5>
                    </div>

                    <div class="col-12 col-md flex-grow-1">


                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Turma
                        </label>

                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <input type="text" id="reportSearch" class="form-control shadow-sm" placeholder="Nome da turma, curso ou local..." style="border-radius: 12px 0 0 12px !important; height: 48px;">
                            <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                <i class="fas fa-search text-muted"></i>
                            </span>
                        </div>
                    </div>


                    <div class="col-12 col-md-auto d-grid mt-3 mt-md-0" data-slug="turmas.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="modalTurma()" style="height: 48px; border-radius: 12px; min-width: 160px;">
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

                <div class="pagination-turmas pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Footer.php"; ?>

    <div class="modal fade" id="modalTurma" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 text-center m-0" id="modalLabel" style="letter-spacing: -0.5px;">
                        <i class="fas fa-layer-group me-3 opacity-75"></i> Configurar Turma
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="px-2 pt-1 pb-1 border-bottom border-secondary border-opacity-10 shadow-sm text-center sticky-top" style="z-index: 1080 !important; top: 0;">
                    <div class="modern-tabs-wrapper" style="overflow-x: auto; white-space: nowrap;">
                        <ul class="nav nav-pills gap-2 flex-nowrap justify-content-md-center px-4" id="turmaTab" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active fw-bold px-4 rounded-pill" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab" aria-selected="true">
                                    <i class="fas fa-id-card me-2 opacity-75"></i> Geral
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link fw-bold px-4 rounded-pill" id="horario-tab" data-bs-toggle="tab" data-bs-target="#tab-horarios" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-clock me-2 opacity-75"></i> Grade
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link fw-bold px-4 rounded-pill" id="alunos-tab" data-bs-toggle="tab" data-bs-target="#tab-alunos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-users-viewfinder me-2 opacity-75"></i> Alunos
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="modal-body p-0 modal-body-scrollable bg-body">
                    <input type="hidden" id="class_id">

                    <div class="tab-content p-4 p-md-5">
                        <div class="tab-pane fade show active" id="tab-dados" role="tabpanel">

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome da Turma <span class="text-danger">*</span></label>
                                        <input type="text" id="class_name" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 mt-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Curso / Catequese</label>
                                        <select id="sel_course" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;"></select>
                                    </div>
                                    <div class="col-md-6 mt-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Coordenador Principal</label>
                                        <select id="sel_coordinator" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body px-3" style="height: 52px;"></select>
                                    </div>
                                    <div class="col-md-6 mt-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Auxiliar</label>
                                        <select id="sel_assistant" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body px-3" style="height: 52px;"></select>
                                    </div>
                                    <div class="col-12 border-top border-secondary border-opacity-10 mt-4 pt-4"></div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Capacidade</label>
                                        <input type="number" id="class_capacity" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body text-center px-3" placeholder="Ex: 30" style="height: 52px;">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Estado Atual</label>
                                        <select id="class_status" class="form-select border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                            <option value="ACTIVE">Ativa</option>
                                            <option value="PLANNED">Planejada</option>
                                            <option value="FINISHED">Encerrada</option>
                                        </select>
                                    </div>
                                    <div class="col-12 mt-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Sala Padrão da Turma</label>
                                        <select id="sel_location" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body px-3" style="height: 52px;"></select>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div class="tab-pane fade" id="tab-horarios" role="tabpanel">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner" data-slug="turmas.edit">
                                <label class="form-label small fw-bold text-primary text-uppercase mb-3 ms-1"><i class="fas fa-plus-circle me-2"></i> Adicionar Período</label>
                                <div class="row g-3">
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Dia da Semana</label>
                                        <select id="sched_day" class="form-select border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
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
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Início</label>
                                        <input type="time" id="sched_start" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body text-center px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Término</label>
                                        <input type="time" id="sched_end" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body text-center px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-2 d-flex align-items-end">
                                        <button class="btn btn-primary w-100 fw-bold rounded-4 shadow-sm transition-all hover-scale" onclick="addSchedule()" style="height: 52px;">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                    <div class="col-12 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Local (Opcional)</label>
                                        <select id="sel_location_sched" class="form-control border-0 bg-white rounded-4 shadow-none fw-medium text-body px-3" style="height: 52px;"></select>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-horarios" class="d-flex flex-column gap-2" style="max-height: 250px; overflow-y: auto;"></div>
                        </div>

                        <div class="tab-pane fade" id="tab-alunos" role="tabpanel">
                            <div class="bg-primary bg-opacity-10 p-4 rounded-4 mb-4 border border-primary border-opacity-10 shadow-inner" data-slug="turmas.enroll">
                                <label class="form-label small fw-bold text-primary text-uppercase mb-3 ms-1"><i class="fas fa-user-plus me-2"></i> Efetuar Matrícula</label>
                                <div class="row g-3 align-items-end">
                                    <div class="col-12 col-md-6 flex-grow-1">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Buscar Aluno</label>
                                        <select id="sel_new_student" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;"></select>
                                    </div>
                                    <div class="col-8 col-md-3 position-relative" style="z-index: 1060;">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Data</label>
                                        <input type="date" id="enrollment_date" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body text-center cursor-pointer px-3" style="height: 52px;" title="Data da Matrícula" value="<?php echo date('Y-m-d'); ?>" onclick="this.showPicker()">
                                    </div>
                                    <div class="col-4 col-md-auto d-grid">
                                        <button class="btn btn-primary px-4 rounded-4 shadow-sm h-100 d-flex align-items-center justify-content-center transition-all hover-scale" onclick="matricularAluno(this)" style="min-height: 52px;">
                                            <i class="fas fa-user-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-alunos" class="d-flex flex-column gap-2" style="max-height: 350px; overflow-y: auto;"></div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">
                        Fechar
                    </button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="salvarTurma(this)" data-slug="turmas.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div class="modal fade no-print" id="modalHistoricoAluno" tabindex="-1" aria-hidden="true" style="z-index: 1070;">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-secondary bg-opacity-75 py-4 px-4 shadow-sm position-relative w-100 d-flex justify-content-center">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center m-0 text-center" style="letter-spacing: -0.5px;">
                        <i class="fas fa-clock-rotate-left me-3 opacity-75"></i> Histórico: <span id="hist_student_name" class="ms-1 fw-light text-white"></span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 bg-body">
                    <input type="hidden" id="hist_enrollment_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4" data-slug="turmas.enroll">
                        <label class="form-label small fw-bold text-uppercase text-primary mb-3"><i class="fas fa-plus-circle me-1"></i> Nova Ocorrência</label>
                        <select id="hist_action" class="form-select mb-3 border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                            <option value="COMMENT">Apenas Observação</option>
                            <option value="SUSPENDED">Suspender</option>
                            <option value="DROPPED">Desistência / Abandono</option>
                            <option value="TRANSFERRED">Transferido</option>
                            <option value="ACTIVE">Reativar Matrícula</option>
                            <option value="COMPLETED">Concluiu o Curso</option>
                        </select>
                        <div class="input-group bg-white rounded-4 shadow-none border-0 overflow-hidden">
                            <input type="text" id="hist_obs" class="form-control border-0 bg-transparent shadow-none fw-medium text-body px-3" placeholder="Motivo ou detalhe..." style="height: 52px;">
                            <button class="btn btn-primary px-4 shadow-none fw-bold transition-all hover-scale" onclick="addHistoryItem(this)"><i class="fas fa-check"></i></button>
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