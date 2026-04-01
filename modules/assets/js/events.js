const defaultEvents = { currentPage: 1, rowsPerPage: 10, totalPages: 1 };
let fpEventDate = null;

$(document).ready(() => {
  loadEvents();

  let timeout = null;
  $("#search_event").on("keyup", function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      defaultEvents.currentPage = 1;
      loadEvents();
    }, 500);
  });

  fpEventDate = flatpickr("#evt_date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: "pt",
    allowInput: true,
  });
});

const loadEvents = async () => {
  const container = $(".list-table-events");
  try {
    const page = Math.max(0, defaultEvents.currentPage - 1);

    const res = await window.ajaxValidator({
      validator: "getAllEvents",
      token: window.defaultApp.userInfo.token,
      limit: defaultEvents.rowsPerPage,
      page: page * defaultEvents.rowsPerPage,
      search: $("#search_event").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year: localStorage.getItem("sys_active_year"),
    });

    if (res.status) {
      const dataArray = res.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultEvents.totalPages = Math.max(1, Math.ceil(total / defaultEvents.rowsPerPage));
        renderTableEvents(dataArray);
      } else {
        container.html(`
          <div class="text-center py-5 opacity-50">
              <span class="material-symbols-outlined" style="font-size: 56px;">event_busy</span>
              <p class="mt-3 fw-medium text-body">Nenhum evento agendado para este período.</p>
          </div>
        `);
      }
    } else {
      throw new Error(res.alert || "Não foi possível carregar a lista de eventos.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de conexão ao carregar o calendário.";

    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-calendar-times fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar calendário</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="loadEvents()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Eventos", errorMessage);
  }
};

