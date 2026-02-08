const defaultCourse = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado local da grade
let currentCurriculumList = [];
let editingCurriculumIndex = -1;

// [CORREÇÃO CRÍTICA] Função de Auto-Save definida ANTES da config do Summernote
window.saveActiveSummernote = () => {
  // Itera sobre todos os editores instanciados na tela (classe .summernote-dynamic)
  $(".summernote-dynamic").each(function () {
    const $textarea = $(this);

    // Verifica se este textarea tem um editor summernote ativo (note-editor existe após ele)
    if ($textarea.next(".note-editor").length > 0) {
      const idx = $textarea.data("index");
      const content = $textarea.summernote("code");

      // Validação de segurança para garantir que o índice existe
      if (editingCurriculumIndex > -1 && currentCurriculumList[editingCurriculumIndex]) {
        const item = currentCurriculumList[editingCurriculumIndex];

        // Garante que o array de planos existe
        if (!Array.isArray(item.plans)) item.plans = [];

        // Garante que o objeto do encontro existe
        if (!item.plans[idx]) {
          item.plans[idx] = { title: `Encontro ${idx + 1}`, content: "" };
        }

        // Atualiza o conteúdo em memória
        item.plans[idx].content = content;
      }
    }
  });
};

// Configuração Summernote (Com Callback corrigido)
const summernoteConfig = {
  height: 300,
  lang: "pt-BR",
  placeholder: "Descreva o conteúdo planejado para este encontro...",
  dialogsInBody: true, // Fix para modais bootstrap
  toolbar: [
    ["style", ["style", "bold", "italic", "underline", "clear"]],
    ["font", ["color", "fontsize"]],
    ["para", ["ul", "ol", "paragraph"]],
    ["insert", ["link", "emoji", "hr", "table", "picture"]],
    ["view", ["fullscreen", "codeview", "help"]],
  ],
  callbacks: {
    // Agora a função existe no escopo global
    onBlur: function () {
      window.saveActiveSummernote();
    },
    onInit: function () {
      // Ajuste visual para tema escuro se necessário
      $(".note-editor").addClass("bg-white text-dark");
    },
  },
};

