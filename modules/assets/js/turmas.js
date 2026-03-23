const defaultClass = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentSchedules = [];

// Declaração Global restaurada para ligar o Toggle ao utilitário handleToggle
window.toggleTurma = (id, element) => handleToggle("toggleClass", id, element, "Estado atualizado.", `.status-text-turma-${id}`, getTurmas);

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
});

const getTurmas = async () => {
  try {
    const page = Math.max(0, defaultClass.currentPage - 1);
    const search = $("#busca-texto").val();
    const year = localStorage.getItem("sys_active_year");
    const container = $(".list-table-turmas");

    if (!year) {
      container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1">event_busy</span>
            <p class="mt-3 fw-medium text-body">Selecione um Ano Letivo no menu lateral.</p>
        </div>
      `);
      return;
    }

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
      throw new Error(result.alert || "Erro ao obter turmas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha ao ligar com o servidor para buscar as turmas.";
    $(".list-table-turmas").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm mt-2" onclick="getTurmas()">
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
    container.html(`
      <div class="text-center py-5 opacity-50">
          <span class="material-symbols-outlined fs-1 text-secondary">class</span>
          <p class="mt-2 fw-medium text-body">Nenhuma turma encontrada.</p>
      </div>
    `);
    $(".pagination-turmas").empty();
    return;
  }

  const getProgressHtml = (enrolled, cap) => {
    if (!cap || parseInt(cap) === 0) return '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1">Ilimitado</span>';

    const e = parseInt(enrolled || 0);
    const c = parseInt(cap);
    const percent = Math.min(100, Math.round((e / c) * 100));

    let color = percent < 80 ? "bg-success" : percent < 100 ? "bg-warning" : "bg-danger";

    return `
        <div class="w-100" style="max-width: 140px; margin: 0 auto;">
            <div class="d-flex justify-content-between fw-bold text-muted mb-2" style="font-size: 0.75rem;">
                <span>${e}/${c}</span>
                <span>${percent}%</span>
            </div>
            <div class="progress bg-secondary bg-opacity-10 shadow-inner" style="height: 8px;">
                <div class="progress-bar ${color} rounded-pill" role="progressbar" style="width: ${percent}%"></div>
            </div>
        </div>`;
  };

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CUSTOM PREMIUM)
  // =========================================================
  const desktopRows = data.map((item) => {
    let avatarHtml = `<div class="rounded-circle bg-secondary bg-opacity-10 border border-secondary border-opacity-25 shadow-sm d-flex align-items-center justify-content-center text-secondary fw-bold" style="width:38px; height:38px; font-size: 0.85rem;">?</div>`;

    if (item.coordinator_photo) {
      avatarHtml = `<img src="${item.coordinator_photo}" class="rounded-circle border border-secondary border-opacity-25 shadow-sm object-fit-cover" style="width:38px; height:38px;">`;
    } else if (item.coordinator_name) {
      const ini = item.coordinator_name.substring(0, 2).toUpperCase();
      avatarHtml = `<div class="rounded-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm d-flex align-items-center justify-content-center fw-bold" style="width:38px; height:38px; font-size: 0.85rem;">${ini}</div>`;
    }

    const isActive = item.is_active === true || item.is_active === "t";

    return `
      <tr>
          <td class="align-middle ps-3">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
              <div class="small text-primary mt-1 d-flex align-items-center gap-2">
                  <span><i class="far fa-calendar-alt opacity-75 me-1"></i> ${item.year_name || "-"}</span>
                  <span class="opacity-50">|</span>
                  <span><i class="fas fa-graduation-cap opacity-75 me-1"></i> ${item.course_name}</span>
              </div>
          </td>
          <td class="align-middle">
              <div class="d-flex align-items-center gap-3">
                  ${avatarHtml}
                  <span class="fw-medium text-body small">${item.coordinator_name || "Sem coordenador"}</span>
              </div>
          </td>
          <td class="align-middle">
              <div class="d-flex flex-column gap-2">
                  <span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-25 rounded-pill w-auto text-start px-2 py-1 fw-medium" style="font-size: 0.7rem;">
                      <i class="far fa-clock me-1 text-primary opacity-75"></i> ${item.schedule_summary || "Sem horário"}
                  </span>
                  <span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-25 rounded-pill w-auto text-start px-2 py-1 fw-medium" style="font-size: 0.7rem;">
                      <i class="fas fa-location-dot me-1 text-primary opacity-75"></i> ${item.location_name || "Sem local"}
                  </span>
              </div>
          </td>
          <td class="text-center align-middle" style="width: 180px;">${getProgressHtml(item.enrolled_count, item.max_capacity)}</td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="d-flex align-items-center justify-content-center gap-2">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center position-relative">
                      <input class="form-check-input shadow-none m-0" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="width: 44px; height: 24px; cursor: pointer;">
                  </div>
              </div>
          </td>
          <td class="text-end align-middle pe-3 text-nowrap" style="width: 140px;">
              <button class="btn-icon-action text-warning" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
              <button class="btn-icon-action text-primary" onclick="modalTurma(${item.class_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon-action text-danger" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </td>
      </tr>`;
  }).join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th class="ps-3 text-uppercase" style="font-size: 0.75rem;">Turma / Curso</th>
                    <th class="text-uppercase" style="font-size: 0.75rem;">Coordenação</th>
                    <th class="text-uppercase" style="font-size: 0.75rem;">Horário / Local</th>
                    <th class="text-center text-uppercase" style="font-size: 0.75rem;">Ocupação</th>
                    <th class="text-center text-uppercase" style="font-size: 0.75rem;">Estado</th>
                    <th class="text-end pe-4 text-uppercase" style="font-size: 0.75rem;">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // =========================================================
  // 2. VISÃO MOBILE (IOS-LIST-ITEM APPLE HIG)
  // =========================================================
  const mobileRows = data.map((item) => {
    const isActive = item.is_active === true || item.is_active === "t";

    const statusIconHtml = isActive
      ? `<span title="Ativa" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-check-circle"></i></span>`
      : `<span title="Inativa" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-times-circle"></i></span>`;

    return `
      <div class="ios-list-item flex-column align-items-stretch">
          
          <div class="d-flex justify-content-between align-items-start">
              <div class="flex-grow-1 pe-3" style="min-width: 0;">
                  <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 1.05rem; letter-spacing: -0.5px;">${item.name}</h6>
                  <div class="mt-2">
                      <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                          <i class="fas fa-graduation-cap me-1"></i> ${item.course_name}
                      </span>
                  </div>
              </div>
              <div class="text-end">
                  <div class="d-flex align-items-center justify-content-end gap-2">
                  <!-- <div class="status-text-turma-${item.class_id} d-flex align-items-center">${statusIconHtml}</div> -->
                      <div class="form-check form-switch m-0 p-0 d-flex align-items-center position-relative">
                          <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="cursor: pointer; width: 44px; height: 24px;">
                      </div>
                  </div>
              </div>
          </div>

          <div class="d-flex flex-column gap-2 mt-3 p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-inner">
              <div class="d-flex align-items-center text-body">
                  <div class="bg-body shadow-sm rounded-circle d-flex align-items-center justify-content-center text-primary" style="width: 26px; height: 26px; flex-shrink: 0;">
                      <i class="fas fa-user-tie" style="font-size: 0.7rem;"></i>
                  </div>
                  <span class="text-truncate ms-2 fw-medium small">${item.coordinator_name || "Sem coordenador"}</span>
              </div>    
              <div class="d-flex align-items-center text-body mt-1">
                  <div class="bg-body shadow-sm rounded-circle d-flex align-items-center justify-content-center text-primary" style="width: 26px; height: 26px; flex-shrink: 0;">
                      <i class="far fa-clock" style="font-size: 0.7rem;"></i>
                  </div>
                  <span class="text-truncate ms-2 fw-medium small">${item.schedule_summary || "Sem horário"}</span>
              </div>
          </div>
          
          <div class="mt-3">
               <div class="d-flex justify-content-between small text-muted mb-2">
                  <span class="text-uppercase fw-bold" style="font-size: 0.65rem; letter-spacing: 0.5px;">Ocupação da Turma</span>
               </div>
               ${getProgressHtml(item.enrolled_count, item.max_capacity).replace("max-width: 140px; margin: 0 auto;", "max-width: 100%;")} 
          </div>
          
          <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
              <button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
              <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="modalTurma(${item.class_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>
      </div>`;
  }).join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "changePage", defaultClass);
};

