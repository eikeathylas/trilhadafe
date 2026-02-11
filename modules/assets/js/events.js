// =========================================================
// GESTÃO DE EVENTOS (FRONTEND LOGIC) - V4 (Layout Fixed)
// =========================================================

const defaultEvents = { currentPage: 1, rowsPerPage: 10, totalPages: 1 };
let fpEventDate = null; // Instância Flatpickr

$(document).ready(() => {
  loadEvents();

  // Filtro com Debounce
  let timeout = null;
  $("#search_event").on("keyup", function () {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      defaultEvents.currentPage = 1;
      loadEvents();
    }, 500);
  });

  // Inicializa Flatpickr
  fpEventDate = flatpickr("#evt_date", {
    dateFormat: "Y-m-d",
    altInput: true,
    altFormat: "d/m/Y",
    locale: "pt",
    allowInput: true,
  });
});

// 1. LISTAGEM
const loadEvents = async () => {
  const container = $(".list-table-events");
  container.html('<div class="text-center py-5"><span class="loader"></span></div>');

  try {
    const res = await ajaxValidator({
      validator: "getAllEvents",
      token: defaultApp.userInfo.token,
      limit: defaultEvents.rowsPerPage,
      page: (defaultEvents.currentPage - 1) * defaultEvents.rowsPerPage,
      search: $("#search_event").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year: localStorage.getItem("sys_active_year"),
    });

    if (res.status) {
      const total = res.data[0]?.total_registros || 0;
      defaultEvents.totalPages = Math.max(1, Math.ceil(total / defaultEvents.rowsPerPage));
      renderTableEvents(res.data || []);
    } else {
      renderTableEvents([]);
    }
  } catch (e) {
    container.html('<div class="alert alert-danger m-3">Erro ao carregar eventos.</div>');
  }
};

