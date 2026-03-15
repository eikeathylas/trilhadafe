// =========================================================
// GESTÃO DE DIÁRIO DE CLASSE (SMART LOGIC V7 - DATE ONLY)
// =========================================================

const defaultDiary = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado Local
const diarioState = {
  classId: null,
  subjectId: null,
  schedules: [], // Regras de horário
  sessionId: null,
  currentStudents: [],
};

let fpInstance = null; // Instância Global do Flatpickr

// Configuração Summernote
const summernoteConfig = {
  height: 350,
  lang: "pt-BR",
  placeholder: "Descreva o conteúdo do encontro...",
  dialogsInBody: true,
  toolbar: [
    ["style", ["style", "bold", "italic", "underline", "clear"]],
    ["para", ["ul", "ol", "paragraph"]],
    ["insert", ["link", "picture"]],
    ["view", ["fullscreen", "codeview"]],
  ],
  callbacks: {
    // Ajustes se necessário
  },
};

$(document).ready(() => {
  // Escuta mudança de ano no menu global para resetar filtros
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
// 1. FILTROS E SELETORES (CASCATA)
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
          return `<div class="py-1 px-2"><div class="fw-bold">${escape(item.class_name)}</div><div class="small text-muted">${escape(item.course_name)}</div></div>`;
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
      throw new Error(result.alert || "Erro ao obter disciplinas.");
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
  $(".list-table-diario").html('<div class="text-center py-5 text-muted opacity-50"><i class="fas fa-arrow-up mb-2 d-block" style="font-size: 2rem;"></i>Selecione Turma e Disciplina acima.</div>');
  $(".pagination-diario").empty();
};

const getHistory = async () => {
  const page = Math.max(0, defaultDiary.currentPage - 1);
  const container = $(".list-table-diario");

  // 1. Feedback Visual de Carregamento (Soft UI)
  container.html(`
    <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
        <p class="mt-3 fw-medium">Carregando histórico de aulas...</p>
    </div>
  `);

  try {
    // 2. Chamada à API com prefixos padronizados
    const res = await window.ajaxValidator({
      validator: "getClassHistory",
      token: window.defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      page: page * defaultDiary.rowsPerPage,
      limit: defaultDiary.rowsPerPage,
    });

    // 3. Tratamento do Resultado
    if (res.status) {
      const dataArray = res.data || [];

      if (dataArray.length > 0) {
        // Sucesso: Renderiza tabela e paginação
        const total = dataArray[0]?.total_registros || 0;
        defaultDiary.totalPages = Math.max(1, Math.ceil(total / defaultDiary.rowsPerPage));
        renderTableHistory(dataArray);
      } else {
        // Estado Vazio: Sem aulas para este filtro (Não é um erro)
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">history_edu</span>
                <p class="mt-3 fw-medium text-body">Nenhuma aula registrada para esta disciplina.</p>
            </div>
        `);
        $(".pagination-diario").empty();
      }
    } else {
      // REGRA APLICADA: Lança o erro para o Catch tratar
      throw new Error(res.alert || res.msg || "O servidor não conseguiu recuperar o histórico do diário.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar o diário.";

    // 4. Feedback Visual de Erro Integrado
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
    container.html(`<div class="text-center py-5 text-muted opacity-50"><i class="fas fa-book-open fa-3x mb-3"></i><p>Nenhuma aula registrada.</p></div>`);
    return;
  }

  // =========================================================
  // DESKTOP (Tabela Completa)
  // =========================================================
  let desktopRows = data
    .map((item) => {
      // (Lógica existente mantida para Desktop)
      let dateFmt = item.session_date.split(" ")[0].split("-").reverse().join("/");
      const rawIsoDate = item.session_date.split(" ")[0];
      const cleanDesc = item.description ? item.description.replace(/<[^>]*>?/gm, "") : "";
      const summary = cleanDesc.length > 30 ? cleanDesc.substring(0, 30) + "..." : cleanDesc;
      const total = parseInt(item.total_students);
      const present = parseInt(item.present_count);
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      let progColor = pct < 70 ? "bg-danger" : pct < 90 ? "bg-warning" : "bg-success";

      return `
        <tr>
          <td class="align-middle ps-3" width="60">
            <div class="icon-circle bg-primary bg-opacity-10 text-primary">
              <span class="material-symbols-outlined">event_note</span>
            </div>
          </td>
          <td class="align-middle">
            <div class="fw-bold">${dateFmt}</div>
            <div class="small text-muted">${summary || "Sem descrição"}</div>
          </td>
          <td class="align-middle text-center" width="180">
            <div class="d-flex flex-column align-items-center">
              <small class="fw-bold text-muted mb-1">${present}/${total} Presentes (${pct}%)</small>
              <div class="progress w-100" style="height: 6px; background-color: rgba(0,0,0,0.1);">
                <div class="progress-bar ${progColor}" role="progressbar" style="width: ${pct}%"></div>
              </div>
            </div>
          </td>
          <td class="text-end align-middle pe-3">
            <button class="btn-icon-action text-warning" onclick="openAudit('education.class_sessions', ${item.session_id})" title="Log"><i class="fas fa-bolt"></i></button>
            <button class="btn-icon-action text-primary" onclick="openSessionModal(${item.session_id}, '${rawIsoDate}')" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn-icon-action text-danger" onclick="deleteSession(${item.session_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
    })
    .join("");

  const desktopHtml = `<div class="d-none d-md-block table-responsive">
                        <table class="table-custom">
                            <thead><tr><th colspan="2" class="ps-3">Data / Conteúdo</th><th class="text-center">Frequência</th><th class="text-end pe-4">Ações</th></tr></thead>
                            <tbody>${desktopRows}</tbody>
                        </table>
                       </div>`;

  // =========================================================
  // MOBILE (Cards Compactos)
  // =========================================================
  let mobileRows = data
    .map((item) => {
      // Formatação da data para DD/MM/AAAA
      let dateFmt = item.session_date.split(" ")[0].split("-").reverse().join("/");
      const rawIsoDate = item.session_date.split(" ")[0];

      // Cálculos matemáticos puros
      const total = parseInt(item.total_students) || 0;
      const present = parseInt(item.present_count) || 0;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;

      // Define a cor da badge dinamicamente, blindada contra total = 0
      let badgeStyle = "bg-secondary bg-opacity-10 text-secondary border-secondary border-opacity-25"; // Padrão/Sem alunos
      if (total > 0) {
        badgeStyle = pct < 70 ? "bg-danger bg-opacity-10 text-danger border-danger border-opacity-25" : pct < 90 ? "bg-warning bg-opacity-10 text-warning border-warning border-opacity-25" : "bg-success bg-opacity-10 text-success border-success border-opacity-25";
      }

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start">
                
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5 d-flex align-items-center">
                        <i class="far fa-calendar-alt me-2 text-primary opacity-75"></i> ${dateFmt}
                    </h6>
                    
                    <div class="small text-muted mb-2 d-flex align-items-center lh-1 mt-2">
                        <i class="fas fa-user-check me-2 opacity-50"></i> ${present} de ${total} presentes
                    </div>
                </div>
                
                <div class="text-end mt-1">
                    <span class="badge ${badgeStyle} border px-2 py-1 fs-6 fw-bold">
                        ${pct}%
                    </span>
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('education.class_sessions', ${item.session_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openSessionModal(${item.session_id}, '${rawIsoDate}')" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteSession(${item.session_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-diario", "currentPage", "totalPages", "changePage", defaultDiary);
};

// =========================================================
// 3. MODAL E LÓGICA DE DATA (FIXED JS ERROR & DISABLED STATE)
// =========================================================

window.openSessionModal = async (sessionId = null, dateStr = null) => {
  diarioState.sessionId = sessionId;

  const $dateInput = $("#diario_date");
  const $editor = $("#diario_content");

  // 1. Reset UI e Limpeza Segura (Soft UI)
  $dateInput.val("").prop("disabled", true);
  $("#date-status-icon").empty();
  $("#date-msg").text("");
  $("#lista-alunos").html('<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Carregando chamada...</p></div>');

  // Destroy Flatpickr (Seguro)
  if (typeof fpInstance !== "undefined" && fpInstance) {
    fpInstance.destroy();
    fpInstance = null;
  }

  // Destroy Summernote (BLINDADO)
  if ($editor.next(".note-editor").length > 0) {
    try {
      $editor.summernote("destroy");
    } catch (e) {
      console.warn("Summernote cleanup:", e);
    }
  }
  $editor.val("").hide();

  // Abre o Modal
  $("#modalSession").modal("show");

  // 2. Carrega Metadados do Backend
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

      // Habilita o input ANTES de criar o Flatpickr
      $dateInput.prop("disabled", false).removeAttr("disabled");

      // Inicializa Flatpickr
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
        onChange: function (selectedDates, dateStr, instance) {
          if (typeof checkDateLogic === "function") checkDateLogic(dateStr);
        },
        onReady: function (selectedDates, dateStr, instance) {
          if (instance.altInput) {
            instance.altInput.disabled = false;
            instance.altInput.style.backgroundColor = "";
          }
        },
      });

      // Define a data se estiver editando
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
  }

  // Inicializa Summernote (Garantindo que o DOM está pronto e resiliência)
  if ($editor.length && typeof $.fn.summernote !== "undefined") {
    $editor.summernote(window.summernoteConfig || {});
  }
};

window.checkDateLogic = async (dateStr) => {
  if (!dateStr) return;

  const $statusIcon = $("#date-status-icon");
  const $msgContainer = $("#date-msg");
  // 1. UI Reset & Loading Localizado
  $statusIcon.html('<div class="spinner-border spinner-border-sm text-primary" role="status"></div>');
  $msgContainer.text("Validando data...").removeClass("text-warning text-danger text-success text-primary");
  const dateObj = new Date(dateStr + "T00:00:00");
  const dayOfWeek = dateObj.getDay();

  if (diarioState.schedules.length > 0) {
    const isScheduledDay = diarioState.schedules.some((s) => parseInt(s.day_of_week) === dayOfWeek);
    if (!isScheduledDay) {
      // Aviso discreto, pois pode ser reposição
      $msgContainer.text("Atenção: Dia fora da grade padrão.").addClass("text-warning");
    }
  }

  // 2. Validação de Conteúdo (Backend)
  try {
    const res = await window.ajaxValidator({
      validator: "checkDateContent",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      date: dateStr, // YYYY-MM-DD
    });

    if (res.status) {
      const info = res.data;

      if (info.status === "BLOCKED") {
        $statusIcon.html('<i class="fas fa-ban text-danger"></i>');
        $msgContainer.text(`Bloqueado: ${info.reason}`).removeClass("text-warning").addClass("text-danger");
        $("#diario_content").summernote("disable");
        $("#lista-alunos").html('<p class="text-center text-muted p-4">Data bloqueada.</p>');
      } else if (info.status === "EXISTING") {
        diarioState.sessionId = info.session_id;
        $statusIcon.html('<i class="fas fa-edit text-primary"></i>');
        $msgContainer.text("Editando aula já registrada.").removeClass("text-warning").addClass("text-primary");

        $("#diario_content").summernote("enable");
        $("#diario_content").summernote("code", info.content);
        loadStudentsList(info.attendance);
      } else if (info.status === "NEW") {
        diarioState.sessionId = null;
        $statusIcon.html('<i class="fas fa-check-circle text-success"></i>');
        $msgContainer.text(`Nova Aula (Encontro #${info.sequence})`).removeClass("text-warning").addClass("text-success");

        $("#diario_content").summernote("enable");
        if (info.template) {
          $("#diario_content").summernote("code", info.template);
          window.alertDefault("Plano de aula sugerido carregado!", "info");
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
    $msgContainer.text("Erro ao validar data.").addClass("text-warning");

    const errorMessage = e.message || "Falha na comunicação com o servidor.";
    window.alertErrorWithSupport(`Validar Data do Diário (Data: ${dateStr})`, errorMessage);
  }
};

// =========================================================
// LISTA DE ALUNOS (LAYOUT OTIMIZADO)
// =========================================================

const loadStudentsList = async (existingAttendance = null) => {
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
          }
        }
        return {
          ...std,
          is_present: isPresent,
          justification: justification,
          absence_type: absenceType,
        };
      });

      renderStudents();
    } else {
      throw new Error(res.alert || "Não foi possível carregar a lista de alunos da turma.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha ao carregar lista de presença.";

    // 4. Feedback Visual de Erro dentro do container da lista
    container.html(`
        <div class="text-center py-5">
            <i class="fas fa-users-slash fs-1 text-muted mb-3"></i>
            <h6 class="text-secondary fw-bold">Falha ao carregar alunos</h6>
            <button class="btn btn-sm btn-outline-primary rounded-pill px-4" onclick="loadStudentsList(${existingAttendance ? JSON.stringify(existingAttendance) : "null"})">
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
    container.html('<p class="text-center text-muted p-4">Nenhum catequizando matriculado.</p>');
    return;
  }

  let html = "";

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA)
  // =========================================================
  html += `
    <div class="d-none d-md-block table-responsive">
        <table class="table table-hover align-middle table-custom">
            <thead>
                <tr>
                    <th width="50" class="ps-3">Foto</th>
                    <th>Nome</th>
                    <th class="text-center" width="200">Presença / Status</th>
                    <th>Motivo / Justificativa</th>
                </tr>
            </thead>
            <tbody>`;

  students.forEach((std, idx) => {
    const nameParts = std.full_name.trim().split(" ");
    const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();
    let avatarHtml = std.profile_photo_url
      ? `<img src="${std.profile_photo_url}" class="rounded-circle border" style="width:35px; height:35px; object-fit:cover; cursor:pointer;" onclick="zoomAvatar('${std.profile_photo_url}')">`
      : `<div class="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary fw-bold" style="width:35px; height:35px; font-size:12px;">${initials}</div>`;

    const isP = std.is_present;
    const statusBadge = isP ? `<span class="badge bg-success-subtle text-success border border-success status-label-${idx}">Presente</span>` : `<span class="badge bg-danger-subtle text-danger border border-danger status-label-${idx}">Faltou</span>`;

    html += `
            <tr>
                <td class="ps-3">${avatarHtml}</td>
                <td class="fw-bold small">${std.full_name}</td>
                <td class="text-center">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox" ${isP ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)">
                        </div>
                        <div class="status-container-${idx}">${statusBadge}</div>
                    </div>
                </td>
                <td>
                    <div id="just-area-${idx}" class="d-flex gap-2 ${isP ? "d-none" : ""}">
                        <select class="form-select form-select-sm" style="width: 120px;" onchange="updateAbsenceType(${idx}, this.value)">
                            <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>Não Justif.</option>
                            <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Justificada</option>
                            <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Recorrente</option>
                        </select>
                        <input type="text" class="form-control form-control-sm flex-grow-1" style="width: 120px;" value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Detalhes...">
                    </div>
                </td>
            </tr>`;
  });
  html += `</tbody></table></div>`;

  // =========================================================
  // 2. VISÃO MOBILE (CARDS COM TOGGLE NO TOPO E LEGENDA ABAIXO)
  // =========================================================
  html += `<div class="d-md-none d-flex flex-column gap-2">`;

  students.forEach((std, idx) => {
    const nameParts = std.full_name.trim().split(" ");
    const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();
    let avatarHtml = std.profile_photo_url
      ? `<img src="${std.profile_photo_url}" class="rounded-circle border" style="width:35px; height:35px; object-fit:cover; cursor:pointer;" onclick="zoomAvatar('${std.profile_photo_url}')">`
      : `<div class="rounded-circle bg-opacity-10 d-flex align-items-center justify-content-center text-secondary fw-bold fs-5" style="width:45px; height:45px;">${initials}</div>`;

    const isP = std.is_present;
    const statusBadge = isP ? `<span class="badge bg-success-subtle text-success border border-success status-label-${idx}">Presente</span>` : `<span class="badge bg-danger-subtle text-danger border border-danger status-label-${idx}">Faltou</span>`;

    html += `
            <div class="mobile-card p-3">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-center">
                        <div class="me-3">${avatarHtml}</div>
                        <div class="fw-bold small">${std.full_name}</div>
                    </div>
                    
                    <div class="d-flex flex-column align-items-end">
                        <div class="form-check form-switch mb-0">
                            <input class="form-check-input" type="checkbox" ${isP ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)">
                        </div>
                        <div class="status-container-${idx} mt-1">${statusBadge}</div>
                    </div>
                </div>
                
                <div id="just-box-mob-${idx}" class="mt-2 p-2 rounded ${isP ? "d-none" : ""}">
                    <select class="form-select form-select-sm mb-2 w-100" onchange="updateAbsenceType(${idx}, this.value)">
                        <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>Não Justificada</option>
                        <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Justificada</option>
                        <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Recorrente</option>
                    </select>
                    <input type="text" class="form-control form-control-sm" value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Descreva o motivo...">
                </div>
            </div>`;
  });
  html += `</div>`;

  container.html(html);
};

// Função de atualização aprimorada para sincronizar as badges
window.updateAttendance = (idx, isPresent) => {
  diarioState.currentStudents[idx].is_present = isPresent;

  // Atualiza as Badges em ambos (Desktop e Mobile)
  const newBadge = isPresent ? `<span class="badge bg-success-subtle text-success border border-success status-label-${idx}">Presente</span>` : `<span class="badge bg-danger-subtle text-danger border border-danger status-label-${idx}">Faltou</span>`;

  $(`.status-container-${idx}`).html(newBadge);

  // Toggle das áreas de justificativa
  if (isPresent) {
    $(`#just-area-${idx}, #just-box-mob-${idx}`).addClass("d-none");
  } else {
    $(`#just-area-${idx}, #just-box-mob-${idx}`).removeClass("d-none");
  }
};

window.updateJustification = (idx, val) => {
  diarioState.currentStudents[idx].justification = val;
};

window.updateAbsenceType = (idx, val) => {
  diarioState.currentStudents[idx].absence_type = val;
};

// =========================================================
// SALVAR E EXCLUIR
// =========================================================

window.salvarDiario = async () => {
  const date = $("#diario_date").val();
  const content = $("#diario_content").summernote("code");
  const btn = $("#btn-save-diario");

  if (!date) return window.alertDefault("Selecione a data da aula.", "warning");
  if ($("#date-msg").hasClass("text-danger")) return window.alertDefault("Data bloqueada para registro.", "error");

  window.setButton(true, btn, "Salvando...");

  try {
    const res = await window.ajaxValidator({
      validator: "saveClassDiary",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      session_id: diarioState.sessionId,
      date: date, // Envia String YYYY-MM-DD
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
    // 5. Sempre restaura o botão, mesmo em erro (para o usuário tentar novamente)
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar Diário');
  }
};

window.deleteSession = (sessionId) => {
  Swal.fire({
    title: "Excluir Registro de Aula?",
    text: "O registro será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d", // Cinza padrão Soft UI
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        // 1. Chamada à API com prefixos padronizados
        const res = await window.ajaxValidator({
          validator: "deleteClassDiary",
          token: window.defaultApp.userInfo.token,
          session_id: sessionId,
        });

        // 2. Tratamento do Resultado
        if (res.status) {
          window.alertDefault("Registro de aula removido.", "success");

          // Atualiza a listagem de histórico
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

// Paginação e Utilitários
window.changePage = (p) => {
  defaultDiary.currentPage = p;
  getHistory();
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
