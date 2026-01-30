// =========================================================
// MÓDULO DE AUDITORIA (LOGIC) - FINAL V15 (FILTRO INTELIGENTE)
// =========================================================

window.openAudit = async (table, id) => {
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");

  modal.modal("show");

  // Loader inicial
  container.html(`
        <div class="text-center py-5 text-muted">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 fw-bold">Rastreando linha do tempo...</p>
            <small>Buscando histórico de alterações e acessos.</small>
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
      container.html(`
                <div class="alert alert-warning text-center m-3">
                    <i class="fas fa-exclamation-triangle me-2"></i> ${result.alert}
                </div>
            `);
    }
  } catch (e) {
    console.error(e);
    container.html('<div class="alert alert-danger m-3">Erro técnico ao carregar auditoria.</div>');
  }
};

const isEffectivelyEmpty = (val) => {
  if (val === null || val === undefined || val === "" || val === false) return true;
  if (typeof val === 'string') {
    const v = val.trim();
    if (v === "null" || v === "false" || v === "") return true;
    if (v === "{}" || v === "[]") return true; // JSON vazio
    // Tenta parsear JSON simples que sobrou como "{}"
    if (v.startsWith('{') && v.endsWith('}')) {
      try {
        const j = JSON.parse(v);
        return Object.keys(j).length === 0;
      } catch (e) { }
    }
  }
  return false;
};

const renderTimeline = (logs, container) => {
  if (!logs || logs.length === 0) {
    container.html(`<div class="text-center py-5 text-muted opacity-50"><span class="material-symbols-outlined" style="font-size: 64px;">history_toggle_off</span><p class="mt-3 fs-5">Nenhum histórico encontrado.</p></div>`);
    return;
  }

  let html = "";
  let visibleLogsCount = 0;

  // Lista negra de campos
  const globalBlacklist = ["updated_at", "created_at", "user_id", "audit_user_id", "deleted", "org_id", "org_id_origin", "link_id", "tie_id", "notes", "start_date", "end_date", "person_id", "role_id", "class_id", "course_id"];

  const isTrue = (v) => v === true || v === "t" || v === "true" || v === 1;
  const isFalse = (v) => v === false || v === "f" || v === "false" || v === 0 || v === null;

  logs.forEach((log) => {
    let oldVal = {};
    let newVal = {};
    try { oldVal = typeof log.old_values === "string" ? JSON.parse(log.old_values) : log.old_values || {}; } catch (e) { }
    try { newVal = typeof log.new_values === "string" ? JSON.parse(log.new_values) : log.new_values || {}; } catch (e) { }

    // --- DETECÇÃO DO TIPO DE EVENTO ---
    const table = log.table_name;
    const op = log.operation; // INSERT, UPDATE, DELETE

    let icon = "edit";
    let colorClass = "UPDATE";
    let diffHtml = "";
    let hasVisibleChanges = false;
    let headerText = "Atualização";

    // Nome do item (cargo, parente, etc)
    let itemName = oldVal.vinculo || newVal.vinculo || oldVal.relative_name || newVal.relative_name || "Item";

    // 1. EVENTO NA PESSOA (TABELA PRINCIPAL)
    if (table === 'persons') {
      if (op === 'INSERT') {
        icon = "person_add"; colorClass = "INSERT";
        diffHtml = '<div class="text-success fw-bold"><i class="fas fa-check-circle me-2"></i> Cadastro realizado no sistema.</div>';
        hasVisibleChanges = true;
        headerText = "Criação";
      } else if (op === 'UPDATE') {
        // Checa reativação
        if (isFalse(newVal.deleted) && isTrue(oldVal.deleted)) {
          icon = "restore_from_trash"; colorClass = "INSERT";
          diffHtml = '<div class="text-success fw-bold">Cadastro restaurado da lixeira.</div>';
          hasVisibleChanges = true;
        } else if (isTrue(newVal.deleted) && !isTrue(oldVal.deleted)) {
          icon = "delete"; colorClass = "DELETE";
          diffHtml = '<div class="text-danger fw-bold">Cadastro movido para a lixeira.</div>';
          hasVisibleChanges = true;
        } else {
          // Update Normal
          headerText = "Dados Pessoais";
        }
      }
    }
    // 2. EVENTO NOS VÍNCULOS (CARGOS)
    else if (table === 'person_roles') {
      headerText = "Cargos e Funções";
      if (op === 'ADD VÍNCULO' || op === 'INSERT') {
        icon = "verified_user"; colorClass = "INSERT";
        diffHtml = `<div class="text-success"><i class="fas fa-plus-circle me-2"></i> Adicionado cargo: <strong>${itemName}</strong></div>`;
        hasVisibleChanges = true;
      } else if (op === 'RMV VÍNCULO' || op === 'DELETE' || (op === 'UPDATE' && isTrue(newVal.deleted))) {
        icon = "remove_moderator"; colorClass = "DELETE";
        diffHtml = `<div class="text-danger"><i class="fas fa-minus-circle me-2"></i> Removido cargo: <strong>${itemName}</strong></div>`;
        hasVisibleChanges = true;
      } else if (isFalse(newVal.deleted) && isTrue(oldVal.deleted)) {
        // Reativação
        icon = "verified_user"; colorClass = "INSERT";
        diffHtml = `<div class="text-success"><i class="fas fa-redo me-2"></i> Reativado cargo: <strong>${itemName}</strong></div>`;
        hasVisibleChanges = true;
      }
    }
    // 3. EVENTO NA FAMÍLIA
    else if (table === 'family_ties') {
      headerText = "Vínculos Familiares";
      if (op === 'INSERT') {
        icon = "group_add"; colorClass = "INSERT";
        diffHtml = `<div class="text-success"><i class="fas fa-user-plus me-2"></i> Adicionado parente: <strong>${itemName}</strong></div>`;
        hasVisibleChanges = true;
      } else if (op === 'DELETE' || (op === 'UPDATE' && isTrue(newVal.deleted))) {
        icon = "group_remove"; colorClass = "DELETE";
        diffHtml = `<div class="text-danger"><i class="fas fa-user-minus me-2"></i> Removido parente: <strong>${itemName}</strong></div>`;
        hasVisibleChanges = true;
      }
    }

    // Se não caiu nos casos especiais acima, gera o DIFF padrão
    if (!hasVisibleChanges && op === 'UPDATE') {
      let rows = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
      allKeys.forEach((key) => {
        if (globalBlacklist.includes(key)) return;

        const vOld = oldVal[key];
        const vNew = newVal[key];

        // --- FILTRO SUPREMO DE VAZIOS ---
        // Se ambos forem considerados vazios (ex: null vs false, "" vs null), ignora.
        if (isEffectivelyEmpty(vOld) && isEffectivelyEmpty(vNew)) return;

        const dOld = formatValue(vOld);
        const dNew = formatValue(vNew);
        if (dOld === dNew) return;

        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
          hasVisibleChanges = true;
          rows += `<tr>
                        <td class="diff-field text-muted">${formatKey(key)}</td>
                        <td class="diff-old">${formatValue(vOld)}</td>
                        <td class="text-center"><i class="fas fa-arrow-right text-muted mx-2" style="font-size:10px;"></i></td>
                        <td class="diff-new">${formatValue(vNew)}</td>
                    </tr>`;
        }
      });
      if (rows) diffHtml = `<table class="audit-diff-table">${rows}</table>`;
    }

    // RENDERIZA
    // Se no final do processamento (especialmente no bloco UPDATE) não sobrou nenhuma mudança visível, não renderiza o card.
    if (!hasVisibleChanges) return;

    visibleLogsCount++;

    // Botão Rollback só para UPDATEs de dados pessoais simples
    let rollbackBtn = "";
    if (table === 'persons' && op === 'UPDATE' && !diffHtml.includes("lixeira")) {
      rollbackBtn = `<div class="mt-2 text-end border-top pt-2"><button class="btn btn-xs btn-outline-warning" onclick="doRollback(${log.log_id}, '${log.date_fmt}')"><i class="fas fa-undo-alt me-1"></i> Restaurar</button></div>`;
    }

    html += `
            <div class="audit-item">
                <div class="audit-marker ${colorClass}">
                    <span class="material-symbols-outlined" style="font-size: 18px;">${icon}</span>
                </div>
                <div class="audit-content">
                    <div class="audit-header">
                        <span class="audit-user">
                            <strong>${log.user_name}</strong>
                            <span class="ms-2 badge bg-light text-secondary border small">${headerText}</span>
                        </span>
                        <span class="audit-date text-muted small">${log.date_fmt}</span>
                    </div>
                    <div class="audit-body">${diffHtml}${rollbackBtn}</div>
                </div>
            </div>`;
  });

  if (visibleLogsCount === 0) container.html(`<div class="text-center py-5 text-muted opacity-50"><p class="mt-2">Registro atualizado tecnicamente, sem alterações visíveis.</p></div>`);
  else container.html(html);
};

const formatKey = (key) => {
  const map = {
    // --- GERAL & ORGANIZAÇÃO ---
    id: "ID",
    display_name: "Nome Fantasia",
    legal_name: "Razão Social",
    phone_main: "Telefone Principal",
    phone_secondary: "Telefone Secundário",
    email_contact: "E-mail de Contato",
    website_url: "Website / Redes",
    address_street: "Logradouro",
    address_number: "Número",
    address_district: "Bairro",
    address_city: "Cidade",
    address_state: "UF",
    zip_code: "CEP",
    org_type: "Tipo de Organização",
    tax_id: "CPF / CNPJ",
    patron_saint: "Padroeiro",
    diocese_name: "Diocese",
    decree_number: "Decreto Canônico",
    foundation_date: "Data de Fundação",

    // --- LOCAIS & SALAS ---
    name: "Nome",
    capacity: "Capacidade (Pessoas)",
    has_ac: "Ar-Condicionado",
    has_ceiling_fan: "Ventilador de Teto",
    is_accessible: "Acessibilidade (PCD)",
    is_consecrated: "Local Consagrado",
    is_sacred: "Espaço Sagrado",
    is_lodging: "Possui Alojamento",
    resources_detail: "Recursos Extras",
    responsible_id: "ID Responsável",

    // --- PESSOAS & FAMÍLIA ---
    full_name: "Nome Completo",
    religious_name: "Nome Religioso/Social",
    birth_date: "Data de Nascimento",
    gender: "Gênero",
    national_id: "RG / Identidade",
    is_pcd: "Pessoa com Deficiência",
    pcd_details: "Detalhes da Deficiência",
    profile_photo_url: "Foto de Perfil",
    sacraments_info: "Dados de Sacramentos",
    civil_status: "Estado Civil",
    phone_mobile: "Celular / WhatsApp",
    phone_landline: "Telefone Fixo",

    // Sub-tabelas Pessoas
    vinculo: "Cargo / Função",
    relationship_type: "Grau de Parentesco",
    is_financial_responsible: "Responsável Financeiro",
    is_legal_guardian: "Responsável Legal",
    relative_id: "ID Parente",
    relative_name: "Nome do Parente",

    // --- ACADÊMICO (CURSOS, DISCIPLINAS, TURMAS) ---
    subject_id: "Disciplina",
    syllabus_summary: "Ementa / Conteúdo",
    course_id: "Curso",
    min_age: "Idade Mínima",
    max_age: "Idade Máxima",
    total_workload_hours: "Carga Horária Total",
    class_id: "Turma",
    year_cycle: "Ano Letivo",
    semester: "Semestre/Módulo",
    start_date: "Data de Início",
    end_date: "Data de Término",
    max_capacity: "Vagas Totais",
    status: "Situação",
    is_mandatory: "Disciplina Obrigatória",
    workload_hours: "Carga Horária",
    curriculum_id: "ID Grade",
    disciplina: "Nome da Disciplina",
    class_name: "Nome da Turma",
    shift: "Turno",
    start_time: "Horário Inicial",
    end_time: "Horário Final",
    location_id: "Sala / Local",

    // --- LITURGIA ---
    mass_date: "Data da Missa",
    celebrant_name: "Celebrante",
    intention: "Intenção",
    liturgical_color: "Cor Litúrgica",

    // --- FINANCEIRO ---
    amount: "Valor",
    due_date: "Data de Vencimento",
    pay_date: "Data de Pagamento",
    payment_method: "Método de Pagamento",
    description: "Descrição",
    category_id: "Categoria",

    // --- CONTROLE & SISTEMA ---
    is_active: "Status (Ativo)",
    deleted: "Excluído",
    active: "Ativo"
  };

  // Retorna a tradução ou formata a chave (ex: "campo_novo" -> "Campo Novo")
  return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (val) => {
  // Filtro inicial usando a nova função
  if (isEffectivelyEmpty(val)) return '<em class="text-muted opacity-75">vazio</em>';

  if (val === true || val === "t" || val === "true") return '<span class="badge bg-success-subtle text-success border border-success">Sim</span>';
  if (val === false || val === "f" || val === "false") return '<span class="badge bg-secondary-subtle text-secondary border">Não</span>';

  // Parentescos
  const relMap = { FATHER: "Pai", MOTHER: "Mãe", SIBLING: "Irmão(ã)", GRANDPARENT: "Avô(ó)", SPOUSE: "Cônjuge", GUARDIAN: "Tutor" };
  if (relMap[val]) return relMap[val];

  // Turnos
  const shiftMap = { MORNING: "Matutino", AFTERNOON: "Vespertino", NIGHT: "Noturno", ALL_DAY: "Integral" };
  if (shiftMap[val]) return shiftMap[val];

  // Datas (YYYY-MM-DD)
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const p = val.split("-");
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  if (typeof val === "object" && val !== null) {
    let str = "";
    const jsonMap = {
      baptism: "Batismo", baptism_date: "Data Batismo", baptism_place: "Local Batismo",
      eucharist: "Eucaristia", confirmation: "Crisma", marriage: "Casamento"
    };

    for (const [k, v] of Object.entries(val)) {
      // Ignora false, null, vazio e "false" string dentro do JSON também
      if (isEffectivelyEmpty(v)) continue;

      let label = jsonMap[k] || k;
      let displayVal = v;

      if (v === true || v === "true") displayVal = '<i class="fas fa-check text-success"></i>';
      else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const p = v.split("-");
        displayVal = `${p[2]}/${p[1]}/${p[0]}`;
      }
      str += `<div class="d-inline-block me-2 border rounded px-2 mb-1 small bg-white text-dark shadow-sm"><strong>${label}:</strong> ${displayVal}</div>`;
    }

    // CORREÇÃO: Se o JSON ficou vazio após o filtro, retorna "vazio"
    return str || '<em class="text-muted opacity-75">vazio</em>';
  }

  return val;
};

window.doRollback = (logId, dateStr = "") => {
  Swal.fire({
    title: "Restaurar versão anterior?",
    html: `
            <div class="text-start">
                <p>Você está prestes a reverter este registro para o estado exato em que ele estava em <b>${dateStr || "nesta data"}</b>.</p>
                <div class="alert alert-warning d-flex align-items-center mb-0">
                    <i class="fas fa-exclamation-triangle me-3 fs-4"></i>
                    <div class="small">
                        <b>Atenção:</b> Quaisquer alterações feitas <u>após</u> esta data neste registro serão substituídas pelos valores antigos.
                    </div>
                </div>
            </div>
        `,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#f6c23e",
    cancelButtonColor: "#6c757d",
    confirmButtonText: '<i class="fas fa-history me-2"></i> Sim, restaurar',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    focusCancel: true
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Restaurando...",
          html: "Aplicando as alterações antigas.",
          allowOutsideClick: false,
          didOpen: () => { Swal.showLoading(); }
        });

        const res = await ajaxValidator({
          validator: "rollbackAuditLog",
          token: defaultApp.userInfo.token,
          log_id: logId
        });

        if (res.status) {
          Swal.fire({
            title: "Restaurado!",
            text: "O registro voltou para a versão selecionada.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false
          }).then(() => {
            $("#modalAudit").modal("hide");

            // === AUTO-REFRESH DAS LISTAGENS ===
            // Verifica quais funções existem no escopo global e executa
            if (typeof window.getPessoas === 'function') window.getPessoas();
            if (typeof window.getTurmas === 'function') window.getTurmas();
            if (typeof window.getCursos === 'function') window.getCursos();
            if (typeof window.getDisciplinas === 'function') window.getDisciplinas();
            if (typeof window.getOrganizacoes === 'function') window.getOrganizacoes();
            if (typeof window.getLocais === 'function') window.getLocais();
            if (typeof window.getFinanceiro === 'function') window.getFinanceiro();
            if (typeof window.getLiturgia === 'function') window.getLiturgia();
          });
        } else {
          Swal.fire("Erro", res.alert, "error");
        }
      } catch (e) {
        Swal.fire("Erro", "Falha técnica ao tentar restaurar.", "error");
      }
    }
  });
};


