<div class="d-md-none position-fixed top-0 start-0 w-100 mobile-top-header border-bottom glass-header-mobile d-flex align-items-center justify-content-between px-3" style="z-index: 1040; height: 65px; border-radius: 0 0 20px 20px !important;">

    <div class="d-flex align-items-center gap-2">
        <img src="../login/assets/img/favicon.png" alt="Logo" style="height: 32px;">
        <span class="fw-bold text-body" style="font-size: 1.15rem; letter-spacing: -0.5px;">Trilha da Fé</span>
    </div>

    <div class="d-flex align-items-center gap-3">
        <div class="position-relative d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 rounded-circle" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNotifications" style="cursor: pointer; width: 36px; height: 36px;">
            <span class="material-symbols-outlined text-body" style="font-size: 22px;">notifications</span>
            <span class="badge-app-feel d-none" id="mob-notif-badge"></span>
        </div>

        <div class="user-avatar-container shadow-sm border border-secondary border-opacity-25" style="width: 40px; height: 40px; cursor: pointer;" onclick="window.zoomAvatar(window.defaultApp.userInfo.img_user, 'Minha Foto')">
            <img src="./assets/img/trilhadafe.png" alt="User" class="user-avatar-img" id="sidebar-user-photo" style="width: 100%; height: 100%; object-fit: cover;">
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
                    <li data-slug="dashboard">
                        <a href="dashboard.php" class="<?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>" data-tooltip="Dashboard">
                            <span class="material-symbols-outlined icon-only">dashboard</span>
                            <span class="text-only">Início</span>
                        </a>
                    </li>
                    <li data-slug="eventos">
                        <a href="eventos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'eventos.php' ? 'active' : '' ?>" data-tooltip="Agenda">
                            <span class="material-symbols-outlined icon-only">event</span>
                            <span class="text-only">Agenda</span>
                        </a>
                    </li>
                    <li data-slug="relatorios">
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
                    <li data-slug="diario">
                        <a href="diario.php" class="<?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>" data-tooltip="Diário">
                            <span class="material-symbols-outlined icon-only">menu_book</span>
                            <span class="text-only">Diário de Classe</span>
                        </a>
                    </li>
                    <li data-slug="turmas">
                        <a href="turmas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'turmas.php' ? 'active' : '' ?>" data-tooltip="Turmas">
                            <span class="material-symbols-outlined icon-only">school</span>
                            <span class="text-only">Turmas</span>
                        </a>
                    </li>
                    <li data-slug="academico">
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
                    <li data-slug="pessoas">
                        <a href="pessoas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>" data-tooltip="Pessoas">
                            <span class="material-symbols-outlined icon-only">group</span>
                            <span class="text-only">Pessoas</span>
                        </a>
                    </li>
                    <li data-slug="organizacao">
                        <a href="organizacao.php" class="<?= basename($_SERVER['PHP_SELF']) == 'organizacao.php' ? 'active' : '' ?>" data-tooltip="Organização">
                            <span class="material-symbols-outlined icon-only">domain</span>
                            <span class="text-only">Minha Paróquia</span>
                        </a>
                    </li>
                    <li data-slug="usuarios">
                        <a href="usuarios.php" class="<?= basename($_SERVER['PHP_SELF']) == 'usuarios.php' ? 'active' : '' ?>" data-tooltip="Usuários">
                            <span class="material-symbols-outlined icon-only">person</span>
                            <span class="text-only">Usuários</span>
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
    <a href="dashboard.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>" data-slug="dashboard">
        <div class="icon-wrapper"><span class="material-symbols-outlined">dashboard</span></div>
        <span>Início</span>
    </a>

    <a href="relatorios.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'relatorios.php' ? 'active' : '' ?>" data-slug="relatorios">
        <div class="icon-wrapper"><span class="material-symbols-outlined">description</span></div>
        <span>Relatórios</span>
    </a>

    <a href="pessoas.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>" data-slug="pessoas">
        <div class="icon-wrapper"><span class="material-symbols-outlined">group</span></div>
        <span>Pessoas</span>
    </a>

    <a href="diario.php" class="modern-bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>" data-slug="diario">
        <div class="icon-wrapper"><span class="material-symbols-outlined">menu_book</span></div>
        <span>Diário</span>
    </a>

    <a href="#" class="modern-bottom-nav-item" onclick="toggleMobileMenu(); return false;" id="btn-mobile-menu">
        <div class="icon-wrapper"><span class="material-symbols-outlined">menu</span></div>
        <span>Menu</span>
    </a>
