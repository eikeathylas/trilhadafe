// =========================================================
// MÓDULO DE AUDITORIA (LOGIC) - CORRIGIDO V3
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

        // Comparação profunda para objetos (JSON resources)
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
                            <i class="fas fa-user-circle m-2"></i> ${log.user_name || "Sistema"}
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

// Dicionário de Tradução (CORRIGIDO)
const formatKey = (key) => {
  const map = {
    display_name: "Nome Fantasia",
    legal_name: "Razão Social",
    phone_main: "Telefone",
    phone_secondary: "Tel. Secundário",
    email_contact: "E-mail",
    address_street: "Rua",
    address_number: "Número",
    address_district: "Bairro",
    address_city: "Cidade",
    address_state: "UF",
    zip_code: "CEP",
    org_type: "Tipo",
    tax_id: "CNPJ",
    name: "Nome",
    capacity: "Capacidade",

    // CORREÇÃO AQUI: Tradução dos campos booleanos e JSON
    has_ac: "Ar-Condicionado",
    has_ceiling_fan: "Ventilador Teto",
    is_accessible: "Acessibilidade",
    is_consecrated: "Local Sagrado",
    is_sacred: "Local Sagrado",
    is_lodging: "Alojamento",
    resources_detail: "Recursos Extras",
    responsible_id: "Responsável",

    is_active: "Ativo",
    deleted: "Excluído",
  };
  if (map[key]) return map[key];

  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

// Formatador Inteligente de Valores (CORREÇÃO DO [object Object])
const formatValue = (val) => {
  if (val === null || val === undefined || val === "") return '<em class="text-muted">vazio</em>';
  if (val === true || val === "t" || val === "true") return "Sim";
  if (val === false || val === "f" || val === "false") return "Não";

  // Se for objeto (JSON), formata bonito
  if (typeof val === "object" && val !== null) {
    let str = "";
    const resourceMap = {
      whiteboard: "Quadro",
      projector: "Projetor",
      sound: "Som",
      wifi: "Wi-Fi",
      kitchen: "Cozinha",
      parking: "Estacionamento",
      fan: "Ventilador",
      water: "Bebedouro",
      computer: "Computadores",
    };

    for (const [k, v] of Object.entries(val)) {
      // Pula falso para limpar a view (opcional, se quiser ver o que foi removido, tire esse if)
      // if (v === false || v === 'false') continue;

      let label = resourceMap[k] || k;
      let status = v === true || v === "true" ? '<i class="fas fa-check text-success ms-1"></i>' : '<i class="fas fa-times text-danger ms-1"></i>';

      str += `<div class="d-inline-block me-2 border rounded px-1 mb-1 small bg-light text-dark">${label} ${status}</div>`;
    }
    return str || '<em class="text-muted">Sem recursos</em>';
  }

  return val;
};

// Função Rollback (Mantida)
window.doRollback = (logId) => {
  Swal.fire({
    title: "Restaurar dados antigos?",
    text: "Os dados atuais serão substituídos por esta versão antiga. Uma nova auditoria será gerada.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#f6c23e",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sim, restaurar",
    cancelButtonText: "Cancelar",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await ajaxValidator({
          validator: "rollbackAuditLog",
          token: defaultApp.userInfo.token,
          log_id: logId,
        });

        if (res.status) {
          alertDefault("Dados restaurados com sucesso!", "success");
          $("#modalAudit").modal("hide");
          if (typeof getOrganizacoes === "function") getOrganizacoes();
          if (typeof getLocais === "function") getLocais();
        } else {
          alertDefault(res.alert, "error");
        }
      } catch (e) {
        alertDefault("Erro ao restaurar.", "error");
      }
    }
  });
};
