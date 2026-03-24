const defaultClass = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentSchedules = [];

// Toggle Global de Status
window.toggleTurma = (id, element) => handleToggle("toggleClass", id, element, "Estado da turma atualizado.", `.status-text-turma-${id}`, getTurmas);

$(document).ready(() => {
  initSelects();
  $("#busca-texto").on("keyup", function () {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      defaultClass.currentPage = 1;
      getTurmas();
    }, 500);
  });
  window.addEventListener("yearChanged", () => {
    defaultClass.currentPage = 1;
    getTurmas();
  });
  getTurmas();
});

// =========================================================
// 1. MOTOR DE RENDERIZAÇÃO RESPONSIVA
// =========================================================
const getTurmas = async () => {
  try {
    const page = Math.max(0, defaultClass.currentPage - 1);
    const year = localStorage.getItem("sys_active_year");
    const container = $(".list-table-turmas");

    if (!year) {
      container.html('<div class="text-center py-5 opacity-50"><p>Selecione um Ano Letivo.</p></div>');
      return;
    }

    const result = await window.ajaxValidator({
      validator: "getClasses",
      token: defaultApp.userInfo.token,
      limit: defaultClass.rowsPerPage,
      page: page * defaultClass.rowsPerPage,
      search: $("#busca-texto").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year: year,
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultClass.totalPages = Math.max(1, Math.ceil(total / defaultClass.rowsPerPage));
      renderTableClasses(result.data || []);
    }
  } catch (e) {
    console.error(e);
  }
};

const renderTableClasses = (data) => {
  const container = $(".list-table-turmas");

  if (data.length === 0) {
    container.html(`
            <div class="text-center py-5">
                <i class="fas fa-chalkboard-teacher fa-3x text-muted mb-3 opacity-25"></i>
                <p class="text-muted">Nenhuma turma encontrada.</p>
            </div>
        `);
    $(".pagination-turmas").empty();
    return;
  }

  const getProgressHtml = (enrolled, cap) => {
    if (!cap || parseInt(cap) === 0) return '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-2 py-1">Ilimitado</span>';
    const pct = Math.min(100, Math.round((parseInt(enrolled || 0) / parseInt(cap)) * 100));
    let color = pct < 80 ? "bg-success" : pct < 100 ? "bg-warning" : "bg-danger";
    return `
        <div class="w-100" style="max-width: 140px; margin: 0 auto;">
            <div class="d-flex justify-content-between fw-bold text-muted mb-1" style="font-size: 0.65rem;">
                <span>${enrolled}/${cap}</span>
                <span>${pct}%</span>
            </div>
            <div class="progress bg-secondary bg-opacity-10 shadow-inner" style="height: 6px; border-radius: 10px;">
                <div class="progress-bar ${color} rounded-pill shadow-sm" role="progressbar" style="width: ${pct}%"></div>
            </div>
        </div>`;
  };

  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // --- VISÃO DESKTOP ---
  let desktopRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";
      const coordNameEscaped = (item.coordinator_name || "Sem coordenador").replace(/'/g, "\\'");

      let photoHtml = "";
      if (item.coordinator_photo) {
        photoHtml = `<img src="${item.coordinator_photo}" 
                           class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                           style="width:34px; height:34px; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                           onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.coordinator_photo}', '${coordNameEscaped}')"
                           onmouseover="this.style.transform='scale(1.15)'" 
                           onmouseout="this.style.transform='scale(1)'"
                           title="Ver foto">`;
      } else {
        const initials = getInitials(item.coordinator_name || "?");
        photoHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center text-primary border fw-bold shadow-sm" style="width:34px; height:34px; background-color: var(--fundo); font-size: 0.75rem;">${initials}</div>`;
      }

      return `
        <tr>
            <td class="text-center align-middle ps-3" style="width: 60px;">
                <div class="rounded-circle d-flex align-items-center justify-content-center text-secondary border shadow-sm" style="width:42px; height:42px; background-color: var(--fundo);">
                    <i class="fas fa-layer-group opacity-50"></i>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
                <div class="text-muted small mt-1">
                    <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-10 py-1" style="font-size: 0.65rem;">${item.course_name}</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="d-flex align-items-center gap-2">
                    ${photoHtml}
                    <div>
                        <div class="fw-medium text-body small">${item.coordinator_name || "Sem coordenador"}</div>
                        <div class="text-muted" style="font-size: 0.7rem;"><i class="far fa-calendar-alt me-1"></i> ${item.year_name || "-"}</div>
                    </div>
                </div>
            </td>
            <td class="align-middle">
                <div class="small text-body fw-bold"><i class="far fa-clock me-1 text-primary"></i> ${item.schedule_summary || "---"}</div>
                <div class="small text-muted mt-1 text-truncate" style="max-width: 150px;"><i class="fas fa-location-dot me-1 opacity-50"></i> ${item.location_name || "Sede"}</div>
            </td>
            <td class="text-center align-middle">${getProgressHtml(item.enrolled_count, item.max_capacity)}</td>
            <td class="text-center align-middle">
                <div class="d-flex align-items-center justify-content-center">
                    <div class="form-check form-switch mb-0">
                        <input class="form-check-input shadow-sm" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="cursor: pointer;">
                    </div>
                </div>
            </td>
            <td class="text-end align-middle pe-3">
                <div class="d-flex gap-2 justify-content-end">
                    <button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Auditoria/Log">
                        <i class="fas fa-history" style="font-size: 0.85rem;"></i>
                    </button>
                    <button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="modalTurma(${item.class_id}, this)" title="Editar">
                        <i class="fas fa-pen" style="font-size: 0.85rem;"></i>
                    </button>
                    <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="deleteTurma(${item.class_id})" title="Excluir">
                        <i class="fas fa-trash-can" style="font-size: 0.85rem;"></i>
                    </button>
                </div>
            </td>
        </tr>`;
    })
    .join("");

  const tableHtml = `
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3">Turma / Curso</th>
                    <th>Responsável</th>
                    <th>Agenda / Local</th>
                    <th class="text-center">Ocupação</th>
                    <th class="text-center">Ativa</th>
                    <th class="text-end pe-4">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // --- VISÃO MOBILE ---
  const mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";
      const coordNameEscaped = (item.coordinator_name || "Sem coordenador").replace(/'/g, "\\'");

      let avatarHtml = "";
      if (item.coordinator_photo) {
        avatarHtml = `<img src="${item.coordinator_photo}" 
                           class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                           style="width:48px; height:48px; object-fit:cover; cursor: pointer;"
                           onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.coordinator_photo}', '${coordNameEscaped}')">`;
      } else {
        const initials = getInitials(item.coordinator_name || item.name);
        avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold fs-5" style="width:48px; height:48px;">${initials}</div>`;
      }

      return `
      <div class="ios-list-item">
          <div class="me-3">
              ${avatarHtml}
          </div>
          
          <div class="flex-grow-1 d-flex flex-column justify-content-center py-1" style="min-width: 0;">
              <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                  <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 1rem; max-width: 180px;">${item.name}</h6>
                  <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1" style="font-size: 0.6rem; border-radius: 6px;">${item.course_name}</span>
              </div>
              <div class="d-flex flex-column gap-1 mt-1">
                  <span class="text-muted fw-medium" style="font-size: 0.75rem;"><i class="far fa-user me-1"></i> ${item.coordinator_name || "Sem coordenador"}</span>
                  <div class="mt-1" style="width: 120px;">
                    ${getProgressHtml(item.enrolled_count, item.max_capacity, true)}
                  </div>
              </div>
          </div>

          <div class="d-flex flex-column align-items-end justify-content-center ms-2 gap-3" style="min-width: 90px;">
              <div class="d-flex align-items-center justify-content-end gap-2 w-100">
                <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                  <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="cursor: pointer; width: 44px; height: 24px;">
                </div>
              </div>
              <div class="d-flex mt-4 gap-2">
                  <button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Log"><i class="fas fa-history"></i></button>
                  <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="modalTurma(${item.class_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
                  <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash-can"></i></button>
              </div>
          </div>
      </div>`;
    })
    .join("");

  container.html(tableHtml + `<div class="d-md-none ios-list-container">${mobileRows}</div>`);
  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "changePage", defaultClass);
};

