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
    office: sessionData.office || "Cargo",
  },
};

// =========================================================
// 1. SEGURANÇA DE NAVEGAÇÃO (GATEKEEPER)
// =========================================================

// Se não houver sessão local, redireciona para login
if (!localStorage.getItem("tf_data")) {
  window.location.href = "../login/index.php";
}

// Verifica permissão de acesso à página atual
const currentPageSlug = defaults.pageActive.replace(".php", "");

if (currentPageSlug && currentPageSlug !== "index" && currentPageSlug !== "dashboard") {
  // Se a tela atual não estiver na lista de permitidas
  if (!defaults.screensAllowed.includes(currentPageSlug)) {
    // Tenta redirecionar para a primeira tela permitida ou dashboard
    const firstAllowedScreen = defaults.screensAllowed[0];
    if (firstAllowedScreen) {
      window.location.href = `${firstAllowedScreen}.php`;
    } else {
      window.location.href = "dashboard.php";
    }
  }
}

// =========================================================
// 2. FUNÇÕES DE RENDERIZAÇÃO (UI)
// =========================================================

const showFaqModal = () => {
  $("#duvidasFrequentes").modal("show");
};

// Renderiza o cabeçalho do usuário no topo da Sidebar
const renderUserHeader = () => {
  $(".user-avatar-img")
    .attr("src", defaults.header.img)
    .on("error", function () {
      $(this).attr("src", "./assets/img/trilhadafe.png");
    });
  $(".head-only").html(`
        <div class="user-avatar-container">
            <img src="${defaults.header.img}" alt="User" class="user-avatar-img" onerror="this.src='./assets/img/trilhadafe.png'">
        </div>
        <div class="user-info-text">
            <h6 class="text-truncate" style="max-width: 160px;">${defaults.header.name}</h6>
            <span>${defaults.header.office}</span>
        </div>
    `);
};

// Remove itens do menu que o usuário não tem permissão para ver
const configureProfile = () => {
  const attributeKey = "href";

  // 1. Remove links diretos não permitidos
  $(".nav-only .menu-only li > a").each(function () {
    const href = $(this).attr(attributeKey);
    if (!href || href === "#" || href.startsWith("javascript")) return;

    const screen = href.split(".")[0];

    // Exceções: dashboard e index são sempre permitidos se logado
    if (screen !== "index" && screen !== "dashboard" && !defaults.screensAllowed.includes(screen)) {
      $(this).parent().remove();
    }
  });

  // 2. Limpeza de submenus que ficaram vazios
  $(".nav-only .menu-only li > ul").each(function () {
    if ($(this).find("li").length === 0) {
      $(this).parent().remove();
    }
  });

  // 3. Limpeza de grupos (títulos) que ficaram vazios
  $(".nav-only .menu-only").each(function () {
    if ($(this).find("ul > li").length === 0) {
      $(this).hide();
    }
  });
};

// =========================================================
// 3. LÓGICA DE INTERAÇÃO (CLIQUES E TOGGLES)
// =========================================================

// Função para abrir/fechar sidebar no Mobile
window.toggleMobileMenu = () => {
  $("body").toggleClass("menu-open");
};

// Inicialização
(function () {
  renderUserHeader();
  configureProfile();

  $(document).ready(function () {
    // --- LÓGICA DE SUBMENUS (ACCORDION) ---
    $(".nav-only .menu-only > ul > li > a").click(function (e) {
      // Apenas se tiver submenu (href="#")
      if ($(this).attr("href") === "#" || $(this).siblings("ul").length > 0) {
        e.preventDefault(); // Evita scroll topo

        const $parentLi = $(this).parent();

        // Fecha outros abertos no mesmo nível
        $parentLi.siblings().removeClass("active-only").find("ul").slideUp();

        // Toggle do atual
        $parentLi.toggleClass("active-only").find("ul").slideToggle();
      }
    });

    // --- TOGGLE SIDEBAR (DESKTOP) ---
    // Botão circular na borda do menu
    $(".menu-btn-only").click(function () {
      const sidebar = $("#sidebar-only");
      const mainContent = $(".main-only");

      // Alterna classe de minimização
      sidebar.toggleClass("active-only");
      mainContent.toggleClass("active-only");

      // Se minimizou, fecha submenus abertos para não "flutuar" estranho
      if (sidebar.hasClass("active-only")) {
        $("ul.sub-menu-only").slideUp();
        $(".nav-only li").removeClass("active-only");
      }
    });

    // --- FECHAR MENU MOBILE AO CLICAR FORA ---
    $(document).on("click", function (e) {
      // Se menu aberto E clique não foi na sidebar NEM no botão de abrir
      if ($("body").hasClass("menu-open")) {
        if (!$(e.target).closest(".sidebar-only, .bottom-nav, #btn-mobile-menu").length) {
          $("body").removeClass("menu-open");
        }
      }
    });

    // --- ACTIVE STATE (MARCAR PÁGINA ATUAL) ---
    // Procura link que corresponde à URL atual
    let activeLink = $(`.nav-only a[href="${defaults.pageActive}"]`);

    if (activeLink.length > 0) {
      const li = activeLink.closest("li");
      const parentUl = li.parent();

      // Marca o LI direto
      li.addClass("active-only");
      activeLink.addClass("active");

      // Se estiver dentro de um submenu, abre o pai
      if (parentUl.hasClass("sub-menu-only")) {
        parentUl.show(); // Força display block
        parentUl.closest("li").addClass("active-only");
      }
    }
  });
})();
