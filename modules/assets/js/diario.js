const defaultDiary = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

const diarioState = {
  classId: null,
  subjectId: null,
  schedules: [],
  sessionId: null,
  currentStudents: [],
};

let fpInstance = null;

// =========================================================
// 1. CONFIGURAÇÃO RESPONSIVA DO EDITOR (SUMMERNOTE)
// =========================================================
const summernoteConfig = {
  lang: "pt-BR",
  placeholder: "Descreva o roteiro, atividades ou observações do encontro...",
  dialogsInBody: true,
  disableResizeEditor: true,
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
// 2. MOTORES DE FILTRO (Turmas e Disciplinas)
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
          loadSubjects(value);
          if ($("#sel_filter_subject")[0].selectize) $("#sel_filter_subject")[0].selectize.enable();
        } else {
          diarioState.classId = null;
          resetInterface();
        }
      },
    });
  }

  if ($("#sel_filter_subject").length && !$("#sel_filter_subject")[0].selectize) {
    $("#sel_filter_subject").selectize({
      valueField: "subject_id",
      labelField: "subject_name",
      searchField: "subject_name",
      placeholder: "Selecione a Disciplina...",
      onChange: function (value) {
        if (value) {
          diarioState.subjectId = value;
          defaultDiary.currentPage = 1;
          getHistory();
          $("#btn_new_session").prop("disabled", false);
        } else {
          diarioState.subjectId = null;
          $("#btn_new_session").prop("disabled", true);
          $(".list-table-diario").empty();
        }
      },
    });
  }
};

