const defaultPeople = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentFamilyList = [];

// =========================================================
// 1. LISTAGEM E FILTROS
// =========================================================

const getPessoas = async () => {
  try {
    const page = Math.max(0, defaultPeople.currentPage - 1);
    const search = $("#busca-texto").val();
    const role = $("#filtro-role").val();

    $(".list-table-pessoas").html('<div class="text-center py-5"><span class="loader"></span></div>');

    const result = await window.ajaxValidator({
      validator: "getPeople",
      token: defaultApp.userInfo.token,
      limit: defaultPeople.rowsPerPage,
      page: page * defaultPeople.rowsPerPage,
      search: search,
      role_filter: role,
    });

    if (result.status) {
      const total = result.data[0]?.total_registros || 0;
      defaultPeople.totalPages = Math.max(1, Math.ceil(total / defaultPeople.rowsPerPage));
      renderTablePeople(result.data || []);
    } else {
      $(".list-table-pessoas").html('<p class="text-center py-4 text-muted">Nenhuma pessoa encontrada.</p>');
    }
  } catch (e) {
    console.error(e);
    $(".list-table-pessoas").html('<p class="text-center py-4 text-danger">Erro ao carregar dados.</p>');
  }
};

const renderTablePeople = (data) => {
  const container = $(".list-table-pessoas");

  if (data.length === 0) {
    container.html(`
            <div class="text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3 opacity-25"></i>
                <p class="text-muted">Nenhum registro encontrado.</p>
            </div>
        `);
    return;
  }

  let rows = data
    .map((item) => {
      let avatarHtml = "";
      if (item.profile_photo_url) {
        avatarHtml = `<img src="${item.profile_photo_url}?v=${new Date().getTime()}" class="rounded-circle border" style="width:40px; height:40px; object-fit:cover;">`;
      } else {
        const nameParts = item.full_name.trim().split(" ");
        const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();
        avatarHtml = `<div class="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary border fw-bold" style="width:40px; height:40px;">${initials}</div>`;
      }

      let rolesHtml = "";
      const roleColors = { STUDENT: "primary", CATECHIST: "warning", PRIEST: "dark", PARENT: "success", DONOR: "info" };
      const roleNames = { STUDENT: "Aluno", CATECHIST: "Catequista", PRIEST: "Clero", PARENT: "Responsável", DONOR: "Dizimista" };

      if (item.roles_array) {
        item.roles_array.forEach((r) => {
          if (r) rolesHtml += `<span class="badge bg-${roleColors[r] || "secondary"} me-1">${roleNames[r] || r}</span>`;
        });
      }

      let contactHtml = "";
      if (item.phone_mobile) {
        const whatsLink = `https://wa.me/55${item.phone_mobile.replace(/\D/g, "")}`;
        contactHtml += `<a href="${whatsLink}" target="_blank" class="text-success me-2" title="WhatsApp"><i class="fab fa-whatsapp"></i></a>`;
      }
      contactHtml += item.email || '<span class="text-muted small">-</span>';

      const toggleHtml = window.renderToggle ? window.renderToggle(item.person_id, item.is_active, "togglePerson") : `<input type="checkbox" ${item.is_active ? "checked" : ""} onchange="togglePerson(${item.person_id}, this)">`;

      return `
        <tr>
            <td class="text-center align-middle" style="width: 60px;">${avatarHtml}</td>
            <td class="align-middle">
                <div class="fw-bold text-dark">${item.full_name}</div>
                <small class="text-muted">${item.religious_name || ""}</small>
            </td>
            <td class="align-middle">${rolesHtml}</td>
            <td class="align-middle">${contactHtml}</td>
            <td class="text-center align-middle">
                ${toggleHtml}
            </td>
            <td class="text-end align-middle pe-3">
                <button onclick="openAudit('people.persons', ${item.person_id})" class="btn-icon-action text-warning" title="Histórico"><i class="fas fa-bolt"></i></button>
                <button onclick="modalPessoa(${item.person_id})" class="btn-icon-action" title="Editar"><i class="fas fa-pen"></i></button>
                <button onclick="deletePerson(${item.person_id})" class="btn-icon-action delete" title="Excluir"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th colspan="2">Pessoa</th><th>Vínculos</th><th>Contato</th><th class="text-center">Ativo</th><th class="text-end pe-4">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);
  _generatePaginationButtons("pagination-pessoas", "currentPage", "totalPages", "getPessoas", defaultPeople);
};

// =========================================================
// 2. CADASTRO E EDIÇÃO (MODAL)
// =========================================================

window.modalPessoa = (id = null) => {
  const modal = $("#modalPessoa");

  // Reseta Form
  $("#person_id").val("");
  modal.find("input[type=text], input[type=email], input[type=date], select").val("");
  modal.find("input[type=checkbox]").prop("checked", false);

  // Reseta Foto
  $("#img-preview").attr("src", "").hide();
  $("#placeholder-foto").show();
  $("#btn-remove-foto").addClass("d-none");
  $("#person_photo").val("");

  // Reseta Família
  currentFamilyList = [];
  renderFamilyTable();
  if ($("#search_relative")[0]?.selectize) $("#search_relative")[0].selectize.clear();

  // Reset Abas
  $("#pessoaTab button:first").tab("show");
  $("#pcd_details").addClass("d-none");
  $("#baptism_details").addClass("d-none");

  if (id) {
    loadPersonData(id);
  } else {
    $("#modalPessoaLabel").text("Nova Pessoa");
    modal.modal("show");
    initSelectRelatives();
    if (window.initMasks) window.initMasks();
  }
};

const loadPersonData = async (id) => {
  try {
    const result = await window.ajaxValidator({ validator: "getPerson", token: defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#person_id").val(d.person_id);
      $("#full_name").val(d.full_name);
      $("#religious_name").val(d.religious_name);
      $("#birth_date").val(d.birth_date);
      $("#tax_id").val(d.tax_id);
      $("#gender").val(d.gender);
      $("#national_id").val(d.national_id);
      $("#email").val(d.email);
      $("#phone_mobile").val(d.phone_mobile);
      $("#phone_landline").val(d.phone_landline);

      $("#zip_code").val(d.zip_code);
      $("#address_street").val(d.address_street);
      $("#address_number").val(d.address_number);
      $("#address_district").val(d.address_district);
      $("#address_city").val(d.address_city);
      $("#address_state").val(d.address_state);

      $("#is_pcd").prop("checked", d.is_pcd);
      if (d.is_pcd) $("#pcd_details").removeClass("d-none").val(d.pcd_details);

      // Foto
      if (d.profile_photo_url) {
        $("#img-preview").attr("src", d.profile_photo_url).show();
        $("#placeholder-foto").hide();
        $("#btn-remove-foto").removeClass("d-none");
      }

      // Roles
      if (d.roles) {
        if (d.roles.includes("STUDENT")) $("#role_student").prop("checked", true);
        if (d.roles.includes("CATECHIST")) $("#role_catechist").prop("checked", true);
        if (d.roles.includes("PRIEST")) $("#role_priest").prop("checked", true);
        if (d.roles.includes("PARENT")) $("#role_parent").prop("checked", true);
      }

      // Sacramentos (Lógica Nova)
      const sac = d.sacraments_info || {};
      $("#has_baptism").prop("checked", sac.baptism).trigger("change");
      $("#baptism_date").val(sac.baptism_date);
      $("#baptism_place").val(sac.baptism_place);
      $("#has_eucharist").prop("checked", sac.eucharist);
      $("#has_confirmation").prop("checked", sac.confirmation);
      $("#has_marriage").prop("checked", sac.marriage);

      // Família
      currentFamilyList = d.family || [];
      renderFamilyTable();
      initSelectRelatives();

      $("#modalPessoaLabel").text("Editar Pessoa");
      $("#tax_id, #phone_mobile, #phone_landline, #zip_code").trigger("input");

      $("#modalPessoa").modal("show");
    } else {
      window.alertDefault(result.alert, "error");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao carregar cadastro.", "error");
  }
};

// --- GESTÃO DE FOTO ---
$("#image-upload-container")
  .off("click")
  .on("click", function (e) {
    if (e.target.id !== "person_photo") {
      $("#person_photo").trigger("click");
    }
  });
$("#person_photo").on("click", function (e) {
  e.stopPropagation();
});
$("#person_photo").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      $("#img-preview").attr("src", e.target.result).show();
      $("#placeholder-foto").hide();
      $("#btn-remove-foto").removeClass("d-none");
    };
    reader.readAsDataURL(this.files[0]);
  }
});
window.removeFoto = () => {
  $("#person_photo").val("");
  $("#img-preview").attr("src", "").hide();
  $("#placeholder-foto").show();
  $("#btn-remove-foto").addClass("d-none");
};

// --- GESTÃO DE FAMÍLIA ---
const initSelectRelatives = () => {
  const $select = $("#search_relative");
  if ($select[0]?.selectize) $select[0].selectize.destroy();
  $select.selectize({
    valueField: "id",
    labelField: "title",
    searchField: ["title", "tax_id"],
    placeholder: "Busque o parente...",
    create: false,
    load: function (query, callback) {
      if (!query.length) return callback();
      $.ajax({
        url: defaultApp.validator,
        type: "POST",
        dataType: "json",
        data: { validator: "getRelativesList", token: defaultApp.userInfo.token, search: query },
        success: function (res) {
          callback(res.data);
        },
        error: function () {
          callback();
        },
      });
    },
    onChange: function (value) {
      if (value && this.options[value]) promptAddRelative(value, this.options[value].title);
    },
  });
};

const promptAddRelative = (id, name) => {
  Swal.fire({
    title: `Vincular ${name}`,
    html: `<select id="swal-rel-type" class="form-control mb-3">
                <option value="FATHER">Pai</option><option value="MOTHER">Mãe</option>
                <option value="SIBLING">Irmão(ã)</option><option value="GRANDPARENT">Avô(ó)</option>
                <option value="SPOUSE">Esposo(a)</option><option value="GUARDIAN">Tutor Legal</option>
            </select>
            <div class="form-check text-start mb-2"><input class="form-check-input" type="checkbox" id="swal-fin"><label class="form-check-label">Responsável Financeiro?</label></div>
            <div class="form-check text-start"><input class="form-check-input" type="checkbox" id="swal-legal"><label class="form-check-label">Responsável Legal?</label></div>`,
    showCancelButton: true,
    confirmButtonText: "Adicionar",
    preConfirm: () => ({
      type: document.getElementById("swal-rel-type").value,
      fin: document.getElementById("swal-fin").checked,
      legal: document.getElementById("swal-legal").checked,
    }),
  }).then((result) => {
    if (result.isConfirmed) {
      addRelativeToList(id, name, result.value);
    }
    $("#search_relative")[0].selectize.clear();
  });
};

const addRelativeToList = (id, name, details) => {
  if (currentFamilyList.some((f) => f.relative_id == id)) return window.alertDefault("Já vinculado.", "warning");
  currentFamilyList.push({
    relative_id: id,
    relative_name: name,
    relationship_type: details.type,
    is_financial_responsible: details.fin,
    is_legal_guardian: details.legal,
  });
  renderFamilyTable();
};
window.removeRelative = (index) => {
  currentFamilyList.splice(index, 1);
  renderFamilyTable();
};
const renderFamilyTable = () => {
  const container = $("#lista-familia");
  container.empty();
  if (currentFamilyList.length === 0) {
    container.html('<tr><td colspan="4" class="text-center text-muted py-3">Nenhum familiar vinculado.</td></tr>');
    return;
  }
  const typeMap = { FATHER: "Pai", MOTHER: "Mãe", SIBLING: "Irmão(ã)", GRANDPARENT: "Avô(ó)", SPOUSE: "Cônjuge", GUARDIAN: "Tutor" };
  currentFamilyList.forEach((fam, index) => {
    let badges = "";
    if (fam.is_financial_responsible) badges += '<span class="badge bg-success me-1">$</span>';
    if (fam.is_legal_guardian) badges += '<span class="badge bg-primary">Legal</span>';
    container.append(
      `<tr><td>${fam.relative_name}</td><td>${
        typeMap[fam.relationship_type] || fam.relationship_type
      }</td><td class="text-center">${badges}</td><td class="text-center"><button class="btn btn-sm btn-outline-danger border-0" onclick="removeRelative(${index})"><i class="fas fa-times"></i></button></td></tr>`
    );
  });
};

// --- SALVAR TUDO ---
window.salvarPessoa = async () => {
  const name = $("#full_name").val();
  if (!name) return window.alertDefault("Nome Completo obrigatório.", "warning");
  const btn = $(".btn-save-person");
  window.setButton(true, btn, "Salvando...");

  const formData = new FormData();
  formData.append("validator", "savePerson");
  formData.append("token", defaultApp.userInfo.token);
  formData.append("id_client", defaultApp.userInfo.id_client);

  formData.append("person_id", $("#person_id").val());
  formData.append("full_name", name);
  formData.append("religious_name", $("#religious_name").val());
  formData.append("birth_date", $("#birth_date").val());
  formData.append("tax_id", $("#tax_id").val());
  formData.append("national_id", $("#national_id").val());
  formData.append("gender", $("#gender").val());
  formData.append("email", $("#email").val());
  formData.append("phone_mobile", $("#phone_mobile").val());
  formData.append("phone_landline", $("#phone_landline").val());

  formData.append("zip_code", $("#zip_code").val());
  formData.append("address_street", $("#address_street").val());
  formData.append("address_number", $("#address_number").val());
  formData.append("address_district", $("#address_district").val());
  formData.append("address_city", $("#address_city").val());
  formData.append("address_state", $("#address_state").val());

  formData.append("is_pcd", $("#is_pcd").is(":checked"));
  formData.append("pcd_details", $("#pcd_details").val());

  formData.append("role_student", $("#role_student").is(":checked"));
  formData.append("role_catechist", $("#role_catechist").is(":checked"));
  formData.append("role_parent", $("#role_parent").is(":checked"));
  formData.append("role_priest", $("#role_priest").is(":checked"));

  formData.append("family_json", JSON.stringify(currentFamilyList));

  // Sacramentos
  const sacraments = {
    baptism: $("#has_baptism").is(":checked"),
    baptism_date: $("#baptism_date").val(),
    baptism_place: $("#baptism_place").val(),
    eucharist: $("#has_eucharist").is(":checked"),
    confirmation: $("#has_confirmation").is(":checked"),
    marriage: $("#has_marriage").is(":checked"),
  };
  formData.append("sacraments_info", JSON.stringify(sacraments));

  const fileInput = $("#person_photo")[0];
  if (fileInput.files && fileInput.files[0]) formData.append("profile_photo", fileInput.files[0]);

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
      window.alertDefault("Salvo com sucesso!", "success");
      $("#modalPessoa").modal("hide");
      getPessoas();
    } else {
      window.alertDefault(res.alert, "error");
    }
  } catch (e) {
    console.error(e);
    window.alertDefault("Erro ao salvar.", "error");
  } finally {
    window.setButton(false, btn, '<i class="fas fa-save me-2"></i> Salvar Cadastro');
  }
};

window.buscarCep = (valor) => {
  var cep = valor.replace(/\D/g, "");
  if (cep != "" && /^[0-9]{8}$/.test(cep)) {
    $("#address_street, #address_district, #address_city, #address_state").prop("disabled", true).val("...");
    $.getJSON("https://viacep.com.br/ws/" + cep + "/json/?callback=?", function (d) {
      if (!("erro" in d)) {
        $("#address_street").val(d.logradouro);
        $("#address_district").val(d.bairro);
        $("#address_city").val(d.localidade);
        $("#address_state").val(d.uf);
        $("#address_number").focus();
      } else {
        window.alertDefault("CEP não encontrado.", "warning");
      }
    }).always(() => $("#address_street, #address_district, #address_city, #address_state").prop("disabled", false));
  }
};

window.togglePerson = async (id, element) => {
  if (window.handleToggle) window.handleToggle("togglePerson", id, element, "Status atualizado.");
  else {
    const $chk = $(element);
    try {
      await window.ajaxValidator({ validator: "togglePerson", token: defaultApp.userInfo.token, id: id, active: $chk.is(":checked") });
      window.alertDefault("Status atualizado.");
    } catch (e) {
      $chk.prop("checked", !$chk.is(":checked"));
      window.alertDefault("Erro.", "error");
    }
  }
};

window.deletePerson = (id) => {
  Swal.fire({ title: "Excluir?", text: "Vai para a lixeira.", icon: "warning", showCancelButton: true, confirmButtonColor: "#d33", confirmButtonText: "Sim" }).then(async (r) => {
    if (r.isConfirmed) {
      const res = await window.ajaxValidator({ validator: "deletePerson", token: defaultApp.userInfo.token, id: id });
      if (res.status) {
        window.alertDefault("Excluído.", "success");
        getPessoas();
      } else {
        window.alertDefault(res.alert, "error");
      }
    }
  });
};

$("#is_pcd").change(function () {
  if ($(this).is(":checked")) $("#pcd_details").removeClass("d-none").focus();
  else $("#pcd_details").addClass("d-none");
});
$("#has_baptism").change(function () {
  if ($(this).is(":checked")) $("#baptism_details").removeClass("d-none");
  else $("#baptism_details").addClass("d-none");
});
$("#filtro-role, #busca-texto").on("change keyup", function () {
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => {
    defaultPeople.currentPage = 1;
    getPessoas();
  }, 500);
});

window.changePage = (page) => {
  defaultPeople.currentPage = page;
  getPessoas();
};
window.getPessoas = getPessoas;
const _generatePaginationButtons = (c, k, t, f, o) => {
  let ct = $(`.${c}`).empty();
  let tot = o[t],
    cur = o[k];
  let h = `<button onclick="${f}(1)" class="btn btn-sm btn-secondary">Primeira</button>`;
  for (let p = Math.max(1, cur - 1); p <= Math.min(tot, cur + 3); p++) h += `<button onclick="${f}(${p})" class="btn btn-sm ${p === cur ? "btn-primary" : "btn-secondary"}">${p}</button>`;
  h += `<button onclick="${f}(${tot})" class="btn btn-sm btn-secondary">Última</button>`;
  ct.html(h);
};

$(document).ready(() => {
  if (window.initMasks) window.initMasks();
  getPessoas();
});
