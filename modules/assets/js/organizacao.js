const defaultOrg = {
  orgCurrentPage: 1,
  orgRowsPerPage: 20,
  orgTotalPages: 1,
  locCurrentPage: 1,
  locRowsPerPage: 20,
  locTotalPages: 1,
};

/**
 * PROTOCOLO DUAL STATUS (PADRÃO PREMIUM)
 * Garante feedback visual instantâneo sem recarregar a lista
 */
window.toggleDio = (id, element) => handleToggle("toggleOrganization", id, element, "Estado atualizado.", `.status-text-org-${id}`, getDiocese);
window.toggleOrg = (id, element) => handleToggle("toggleOrganization", id, element, "Estado atualizado.", `.status-text-org-${id}`, getOrganizacoes);
window.toggleLoc = (id, element) => handleToggle("toggleLocation", id, element, "Estado atualizado.", `.status-text-loc-${id}`, getLocais);

// =========================================================
// 1. HELPERS DE INTERFACE (LOGO, ZOOM E CEP)
// =========================================================

const _renderLogoCircle = (url, name, id, isMobile = false) => {
  const size = isMobile ? "46px" : "42px";
  const nameEscaped = name ? name.replace(/'/g, "\\'") : "Instituição";

  if (url && url.trim() !== "") {
    return `<img src="${url}?v=${new Date().getTime()}"
                 class="rounded-circle border border-secondary border-opacity-25 shadow-sm" 
                 style="width:${size}; height:${size}; object-fit:cover; cursor: pointer; transition: transform 0.2s;"
                 onclick="if(typeof zoomAvatar === 'function') zoomAvatar('${url}', '${nameEscaped}')"
                 onmouseover="this.style.transform='scale(1.15)'" 
                 onmouseout="this.style.transform='scale(1)'"
                 title="Ver logo">`;
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "?";
  const colors = ["bg-primary", "bg-success", "bg-info", "bg-warning", "bg-danger", "bg-secondary"];
  const colorClass = colors[id % colors.length];

  return `<div class="rounded-circle d-flex align-items-center justify-content-center ${colorClass} text-white shadow-sm fw-bold border border-white border-opacity-25" 
               style="width:${size}; height:${size}; font-size: ${isMobile ? "1.1rem" : "0.9rem"}; letter-spacing: -0.5px; cursor: help;">
               ${initials}
          </div>`;
};

window.buscarCep = (valor) => {
  var cep = valor.replace(/\D/g, "");
  if (cep != "" && /^[0-9]{8}$/.test(cep)) {
    $("#org_street, #org_district, #org_city, #org_state").prop("disabled", true).val("...");
    $.getJSON(`https://viacep.com.br/ws/${cep}/json/?callback=?`, function (d) {
      if (!("erro" in d)) {
        $("#org_street").val(d.logradouro);
        $("#org_district").val(d.bairro);
        $("#org_city").val(d.localidade);
        $("#org_state").val(d.uf);
        $("#org_number").focus();
      } else {
        limpa_formulário_cep();
        window.alertDefault("CEP não encontrado.", "warning");
      }
    }).always(() => $("#org_street, #org_district, #org_city, #org_state").prop("disabled", false));
  } else limpa_formulário_cep();
};

const limpa_formulário_cep = () => {
  $("#org_street, #org_district, #org_city, #org_state").val("").prop("disabled", false);
};

// =========================================================
// 2. GESTÃO DE INSTITUIÇÕES (DIOCESES E PARÓQUIAS)
// =========================================================

window.getDiocese = async () => {
  const container = $(".list-table-diocese");
  try {
    const result = await window.ajaxValidator({ validator: "getDiocese", token: window.defaultApp.userInfo.token, type: "dio" });
    if (result.status) renderTableDiocese(result.data || []);
    else throw new Error(result.alert || "Erro ao carregar dioceses.");
  } catch (e) {
    window.alertErrorWithSupport("Listar Dioceses", e.message);
  }
};

const renderTableDiocese = (data) => {
  const container = $(".list-table-diocese");
  if (data.length === 0) {
    container.html(`<div class="text-center py-5 opacity-50"><span class="material-symbols-outlined fs-1">account_balance</span><p class="mt-2 text-body fw-medium">Nenhuma diocese cadastrada.</p></div>`);
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

  const canHistory = allowedSlugs.includes("organizacao.view");
  const canEdit = allowedSlugs.includes("organizacao.edit");
  const canDelete = allowedSlugs.includes("organizacao.save");

  // --- VISÃO DESKTOP ---
  const desktopRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";

      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('organization.organizations', ${item.org_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick="modalInstituicao(${item.org_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteOrg(${item.org_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">${_renderLogoCircle(item.logo_url, item.display_name, item.org_id)}</td>
          <td class="align-middle">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.display_name}</div>
              <div class="text-muted small mt-1">Contato: ${item.phone_main || "Não informado"}</div>
          </td>
          <td class="text-center align-middle"><span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 shadow-sm">DIOCESE</span></td>
          <td class="align-middle text-body small fw-medium">${item.city_state || "-"}</td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center justify-content-center">
                  <input class="form-check-input shadow-sm m-0" type="checkbox" ${isActive ? "checked" : ""} 
                         ${canEdit ? `onchange="toggleDio(${item.org_id}, this)"` : "disabled"} 
                         style="width: 44px; height: 24px; cursor: ${canEdit ? "pointer" : "default"};">
              </div>
          </td>
          <td class="text-end align-middle pe-3 text-nowrap">
              <div class="d-flex justify-content-end gap-1">
                ${actionsHtml || '<i class="fas fa-lock text-muted opacity-50" title="Acesso restrito"></i>'}
              </div>
          </td>
      </tr>`;
    })
    .join("");

  // --- VISÃO MOBILE ---
  const mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";

      let mobActionsHtml = "";
      if (canHistory) mobActionsHtml += `<button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('organization.organizations', ${item.org_id}, this)"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) mobActionsHtml += `<button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="modalInstituicao(${item.org_id}, this)"><i class="fas fa-pen"></i></button>`;
      if (canDelete) mobActionsHtml += `<button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteOrg(${item.org_id})"><i class="fas fa-trash"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch">
          <div class="d-flex w-100 align-items-center">
              <div class="me-3">${_renderLogoCircle(item.logo_url, item.display_name, item.org_id, true)}</div>
              <div class="flex-grow-1" style="min-width: 0;">
                  <div class="fw-bold text-body text-truncate" style="font-size: 1rem;">${item.display_name}</div>
                  <div class="small text-secondary mt-1 text-truncate"><i class="fas fa-map-marker-alt me-1 opacity-50"></i> ${item.city_state || "Sem local"}</div>
              </div>
              <div class="ms-2">
                  <div class="form-check form-switch m-0 p-0">
                      <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="toggleDio(${item.org_id}, this)"` : "disabled"} 
                             style="width: 50px; height: 28px;">
                  </div>
              </div>
          </div>
          ${mobActionsHtml ? `<div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">${mobActionsHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-uppercase small opacity-75">Diocese / Instituição</th>
                    <th class="text-center text-uppercase small opacity-75">Tipo</th>
                    <th class="text-uppercase small opacity-75">Localização</th>
                    <th class="text-center text-uppercase small opacity-75">Estado</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none ios-list-container">${mobileRows}</div>`);
};

window.getOrganizacoes = async () => {
  const container = $(".list-table-orgs");
  try {
    let page = Math.max(0, defaultOrg.orgCurrentPage - 1);
    container.html(`<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Sincronizando paróquias...</p></div>`);
    const result = await window.ajaxValidator({ validator: "getOrganizations", token: window.defaultApp.userInfo.token, limit: defaultOrg.orgRowsPerPage, page: page * defaultOrg.orgRowsPerPage, type: "org" });
    if (result.status) {
      const dataArray = result.data || [];
      if (dataArray.length > 0) {
        defaultOrg.orgTotalPages = Math.max(1, Math.ceil((dataArray[0]?.total_registros || 0) / defaultOrg.orgRowsPerPage));
        renderTableOrgs(dataArray);
      } else container.html(`<div class="text-center py-5 opacity-50"><span class="material-symbols-outlined fs-1">church</span><p class="mt-2 text-body fw-medium">Nenhuma paróquia encontrada.</p></div>`);
    } else throw new Error(result.alert || "Erro inesperado.");
  } catch (e) {
    window.alertErrorWithSupport("Listar Paróquias", e.message);
  }
};

const renderTableOrgs = (data) => {
  const container = $(".list-table-orgs");

  // Reutiliza a lógica de permissões
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

  console.log(allowedSlugs);

  const canHistory = allowedSlugs.includes("organizacao.view_paroc");
  const canEdit = allowedSlugs.includes("organizacao.edit_paroc");
  const canDelete = allowedSlugs.includes("organizacao.save_paroc");

  const desktopRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";

      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('organization.organizations', ${item.org_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick="modalInstituicao(${item.org_id}, this)" title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteOrg(${item.org_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">${_renderLogoCircle(item.logo_url, item.display_name, item.org_id)}</td>
          <td class="align-middle">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.display_name}</div>
              <small class="text-secondary fw-medium">Contato: ${item.phone_main || "-"}</small>
          </td>
          <td class="text-center align-middle"><span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.65rem;">PARÓQUIA</span></td>
          <td class="align-middle text-body small fw-medium">${item.city_state || "-"}</td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center justify-content-center">
                  <input class="form-check-input shadow-sm m-0" type="checkbox" ${isActive ? "checked" : ""} 
                         ${canEdit ? `onchange="toggleOrg(${item.org_id}, this)"` : "disabled"} 
                         style="width: 44px; height: 24px; cursor: ${canEdit ? "pointer" : "default"};">
              </div>
          </td>
          <td class="text-end align-middle pe-3">
              <div class="d-flex justify-content-end gap-1">
                ${actionsHtml || '<i class="fas fa-lock text-muted opacity-50"></i>'}
              </div>
          </td>
      </tr>`;
    })
    .join("");

  const mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";

      let mobActionsHtml = "";
      if (canHistory) mobActionsHtml += `<button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('organization.organizations', ${item.org_id}, this)"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) mobActionsHtml += `<button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick="modalInstituicao(${item.org_id}, this)"><i class="fas fa-pen"></i></button>`;
      if (canDelete) mobActionsHtml += `<button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteOrg(${item.org_id})"><i class="fas fa-trash"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch">
          <div class="d-flex w-100 align-items-center">
              <div class="me-3">${_renderLogoCircle(item.logo_url, item.display_name, item.org_id, true)}</div>
              <div class="flex-grow-1" style="min-width: 0;">
                  <div class="fw-bold text-body text-truncate" style="font-size: 1rem;">${item.display_name}</div>
                  <div class="small text-secondary mt-1 text-truncate"><i class="fas fa-map-marker-alt me-1 opacity-50"></i> ${item.city_state || "Sem local"}</div>
              </div>
              <div class="ms-2">
                  <div class="form-check form-switch m-0 p-0">
                      <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="toggleOrg(${item.org_id}, this)"` : "disabled"} 
                             style="width: 50px; height: 28px;">
                  </div>
              </div>
          </div>
          ${mobActionsHtml ? `<div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">${mobActionsHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-uppercase small opacity-75">Paróquia / Comunidade</th>
                    <th class="text-center text-uppercase small opacity-75">Tipo</th>
                    <th class="text-uppercase small opacity-75">Localização</th>
                    <th class="text-center text-uppercase small opacity-75">Estado</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none ios-list-container">${mobileRows}</div>`);

  _generatePaginationButtons("pagination-orgs", "orgCurrentPage", "orgTotalPages", "getOrganizacoes", "org");
};

// =========================================================
// 3. GESTÃO DE LOCAIS / ESPAÇOS
// =========================================================

window.getLocais = async () => {
  const container = $(".list-table-locais");
  try {
    let page = Math.max(0, defaultOrg.locCurrentPage - 1);
    container.html(`<div class="text-center py-5 opacity-50"><div class="spinner-border text-primary" role="status"></div><p class="mt-3 fw-medium">Carregando locais...</p></div>`);
    const result = await window.ajaxValidator({ validator: "getLocations", token: window.defaultApp.userInfo.token, limit: defaultOrg.locRowsPerPage, page: page * defaultOrg.locRowsPerPage, org_id: $("#filtro-org-locais").val() });
    if (result.status) {
      const dataArray = result.data || [];
      if (dataArray.length > 0) {
        defaultOrg.locTotalPages = Math.max(1, Math.ceil((dataArray[0]?.total_registros || 0) / defaultOrg.locRowsPerPage));
        renderTableLocais(dataArray);
      } else {
        container.html(`<div class="text-center py-5 opacity-50"><span class="material-symbols-outlined fs-1">meeting_room</span><p class="mt-2 text-body fw-medium">Nenhum local cadastrado.</p></div>`);
        $(".pagination-locais").empty();
      }
    } else throw new Error(result.alert || "Erro ao listar locais.");
  } catch (e) {
    window.alertErrorWithSupport("Listar Locais", e.message);
  }
};

const renderTableLocais = (data) => {
  const container = $(".list-table-locais");

  // Permissões
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
  const canEdit = allowedSlugs.includes("organizacao.edit_loc");
  const canHistory = allowedSlugs.includes("organizacao.view_loc");
  const canDelete = allowedSlugs.includes("organizacao.save_loc");

  const desktopRows = data
    .map((item) => {
      const itemStr = encodeURIComponent(JSON.stringify(item));
      const isActive = item.is_active === true || item.is_active === "t";

      let icons = "";
      if (item.has_ac) icons += window.getResourceIcon("ac");
      if (item.is_accessible) icons += window.getResourceIcon("access");
      if (item.is_consecrated) icons += window.getResourceIcon("sacred");
      let resObj = typeof item.resources === "string" ? JSON.parse(item.resources || "{}") : item.resources || {};
      if (resObj.wifi) icons += window.getResourceIcon("wifi");
      if (resObj.projector) icons += window.getResourceIcon("projector");

      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" onclick="openAudit('organization.locations', ${item.location_id}, this)" title="Log"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")), this)' title="Editar"><i class="fas fa-pen"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" onclick="deleteLoc(${item.location_id})" title="Excluir"><i class="fas fa-trash"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">
              <div class="icon-circle bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 shadow-sm" style="width: 42px; height: 42px;"><i class="fas fa-door-open"></i></div>
          </td>
          <td class="align-middle">
              <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.name}</div>
              <small class="text-secondary fw-medium">${item.org_name || "Espaço Comum"}</small>
          </td>
          <td class="text-center align-middle"><span class="badge bg-secondary bg-opacity-10 text-body border border-secondary border-opacity-25 rounded-pill px-3 py-1 fw-bold" style="font-size: 0.75rem;">${item.capacity || 0}</span></td>
          <td class="text-center align-middle"><div class="d-flex justify-content-center flex-wrap gap-1">${icons || "-"}</div></td>
          <td class="text-center align-middle" style="width: 130px;">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center justify-content-center">
                  <input class="form-check-input shadow-sm m-0" type="checkbox" ${isActive ? "checked" : ""} 
                         ${canEdit ? `onchange="toggleLoc(${item.location_id}, this)"` : "disabled"} 
                         style="width: 44px; height: 24px; cursor: ${canEdit ? "pointer" : "default"};">
              </div>
          </td>
          <td class="text-end pe-3 align-middle">
              <div class="d-flex justify-content-end gap-1">
                ${actionsHtml || '<i class="fas fa-lock text-muted opacity-50"></i>'}
              </div>
          </td>
      </tr>`;
    })
    .join("");

  const mobileRows = data
    .map((item) => {
      const itemStr = encodeURIComponent(JSON.stringify(item));
      const isActive = item.is_active === true || item.is_active === "t";

      let icons = "";
      if (item.has_ac) icons += window.getResourceIcon("ac");
      if (item.is_accessible) icons += window.getResourceIcon("access");
      if (item.is_consecrated) icons += window.getResourceIcon("sacred");
      let resObj = typeof item.resources === "string" ? JSON.parse(item.resources || "{}") : item.resources || {};
      if (resObj.wifi) icons += window.getResourceIcon("wifi");
      if (resObj.projector) icons += window.getResourceIcon("projector");

      let mobActionsHtml = "";
      if (canHistory) mobActionsHtml += `<button class="ios-action-pill text-warning bg-warning bg-opacity-10" onclick="openAudit('organization.locations', ${item.location_id}, this)"><i class="fas fa-bolt"></i></button>`;
      if (canEdit) mobActionsHtml += `<button class="ios-action-pill text-primary bg-primary bg-opacity-10" onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")), this)'><i class="fas fa-pen"></i></button>`;
      if (canDelete) mobActionsHtml += `<button class="ios-action-pill text-danger bg-danger bg-opacity-10" onclick="deleteLoc(${item.location_id})"><i class="fas fa-trash"></i></button>`;

      return `
      <div class="ios-list-item flex-column align-items-stretch">
          <div class="d-flex w-100 align-items-center">
              <div class="me-3">
                  <div class="icon-circle bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-10 shadow-sm" style="width:46px; height:46px;"><i class="fas fa-door-open fs-5"></i></div>
              </div>
              <div class="flex-grow-1" style="min-width: 0;">
                  <div class="fw-bold text-body text-truncate" style="font-size: 1rem;">${item.name}</div>
                  <div class="small text-secondary mt-1 text-truncate"><i class="fas fa-users me-1 opacity-50"></i> Cap: ${item.capacity || 0}</div>
              </div>
              <div class="ms-2">
                  <div class="form-check form-switch m-0 p-0">
                      <input class="form-check-input m-0 shadow-none" type="checkbox" ${isActive ? "checked" : ""} 
                             ${canEdit ? `onchange="toggleLoc(${item.location_id}, this)"` : "disabled"} 
                             style="width: 50px; height: 28px;">
                  </div>
              </div>
          </div>
          ${icons ? `<div class="mt-3 p-2 px-3 rounded-4 bg-secondary bg-opacity-10 border border-secondary border-opacity-10 shadow-inner d-flex flex-wrap gap-3">${icons}</div>` : ""}
          ${mobActionsHtml ? `<div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">${mobActionsHtml}</div>` : ""}
      </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive" style="overflow-x: visible;">
        <table class="table-custom">
            <thead>
                <tr>
                    <th colspan="2" class="ps-3 text-uppercase small opacity-75">Espaço / Sala</th>
                    <th class="text-center text-uppercase small opacity-75">Lotação</th>
                    <th class="text-center text-uppercase small opacity-75">Recursos</th>
                    <th class="text-center text-uppercase small opacity-75">Estado</th>
                    <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
                </tr>
            </thead>
            <tbody>${desktopRows}</tbody>
        </table>
    </div>
    <div class="d-md-none ios-list-container">${mobileRows}</div>`);

  _generatePaginationButtons("pagination-locais", "locCurrentPage", "locTotalPages", "getLocais", "loc");
};

// =========================================================
// 4. LÓGICA DE FOTO/LOGO (PADRÃO PESSOAS.JS)
// =========================================================

$("#image-upload-container-org")
  .off("click")
  .on("click", function (e) {
    if ($(e.target).is("#org_photo") || $(e.target).closest("#btn-remove-logo").length) return;
    $("#org_photo")[0].click();
  });

$("#org_photo")
  .off("click")
  .on("click", function (e) {
    e.stopPropagation();
  });

$("#org_photo").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      $("#img-preview-org").attr("src", e.target.result).show();
      $("#placeholder-logo-org").hide();
      $("#btn-remove-logo").removeClass("d-none");
    };
    reader.readAsDataURL(this.files[0]);
  }
});

window.removeLogoOrg = () => {
  $("#org_photo").val("");
  $("#img-preview-org").attr("src", "").hide();
  $("#placeholder-logo-org").show();
  $("#btn-remove-logo").addClass("d-none");
};

// =========================================================
// 5. PERSISTÊNCIA E LOGICA DE NEGÓCIO
// =========================================================

window.salvarInstituicao = async (btn) => {
  const nome = $("#org_display_name").val()?.trim();
  if (!nome) return window.alertDefault("Nome Fantasia é obrigatório.", "warning");

  btn = $(btn);
  window.setButton(true, btn, " Salvando...");
  const orgId = $("#org_id").val();

  // Envio via FormData para suportar binário de imagem (Padrão pessoas.js)
  const formData = new FormData();
  formData.append("validator", "saveOrganization");
  formData.append("token", window.defaultApp.userInfo.token);

  const data = {
    org_id: orgId,
    display_name: nome,
    legal_name: $("#org_legal_name").val(),
    org_type: $("#org_type").val(),
    tax_id: $("#org_tax_id").val(),
    phone_main: $("#org_phone").val(),
    email_contact: $("#org_email").val(),
    website_url: $("#org_website").val(),
    zip_code: $("#org_zip").val(),
    address_street: $("#org_street").val(),
    address_number: $("#org_number").val(),
    address_district: $("#org_district").val(),
    address_city: $("#org_city").val(),
    address_state: $("#org_state").val(),
    patron_saint: $("#org_patron").val(),
  };
  formData.append("data", JSON.stringify(data));
  formData.append("user_id", window.defaultApp.userInfo.id);

  const fileInput = $("#org_photo")[0];
  if (fileInput.files && fileInput.files[0]) {
    formData.append("logo_file", fileInput.files[0]);
  }

  try {
    const result = await (window.ajaxValidatorFoto
      ? window.ajaxValidatorFoto(formData)
      : $.ajax({
          url: defaultApp.validator,
          data: formData,
          type: "POST",
          processData: false,
          contentType: false,
          dataType: "json",
        }));

    const res = result.status !== undefined ? result : JSON.parse(result);

    if (res.status) {
      window.alertDefault("Dados salvos com sucesso!", "success");
      $("#modalInstituicao").modal("hide");
      getDiocese();
      getOrganizacoes();
    } else throw new Error(res.alert || "Erro ao salvar.");
  } catch (e) {
    window.alertErrorWithSupport(orgId ? `Editar Org` : "Criar Org", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteOrg = (id) => {
  Swal.fire({ title: "Excluir Instituição?", text: "Ela será movida para a lixeira do sistema.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sim, excluir" }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteOrganization", token: window.defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Removida com sucesso.", "success");
        getDiocese();
        getOrganizacoes();
      } else window.alertErrorWithSupport("Excluir Org", res.alert);
    }
  });
};

window.salvarLocal = async (btn) => {
  const nome = $("#loc_name").val()?.trim();
  const orgId = $("#loc_org_id").val();
  if (!nome || !orgId) return window.alertDefault("Nome e Paróquia são obrigatórios.", "warning");
  btn = $(btn);
  window.setButton(true, btn, " Salvando...");

  try {
    const data = {
      location_id: $("#loc_id").val(),
      org_id: orgId,
      name: nome,
      capacity: $("#loc_capacity").val(),
      responsible_id: $("#loc_responsible").val(),
      has_ac: $("#loc_ac").is(":checked"),
      is_accessible: $("#loc_access").is(":checked"),
      is_consecrated: $("#loc_sacred").is(":checked"),
      resources: JSON.stringify({
        whiteboard: $("#loc_whiteboard").is(":checked"),
        projector: $("#loc_projector").is(":checked"),
        sound: $("#loc_sound").is(":checked"),
        wifi: $("#loc_wifi").is(":checked"),
        kitchen: $("#loc_kitchen").is(":checked"),
        parking: $("#loc_parking").is(":checked"),
        fan: $("#loc_fan").is(":checked"),
        water: $("#loc_water").is(":checked"),
        computer: $("#loc_computer").is(":checked"),
      }),
      address_zip: $("#loc_zip").val(),
      address_street: $("#loc_street").val(),
      address_number: $("#loc_number").val(),
      address_district: $("#loc_district").val(),
    };
    const res = await window.ajaxValidator({ validator: "saveLocation", token: window.defaultApp.userInfo.token, data: data });
    if (res.status) {
      window.alertDefault("Local salvo!", "success");
      $("#modalLocal").modal("hide");
      getLocais();
    } else throw new Error(res.alert);
  } catch (e) {
    window.alertErrorWithSupport("Salvar Local", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deleteLoc = (id) => {
  Swal.fire({ title: "Excluir Local?", text: "Será movido para a lixeira.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sim, excluir" }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deleteLocation", token: window.defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Local removido.", "success");
        getLocais();
      } else window.alertErrorWithSupport("Excluir Local", res.alert);
    }
  });
};

// =========================================================
// 6. GESTÃO DE MODAIS E PAGINAÇÃO
// =========================================================

window.modalInstituicao = (id = null, btn = false) => {
  const modal = $("#modalInstituicao");
  modal.find("input").val("");
  removeLogoOrg();
  if (btn) btn = $(btn);
  if ($("#org_type")[0]?.selectize) {
    $("#org_type")[0].selectize.clear(true);
    $("#org_type")[0].selectize.enable();
  }

  if (id) loadOrgData(id, btn);
  else {
    $("#modalInstituicaoLabel").text("Nova Paróquia");
    modal.modal("show");
    if (window.initMasks) window.initMasks();
  }
};

window.modalDiocese = () => {
  window.modalInstituicao();
  $("#modalInstituicaoLabel").text("Nova Diocese");
  if ($("#org_type")[0]?.selectize) {
    $("#org_type")[0].selectize.setValue("DIOCESE");
    $("#org_type")[0].selectize.disable();
  }
};

const loadOrgData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const result = await window.ajaxValidator({ validator: "getOrgById", token: window.defaultApp.userInfo.token, id: id });
    if (result.status) {
      const d = result.data;
      $("#org_id").val(d.org_id);
      $("#org_display_name").val(d.display_name);
      $("#org_legal_name").val(d.legal_name);
      $("#org_tax_id").val(d.tax_id);
      $("#org_phone").val(d.phone_main);
      $("#org_email").val(d.email_contact);
      $("#org_zip").val(d.zip_code);
      $("#org_street").val(d.address_street);
      $("#org_number").val(d.address_number);
      $("#org_district").val(d.address_district);
      $("#org_city").val(d.address_city);
      $("#org_state").val(d.address_state);
      if ($("#org_type")[0]?.selectize) $("#org_type")[0].selectize.setValue(d.org_type);

      if (d.logo_url) {
        $("#img-preview-org").attr("src", d.logo_url).show();
        $("#placeholder-logo-org").hide();
        $("#btn-remove-logo").removeClass("d-none");
      }

      $("#org_tax_id, #org_zip").trigger("input");
      $("#modalInstituicaoLabel").text("Editar Paróquia/Organização");
      $("#modalInstituicao").modal("show");
    }
  } catch (e) {
    window.alertErrorWithSupport("Carregar Org", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

const editarLocalObj = (item, btn) => {
  loadResponsibles().then(() => {
    const modal = $("#modalLocal");
    $("#loc_id").val(item.location_id);
    $("#loc_name").val(item.name);
    $("#loc_capacity").val(item.capacity);
    if ($("#loc_org_id")[0]?.selectize) $("#loc_org_id")[0].selectize.setValue(item.org_id);
    if ($("#loc_responsible")[0]?.selectize) $("#loc_responsible")[0].selectize.setValue(item.responsible_id);
    const res = typeof item.resources === "string" ? JSON.parse(item.resources || "{}") : item.resources || {};
    ["whiteboard", "projector", "sound", "wifi", "kitchen", "parking", "fan", "water", "computer"].forEach((r) => {
      $(`#loc_${r}`).prop("checked", res[r]);
    });
    $("#loc_ac").prop("checked", item.has_ac);
    $("#loc_zip").val(item.address_zip);
    $("#loc_street").val(item.address_street);
    $("#loc_number").val(item.address_number);
    $("#loc_district").val(item.address_district);
    modal.modal("show");
  });
};

