const defaultPeople = {
  currentPage: 1,
  rowsPerPage: 20,
  totalPages: 1,
};

let currentFamilyList = [];
let currentAttachmentsList = [];

// ==========================================
// MÁSCARAS E FUNÇÕES GLOBAIS
// ==========================================
window.initMasks = () => {
  const SPMaskBehavior = function (val) {
      return val.replace(/\D/g, "").length === 11 ? "(00) 00000-0000" : "(00) 0000-00009";
    },
    spOptions = {
      onKeyPress: function (val, e, field, options) {
        field.mask(SPMaskBehavior.apply({}, arguments), options);
      },
    };

  $("#tax_id").unmask().mask("000.000.000-00", { reverse: true });
  $("#zip_code").unmask().mask("00000-000");
  $("#phone_main, #phone_secondary, #phone_mobile, #phone_landline, #godparent_phone").unmask().mask(SPMaskBehavior, spOptions);
};

// Toggle Exclusivo Padrinhamento
$("#godparent_married").change(function () {
  if ($(this).is(":checked")) $("#godparent_single").prop("checked", false);
});
$("#godparent_single").change(function () {
  if ($(this).is(":checked")) $("#godparent_married").prop("checked", false);
});

window.copyEmail = (email) => {
  navigator.clipboard.writeText(email).then(() => {
    Swal.fire({ toast: true, position: "top-end", icon: "success", title: "E-mail copiado!", showConfirmButton: false, timer: 2000 });
  });
};

window.togglePerson = (id, element) => handleToggle("togglePerson", id, element, "Estado atualizado.", `.status-text-person-${id}`, getPessoas);

// ==========================================
// MOTOR DA LISTAGEM DE PESSOAS
// ==========================================
const getPessoas = async () => {
  try {
    const page = Math.max(0, defaultPeople.currentPage - 1);
    const search = $("#busca-texto").val();
    const role = $("#filtro-role").val();

    const result = await window.ajaxValidator({
      validator: "getPeople",
      token: defaultApp.userInfo.token,
      limit: defaultPeople.rowsPerPage,
      page: page * defaultPeople.rowsPerPage,
      search: search,
      role_filter: role,
      org_id: localStorage.getItem("tf_active_parish"),
    });

    if (result.status) {
      const dataArray = result.data || [];

      if (dataArray.length > 0) {
        const total = dataArray[0]?.total_registros || 0;
        defaultPeople.totalPages = Math.max(1, Math.ceil(total / defaultPeople.rowsPerPage));
        renderTablePeople(dataArray);
      } else {
        $(".list-table-pessoas").html(`
            <div class="text-center py-5 opacity-50">
                <span class="material-symbols-outlined" style="font-size: 56px;">group_off</span>
                <p class="mt-3 fw-medium text-body">Nenhuma pessoa encontrada com estes filtros.</p>
            </div>
        `);
      }
    } else {
      throw new Error(result.alert || "Erro inesperado ao obter o diretório de pessoas.");
    }
  } catch (e) {
    const errorMessage = e.message || "Falha na comunicação com o servidor. Tente novamente.";
    $(".list-table-pessoas").html(`
        <div class="text-center py-5">
            <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                <i class="fas fa-exclamation-triangle fs-3"></i>
            </div>
            <h6 class="fw-bold text-danger">Erro ao carregar dados</h6>
            <button class="btn btn-sm btn-outline-danger rounded-pill px-4 shadow-sm" onclick="getPessoas()">
                <i class="fas fa-sync-alt me-2"></i> Tentar Novamente
            </button>
        </div>
    `);
    window.alertErrorWithSupport("Listar Pessoas", errorMessage);
  }
};

