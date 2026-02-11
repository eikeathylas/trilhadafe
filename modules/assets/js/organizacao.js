const defaultOrg = {
  orgCurrentPage: 1,
  orgRowsPerPage: 20,
  orgTotalPages: 1,
  locCurrentPage: 1,
  locRowsPerPage: 20,
  locTotalPages: 1,
};

// =========================================================
// FUNÇÕES AUXILIARES GLOBAIS DO MÓDULO
// =========================================================

// Atualizado para aceitar seletor de label global (sincroniza mobile/desktop)
const handleToggle = async (validator, id, element, successMsg, labelSelector) => {
  const $chk = $(element);
  const $wrapper = $chk.closest(".form-check");
  const $loader = $wrapper.find(".toggle-loader");
  const $labels = $(labelSelector); // Seleciona todas as ocorrências (Desk e Mobile)
  const status = $chk.is(":checked");

  // [ATUALIZADO] Define os estados visuais com BADGES
  const setVisualState = (isActive) => {
    if (isActive) {
      $labels.html('<span class="badge bg-success-subtle text-success border border-success">Ativa</span>');
    } else {
      $labels.html('<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>');
    }
  };

  try {
    // 1. Bloqueia e mostra loader local
    $chk.prop("disabled", true);
    $loader.removeClass("d-none");

    // 2. Atualiza visualmente (Otimista)
    setVisualState(status);

    // 3. Chamada API
    const result = await ajaxValidator({
      validator: validator,
      token: defaultApp.userInfo.token,
      id: id,
      active: status,
    });

    if (result.status) {
      alertDefault(successMsg, "success");
    } else {
      throw new Error(result.alert || "Erro ao atualizar");
    }
  } catch (e) {
    console.error(e);
    // Reverte estado
    $chk.prop("checked", !status);
    setVisualState(!status);
    alertDefault(e.message || "Erro de conexão.", "error");
  } finally {
    // 4. Libera
    $chk.prop("disabled", false);
    $loader.addClass("d-none");
  }
};

window.toggleOrg = (id, element) => handleToggle("toggleOrganization", id, element, "Instituição atualizada.", `.status-text-org-${id}`);
window.toggleLoc = (id, element) => handleToggle("toggleLocation", id, element, "Local atualizado.", `.status-text-loc-${id}`);

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
    $("#modalInstituicaoLabel").text("Nova Instituição");
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
    const result = await ajaxValidator({ validator: "getOrgById", token: defaultApp.userInfo.token, id: id });
    if (result.status) {
      const data = result.data;
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

      if ($("#org_type")[0].selectize) $("#org_type")[0].selectize.setValue(data.org_type);

      $("#modalInstituicaoLabel").text("Editar Instituição");
      $("#org_tax_id, #org_phone, #org_phone2, #org_zip").trigger("input");
      $("#modalInstituicao").modal("show");
    } else {
      alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
  }
};

// --- GETTERS & RENDERS ---

