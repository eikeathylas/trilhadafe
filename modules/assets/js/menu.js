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
  // Ajuste fino para evitar caminhos duplos (ex: ././assets/...)
  let userImg = defaults.header.img.startsWith("./") ? defaults.header.img : `./${defaults.header.img}`;
  const img = $("#sidebar-user-photo");

  img.attr("src", userImg);
  img.on("error", function () {
    $(this).attr("src", "./assets/img/trilhadafe.png");
  });

  $(".head-only").html(`
        <div class="user-avatar-container" 
             style="cursor: pointer;" 
             onclick="window.zoomAvatar('${userImg}', 'Minha Foto')">
            <img src="${userImg}" alt="User" class="user-avatar-img" onerror="this.src='./assets/img/trilhadafe.png'">
        </div>
        <div class="user-info-text">
            <h6 class="text-truncate" style="max-width: 160px;">${defaults.header.name}</h6>
            <span>${defaults.header.office}</span>
        </div>
    `);
};

// Oculta dinamicamente elementos não autorizados (Desktop e Mobile)
const configureProfile = () => {
  // 1. Filtra Menu Lateral (Desktop)
  $(".nav-only .menu-only li").each(function () {
    const slug = $(this).data("slug"); // Busca a permissão mapeada no HTML
    const href = $(this).find("> a").attr("href");

    // Ignora separadores ou links vazios sem slug
    if (!slug && (!href || href === "#" || href.startsWith("javascript"))) return;

    // Tenta usar o slug, se não tiver, usa o nome do arquivo php (compatibilidade)
    const screen = slug || (href ? href.split(".")[0] : null);

    // Exceções globais
    if (screen && screen !== "index" && screen !== "dashboard" && !defaults.screensAllowed.includes(screen)) {
      $(this).remove(); // Remove o <li> inteiro do DOM
    }
  });

  // 2. Filtra Menu Inferior (Mobile)
  $(".modern-bottom-nav-item").each(function () {
    const slug = $(this).data("slug");
    const href = $(this).attr("href");

    if (!slug && (!href || href === "#")) return;

    const screen = slug || (href ? href.split(".")[0] : null);

    if (screen && screen !== "index" && screen !== "dashboard" && !defaults.screensAllowed.includes(screen)) {
      $(this).remove();
    }
  });

  // 3. Limpeza de submenus (dropdowns) laterais que ficaram vazios
  $(".nav-only .menu-only ul.sub-menu-only").each(function () {
    if ($(this).find("li").length === 0) {
      $(this).closest("li").remove(); // Remove o pai inteiro
    }
  });

  // 4. Limpeza de grupos (títulos) laterais que ficaram vazios
  $(".nav-only .menu-only").each(function () {
    if ($(this).find("ul > li").length === 0) {
      $(this).hide();
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
    // Apenas intercepta se tiver submenu (href="#")
    if ($(this).attr("href") === "#" || $(this).siblings("ul").length > 0) {
      e.preventDefault(); // Evita scroll para o topo

      const $parentLi = $(this).parent();

      // Fecha outros menus abertos no mesmo nível
      $parentLi.siblings().removeClass("active-only").find("ul").slideUp();

      // Alterna abertura do menu atual
      $parentLi.toggleClass("active-only").find("ul").slideToggle();
    }
  });

  // --- TOGGLE SIDEBAR (DESKTOP) ---
  $(".menu-btn-only").click(function () {
    const sidebar = $("#sidebar-only");
    const mainContent = $(".main-only");

    // Alterna classe de minimização
    sidebar.toggleClass("active-only");
    mainContent.toggleClass("active-only");

    // Se minimizou, fecha submenus abertos para evitar bugs visuais
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

    // Marca o LI direto
    li.addClass("active-only");
    activeLink.addClass("active");

    // Se estiver dentro de um submenu, abre e marca o pai
    if (parentUl.hasClass("sub-menu-only")) {
      parentUl.show(); // Força display block
      parentUl.closest("li").addClass("active-only");
    }
  }
});
