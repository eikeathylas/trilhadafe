const defaultCourse = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentCurriculumList = [];
let editingCurriculumIndex = -1;

// Função global de Ligar/Desligar alinhada ao padrão Dual Status
window.toggleCourse = (id, element) => handleToggle("toggleCourse", id, element, "Estado do curso atualizado.", `.status-text-course-${id}`, getCursos);

window.saveActiveSummernote = () => {
  $(".summernote-dynamic").each(function () {
    const $textarea = $(this);
    if ($textarea.next(".note-editor").length > 0) {
      const idx = $textarea.data("index");
      const content = $textarea.summernote("code");

      if (editingCurriculumIndex > -1 && window.currentCurriculumList[editingCurriculumIndex]) {
        const item = window.currentCurriculumList[editingCurriculumIndex];
        if (!Array.isArray(item.plans)) item.plans = [];
        if (!item.plans[idx]) item.plans[idx] = { title: `Encontro ${idx + 1}`, content: "" };

        item.plans[idx].content = content;
      }
    }
  });
};

const summernoteConfig = {
  height: 350,
  lang: "pt-BR",
  placeholder: "Descreva o conteúdo do encontro...",
  dialogsInBody: true,
  toolbar: [
    ["style", ["style", "bold", "italic", "underline", "clear"]],
    ["font", ["color", "fontsize"]],
    ["para", ["ul", "ol", "paragraph"]],
    ["insert", ["link", "emoji", "hr", "table", "picture"]],
    ["view", ["fullscreen", "codeview", "help"]],
  ],
  callbacks: {
    onBlur: function () {
      window.saveActiveSummernote();
    },
  },
};

