<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Diário de Classe - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>
    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
    <style>
        /* Estilos exclusivos para o Diário V3 */
        .student-row {
            transition: background-color 0.15s;
        }

        .student-row:hover {
            background-color: #f1f4f8;
        }

        .btn-attendance {
            width: 90px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        /* Ajuste para tabela dentro do modal (Scroll interno) */
        .modal-body-scroll {
            max-height: 65vh;
            overflow-y: auto;
        }

        /* Box de Ementa no Modal */
        .syllabus-preview {
            background-color: #f8f9fa;
            border-left: 4px solid #4e73df;
            padding: 15px;
            border-radius: 4px;
            font-size: 0.85rem;
            color: #555;
            min-height: 50px;
        }
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
                    <li class="breadcrumb-item active" aria-current="page">Diário de Classe</li>
                </ol>
            </nav>

            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body py-3">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-5">
                            <label class="form-label fw-bold text-primary small text-uppercase">1. Selecione a Turma</label>
                            <select id="sel_filter_class" class="form-control" placeholder="Buscando turmas..."></select>
                        </div>
                        <div class="col-md-5">
                            <label class="form-label fw-bold text-primary small text-uppercase">2. Selecione a Disciplina</label>
                            <select id="sel_filter_subject" class="form-control" disabled placeholder="Primeiro selecione a turma..."></select>
                        </div>
                        <div class="col-md-2">
                            <button id="btn_new_session" class="btn btn-success w-100" disabled onclick="openSessionModal()">
                                <i class="fas fa-plus me-2"></i> Lançar Aula
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-header bg-white border-bottom py-3">
                    <div class="card-body px-0 pt-0">
                        <div class="table-responsive list-table-diario">
                            <div class="text-center py-5 text-muted opacity-50">
                                <i class="fas fa-arrow-up mb-2 d-block" style="font-size: 2rem;"></i>
                                Selecione Turma e Disciplina acima para visualizar o diário.
                            </div>
                        </div>

                        <div class="pagination paginationButtons pagination-diario mt-3 text-center justify-content-center"></div>
                    </div>
                </div>

                <?php include "./assets/components/Footer.php"; ?>
            </div>
        </div>

        <div class="modal fade" id="modalSession" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-xl">
                <div class="modal-content border-0">
                    <div class="modal-header bg-primary text-white">
                        <div>
                            <h5 class="modal-title fs-5" id="modalSessionLabel">Registrar Aula</h5>
                            <div class="small opacity-75" id="modal_subtitle">Turma: - | Disciplina: -</div>
                        </div>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body modal-body-scroll">
                        <input type="hidden" id="session_id">
                        <div class="row g-4">

                            <div class="col-lg-4">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-body">
                                        <h6 class="fw-bold text-secondary mb-3"><i class="fas fa-pen-nib me-2"></i> Dados do Encontro</h6>

                                        <div class="mb-3">
                                            <label class="form-label small fw-bold">Data da Aula *</label>
                                            <input type="date" id="session_date" class="form-control">
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label small fw-bold">Tipo de Conteúdo</label>
                                            <select id="session_type" class="form-select">
                                                <option value="DOCTRINAL">Doutrinal (Catecismo)</option>
                                                <option value="BIBLICAL">Bíblico</option>
                                                <option value="LITURGICAL">Litúrgico</option>
                                                <option value="EXPERIENTIAL">Vivencial / Dinâmica</option>
                                                <option value="REVIEW">Revisão / Avaliação</option>
                                            </select>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label small fw-bold">Conteúdo Ministrado</label>
                                            <textarea id="session_content" class="form-control" rows="8" placeholder="Descreva os temas, atividades ou observações gerais..."></textarea>
                                        </div>

                                        <div class="mt-4">
                                            <label class="form-label small fw-bold text-muted">Ementa (Referência)</label>
                                            <div id="modal_syllabus_ref" class="syllabus-preview">
                                                <em class="small">Carregando...</em>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-lg-8">
                                <div class="card shadow-sm border-0 h-100">
                                    <div class="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                                        <h6 class="m-0 fw-bold text-secondary"><i class="fas fa-users me-2"></i> Frequência</h6>
                                        <span class="badge bg-light text-dark border" id="count_students">0 Alunos</span>
                                    </div>
                                    <div class="card-body p-0">
                                        <div class="table-responsive">
                                            <table class="table table-hover align-middle mb-0">
                                                <thead class="bg-light">
                                                    <tr>
                                                        <th class="ps-4">Nome do Aluno</th>
                                                        <th class="text-center" width="220">Status</th>
                                                        <th class="text-end pe-3" width="50">Obs</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="table_attendance_modal">
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="modal-footer bg-white">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-success px-4 btn-save" onclick="saveSession()">
                            <i class="fas fa-save me-2"></i> Salvar Diário
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="modal fade" id="modalJustification" tabindex="-1" style="z-index: 1060;">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title fs-6">Justificar Ausência</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="just_student_index">
                        <p class="mb-3">Aluno: <strong id="just_student_name"></strong></p>

                        <div class="mb-3">
                            <label class="form-label small fw-bold">Motivo</label>
                            <select id="just_type" class="form-select">
                                <option value="UNJUSTIFIED">Não Justificada</option>
                                <option value="JUSTIFIED">Justificada (Atestado/Pais)</option>
                                <option value="RECURRENT">Falta Recorrente</option>
                            </select>
                        </div>
                        <div class="mb-0">
                            <label class="form-label small fw-bold">Observação</label>
                            <textarea id="just_obs" class="form-control" rows="3" placeholder="Detalhes..."></textarea>
                        </div>
                    </div>
                    <div class="modal-footer p-2">
                        <button type="button" class="btn btn-sm btn-primary w-100" onclick="confirmJustification()">Confirmar</button>
                    </div>
                </div>
            </div>
        </div>

        <?php include "./assets/components/Modal-Faqs.php"; ?>
        <?php include "./assets/components/Modal-Audit.php"; ?>
        <?php include "./assets/components/Scripts.php"; ?>

        <script src="assets/js/diario.js?v=<?php echo time(); ?>"></script>

</body>

</html>