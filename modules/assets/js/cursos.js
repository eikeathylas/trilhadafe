const defaultCourse = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado local da grade
let currentCurriculumList = [];
let editingCurriculumIndex = -1;

window.toggleCourse = (id, element) => handleToggle("toggleCourse", id, element, "Status atualizado.", `.status-text-course-${id}`);

// =========================================================
// SUMMERNOTE & CONFIGS
// =========================================================

// [AUTO-SAVE] Salva Summernote antes de destruir ou perder foco
window.saveActiveSummernote = () => {
  $(".summernote-dynamic").each(function () {
    const $textarea = $(this);
    if ($textarea.next(".note-editor").length > 0) {
      const idx = $textarea.data("index");
      const content = $textarea.summernote("code");

      if (editingCurriculumIndex > -1 && currentCurriculumList[editingCurriculumIndex]) {
        const item = currentCurriculumList[editingCurriculumIndex];
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

// =========================================================
// 1. LISTAGEM
// =========================================================

window.getCursos = async () => {
  const container = $(".list-table-cursos");

  try {
    const page = Math.max(0, defaultCourse.currentPage - 1);
    const search = $("#busca-texto").val();

    // 2. Chamada à API com prefixos padronizados
    const result = await window.ajaxValidator({
      validator: "getCourses",
      token: window.defaultApp.userInfo.token,
      limit: defaultCourse.rowsPerPage,
      page: page * defaultCourse.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso: Atualiza paginação e renderiza tabela
        const total = dataArray[0]?.total_registros || 0;
        defaultCourse.totalPages = Math.max(1, Math.ceil(total / defaultCourse.rowsPerPage));
        renderTableCourses(dataArray);
      } else {
        // Estado Vazio: Sem resultados (Não é um erro)
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 64px;">school</span>
                <p class="mt-3 fw-medium text-body">Nenhum curso encontrado no sistema.</p>
            </div>
        `);
      }
    } else {
      // REGRA APLICADA: Lança o erro para o Catch tratar
      throw new Error(result.alert || result.msg || "O servidor não conseguiu processar a lista de cursos.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor.";

    // 4. Feedback Visual de Erro com botão de recuperação
    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-book-reader fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar cursos</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getCursos()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Cursos (getCourses)", errorMessage);
  }
};

const renderTableCourses = (data) => {
  const container = $(".list-table-cursos");

  if (data.length === 0) {
    container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 64px;">school</span>
                <p class="mt-2">Nenhum curso cadastrado.</p>
            </div>
        `);
    return;
  }

  // Helper Toggle Desktop
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleCourse(${id}, this)" style="cursor: pointer;">
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
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleCourse(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-course-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  // DESKTOP
  let desktopRows = data
    .map((item) => {
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `A partir de ${item.min_age} anos`;

      return `
        <tr>
            <td class="text-center align-middle ps-3" style="width: 60px;">
                <div class="icon-circle bg-primary bg-opacity-10 text-primary">
                    <span class="material-symbols-outlined">school</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold">${item.name}</div>
                <div class="small opacity-75">${ageLabel}</div>
            </td>
            <td class="text-center align-middle">
                <span class="badge border text-body bg-transparent">
                    <i class="fas fa-clock me-1"></i> ${item.total_workload_hours || 0}h
                </span>
            </td>
            <td class="text-center align-middle">
                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                    ${item.subjects_count || 0} Matérias
                </span>
            </td>
            <td class="text-center align-middle">
                ${getToggleHtml(item.course_id, item.is_active)}
            </td>
            <td class="text-end align-middle pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('education.courses', ${item.course_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="modalCurso(${item.course_id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteCourse(${item.course_id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      // Lógica da Faixa Etária
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `+${item.min_age} anos`;

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 pe-3">
                    
                    <h6 class="fw-bold mb-1 fs-5">${item.name}</h6>
                    
                    <div class="small text-muted mb-3 d-flex align-items-center lh-1 mt-1">
                        <i class="fas fa-user-graduate me-2 opacity-50"></i> Faixa Etária: ${ageLabel}
                    </div>
                    
                    <div class="d-flex flex-wrap gap-2 mt-1">
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium px-2 py-1">
                            <i class="far fa-clock me-1 opacity-75"></i> ${item.total_workload_hours || 0}h
                        </span>
                        
                        <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 fw-medium px-2 py-1">
                            <i class="fas fa-book me-1 opacity-75"></i> ${item.subjects_count || 0} Matérias
                        </span>
                    </div>
                </div>
                
                <div class="text-end mt-1">
                    ${getMobileToggleHtml(item.course_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('education.courses', ${item.course_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="modalCurso(${item.course_id})" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteCourse(${item.course_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead><tr><th colspan="2" class="ps-3">Curso</th><th class="text-center">Carga Horária</th><th class="text-center">Grade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none">${mobileRows}</div>
  `);

  _generatePaginationButtons("pagination-cursos", "currentPage", "totalPages", "getCursos", defaultCourse);
};

// =========================================================
// 2. CADASTRO DE CURSO E GRADE
// =========================================================

window.modalCurso = (id = null) => {
  const modal = $("#modalCurso");

  $("#course_id").val("");
  $("#course_name").val("");
  $("#course_description").val("");
  $("#min_age").val("");
  $("#max_age").val("");
  $("#total_workload").val("0");

  currentCurriculumList = [];
  renderCurriculumTable();

  $("#curr_hours").val("20");
  $("#curr_mandatory").prop("checked", true);

  initSelectSubjects();

  $("#courseTab button:first").tab("show");

  if (id) {
    loadCourseData(id);
  } else {
    $("#modalLabel").text("Novo Curso");
    modal.modal("show");
  }
};

window.loadCourseData = async (id) => {
  try {
    // 1. Chamada à API com prefixos padronizados
    const result = await window.ajaxValidator({
      validator: "getCourseById",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const d = result.data;

      // PREENCHIMENTO DOS CAMPOS BÁSICOS
      $("#course_id").val(d.course_id);
      $("#course_name").val(d.name);
      $("#course_description").val(d.description);
      $("#min_age").val(d.min_age);
      $("#max_age").val(d.max_age);
      $("#total_workload").val(d.total_workload_hours);

      // 2. Gestão de Matriz Curricular (Garantia de integridade)
      // Se d.curriculum vier null ou undefined, inicializa como array vazio
      window.currentCurriculumList = Array.isArray(d.curriculum) ? d.curriculum : [];

      window.currentCurriculumList.forEach((item) => {
        // Garante que a propriedade plans sempre exista como array para não quebrar o render
        if (!Array.isArray(item.plans)) item.plans = [];
      });

      // 3. Inicialização da Interface do Modal
      if (typeof renderCurriculumTable === "function") renderCurriculumTable();
      if (typeof initSelectSubjects === "function") initSelectSubjects();

      $("#modalLabel").text("Editar Estrutura do Curso");
      $("#modalCurso").modal("show");
    } else {
      // REGRA APLICADA: Lança o erro para o Catch tratar
      throw new Error(result.alert || "O servidor não retornou os dados deste curso.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar curso.";

    window.alertErrorWithSupport(`Abrir Edição de Curso`, errorMessage);
  }
};

// =========================================================
// 3. GRADE CURRICULAR (ADD/REMOVE)
// =========================================================

window.initSelectSubjects = () => {
  const $select = $("#curr_subject");

  // 1. Destruição Segura da Instância Anterior
  if ($select[0] && $select[0].selectize) {
    try {
      $select[0].selectize.destroy();
    } catch (e) {
      console.warn("Aviso Selectize: Erro ao destruir instância de disciplinas.", e);
    }
  }

  // 2. Inicialização com Carregamento Remoto
  $select.selectize({
    valueField: "id",
    labelField: "title",
    searchField: "title",
    placeholder: "Busque uma disciplina para adicionar...",
    preload: true,
    maxOptions: 50,
    render: {
      option: function (item, escape) {
        return `
          <div class="py-1 px-2 border-bottom border-light">
            <div class="fw-bold text-dark">${escape(item.title)}</div>
            ${item.summary ? `<small class="text-muted d-block opacity-75">${escape(item.summary)}</small>` : ""}
          </div>`;
      },
    },
    load: async function (query, callback) {
      // Evita chamadas vazias desnecessárias se não houver token
      if (!window.defaultApp?.userInfo?.token) return callback();

      try {
        const result = await window.ajaxValidator({
          validator: "getSubjectsSelect",
          token: window.defaultApp.userInfo.token,
          search: query,
        });

        if (result.status) {
          callback(result.data || []);
        } else {
          // REGRA APLICADA: Notifica o callback e lança erro interno
          callback();
          throw new Error(result.alert || "Erro ao buscar disciplinas.");
        }
      } catch (e) {
        callback();
        window.alertErrorWithSupport(`Busca Selectize Disciplinas`, e.message);
      }
    },
  });
};

window.addSubjectToGrid = () => {
  const subjectId = $("#curr_subject").val();
  let subjectText = "Disciplina";
  if (subjectId && $("#curr_subject")[0].selectize.options[subjectId]) {
    subjectText = $("#curr_subject")[0].selectize.options[subjectId].title;
  }
  const hours = $("#curr_hours").val();
  const isMandatory = $("#curr_mandatory").is(":checked");

  if (!subjectId) return window.alertDefault("Selecione uma disciplina.", "warning");
  if (!hours || hours <= 0) return window.alertDefault("Informe a carga horária.", "warning");

  if (currentCurriculumList.some((i) => i.subject_id == subjectId)) {
    return window.alertDefault("Esta disciplina já está na grade.", "warning");
  }

  currentCurriculumList.push({
    subject_id: subjectId,
    subject_name: subjectText,
    workload_hours: parseInt(hours),
    is_mandatory: isMandatory,
    plans: [],
  });

  renderCurriculumTable();
  updateTotalHours();
  $("#curr_subject")[0].selectize.clear();
  $("#curr_hours").val("20");
};

window.removeSubjectFromGrid = (index) => {
  Swal.fire({
    title: "Remover da grade?",
    text: "O planejamento de aulas desta disciplina será perdido.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, remover",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      currentCurriculumList.splice(index, 1);
      renderCurriculumTable();
      updateTotalHours();
      window.alertDefault("Disciplina removida.", "success");
    }
  });
};

const renderCurriculumTable = () => {
  const container = $("#lista-grade");
  container.empty();

  if (currentCurriculumList.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1">menu_book</span>
            <p class="mt-2 small mb-0">Nenhuma disciplina adicionada à grade.</p>
        </div>
    `);
    return;
  }

  currentCurriculumList.forEach((item, index) => {
    // Badges Modernas com Transparência
    const mandatoryBadge = item.is_mandatory
      ? '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 fw-bold px-2 py-1" style="font-size: 0.65rem;">Obrigatória</span>'
      : '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold px-2 py-1" style="font-size: 0.65rem;">Opcional</span>';

    // Lógica Visual para Aulas Planejadas
    let plansCount = Array.isArray(item.plans) ? item.plans.length : 0;
    const planIconClass = plansCount > 0 ? "text-primary" : "text-muted opacity-50";
    const planBtnClass = plansCount > 0 ? "bg-primary" : "bg-secondary";
    const planTextHtml = plansCount > 0 ? `<span class="small text-success fw-bold ms-2" style="font-size: 0.75rem;"><i class="fas fa-check-circle me-1"></i>${plansCount} aulas</span>` : `<span class="small text-muted fst-italic ms-2 opacity-75" style="font-size: 0.75rem;">Sem plano</span>`;

    container.append(`
        <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 mb-2 shadow-sm transition-all">
            
            <div class="d-flex align-items-center gap-3">
                <div class="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center shadow-inner" style="width: 42px; height: 42px;">
                    <i class="fas fa-book-open"></i>
                </div>
                
                <div>
                    <div class="fw-bold text-body fs-6 mb-1">${item.subject_name}</div>
                    <div class="d-flex align-items-center flex-wrap gap-1">
                        <span class="badge bg-body text-body border fw-medium px-2 py-1 shadow-sm" style="font-size: 0.7rem;">
                            <i class="far fa-clock me-1 opacity-75"></i> ${item.workload_hours}h
                        </span>
                        ${mandatoryBadge}
                        ${planTextHtml}
                    </div>
                </div>
            </div>

            <div class="d-flex align-items-center gap-2">
                <button class="btn-icon-action ${planBtnClass} bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" 
                        style="width: 36px; height: 36px;" onclick="configureTemplate(${index})" title="Planejar Aulas">
                    <i class="fas fa-book-reader ${planIconClass} fs-6"></i>
                </button>

                <button class="btn-icon-action btn-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" 
                        style="width: 36px; height: 36px;" onclick="removeSubjectFromGrid(${index})" title="Remover">
                    <i class="fas fa-trash-can text-danger fs-6"></i>
                </button>
            </div>
            
        </div>
    `);
  });
};

const updateTotalHours = () => {
  const total = currentCurriculumList.reduce((acc, curr) => acc + parseInt(curr.workload_hours || 0), 0);
  $("#total_workload").val(total);
};

// =========================================================
// 4. GESTÃO DE PLANOS (ACCORDION & SUMMERNOTE)
// =========================================================

window.configureTemplate = (index) => {
  editingCurriculumIndex = index;
  const item = currentCurriculumList[index];
  if (!Array.isArray(item.plans)) item.plans = [];

  renderAccordionList();
  $("#modalTemplateAulaLabel").html(`<i class="fas fa-book-reader me-2"></i> Planejamento: <strong>${item.subject_name}</strong>`);
  $("#modalTemplateAula").css("z-index", 1060);
  $("#modalTemplateAula").modal("show");
};

const renderAccordionList = () => {
  const container = $("#accordionPlans");
  container.empty();
  const plans = currentCurriculumList[editingCurriculumIndex].plans;

  if (plans.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined" style="font-size: 56px;">calendar_month</span>
            <p class="mt-3 fw-medium text-body">Nenhum encontro planejado.</p>
            <div class="d-flex justify-content-center gap-2 mt-3">
                <button class="btn btn-primary btn-sm px-3 shadow-sm rounded-pill" onclick="addPlan()"><i class="fas fa-plus me-1"></i> Criar 1º Encontro</button>
                <button class="btn btn-outline-primary btn-sm px-3 shadow-sm rounded-pill" onclick="addDefaultModel()"><i class="fas fa-magic me-1"></i> Modelo</button>
            </div>
        </div>
    `);
    return;
  }

  plans.forEach((plan, i) => {
    const collapseId = `collapsePlan${i}`;
    const headingId = `headingPlan${i}`;
    const isFirst = i === 0;
    const isLast = i === plans.length - 1;

    const upBtn = `<button class="btn btn-sm btn-link text-body p-0 me-1" ${isFirst ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, -1)" title="Subir"><i class="fas fa-arrow-up"></i></button>`;
    const downBtn = `<button class="btn btn-sm btn-link text-body p-0 me-2" ${isLast ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, 1)" title="Descer"><i class="fas fa-arrow-down"></i></button>`;

    // Container do item com design Soft UI
    const html = `
        <div class="plan-item card border-0 rounded-4 bg-secondary bg-opacity-10 mb-3 shadow-sm overflow-hidden">
            <div class="accordion-header" id="${headingId}">
                <div class="d-flex align-items-center p-3 w-100 cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                    
                    <div class="me-3 d-flex align-items-center opacity-75" style="min-width: 40px;">${upBtn}${downBtn}</div>
                    
                    <div class="me-3">
                        <span class="badge rounded-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-flex align-items-center justify-content-center shadow-inner" style="width: 32px; height: 32px; font-size: 0.85rem;">
                            ${i + 1}
                        </span>
                    </div>
                    
                    <div class="flex-grow-1 me-3">
                        <input type="text" class="form-control bg-transparent border-0 shadow-none fw-bold text-body fs-6 px-0" value="${plan.title || "Encontro " + (i + 1)}" onclick="event.stopPropagation()" onchange="updatePlanTitle(${i}, this.value)" placeholder="Título do Encontro...">
                    </div>
                    
                    <div class="ms-auto d-flex align-items-center">
                        <i class="fas fa-chevron-down text-muted me-3 transition-icon"></i>
                        <button class="btn-icon-action btn-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 32px; height: 32px;" onclick="event.stopPropagation(); removePlan(${i})" title="Excluir">
                            <i class="fas fa-trash-can text-danger"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#accordionPlans">
                <div class="p-3 pt-0 border-top border-secondary border-opacity-10 bg-body">
                    <textarea class="summernote-dynamic" data-index="${i}">${plan.content || ""}</textarea>
                </div>
            </div>
        </div>
    `;
    container.append(html);
  });

  // Re-inicializa o Summernote com os ícones corretos
  const collapses = document.querySelectorAll(".accordion-collapse");
  collapses.forEach((el) => {
    el.addEventListener("shown.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up text-primary");
      const textarea = this.querySelector(".summernote-dynamic");
      $(textarea).summernote(summernoteConfig);
    });
    el.addEventListener("hide.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-up").removeClass("fa-chevron-up text-primary").addClass("fa-chevron-down");
      const textarea = this.querySelector(".summernote-dynamic");
      if ($(textarea).next(".note-editor").length > 0) {
        window.saveActiveSummernote();
        $(textarea).summernote("destroy");
      }
    });
  });
};

window.addPlan = () => {
  currentCurriculumList[editingCurriculumIndex].plans.push({ title: `${currentCurriculumList[editingCurriculumIndex].plans.length + 1}º encontro`, content: "" });
  renderAccordionList();
  setTimeout(() => {
    $(`#accordionPlans .accordion-collapse:last`).collapse("show");
  }, 150);
};

// [NOVO] Modelo Padrão
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
  currentCurriculumList[editingCurriculumIndex].plans.push({
    title: `${currentCurriculumList[editingCurriculumIndex].plans.length + 1}º encontro`,
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
        currentCurriculumList[editingCurriculumIndex].plans.splice(index, 1);
        renderAccordionList();
      }, 300);
    }
  });
};

window.movePlan = (index, direction) => {
  const plans = currentCurriculumList[editingCurriculumIndex].plans;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= plans.length) return;
  $(".accordion-collapse.show").collapse("hide");
  setTimeout(() => {
    [plans[index], plans[newIndex]] = [plans[newIndex], plans[index]];
    renderAccordionList();
  }, 300);
};

