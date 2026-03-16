const defaultUsers = {
  currentPage: 1,
  rowsPerPage: 20,
  totalPages: 1,
};

// =========================================================
// 1. LISTAGEM E FILTROS
// =========================================================

const loadUsuarios = async () => {
  const container = $(".list-table-usuarios");
  const mobileContainer = $("#mobile-users-cards");

  try {
    const page = Math.max(0, defaultUsers.currentPage - 1);
    const search = $("#busca-texto").val();
    const profile = $("#filtro-perfil").val();

    container.html(`
        <div class="text-center py-5 opacity-25">
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
            <p class="mt-3 fw-medium">Sincronizando acessos...</p>
        </div>`);
    mobileContainer.empty();

    const result = await window.ajaxValidator({
      validator: "getUsuarios",
      token: defaultApp.userInfo.token,
      limit: defaultUsers.rowsPerPage,
      page: page * defaultUsers.rowsPerPage,
      search: search,
      profile_filter: profile,
      id_client: defaultApp.userInfo.id_client,
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultUsers.totalPages = Math.max(1, Math.ceil(total / defaultUsers.rowsPerPage));

        renderTableUsers(dataArray);
        renderMobileUsers(dataArray);
        _generatePaginationButtons("pagination-usuarios", "currentPage", "totalPages", "changePage", defaultUsers);
      } else {
        const emptyHtml = `<div class="text-center py-5 opacity-50"><p>Nenhum usuário encontrado.</p></div>`;
        container.html(emptyHtml);
        mobileContainer.html(emptyHtml);
        $(".pagination-usuarios").empty();
      }
    } else {
      throw new Error(result.alert || "Falha ao carregar lista.");
    }
  } catch (e) {
    window.alertErrorWithSupport("Listar Usuários", e.message);
  }
};

// =========================================================
// HELPERS DE TRADUÇÃO E ESTILO (PADRÃO PESSOAS)
// =========================================================

const getTranslatedProfile = (profileName) => {
  // Tradução de todas as opções do banco Staff
  const translations = {
    DEV: "Desenvolvedor",
    PÁROCO: "Pároco / Admin",
    COORDENADOR: "Coordenador",
    CATEQUISTA: "Catequista",
    "ALUNO/RESPONSÁVEL": "Fiel / Aluno",
    SECRETARY: "Secretaria",
    MANAGER: "Gestor Paroquial",
  };
  return translations[profileName] || profileName || "Usuário";
};

const getProfileColor = (profileId) => {
  // Mapeamento de cores baseado nos IDs do Staff.sql
  const colors = {
    99: "danger", // DEV
    50: "secondary", // PÁROCO
    40: "secondary", // COORDENADOR
    30: "warning", // CATECHIST
    10: "primary", // STUDENT
  };
  return colors[profileId] || "light text-dark border";
};

// =========================================================
// RENDERIZAÇÃO: VISÃO DESKTOP (TABELA)
// =========================================================
const renderTableUsers = (data) => {
  let desktopRows = data
    .map((item) => {
      let avatarHtml = "";
      if (item.img) {
        avatarHtml = `<img src="${item.img}?v=${new Date().getTime()}" 
                           class="rounded-circle border shadow-sm" 
                           style="width:40px; height:40px; object-fit:cover; cursor: pointer;"
                           onclick="zoomAvatar('${item.img}', '${item.name.replace(/'/g, "\\'")}')">`;
      } else {
        const initials = item.name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center text-secondary border fw-bold" style="width:40px; height:40px;">${initials}</div>`;
      }

      // CORREÇÃO: Usando main_profile_name e a tradução
      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);

      const profileBadge = `<span class="badge bg-${color} text-white px-2 py-1">${profileLabel}</span>`;
      const itemJson = JSON.stringify(item).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

      return `
        <tr>
            <td class="text-center align-middle ps-3" style="width: 60px;">${avatarHtml}</td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.name}</div>
                <small class="text-muted">${item.email}</small>
            </td>
            <td class="align-middle">${profileBadge}</td>
            <td class="align-middle"><small class="text-muted">${item.anos_letivos || "Acesso Geral"}</small></td>
            <td class="text-end align-middle pe-3 text-nowrap">
                <button class="btn-icon-action text-warning" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}')" title="Logs"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="openEditModal('${itemJson}')" title="Editar"><i class="fas fa-pen"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  $(".list-table-usuarios").html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3">Usuário</th>
                    <th>Perfil Mestre</th>
                    <th>Vínculos por Ano</th>
                    <th class="text-end pe-4">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`);
};

