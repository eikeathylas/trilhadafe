// =========================================================
// MÓDULO DE AUDITORIA (LOGIC) - FINAL V29
// =========================================================

window.openAudit = async (table, id) => {
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");
  modal.modal("show");

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
  if (typeof val === "string") {
    const v = val.trim();
    if (v === "null" || v === "false" || v === "") return true;
    if (v === "{}" || v === "[]") return true;
    if (v.startsWith("{") && v.endsWith("}")) {
      try {
        const j = JSON.parse(v);
        return Object.keys(j).length === 0;
      } catch (e) {}
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

  const globalBlacklist = [
    "updated_at",
    "created_at",
    "user_id",
    "audit_user_id",
    "deleted",
    "org_id",
    "org_id_origin",
    "link_id",
    "tie_id",
    "plan_id",
    "notes",
    "start_date",
    "end_date",
    "person_id",
    "role_id",
    "class_id",
    "course_id",
    "curriculum_id",
    "student_id",
    "session_id",
    "attendance_id",
    "signed_by_user_id",
    "subject_id",
    "attachment_id",
    "uploaded_by",
    "file_path",
  ];

  const isTrue = (v) => v === true || v === "t" || v === "true" || v === 1;
  const isFalse = (v) => v === false || v === "f" || v === "false" || v === 0 || v === null;

  const normalizeResources = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (typeof val === "object") {
      return Object.keys(val).filter((k) => {
        const v = val[k];
        return v === true || v === "true" || v === 1 || v === "1";
      });
    }
    return [];
  };

  logs.forEach((log) => {
    let oldVal = {},
      newVal = {};
    try {
      oldVal = (typeof log.old_values === "string" ? JSON.parse(log.old_values) : log.old_values) || {};
    } catch (e) {}
    try {
      newVal = (typeof log.new_values === "string" ? JSON.parse(log.new_values) : log.new_values) || {};
    } catch (e) {}

    const op = (log.operation || "").toUpperCase().trim();
    const isInsert = op === "INSERT" || op === "ADD VÍNCULO";
    const isHardDelete = op === "DELETE" || op === "RMV VÍNCULO";
    const isSoftDelete = op === "UPDATE" && isTrue(newVal.deleted) && !isTrue(oldVal.deleted);
    const isReactivation = op === "UPDATE" && isFalse(newVal.deleted) && isTrue(oldVal.deleted);

    let icon = "edit";
    let colorClass = "UPDATE";
    let diffHtml = "";
    let hasVisibleChanges = false;

    let headerText = log.target_name || "Atualização";

    if (log.table_name === "person_roles") headerText = "Cargos e Funções";
    else if (log.table_name === "family_ties") headerText = "Vínculos Familiares";
    else if (log.table_name === "locations") headerText = "Espaço / Sala";
    else if (log.table_name === "curriculum") headerText = "Grade Curricular";
    else if (log.table_name === "curriculum_plans") headerText = "Planejamento de Ensino";
    else if (log.table_name === "class_sessions") headerText = "Dados da Aula";
    else if (log.table_name === "attendance") headerText = "Frequência";
    else if (log.table_name === "person_attachments") headerText = "Arquivos";

    let itemName =
      oldVal.title ||
      newVal.title ||
      oldVal.description ||
      newVal.description ||
      oldVal.file_name ||
      newVal.file_name ||
      oldVal.aluno ||
      newVal.aluno ||
      oldVal.vinculo ||
      newVal.vinculo ||
      oldVal.relative_name ||
      newVal.relative_name ||
      oldVal.name ||
      newVal.name ||
      oldVal.disciplina ||
      newVal.disciplina ||
      oldVal.display_name ||
      newVal.display_name ||
      "Item";

    if (log.table_name === "class_sessions" && itemName === "Item") {
      const dt = newVal.session_date || oldVal.session_date;
      if (dt) itemName = "Aula dia " + dt.split("-").reverse().join("/");
    }

    if (isInsert) {
      icon = "add";
      colorClass = "INSERT";
      if (log.table_name === "attendance") {
        // [AJUSTE] Detalhe visual para inserção de frequência
        const statusBadge = isTrue(newVal.is_present) ? '<span class="badge bg-success ms-1">Presente</span>' : '<span class="badge bg-danger ms-1">Ausente</span>';
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-check-circle me-2"></i> Registro criado: ${statusBadge}</div>`;
      } else if (log.table_name === "person_attachments") {
        icon = "attach_file";
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-paperclip me-2"></i> Adicionado: ${itemName}</div>`;
      } else if (log.table_name === "curriculum_plans") {
        icon = "event_note";
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-2"></i> Plano Adicionado: ${itemName}</div>`;
      } else if (["persons", "organizations", "courses", "classes", "subjects", "events"].includes(log.table_name)) {
        diffHtml = '<div class="text-success small fw-bold"><i class="fas fa-star me-2"></i> Registro mestre criado no sistema.</div>';
        headerText = "Criação";
      } else diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-2"></i> Adicionado: ${itemName}</div>`;
      hasVisibleChanges = true;
    } else if (isHardDelete) {
      icon = "delete";
      colorClass = "DELETE";
      diffHtml = `<div class="text-danger small fw-bold"><i class="fas fa-trash me-2"></i> Removido permanentemente: ${itemName}</div>`;
      hasVisibleChanges = true;
    } else if (isSoftDelete) {
      icon = "delete";
      colorClass = "DELETE";
      let label = itemName !== "Item" ? `<strong>${itemName}</strong> removido(a).` : "Enviado para a lixeira.";
      diffHtml = `<div class="text-danger small"><i class="fas fa-trash me-2"></i> ${label}</div>`;
      hasVisibleChanges = true;
    } else if (isReactivation) {
      icon = "recycling";
      colorClass = "INSERT";
      diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-recycle me-2"></i> <strong>${itemName}</strong> restaurado(a).</div>`;
      hasVisibleChanges = true;
    } else {
      // UPDATE
      let rows = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach((key) => {
        if (globalBlacklist.includes(key)) return;

        const vOld = oldVal[key];
        const vNew = newVal[key];

        if (key === "resources" || key === "resources_detail") {
          const listOld = normalizeResources(vOld);
          const listNew = normalizeResources(vNew);
          listOld.sort();
          listNew.sort();

          if (JSON.stringify(listOld) === JSON.stringify(listNew)) return;

          const added = listNew.filter((x) => !listOld.includes(x));
          const removed = listOld.filter((x) => !listNew.includes(x));

          if (added.length === 0 && removed.length === 0) return;

          hasVisibleChanges = true;
          let listHtml = "";

          const resMap = {
            wifi: "Wi-Fi",
            projector: "Projetor/TV",
            sound: "Som",
            whiteboard: "Lousa/Quadro",
            computer: "Computador",
            kitchen: "Cozinha",
            parking: "Estacionamento",
            fan: "Ventilador",
            ac: "Ar Condicionado",
            water: "Bebedouro",
          };

          if (removed.length > 0) listHtml += removed.map((x) => `<div class="text-danger small fw-bold"><i class="fas fa-minus-circle me-1"></i> Removido: ${resMap[x] || x}</div>`).join("");
          if (added.length > 0) listHtml += added.map((x) => `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-1"></i> Adicionado: ${resMap[x] || x}</div>`).join("");

          rows += `<tr><td class="diff-field text-muted align-top pt-2">Recursos Extras</td><td colspan="3" class="diff-new pt-2">${listHtml}</td></tr>`;
          return;
        }

        const displayOld = formatValue(vOld, key);
        const displayNew = formatValue(vNew, key);

        if (displayOld === displayNew) return;

        hasVisibleChanges = true;
        rows += `
            <tr>
                <td class="diff-field text-muted">${formatKey(key)}</td>
                <td class="diff-old">${displayOld}</td>
                <td class="text-center"><i class="fas fa-arrow-right text-muted mx-2" style="font-size:10px;"></i></td>
                <td class="diff-new">${displayNew}</td>
            </tr>`;
      });

      if (rows) diffHtml = `<table class="audit-diff-table">${rows}</table>`;
    }

    if (!hasVisibleChanges) return;

    visibleLogsCount++;
    let rollbackBtn = "";
    if (op === "UPDATE" && !isSoftDelete && !isReactivation) {
      rollbackBtn = `<div class="mt-2 text-end border-top pt-2"><button class="btn btn-xs btn-outline-warning" onclick="doRollback(${log.log_id}, '${log.date_fmt}')"><i class="fas fa-undo-alt me-1"></i> Restaurar esta versão</button></div>`;
    }

    html += `
            <div class="audit-item">
                <div class="audit-marker ${colorClass}">
                    <span class="material-symbols-outlined" style="font-size: 18px;">${icon}</span>
                </div>
                <div class="audit-content">
                    <div class="audit-header">
                        <span class="audit-user">
                            <strong>${log.user_name || "Sistema"}</strong>
                            <span class="ms-2 badge bg-light text-secondary border small">${headerText}</span>
                        </span>
                        <span class="audit-date text-muted small">${log.date_fmt}</span>
                    </div>
                    <div class="audit-body">
                        ${diffHtml}
                        ${rollbackBtn}
                    </div>
                </div>
            </div>`;
  });

  if (visibleLogsCount === 0) {
    container.html(`<div class="text-center py-5 text-muted opacity-50"><span class="material-symbols-outlined" style="font-size: 48px;">history_edu</span><p class="mt-2">Registro atualizado tecnicamente, sem alterações de dados visíveis.</p></div>`);
  } else {
    container.html(html);
  }
};

const formatKey = (key) => {
  const map = {
    meeting_number: "Nº do Encontro",
    title: "Tema / Título",
    content: "Conteúdo",
    file_name: "Nome do Arquivo",
    description: "Descrição",
    file_path: "Caminho",
    session_date: "Data da Aula",
    content_type: "Tipo de Conteúdo",
    signed_at: "Assinado em",
    is_present: "Presença",
    justification: "Justificativa",
    absence_type: "Motivo da Falta",
    student_observation: "Observação", // [NOVO]
    aluno: "Aluno",
    coordinator_id: "Coordenador",
    class_assistant_id: "Auxiliar de Turma",
    class_name: "Nome da Turma",
    shift: "Turno",
    start_time: "Horário de Início",
    end_time: "Horário de Término",
    location_id: "Local / Sala",
    academic_year_id: "Ano Letivo",
    min_age: "Idade Mínima",
    max_age: "Idade Máxima",
    total_workload_hours: "Carga Horária Total",
    subject_id: "Disciplina",
    workload_hours: "Horas/Aula",
    is_mandatory: "Obrigatória",
    disciplina: "Matéria",
    name: "Nome",
    is_active: "Status (Ativo)",
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
    instituicao: "Instituição Vinculada",
    capacity: "Capacidade (Pessoas)",
    has_ac: "Ar-Condicionado",
    has_ceiling_fan: "Ventilador de Teto",
    is_accessible: "Acessibilidade (PCD)",
    is_consecrated: "Local Consagrado",
    is_sacred: "Espaço Sagrado",
    is_lodging: "Possui Alojamento",
    resources_detail: "Recursos Extras",
    responsible_id: "ID Responsável",
    full_name: "Nome Completo",
    religious_name: "Nome Religioso/Social",
    birth_date: "Data de Nascimento",
    gender: "Gênero",
    national_id: "RG / Identidade",
    is_pcd: "Pessoa com Deficiência",
    pcd_details: "Detalhes da Deficiência",
    profile_photo_url: "Foto de Perfil",
    sacraments_info: "Dados de Sacramentos",
    eucharist_date: "Data Eucaristia",
    eucharist_place: "Local Eucaristia",
    phone_mobile: "Celular / WhatsApp",
    phone_landline: "Telefone Fixo",
    vinculo: "Cargo / Função",
    relationship_type: "Grau de Parentesco",
    is_financial_responsible: "Responsável Financeiro",
    is_legal_guardian: "Responsável Legal",
    relative_id: "ID Parente",
    relative_name: "Nome do Parente",
    syllabus_summary: "Ementa / Conteúdo",
    course_id: "Curso",
    class_id: "Turma",
    year_cycle: "Ano Letivo",
    semester: "Semestre/Módulo",
    start_date: "Data de Início",
    end_date: "Data de Término",
    max_capacity: "Vagas Totais",
    status: "Situação",
    is_mandatory: "Disciplina Obrigatória",
    workload_hours: "Carga Horária (Matéria)",
    curriculum_id: "ID Grade",
    disciplina: "Nome da Disciplina",
    class_name: "Nome da Turma",
    shift: "Turno",
    start_time: "Horário Inicial",
    end_time: "Horário Final",
    location_id: "Sala / Local",
    is_academic_blocker: "Bloqueio Acadêmico",
    is_active: "Status (Ativo)",
    deleted: "Excluído",
    active: "Ativo",
  };

  return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (val, key = "") => {
  const boolKeys = ["is_active", "active", "deleted", "is_pcd", "has_ac", "is_accessible", "is_consecrated", "is_mandatory"];

  // [AJUSTE] Lógica específica para Frequência (Is_Present)
  if (key === "is_present") {
    if (val === true || val === "t" || val === "true") return '<span class="badge bg-success">Presente</span>';
    if (val === false || val === "f" || val === "false") return '<span class="badge bg-danger">Ausente</span>';
  }

  // [AJUSTE] Tradução do Motivo da Falta
  if (key === "absence_type") {
    const absMap = {
      UNJUSTIFIED: "Não Justificada",
      JUSTIFIED: "Justificada",
      RECURRENT: "Recorrente",
    };
    if (absMap[val]) return absMap[val];
  }

  if (!boolKeys.includes(key)) {
    if (isEffectivelyEmpty(val)) return '<em class="text-muted opacity-75">vazio</em>';
  }

  if (val === true || val === "t" || val === "true") return '<span class="badge bg-success-subtle text-success border border-success">Sim</span>';
  if (val === false || val === "f" || val === "false") return '<span class="badge bg-secondary-subtle text-secondary border">Não</span>';

  if (key === "content" && typeof val === "string" && val.includes("Oculto")) {
    return '<span class="badge bg-light text-secondary border">Conteúdo HTML (Texto Longo)</span>';
  }

  const statusMap = {
    ACTIVE: "Ativa",
    PLANNED: "Planejada",
    FINISHED: "Encerrada",
    CANCELLED: "Cancelada",
    PENDING: "Pendente",
  };
  if (statusMap[val]) return statusMap[val];

  const relMap = { FATHER: "Pai", MOTHER: "Mãe", SIBLING: "Irmão(ã)", GRANDPARENT: "Avô(ó)", SPOUSE: "Cônjuge", GUARDIAN: "Tutor" };
  if (relMap[val]) return relMap[val];

  const shiftMap = { MORNING: "Matutino", AFTERNOON: "Vespertino", NIGHT: "Noturno", ALL_DAY: "Integral" };
  if (shiftMap[val]) return shiftMap[val];

  const contentTypeMap = { DOCTRINAL: "Doutrinal", BIBLICAL: "Bíblico", LITURGICAL: "Litúrgico", EXPERIENTIAL: "Vivencial", REVIEW: "Avaliação" };
  if (contentTypeMap[val]) return contentTypeMap[val];

  // Data
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const p = val.split("-");
    return `${p[2]}/${p[1]}/${p[0]}`;
  }

  // Objeto JSON
  if (typeof val === "object" && val !== null) {
    let str = "";
    const jsonMap = {
      baptism: "Batismo",
      baptism_date: "Data Batismo",
      baptism_place: "Local Batismo",
      eucharist: "Eucaristia",
      confirmation: "Crisma",
      marriage: "Casamento",
      wifi: "Wi-Fi",
      projector: "Projetor/TV",
      sound: "Som",
      whiteboard: "Lousa/Quadro",
      computer: "Computador",
      kitchen: "Cozinha/Copa",
      parking: "Estacionamento",
      fan: "Ventilador",
      water: "Bebedouro",
      ac: "Ar Condicionado",
      palco: "Palco",
      has_ac: "Ar Cond.",
      has_wifi: "Wi-Fi",
      has_projector: "Projetor",
      has_sound: "Som",
      has_whiteboard: "Lousa",
      has_computer: "PC",
      has_kitchen: "Cozinha",
      has_parking: "Estacionamento",
      has_fan: "Ventilador",
      has_water: "Água",
    };

    let hasContent = false;
    for (const [k, v] of Object.entries(val)) {
      if (isEffectivelyEmpty(v)) continue;
      hasContent = true;
      let label = jsonMap[k] || k.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      let displayVal = v;
      if (v === true || v === "true") displayVal = '<i class="fas fa-check text-success"></i>';
      else if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const p = v.split("-");
        displayVal = `${p[2]}/${p[1]}/${p[0]}`;
      }
      str += `<div class="d-inline-block me-2 border rounded px-2 mb-1 small bg-white text-dark shadow-sm"><strong>${label}:</strong> ${displayVal}</div>`;
    }
    return hasContent ? str : '<em class="text-muted opacity-75">vazio</em>';
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
                    <div class="small"><b>Atenção:</b> Quaisquer alterações feitas <u>após</u> esta data serão substituídas.</div>
                </div>
            </div>
        `,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#f6c23e",
    cancelButtonColor: "#6c757d",
    confirmButtonText: '<i class="fas fa-history me-2"></i> Sim, restaurar',
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Restaurando...", didOpen: () => Swal.showLoading() });
        const res = await ajaxValidator({ validator: "rollbackChange", token: defaultApp.userInfo.token, log_id: logId });
        if (res.status) {
          Swal.fire({ title: "Restaurado!", icon: "success", timer: 2000, showConfirmButton: false }).then(() => {
            $("#modalAudit").modal("hide");
            if (typeof window.getPessoas === "function") window.getPessoas();
            if (typeof window.getTurmas === "function") window.getTurmas();
            if (typeof window.getCursos === "function") window.getCursos();
            if (typeof window.getDisciplinas === "function") window.getDisciplinas();
            if (typeof window.getOrganizacoes === "function") window.getOrganizacoes();
            if (typeof window.getLocais === "function") window.getLocais();
            if (typeof window.getFinanceiro === "function") window.getFinanceiro();
            if (typeof window.getLiturgia === "function") window.getLiturgia();
            if (window.location.href.includes("turmas")) window.getTurmas();
          });
        } else {
          Swal.fire("Erro", res.alert, "error");
        }
      } catch (e) {
        Swal.fire("Erro", "Falha técnica.", "error");
      }
    }
  });
};