const renderTablePeople = (data) => {
  const container = $(".list-table-pessoas");

  if (data.length === 0) {
    container.html(`
        <div class="text-center py-5 opacity-50">
            <span class="material-symbols-outlined" style="font-size: 56px;">person_off</span>
            <p class="mt-3 fw-medium text-body">Nenhum registro encontrado com estes filtros.</p>
        </div>
    `);
    $(".pagination-pessoas").empty();
    return;
  }

  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}

  const canEdit = allowedSlugs.includes("pessoas.edit") || allowedSlugs.includes("pessoas.save");
  const canHistory = allowedSlugs.includes("pessoas.history");
  const canDelete = allowedSlugs.includes("pessoas.delete");

  const formatCPF = (cpf) => (cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : "Não informado");
  const formatDateBR = (dateStr) => (!dateStr || dateStr === "0000-00-00" ? "Não informada" : dateStr.split("-").reverse().join("/"));
  const roleColors = { STUDENT: "primary", CATECHIST: "warning", PRIEST: "secondary", PARENT: "success", DONOR: "info", VENDOR: "danger", SECRETARY: "secondary" };
  const roleNames = { STUDENT: "Catequizando", CATECHIST: "Catequista", PRIEST: "Clero", PARENT: "Responsável", DONOR: "Dizimista", VENDOR: "Barraqueiro", SECRETARY: "Secretária(o)" };

  const desktopRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";
      const nameParts = item.full_name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      const avatarHtml = item.profile_photo_url
        ? `<img src="${item.profile_photo_url}?v=${new Date().getTime()}" class="rounded-circle border border-secondary border-opacity-25 shadow-sm object-fit-cover" style="width: 42px; height: 42px; cursor: zoom-in;" onclick="zoomAvatar('${item.profile_photo_url}', '${item.full_name.replace(/'/g, "\\'")}')">`
        : `<div class="rounded-circle d-flex align-items-center justify-content-center bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold shadow-sm" style="width: 42px; height: 42px; font-size: 0.9rem;">${initials}</div>`;

      let rolesHtml = "";
      if (item.roles_array && item.roles_array.length > 0) {
        item.roles_array.forEach((r) => {
          if (r) rolesHtml += `<span class="badge bg-${roleColors[r] || "secondary"} bg-opacity-10 text-${roleColors[r] || "secondary"} border border-${roleColors[r] || "secondary"} border-opacity-25 rounded-pill mt-1 me-1" style="font-size: 0.65rem;">${roleNames[r] || r}</span>`;
        });
      }

      let quickActionsHtml = "";
      if (item.phone_mobile) {
        const cleanPhone = item.phone_mobile.replace(/\D/g, "");
        const hour = new Date().getHours();
        let saudacao = "Olá, boa noite! Paz e Bem!";
        if (hour >= 5 && hour < 12) saudacao = "Olá, bom dia! Paz e Bem!";
        else if (hour >= 12 && hour < 18) saudacao = "Olá, boa tarde! Paz e Bem!";
        const waMsg = encodeURIComponent(saudacao);
        quickActionsHtml += `<a href="https://wa.me/55${cleanPhone}?text=${waMsg}" target="_blank" class="btn btn-sm text-success bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" title="WhatsApp"><i class="fab fa-whatsapp" style="font-size: 1rem;"></i></a>`;
      }
      if (item.email) {
        quickActionsHtml += `<button class="btn btn-sm text-info bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="copyEmail('${item.email}')" title="Copiar E-mail"><i class="fas fa-envelope" style="font-size: 0.85rem;"></i></button>`;
      }

      let actionsHtml = "";
      if (canHistory) actionsHtml += `<button class="btn-icon-action text-warning" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('people.persons', ${item.person_id}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit) actionsHtml += `<button class="btn-icon-action text-primary" style="width: 32px; height: 32px; padding: 0;" onclick="modalPessoa(${item.person_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete) actionsHtml += `<button class="btn-icon-action text-danger" style="width: 32px; height: 32px; padding: 0;" onclick="deletePerson(${item.person_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
      <tr>
          <td class="text-center align-middle ps-3" style="width: 60px;">${avatarHtml}</td>
          <td class="align-middle" style="min-width: 250px;">
              <div class="fw-bold text-body text-truncate" style="font-size: 0.95rem;">${item.full_name}</div>
              <div class="text-muted small mt-1">CPF: ${formatCPF(item.tax_id)} &nbsp;|&nbsp; Nasc.: ${formatDateBR(item.birth_date)}</div>
              <div>${rolesHtml}</div>
          </td>
          <td class="align-middle">
              <div class="fw-bold text-body small mb-1"><i class="fas fa-mobile-alt me-1 opacity-50"></i> ${item.phone_mobile || "Sem celular"}</div>
              <div class="text-muted small"><i class="fas fa-envelope me-1 opacity-50"></i> ${item.email || "Sem e-mail"}</div>
          </td>
          <td class="text-center align-middle" style="width: 100px;">
              <div class="form-check form-switch m-0 p-0 d-flex align-items-center justify-content-center">
                  <input class="form-check-input m-0 shadow-none border-secondary" type="checkbox" ${isActive ? "checked" : ""} 
                         ${canEdit ? `onchange="togglePerson(${item.person_id}, this)"` : "disabled"} 
                         style="cursor: ${canEdit ? "pointer" : "default"}; width: 44px; height: 24px;">
              </div>
          </td>
          <td class="text-end align-middle pe-4 text-nowrap">
              <div class="d-flex justify-content-end align-items-center flex-nowrap">
                ${quickActionsHtml}
                ${quickActionsHtml && actionsHtml ? `<div class="vr mx-2 opacity-25" style="min-height: 24px;"></div>` : ""}
                ${actionsHtml || (!quickActionsHtml ? '<i class="fas fa-lock text-muted opacity-50" title="Acesso restrito"></i>' : "")}
              </div>
          </td>
      </tr>`;
    })
    .join("");

  const desktopHtml = `
  <div class="d-none d-md-block table-responsive w-100">
      <table class="table-custom mb-0">
          <thead>
              <tr>
                  <th colspan="2" class="ps-3 text-uppercase small opacity-75">Pessoa</th>
                  <th class="text-uppercase small opacity-75">Contato</th>
                  <th class="text-center text-uppercase small opacity-75">Estado</th>
                  <th class="text-end pe-4 text-uppercase small opacity-75">Ações</th>
              </tr>
          </thead>
          <tbody>${desktopRows}</tbody>
      </table>
  </div>`;

  const mobileRows = data
    .map((item) => {
      const isActive = item.is_active === true || item.is_active === "t";
      const nameParts = item.full_name.trim().split(" ");
      const initials = (nameParts[0][0] + (nameParts.length > 1 ? nameParts[nameParts.length - 1][0] : "")).toUpperCase();

      const avatarHtml = item.profile_photo_url
        ? `<img src="${item.profile_photo_url}?v=${new Date().getTime()}" class="rounded-circle object-fit-cover shadow-sm border border-secondary border-opacity-25" style="width: 48px; height: 48px; cursor: zoom-in;" onclick="zoomAvatar('${item.profile_photo_url}', '${item.full_name.replace(/'/g, "\\'")}')">`
        : `<div class="rounded-circle bg-secondary bg-opacity-10 text-secondary d-flex align-items-center justify-content-center fw-bold border border-secondary border-opacity-25 shadow-sm" style="width: 48px; height: 48px; font-size: 1rem;">${initials}</div>`;

      let roleHtml = "";
      if (item.roles_array && item.roles_array[0]) {
        const role = item.roles_array[0];
        roleHtml = `<span class="badge bg-${roleColors[role] || "secondary"} bg-opacity-10 text-${roleColors[role] || "secondary"} border border-${roleColors[role] || "secondary"} border-opacity-25 rounded-pill px-2 py-0 fw-bold" style="font-size: 0.6rem;">${roleNames[role] || role}</span>`;
      }

      let quickActionsHtml = "";
      if (item.phone_mobile) {
        const cleanPhone = item.phone_mobile.replace(/\D/g, "");
        const hour = new Date().getHours();
        let saudacao = "Olá, boa noite! Paz e Bem!";
        if (hour >= 5 && hour < 12) saudacao = "Olá, bom dia! Paz e Bem!";
        else if (hour >= 12 && hour < 18) saudacao = "Olá, boa tarde! Paz e Bem!";
        const waMsg = encodeURIComponent(saudacao);
        quickActionsHtml += `<a href="https://wa.me/55${cleanPhone}?text=${waMsg}" target="_blank" class="btn btn-sm text-success bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" title="WhatsApp"><i class="fab fa-whatsapp" style="font-size: 1rem;"></i></a>`;
      }
      if (item.email) {
        quickActionsHtml += `<button class="btn btn-sm text-info bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0 ms-1" style="width: 32px; height: 32px; padding: 0;" onclick="copyEmail('${item.email}')" title="Copiar E-mail"><i class="fas fa-envelope" style="font-size: 0.85rem;"></i></button>`;
      }

      let actionsHtml = "";
      if (canHistory)
        actionsHtml += `<button class="btn btn-sm text-warning bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="openAudit('people.persons', ${item.person_id}, this)" title="Log"><i class="fas fa-history" style="font-size: 0.85rem;"></i></button>`;
      if (canEdit)
        actionsHtml += `<button class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="modalPessoa(${item.person_id}, this)" title="Editar"><i class="fas fa-pen" style="font-size: 0.85rem;"></i></button>`;
      if (canDelete)
        actionsHtml += `<button class="btn btn-sm text-danger  bg-danger  bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 32px; height: 32px; padding: 0;" onclick="deletePerson(${item.person_id})" title="Excluir"><i class="fas fa-trash-can" style="font-size: 0.85rem;"></i></button>`;

      return `
    <div class="ios-list-item flex-column align-items-stretch mb-2 p-3">
        <div class="d-flex w-100 align-items-center mb-2">
            <div class="me-3 flex-shrink-0">${avatarHtml}</div>
            <div class="flex-grow-1" style="min-width: 0;">
                <div class="d-flex align-items-center flex-wrap gap-2 mb-1">
                    <h6 class="fw-bold text-body m-0 text-truncate" style="font-size: 0.95rem;">${item.full_name}</h6>
                </div>
                <div class="small text-muted fw-medium d-flex align-items-center mt-1" style="font-size: 0.75rem;">
                    CPF: ${formatCPF(item.tax_id)}
                </div>
                <div class="mt-1">${roleHtml}</div>
            </div>
            <div class="form-check form-switch m-0 p-0 d-flex align-items-center flex-shrink-0 ms-2">
                <input class="form-check-input m-0 shadow-none border-secondary" type="checkbox" ${isActive ? "checked" : ""} 
                       ${canEdit ? `onchange="togglePerson(${item.person_id}, this)"` : "disabled"} 
                       style="cursor: ${canEdit ? "pointer" : "default"}; width: 44px; height: 24px;">
            </div>
        </div>
        <div class="d-flex justify-content-between align-items-center pt-2 mt-2 border-top border-secondary border-opacity-10 w-100 flex-nowrap">
            <div class="d-flex flex-nowrap">${quickActionsHtml}</div>
            <div class="d-flex flex-nowrap gap-2">${actionsHtml}</div>
        </div>
    </div>`;
    })
    .join("");

  const mobileHtml = `<div class="d-md-none ios-list-container">${mobileRows}</div>`;
  container.html(desktopHtml + mobileHtml);
  _generatePaginationButtons("pagination-pessoas", "currentPage", "totalPages", "changePage", defaultPeople);
};

