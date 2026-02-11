// =========================================================
// CONFIGURAÇÕES DO DASHBOARD - V4.2
// =========================================================
const dashboardConfig = {
  refreshInterval: 60000, // Atualização automática (60s)
  animationDuration: 1000, // Duração da animação dos números (ms)
};

// =========================================================
// 1. INICIALIZAÇÃO E EVENTOS
// =========================================================
$(document).ready(() => {
  // 1. Aplica regras de visualização (Permissões)
  checkDashboardPermissions();

  // 2. Busca os dados dos cards e widgets
  // Nota: O ID da paróquia ativa é injetado automaticamente pelo main.js ($.ajaxPrefilter)
  getDashboardStats();
  getUpcomingEvents();

  // 3. (Opcional) Auto-refresh
  // setInterval(() => {
  //     getDashboardStats();
  //     getUpcomingEvents();
  // }, dashboardConfig.refreshInterval);
});

// =========================================================
// 2. CONTROLE DE PERMISSÕES VISUAIS
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

  // Cria lista simples de slugs
  const allowedSlugs = permissions.map((p) => p.slug);

  // A. Card Financeiro
  const canViewFinance = allowedSlugs.includes("financeiro") || allowedSlugs.includes("dashboard.view_finance_stats");
  if (canViewFinance) {
    $(".permission-finance").removeClass("d-none").fadeIn();
  } else {
    $(".permission-finance").addClass("d-none");
  }

  // B. Botões de Acesso Rápido (Se houver)
  $(".btn-shortcut").each(function () {
    const requiredPermission = $(this).data("permission");
    if (requiredPermission && !allowedSlugs.includes(requiredPermission)) {
      $(this).parent().hide();
      $(this).hide();
    }
  });
}

// =========================================================
// 3. BUSCA DE DADOS (AJAX)
// =========================================================

// Estatísticas Gerais (Cards e Avisos)
async function getDashboardStats() {
  try {
    // Skeleton / Loading States
    $("#dash-total-pessoas").text("...");
    $("#dash-turmas-ativas").text("...");
    $("#dash-proximas-missas").text("...");

    const result = await ajaxValidator({
      validator: "getDashboardStats",
      token: defaultApp.userInfo.token,
      org_id: localStorage.getItem("tf_active_parish"),
      year_id: localStorage.getItem("sys_active_year"),
    });

    if (result.status) {
      const data = result.data;

      // Animação dos contadores
      animateValue("dash-total-pessoas", 0, data.total_pessoas || 0, dashboardConfig.animationDuration);
      animateValue("dash-turmas-ativas", 0, data.total_turmas || 0, dashboardConfig.animationDuration);

      // Texto simples
      $("#dash-proximas-missas").text(data.proxima_missa || "Nenhuma");

      // Financeiro (Só renderiza se o container estiver visível)
      if (data.financeiro_mes && !$(".permission-finance").hasClass("d-none")) {
        $("#dash-financeiro").text(data.financeiro_mes);
      }

      // Widgets
      renderAvisos(data.avisos);
      renderAniversariantes(data.aniversariantes);
    }
  } catch (e) {
    console.error("Erro dashboard stats:", e);
  }
}

