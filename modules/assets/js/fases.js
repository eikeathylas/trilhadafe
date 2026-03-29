const defaultPhase = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

// Declaração Global do Toggle com Dual Status (Padrão de Excelência)
window.togglePhase = (id, element) => handleToggle("togglePhase", id, element, "Estado atualizado.", `.status-text-sub-${id}`, getFases);

const getFases = async () => {
  const container = $(".list-table-fases");

  try {
    const page = Math.max(0, defaultPhase.currentPage - 1);
    const search = $("#busca-texto").val();

    const result = await window.ajaxValidator({
      validator: "getPhases",
      token: window.defaultApp.userInfo.token,
      limit: defaultPhase.rowsPerPage,
      page: page * defaultPhase.rowsPerPage,
      search: search,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultPhase.totalPages = Math.max(1, Math.ceil(total / defaultPhase.rowsPerPage));
        renderTablePhases(dataArray);
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined fs-1 text-secondary">menu_book</span>
                <p class="mt-3 fw-medium text-body">Nenhuma fase ou etapa encontrada.</p>
            </div>
        `);
        $(".pagination-fases").empty();
      }
    } else {
      throw new Error(result.alert || "O servidor não conseguiu processar a lista de fases.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar fases.";

    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm mt-2" onclick="getFases()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Fases/Etapas", errorMessage);
  }
};

const renderTablePhases = (data) => {
  const container = $(".list-table-fases");

  if (data.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined fs-1 text-secondary">menu_book</span>
            <p class="mt-2 fw-medium text-body">Nenhum registo encontrado.</p>
        </div>
    `);
    $(".pagination-fases").empty();
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

  const canEdit = allowedSlugs.includes("fases.save");
  const canHistory = allowedSlugs.includes("fases.history");
  const canDelete = allowedSlugs.includes("fases.delete");

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CUSTOM PREMIUM)
  // =========================================================
  const desktopRows = data
    .map((item) => {
      const summary = item.syllabus_summary ? (item.syllabus_summary.length > 70 ? item.syllabus_summary.substring(0, 70) + "..." : item.syllabus_summary) : '<span class="text-muted small fst-italic">Sem ementa registada</span>';

      const isActive = item.is_active === true || item.is_active === "t";

      // Ações Desktop Condicionais
      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.phases', ${item.phase_id}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" style="width: 32px; height: 32px; padding: 0;" onclick="modalFase(${item.phase_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" style="width: 32px; height: 32px; padding: 0;" onclick="deletePhase(${item.phase_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

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
                      <input class="form-check-input shadow-none m-0" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="togglePhase(${item.phase_id}, this)"` : "disabled"} 
                             style="width: 44px; height: 24px; cursor: ${canEdit ? "pointer" : "default"};">
                  </div>
              </div>
          </td>
          <td class="text-end align-middle pe-3 text-nowrap" style="width: 140px;">
              <div class="d-flex justify-content-end align-items-center flex-nowrap">
                ${actionsHtml || '<i class="fas fa-lock text-muted opacity-50" title="Somente leitura"></i>'}
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
                    <th colspan="2" class="ps-3 text-uppercase small opacity-75">Fase</th>
                    <th class="text-uppercase small opacity-75">Ementa / Resumo</th>
                    <th class="text-center text-uppercase small opacity-75">Estado</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // =========================================================
  // 2. VISÃO MOBILE ULTRA-COMPACTA (APPLE HIG)
  // =========================================================
  const mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";
      const summary = item.syllabus_summary ? item.syllabus_summary : '<span class="fst-italic opacity-50">Sem ementa registada.</span>';

      // Ações Mobile Condicionais (Usando os botões redondos para manter coerência visual)
      let mobActionsHtml = "";
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('education.phases', ${item.phase_id}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="modalFase(${item.phase_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        mobActionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deletePhase(${item.phase_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch mb-2 p-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="d-flex align-items-center gap-2" style="min-width: 0;">
                <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 0.95rem;">${item.name}</h6>
                <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-0 fw-bold" style="font-size: 0.6rem;"><i class="fas fa-book m-1"></i></span>
              </div>
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center flex-shrink-0 ms-2">
                  <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                         ${canEdit ? `onchange="togglePhase(${item.phase_id}, this)"` : "disabled"} 
                         style="cursor: ${canEdit ? "pointer" : "default"}; width: 44px; height: 24px;">
              </div>
          </div>

          <div class="text-secondary fw-medium lh-sm mb-2" style="font-size: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: 0.8;">
              ${summary}
          </div>
          
          ${mobActionsHtml ? `<div class="d-flex justify-content-end gap-2 pt-2 mt-2 border-top border-secondary border-opacity-10 flex-nowrap w-100">${mobActionsHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-fases", "currentPage", "totalPages", "changePage", defaultPhase);
};

window.modalFase = (id = null, btn = false) => {
  const modal = $("#modalFase");
  $("#phase_id").val("");
  $("#phase_name").val("");
  $("#phase_summary").val("");

  if (btn) btn = $(btn);

  if (id) {
    loadPhaseData(id, btn);
  } else {
    $("#modalLabel").html('<i class="fas fa-book-open me-3 opacity-75"></i> Nova Fase');
    modal.modal("show");
  }
};

const loadPhaseData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const result = await window.ajaxValidator({
      validator: "getPhaseById",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const d = result.data;

      $("#phase_id").val(d.phase_id);
      $("#phase_name").val(d.name);
      $("#phase_summary").val(d.syllabus_summary);

      $("#modalLabel").html('<i class="fas fa-pen me-3 opacity-75"></i> Editar Fase');
      $("#modalFase").modal("show");
    } else {
      throw new Error(result.alert || "O servidor não retornou os dados desta fase.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar dados.";
    window.alertErrorWithSupport(`Abrir Edição de Fase`, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.salvarFase = async (btn) => {
  const name = $("#phase_name").val()?.trim();
  const id = $("#phase_id").val();
  btn = $(btn);

  if (!name) return window.alertDefault("O nome da fase é obrigatório.", "warning");

  window.setButton(true, btn, id ? " Salvando..." : " Cadastrando...");

  const data = {
    phase_id: id,
    name: name,
    syllabus_summary: $("#phase_summary").val()?.trim(),
  };

  try {
    const result = await window.ajaxValidator({
      validator: "savePhase",
      token: window.defaultApp.userInfo.token,
      data: data,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      window.alertDefault("Fase guardada com sucesso!", "success");
      $("#modalFase").modal("hide");

      if (typeof getFases === "function") getFases();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento desta fase.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao guardar.";
    const acaoContexto = id ? `Editar Fase` : "Criar Nova Fase";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    window.setButton(false, btn);
  }
};

window.deletePhase = (id) => {
  Swal.fire({
    title: "Excluir Fase?",
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
          validator: "deletePhase",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        if (res.status) {
          window.alertDefault("Fase movida para a lixeira.", "success");

          if (typeof getFases === "function") window.getFases();
        } else {
          throw new Error(res.alert || "O banco de dados não permitiu a exclusão desta fase.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de ligação ao tentar excluir a fase.";
        window.alertErrorWithSupport(`Excluir Fase`, errorMessage);
      }
    }
  });
};

$("#busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultPhase.currentPage = 1;
    getFases();
  }, 500);
});

window.getFases = getFases;

window.changePage = (page) => {
  defaultPhase.currentPage = page;
  getFases();
};

// MOTOR DE PAGINAÇÃO INTELIGENTE (Padrão Trilha da Fé)
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
  getFases();
});
