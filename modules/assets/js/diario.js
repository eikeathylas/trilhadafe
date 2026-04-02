const defaultDiary = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

const diarioState = {
  classId: null,
  phaseId: null,
  schedules: [],
  sessionId: null,
  currentDateInfo: null,
  globalAttendance: [],
};

let fpInstance = null;

// =========================================================
// 1. CONFIGURAÇÃO RESPONSIVA DO EDITOR
// =========================================================
const summernoteConfig = {
  lang: "pt-BR",
  placeholder: "Descreva o roteiro, atividades ou observações do encontro...",
  dialogsInBody: true,
  disableResizeEditor: true,
  height: 200,
  toolbar: [
    ["style", ["bold", "italic", "underline", "clear"]],
    ["para", ["ul", "ol", "paragraph"]],
    ["insert", ["link"]],
    ["view", ["fullscreen"]],
  ],
  callbacks: {},
};

$(document).ready(() => {
  window.addEventListener("yearChanged", () => {
    resetInterface();
    const $selClass = $("#sel_filter_class");
    if ($selClass.length && $selClass[0].selectize) {
      $selClass[0].selectize.destroy();
    }
    initFilters();
  });
});

// =========================================================
// 2. MOTORES DE FILTRO (Turmas e Fase)
// =========================================================
const initFilters = () => {
  if ($("#sel_filter_class").length && !$("#sel_filter_class")[0].selectize) {
    $("#sel_filter_class").selectize({
      valueField: "class_id",
      labelField: "class_name",
      searchField: ["class_name", "course_name"],
      placeholder: "Selecione a Turma...",
      preload: true,
      render: {
        option: function (item, escape) {
          return `<div class="py-1 px-2"><div class="fw-bold text-body">${escape(item.class_name)}</div><div class="small text-muted">${escape(item.course_name)}</div></div>`;
        },
      },
      load: function (query, callback) {
        const globalYear = localStorage.getItem("sys_active_year");
        if (!globalYear) return callback();
        $.ajax({
          url: defaultApp.validator,
          type: "POST",
          dataType: "json",
          data: {
            validator: "getMyClasses",
            token: defaultApp.userInfo.token,
            role: defaultApp.userInfo.office,
            org_id: localStorage.getItem("tf_active_parish"),
            year: globalYear,
          },
          success: (res) => {
            if (res.status && res.data.length > 0) {
              callback(res.data);
              if (res.data.length === 1) this.setValue(res.data[0].class_id);
            } else callback();
          },
          error: () => callback(),
        });
      },
      onChange: function (value) {
        if (value) {
          diarioState.classId = value;
          loadPhases(value);
          if ($("#sel_filter_phase")[0].selectize) $("#sel_filter_phase")[0].selectize.enable();
        } else {
          diarioState.classId = null;
          resetInterface();
        }
      },
    });
  }

  if ($("#sel_filter_phase").length && !$("#sel_filter_phase")[0].selectize) {
    $("#sel_filter_phase").selectize({
      valueField: "phase_id",
      labelField: "phase_name",
      searchField: "phase_name",
      placeholder: "Selecione a Fase...",
      onChange: function (value) {
        if (value) {
          diarioState.phaseId = value;
          defaultDiary.currentPage = 1;
          getHistory();
          $("#btn_new_session").prop("disabled", false);
        } else {
          diarioState.phaseId = null;
          $("#btn_new_session").prop("disabled", true);
          $(".list-table-diario").empty();
        }
      },
    });
  }
};