// Agenda de Eventos
async function getUpcomingEvents() {
  try {
    const resEvents = await ajaxValidator({
      validator: "getUpcomingEvents",
      token: defaultApp.userInfo.token,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (resEvents.status) {
      renderEvents(resEvents.data);
    } else {
      $("#lista-eventos").html('<div class="text-center py-4 text-muted small">Não foi possível carregar a agenda.</div>');
    }
  } catch (e) {
    console.error("Erro eventos:", e);
    $("#lista-eventos").html('<div class="text-center py-4 text-muted small">Erro de conexão.</div>');
  }
}

// =========================================================
// 4. RENDERIZAÇÃO (HTML GENERATORS)
// =========================================================

function renderAvisos(avisos) {
  const container = $("#lista-avisos");
  container.empty();

  if (!avisos || avisos.length === 0) {
    container.html(`
            <li class="list-group-item text-center text-muted py-5 border-0">
                <i class="far fa-bell-slash mb-2 opacity-50" style="font-size: 1.5rem;"></i><br>
                Nenhum aviso recente.
            </li>
        `);
    return;
  }

  avisos.forEach((aviso) => {
    const html = `
            <li class="list-group-item border-start-0 border-end-0 px-4 py-3">
                <div class="d-flex w-100 justify-content-between align-items-center mb-1">
                    <h6 class="mb-0 txt-theme fw-bold text-truncate" style="max-width: 75%;">${aviso.title}</h6>
                    <span class="badge bg-light text-secondary border rounded-pill px-3">${aviso.date}</span>
                </div>
                <p class="mb-0 text-secondary small text-truncate" style="opacity: 0.8;">${aviso.summary}</p>
            </li>
        `;
    container.append(html);
  });
}

function renderEvents(events) {
  const container = $("#lista-eventos");
  container.empty();

  if (!events || events.length === 0) {
    container.html(`
            <div class="text-center py-5 text-muted opacity-50">
                <i class="far fa-calendar-check fa-2x mb-2"></i><br>
                Nenhum evento agendado.
            </div>
        `);
    return;
  }

  events.forEach((ev) => {
    // Lógica de Destaque (Feriado/Sem Aula)
    let iconHtml = '<i class="fas fa-calendar-day"></i>';
    let containerClass = "bg-transparent";
    let dateColorClass = "text-dark";
    let titleColorClass = "";

    if (ev.is_academic_blocker) {
      iconHtml = '<i class="fas fa-ban text-danger" title="Não haverá aula (Feriado/Evento)"></i>';
      containerClass = "event-blocked"; // Classe CSS definida no dashboard.php
      dateColorClass = "text-danger";
      titleColorClass = "text-danger";
    }

    // Formatação da hora
    const timeHtml = ev.start_time ? `<span class="badge bg-light text-secondary border ms-0 mt-1"><i class="far fa-clock me-1"></i> ${ev.start_time.substr(0, 5)}</span>` : "";

    const html = `
            <div class="list-group-item d-flex align-items-center border-0 border-bottom py-3 px-4 ${containerClass}">
                <div class="event-date-box me-3">
                    <div class="event-day">${ev.day_week}</div>
                    <div class="event-num">${ev.date_fmt.substr(0, 2)}/${ev.date_fmt.substr(3, 2)}</div>
                </div>

                <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <h6 class="mb-0 text-truncate fw-bold ${titleColorClass}" style="font-size: 0.95rem;">${ev.title}</h6>
                        <span class="ms-2">${iconHtml}</span>
                    </div>
                    <small class="text-muted text-truncate d-block" style="font-size: 0.8rem;">
                        ${ev.description || "Sem descrição"}
                    </small>
                    ${timeHtml}
                </div>
            </div>
        `;
    container.append(html);
  });
}

function renderAniversariantes(aniversariantes) {
  const container = $("#lista-avisos");
  container.empty();

  if (!aniversariantes || aniversariantes.length === 0) {
    container.html('<li class="list-group-item text-center text-muted py-4">Nenhum aniversariante neste mês.</li>');
    return;
  }

  aniversariantes.forEach((pessoa) => {
    let avatarHtml = "";
    if (pessoa.photo_url) {
      avatarHtml = `<img src="${pessoa.photo_url}?v=${new Date().getTime()}" 
                         class="rounded-circle border shadow-sm" 
                         style="width:40px; height:40px; margin: 0 10px 0 0; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                         onclick="zoomAvatar('${pessoa.photo_url}', '${pessoa.name.replace(/'/g, "\\'")}')"
                         onmouseover="this.style.transform='scale(1.1)'" 
                         onmouseout="this.style.transform='scale(1)'">`;
    } else {
      const nameParts = pessoa.name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();
      avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border fw-bold" style="width:40px; height:40px; margin: 0 10px 0 0;">${initials}</div>`;
    }
    const html = `
            <li class="list-group-item d-flex align-items-center px-3 py-2">
                ${avatarHtml}
                <div>
                    <h6 class="mb-0 txt-theme font-weight-bold" style="font-size: 0.9rem;">${pessoa.name}</h6>
                    <small class="text-muted" style="font-size: 0.8rem;"><i class="fas fa-birthday-cake text-danger me-1"></i> ${pessoa.birth_date}</small>
                </div>
            </li>
        `;
    container.append(html);
  });
}

// =========================================================
// 5. FUNÇÕES UTILITÁRIAS
// =========================================================

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;

  // Se não for número (ex: Moeda), apenas exibe
  if (isNaN(end)) {
    obj.innerText = end;
    return;
  }

  if (start === end) {
    obj.innerText = end;
    return;
  }

  const range = end - start;
  let current = start;
  const increment = end > start ? 1 : -1;
  const stepTime = Math.abs(Math.floor(duration / range));

  // Se for muito rápido, exibe direto
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