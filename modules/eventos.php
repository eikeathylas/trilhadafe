<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Agenda e Eventos - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
    <link href="assets/css/card.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
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
                    <li class="breadcrumb-item active">Organização</li>
                    <li class="breadcrumb-item active">Agenda e Eventos</li>
                </ol>
            </nav>

            <div class="card border-0 shadow-sm mb-4">
                <div class="card-body py-3">
                    <div class="row g-3 align-items-end">
                        <div class="col-md-8">
                            <label class="form-label fw-bold text-secondary small text-uppercase">Buscar Evento</label>
                            <div class="input-group">
                                <span class="input-group-text border-end-0"><i class="fas fa-search text-muted"></i></span>
                                <input type="text" id="search_event" class="form-control border-start-0" placeholder="Digite o nome ou descrição...">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-primary w-100 shadow-sm" onclick="openEventModal()">
                                <i class="fas fa-plus me-2"></i> Novo Evento
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-0">
                    <div class="table-responsive list-table-events">
                        <div class="text-center py-5"><span class="loader"></span></div>
                    </div>
                    <div class="pagination paginationButtons pagination-events mt-3"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalEvent" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog">
            <div class="modal-content border-0">
                <div class="modal-header bg-primary text-white">
                    <h5 class="modal-title" id="modalEventTitle">Novo Evento</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="formEvent">
                        <input type="hidden" id="event_id">

                        <div class="card border-0 shadow-sm mb-3">
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="form-label small fw-bold text-uppercase">Título do Evento *</label>
                                    <input type="text" id="evt_title" class="form-control" required placeholder="Ex: Padroeiro, Feriado...">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label small fw-bold text-uppercase">Descrição</label>
                                    <textarea id="evt_desc" class="form-control" rows="2"></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm mb-3">
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-12">
                                        <label class="form-label small fw-bold text-uppercase">Data *</label>
                                        <input type="text" id="evt_date" class="form-control" readonly required>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase">Início</label>
                                        <input type="time" id="evt_start" class="form-control">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase">Fim</label>
                                        <input type="time" id="evt_end" class="form-control">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm border-start border-4 border-danger">
                            <div class="card-body">
                                <div class="form-check form-switch">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="evt_blocker">
                                        <label class="form-check-label fw-bold text-danger" for="evt_blocker">
                                            Bloquear Aulas e Diários?
                                        </label>
                                    </div>
                                </div>
                                <small class="text-muted d-block mt-1">
                                    Se marcado, este dia será considerado "Feriado/Recesso" e impedirá o lançamento de aulas no sistema acadêmico.
                                </small>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer bg-white border-top-0">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="saveEvent()">Salvar</button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://npmcdn.com/flatpickr/dist/l10n/pt.js"></script>
    <script src="assets/js/events.js?v=<?php echo time(); ?>"></script>
</body>

</html>