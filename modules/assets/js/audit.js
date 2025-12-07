// =========================================================
// MÓDULO DE AUDITORIA (LOGIC) - V5 (Format Date)
// =========================================================

window.openAudit = async (table, id) => {
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");

  modal.modal("show");

  container.html(`
        <div class="text-center py-5 text-muted">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Rastreando alterações...</p>
        </div>
    `);

  try {
    const result = await ajaxValidator({
      validator: "getAuditLog",
      token: defaultApp.userInfo.token,
      table: table,
      id_record: id,
    });

    if (result.status) {
      renderTimeline(result.data, container);
    } else {
      container.html(`<div class="alert alert-warning text-center"><i class="fas fa-exclamation-triangle mr-2"></i> ${result.alert}</div>`);
    }
  } catch (e) {
    console.error(e);
    container.html('<div class="alert alert-danger">Erro ao carregar auditoria.</div>');
  }
};

const renderTimeline = (logs, container) => {
  if (!logs || logs.length === 0) {
    container.html(`
            <div class="text-center py-5 text-muted opacity-50">
                <span class="material-symbols-outlined" style="font-size: 48px;">history_toggle_off</span>
                <p class="mt-2">Nenhum registro de alteração encontrado.</p>
            </div>
        `);
    return;
  }

  let html = "";

  logs.forEach((log) => {
    const isInsert = log.operation === "INSERT";
    const isDelete = log.operation === "DELETE";

    let icon = "edit";
    let colorClass = "UPDATE";

    if (isInsert) {
      icon = "add";
      colorClass = "INSERT";
    }
    if (isDelete) {
      icon = "delete";
      colorClass = "DELETE";
    }

    let oldVal = {};
    let newVal = {};

    try {
      oldVal = typeof log.old_values === "string" ? JSON.parse(log.old_values) : log.old_values || {};
    } catch (e) {}
    try {
      newVal = typeof log.new_values === "string" ? JSON.parse(log.new_values) : log.new_values || {};
    } catch (e) {}

    let diffHtml = "";

    if (isInsert) {
      diffHtml = '<div class="text-success small"><i class="fas fa-star mr-1"></i> Registro criado.</div>';
    } else if (isDelete) {
      diffHtml = '<div class="text-danger small"><i class="fas fa-trash mr-1"></i> Registro movido para a lixeira.</div>';
    } else {
      let rows = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach((key) => {
        if (["updated_at", "created_at", "user_id", "audit_user_id"].includes(key)) return;

        const vOld = oldVal[key];
        const vNew = newVal[key];

        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
          rows += `
                        <tr>
                            <td class="diff-field text-muted">${formatKey(key)}</td>
                            <td class="diff-old">${formatValue(vOld)}</td>
                            <td class="text-center"><i class="fas fa-arrow-right text-muted mx-2" style="font-size: 10px;"></i></td>
                            <td class="diff-new">${formatValue(vNew)}</td>
                        </tr>
                    `;
        }
      });

      if (rows) diffHtml = `<table class="audit-diff-table">${rows}</table>`;
      else diffHtml = '<div class="text-muted small fst-italic">Atualização interna.</div>';
    }

    let rollbackBtn = "";
    if (log.operation === "UPDATE") {
      rollbackBtn = `
                <div class="mt-2 text-end">
                    <button class="btn btn-xs btn-outline-warning" onclick="doRollback(${log.log_id})">
                        <i class="fas fa-undo-alt mr-1"></i> Restaurar versão
                    </button>
                </div>
            `;
    }

    html += `
            <div class="audit-item">
                <div class="audit-marker ${colorClass}">
                    <span class="material-symbols-outlined" style="font-size: 18px;">${icon}</span>
                </div>
                <div class="audit-content">
                    <div class="audit-header">
                        <span class="audit-user">
                            <img src="../login/assets/img/user.jpg" class="rounded-circle mr-2" style="width: 20px; height: 20px;" 
                                 onerror="this.src='../login/assets/img/favicon.png'">
                            ${log.user_name || "Sistema"}
                        </span>
                        <span class="audit-date text-muted small">${log.date_fmt}</span>
                    </div>
                    <div class="audit-body">
                        ${diffHtml}
                        ${rollbackBtn}
                    </div>
                </div>
            </div>
        `;
  });

  container.html(html);
};

