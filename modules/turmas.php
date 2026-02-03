<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Gestão de Turmas - Trilha da Fé</title>

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
                    <li class="breadcrumb-item active" aria-current="page">Gestão de Turmas</li>
                </ol>
            </nav>

            <div class="card list-commanded mb-4">
                <div class="card-header border-bottom-0 bg-transparent px-0 pb-0">
                    <div class="row align-items-end">
                        <div class="col-md-2 mb-3 mb-md-0">
                            <label class="form-label title">Ano Letivo:</label>
                            <select id="filtro-ano" class="form-select">
                                <option value="">Carregando...</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3 mb-md-0">
                            <label class="form-label title">Buscar Turma:</label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Nome da turma ou coordenador...">
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn-filter mt-4" onclick="modalTurma()">
                                <i class="fas fa-plus mr-1"></i> Nova Turma
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-turmas">
                    </div>
                    <div class="pagination paginationButtons pagination-turmas mt-3 text-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalTurma" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white" id="modalLabel">Gerenciar Turma</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="class_id">

                    <ul class="nav nav-tabs mb-3" id="turmaTab" role="tablist">
                        <li class="nav-item">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button">
                                <i class="fas fa-info-circle mr-2"></i> Dados Gerais
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" id="horario-tab" data-bs-toggle="tab" data-bs-target="#tab-horarios" type="button">
                                <i class="fas fa-clock mr-2"></i> Grade Horária
                            </button>
                        </li>
                        <li class="nav-item">
                            <button class="nav-link" id="alunos-tab" data-bs-toggle="tab" data-bs-target="#tab-alunos" type="button">
                                <i class="fas fa-user-graduate mr-2"></i> Alunos e Matrículas
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content pt-3">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">
                                <div class="col-md-8">
                                    <label class="form-label">Nome da Turma <span class="text-danger">*</span></label>
                                    <input type="text" id="class_name" class="form-control" placeholder="Ex: Eucaristia Sábado Manhã">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Ano Letivo <span class="text-danger">*</span></label>
                                    <select id="class_year_id" class="form-select"></select>
                                </div>

                                <div class="col-md-6">
                                    <label class="form-label">Curso Vinculado <span class="text-danger">*</span></label>
                                    <select id="sel_course" class="form-control" placeholder="Selecione o curso..."></select>
                                    <small class="text-muted">Define a grade curricular.</small>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Catequista Coordenador</label>
                                    <select id="sel_coordinator" class="form-control" placeholder="Selecione o responsável..."></select>
                                </div>

                                <div class="col-md-4">
                                    <label class="form-label">Capacidade Máxima</label>
                                    <input type="number" id="class_capacity" class="form-control" placeholder="Ex: 30">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Status</label>
                                    <select id="class_status" class="form-select">
                                        <option value="PLANNED">Planejada</option>
                                        <option value="ACTIVE" selected>Ativa (Matrículas Abertas)</option>
                                        <option value="FINISHED">Encerrada</option>
                                        <option value="CANCELLED">Cancelada</option>
                                    </select>
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Sala Principal</label>
                                    <select id="sel_location" class="form-control" placeholder="Sala padrão..."></select>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-horarios">
                            <div class="card bg-light border-0 mb-3">
                                <div class="card-body py-2">
                                    <div class="row g-2 align-items-end">
                                        <div class="col-md-3">
                                            <label class="form-label small fw-bold">Dia da Semana</label>
                                            <select id="sched_day" class="form-select form-select-sm">
                                                <option value="6">Sábado</option>
                                                <option value="0">Domingo</option>
                                                <option value="1">Segunda</option>
                                                <option value="2">Terça</option>
                                                <option value="3">Quarta</option>
                                                <option value="4">Quinta</option>
                                                <option value="5">Sexta</option>
                                            </select>
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small fw-bold">Início</label>
                                            <input type="time" id="sched_start" class="form-control form-control-sm">
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small fw-bold">Fim</label>
                                            <input type="time" id="sched_end" class="form-control form-control-sm">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label small fw-bold">Sala (Opcional)</label>
                                            <select id="sel_location_sched" class="form-control form-control-sm" placeholder="Sala da Turma..."></select>
                                        </div>
                                        <div class="col-md-1">
                                            <button class="btn btn-sm btn-success w-100" onclick="addSchedule()" title="Adicionar">
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
                                            <th>Dia</th>
                                            <th>Horário</th>
                                            <th>Local</th>
                                            <th class="text-center" width="50">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-horarios">
                                        <tr>
                                            <td colspan="4" class="text-center text-muted py-3">Nenhum horário definido.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-alunos">
                            <div class="card bg-light border-0 mb-3 shadow-sm">
                                <div class="card-body py-2">
                                    <div class="row g-2 align-items-end">
                                        <div class="col-md-9">
                                            <label class="form-label small fw-bold">Nova Matrícula:</label>
                                            <select id="sel_new_student" class="form-control" placeholder="Busque o aluno..."></select>
                                        </div>
                                        <div class="col-md-3">
                                            <button class="btn btn-success w-100" onclick="matricularAluno()">
                                                <i class="fas fa-plus mr-2"></i> Matricular
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Aluno</th>
                                            <th>Data Matrícula</th>
                                            <th class="text-center">Status Atual</th>
                                            <th class="text-center">Média</th>
                                            <th class="text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-alunos">
                                        <tr>
                                            <td colspan="5" class="text-center text-muted py-4">Nenhum aluno matriculado nesta turma.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save" onclick="salvarTurma()">
                        <i class="fas fa-save me-2"></i> Salvar Turma
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalHistoricoAluno" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header bg-secondary text-white">
                    <h5 class="modal-title fs-6">
                        <i class="fas fa-history mr-2"></i> Histórico Acadêmico: <span id="hist_student_name" class="fw-bold"></span>
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body bg-light">
                    <input type="hidden" id="hist_enrollment_id">

                    <div class="card border-0 mb-3">
                        <div class="card-body p-3">
                            <h6 class="card-title text-primary mb-2">Registrar Ocorrência / Mudança de Status</h6>
                            <div class="row g-2">
                                <div class="col-md-4">
                                    <select id="hist_action" class="form-select form-select-sm">
                                        <option value="COMMENT">Apenas Observação</option>
                                        <option value="SUSPENDED">Suspender Aluno</option>
                                        <option value="DROPPED">Desistência / Abandono</option>
                                        <option value="TRANSFERRED">Transferido</option>
                                        <option value="ACTIVE">Reativar Matrícula</option>
                                        <option value="COMPLETED">Concluiu o Curso</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <input type="text" id="hist_obs" class="form-control form-control-sm" placeholder="Motivo ou observação...">
                                </div>
                                <div class="col-md-2">
                                    <button class="btn btn-sm btn-primary w-100" onclick="addHistoryItem()">Registrar</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="table-responsive bg-white border rounded" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm table-striped mb-0">
                            <thead>
                                <tr>
                                    <th>Movimento</th>
                                    <th>Data</th>
                                    <th>Observação</th>
                                    <th>Autor</th>
                                    <th class="text-center">Ação</th>
                                </tr>
                            </thead>
                            <tbody id="lista-historico-detalhe">
                            </tbody>
                        </table>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="modal">Fechar</button>
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