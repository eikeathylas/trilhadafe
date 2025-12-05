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

  // Leitura segura das permissões salvas no login
  try {
    const rawAccess = localStorage.getItem("tf_access");
    permissions = rawAccess ? JSON.parse(rawAccess) : [];

    // Garante que seja um Array
    if (!Array.isArray(permissions)) {
      permissions = typeof permissions === "object" ? Object.values(permissions) : [];
    }
  } catch (e) {
    console.warn("Erro ao ler permissões para o dashboard.");
  }

  // Verifica se o usuário tem permissão para ver Financeiro
  // Procura pelo slug do módulo 'financeiro' ou ação específica 'dashboard.view_finance_stats'
  const canViewFinance = permissions.some((p) => p.slug === "financeiro" || p.slug === "dashboard.view_finance_stats");

  if (canViewFinance) {
    $(".permission-finance").removeClass("d-none").fadeIn();
  } else {
    $(".permission-finance").addClass("d-none");
  }
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
