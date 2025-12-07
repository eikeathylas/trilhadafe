const defaultClass = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado local para horários (Grade Horária)
let currentSchedules = [];

// =========================================================
// 1. LISTAGEM DE TURMAS
// =========================================================

const getTurmas = async () => {
  try {
    const page = Math.max(0, defaultClass.currentPage - 1);
    const search = $("#busca-texto").val();
    const year = $("#filtro-ano").val();

    // Feedback visual
    $(".list-table-turmas").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await window.ajaxValidator({
      validator: "getClasses",
      token: defaultApp.userInfo.token,
      limit: defaultClass.rowsPerPage,
      page: page * defaultClass.rowsPerPage,
      search: search,
      year: year,
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultClass.totalPages = Math.max(1, Math.ceil(total / defaultClass.rowsPerPage));
      renderTableClasses(result.data || []);
    } else {
      $(".list-table-turmas").html('<p class="text-center py-4 text-muted">Nenhuma turma encontrada.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-turmas").html('<p class="text-center py-4 text-danger">Erro ao carregar dados.</p>');
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
    return;
  }

  let rows = data
    .map((item) => {
      // Avatar do Coordenador
      let avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border small fw-bold" style="width:32px; height:32px;">?</div>`;
      if (item.coordinator_photo) {
        avatarHtml = `<img src="${item.coordinator_photo}" class="rounded-circle border" style="width:32px; height:32px; object-fit:cover;">`;
      } else if (item.coordinator_name) {
        const ini = item.coordinator_name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle bg-info bg-opacity-10 text-info border border-info d-flex align-items-center justify-content-center fw-bold" style="width:32px; height:32px; font-size:12px">${ini}</div>`;
      }

      // Progresso de Vagas
      const enrolled = parseInt(item.enrolled_count || 0);
      const cap = parseInt(item.max_capacity || 0);
      let progressHtml = '<small class="text-muted">Ilimitado</small>';

      if (cap > 0) {
        const percent = Math.min(100, Math.round((enrolled / cap) * 100));
        let color = "bg-success";
        if (percent >= 80) color = "bg-warning";
        if (percent >= 100) color = "bg-danger";

        progressHtml = `
                <div class="progress" style="height: 6px; width: 100px;" title="${enrolled}/${cap} Matriculados">
                    <div class="progress-bar ${color}" role="progressbar" style="width: ${percent}%"></div>
                </div>
                <small class="text-muted" style="font-size:11px">${enrolled} / ${cap}</small>
            `;
      }

      // Toggle Seguro
      const toggleHtml = window.renderToggle ? window.renderToggle(item.class_id, item.status === "ACTIVE", "toggleTurma") : `<input type="checkbox" ${item.status === "ACTIVE" ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)">`;

      return `
        <tr>
            <td class="text-center align-middle" style="width: 50px;">
                <div class="icon-circle bg-light text-primary">
                    <span class="material-symbols-outlined">group</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.name}</div>
                <small class="text-muted">${item.year_cycle} • <span class="text-primary">${item.course_name}</span></small>
            </td>
            <td class="align-middle">
                <div class="d-flex align-items-center gap-2">
                    ${avatarHtml}
                    <span class="small text-dark">${item.coordinator_name || "Sem coord."}</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="text-dark small"><i class="fas fa-clock me-1 text-muted"></i> ${item.schedule_summary || "-"}</div>
                <div class="text-muted small"><i class="fas fa-map-marker-alt me-1"></i> ${item.location_name || "Local não def."}</div>
            </td>
            <td class="text-center align-middle">
                <div class="d-flex flex-column align-items-center">
                    ${progressHtml}
                </div>
            </td>
            <td class="text-center align-middle">
                ${toggleHtml}
            </td>
            <td class="text-end align-middle pe-3">
                <button onclick="openAudit('education.classes', ${item.class_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalTurma(${item.class_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteTurma(${item.class_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th colspan="2">Turma</th><th>Coordenação</th><th>Horário / Local</th><th class="text-center">Vagas</th><th class="text-center">Ativa</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);

  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "getTurmas", defaultClass);
};

// =========================================================
// 2. CADASTRO E EDIÇÃO
// =========================================================

window.modalTurma = (id = null) => {
  const modal = $("#modalTurma");

  // Reseta Form
  $("#class_id").val("");
  $("#class_name").val("");
  $("#class_year").val(new Date().getFullYear());
  $("#class_capacity").val("");
  $("#class_status").val("PLANNED");

  // Reseta Selects
  if ($("#sel_course")[0]?.selectize) $("#sel_course")[0].selectize.clear();
  if ($("#sel_coordinator")[0]?.selectize) $("#sel_coordinator")[0].selectize.clear();
  if ($("#sel_location")[0]?.selectize) $("#sel_location")[0].selectize.clear();

  // Reseta Horários
  currentSchedules = [];
  renderSchedulesTable();
  $("#sched_start").val("");
  $("#sched_end").val("");
  $("#sched_day").val("6");

  // Reseta Aba de Alunos (Bloqueia se for novo)
  $("#lista-alunos").html('<tr><td colspan="5" class="text-center text-muted py-4">Salve a turma para gerenciar alunos.</td></tr>');
  if ($("#sel_new_student")[0]?.selectize) $("#sel_new_student")[0].selectize.clear();

  if (id) {
    $("#alunos-tab").removeClass("disabled");
  } else {
    $("#alunos-tab").addClass("disabled"); // Bloqueia aba alunos
  }

  // Abas
  $("#turmaTab button:first").tab("show");

  // Inicia selects (Se ainda não foram)
  initSelects();

  if (id) {
    loadClassData(id);
  } else {
    $("#modalLabel").text("Nova Turma");
    modal.modal("show");
  }
};

const loadClassData = async (id) => {
  try {
    const result = await window.ajaxValidator({ validator: "getClassById", token: defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#class_id").val(d.class_id);
      $("#class_name").val(d.name);
      $("#class_year").val(d.year_cycle);
      $("#class_capacity").val(d.max_capacity);
      $("#class_status").val(d.status);

      if ($("#sel_course")[0]?.selectize) $("#sel_course")[0].selectize.setValue(d.course_id);
      if ($("#sel_coordinator")[0]?.selectize) $("#sel_coordinator")[0].selectize.setValue(d.coordinator_id);
      if ($("#sel_location")[0]?.selectize) $("#sel_location")[0].selectize.setValue(d.main_location_id);

      currentSchedules = d.schedules || [];
      renderSchedulesTable();

      // Carrega Alunos
      loadClassStudents(id);

      $("#modalLabel").text("Editar Turma");
      $("#modalTurma").modal("show");
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao carregar.", "error");
  }
};

// =========================================================
// 3. GRADE HORÁRIA (ABA 2)
// =========================================================

window.addSchedule = () => {
  const day = $("#sched_day").val();
  const start = $("#sched_start").val();
  const end = $("#sched_end").val();
  let locId = $("#sel_location").val();

  if (!start || !end) return window.alertDefault("Informe horários.", "warning");

  currentSchedules.push({
    week_day: parseInt(day),
    start_time: start,
    end_time: end,
    location_id: locId || null,
  });

  renderSchedulesTable();
};

window.removeSchedule = (index) => {
  currentSchedules.splice(index, 1);
  renderSchedulesTable();
};

const renderSchedulesTable = () => {
  const container = $("#lista-horarios");
  container.empty();

  if (currentSchedules.length === 0) {
    container.html('<tr><td colspan="4" class="text-center text-muted py-3">Nenhum horário definido.</td></tr>');
    return;
  }

  const daysMap = { 0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado" };

  currentSchedules.forEach((item, index) => {
    container.append(`
            <tr>
                <td>${daysMap[item.week_day]}</td>
                <td>${item.start_time} - ${item.end_time}</td>
                <td><small class="text-muted">Padrão</small></td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="removeSchedule(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `);
  });
};

// =========================================================
// 4. ALUNOS E MATRÍCULAS (ABA 3)
// =========================================================

const loadClassStudents = async (classId) => {
  const container = $("#lista-alunos");
  container.html('<tr><td colspan="5" class="text-center py-3"><span class="loader"></span></td></tr>');

  try {
    const result = await window.ajaxValidator({
      validator: "getClassStudents",
      token: defaultApp.userInfo.token,
      class_id: classId,
    });

    if (result.status && result.data.length > 0) {
      renderStudentsList(result.data);
    } else {
      container.html('<tr><td colspan="5" class="text-center text-muted py-4">Nenhum aluno matriculado nesta turma.</td></tr>');
    }
  } catch (e) {
    container.html('<tr><td colspan="5" class="text-center text-danger">Erro ao carregar alunos.</td></tr>');
  }
};

const renderStudentsList = (data) => {
  const container = $("#lista-alunos");
  container.empty();

  const statusMap = {
    ACTIVE: { l: "Ativo", c: "success" },
    SUSPENDED: { l: "Suspenso", c: "warning" },
    DROPPED: { l: "Desistente", c: "danger" },
    COMPLETED: { l: "Concluído", c: "primary" },
    TRANSFERRED: { l: "Transferido", c: "info" },
    PLANNED: { l: "Pré-matrícula", c: "secondary" },
  };

  data.forEach((item) => {
    const st = statusMap[item.status] || { l: item.status, c: "secondary" };

    container.append(`
            <tr>
                <td class="fw-bold">${item.student_name}</td>
                <td>${item.enrollment_date_fmt}</td>
                <td class="text-center"><span class="badge bg-${st.c}">${st.l}</span></td>
                <td class="text-center">${item.final_grade || "-"}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-primary" onclick="openHistory(${item.enrollment_id}, '${item.student_name}')" title="Histórico e Status">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover Matrícula">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `);
  });
};

window.matricularAluno = async () => {
  const classId = $("#class_id").val();
  const studentId = $("#sel_new_student").val();

  if (!classId) return window.alertDefault("Salve a turma antes de matricular.", "warning");
  if (!studentId) return window.alertDefault("Selecione um aluno.", "warning");

  try {
    const result = await window.ajaxValidator({
      validator: "enrollStudent",
      token: defaultApp.userInfo.token,
      class_id: classId,
      student_id: studentId,
    });

    if (result.status) {
      window.alertDefault("Aluno matriculado!", "success");
      $("#sel_new_student")[0].selectize.clear();
      loadClassStudents(classId);
      getTurmas(); // Atualiza contador na lista principal
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao matricular.", "error");
  }
};

// =========================================================
// 5. HISTÓRICO DE MATRÍCULA (MODAL)
// =========================================================

window.openHistory = (enrollmentId, studentName) => {
  $("#modalHistoricoAluno").modal("show");
  $("#hist_student_name").text(studentName);
  $("#hist_enrollment_id").val(enrollmentId);
  $("#hist_obs").val("");
  $("#hist_action").val("COMMENT");

  loadEnrollmentHistory(enrollmentId);
};

const loadEnrollmentHistory = async (enrollmentId) => {
  const container = $("#lista-historico-detalhe");
  container.html('<tr><td colspan="5" class="text-center"><span class="loader"></span></td></tr>');

  try {
    const result = await window.ajaxValidator({
      validator: "getEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: enrollmentId,
    });

    container.empty();

    if (result.status && result.data.length > 0) {
      const actionMap = {
        ENROLLED: "Matrícula Inicial",
        ACTIVE: "Reativação",
        SUSPENDED: "Suspensão",
        DROPPED: "Desistência",
        TRANSFERRED: "Transferência",
        COMPLETED: "Conclusão",
        COMMENT: "Anotação",
      };

      result.data.forEach((h) => {
        container.append(`
                    <tr>
                        <td class="fw-bold small">${actionMap[h.action_type] || h.action_type}</td>
                        <td class="small">${h.action_date_fmt}</td>
                        <td class="small">${h.observation || "-"}</td>
                        <td class="small text-muted">${h.user_name}</td>
                        <td class="text-center">
                            <button class="btn btn-xs btn-link text-danger p-0" onclick="deleteHistoryItem(${h.history_id}, ${enrollmentId})">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>
                `);
      });
    } else {
      container.html('<tr><td colspan="5" class="text-center text-muted">Sem histórico registrado.</td></tr>');
    }
  } catch (e) {
    console.error(e);
  }
};

window.addHistoryItem = async () => {
  const enrollmentId = $("#hist_enrollment_id").val();
  const action = $("#hist_action").val();
  const obs = $("#hist_obs").val().trim();

  if (!obs && action === "COMMENT") return window.alertDefault("Escreva uma observação.", "warning");

  try {
    const result = await window.ajaxValidator({
      validator: "addEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: enrollmentId,
      action_type: action,
      observation: obs,
    });

    if (result.status) {
      window.alertDefault("Registro adicionado.", "success");
      loadEnrollmentHistory(enrollmentId);
      if (action !== "COMMENT") loadClassStudents($("#class_id").val());
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao registrar.", "error");
  }
};

window.deleteHistoryItem = async (historyId, enrollmentId) => {
  Swal.fire({
    title: "Apagar registro?",
    text: "Isso apaga o log, mas não reverte a mudança de status.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Apagar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteEnrollmentHistory", token: defaultApp.userInfo.token, id: historyId });
      if (res.status) loadEnrollmentHistory(enrollmentId);
    }
  });
};

window.deleteEnrollment = (id) => {
  Swal.fire({
    title: "Cancelar Matrícula?",
    text: "O aluno será removido desta turma. Histórico vai para lixeira.",
    icon: "error",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim, remover",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteEnrollment", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Matrícula removida.", "success");
        loadClassStudents($("#class_id").val());
        getTurmas();
      }
    }
  });
};

