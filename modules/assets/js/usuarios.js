const defaultUsers = {
  currentPage: 1,
  rowsPerPage: 20,
  totalPages: 1,
};

/**
 * PROTOCOLO DUAL STATUS (PADRÃO PREMIUM)
 * Garante feedback visual instantâneo sem recarregar a lista
 */
window.toggleUsuario = (id, element) => handleToggle("toggleUser", id, element, "Estado atualizado.", `.status-text-usr-${id}`, loadUsuarios);

const loadProfilesDropdown = async () => {
  try {
    const res = await window.ajaxValidator({ validator: "getProfilesList", token: defaultApp.userInfo.token });
    if (res.status) {
      let opts = '<option value="">Selecione o perfil mestre...</option>';
      res.data.forEach((p) => {
        opts += `<option value="${p.id}">${p.name}</option>`;
      });
      $("#filtro-perfil").html('<option value="">Todos os Perfis</option>' + opts);
      $("#edit_profile").html(opts);
    }
  } catch (e) {
    console.error("Erro ao carregar lista de perfis do banco.", e);
  }
};

/**
 * Renderiza a nova matriz de permissões utilizando o Bootstrap Accordion (Premium UI)
 */
const loadProfilePermissions = async (idProfile) => {
  const container = $("#lista-permissoes");
  if (!idProfile) {
    container.html(`<div class="text-center py-5 opacity-50"><i class="fas fa-shield-alt fa-3x mb-3"></i><p>Selecione um perfil para auditoria.</p></div>`);
    return;
  }

  container.html(`<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div></div>`);

  try {
    const res = await window.ajaxValidator({ validator: "getProfilePermissions", token: defaultApp.userInfo.token, id_profile: idProfile });

    if (res.status) {
      // Agrupamento lógico por Módulo
      const modules = {};
      res.data.forEach((p) => {
        if (!modules[p.module_name]) {
          modules[p.module_name] = { icon: p.module_icon || "icon-layers", actions: [] };
        }
        modules[p.module_name].actions.push(p);
      });

      // Renderização em Accordion para melhor UX Mobile
      let accordionHtml = `<div class="accordion accordion-flush" id="accordionPerms">`;
      let mIdx = 0;

      for (const [moduleName, moduleData] of Object.entries(modules)) {
        mIdx++;
        let actionsHtml = moduleData.actions
          .map((p) => {
            // Ajuste de cores conforme solicitado
            const statusClass = p.active ? "bg-success text-success border-success" : "bg-danger text-danger border-danger";
            const icon = p.active ? "fa-check-circle" : "fa-lock";

            return `
              <div class="d-flex align-items-center ${statusClass} bg-opacity-10 border border-opacity-25 rounded-3 px-3 py-2 me-2 mb-2 transition-all hover-scale" 
                  style="font-size: 0.78rem; font-weight: 700; flex: 1 1 auto; min-width: 140px;" title="${p.description}">
                  <i class="fas ${icon} me-2"></i> ${p.action_name}
              </div>`;
          })
          .join("");

        accordionHtml += `
          <div class="accordion-item bg-transparent border-0 mb-3 shadow-sm rounded-4 overflow-hidden">
              <h2 class="accordion-header">
                  <button class="accordion-button collapsed fw-bold text-body bg-white py-3 px-4 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#collapseM${mIdx}">
                      <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 32px; height: 32px;">
                          <i class="${moduleData.icon.replace("icon-", "fas fa-")}" style="font-size: 0.9rem;"></i>
                      </div>
                      ${moduleName}
                  </button>
              </h2>
              <div id="collapseM${mIdx}" class="accordion-collapse collapse" data-bs-parent="#accordionPerms">
                  <div class="accordion-body bg-white p-4 pt-0">
                      <div class="d-flex flex-wrap">${actionsHtml}</div>
                  </div>
              </div>
          </div>`;
      }
      accordionHtml += `</div>`;
      container.html(accordionHtml);
    }
  } catch (e) {
    container.html(`<div class="alert alert-danger rounded-4">Erro ao processar matriz de acesso.</div>`);
  }
};

const loadUsuarios = async () => {
  const container = $(".list-table-usuarios");
  const mobileContainer = $("#mobile-users-cards");

  try {
    const page = Math.max(0, defaultUsers.currentPage - 1);
    const search = $("#busca-texto").val();
    const profile = $("#filtro-perfil").val();

    if (mobileContainer.length) mobileContainer.empty();
    container.html(`<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 fw-medium">Sincronizando usuários...</p></div>`);

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

        renderUsers(dataArray);
      } else {
        const emptyHtml = `
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined fs-1 text-secondary">person_off</span>
                <p class="mt-2 fw-medium text-body">Nenhum usuário encontrado.</p>
            </div>`;
        container.html(emptyHtml);
        if (mobileContainer.length) mobileContainer.html(emptyHtml);
        $(".pagination-usuarios").empty();
      }
    } else {
      throw new Error(result.alert || "Falha ao carregar lista de usuários.");
    }
  } catch (e) {
    window.alertErrorWithSupport("Listar Usuários", e.message);
  }
};

