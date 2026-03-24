// =========================================================
// CONFIGURAÇÕES DO DASHBOARD - V5.1 (MODO NOTURNO + UX)
// =========================================================
const dashboardConfig = {
  refreshInterval: 60000,
  animationDuration: 1200,
};

$(document).ready(() => {
  checkDashboardPermissions();
  initDashboardLoad();
});

async function initDashboardLoad() {
  await Promise.all([getDashboardStats(), getUpcomingEvents()]);
}

// =========================================================
// 2. CONTROLE DE PERMISSÕES E PERFIL
// =========================================================
function checkDashboardPermissions() {
  let permissions = [];
  try {
    const rawAccess = localStorage.getItem("tf_access");
    permissions = rawAccess ? JSON.parse(rawAccess) : [];
    if (!Array.isArray(permissions)) permissions = Object.values(permissions);
  } catch (e) {
    console.warn("Erro ao ler permissões.");
  }

  const allowedSlugs = permissions.map((p) => p.slug);

  // Perfil Professor: Esconde cards de gestão
  const userRole = window.defaultApp?.userInfo?.role_id;
  if (userRole == 3) {
    $(".permission-admin").remove();
  }

  const canViewFinance = allowedSlugs.includes("financeiro") || allowedSlugs.includes("dashboard.view_finance_stats");
  if (canViewFinance) {
    $(".permission-finance").removeClass("d-none").fadeIn();
  } else {
    $(".permission-finance").addClass("d-none");
  }
}

// =========================================================
// 3. BUSCA DE DADOS (AJAX)
// =========================================================

async function getDashboardStats() {
  const activeParish = localStorage.getItem("tf_active_parish");
  const activeYear = localStorage.getItem("sys_active_year");

  $(".dash-num").text("...");

  try {
    const result = await window.ajaxValidator({
      validator: "getDashboardStats",
      token: window.defaultApp.userInfo.token,
      org_id: activeParish,
      year_id: activeYear,
    });

    if (result.status) {
      const d = result.data;
      const duration = dashboardConfig.animationDuration;

      animateValue("dash-total-usuarios", 0, d.total_usuarios || 0, duration);
      animateValue("dash-total-catequizandos", 0, d.total_catequizandos || 0, duration);
      animateValue("dash-total-professores", 0, d.total_professores || 0, duration);
      animateValue("dash-total-pessoas", 0, d.total_pessoas || 0, duration);
      animateValue("dash-turmas-ativas", 0, d.total_turmas || 0, duration);

      renderAvisos(d.avisos || []);
      renderAniversariantes(d.aniversariantes || []);

      if (d.financeiro_mes && !$(".permission-finance").hasClass("d-none")) {
        $("#dash-financeiro").text(d.financeiro_mes);
      }
    }
  } catch (e) {
    console.error("Erro dashboard stats:", e);
    if (window.alertErrorWithSupport) {
      window.alertErrorWithSupport(`Dashboard Stats (ID: ${activeParish})`, e.message);
    }
  }
}