// ==========================================
// 2. LÓGICA DE FOTO/LOGO PREMIUM (PESSOAS)
// ==========================================
$("#image-upload-container-person")
  .off("click")
  .on("click", function (e) {
    if ($(e.target).is("#profile_photo") || $(e.target).closest("#btn-remove-photo").length) return;
    $("#profile_photo")[0].click();
  });

$("#profile_photo")
  .off("click")
  .on("click", function (e) {
    e.stopPropagation();
  });

$("#profile_photo").change(function () {
  if (this.files && this.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      $("#preview_photo").attr("src", e.target.result).show();
      $("#placeholder-logo-person").hide();
      $("#btn-remove-photo").removeClass("d-none");
    };
    reader.readAsDataURL(this.files[0]);
  }
});

window.removePhotoPerson = () => {
  $("#profile_photo").val("");
  $("#preview_photo").attr("src", "").hide();
  $("#placeholder-logo-person").show();
  $("#btn-remove-photo").addClass("d-none");
};

// ==========================================
// CONTROLES DO MODAL (FICHA)
// ==========================================
window.modalPessoa = (id = null, btn = false) => {
  const modal = $("#modalPessoa");
  $("#person_id").val("");
  $("#full_name").val("");
  $("#birth_date").val("");
  $("#tax_id").val("");
  $("#national_id").val("");
  $("#gender").val("");
  $("#phone_mobile").val("");
  $("#wants_whatsapp_group").prop("checked", false);
  $("#email_contact").val("");
  $("#zip_code").val("");
  $("#address_street").val("");
  $("#address_number").val("");
  $("#address_district").val("");
  $("#address_city").val("");
  $("#address_state").val("");

  removePhotoPerson();

  $("#is_pcd").prop("checked", false).trigger("change");
  $("#pcd_details").val("");

  $("#role_student").prop("checked", false);
  $("#role_catechist").prop("checked", false);
  $("#role_priest").prop("checked", false);
  $("#role_parent").prop("checked", false);
  $("#role_secretary").prop("checked", false);

  $("#godparent_type").val("");
  $("#godparent_name").val("");
  $("#godparent_phone").val("");
  $("#godparent_dob").val("");
  $("#godparent_address").val("");
  $("#godparent_married").prop("checked", false);
  $("#godparent_single").prop("checked", false);

  $("#has_baptism").prop("checked", false).trigger("change");
  $("#baptism_date").val("");
  $("#baptism_place").val("");
  $("#has_eucharist").prop("checked", false).trigger("change");
  $("#eucharist_date").val("");
  $("#eucharist_place").val("");
  $("#has_chrism").prop("checked", false).trigger("change");
  $("#chrism_date").val("");
  $("#chrism_place").val("");
  $("#has_matrimony").prop("checked", false).trigger("change");
  $("#matrimony_date").val("");
  $("#matrimony_place").val("");

  currentFamilyList = [];
  currentAttachmentsList = [];
  if ($("#sel_relative")[0] && $("#sel_relative")[0].selectize) {
    $("#sel_relative")[0].selectize.clear();
  }

  renderFamilyTable();
  renderAttachmentsTable();
  initMasks();

  if (btn) btn = $(btn);
  if (id) {
    loadPersonData(id, btn);
  } else {
    $("#modalLabel").html('<i class="fas fa-user-plus me-3 opacity-75"></i> Cadastrar Nova Pessoa');
    modal.modal("show");
  }
};