window.modalTurma = (id = null, btn = false) => {
  if (btn) btn = $(btn);
  const modal = $("#modalTurma");

  $("#class_id").val("");
  $("#class_name").val("");
  $("#class_capacity").val("");
  $("#class_status").val("PLANNED");

  if ($("#sel_course")[0]?.selectize) $("#sel_course")[0].selectize.clear();
  if ($("#sel_coordinator")[0]?.selectize) $("#sel_coordinator")[0].selectize.clear();
  if ($("#sel_assistant")[0]?.selectize) $("#sel_assistant")[0].selectize.clear();
  if ($("#sel_location")[0]?.selectize) $("#sel_location")[0].selectize.clear();

  currentSchedules = [];
  renderSchedulesTable();
  $("#lista-alunos").html(`
    <div class="text-center py-5 opacity-50">
      <span class="material-symbols-outlined fs-1 text-secondary">save</span>
      <p class="mt-2 text-body fw-medium">Guarde a turma para gerir catequizandos.</p>
    </div>
  `);

  if (id) {
    $("#alunos-tab").removeClass("disabled");
    loadClassData(id, btn);
  } else {
    $("#alunos-tab").addClass("disabled");
    $("#modalLabel").text("Nova Turma");
    modal.modal("show");
  }

  const firstTabEl = document.querySelector('#turmaTab button:first-child');
  if (firstTabEl) {
    const tab = new bootstrap.Tab(firstTabEl);
    tab.show();
  }
};