window.getCursos = async () => {
  const container = $(".list-table-cursos");

  try {
    const page = Math.max(0, defaultCourse.currentPage - 1);
    const search = $("#busca-texto").val();

    const result = await window.ajaxValidator({
      validator: "getCourses",
      token: window.defaultApp.userInfo.token,
      limit: defaultCourse.rowsPerPage,
      page: page * defaultCourse.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultCourse.totalPages = Math.max(1, Math.ceil(total / defaultCourse.rowsPerPage));
        renderTableCourses(dataArray);
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined fs-1 text-secondary">school</span>
                <p class="mt-3 fw-medium text-body">Nenhum curso encontrado no sistema.</p>
            </div>
        `);
        $(".pagination-cursos").empty();
      }
    } else {
      throw new Error(result.alert || result.msg || "Erro ao processar lista.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor.";
    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar cursos</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm mt-2" onclick="getCursos()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);
    window.alertErrorWithSupport("Listar Cursos", errorMessage);
  }
};

const renderTableCourses = (data) => {
  const container = $(".list-table-cursos");

  // --- LÓGICA DE PERMISSÕES (RBAC) ---
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

  const canEdit = allowedSlugs.includes("cursos.save");
  const canHistory = allowedSlugs.includes("cursos.history");
  const canDelete = allowedSlugs.includes("cursos.delete");

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
  const desktopRows = data
    .map((item) => {
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `A partir de ${item.min_age} anos`;

      const isActive = item.is_active === true || item.is_active === "t";

      // Ações Desktop Condicionais
      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('education.courses', ${item.course_id}, this)" title="Histórico"><i class="fas fa-history"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick="modalCurso(${item.course_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteCourse(${item.course_id})" title="Excluir"><i class="fas fa-trash-can"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">
              <div class="icon-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm">
                  <span class="material-symbols-outlined" style="font-size: 20px;">school</span>
              </div>
          </td>
          <td class="align-middle">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
              <div class="small opacity-75 text-muted mt-1 d-flex align-items-center">
                  <i class="fas fa-user-graduate me-1 opacity-50"></i> Faixa Etária: ${ageLabel}
              </div>
          </td>
          <td class="text-center align-middle" style="width: 150px;">
              <span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-25 rounded-pill px-3 py-1 fw-medium" style="font-size: 0.75rem;">
                  <i class="far fa-clock me-1 text-primary opacity-75"></i> ${item.total_workload_hours || 0}h
              </span>
          </td>
          <td class="text-center align-middle" style="width: 150px;">
              <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.75rem;">
                  <i class="fas fa-book me-1"></i> ${item.phase_count || 0} Fases
              </span>
          </td>
          <td class="text-center align-middle" style="width: 100px;">
              <div class="d-flex align-items-center justify-content-center w-100">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center justify-content-center">
                      <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="toggleCourse(${item.course_id}, this)"` : "disabled"} 
                             style="cursor: ${canEdit ? "pointer" : "default"}; width: 44px; height: 24px;">
                  </div>
              </div>
          </td>
          <td class="text-end align-middle pe-3 text-nowrap" style="width: 140px;">
              <div class="d-flex justify-content-end gap-1">
                ${actionsHtml || '<i class="fas fa-lock text-muted opacity-50" title="Acesso restrito"></i>'}
              </div>
          </td>
      </tr>`;
    })
    .join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-uppercase small opacity-75">Curso / Faixa Etária</th>
                    <th class="text-center text-uppercase small opacity-75">Carga Horária</th>
                    <th class="text-center text-uppercase small opacity-75">Grade</th>
                    <th class="text-center text-uppercase small opacity-75">Estado</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // --- VISÃO MOBILE (IOS-STYLE COMPACTA) ---
  const mobileRows = data
    .map((item) => {
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `+${item.min_age} anos`;

      const isActive = item.is_active === true || item.is_active === "t";

      let mobActionsHtml = "";
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.courses', ${item.course_id}, this)" title="Histórico"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="modalCurso(${item.course_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        mobActionsHtml += `<button class="btn btn-sm text-danger  bg-danger  bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deleteCourse(${item.course_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch position-relative mb-2" style="padding: 12px 16px;">
          <div class="d-flex w-100 align-items-center">
              <div class="flex-grow-1 pe-2" style="min-width: 0;">
                  <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                      <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 0.95rem; max-width: 200px;">${item.name}</h6>
                      <span class="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-0 border border-primary border-opacity-25 rounded-pill" style="font-size: 0.65rem;">${item.phase_count || 0} fases</span>
                  </div>
                  <div class="small text-muted fw-medium d-flex align-items-center mt-1" style="font-size: 0.75rem;">
                      <i class="far fa-clock opacity-50 me-1"></i> Carga: ${item.total_workload_hours || 0}h
                      <span class="mx-2 opacity-25">|</span>
                      <i class="fas fa-user-graduate opacity-50 me-1"></i> ${ageLabel}
                  </div>
              </div>
              <div class="d-flex flex-column align-items-end justify-content-center ms-2 flex-shrink-0">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                      <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="toggleCourse(${item.course_id}, this)"` : "disabled"} 
                             style="cursor: ${canEdit ? "pointer" : "default"}; width: 44px; height: 24px;">
                  </div>
              </div>
          </div>
          
          ${mobActionsHtml ? `<div class="d-flex justify-content-end align-items-center mt-3 pt-3 border-top border-secondary border-opacity-10 w-100"><div class="d-flex gap-2 flex-nowrap">${mobActionsHtml}</div></div>` : ""}
      </div>`;
    })
    .join("");

  container.html(desktopHtml + `<div class="d-md-none ios-list-container">${mobileRows}</div>`);
  _generatePaginationButtons("pagination-cursos", "currentPage", "totalPages", "changePage", defaultCourse);
};

window.modalCurso = (id = null, btn = false) => {
  const modal = $("#modalCurso");
  if (btn) btn = $(btn);

  $("#course_id").val("");
  $("#course_name").val("");
  $("#course_description").val("");
  $("#min_age").val("");
  $("#max_age").val("");
  $("#total_workload").val("0");

  window.currentCurriculumList = [];
  renderCurriculumTable();

  $("#curr_hours").val("20");
  $("#curr_mandatory").prop("checked", true);

  initSelectPhases();

  const firstTabEl = document.querySelector("#courseTab button:first-child");
  if (firstTabEl) {
    const tab = new bootstrap.Tab(firstTabEl);
    tab.show();
  }

  if (id) {
    loadCourseData(id, btn);
  } else {
    $("#modalLabel").html('<i class="fas fa-layer-group me-3 opacity-75"></i> Gerenciar Novo Curso');
    modal.modal("show");
  }
};

