// =========================================================
// GESTÃO DE TURMAS - PADRÃO OURO V3.0 (GLOBAL YEAR AWARE)
// =========================================================

const defaultClass = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentSchedules = [];

$(document).ready(() => {
  initSelects();

  // Busca textual
  $("#busca-texto").on("keyup", function () {
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      defaultClass.currentPage = 1;
      getTurmas();
    }, 500);
  });

  // LISTENER GLOBAL: Quando o Ano mudar no Sidebar
  window.addEventListener("yearChanged", () => {
    defaultClass.currentPage = 1;
    getTurmas();
  });
});

// =========================================================
// 2. LISTAGEM (COM FILTRO GLOBAL)
// =========================================================
const getTurmas = async () => {
  try {
    const page = Math.max(0, defaultClass.currentPage - 1);
    const search = $("#busca-texto").val();

    // --- MUDANÇA CRÍTICA: LÊ DO LOCALSTORAGE (MENU LATERAL) ---
    const year = localStorage.getItem("sys_active_year");

    if (!year) {
      $(".list-table-turmas").html('<div class="text-center py-5 text-muted"><i class="fas fa-arrow-left fa-2x mb-3 opacity-25"></i><p>Selecione um Ano Letivo no menu lateral.</p></div>');
      return;
    }

    $(".list-table-turmas").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await window.ajaxValidator({
      validator: "getClasses",
      token: defaultApp.userInfo.token,
      limit: defaultClass.rowsPerPage,
      page: page * defaultClass.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
      year: year,
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultClass.totalPages = Math.max(1, Math.ceil(total / defaultClass.rowsPerPage));
      renderTableClasses(result.data || []);
    } else {
      $(".list-table-turmas").html('<div class="text-center py-5 text-muted"><i class="fas fa-chalkboard fa-3x mb-3 opacity-25"></i><p>Nenhuma turma encontrada neste ano.</p></div>');
    }
  } catch (e) {
    $(".list-table-turmas").html('<p class="text-center py-4 text-danger">Erro ao carregar dados.</p>');
  }
};

const renderTableClasses = (data) => {
  const container = $(".list-table-turmas");

  if (data.length === 0) {
    container.html('<div class="text-center py-5 text-muted"><p>Nenhuma turma encontrada.</p></div>');
    return;
  }

  let rows = data
    .map((item) => {
      let avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border small fw-bold" style="width:32px; height:32px;">?</div>`;
      if (item.coordinator_photo) {
        avatarHtml = `<img src="${item.coordinator_photo}" class="rounded-circle border" style="width:32px; height:32px; object-fit:cover;">`;
      } else if (item.coordinator_name) {
        const ini = item.coordinator_name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle bg-primary bg-opacity-10 text-primary border border-primary-subtle d-flex align-items-center justify-content-center fw-bold" style="width:32px; height:32px; font-size:12px">${ini}</div>`;
      }

      const enrolled = parseInt(item.enrolled_count || 0);
      const cap = parseInt(item.max_capacity || 0);
      let progressHtml = '<span class="badge bg-light text-dark border">Ilimitado</span>';

      if (cap > 0) {
        const percent = Math.min(100, Math.round((enrolled / cap) * 100));
        let color = "bg-success";
        if (percent >= 80) color = "bg-warning";
        if (percent >= 100) color = "bg-danger";

        progressHtml = `
            <div style="width:100px">
                <div class="d-flex justify-content-between small text-muted mb-1">
                    <span>${enrolled}/${cap}</span>
                    <span>${percent}%</span>
                </div>
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar ${color}" role="progressbar" style="width: ${percent}%"></div>
                </div>
            </div>`;
      }

      const isActive = item.is_active === true || item.is_active === "t";
      const toggleHtml = window.renderToggle ? window.renderToggle(item.class_id, isActive, "toggleTurma") : `<input type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)">`;

      return `
        <tr>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.name}</div>
                <div class="small text-primary"><i class="fas fa-calendar-alt me-1"></i> ${item.year_name || "-"} | <i class="fas fa-graduation-cap me-1"></i> ${item.course_name}</div>
            </td>
            <td class="align-middle">
                <div class="d-flex align-items-center gap-2">
                    ${avatarHtml}
                    <span class="small text-dark">${item.coordinator_name || "Sem coordenador"}</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="d-flex flex-column gap-1">
                    <span class="badge bg-light text-dark border w-auto text-start"><i class="fas fa-clock me-2 text-muted"></i> ${item.schedule_summary || "Sem horário"}</span>
                    <span class="badge bg-light text-dark border w-auto text-start"><i class="fas fa-map-marker-alt me-2 text-muted"></i> ${item.location_name || "Sem local"}</span>
                </div>
            </td>
            <td class="text-center align-middle">${progressHtml}</td>
            <td class="text-center align-middle">${toggleHtml}</td>
            <td class="text-end align-middle pe-3">
                <button onclick="openAudit('education.classes', ${item.class_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalTurma(${item.class_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteTurma(${item.class_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th>Turma / Curso</th><th>Coordenação</th><th>Horário / Local</th><th class="text-center">Lotação</th><th class="text-center">Ativa</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);

  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "getTurmas", defaultClass);
};

// ... (RESTO DAS FUNÇÕES: modalTurma, loadClassData, addSchedule, saveTurma, etc. MANTIDAS IGUAIS AO ARQUIVO ORIGINAL) ...
// Certifique-se de manter o restante do arquivo JS original abaixo desta linha.

// =========================================================
// 3. CADASTRO E EDIÇÃO
// =========================================================

window.modalTurma = (id = null) => {
  const modal = $("#modalTurma");

  $("#class_id").val("");
  $("#class_name").val("");
  $("#class_capacity").val("");
  $("#class_status").val("PLANNED");

  // Limpa Selects (Com verificação de existência)
  if ($("#sel_course")[0]?.selectize) $("#sel_course")[0].selectize.clear();
  if ($("#sel_coordinator")[0]?.selectize) $("#sel_coordinator")[0].selectize.clear();
  if ($("#sel_assistant")[0]?.selectize) $("#sel_assistant")[0].selectize.clear();
  if ($("#sel_location")[0]?.selectize) $("#sel_location")[0].selectize.clear();

  currentSchedules = [];
  renderSchedulesTable();
  $("#lista-alunos").html('<tr><td colspan="5" class="text-center text-muted py-4">Salve a turma para gerenciar alunos.</td></tr>');

  if (id) {
    $("#alunos-tab").removeClass("disabled");
    loadClassData(id);
  } else {
    $("#alunos-tab").addClass("disabled");
    $("#modalLabel").text("Nova Turma");
    modal.modal("show");
  }

  $("#turmaTab button:first").tab("show");
};

const loadClassData = async (id) => {
  try {
    const result = await window.ajaxValidator({ validator: "getClassById", token: defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#class_id").val(d.class_id);
      $("#class_name").val(d.name);
      $("#class_capacity").val(d.max_capacity);
      $("#class_status").val(d.status);

      // INJEÇÃO MANUAL DE OPÇÕES (Fix Amnesia)
      if (d.course_id && d.course_name_text) {
        const sel = $("#sel_course")[0].selectize;
        sel.addOption({ id: d.course_id, title: d.course_name_text });
        sel.setValue(d.course_id);
      }

      if (d.coordinator_id && d.coordinator_name_text) {
        const sel = $("#sel_coordinator")[0].selectize;
        sel.addOption({ id: d.coordinator_id, title: d.coordinator_name_text });
        sel.setValue(d.coordinator_id);
      }

      if (d.class_assistant_id && d.assistant_name_text) {
        const sel = $("#sel_assistant")[0].selectize;
        sel.addOption({ id: d.class_assistant_id, title: d.assistant_name_text });
        sel.setValue(d.class_assistant_id);
      }

      if (d.main_location_id && d.location_name_text) {
        const sel = $("#sel_location")[0].selectize;
        sel.addOption({ location_id: d.main_location_id, name: d.location_name_text });
        sel.setValue(d.main_location_id);
      }

      currentSchedules = d.schedules || [];
      renderSchedulesTable();
      loadClassStudents(id);

      $("#modalLabel").text("Editar Turma");
      $("#modalTurma").modal("show");
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao carregar dados.", "error");
  }
};

// =========================================================
// 4. GRADE HORÁRIA
// =========================================================

window.addSchedule = () => {
  const day = $("#sched_day").val();
  const start = $("#sched_start").val();
  const end = $("#sched_end").val();

  // Herança de Sala
  let locId = $("#sel_location_sched").val();
  if (!locId) {
    locId = $("#sel_location").val();
  }

  if (!start || !end) return window.alertDefault("Informe horários.", "warning");

  currentSchedules.push({
    day_of_week: parseInt(day),
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
    const st = item.start_time.substring(0, 5);
    const et = item.end_time.substring(0, 5);
    const locLabel = item.location_id ? "Sala da Turma" : "Padrão";

    container.append(`
            <tr>
                <td>${daysMap[item.day_of_week]}</td>
                <td>${st} - ${et}</td>
                <td><small class="text-muted">${locLabel}</small></td>
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
// 5. SALVAR TURMA
// =========================================================

window.salvarTurma = async () => {
  const name = $("#class_name").val().trim();
  const course = $("#sel_course").val();
  const yearId = localStorage.getItem("sys_active_year");

  if (!name) return window.alertDefault("Nome da turma é obrigatório.", "warning");
  if (!course) return window.alertDefault("Selecione um curso.", "warning");
  if (!yearId) return window.alertDefault("Selecione o ano letivo.", "warning");

  const btn = $(".btn-save");
  window.setButton(true, btn, "Salvando...");

  const data = {
    class_id: $("#class_id").val(),
    name: name,
    academic_year_id: yearId,
    course_id: course,
    coordinator_id: $("#sel_coordinator").val(),
    class_assistant_id: $("#sel_assistant").val(),
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
      org_id: localStorage.getItem("tf_active_parish"),
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

// =========================================================
// 6. MATRÍCULAS E ALUNOS
// =========================================================

const loadClassStudents = async (classId) => {
  const container = $("#lista-alunos");
  try {
    const result = await window.ajaxValidator({ validator: "getClassStudents", token: defaultApp.userInfo.token, class_id: classId });

    if (result.status && result.data.length > 0) {
      container.empty();
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
                    <button class="btn btn-sm btn-outline-primary" onclick="openHistory(${item.enrollment_id}, '${item.student_name}')" title="Histórico"><i class="fas fa-history"></i></button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover"><i class="fas fa-trash"></i></button>
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
    const result = await window.ajaxValidator({ validator: "enrollStudent", token: defaultApp.userInfo.token, class_id: classId, student_id: studentId });

    if (result.status) {
      window.alertDefault("Aluno matriculado!", "success");
      $("#sel_new_student")[0].selectize.clear();
      loadClassStudents(classId);
      getTurmas(); // Atualiza contador na tabela
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao matricular.", "error");
  }
};

window.deleteEnrollment = (id) => {
  Swal.fire({
    title: "Remover Aluno?",
    text: "O aluno será desvinculado desta turma.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim, remover",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteEnrollment", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Removido.", "success");
        loadClassStudents($("#class_id").val());
        getTurmas();
      } else {
        window.alertDefault(res.alert, "error");
      }
    }
  });
};

// =========================================================
// 7. HISTÓRICO DE MATRÍCULA
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
  container.html('<tr><td colspan="5" class="text-center py-3"><span class="loader-sm"></span> Carregando...</td></tr>');

  try {
    const result = await window.ajaxValidator({
      validator: "getEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: enrollmentId,
    });

    if (result.status && result.data.length > 0) {
      let rows = "";
      const actionMap = {
        ENROLLED: { t: "Matrícula Inicial", c: "success" },
        SUSPENDED: { t: "Suspensão", c: "warning" },
        DROPPED: { t: "Desistência", c: "danger" },
        TRANSFERRED: { t: "Transferência", c: "info" },
        ACTIVE: { t: "Reativação", c: "success" },
        COMPLETED: { t: "Conclusão", c: "primary" },
        COMMENT: { t: "Observação", c: "secondary" },
      };

      result.data.forEach((item) => {
        const act = actionMap[item.action_type] || { t: item.action_type, c: "secondary" };
        rows += `
                    <tr>
                        <td><span class="badge bg-${act.c}">${act.t}</span></td>
                        <td><small>${item.action_date_fmt}</small></td>
                        <td>${item.observation || "-"}</td>
                        <td><small class="text-muted">${item.user_name}</small></td>
                        <td class="text-center">
                            <button class="btn btn-xs text-danger" onclick="deleteHistoryItem(${item.history_id}, ${enrollmentId})" title="Apagar registro">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
      });
      container.html(rows);
    } else {
      container.html('<tr><td colspan="5" class="text-center text-muted py-3">Nenhum registro encontrado.</td></tr>');
    }
  } catch (e) {
    container.html('<tr><td colspan="5" class="text-center text-danger">Erro ao carregar histórico.</td></tr>');
  }
};

window.addHistoryItem = async () => {
  const eid = $("#hist_enrollment_id").val();
  const action = $("#hist_action").val();
  const obs = $("#hist_obs").val();

  if (!eid) return;
  if (!obs && action === "COMMENT") return window.alertDefault("Digite uma observação.", "warning");

  try {
    const result = await window.ajaxValidator({
      validator: "addEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: eid,
      action_type: action,
      observation: obs,
    });

    if (result.status) {
      $("#hist_obs").val("");
      loadEnrollmentHistory(eid);
      // Atualiza a lista de alunos atrás do modal para refletir novo status
      if ($("#class_id").val()) loadClassStudents($("#class_id").val());
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro ao salvar.", "error");
  }
};

window.deleteHistoryItem = (historyId, enrollmentId) => {
  Swal.fire({
    title: "Apagar registro?",
    text: "Isso não desfaz a mudança de status, apenas remove o log.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Apagar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      await window.ajaxValidator({
        validator: "deleteEnrollmentHistory",
        token: defaultApp.userInfo.token,
        id: historyId,
      });
      loadEnrollmentHistory(enrollmentId);
    }
  });
};

// =========================================================
// 8. HELPERS E INICIALIZAÇÃO (BLINDAGEM DO UNDEFINED)
// =========================================================

const initSelects = () => {
  const selects = [
    { id: "#sel_course", val: "getCoursesList", ph: "Selecione o Curso..." },
    { id: "#sel_coordinator", val: "getCatechistsList", ph: "Busque o catequista..." },
    { id: "#sel_assistant", val: "getCatechistsList", ph: "Busque o auxiliar..." },
    { id: "#sel_location", val: "getLocations", ph: "Sala Principal..." },
    { id: "#sel_location_sched", val: "getLocations", ph: "Sala Específica..." },
    { id: "#sel_new_student", val: "getStudentsList", ph: "Busque o aluno...", search: ["title", "tax_id"] },
  ];

  selects.forEach((s) => {
    // CORREÇÃO CRÍTICA: Verifica se o elemento EXISTE (length > 0) ANTES de inicializar
    if ($(s.id).length && !$(s.id)[0].selectize) {
      $(s.id).selectize({
        valueField: s.val === "getLocations" ? "location_id" : "id",
        labelField: s.val === "getLocations" ? "name" : "title",
        searchField: s.search || (s.val === "getLocations" ? "name" : "title"),
        placeholder: s.ph,
        preload: true,
        load: function (q, cb) {
          $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: s.val, token: defaultApp.userInfo.token, search: q, limit: 50 }, success: (r) => cb(r.data), error: () => cb() });
        },
      });
    }
  });
};

window.toggleTurma = async (id, element) => {
  const $chk = $(element);
  try {
    await window.ajaxValidator({ validator: "toggleClass", token: defaultApp.userInfo.token, id: id, active: $chk.is(":checked") });
    window.alertDefault("Status atualizado.");
  } catch (e) {
    $chk.prop("checked", !$chk.is(":checked"));
  }
};

window.deleteTurma = (id) => {
  Swal.fire({
    title: "Excluir Turma?",
    text: "Isso não apaga o histórico dos alunos, mas remove a turma da lista.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim, excluir",
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

window.changePage = (page) => {
  defaultClass.currentPage = page;
  getTurmas();
};

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