// =========================================================
// 2. LOGICA DE MATRÍCULAS E HISTÓRICO ALUNO
// =========================================================
window.openHistory = (enrollmentId, studentName) => {
  $("#hist_enrollment_id").val(enrollmentId);
  $("#hist_student_name").text(studentName);
  $("#hist_obs").val("");
  $("#hist_action").val("COMMENT");
  loadEnrollmentHistory(enrollmentId);
  $("#modalHistoricoAluno").modal("show");
};

const loadEnrollmentHistory = async (enrollmentId) => {
  const container = $("#lista-historico-detalhe");
  container.html('<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary"></div></div>');
  try {
    const res = await window.ajaxValidator({ validator: "getEnrollmentHistory", token: defaultApp.userInfo.token, enrollment_id: enrollmentId });
    if (res.status) {
      const actionMap = {
        ENROLLED: "Matrícula Inicial",
        SUSPENDED: "Suspensão",
        DROPPED: "Desistência",
        TRANSFERRED: "Transferência",
        ACTIVE: "Reativação",
        COMPLETED: "Conclusão",
        COMMENT: "Observação",
      };

      const html = (res.data || [])
        .map(
          (item) => `
        <div class="position-relative ps-4 border-start border-2 border-secondary border-opacity-10 pb-4 ms-2">
            <div class="position-absolute start-0 top-0 translate-middle-x bg-primary rounded-circle border border-3 border-body shadow-sm" style="width: 12px; height: 12px; margin-top: 5px;"></div>
            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 shadow-inner">
                <div class="d-flex justify-content-between mb-1">
                    <span class="badge bg-primary bg-opacity-10 text-primary rounded-pill px-2 py-0 fw-bold" style="font-size: 0.6rem;">${actionMap[item.action_type] || item.action_type}</span>
                    <small class="text-muted fw-bold" style="font-size: 0.7rem;">${item.action_date_fmt}</small>
                </div>
                <p class="mb-2 text-body small fw-medium">${item.observation || "Registro de sistema."}</p>
                <div class="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-10 pt-2 mt-1">
                    <div class="small text-muted" style="font-size: 0.65rem;"><i class="fas fa-user-circle me-1 opacity-50"></i> Por: <b>${item.user_name}</b></div>
                    <button class="btn btn-link text-danger p-0 text-decoration-none" onclick="deleteHistoryItem(${item.history_id}, ${enrollmentId})"><i class="fas fa-trash-can"></i></button>
                </div>
            </div>
        </div>`,
        )
        .join("");

      container.html(html || '<div class="text-center py-4 small opacity-50">Sem histórico.</div>');
    }
  } catch (e) {
    container.html('<div class="text-center text-danger py-4">Erro ao carregar histórico.</div>');
  }
};