// =========================================================
// 1. LISTAGEM (DASHBOARD)
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
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultCourse.totalPages = Math.max(1, Math.ceil(total / defaultCourse.rowsPerPage));
      renderTableCourses(result.data || []);
    } else {
      $(".list-table-cursos").html('<p class="text-center py-4 text-muted">Nenhum curso encontrado.</p>');
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
            <div class="text-center py-5">
                <i class="fas fa-graduation-cap fa-3x text-muted mb-3 opacity-25"></i>
                <p class="text-muted">Nenhum curso cadastrado.</p>
            </div>
        `);
    return;
  }

  let rows = data
    .map((item) => {
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `A partir de ${item.min_age} anos`;

      const toggleHtml = window.renderToggle ? window.renderToggle(item.course_id, item.is_active, "toggleCourse") : `<input type="checkbox" ${item.is_active ? "checked" : ""} onchange="toggleCourse(${item.course_id}, this)">`;

      return `
        <tr>
            <td style="width: 60px;" class="align-middle border-0 ps-3">
                <div class="icon-circle bg-primary bg-opacity-10 text-primary">
                    <span class="material-symbols-outlined">school</span>
                </div>
            </td>
            <td class="align-middle border-0">
                <div class="fw-bold">${item.name}</div>
                <small class="text-muted">${ageLabel}</small>
            </td>
            <td class="text-center align-middle border-0">
                <span class="badge" style="background-color: rgba(128,128,128,0.15); color: inherit;">
                    <i class="fas fa-clock me-1"></i> ${item.total_workload_hours || 0}h
                </span>
            </td>
            <td class="text-center align-middle border-0">
                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                    ${item.subjects_count || 0} Matérias
                </span>
            </td>
            <td class="text-center align-middle border-0">
                ${toggleHtml}
            </td>
            <td class="text-end pe-3 align-middle border-0">
                <button onclick="openAudit('education.courses', ${item.course_id})" class="btn btn-sm btn-link text-warning p-1" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalCurso(${item.course_id})" class="btn btn-sm btn-link text-secondary p-1" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteCourse(${item.course_id})" class="btn btn-sm btn-link text-danger p-1" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(
    `<table class="table table-hover mb-0"><thead><tr><th colspan="2" class="border-0 ps-3">Curso</th><th class="text-center border-0">Carga</th><th class="text-center border-0">Grade</th><th class="text-center border-0">Ativo</th><th class="text-end pe-4 border-0">Ações</th></tr></thead><tbody>${rows}</tbody></table>`,
  );

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

      // Backend retorna array 'plans' dentro de cada item da grade
      currentCurriculumList = d.curriculum || [];

      // Normalização extra
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
        const result = await window.ajaxValidator({
          validator: "getSubjectsSelect",
          token: defaultApp.userInfo.token,
          search: query,
        });
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
  // Safe get text do selectize
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
    plans: [], // Array vazio inicial
  });

  renderCurriculumTable();
  updateTotalHours();

  // Reset inputs
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
      window.toast("Disciplina removida.", "success");
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
    const mandatoryBadge = item.is_mandatory ? '<span class="badge bg-danger">Obrigatória</span>' : '<span class="badge bg-secondary">Opcional</span>';

    let plansCount = Array.isArray(item.plans) ? item.plans.length : 0;

    const btnClass = plansCount > 0 ? "btn-primary" : "btn-outline-secondary";
    const infoText = plansCount > 0 ? `<div class="mt-1 text-success small fw-bold"><i class="fas fa-check-circle me-1"></i>${plansCount} aulas planejadas</div>` : `<div class="mt-1 text-muted small fst-italic">Sem planejamento</div>`;

    container.append(`
            <tr class="align-middle border-0">
                <td class="ps-3 border-0">
                    <span class="fw-bold fs-6">${item.subject_name}</span>
                    ${infoText}
                </td>
                <td class="text-center border-0"><span class="badge bg-light text-dark border">${item.workload_hours}h</span></td>
                <td class="text-center border-0">${mandatoryBadge}</td>
                <td class="text-end pe-3 border-0">
                    <button class="btn btn-sm ${btnClass} me-2 shadow-sm" onclick="configureTemplate(${index})" title="Planejar Aulas">
                        <i class="fas fa-book-reader"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="removeSubjectFromGrid(${index})" title="Remover">
                        <i class="fas fa-trash-alt"></i>
                    </button>
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
            <div class="text-center py-5 text-muted">
                <i class="fas fa-calendar-plus fa-3x mb-3 opacity-25"></i>
                <p>Nenhum encontro planejado.</p>
                <button class="btn btn-success btn-sm mt-2" onclick="addPlan()">
                    <i class="fas fa-plus me-1"></i> Criar 1º Encontro
                </button>
            </div>
        `);
    return;
  }

  plans.forEach((plan, i) => {
    const collapseId = `collapsePlan${i}`;
    const headingId = `headingPlan${i}`;
    const isFirst = i === 0;
    const isLast = i === plans.length - 1;

    // Botões de movimento
    const upBtn = `<button class="btn btn-sm btn-link text-secondary p-0 me-1" ${isFirst ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, -1)" title="Subir"><i class="fas fa-arrow-up"></i></button>`;
    const downBtn = `<button class="btn btn-sm btn-link text-secondary p-0 me-2" ${isLast ? 'disabled style="opacity:0.2"' : ""} onclick="event.stopPropagation(); movePlan(${i}, 1)" title="Descer"><i class="fas fa-arrow-down"></i></button>`;

    const html = `
            <div class="plan-item">
                <div class="accordion-header" id="${headingId}">
                    <div class="d-flex align-items-center p-3 w-100 cursor-pointer" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
                        
                        <div class="me-3 d-flex align-items-center" style="min-width: 40px;">
                            ${upBtn}
                            ${downBtn}
                        </div>
                        
                        <div class="me-3">
                            <span class="badge rounded-pill bg-secondary bg-opacity-25 text-body fw-normal" style="min-width: 30px;">#${i + 1}</span>
                        </div>
                        
                        <div class="flex-grow-1 me-3">
                            <input type="text" class="form-control form-control-sm input-transparent" 
                                value="${plan.title || "Encontro " + (i + 1)}" 
                                onclick="event.stopPropagation()" 
                                onchange="updatePlanTitle(${i}, this.value)"
                                placeholder="Título do Encontro">
                        </div>
                        
                        <div class="ms-auto d-flex align-items-center">
                            <i class="fas fa-chevron-down text-muted small me-3 transition-icon"></i>
                            <button class="btn btn-sm btn-link text-danger p-0" onclick="event.stopPropagation(); removePlan(${i})" title="Excluir">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#accordionPlans">
                    <div class="p-0 border-top">
                        <textarea class="summernote-dynamic" data-index="${i}">${plan.content || ""}</textarea>
                    </div>
                </div>
            </div>
        `;
    container.append(html);
  });

  // Inicialização Inteligente (Performance)
  const collapses = document.querySelectorAll(".accordion-collapse");
  collapses.forEach((el) => {
    el.addEventListener("shown.bs.collapse", function () {
      // Animação de seta (opcional)
      $(this).prev().find(".fa-chevron-down").removeClass("fa-chevron-down").addClass("fa-chevron-up");

      const textarea = this.querySelector(".summernote-dynamic");
      $(textarea).summernote(summernoteConfig);
    });

    el.addEventListener("hide.bs.collapse", function () {
      $(this).prev().find(".fa-chevron-up").removeClass("fa-chevron-up").addClass("fa-chevron-down");

      const textarea = this.querySelector(".summernote-dynamic");
      // Salva antes de destruir
      if ($(textarea).next(".note-editor").length > 0) {
        // Chama nossa função global de save para garantir
        window.saveActiveSummernote();
        $(textarea).summernote("destroy");
      }
    });
  });
};

