// =========================================================
// CONFIGURAÇÕES DO MENU, PERFIL E NAVEGAÇÃO
// =========================================================

// Função auxiliar para leitura segura de JSON
const safeParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    let parsed = JSON.parse(item);

    // Tratamento para JSON com dupla codificação (string dentro de string)
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (e) {
        console.warn("Falha no segundo nível de parse JSON", e);
      }
    }

    return parsed || fallback;
  } catch (e) {
    console.warn(`Erro ao ler ${key}:`, e);
    return fallback;
  }
};

// Carrega dados da sessão
const sessionAccess = safeParse("tf_access", []);
const sessionData = safeParse("tf_data", {});

const defaults = {
  // Página ativa com base na URL
  pageActive: window.location.pathname.split("/").pop(),

  // Lista de telas permitidas (Array de slugs)
  screensAllowed: Array.isArray(sessionAccess) ? sessionAccess.map((item) => item.slug) : [],

  // Dados para o cabeçalho do menu
  header: {
    img: sessionData.img_user || "./assets/img/trilhadafe.png",
    name: sessionData.name_user || "Usuário",
    office: sessionData.office || "Acesso Geral",
  },
};

// =========================================================
// 1. SEGURANÇA DE SESSÃO E ROTA
// =========================================================

// Se não houver sessão local, redireciona para login imediatamente
if (!localStorage.getItem("tf_data")) {
  window.location.href = "../login/index.php";
}

// =========================================================
// 2. FUNÇÕES DE RENDERIZAÇÃO (UI)
// =========================================================

const showFaqModal = () => {
  $("#duvidasFrequentes").modal("show");
};

const renderUserHeader = () => {
  // Ajuste fino da imagem
  let userImg = defaults.header.img.startsWith("./") ? defaults.header.img : `./${defaults.header.img}`;
  const img = $("#sidebar-user-photo");

  img.attr("src", userImg);
  img.on("error", function () {
    $(this).attr("src", "./assets/img/trilhadafe.png");
  });

  // --- LÓGICA DE SAUDAÇÃO PREMIUM ---
  const hour = new Date().getHours();
  let saudacao = "Boa noite, Paz e Bem";
  if (hour >= 5 && hour < 12) saudacao = "Bom dia, Paz e Bem";
  else if (hour >= 12 && hour < 18) saudacao = "Boa tarde, Paz e Bem";

  // Extrai apenas o primeiro nome
  const firstName = defaults.header.name;

  // 1. Atualiza o Top Header Mobile (IDs do Sidebar.php)
  if ($("#user-greeting").length) $("#user-greeting").text(saudacao);
  if ($("#user-name-display").length) $("#user-name-display").text(firstName);

  // 2. Atualiza a Sidebar Desktop (.head-only) mantendo o Padrão Apple HIG
  $(".head-only").html(`
      <div class="d-flex align-items-center w-100 px-2 py-3">
          <div class="user-avatar-container shadow-sm border border-secondary border-opacity-25 flex-shrink-0" 
               style="cursor: pointer; width: 48px; height: 48px; padding: 2px; background: var(--body); border-radius: 50%;" 
               onclick="window.zoomAvatar('${userImg}', 'Minha Foto')">
              <img src="${userImg}" alt="User" class="user-avatar-img rounded-circle" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='./assets/img/trilhadafe.png'">
          </div>
          <div class="user-info-text d-flex flex-column justify-content-center ms-3 overflow-hidden">
              <span class="text-secondary fw-bold text-uppercase" style="font-size: 0.65rem; letter-spacing: 0.5px; margin-bottom: -2px;">${saudacao}</span>
              <h6 class="fw-bold text-body text-truncate mb-0" style="font-size: 1.05rem; letter-spacing: -0.3px; max-width: 150px;">${firstName}</h6>
              <span class="text-primary fw-bold text-truncate mt-1" style="font-size: 0.75rem;">${defaults.header.office}</span>
          </div>
      </div>
  `);
};

