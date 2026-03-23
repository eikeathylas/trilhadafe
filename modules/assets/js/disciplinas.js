const defaultSubject = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Declaração Global do Toggle com Dual Status (Padrão de Excelência)
window.toggleSubject = (id, element) => handleToggle("toggleSubject", id, element, "Estado atualizado.", `.status-text-sub-${id}`, getDisciplinas);

const getDisciplinas = async () => {
  const container = $(".list-table-disciplinas");

  try {
    const page = Math.max(0, defaultSubject.currentPage - 1);
    const search = $("#busca-texto").val();

    const result = await window.ajaxValidator({
      validator: "getSubjects",
      token: window.defaultApp.userInfo.token,
      limit: defaultSubject.rowsPerPage,
      page: page * defaultSubject.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultSubject.totalPages = Math.max(1, Math.ceil(total / defaultSubject.rowsPerPage));
        renderTableSubjects(dataArray);
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined fs-1 text-secondary">menu_book</span>
                <p class="mt-3 fw-medium text-body">Nenhuma disciplina ou etapa encontrada.</p>
            </div>
        `);
        $(".pagination-disciplinas").empty();
      }
    } else {
      throw new Error(result.alert || "O servidor não conseguiu processar a lista de disciplinas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar disciplinas.";

    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm mt-2" onclick="getDisciplinas()">
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
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1 text-secondary">menu_book</span>
            <p class="mt-2 fw-medium text-body">Nenhum registo encontrado.</p>
        </div>
    `);
    $(".pagination-disciplinas").empty();
    return;
  }

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CUSTOM PREMIUM)
  // =========================================================
  const desktopRows = data.map((item) => {
    const summary = item.syllabus_summary
      ? (item.syllabus_summary.length > 70 ? item.syllabus_summary.substring(0, 70) + "..." : item.syllabus_summary)
      : '<span class="text-muted small fst-italic">Sem ementa registada</span>';

    const isActive = item.is_active === true || item.is_active === "t";

    return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">
              <div class="icon-circle bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 shadow-sm">
                  <span class="material-symbols-outlined" style="font-size: 20px;">menu_book</span>
              </div>
          </td>
          <td class="align-middle" style="width: 30%;">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
          </td>
          <td class="align-middle">
              <div class="text-secondary small fw-medium lh-sm">${summary}</div>
          </td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="d-flex align-items-center justify-content-center gap-2">
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center position-relative">
                      <input class="form-check-input shadow-none m-0" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleSubject(${item.subject_id}, this)" style="width: 44px; height: 24px; cursor: pointer;">
                  </div>
              </div>
          </td>
          <td class="text-end align-middle pe-3 text-nowrap" style="width: 140px;">
              <button class="btn-icon-action text-warning" onclick="openAudit('education.subjects', ${item.subject_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
              <button class="btn-icon-action text-primary" onclick="modalDisciplina(${item.subject_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon-action text-danger" onclick="deleteSubject(${item.subject_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </td>
      </tr>`;
  }).join("");

  const desktopHtml = `
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-uppercase" style="font-size: 0.75rem;">Disciplina</th>
                    <th class="text-uppercase" style="font-size: 0.75rem;">Ementa / Resumo</th>
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
    const summary = item.syllabus_summary ? item.syllabus_summary : '<span class="fst-italic opacity-50">Sem ementa registada.</span>';

    // Ícone estático de estado para Mobile
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
                          <i class="fas fa-book me-1"></i> DISCIPLINA
                      </span>
                  </div>
              </div>
              <div class="text-end">
                  <div class="d-flex align-items-center justify-content-end gap-2">
                  <!-- <div class="status-text-sub-${item.subject_id} d-flex align-items-center">${statusIconHtml}</div> -->
                      <div class="form-check form-switch m-0 p-0 d-flex align-items-center position-relative">
                          <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleSubject(${item.subject_id}, this)" style="cursor: pointer; width: 44px; height: 24px;">
                      </div>
                  </div>
              </div>
          </div>

          <div class="mt-3 p-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-inner">
              <label class="form-label small fw-bold text-uppercase text-muted mb-1" style="font-size: 0.65rem; letter-spacing: 0.5px;">Ementa / Resumo</label>
              <div class="text-body small fw-medium lh-sm" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                  ${summary}
              </div>
          </div>
          
          <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
              <button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('education.subjects', ${item.subject_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
              <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="modalDisciplina(${item.subject_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteSubject(${item.subject_id})" title="Excluir"><i class="fas fa-trash"></i></button>
          </div>
      </div>`;
  }).join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-disciplinas", "currentPage", "totalPages", "changePage", defaultSubject);
};

window.modalDisciplina = (id = null, btn = false) => {
  const modal = $("#modalDisciplina");
  $("#subject_id").val("");
  $("#subject_name").val("");
  $("#subject_summary").val("");

  if (btn) btn = $(btn);

  if (id) {
    loadSubjectData(id, btn);
  } else {
    $("#modalLabel").text("Nova Disciplina");
    modal.modal("show");
  }
};

const loadSubjectData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const result = await window.ajaxValidator({
      validator: "getSubjectById",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const d = result.data;

      $("#subject_id").val(d.subject_id);
      $("#subject_name").val(d.name);
      $("#subject_summary").val(d.syllabus_summary);

      $("#modalLabel").text("Editar Disciplina/Etapa");
      $("#modalDisciplina").modal("show");
    } else {
      throw new Error(result.alert || "O servidor não retornou os dados desta disciplina.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar dados.";
    window.alertErrorWithSupport(`Abrir Edição de Disciplina`, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.salvarDisciplina = async (btn) => {
  const name = $("#subject_name").val()?.trim();
  const id = $("#subject_id").val();
  btn = $(btn);

  if (!name) return window.alertDefault("O nome da disciplina é obrigatório.", "warning");

  window.setButton(true, btn, id ? " A guardar..." : " A registar...");

  const data = {
    subject_id: id,
    name: name,
    syllabus_summary: $("#subject_summary").val()?.trim(),
  };

  try {
    const result = await window.ajaxValidator({
      validator: "saveSubject",
      token: window.defaultApp.userInfo.token,
      data: data,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      window.alertDefault("Disciplina guardada com sucesso!", "success");
      $("#modalDisciplina").modal("hide");

      if (typeof getDisciplinas === "function") getDisciplinas();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento desta disciplina.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao guardar.";
    const acaoContexto = id ? `Editar Disciplina` : "Criar Nova Disciplina";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteSubject = (id) => {
  Swal.fire({
    title: "Excluir Disciplina?",
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
          validator: "deleteSubject",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        if (res.status) {
          window.alertDefault("Disciplina movida para a lixeira.", "success");

          if (typeof getDisciplinas === "function") window.getDisciplinas();
        } else {
          throw new Error(res.alert || "O banco de dados não permitiu a exclusão desta disciplina.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de ligação ao tentar excluir a disciplina.";
        window.alertErrorWithSupport(`Excluir Disciplina`, errorMessage);
      }
    }
  });
};

$("#busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultSubject.currentPage = 1;
    getDisciplinas();
  }, 500);
});

window.getDisciplinas = getDisciplinas;

window.changePage = (page) => {
  defaultSubject.currentPage = page;
  getDisciplinas();
};

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();

  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];

  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary me-1 shadow-sm" ${current === 1 ? "disabled" : ""}>Primeira</button>`;

  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) {
    let btnClass = p === current ? "btn-primary" : "btn-secondary";
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${btnClass} me-1 shadow-sm">${p}</button>`;
  }

  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary shadow-sm" ${current === total ? "disabled" : ""}>Última</button>`;

  container.html(html);
};

$(document).ready(() => {
  getDisciplinas();
});