const loadPersonData = async (id, btn) => {
  try {
    window.setButton(true, btn, "");
    const result = await window.ajaxValidator({ validator: "getPerson", token: window.defaultApp.userInfo.token, id: id });

    if (result.status) {
      const d = result.data;
      $("#person_id").val(d.person_id);
      $("#full_name").val(d.full_name);
      $("#birth_date").val(d.birth_date);
      $("#tax_id").val(d.tax_id);
      $("#national_id").val(d.national_id);
      $("#gender").val(d.gender);
      $("#phone_mobile").val(d.phone_mobile);
      $("#wants_whatsapp_group").prop("checked", d.wants_whatsapp_group === true || d.wants_whatsapp_group === "t");
      $("#email_contact").val(d.email);
      $("#zip_code").val(d.zip_code);
      $("#address_street").val(d.address_street);
      $("#address_number").val(d.address_number);
      $("#address_district").val(d.address_district);
      $("#address_city").val(d.address_city);
      $("#address_state").val(d.address_state);

      if (d.profile_photo_url) {
        $("#preview_photo").attr("src", d.profile_photo_url).show();
        $("#placeholder-logo-person").hide();
        $("#btn-remove-photo").removeClass("d-none");
      }

      $("#is_pcd")
        .prop("checked", d.is_pcd === true || d.is_pcd === "t")
        .trigger("change");
      $("#pcd_details").val(d.pcd_details);

      const roles = d.roles || [];
      $("#role_student").prop("checked", roles.includes("STUDENT"));
      $("#role_catechist").prop("checked", roles.includes("CATECHIST"));
      $("#role_priest").prop("checked", roles.includes("PRIEST"));
      $("#role_parent").prop("checked", roles.includes("PARENT"));
      $("#role_secretary").prop("checked", roles.includes("SECRETARY"));

      console.log(d.sacraments_info)

      if (d.sacraments_info) {
        let sac = {};
        try {
          sac = d.sacraments_info ? (typeof d.sacraments_info === "string" ? JSON.parse(d.sacraments_info) : d.sacraments_info) : {};
        } catch (e) {}
        if (sac.baptism && sac.baptism.has) {
          $("#has_baptism").prop("checked", true).trigger("change");
          $("#baptism_date").val(sac.baptism.date);
          $("#baptism_place").val(sac.baptism.place);
        }
        if (sac.eucharist && sac.eucharist.has) {
          $("#has_eucharist").prop("checked", true).trigger("change");
          $("#eucharist_date").val(sac.eucharist.date);
          $("#eucharist_place").val(sac.eucharist.place);
        }
        if (sac.chrism && sac.chrism.has) {
          $("#has_chrism").prop("checked", true).trigger("change");
          $("#chrism_date").val(sac.chrism.date);
          $("#chrism_place").val(sac.chrism.place);
        }
        if (sac.matrimony && sac.matrimony.has) {
          $("#has_matrimony").prop("checked", true).trigger("change");
          $("#matrimony_date").val(sac.matrimony.date);
          $("#matrimony_place").val(sac.matrimony.place);
        }
        if (sac.godparent) {
          $("#godparent_type").val(sac.godparent.type || "");
          $("#godparent_name").val(sac.godparent.name || "");
          $("#godparent_phone").val(sac.godparent.phone || "");
          $("#godparent_dob").val(sac.godparent.dob || "");
          $("#godparent_address").val(sac.godparent.address || "");
          $("#godparent_married").prop("checked", sac.godparent.married === true);
          $("#godparent_single").prop("checked", sac.godparent.single === true);
        }
      }

      currentFamilyList = Array.isArray(d.family) ? d.family : [];
      currentAttachmentsList = Array.isArray(d.attachments) ? d.attachments : [];
      renderFamilyTable();
      renderAttachmentsTable();
      initMasks();

      $("#modalLabel").html(`
          <div class="d-flex align-items-center justify-content-center gap-3">
              <div class="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                  <i class="fas fa-user text-white" style="font-size: 0.9rem;"></i>
              </div>
              <span class="fw-bold tracking-tight">${d.full_name}</span>
          </div>
      `);

      $("#modalPessoa").modal("show");
    } else {
      throw new Error(result.alert || "O servidor não retornou os dados.");
    }
  } catch (e) {
    window.alertErrorWithSupport(`Abrir Ficha de Pessoa`, e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.salvarPessoa = async (btn) => {
  const name = $("#full_name").val()?.trim();
  const id = $("#person_id").val();
  btn = $(btn);

  if (!name) return window.alertDefault("O nome da pessoa é obrigatório.", "warning");
  window.setButton(true, btn, id ? " Salvando..." : " Cadastrando...");

  const formData = new FormData();
  formData.append("validator", "savePerson");
  formData.append("token", window.defaultApp.userInfo.token);
  formData.append("person_id", id);
  formData.append("org_id", localStorage.getItem("tf_active_parish"));

  const txtFields = ["full_name", "birth_date", "tax_id", "national_id", "gender", "phone_mobile", "zip_code", "address_street", "address_number", "address_district", "address_city", "address_state", "pcd_details"];
  txtFields.forEach((f) => formData.append(f, $(`#${f}`).val() || ""));
  formData.append("email", $("#email_contact").val() || "");
  formData.append("wants_whatsapp_group", $("#wants_whatsapp_group").is(":checked"));
  formData.append("is_pcd", $("#is_pcd").is(":checked"));
  formData.append("role_student", $("#role_student").is(":checked"));
  formData.append("role_catechist", $("#role_catechist").is(":checked"));
  formData.append("role_priest", $("#role_priest").is(":checked"));
  formData.append("role_parent", $("#role_parent").is(":checked"));
  formData.append("role_secretary", $("#role_secretary").is(":checked"));

  formData.append("family_json", JSON.stringify(currentFamilyList));

  formData.append(
    "sacraments_json",
    JSON.stringify({
      baptism: { has: $("#has_baptism").is(":checked"), date: $("#baptism_date").val(), place: $("#baptism_place").val() },
      eucharist: { has: $("#has_eucharist").is(":checked"), date: $("#eucharist_date").val(), place: $("#eucharist_place").val() },
      chrism: { has: $("#has_chrism").is(":checked"), date: $("#chrism_date").val(), place: $("#chrism_place").val() },
      matrimony: { has: $("#has_matrimony").is(":checked"), date: $("#matrimony_date").val(), place: $("#matrimony_place").val() },
      godparent: {
        type: $("#godparent_type").val(),
        name: $("#godparent_name").val()?.trim(),
        phone: $("#godparent_phone").val(),
        dob: $("#godparent_dob").val(),
        address: $("#godparent_address").val()?.trim(),
        married: $("#godparent_married").is(":checked"),
        single: $("#godparent_single").is(":checked"),
      },
    }),
  );

  const fileInput = $("#profile_photo")[0];
  if (fileInput && fileInput.files.length > 0) formData.append("profile_photo", fileInput.files[0]);

  try {
    const result = await $.ajax({
      url: window.defaultApp.validator,
      type: "POST",
      data: formData,
      processData: false,
      contentType: false,
      dataType: "json",
    });

    if (result.status) {
      window.alertDefault("Cadastro salvo com sucesso!", "success");
      $("#modalPessoa").modal("hide");
      if (typeof getPessoas === "function") getPessoas();
    } else {
      throw new Error(result.alert || "O servidor recusou o salvamento.");
    }
  } catch (e) {
    window.alertErrorWithSupport(id ? `Editar Pessoa` : "Criar Nova Pessoa", e.message);
  } finally {
    window.setButton(false, btn);
  }
};

window.deletePerson = (id) => {
  Swal.fire({
    title: "Excluir cadastro?",
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
        const res = await window.ajaxValidator({ validator: "deletePerson", token: defaultApp.userInfo.token, id: id });
        if (res.status) {
          window.alertDefault("Cadastro movido para a lixeira com sucesso.", "success");
          getPessoas();
        } else {
          throw new Error(res.alert || "O servidor recusou a exclusão deste cadastro.");
        }
      } catch (e) {
        window.alertErrorWithSupport(`Excluir Pessoa`, e.message || "Falha de comunicação.");
      }
    }
  });
};

// ==========================================
// ABA: FAMÍLIA (NOVO DESIGN PREMIUM)
// ==========================================
window.addRelative = () => {
  const rootPersonId = $("#person_id").val();
  if (!rootPersonId) return window.alertDefault("Por favor, guarde a ficha da pessoa antes de tentar vincular familiares.", "warning");

  const relativeId = $("#sel_relative").val();
  if (!relativeId) return window.alertDefault("Selecione um familiar no campo de busca.", "warning");

  const relationship = $("#sel_relationship").val();
  const isGuardian = $("#is_legal_guardian").is(":checked");
  const selectize = $("#sel_relative")[0].selectize;
  const selectedData = selectize.options[relativeId];

  if (currentFamilyList.some((i) => i.relative_id == relativeId)) {
    return window.alertDefault("Esta pessoa já está vinculada.", "warning");
  }

  currentFamilyList.push({
    relative_id: relativeId,
    relative_name: selectedData.title,
    profile_photo_url: selectedData.profile_photo_url,
    relationship_type: relationship,
    is_legal_guardian: isGuardian,
  });

  renderFamilyTable();
  selectize.clear();
  $("#is_legal_guardian").prop("checked", false);
};

window.removeRelative = (index) => {
  currentFamilyList.splice(index, 1);
  renderFamilyTable();
};

const renderFamilyTable = () => {
  const container = $("#lista-familiares");
  container.empty();

  if (currentFamilyList.length === 0) {
    container.html(`
        <div class="text-center py-4 opacity-50">
            <div class="bg-secondary bg-opacity-10 text-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 48px; height: 48px;">
                <i class="fas fa-users fs-5"></i>
            </div>
            <p class="small fw-medium mb-0">Nenhum familiar vinculado.</p>
        </div>
    `);
    return;
  }

  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}
  const canEdit = allowedSlugs.includes("pessoas.edit") || allowedSlugs.includes("pessoas.save");
  const typeMap = { FATHER: "Pai", MOTHER: "Mãe", SIBLING: "Irmão(ã)", GRANDPARENT: "Avô/Avó", SPOUSE: "Cônjuge", OTHER: "Outro" };

  const html = currentFamilyList
    .map((fam, index) => {
      const initials = fam.relative_name
        ? fam.relative_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        : "?";
      const avatarHtml = fam.profile_photo_url
        ? `<img src="${fam.profile_photo_url}" class="rounded-circle object-fit-cover shadow-sm border border-secondary border-opacity-25" style="width: 42px; height: 42px;">`
        : `<div class="rounded-circle bg-secondary bg-opacity-10 text-secondary d-flex align-items-center justify-content-center fw-bold shadow-sm border border-secondary border-opacity-25" style="width: 42px; height: 42px; font-size: 0.9rem;">${initials}</div>`;

      let badges = "";
      if (fam.is_legal_guardian || fam.is_financial_responsible) {
        badges += `<span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-1 fw-bold ms-2" style="font-size: 0.65rem;"><i class="fas fa-balance-scale me-1"></i> Responsável Legal/Financeiro</span>`;
      }

      return `
    <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-white border border-secondary border-opacity-10 shadow-sm mb-2 transition-all hover-scale">
        <div class="d-flex align-items-center gap-3">
            <div class="flex-shrink-0">${avatarHtml}</div>
            <div>
                <div class="fw-bold text-body" style="font-size: 0.95rem;">${fam.relative_name}</div>
                <div class="d-flex align-items-center mt-1">
                    <span class="text-muted fw-bold small text-uppercase" style="letter-spacing: 0.5px;">${typeMap[fam.relationship_type] || fam.relationship_type}</span>
                    ${badges}
                </div>
            </div>
        </div>
        ${
          canEdit
            ? `
        <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none" style="width: 36px; height: 36px; padding: 0;" onclick="removeRelative(${index})" title="Remover Vínculo">
            <i class="fas fa-trash-can" style="font-size: 0.85rem;"></i>
        </button>`
            : ""
        }
    </div>`;
    })
    .join("");

  container.html(html);
};

