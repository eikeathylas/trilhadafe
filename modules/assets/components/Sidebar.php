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

<script>
    document.addEventListener("DOMContentLoaded", async () => {

        // --- 1. DADOS DO USUÁRIO ---
        try {
            let userData = null;
            const storageData = localStorage.getItem("tf_data");
            if (storageData) userData = JSON.parse(storageData);
            else if (typeof defaultApp !== 'undefined') userData = defaultApp.userInfo;

            if (userData) {
                const elName = document.getElementById("sidebar_user_name");
                const elRole = document.getElementById("sidebar_user_role");

                if (elName) elName.innerText = userData.name || 'Usuário';

                if (elRole) {
                    let roleDisplay = userData.office || userData.role_level || "User";
                    elRole.innerText = roleDisplay.toUpperCase();
                }
            }
        } catch (e) {
            console.error(e);
        }

        const urlValidator = (typeof defaultApp !== 'undefined' && defaultApp.validator) ? defaultApp.validator : "app/controller/validation.php";
        const userToken = (typeof defaultApp !== 'undefined' ? defaultApp.userInfo.token : localStorage.getItem("token"));

        // ============================================================
        // 2. SELECTIZE: UNIDADE (PARÓQUIA)
        // ============================================================
        const $selParish = $('#global_parish').selectize({
            create: false,
            sortField: 'text',
            searchField: ['text'],
            placeholder: 'Carregando...',
            dropdownParent: 'body', // Importante para Mobile

            onChange: function(value) {
                if (!value) return;
                const current = localStorage.getItem("tf_active_parish");
                if (current != value) {
                    localStorage.setItem("tf_active_parish", value);
                    // Feedback visual no card
                    $('.sidebar-context-card.top-card').css('border-color', 'var(--padrao2)');
                    window.location.reload();
                }
            },
            render: {
                option: function(item, escape) {
                    return `<div class="option"><span>${escape(item.text)}</span></div>`;
                }
            }
        });

        const parishSelectize = $selParish[0].selectize;
        parishSelectize.disable();

        // Carrega Paróquias (Backend Verifica se é DEV/Master)
        try {
            const resP = await $.ajax({
                url: urlValidator,
                type: "POST",
                dataType: "json",
                data: {
                    validator: "getMyParishes",
                    token: userToken
                }
            });

            parishSelectize.clearOptions();
            parishSelectize.enable();
            parishSelectize.settings.placeholder = "Selecione...";
            parishSelectize.updatePlaceholder();

            if (resP.status && resP.data && resP.data.length > 0) {
                const savedParish = localStorage.getItem("tf_active_parish");
                let isActiveSet = false;

                resP.data.forEach(p => {
                    parishSelectize.addOption({
                        value: p.id,
                        text: p.name
                    });
                    if (savedParish && p.id == savedParish) isActiveSet = true;
                });

                if (isActiveSet) parishSelectize.setValue(savedParish, true);
                else {
                    const firstId = resP.data[0].id;
                    localStorage.setItem("tf_active_parish", firstId);
                    parishSelectize.setValue(firstId, true);
                }
            } else {
                parishSelectize.disable();
                parishSelectize.settings.placeholder = "Sem acesso";
                parishSelectize.updatePlaceholder();
            }
        } catch (e) {
            parishSelectize.settings.placeholder = "Erro";
            parishSelectize.updatePlaceholder();
        }

        // ============================================================
        // 3. SELECTIZE: ANO LETIVO
        // ============================================================
        const $selYear = $('#global_year').selectize({
            create: false,
            sortField: 'text',
            searchField: ['text'],
            placeholder: 'Carregando...',
            dropdownParent: 'body',

            onChange: function(value) {
                if (!value) return;
                localStorage.setItem("sys_active_year", value);
                window.dispatchEvent(new CustomEvent('yearChanged', {
                    detail: value
                }));

                // Feedback visual no card
                const card = document.querySelector('.sidebar-context-card.bottom-card');
                if (card) {
                    card.style.borderColor = 'var(--padrao2)';
                    setTimeout(() => {
                        card.style.borderColor = 'rgba(255,255,255,0.1)';
                    }, 800);
                }
            },
            render: {
                option: function(item, escape) {
                    return `<div class="option"><span>${escape(item.text)}</span></div>`;
                }
            }
        });

        const yearSelectize = $selYear[0].selectize;
        yearSelectize.disable();

        try {
            const resY = await $.ajax({
                url: urlValidator,
                type: "POST",
                dataType: "json",
                data: {
                    validator: "getAcademicYearsList",
                    token: userToken
                }
            });

            yearSelectize.clearOptions();
            yearSelectize.enable();
            yearSelectize.settings.placeholder = "Selecione...";
            yearSelectize.updatePlaceholder();

            if (resY.status && resY.data) {
                let activeYear = null;
                const cachedYear = localStorage.getItem("sys_active_year");

                resY.data.forEach(y => {
                    yearSelectize.addOption({
                        value: y.year_id,
                        text: y.name
                    });
                    if (y.now && y.is_active && !activeYear) activeYear = y.year_id;
                });

                if (cachedYear) yearSelectize.setValue(cachedYear, true);
                else if (activeYear) {
                    yearSelectize.setValue(activeYear, true);
                    localStorage.setItem("sys_active_year", activeYear);
                }

                if (yearSelectize.getValue()) {
                    window.dispatchEvent(new CustomEvent('yearChanged', {
                        detail: yearSelectize.getValue()
                    }));
                }
            }
        } catch (e) {}
    });
</script>