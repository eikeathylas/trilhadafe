<div class="d-md-none position-fixed top-0 start-0 w-100 mobile-top-header border-bottom glass-header-mobile d-flex align-items-center justify-content-between px-3" style="z-index: 1040; height: 60px;">
    <div class="d-flex align-items-center gap-2">
        <img src="../login/assets/img/favicon.png" alt="Logo" style="height: 30px;">
        <span class="fw-bold fs-5 text-body">Trilha da Fé</span>
    </div>

    <div class="d-flex align-items-center gap-3">
        <div class="position-relative d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNotifications" style="cursor: pointer; width: 36px; height: 36px;">
            <span class="material-symbols-outlined text-body" style="font-size: 22px;">notifications</span>
            <span class="position-absolute top-0 start-100 translate-middle badge border border-2 border-white rounded-circle bg-danger p-1 d-none" id="mob-notif-badge" style="width: 12px; height: 12px;"><span class="visually-hidden">Alertas não lidos</span></span>
        </div>

        <div class="user-avatar-container shadow-sm border border-secondary border-opacity-25" style="width: 36px; height: 36px;">
            <img src="./assets/img/trilhadafe.png" alt="User" class="user-avatar-img">
        </div>
    </div>
</div>

<div class="sidebar-only" id="sidebar-only">
    <div class="menu-btn-only">
        <span class="material-symbols-outlined" style="font-size: 20px;">chevron_left</span>
    </div>

    <div class="sidebar-scroll-wrapper">
        <div class="head-only"></div>

        <div class="px-0 mb-4 sidebar-selectize">
            <div class="context-wrapper mb-2">
                <label class="context-label"><i class="fas fa-building me-1"></i> UNIDADE</label>
                <select id="global_parish" placeholder="Carregando..."></select>
            </div>
            <div class="context-wrapper">
                <label class="context-label"><i class="far fa-calendar-alt me-1"></i> ANO LETIVO</label>
                <select id="global_year" placeholder="..."></select>
            </div>
        </div>

        <div class="nav-only mb-2">
            <div class="menu-only">
                <p class="title-only">Visão Geral</p>
                <ul style="padding: 0;">
                    <li>
                        <a href="dashboard.php" class="<?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>" data-tooltip="Dashboard">
                            <span class="material-symbols-outlined icon-only">dashboard</span>
                            <span class="text-only">Início</span>
                        </a>
                    </li>
                    <li>
                        <a href="eventos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'eventos.php' ? 'active' : '' ?>" data-tooltip="Agenda">
                            <span class="material-symbols-outlined icon-only">event</span>
                            <span class="text-only">Agenda</span>
                        </a>
                    </li>
                    <li>
                        <a href="relatorios.php" class="<?= basename($_SERVER['PHP_SELF']) == 'relatorios.php' ? 'active' : '' ?>" data-tooltip="Relatórios">
                            <span class="material-symbols-outlined icon-only">description</span>
                            <span class="text-only">Relatórios</span>
                        </a>
                    </li>
                </ul>
            </div>

            <div class="menu-only">
                <p class="title-only">Escola da Fé</p>
                <ul style="padding: 0;">
                    <li>
                        <a href="diario.php" class="<?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>" data-tooltip="Diário">
                            <span class="material-symbols-outlined icon-only">menu_book</span>
                            <span class="text-only">Diário de Classe</span>
                        </a>
                    </li>
                    <li>
                        <a href="turmas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'turmas.php' ? 'active' : '' ?>" data-tooltip="Turmas">
                            <span class="material-symbols-outlined icon-only">school</span>
                            <span class="text-only">Turmas</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="return false;" class="<?= in_array(basename($_SERVER['PHP_SELF']), ['disciplinas.php', 'cursos.php']) ? 'active' : '' ?>" data-tooltip="Acadêmico">
                            <span class="material-symbols-outlined icon-only">settings_accessibility</span>
                            <span class="text-only">Config. Acadêmica</span>
                            <span class="material-symbols-outlined arrow-only ms-auto">expand_more</span>
                        </a>
                        <ul class="sub-menu-only" style="<?= in_array(basename($_SERVER['PHP_SELF']), ['disciplinas.php', 'cursos.php']) ? 'display:block' : '' ?>">
                            <li><a href="cursos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'cursos.php' ? 'fw-bold text-white' : '' ?>">Cursos</a></li>
                            <li><a href="disciplinas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'disciplinas.php' ? 'fw-bold text-white' : '' ?>">Disciplinas</a></li>
                        </ul>
                    </li>
                </ul>
            </div>

            <div class="menu-only">
                <p class="title-only">Secretaria</p>
                <ul style="padding: 0;">
                    <li>
                        <a href="pessoas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>" data-tooltip="Pessoas">
                            <span class="material-symbols-outlined icon-only">group</span>
                            <span class="text-only">Pessoas</span>
                        </a>
                    </li>
                    <li>
                        <a href="organizacao.php" class="<?= basename($_SERVER['PHP_SELF']) == 'organizacao.php' ? 'active' : '' ?>" data-tooltip="Organização">
                            <span class="material-symbols-outlined icon-only">domain</span>
                            <span class="text-only">Minha Paróquia</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <div class="mt-auto">
            <div class="menu-only border-top border-white border-opacity-10 pt-3">
                <ul style="padding: 0; margin-bottom: 70px !important;">
                    <li>
                        <a href="#" onclick="showFaqModal()" data-tooltip="Ajuda">
                            <span class="material-symbols-outlined icon-only">help</span>
                            <span class="text-only">Ajuda</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="configTheme(this)" data-tooltip="Tema">
                            <span class="material-symbols-outlined icon-only">dark_mode</span>
                            <span class="text-only">Tema</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" onclick="logOut()" data-tooltip="Sair">
                            <span class="material-symbols-outlined icon-only">logout</span>
                            <span class="text-only">Sair</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</div>