// ==========================================
// ABA: DOCUMENTOS E ANEXOS (PREMIUM)
// ==========================================
const renderAttachmentsTable = () => {
  const container = $("#lista-anexos-cards");
  container.empty();

  if (currentAttachmentsList.length === 0) {
    container.html(`
        <div class="text-center py-4 opacity-50">
            <div class="bg-secondary bg-opacity-10 text-secondary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 48px; height: 48px;">
                <i class="fas fa-folder-open fs-5"></i>
            </div>
            <p class="small fw-medium mb-0">Nenhum documento anexado.</p>
        </div>
    `);
    return;
  }

  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) {}
  const canDelete = allowedSlugs.includes("pessoas.delete") || allowedSlugs.includes("pessoas.edit");

  const html = currentAttachmentsList
    .map(
      (item) => `
    <div class="d-flex align-items-center justify-content-between p-3 rounded-4 bg-white border border-secondary border-opacity-10 shadow-sm mb-2 transition-all hover-scale">
        <div class="d-flex align-items-center gap-3">
            <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 42px; height: 42px;">
                <i class="fas fa-file-alt" style="font-size: 1rem;"></i>
            </div>
            <div>
                <div class="fw-bold text-body" style="font-size: 0.95rem;">${item.description || item.file_name}</div>
                <div class="text-muted fw-medium mt-1 d-flex align-items-center flex-wrap gap-2" style="font-size: 0.75rem;">
                    <span class="bg-secondary bg-opacity-10 px-2 py-1 rounded-pill"><i class="far fa-clock me-1"></i> ${item.created_at_fmt || "Recente"}</span>
                    ${item.uploader_name ? `<span class="bg-info bg-opacity-10 text-info px-2 py-1 rounded-pill"><i class="fas fa-user-shield me-1"></i> Por: ${item.uploader_name}</span>` : ""}
                </div>
            </div>
        </div>
        <div class="d-flex gap-2">
            <a href="${item.file_path}" target="_blank" class="btn btn-sm text-primary bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 36px; height: 36px; padding: 0;" title="Ver Documento">
                <i class="fas fa-external-link-alt" style="font-size: 0.85rem;"></i>
            </a>
            ${
              canDelete
                ? `
            <button class="btn btn-sm text-danger bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center hover-scale shadow-none flex-shrink-0" style="width: 36px; height: 36px; padding: 0;" onclick="removeAttachment(${item.attachment_id})" title="Excluir">
                <i class="fas fa-trash-can" style="font-size: 0.85rem;"></i>
            </button>`
                : ""
            }
        </div>
    </div>`,
    )
    .join("");

  container.html(html);
};