window.loadCourseData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const result = await window.ajaxValidator({ validator: "getCourseById", token: window.defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#course_id").val(d.course_id);
      $("#course_name").val(d.name);
      $("#course_description").val(d.description);
      $("#min_age").val(d.min_age);
      $("#max_age").val(d.max_age);
      $("#total_workload").val(d.total_workload_hours);

      window.currentCurriculumList = Array.isArray(d.curriculum) ? d.curriculum : [];
      window.currentCurriculumList.forEach((item) => {
        if (!Array.isArray(item.plans)) item.plans = [];
      });

      renderCurriculumTable();
      initSelectPhases();

      $("#modalLabel").html('<i class="fas fa-pen me-3 opacity-75"></i> Editar Curso e Grade');
      $("#modalCurso").modal("show");
    }
  } catch (e) {
    console.error(e);
  } finally {
    window.setButton(false, btn);
  }
};

window.initSelectPhases = () => {
  const $select = $("#curr_phase");

  if ($select[0] && $select[0].selectize) {
    try {
      $select[0].selectize.destroy();
    } catch (e) {
      console.warn("Aviso Selectize: Erro ao destruir instância de fases.", e);
    }
  }

  $select.selectize({
    valueField: "id",
    labelField: "title",
    searchField: "title",
    placeholder: "Busque uma fase...",
    preload: true,
    maxOptions: 50,
    onChange: function (value) {
      // Interceptador Quick Create
      if (value === "NEW_REGISTER") {
        this.clear(true);
        window.selectizePhaseToUpdate = this;
        $("#modalNovaFase").modal("show");
      }
    },
    render: {
      option: function (item, escape) {
        // Renderiza botão dinâmico
        if (item.id === "NEW_REGISTER") {
          return `<div class="py-2 px-3 border-bottom border-primary border-opacity-25 text-primary fw-bold" style="background-color: var(--bs-primary-bg-subtle);"><i class="fas fa-plus-circle me-2"></i>${escape(item.title)}</div>`;
        }
        return `
          <div class="d-flex align-items-center py-2 px-3 border-bottom border-secondary border-opacity-10">
            <div class="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0" style="width: 36px; height: 36px;">
                <i class="fas fa-book"></i>
            </div>
            <div class="flex-grow-1" style="min-width: 0;">
              <div class="fw-bold text-body text-truncate" style="font-size: 0.9rem;">${escape(item.title)}</div>
              ${item.summary ? `<small class="text-muted text-truncate d-block fw-medium" style="font-size: 0.7rem;">${escape(item.summary)}</small>` : ""}
            </div>
          </div>`;
      },
    },
    load: async function (query, callback) {
      if (!window.defaultApp?.userInfo?.token) return callback();

      try {
        const result = await window.ajaxValidator({
          validator: "getPhasesSelect",
          token: window.defaultApp.userInfo.token,
          search: query,
        });

        if (result.status) {
          let data = result.data || [];
          // Injeta a opção "Nova Fase" na lista via API
          data.push({ id: "NEW_REGISTER", title: "Cadastrar Nova Fase", summary: "Criar no sistema" });
          callback(data);
        } else {
          callback();
          throw new Error(result.alert || "Erro ao buscar fases.");
        }
      } catch (e) {
        callback();
        window.alertErrorWithSupport(`Busca Selectize Fases`, e.message);
      }
    },
  });
};