const getTranslatedProfile = (profileName) => {
  if (!profileName || String(profileName).toLowerCase() === "undefined") return "Acesso Geral";
  const translations = {
    DEV: "Desenvolvedor",
    PÁROCO: "Pároco / Admin",
    COORDENADOR: "Coordenador",
    CATEQUISTA: "Catequista",
    "ALUNO/RESPONSÁVEL": "Fiel / Aluno",
    SECRETARY: "Secretaria",
    MANAGER: "Gestor Paroquial",
  };
  return translations[profileName.toUpperCase()] || profileName;
};

const getProfileColor = (profileId) => {
  const colors = {
    99: "danger",
    50: "secondary",
    40: "secondary",
    30: "warning",
    10: "primary",
  };
  return colors[profileId] || "secondary";
};

const renderUsers = (data) => {
  const container = $(".list-table-usuarios");

  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}

  const canEdit = true;
  const canHistory = true;
  const canDelete = true;

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CUSTOM PREMIUM COM BOTÕES PADRÃO)
  // =========================================================
  const desktopRows = data
    .map((item) => {
      const nameParts = item.name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      let avatarHtml = item.img
        ? `<img src="${item.img}?v=${new Date().getTime()}" 
                class="rounded-circle border border-secondary border-opacity-25 shadow-sm object-fit-cover" 
                style="width: 42px; height: 42px; cursor: zoom-in;"
                onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.img}', '${item.name.replace(/'/g, "\\'")}')"
                title="Ver foto">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 shadow-sm fw-bold" style="width: 42px; height: 42px; font-size: 0.9rem;">${initials}</div>`;

      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);
      const profileBadge = `<span class="badge bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.65rem;">${profileLabel.toUpperCase()}</span>`;

      const isActive = item.is_active !== false && item.is_active !== "f" && item.is_active !== "0";
      const statusIconHtml = isActive
        ? `<span title="Ativo" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-check-circle"></i></span>`
        : `<span title="Inativo" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-times-circle"></i></span>`;

      let actionsHtml = "";
      if (canHistory)
        actionsHtml += `<button class="btn-icon-action text-info ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', this)" title="Auditoria de Cadastro"><i class="fas fa-clipboard-list" style="font-size: 0.85rem;"></i></button>`;
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('security.users', ${item.id})" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openEditModal(${item.id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="deleteUsuario(${item.id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 65px;">${avatarHtml}</td>
          <td class="align-middle">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
              <small class="text-secondary fw-medium">${item.email}</small>
          </td>
          <td class="align-middle text-center">${profileBadge}</td>
          <td class="align-middle text-center"><span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.75rem;">${item.anos_letivos || "Acesso Geral"}</span></td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="d-flex align-items-center justify-content-center gap-2">
                  <div class="status-text-usr-${item.id} d-flex align-items-center" style="font-size: 30px;">${statusIconHtml}</div>
              </div>
          </td>
          <td class="text-end align-middle pe-4 text-nowrap">
              <div class="d-flex justify-content-end align-items-center flex-nowrap">
                  ${actionsHtml}
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
                    <th colspan="2" class="ps-4 text-uppercase small opacity-75">Usuário</th>
                    <th class="text-center text-uppercase small opacity-75">Perfil Mestre</th>
                    <th class="text-center text-uppercase small opacity-75">Vínculos / Anos</th>
                    <th class="text-center text-uppercase small opacity-75">Acesso</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`;

  // =========================================================
  // 2. VISÃO MOBILE (INSET GROUPED LIST COM BOTÕES PADRÃO)
  // =========================================================
  const mobileRows = data
    .map((item) => {
      const nameParts = item.name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      let avatarHtml = item.img
        ? `<img src="${item.img}?v=${new Date().getTime()}" 
                class="rounded-circle border border-secondary border-opacity-25 shadow-sm object-fit-cover" 
                style="width: 48px; height: 48px; cursor: zoom-in;"
                onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.img}', '${item.name.replace(/'/g, "\\'")}')">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 shadow-sm fw-bold fs-5" style="width: 48px; height: 48px;">${initials}</div>`;

      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);
      const profileBadge = `<span class="badge bg-${color} bg-opacity-10 text-${color} fw-bold px-2 py-1 border border-${color} border-opacity-25" style="font-size: 0.65rem; border-radius: 6px;">${profileLabel.toUpperCase()}</span>`;

      const isActive = item.is_active !== false && item.is_active !== "f" && item.is_active !== "0";
      const statusIconHtml = isActive ? `<span class="text-success"><i class="fas fa-check-circle"></i></span>` : `<span class="text-danger"><i class="fas fa-times-circle"></i></span>`;

      let mobActionsHtml = "";
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-info bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', this)" title="Auditoria"><i class="fas fa-clipboard-list" style="font-size: 0.85rem;"></i></button>`;
      if (canHistory)
        mobActionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('security.users', ${item.id})" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        mobActionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="openEditModal(${item.id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        mobActionsHtml += `<button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="deleteUsuario(${item.id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch">
          <div class="d-flex w-100 align-items-center">
              <div class="me-3">${avatarHtml}</div>
              <div class="flex-grow-1" style="min-width: 0;">
                  <div class="fw-bold text-body text-truncate" style="font-size: 1.05rem;">${item.name}</div>
                  <div class="small text-secondary mt-1 text-truncate">${item.email}</div>
              </div>
              <div class="ms-2">
                  <div class="d-flex align-items-center justify-content-end gap-2 w-100">
                      <div class="status-text-usr-${item.id} d-flex align-items-center" style="font-size: 30px;">${statusIconHtml}</div>
                  </div>
              </div>
          </div>
          
          <div class="mt-3 p-2 px-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-inner d-flex flex-wrap gap-2 align-items-center">
              ${profileBadge}
              <span class="small text-secondary ms-2 fw-medium"><i class="fas fa-calendar-alt opacity-50 me-1"></i> ${item.anos_letivos || "Acesso Geral"}</span>
          </div>

          <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
              ${mobActionsHtml}
          </div>
      </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;

  container.html(desktopHtml + mobileHtml);

  _generatePaginationButtons("pagination-usuarios", "currentPage", "totalPages", "changePage", defaultUsers);
};

const fetchAnosLetivos = async () => {
  try {
    const res = await window.ajaxValidator({ validator: "getAnosLetivosDropdown", token: defaultApp.userInfo.token });
    if (res.status && res.data && $("#edit_years").length > 0) {
      const selectizeYears = $("#edit_years")[0].selectize;
      selectizeYears.clearOptions();
      res.data.forEach((ano) => selectizeYears.addOption({ id: ano.id, name: ano.name }));
    }
  } catch (e) {
    console.error("Erro ao buscar anos letivos");
  }
};

window.openCreateModal = () => {
  $("#edit_id_user").val("");
  $("#edit_name").val("").prop("disabled", true);
  $("#edit_email").val("");
  $("#edit_profile").val("");
  $("#modal_user_photo").attr("src", "./assets/img/trilhadafe.png");

  if ($("#edit_years")[0]?.selectize) $("#edit_years")[0].selectize.clear();
  if ($("#edit_person_id")[0]?.selectize) $("#edit_person_id")[0].selectize.clear();

  // Controle de visibilidade forçado para classes Bootstrap
  $("#div_select_person").removeClass("d-none").addClass("d-block");
  $("#div_input_name").removeClass("d-block").addClass("d-none");
  $("#div_reset_password").removeClass("d-block d-flex").addClass("d-none");

  $('#userTab a[href="#tab-acesso"]').tab("show");
  $("#lista-permissoes").html(`<div class="text-center py-5 text-muted opacity-50"><i class="fas fa-shield-alt fa-3x mb-3"></i><p>Selecione um perfil para visualizar a matriz.</p></div>`);

  $("#modalUsuarioTitle").html('<i class="fas fa-user-plus me-3 opacity-75"></i> Novo Usuário');
  $("#modalUsuario").modal("show");
};

window.openEditModal = async (id, btn) => {
  try {
    btn = $(btn);
    window.setButton(true, btn, "");

    const res = await window.ajaxValidator({
      validator: "getUsuarioDetails",
      token: defaultApp.userInfo.token,
      id_client: defaultApp.userInfo.id_client,
      id_user: id,
    });

    if (res.status && res.data) {
      const u = res.data;
      $("#edit_id_user").val(u.id);
      $("#edit_name").val(u.name).prop("disabled", true);
      $("#edit_email").val(u.email);
      $("#edit_profile")
        .val(u.main_profile_id || u.id_profile)
        .trigger("change");
      $("#modal_user_photo").attr("src", u.img || "./assets/img/trilhadafe.png");

      if ($("#edit_years")[0]?.selectize) {
        const sl = $("#edit_years")[0].selectize;
        sl.clear();
        const vinculos = typeof u.anos_ids === "string" ? JSON.parse(u.anos_ids || "[]") : u.anos_ids || [];
        vinculos.forEach((v) => sl.addItem(v.year_id || v));
      }

      // Controle de visibilidade forçado para classes Bootstrap
      $("#div_select_person").removeClass("d-block").addClass("d-none");
      $("#div_input_name").removeClass("d-none").addClass("d-block");
      // A div do password deve voltar a ser visível, porém o Bootstrap costuma aplicar display flex em cards complexos.
      $("#div_reset_password").removeClass("d-none").addClass("d-block");

      $('#userTab a[href="#tab-acesso"]').tab("show");

      $("#modalUsuarioTitle").html('<i class="fas fa-user-edit me-3 opacity-75"></i> Editar Usuário');
      $("#modalUsuario").modal("show");
    } else {
      throw new Error("Usuário não encontrado.");
    }
  } catch (e) {
    window.alertErrorWithSupport("Buscar Usuário", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteUsuario = async (id) => {
  const confirm = await Swal.fire({
    title: "Remover Usuário?",
    text: "O registro será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, remover",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545",
  });

  if (confirm.isConfirmed) {
    try {
      const res = await window.ajaxValidator({
        validator: "deleteUsuario",
        token: defaultApp.userInfo.token,
        id_client: defaultApp.userInfo.id_client,
        id_user: id,
      });

      if (res.status) {
        window.alertDefault("Usuário removido com sucesso!", "success");
        loadUsuarios();
      } else {
        throw new Error(res.alert);
      }
    } catch (e) {
      window.alertErrorWithSupport("Excluir Usuário", e.message);
    } finally {
      $("#div-loader").hide();
    }
  }
};

window.salvarUsuario = async (btn) => {
  btn = $(btn);
  const id_user = $("#edit_id_user").val();
  const person_id = $("#edit_person_id").val();
  const yearsMapping = ($("#edit_years").val() || []).map((yid) => ({ year_id: yid, profile_id: $("#edit_profile").val() }));

  if (!id_user && !person_id) {
    window.alertDefault("Você precisa selecionar uma pessoa para vincular o novo acesso.", "warning");
    return;
  }

  window.setButton(true, btn, " Salvando...");
  try {
    const res = await window.ajaxValidator({
      validator: "saveUsuarioInfo",
      token: defaultApp.userInfo.token,
      id_client: defaultApp.userInfo.id_client,
      id_user: id_user,
      person_id: person_id,
      email: $("#edit_email").val(),
      profile: $("#edit_profile").val(),
      years_mapping: yearsMapping,
    });

    if (res.status) {
      window.alertDefault("Acesso salvo com sucesso!", "success");
      $("#modalUsuario").modal("hide");
      loadUsuarios();
    } else throw new Error(res.alert);
  } catch (e) {
    window.alertErrorWithSupport("Salvar Usuário", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.resetPassword = async (btn) => {
  const id = $("#edit_id_user").val();
  btn = $(btn);
  const confirm = await Swal.fire({ title: "Resetar Senha?", text: "A senha passará a ser mudar123", icon: "warning", showCancelButton: true });

  if (confirm.isConfirmed) {
    window.setButton(true, btn, " Resetando...");
    const res = await window.ajaxValidator({ validator: "resetUsuarioPassword", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });
    if (res.status) {
      window.setButton(false, btn);
      window.alertDefault("Senha resetada!", "success");
    }
  }
};

// =========================================================
// MOTOR DE AUDITORIA AVANÇADA PARA A TIMELINE DO USUÁRIO
// Consome as funções window.formatKey e window.formatValue do audit.js
// =========================================================
window.openHistoryModal = async (id, name, btn) => {
  $("#modalHistoricoUsuario").modal("show");
  $("#lista-historico-timeline").html('<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary"></div><p class="mt-3">Carregando ações...</p></div>');

  try {
    window.setButton(true, btn, "");
    const res = await window.ajaxValidator({ validator: "getUsuarioHistorico", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });

    if (res.status && res.data && res.data.length > 0) {
      const groupedLogs = [];
      const logMap = new Map();

      // Utilitários de segurança e validação idênticos ao audit.js
      const isEmpty = (val) => {
        if (val === null || val === undefined || val === "" || val === false) return true;
        if (typeof val === "string") {
          const v = val.trim();
          if (v === "null" || v === "false" || v === "") return true;
          if (v === "{}" || v === "[]") return true;
          if (v.startsWith("{") && v.endsWith("}")) {
            try {
              return Object.keys(JSON.parse(v)).length === 0;
            } catch (e) {}
          }
        }
        return false;
      };

      const globalBlacklist = [
        "updated_at",
        "created_at",
        "user_id",
        "audit_user_id",
        "deleted",
        "org_id",
        "org_id_origin",
        "link_id",
        "tie_id",
        "plan_id",
        "start_date",
        "end_date",
        "person_id",
        "role_id",
        "class_id",
        "course_id",
        "curriculum_id",
        "student_id",
        "session_id",
        "attendance_id",
        "signed_by_user_id",
        "phase_id",
        "attachment_id",
        "uploaded_by",
        "file_path",
        "syllabus_id",
      ];

      const isBlockedKey = (k) => {
        const kLow = k.toLowerCase();
        return kLow.endsWith("_id") || kLow === "id" || kLow === "deleted" || globalBlacklist.includes(kLow);
      };

      res.data.forEach((log) => {
        const groupKey = log.date_fmt;

        if (!logMap.has(groupKey)) {
          let groupTitle = log.title;
          if (log.title.includes("frequência para")) groupTitle = "Lançamento de Frequência em Lote";
          if (log.title.includes("aula na")) groupTitle = "Registro de Aula e Frequência";

          const group = { ...log, title: groupTitle, items: [] };
          groupedLogs.push(group);
          logMap.set(groupKey, group);
        }
        logMap.get(groupKey).items.push(log);
      });

      const html = groupedLogs
        .map((h, index) => {
          const isLast = index === groupedLogs.length - 1;
          const lineHtml = !isLast ? `<div class="position-absolute border-start border-2 border-secondary border-opacity-10" style="left: 17px; top: 36px; bottom: -12px; z-index: 1;"></div>` : ``;
          const toggleAttr = `data-bs-toggle="collapse" data-bs-target="#collapseLog${index}" style="cursor: pointer;"`;
          const chevron = `<i class="fas fa-chevron-down text-secondary opacity-50 ms-2 toggle-chevron transition-all" style="font-size: 0.8rem;"></i>`;

          let generalFieldsHTML = "";
          let attendanceHTML = "";
          let attCount = 0;

          // Lógica profunda injetada no lugar do antigo parseAuditDetails
          h.items.forEach((log) => {
            let oldVal = {},
              newVal = {};
            try {
              oldVal = (typeof log.old_values === "string" ? JSON.parse(log.old_values) : log.old_values) || {};
            } catch (e) {}
            try {
              newVal = (typeof log.new_values === "string" ? JSON.parse(log.new_values) : log.new_values) || {};
            } catch (e) {}

            const logOp = (log.operation || "").toUpperCase().trim();
            const isInsert = logOp === "INSERT" || logOp === "ADD VÍNCULO";

            // Detecção de Frequência (Attendance)
            if (log.table_name === "attendance" || log.title.includes("frequência")) {
              let valNew = newVal["Presença"] || newVal["presença"] || (newVal.is_present !== undefined ? formatValue(newVal.is_present, "is_present") : null);
              let valOld = oldVal["Presença"] || oldVal["presença"] || (oldVal.is_present !== undefined ? formatValue(oldVal.is_present, "is_present") : null);

              if (logOp === "UPDATE" && valNew === valOld) return;

              attCount++;
              let sName = log.student_name || newVal.student_name || oldVal.student_name || "Aluno Indefinido";
              let stDiff = "";

              if (logOp === "INSERT" || isInsert) {
                stDiff = valNew || `<span class="badge bg-secondary border border-secondary border-opacity-25 bg-opacity-10 text-secondary">Registrada</span>`;
              } else if (logOp === "DELETE") {
                stDiff = `<span class="text-danger fw-bold"><i class="fas fa-trash me-1"></i> Removida</span>`;
              } else {
                stDiff = `<span class="opacity-50 text-decoration-line-through me-1">${valOld}</span> <i class="fas fa-chevron-right mx-1 text-secondary opacity-50" style="font-size:0.6rem"></i> ${valNew}`;
              }

              attendanceHTML += `
                  <div class="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10 py-2">
                      <span class="text-body fw-bold" style="font-size: 0.85rem;">${sName}</span>
                      <div style="font-size: 0.85rem; display: flex; align-items: center;">${stDiff}</div>
                  </div>`;
            } else {
              // Campos Gerais e Mapeamento de Tabela Diferente no Agrupamento
              const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

              let itemTitleHeader = "";
              if (h.items.length > 1 && log.title !== h.title) {
                let subTitle = log.title;
                if (subTitle.includes("frequência para ")) subTitle = subTitle.split("para ")[1];
                itemTitleHeader = `<div class="fw-bold text-primary small mb-2 mt-3 d-flex align-items-center border-bottom border-primary border-opacity-10 pb-1"><i class="${log.icon || "fas fa-edit"} me-2 opacity-75"></i> ${subTitle}</div>`;
                generalFieldsHTML += itemTitleHeader;
              }

              allKeys.forEach((key) => {
                if (isBlockedKey(key)) return;

                const rawOld = oldVal[key];
                const rawNew = newVal[key];

                if (isEmpty(rawOld) && isEmpty(rawNew)) return;
                if (rawOld === rawNew && logOp !== "INSERT") return;

                // Explosão de Sub-Objetos Profundos
                if (key === "resources_detail" || key === "sacraments_info" || typeof rawOld === "object" || typeof rawNew === "object") {
                  let pOld = {},
                    pNew = {};
                  try {
                    pOld = typeof rawOld === "string" ? JSON.parse(rawOld) : rawOld || {};
                  } catch (e) {}
                  try {
                    pNew = typeof rawNew === "string" ? JSON.parse(rawNew) : rawNew || {};
                  } catch (e) {}

                  if (JSON.stringify(pOld) === JSON.stringify(pNew)) return;

                  let subKeys = new Set([...Object.keys(pOld), ...Object.keys(pNew)]);
                  let changesHTML = "";

                  subKeys.forEach((sk) => {
                    let vo = pOld[sk];
                    let vn = pNew[sk];

                    if (typeof vo === "object" || typeof vn === "object") {
                      if (JSON.stringify(vo) === JSON.stringify(vn)) return;
                      let lbl = window.formatKey ? window.formatKey(sk) : sk;

                      const getDetails = (obj) => {
                        if (!obj) return "";
                        let parts = [];
                        if (obj.date) {
                          let p = obj.date.split("-");
                          let fmtDate = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : obj.date;
                          parts.push(`<i class="far fa-calendar-alt mx-1"></i> ${fmtDate}`);
                        }
                        if (obj.place) parts.push(`<i class="fas fa-map-marker-alt mx-1"></i> ${obj.place}`);
                        return parts.length > 0 ? ` <span class="opacity-75 fw-normal ms-1">(${parts.join(" | ")})</span>` : "";
                      };

                      let dNew = getDetails(vn);
                      let dOld = getDetails(vo);

                      if (logOp === "INSERT" || isInsert) {
                        if (vn && vn.has) changesHTML += `<div class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 me-1 mb-2 text-wrap text-start lh-base d-inline-block" style="font-size:0.8rem;"><i class="fas fa-check me-1"></i> ${lbl}${dNew}</div>`;
                      } else {
                        if (vn && vn.has && (!vo || !vo.has)) {
                          changesHTML += `<div class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 me-1 mb-2 text-wrap text-start lh-base d-inline-block" style="font-size:0.8rem;"><i class="fas fa-plus me-1"></i> ${lbl} | Registrado${dNew}</div>`;
                        } else if ((!vn || !vn.has) && vo && vo.has) {
                          changesHTML += `<div class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 me-1 mb-2 text-wrap text-start lh-base d-inline-block" style="font-size:0.8rem;"><i class="fas fa-minus me-1"></i> ${lbl} | Removido</div>`;
                        } else if (vn && vn.has && vo && vo.has) {
                          changesHTML += `<div class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 me-1 mb-2 text-wrap text-start lh-base d-inline-block" style="font-size:0.8rem;"><i class="fas fa-pen me-1"></i> ${lbl} atualizado ${dOld} <i class="fas fa-arrow-right mx-1 opacity-50"></i> ${dNew}</div>`;
                        }
                      }
                    } else {
                      if (vo !== vn) {
                        let lbl = window.formatKey ? window.formatKey(sk) : sk;
                        if (logOp === "INSERT" || isInsert) {
                          if (vn === true || String(vn) === "true") changesHTML += `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 me-1 mb-1"><i class="fas fa-check me-1"></i> ${lbl}</span>`;
                          else if (vn && vn !== false && String(vn) !== "false") changesHTML += `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 me-1 mb-1">${lbl}: ${vn}</span>`;
                        } else {
                          if ((vn === true || String(vn) === "true") && (vo === false || String(vo) === "false" || !vo))
                            changesHTML += `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 me-1 mb-1"><i class="fas fa-plus me-1"></i> ${lbl} | Ativado</span>`;
                          else if ((vn === false || String(vn) === "false" || !vn) && (vo === true || String(vo) === "true"))
                            changesHTML += `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 me-1 mb-1"><i class="fas fa-minus me-1"></i> ${lbl} | Removido</span>`;
                          else if (vn !== vo) changesHTML += `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 me-1 mb-1">${lbl} modificado</span>`;
                        }
                      }
                    }
                  });

                  if (changesHTML === "") return;

                  let keyLabel = window.formatKey ? window.formatKey(key) : key;
                  if (logOp === "INSERT") {
                    generalFieldsHTML += `
                        <div class="col-12 col-md-6 mb-3">
                            <div class="text-muted fw-bold mb-1" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">
                                <i class="fas fa-tag me-1 opacity-50"></i> ${keyLabel}
                            </div>
                            <div class="p-2 rounded-3 bg-white border border-secondary border-opacity-10 text-body" style="font-size: 0.85rem;">
                                ${changesHTML}
                            </div>
                        </div>`;
                  } else {
                    generalFieldsHTML += `
                        <div class="col-12 mb-3">
                            <div class="text-muted fw-bolder mb-2" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;">
                                <i class="fas fa-exchange-alt me-1 opacity-50"></i> ${keyLabel}
                            </div>
                            <div class="d-flex flex-column flex-md-row gap-2 align-items-stretch">
                                <div class="flex-fill p-2 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 text-secondary d-flex flex-wrap align-items-start" style="font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                                    <span class="opacity-75 small"><i class="fas fa-history me-1"></i> Configuração anterior modificada</span>
                                </div>
                                <div class="d-flex align-items-center justify-content-center text-secondary opacity-25 px-1 py-1">
                                    <i class="fas fa-chevron-right d-none d-md-block"></i>
                                    <i class="fas fa-chevron-down d-block d-md-none"></i>
                                </div>
                                <div class="flex-fill p-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 text-primary fw-bold d-flex flex-wrap align-items-start shadow-sm gap-1" style="font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                                    ${changesHTML}
                                </div>
                            </div>
                        </div>`;
                  }
                  return;
                }

                let displayOld = window.formatValue ? window.formatValue(rawOld, key) : rawOld;
                let displayNew = window.formatValue ? window.formatValue(rawNew, key) : rawNew;

                if (displayOld === displayNew) return;

                let fieldLabel = window.formatKey ? window.formatKey(key) : key;

                if (logOp === "INSERT") {
                  if (isEmpty(rawNew) || String(displayNew).includes("Não informado")) return;
                  generalFieldsHTML += `
                      <div class="col-12 col-md-6 mb-3">
                          <div class="text-muted fw-bold mb-1" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">
                          <i class="fas fa-tag me-1 opacity-50"></i> ${fieldLabel}
                          </div>
                          <div class="p-2 rounded-3 bg-white border border-secondary border-opacity-10 text-body" style="font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                              ${displayNew}
                          </div>
                      </div>`;
                } else {
                  generalFieldsHTML += `
                      <div class="col-12 mb-3">
                          <div class="text-muted fw-bolder mb-2" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;">
                              <i class="fas fa-exchange-alt me-1 opacity-50"></i> ${fieldLabel}
                          </div>
                          <div class="d-flex flex-column flex-md-row gap-2 align-items-stretch">
                              <div class="flex-fill p-2 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger d-flex align-items-start" style="font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                                  <div class="opacity-75 w-100"><del>${displayOld}</del></div>
                              </div>
                              <div class="d-flex align-items-center justify-content-center text-secondary opacity-25 px-1 py-1">
                                  <i class="fas fa-chevron-right d-none d-md-block"></i>
                                  <i class="fas fa-chevron-down d-block d-md-none"></i>
                              </div>
                              <div class="flex-fill p-2 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success fw-bold d-flex align-items-start shadow-sm" style="font-size: 0.85rem; max-height: 120px; overflow-y: auto;">
                                  ${displayNew}
                              </div>
                          </div>
                      </div>`;
                }
              });
            }
          });

          let detailHtml = "";

          if (generalFieldsHTML !== "") {
            detailHtml += `<div class="row m-0">${generalFieldsHTML}</div>`;
          }

          if (attendanceHTML !== "") {
            detailHtml += `
                  <div class="${generalFieldsHTML !== "" ? "mt-3 pt-3 border-top border-secondary border-opacity-10" : ""}">
                      <div class="text-body fw-bold mb-2 d-flex align-items-center">
                          <i class="fas fa-user-check me-2 text-primary opacity-75"></i> Alterações de Frequência
                          <span class="badge bg-primary bg-opacity-10 text-primary ms-2">${attCount} modificações</span>
                      </div>
                      <div class="d-flex flex-column">${attendanceHTML}</div>
                  </div>`;
          }

          if (detailHtml === "") {
            detailHtml = `<div class="text-muted small fw-medium fst-italic py-2"><i class="fas fa-info-circle me-1 opacity-50"></i> Nenhuma alteração real detectada nos campos mapeados.</div>`;
          }

          const datePart = (h.date_fmt || "").split(" ")[0];
          const timePart = (h.date_fmt || "").split(" ")[1] ? h.date_fmt.split(" ")[1].substring(0, 5) : "";

          return `
          <div class="d-flex position-relative mb-0 pb-4 transition-all hover-bg-light rounded-4" ${toggleAttr}>
              ${lineHtml}
              <div class="flex-shrink-0 position-relative z-2">
                  <div class="rounded-circle bg-${h.color} text-white d-flex align-items-center justify-content-center shadow-sm border border-${h.color} border-opacity-25" style="width: 36px; height: 36px;">
                      <i class="${h.icon}" style="font-size: 0.85rem;"></i>
                  </div>
              </div>
              
              <div class="flex-grow-1 ms-3 w-100">
                  <div class="d-flex justify-content-between align-items-start">
                      <div>
                          <h6 class="fw-bold mb-0 text-body d-flex align-items-center" style="font-size: 0.95rem;">${h.title} ${chevron}</h6>
                          <div class="text-secondary fw-medium mt-1 d-flex align-items-center gap-2" style="font-size: 0.75rem;">
                              <span class="text-body fw-bold"><i class="fas fa-user-shield text-primary opacity-50 me-1"></i> Auditoria de Cadastro</span>
                          </div>
                      </div>
                      <div class="text-end pe-1">
                          <div class="fw-bold text-body" style="font-size: 0.8rem;">${datePart}</div>
                          <div class="text-secondary opacity-75" style="font-size: 0.7rem;"><i class="far fa-clock me-1"></i>${timePart}</div>
                      </div>
                  </div>
                  
                  <div class="collapse mt-3" id="collapseLog${index}">
                      <div class="card card-body bg-secondary bg-opacity-10 border-0 p-3 p-md-4 rounded-4 shadow-inner" onclick="event.stopPropagation();">
                          ${detailHtml}
                      </div>
                  </div>
              </div>
          </div>`;
        })
        .join("");

      $("#lista-historico-timeline").html(`<div class="pt-2">${html}</div>`);

      $(".collapse")
        .on("show.bs.collapse", function () {
          $(this).parent().find(".toggle-chevron").css("transform", "rotate(180deg)");
        })
        .on("hide.bs.collapse", function () {
          $(this).parent().find(".toggle-chevron").css("transform", "rotate(0deg)");
        });
    } else {
      $("#lista-historico-timeline").html(`<div class="text-center py-5 opacity-50"><i class="fas fa-history fa-2x mb-3 text-secondary"></i><p>Nenhum registro operacional encontrado.</p></div>`);
    }
  } catch (e) {
    $("#lista-historico-timeline").html(`<div class="text-center py-5 text-danger opacity-50"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p>Falha ao carregar auditoria.</p></div>`);
  } finally {
    window.setButton(false, btn);
  }
};

