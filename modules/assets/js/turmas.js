// =========================================================
// GESTÃO DE TURMAS - PADRÃO OURO V3.0 (GLOBAL YEAR AWARE)
// =========================================================

const defaultClass = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentSchedules = [];

window.toggleTurma = (id, element) => handleToggle("toggleClass", id, element, "Status atualizado.", `.status-text-turma-${id}`);

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

const getTurmas = async () => {
  try {
    const page = Math.max(0, defaultClass.currentPage - 1);
    const search = $("#busca-texto").val();
    const year = localStorage.getItem("sys_active_year");

    // 1. Validação de Ano Letivo
    if (!year) {
      $(".list-table-turmas").html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1">event_busy</span>
            <p class="mt-3 fw-medium text-body">Selecione um Ano Letivo no menu lateral.</p>
        </div>
      `);
      return;
    }

    // 3. Chamada à API
    const result = await window.ajaxValidator({
      validator: "getClasses",
      token: defaultApp.userInfo.token,
      limit: defaultClass.rowsPerPage,
      page: page * defaultClass.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
      year: year,
    });

    // 4. Tratamento do Resultado
    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultClass.totalPages = Math.max(1, Math.ceil(total / defaultClass.rowsPerPage));
      renderTableClasses(result.data || []);
    } else {
      throw new Error(result.alert || "Erro ao obter turmas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha ao conectar com o servidor para buscar as turmas.";
    $(".list-table-turmas").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getTurmas()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Turmas", errorMessage);
  }
};

const renderTableClasses = (data) => {
  const container = $(".list-table-turmas");

  if (data.length === 0) {
    container.html('<div class="text-center py-5 text-muted"><p>Nenhuma turma encontrada.</p></div>');
    return;
  }

  // Helper para barra de progresso (Reutilizável)
  const getProgressHtml = (enrolled, cap) => {
    if (!cap || parseInt(cap) === 0) return '<span class="badge bg-light text-dark border">Ilimitado</span>';

    const e = parseInt(enrolled || 0);
    const c = parseInt(cap);
    const percent = Math.min(100, Math.round((e / c) * 100));

    let color = "bg-success";
    if (percent >= 80) color = "bg-warning";
    if (percent >= 100) color = "bg-danger";

    return `
        <div class="w-100" style="max-width: 120px;">
            <div class="d-flex justify-content-between small text-muted mb-1">
                <span>${e}/${c}</span>
                <span>${percent}%</span>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar ${color}" role="progressbar" style="width: ${percent}%"></div>
            </div>
        </div>`;
  };

  // Helper Toggle Desktop
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleTurma(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
    </div>`;
  };

  // Helper Toggle Mobile
  const getMobileToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex flex-column align-items-end">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleTurma(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-turma-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA)
  // =========================================================
  let desktopRows = data
    .map((item) => {
      // Avatar do Coordenador
      let avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border small fw-bold" style="width:32px; height:32px;">?</div>`;
      if (item.coordinator_photo) {
        avatarHtml = `<img src="${item.coordinator_photo}" class="rounded-circle border" style="width:32px; height:32px; object-fit:cover;">`;
      } else if (item.coordinator_name) {
        const ini = item.coordinator_name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle bg-primary bg-opacity-10 text-primary border border-primary-subtle d-flex align-items-center justify-content-center fw-bold" style="width:32px; height:32px; font-size:12px">${ini}</div>`;
      }

      const isActive = item.is_active === true || item.is_active === "t";

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
            <td class="text-center align-middle d-flex justify-content-center">${getProgressHtml(item.enrolled_count, item.max_capacity)}</td>
            <td class="text-center align-middle">
                ${getToggleHtml(item.class_id, isActive)}
            </td>
            <td class="text-end align-middle pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('education.classes', ${item.class_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="modalTurma(${item.class_id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // =========================================================
  // 2. VISÃO MOBILE (CARDS OTIMIZADOS)
  // =========================================================
  let mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5">${item.name}</h6>
                    
                    <div class="small text-primary fw-medium mb-2 d-flex align-items-center lh-1 mt-1">
                        <i class="fas fa-graduation-cap me-2 opacity-75"></i> ${item.course_name}
                    </div>
                </div>
                
                <div class="text-end mt-1">
                    ${getMobileToggleHtml(item.class_id, isActive)}
                </div>
            </div>

            <div class="d-flex flex-column gap-2 mt-2 mb-3 p-2 px-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-10">
                <div class="d-flex align-items-center text-muted small lh-1 mt-1">
                    <i class="fas fa-user-tie opacity-50 text-center" style="width: 18px; margin-right: 6px;"></i> 
                    <span class="text-truncate">${item.coordinator_name || "Sem coordenador"}</span>
                </div>    
                <div class="d-flex align-items-center text-muted small lh-1 mb-1">
                    <i class="fas fa-clock opacity-50 text-center" style="width: 18px; margin-right: 6px;"></i> 
                    <span class="text-truncate">${item.schedule_summary || "Sem horário"}</span>
                </div>
            </div>
            
            <div class="mb-2">
                 <div class="d-flex justify-content-between small text-muted mb-2">
                    <span class="text-uppercase fw-bold" style="font-size: 0.65rem; letter-spacing: 0.5px;">
                        Ocupação da Turma
                    </span>
                 </div>
                 ${getProgressHtml(item.enrolled_count, item.max_capacity).replace("max-width: 120px;", "max-width: 100%;")} 
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('education.classes', ${item.class_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="modalTurma(${item.class_id})" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteTurma(${item.class_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  // Renderiza HTML Híbrido
  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th>Turma / Curso</th>
                    <th>Coordenação</th>
                    <th>Horário / Local</th>
                    <th class="text-center">Lotação</th>
                    <th class="text-center">Ativa</th>
                    <th class="text-end pe-4">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none">
        ${mobileRows}
    </div>
  `);

  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "getTurmas", defaultClass);
};

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
  $("#lista-alunos").html('<tr><td colspan="5" class="text-center text-muted py-4">Salve a turma para gerenciar catequizandos.</td></tr>');

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
    const result = await window.ajaxValidator({
      validator: "getClassById",
      token: defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const d = result.data;
      $("#class_id").val(d.class_id);
      $("#class_name").val(d.name);
      $("#class_capacity").val(d.max_capacity);
      $("#class_status").val(d.status);

      // INJEÇÃO MANUAL DE OPÇÕES (Fix Amnesia do Selectize)
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
      throw new Error(result.alert || "Erro ao carregar os dados da turma.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha ao conectar com o servidor para carregar a turma.";
    window.alertErrorWithSupport(`Abrir Edição de Turma`, errorMessage);
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
    container.html(`
        <div class="text-center py-4 opacity-50">
            <i class="fas fa-clock fa-2x mb-2"></i>
            <p class="small mb-0">Nenhum horário definido.</p>
        </div>
    `);
    return;
  }

  const daysMap = { 0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado" };

  currentSchedules.forEach((item, index) => {
    const st = item.start_time.substring(0, 5);
    const et = item.end_time.substring(0, 5);

    // Label de Localização com ícone
    const locLabel = item.location_name || (item.location_id ? "Sala Específica" : "Sala da Turma");

    container.append(`
        <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-sm transition-all">
            <div class="d-flex align-items-center gap-3">
                <div class="bg-primary bg-opacity-10 text-primary rounded-3 p-2 text-center" style="min-width: 50px;">
                    <div class="fw-bold" style="font-size: 0.85rem;">${daysMap[item.day_of_week].substring(0, 3)}</div>
                </div>
                
                <div>
                    <div class="fw-bold text-body fs-6">
                        <i class="far fa-clock me-1 opacity-50"></i> ${st} — ${et}
                    </div>
                    <div class="small text-muted d-flex align-items-center mt-1">
                        <i class="fas fa-location-dot me-2 opacity-50" style="font-size: 0.75rem;"></i> ${locLabel}
                    </div>
                </div>
            </div>

            <button class="btn btn-sm btn-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                    style="width: 32px; height: 32px;" onclick="removeSchedule(${index})" title="Remover Horário">
                <i class="fas fa-times"></i>
            </button>
        </div>
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
      throw new Error(result.alert || "Erro inesperado ao salvar a turma no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor. Tente novamente.";
    const acaoContexto = data.class_id ? `Atualizar Turma` : "Criar Nova Turma";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
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
    // 1. Feedback Visual de Carregamento (Respeitando a tabela)
    container.html('<tr><td colspan="5" class="text-center py-4 opacity-50"><span class="spinner-border spinner-border-sm text-primary me-2" role="status"></span> Carregando catequizandos...</td></tr>');

    // 2. Chamada à API
    const result = await window.ajaxValidator({
      validator: "getClassStudents",
      token: defaultApp.userInfo.token,
      class_id: classId,
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso com dados
        container.empty();
        renderStudentsList(dataArray);
      } else {
        // Estado Vazio (Sem catequizando, mas sem erro)
        container.html(`
        <tr>
          <td colspan="5" class="text-center text-muted py-5 opacity-75">
            <i class="fas fa-user-graduate fa-2x mb-2 opacity-50"></i>
            <p class="mb-0 small fw-medium">Nenhum catequizando matriculado nesta turma.</p>
          </td>
        </tr>
      `);
      }
    } else {
      throw new Error(result.alert || "Falha ao obter lista de catequizandos do banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de conexão ao tentar carregar a lista de catequizandos.";
    window.alertErrorWithSupport(`Carregar Catequizandos da Turma`, errorMessage);
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

    // Injeção de Card Moderno (EaCode Soft UI)
    container.append(`
        <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 transition-all shadow-sm">
            <div class="flex-grow-1 pe-2">
                <div class="fw-bold text-body fs-6 mb-1">${item.student_name}</div>
                <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-${st.c} bg-opacity-10 text-${st.c} border border-${st.c} border-opacity-25 fw-medium px-2 py-1" style="font-size: 0.7rem;">
                        ${st.l}
                    </span>
                    <span class="small text-muted" style="font-size: 0.75rem;">
                        <i class="far fa-calendar-alt me-1 opacity-50"></i> ${item.enrollment_date_fmt}
                    </span>
                </div>
            </div>
            
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                        style="width: 36px; height: 36px;" onclick="openHistory(${item.enrollment_id}, '${item.student_name.replace(/'/g, "\\'")}')" title="Histórico">
                    <i class="fas fa-history fs-6"></i>
                </button>
                <button class="btn btn-sm btn-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" 
                        style="width: 36px; height: 36px;" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover">
                    <i class="fas fa-trash-can fs-6"></i>
                </button>
            </div>
        </div>
    `);
  });
};

window.matricularAluno = async () => {
  const classId = $("#class_id").val();
  const studentId = $("#sel_new_student").val();

  // Validações de Front-end (Alertas rápidos, sem acionar o suporte)
  if (!classId) return window.alertDefault("Salve a turma antes de realizar matrículas.", "warning");
  if (!studentId) return window.alertDefault("Selecione um catequizando para matricular.", "warning");

  try {
    // Chamada à API
    const result = await window.ajaxValidator({
      validator: "enrollStudent",
      token: defaultApp.userInfo.token,
      class_id: classId,
      student_id: studentId,
    });

    // Tratamento do Resultado
    if (result.status) {
      window.alertDefault("Catequizando matriculado com sucesso!", "success");

      // Limpa o selectize para a próxima matrícula
      $("#sel_new_student")[0].selectize.clear();

      // Atualiza as listagens na tela
      loadClassStudents(classId);
      getTurmas();
    } else {
      throw new Error(result.alert || "Não foi possível efetuar a matrícula no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de comunicação com o servidor ao tentar matricular.";
    window.alertErrorWithSupport(`Matricular Catequizando`, errorMessage);
  }
};

window.deleteEnrollment = (id) => {
  Swal.fire({
    title: "Remover Catequizando?",
    text: "O catequizando será desvinculado desta turma.",
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

  // 1. Feedback Visual de Carregamento (Loader Otimista Soft UI)
  container.html(`
    <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 2rem; height: 2rem;" role="status"></div>
        <p class="mt-3 fw-medium small">Carregando histórico...</p>
    </div>
  `);

  try {
    // 2. Chamada à API
    const result = await window.ajaxValidator({
      validator: "getEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: enrollmentId,
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        container.empty();

        const actionMap = {
          ENROLLED: { t: "Matrícula Inicial", c: "success", i: "person_add" },
          SUSPENDED: { t: "Suspensão", c: "warning", i: "pause_circle" },
          DROPPED: { t: "Desistência", c: "danger", i: "block" },
          TRANSFERRED: { t: "Transferência", c: "info", i: "move_up" },
          ACTIVE: { t: "Reativação", c: "success", i: "check_circle" },
          COMPLETED: { t: "Conclusão", c: "primary", i: "auto_awesome" },
          COMMENT: { t: "Observação", c: "secondary", i: "chat_bubble" },
        };

        dataArray.forEach((item) => {
          const act = actionMap[item.action_type] || { t: item.action_type, c: "secondary", i: "info" };

          // Mantida a sua estrutura visual impecável de Timeline
          container.append(`
              <div class="position-relative ps-4 border-start border-2 border-secondary border-opacity-25 pb-3 ms-2">
                  <div class="position-absolute start-0 top-0 translate-middle-x bg-${act.c} rounded-circle border border-3 border-body shadow-sm" 
                       style="width: 14px; height: 14px; margin-left: -1px; margin-top: 14px;"></div>
                  
                  <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 shadow-sm">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                          <span class="badge bg-${act.c} bg-opacity-10 text-${act.c} border border-${act.c} border-opacity-25 fw-bold px-2 py-1" style="font-size: 0.7rem;">
                              ${act.t}
                          </span>
                          <div class="text-muted fw-medium" style="font-size: 0.7rem;">
                              <i class="far fa-clock me-1 opacity-50"></i> ${item.action_date_fmt}
                          </div>
                      </div>
                      
                      <p class="mb-3 text-body small lh-sm opacity-90">${item.observation || "Sem observação detalhada."}</p>
                      
                      <div class="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-10 pt-2">
                          <div class="small text-muted" style="font-size: 0.75rem;">
                              <i class="fas fa-user-circle me-1 opacity-50"></i> Por: <span class="fw-bold">${item.user_name}</span>
                          </div>
                          <button class="btn btn-link text-danger p-0 text-decoration-none shadow-none transition-all" onclick="deleteHistoryItem(${item.history_id}, ${enrollmentId})" title="Excluir Registro">
                              <i class="fas fa-trash-can" style="font-size: 0.85rem;"></i>
                          </button>
                      </div>
                  </div>
              </div>
          `);
        });
      } else {
        // Estado Vazio (Sem histórico para este aluno, sem erro)
        container.html(`
          <div class="text-center py-5 opacity-50">
              <span class="material-symbols-outlined fs-1">history</span>
              <p class="mt-2 fw-medium text-body small mb-0">Nenhum registro encontrado no histórico.</p>
          </div>
        `);
      }
    } else {
      throw new Error(result.alert || "Falha ao obter os registros de histórico acadêmico.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de conexão ao tentar carregar o histórico.";

    container.html(`
        <div class="text-center py-4">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px;">
                <i class="fas fa-exclamation-triangle fs-4"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="loadEnrollmentHistory(${enrollmentId})">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);
    window.alertErrorWithSupport(`Carregar Histórico`, errorMessage);
  }
};

window.addHistoryItem = async () => {
  const eid = $("#hist_enrollment_id").val();
  const action = $("#hist_action").val();
  const obs = $("#hist_obs").val();

  // Validações de Front-end (Sem acionar suporte)
  if (!eid) return;
  if (!obs && action === "COMMENT") return window.alertDefault("Digite uma observação.", "warning");

  try {
    // Chamada à API
    const result = await window.ajaxValidator({
      validator: "addEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: eid,
      action_type: action,
      observation: obs,
    });

    // Tratamento do Resultado
    if (result.status) {
      window.alertDefault("Anotação adicionada ao histórico!", "success");

      // Limpa o campo e atualiza as listagens
      $("#hist_obs").val("");
      loadEnrollmentHistory(eid);
      if ($("#class_id").val()) loadClassStudents($("#class_id").val());
    } else {
      throw new Error(result.alert || "Não foi possível salvar o registro no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de comunicação com o servidor ao salvar o histórico.";
    window.alertErrorWithSupport(`Adicionar histórico do catequizando`, errorMessage);
  }
};

window.deleteHistoryItem = (historyId, enrollmentId) => {
  Swal.fire({
    title: "Apagar registro?",
    text: "O registro será movido para a lixeira do sistema.",
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
// 8. HELPERS E INICIALIZAÇÃO
// =========================================================

const initSelects = () => {
  const selects = [
    { id: "#sel_course", val: "getCoursesList", ph: "Selecione o Curso..." },
    { id: "#sel_coordinator", val: "getCatechistsList", ph: "Busque o catequista..." },
    { id: "#sel_assistant", val: "getCatechistsList", ph: "Busque o auxiliar..." },
    { id: "#sel_location", val: "getLocations", ph: "Sala Principal..." },
    { id: "#sel_location_sched", val: "getLocations", ph: "Sala Específica..." },
    { id: "#sel_new_student", val: "getStudentsList", ph: "Busque o catequizando...", search: ["title", "tax_id"] },
  ];

  selects.forEach((s) => {
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

window.deleteTurma = (id) => {
  Swal.fire({
    title: "Excluir Turma?",
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
          validator: "deleteClass",
          token: defaultApp.userInfo.token,
          id: id,
        });

        if (res.status) {
          window.alertDefault("Turma excluída com sucesso.", "success");
          getTurmas();
        } else {
          throw new Error(res.alert || "O banco de dados bloqueou a exclusão desta turma.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de comunicação com o servidor ao tentar excluir.";
        window.alertErrorWithSupport(`Excluir Turma`, errorMessage);
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
