// =========================================================
// GESTÃO DE DIÁRIO DE CLASSE (SMART LOGIC V6 - FINAL)
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
      window.alertDefault("Esta turma não possui disciplinas.", "warning");
    }
  } catch (e) {
    console.error(e);
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
  $(".list-table-diario").html('<div class="text-center py-5"><span class="loader"></span></div>');
  try {
    const res = await window.ajaxValidator({ validator: "getClassHistory", token: defaultApp.userInfo.token, class_id: diarioState.classId, subject_id: diarioState.subjectId, page: page * defaultDiary.rowsPerPage, limit: defaultDiary.rowsPerPage });
    if (res.status) {
      const total = res.data[0]?.total_registros || 0;
      defaultDiary.totalPages = Math.max(1, Math.ceil(total / defaultDiary.rowsPerPage));
      renderTableHistory(res.data || []);
    } else {
      $(".list-table-diario").html('<div class="text-center py-5 text-muted"><p>Nenhuma aula registrada.</p></div>');
      $(".pagination-diario").empty();
    }
  } catch (e) {
    $(".list-table-diario").html('<p class="text-center py-4 text-danger">Erro ao carregar histórico.</p>');
  }
};

const renderTableHistory = (data) => {
  const container = $(".list-table-diario");
  if (data.length === 0) {
    container.html(`<div class="text-center py-5 text-muted opacity-50"><i class="fas fa-book-open fa-3x mb-3"></i><p>Nenhuma aula registrada.</p></div>`);
    return;
  }
  let rows = data
    .map((item) => {
      const dateParts = item.session_date.split(" ");
      const dateFmt = dateParts[0].split("-").reverse().join("/");
      const timeFmt = dateParts[1] ? dateParts[1].substring(0, 5) : "";
      const rawIsoDate = item.session_date.substring(0, 16).replace(" ", "T");
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
            <div class="fw-bold">
              ${dateFmt}
            </div>
            <div class="small text-muted">
              ${summary || "Sem descrição"}
            </div>
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
            <button class="btn-icon-action" onclick="openSessionModal(${item.session_id}, '${rawIsoDate}')" title="Editar"><i class="fas fa-pen"></i>
            </button><button class="btn-icon-action delete" onclick="deleteSession(${item.session_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </td>
        </tr>`;
    })
    .join("");
  container.html(`<table class="table-custom"><thead><tr><th colspan="2" class="ps-3">Data / Conteúdo</th><th class="text-center">Frequência</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);
  _generatePaginationButtons("pagination-diario", "currentPage", "totalPages", "changePage", defaultDiary);
};

// =========================================================
// 3. MODAL E LÓGICA DE DATA (FLATPICKR INTELIGENTE)
// =========================================================

window.openSessionModal = async (sessionId = null, dateStr = null) => {
  diarioState.sessionId = sessionId;

  // Reset UI
  const $dateInput = $("#diario_date");
  $dateInput.val("").prop("disabled", true);

  $("#diario_content").summernote("destroy");
  $("#diario_content").val("");
  $("#lista-alunos").html('<div class="text-center py-5"><span class="loader"></span></div>');
  $("#date-status-icon").empty();
  $("#date-msg").text("");

  if (fpInstance) {
    fpInstance.destroy();
    fpInstance = null;
  }

  $("#modalSession").modal("show");

  // 1. Carrega Metadados
  try {
    const resMeta = await window.ajaxValidator({
      validator: "getDiarioMetadata",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
    });

    if (resMeta.status) {
      diarioState.schedules = resMeta.data.schedules;

      const validDates = resMeta.data.valid_dates || []; // Grade teórica
      const existingDates = resMeta.data.existing_dates || []; // Aulas dadas
      const holidays = resMeta.data.holidays || {}; // Feriados

      // IMPORTANTE: Habilitar tanto os dias da grade quanto os dias já lançados (exceções)
      // Usa Set para remover duplicatas
      const enableDates = [...new Set([...validDates, ...existingDates])];

      // Se for edição de uma data antiga que não está mais na grade, adiciona ela
      if (dateStr) {
        const currentDate = dateStr.split("T")[0];
        if (!enableDates.includes(currentDate)) enableDates.push(currentDate);
      }

      fpInstance = flatpickr("#diario_date", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        time_24hr: true,
        minDate: resMeta.data.min_date,
        maxDate: resMeta.data.max_date,
        locale: "pt",
        enable: enableDates, // Lista Branca combinada

        onDayCreate: function (dObj, dStr, fp, dayElem) {
          const offsetDate = new Date(dayElem.dateObj.getTime() - dayElem.dateObj.getTimezoneOffset() * 60000);
          const dateKey = offsetDate.toISOString().split("T")[0];

          if (holidays[dateKey]) {
            // FERIADO (Vermelho)
            dayElem.classList.add("flatpickr-disabled");
            dayElem.setAttribute("title", holidays[dateKey]);
            dayElem.innerHTML += "<span class='event busy'></span>";
          } else if (existingDates.includes(dateKey)) {
            // AULA JÁ DADA (Verde)
            dayElem.innerHTML += "<span class='event existing'></span>";
            dayElem.setAttribute("title", "Diário preenchido");
          } else if (validDates.includes(dateKey)) {
            // DIA DE AULA PREVISTO (Azul)
            dayElem.innerHTML += "<span class='event'></span>";
          }
        },
        onChange: function (selectedDates, dateStr, instance) {
          checkDateLogic(dateStr);
        },
      });

      $dateInput.prop("disabled", false);

      if (dateStr) {
        fpInstance.setDate(dateStr, true);
      }
    } else {
      window.alertDefault(resMeta.alert || "Erro ao carregar dados.", "warning");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro de conexão.", "error");
  }

  $("#diario_content").summernote(summernoteConfig);
};

const checkDateLogic = async (dateTimeStr) => {
  if (!dateTimeStr) return;

  const $statusIcon = $("#date-status-icon");
  const $msgContainer = $("#date-msg");

  $statusIcon.html('<span class="loader-sm"></span>');
  $msgContainer.text("");

  // 1. Validação de Hora (Local)
  // O calendário já garantiu o dia correto via 'enable', agora checamos a hora
  const dateObj = new Date(dateTimeStr);
  const dayOfWeek = dateObj.getDay(); // 0-6

  if (diarioState.schedules.length > 0) {
    const schedule = diarioState.schedules.find((s) => parseInt(s.day_of_week) === dayOfWeek);
    if (schedule) {
      const timeStr = dateTimeStr.split(" ")[1] || ""; // HH:MM
      const start = schedule.start_time.substring(0, 5);
      const end = schedule.end_time.substring(0, 5);

      if (timeStr && (timeStr < start || timeStr > end)) {
        // Apenas aviso, não bloqueia (flexibilidade)
        $msgContainer.text(`Atenção: Horário fora da grade (${start} - ${end})`).addClass("text-warning");
      }
    }
  }

  // 2. Validação de Conteúdo (Backend)
  try {
    const res = await window.ajaxValidator({
      validator: "checkDateContent",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      date: dateTimeStr.replace(" ", "T"), // Padroniza ISO
    });

    if (res.status) {
      const info = res.data;

      if (info.status === "BLOCKED") {
        // Caso raro onde o usuário consegue burlar o calendário
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
    }
  } catch (e) {
    console.error(e);
    $statusIcon.html('<i class="fas fa-exclamation-triangle text-warning"></i>');
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
    }
  } catch (e) {
    console.error(e);
  }
};

const renderStudents = () => {
  const container = $("#lista-alunos");
  const students = diarioState.currentStudents;

  if (students.length === 0) {
    container.html('<p class="text-center text-muted p-4">Nenhum aluno matriculado.</p>');
    return;
  }

  let html = "";

  // DESKTOP
  html += `<div class="d-none d-md-block table-responsive"><table class="table table-hover align-middle table-custom"><thead><tr><th width="50" class="ps-3">Foto</th><th>Nome</th><th class="text-center" width="80">Presença</th><th>Motivo / Justificativa</th></tr></thead><tbody>`;

  students.forEach((std, idx) => {
    let avatarHtml = std.profile_photo_url
      ? `<img src="${std.profile_photo_url}" class="rounded-circle border" style="width:35px; height:35px; object-fit:cover; cursor:pointer;" onclick="zoomAvatar('${std.profile_photo_url}')">`
      : `<div class="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary fw-bold" style="width:35px; height:35px;">${std.full_name.charAt(0)}</div>`;

    // Layout Condicional
    const visibilityClass = std.is_present ? "d-none" : "";

    html += `
            <tr>
                <td class="ps-3">${avatarHtml}</td>
                <td class="fw-bold small">${std.full_name}</td>
                <td class="text-center">
                    <div class="form-check form-switch">
                        <input class="form-check-input toggleSwitch" type="checkbox" ${std.is_present ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)">
                    </div>
                </td>
                <td>
                    <div id="just-area-${idx}" class="d-flex gap-2 ${visibilityClass}">
                        <select class="form-select form-select-sm" style="width: 130px; flex-shrink: 0;" onchange="updateAbsenceType(${idx}, this.value)">
                            <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>Não Justif.</option>
                            <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Justificada</option>
                            <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Recorrente</option>
                        </select>
                        <input type="text" class="form-control form-control-sm flex-grow-1" style="width: 130px;"  value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Detalhes...">
                    </div>
                </td>
            </tr>`;
  });
  html += `</tbody></table></div>`;

  // MOBILE
  html += `<div class="d-md-none d-flex flex-column gap-2">`;
  students.forEach((std, idx) => {
    let avatarHtml = std.profile_photo_url
      ? `<img src="${std.profile_photo_url}" class="rounded-circle border" style="width:45px; height:45px; object-fit:cover;">`
      : `<div class="rounded-circle bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center text-secondary fw-bold fs-5" style="width:45px; height:45px;">${std.full_name.charAt(0)}</div>`;

    const visibilityClass = std.is_present ? "d-none" : "";

    html += `
            <div class="card border shadow-sm p-2">
                <div class="d-flex align-items-center">
                    <div class="me-3">${avatarHtml}</div>
                    <div class="flex-grow-1">
                        <div class="fw-bold small mb-1">${std.full_name}</div>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="small text-muted">Presença</span>
                            <div class="form-check form-switch">
                                <input class="form-check-input toggleSwitch" type="checkbox" ${std.is_present ? "checked" : ""} onchange="updateAttendance(${idx}, this.checked)">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-2 ${visibilityClass}" id="just-box-mob-${idx}">
                    <select class="form-select form-select-sm mb-2 w-100" onchange="updateAbsenceType(${idx}, this.value)">
                        <option value="UNJUSTIFIED" ${std.absence_type === "UNJUSTIFIED" ? "selected" : ""}>Não Justificada</option>
                        <option value="JUSTIFIED" ${std.absence_type === "JUSTIFIED" ? "selected" : ""}>Justificada</option>
                        <option value="RECURRENT" ${std.absence_type === "RECURRENT" ? "selected" : ""}>Recorrente</option>
                    </select>
                    <input type="text" class="form-control form-control-sm w-100" value="${std.justification || ""}" onchange="updateJustification(${idx}, this.value)" placeholder="Descreva o motivo...">
                </div>
            </div>`;
  });
  html += `</div>`;

  container.html(html);
};

window.updateAttendance = (idx, isPresent) => {
  diarioState.currentStudents[idx].is_present = isPresent;

  // Toggle Visual
  if (isPresent) {
    $(`#just-area-${idx}`).addClass("d-none");
    $(`#just-box-mob-${idx}`).addClass("d-none");
  } else {
    $(`#just-area-${idx}`).removeClass("d-none");
    $(`#just-box-mob-${idx}`).removeClass("d-none");
  }
};

window.updateJustification = (idx, val) => {
  diarioState.currentStudents[idx].justification = val;
};

window.updateAbsenceType = (idx, val) => {
  diarioState.currentStudents[idx].absence_type = val;
};

window.zoomAvatar = (url) => {
  Swal.fire({ imageUrl: url, imageHeight: 300, showConfirmButton: false, background: "transparent" });
};

// =========================================================
// SALVAR E EXCLUIR
// =========================================================

window.salvarDiario = async () => {
  const date = $("#diario_date").val();
  const content = $("#diario_content").summernote("code");
  const btn = $("#btn-save-diario");

  if (!date) return window.alertDefault("Selecione a data e hora da aula.", "warning");
  if ($("#date-msg").hasClass("text-danger")) return window.alertDefault("Data bloqueada para registro.", "error");

  window.setButton(true, btn, "Salvando...");

  try {
    const res = await window.ajaxValidator({
      validator: "saveClassDiary",
      token: defaultApp.userInfo.token,
      class_id: diarioState.classId,
      subject_id: diarioState.subjectId,
      session_id: diarioState.sessionId,
      date: date, // Envia String YYYY-MM-DD HH:MM
      content: content,
      attendance_json: JSON.stringify(diarioState.currentStudents),
    });

    if (res.status) {
      window.alertDefault("Diário salvo com sucesso!", "success");
      $("#modalSession").modal("hide");
      getHistory();
    } else {
      window.alertDefault(res.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro técnico ao salvar.", "error");
    console.error(e);
  } finally {
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar Diário');
  }
};

window.deleteSession = (sessionId) => {
  Swal.fire({
    title: "Excluir Diário?",
    text: "O registro da aula e a frequência serão removidos.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Excluir",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await window.ajaxValidator({
          validator: "deleteClassDiary",
          token: defaultApp.userInfo.token,
          session_id: sessionId,
        });
        if (res.status) {
          window.alertDefault("Excluído com sucesso.", "success");
          getHistory();
        } else {
          window.alertDefault(res.alert, "error");
        }
      } catch (e) {
        window.alertDefault("Erro ao excluir.", "error");
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
