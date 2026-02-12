<div class="d-md-none position-fixed top-0 start-0 w-100 mobile-top-header border-bottom d-flex align-items-center justify-content-between px-3">
    <div class="d-flex align-items-center gap-2">
        <img src="../login/assets/img/favicon.png" alt="Logo" style="height: 32px;">
        <span class="fw-bold" style="font-size: 1.1rem;">Trilha da Fé</span>
    </div>
    <div class="user-avatar-container" style="width: 35px; height: 35px; border-width: 1px;">
        <img src="./assets/img/trilhadafe.png" alt="User" class="user-avatar-img">
    </div>
</div>

<div class="sidebar-only" id="sidebar-only">

    <div class="menu-btn-only">
        <span class="material-symbols-outlined" style="font-size: 20px;">chevron_left</span>
    </div>

    <div class="sidebar-scroll-wrapper">

        <div class="head-only">
        </div>

        <div class="px-0 mb-4 sidebar-selectize">

            <div class="context-wrapper mb-2">
                <label class="context-label">
                    <i class="fas fa-building me-1"></i> UNIDADE
                </label>
                <select id="global_parish" placeholder="Carregando..."></select>
            </div>

            <div class="context-wrapper">
                <label class="context-label">
                    <i class="far fa-calendar-alt me-1"></i> ANO LETIVO
                </label>
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
                            <li>
                                <a href="cursos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'cursos.php' ? 'fw-bold text-white' : '' ?>">Cursos</a>
                            </li>
                            <li>
                                <a href="disciplinas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'disciplinas.php' ? 'fw-bold text-white' : '' ?>">Disciplinas</a>
                            </li>
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

<div class="bottom-nav">
    <a href="dashboard.php" class="bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Início</span>
    </a>

    <a href="pessoas.php" class="bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>">
        <span class="material-symbols-outlined">group</span>
        <span>Pessoas</span>
    </a>

    <a href="diario.php" class="bottom-nav-item <?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>">
        <span class="material-symbols-outlined">menu_book</span>
        <span>Diário</span>
    </a>

    <a href="#" class="bottom-nav-item" onclick="toggleMobileMenu(); return false;" id="btn-mobile-menu">
        <span class="material-symbols-outlined">menu</span>
        <span>Menu</span>
    </a>
</div>