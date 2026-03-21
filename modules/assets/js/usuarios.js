const defaultUsers = {
  currentPage: 1,
  rowsPerPage: 20,
  totalPages: 1,
};

const loadUsuarios = async () => {
  const container = $(".list-table-usuarios");
  const mobileContainer = $("#mobile-users-cards");

  try {
    const page = Math.max(0, defaultUsers.currentPage - 1);
    const search = $("#busca-texto").val();
    const profile = $("#filtro-perfil").val();

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
        const emptyHtml = `
            <div class="text-center py-5 opacity-50">
                <i class="fas fa-users-slash fa-3x mb-3 text-muted"></i>
                <p class="fw-medium text-body">Nenhum usuário encontrado.</p>
            </div>`;
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

      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);
      const textClass = color === "warning" ? "text-dark" : "text-white";
      const profileBadge = `<span class="badge bg-${color} ${textClass} px-2 py-1">${profileLabel}</span>`;

      return `
        <tr>
            <td class="text-center align-middle ps-3" style="width: 60px;">${avatarHtml}</td>
            <td class="align-middle">
                <div class="fw-bold text-body">${item.name}</div>
                <small class="text-secondary">${item.email}</small>
            </td>
            <td class="align-middle">${profileBadge}</td>
            <td class="align-middle"><small class="text-secondary">${item.anos_letivos || "Acesso Geral"}</small></td>
            <td class="text-end align-middle pe-3 text-nowrap">
                <button class="btn-icon-action text-info" onclick="openHistoryModal(${item.id}, '${item.name.replace(/'/g, "\\'")}', this)" title="Ações da Usuária"><i class="fas fa-book-open-reader"></i></button>
                <button class="btn-icon-action text-warning" onclick="openAudit('security.users', ${item.id}, this)" title="Auditoria Técnica"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="openEditModal(${item.id}, this)" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteUsuario(${item.id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  $(".list-table-usuarios").html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-secondary text-uppercase" style="font-size: 0.75rem;">Usuário</th>
                    <th class="text-secondary text-uppercase" style="font-size: 0.75rem;">Perfil Mestre</th>
                    <th class="text-secondary text-uppercase" style="font-size: 0.75rem;">Vínculos por Ano</th>
                    <th class="text-end pe-4 text-secondary text-uppercase" style="font-size: 0.75rem;">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>`);
};

const renderMobileUsers = (data) => {
  const mobileRows = data
    .map((item) => {
      let avatarHtml = item.img
        ? `<img src="${item.img}" class="rounded-circle border" style="width:50px; height:50px; object-fit:cover;" onclick="zoomAvatar('${item.img}', '${item.name}')">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border fw-bold fs-5" style="width:50px; height:50px;">${item.name.substring(0, 2).toUpperCase()}</div>`;

      const profileLabel = getTranslatedProfile(item.main_profile_name);
      const color = getProfileColor(item.main_profile_id);
      const textClass = color === "warning" ? "text-dark" : "text-white";

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <div class="d-flex align-items-start flex-grow-1 pe-2">
                    <div class="me-3 mt-1">${avatarHtml}</div>
                    <div>
                        <h6 class="fw-bold mb-1 fs-5 lh-sm text-body">${item.name}</h6>
                        <small class="text-secondary d-block mb-2">${item.email}</small>
                        <span class="badge bg-${color} px-2 py-1 ${textClass}">${profileLabel}</span>
                    </div>
                </div>
            </div>
            <div class="small text-secondary mb-3 mt-2"><i class="fas fa-calendar-alt me-1"></i> ${item.anos_letivos || "Acesso Geral"}</div>
            <div class="d-flex justify-content-end border-top border-secondary border-opacity-10 pt-3 gap-2">
                <button class="btn-icon-action text-info bg-info bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="openHistoryModal(${item.id}, '${item.name}', this)" title="Ações da Usuária">
                    <i class="fas fa-book-open-reader"></i>
                </button>
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="openAudit('security.users', ${item.id}, this)" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="openEditModal(${item.id}, this)" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle" style="width: 36px; height: 36px;" onclick="deleteUsuario(${item.id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  $("#mobile-users-cards").html(mobileRows);
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
  } catch (e) { }
  try {
    newObj = typeof newData === "string" ? JSON.parse(newData) : newData || {};
  } catch (e) { }

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
    window.setButton(false, btn)
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
    window.setButton(true, btn, " Resetando...")
    const res = await window.ajaxValidator({ validator: "resetUsuarioPassword", token: defaultApp.userInfo.token, id_client: defaultApp.userInfo.id_client, id_user: id });
    if (res.status) {
      window.setButton(false, btn)
      window.alertDefault("Senha resetada!", "success");
    }
  }
};

window.openHistoryModal = async (id, name, btn) => {
  $("#modalHistoricoUsuario").modal("show");
  $("#lista-historico-timeline").html('<div class="text-center p-5 opacity-25"><div class="spinner-border text-primary"></div></div>');

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

      // Gira a setinha ao abrir o accordion
      $(".collapse")
        .on("show.bs.collapse", function () {
          $(this).parent().find(".toggle-chevron").css("transform", "rotate(180deg)");
        })
        .on("hide.bs.collapse", function () {
          $(this).parent().find(".toggle-chevron").css("transform", "rotate(0deg)");
        });
    } else {
      $("#lista-historico-timeline").html(`<div class="text-center py-5 opacity-50"><p>Nenhum registro operacional.</p></div>`);
    }
  } catch (e) {
    $("#lista-historico-timeline").html(`<div class="text-center py-5 text-danger"><i class="fas fa-exclamation-triangle fa-2x mb-3"></i><p>Falha ao carregar auditoria.</p></div>`);
  } finally {
    window.setButton(false, btn);
  }
};

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
  // Inicializa Selectize para Anos Letivos
  if ($("#edit_years").length > 0 && typeof $("#edit_years").selectize === "function") {
    $("#edit_years").selectize({
      valueField: "id",
      labelField: "name",
      searchField: ["name"],
      plugins: ["remove_button"],
      placeholder: "Selecione...",
    });
    fetchAnosLetivos(); // Chama a função para popular os options
  }

  // Inicializa Selectize para Busca de Pessoas (Novo Usuário)
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
