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

  const getBlockerLabel = (is) =>
    is
      ? '<span class="badge bg-danger-subtle text-danger border border-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)">Feriado/Bloqueio <i class="fas fa-circle-info text-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)"></i></span>'
      : '<span class="badge bg-success-subtle text-success border border-success">Agenda Aberta</span>';

  let desktopRows = data
    .map((item) => {
      const timeInfo = item.start_time ? `<small class="text-muted d-block"><i class="far fa-clock me-1"></i> ${item.start_time}</small>` : "";

      const toggleHtml = `
        <div class="form-check form-switch d-flex justify-content-center align-items-center">
            <input class="form-check-input" type="checkbox" ${item.is_academic_blocker ? "checked" : ""} onchange="toggleBlocker(${item.event_id}, this)">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
            <label class="form-check-label ms-2" id="lbl_${item.event_id}">
                ${getBlockerLabel(item.is_academic_blocker)}
            </label>
        </div>`;

      return `
        <tr>
            <td class="align-middle ps-3" width="60">
                <div class="icon-circle bg-primary bg-opacity-10 text-primary">
                    <span class="material-symbols-outlined">event</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.title}</div>
                <div class="small text-muted text-truncate" style="max-width: 300px;">${item.description || "Sem descrição"}</div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.date_fmt}</div>
                ${timeInfo}
            </td>
            <td class="align-middle text-center" width="200">
                ${toggleHtml}
            </td>
            <td class="align-middle text-end pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.events', ${item.event_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="editEvent(${item.event_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteEvent(${item.event_id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  let mobileRows = data
    .map((item) => {
      const toggleHtml = `
        <div class="form-check form-switch mb-0 d-flex justify-content-end">
            <input class="form-check-input m-0" type="checkbox" ${item.is_academic_blocker ? "checked" : ""} onchange="toggleBlocker(${item.event_id}, this)">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>`;

      const statusText = item.is_academic_blocker
        ? '<span class="badge bg-danger-subtle text-danger border border-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)">Feriado/Bloqueio <i class="fas fa-circle-info text-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)"></i></span>'
        : '<span class="badge bg-success-subtle text-success border border-success">Agenda Aberta</span>';

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex align-items-center">
                
                <div class="event-date-box me-3 text-center border border-secondary border-opacity-10 bg-secondary bg-opacity-10 p-2 rounded-3" style="min-width: 65px;">
                    <div class="text-uppercase fw-bold text-secondary mb-1 lh-1" style="font-size: 0.65rem; letter-spacing: 0.5px;">${item.day_week || "DIA"}</div>
                    <div class="h5 fw-bold mb-0 lh-1 text-body">${item.date_fmt.split("/")[0]}/${item.date_fmt.split("/")[1]}</div>
                </div>
                
                <div class="flex-grow-1 pe-2">
                    <h6 class="fw-bold mb-1 fs-5">${item.title}</h6>
                    <div class="small text-muted fw-medium d-flex align-items-center">
                        <i class="far fa-clock me-2 opacity-50"></i> ${item.start_time ? item.start_time : "Dia todo"}
                    </div>
                </div>
                
                <div class="d-flex flex-column align-items-end justify-content-center">
                    ${toggleHtml}
                    <div id="lbl_mob_${item.event_id}" class="mt-2">${statusText}</div>
                </div>
                
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('organization.events', ${item.event_id}, this)" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="editEvent(${item.event_id}, this)" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteEvent(${item.event_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3">Evento</th>
                    <th>Data/Hora</th>
                    <th class="text-center">Tipo (Bloqueio)</th>
                    <th class="text-end pe-4">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none">${mobileRows}</div>
  `);

  _generatePaginationButtons("pagination-events", "currentPage", "totalPages", "changePage", defaultEvents);
};

window.toggleBlocker = async (id, element) => {
  const $chk = $(element);
  const $loader = $chk.siblings(".toggle-loader");
  const status = $chk.is(":checked");

  const $labels = $(`#lbl_${id}, #lbl_mob_${id}`);

  const setVisualState = (isBlocker) => {
    const badge = isBlocker ? '<span class="badge bg-danger-subtle text-danger border border-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)">Feriado/Bloqueio <i class="fas fa-circle-info text-danger" style="cursor: help;" title="Quando ativo, não haverá aula (Feriado acadêmico)"></i></span>' : '<span class="badge bg-success-subtle text-success border border-success">Agenda Aberta</span>';
    $labels.html(badge);
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
      window.alertDefault("Status do calendário atualizado.", "success");
    } else {
      throw new Error(res.msg || res.alert || "O servidor não permitiu alterar o bloqueio deste evento.");
    }
  } catch (e) {
    $chk.prop("checked", !status);
    setVisualState(!status);

    const errorMessage = e.message || "Falha de conexão ao tentar atualizar o bloqueio.";
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
  fpEventDate.clear();
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

      if (typeof fpEventDate !== "undefined") {
        fpEventDate.setDate(d.event_date);
      }

      $("#evt_start").val(d.start_time);
      $("#evt_end").val(d.end_time);

      $("#evt_blocker").prop("checked", d.is_academic_blocker === true || d.is_academic_blocker === "t" || d.is_academic_blocker === 1);

      $("#modalEventTitle").text("Editar Evento");
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

  window.setButton(true, btn, id ? " Salvando..." : " Cadastrando...");

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
  let html = `<button onclick="${f}(1)" class="btn btn-sm btn-secondary me-1" ${current === 1 ? "disabled" : ""}>Primeira</button>`;
  for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p++) {
    html += `<button onclick="${f}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"} me-1">${p}</button>`;
  }
  html += `<button onclick="${f}(${total})" class="btn btn-sm btn-secondary" ${current === total ? "disabled" : ""}>Última</button>`;
  container.html(html);
};
