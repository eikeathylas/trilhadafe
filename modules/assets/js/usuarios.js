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

      // CONSTRUÇÃO EM CARDS (SEM TABELAS - UX REFERÊNCIA MOBILE)
      let cardsHtml = `<div class="row g-3">`;

      for (const [moduleName, moduleData] of Object.entries(modules)) {
        let actionsHtml = moduleData.actions
          .map((p) => {
            const statusClass = p.active ? "bg-success text-success border-success" : "bg-danger text-danger border-danger";
            const icon = p.active ? "fa-check-circle" : "fa-lock";

            return `
            <div class="d-flex align-items-center ${statusClass} bg-opacity-10 border border-opacity-25 rounded-3 px-3 py-2 me-2 mb-2 transition-all hover-scale" 
                 style="font-size: 0.78rem; font-weight: 700; flex: 1 1 auto; min-width: 140px;" title="${p.description}">
                <i class="fas ${icon} me-2" style="font-size: 0.9rem;"></i>
                <span>${p.action_name}</span>
            </div>`;
          })
          .join("");

        cardsHtml += `
          <div class="col-12 col-xl-6">
              <div class="card border-0 rounded-4 shadow-sm h-100 overflow-hidden bg-white">
                  <div class="card-header bg-light border-0 py-3 px-4 d-flex align-items-center">
                      <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 38px; height: 38px;">
                          <i class="${moduleData.icon.replace("icon-", "fas fa-")}" style="font-size: 1rem;"></i>
                      </div>
                      <h6 class="fw-bold m-0 text-body" style="letter-spacing: -0.3px;">${moduleName}</h6>
                  </div>
                  <div class="card-body p-4">
                      <div class="d-flex flex-wrap">
                          ${actionsHtml}
                      </div>
                  </div>
              </div>
          </div>`;
      }
      cardsHtml += `</div>`;
      container.html(cardsHtml);
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
      let avatarHtml = "";
      if (item.img) {
        avatarHtml = `<img src="${item.img}?v=${new Date().getTime()}" 
                         class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                         style="width:42px; height:42px; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                         onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.img}', '${item.name.replace(/'/g, "\\'")}')"
                         onmouseover="this.style.transform='scale(1.15)'" 
                         onmouseout="this.style.transform='scale(1)'"
                         title="Ver foto">`;
      } else {
        const initials = item.name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 shadow-sm fw-bold" style="width:42px; height:42px; font-size: 0.9rem;">${initials}</div>`;
      }

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
      let avatarHtml = "";
      if (item.img) {
        avatarHtml = `<img src="${item.img}?v=${new Date().getTime()}" 
                         class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                         style="width:48px; height:48px; object-fit:cover; cursor: pointer;"
                         onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${item.img}', '${item.name.replace(/'/g, "\\'")}')">`;
      } else {
        const initials = item.name.substring(0, 2).toUpperCase();
        avatarHtml = `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 shadow-sm fw-bold fs-5" style="width:48px; height:48px;">${initials}</div>`;
      }

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

const translateLogKey = (key) => {
  const dict = {
    full_name: "Nome Completo",
    email: "E-mail",
    is_active: "Acesso Ativo",
    role_level: "Nível de Permissão",
    is_present: "Situação do Aluno",
    description: "Anotações / Conteúdo",
    justification: "Motivo da Falta",
    student_observation: "Observação sobre o aluno",
    session_date: "Data Ministrada",
    student_name: "Aluno(a)",
    class_name: "Turma",
    content_type: "Tipo de Conteúdo",
    status: "Status do Registro",
  };
  return dict[key] || key;
};