window.addPhaseToGrid = () => {
  const phaseId = $("#curr_phase").val();
  let phaseText = "Fase";
  if (phaseId && $("#curr_phase")[0].selectize.options[phaseId]) {
    phaseText = $("#curr_phase")[0].selectize.options[phaseId].title;
  }
  const hours = $("#curr_hours").val();
  const isMandatory = $("#curr_mandatory").is(":checked");

  if (!phaseId) return window.alertDefault("Selecione uma fase.", "warning");
  if (!hours || hours <= 0) return window.alertDefault("Informe a carga horária.", "warning");

  if (window.currentCurriculumList.some((i) => i.phase_id == phaseId)) {
    return window.alertDefault("Esta fase já está na grade.", "warning");
  }

  window.currentCurriculumList.push({
    phase_id: phaseId,
    phase_name: phaseText,
    workload_hours: parseInt(hours),
    is_mandatory: isMandatory,
    plans: [],
  });

  renderCurriculumTable();
  updateTotalHours();
  $("#curr_phase")[0].selectize.clear();
  $("#curr_hours").val("20");
};

window.removePhaseFromGrid = (index) => {
  Swal.fire({
    title: "Remover da grade?",
    text: "O planejamento de encontros desta fase será perdido.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, remover",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      window.currentCurriculumList.splice(index, 1);
      renderCurriculumTable();
      updateTotalHours();
      window.alertDefault("Fase removida.", "success");
    }
  });
};