async function getUpcomingEvents() {
  try {
    const resEvents = await window.ajaxValidator({
      validator: "getUpcomingEvents",
      token: window.defaultApp.userInfo.token,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (resEvents.status) {
      renderEvents(resEvents.data);
    } else {
      throw new Error(resEvents.alert || "Falha na agenda.");
    }
  } catch (e) {
    $("#lista-eventos").html('<div class="text-center py-4 text-danger small">Erro ao carregar agenda.</div>');
  }
}

// =========================================================
// 4. RENDERIZAÇÃO (LAYOUT SOFT UI + MODO NOTURNO)
// =========================================================

function renderAvisos(avisos) {
  const container = $("#lista-avisos");
  container.empty();

  if (!avisos || avisos.length === 0) {
    container.html('<div class="text-center py-5 text-muted opacity-50"><i class="far fa-bell-slash fa-2x mb-2"></i><br>Sem avisos.</div>');
    return;
  }

  avisos.forEach((aviso) => {
    // Uso de  garante compatibilidade com Dark Mode
    const html = `
            <div class="d-flex align-items-center p-3 mb-3  rounded-3 border-start border-4 border-info shadow-xs transition-hover">
                <div class="flex-grow-1 overflow-hidden">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <h6 class="fw-bold mb-0 text-truncate text-body">${aviso.title}</h6>
                        <span class="badge bg-info-subtle text-info rounded-pill px-2 small">${aviso.date}</span>
                    </div>
                    <p class="text-body-secondary small mb-0 text-truncate">${aviso.summary}</p>
                </div>
            </div>`;
    container.append(html);
  });
}

function renderEvents(events) {
  const container = $("#lista-eventos");
  container.empty();

  if (!events || events.length === 0) {
    container.html('<div class="text-center py-5 text-muted opacity-50"><i class="far fa-calendar-check fa-2x mb-2"></i><br>Agenda livre.</div>');
    return;
  }

  // Identifica se a data do evento é hoje
  const hojeStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  events.forEach((ev) => {
    const isHoje = ev.date_fmt === hojeStr;
    const isBlocker = ev.is_academic_blocker;

    // Cores adaptáveis ao tema
    const borderClass = isBlocker ? "border-danger" : "border-primary";
    const bgClass = isBlocker ? "bg-danger-subtle" : "";
    const titleColor = isBlocker ? "text-danger" : "text-body";
    const dateColor = isBlocker ? "text-danger" : "text-body-secondary";

    // Tooltip restaurado e melhorado
    const tooltipText = isBlocker ? "Feriado ou Bloqueio Acadêmico" : "Evento padrão";

    // Badge "Hoje" se for a data atual
    const badgeHoje = isHoje ? `<span class="badge bg-primary text-white ms-2" style="font-size: 0.65rem;">HOJE</span>` : "";

    const html = `
            <div class="d-flex align-items-center p-3 mb-3 ${bgClass} rounded-3 border-start border-4 ${borderClass} shadow-xs" title="${tooltipText}">
                <div class="text-center me-3 border-end border-secondary border-opacity-25 pe-3" style="min-width: 60px;">
                    <h5 class="fw-bold mb-0 text-body">${ev.date_fmt.substr(0, 2)}</h5>
                    <small class="text-uppercase fw-bold ${dateColor}">${ev.day_week}</small>
                </div>
                <div class="flex-grow-1 overflow-hidden">
                    <h6 class="fw-bold mb-0 text-truncate ${titleColor}">
                        ${ev.title} ${badgeHoje}
                    </h6>
                    <div class="d-flex align-items-center mt-1">
                        <small class="text-body-secondary text-truncate me-2">${ev.description || "Sem descrição"}</small>
                        ${ev.start_time ? `<span class="badge bg-secondary-subtle text-body-secondary border border-secondary border-opacity-25 small"><i class="far fa-clock me-1"></i> ${ev.start_time.substr(0, 5)}</span>` : ""}
                    </div>
                </div>
            </div>`;
    container.append(html);
  });
}

function renderAniversariantes(aniversariantes) {
  const container = $("#lista-aniversariantes");
  container.empty();

  if (!aniversariantes || aniversariantes.length === 0) {
    container.html('<div class="text-center py-4 text-muted small">Ninguém soprando velinhas hoje.</div>');
    return;
  }

  aniversariantes.forEach((p) => {
    const safeName = p.name.replace(/'/g, "\\'");
    let avatarHtml = "";

    // Verifica se tem foto. Se tiver, monta a tag de imagem. Se não, monta as iniciais.
    if (p.photo_url) {
      avatarHtml = `<img src="${p.photo_url}" class="rounded-circle border border-secondary border-opacity-25 me-3" 
                         style="width:42px; height:42px; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                         onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${p.photo_url}', '${safeName}')"
                         onmouseover="this.style.transform='scale(1.15)'" 
                         onmouseout="this.style.transform='scale(1)'"
                         title="Ver foto">`;
    } else {
      const nameParts = p.name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold me-3" 
                         style="width:42px; height:42px; font-size: 1rem;">${initials}</div>`;
    }

    //  substitui o bg-white. Zoom e hover restaurados na foto.
    const html = `
        <div class="d-flex align-items-center p-2 mb-2  rounded-3 shadow-xs border border-secondary border-opacity-10">
            ${avatarHtml}
            <div class="flex-grow-1">
                <h6 class="fw-bold mb-0 small text-body">${p.name}</h6>
                <small class="text-body-secondary"><i class="fas fa-birthday-cake text-danger me-1 small"></i> ${p.birth_date}</small>
            </div>
            <div class="ms-2">
                <span class="badge bg-danger-subtle text-danger rounded-pill px-2" title="Aniversariante">🎉</span>
            </div>
        </div>`;
    container.append(html);
  });
}

// =========================================================
// 5. UTILITÁRIOS
// =========================================================

function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj || isNaN(end)) return;

  if (start === end) {
    obj.innerText = end;
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerText = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerText = end;
    }
  };
  window.requestAnimationFrame(step);
}
