<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agenda e Eventos - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>

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

            <div class="card border-0 shadow-sm mb-4 rounded-4 bg-transparent-card">
                <div class="card-body p-3 p-md-4">
                    <div class="d-flex flex-column flex-md-row gap-3 align-items-md-end">

                        <div class="flex-grow-1">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="search_event" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search me-1 opacity-50"></i> Buscar Evento
                            </label>
                            <input type="text" id="search_event" class="form-control" placeholder="Digite o nome ou descrição...">
                        </div>

                        <div class="d-grid d-md-block mt-2 mt-md-0">
                            <button class="btn btn-primary fw-bold shadow-sm px-4" style="height: 42px;" onclick="openEventModal()">
                                <i class="fas fa-plus me-2"></i> Novo Evento
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-0">
                    <div class="table-responsive list-table-events" style="max-height: 600px;">
                        <div class="text-center py-5 opacity-50">
                            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                            <p class="mt-3 fw-medium">Carregando calendário de eventos...</p>
                        </div>
                    </div>
                    <div class="pagination paginationButtons pagination-events mt-3 text-center justify-content-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalEvent" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center" id="modalEventTitle">
                        <i class="fas fa-calendar-plus me-3 opacity-75"></i> Novo Evento
                    </h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <form id="formEvent">
                        <input type="hidden" id="event_id">

                        <div class="card border-0 shadow-sm mb-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-10">
                            <div class="card-body p-3">
                                <div class="mb-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                        Título do Evento <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="evt_title" class="form-control bg-body border-0 shadow-none" required placeholder="Ex: Padroeiro, Feriado...">
                                </div>
                                <div class="mb-0">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Descrição</label>
                                    <textarea id="evt_desc" class="form-control bg-body border-0 shadow-none" rows="2" placeholder="Opcional..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm mb-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-10">
                            <div class="card-body p-3">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                            <i class="far fa-calendar me-1"></i> Data Selecionada *
                                        </label>
                                        <input type="text" id="evt_date" class="form-control bg-body border-0 fw-bold" readonly required>
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Início</label>
                                        <input type="time" id="evt_start" class="form-control bg-body border-0 shadow-none">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Fim</label>
                                        <input type="time" id="evt_end" class="form-control bg-body border-0 shadow-none">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm border-start border-4 border-danger rounded-3 bg-danger bg-opacity-10">
                            <div class="card-body p-3">
                                <div class="form-check form-switch mb-2">
                                    <input class="form-check-input shadow-none" type="checkbox" id="evt_blocker" style="cursor: pointer;">
                                    <label class="form-check-label fw-bold text-danger fs-6" for="evt_blocker" style="cursor: pointer;">
                                        Bloquear Calendário Acadêmico?
                                    </label>
                                </div>
                                <p class="text-muted small mb-0 lh-sm">
                                    <i class="fas fa-circle-info me-1"></i> Se marcado, impedirá o lançamento de chamadas e aulas neste dia (Feriado/Recesso).
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="saveEvent()">
                        <i class="fas fa-save me-2"></i> Salvar Evento
                    </button>
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