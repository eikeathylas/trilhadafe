const defaultOrg = {
  orgCurrentPage: 1,
  orgRowsPerPage: 20,
  orgTotalPages: 1,
  locCurrentPage: 1,
  locRowsPerPage: 20,
  locTotalPages: 1,
};

window.toggleOrg = (id, element) => handleToggle("toggleOrganization", id, element, "Informação atualizada.", `.status-text-org-${id}`);
window.toggleLoc = (id, element) => handleToggle("toggleLocation", id, element, "Informação atualizada.", `.status-text-loc-${id}`);

// =========================================================
// 1. INSTITUIÇÕES (PARÓQUIAS)
// =========================================================

window.buscarCep = (valor) => {
  var cep = valor.replace(/\D/g, "");
  if (cep != "" && /^[0-9]{8}$/.test(cep)) {
    $("#org_street, #org_district, #org_city, #org_state").prop("disabled", true).val("...");

    $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (dados) {
      if (!("erro" in dados)) {
        $("#org_street").val(dados.logradouro);
        $("#org_district").val(dados.bairro);
        $("#org_city").val(dados.localidade);
        $("#org_state").val(dados.uf);
        $("#org_number").focus();
      } else {
        limpa_formulário_cep();
        alertDefault("CEP não encontrado.", "warning");
      }
    })
      .fail(() => {
        limpa_formulário_cep();
        alertDefault("Erro no ViaCEP.", "error");
      })
      .always(() => {
        $("#org_street, #org_district, #org_city, #org_state").prop("disabled", false);
      });
  } else {
    limpa_formulário_cep();
  }
};

const limpa_formulário_cep = () => {
  $("#org_street, #org_district, #org_city, #org_state").val("").prop("disabled", false);
};

const modalInstituicao = (id = null) => {
  const modal = $("#modalInstituicao");
  modal.find("input").val("");

  const selectize = $("#org_type")[0].selectize;
  if (selectize) {
    selectize.clear(true);
    selectize.enable();
  }

  if (id) {
    loadOrgData(id);
  } else {
    $("#modalInstituicaoLabel").text("Nova Paróquia");
    modal.modal("show");
    if (window.initMasks) window.initMasks();
  }
};

window.modalDiocese = () => {
  modalInstituicao();
  $("#modalInstituicaoLabel").text("Nova Diocese");
  const selectize = $("#org_type")[0].selectize;
  if (selectize) {
    selectize.setValue("DIOCESE");
    selectize.disable();
  }
};

