const defaultSubject = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

window.toggleSubject = (id, element) => handleToggle("toggleSubject", id, element, "Status atualizado.", `.status-text-sub-${id}`);

// =========================================================
// 1. LISTAGEM
// =========================================================

const getDisciplinas = async () => {
  try {
    const page = Math.max(0, defaultSubject.currentPage - 1);
    const search = $("#busca-texto").val();

    // 2. Chamada à API com prefixo window. padronizado
    const result = await window.ajaxValidator({
      validator: "getSubjects",
      token: window.defaultApp.userInfo.token,
      limit: defaultSubject.rowsPerPage,
      page: page * defaultSubject.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso com dados: Renderiza a tabela e atualiza paginação
        const total = dataArray[0]?.total_registros || 0;
        defaultSubject.totalPages = Math.max(1, Math.ceil(total / defaultSubject.rowsPerPage));
        renderTableSubjects(dataArray);
      } else {
        // Estado Vazio: Busca não retornou resultados (Não é um erro)
        $(".list-table-disciplinas").html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">menu_book</span>
                <p class="mt-3 fw-medium text-body">Nenhuma disciplina ou etapa encontrada.</p>
            </div>
        `);
      }
    } else {
      throw new Error(result.alert || "O servidor não conseguiu processar a lista de disciplinas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar disciplinas.";

    // 4. Feedback Visual de Erro Integrado à Interface
    $(".list-table-disciplinas").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-circle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getDisciplinas()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Disciplinas/Etapas", errorMessage);
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
                <button class="btn-icon-action text-warning" onclick="openAudit('education.subjects', ${item.subject_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="modalDisciplina(${item.subject_id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteSubject(${item.subject_id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5 d-flex align-items-center">
                        <i class="fas fa-book me-2 text-primary opacity-75"></i> ${item.name}
                    </h6>
                    <div class="small text-muted mt-1 lh-1">
                        Disciplina
                    </div>
                </div>
                
                <div class="text-end mt-1">
                    ${getMobileToggleHtml(item.subject_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('education.subjects', ${item.subject_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="modalDisciplina(${item.subject_id})" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteSubject(${item.subject_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
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
    // 1. Chamada à API com prefixos padronizados
    const result = await window.ajaxValidator({
      validator: "getSubjectById",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const d = result.data;

      // PREENCHIMENTO DOS CAMPOS
      $("#subject_id").val(d.subject_id);
      $("#subject_name").val(d.name);
      $("#subject_summary").val(d.syllabus_summary);

      // INTERFACE
      $("#modalLabel").text("Editar Disciplina/Etapa");
      $("#modalDisciplina").modal("show");
    } else {
      throw new Error(result.alert || "O servidor não retornou os dados desta disciplina.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar dados.";
    window.alertErrorWithSupport(`Abrir Edição de Disciplina`, errorMessage);
  }
};

window.salvarDisciplina = async () => {
  const name = $("#subject_name").val()?.trim();
  const id = $("#subject_id").val();

  // 1. Validação de Front-end (Sem suporte)
  if (!name) return window.alertDefault("Nome da disciplina é obrigatório.", "warning");

  const btn = $(".btn-save");
  window.setButton(true, btn, "Salvando...");

  const data = {
    subject_id: id,
    name: name,
    syllabus_summary: $("#subject_summary").val()?.trim(),
  };

  try {
    // 2. Chamada à API com prefixos padronizados
    const result = await window.ajaxValidator({
      validator: "saveSubject",
      token: window.defaultApp.userInfo.token,
      data: data,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      window.alertDefault("Disciplina salva com sucesso!", "success");
      $("#modalDisciplina").modal("hide");

      if (typeof getDisciplinas === "function") getDisciplinas();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento desta disciplina.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar.";
    const acaoContexto = id ? `Editar Disciplina` : "Criar Nova Disciplina";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    // 4. Sempre libera o botão
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar');
  }
};

// =========================================================
// 3. AÇÕES
// =========================================================

window.deleteSubject = (id) => {
  Swal.fire({
    title: "Excluir Disciplina?",
    text: "O registro será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d", // Cinza padrão EaCode
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        // Chamada à API com prefixos padronizados
        const res = await window.ajaxValidator({
          validator: "deleteSubject",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        // Tratamento do Resultado
        if (res.status) {
          window.alertDefault("Disciplina movida para a lixeira.", "success");

          if (typeof getDisciplinas === "function") window.getDisciplinas();
        } else {
          throw new Error(res.alert || "O banco de dados não permitiu a exclusão desta disciplina.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar excluir a disciplina.";

        window.alertErrorWithSupport(`Excluir Disciplina`, errorMessage);
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
