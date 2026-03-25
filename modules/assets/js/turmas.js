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

  const canEdit = allowedSlugs.includes("turmas.edit");
  const canHistory = allowedSlugs.includes("turmas.history");
  const canDelete = allowedSlugs.includes("turmas.delete");

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

      const toggleHtml = canEdit
        ? `<div class="form-check form-switch mb-0"><input class="form-check-input shadow-sm" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="cursor: pointer;"></div>`
        : `<div class="form-check form-switch mb-0"><input class="form-check-input shadow-sm" type="checkbox" ${isActive ? "checked" : ""} disabled></div>`;

      let actionsHtml = "";
      if (canHistory)
        actionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Auditoria/Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        actionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="modalTurma(${item.class_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        actionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 32px; height: 32px; padding: 0;" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

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
                    ${toggleHtml}
                </div>
            </td>
            <td class="text-end align-middle pe-3">
                <div class="d-flex gap-2 justify-content-end">
                    ${actionsHtml || '<span class="text-muted small opacity-50"><i class="fas fa-ban"></i></span>'}
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
                    <th class="text-center">Estado</th>
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

      const mobToggleHtml = canEdit
        ? `<div class="form-check form-switch m-0 p-0 d-flex align-items-center"><input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleTurma(${item.class_id}, this)" style="cursor: pointer; width: 44px; height: 24px;"></div>`
        : `<div class="form-check form-switch m-0 p-0 d-flex align-items-center"><input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} disabled style="width: 44px; height: 24px;"></div>`;

      let mobActionsHtml = "";
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.classes', ${item.class_id}, this)" title="Log"><i class="fas fa-history"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="modalTurma(${item.class_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete)
        mobActionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deleteTurma(${item.class_id})" title="Excluir"><i class="fas fa-trash-can"></i></button>`;

      let mobileFooter = "";
      if (mobActionsHtml !== "") {
        mobileFooter = `
          <div class="d-flex mt-4 gap-2 flex-nowrap">
              ${mobActionsHtml}
          </div>`;
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
              <div class="d-flex align-items-center justify-content-end gap-2 w-100 flex-nowrap">
                ${mobToggleHtml}
              </div>
              ${mobileFooter}
          </div>
      </div>`;
    })
    .join("");

  container.html(tableHtml + `<div class="d-md-none ios-list-container">${mobileRows}</div>`);
  _generatePaginationButtons("pagination-turmas", "currentPage", "totalPages", "changePage", defaultClass);
};

// =========================================================
// 2. LÓGICA DE MATRÍCULAS E HISTÓRICO ALUNO
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
        ABSENCE: "Falta",
      };

      const actionColors = {
        ENROLLED: "primary",
        SUSPENDED: "warning",
        DROPPED: "danger",
        TRANSFERRED: "info",
        ACTIVE: "success",
        COMPLETED: "primary",
        COMMENT: "secondary",
        ABSENCE: "danger",
      };

      const itemsHtml = (res.data || [])
        .map((item) => {
          const stColor = actionColors[item.action_type] || "secondary";
          const showDelete = item.source_table === "HISTORY";

          return `
            <div class="position-relative mb-4">
                <div class="position-absolute bg-${stColor} rounded-circle border border-2 border-body shadow-sm" style="width: 14px; height: 14px; left: -1.75rem; top: 0.5rem; z-index: 2;"></div>
                
                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 shadow-inner">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-${stColor} bg-opacity-10 text-${stColor} border border-${stColor} border-opacity-10 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.65rem;">
                            ${actionMap[item.action_type] || item.action_type}
                        </span>
                        <small class="text-muted fw-bold" style="font-size: 0.75rem;">${item.action_date_fmt}</small>
                    </div>
                    
                    <div class="fw-bold text-body mt-2 mb-3 lh-sm" style="font-size: 0.95rem;">${item.observation || "Registro automático."}</div>
                    
                    <div class="d-flex justify-content-between align-items-center border-top border-secondary border-opacity-10 pt-2">
                        <div class="small text-muted fw-medium" style="font-size: 0.75rem;"><i class="fas fa-user-circle me-1 opacity-50"></i> Por: <span class="text-body">${item.user_name}</span></div>
                        ${
                          showDelete
                            ? `
                        <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 28px; height: 28px; padding: 0;" onclick="deleteHistoryItem(${item.history_id}, ${enrollmentId})" title="Apagar Registro">
                            <i class="fas fa-trash-can" style="font-size: 0.75rem;"></i>
                        </button>`
                            : ""
                        }
                    </div>
                </div>
            </div>`;
        })
        .join("");

      const wrapperHtml = itemsHtml
        ? `
        <div class="position-relative ps-4 ms-2 pt-2 pb-2">
            <div class="position-absolute border-start border-2 border-secondary border-opacity-25 h-100" style="left: 0.35rem; top: 0; z-index: 1;"></div>
            ${itemsHtml}
        </div>`
        : '<div class="text-center py-5 text-muted opacity-50"><span class="material-symbols-outlined fs-1">event_busy</span><p class="mt-2 fw-medium text-body">Nenhum histórico registrado.</p></div>';

      container.html(wrapperHtml);
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
      try {
        await window.ajaxValidator({ validator: "deleteEnrollmentHistory", token: defaultApp.userInfo.token, id: historyId });
        loadEnrollmentHistory(enrollmentId);
      } catch (e) {
        window.alertErrorWithSupport("Excluir Histórico", e.message);
      }
    }
  });
};

window.matricularAluno = async (btn) => {
  const classId = $("#class_id").val();
  const studentId = $("#sel_new_student").val();
  const enrollmentDate = $("#enrollment_date").val();

  if (!classId || !studentId || !enrollmentDate) return window.alertDefault("Preencha o aluno e a data de matrícula.", "warning");

  btn = $(btn);
  window.setButton(true, btn, "");

  try {
    const res = await window.ajaxValidator({
      validator: "enrollStudent",
      token: defaultApp.userInfo.token,
      class_id: classId,
      student_id: studentId,
      enrollment_date: enrollmentDate,
    });
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
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined fs-1">person_off</span>
            <p class="mt-2 fw-medium text-body">Nenhum aluno matriculado.</p>
        </div>`);
    return;
  }

  // =========================================================
  // LÓGICA DE PERMISSÕES (RBAC) - ALUNOS
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

  const canHistory = allowedSlugs.includes("turmas.history");
  const canDrop = allowedSlugs.includes("turmas.drop");

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

      let actionsHtml = "";
      if (canHistory) {
        // Auditoria de Matrícula - Ícone Relógio (History)
        actionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.enrollments', ${item.enrollment_id}, this)" title="Log de Matrícula"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
        // Abrir Ocorrências/Observações - Ícone Lápis (Pen)
        actionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openHistory(${item.enrollment_id}, '${item.student_name.replace(/'/g, "\\'")}')" title="Adicionar Observação"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      }
      if (canDrop) {
        actionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deleteEnrollment(${item.enrollment_id})" title="Remover Matrícula"><i class="fas fa-user-minus" style="font-size: 0.85rem;"></i></button>`;
      }

      return `
        <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-inner transition-all">
            <div class="flex-grow-1 pe-2">
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <div class="fw-bold text-body text-truncate" style="font-size: 0.95rem; max-width: 200px;">${item.student_name}</div>
                    <span class="badge bg-${st.color} bg-opacity-10 text-${st.color} border border-${st.color} border-opacity-25 rounded-pill px-2 py-0 fw-bold" style="font-size: 0.65rem;">${st.label}</span>
                </div>
                <div class="small text-muted fw-medium d-flex align-items-center" style="font-size: 0.75rem;">
                    <i class="far fa-calendar-alt opacity-50 me-1"></i> ${item.enrollment_date_fmt || "N/D"}
                </div>
            </div>
            <div class="d-flex gap-2 flex-nowrap justify-content-end">
                ${actionsHtml}
            </div>
        </div>`;
    })
    .join("");

  container.html(html);
};