const loadClassData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
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
    const errorMessage = e.message || "Falha ao ligar com o servidor para carregar a turma.";
    window.alertErrorWithSupport(`Abrir Edição de Turma`, errorMessage);
    $("#modalTurma").modal("hide");
  } finally {
    window.setButton(false, btn);
  }
};

window.addSchedule = () => {
  const day = $("#sched_day").val();
  const start = $("#sched_start").val();
  const end = $("#sched_end").val();

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

  if (currentSchedules.length === 0) {
    container.html(`
        <div class="text-center py-4 opacity-50">
            <i class="far fa-clock fa-2x mb-2"></i>
            <p class="small mb-0 fw-medium text-body">Nenhum horário definido.</p>
        </div>
    `);
    return;
  }

  const daysMap = { 0: "Domingo", 1: "Segunda", 2: "Terça", 3: "Quarta", 4: "Quinta", 5: "Sexta", 6: "Sábado" };

  const html = currentSchedules.map((item, index) => {
    const st = item.start_time.substring(0, 5);
    const et = item.end_time.substring(0, 5);
    const locLabel = item.location_name || (item.location_id ? "Sala Específica" : "Sala da Turma");

    return `
      <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-sm transition-all shadow-inner">
          <div class="d-flex align-items-center gap-3">
              <div class="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 48px; height: 48px;">
                  <span class="fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">${daysMap[item.day_of_week].substring(0, 3).toUpperCase()}</span>
              </div>
              
              <div>
                  <div class="fw-bold text-body" style="font-size: 0.95rem;">
                      <i class="far fa-clock me-1 text-primary opacity-75"></i> ${st} — ${et}
                  </div>
                  <div class="small text-muted d-flex align-items-center mt-1 fw-medium">
                      <i class="fas fa-location-dot me-1 opacity-50"></i> ${locLabel}
                  </div>
              </div>
          </div>

          <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="removeSchedule(${index})" title="Remover Horário">
              <i class="fas fa-times"></i>
          </button>
      </div>`;
  }).join("");

  container.html(html);
};