const loadOrgData = async (id) => {
  try {
    // Chamada à API com prefixo window. padronizado
    const result = await window.ajaxValidator({
      validator: "getOrgById",
      token: window.defaultApp.userInfo.token,
      id: id,
    });

    if (result.status) {
      const data = result.data;

      // PREENCHIMENTO DE DADOS
      $("#org_id").val(data.org_id);
      $("#org_display_name").val(data.display_name);
      $("#org_legal_name").val(data.legal_name);
      $("#org_tax_id").val(data.tax_id);
      $("#org_phone").val(data.phone_main);
      $("#org_phone2").val(data.phone_secondary);
      $("#org_email").val(data.email_contact);
      $("#org_website").val(data.website_url);
      $("#org_patron").val(data.patron_saint);
      $("#org_decree").val(data.decree_number);
      $("#org_diocese").val(data.diocese_name);
      $("#org_foundation").val(data.foundation_date);
      $("#org_zip").val(data.zip_code);
      $("#org_street").val(data.address_street);
      $("#org_number").val(data.address_number);
      $("#org_district").val(data.address_district);
      $("#org_city").val(data.address_city);
      $("#org_state").val(data.address_state);

      if ($("#org_type")[0] && $("#org_type")[0].selectize) {
        $("#org_type")[0].selectize.setValue(data.org_type);
      }

      $("#modalInstituicaoLabel").text("Editar Paróquia");

      // Força a aplicação das máscaras
      $("#org_tax_id, #org_phone, #org_phone2, #org_zip").trigger("input");

      $("#modalInstituicao").modal("show");
    } else {
      throw new Error(result.alert || "Erro inesperado ao carregar os dados desta instituição.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao tentar carregar a instituição.";
    window.alertErrorWithSupport(`Abrir Cadastro`, errorMessage);
  }
};

// --- GETTERS & RENDERS ---

window.getDiocese = async () => {
  const container = $(".list-table-diocese");

  try {
    // 2. Chamada à API com prefixos padronizados
    const result = await window.ajaxValidator({
      validator: "getDiocese",
      token: window.defaultApp.userInfo.token,
      type: "dio", // Filtro de tipo mantido
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso: Renderiza a tabela (Certifique-se que renderTableDiocese esteja no escopo)
        if (typeof renderTableDiocese === "function") {
          renderTableDiocese(dataArray);
        } else {
          throw new Error("Função de renderização da tabela não encontrada.");
        }
      } else {
        container.html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 64px;">account_balance</span>
                <p class="mt-3 fw-medium text-body">Nenhuma diocese encontrada no sistema.</p>
            </div>
        `);
      }
    } else {
      throw new Error(result.alert || result.msg || "O servidor não conseguiu processar a lista de dioceses.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao carregar dioceses.";

    container.html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-church fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getDiocese()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Dioceses", errorMessage);
  }
};

const renderTableDiocese = (data) => {
  const container = $(".list-table-diocese");
  if (data.length === 0) {
    container.html('<p class="text-center py-3">Nenhuma diocese encontrada.</p>');
    return;
  }

  const tipoMap = { DIOCESE: { l: "Diocese", i: "synagogue" } };

  // Helper para o HTML do Toggle (Com BADGE)
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleOrg(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
    </div>`;
  };

  // Helper Mobile (Com BADGE)
  const getMobileToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex flex-column align-items-end">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleOrg(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-org-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  // DESKTOP
  let desktopRows = data
    .map((item) => {
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };
      return `
        <tr>
            <td style="width: 60px;"><div class="icon-circle"><span class="material-symbols-outlined">${info.i}</span></div></td>
            <td><div class="fw-bold text-dark">${item.display_name}</div><small class="text-sub">${item.phone_main || "-"}</small></td>
            <td class="text-center"><span class="badge" style="background-color: var(--padrao); color: var(--white);">${info.l}</span></td>
            <td><div class="text-dark font-weight-500">${item.city_state || "-"}</div></td>
            <td class="text-center align-middle">${getToggleHtml(item.org_id, item.is_active)}</td>
            <td class="text-end pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.organizations', ${item.org_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="modalInstituicao(${item.org_id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteOrg(${item.org_id})" title="Inativar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      // Captura as informações de tipo (Label e Ícone)
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start">
                
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5">${item.display_name}</h6>
                    
                    <div class="small text-muted mb-2 d-flex align-items-center lh-1 mt-2">
                        <i class="fas fa-map-marker-alt me-2 opacity-50"></i> ${item.city_state || "Local não informado"}
                    </div>
                    
                    <div class="mt-2">
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium px-2 py-1">
                            <i class="fas fa-${info.i} me-1 opacity-75"></i> ${info.l}
                        </span>
                    </div>
                </div>
                
                <div class="text-end mt-1">
                    ${getMobileToggleHtml(item.org_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('organization.organizations', ${item.org_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="modalInstituicao(${item.org_id})" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteOrg(${item.org_id})" title="Inativar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2">Paróquia</th><th class="text-center">Tipo</th><th>Cidade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-none">${mobileRows}</div>
  `);
};

window.getOrganizacoes = async () => {
  try {
    let page = Math.max(0, defaultOrg.orgCurrentPage - 1);

    // 2. Chamada à API
    const result = await window.ajaxValidator({
      validator: "getOrganizations",
      token: window.defaultApp.userInfo.token,
      limit: defaultOrg.orgRowsPerPage,
      page: page * defaultOrg.orgRowsPerPage,
      type: "org",
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso com dados: Atualiza paginação, tabela e selects
        defaultOrg.orgTotalPages = Math.max(1, Math.ceil((dataArray[0]?.total_registros || 0) / defaultOrg.orgRowsPerPage));
        renderTableOrgs(dataArray);
        populateOrgSelects(dataArray);
      } else {
        // Estado Vazio: Não há paróquias (Não é um erro)
        $(".list-table-orgs").html(`
              <div class="text-center py-5 opacity-50">
                  <span class="material-symbols-outlined" style="font-size: 56px;">church</span>
                  <p class="mt-3 fw-medium text-body">Nenhuma paróquia encontrada no sistema.</p>
              </div>
          `);
      }
    } else {
      throw new Error(result.alert || "Erro inesperado ao obter a lista de paróquias.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor. Tente novamente.";

    $(".list-table-orgs").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="window.getOrganizacoes()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Paróquias/Organizações", errorMessage);
  }
};

const renderTableOrgs = (data) => {
  const container = $(".list-table-orgs");
  if (data.length === 0) {
    container.html('<p class="text-center py-3">Nenhuma paróquia encontrada.</p>');
    return;
  }

  const tipoMap = { DIOCESE: { l: "Diocese", i: "synagogue" }, PARISH: { l: "Paróquia", i: "church" } };

  // Helper Desktop (Com BADGE)
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleOrg(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
    </div>`;
  };

  // Helper Mobile (Com BADGE)
  const getMobileToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex flex-column align-items-end">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleOrg(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-org-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  let desktopRows = data
    .map((item) => {
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };
      return `
        <tr>
            <td style="width: 60px;"><div class="icon-circle"><span class="material-symbols-outlined">${info.i}</span></div></td>
            <td><div class="fw-bold text-dark">${item.display_name}</div><small class="text-sub">${item.phone_main || "-"}</small></td>
            <td class="text-center"><span class="badge" style="background-color: var(--padrao); color: var(--white);">${info.l}</span></td>
            <td><div class="text-dark font-weight-500">${item.city_state || "-"}</div></td>
            <td class="text-center align-middle">${getToggleHtml(item.org_id, item.is_active)}</td>
            <td class="text-end pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.organizations', ${item.org_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick="modalInstituicao(${item.org_id})" title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteOrg(${item.org_id})" title="Inativar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  let mobileRows = data
    .map((item) => {
      // Captura as informações de tipo (Label e Ícone)
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start">
                
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5">${item.display_name}</h6>
                    
                    <div class="small text-muted mb-2 d-flex align-items-center">
                        <i class="fas fa-map-marker-alt me-2 opacity-50"></i> ${item.city_state || "Local não informado"}
                    </div>
                    
                    <div class="mt-2">
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium px-2 py-1">
                            <i class="fas fa-${info.i} me-1 opacity-75"></i> ${info.l}
                        </span>
                    </div>
                </div>
                
                <div class="text-end">
                    ${getMobileToggleHtml(item.org_id, item.is_active)}
                </div>
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('organization.organizations', ${item.org_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="modalInstituicao(${item.org_id})" title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteOrg(${item.org_id})" title="Inativar">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2">Paróquia</th><th class="text-center">Tipo</th><th>Cidade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-block d-md-none">${mobileRows}</div>
  `);
  _generatePaginationButtons("pagination-orgs", "orgCurrentPage", "orgTotalPages", "getOrganizacoes", "org");
};

// =========================================================
// 2. LOCAIS / SALAS (RENDER)
// =========================================================

window.getLocais = async () => {
  try {
    let page = Math.max(0, defaultOrg.locCurrentPage - 1);

    // 2. Chamada à API
    const result = await window.ajaxValidator({
      validator: "getLocations",
      token: window.defaultApp.userInfo.token,
      limit: defaultOrg.locRowsPerPage,
      page: page * defaultOrg.locRowsPerPage,
      org_id: $("#filtro-org-locais").val(),
    });

    // 3. Tratamento do Resultado
    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        // Sucesso com dados: Atualiza paginação e tabela
        defaultOrg.locTotalPages = Math.max(1, Math.ceil((dataArray[0]?.total_registros || 0) / defaultOrg.locRowsPerPage));
        renderTableLocais(dataArray);
      } else {
        // Estado Vazio: Nenhum local cadastrado para esta paróquia (Não é um erro)
        $(".list-table-locais").html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">location_on</span>
                <p class="mt-3 fw-medium text-body">Nenhum local de encontro cadastrado.</p>
            </div>
        `);
      }
    } else {
      throw new Error(result.alert || "Erro inesperado ao obter a lista de locais.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor. Tente novamente.";

    $(".list-table-locais").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="window.getLocais()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);

    window.alertErrorWithSupport("Listar Locais", errorMessage);
  }
};

const renderTableLocais = (data) => {
  const container = $(".list-table-locais");
  if (data.length === 0) {
    container.html('<p class="text-center py-3">Nenhum local encontrado.</p>');
    return;
  }

  // Helper Desktop (Com BADGE)
  const getToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex align-items-center justify-content-center">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleLoc(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
    </div>`;
  };

  // Helper Mobile (Com BADGE)
  const getMobileToggleHtml = (id, active) => {
    const statusBadge = active ? '<span class="badge bg-success-subtle text-success border border-success">Ativa</span>' : '<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>';

    return `
    <div class="d-flex flex-column align-items-end">
        <div class="form-check form-switch mb-0">
            <input class="form-check-input" type="checkbox" ${active ? "checked" : ""} onchange="toggleLoc(${id}, this)" style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
        <div class="status-text-loc-${id} mt-1">${statusBadge}</div>
    </div>`;
  };

  let desktopRows = data
    .map((item) => {
      const itemStr = encodeURIComponent(JSON.stringify(item));
      let icons = "";

      // 1. Checagem das propriedades diretas (Raiz do objeto)
      if (item.has_ac) icons += window.getResourceIcon("ac");
      if (item.has_ceiling_fan) icons += window.getResourceIcon("fan");
      if (item.is_accessible) icons += window.getResourceIcon("access");
      if (item.is_consecrated) icons += window.getResourceIcon("sacred");

      // 2. Checagem das propriedades aninhadas (Objeto resources)
      // Garantia caso venha como string JSON do Postgres
      let resObj = item.resources || {};
      if (typeof resObj === "string") {
        try {
          resObj = JSON.parse(resObj);
        } catch (e) {
          resObj = {};
        }
      }

      // Adiciona os demais ícones lendo de 'resources'
      // Evita duplicar o ventilador caso já tenha sido marcado no 'has_ceiling_fan'
      if (resObj.fan && !item.has_ceiling_fan) icons += window.getResourceIcon("fan");

      if (resObj.wifi) icons += window.getResourceIcon("wifi");
      if (resObj.projector) icons += window.getResourceIcon("projector");
      if (resObj.sound) icons += window.getResourceIcon("sound");
      if (resObj.whiteboard) icons += window.getResourceIcon("whiteboard");
      if (resObj.computer) icons += window.getResourceIcon("computer");
      if (resObj.kitchen) icons += window.getResourceIcon("kitchen");
      if (resObj.water) icons += window.getResourceIcon("water");
      if (resObj.parking) icons += window.getResourceIcon("parking");

      return `<tr>
            <td style="width: 60px;"><div class="icon-circle"><span class="material-symbols-outlined">meeting_room</span></div></td>
            <td><div class="fw-bold text-dark">${item.name}</div><small class="text-sub">${item.org_name || ""}</small></td>
            <td class="text-center"><span class="fw-bold text-dark">${item.capacity || 0}</span></td>
            <td class="text-center fs-6"><div class="d-flex justify-content-center flex-wrap gap-1">${icons || "-"}</div></td>
            <td class="text-center align-middle">${getToggleHtml(item.location_id, item.is_active)}</td>
            <td class="text-end pe-3">
                <button class="btn-icon-action text-warning" onclick="openAudit('organization.locations', ${item.location_id})" title="Log"><i class="fas fa-bolt"></i></button>
                <button class="btn-icon-action text-primary" onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")))' title="Editar"><i class="fas fa-pen"></i></button>
                <button class="btn-icon-action text-danger" onclick="deleteLoc(${item.location_id})" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  let mobileRows = data
    .map((item) => {
      const itemStr = encodeURIComponent(JSON.stringify(item));

      // 1. Gera os ícones com a mesma lógica segura do desktop
      let icons = "";
      if (item.has_ac) icons += window.getResourceIcon("ac");
      if (item.has_ceiling_fan) icons += window.getResourceIcon("fan");
      if (item.is_accessible) icons += window.getResourceIcon("access");
      if (item.is_consecrated) icons += window.getResourceIcon("sacred");

      let resObj = item.resources || {};
      if (typeof resObj === "string") {
        try {
          resObj = JSON.parse(resObj);
        } catch (e) {
          resObj = {};
        }
      }

      if (resObj.fan && !item.has_ceiling_fan) icons += window.getResourceIcon("fan");
      if (resObj.wifi) icons += window.getResourceIcon("wifi");
      if (resObj.projector) icons += window.getResourceIcon("projector");
      if (resObj.sound) icons += window.getResourceIcon("sound");
      if (resObj.whiteboard) icons += window.getResourceIcon("whiteboard");
      if (resObj.computer) icons += window.getResourceIcon("computer");
      if (resObj.kitchen) icons += window.getResourceIcon("kitchen");
      if (resObj.water) icons += window.getResourceIcon("water");
      if (resObj.parking) icons += window.getResourceIcon("parking");

      // Monta o bloco de ícones com um design "soft" translúcido (sem bordas duras)
      const iconsHtml = icons ? `<div class="d-flex flex-wrap align-items-center mt-3 p-2 px-3 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-10">${icons}</div>` : "";

      return `
        <div class="mobile-card p-3 mb-3 border rounded-4 shadow-sm position-relative">
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 pe-3">
                    <h6 class="fw-bold mb-1 fs-5">${item.name}</h6>
                    
                    ${item.org_name ? `<div class="small text-muted mb-2 d-flex align-items-center"><i class="fas fa-church me-2 opacity-50"></i> ${item.org_name}</div>` : ""}
                    
                    <div class="small text-muted fw-medium d-flex align-items-center">
                        <i class="fas fa-users me-2 opacity-50"></i> Cap: ${item.capacity || 0}
                    </div>
                </div>
                
                <div class="text-end">
                    ${getMobileToggleHtml(item.location_id, item.is_active)}
                </div>
            </div>
            
            ${iconsHtml}
            
            <div class="d-flex justify-content-end gap-2 pt-3 mt-3 border-top border-secondary border-opacity-10">
                <button class="btn-icon-action text-warning bg-warning bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="openAudit('organization.locations', ${item.location_id})" title="Log">
                    <i class="fas fa-bolt"></i>
                </button>
                <button class="btn-icon-action text-primary bg-primary bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")))' title="Editar">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon-action text-danger bg-danger bg-opacity-10 border-0 rounded-circle d-flex justify-content-center align-items-center" style="width: 36px; height: 36px;" onclick="deleteLoc(${item.location_id})" title="Excluir">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2">Espaço</th><th class="text-center">Capacidade</th><th class="text-center">Recursos</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-none">${mobileRows}</div>
  `);
  _generatePaginationButtons("pagination-locais", "locCurrentPage", "locTotalPages", "getLocais", "loc");
};

// Funções de CRUD (Mantidas as originais)
window.salvarInstituicao = async () => {
  const nome = $("#org_display_name").val()?.trim();

  // Validação de Front-end (Sem acionar suporte)
  if (!nome) return window.alertDefault("Nome Fantasia é obrigatório.", "warning");

  const btn = $(".btn-save-org");
  window.setButton(true, btn, "Salvando...");

  const orgId = $("#org_id").val();
  const data = {
    org_id: orgId,
    display_name: nome,
    legal_name: $("#org_legal_name").val(),
    org_type: $("#org_type").val(),
    tax_id: $("#org_tax_id").val(),
    phone_main: $("#org_phone").val(),
    phone_secondary: $("#org_phone2").val(),
    email_contact: $("#org_email").val(),
    website_url: $("#org_website").val(),
    patron_saint: $("#org_patron").val(),
    decree_number: $("#org_decree").val(),
    diocese_name: $("#org_diocese").val(),
    foundation_date: $("#org_foundation").val(),
    zip_code: $("#org_zip").val(),
    address_street: $("#org_street").val(),
    address_number: $("#org_number").val(),
    address_district: $("#org_district").val(),
    address_city: $("#org_city").val(),
    address_state: $("#org_state").val(),
  };

  try {
    // Chamada à API
    const result = await window.ajaxValidator({
      validator: "saveOrganization",
      token: window.defaultApp.userInfo.token,
      data: data,
    });

    if (result.status) {
      window.alertDefault("Dados da instituição salvos!", "success");
      $("#modalInstituicao").modal("hide");

      // Atualiza as listagens
      if (typeof getDiocese === "function") getDiocese();
      if (typeof getOrganizacoes === "function") getOrganizacoes();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento dos dados da paróquia.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar.";
    const acaoContexto = orgId ? `Editar Instituição` : "Criar Nova Instituição";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    // 4. Sempre libera o botão, mesmo em erro
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar');
  }
};

window.deleteOrg = (id) => {
  Swal.fire({
    title: "Excluir Paróquia?",
    text: "Ela será movida para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d", // Cinza padrão Soft UI
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        // Chamada à API
        const res = await window.ajaxValidator({
          validator: "deleteOrganization",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        // Tratamento do Resultado
        if (res.status) {
          window.alertDefault("Paróquia movida para a lixeira.", "success");

          // Atualiza as listagens se as funções existirem no escopo
          if (typeof getDiocese === "function") getDiocese();
          if (typeof getOrganizacoes === "function") getOrganizacoes();
        } else {
          throw new Error(res.alert || "O banco de dados não permitiu a exclusão desta paróquia.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar excluir a instituição.";
        window.alertErrorWithSupport(`Excluir Paróquia/Org`, errorMessage);
      }
    }
  });
};

const toggleLocAddress = () => {
  if ($("#loc_diff_address").is(":checked")) $("#loc_address_block").removeClass("d-none").hide().slideDown();
  else $("#loc_address_block").slideUp();
};

const buscarCepLoc = (valor) => {
  var cep = valor.replace(/\D/g, "");
  if (cep != "" && /^[0-9]{8}$/.test(cep)) {
    $("#loc_street, #loc_district").prop("disabled", true).val("...");
    $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (d) {
      if (!("erro" in d)) {
        $("#loc_street").val(d.logradouro);
        $("#loc_district").val(d.bairro);
        $("#loc_number").focus();
      }
    }).always(() => $("#loc_street, #loc_district").prop("disabled", false));
  }
};

const loadResponsibles = async () => {
  try {
    // 1. Chamada à API com prefixo window. padronizado
    const result = await window.ajaxValidator({
      validator: "getResponsiblesList",
      token: window.defaultApp.userInfo.token,
    });

    if (result.status) {
      const options = (result.data || []).map((p) => ({
        id: p.person_id,
        title: p.full_name,
      }));

      // 2. Reinicialização Segura do Selectize
      const $select = $("#loc_responsible");

      $select.each((_, el) => {
        if (el.selectize) el.selectize.destroy();
      });

      $select.selectize({
        valueField: "id",
        labelField: "title",
        searchField: ["title"],
        options: options,
        create: false,
        placeholder: "Selecione um responsável...",
      });
    } else {
      throw new Error(result.alert || "Erro ao carregar a lista de responsáveis.");
    }
  } catch (e) {
    const errorMessage = e.message || "Não foi possível carregar a lista de pessoas para este campo.";
    window.alertErrorWithSupport("Carregar Lista de Responsáveis (getResponsiblesList)", errorMessage);
  }
};

const modalLocal = (id = null) => {
  const modal = $("#modalLocal");
  $("#loc_id, #loc_name, #loc_capacity").val("");
  modal.find('input[type="checkbox"]').prop("checked", false);
  $("#loc_address_block").addClass("d-none");
  $("#loc_zip, #loc_street, #loc_number, #loc_district").val("");

  loadResponsibles().then(() => {
    if (id) {
      // Fallback
    } else {
      if ($("#loc_responsible")[0].selectize) $("#loc_responsible")[0].selectize.clear();
      const filter = $("#filtro-org-locais").val();
      if (filter && $("#loc_org_id")[0].selectize) $("#loc_org_id")[0].selectize.setValue(filter);
      modal.modal("show");
      if (window.initMasks) window.initMasks();
    }
  });
};

const editarLocalObj = (item) => {
  loadResponsibles().then(() => {
    const modal = $("#modalLocal");
    $("#loc_id").val(item.location_id);
    $("#loc_name").val(item.name);
    $("#loc_capacity").val(item.capacity);

    if ($("#loc_org_id")[0].selectize) $("#loc_org_id")[0].selectize.setValue(item.org_id);
    if ($("#loc_responsible")[0].selectize) $("#loc_responsible")[0].selectize.setValue(item.responsible_id);

    $("#loc_ac").prop("checked", item.has_ac);
    $("#loc_access").prop("checked", item.is_accessible);
    $("#loc_sacred").prop("checked", item.is_sacred);

    const res = item.resources || {};
    $("#loc_whiteboard").prop("checked", res.whiteboard);
    $("#loc_projector").prop("checked", res.projector);
    $("#loc_sound").prop("checked", res.sound);
    $("#loc_wifi").prop("checked", res.wifi);
    $("#loc_kitchen").prop("checked", res.kitchen);
    $("#loc_parking").prop("checked", res.parking);
    $("#loc_fan").prop("checked", res.fan);
    $("#loc_water").prop("checked", res.water);
    $("#loc_computer").prop("checked", res.computer);

    if (item.address_street) {
      $("#loc_diff_address").prop("checked", true);
      $("#loc_address_block").removeClass("d-none");
      $("#loc_street").val(item.address_street);
      $("#loc_number").val(item.address_number);
      $("#loc_district").val(item.address_district);
      $("#loc_zip").val(item.zip_code);
    } else {
      $("#loc_diff_address").prop("checked", false);
      $("#loc_address_block").addClass("d-none");
    }
    $("#loc_zip").trigger("input");

    modal.modal("show");
  });
};

window.salvarLocal = async () => {
  const id = $("#loc_id").val();
  const nome = $("#loc_name").val()?.trim();
  const orgId = $("#loc_org_id").val();

  // Validações de Front-end (Rápidas, sem acionar suporte)
  if (!nome || !orgId) return window.alertDefault("Nome e Paróquia são obrigatórios.", "warning");

  const modalBtn = $(".btn-save-loc");
  window.setButton(true, modalBtn, "Salvando...");

  try {
    const data = {
      location_id: id,
      org_id: orgId,
      name: nome,
      capacity: $("#loc_capacity").val(),
      responsible_id: $("#loc_responsible").val(),
      has_ac: $("#loc_ac").is(":checked"),
      is_accessible: $("#loc_access").is(":checked"),
      is_consecrated: $("#loc_sacred").is(":checked"),
      has_whiteboard: $("#loc_whiteboard").is(":checked"),
      has_projector: $("#loc_projector").is(":checked"),
      has_sound: $("#loc_sound").is(":checked"),
      has_wifi: $("#loc_wifi").is(":checked"),
      has_kitchen: $("#loc_kitchen").is(":checked"),
      has_parking: $("#loc_parking").is(":checked"),
      has_fan: $("#loc_fan").is(":checked"),
      has_water: $("#loc_water").is(":checked"),
      has_computer: $("#loc_computer").is(":checked"),
      // Lógica de endereço condicional
      address_street: $("#loc_diff_address").is(":checked") ? $("#loc_street").val() : "",
      address_number: $("#loc_diff_address").is(":checked") ? $("#loc_number").val() : "",
      address_district: $("#loc_diff_address").is(":checked") ? $("#loc_district").val() : "",
      zip_code: $("#loc_diff_address").is(":checked") ? $("#loc_zip").val() : "",
    };

    // Chamada à API
    const result = await window.ajaxValidator({
      validator: "saveLocation",
      token: window.defaultApp.userInfo.token,
      data: data,
    });

    if (result.status) {
      window.alertDefault("Local salvo com sucesso!", "success");
      $("#modalLocal").modal("hide");

      if (typeof getLocais === "function") window.getLocais();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento deste local.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor ao salvar o local.";
    const acaoContexto = id ? `Editar Local` : "Criar Novo Local";
    window.alertErrorWithSupport(acaoContexto, errorMessage);
  } finally {
    // 4. Libera o botão independente do resultado
    window.setButton(false, modalBtn, '<i class="fas fa-save me-2"></i> Salvar');
  }
};

window.deleteLoc = (id) => {
  Swal.fire({
    title: "Excluir Local?",
    text: "O registro será movido para a lixeira do sistema.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d", // Cinza padrão do sistema
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        // Chamada à API
        const res = await window.ajaxValidator({
          validator: "deleteLocation",
          token: window.defaultApp.userInfo.token,
          id: id,
        });

        if (res.status) {
          window.alertDefault("Local movido para a lixeira.", "success");

          if (typeof getLocais === "function") window.getLocais();
        } else {
          throw new Error(res.alert || "O banco de dados não permitiu a exclusão deste local.");
        }
      } catch (e) {
        const errorMessage = e.message || "Falha de conexão ao tentar excluir o local.";
        window.alertErrorWithSupport(`Excluir Local`, errorMessage);
      }
    }
  });
};

const populateOrgSelects = (data) => {
  const options = data.map((org) => ({ id: org.org_id, title: org.display_name }));
  const initSelect = (selector) => {
    $(selector).each((_, el) => el.selectize?.destroy());
    $(selector).selectize({
      valueField: "id",
      labelField: "title",
      searchField: ["title"],
      options: options,
      create: false,
      placeholder: "Selecione a Paróquia...",
    });
  };
  initSelect(".select-orgs");
  initSelect(".select-orgs-modal");
};

const initStaticSelects = () => {
  $("#org_type").selectize({ create: false, placeholder: "Selecione o Tipo..." });
};

window.paginateWrapper = (page, funcName, type) => {
  if (type === "org") defaultOrg.orgCurrentPage = page;
  if (type === "loc") defaultOrg.locCurrentPage = page;

  if (funcName === "getDiocese") {
    typeof window.getDiocese === "function" ? window.getDiocese() : getDiocese();
  } else if (funcName === "getOrganizacoes") {
    typeof window.getOrganizacoes === "function" ? window.getOrganizacoes() : getOrganizacoes();
  } else if (funcName === "getLocais") {
    typeof window.getLocais === "function" ? window.getLocais() : getLocais();
  } else if (typeof window[funcName] === "function") {
    window[funcName]();
  } else {
    console.error("Função de paginação não encontrada: " + funcName);
  }
};

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, type) => {
  let container = $(`.${containerClass}`);
  container.empty();
  let total = defaultOrg[totalPagesKey];
  let current = defaultOrg[currentPageKey];
  let html = `<button onclick="paginateWrapper(1, '${funcName}', '${type}')" class="btn btn-sm btn-secondary">Primeira</button>`;
  let startPage = Math.max(1, current - 1);
  let endPage = Math.min(total, startPage + 4);
  for (let p = startPage; p <= endPage; p++) {
    let btnClass = p === current ? "btn-primary" : "btn-secondary";
    html += `<button onclick="paginateWrapper(${p}, '${funcName}', '${type}')" class="btn btn-sm ${btnClass}">${p}</button>`;
  }
  html += `<button onclick="paginateWrapper(${total}, '${funcName}', '${type}')" class="btn btn-sm btn-secondary">Última</button>`;
  container.html(html);
};

$(document).ready(() => {
  initStaticSelects();
  if (window.initMasks) window.initMasks();
  getDiocese();
  getOrganizacoes();
  $("#locais-tab").on("shown.bs.tab", function () {
    getLocais();
  });
  $("#filtro-org-locais").change(function () {
    getLocais();
  });
});