window.changePage = (p) => {
  defaultUsers.currentPage = p;
  loadUsuarios();
};

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

$("#filtro-perfil, #busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultUsers.currentPage = 1;
    loadUsuarios();
  }, 500);
});

$("#edit_profile").on("change", function () {
  loadProfilePermissions($(this).val());
});

$(document).ready(() => {
  loadProfilesDropdown();

  if ($("#edit_years").length > 0 && typeof $("#edit_years").selectize === "function") {
    $("#edit_years").selectize({
      valueField: "id",
      labelField: "name",
      searchField: ["name"],
      plugins: ["remove_button"],
      placeholder: "Selecione os anos de vínculo...",
    });
    fetchAnosLetivos();
  }

  if ($("#edit_person_id").length > 0 && typeof $("#edit_person_id").selectize === "function") {
    $("#edit_person_id").selectize({
      valueField: "person_id",
      labelField: "full_name",
      searchField: ["full_name", "tax_id"],
      placeholder: "Digite o nome ou CPF da pessoa...",
      load: async function (query, callback) {
        if (!query.length) return callback();
        try {
          const res = await window.ajaxValidator({
            validator: "searchPessoasDropdown",
            token: defaultApp.userInfo.token,
            search: query,
          });
          callback(res.data || []);
        } catch (e) {
          callback();
        }
      },
    });
  }

  loadUsuarios();
});