</div>

<div class="d-none d-md-flex position-fixed align-items-center gap-3" style="top: 20px; right: 30px; z-index: 1050;">

    <button class="btn shadow-sm rounded-circle position-relative d-flex align-items-center justify-content-center hover-scale"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#offcanvasNotifications"
        style="width: 45px; height: 45px; background-color: var(--fundo); border: 1px solid var(--borda); padding: 0;">

        <span class="material-symbols-outlined text-body" style="font-size: 24px;">notifications</span>

        <span class="badge-app-feel d-none" id="desk-notif-badge"></span>
    </button>
</div>

<div class="offcanvas offcanvas-end shadow" tabindex="-1" id="offcanvasNotifications" aria-labelledby="offcanvasNotificationsLabel" style="width: 400px; border-left: none;">

    <div class="d-md-none d-flex justify-content-center pt-2 pb-1 w-100 position-absolute top-0 start-0" style="z-index: 10;">
        <div style="width: 40px; height: 5px; background-color: var(--borda); border-radius: 10px;"></div>
    </div>

    <div class="offcanvas-header border-bottom py-3 pt-md-3 pt-4">
        <h5 class="offcanvas-title fw-bold d-flex align-items-center text-body" id="offcanvasNotificationsLabel">
            <span class="material-symbols-outlined me-2 text-primary" style="font-size: 26px;">notifications</span> Notificações
        </h5>
        <button type="button" class="btn-close text-reset" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    </div>

    <div class="offcanvas-body p-0 d-flex flex-column">

        <div class="p-3 border-bottom d-flex justify-content-between align-items-center bg-transparent">
            <div>
                <h6 class="mb-1 fw-bold text-primary" style="font-size: 0.95rem;">Alertas Nativos</h6>
                <small class="text-primary opacity-75" style="font-size: 0.8rem;" id="push-status-text">Ative para receber alertas.</small>
            </div>
            <div class="form-check form-switch mb-0">
                <input class="form-check-input" type="checkbox" id="togglePushNotifications">
            </div>
        </div>

        <div id="notifications-list" class="list-group list-group-flush flex-grow-1" style="overflow-y: auto; overflow-x: hidden;">

            <div class="text-center p-5 mt-4">
                <div class="d-inline-flex align-items-center justify-content-center rounded-circle mb-3" style="width: 80px; height: 80px; background-color: rgba(92, 142, 241, 0.1);">
                    <span class="material-symbols-outlined spin text-primary" style="font-size: 36px;">sync</span>
                </div>
                <h6 class="fw-bold text-body">Buscando alertas...</h6>
                <p class="text-muted small">Sincronizando com a sua conta.</p>
            </div>

        </div>
    </div>

    <div class="offcanvas-footer p-4 d-grid gap-2 border-top-0 dock-glass">
        <button class="btn btn-primary fw-bold py-3 shadow-sm rounded-pill" onclick="window.markAllAsRead()" style="font-size: 1rem;">
            Marcar todas como lidas
        </button>

        <button class="btn btn-link text-danger text-decoration-none fw-bold py-2 mt-1" onclick="window.clearAllNotifications()" style="font-size: 0.95rem;">
            Limpar gaveta
        </button>
    </div>
</div>