const loadPhases = async (classId) => {
  const selSub = $("#sel_filter_phase")[0].selectize;
  selSub.clear();
  selSub.clearOptions();
  selSub.disable();

  try {
    const res = await window.ajaxValidator({ validator: "getClassPhases", token: defaultApp.userInfo.token, class_id: classId });
    if (res.status) {
      if (res.data.length == 0) {
        $(".list-table-diario").html(`
          <div class="text-center py-5 opacity-50">
              <span class="material-symbols-outlined" style="font-size: 56px;">event_busy</span>
              <p class="mt-3 fw-medium text-body">Nenhuma fase encontrada para esta turma, consulte a coordenação.</p>
          </div>
        `);
        selSub.disable();
      } else {
        selSub.enable();
        res.data.forEach((item) => selSub.addOption(item));
        if (res.data.length === 1) selSub.setValue(res.data[0].phase_id);
      }
    } else {
      throw new Error(res.alert || "Erro ao obter fase.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar fase da turma.";
    window.alertErrorWithSupport(`Carregar Fase da Turma`, errorMessage);
  }
};

const resetInterface = () => {
  const selSub = $("#sel_filter_phase")[0]?.selectize;
  if (selSub) {
    selSub.clear();
    selSub.disable();
  }
  $("#btn_new_session").prop("disabled", true);
  $(".pagination-diario").empty();
  $(".list-table-diario").html(`
    <div class="text-center py-5 text-muted opacity-50">
        <i class="fas fa-arrow-up mb-3 d-block" style="font-size: 2.5rem;"></i>
        <h6 class="fw-bold text-body">Selecione Turma e Fase</h6>
        <p class="small text-secondary">Utilize os filtros acima para visualizar ou lançar o diário.</p>
    </div>
  `);
};

// =========================================================
// 3. CARREGAMENTO E RENDERIZAÇÃO DO HISTÓRICO (AGRUPADO POR DATA)
// =========================================================
window.getHistory = async () => {
  const page = Math.max(0, defaultDiary.currentPage - 1);
  const container = $(".list-table-diario");

  container.html(`
    <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 fw-medium text-body">Sincronizando histórico de encontros...</p>
    </div>
  `);

  try {
    const res = await window.ajaxValidator({
      validator: "getClassHistory",
      token: window.defaultApp.userInfo.token,
      class_id: diarioState.classId,
      phase_id: diarioState.phaseId,
      page: page * defaultDiary.rowsPerPage,
      limit: defaultDiary.rowsPerPage,
    });

    if (res.status) {
      const dataArray = res.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultDiary.totalPages = Math.max(1, Math.ceil(total / defaultDiary.rowsPerPage));

        const grouped = {};
        dataArray.forEach((item) => {
          const dateKey = item.session_date.split(" ")[0];
          if (!grouped[dateKey]) {
            grouped[dateKey] = {
              date: dateKey,
              total_students: item.total_students,
              present_count: item.present_count,
              sessions: [],
            };
          }
          grouped[dateKey].sessions.push(item);
        });

        renderTableHistory(Object.values(grouped));
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">history_edu</span>
                <p class="mt-3 fw-medium text-body">Nenhum encontro registrado para esta fase.</p>
            </div>
        `);
        $(".pagination-diario").empty();
      }
    } else {
      throw new Error(res.alert || res.msg || "O servidor não conseguiu recuperar o histórico do diário.");
    }
  } catch (e) {
    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar histórico</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getHistory()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);
  }
};

const renderTableHistory = (groupedData) => {
  const container = $(".list-table-diario");

  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}

  const canEdit = allowedSlugs.includes("diario.edit");

  const desktopRows = groupedData
    .map((group) => {
      const dateParts = group.date.split("-");
      const dateFmt = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
      const total = parseInt(group.total_students) || 0;
      const present = parseInt(group.present_count) || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      const progColor = pct < 70 ? "bg-danger" : pct < 90 ? "bg-warning" : "bg-success";

      const summaryHtml = group.sessions
        .map((s, idx) => {
          let text = s.title || "Sem título preenchido";
          text = text.length > 40 ? text.substring(0, 40) + "..." : text;
          return `<div class="mb-1 d-flex align-items-center"><span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-10 me-2 px-2 py-1" style="font-size:0.65rem;">Encontro</span><span class="small text-secondary fw-medium text-truncate">${text}</span></div>`;
        })
        .join("");

      let actionsHtml = "";
      const firstSess = group.sessions[0].session_id;
      if (allowedSlugs.includes("diario.history"))
        actionsHtml += `<button class="btn-icon-action text-warning" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.class_sessions', ${firstSess}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openSessionModal(null, '${group.date}', this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (allowedSlugs.includes("diario.delete")) actionsHtml += `<button class="btn-icon-action text-danger ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="deleteSession(${firstSess})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <tr>
        <td class="align-middle ps-4" style="width: 70px;">
          <div class="icon-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm" style="width: 48px; height: 48px;">
            <span class="material-symbols-outlined" style="font-size: 24px;">calendar_month</span>
          </div>
        </td>
        <td class="align-middle py-4">
          <div class="fw-bold text-body mb-3" style="font-size: 1.1rem;"><i class="fas fa-calendar-day opacity-50 me-2"></i> ${dateFmt}</div>
          <div class="d-flex flex-column gap-1">${summaryHtml}</div>
        </td>
        <td class="align-middle text-center" style="width: 240px;">
          <div class="d-flex flex-column align-items-center w-100 px-4">
            <small class="fw-bold text-muted mb-2 d-flex justify-content-between w-100">
                <span><i class="fas fa-users opacity-50 me-1"></i> ${present}/${total} presentes</span>
                <span class="text-${progColor.replace("bg-", "")}">${pct}%</span>
            </small>
            <div class="progress w-100 bg-secondary bg-opacity-10 shadow-inner rounded-pill" style="height: 10px;">
              <div class="progress-bar ${progColor} rounded-pill" role="progressbar" style="width: ${pct}%"></div>
            </div>
          </div>
        </td>
        <td class="text-end align-middle pe-4 text-nowrap" style="width: 160px;">
          <div class="d-flex justify-content-end align-items-center flex-nowrap gap-1">
            ${actionsHtml || '<span class="text-muted small opacity-50"><i class="fas fa-lock"></i></span>'}
          </div>
        </td>
      </tr>`;
    })
    .join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive pb-4">
      <table class="table-custom">
          <thead>
              <tr>
                  <th colspan="2" class="ps-4 py-3 text-uppercase small opacity-75">Resumo da Data</th>
                  <th class="text-center py-3 text-uppercase small opacity-75">Quadro de Frequência</th>
                  <th class="text-end pe-4 py-3 text-uppercase small opacity-75">Ações</th>
              </tr>
          </thead>
          <tbody>${desktopRows}</tbody>
      </table>
    </div>`;

  const mobileRows = groupedData
    .map((group) => {
      const dateParts = group.date.split("-");
      const day = dateParts[2];
      const month = dateParts[1];
      const dateObj = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const daysOfWeek = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
      const dayOfWeekStr = daysOfWeek[dateObj.getDay()];

      const total = parseInt(group.total_students) || 0;
      const present = parseInt(group.present_count) || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      const badgeStyle = pct < 70 ? "bg-danger text-white" : pct < 90 ? "bg-warning text-dark" : "bg-success text-white";

      const summaryHtml = group.sessions
        .map((s, idx) => {
          let text = s.title || "Sem conteúdo";
          text = text.length > 30 ? text.substring(0, 30) + "..." : text;
          return `<div class="d-flex align-items-center text-truncate"><span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-10 me-2 px-2 py-1" style="font-size:0.65rem;">Encontro</span><span class="small text-secondary text-truncate">${text}</span></div>`;
        })
        .join("");

      let mobActionsHtml = "";
      const firstSess = group.sessions[0].session_id;
      if (allowedSlugs.includes("diario.history"))
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.class_sessions', ${firstSess}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openSessionModal(null, '${group.date}', this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (allowedSlugs.includes("diario.delete"))
        mobActionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deleteSession(${firstSess})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch position-relative p-4 rounded-4 shadow-sm bg-white">
          <div class="position-absolute" style="top: 16px; right: 16px;">
              <span class="badge ${badgeStyle} rounded-pill shadow-sm px-2 py-1" style="font-size: 0.75rem;">${pct}%</span>
          </div>

          <div class="d-flex w-100 align-items-start mt-1">
              <div class="me-3 flex-shrink-0">
                  <div class="event-date-box d-flex flex-column text-center border border-secondary border-opacity-25 shadow-sm overflow-hidden" style="width: 56px; height: 60px; border-radius: 10px;">
                      <div class="text-uppercase fw-bold bg-primary text-white w-100 d-flex align-items-center justify-content-center" style="font-size: 0.55rem; height: 18px;">${dayOfWeekStr}</div>
                      <div class="d-flex align-items-center justify-content-center flex-grow-1">
                          <span class="fw-bolder text-body lh-1">${day}/${month}</span>
                      </div>
                  </div>
              </div>
              <div class="flex-grow-1 pe-4" style="min-width: 0;">
                  <h6 class="fw-bolder text-body m-0 mb-2" style="font-size: 1.05rem;">${group.sessions.length} Encontro(s)</h6>
                  <div class="d-flex flex-column gap-2 mt-2">
                      ${summaryHtml}
                  </div>
              </div>
          </div>
          <div class="d-flex justify-content-end align-items-center pt-2 mt-3 border-top border-secondary border-opacity-10 w-100 flex-nowrap gap-2">
              ${mobActionsHtml}
          </div>
      </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;
  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-diario", "currentPage", "totalPages", "changePage", defaultDiary);
};

// =========================================================
// 4. LÓGICA DO MODAL (DATA, ACCORDIONS E FREQUÊNCIA GLOBAL)
// =========================================================
window.openSessionModal = async (sessionId = null, dateStr = null, btn) => {
  diarioState.sessionId = sessionId;
  diarioState.globalAttendance = [];
  if (btn) window.setButton(true, $(btn), "");

  const $dateInput = $("#diario_date");
  $dateInput.val("").prop("disabled", true);
  $("#date-status-icon").empty();
  $("#date-msg").text("");
  $("#session_select_container").addClass("d-none");

  // CORREÇÃO: ID 'empty-accordion-msg' adicionado para permitir a deleção limpa!
  $("#accordions_container").html(`
      <div class="text-center py-5 opacity-50" id="empty-accordion-msg">
          <div class="spinner-border text-primary" role="status"></div>
          <p class="mt-3 fw-medium text-body">Aguardando data...</p>
      </div>
  `);

  $("#attendance_list_global").html(`
      <div class="text-center py-5 text-muted opacity-50">
          <span class="material-symbols-outlined fs-1">sync</span>
          <p class="mt-2 small mb-0 fw-medium">Aguardando data...</p>
      </div>
  `);

  if (typeof fpInstance !== "undefined" && fpInstance) {
    fpInstance.destroy();
    fpInstance = null;
  }

  $("#modalSession").modal("show");

  try {
    const resMeta = await window.ajaxValidator({ validator: "getDiarioMetadata", token: window.defaultApp.userInfo.token, class_id: diarioState.classId, phase_id: diarioState.phaseId });
    if (resMeta.status) {
      diarioState.schedules = resMeta.data.schedules;
      const validDates = resMeta.data.valid_dates || [];
      const existingDates = resMeta.data.existing_dates || [];
      const holidays = resMeta.data.holidays || {};
      const enableDates = [...new Set([...validDates, ...existingDates])];

      if (dateStr) {
        const currentDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
        if (!enableDates.includes(currentDate)) enableDates.push(currentDate);
      }

      $dateInput.prop("disabled", false);
      fpInstance = flatpickr("#diario_date", {
        enableTime: false,
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d/m/Y",
        locale: "pt",
        allowInput: true,
        minDate: resMeta.data.min_date,
        maxDate: resMeta.data.max_date,
        enable: enableDates,
        onDayCreate: function (dObj, dStr, fp, dayElem) {
          const offsetDate = new Date(dayElem.dateObj.getTime() - dayElem.dateObj.getTimezoneOffset() * 60000);
          const dateKey = offsetDate.toISOString().split("T")[0];
          if (holidays[dateKey]) {
            dayElem.classList.add("flatpickr-disabled");
            dayElem.setAttribute("title", holidays[dateKey]);
            dayElem.innerHTML += "<span class='event busy'></span>";
          } else if (existingDates.includes(dateKey)) {
            dayElem.innerHTML += "<span class='event existing'></span>";
            dayElem.setAttribute("title", "Diário já preenchido");
          } else if (validDates.includes(dateKey)) {
            dayElem.innerHTML += "<span class='event'></span>";
          }
        },
        onChange: function (selectedDates, dateStr) {
          if (typeof checkDateLogic === "function") checkDateLogic(dateStr);
        },
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.altInput) instance.altInput.disabled = false;
        },
      });

      if (dateStr) {
        fpInstance.setDate(dateStr.split(" ")[0], true);
      }
    } else throw new Error(resMeta.alert);
  } catch (e) {
    $("#accordions_container").html(`<div class='text-center py-5 text-danger'><i class='fas fa-exclamation-circle fs-2 mb-2'></i><p>${e.message}</p></div>`);
  } finally {
    if (btn) window.setButton(false, $(btn));
  }
};

window.checkDateLogic = async (dateStr) => {
  if (!dateStr) return;
  const $statusIcon = $("#date-status-icon");
  const $msgContainer = $("#date-msg");
  const $selectContainer = $("#session_select_container");
  const $select = $("#diario_session_select");

  $statusIcon.html('<div class="spinner-border spinner-border-sm text-primary" role="status"></div>');
  $msgContainer.text("Validando encontros...").removeClass("text-warning text-danger text-success text-primary");
  $selectContainer.addClass("d-none");

  // CORREÇÃO: ID 'empty-accordion-msg' adicionado!
  $("#accordions_container").html('<div class="text-center py-5 opacity-50" id="empty-accordion-msg"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 fw-medium text-body">Aguardando seleções...</p></div>');

  if ($select[0].selectize) $select[0].selectize.destroy();
  $select.empty();

  try {
    const res = await window.ajaxValidator({ validator: "checkDateContent", token: defaultApp.userInfo.token, class_id: diarioState.classId, phase_id: diarioState.phaseId, date: dateStr });
    if (res.status) {
      const info = res.data;
      diarioState.currentDateInfo = info;

      if (info.status === "BLOCKED") {
        $statusIcon.html('<i class="fas fa-ban text-danger"></i>');
        $msgContainer.text(`Bloqueado: ${info.reason}`).addClass("text-danger");
        $("#accordions_container").html('<div class="text-center py-5 opacity-50"><span class="material-symbols-outlined fs-1">block</span><p class="mt-2 fw-bold text-body">Data bloqueada.</p></div>');
      } else {
        let options = [];

        if (info.sessions && info.sessions.length > 0) {
          info.sessions.forEach((s) => {
            options.push({ value: s.session_id.toString(), text: `${s.title} (Salvo)` });
          });
        }

        if (info.new_options && info.new_options.length > 0) {
          info.new_options.forEach((opt) => {
            options.push({ value: `NEW_${opt.sequence}`, text: `+ Adicionar ${opt.title}` });
          });
        }

        options.forEach((opt) => $select.append(new Option(opt.text, opt.value)));

        let defaultVals = [];
        if (info.sessions && info.sessions.length > 0) {
          info.sessions.forEach((s) => defaultVals.push(s.session_id.toString()));
        } else if (info.new_options && info.new_options.length > 0) {
          defaultVals.push(`NEW_${info.new_options[0].sequence}`);
        }

        $select.selectize({
          plugins: ["remove_button"],
          onChange: function (values) {
            window.renderAccordions(values);
          },
          onInitialize: function () {
            this.$control.css({ border: "none", "background-color": "rgba(255, 255, 255, 1)", "border-radius": "10px", padding: "12px 16px", "font-weight": "600" });
          },
        });

        $selectContainer.removeClass("d-none").show();
        $select[0].selectize.setValue(defaultVals, true);
        window.renderAccordions(defaultVals);

        loadGlobalStudentsList(dateStr, info.sessions);

        $statusIcon.html('<i class="fas fa-check-circle text-success"></i>');
        $msgContainer.text("Selecione os encontros para preencher.").addClass("text-success");
      }
    }
  } catch (e) {
    $statusIcon.html('<i class="fas fa-exclamation-triangle text-warning"></i>');
    $msgContainer.text("Erro de comunicação.").addClass("text-warning");
  }
};

// =========================================================
// 4A. RENDERIZAÇÃO DOS EDITORES (ACCORDIONS EXCLUSIVOS)
// =========================================================
window.renderAccordions = (selectedValues) => {
  const $container = $("#accordions_container");
  const info = diarioState.currentDateInfo;

  let vals = [];
  if (Array.isArray(selectedValues)) vals = selectedValues;
  else if (typeof selectedValues === "string" && selectedValues.trim() !== "") vals = selectedValues.split(",");

  if (vals.length === 0) {
    $container.html('<div class="text-center py-5 text-muted opacity-50" id="empty-accordion-msg"><span class="material-symbols-outlined fs-1">view_day</span><p class="mt-2 fw-medium">Nenhum encontro selecionado.</p></div>');
    return;
  }

  $(".diario-accordion-item").each(function () {
    let sessionData = $(this).data("session");
    if (sessionData !== undefined && sessionData !== null) {
      const val = sessionData.toString();
      if (!vals.includes(val)) {
        if ($(`#editor_${val}`).next(".note-editor").length) $(`#editor_${val}`).summernote("destroy");
        $(this).remove();
      }
    }
  });

  // GARANTE a remoção correta do Loader agora que a div tem o ID certo
  $("#empty-accordion-msg").remove();

  vals.forEach((val) => {
    if ($(`#accordion_item_${val}`).length === 0) {
      let isNew = val.startsWith("NEW");
      let sessData = null;
      let title = "";
      let template = "";

      if (isNew) {
        let num = val.split("_")[1];
        let opt = info.new_options.find((o) => o.sequence == num);
        title = opt ? opt.title : `Encontro ${num} (Novo)`;
        template = opt ? opt.content : "";
      } else {
        sessData = info.sessions.find((s) => s.session_id == val);
        title = sessData ? sessData.title : `Encontro (Salvo)`;
        template = sessData.description || "";
      }

      // CORREÇÃO: Design premium e margens Mobile ajustadas
      let html = `
            <div class="accordion-item diario-accordion-item border border-secondary border-opacity-10 shadow-sm rounded-4 mb-3 overflow-hidden bg-white" id="accordion_item_${val}" data-session="${val}">
                <h2 class="accordion-header d-flex align-items-center bg-secondary bg-opacity-10 pe-2" id="heading_${val}">
                    <button class="accordion-button bg-transparent fw-bold flex-grow-1 shadow-none py-2 px-3 py-md-3 px-md-4" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${val}" aria-expanded="true">
                        <i class="fas ${isNew ? "fa-plus-circle text-success" : "fa-check-circle text-primary"} me-2 fs-5"></i> 
                        <span style="font-size: 1.05rem;">${title}</span>
                    </button>
                    ${!isNew ? `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 border border-danger border-opacity-10 rounded-circle hover-scale shadow-none me-2 me-md-3 d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteSession(${val})" title="Excluir Encontro"><i class="fas fa-trash-can"></i></button>` : ""}
                </h2>
                <div id="collapse_${val}" class="accordion-collapse collapse show">
                    <div class="accordion-body p-2 p-md-4 bg-white border-top border-secondary border-opacity-10">
                        <textarea id="editor_${val}" class="w-100 form-control bg-white rounded-3 border-0"></textarea>
                    </div>
                </div>
            </div>`;
      $container.append(html);

      $(`#editor_${val}`).summernote(summernoteConfig);
      $(`#editor_${val}`).summernote("code", template);
    }
  });
};

// =========================================================
// 4B. RENDERIZAÇÃO DA FREQUÊNCIA GLOBAL (LADO DIREITO)
// =========================================================
const loadGlobalStudentsList = async (sessionDateStr, existingSessions = []) => {
  const container = $("#attendance_list_global");
  container.html('<div class="text-center py-5 opacity-50"><div class="spinner-border spinner-border-sm text-primary"></div><p class="mt-2">Carregando alunos...</p></div>');

  try {
    const res = await window.ajaxValidator({ validator: "getStudentsForDiary", token: defaultApp.userInfo.token, class_id: diarioState.classId, date: sessionDateStr });

    if (res.status) {
      const dataArray = Array.isArray(res.data) ? res.data : [];
      let existingAttendance = null;
      if (existingSessions && existingSessions.length > 0) {
        existingAttendance = existingSessions[0].attendance; // Frequência unificada
      }

      diarioState.globalAttendance = dataArray.map((std) => {
        let isPresent = true,
          justification = "",
          absenceType = "UNJUSTIFIED";
        if (existingAttendance && Array.isArray(existingAttendance)) {
          const match = existingAttendance.find((a) => a.student_id == std.student_id);
          if (match) {
            isPresent = match.is_present;
            justification = match.justification || "";
            absenceType = match.absence_type || "UNJUSTIFIED";
          }
        }
        return { ...std, is_present: isPresent, justification: justification, absence_type: absenceType };
      });

      renderGlobalStudentsList();
    } else {
      throw new Error(res.alert || "Erro ao buscar alunos.");
    }
  } catch (e) {
    container.html(`<div class="text-center py-3 text-danger"><i class="fas fa-wifi mb-2 fs-3"></i><p class="small fw-bold m-0 mt-2">Erro ao carregar lista</p></div>`);
  }
};

const renderGlobalStudentsList = () => {
  const container = $("#attendance_list_global");
  const students = diarioState.globalAttendance || [];

  if (students.length === 0) {
    container.html(`<div class="text-center py-4 opacity-50"><i class="fas fa-users-slash fs-1 mb-2"></i><p class="small fw-bold mt-2">Nenhum aluno ativo nesta data.</p></div>`);
    return;
  }

  const rows = students
    .map((std, idx) => {
      const studentName = std.full_name || std.student_name || std.name || "Aluno Registrado";
      const nameParts = studentName.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      const avatarHtml = std.profile_photo_url
        ? `<img src="${std.profile_photo_url}?v=${new Date().getTime()}" class="rounded-circle border border-secondary border-opacity-25 shadow-sm object-fit-cover" style="width: 42px; height: 42px; cursor: zoom-in;" onclick="zoomAvatar('${std.profile_photo_url}', '${studentName.replace(/'/g, "\\'")}')">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold shadow-sm" style="width: 42px; height: 42px; font-size: 0.9rem;">${initials}</div>`;

      const isP = std.is_present;
      const statusBadge = isP
        ? `<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1" id="badge_global_${idx}">Presente</span>`
        : `<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1" id="badge_global_${idx}">Faltou</span>`;

      return `
    <div class="p-3 mb-2 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-sm w-100 mx-auto" style="width: calc(100% - 16px) !important;">
        <div class="d-flex w-100 align-items-center">
            <div class="me-3 flex-shrink-0">${avatarHtml}</div>
            <div class="flex-grow-1 text-truncate">
                <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 0.9rem;">${studentName}</h6>
                <div class="mt-1" style="font-size: 0.75rem;">${statusBadge}</div>
            </div>
            <div class="ms-2 flex-shrink-0">
                <div class="form-check form-switch m-0 p-0">
                    <input class="form-check-input m-0 shadow-none border-secondary" type="checkbox" ${isP ? "checked" : ""} onchange="window.updateGlobalAttendance(${idx}, this.checked)" style="width: 44px; height: 24px; cursor: pointer;">
                </div>
            </div>
        </div>
        <div id="just_box_global_${idx}" class="mt-3 w-100 ${isP ? "d-none" : ""}">
            <div class="bg-danger bg-opacity-10 p-2 rounded-3 w-100 border border-danger border-opacity-10">
                <select class="form-select form-select-sm border-0 shadow-none mb-2 fw-medium text-body" onchange="window.updateGlobalAbsenceType(${idx}, this.value)">
                    <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>S/ Justificativa</option>
                    <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Falta Justificada</option>
                </select>
                <input type="text" class="form-control form-control-sm border-0 shadow-none fw-medium text-body" value="${std.justification || ""}" onchange="window.updateGlobalJustification(${idx}, this.value)" placeholder="Descreva o motivo...">
            </div>
        </div>
    </div>`;
    })
    .join("");

  container.html(`<div class="d-flex flex-column pt-3">${rows}</div>`);
};

window.updateGlobalAttendance = (idx, isPresent) => {
  diarioState.globalAttendance[idx].is_present = isPresent;
  if (isPresent) {
    $(`#badge_global_${idx}`).removeClass("bg-danger-subtle text-danger border-danger").addClass("bg-success-subtle text-success border-success").text("Presente");
    $(`#just_box_global_${idx}`).addClass("d-none");
  } else {
    $(`#badge_global_${idx}`).removeClass("bg-success-subtle text-success border-success").addClass("bg-danger-subtle text-danger border-danger").text("Faltou");
    $(`#just_box_global_${idx}`).removeClass("d-none");
  }
};

window.updateGlobalJustification = (idx, val) => {
  diarioState.globalAttendance[idx].justification = val;
};

window.updateGlobalAbsenceType = (idx, val) => {
  diarioState.globalAttendance[idx].absence_type = val;
};

// =========================================================
// 5. SALVAMENTO E DELEÇÃO MÚLTIPLA
// =========================================================
window.salvarDiario = async (btn) => {
  const date = $("#diario_date").val();
  const $select = $("#diario_session_select");

  let selectedSessions = [];
  if ($select[0].selectize) {
    let rawVal = $select[0].selectize.getValue();
    if (Array.isArray(rawVal)) selectedSessions = rawVal;
    else if (typeof rawVal === "string" && rawVal.trim() !== "") selectedSessions = rawVal.split(",");
  }

  if (!date || selectedSessions.length === 0) return window.alertDefault("Selecione a data e pelo menos um encontro.", "warning");

  const students = diarioState.globalAttendance || [];
  if (students.length === 0) {
    return window.alertDefault("Atenção: Você não pode registrar encontros para uma turma sem alunos.", "error");
  }

  btn = $(btn);
  window.setButton(true, btn, " Salvando...");

  try {
    const promises = selectedSessions.map((val) => {
      const content = $(`#editor_${val}`).summernote("code");
      const isNew = val.startsWith("NEW");

      return window.ajaxValidator({
        validator: "saveClassDiary",
        token: defaultApp.userInfo.token,
        class_id: diarioState.classId,
        phase_id: diarioState.phaseId,
        session_id: isNew ? null : val,
        date: date,
        content: content,
        attendance_json: JSON.stringify(diarioState.globalAttendance),
      });
    });

    const results = await Promise.all(promises);
    const hasError = results.find((r) => !r.status);

    if (!hasError) {
      window.alertDefault("Diário(s) atualizado(s) com sucesso!", "success");
      $("#modalSession").modal("hide");
      getHistory();
    } else {
      throw new Error(hasError.alert || "Falha ao salvar um ou mais encontros do lote.");
    }
  } catch (e) {
    window.alertErrorWithSupport(`Salvar Diários`, e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteSession = (sessionId) => {
  Swal.fire({ title: "Excluir Encontro?", text: "O registro será movido para a lixeira.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sim, excluir" }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await window.ajaxValidator({ validator: "deleteClassDiary", token: window.defaultApp.userInfo.token, session_id: sessionId });
        if (res.status) {
          window.alertDefault("Encontro removido.", "success");
          const $select = $("#diario_session_select")[0].selectize;
          if ($select) {
            $select.removeItem(sessionId.toString());
            $select.removeOption(sessionId.toString());
          }
          getHistory();
        } else throw new Error(res.alert);
      } catch (e) {
        window.alertErrorWithSupport(`Excluir Diário`, e.message);
      }
    }
  });
};

window.changePage = (p) => {
  defaultDiary.currentPage = p;
  getHistory();
};

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();

  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];

  let html = `<div class="d-flex align-items-center justify-content-center gap-2">`;
  html += `<button onclick="${funcName}(${current - 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === 1 ? "disabled" : ""} title="Anterior"><i class="fas fa-chevron-left" style="font-size: 0.85rem;"></i></button>`;

  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) {
    if (p === current) {
      html += `<button class="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold" style="width: 36px; height: 36px; padding: 0;" disabled>${p}</button>`;
    } else {
      html += `<button onclick="${funcName}(${p})" class="btn btn-sm text-secondary bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none fw-bold" style="width: 36px; height: 36px; padding: 0;">${p}</button>`;
    }
  }

  html += `<button onclick="${funcName}(${current + 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === total ? "disabled" : ""} title="Próxima"><i class="fas fa-chevron-right" style="font-size: 0.85rem;"></i></button>`;
  html += `</div>`;
  container.html(html);
};