// =========================================================
// 6. SALVAR TURMA (GERAL)
// =========================================================

window.salvarTurma = async () => {
  const name = $("#class_name").val().trim();
  const course = $("#sel_course").val();

  if (!name || !course) return window.alertDefault("Nome e Curso são obrigatórios.", "warning");

  const btn = $(".btn-save");
  window.setButton(true, btn, "Salvando...");

  const data = {
    class_id: $("#class_id").val(),
    name: name,
    year_cycle: $("#class_year").val(),
    course_id: course,
    coordinator_id: $("#sel_coordinator").val(),
    main_location_id: $("#sel_location").val(),
    max_capacity: $("#class_capacity").val(),
    status: $("#class_status").val(),

    schedules_json: JSON.stringify(currentSchedules),
  };

  try {
    const result = await window.ajaxValidator({
      validator: "saveClass",
      token: defaultApp.userInfo.token,
      data: data,
    });

    if (result.status) {
      window.alertDefault("Turma salva com sucesso!", "success");
      $("#modalTurma").modal("hide");
      getTurmas();
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao salvar.", "error");
  } finally {
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar');
  }
};

window.toggleTurma = async (id, element) => {
  if (window.handleToggle) {
    window.handleToggle("toggleClass", id, element, "Status atualizado.");
  } else {
    const $chk = $(element);
    try {
      await window.ajaxValidator({ validator: "toggleClass", token: defaultApp.userInfo.token, id: id, active: $chk.is(":checked") });
      window.alertDefault("Atualizado.");
    } catch (e) {
      $chk.prop("checked", !$chk.is(":checked"));
    }
  }
};

window.deleteTurma = (id) => {
  Swal.fire({
    title: "Excluir Turma?",
    text: "Vai para a lixeira.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteClass", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Excluído.", "success");
        getTurmas();
      } else {
        window.alertDefault(res.alert, "error");
      }
    }
  });
};

