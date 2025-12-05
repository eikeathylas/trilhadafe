// =========================================================
// CONFIGURAÇÕES DO MENU E PERFIL
// =========================================================

// Função auxiliar para leitura segura de JSON
const safeParse = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Erro ao ler ${key}:`, e);
    return fallback;
  }
};

const sessionAccess = safeParse("tf_access", []);
const sessionData = safeParse("tf_data", {});

const defaults = {
  // Página ativa com base na URL atual (ex: 'turmas.php')
  pageActive: window.location.pathname.split("/").pop(),

  // Lista de slugs permitidos (ex: ['dashboard', 'turmas', 'financeiro'])
  screensAllowed: Array.isArray(sessionAccess) ? sessionAccess.map((item) => item.slug) : [],

  // Dados do cabeçalho
  header: {
    img: sessionData.img_user || "assets/img/trilhadafe.png",
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

// 2. Verifica se o usuário tem permissão para estar nesta página PHP
const currentPageSlug = defaults.pageActive.replace(".php", "");

// Ignora verificação se for 'index' (Dashboard) ou vazio (Raiz)
if (currentPageSlug && currentPageSlug !== "index") {
  // Se a tela atual não está na lista de permitidos
  if (!defaults.screensAllowed.includes(currentPageSlug)) {
    // Tenta redirecionar para a Home
    window.location.href = "index.php";
  }
}

// =========================================================
// FUNÇÕES VISUAIS
// =========================================================

// Exibe o modal de dúvidas frequentes (Chamado pelo botão na Sidebar)
const showFaqModal = () => {
  $("#duvidasFrequentes").modal("show");
};

// Insere foto e nome no topo do menu lateral
const renderUserHeader = () => {
  // Limpa antes de adicionar para evitar duplicação
  $(".head-only").html(`
        <div class="user-img-only">
            <img src="${defaults.header.img}" alt="User" onerror="this.src='assets/img/trilhadafe.png'">
        </div>
        <div class="user-details-only">
            <p class="name-only">${defaults.header.name}</p>
            <p class="title-only">${defaults.header.office}</p>
        </div>
    `);
};

// Configura o perfil visual (Esconde menus não permitidos)
const configureProfile = () => {
  const attributeKey = "href";

  // 1. Remove links diretos que não estão na lista de permissões
  $(".nav-only .menu-only li > a").each(function () {
    const href = $(this).attr(attributeKey);

    // Ignora links vazios ou javascript
    if (!href || href === "#" || href.startsWith("javascript")) return;

    const screen = href.split(".")[0]; // 'turmas.php' -> 'turmas'

    // Se não for index e não estiver na lista permitida, remove o LI
    if (screen !== "index" && !defaults.screensAllowed.includes(screen)) {
      $(this).parent().remove();
    }
  });

  // 2. Limpeza de Pais Vazios (Submenus e Grupos)

  // Remove submenus (ul) que ficaram sem itens (li)
  $(".nav-only .menu-only li > ul").each(function () {
    if ($(this).find("li").length === 0) {
      $(this).parent().remove(); // Remove o LI pai que tinha a setinha
    }
  });

  // Remove grupos inteiros (div.menu-only) que ficaram sem itens
  $(".nav-only .menu-only").each(function () {
    if ($(this).find("ul > li").length === 0) {
      $(this).hide();
    }
  });
};

// Controle de Gestos Mobile (Hammer.js)
const initializeSidebarGestures = () => {
  const sidebarElement = document.getElementById("sidebar-only");

  if (sidebarElement && typeof Hammer !== "undefined") {
    const mc = new Hammer(sidebarElement);

    mc.on("dragleft dragright swipeleft swiperight", function (event) {
      const sidebar = $("#sidebar-only");
      const hasClassAll = sidebar.hasClass("active-only-all");
      const hasClassActive = sidebar.hasClass("active-only");

      // Swipe Left: Fecha o menu expandido mobile
      if (event.type === "swipeleft" && hasClassAll) {
        sidebar.removeClass("active-only-all");
      }
      // Swipe Right: Abre menu se estiver colapsado
      else if (event.type === "swiperight" && !hasClassActive) {
        sidebar.addClass("active-only-all");
      }
    });
  }
};

// =========================================================
// INICIALIZAÇÃO
// =========================================================

(function () {
  // Executa configurações iniciais
  renderUserHeader();
  configureProfile();
  initializeSidebarGestures();

  $(document).ready(function () {
    // 1. Lógica de Clique no Menu (Accordion)
    $(".nav-only .menu-only > ul > li").click(function (e) {
      // Se clicou num link direto (href="turmas.php"), não faz toggle, deixa navegar
      if ($(e.target).closest("a").attr("href") !== "#") return;

      // Fecha os outros
      $(this).siblings().removeClass("active-only").find("ul").slideUp().find("li").removeClass("active-only");

      // Abre/Fecha o atual
      $(this).toggleClass("active-only").find("ul").slideToggle();
    });

    // 2. Toggle da Sidebar (Botão Sanduíche/Seta)
    $(".menu-btn-only").click(function () {
      const sidebar = $("#sidebar-only");
      const mainContent = $(".main-only");

      // Alterna classe
      const wasActive = sidebar.hasClass("active-only");
      sidebar.toggleClass("active-only");

      if (!wasActive) {
        // Se fechou (ficou active-only), esconde submenus abertos
        $("ul.sub-menu-only").slideUp();
        mainContent.addClass("active-only");
      } else {
        // Se abriu
        mainContent.removeClass("active-only");
        sidebar.removeClass("active-only-all"); // Remove estado mobile se houver
      }
    });

    // 3. Define Link Ativo (Highlight no menu)
    const activeLink = $(`.nav-only a[href="${defaults.pageActive}"]`);

    if (activeLink.length > 0) {
      const li = activeLink.closest("li");
      const parentUl = li.parent();

      li.addClass("active-only");

      // Se for submenu, abre o pai
      if (parentUl.hasClass("sub-menu-only")) {
        parentUl.slideDown(); // Abre o accordion
        parentUl.closest("li").addClass("active-only"); // Marca o pai como ativo
      }
    }
  });
})();