const renderCurriculumTable = () => {
  const container = $("#lista-grade");

  if (window.currentCurriculumList.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1 text-secondary">menu_book</span>
            <p class="mt-2 fw-medium text-body mb-0">Nenhuma fase adicionada à grade.</p>
        </div>
    `);
    return;
  }

  // =========================================================
  // LÓGICA DE PERMISSÕES (RBAC) - GRADE CURRICULAR
  // =========================================================
  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed); // CORREÇÃO RBAC
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}

  const canEdit = allowedSlugs.includes("cursos.save");
  const canTemplate = allowedSlugs.includes("cursos.template");
  const canHistory = allowedSlugs.includes("cursos.history");

  const html = window.currentCurriculumList
    .map((item, index) => {
      const mandatoryBadge = item.is_mandatory
        ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill fw-bold px-2 py-1" style="font-size: 0.65rem;">Obrigatória</span>'
        : '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill fw-bold px-2 py-1" style="font-size: 0.65rem;">Opcional</span>';

      let plansCount = Array.isArray(item.plans) ? item.plans.length : 0;
      const planBtnClass = plansCount > 0 ? "text-primary bg-primary" : "text-secondary bg-secondary";
      const planTextHtml = plansCount > 0 ? `<span class="small text-success fw-bold ms-2" style="font-size: 0.75rem;"><i class="fas fa-check-circle me-1"></i>${plansCount} aulas</span>` : `<span class="small text-muted fst-italic ms-2 opacity-75" style="font-size: 0.75rem;">Sem roteiro</span>`;

      let actionsHtml = "";

      if (canHistory && item.curriculum_id) {
        actionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.curriculum', ${item.curriculum_id}, this)" title="Histórico"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      }

      if (canTemplate) {
        actionsHtml += `<button class="btn btn-sm ${planBtnClass} bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="configureTemplate(${index})" title="${canTemplate ? "Gerenciar Roteiro" : "Ver Roteiro"}"><i class="fas fa-book-open-reader" style="font-size: 0.85rem;"></i></button>`;
      }

      if (canEdit) {
        actionsHtml += `<button class="btn btn-sm text-danger  bg-danger  bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="removePhaseFromGrid(${index})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;
      }

      return `
      <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-inner transition-all">
          <div class="d-flex align-items-center gap-3">
              <div class="bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style="width: 42px; height: 42px;">
                  <i class="fas fa-book-open"></i>
              </div>
              <div>
                  <div class="fw-bold text-body small mb-1">${item.phase_name}</div>
                  <div class="d-flex align-items-center flex-wrap gap-2">
                      <span class="badge text-body border rounded-pill fw-medium px-2 py-1 shadow-sm" style="font-size: 0.65rem;">
                          <i class="far fa-clock me-1 text-primary opacity-75"></i> ${item.workload_hours}h
                      </span>
                      ${mandatoryBadge}
                      ${planTextHtml}
                  </div>
              </div>
          </div>

          <div class="d-flex align-items-center gap-2 ms-3 flex-nowrap">
              ${actionsHtml}
          </div>
      </div>`;
    })
    .join("");

  container.html(html);
};

const updateTotalHours = () => {
  const total = window.currentCurriculumList.reduce((acc, curr) => acc + parseInt(curr.workload_hours || 0), 0);
  $("#total_workload").val(total);
};

window.configureTemplate = (index) => {
  editingCurriculumIndex = index;
  const item = window.currentCurriculumList[index];
  if (!Array.isArray(item.plans)) item.plans = [];

  renderAccordionList();
  $("#modalTemplateAulaLabel").html(`<i class="fa-solid fa-book-open-reader me-3 opacity-75"></i><strong class="text-white ms-1 fw-bold">${item.phase_name}</strong>`);
  $("#modalTemplateAula").css("z-index", 1060);
  $("#modalTemplateAula").modal("show");
};

const renderAccordionList = () => {
  const container = $("#accordionPlans");
  const plans = window.currentCurriculumList[editingCurriculumIndex].plans;

  // Permissão Template
  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed); // CORREÇÃO RBAC
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}
  const canTemplate = allowedSlugs.includes("cursos.template");

  if (plans.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined text-secondary" style="font-size: 56px;">calendar_month</span>
            <p class="mt-3 fw-medium text-body">Nenhum encontro planejado.</p>
            ${
              canTemplate
                ? `
            <div class="d-flex justify-content-center gap-2 mt-3">
                <button class="btn btn-primary btn-sm px-3 shadow-sm rounded-pill fw-bold" onclick="addPlan()"><i class="fas fa-plus me-1"></i> Criar 1º Encontro</button>
                <button class="btn btn-outline-primary btn-sm px-3 shadow-sm rounded-pill fw-bold" onclick="addDefaultModel()"><i class="fas fa-magic me-1"></i> Modelo Padrão</button>
            </div>`
                : ""
            }
        </div>
    `);
    return;
  }

  const html = plans
    .map((plan, i) => {
      const collapseId = `collapsePlan${i}`;
      const headingId = `headingPlan${i}`;
      const isFirst = i === 0;
      const isLast = i === plans.length - 1;

      const orderControls = canTemplate
        ? `
      <div class="me-3 d-flex align-items-center opacity-75" style="min-width: 40px;">
        <button class="btn btn-sm btn-link text-body p-0 me-1" ${isFirst ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, -1)" title="Subir"><i class="fas fa-arrow-up"></i></button>
        <button class="btn btn-sm btn-link text-body p-0 me-2" ${isLast ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, 1)" title="Descer"><i class="fas fa-arrow-down"></i></button>
      </div>`
        : "";

      const deleteBtn = canTemplate
        ? `
      <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="event.stopPropagation(); removePlan(${i})" title="Excluir">
          <i class="fas fa-trash-can"></i>
      </button>`
        : "";

      return `
      <div class="plan-item card border-0 rounded-4 bg-secondary bg-opacity-10 mb-3 shadow-inner overflow-hidden">
          <div class="accordion-header" id="${headingId}">
              <div class="d-flex align-items-center p-3 w-100 cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                  ${orderControls}
                  <div class="me-3 flex-shrink-0">
                      <span class="badge rounded-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-flex align-items-center justify-content-center shadow-sm" style="width: 32px; height: 32px; font-size: 0.85rem;">
                          ${i + 1}
                      </span>
                  </div>
                  <div class="flex-grow-1 me-3" style="min-width: 0;">
                      <input type="text" class="form-control bg-transparent border-0 shadow-none fw-bold text-body fs-6 px-0 text-truncate" 
                             value="${plan.title || "Encontro " + (i + 1)}" 
                             ${canTemplate ? `onchange="updatePlanTitle(${i}, this.value)"` : "readonly"} 
                             onclick="event.stopPropagation()" placeholder="Título do Encontro...">
                  </div>
                  <div class="ms-auto d-flex align-items-center flex-nowrap">
                      <i class="fas fa-chevron-down text-muted me-3 transition-icon"></i>
                      ${deleteBtn}
                  </div>
              </div>
          </div>
          <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#accordionPlans">
              <div class="p-3 pt-0 border-top border-secondary border-opacity-10">
                  <textarea class="summernote-dynamic" data-index="${i}">${plan.content || ""}</textarea>
              </div>
          </div>
      </div>`;
    })
    .join("");

  container.html(html);

  const collapses = document.querySelectorAll(".accordion-collapse");
  collapses.forEach((el) => {
    el.addEventListener("shown.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up text-primary");
      const textarea = this.querySelector(".summernote-dynamic");

      const config = { ...summernoteConfig };
      $(textarea).summernote(config);
      if (!canTemplate) $(textarea).summernote("disable");
    });
    el.addEventListener("hide.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-up").removeClass("fa-chevron-up text-primary").addClass("fa-chevron-down");
      const textarea = this.querySelector(".summernote-dynamic");
      if ($(textarea).next(".note-editor").length > 0) {
        if (canTemplate) window.saveActiveSummernote();
        $(textarea).summernote("destroy");
      }
    });
  });
};

