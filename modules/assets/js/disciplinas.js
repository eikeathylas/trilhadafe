const defaultSubject = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// =========================================================
// FUNÇÃO AUXILIAR DE TOGGLE (COM SPINNER E BADGE)
// =========================================================

const handleToggle = async (validator, id, element, successMsg, labelSelector) => {
  const $chk = $(element);
  const $wrapper = $chk.closest(".form-check");
  const $loader = $wrapper.find(".toggle-loader");
  const $labels = $(labelSelector);
  const status = $chk.is(":checked");

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

window.toggleSubject = (id, element) => handleToggle("toggleSubject", id, element, "Status atualizado.", `.status-text-sub-${id}`);

// =========================================================
// 1. LISTAGEM
// =========================================================

const getDisciplinas = async () => {
  try {
    const page = Math.max(0, defaultSubject.currentPage - 1);
    const search = $("#busca-texto").val();

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
    container.html(`<div class="text-center py-5"><i class="fas fa-book fa-3x text-muted mb-3 opacity-25"></i><p class="text-muted">Nenhum registro encontrado.</p></div>`);
    return;
  }

  // Helper Toggle Desktop
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleSubject(${id}, this)" style="cursor: pointer;">
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
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleSubject(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-sub-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  // DESKTOP
  let desktopRows = data
    .map((item) => {
      const summary = item.syllabus_summary ? (item.syllabus_summary.length > 50 ? item.syllabus_summary.substring(0, 50) + "..." : item.syllabus_summary) : '<span class="text-muted small">Sem ementa</span>';

      return `<tr>
            <td class="text-center align-middle" style="width: 60px;">
                <div class="icon-circle bg-light text-primary"><span class="material-symbols-outlined">menu_book</span></div>
            </td>
            <td class="align-middle"><div class="fw-bold text-dark">${item.name}</div></td>
            <td class="align-middle"><div class="text-secondary small">${summary}</div></td>
            <td class="text-center align-middle">
                ${getToggleHtml(item.subject_id, item.is_active)}
            </td>
            <td class="text-end align-middle pe-3">
                <button onclick="openAudit('education.subjects', ${item.subject_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalDisciplina(${item.subject_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteSubject(${item.subject_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      return `
        <div class="mobile-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="fw-bold fs-6">${item.name}</div>
                <div>
                    ${getMobileToggleHtml(item.subject_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
                <button onclick="openAudit('education.subjects', ${item.subject_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalDisciplina(${item.subject_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteSubject(${item.subject_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2">Disciplina</th>
                    <th>Ementa</th>
                    <th class="text-center">Ativo</th>
                    <th class="text-end pe-4">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none">${mobileRows}</div>
  `);

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
      org_id: localStorage.getItem("tf_active_parish"),
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
