const defaultCourse = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado local da grade
let currentCurriculumList = [];
let editingCurriculumIndex = -1;

// =========================================================
// FUNÇÃO AUXILIAR DE TOGGLE (COM SPINNER E BADGE)
// =========================================================

const handleToggle = async (validator, id, element, successMsg, labelSelector) => {
  const $chk = $(element);
  const $wrapper = $chk.closest(".form-check");
  const $loader = $wrapper.find(".toggle-loader");
  const $labels = $(labelSelector);
  const status = $chk.is(":checked");

  // Define os estados visuais (Feedback Imediato com Badge)
  const setVisualState = (isActive) => {
    if (isActive) {
      $labels.html('<span class="badge bg-success-subtle text-success border border-success">Ativa</span>');
    } else {
      $labels.html('<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>');
    }
  };

  try {
    $chk.prop("disabled", true);
    $loader.removeClass("d-none");
    setVisualState(status);

    const result = await window.ajaxValidator({
      validator: validator,
      token: defaultApp.userInfo.token,
      id: id,
      active: status,
    });

    if (result.status) {
      window.alertDefault(successMsg, "success");
    } else {
      throw new Error(result.alert || "Erro ao atualizar");
    }
  } catch (e) {
    console.error(e);
    $chk.prop("checked", !status);
    setVisualState(!status);
    window.alertDefault(e.message || "Erro de conexão.", "error");
  } finally {
    $chk.prop("disabled", false);
    $loader.addClass("d-none");
  }
};

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