window.addPlan = () => {
  window.currentCurriculumList[editingCurriculumIndex].plans.push({ title: `${window.currentCurriculumList[editingCurriculumIndex].plans.length + 1}º encontro`, content: "" });
  renderAccordionList();
  setTimeout(() => {
    $(`#accordionPlans .accordion-collapse:last`).collapse("show");
  }, 150);
};

window.addDefaultModel = () => {
  const defaultHtml = `
        <p><strong>TEMA:</strong> ...</p>
        <hr>
        <p><strong>1️⃣ ACOLHIDA</strong></p>
        <ul>
            <li><strong>Pergunta inicial:</strong> 👉 ...</li>
        </ul>
        <br>
        <p><strong>2️⃣ ORAÇÃO INICIAL</strong></p>
        <ul>
            <li><strong>Pergunta provocativa:</strong> 👉 ...</li>
        </ul>
        <br>
        <p><strong>3️⃣ PALAVRA DE DEUS</strong> 📖</p>
        <blockquote>“...”</blockquote>
        <br>
        <p><strong>4️⃣ REFLEXÃO</strong></p>
        <ul>
            <li><strong>Pergunta para partilha:</strong> 👉 ...</li>
        </ul>
        <br>
        <p><strong>5️⃣ DINÂMICA</strong></p>
        <p>...</p>
        <br>
        <p><strong>6️⃣ COMPROMISSO</strong></p>
        <p>...</p>
        <br>
        <p><strong>7️⃣ ORAÇÃO FINAL</strong></p>
        <p>...</p>
    `;
  window.currentCurriculumList[editingCurriculumIndex].plans.push({
    title: `${window.currentCurriculumList[editingCurriculumIndex].plans.length + 1}º encontro`,
    content: defaultHtml,
  });
  renderAccordionList();
  setTimeout(() => {
    $(`#accordionPlans .accordion-collapse:last`).collapse("show");
  }, 150);
  window.alertDefault("Modelo adicionado!", "success");
};

window.removePlan = (index) => {
  Swal.fire({
    title: "Excluir o encontro?",
    text: "Conteúdo será perdido.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim",
    cancelButtonText: "Cancelar",
  }).then((r) => {
    if (r.isConfirmed) {
      $(".accordion-collapse.show").collapse("hide");
      setTimeout(() => {
        window.currentCurriculumList[editingCurriculumIndex].plans.splice(index, 1);
        renderAccordionList();
      }, 300);
    }
  });
};

window.movePlan = (index, direction) => {
  const plans = window.currentCurriculumList[editingCurriculumIndex].plans;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= plans.length) return;
  $(".accordion-collapse.show").collapse("hide");
  setTimeout(() => {
    [plans[index], plans[newIndex]] = [plans[newIndex], plans[index]];
    renderAccordionList();
  }, 300);
};