window.updatePlanTitle = (index, value) => {
  currentCurriculumList[editingCurriculumIndex].plans[index].title = value;
};

// =========================================================
// IMPORTAR / EXPORTAR (EXCELJS)
// =========================================================

// Exportar .xlsx
window.exportPlansXlsx = async () => {
  const item = currentCurriculumList[editingCurriculumIndex];

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

    const safeName = item.subject_name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
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
            currentCurriculumList[editingCurriculumIndex].plans = newPlans;
            renderAccordionList();
            window.alertDefault("Planejamento substituído!", "success");
          } else if (r.isDenied) {
            currentCurriculumList[editingCurriculumIndex].plans = currentCurriculumList[editingCurriculumIndex].plans.concat(newPlans);
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

window.salvarCurso = async () => {
  const name = $("#course_name").val()?.trim();
  const id = $("#course_id").val();

  // 1. Validação de Front-end (Sem suporte)
  if (!name) return window.alertDefault("O nome do curso é obrigatório.", "warning");

  // Sincroniza editores de texto (Summernote) antes de capturar o JSON
  if (typeof window.saveActiveSummernote === "function") {
    window.saveActiveSummernote();
  }

  // Fecha accordions abertos para garantir que o DOM esteja estável
  $(".accordion-collapse.show").collapse("hide");

  // Pequeno delay para garantir que os valores dos inputs/summernote foram processados
  setTimeout(async () => {
    const btn = $(".btn-save");
    window.setButton(true, btn, "Salvando...");

    const data = {
      course_id: id,
      name: name,
      description: $("#course_description").val(),
      min_age: $("#min_age").val(),
      max_age: $("#max_age").val(),
      total_workload_hours: $("#total_workload").val(),
      // Garantimos o envio da matriz curricular global
      curriculum_json: JSON.stringify(window.currentCurriculumList || []),
    };

    try {
      // 2. Chamada à API com prefixos padronizados
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
        // REGRA APLICADA: Lança o erro para o Catch tratar
        throw new Error(result.alert || result.msg || "O servidor recusou o salvamento do curso.");
      }
    } catch (e) {
      const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar.";

      const acaoContexto = id ? `Editar Curso` : "Criar Novo Curso";

      window.alertErrorWithSupport(acaoContexto, errorMessage);
    } finally {
      // 4. Sempre libera o botão
      window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar Curso');
    }
  }, 350); // Delay técnico para sincronização de UI
};

window.deleteCourse = (id) => {
  Swal.fire({
    title: "Excluir Curso?",
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
          validator: "deleteCourse",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        // 2. Tratamento do Resultado
        if (res.status) {
          window.alertDefault("Curso movido para a lixeira com sucesso.", "success");

          // Atualiza a listagem de cursos se a função existir
          if (typeof getCursos === "function") window.getCursos();
        } else {
          // REGRA APLICADA: Lança o erro para o Catch tratar e reportar
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
  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary">Primeira</button>`;
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"}">${p}</button>`;
  }
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary">Última</button>`;
  container.html(html);
};

$(document).ready(() => {
  getCursos();
});
