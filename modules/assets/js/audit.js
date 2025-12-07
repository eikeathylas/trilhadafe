// =========================================================
// MÓDULO DE AUDITORIA (LOGIC)
// =========================================================

// Abre o modal e carrega os dados
window.openAudit = async (table, id) => {
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");

  modal.modal("show");

  // Loader interno
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
      container.html(`<div class="alert alert-warning"><i class="fas fa-exclamation-triangle mr-2"></i> ${result.alert}</div>`);
    }
  } catch (e) {
    console.error(e);
    container.html('<div class="alert alert-danger">Erro ao carregar auditoria.</div>');
  }
};

// Renderiza a linha do tempo
const renderTimeline = (logs, container) => {
  if (!logs || logs.length === 0) {
    container.html(`
            <div class="text-center py-5 text-muted opacity-50">
                <span class="material-symbols-outlined" style="font-size: 48px;">history_toggle_off</span>
                <p class="mt-2">Nenhum registro de alteração encontrado para este item.</p>
            </div>
        `);
    return;
  }

  let html = "";

  logs.forEach((log) => {
    const isInsert = log.operation === "INSERT";
    const isDelete = log.operation === "DELETE";

    // Define ícone e cor baseada na operação
    let icon = "edit"; // Update
    let colorClass = "UPDATE"; // CSS class

    if (isInsert) {
      icon = "add";
      colorClass = "INSERT";
    }
    if (isDelete) {
      icon = "delete";
      colorClass = "DELETE";
    }

    // Parse seguro dos JSONs do banco
    let oldVal = {};
    let newVal = {};
    try {
      oldVal = JSON.parse(log.old_values || "{}");
    } catch (e) {}
    try {
      newVal = JSON.parse(log.new_values || "{}");
    } catch (e) {}

    // Gera o HTML das diferenças (Diff)
    let diffHtml = "";

    if (isInsert) {
      diffHtml = '<div class="text-success small"><i class="fas fa-star mr-1"></i> Registro criado originalmente.</div>';
    } else if (isDelete) {
      diffHtml = '<div class="text-danger small"><i class="fas fa-trash mr-1"></i> Registro movido para a lixeira.</div>';
    } else {
      // Para UPDATE, comparamos campo a campo
      let rows = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach((key) => {
        // Ignora campos técnicos que não interessam ao usuário
        if (["updated_at", "created_at", "user_id", "audit_user_id"].includes(key)) return;

        const vOld = oldVal[key];
        const vNew = newVal[key];

        // Só mostra se mudou (e não é nulo x nulo)
        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
          rows += `
                        <tr>
                            <td class="diff-field text-muted">${formatKey(key)}</td>
                            <td class="diff-old">${formatValue(vOld)}</td>
                            <td class="text-center"><i class="fas fa-arrow-right text-muted" style="font-size: 10px;"></i></td>
                            <td class="diff-new">${formatValue(vNew)}</td>
                        </tr>
                    `;
        }
      });

      if (rows) {
        diffHtml = `<table class="audit-diff-table">${rows}</table>`;
      } else {
        diffHtml = '<div class="text-muted small fst-italic">Atualização de sistema (sem mudanças visíveis).</div>';
      }
    }

    // Botão de Rollback (Restauração)
    // Só permite restaurar UPDATES por enquanto
    let rollbackBtn = "";
    if (log.operation === "UPDATE") {
      rollbackBtn = `
                <div class="mt-2 text-end">
                    <button class="btn btn-xs btn-outline-warning" onclick="doRollback(${log.log_id})">
                        <i class="fas fa-undo-alt mr-1"></i> Restaurar para este ponto
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
                            <img src="../login/assets/img/user.jpg" class="rounded-circle mr-2" style="width: 20px; height: 20px;">
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

// Formata o nome da coluna para ficar bonito (ex: address_street -> Address Street)
const formatKey = (key) => {
  // Mapeamento manual para nomes amigáveis em PT-BR
  const map = {
    display_name: "Nome Fantasia",
    legal_name: "Razão Social",
    phone_main: "Telefone",
    name: "Nome",
    capacity: "Capacidade",
    has_ac: "Ar-Condicionado",
    is_active: "Ativo",
    deleted: "Excluído",
  };
  if (map[key]) return map[key];

  return key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (val) => {
  if (val === null || val === undefined || val === "") return '<em class="text-muted">vazio</em>';
  if (val === true || val === "t" || val === "true") return "Sim";
  if (val === false || val === "f" || val === "false") return "Não";
  return val;
};

// Função de Restaurar Versão
window.doRollback = (logId) => {
  Swal.fire({
    title: "Restaurar dados antigos?",
    text: "Os dados atuais serão substituídos pelos valores desta versão antiga. Uma nova auditoria será gerada.",
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
          // Recarrega a lista da tela atual para refletir a mudança
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