window.updatePlanTitle = (index, value) => {
  window.currentCurriculumList[editingCurriculumIndex].plans[index].title = value;
};

window.exportPlansXlsx = async () => {
  const item = window.currentCurriculumList[editingCurriculumIndex];

  if (!item.plans || item.plans.length === 0) {
    return window.alertDefault("Não há planos de aula para exportar.", "warning");
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Planos de Aula");

    worksheet.columns = [
      { header: "Título do Encontro", key: "title", width: 40 },
      { header: "Conteúdo (HTML)", key: "content", width: 100 },
    ];

    item.plans.forEach((plan) => {
      worksheet.addRow({
        title: plan.title,
        content: plan.content || "",
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4e73df" },
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    const safeName = item.phase_name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    saveAs(blob, `planejamento_${safeName}.xlsx`);

    window.alertDefault("Planilha gerada com sucesso!", "success");
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao gerar planilha.", "error");
  }
};

window.importPlansXlsx = () => {
  $("#importFileXlsx").val("");
  $("#importFileXlsx").click();
};

$("#importFileXlsx").on("change", async function (e) {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);

    reader.onload = async (e) => {
      const buffer = e.target.result;
      const workbook = new ExcelJS.Workbook();

      await workbook.xlsx.load(buffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) throw new Error("Planilha inválida ou vazia.");

      const newPlans = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const cellTitle = row.getCell(1).value;
          const cellContent = row.getCell(2).value;

          const titleStr = cellTitle ? String(cellTitle) : `Encontro ${rowNumber - 1}`;
          const contentStr = cellContent ? String(cellContent) : "";

          newPlans.push({
            title: titleStr,
            content: contentStr,
          });
        }
      });

      if (newPlans.length > 0) {
        Swal.fire({
          title: "Importar Excel",
          html: `Encontrados <b>${newPlans.length}</b> encontros.<br>Como deseja prosseguir?`,
          icon: "question",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Substituir Tudo",
          confirmButtonColor: "#d33",
          denyButtonText: "Adicionar ao Final",
          denyButtonColor: "#3085d6",
          cancelButtonText: "Cancelar",
        }).then((r) => {
          if (r.isConfirmed) {
            window.currentCurriculumList[editingCurriculumIndex].plans = newPlans;
            renderAccordionList();
            window.alertDefault("Planejamento substituído!", "success");
          } else if (r.isDenied) {
            window.currentCurriculumList[editingCurriculumIndex].plans = window.currentCurriculumList[editingCurriculumIndex].plans.concat(newPlans);
            renderAccordionList();
            window.alertDefault("Planos adicionados ao final!", "success");
          }
          $("#importFileXlsx").val("");
        });
      } else {
        window.alertDefault("A planilha parece estar vazia.", "warning");
      }
    };
  } catch (err) {
    console.error(err);
    window.alertDefault("Erro ao ler o arquivo Excel. Verifique o formato.", "error");
    $("#importFileXlsx").val("");
  }
});

window.closeTemplateModal = () => {
  window.saveActiveSummernote();
  $(".accordion-collapse.show").collapse("hide");
  setTimeout(() => {
    $("#modalTemplateAula").modal("hide");
    renderCurriculumTable();
  }, 200);
};