const renderTableEvents = (data) => {
  const container = $(".list-table-events");

  if (data.length === 0) {
    container.html(`<div class="text-center py-5 text-muted opacity-50"><span class="material-symbols-outlined fs-1">event_busy</span><p class="mt-2">Nenhum evento encontrado.</p></div>`);
    return;
  }

  // Helper de Toggle
  const getToggle = (item) => window.renderToggle(item.event_id, item.is_academic_blocker, "toggleBlocker");
  const getBlockerLabel = (is) => (is ? '<span class="badge bg-danger-subtle text-danger border border-danger">Feriado</span>' : '<span class="badge bg-success-subtle text-success border border-success">Agenda</span>');

  // DESKTOP
  let desktopRows = data
    .map((item) => {
      const timeInfo = item.start_time ? `<small class="text-muted d-block"><i class="far fa-clock me-1"></i> ${item.start_time}</small>` : "";
      return `<tr>
            <td class="align-middle ps-3" width="60"><div class="icon-circle bg-primary bg-opacity-10 text-primary"><span class="material-symbols-outlined">event</span></div></td>
            <td class="align-middle"><div class="fw-bold ">${item.title}</div><div class="small text-muted text-truncate" style="max-width: 300px;">${item.description || "Sem descrição"}</div></td>
            <td class="align-middle"><div class="fw-bold ">${item.date_fmt}</div>${timeInfo}</td>
            <td class="align-middle text-center" width="200"><div class="form-check form-switch d-flex justify-content-center align-items-center">${getToggle(item)}<label class="form-check-label ms-2" id="lbl_${item.event_id}">${getBlockerLabel(item.is_academic_blocker)}</label></div></td>
            <td class="align-middle text-end pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.events', ${item.event_id})"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action" onclick="editEvent(${item.event_id})"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action delete" onclick="deleteEvent(${item.event_id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      const toggleHtml = window.renderToggle ? window.renderToggle(item.event_id, item.is_academic_blocker, "toggleBlocker") : `<input type="checkbox" ${item.is_academic_blocker ? "checked" : ""} onchange="toggleBlocker(${item.event_id}, this)">`;
      const statusText = item.is_academic_blocker ? '<span class="badge bg-danger-subtle text-danger border border-danger">Feriado</span>' : '<span class="badge bg-success-subtle text-success border border-success">Agenda</span>';

      return `
        <div class="mobile-card p-3">
            <div class="d-flex align-items-center mb-3">
                <div class="event-date-box me-3 text-center border p-2 rounded" style="min-width: 60px;">
                    <div class="text-uppercase small fw-bold text-secondary">${item.day_week || "DIA"}</div>
                    <div class="h4 fw-bold mb-0">${item.date_fmt.split("/")[0]}</div>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-bold">${item.title}</div>
                    <div class="small text-muted">${item.start_time ? item.start_time : "Dia todo"}</div>
                </div>
                <div class="d-flex align-items-center">
                    ${toggleHtml}
                    ${statusText}
                </div>
            </div>
            <div class="mobile-actions">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.events', ${item.event_id})"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action" onclick="editEvent(${item.event_id})"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action delete" onclick="deleteEvent(${item.event_id})"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2" class="ps-3">Evento</th><th>Data/Hora</th><th class="text-center">Tipo (Bloqueio)</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-none">${mobileRows}</div>
  `);

  _generatePaginationButtons("pagination-events", "currentPage", "totalPages", "changePage", defaultEvents);
};

// [NOVO] Função do Toggle
window.toggleBlocker = async (id, element) => {
  const $chk = $(element);
  const status = $chk.is(":checked");
  // Feedback visual imediato no label
  const label = $(`#lbl_${id}`);
  if (status) {
    label.html('<span class="badge bg-danger-subtle text-danger border border-danger"><i class="fas fa-ban me-1"></i> Feriado Escolar</span>');
  } else {
    label.html('<span class="badge bg-success-subtle text-success border border-success">Agenda Comum</span>');
  }

  try {
    const res = await ajaxValidator({
      validator: "toggleEventBlocker",
      token: defaultApp.userInfo.token,
      id: id,
      is_blocker: status,
    });

    if (res.status) {
      window.alertDefault("Status atualizado.", "success");
      loadEvents();
    } else {
      window.alertDefault(res.msg, "error");
      $(`#sw_${id}`).prop("checked", !status);
    }
  } catch (e) {
    window.alertDefault("Erro de conexão.", "error");
    $(`#sw_${id}`).prop("checked", !status);
    loadEvents();
  }
};

// 2. CADASTRO / EDIÇÃO
window.openEventModal = () => {
  $("#formEvent")[0].reset();
  $("#event_id").val("");
  $("#modalEventTitle").text("Novo Evento");
  fpEventDate.clear();
  $("#modalEvent").modal("show");
};

window.editEvent = async (id) => {
  try {
    const res = await ajaxValidator({
      validator: "getEventData",
      token: defaultApp.userInfo.token,
      id: id,
    });

    if (res.status) {
      const d = res.data;
      $("#event_id").val(d.event_id);
      $("#evt_title").val(d.title);
      $("#evt_desc").val(d.description);

      fpEventDate.setDate(d.event_date);

      $("#evt_start").val(d.start_time);
      $("#evt_end").val(d.end_time);
      $("#evt_blocker").prop("checked", d.is_academic_blocker === true || d.is_academic_blocker === "t");

      $("#modalEventTitle").text("Editar Evento");
      $("#modalEvent").modal("show");
    }
  } catch (e) {
    window.alertDefault("Erro ao carregar dados.", "error");
  }
};

window.saveEvent = async () => {
  const id = $("#event_id").val();
  const title = $("#evt_title").val().trim();
  const date = $("#evt_date").val();

  if (!title || !date) {
    window.alertDefault("Preencha título e data.", "warning");
    return;
  }

  try {
    const res = await ajaxValidator({
      validator: "upsertEvent",
      token: defaultApp.userInfo.token,
      event_id: id,
      title: title,
      description: $("#evt_desc").val(),
      event_date: date,
      start_time: $("#evt_start").val(),
      end_time: $("#evt_end").val(),
      is_academic_blocker: $("#evt_blocker").is(":checked"),
      user_id: defaultApp.userInfo.id,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (res.status) {
      window.alertDefault(res.msg, "success");
      $("#modalEvent").modal("hide");
      loadEvents();
    } else {
      window.alertDefault(res.msg, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao salvar.", "error");
  }
};

// 3. EXCLUSÃO
window.deleteEvent = (id) => {
  Swal.fire({
    title: "Excluir Evento?",
    text: "Esta ação não pode ser desfeita.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Excluir",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await ajaxValidator({
          validator: "removeEvent",
          token: defaultApp.userInfo.token,
          id: id,
          user_id: defaultApp.userInfo.id,
        });
        if (res.status) {
          window.alertDefault("Evento excluído.", "success");
          loadEvents();
        } else {
          window.alertDefault(res.msg, "error");
        }
      } catch (e) {
        window.alertDefault("Erro ao excluir.", "error");
      }
    }
  });
};

// Paginação
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