window.addPlan = () => {
  currentCurriculumList[editingCurriculumIndex].plans.push({
    title: `Encontro ${currentCurriculumList[editingCurriculumIndex].plans.length + 1}`,
    content: "",
  });
  renderAccordionList();

  // Abre o último (delay para render)
  setTimeout(() => {
    $(`#accordionPlans .accordion-collapse:last`).collapse("show");
  }, 150);
};

window.removePlan = (index) => {
  Swal.fire({
    title: "Excluir Encontro?",
    text: "O conteúdo será perdido permanentemente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then((r) => {
    if (r.isConfirmed) {
      // Fecha todos para forçar save pendente
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
    // Swap
    [plans[index], plans[newIndex]] = [plans[newIndex], plans[index]];
    renderAccordionList();
  }, 300);
};

window.updatePlanTitle = (index, value) => {
  currentCurriculumList[editingCurriculumIndex].plans[index].title = value;
};

// --- IMPORTAR / EXPORTAR ---

window.exportPlans = () => {
  const item = currentCurriculumList[editingCurriculumIndex];
  if (!item.plans || item.plans.length === 0) return window.alertDefault("Nada para exportar.", "warning");

  const dataStr = JSON.stringify(item.plans, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Plano_${item.subject_name.replace(/\s+/g, "_")}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

window.importPlans = () => {
  $("#importFile").click();
};

$("#importFile").on("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const json = JSON.parse(e.target.result);
      if (Array.isArray(json)) {
        Swal.fire({
          title: "Importar Plano",
          text: "Deseja substituir o plano atual ou adicionar ao final?",
          icon: "question",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Substituir Tudo",
          denyButtonText: "Adicionar ao Final",
          cancelButtonText: "Cancelar",
        }).then((r) => {
          if (r.isConfirmed) {
            currentCurriculumList[editingCurriculumIndex].plans = json;
          } else if (r.isDenied) {
            currentCurriculumList[editingCurriculumIndex].plans = currentCurriculumList[editingCurriculumIndex].plans.concat(json);
          } else {
            $("#importFile").val("");
            return;
          }
          renderAccordionList();
          window.toast("Importado com sucesso!", "success");
        });
      } else {
        window.alertDefault("Formato inválido. Use um arquivo JSON exportado do sistema.", "error");
      }
    } catch (err) {
      window.alertDefault("Erro ao ler arquivo.", "error");
    }
    $("#importFile").val("");
  };
  reader.readAsText(file);
});

window.closeTemplateModal = () => {
  // Força save de qualquer editor aberto
  window.saveActiveSummernote();
  $(".accordion-collapse.show").collapse("hide");

  setTimeout(() => {
    $("#modalTemplateAula").modal("hide");
    renderCurriculumTable(); // Atualiza contadores na tabela principal
  }, 200);
};

// =========================================================
// 5. SALVAR CURSO (FINAL)
// =========================================================

window.salvarCurso = async () => {
  const name = $("#course_name").val().trim();
  if (!name) return window.alertDefault("Nome do curso é obrigatório.", "warning");

  // Garante save do editor aberto
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
      // Envia o objeto completo com os planos
      curriculum_json: JSON.stringify(currentCurriculumList),
    };

    try {
      const result = await window.ajaxValidator({
        validator: "saveCourse",
        token: defaultApp.userInfo.token,
        data: data,
      });

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
      window.setButton(false, btn, '<i class="fas fa-check me-2"></i> Salvar Curso');
    }
  }, 300);
};

// =========================================================
// 5. AÇÕES (TOGGLE / DELETE)
// =========================================================

window.toggleCourse = async (id, element) => {
  if (window.handleToggle) {
    window.handleToggle("toggleCourse", id, element, "Status atualizado.");
  } else {
    const $chk = $(element);
    try {
      await window.ajaxValidator({ validator: "toggleCourse", token: defaultApp.userInfo.token, id: id, active: $chk.is(":checked") });
      window.alertDefault("Status atualizado.");
    } catch (e) {
      $chk.prop("checked", !$chk.is(":checked"));
    }
  }
};
window.deleteCourse = (id) => {
  /* ... */
};
$("#busca-texto").on("change keyup", function () {
  /* ... */
});
window.changePage = (page) => {
  /* ... */
};
window.getCursos = getCursos;
$(document).ready(() => {
  getCursos();
});
const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  /* ... */
};
