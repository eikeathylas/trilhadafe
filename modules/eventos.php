<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Agenda e Eventos - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <link rel="stylesheet" type="text/css" href="https://npmcdn.com/flatpickr/dist/themes/dark.css" id="flatpickr-theme-dark" disabled>
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
                        Agenda e Eventos
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-center">
                    <div class="col-12 d-md-none mb-0 mt-2">
                        <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Agenda e Eventos</h4>
                    </div>

                    <div class="col-9 col-md-9 flex-grow-1">
                        <input type="text" id="search_event" class="form-control shadow-sm" placeholder="Buscar eventos..." style="border-radius: 12px; height: 48px;">
                    </div>

                    <div class="col-3 col-md-3 d-grid d-md-block">
                        <button class="btn btn-primary fw-bold shadow-sm w-100 d-flex align-items-center justify-content-center p-0" style="height: 48px; border-radius: 12px;" onclick="openEventModal()">
                            <i class="fas fa-plus me-md-2"></i> <span class="d-none d-md-inline">Novo Evento</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-sm rounded-4 bg-transparent-card">
            <div class="card-body p-0 p-md-4">
                <div class="table-responsive list-table-events">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                        <p class="mt-3 fw-medium">Carregando calendário de eventos...</p>
                    </div>
                </div>
                <div class="pagination paginationButtons pagination-events mt-3 pb-4 pb-md-0 text-center justify-content-center"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalEvent" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-dialog-centered modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center" id="modalEventTitle">
                        <i class="fas fa-calendar-plus me-3 opacity-75"></i> Novo Evento
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <form id="formEvent">
                        <input type="hidden" id="event_id">

                        <div class="card border-0 shadow-sm mb-4 rounded-4 bg-secondary bg-opacity-10">
                            <div class="card-body p-3 p-md-4">
                                <div class="mb-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                        Título do Evento <span class="text-danger">*</span>
                                    </label>
                                    <input type="text" id="evt_title" class="form-control text-body border-0 shadow-none" required placeholder="Ex: Festa do Padroeiro, Feriado...">
                                </div>
                                <div class="mb-0">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Descrição / Anotações</label>
                                    <textarea id="evt_desc" class="form-control text-body border-0 shadow-none" rows="2" placeholder="Informações adicionais (opcional)..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm mb-4 rounded-4 bg-secondary bg-opacity-10">
                            <div class="card-body p-3 p-md-4">
                                <div class="row g-3">
                                    <div class="col-12">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                            <i class="far fa-calendar me-1"></i> Data Selecionada *
                                        </label>
                                        <input type="text" id="evt_date" class="form-control text-body border-0 fw-bold shadow-none" readonly required placeholder="Selecione o dia...">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Início</label>
                                        <input type="time" id="evt_start" class="form-control text-body border-0 shadow-none">
                                    </div>
                                    <div class="col-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Fim</label>
                                        <input type="time" id="evt_end" class="form-control text-body border-0 shadow-none">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 shadow-sm border-start border-4 border-danger rounded-4 bg-danger bg-opacity-10">
                            <div class="card-body p-3 p-md-4">
                                <div class="form-check form-switch mb-2 d-flex align-items-center">
                                    <input class="form-check-input shadow-none fs-4 m-0 me-3" type="checkbox" id="evt_blocker" style="cursor: pointer;">
                                    <label class="form-check-label fw-bold text-danger m-0" for="evt_blocker" style="cursor: pointer;">
                                        Bloquear Calendário Acadêmico?
                                    </label>
                                </div>
                                <p class="text-danger opacity-75 small mb-0 lh-sm ms-md-5 ms-4 ps-2">
                                    <i class="fas fa-circle-info me-1"></i> Se marcado, o sistema impedirá o lançamento de chamadas, diários e aulas neste dia específico (Feriado ou Recesso letivo).
                                </p>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer border-0 p-1">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="saveEvent(this)">
                        <i class="fas fa-save me-2"></i> Gravar Evento
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

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            if (document.documentElement.getAttribute('data-theme') === 'escuro') {
                document.getElementById('flatpickr-theme-dark').removeAttribute('disabled');
            }
        });
    </script>

    <script src="assets/js/events.js?v=<?php echo time(); ?>"></script>
</body>

</html>