const formatKey = (key) => {
  const map = {
    display_name: "Nome Fantasia",
    legal_name: "Razão Social",
    phone_main: "Telefone",
    phone_secondary: "Tel. Secundário",
    email_contact: "E-mail",
    website_url: "Site/Rede Social",
    address_street: "Rua",
    address_number: "Número",
    address_district: "Bairro",
    address_city: "Cidade",
    address_state: "UF",
    zip_code: "CEP",
    org_type: "Tipo",
    tax_id: "CNPJ",
    patron_saint: "Padroeiro",
    diocese_name: "Diocese",
    decree_number: "Decreto",
    foundation_date: "Fundação",

    name: "Nome",
    capacity: "Capacidade",
    has_ac: "Ar-Condicionado",
    has_ceiling_fan: "Ventilador Teto",
    is_accessible: "Acessibilidade",
    is_consecrated: "Local Sagrado",
    is_sacred: "Local Sagrado",
    is_lodging: "Alojamento",
    resources_detail: "Recursos Extras",
    responsible_id: "Responsável",

    full_name: "Nome Completo",
    religious_name: "Nome Religioso",
    birth_date: "Nascimento",
    gender: "Gênero",
    national_id: "RG",
    is_pcd: "PCD",
    pcd_details: "Detalhes PCD",
    profile_photo_url: "Foto Perfil",
    sacraments_info: "Sacramentos",

    is_active: "Ativo",
    deleted: "Excluído",
  };
  if (map[key]) return map[key];

  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Formatador Inteligente (CORRIGIDO PARA DATA)
const formatValue = (val) => {
  if (val === null || val === undefined || val === "") return '<em class="text-muted">vazio</em>';

  // Booleanos
  if (val === true || val === "t" || val === "true") return "Sim";
  if (val === false || val === "f" || val === "false") return "Não";

  // Detecção de Data (YYYY-MM-DD)
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const parts = val.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }

  // Objetos e JSONs
  if (typeof val === "object" && val !== null) {
    let str = "";

    const jsonMap = {
      whiteboard: "Quadro",
      projector: "Projetor",
      sound: "Som",
      wifi: "Wi-Fi",
      kitchen: "Cozinha",
      parking: "Estacionamento",
      fan: "Ventilador",
      water: "Bebedouro",
      computer: "Computadores",

      baptism: "Batismo",
      baptism_date: "Data Batismo",
      baptism_place: "Local Batismo",
      eucharist: "Eucaristia",
      confirmation: "Crisma",
      marriage: "Matrimônio",
    };

    for (const [k, v] of Object.entries(val)) {
      if (v === false || v === "false" || v === "") continue;

      let label = jsonMap[k] || k;
      let displayVal = v;

      if (v === true || v === "true") {
        displayVal = '<i class="fas fa-check text-success"></i>';
      } else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        // Formata data dentro do JSON também
        const p = v.split("-");
        displayVal = `${p[2]}/${p[1]}/${p[0]}`;
      }

      str += `<div class="d-inline-block me-2 border rounded px-2 mb-1 small bg-light text-dark">
                <strong>${label}:</strong> ${displayVal}
            </div>`;
    }
    return str || '<em class="text-muted">Sem dados</em>';
  }

  return val;
};

window.doRollback = (logId) => {
  Swal.fire({
    title: "Restaurar dados?",
    text: "Os dados serão revertidos para esta versão.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f6c23e",
    confirmButtonText: "Sim, restaurar",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        // Feedback visual de processamento
        Swal.fire({
          title: "Restaurando...",
          text: "Aguarde um momento.",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const res = await ajaxValidator({
          validator: "rollbackAuditLog",
          token: defaultApp.userInfo.token,
          log_id: logId,
        });

        if (res.status) {
          Swal.fire("Sucesso", "Dados restaurados!", "success").then(() => {
            $("#modalAudit").modal("hide");
            // Recarrega listagens
            if (typeof getOrganizacoes === "function") getOrganizacoes();
            if (typeof getLocais === "function") getLocais();
            if (typeof getPessoas === "function") getPessoas();
          });
        } else {
          Swal.fire("Erro", res.alert, "error");
        }
      } catch (e) {
        Swal.fire("Erro", "Falha técnica ao restaurar.", "error");
      }
    }
  });
};
