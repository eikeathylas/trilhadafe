// =========================================================
// CONFIGURAÇÕES DO DASHBOARD
// =========================================================
const dashboardConfig = {
  refreshInterval: 60000, // Atualização automática (60s) - Opcional
  animationDuration: 1000, // Duração da animação dos números (ms)
};

// =========================================================
// 1. CONTROLE DE PERMISSÕES VISUAIS
// =========================================================
function checkDashboardPermissions() {
  let permissions = [];

  try {
    const rawAccess = localStorage.getItem("tf_access");
    permissions = rawAccess ? JSON.parse(rawAccess) : [];
    if (!Array.isArray(permissions)) {
      permissions = typeof permissions === "object" ? Object.values(permissions) : [];
    }
  } catch (e) {
    console.warn("Erro ao ler permissões.");
  }

  // Cria um array simples só com os slugs permitidos (ex: ['dashboard', 'financeiro'])
  const allowedSlugs = permissions.map((p) => p.slug);

  // 1. Card Financeiro
  const canViewFinance = allowedSlugs.includes("financeiro") || allowedSlugs.includes("dashboard.view_finance_stats");
  if (canViewFinance) {
    $(".permission-finance").removeClass("d-none").fadeIn();
  } else {
    $(".permission-finance").addClass("d-none");
  }

  // 2. Botões de Acesso Rápido (Lógica Genérica)
  $(".btn-shortcut").each(function () {
    const requiredPermission = $(this).data("permission");

    // Se o slug do botão não estiver na lista de permitidos, esconde
    if (requiredPermission && !allowedSlugs.includes(requiredPermission)) {
      $(this).parent().hide(); // Esconde o wrapper do botão se necessário, ou use $(this).hide()
      $(this).hide();
    }
  });
}

// =========================================================
// 2. BUSCA DE DADOS (AJAX)
// =========================================================
async function getDashboardStats() {
  try {
    // Estado de carregamento (Skeleton UI simples)
    $("#dash-total-pessoas").text("...");
    $("#dash-turmas-ativas").text("...");
    $("#dash-proximas-missas").text("...");

    // Chama o Controller PHP
    // ajaxValidator é global (definido no app.js)
    const result = await ajaxValidator({
      validator: "getDashboardStats",
      token: defaultApp.userInfo.token,
    });

    if (result.status) {
      const data = result.data;

      // Animação dos números
      animateValue("dash-total-pessoas", 0, data.total_pessoas || 0, dashboardConfig.animationDuration);
      animateValue("dash-turmas-ativas", 0, data.total_turmas || 0, dashboardConfig.animationDuration);

      // Texto fixo
      $("#dash-proximas-missas").text(data.proxima_missa || "Nenhuma");

      // Card Financeiro (Só preenche se tiver dados E estiver visível)
      if (data.financeiro_mes && $(".permission-finance").is(":visible")) {
        $("#dash-financeiro").text(data.financeiro_mes);
      }

      // Renderiza a lista de avisos
      renderAvisos(data.avisos);

      // Renderiza os aniversariantes do mês
      renderAniversariantes(data.aniversariantes);
    } else {
      console.warn("Alerta do Dashboard:", result.alert);
    }
  } catch (e) {
    console.error("Erro fatal ao carregar dashboard:", e);
    // Opcional: alertDefault("Erro ao carregar dados.", "error");
  }
}

// =========================================================
// 3. RENDERIZAÇÃO DE COMPONENTES
// =========================================================
function renderAvisos(avisos) {
  const container = $("#lista-avisos");
  container.empty();

  if (!avisos || avisos.length === 0) {
    container.html('<li class="list-group-item text-center text-muted">Nenhum aviso recente.</li>');
    return;
  }

  avisos.forEach((aviso) => {
    const html = `
            <li class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1 txt-theme">${aviso.title}</h6>
                    <small class="text-muted">${aviso.date}</small>
                </div>
                <p class="mb-1 text-xs text-secondary" style="font-size: 0.85rem;">${aviso.summary}</p>
            </li>
        `;
    container.append(html);
  });
}


function renderAniversariantes(aniversariantes) {
  const container = $("#lista-avisos");
  container.empty();

  if (!aniversariantes || aniversariantes.length === 0) {
    container.html('<li class="list-group-item text-center text-muted">Nenhum aniversariante neste mês.</li>');
    return;
  }

  aniversariantes.forEach((pessoa) => {
    let avatarHtml = "";
    if (pessoa.profile_photo_url) {
      avatarHtml = `<img src="${pessoa.profile_photo_url}?v=${new Date().getTime()}" class="rounded-circle border" style="width:40px; height:40px; margin: 0 10px 0 0; object-fit:cover;">`;
    } else {
      const nameParts = pessoa.name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();
      avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border fw-bold" style="width:40px; height:40px; margin: 0 10px 0 0;">${initials}</div>`;
    }
    const html = `
            <li class="list-group-item d-flex align-items-center">
                ${avatarHtml}
                <div>
                    <h6 class="mb-0 txt-theme">${pessoa.name}</h6>
                    <small class="text-muted">Aniversário: ${pessoa.birth_date}</small>
                </div>
            </li>
        `;
    container.append(html);
  });
}

// =========================================================
// 4. FUNÇÕES UTILITÁRIAS (Animação)
// =========================================================
function animateValue(id, start, end, duration) {
  if (start === end) {
    let el = document.getElementById(id);
    if (el) el.innerText = end;
    return;
  }

  // Se o valor não for numérico (ex: "R$ 10,00"), não anima, apenas exibe
  if (isNaN(end)) {
    let el = document.getElementById(id);
    if (el) el.innerText = end;
    return;
  }

  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));
  const obj = document.getElementById(id);

  if (!obj) return;

  // Se o passo for muito rápido (números pequenos), ajusta para instantâneo
  if (stepTime < 10 || !isFinite(stepTime)) {
    obj.innerText = end;
    return;
  }

  const timer = setInterval(function () {
    current += increment;
    obj.innerText = current;
    if (current == end) {
      clearInterval(timer);
    }
  }, stepTime);
}

// =========================================================
// INICIALIZAÇÃO
// =========================================================
$(document).ready(() => {
  // 1. Aplica regras de visualização
  checkDashboardPermissions();

  // 2. Busca os dados iniciais
  getDashboardStats();

  // 3. (Opcional) Auto-refresh a cada X tempo
  // setInterval(getDashboardStats, dashboardConfig.refreshInterval);
});