window.modalLocal = (id = null) => {
  const modal = $("#modalLocal");
  $("#loc_id, #loc_name, #loc_capacity").val("");
  modal.find('input[type="checkbox"]').prop("checked", false);
  $("#loc_address_block").addClass("d-none");
  loadResponsibles().then(() => {
    const filter = $("#filtro-org-locais").val();
    if (filter && $("#loc_org_id")[0]?.selectize) $("#loc_org_id")[0].selectize.setValue(filter);
    modal.modal("show");
    if (window.initMasks) window.initMasks();
  });
};

const loadResponsibles = async () => {
  try {
    const res = await window.ajaxValidator({ validator: "getResponsiblesList", token: window.defaultApp.userInfo.token });
    if (res.status) {
      const ops = (res.data || []).map((p) => ({ id: p.person_id, title: p.full_name }));
      if ($("#loc_responsible")[0]?.selectize) $("#loc_responsible")[0].selectize.destroy();
      $("#loc_responsible").selectize({ valueField: "id", labelField: "title", searchField: ["title"], options: ops, placeholder: "Selecione..." });
    }
  } catch (e) {
    console.error("Erro ao carregar responsáveis.");
  }
};

window.changePage = (page, funcName, context) => {
  if (context === defaultOrg) {
    if (funcName === "getOrganizacoes") defaultOrg.orgCurrentPage = page;
    else if (funcName === "getLocais") defaultOrg.locCurrentPage = page;
  }
  window[funcName]();
};

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();
  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];
  if (total <= 1) return;

  let html = `<button onclick="changePage(1, '${funcName}', defaultOrg)" class="btn btn-sm btn-secondary me-1 shadow-sm" ${current === 1 ? "disabled" : ""}>Primeira</button>`;
  for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p++) {
    html += `<button onclick="changePage(${p}, '${funcName}', defaultOrg)" class="btn btn-sm ${p === current ? "btn-primary" : "btn-secondary"} me-1 shadow-sm">${p}</button>`;
  }
  html += `<button onclick="changePage(${total}, '${funcName}', defaultOrg)" class="btn btn-sm btn-secondary shadow-sm" ${current === total ? "disabled" : ""}>Última</button>`;
  container.html(html);
};