const parseAuditDetails = (op, oldData, newData) => {
  let oldObj = {},
    newObj = {};
  try {
    oldObj = typeof oldData === "string" ? JSON.parse(oldData) : oldData || {};
  } catch (e) {}
  try {
    newObj = typeof newData === "string" ? JSON.parse(newData) : newData || {};
  } catch (e) {}

  let diffHtml = '<ul class="list-unstyled mb-0 small text-body">';
  let hasChanges = false;
  let ignoreList = ["created_at", "updated_at", "id", "user_id", "person_id", "org_id", "class_id", "subject_id", "session_id", "attendance_id", "signed_by_user_id", "signed_at", "deleted"];

  let iterateObj = op === "DELETE" ? oldObj : newObj;
  if (Object.keys(iterateObj).length === 0 && op === "DELETE") iterateObj = newObj;

  const isPresent = String(iterateObj["is_present"]).toLowerCase();
  if (isPresent === "true" || isPresent === "sim" || isPresent === "present" || isPresent === "1") {
    ignoreList.push("absence_type", "justification", "student_observation");
  }

  const formatValue = (key, val) => {
    if (val === null || val === undefined || val === "") return '<span class="text-muted fst-italic">Não informado</span>';

    if (key === "is_present") {
      const v = String(val).toLowerCase();
      if (v === "true" || v === "sim" || v === "present" || v === "1") return '<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2"><i class="fas fa-check me-1"></i> Presente</span>';
      if (v === "false" || v === "não" || v === "absent" || v === "0") return '<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25 px-2"><i class="fas fa-times me-1"></i> Faltou</span>';
    }

    if (key === "status") {
      if (val === "PUBLISHED") return '<span class="badge bg-primary text-white">Publicado</span>';
      if (val === "DRAFT") return '<span class="badge bg-secondary text-white">Rascunho</span>';
    }
    if (key === "content_type" && val === "DOCTRINAL") return "Doutrinário / Catequético";
    if (key === "session_date" && typeof val === "string") return val.split("T")[0].split("-").reverse().join("/");
    if (typeof val === "boolean") return val ? "Sim" : "Não";

    return val;
  };

  for (let key in iterateObj) {
    if (ignoreList.includes(key)) continue;

    let oldVal = formatValue(key, oldObj[key]);
    let newVal = formatValue(key, newObj[key]);
    // let translatedKey = translateLogKey(key);
    let translatedKey = formatKey(key);

    if (op === "UPDATE" && oldObj[key] != newObj[key] && oldObj[key] !== undefined) {
      hasChanges = true;
      diffHtml += `<li class="mb-2 pb-2 border-bottom border-secondary border-opacity-10"><strong class="text-body fw-bold d-block mb-1">${translatedKey}</strong> <del class="text-danger opacity-75">${oldVal}</del> <i class="fas fa-arrow-right mx-2 text-secondary opacity-50" style="font-size:0.7em;"></i> <span class="text-success">${newVal}</span></li>`;
    } else if (op === "INSERT") {
      hasChanges = true;
      diffHtml += `<li class="mb-2"><strong class="text-body fw-bold">${translatedKey}:</strong> <span class="text-body">${newVal}</span></li>`;
    } else if (op === "DELETE") {
      hasChanges = true;
      diffHtml += `<li class="mb-2"><strong class="text-body fw-bold">${translatedKey}:</strong> <span class="text-body">${oldVal !== "-" ? oldVal : newVal}</span></li>`;
    }
  }
  diffHtml += "</ul>";

  if (!hasChanges && newObj.info) return `<p class="mb-0 small text-body">${newObj.info}</p>`;
  return hasChanges ? diffHtml : '<p class="mb-0 small text-secondary opacity-50">Detalhes não rastreados nesta operação.</p>';
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

  $("#div_select_person").show();
  $("#div_input_name").hide();
  $("#div_reset_password").hide();

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

      $("#div_select_person").hide();
      $("#div_input_name").show();
      $("#div_reset_password").show();

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

window.openHistoryModal = async (id, name, btn) => {
  $("#modalHistoricoUsuario").modal("show");
  $("#lista-historico-timeline").html('<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary"></div><p class="mt-3">Carregando ações...</p></div>');

  try {
    window.setButton(true, btn, "");
    const res = await window.ajaxValidator({ validator: "getUsuarioHistorico", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });

    if (res.status && res.data && res.data.length > 0) {
      const html = res.data
        .map((h, index) => {
          const isLast = index === res.data.length - 1;
          const lineHtml = !isLast ? `<div class="position-absolute border-start border-2 border-secondary border-opacity-10" style="left: 17px; top: 36px; bottom: -12px; z-index: 1;"></div>` : ``;
          const toggleAttr = `data-bs-toggle="collapse" data-bs-target="#collapseLog${index}" style="cursor: pointer;"`;
          const chevron = `<i class="fas fa-chevron-down text-secondary opacity-50 ms-2 toggle-chevron transition-all" style="font-size: 0.8rem;"></i>`;
          const detailHtml = parseAuditDetails(h.operation, h.old_values, h.new_values);

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
                          <div class="fw-bold text-body" style="font-size: 0.8rem;">${(h.date_fmt || "").split(" ")[0]}</div>
                          <div class="text-secondary opacity-75" style="font-size: 0.7rem;">${(h.date_fmt || "").split(" ")[1] || ""}</div>
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
