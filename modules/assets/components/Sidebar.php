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

    <div class="px-0 mb-5 sidebar-selectize">
        <div class="context-wrapper" style="padding: 4px 7px !important;">
            <label class="context-label">
                <i class="material-symbols-outlined ml-0" style="font-size: 12px; margin-right: 4px;">calendar_month</i> Ano
            </label>

            <select id="global_year" placeholder="Buscar ano..."  style="font-size: 12px !important;">
            </select>
        </div>

        <select id="global_org" class="d-none"></select>
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
    
    // --- 1. IDENTIFICAÇÃO DO USUÁRIO (OFFICE / ROLE) ---
    try {
        let userData = null;

        // Tenta buscar do LocalStorage (onde está o Office)
        const storageData = localStorage.getItem("tf_data");
        if (storageData) {
            userData = JSON.parse(storageData);
        } 
        // Fallback: Se não tiver no storage, tenta objeto global
        else if (typeof defaultApp !== 'undefined') {
            userData = defaultApp.userInfo;
        }

        if (userData) {
            const elName = document.getElementById("sidebar_user_name");
            const elRole = document.getElementById("sidebar_user_role");
            
            // Define Nome
            if (elName) elName.innerText = userData.name || 'Usuário';
            
            // Define Cargo (Prioridade: OFFICE > ROLE_LEVEL > 'User')
            if (elRole) {
                let roleDisplay = "User";
                
                if (userData.office) {
                    roleDisplay = userData.office; // Ex: SECRETARY
                } else if (userData.role_level) {
                    roleDisplay = userData.role_level; // Ex: ADMIN
                }
                
                elRole.innerText = roleDisplay.toUpperCase();
            }
        }
    } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
    }

    // --- 3. INICIALIZAÇÃO DO SELECTIZE (ANO LETIVO) ---
    const $select = $('#global_year').selectize({
        create: false,
        sortField: 'text',
        searchField: ['text'],
        placeholder: 'Carregando...',
        dropdownParent: 'body', // Essencial para Mobile/Z-Index
        
        onChange: function(value) {
            if(!value) return;
            localStorage.setItem("sys_active_year", value);
            window.dispatchEvent(new CustomEvent('yearChanged', { detail: value }));
            
            const wrapper = document.querySelector('.context-wrapper');
            if(wrapper) {
                wrapper.style.borderColor = 'var(--padrao2)'; 
                setTimeout(() => { wrapper.style.borderColor = 'rgba(255,255,255,0.15)'; }, 800);
            }
        },
        render: {
            option: function(item, escape) {
                return `<div class="option"><span>${escape(item.text)}</span></div>`;
            }
        }
    });

    const selectize = $select[0].selectize;
    selectize.disable();

    // Carregamento via AJAX (Mantido igual)
    try {
        const urlValidator = (typeof defaultApp !== 'undefined' && defaultApp.validator) 
            ? defaultApp.validator 
            : "app/controller/validation.php"; 

        const res = await $.ajax({
            url: urlValidator, 
            type: "POST",
            dataType: "json",
            data: { 
                validator: "getAcademicYearsList", 
                token: (typeof defaultApp !== 'undefined' ? defaultApp.userInfo.token : localStorage.getItem("token")) 
            }
        });

        selectize.clearOptions();
        selectize.enable();
        selectize.settings.placeholder = "Selecione...";
        selectize.updatePlaceholder();

        if (res.status && res.data) {
            let activeYear = null;
            const cachedYear = localStorage.getItem("sys_active_year");

            res.data.forEach(y => {
                selectize.addOption({ value: y.year_id, text: y.name });
                if (y.now && y.is_active) activeYear = y.year_id
            });

            if (cachedYear) {
                selectize.setValue(cachedYear);
            } else if (activeYear) {
                selectize.setValue(activeYear);
                localStorage.setItem("sys_active_year", activeYear);
            }
            
            if(selectize.getValue()) {
                window.dispatchEvent(new CustomEvent('yearChanged', { detail: selectize.getValue() }));
            }
        }
    } catch (e) {
        selectize.clearOptions();
        selectize.addOption({value: "", text: "Erro"});
    }
});
</script>   