window.salvarCurso = async (btn) => {
  const name = $("#course_name").val()?.trim();
  const id = $("#course_id").val();
  btn = $(btn);

  if (!name) return window.alertDefault("O nome do curso é obrigatório.", "warning");

  window.setButton(true, btn, id ? " Salvando..." : " Cadastrando...");
  if (typeof window.saveActiveSummernote === "function") {
    window.saveActiveSummernote();
  }

  $(".accordion-collapse.show").collapse("hide");
  setTimeout(async () => {
    const data = {
      course_id: id,
      name: name,
      description: $("#course_description").val(),
      min_age: $("#min_age").val(),
      max_age: $("#max_age").val(),
      total_workload_hours: $("#total_workload").val(),
      curriculum_json: JSON.stringify(window.currentCurriculumList || []),
    };

    try {
      const result = await window.ajaxValidator({
        validator: "saveCourse",
        token: window.defaultApp.userInfo.token,
        data: data,
        org_id: localStorage.getItem("tf_active_parish"),
      });

      if (result.status) {
        window.alertDefault("Estrutura do curso salva com sucesso!", "success");
        $("#modalCurso").modal("hide");

        if (typeof getCursos === "function") window.getCursos();
      } else {
        throw new Error(result.alert || result.msg || "O servidor recusou o salvamento do curso.");
      }
    } catch (e) {
      const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar.";
      const acaoContexto = id ? `Editar Curso` : "Criar Novo Curso";
      window.alertErrorWithSupport(acaoContexto, errorMessage);
    } finally {
      window.setButton(false, btn);
    }
  }, 350);
};

window.deleteCourse = (id) => {
  Swal.fire({
    title: "Excluir Curso?",
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
          validator: "deleteCourse",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        if (res.status) {
          window.alertDefault("Curso movido para a lixeira com sucesso.", "success");
          if (typeof getCursos === "function") window.getCursos();
        } else {
          throw new Error(res.alert || res.msg || "O servidor não permitiu excluir este curso.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar remover o curso.";
        window.alertErrorWithSupport(`Excluir Curso`, errorMessage);
      }
    }
  });
};

$("#busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultCourse.currentPage = 1;
    getCursos();
  }, 500);
});

window.changePage = (page) => {
  defaultCourse.currentPage = page;
  getCursos();
};

window.getCursos = getCursos;

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

$(document).ready(() => {
  getCursos();
});

// Quick Create - Salvar Fase
window.salvarFaseRapida = async (btn) => {
  const name = $("#new_phase_title").val().trim();
  const summary = $("#new_phase_summary").val().trim();
  const orgId = localStorage.getItem("tf_active_parish");

  if (!name) return window.alertDefault("Informe o nome da fase.", "warning");

  btn = $(btn);
  window.setButton(true, btn, " Salvando...");

  try {
    // 1. Payload blindado seguindo a assinatura exata do upsertPhase
    const payload = {
      phase_id: "",
      name: name,
      syllabus_summary: summary,
    };

    const res = await window.ajaxValidator({
      validator: "savePhase",
      token: defaultApp.userInfo.token,
      data: payload, // Variáveis encapsuladas
      org_id: orgId, // Cópia na raiz para validação da Controller
    });

    if (res.status) {
      window.alertDefault("Fase criada com sucesso!", "success");
      $("#modalNovaFase").modal("hide");
      $("#new_phase_title").val("");
      $("#new_phase_summary").val("");

      // 2. Mágica Reativa: Busca a nova fase e atualiza o selectize
      if (window.selectizePhaseToUpdate) {
        window.selectizePhaseToUpdate.clearOptions();

        $.ajax({
          url: defaultApp.validator,
          type: "POST",
          dataType: "json",
          data: { validator: "getPhasesSelect", token: defaultApp.userInfo.token, search: name },
          success: function (r) {
            let list = r.data || [];
            // Reinsere a opção de criação
            list.push({ id: "NEW_REGISTER", title: "Cadastrar Nova Fase", summary: "Criar no sistema" });

            // Injeta as opções atualizadas na instância
            list.forEach((item) => window.selectizePhaseToUpdate.addOption(item));

            // Encontra a fase recém-criada (o backend de fases retorna 'title' para o selectize)
            let found = list.find((d) => d.title && d.title.toLowerCase() === name.toLowerCase() && d.id !== "NEW_REGISTER");
            if (found) {
              window.selectizePhaseToUpdate.setValue(found.id);
            }
          },
        });
      }
    } else {
      window.alertDefault(res.alert || "Erro ao criar fase.", "error");
    }
  } catch (e) {
    window.alertErrorWithSupport("Criar Fase", e.message);
  } finally {
    window.setButton(false, btn);
  }
};