window.getDiocese = async () => {
  try {
    $(".list-table-diocese").html('<div class="text-center py-5"><span class="loader"></span></div>');
    const result = await ajaxValidator({
      validator: "getDiocese",
      token: defaultApp.userInfo.token,
      type: "dio",
    });

    if (result.status) {
      renderTableDiocese(result.data || []);
    } else {
      $(".list-table-diocese").html('<p class="text-center py-3">Nenhuma diocese encontrada.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-diocese").html('<p class="text-center py-3 text-danger">Erro ao carregar.</p>');
  }
};

const renderTableDiocese = (data) => {
  const container = $(".list-table-diocese");
  if (data.length === 0) {
    container.html('<p class="text-center py-3">Nenhuma instituição encontrada.</p>');
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
                <button onclick="openAudit('organization.organizations', ${item.org_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalInstituicao(${item.org_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteOrg(${item.org_id})" class="btn-icon-action delete" title="Inativar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  // MOBILE
  let mobileRows = data
    .map((item) => {
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };
      return `
        <div class="mobile-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-bold fs-6">${item.display_name}</div>
                    <div class="badge bg-light text-secondary border mt-1">${info.l}</div>
                    <div class="small text-muted mt-1"><i class="fas fa-map-marker-alt me-1"></i> ${item.city_state || "-"}</div>
                </div>
                ${getMobileToggleHtml(item.org_id, item.is_active)}
            </div>
            
            <div class="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
                <button onclick="openAudit('organization.organizations', ${item.org_id})" class="btn-icon-action text-warning"><i class="fas fa-bolt"></i></button>
                <button onclick="modalInstituicao(${item.org_id})" class="btn-icon-action"><i class="fas fa-pen"></i></button>
                <button onclick="deleteOrg(${item.org_id})" class="btn-icon-action delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2">Instituição</th><th class="text-center">Tipo</th><th>Cidade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-none">${mobileRows}</div>
  `);
};

window.getOrganizacoes = async () => {
  try {
    let page = Math.max(0, defaultOrg.orgCurrentPage - 1);
    $(".list-table-orgs").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await ajaxValidator({
      validator: "getOrganizations",
      token: defaultApp.userInfo.token,
      limit: defaultOrg.orgRowsPerPage,
      page: page * defaultOrg.orgRowsPerPage,
      type: "org",
    });

    if (result.status) {
      defaultOrg.orgTotalPages = Math.max(1, Math.ceil((result.data[0]?.total_registros || 0) / defaultOrg.orgRowsPerPage));
      renderTableOrgs(result.data || []);
      populateOrgSelects(result.data || []);
    } else {
      $(".list-table-orgs").html('<p class="text-center py-3">Nenhuma instituição encontrada.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-orgs").html('<p class="text-center py-3 text-danger">Erro ao carregar.</p>');
  }
};

const renderTableOrgs = (data) => {
  const container = $(".list-table-orgs");
  if (data.length === 0) {
    container.html('<p class="text-center py-3">Nenhuma instituição encontrada.</p>');
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
                <button onclick="openAudit('organization.organizations', ${item.org_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalInstituicao(${item.org_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteOrg(${item.org_id})" class="btn-icon-action delete" title="Inativar"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  let mobileRows = data
    .map((item) => {
      let info = tipoMap[item.org_type] || { l: item.org_type, i: "domain" };
      return `
        <div class="mobile-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-bold fs-6">${item.display_name}</div>
                    <div class="badge bg-light text-secondary border mt-1">${info.l}</div>
                    <div class="small text-muted mt-1"><i class="fas fa-map-marker-alt me-1"></i> ${item.city_state || "-"}</div>
                </div>
                <div>${getMobileToggleHtml(item.org_id, item.is_active)}</div>
            </div>
            <div class="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
                <button onclick="openAudit('organization.organizations', ${item.org_id})" class="btn-icon-action text-warning"><i class="fas fa-bolt"></i></button>
                <button onclick="modalInstituicao(${item.org_id})" class="btn-icon-action"><i class="fas fa-pen"></i></button>
                <button onclick="deleteOrg(${item.org_id})" class="btn-icon-action delete"><i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    })
    .join("");

  container.html(`
    <div class="d-none d-md-block table-responsive"><table class="table-custom"><thead><tr><th colspan="2">Instituição</th><th class="text-center">Tipo</th><th>Cidade</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${desktopRows}</tbody></table></div>
    <div class="d-md-block d-md-none">${mobileRows}</div>
  `);
  _generatePaginationButtons("pagination-orgs", "orgCurrentPage", "orgTotalPages", "getOrganizacoes", "org");
};

// =========================================================
// 2. LOCAIS / SALAS (RENDER)
// =========================================================

const getLocais = async () => {
  try {
    let page = Math.max(0, defaultOrg.locCurrentPage - 1);
    $(".list-table-locais").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await ajaxValidator({
      validator: "getLocations",
      token: defaultApp.userInfo.token,
      limit: defaultOrg.locRowsPerPage,
      page: page * defaultOrg.locRowsPerPage,
      org_id: $("#filtro-org-locais").val(),
    });
    if (result.status) {
      defaultOrg.locTotalPages = Math.max(1, Math.ceil((result.data[0]?.total_registros || 0) / defaultOrg.locRowsPerPage));
      renderTableLocais(result.data || []);
    } else {
      $(".list-table-locais").html('<p class="text-center py-3">Nenhum local encontrado.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-locais").html('<p class="text-center py-3 text-danger">Erro ao carregar.</p>');
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
      if (item.has_ac) icons += getResourceIcon("ac");
      return `<tr>
            <td style="width: 60px;"><div class="icon-circle"><span class="material-symbols-outlined">meeting_room</span></div></td>
            <td><div class="fw-bold text-dark">${item.name}</div><small class="text-sub">${item.org_name}</small></td>
            <td class="text-center"><span class="fw-bold text-dark">${item.capacity || 0}</span></td>
            <td class="text-center fs-6"><div class="d-flex justify-content-center flex-wrap gap-1">${icons || "-"}</div></td>
            <td class="text-center align-middle">${getToggleHtml(item.location_id, item.is_active)}</td>
            <td class="text-end pe-3">
                <button onclick="openAudit('organization.locations', ${item.location_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")))' class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deleteLoc(${item.location_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  let mobileRows = data
    .map((item) => {
      const itemStr = encodeURIComponent(JSON.stringify(item));
      return `
        <div class="mobile-card p-3">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <div class="fw-bold">${item.name}</div>
                    <div class="small text-muted"><i class="fas fa-users me-1"></i> Cap: ${item.capacity || 0}</div>
                </div>
                <div>${getMobileToggleHtml(item.location_id, item.is_active)}</div>
            </div>
            <div class="d-flex justify-content-end gap-2 pt-2 border-top mt-2">
                <button onclick="openAudit('organization.locations', ${item.location_id})" class="btn-icon-action text-warning"><i class="fas fa-bolt"></i></button>
                <button onclick='editarLocalObj(JSON.parse(decodeURIComponent("${itemStr}")))' class="btn-icon-action"><i class="fas fa-pen"></i></button>
                <button onclick="deleteLoc(${item.location_id})" class="btn-icon-action delete"><i class="fas fa-trash"></i></button>
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
const salvarInstituicao = async () => {
  const nome = $("#org_display_name").val();
  if (!nome) return alertDefault("Nome Fantasia é obrigatório.", "warning");

  const btn = $(".btn-save-org");
  setButton(true, btn, "Salvando...");

  try {
    const result = await ajaxValidator({
      validator: "saveOrganization",
      token: defaultApp.userInfo.token,
      data: {
        org_id: $("#org_id").val(),
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
      },
    });
    if (result.status) {
      alertDefault("Salvo com sucesso!", "success");
      $("#modalInstituicao").modal("hide");
      getDiocese();
      getOrganizacoes();
    } else {
      alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    alertDefault("Erro ao salvar.", "error");
  } finally {
    setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar');
  }
};

const deleteOrg = (id) => {
  Swal.fire({
    title: "Excluir Instituição?",
    text: "Ela será movida para a lixeira.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sim, inativar",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await ajaxValidator({ validator: "deleteOrganization", token: defaultApp.userInfo.token, id: id });
        if (res.status) {
          alertDefault("Instituição inativada.", "success");
          getDiocese();
          getOrganizacoes();
        } else {
          alertDefault(res.alert, "error");
        }
      } catch (e) {
        alertDefault("Erro ao excluir.", "error");
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
    const result = await ajaxValidator({ validator: "getResponsiblesList", token: defaultApp.userInfo.token });
    if (result.status) {
      const options = result.data.map((p) => ({ id: p.person_id, title: p.full_name }));
      $("#loc_responsible").each((_, el) => el.selectize?.destroy());
      $("#loc_responsible").selectize({ valueField: "id", labelField: "title", searchField: ["title"], options: options, create: false, placeholder: "Selecione..." });
    }
  } catch (e) {
    console.error(e);
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

const salvarLocal = async () => {
  const id = $("#loc_id").val();
  const nome = $("#loc_name").val().trim();
  const orgId = $("#loc_org_id").val();

  if (!nome || !orgId) return alertDefault("Nome e Instituição obrigatórios.", "warning");

  const modalBtn = $(".btn-save-loc");
  setButton(true, modalBtn, "Salvando...");

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
      address_street: $("#loc_diff_address").is(":checked") ? $("#loc_street").val() : "",
      address_number: $("#loc_diff_address").is(":checked") ? $("#loc_number").val() : "",
      address_district: $("#loc_diff_address").is(":checked") ? $("#loc_district").val() : "",
      zip_code: $("#loc_diff_address").is(":checked") ? $("#loc_zip").val() : "",
    };

    const result = await ajaxValidator({ validator: "saveLocation", token: defaultApp.userInfo.token, data: data });
    if (result.status) {
      alertDefault("Salvo!", "success");
      $("#modalLocal").modal("hide");
      getLocais();
    } else {
      alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    alertDefault("Erro ao salvar.", "error");
  } finally {
    setButton(false, modalBtn, "Salvar");
  }
};

window.deleteLoc = (id) => {
  Swal.fire({
    title: "Excluir Local?",
    text: "Ele será movido para a lixeira.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    confirmButtonText: "Sim",
  }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await ajaxValidator({ validator: "deleteLocation", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        alertDefault("Excluído.", "success");
        getLocais();
      } else {
        alertDefault(res.alert, "error");
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
      placeholder: "Selecione a Instituição...",
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