const renderTableEvents = (data) => {
  const container = $(".list-table-events");

  if (data.length === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined fs-1">event_busy</span>
            <p class="mt-2">Nenhum evento encontrado.</p>
        </div>
    `);
    return;
  }

  // =========================================================
  // LÓGICA DE PERMISSÕES (RBAC)
  // =========================================================
  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {
    console.warn("Erro ao ler permissões", e);
  }

  const canEdit = allowedSlugs.includes("eventos.edit");
  const canHistory = allowedSlugs.includes("eventos.history");
  const canDelete = allowedSlugs.includes("eventos.delete");

  // Helper para Status no Desktop (Badge)
  const getBlockerLabel = (is) =>
    is
      ? `<span title="Bloqueado (Feriado)" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock"></i></span>`
      : `<span title="Liberado (Dia Letivo)" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock-open"></i></span>`;

  // Helper para Status no Mobile (Ícone Limpo)
  const getStatusIconHtml = (is) =>
    is
      ? `<span title="Bloqueado (Feriado)" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock"></i></span>`
      : `<span title="Liberado (Dia Letivo)" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock-open"></i></span>`;

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CLEAN)
  // =========================================================
  let desktopRows = data
    .map((item) => {
      const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
      const dateObj = new Date(item.event_date + "T00:00:00");
      const dayName = days[dateObj.getDay()];


      const timeInfo = item.start_time ? `<small class="text-secondary d-block"><i class="far fa-clock me-1 opacity-50"></i> ${item.start_time}</small>` : `<small class="text-secondary d-block"><i class="far fa-clock me-1 opacity-50"></i> Dia todo</small>`;

      // Renderiza o switch apenas se puder editar
      const toggleHtml = `
        <div class="d-flex align-items-center justify-content-center">
          ${
            canEdit
              ? `
          <div class="form-check form-switch mb-0 d-flex align-items-center">
            <input class="form-check-input shadow-sm m-0" type="checkbox" ${item.is_academic_blocker ? "checked" : ""} onchange="toggleBlocker(${item.event_id}, this)" style="cursor: pointer;">
          </div>`
              : ""
          }
          <div id="lbl_desk_${item.event_id}" class="${canEdit ? "ms-2" : ""}">
              ${getBlockerLabel(item.is_academic_blocker)}
          </div>
        </div>`;

      // Renderiza as ações condicionalmente
      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('organization.events', ${item.event_id}, this)" title="Histórico"><i class="fas fa-history"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick="editEvent(${item.event_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteEvent(${item.event_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      return `
        <tr>
            <td class="align-middle ps-4" style="width: 70px;">
                <div class="icon-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm">
                    <span class="material-symbols-outlined" style="font-size: 20px;">event</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.title}</div>
                <div class="small text-secondary text-truncate" style="max-width: 300px;">${item.description || "Sem anotações"}</div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-body">${item.date_fmt} (${dayName})</div>
                ${canEdit ? timeInfo : ""}
            </td>
            <td class="align-middle text-center" style="width: 220px;">
                ${toggleHtml}
            </td>
            <td class="align-middle text-end pe-4">
                <div class="d-flex justify-content-end gap-2">
                    ${actionsHtml || '<span class="text-muted small opacity-50"><i class="fas fa-ban"></i></span>'}
                </div>
            </td>
        </tr>`;
    })
    .join("");

  // =========================================================
  // 2. VISÃO MOBILE (INSET GROUPED LIST - APPLE HIG COM MICRO-TOOLBAR)
  // =========================================================
  let mobileRows = data
    .map((item) => {
      const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
      const dateObj = new Date(item.event_date + "T00:00:00");
      const dayName = days[dateObj.getDay()];

      // Mobile Toggle condicional
      let mobileToggleHtml = `
        <div id="lbl_mob_${item.event_id}">
            ${getStatusIconHtml(item.is_academic_blocker)}
        </div>`;
      if (canEdit) {
        mobileToggleHtml += `
        <div class="form-check form-switch m-0 p-0 d-flex align-items-center ms-2">
            <input class="form-check-input m-0 shadow-none" type="checkbox" ${item.is_academic_blocker ? "checked" : ""} onchange="toggleBlocker(${item.event_id}, this)" style="cursor: pointer; width: 38px; height: 22px;">
        </div>`;
      }

      // Mobile Actions condicionais
      let mobActionsHtml = "";
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('organization.events', ${item.event_id}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="editEvent(${item.event_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        mobActionsHtml += `<button class="btn btn-sm text-danger  bg-danger  bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deleteEvent(${item.event_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      let mobileFooter = "";
      if (mobActionsHtml !== "") {
        mobileFooter = `
        <div class="d-flex justify-content-end align-items-center mt-2 pt-2 border-top border-secondary border-opacity-10 w-100">
            <div class="d-flex gap-2">
                ${mobActionsHtml}
            </div>
        </div>`;
      }

      return `
        <div class="ios-list-item flex-column align-items-stretch" style="padding: 12px 16px;">
            <div class="d-flex w-100 align-items-center">
                <div class="me-3">
                    <div class="event-date-box d-flex flex-column text-center border border-secondary border-opacity-25 shadow-sm overflow-hidden" style="width: 48px; height: 52px; border-radius: 10px;">
                        <div class="text-uppercase fw-bold bg-danger text-white w-100 d-flex align-items-center justify-content-center" style="font-size: 0.5rem; height: 16px; letter-spacing: 0.5px;">
                            ${dayName || "DIA"}
                        </div>
                        <div class="d-flex align-items-center justify-content-center flex-grow-1">
                            <span class="fw-bold text-body lh-1">${item.date_fmt.split("/")[0]}/${item.date_fmt.split("/")[1]}</span>
                        </div>
                    </div>
                </div>
                
                <div class="flex-grow-1 d-flex flex-column justify-content-center" style="min-width: 0;">
                    <h6 class="fw-bold text-body m-0 text-truncate w-100" style="font-size: 0.95rem;">${item.title}</h6>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        <span class="text-secondary" style="font-size: 0.75rem;"><i class="far fa-clock me-1 opacity-50"></i> ${item.start_time ? item.start_time : "Dia todo"}</span>
                    </div>
                </div>

                <div class="d-flex flex-column align-items-end justify-content-center ms-2 flex-shrink-0">
                    <div class="d-flex align-items-center justify-content-end gap-2 w-100">
                        ${mobileToggleHtml}
                    </div>
                </div>
            </div>

            ${mobileFooter}
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-secondary text-uppercase" style="font-size: 0.75rem;">Evento</th>
                    <th class="text-secondary text-uppercase" style="font-size: 0.75rem;">Data/Hora</th>
                    <th class="text-center text-secondary text-uppercase" style="font-size: 0.75rem;">Status (Feriado)</th>
                    <th class="text-end pe-4 text-secondary text-uppercase" style="font-size: 0.75rem;">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none ios-list-container">${mobileRows}</div>
  `);

  _generatePaginationButtons("pagination-events", "currentPage", "totalPages", "changePage", defaultEvents);
};

window.toggleBlocker = async (id, element) => {
  const $chk = $(element);
  const $loader = $chk.siblings(".toggle-loader");
  const status = $chk.is(":checked");

  const $labelDesk = $(`#lbl_desk_${id}`);
  const $labelMob = $(`#lbl_mob_${id}`);

  const setVisualState = (isBlocker) => {
    // Atualiza Desktop
    const badgeDesk = isBlocker
      ? `<span title="Bloqueado (Feriado)" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock"></i></span>`
      : `<span title="Liberado (Dia Letivo)" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock-open"></i></span>`;
    $labelDesk.html(badgeDesk);

    // Atualiza Mobile (Ícone Redondo Sólido)
    const iconMob = isBlocker
      ? `<span title="Bloqueado (Feriado)" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock"></i></span>`
      : `<span title="Liberado (Dia Letivo)" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-lock-open"></i></span>`;
    $labelMob.html(iconMob);
  };

  try {
    $chk.prop("disabled", true);
    $loader.removeClass("d-none");

    setVisualState(status);

    const res = await window.ajaxValidator({
      validator: "toggleEventBlocker",
      token: window.defaultApp.userInfo.token,
      id: id,
      is_blocker: status,
    });

    if (res.status) {
      window.alertDefault(`Data ${status ? "bloqueada" : "liberada"} com sucesso!`, "success");
    } else {
      throw new Error(res.msg || res.alert || "O servidor não permitiu alterar o bloqueio deste evento.");
    }
  } catch (e) {
    $chk.prop("checked", !status);
    setVisualState(!status);

    const errorMessage = e.message || "Falha de conexão ao tentar atualizar o status.";
    window.alertErrorWithSupport(`Alternar Bloqueio de Agenda`, errorMessage);
  } finally {
    $chk.prop("disabled", false);
    $loader.addClass("d-none");
  }
};

window.openEventModal = () => {
  $("#formEvent")[0].reset();
  $("#event_id").val("");
  $("#modalEventTitle").text("Novo Evento");
  if (fpEventDate) fpEventDate.clear();
  $("#modalEvent").modal("show");
};

window.editEvent = async (id, btn) => {
  btn = $(btn);
  try {
    window.setButton(true, btn, "");
    const res = await window.ajaxValidator({
      validator: "getEventData",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (res.status) {
      const d = res.data;

      $("#event_id").val(d.event_id);
      $("#evt_title").val(d.title);
      $("#evt_desc").val(d.description);

      if (fpEventDate) fpEventDate.setDate(d.event_date);

      $("#evt_start").val(d.start_time);
      $("#evt_end").val(d.end_time);

      $("#evt_blocker").prop("checked", d.is_academic_blocker === true || d.is_academic_blocker === "t" || d.is_academic_blocker === 1);

      $("#modalEventTitle").html('<i class="fas fa-pen me-2 opacity-75"></i> Editar Evento');
      $("#modalEvent").modal("show");
    } else {
      throw new Error(res.alert || res.msg || "O servidor não retornou os dados deste evento.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar o evento.";
    window.alertErrorWithSupport(`Abrir Edição de Evento`, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.saveEvent = async (btn) => {
  btn = $(btn);
  const id = $("#event_id").val();
  const title = $("#evt_title").val()?.trim();
  const date = $("#evt_date").val();

  if (!title || !date) {
    window.alertDefault("Título e data são obrigatórios.", "warning");
    return;
  }

  window.setButton(true, btn, id ? " Salvando..." : " Cadastrando...");

  try {
    const res = await window.ajaxValidator({
      validator: "upsertEvent",
      token: window.defaultApp.userInfo.token,
      event_id: id,
      title: title,
      description: $("#evt_desc").val(),
      event_date: date,
      start_time: $("#evt_start").val(),
      end_time: $("#evt_end").val(),
      is_academic_blocker: $("#evt_blocker").is(":checked"),
      user_id: window.defaultApp.userInfo.id,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (res.status) {
      window.alertDefault(res.msg || "Evento salvo com sucesso!", "success");
      $("#modalEvent").modal("hide");

      if (typeof loadEvents === "function") loadEvents();
    } else {
      throw new Error(res.msg || res.alert || "O servidor recusou o salvamento deste evento.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar o evento.";
    const acaoContexto = id ? `Editar Evento` : "Criar Novo Evento";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteEvent = (id) => {
  Swal.fire({
    title: "Excluir Evento?",
    text: "O registro será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await window.ajaxValidator({
          validator: "removeEvent",
          token: window.defaultApp.userInfo.token,
          id: id,
          user_id: window.defaultApp.userInfo.id,
        });

        if (res.status) {
          window.alertDefault("Evento removido com sucesso.", "success");

          if (typeof loadEvents === "function") loadEvents();
        } else {
          throw new Error(res.msg || res.alert || "O servidor não permitiu excluir este evento.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar remover o evento.";
        window.alertErrorWithSupport(`Excluir Evento`, errorMessage);
      }
    }
  });
};

window.changePage = (p) => {
  defaultEvents.currentPage = p;
  loadEvents();
};

const _generatePaginationButtons = (c, k, t, f, o) => {
  let container = $(`.${c}`);
  container.empty();

  let total = o[t];
  let current = o[k];

  if (!total || total < 1) total = 1;

  // Container centralizado com gap para os botões
  let html = `<div class="d-flex align-items-center justify-content-center gap-2">`;

  // Botão Anterior (Chevron Left)
  html += `<button onclick="${f}(${current - 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === 1 ? "disabled" : ""} title="Anterior">
              <i class="fas fa-chevron-left" style="font-size: 0.85rem;"></i>
           </button>`;

  // Miolo Numérico Inteligente (Mostra apenas Atual, -1 e +1)
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) {
    if (p === current) {
      // Página Atual (Sólida e Inativa para clique)
      html += `<button class="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold" style="width: 36px; height: 36px; padding: 0;" disabled>${p}</button>`;
    } else {
      // Páginas Vizinhas (Translúcidas e Clicáveis)
      html += `<button onclick="${f}(${p})" class="btn btn-sm text-secondary bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none fw-bold" style="width: 36px; height: 36px; padding: 0;">${p}</button>`;
    }
  }

  // Botão Próxima (Chevron Right)
  html += `<button onclick="${f}(${current + 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === total ? "disabled" : ""} title="Próxima">
              <i class="fas fa-chevron-right" style="font-size: 0.85rem;"></i>
           </button>`;

  html += `</div>`;
  container.html(html);
};