// =========================================================
// 3. AUXILIARES: SELECTS COM LAYOUT RICO (FOTOS/DATAS)
// =========================================================
const initSelects = () => {
  const selects = [
    { id: "#sel_course", val: "getCoursesList", ph: "Procurar curso..." },
    { id: "#sel_coordinator", val: "getCatechistsList", ph: "Procurar coordenador..." },
    { id: "#sel_assistant", val: "getCatechistsList", ph: "Procurar auxiliar..." },
    { id: "#sel_location", val: "getLocations", ph: "Sala padrão..." },
    { id: "#sel_location_sched", val: "getLocations", ph: "Sala específica..." },
    { id: "#sel_new_student", val: "getStudentsList", ph: "Buscar aluno por nome ou CPF...", search: ["title", "tax_id"] },
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
          option: (item, escape) => {
            if (s.val === "getStudentsList") {
              const photo = item.profile_photo_url
                ? `<img src="${escape(item.profile_photo_url)}" class="rounded-circle object-fit-cover border border-secondary border-opacity-25" style="width: 36px; height: 36px;">`
                : `<div class="rounded-circle bg-secondary bg-opacity-25 border border-secondary border-opacity-10 d-flex align-items-center justify-content-center text-body fw-bold" style="width: 36px; height: 36px; font-size: 0.9rem;">${escape(item.title).charAt(0)}</div>`;
              const bdate = item.birth_date_fmt ? `<span class="ms-1 text-primary opacity-75">- NASC. ${escape(item.birth_date_fmt)}</span>` : "";

              return `
                 <div class="d-flex align-items-center py-2 px-3 border-bottom border-secondary border-opacity-10">
                     <div class="me-3 flex-shrink-0">${photo}</div>
                     <div class="flex-grow-1" style="min-width: 0;">
                         <div class="fw-bold text-body text-truncate" style="font-size: 0.9rem;">${escape(item.title)}</div>
                         <div class="text-muted fw-medium text-truncate" style="font-size: 0.7rem;">
                             ${item.tax_id ? `CPF: ${escape(item.tax_id)}` : '<i class="fas fa-fingerprint opacity-50 me-1"></i> Sem documento'}
                             ${bdate}
                         </div>
                     </div>
                 </div>`;
            }

            return `<div class="py-2 px-3 border-bottom border-secondary border-opacity-10"><div class="fw-bold text-body small">${escape(item.title || item.name)}</div>${item.tax_id ? `<div class="text-muted fw-medium" style="font-size: 0.65rem;">CPF: ${escape(item.tax_id)}</div>` : ""}</div>`;
          },
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
    $("#modalLabel").html('<i class="fas fa-layer-group me-2 opacity-75"></i> Configurar Turma');
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
  window.setButton(true, btn, " Salvando...");

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
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined fs-1">event_busy</span>
            <p class="mt-2 fw-medium text-body">Sem horários definidos na grade.</p>
        </div>`);
    return;
  }

  // =========================================================
  // LÓGICA DE PERMISSÕES (RBAC) - HORÁRIOS
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

  const canEdit = allowedSlugs.includes("turmas.edit");

  const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

  const html = currentSchedules
    .map((item, index) => {
      const calculationHtml =
        item.total_classes !== undefined
          ? `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 rounded-pill px-2 py-0 me-1" title="Aulas dadas vs previstas para este dia da semana ao longo do ano">${item.recorded_classes || 0}/${item.total_classes || 0} aulas registradas</span>`
          : ``;

      return `
    <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-inner">
        <div class="d-flex align-items-center gap-3">
            <div class="bg-primary text-white rounded-4 d-flex align-items-center justify-content-center fw-bold shadow-sm" style="width: 48px; height: 48px; font-size: 0.85rem; letter-spacing: 0.5px;">${days[item.day_of_week].substring(0, 3).toUpperCase()}</div>
            <div>
                <div class="fw-bold text-body mb-1" style="font-size: 0.95rem;"><i class="far fa-clock me-1 text-primary opacity-75"></i> ${item.start_time.substring(0, 5)} — ${item.end_time.substring(0, 5)}</div>
                <div class="small text-muted fw-medium d-flex align-items-center flex-wrap gap-1">
                    ${calculationHtml}
                    <span><i class="fas fa-location-dot ms-1 me-1 opacity-50"></i> ${item.location_name || "Local Turma"}</span>
                </div>
            </div>
        </div>
        ${
          canEdit
            ? `
        <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 36px; height: 36px; padding: 0;" onclick="currentSchedules.splice(${index}, 1); renderSchedulesTable();" title="Remover Horário">
            <i class="fas fa-trash-can" style="font-size: 0.9rem;"></i>
        </button>`
            : ""
        }
    </div>`;
    })
    .join("");

  container.html(html);
};

window.deleteTurma = (id) => {
  Swal.fire({ title: "Excluir?", text: "O registro será movido para a lixeira do sistema.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33" }).then(async (r) => {
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