window.salvarTurma = async (btn) => {
  const name = $("#class_name").val().trim();
  const course = $("#sel_course").val();
  const yearId = localStorage.getItem("sys_active_year");
  btn = $(btn);

  if (!name) return window.alertDefault("Nome da turma é obrigatório.", "warning");
  if (!course) return window.alertDefault("Selecione um curso.", "warning");
  if (!yearId) return window.alertDefault("Selecione o ano letivo.", "warning");

  window.setButton(true, btn, " A guardar...");

  const data = {
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
  };

  try {
    const result = await window.ajaxValidator({
      validator: "saveClass",
      token: defaultApp.userInfo.token,
      data: data,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      window.alertDefault("Turma guardada com sucesso!", "success");
      $("#modalTurma").modal("hide");
      getTurmas();
    } else {
      throw new Error(result.alert || "Erro inesperado ao guardar a turma no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor. Tente novamente.";
    const acaoContexto = data.class_id ? `Atualizar Turma` : "Criar Nova Turma";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

const loadClassStudents = async (classId) => {
  const container = $("#lista-alunos");
  try {
    container.html(`
      <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
        <p class="mt-3 fw-medium text-body">A carregar catequizandos...</p>
      </div>
    `);

    const result = await window.ajaxValidator({
      validator: "getClassStudents",
      token: defaultApp.userInfo.token,
      class_id: classId,
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        renderStudentsList(dataArray);
      } else {
        container.html(`
          <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1 text-secondary">person_off</span>
            <p class="mt-2 fw-medium text-body">Nenhum catequizando matriculado nesta turma.</p>
          </div>
        `);
      }
    } else {
      throw new Error(result.alert || "Falha ao obter lista de catequizandos do banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de ligação ao tentar carregar a lista de catequizandos.";
    window.alertErrorWithSupport(`Carregar Catequizandos da Turma`, errorMessage);
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

  const html = data.map((item) => {
    const st = statusMap[item.status] || { l: item.status, c: "secondary" };

    return `
      <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-sm shadow-inner transition-all">
          <div class="flex-grow-1 pe-2" style="min-width: 0;">
              <div class="fw-bold text-body text-truncate mb-1" style="font-size: 0.95rem;">${item.student_name}</div>
              <div class="d-flex align-items-center gap-2">
                  <span class="badge bg-${st.c}-subtle text-${st.c} border border-${st.c} border-opacity-25 rounded-pill px-2 py-1 fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                      ${st.l.toUpperCase()}
                  </span>
                  <span class="small text-muted fw-medium d-none d-sm-inline" style="font-size: 0.75rem;">
                      <i class="far fa-calendar-alt me-1 opacity-50"></i> ${item.enrollment_date_fmt}
                  </span>
              </div>
          </div>
          
          <div class="d-flex align-items-center gap-2">
              <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="openHistory(${item.enrollment_id}, '${item.student_name.replace(/'/g, "\\'")}')" title="Histórico">
                  <i class="fas fa-history"></i>
              </button>
              <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover">
                  <i class="fas fa-trash-can"></i>
              </button>
          </div>
      </div>`;
  }).join("");

  container.html(html);
};

window.matricularAluno = async (btn) => {
  const classId = $("#class_id").val();
  const studentId = $("#sel_new_student").val();
  btn = $(btn);

  if (!classId) return window.alertDefault("Guarde a turma antes de realizar matrículas.", "warning");
  if (!studentId) return window.alertDefault("Selecione um catequizando para matricular.", "warning");

  window.setButton(true, btn, " A matricular...");

  try {
    const result = await window.ajaxValidator({
      validator: "enrollStudent",
      token: defaultApp.userInfo.token,
      class_id: classId,
      student_id: studentId,
    });

    if (result.status) {
      window.alertDefault("Catequizando matriculado com sucesso!", "success");
      $("#sel_new_student")[0].selectize.clear();
      loadClassStudents(classId);
      getTurmas();
    } else {
      throw new Error(result.alert || "Não foi possível efectuar a matrícula no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de comunicação com o servidor ao tentar matricular.";
    window.alertErrorWithSupport(`Matricular Catequizando`, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteEnrollment = (id) => {
  Swal.fire({
    title: "Remover Catequizando?",
    text: "O catequizando será desvinculado desta turma.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, remover",
    cancelButtonText: "Cancelar"
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

  container.html(`
    <div class="text-center py-5 opacity-50">
        <div class="spinner-border text-primary" style="width: 2rem; height: 2rem;" role="status"></div>
        <p class="mt-3 fw-medium text-body small">A carregar histórico...</p>
    </div>
  `);

  try {
    const result = await window.ajaxValidator({
      validator: "getEnrollmentHistory",
      token: defaultApp.userInfo.token,
      enrollment_id: enrollmentId,
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const actionMap = {
          ENROLLED: { t: "Matrícula Inicial", c: "success", i: "person_add" },
          SUSPENDED: { t: "Suspensão", c: "warning", i: "pause_circle" },
          DROPPED: { t: "Desistência", c: "danger", i: "block" },
          TRANSFERRED: { t: "Transferência", c: "info", i: "move_up" },
          ACTIVE: { t: "Reativação", c: "success", i: "check_circle" },
          COMPLETED: { t: "Conclusão", c: "primary", i: "auto_awesome" },
          COMMENT: { t: "Observação", c: "secondary", i: "chat_bubble" },
        };

        const html = dataArray.map((item) => {
          const act = actionMap[item.action_type] || { t: item.action_type, c: "secondary", i: "info" };

          return `
            <div class="position-relative ps-4 border-start border-2 border-secondary border-opacity-25 pb-3 ms-2">
                <div class="position-absolute start-0 top-0 translate-middle-x bg-${act.c} rounded-circle border border-3 border-body shadow-sm" 
                     style="width: 14px; height: 14px; margin-left: -1px; margin-top: 14px;"></div>
                
                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 shadow-sm shadow-inner">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge bg-${act.c}-subtle text-${act.c} border border-${act.c} border-opacity-25 rounded-pill px-2 py-1 fw-bold" style="font-size: 0.7rem; letter-spacing: 0.5px;">
                            ${act.t.toUpperCase()}
                        </span>
                        <div class="text-muted fw-medium" style="font-size: 0.75rem;">
                            <i class="far fa-clock me-1 opacity-50 text-primary"></i> ${item.action_date_fmt}
                        </div>
                    </div>
                    
                    <p class="mb-3 text-body small lh-sm opacity-90 fw-medium">${item.observation || "Sem observação detalhada."}</p>
                    
                    <div class="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-10 pt-2">
                        <div class="small text-muted" style="font-size: 0.75rem;">
                            <i class="fas fa-user-circle me-1 text-primary opacity-50"></i> Por: <span class="fw-bold text-body">${item.user_name}</span>
                        </div>
                        <button class="btn btn-link text-danger p-0 text-decoration-none shadow-none transition-all" onclick="deleteHistoryItem(${item.history_id}, ${enrollmentId})" title="Excluir Registo">
                            <i class="fas fa-trash-can" style="font-size: 0.95rem;"></i>
                        </button>
                    </div>
                </div>
            </div>`;
        }).join("");

        container.html(html);
      } else {
        container.html(`
          <div class="text-center py-5 opacity-50">
              <span class="material-symbols-outlined fs-1 text-secondary">history</span>
              <p class="mt-2 fw-medium text-body small mb-0">Nenhum registo encontrado no histórico.</p>
          </div>
        `);
      }
    } else {
      throw new Error(result.alert || "Falha ao obter os registos do histórico académico.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de ligação ao tentar carregar o histórico.";
    container.html(`
        <div class="text-center py-4">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 56px; height: 56px;">
                <i class="fas fa-exclamation-triangle fs-4"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm mt-2" onclick="loadEnrollmentHistory(${enrollmentId})">
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
      window.alertDefault("Anotação adicionada ao histórico!", "success");

      $("#hist_obs").val("");
      loadEnrollmentHistory(eid);
      if ($("#class_id").val()) loadClassStudents($("#class_id").val());
    } else {
      throw new Error(result.alert || "Não foi possível guardar o registo no banco de dados.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha de comunicação com o servidor ao guardar o histórico.";
    window.alertErrorWithSupport(`Adicionar histórico do catequizando`, errorMessage);
  }
};

window.deleteHistoryItem = (historyId, enrollmentId) => {
  Swal.fire({
    title: "Apagar registo?",
    text: "O registo será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Apagar",
    cancelButtonText: "Cancelar"
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
        render: {
          option: function (item, escape) {
            if (item.tax_id) {
              return `<div class="py-1 px-2"><div class="fw-bold text-body">${escape(item.title)}</div><div class="small text-muted fw-medium">CPF: ${escape(item.tax_id)}</div></div>`;
            }
            return `<div class="py-1 px-2 fw-bold text-body">${escape(item.title || item.name)}</div>`;
          },
        },
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
    text: "O registo será movido para a lixeira do sistema.",
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
  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary me-1 shadow-sm" ${current === 1 ? "disabled" : ""}>Primeira</button>`;
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"} me-1 shadow-sm">${p}</button>`;
  }
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary shadow-sm" ${current === total ? "disabled" : ""}>Última</button>`;
  container.html(html);
};