const getCursos = async () => {
  try {
    const page = Math.max(0, defaultCourse.currentPage - 1);
    const search = $("#busca-texto").val();

    $(".list-table-cursos").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await window.ajaxValidator({
      validator: "getCourses",
      token: defaultApp.userInfo.token,
      limit: defaultCourse.rowsPerPage,
      page: page * defaultCourse.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultCourse.totalPages = Math.max(1, Math.ceil(total / defaultCourse.rowsPerPage));
      renderTableCourses(result.data || []);
    } else {
      $(".list-table-cursos").html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 64px;">school</span>
                <p class="mt-2">Nenhum curso encontrado.</p>
            </div>
        `);
    }
  } catch (e) {
    console.error(e);
    $(".list-table-cursos").html('<p class="text-center py-4 text-danger">Erro ao carregar dados.</p>');
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
                <button onclick="openAudit('education.courses', ${item.course_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalCurso(${item.course_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteCourse(${item.course_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age}-${item.max_age} anos`;
      else if (item.min_age) ageLabel = `+${item.min_age} anos`;

      return `
        <div class="mobile-card p-3">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div>
                    <div class="fw-bold fs-6 mb-1">${item.name}</div>
                    <div class="small text-muted mb-2">${ageLabel}</div>
                    <div class="d-flex gap-2">
                        <div class="badge bg-light text-secondary border">${item.total_workload_hours || 0}h</div>
                        <div class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">${item.subjects_count || 0} Matérias</div>
                    </div>
                </div>
                <div>
                    ${getMobileToggleHtml(item.course_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
                <button class="btn-icon-action text-warning" onclick="openAudit('education.courses', ${item.course_id})"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action" onclick="modalCurso(${item.course_id})"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action delete" onclick="deleteCourse(${item.course_id})"><i class="fas fa-trash"></i></button>
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

const loadCourseData = async (id) => {
  try {
    const result = await window.ajaxValidator({ validator: "getCourseById", token: defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#course_id").val(d.course_id);
      $("#course_name").val(d.name);
      $("#course_description").val(d.description);
      $("#min_age").val(d.min_age);
      $("#max_age").val(d.max_age);
      $("#total_workload").val(d.total_workload_hours);

      currentCurriculumList = d.curriculum || [];
      currentCurriculumList.forEach((item) => {
        if (!Array.isArray(item.plans)) item.plans = [];
      });

      renderCurriculumTable();
      initSelectSubjects();

      $("#modalLabel").text("Editar Curso");
      $("#modalCurso").modal("show");
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao carregar curso.", "error");
  }
};

// =========================================================
// 3. GRADE CURRICULAR (ADD/REMOVE)
// =========================================================

const initSelectSubjects = () => {
  const $select = $("#curr_subject");
  if ($select[0].selectize) {
    $select[0].selectize.destroy();
  }

  $select.selectize({
    valueField: "id",
    labelField: "title",
    searchField: "title",
    placeholder: "Busque uma disciplina...",
    preload: true,
    maxOptions: 100,
    render: {
      option: function (item, escape) {
        return `<div><span class="fw-bold">${escape(item.title)}</span></div>`;
      },
    },
    load: async function (query, callback) {
      try {
        const result = await window.ajaxValidator({ validator: "getSubjectsSelect", token: defaultApp.userInfo.token, search: query });
        if (result.status) callback(result.data);
        else callback();
      } catch (e) {
        callback();
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
    container.html('<tr><td colspan="4" class="text-center text-muted py-4 opacity-50"><i class="fas fa-inbox fa-2x mb-2"></i><br>Nenhuma disciplina adicionada.</td></tr>');
    return;
  }

  currentCurriculumList.forEach((item, index) => {
    const mandatoryBadge = item.is_mandatory ? '<span class="badge bg-danger bg-opacity-75">Obrigatória</span>' : '<span class="badge bg-secondary bg-opacity-50">Opcional</span>';

    let plansCount = Array.isArray(item.plans) ? item.plans.length : 0;
    const btnClass = plansCount > 0 ? "btn-primary" : "btn-outline-secondary";
    const infoText = plansCount > 0 ? `<div class="mt-1 small text-success fw-bold"><i class="fas fa-check-circle me-1"></i>${plansCount} aulas planejadas</div>` : `<div class="mt-1 small text-muted fst-italic opacity-75">Sem planejamento</div>`;

    container.append(`
        <tr class="align-middle border-bottom">
            <td class="ps-3 border-0 py-3">
                <div class="fw-bold fs-6">${item.subject_name}</div>
                ${infoText}
            </td>
            <td class="text-center border-0"><span class="badge border text-body bg-transparent opacity-75">${item.workload_hours}h</span></td>
            <td class="text-center border-0">${mandatoryBadge}</td>
            <td class="text-end pe-3 border-0">
                <button class="btn btn-sm ${btnClass} me-2 shadow-sm" onclick="configureTemplate(${index})" title="Planejar Aulas"><i class="fas fa-book-reader"></i></button>
                <button class="btn btn-sm btn-outline-danger border-0" onclick="removeSubjectFromGrid(${index})" title="Remover"><i class="fas fa-trash-alt"></i></button>
            </td>
        </tr>
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
            <span class="material-symbols-outlined" style="font-size: 48px;">calendar_month</span>
            <p class="mt-2">Nenhum encontro planejado.</p>
            <div class="d-flex justify-content-center gap-2">
                <button class="btn btn-success btn-sm" onclick="addPlan()"><i class="fas fa-plus me-1"></i> Criar 1º Encontro</button>
                <button class="btn btn-primary btn-sm" onclick="addDefaultModel()"><i class="fas fa-magic me-1"></i> Modelo Padrão</button>
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

    const upBtn = `<button class="btn btn-sm btn-link text-secondary p-0 me-1" ${isFirst ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, -1)" title="Subir"><i class="fas fa-arrow-up"></i></button>`;
    const downBtn = `<button class="btn btn-sm btn-link text-secondary p-0 me-2" ${isLast ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, 1)" title="Descer"><i class="fas fa-arrow-down"></i></button>`;

    const html = `
        <div class="plan-item">
            <div class="accordion-header" id="${headingId}">
                <div class="d-flex align-items-center p-3 w-100 cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                    <div class="me-3 d-flex align-items-center text-muted" style="min-width: 40px;">${upBtn}${downBtn}</div>
                    <div class="me-3"><span class="badge rounded-pill bg-secondary bg-opacity-25 text-body fw-normal border">#${i + 1}</span></div>
                    <div class="flex-grow-1 me-3">
                        <input type="text" class="form-control form-control-sm input-ghost" value="${plan.title || "Encontro " + (i + 1)}" onclick="event.stopPropagation()" onchange="updatePlanTitle(${i}, this.value)" placeholder="Título do Encontro">
                    </div>
                    <div class="ms-auto d-flex align-items-center">
                        <i class="fas fa-chevron-down text-muted small me-3 transition-icon"></i>
                        <button class="btn btn-sm btn-link text-danger p-0" onclick="event.stopPropagation(); removePlan(${i})" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
            <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#accordionPlans">
                <div class="p-0 border-top">
                    <textarea class="summernote-dynamic" data-index="${i}">${plan.content || ""}</textarea>
                </div>
            </div>
        </div>
    `;
    container.append(html);
  });

  const collapses = document.querySelectorAll(".accordion-collapse");
  collapses.forEach((el) => {
    el.addEventListener("shown.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");
      const textarea = this.querySelector(".summernote-dynamic");
      $(textarea).summernote(summernoteConfig);
    });
    el.addEventListener("hide.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");
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
  const name = $("#course_name").val().trim();
  if (!name) return window.alertDefault("Nome do curso é obrigatório.", "warning");

  window.saveActiveSummernote();
  $(".accordion-collapse.show").collapse("hide");

  setTimeout(async () => {
    const btn = $(".btn-save");
    window.setButton(true, btn, "Salvando...");

    const data = {
      course_id: $("#course_id").val(),
      name: name,
      description: $("#course_description").val(),
      min_age: $("#min_age").val(),
      max_age: $("#max_age").val(),
      total_workload_hours: $("#total_workload").val(),
      curriculum_json: JSON.stringify(currentCurriculumList),
    };

    try {
      const result = await window.ajaxValidator({ validator: "saveCourse", token: defaultApp.userInfo.token, data: data, org_id: localStorage.getItem("tf_active_parish") });
      if (result.status) {
        window.alertDefault("Curso salvo com sucesso!", "success");
        $("#modalCurso").modal("hide");
        getCursos();
      } else {
        window.alertDefault(result.alert, "error");
      }
    } catch (e) {
      console.error(e);
      window.alertDefault("Erro ao salvar.", "error");
    } finally {
      window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar Curso');
    }
  }, 300);
};

window.deleteCourse = (id) => {
  Swal.fire({
    title: "Excluir Curso?",
    text: "Isso não apaga turmas passadas, mas impede novas.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteCourse", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Excluído.", "success");
        getCursos();
      } else {
        window.alertDefault(res.alert, "error");
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