<div class="d-md-none modern-bottom-nav pb-safe">
    <a href="dashboard.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>">
        <div class="icon-wrapper"><span class="material-symbols-outlined">dashboard</span></div>
        <span>Início</span>
    </a>

    <a href="relatorios.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'relatorios.php' ? 'active' : '' ?>">
        <div class="icon-wrapper"><span class="material-symbols-outlined">description</span></div>
        <span>Relatórios</span>
    </a>

    <a href="pessoas.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>">
        <div class="icon-wrapper"><span class="material-symbols-outlined">group</span></div>
        <span>Pessoas</span>
    </a>

    <a href="diario.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>">
        <div class="icon-wrapper"><span class="material-symbols-outlined">menu_book</span></div>
        <span>Diário</span>
    </a>

    <a href="#" class="modern-bottom-nav-item" onclick="toggleMobileMenu(); return false;" id="btn-mobile-menu">
        <div class="icon-wrapper"><span class="material-symbols-outlined">menu</span></div>
        <span>Menu</span>
    </a>
</div>

<div class="d-none d-md-block position-fixed" style="top: 20px; right: 20px; z-index: 1050;">
    <button class="btn shadow-sm rounded-circle position-relative border border-secondary border-opacity-10 d-flex align-items-center justify-content-center bg-transparent-card"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasNotifications"
        style="width: 45px; height: 45px;">
        <span class="material-symbols-outlined text-body" style="font-size: 24px;">notifications</span>
        <span class="position-absolute top-0 start-100 translate-middle badge border border-light rounded-circle bg-danger d-none"
            id="desk-notif-badge"
            style="padding: 5px !important; min-width: 18px; height: 18px; font-size: 0.65rem;">
        </span>
    </button>
</div>

<div class="offcanvas offcanvas-end shadow-lg border-start-0" tabindex="-1" id="offcanvasNotifications" aria-labelledby="offcanvasNotificationsLabel" style="width: 350px;">

    <div class="offcanvas-header border-bottom border-secondary border-opacity-10">
        <h6 class="offcanvas-title fw-bold d-flex align-items-center fs-5" id="offcanvasNotificationsLabel">
            <span class="material-symbols-outlined me-2 text-primary">notifications_active</span> Notificações
        </h6>
        <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <div class="offcanvas-body p-0 d-flex flex-column">

        <div class="m-3 p-3 rounded-4 d-flex justify-content-between align-items-center ghost-box-notif">
            <div>
                <h6 class="mb-0 fw-bold fs-6 text-primary">Alertas Nativos</h6>
                <small class="text-primary opacity-75" style="font-size: 0.75rem;" id="push-status-text">Ative para receber no celular/PC</small>
            </div>
            <div class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" id="togglePushNotifications" style="cursor: pointer; width: 40px; height: 20px;">
            </div>
        </div>

        <div id="notifications-list" class="list-group list-group-flush flex-grow-1" style="overflow-y: auto;">
            <div class="text-center p-5 opacity-50 mt-4">
                <span class="material-symbols-outlined spin" style="font-size: 48px;">sync</span>
                <p class="mt-3 text-muted fw-medium">Carregando...</p>
            </div>
        </div>

    </div>

    <div class="offcanvas-footer border-top border-secondary border-opacity-10 p-3 bg-secondary bg-opacity-10">
        <div class="d-grid gap-2">
            <button class="btn btn-sm btn-primary fw-bold mb-1 shadow-sm rounded-3 py-2" onclick="window.markAllAsRead()">
                Marcar todas como lidas
            </button>

            <button class="btn btn-link text-danger btn-sm text-decoration-none d-flex align-items-center justify-content-center fw-medium" onclick="window.clearAllNotifications()">
                <span class="material-symbols-outlined me-1" style="font-size: 18px;">delete_sweep</span>
                Limpar gaveta
            </button>
        </div>
    </div>
</div>