// =========================================================
// RENDERIZAÇÃO: VISÃO MOBILE (CARDS)
// =========================================================
const renderMobileUsers = (data) => {
  const mobileRows = data
    .map((item) => {
      let avatarHtml = item.img
        ? `<img src="${item.img}" class="rounded-circle border" style="width:50px; height:50px; object-fit:cover;" onclick="zoomAvatar('${item.img}', '${item.name}')">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border fw-bold fs-5" style="width:50px; height:50px;">${item.name.substring(0, 2).toUpperCase()}</div>`;

      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);
      const itemJson = JSON.stringify(item).replace(/'/g, "&apos;").replace(/"/g, "&quot;");

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-start flex-grow-1 pe-2">
                    <div class="me-3 mt-1">${avatarHtml}</div>
                    <div>
                        <h6 class="fw-bold mb-1 fs-5 lh-sm">${item.name}</h6>
                        <small class="text-muted d-block mb-2">${item.email}</small>
                        <span class="badge bg-${color} px-2 py-1 text-white">${profileLabel}</span>
                    </div>
                </div>
            </div>
            <div class="small text-muted mb-3 mt-2"><i class="fas fa-calendar-alt me-1"></i> ${item.anos_letivos || "Acesso Geral"}</div>
            <div class="d-flex justify-content-end border-top pt-3 gap-2">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="openHistoryModal(${item.id}, '${item.name}')">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="openEditModal('${itemJson}')">
                    <i class="fas fa-pen"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  $("#mobile-users-cards").html(mobileRows);
};

// =========================================================
// 2. AÇÕES E MODAL
// =========================================================

window.openEditModal = (itemJson) => {
  const u = JSON.parse(itemJson);
  $("#edit_id_user").val(u.id);
  $("#edit_name").val(u.name);
  $("#edit_email").val(u.email);
  $("#edit_profile").val(u.main_profile_id || u.id_profile);
  $("#modal_user_photo").attr("src", u.img || "./assets/img/trilhadafe.png");

  if ($("#edit_years")[0]?.selectize) {
    const sl = $("#edit_years")[0].selectize;
    sl.clear();
    const vinculos = typeof u.anos_ids === "string" ? JSON.parse(u.anos_ids || "[]") : u.anos_ids;
    if (vinculos) vinculos.forEach((v) => sl.addItem(v.year_id || v));
  }
  $("#modalUsuario").modal("show");
};

window.salvarUsuario = async () => {
  const btn = $(".btn-save-user");
  const yearsMapping = ($("#edit_years").val() || []).map((yid) => ({ year_id: yid, profile_id: $("#edit_profile").val() }));

  window.setButton(true, btn, "Gravando...");
  try {
    const res = await window.ajaxValidator({
      validator: "saveUsuarioInfo",
      token: defaultApp.userInfo.token,
      id_client: defaultApp.userInfo.id_client,
      id_user: $("#edit_id_user").val(),
      email: $("#edit_email").val(),
      profile: $("#edit_profile").val(),
      years_mapping: yearsMapping,
    });

    if (res.status) {
      window.alertDefault("Acesso salvo!", "success");
      $("#modalUsuario").modal("hide");
      loadUsuarios();
    } else throw new Error(res.alert);
  } catch (e) {
    window.alertErrorWithSupport("Salvar", e.message);
  } finally {
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Gravar Alterações');
  }
};

window.resetPassword = async () => {
  const id = $("#edit_id_user").val();
  const confirm = await Swal.fire({ title: "Resetar Senha?", text: "Padrão: mudar123", icon: "warning", showCancelButton: true });

  if (confirm.isConfirmed) {
    const res = await window.ajaxValidator({ validator: "resetUsuarioPassword", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });
    if (res.status) window.alertDefault("Senha resetada!", "success");
  }
};

window.openHistoryModal = async (id, name) => {
  $("#modalHistoricoUsuario").modal("show");
  $("#lista-historico-timeline").html('<div class="text-center p-5 opacity-25"><div class="spinner-border text-primary"></div></div>');

  const res = await window.ajaxValidator({ validator: "getUsuarioHistorico", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });
  if (res.status && res.data.length > 0) {
    const html = res.data.map((h) => `<div class="border-start border-primary border-3 ps-3 mb-3"><b>${h.operation}</b><br><small>${h.date_fmt} - ${h.module_name}</small></div>`).join("");
    $("#lista-historico-timeline").html(html);
  } else $("#lista-historico-timeline").html('<p class="text-center opacity-50">Sem logs.</p>');
};

// =========================================================
// 4. PAGINAÇÃO E LISTENERS
// =========================================================

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();
  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];
  if (total <= 1) return;
  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary">Primeira</button>`;
  for (let p = Math.max(1, current - 1); p <= Math.min(total, current + 3); p++) html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"}">${p}</button>`;
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary">Última</button>`;
  container.html(html);
};

$("#filtro-perfil, #busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultUsers.currentPage = 1;
    loadUsuarios();
  }, 500);
});

window.changePage = (p) => {
  defaultUsers.currentPage = p;
  loadUsuarios();
};

$(document).ready(() => {
  if ($("#edit_years").length > 0 && typeof $("#edit_years").selectize === "function") $("#edit_years").selectize({ plugins: ["remove_button"], placeholder: "Anos..." });
  loadUsuarios();
});
