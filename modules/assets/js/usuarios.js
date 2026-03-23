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

const loadUsuarios = async () => {
  const container = $(".list-table-usuarios");
  const mobileContainer = $("#mobile-users-cards"); // Opcional se for unificado, mantido por segurança

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

  // =========================================================
  // 1. VISÃO DESKTOP (TABELA CUSTOM PREMIUM)
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
      const textClass = color === "warning" || color === "light" ? "text-body" : "text-white";
      const profileBadge = `<span class="badge bg-${color} bg-opacity-10 text-${color} border border-${color} border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.65rem;">${profileLabel.toUpperCase()}</span>`;

      // Presumindo a existência de is_active, senão o checkbox fica checado
      const isActive = item.is_active !== false && item.is_active !== "f" && item.is_active !== "0";
      const statusIconHtml = isActive
        ? `<span title="Ativo" class="text-success d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-check-circle"></i></span>`
        : `<span title="Inativo" class="text-danger d-flex align-items-center justify-content-center" style="font-size: 1.1rem; width: 24px; height: 24px; cursor: help;"><i class="fas fa-times-circle"></i></span>`;

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
                  <div class="form-check form-switch m-0 p-0 d-flex align-items-center position-relative">
                      <input class="form-check-input shadow-sm m-0" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleUsuario(${item.id}, this)" style="width: 44px; height: 24px; cursor: pointer;">
                  </div>
                  <div class="status-text-usr-${item.id} d-flex align-items-center">${statusIconHtml}</div>
              </div>
          </td>
          <td class="text-end align-middle pe-4 text-nowrap">
              <button class="btn-icon-action text-info" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', this)" title="Ações do Usuário"><i class="fas fa-book-open-reader"></i></button>
              <button class="btn-icon-action text-warning" onclick="openAudit('security.users', ${item.id}, this)" title="Log / Auditoria"><i class="fas fa-bolt"></i></button>
              <button class="btn-icon-action text-primary" onclick="openEditModal(${item.id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="btn-icon-action text-danger" onclick="deleteUsuario(${item.id})" title="Excluir"><i class="fas fa-trash"></i></button>
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
  // 2. VISÃO MOBILE (INSET GROUPED LIST - APPLE HIG)
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
      const profileBadge = `<span class="badge bg-${color} bg-opacity-10 text-${color} fw-bold px-2 py-1" style="font-size: 0.65rem; border-radius: 6px;">${profileLabel.toUpperCase()}</span>`;

      const isActive = item.is_active !== false && item.is_active !== "f" && item.is_active !== "0";
      const statusIconHtml = isActive ? `<span class="text-success"><i class="fas fa-check-circle"></i></span>` : `<span class="text-danger"><i class="fas fa-times-circle"></i></span>`;

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
                      <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                          <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} onchange="toggleUsuario(${item.id}, this)" style="width: 50px; height: 28px; cursor: pointer;">
                      </div>
                      <div class="status-text-usr-${item.id} d-flex align-items-center">${statusIconHtml}</div>
                  </div>
              </div>
          </div>
          
          <div class="mt-3 p-2 px-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-inner d-flex flex-wrap gap-2 align-items-center">
              ${profileBadge}
              <span class="small text-secondary ms-2 fw-medium"><i class="fas fa-calendar-alt opacity-50 me-1"></i> ${item.anos_letivos || "Acesso Geral"}</span>
          </div>

          <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
              <button class="ios-action-pill text-info bg-info bg-opacity-10" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', this)" title="Atividades"><i class="fas fa-book-open-reader"></i></button>
              <button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('security.users', ${item.id}, this)" title="Log"><i class="fas fa-bolt"></i></button>
              <button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="openEditModal(${item.id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
              <button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteUsuario(${item.id})" title="Excluir"><i class="fas fa-trash"></i></button>
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
    let translatedKey = translateLogKey(key);

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
      $("#edit_profile").val(u.main_profile_id || u.id_profile);
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
    text: "O usuário perderá totalmente o acesso ao sistema. Esta ação não pode ser desfeita.",
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
          const lineHtml = index !== res.data.length - 1 ? `<div class="position-absolute h-100 border-start border-2 border-secondary border-opacity-25" style="left: 19px; top: 40px; z-index: 1;"></div>` : ``;
          const detailHtml = parseAuditDetails(h.operation, h.old_values, h.new_values);

          return `
          <div class="d-flex mb-4 position-relative">
              ${lineHtml}
              <div class="flex-shrink-0 position-relative" style="z-index: 2;">
                  <div class="rounded-circle bg-${h.color} bg-opacity-10 text-${h.color} d-flex align-items-center justify-content-center border border-${h.color} border-opacity-25 shadow-sm" style="width: 40px; height: 40px;">
                      <i class="${h.icon}"></i>
                  </div>
              </div>
              
              <div class="flex-grow-1 ms-3 pt-1 w-100">
                  <div class="d-flex justify-content-between align-items-start mb-1 gap-2 flex-wrap flex-md-nowrap">
                      <h6 class="fw-bold mb-0 text-body d-flex flex-column flex-md-row align-items-md-center">
                        ${h.title}
                        <a data-bs-toggle="collapse" href="#collapseLog${index}" class="btn btn-sm btn-light bg-body border-secondary border-opacity-25 rounded-circle mt-2 mt-md-0 ms-md-3 text-primary p-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 28px; height: 28px;" title="Ver detalhes">
                            <i class="fas fa-chevron-down toggle-chevron" style="font-size: 0.8rem; transition: transform 0.3s ease;"></i>
                        </a>
                      </h6>
                      <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal text-nowrap" style="font-size: 0.75rem;"><i class="fas fa-clock me-1 opacity-50"></i> ${h.date_fmt}</span>
                  </div>
                  
                  <div class="collapse mt-3" id="collapseLog${index}">
                      <div class="card card-body bg-body border border-secondary border-opacity-25 p-3 rounded-4 shadow-sm">
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
  if (total <= 1) return;

  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary me-1 shadow-sm" ${current === 1 ? "disabled" : ""}>Primeira</button>`;
  for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p++) {
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"} me-1 shadow-sm">${p}</button>`;
  }
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary shadow-sm" ${current === total ? "disabled" : ""}>Última</button>`;
  container.html(html);
};

$("#filtro-perfil, #busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultUsers.currentPage = 1;
    loadUsuarios();
  }, 500);
});

$(document).ready(() => {
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