// =========================================================
// UTILITÁRIOS
// =========================================================

const initSelects = () => {
  if (!$("#sel_course")[0].selectize) {
    $("#sel_course").selectize({
      valueField: "id",
      labelField: "title",
      searchField: "title",
      placeholder: "Selecione o Curso...",
      preload: true,
      load: function (q, cb) {
        $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: "getCoursesList", token: defaultApp.userInfo.token, search: q }, success: (r) => cb(r.data), error: () => cb() });
      },
    });
  }

  if (!$("#sel_coordinator")[0].selectize) {
    $("#sel_coordinator").selectize({
      valueField: "id",
      labelField: "title",
      searchField: "title",
      placeholder: "Busque o catequista...",
      load: function (q, cb) {
        if (!q.length) return cb();
        $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: "getCatechistsList", token: defaultApp.userInfo.token, search: q }, success: (r) => cb(r.data), error: () => cb() });
      },
    });
  }

  if (!$("#sel_location")[0].selectize) {
    $("#sel_location").selectize({
      valueField: "location_id",
      labelField: "name",
      searchField: "name",
      placeholder: "Sala Principal...",
      preload: true,
      load: function (q, cb) {
        $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: "getLocations", token: defaultApp.userInfo.token, limit: 50 }, success: (r) => cb(r.data), error: () => cb() });
      },
    });
  }

  if (!$("#sel_new_student")[0].selectize) {
    $("#sel_new_student").selectize({
      valueField: "id",
      labelField: "title",
      searchField: ["title", "tax_id"],
      placeholder: "Busque o aluno...",
      load: function (q, cb) {
        if (!q.length) return cb();
        $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: "getStudentsList", token: defaultApp.userInfo.token, search: q }, success: (r) => cb(r.data), error: () => cb() });
      },
    });
  }
};

$("#busca-texto, #filtro-ano").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultClass.currentPage = 1;
    getTurmas();
  }, 500);
});

window.changePage = (page) => {
  defaultClass.currentPage = page;
  getTurmas();
};
window.getTurmas = getTurmas;

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();
  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];
  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary">Primeira</button>`;
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"}">${p}</button>`;
  }
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary">Última</button>`;
  container.html(html);
};

$(document).ready(() => {
  getTurmas();
});