window.uploadAttachment = async (btn) => {
  const personId = $("#person_id").val();
  const fileInput = $("#attachment_file")[0];
  const desc = $("#attachment_desc").val().trim();

  if (!personId) return window.alertDefault("Salve a ficha da pessoa antes de adicionar documentos.", "warning");
  if (!fileInput.files || fileInput.files.length === 0) return window.alertDefault("Selecione um arquivo.", "warning");
  if (!desc) return window.alertDefault("Informe uma descrição para o documento.", "warning");

  btn = $(btn);
  window.setButton(true, btn, "Enviando...");

  const formData = new FormData();
  formData.append("validator", "uploadAttachment");
  formData.append("token", defaultApp.userInfo.token);
  formData.append("id_client", defaultApp.userInfo.id_client);
  formData.append("person_id", personId);
  formData.append("description", desc);
  formData.append("file", fileInput.files[0]);

  try {
    const result = await $.ajax({
      url: window.defaultApp.validator,
      data: formData,
      type: "POST",
      processData: false,
      contentType: false,
      dataType: "json",
    });

    const res = typeof result === "string" ? JSON.parse(result) : result;
    if (res.status) {
      window.alertDefault("Documento anexado com sucesso!", "success");
      $("#attachment_file").val("");
      $("#attachment_desc").val("");
      loadPersonData(personId, null);
    } else {
      window.alertDefault(res.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro no upload do documento.", "error");
  } finally {
    window.setButton(false, btn);
  }
};

window.removeAttachment = (id) => {
  Swal.fire({
    title: "Excluir documento?",
    text: "O registro será permanentemente desvinculado.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Sim, excluir",
    cancelButtonText: "Cancelar",
  }).then(async (r) => {
    if (r.isConfirmed) {
      try {
        const res = await window.ajaxValidator({ validator: "removeAttachment", token: defaultApp.userInfo.token, id: id });
        if (res.status) {
          window.alertDefault("Documento removido com sucesso.", "success");
          const currentPersonId = $("#person_id").val();
          if (currentPersonId) loadPersonData(currentPersonId);
        } else {
          throw new Error(res.alert || "Erro inesperado ao remover o arquivo.");
        }
      } catch (e) {
        window.alertErrorWithSupport(`Excluir Documento`, e.message);
      }
    }
  });
};

// ==========================================
// FUNÇÕES AUXILIARES E EVENTOS GLOBAIS
// ==========================================
window.buscarCep = (cep) => {
  cep = cep.replace(/\D/g, "");
  if (cep.length === 8) {
    Swal.fire({ title: "Buscando CEP...", didOpen: () => Swal.showLoading() });
    $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, (data) => {
      Swal.close();
      if (!data.erro) {
        $("#address_street").val(data.logradouro);
        $("#address_district").val(data.bairro);
        $("#address_city").val(data.localidade);
        $("#address_state").val(data.uf);
        $("#address_number").focus();
      } else {
        window.alertDefault("CEP não encontrado.", "warning");
      }
    }).fail(() => Swal.close());
  }
};

window.previewImage = (input) => {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => $("#preview_photo").attr("src", e.target.result);
    reader.readAsDataURL(input.files[0]);
  }
};

