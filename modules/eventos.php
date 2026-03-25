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
                    <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                            <i class="fas fa-calendar-days" style="font-size: 1.1rem;"></i>
                        </div>
                        Agenda e Eventos
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">

            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">


                    <div class="col-12 d-md-none mb-2 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Agenda e Eventos</h5>
                    </div>


                    <div class="col-12 col-md flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Evento
                        </label>

                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">

                            <input type="text" id="search_event" class="form-control shadow-sm" placeholder="Busque eventos..." style="border-radius: 12px 0 0 12px !important; height: 48px;">

                            <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                <i class="fas fa-search text-muted"></i>
                            </span>

                        </div>
                    </div>


                    <div class="col-12 col-md-auto d-grid mt-3 mt-md-0" data-slug="eventos.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="openEventModal()" style="height: 48px; border-radius: 12px; min-width: 160px;">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Novo Evento</span>
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
                <div class="pagination-events pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalEvent" tabindex="-1" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 shadow-sm position-relative w-100 d-flex justify-content-center" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center m-0 text-center" id="modalEventTitle" style="letter-spacing: -0.5px;">
                        <i class="fas fa-calendar-plus me-3 opacity-75"></i> Novo Evento
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <form id="formEvent">
                        <input type="hidden" id="event_id">

                        <div class="p-4 p-md-5">
                            <div class="card border-0 shadow-inner mb-4 rounded-4 bg-secondary bg-opacity-10">
                                <div class="card-body p-4">
                                    <div class="mb-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">
                                            Título do Evento <span class="text-danger">*</span>
                                        </label>
                                        <input type="text" id="evt_title" class="form-control bg-white text-body border-0 shadow-none rounded-4 fw-bold px-3" required placeholder="Ex: Festa do Padroeiro, Feriado..." style="height: 52px;">
                                    </div>
                                    <div class="mb-0">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Descrição / Anotações</label>
                                        <textarea id="evt_desc" class="form-control bg-white text-body border-0 shadow-none rounded-4 fw-medium p-3" rows="4" placeholder="Informações adicionais (opcional)..."></textarea>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 shadow-inner mb-4 rounded-4 bg-secondary bg-opacity-10">
                                <div class="card-body p-4">
                                    <div class="row g-3">
                                        <div class="col-12">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">
                                                <i class="far fa-calendar me-1 opacity-75"></i> Data Selecionada *
                                            </label>
                                            <input type="text" id="evt_date" class="form-control bg-white text-body border-0 fw-bold shadow-none rounded-4 px-3 cursor-pointer" readonly required placeholder="Selecione o dia..." style="height: 52px;">
                                        </div>
                                        <div class="col-12 col-md-6 mt-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Horário Início</label>
                                            <input type="time" id="evt_start" class="form-control bg-white text-body border-0 shadow-none rounded-4 fw-bold text-center px-3" style="height: 52px;">
                                        </div>
                                        <div class="col-12 col-md-6 mt-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Horário Fim</label>
                                            <input type="time" id="evt_end" class="form-control bg-white text-body border-0 shadow-none rounded-4 fw-bold text-center px-3" style="height: 52px;">
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 shadow-sm border-start border-4 border-danger rounded-4 bg-danger bg-opacity-10 transition-all hover-bg-light">
                                <div class="card-body p-3 p-md-4">
                                    <div class="form-check form-switch mb-2 d-flex align-items-center">
                                        <input class="form-check-input shadow-none fs-4 m-0 me-3 border-danger cursor-pointer" type="checkbox" id="evt_blocker">
                                        <label class="form-check-label fw-bold text-danger m-0 cursor-pointer" for="evt_blocker">
                                            Bloquear Calendário Acadêmico?
                                        </label>
                                    </div>
                                    <p class="text-danger opacity-75 small mb-0 lh-sm ms-md-5 ms-4 ps-3">
                                        <i class="fas fa-circle-info me-1"></i> Se marcado, o sistema impedirá o lançamento de chamadas, diários e aulas neste dia específico (Feriado ou Recesso letivo).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">
                        Fechar
                    </button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="saveEvent(this)" data-slug="eventos.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
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