const loadSubjects = async (classId) => {
  const selSub = $("#sel_filter_subject")[0].selectize;
  selSub.clear();
  selSub.clearOptions();
  selSub.disable();

  try {
    const res = await window.ajaxValidator({ validator: "getClassSubjects", token: defaultApp.userInfo.token, class_id: classId });
    if (res.status && res.data.length > 0) {
      selSub.enable();
      res.data.forEach((item) => selSub.addOption(item));
      if (res.data.length === 1) selSub.setValue(res.data[0].subject_id);
    } else {
      throw new Error(res.alert || "Erro ao obter disciplinas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar disciplinas da turma.";
    window.alertErrorWithSupport(`Carregar Disciplinas da Turma`, errorMessage);
  }
};

const resetInterface = () => {
  const selSub = $("#sel_filter_subject")[0].selectize;
  if (selSub) {
    selSub.clear();
    selSub.disable();
  }
  $("#btn_new_session").prop("disabled", true);
  $(".pagination-diario").empty();
  $(".list-table-diario").html(`
    <div class="text-center py-5 text-muted opacity-50">
        <i class="fas fa-arrow-up mb-3 d-block" style="font-size: 2.5rem;"></i>
        <h6 class="fw-bold text-body">Selecione Turma e Disciplina</h6>
        <p class="small text-secondary">Utilize os filtros acima para visualizar ou lançar o diário.</p>
    </div>
  `);
};

// =========================================================
// 3. CARREGAMENTO E RENDERIZAÇÃO DO HISTÓRICO
// =========================================================

window.getHistory = async () => {
  const page = Math.max(0, defaultDiary.currentPage - 1);
  const container = $(".list-table-diario");

  container.html(`
    <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 fw-medium text-body">Sincronizando histórico de aulas...</p>
    </div>
  `);

  try {
    const res = await window.ajaxValidator({
      validator: "getClassHistory",
      token: window.defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      page: page * defaultDiary.rowsPerPage,
      limit: defaultDiary.rowsPerPage,
    });

    if (res.status) {
      const dataArray = res.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultDiary.totalPages = Math.max(1, Math.ceil(total / defaultDiary.rowsPerPage));
        renderTableHistory(dataArray);
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">history_edu</span>
                <p class="mt-3 fw-medium text-body">Nenhuma aula registrada para esta disciplina.</p>
            </div>
        `);
        $(".pagination-diario").empty();
      }
    } else {
      throw new Error(res.alert || res.msg || "O servidor não conseguiu recuperar o histórico do diário.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar o diário.";
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
    window.alertErrorWithSupport(`Listar Histórico do Diário`, errorMessage);
  }
};

const renderTableHistory = (data) => {
  const container = $(".list-table-diario");

  if (data.length === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined fs-1">event_busy</span>
            <p class="mt-2">Nenhuma aula registrada.</p>
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

  const canHistory = allowedSlugs.includes("diario.history");
  const canEdit = allowedSlugs.includes("diario.edit");
  const canDelete = allowedSlugs.includes("diario.delete");

  // --- VISÃO DESKTOP ---
  const desktopRows = data
    .map((item) => {
      const dateFmt = item.session_date.split(" ")[0].split("-").reverse().join("/");
      const rawIsoDate = item.session_date.split(" ")[0];
      const cleanDesc = item.description ? item.description.replace(/<[^>]*>?/gm, "") : "";
      const summary = cleanDesc.length > 35 ? cleanDesc.substring(0, 35) + "..." : cleanDesc;

      const total = parseInt(item.total_students) || 0;
      const present = parseInt(item.present_count) || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      const progColor = pct < 70 ? "bg-danger" : pct < 90 ? "bg-warning" : "bg-success";

      // Ações condicionais Desktop
      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('education.class_sessions', ${item.session_id}, this)" title="Histórico"><i class="fas fa-history"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick="openSessionModal(${item.session_id}, '${rawIsoDate}', this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteSession(${item.session_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      return `
      <tr>
        <td class="align-middle ps-3" style="width: 60px;">
          <div class="icon-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm">
            <span class="material-symbols-outlined" style="font-size: 20px;">event_note</span>
          </div>
        </td>
        <td class="align-middle">
          <div class="fw-bold text-body" style="font-size: 0.95rem;">${dateFmt}</div>
          <div class="small text-secondary">${summary || "Sem conteúdo preenchido"}</div>
        </td>
        <td class="align-middle text-center" style="width: 220px;">
          <div class="d-flex flex-column align-items-center w-100 px-3">
            <small class="fw-bold text-muted mb-2 d-flex justify-content-between w-100">
                <span>${present}/${total}</span>
                <span>${pct}%</span>
            </small>
            <div class="progress w-100 bg-secondary bg-opacity-10 shadow-inner" style="height: 8px;">
              <div class="progress-bar ${progColor} rounded-pill" role="progressbar" style="width: ${pct}%"></div>
            </div>
          </div>
        </td>
        <td class="text-end align-middle pe-3 text-nowrap" style="width: 140px;">
          ${actionsHtml || '<span class="text-muted small opacity-50"><i class="fas fa-ban"></i></span>'}
        </td>
      </tr>`;
    })
    .join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive">
      <table class="table-custom">
          <thead>
              <tr>
                  <th colspan="2" class="ps-3">Encontro / Conteúdo</th>
                  <th class="text-center">Quadro de Frequência</th>
                  <th class="text-end pe-4">Ações</th>
              </tr>
          </thead>
          <tbody>${desktopRows}</tbody>
      </table>
    </div>`;

  // --- VISÃO MOBILE (Padrão Original Restaurado + Frequência Top Right) ---
  const mobileRows = data
    .map((item) => {
      const dateParts = item.session_date.split(" ")[0].split("-");
      const day = dateParts[2];
      const rawIsoDate = item.session_date.split(" ")[0];

      const cleanDesc = item.description ? item.description.replace(/<[^>]*>?/gm, "") : "";
      const summary = cleanDesc.length > 25 ? cleanDesc.substring(0, 25) + "..." : cleanDesc;

      const total = parseInt(item.total_students) || 0;
      const present = parseInt(item.present_count) || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      const badgeStyle = pct < 70 ? "bg-danger text-white" : pct < 90 ? "bg-warning text-dark" : "bg-success text-white";

      // Ações condicionais Mobile
      let mobActionsHtml = "";
      if (canHistory) mobActionsHtml += `<button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('education.class_sessions', ${item.session_id}, this)" title="Histórico"><i class="fas fa-history"></i></button>`;
      if (canEdit) mobActionsHtml += `<button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="openSessionModal(${item.session_id}, '${rawIsoDate}', this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) mobActionsHtml += `<button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteSession(${item.session_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      let mobileFooter = "";
      if (mobActionsHtml !== "") {
        mobileFooter = `
          <div class="d-flex justify-content-end align-items-center mt-2 pt-2 border-0 w-100">
              <div class="d-flex gap-2">
                  ${mobActionsHtml}
              </div>
          </div>`;
      }

      return `
      <div class="ios-list-item flex-column align-items-stretch position-relative" style="padding: 12px 16px;">
          <div class="position-absolute" style="top: 12px; right: 16px;">
              <span class="badge ${badgeStyle} rounded-pill shadow-sm" style="font-size: 0.7rem; letter-spacing: 0.5px;">${pct}%</span>
          </div>

          <div class="d-flex w-100 align-items-center">
              <div class="me-3 flex-shrink-0">
                  <div class="event-date-box d-flex flex-column text-center border border-secondary border-opacity-25 shadow-sm overflow-hidden" style="width: 48px; height: 52px; border-radius: 8px;">
                      <div class="text-uppercase fw-bold bg-primary text-white w-100 d-flex align-items-center justify-content-center" style="font-size: 0.5rem; height: 16px; letter-spacing: 0.5px;">
                          AULA
                      </div>
                      <div class="d-flex align-items-center justify-content-center flex-grow-1">
                          <span class="fs-5 fw-bold text-body lh-1">${day}</span>
                      </div>
                  </div>
              </div>
              
              <div class="flex-grow-1 pe-4" style="min-width: 0;">
                  <h6 class="fw-bold text-body m-0 text-truncate w-100" style="font-size: 0.95rem;">${summary || "Sem descrição..."}</h6>
                  <div class="small text-secondary mt-1 d-flex align-items-center">
                      <i class="fas fa-user-check opacity-50 me-1"></i> ${present} de ${total} presentes
                  </div>
              </div>
          </div>

          ${mobileFooter}
      </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-diario", "currentPage", "totalPages", "changePage", defaultDiary);
};

// =========================================================
// 4. LÓGICA DO MODAL (Calendário e Integração)
// =========================================================
window.openSessionModal = async (sessionId = null, dateStr = null, btn) => {
  diarioState.sessionId = sessionId;

  if (btn) {
    btn = $(btn);
    window.setButton(true, btn, "");
  }

  const $dateInput = $("#diario_date");
  const $editor = $("#diario_content");

  $dateInput.val("").prop("disabled", true);
  $("#date-status-icon").empty();
  $("#date-msg").text("");
  $("#lista-alunos").html('<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 fw-medium text-body">Carregando lista de chamada...</p></div>');

  if (typeof fpInstance !== "undefined" && fpInstance) {
    fpInstance.destroy();
    fpInstance = null;
  }

  if ($editor.next(".note-editor").length > 0) {
    try {
      $editor.summernote("destroy");
    } catch (e) {}
  }
  $editor.val("").hide();

  $("#modalSession").modal("show");

  try {
    const resMeta = await window.ajaxValidator({
      validator: "getDiarioMetadata",
      token: window.defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
    });

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

      $dateInput.prop("disabled", false).removeAttr("disabled");

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
          if (instance.altInput) {
            instance.altInput.disabled = false;
            instance.altInput.style.backgroundColor = "";
          }
        },
      });

      if (dateStr) {
        const cleanDate = dateStr.includes(" ") ? dateStr.split(" ")[0] : dateStr;
        fpInstance.setDate(cleanDate, true);
      }
    } else {
      throw new Error(resMeta.alert || "Não foi possível carregar as regras de datas do diário.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de conexão ao carregar metadados do diário.";
    $("#lista-alunos").html(`<div class='text-center py-5 text-danger'><i class='fas fa-exclamation-circle fs-2 mb-2'></i><p>${errorMessage}</p></div>`);
    window.alertErrorWithSupport(`Abrir Modal de Diário`, errorMessage);
  } finally {
    if (btn) window.setButton(false, btn);
  }

  if ($editor.length && typeof $.fn.summernote !== "undefined") {
    $editor.summernote(window.summernoteConfig || {});
  }
};

window.checkDateLogic = async (dateStr) => {
  if (!dateStr) return;

  const $statusIcon = $("#date-status-icon");
  const $msgContainer = $("#date-msg");

  $statusIcon.html('<div class="spinner-border spinner-border-sm text-primary" role="status"></div>');
  $msgContainer.text("Validando plano de aula...").removeClass("text-warning text-danger text-success text-primary");

  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  if (diarioState.schedules.length > 0) {
    const isScheduledDay = diarioState.schedules.some((s) => parseInt(s.day_of_week) === dayOfWeek);
    if (!isScheduledDay) {
      $msgContainer.text("Atenção: Aula extra (Fora do dia padrão).").addClass("text-warning");
    }
  }

  try {
    const res = await window.ajaxValidator({
      validator: "checkDateContent",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      date: dateStr,
    });

    if (res.status) {
      const info = res.data;

      if (info.status === "BLOCKED") {
        $statusIcon.html('<i class="fas fa-ban text-danger"></i>');
        $msgContainer.text(`Bloqueado: ${info.reason}`).removeClass("text-warning").addClass("text-danger");
        $("#diario_content").summernote("disable");
        $("#lista-alunos").html('<div class="text-center py-5 opacity-50"><span class="material-symbols-outlined fs-1">block</span><p class="mt-2 text-body fw-bold">Data bloqueada para chamadas.</p></div>');
      } else if (info.status === "EXISTING") {
        diarioState.sessionId = info.session_id;
        $statusIcon.html('<i class="fas fa-edit text-primary"></i>');
        $msgContainer.text("Editando diário existente.").removeClass("text-warning").addClass("text-primary");

        $("#diario_content").summernote("enable");
        $("#diario_content").summernote("code", info.content);
        loadStudentsList(info.attendance);
      } else if (info.status === "NEW") {
        diarioState.sessionId = null;
        $statusIcon.html('<i class="fas fa-check-circle text-success"></i>');
        $msgContainer.text(`Novo Diário (Aula #${info.sequence})`).removeClass("text-warning").addClass("text-success");

        $("#diario_content").summernote("enable");
        if (info.template) {
          $("#diario_content").summernote("code", info.template);
          window.alertDefault("Plano de aula carregado com sucesso!", "info");
        } else {
          $("#diario_content").summernote("code", "");
        }
        loadStudentsList(null);
      }
    } else {
      throw new Error(res.alert || "Não foi possível validar as regras desta data.");
    }
  } catch (e) {
    $statusIcon.html('<i class="fas fa-exclamation-triangle text-warning fs-5"></i>');
    $msgContainer.text("Erro de comunicação.").addClass("text-warning");
    const errorMessage = e.message || "Falha na comunicação com o servidor.";
    window.alertErrorWithSupport(`Validar Data do Diário`, errorMessage);
  }
};

// =========================================================
// 5. LISTA DE ALUNOS (EXCELÊNCIA DESKTOP & MOBILE)
// =========================================================
const loadStudentsList = async (existingAttendance = null) => {
  const container = $("#lista-alunos");
  try {
    const res = await window.ajaxValidator({
      validator: "getStudentsForDiary",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
    });

    if (res.status) {
      diarioState.currentStudents = res.data.map((std) => {
        let isPresent = true;
        let justification = "";
        let absenceType = "UNJUSTIFIED";

        if (existingAttendance) {
          const match = existingAttendance.find((a) => a.student_id == std.student_id);
          if (match) {
            isPresent = match.is_present;
            justification = match.justification || "";
            absenceType = match.absence_type || "UNJUSTIFIED";
          }
        }
        return { ...std, is_present: isPresent, justification: justification, absence_type: absenceType };
      });

      renderStudents();
    } else {
      throw new Error(res.alert || "Não foi possível carregar a lista de alunos da turma.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha ao carregar lista de presença.";
    container.html(`
        <div class="text-center py-5">
            <i class="fas fa-users-slash fs-1 text-danger opacity-50 mb-3"></i>
            <h6 class="text-body fw-bold">Falha de conexão</h6>
            <button class="btn btn-sm btn-outline-primary rounded-pill px-4 mt-2" onclick="loadStudentsList(${existingAttendance ? JSON.stringify(existingAttendance) : "null"})">
                <i class="fas fa-sync-alt me-2"></i> Tentar novamente
            </button>
        </div>
    `);
    window.alertErrorWithSupport(`Carregar Lista de Chamada`, errorMessage);
  }
};

const renderStudents = () => {
  const container = $("#lista-alunos");
  const students = diarioState.currentStudents;

  if (students.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1">group_off</span>
            <p class="mt-2 fw-medium text-body">Nenhum aluno matriculado na turma.</p>
        </div>`);
    return;
  }

  // --- VISÃO DESKTOP (Ajustada para remover o esmagamento) ---
  const desktopRows = students
    .map((std, idx) => {
      const nameParts = std.full_name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      const avatarHtml = std.profile_photo_url
        ? `<img src="${std.profile_photo_url}?v=${new Date().getTime()}"
                class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                style="width:42px; height:42px; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${std.profile_photo_url}', '${nameParts[0].replace(/'/g, "\\'")}')"
                onmouseover="this.style.transform='scale(1.15)'" 
                onmouseout="this.style.transform='scale(1)'"
                title="Ver foto">`
        : `<div class="rounded-circle bg-secondary bg-opacity-10 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-center text-secondary fw-bold fs-6" style="width:42px; height:42px;">${initials}</div>`;

      const isP = std.is_present;
      const statusBadge = isP
        ? `<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 status-label-${idx}">Presente</span>`
        : `<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1 status-label-${idx}">Faltou</span>`;

      return `
      <tr>
          <td class="align-middle ps-3 text-center" style="width: 65px;">${avatarHtml}</td>
          <td class="align-middle fw-bold text-body" style="font-size: 0.95rem;">${std.full_name}</td>
          <td class="align-middle text-center" style="width: 150px;">
              <div class="d-flex align-items-center justify-content-center gap-3">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                      <input class="form-check-input shadow-none m-0" type="checkbox" ${isP ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)" style="width: 44px; height: 24px; cursor: pointer;">
                  </div>
                  <div class="status-container-${idx}" style="min-width: 70px;">${statusBadge}</div>
              </div>
          </td>
          <td class="align-middle pe-3">
              <div id="just-area-${idx}" class="d-flex gap-2 ${isP ? "d-none" : ""}">
                  <select class="form-control shadow-none border-secondary border-opacity-25 text-body" style="width: 150px; height: 42px;" onchange="updateAbsenceType(${idx}, this.value)">
                      <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>S/ Justificativa</option>
                      <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Falta Justificada</option>
                      <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Falta Recorrente</option>
                  </select>
                  <input type="text" class="form-control shadow-none border-secondary border-opacity-25 flex-grow-1 text-body" style="height: 42px; min-width: 150px;" value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Detalhes (opcional)...">
              </div>
              <span id="just-empty-${idx}" class="text-secondary small opacity-50 fw-medium ${isP ? "" : "d-none"}"><i class="fas fa-check-circle me-1 text-success"></i> Aluno em sala</span>
          </td>
      </tr>`;
    })
    .join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-4 text-secondary text-uppercase small opacity-75">Catequizando</th>
                    <th class="text-center text-secondary text-uppercase small opacity-75">Status / Chamada</th>
                    <th class="text-secondary text-uppercase small opacity-75">Motivo da Ausência</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // --- VISÃO MOBILE (Versão Aprovada Restaurada Intacta) ---
  const mobileRows = students
    .map((std, idx) => {
      const nameParts = std.full_name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      const avatarHtml = std.profile_photo_url
        ? `<img src="${std.profile_photo_url}?v=${new Date().getTime()}"
              class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
              style="width:42px; height:42px; object-fit:cover; cursor: pointer;"
              onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${std.profile_photo_url}', '${nameParts[0].replace(/'/g, "\\'")}')">`
        : `<div class="rounded-circle bg-secondary bg-opacity-10 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-center text-secondary fw-bold fs-5" style="width:42px; height:42px;">${initials}</div>`;

      const isP = std.is_present;
      const statusBadge = isP ? `<span class="text-success fw-bold status-label-${idx}">Presente</span>` : `<span class="text-danger fw-bold status-label-${idx}">Faltou</span>`;

      return `
    <div class="ios-list-item flex-column align-items-stretch" style="padding: 12px 16px;">
        <div class="d-flex w-100 align-items-center">
            <div class="me-3 flex-shrink-0">${avatarHtml}</div>
            
            <div class="flex-grow-1" style="min-width: 0;">
                <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 0.95rem;">${std.full_name}</h6>
                <div class="status-container-${idx} mt-1 small" style="font-size: 0.75rem;">${statusBadge}</div>
            </div>
            
            <div class="ms-2 flex-shrink-0">
                <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                    <input class="form-check-input m-0 shadow-none" type="checkbox" ${isP ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)" style="cursor: pointer; width: 48px; height: 26px;">
                </div>
            </div>
        </div>
        
        <div id="just-box-mob-${idx}" class="mt-3 w-100 ${isP ? "d-none" : ""}">
            <div class="bg-danger bg-opacity-10 p-3 rounded-4 border border-danger border-opacity-10 shadow-inner">
                <label class="form-label small fw-bold text-danger text-uppercase mb-2" style="font-size: 0.7rem; letter-spacing: 0.5px;">Motivo da Ausência</label>
                <select class="form-control shadow-none border-0 mb-2 text-body" onchange="updateAbsenceType(${idx}, this.value)" style="height: 44px; border-radius: 10px;">
                    <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>Não Justificada</option>
                    <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Falta Justificada</option>
                    <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Falta Recorrente</option>
                </select>
                <input type="text" class="form-control shadow-none border-0 text-body" value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Descreva o motivo (opcional)..." style="height: 44px; border-radius: 10px;">
            </div>
        </div>
    </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
};

// =========================================================
// 6. GERENCIAMENTO DE ESTADO E SALVAMENTO
// =========================================================
window.updateAttendance = (idx, isPresent) => {
  diarioState.currentStudents[idx].is_present = isPresent;

  const desktopBadge = isPresent
    ? `<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2 py-1 status-label-${idx}">Presente</span>`
    : `<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2 py-1 status-label-${idx}">Faltou</span>`;

  const mobileBadge = isPresent ? `<span class="text-success fw-bold status-label-${idx}">Presente</span>` : `<span class="text-danger fw-bold status-label-${idx}">Faltou</span>`;

  if ($(window).width() >= 768) {
    $(`.status-container-${idx}`).html(desktopBadge);
  } else {
    $(`.status-container-${idx}`).html(mobileBadge);
  }

  if (isPresent) {
    $(`#just-area-${idx}, #just-box-mob-${idx}`).addClass("d-none");
    $(`#just-empty-${idx}`).removeClass("d-none");
  } else {
    $(`#just-area-${idx}, #just-box-mob-${idx}`).removeClass("d-none");
    $(`#just-empty-${idx}`).addClass("d-none");
  }
};

window.updateJustification = (idx, val) => {
  diarioState.currentStudents[idx].justification = val;
};

window.updateAbsenceType = (idx, val) => {
  diarioState.currentStudents[idx].absence_type = val;
};

window.salvarDiario = async (btn) => {
  const date = $("#diario_date").val();
  const content = $("#diario_content").summernote("code");
  btn = $(btn);

  if (!date) return window.alertDefault("Selecione a data da aula.", "warning");
  if ($("#date-msg").hasClass("text-danger")) return window.alertDefault("Data bloqueada para registro.", "error");

  window.setButton(true, btn, " Salvando...");

  try {
    const res = await window.ajaxValidator({
      validator: "saveClassDiary",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      session_id: diarioState.sessionId,
      date: date,
      content: content,
      attendance_json: JSON.stringify(diarioState.currentStudents),
    });

    if (res.status) {
      window.alertDefault("Diário salvo com sucesso!", "success");
      $("#modalSession").modal("hide");
      getHistory();
    } else {
      throw new Error(res.alert || res.msg || "O servidor recusou o salvamento do diário.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar o diário.";
    window.alertErrorWithSupport(`Salvar Diário`, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteSession = (sessionId) => {
  Swal.fire({
    title: "Excluir Diário?",
    text: "O registro de conteúdo e frequência será apagado.",
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
          validator: "deleteClassDiary",
          token: window.defaultApp.userInfo.token,
          session_id: sessionId,
        });

        if (res.status) {
          window.alertDefault("Registro de aula removido.", "success");
          if (typeof getHistory === "function") window.getHistory();
        } else {
          throw new Error(res.alert || res.msg || "O servidor não permitiu excluir este registro.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar excluir o diário.";
        window.alertErrorWithSupport(`Excluir Diário/Sessão`, errorMessage);
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

  // Container centralizado com gap para os botões e responsividade tátil
  let html = `<div class="d-flex align-items-center justify-content-center gap-2">`;

  // Botão Anterior (Chevron Left)
  html += `<button onclick="${funcName}(${current - 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === 1 ? "disabled" : ""} title="Anterior">
              <i class="fas fa-chevron-left" style="font-size: 0.85rem;"></i>
           </button>`;

  // Miolo Numérico Inteligente (Mostra apenas a página Atual, -1 e +1)
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 1); p++) {
    if (p === current) {
      // Página Atual (Sólida e Inativa para clique)
      html += `<button class="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm fw-bold" style="width: 36px; height: 36px; padding: 0;" disabled>${p}</button>`;
    } else {
      // Páginas Vizinhas (Translúcidas e Clicáveis)
      html += `<button onclick="${funcName}(${p})" class="btn btn-sm text-secondary bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none fw-bold" style="width: 36px; height: 36px; padding: 0;">${p}</button>`;
    }
  }

  // Botão Próxima (Chevron Right)
  html += `<button onclick="${funcName}(${current + 1})" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" ${current === total ? "disabled" : ""} title="Próxima">
              <i class="fas fa-chevron-right" style="font-size: 0.85rem;"></i>
           </button>`;

  html += `</div>`;
  container.html(html);
};