$("#is_pcd").change(function () {
  if ($(this).is(":checked")) $("#pcd_details").removeClass("d-none");
  else $("#pcd_details").addClass("d-none").val("");
});
$("#has_baptism").change(function () {
  if ($(this).is(":checked")) $("#baptism_details").removeClass("d-none");
  else $("#baptism_details").addClass("d-none");
});
$("#has_eucharist").change(function () {
  if ($(this).is(":checked")) $("#eucharist_details").removeClass("d-none");
  else $("#eucharist_details").addClass("d-none");
});
$("#has_chrism").change(function () {
  if ($(this).is(":checked")) $("#chrism_details").removeClass("d-none");
  else $("#chrism_details").addClass("d-none");
});
$("#has_matrimony").change(function () {
  if ($(this).is(":checked")) $("#matrimony_details").removeClass("d-none");
  else $("#matrimony_details").addClass("d-none");
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

// ==========================================
// INICIALIZAÇÃO DE COMPONENTES
// ==========================================
$(document).ready(() => {
  if ($("#sel_relative").length && !$("#sel_relative")[0].selectize) {
    $("#sel_relative").selectize({
      valueField: "id",
      labelField: "title",
      searchField: "title",
      placeholder: "Buscar familiar...",
      preload: true,
      dropdownParent: "body",
      onInitialize: function () {
        this.$control.css({ border: "none", "background-color": "rgba(100, 116, 139, 0.1)", "border-radius": "14px", padding: "12px 16px", "font-size": "0.95rem", "font-weight": "600", "box-shadow": "inset 0 1px 2px rgba(0,0,0,0.05)" });
      },
      render: {
        option: (item, escape) => {
          const photo = item.profile_photo_url
            ? `<img src="${escape(item.profile_photo_url)}" class="rounded-circle object-fit-cover border border-secondary border-opacity-25" style="width: 38px; height: 38px;">`
            : `<div class="rounded-circle bg-secondary bg-opacity-25 border border-secondary border-opacity-10 d-flex align-items-center justify-content-center text-body fw-bold" style="width: 38px; height: 38px; font-size: 0.9rem;">${escape(item.title).charAt(0)}</div>`;
          return `
             <div class="d-flex align-items-center py-2 px-3 border-bottom border-secondary border-opacity-10">
                 <div class="me-3 flex-shrink-0">${photo}</div>
                 <div class="flex-grow-1" style="min-width: 0;">
                     <div class="fw-bold text-body text-truncate" style="font-size: 0.95rem;">${escape(item.title)}</div>
                     <div class="text-muted fw-medium text-truncate" style="font-size: 0.75rem;">${item.tax_id ? `CPF: ${escape(item.tax_id)}` : "Sem documento"}</div>
                 </div>
             </div>`;
        },
      },
      load: (q, cb) => {
        $.ajax({ url: defaultApp.validator, type: "POST", dataType: "json", data: { validator: "getRelativesList", token: defaultApp.userInfo.token, search: q, limit: 30 }, success: (r) => cb(r.data), error: () => cb() });
      },
    });
  }
  getPessoas();
});