const populateOrgSelects = (data) => {
  const options = data.map((org) => ({ id: org.org_id, title: org.display_name }));
  $(".select-orgs, .select-orgs-modal").each((_, el) => {
    const $el = $(el);
    if (el.selectize) el.selectize.destroy();
    $el.selectize({
      valueField: "id",
      labelField: "title",
      searchField: ["title"],
      options: options,
      placeholder: "Selecione...",
      onChange: function () {
        $el.trigger("change");
      },
    });
  });
};

$(document).ready(() => {
  $("#org_type").selectize({ placeholder: "Tipo..." });
  if (window.initMasks) window.initMasks();
  getDiocese();
  getOrganizacoes();
  $('button[data-bs-target="#locais"]').on("shown.bs.tab", () => getLocais());
  $("#filtro-org-locais").change(() => {
    defaultOrg.locCurrentPage = 1;
    getLocais();
  });
  $("#loc_zip").on("blur", function () {
    const valor = $(this).val().replace(/\D/g, "");
    if (valor.length === 8) {
      $("#loc_street, #loc_district").prop("disabled", true).val("...");
      $.getJSON(`https://viacep.com.br/ws/${valor}/json/?callback=?`, function (d) {
        if (!("erro" in d)) {
          $("#loc_street").val(d.logradouro);
          $("#loc_district").val(d.bairro);
          $("#loc_number").focus();
        }
      }).always(() => $("#loc_street, #loc_district").prop("disabled", false));
    }
  });
});
