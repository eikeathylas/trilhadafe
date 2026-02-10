<div class="sidebar-scroll-wrapper">

    <div class="head-only">
        <div class="user-avatar-container">
            <img src="../login/assets/img/favicon.png" alt="User" class="user-avatar-img">
        </div>
        <div class="user-info-text">
            <h6 id="sidebar_user_name">Carregando...</h6>
            <span id="sidebar_user_role">...</span>
        </div>
    </div>

    <div class="px-0 mb-4 sidebar-selectize">

        <div class="sidebar-context-card top-card">
            <label class="context-label">
                <i class="fas fa-building me-1"></i> UNIDADE
            </label>
            <div class="context-input-wrapper">
                <select id="global_parish" placeholder="Carregando..."></select>
            </div>
        </div>

        <div class="sidebar-context-card bottom-card">
            <label class="context-label">
                <i class="far fa-calendar-alt me-1"></i> ANO LETIVO
            </label>
            <div class="context-input-wrapper">
                <select id="global_year" placeholder="..."></select>
            </div>
        </div>

    </div>

    <div class="nav-only mb-2">

        <div class="menu-only">
            <p class="title-only">Visão Geral</p>
            <ul>
                <li>
                    <a href="dashboard.php" class="<?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">dashboard</span>
                        <span class="text-only">Dashboard</span>
                    </a>
                </li>
                <li>
                    <a href="eventos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'eventos.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">event</span>
                        <span class="text-only">Eventos</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="menu-only">
            <p class="title-only">Sistema</p>
            <ul>
                <li>
                    <a href="organizacao.php" class="<?= basename($_SERVER['PHP_SELF']) == 'organizacao.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">domain</span>
                        <span class="text-only">Minha Paróquia</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="menu-only">
            <p class="title-only">Secretaria</p>
            <ul>
                <li>
                    <a href="pessoas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'pessoas.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">group</span>
                        <span class="text-only">Diretório de Pessoas</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="menu-only">
            <p class="title-only">Escola da Fé</p>
            <ul>
                <li>
                    <a href="#" onclick="toggleSubmenu(this); return false;" class="<?= in_array(basename($_SERVER['PHP_SELF']), ['disciplinas.php', 'cursos.php']) ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">settings_accessibility</span>
                        <span class="text-only">Config. Acadêmica</span>
                        <span class="material-symbols-outlined arrow-only">expand_more</span>
                    </a>
                    <ul class="sub-menu-only" style="<?= in_array(basename($_SERVER['PHP_SELF']), ['disciplinas.php', 'cursos.php']) ? 'display:block' : '' ?>">
                        <li>
                            <a href="disciplinas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'disciplinas.php' ? 'fw-bold text-white' : '' ?>">Disciplinas</a>
                        </li>
                        <li>
                            <a href="cursos.php" class="<?= basename($_SERVER['PHP_SELF']) == 'cursos.php' ? 'fw-bold text-white' : '' ?>">Cursos</a>
                        </li>
                    </ul>
                </li>

                <li>
                    <a href="turmas.php" class="<?= basename($_SERVER['PHP_SELF']) == 'turmas.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">school</span>
                        <span class="text-only">Gestão de Turmas</span>
                    </a>
                </li>

                <li>
                    <a href="diario.php" class="<?= basename($_SERVER['PHP_SELF']) == 'diario.php' ? 'active' : '' ?>">
                        <span class="material-symbols-outlined icon-only">menu_book</span>
                        <span class="text-only">Diário de Classe</span>
                    </a>
                </li>
            </ul>
        </div>
    </div>

    <div class="menu-only mt-3">
        <p class="title-only">Suporte</p>
        <ul>
            <li>
                <a href="#" onclick="showFaqModal()">
                    <span class="material-symbols-outlined icon-only">help</span>
                    <span class="text-only">Dúvidas Frequentes</span>
                </a>
            </li>
        </ul>
    </div>

    <div class="menu-only">
        <ul>
            <li>
                <a href="#" onclick="configTheme(this)">
                    <span class="material-symbols-outlined icon-only">dark_mode</span>
                    <span class="text-only">Modo noturno</span>
                </a>
            </li>
            <li>
                <a href="#" onclick="logOut()" class="">
                    <span class="material-symbols-outlined icon-only">logout</span>
                    <span class="text-only">Sair</span>
                </a>
            </li>
        </ul>
    </div>
</div>
