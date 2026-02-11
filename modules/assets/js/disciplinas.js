const defaultSubject = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// =========================================================
// 1. LISTAGEM
// =========================================================

const getDisciplinas = async () => {
  try {
    const page = Math.max(0, defaultSubject.currentPage - 1);
    const search = $("#busca-texto").val();

    // Feedback de carregamento
    $(".list-table-disciplinas").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await window.ajaxValidator({
      validator: "getSubjects",
      token: defaultApp.userInfo.token,
      limit: defaultSubject.rowsPerPage,
      page: page * defaultSubject.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultSubject.totalPages = Math.max(1, Math.ceil(total / defaultSubject.rowsPerPage));
      renderTableSubjects(result.data || []);
    } else {
      $(".list-table-disciplinas").html('<p class="text-center py-4 text-muted">Nenhuma disciplina encontrada.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-disciplinas").html('<p class="text-center py-4 text-danger">Erro ao carregar dados.</p>');
  }
};

const renderTableSubjects = (data) => {
  const container = $(".list-table-disciplinas");

  if (data.length === 0) {
    container.html(`
            <div class="text-center py-5">
                <i class="fas fa-book fa-3x text-muted mb-3 opacity-25"></i>
                <p class="text-muted">Nenhum registro encontrado.</p>
            </div>
        `);
    return;
  }

  let rows = data
    .map((item) => {
      // Trunca o resumo
      const summary = item.syllabus_summary ? (item.syllabus_summary.length > 50 ? item.syllabus_summary.substring(0, 50) + "..." : item.syllabus_summary) : '<span class="text-muted small">Sem ementa</span>';

      // Toggle seguro
      const toggleHtml = window.renderToggle
        ? window.renderToggle(item.subject_id, item.is_active, "toggleSubject")
        : `<div class="form-check form-switch d-flex justify-content-center"><input class="form-check-input toggleSwitch" type="checkbox" ${item.is_active ? "checked" : ""} onchange="toggleSubject(${item.subject_id}, this)"></div>`;

      return `
        <tr>
            <td class="text-center align-middle" style="width: 60px;">
                <div class="icon-circle bg-light text-primary">
                    <span class="material-symbols-outlined">menu_book</span>
                </div>
            </td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.name}</div>
            </td>
            <td class="align-middle">
                <div class="text-secondary small">${summary}</div>
            </td>
            <td class="text-center align-middle">
                ${toggleHtml}
            </td>
            <td class="text-end align-middle pe-3">
                <button onclick="openAudit('education.subjects', ${item.subject_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalDisciplina(${item.subject_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteSubject(${item.subject_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th colspan="2">Disciplina</th><th>Ementa</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);

  // Paginação
  _generatePaginationButtons("pagination-disciplinas", "currentPage", "totalPages", "getDisciplinas", defaultSubject);
};

// =========================================================
// 2. CADASTRO E EDIÇÃO
// =========================================================

window.modalDisciplina = (id = null) => {
  const modal = $("#modalDisciplina");
  $("#subject_id").val("");
  $("#subject_name").val("");
  $("#subject_summary").val("");

  if (id) {
    loadSubjectData(id);
  } else {
    $("#modalLabel").text("Nova Disciplina");
    modal.modal("show");
  }
};

const loadSubjectData = async (id) => {
  try {
    const result = await window.ajaxValidator({ validator: "getSubjectById", token: defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#subject_id").val(d.subject_id);
      $("#subject_name").val(d.name);
      $("#subject_summary").val(d.syllabus_summary);

      $("#modalLabel").text("Editar Disciplina");
      $("#modalDisciplina").modal("show");
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao carregar.", "error");
  }
};

window.salvarDisciplina = async () => {
  const name = $("#subject_name").val().trim();
  if (!name) return window.alertDefault("Nome da disciplina é obrigatório.", "warning");

  const btn = $(".btn-save");
  window.setButton(true, btn, "Salvando...");

  const data = {
    subject_id: $("#subject_id").val(),
    name: name,
    syllabus_summary: $("#subject_summary").val().trim(),
  };

  try {
    const result = await window.ajaxValidator({
      validator: "saveSubject",
      token: defaultApp.userInfo.token,
      data: data,
      org_id: localStorage.getItem("tf_active_parish")
    });

    if (result.status) {
      window.alertDefault("Salvo com sucesso!", "success");
      $("#modalDisciplina").modal("hide");
      getDisciplinas();
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
// 3. AÇÕES
// =========================================================

window.toggleSubject = async (id, element) => {
  if (window.handleToggle) {
    window.handleToggle("toggleSubject", id, element, "Status atualizado.");
  } else {
    // Fallback
    const $chk = $(element);
    try {
      await window.ajaxValidator({ validator: "toggleSubject", token: defaultApp.userInfo.token, id: id, active: $chk.is(":checked") });
      window.alertDefault("Atualizado.");
    } catch (e) {
      $chk.prop("checked", !$chk.is(":checked"));
    }
  }
};

window.deleteSubject = (id) => {
  Swal.fire({
    title: "Excluir Disciplina?",
    text: "Vai para a lixeira.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteSubject", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Excluído.", "success");
        getDisciplinas();
      } else {
        window.alertDefault(res.alert, "error");
      }
    }
  });
};

// =========================================================
// UTILITÁRIOS E PAGINAÇÃO
// =========================================================

$("#busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultSubject.currentPage = 1;
    getDisciplinas();
  }, 500);
});

// Expõe função para o HTML
window.getDisciplinas = getDisciplinas;

// Função interna de mudar página
window.changePage = (page) => {
  defaultSubject.currentPage = page;
  getDisciplinas();
};

// Função Geradora de Botões de Paginação
const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();

  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];

  // Como as funções estão no window, passamos o nome como string para o onclick
  let html = `<button onclick="changePage(1)" class="btn btn-sm btn-secondary">Primeira</button>`;

  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    let btnClass = p === current ? "btn-primary" : "btn-secondary";
    html += `<button onclick="changePage(${p})" class="btn btn-sm ${btnClass}">${p}</button>`;
  }

  html += `<button onclick="changePage(${total})" class="btn btn-sm btn-secondary">Última</button>`;

  container.html(html);
};

$(document).ready(() => {
  getDisciplinas();
});
