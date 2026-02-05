// =========================================================
// CONFIGURAÇÕES DO MENU E PERFIL
// =========================================================

// Função auxiliar para leitura segura de JSON (COM CORREÇÃO DE DUPLA CODIFICAÇÃO)
const safeParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;

    let parsed = JSON.parse(item);

    // CORREÇÃO CRÍTICA:
    // Se o banco mandou o JSON como String, o primeiro parse retorna uma String.
    // Precisamos parsear de novo para virar Objeto/Array.
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

const sessionAccess = safeParse("tf_access", []);
const sessionData = safeParse("tf_data", {});

const defaults = {
  // Página ativa com base na URL atual
  pageActive: window.location.pathname.split("/").pop(),

  // Lista de slugs permitidos
  // Garante que é array antes de fazer o map
  screensAllowed: Array.isArray(sessionAccess) ? sessionAccess.map((item) => item.slug) : [],

  // Dados do cabeçalho
  header: {
    img: sessionData.img_user || "./assets/img/trilhadafe.png",
    name: sessionData.name_user || "Usuário",
    office: sessionData.office || "Cargo",
  },
};

// =========================================================
// SEGURANÇA DE NAVEGAÇÃO
// =========================================================

// 1. Se não tiver sessão, chuta para o login
if (!localStorage.getItem("tf_data")) {
  window.location.href = "../login/index.php";
}

// 2. Verifica se o usuário tem permissão para estar nesta página
const currentPageSlug = defaults.pageActive.replace(".php", "");

if (currentPageSlug && currentPageSlug !== "index") {
  if (!defaults.screensAllowed.includes(currentPageSlug)) {
    // Redireciona para a primeira tela permitida
    const firstAllowedScreen = defaults.screensAllowed[0];
    if (firstAllowedScreen) {
      window.location.href = `${firstAllowedScreen}.php`;
      // Se não tiver nenhuma tela permitida, redireciona para o dashboard
    } else {
      window.location.href = "dashboard.php";
    }
  }
}

// =========================================================
// FUNÇÕES VISUAIS
// =========================================================

const showFaqModal = () => {
  $("#duvidasFrequentes").modal("show");
};

const renderUserHeader = () => {
  $(".head-only").html(`
        <div class="user-img-only">
            <img src="${defaults.header.img}" alt="User" onerror="this.src='./assets/img/trilhadafe.png'">
        </div>
        <div class="user-details-only">
            <p class="name-only">${defaults.header.name}</p>
            <p class="title-only">${defaults.header.office}</p>
        </div>
    `);
};

const configureProfile = () => {
  const attributeKey = "href";

  // 1. Remove links não permitidos
  $(".nav-only .menu-only li > a").each(function () {
    const href = $(this).attr(attributeKey);
    if (!href || href === "#" || href.startsWith("javascript")) return;

    const screen = href.split(".")[0];

    if (screen !== "index" && !defaults.screensAllowed.includes(screen)) {
      $(this).parent().remove();
    }
  });

  // 2. Limpeza de submenus vazios
  $(".nav-only .menu-only li > ul").each(function () {
    if ($(this).find("li").length === 0) {
      $(this).parent().remove();
    }
  });

  // 3. Limpeza de grupos vazios
  $(".nav-only .menu-only").each(function () {
    if ($(this).find("ul > li").length === 0) {
      $(this).hide();
    }
  });
};

const initializeSidebarGestures = () => {
  const sidebarElement = document.getElementById("sidebar-only");

  if (sidebarElement && typeof Hammer !== "undefined") {
    const mc = new Hammer(sidebarElement);

    mc.on("dragleft dragright swipeleft swiperight", function (event) {
      const sidebar = $("#sidebar-only");
      const hasClassAll = sidebar.hasClass("active-only-all");
      const hasClassActive = sidebar.hasClass("active-only");

      if (event.type === "swipeleft" && hasClassAll) {
        sidebar.removeClass("active-only-all");
      } else if (event.type === "swiperight" && !hasClassActive) {
        sidebar.addClass("active-only-all");
      }
    });
  }
};

// =========================================================
// INICIALIZAÇÃO
// =========================================================

(function () {
  renderUserHeader();
  configureProfile();
  initializeSidebarGestures();

  $(document).ready(function () {
    // Toggle de Submenus
    $(".nav-only .menu-only > ul > li").click(function (e) {
      if ($(e.target).closest("a").attr("href") !== "#") return;

      $(this).siblings().removeClass("active-only").find("ul").slideUp().find("li").removeClass("active-only");
      $(this).toggleClass("active-only").find("ul").slideToggle();
    });

    // Toggle Sidebar
    $(".menu-btn-only").click(function () {
      const sidebar = $("#sidebar-only");
      const mainContent = $(".main-only");

      const wasActive = sidebar.hasClass("active-only");
      sidebar.toggleClass("active-only");

      if (!wasActive) {
        $("ul.sub-menu-only").slideUp();
        mainContent.addClass("active-only");
      } else {
        mainContent.removeClass("active-only");
        sidebar.removeClass("active-only-all");
      }
    });

    // Active Link
    let activeLink = $(`.nav-only a[href="${defaults.pageActive}"]`);
    if (activeLink.length > 0) {
      const li = activeLink.closest("li");
      const parentUl = li.parent();

      li.addClass("active-only");

      if (parentUl.hasClass("sub-menu-only")) {
        parentUl.slideDown();
        parentUl.closest("li").addClass("active-only");
      }
    }
  });
})();