window.addHistoryItem = async (btn) => {
  const eid = $("#hist_enrollment_id").val();
  const action = $("#hist_action").val();
  const obs = $("#hist_obs").val().trim();

  if (!obs && action === "COMMENT") return window.alertDefault("Descreva a ocorrência.", "warning");

  btn = $(btn);
  window.setButton(true, btn, "");
  try {
    const res = await window.ajaxValidator({
      validator: "addEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: eid,
      action_type: action,
      observation: obs,
    });
    if (res.status) {
      window.alertDefault("Registro adicionado!", "success");
      $("#hist_obs").val("");
      loadEnrollmentHistory(eid);
      loadClassStudents($("#class_id").val());
    }
  } catch (e) {
    window.alertErrorWithSupport("Gravar Histórico", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteHistoryItem = (historyId, enrollmentId) => {
  Swal.fire({ title: "Apagar registro?", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33" }).then(async (r) => {
    if (r.isConfirmed) {
      await window.ajaxValidator({ validator: "deleteEnrollmentHistory", token: defaultApp.userInfo.token, id: historyId });
      loadEnrollmentHistory(enrollmentId);
    }
  });
};

window.matricularAluno = async (btn) => {
  const classId = $("#class_id").val();
  const studentId = $("#sel_new_student").val();
  if (!classId || !studentId) return window.alertDefault("Selecione o aluno.", "warning");

  btn = $(btn);
  window.setButton(true, btn, "");

  try {
    const res = await window.ajaxValidator({ validator: "enrollStudent", token: defaultApp.userInfo.token, class_id: classId, student_id: studentId });
    if (res.status) {
      window.alertDefault("Matriculado!", "success");
      $("#sel_new_student")[0].selectize.clear();
      loadClassStudents(classId);
      getTurmas();
    }
  } catch (e) {
    window.alertErrorWithSupport("Falha na matrícula", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

const loadClassStudents = async (classId) => {
  const container = $("#lista-alunos");
  container.html('<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary"></div></div>');
  try {
    const res = await window.ajaxValidator({ validator: "getClassStudents", token: defaultApp.userInfo.token, class_id: classId });
    if (res.status) renderStudentsList(res.data || []);
  } catch (e) {
    container.html('<div class="text-center text-danger small">Erro ao carregar catequizandos.</div>');
  }
};

const renderStudentsList = (data) => {
  const container = $("#lista-alunos");
  if (data.length === 0) {
    container.html('<div class="text-center py-4 opacity-50 small">Nenhum aluno matriculado.</div>');
    return;
  }

  const statusMap = {
    ACTIVE: { label: "Ativo", color: "success" },
    SUSPENDED: { label: "Suspenso", color: "warning" },
    DROPPED: { label: "Desistente", color: "danger" },
    COMPLETED: { label: "Concluído", color: "primary" },
    TRANSFERRED: { label: "Transferido", color: "info" },
    PLANNED: { label: "Pré-matrícula", color: "secondary" },
  };

  const html = data
    .map((item) => {
      const st = statusMap[item.status] || { label: item.status, color: "secondary" };
      return `
        <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-inner">
            <div class="flex-grow-1 pe-2">
                <div class="fw-bold text-body text-truncate small">${item.student_name}</div>
                <span class="badge bg-${st.color}-subtle text-${st.color} rounded-pill px-2 py-0 fw-bold" style="font-size: 0.6rem;">${st.label}</span>
            </div>
            <div class="d-flex gap-1">
                <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="openHistory(${item.enrollment_id}, '${item.student_name.replace(/'/g, "\\'")}')" title="Linha do Tempo"><i class="fas fa-clock-rotate-left"></i></button>
                <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover Matrícula"><i class="fas fa-user-minus"></i></button>
            </div>
        </div>`;
    })
    .join("");

  container.html(html);
};

// =========================================================
// 3. AUXILIARES: SELECTS E PAGINAÇÃO
// =========================================================
const initSelects = () => {
  const selects = [
    { id: "#sel_course", val: "getCoursesList", ph: "Procurar curso..." },
    { id: "#sel_coordinator", val: "getCatechistsList", ph: "Procurar coordenador..." },
    { id: "#sel_assistant", val: "getCatechistsList", ph: "Procurar auxiliar..." },
    { id: "#sel_location", val: "getLocations", ph: "Sala padrão..." },
    { id: "#sel_location_sched", val: "getLocations", ph: "Sala específica..." },
    { id: "#sel_new_student", val: "getStudentsList", ph: "Buscar por nome ou CPF...", search: ["title", "tax_id"] },
  ];
  selects.forEach((s) => {
    if ($(s.id).length && !$(s.id)[0].selectize) {
      $(s.id).selectize({
        valueField: s.val === "getLocations" ? "location_id" : "id",
        labelField: s.val === "getLocations" ? "name" : "title",
        searchField: s.search || (s.val === "getLocations" ? "name" : "title"),
        placeholder: s.ph,
        preload: true,
        onInitialize: function () {
          this.$control.css({ border: "none", "background-color": "rgba(100, 116, 139, 0.1)", "border-radius": "10px", padding: "11px 14px", "font-size": "0.92rem", "font-weight": "600", "box-shadow": "inset 0 1px 2px rgba(0,0,0,0.05)" });
        },
        render: {
          option: (item, escape) =>
            `<div class="py-2 px-3 border-bottom border-secondary border-opacity-10"><div class="fw-bold text-body small">${escape(item.title || item.name)}</div>${item.tax_id ? `<div class="text-muted fw-medium" style="font-size: 0.65rem;">CPF: ${escape(item.tax_id)}</div>` : ""}</div>`,
        },
        load: (q, cb) => {
          $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: s.val, token: defaultApp.userInfo.token, search: q, limit: 50 }, success: (r) => cb(r.data), error: () => cb() });
        },
      });
    }
  });
};

// =========================================================
// 4. LÓGICA DE SALVAMENTO E MODAL
// =========================================================
window.modalTurma = (id = null, btn = false) => {
  if (btn) btn = $(btn);
  const modal = $("#modalTurma");
  $("#class_id").val("");
  $("#class_name").val("");
  $("#class_capacity").val("");
  $("#class_status").val("PLANNED");
  currentSchedules = [];
  ["#sel_course", "#sel_coordinator", "#sel_assistant", "#sel_location"].forEach((s) => {
    if ($(s)[0]?.selectize) $(s)[0].selectize.clear();
  });
  $("#lista-horarios").empty();
  $("#lista-alunos").html('<div class="text-center py-5 opacity-50 small">Salve a turma primeiro.</div>');

  if (id) {
    $("#modalLabel").html('<i class="fas fa-pen me-2 opacity-75"></i> Editar Turma');
    $("#alunos-tab").removeClass("disabled");
    loadClassData(id, btn);
  } else {
    $("#modalLabel").html('<i class="fas fa-screen-users me-2 opacity-75"></i> Configurar Turma');
    $("#alunos-tab").addClass("disabled");
    modal.modal("show");
  }
  const firstTab = new bootstrap.Tab(document.querySelector("#turmaTab button:first-child"));
  firstTab.show();
};

const loadClassData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const res = await window.ajaxValidator({ validator: "getClassById", token: defaultApp.userInfo.token, id });
    if (res.status) {
      const d = res.data;
      $("#class_id").val(d.class_id);
      $("#class_name").val(d.name);
      $("#class_capacity").val(d.max_capacity);
      $("#class_status").val(d.status);
      const updateSel = (selId, val, text) => {
        if (val) {
          const s = $(selId)[0].selectize;
          s.addOption({ id: val, title: text, location_id: val, name: text });
          s.setValue(val);
        }
      };
      updateSel("#sel_course", d.course_id, d.course_name_text || d.course_name);
      updateSel("#sel_coordinator", d.coordinator_id, d.coordinator_name_text || d.coordinator_name);
      updateSel("#sel_assistant", d.class_assistant_id, d.assistant_name_text || d.assistant_name);
      updateSel("#sel_location", d.main_location_id, d.location_name_text || d.location_name);

      currentSchedules = d.schedules || [];
      renderSchedulesTable();
      loadClassStudents(id);
      $("#modalTurma").modal("show");
    }
  } catch (e) {
    console.error(e);
  } finally {
    window.setButton(false, btn);
  }
};

window.salvarTurma = async (btn) => {
  const name = $("#class_name").val().trim();
  const course = $("#sel_course").val();
  const yearId = localStorage.getItem("sys_active_year");
  const orgId = localStorage.getItem("tf_active_parish");

  if (!name || !course || !yearId) return window.alertDefault("Preencha os campos obrigatórios.", "warning");
  if (!orgId) return window.alertDefault("Organização não definida na sessão.", "error");

  btn = $(btn);
  window.setButton(true, btn, " Gravando...");

  try {
    const res = await window.ajaxValidator({
      validator: "saveClass",
      token: defaultApp.userInfo.token,
      org_id: orgId,
      class_id: $("#class_id").val(),
      name: name,
      year_id: yearId,
      course_id: course,
      coordinator_id: $("#sel_coordinator").val(),
      class_assistant_id: $("#sel_assistant").val(),
      main_location_id: $("#sel_location").val(),
      max_capacity: $("#class_capacity").val(),
      status: $("#class_status").val(),
      schedules_json: JSON.stringify(currentSchedules),
    });

    if (res.status) {
      window.alertDefault("Salvo com sucesso!", "success");
      $("#modalTurma").modal("hide");
      getTurmas();
    } else {
      throw new Error(res.alert || "Falha na validação do servidor.");
    }
  } catch (e) {
    window.alertErrorWithSupport("Erro ao salvar", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.addSchedule = () => {
  const day = $("#sched_day").val();
  const start = $("#sched_start").val();
  const end = $("#sched_end").val();
  const locId = $("#sel_location_sched").val() || $("#sel_location").val();
  if (!start || !end) return window.alertDefault("Informe o horário.", "warning");

  currentSchedules.push({ day_of_week: parseInt(day), start_time: start, end_time: end, location_id: locId || null, location_name: $("#sel_location_sched")[0]?.selectize?.getItem($("#sel_location_sched").val())?.text() || "Sala Padrão" });
  renderSchedulesTable();
};

const renderSchedulesTable = () => {
  const container = $("#lista-horarios");
  if (currentSchedules.length === 0) {
    container.html('<div class="text-center py-3 opacity-50 small">Sem horários.</div>');
    return;
  }
  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const html = currentSchedules
    .map(
      (item, index) => `
    <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-inner">
        <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 42px; height: 42px; font-size: 0.75rem;">${days[item.day_of_week].substring(0, 3).toUpperCase()}</div>
            <div>
                <div class="fw-bold text-body small"><i class="far fa-clock me-1"></i> ${item.start_time.substring(0, 5)} — ${item.end_time.substring(0, 5)}</div>
                <div class="small text-muted fw-medium"><i class="fas fa-location-dot me-1"></i> ${item.location_name || "Local Turma"}</div>
            </div>
        </div>
        <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="currentSchedules.splice(${index}, 1); renderSchedulesTable();">
            <i class="fas fa-trash-can" style="font-size: 0.85rem;"></i>
        </button>
    </div>`,
    )
    .join("");
  container.html(html);
};

window.deleteTurma = (id) => {
  Swal.fire({ title: "Excluir?", text: "A turma irá para a lixeira.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33" }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await window.ajaxValidator({ validator: "deleteClass", token: defaultApp.userInfo.token, id });
        if (res.status) {
          window.alertDefault("Removida.", "success");
          getTurmas();
        }
      } catch (e) {
        console.error(e);
      }
    }
  });
};

window.deleteEnrollment = (id) => {
  Swal.fire({ title: "Remover Aluno?", text: "Desvincula o aluno desta turma.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33" }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteEnrollment", token: defaultApp.userInfo.token, id });
      if (res.status) {
        window.alertDefault("Removido.", "success");
        loadClassStudents($("#class_id").val());
        getTurmas();
      }
    }
  });
};

window.changePage = (p) => {
  defaultClass.currentPage = p;
  getTurmas();
};

const _generatePaginationButtons = (c, ck, tk, f, o) => {
  let container = $(`.${c}`);
  container.empty();
  let total = o[tk];
  let current = o[ck];
  if (total <= 1) return;
  let html = `<button onclick="${f}(1)" class="btn btn-sm btn-secondary me-1 shadow-sm" ${current === 1 ? "disabled" : ""}>Primeira</button>`;
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    html += `<button onclick="${f}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"} me-1 shadow-sm">${p}</button>`;
  }
  html += `<button onclick="${f}(total)" class="btn btn-sm btn-secondary shadow-sm" ${current === total ? "disabled" : ""}>Última</button>`;
  container.html(html);
};