// Oculta dinamicamente elementos não autorizados (Desktop, Mobile e Cards de Painel)
const configureProfile = () => {
  // 1. Filtra Menu Lateral (Desktop)
  $(".nav-only .menu-only li").each(function () {
    const slug = $(this).data("slug");
    const href = $(this).find("> a").attr("href");

    if (!slug && (!href || href === "#" || href.startsWith("javascript"))) return;

    const screen = slug || (href ? href.split(".")[0] : null);

    // if (screen && screen !== "index" && screen !== "dashboard" && !defaults.screensAllowed.includes(screen)) {
    if (!defaults.screensAllowed.includes(screen)) {
      if (href == defaults.pageActive){
        window.location.href = defaults.screensAllowed.includes('diario') ? 'diario.php' : 'eventos.php'
      } 
      $(this).remove();
    }
  });

  // 2. Filtra Menu Inferior (Mobile)
  $(".modern-bottom-nav-item").each(function () {
    const slug = $(this).data("slug");
    const href = $(this).attr("href");

    if (!slug && (!href || href === "#")) return;

    const screen = slug || (href ? href.split(".")[0] : null);

    if (!defaults.screensAllowed.includes(screen)) {
      $(this).remove();
    }
  });

  // 3. Limpeza de submenus (dropdowns) laterais que ficaram vazios
  $(".nav-only .menu-only ul.sub-menu-only").each(function () {
    if ($(this).find("li").length === 0) {
      $(this).closest("li").remove();
    }
  });

  // 4. Limpeza de grupos (títulos) laterais que ficaram vazios
  $(".nav-only .menu-only").each(function () {
    if ($(this).find("ul > li").length === 0) {
      $(this).hide();
    }
  });

  // 5. Filtra Cards e Atalhos Genéricos no corpo da página (Dashboard)
  $("[data-slug]").each(function () {
    // Ignora elementos que já fazem parte do menu lateral ou inferior (já tratados acima)
    if ($(this).closest(".nav-only, .bottom-nav").length > 0) return;

    const slug = $(this).data("slug");

    // Verifica se a tag tem slug, não é página nativa e o usuário não possui a permissão
    // if (slug && slug !== "index" && slug !== "dashboard" && !defaults.screensAllowed.includes(slug)) {
    if (!defaults.screensAllowed.includes(slug)) {
      // Inteligência de Grid Bootstrap: Verifica se o card é filho único de uma coluna (.col-*)
      const colParent = $(this).closest('[class*="col-"], .col');

      if (colParent.length > 0 && colParent.children().length === 1) {
        // Remove a coluna inteira para não quebrar o layout/grid
        colParent.remove();
      } else {
        // Remove apenas o elemento solto
        $(this).remove();
      }
    }
  });
};

// =========================================================
// 3. LÓGICA DE INTERAÇÃO (CLIQUES E TOGGLES)
// =========================================================

// Função global para abrir/fechar sidebar no Mobile
window.toggleMobileMenu = () => {
  $("body").toggleClass("menu-open");
};

// Inicialização (DOM Ready)
$(document).ready(function () {
  // Renderiza Componentes e Aplica Permissões
  renderUserHeader();
  configureProfile();

  // --- LÓGICA DE SUBMENUS (ACCORDION) ---
  $(".nav-only .menu-only > ul > li > a").click(function (e) {
    if ($(this).attr("href") === "#" || $(this).siblings("ul").length > 0) {
      e.preventDefault();

      const $parentLi = $(this).parent();

      $parentLi.siblings().removeClass("active-only").find("ul").slideUp();
      $parentLi.toggleClass("active-only").find("ul").slideToggle();
    }
  });

  // --- TOGGLE SIDEBAR (DESKTOP) ---
  $(".menu-btn-only").click(function () {
    const sidebar = $("#sidebar-only");
    const mainContent = $(".main-only");

    sidebar.toggleClass("active-only");
    mainContent.toggleClass("active-only");

    if (sidebar.hasClass("active-only")) {
      $("ul.sub-menu-only").slideUp();
      $(".nav-only li").removeClass("active-only");
    }
  });

  // --- FECHAR MENU MOBILE AO CLICAR FORA ---
  $(document).on("click", function (e) {
    if ($("body").hasClass("menu-open")) {
      if (!$(e.target).closest(".sidebar-only, .bottom-nav, #btn-mobile-menu").length) {
        $("body").removeClass("menu-open");
      }
    }
  });

  // --- MARCAR PÁGINA ATIVA (HIGHLIGHT) ---
  let activeLink = $(`.nav-only a[href="${defaults.pageActive}"]`);

  if (activeLink.length > 0) {
    const li = activeLink.closest("li");
    const parentUl = li.parent();

    li.addClass("active-only");
    activeLink.addClass("active");

    if (parentUl.hasClass("sub-menu-only")) {
      parentUl.show();
      parentUl.closest("li").addClass("active-only");
    }
  }
});
