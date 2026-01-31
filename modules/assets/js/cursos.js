const defaultCourse = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Estado local para gerenciar a Grade Curricular antes de salvar
let currentCurriculumList = [];

// =========================================================
// 1. LISTAGEM (DASHBOARD DO CURSO)
// =========================================================

const getCursos = async () => {
  try {
    const page = Math.max(0, defaultCourse.currentPage - 1);
    const search = $("#busca-texto").val();

    // Feedback de carregamento
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
      // Formata Faixa Etária
      let ageLabel = "Livre";
      if (item.min_age && item.max_age) ageLabel = `${item.min_age} a ${item.max_age} anos`;
      else if (item.min_age) ageLabel = `A partir de ${item.min_age} anos`;

      // Toggle Seguro
      const toggleHtml = window.renderToggle ? window.renderToggle(item.course_id, item.is_active, "toggleCourse") : `<input type="checkbox" ${item.is_active ? "checked" : ""} onchange="toggleCourse(${item.course_id}, this)">`;

      return `
        <tr>
            <td style="width: 60px;">
                <div class="icon-circle bg-light text-warning">
                    <span class="material-symbols-outlined">school</span>
                </div>
            </td>
            <td>
                <div class="fw-bold text-dark">${item.name}</div>
                <small class="text-muted">${ageLabel}</small>
            </td>
            <td class="text-center">
                <span class="badge bg-light text-dark border">
                    <i class="fas fa-clock me-1"></i> ${item.total_workload_hours || 0}h
                </span>
            </td>
            <td class="text-center">
                <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25">
                    ${item.subjects_count || 0} Matérias
                </span>
            </td>
            <td class="text-center align-middle">
                ${toggleHtml}
            </td>
            <td class="text-end pe-3">
                <button onclick="openAudit('education.courses', ${item.course_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalCurso(${item.course_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteCourse(${item.course_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th colspan="2">Curso</th><th class="text-center">Carga Horária</th><th class="text-center">Grade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);

  _generatePaginationButtons("pagination-cursos", "currentPage", "totalPages", "getCursos", defaultCourse);
};

// =========================================================
// 2. CADASTRO E EDIÇÃO (MODAL)
// =========================================================

window.modalCurso = (id = null) => {
  const modal = $("#modalCurso");

  // Reseta Form
  $("#course_id").val("");
  $("#course_name").val("");
  $("#course_description").val("");
  $("#min_age").val("");
  $("#max_age").val("");
  $("#total_workload").val("0");

  // Reseta Grade Curricular
  currentCurriculumList = [];
  renderCurriculumTable();

  // Limpa Inputs da Grade
  $("#curr_hours").val("");
  $("#curr_mandatory").prop("checked", true);

  // Inicializa o Selectize corretamente
  initSelectSubjects();

  // Reset Abas
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

      // Dados Básicos
      $("#course_id").val(d.course_id);
      $("#course_name").val(d.name);
      $("#course_description").val(d.description);
      $("#min_age").val(d.min_age);
      $("#max_age").val(d.max_age);
      $("#total_workload").val(d.total_workload_hours);

      // Popula Grade (Array do Backend)
      // Backend retorna: [{subject_id, subject_name, workload_hours, is_mandatory}, ...]
      currentCurriculumList = d.curriculum || [];

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
// 3. GESTÃO DE GRADE CURRICULAR (ABA 2)
// =========================================================

const initSelectSubjects = () => {
  const $select = $("#curr_subject"); // ID correto do campo

  // Limpa instância anterior
  if ($select[0].selectize) {
    $select[0].selectize.destroy();
  }

  $select.selectize({
    valueField: 'id',
    labelField: 'title',
    searchField: 'title',
    placeholder: 'Busque uma disciplina...',
    preload: true, // Carrega as 100 primeiras ao clicar
    maxOptions: 100,
    // Renderização simplificada (sem mostrar horas, pois não temos esse dado)
    render: {
      option: function(item, escape) {
        return `<div>
                    <span class="fw-bold">${escape(item.title)}</span>
                </div>`;
      }
    },
    load: async function(query, callback) {
      try {
        const result = await window.ajaxValidator({
          validator: 'getSubjectsSelect',
          token: defaultApp.userInfo.token,
          search: query
        });

        if (result.status) {
          callback(result.data);
        } else {
          callback();
        }
      } catch (e) {
        console.error("Erro ao buscar disciplinas:", e);
        callback();
      }
    },
    onChange: function (value) {
      if (!value) return;
      const selectize = $select[0].selectize;
      const data = selectize.options[value];
    
      // Preenche a carga horária automaticamente se disponível
      if (data && data.workload_hours) {
        $("#curr_hours").val(data.workload_hours);
      }
    },
  });
};

// Adicionar Matéria à Lista Temporária
window.addSubjectToGrid = () => {
  const subjectId = $("#curr_subject").val();
  const subjectText = $("#curr_subject")[0].selectize.getItem(subjectId).text(); // Pega o nome visual
  const hours = $("#curr_hours").val();
  const isMandatory = $("#curr_mandatory").is(":checked");

  if (!subjectId) return window.alertDefault("Selecione uma disciplina.", "warning");
  if (!hours || hours <= 0) return window.alertDefault("Informe a carga horária.", "warning");

  // Verifica duplicidade
  if (currentCurriculumList.some((i) => i.subject_id == subjectId)) {
    return window.alertDefault("Esta disciplina já está na grade.", "warning");
  }

  currentCurriculumList.push({
    subject_id: subjectId,
    subject_name: subjectText,
    workload_hours: parseInt(hours),
    is_mandatory: isMandatory,
  });

  renderCurriculumTable();
  updateTotalHours(); // Recalcula total

  // Limpa campos para próxima inserção
  $("#curr_subject")[0].selectize.clear();
  $("#curr_hours").val("");
  $("#curr_mandatory").prop("checked", true);
};

window.removeSubjectFromGrid = (index) => {
  currentCurriculumList.splice(index, 1);
  renderCurriculumTable();
  updateTotalHours();
};

const renderCurriculumTable = () => {
  const container = $("#lista-grade");
  container.empty();

  if (currentCurriculumList.length === 0) {
    container.html('<tr><td colspan="4" class="text-center text-muted py-3">Nenhuma disciplina adicionada.</td></tr>');
    return;
  }

  currentCurriculumList.forEach((item, index) => {
    const mandatoryBadge = item.is_mandatory ? '<span class="badge bg-danger">Obrigatória</span>' : '<span class="badge bg-secondary">Opcional</span>';

    container.append(`
            <tr>
                <td>${item.subject_name}</td>
                <td class="text-center">${item.workload_hours}h</td>
                <td class="text-center">${mandatoryBadge}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="removeSubjectFromGrid(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            </tr>
        `);
  });
};

const updateTotalHours = () => {
  // Soma as horas da lista e atualiza o campo da Aba 1
  const total = currentCurriculumList.reduce((acc, curr) => acc + parseInt(curr.workload_hours), 0);
  $("#total_workload").val(total);
};

// =========================================================
// 4. SALVAR TUDO
// =========================================================

window.salvarCurso = async () => {
  const name = $("#course_name").val().trim();
  if (!name) return window.alertDefault("Nome do curso é obrigatório.", "warning");

  if (currentCurriculumList.length === 0) {
    // Opcional: Impedir curso sem matérias? Vou deixar passar com aviso.
    // return window.alertDefault("Adicione pelo menos uma disciplina.", "warning");
  }

  const btn = $(".btn-save");
  window.setButton(true, btn, "Salvando...");

  const data = {
    course_id: $("#course_id").val(),
    name: name,
    description: $("#course_description").val(),
    min_age: $("#min_age").val(),
    max_age: $("#max_age").val(),
    total_workload_hours: $("#total_workload").val(),

    // Envia a grade como JSON
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
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar');
  }
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
  Swal.fire({
    title: "Excluir Curso?",
    text: "Isso não apaga turmas passadas, mas impede novas.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim, excluir",
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

// =========================================================
// UTILITÁRIOS
// =========================================================

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
