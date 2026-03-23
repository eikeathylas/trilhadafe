window.openAudit = async (table, id, btn) => {
  btn = $(btn);
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");
  modal.modal("show");

  container.html(`
      <div class="text-center py-5 opacity-50">
          <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
          <p class="mt-3 fw-medium text-body">Rastreando linha do tempo...</p>
          <small class="text-secondary">Buscando histórico de alterações e acessos.</small>
      </div>
  `);

  window.setButton(true, btn, "");

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
          <div class="text-center py-5 text-warning opacity-75">
              <i class="fas fa-exclamation-triangle fa-3x mb-3"></i>
              <p class="fw-bold">${result.alert}</p>
          </div>
      `);
    }
  } catch (e) {
    console.error(e);
    container.html(`
        <div class="text-center py-5 text-danger opacity-75">
            <i class="fas fa-bomb fa-3x mb-3"></i>
            <p class="fw-bold">Erro técnico ao carregar auditoria.</p>
        </div>
    `);
  } finally {
    window.setButton(false, btn);
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
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined" style="font-size: 64px;">history_toggle_off</span>
            <p class="mt-3 fw-medium text-body">Nenhum histórico encontrado para este registo.</p>
        </div>
    `);
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

  logs.forEach((log, index) => {
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
    let colorClass = "primary"; // Padrão Apple HIG
    let diffHtml = "";
    let hasVisibleChanges = false;

    let headerText = log.target_name || "Atualização";

    if (!log.target_name) {
      if (log.table_name === "person_roles") headerText = "Cargos e Funções";
      else if (log.table_name === "family_ties") headerText = "Vínculos Familiares";
      else if (log.table_name === "locations") headerText = "Espaço / Sala";
      else if (log.table_name === "curriculum") headerText = "Grade Curricular";
      else if (log.table_name === "curriculum_plans") headerText = "Planejamento de Ensino";
      else if (log.table_name === "class_sessions") headerText = "Dados da Aula";
      else if (log.table_name === "attendance") headerText = "Frequência";
      else if (log.table_name === "person_attachments") headerText = "Arquivos";
    }

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
      "Registo";

    if (log.table_name === "class_sessions" && itemName === "Registo") {
      const dt = newVal.session_date || oldVal.session_date;
      if (dt) itemName = "Aula dia " + dt.split("-").reverse().join("/");
    }

    if (isInsert) {
      icon = "add";
      colorClass = "success";
      if (log.table_name === "attendance") {
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-check-circle me-2"></i> Presença Registada: ${newVal["Presença"] || ""}</div>`;
      } else if (log.table_name === "person_attachments") {
        icon = "attach_file";
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-paperclip me-2"></i> Adicionado: ${itemName}</div>`;
      } else if (log.table_name === "curriculum_plans") {
        icon = "event_note";
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-2"></i> Plano Adicionado: ${itemName}</div>`;
      } else if (["persons", "organizations", "courses", "classes", "subjects", "events"].includes(log.table_name)) {
        diffHtml = '<div class="text-success small fw-bold"><i class="fas fa-star me-2"></i> Registo mestre criado no sistema.</div>';
        headerText = "Criação";
      } else {
        diffHtml = `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-2"></i> Adicionado: ${itemName}</div>`;
      }
      hasVisibleChanges = true;
    } else if (isHardDelete) {
      icon = "delete";
      colorClass = "danger";
      diffHtml = `<div class="text-danger small fw-bold"><i class="fas fa-trash me-2"></i> Removido permanentemente: ${itemName}</div>`;
      hasVisibleChanges = true;
    } else if (isSoftDelete) {
      icon = "delete";
      colorClass = "danger";
      let label = itemName !== "Registo" ? `<strong>${itemName}</strong> movido para a lixeira.` : "Enviado para a lixeira.";
      diffHtml = `<div class="text-danger small"><i class="fas fa-trash me-2"></i> ${label}</div>`;
      hasVisibleChanges = true;
    } else if (isReactivation) {
      icon = "recycling";
      colorClass = "info";
      diffHtml = `<div class="text-info small fw-bold"><i class="fas fa-recycle me-2"></i> <strong>${itemName}</strong> restaurado(a).</div>`;
      hasVisibleChanges = true;
    } else {
      // UPDATE PROCESS
      let diffLines = "";
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
          const resMap = { wifi: "Wi-Fi", projector: "Projetor/TV", sound: "Som", whiteboard: "Lousa/Quadro", computer: "Computador", kitchen: "Cozinha", parking: "Estacionamento", fan: "Ventilador", ac: "Ar Condicionado", water: "Bebedouro" };

          if (removed.length > 0) listHtml += removed.map((x) => `<div class="text-danger small fw-bold"><i class="fas fa-minus-circle me-1"></i> Removido: ${resMap[x] || x}</div>`).join("");
          if (added.length > 0) listHtml += added.map((x) => `<div class="text-success small fw-bold"><i class="fas fa-plus-circle me-1"></i> Adicionado: ${resMap[x] || x}</div>`).join("");

          diffLines += `<li class="mb-2 pb-2 border-bottom border-secondary border-opacity-10"><strong class="text-body fw-bold d-block mb-1">Recursos Extras</strong> ${listHtml}</li>`;
          return;
        }

        const displayOld = formatValue(vOld, key);
        const displayNew = formatValue(vNew, key);

        if (displayOld === displayNew) return;

        hasVisibleChanges = true;
        diffLines += `<li class="mb-2 pb-2 border-bottom border-secondary border-opacity-10">
                        <strong class="text-body fw-bold d-block mb-1">${formatKey(key)}</strong> 
                        <del class="text-danger opacity-75">${displayOld}</del> 
                        <i class="fas fa-arrow-right mx-2 text-secondary opacity-50" style="font-size:0.7em;"></i> 
                        <span class="text-success">${displayNew}</span>
                      </li>`;
      });

      if (diffLines) diffHtml = `<ul class="list-unstyled mb-0 small text-body">${diffLines}</ul>`;
    }

    if (!hasVisibleChanges) return;

    visibleLogsCount++;

    // Botão de Rollback Padrão Apple HIG
    let rollbackBtn = "";
    if (op === "UPDATE" && !isSoftDelete && !isReactivation) {
      rollbackBtn = `
        <div class="mt-3 text-end pt-3 border-top border-secondary border-opacity-10">
            <button class="btn btn-sm btn-outline-warning rounded-pill px-3 shadow-sm" onclick="doRollback(${log.log_id}, '${log.date_fmt}')">
                <i class="fas fa-undo-alt me-1"></i> Restaurar versão
            </button>
        </div>`;
    }

    const lineHtml = index !== logs.length - 1 ? `<div class="position-absolute h-100 border-start border-2 border-secondary border-opacity-25" style="left: 19px; top: 40px; z-index: 1;"></div>` : ``;

    html += `
        <div class="d-flex mb-4 position-relative">
            ${lineHtml}
            <div class="flex-shrink-0 position-relative" style="z-index: 2;">
                <div class="rounded-circle bg-${colorClass} bg-opacity-10 text-${colorClass} d-flex align-items-center justify-content-center border border-${colorClass} border-opacity-25 shadow-sm" style="width: 40px; height: 40px;">
                    <span class="material-symbols-outlined" style="font-size: 20px;">${icon}</span>
                </div>
            </div>
            
            <div class="flex-grow-1 ms-3 pt-1 w-100">
                <div class="d-flex justify-content-between align-items-start mb-1 gap-2 flex-wrap flex-md-nowrap">
                    <h6 class="fw-bold mb-0 text-body d-flex flex-column flex-md-row align-items-md-center">
                        ${log.user_name || "Sistema"}
                        <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-bold text-nowrap ms-md-2 mt-2 mt-md-0" style="font-size: 0.65rem; letter-spacing: 0.5px;">${headerText}</span>
                        <a data-bs-toggle="collapse" href="#collapseAudit${index}" class="btn btn-sm btn-light bg-body border-secondary border-opacity-25 rounded-circle mt-2 mt-md-0 ms-md-3 text-primary p-0 d-flex align-items-center justify-content-center shadow-sm" style="width: 28px; height: 28px;" title="Ver detalhes">
                            <i class="fas fa-chevron-down toggle-chevron" style="font-size: 0.8rem; transition: transform 0.3s ease;"></i>
                        </a>
                    </h6>
                    <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal text-nowrap" style="font-size: 0.75rem;"><i class="fas fa-clock me-1 opacity-50"></i> ${log.date_fmt}</span>
                </div>
                
                <div class="collapse mt-3" id="collapseAudit${index}">
                    <div class="card card-body bg-body border border-secondary border-opacity-25 p-3 rounded-4 shadow-sm">
                        ${diffHtml}
                        ${rollbackBtn}
                    </div>
                </div>
            </div>
        </div>`;
  });

  if (visibleLogsCount === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined" style="font-size: 48px;">history_edu</span>
            <p class="mt-2 fw-medium text-body">Registo atualizado tecnicamente, sem alterações de dados visíveis.</p>
        </div>`);
  } else {
    container.html(`<div class="pt-2">${html}</div>`);

    // Engine de animação do Accordion (Chevron)
    container
      .find(".collapse")
      .on("show.bs.collapse", function () {
        $(this).parent().find(".toggle-chevron").css("transform", "rotate(180deg)");
      })
      .on("hide.bs.collapse", function () {
        $(this).parent().find(".toggle-chevron").css("transform", "rotate(0deg)");
      });
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
    is_present: "Frequência",
    presença: "Frequência",
    presenca: "Frequência",
    Presença: "Frequência",
    justification: "Justificativa",
    absence_type: "Motivo da Falta",
    student_observation: "Observação",
    aluno: "Aluno",
    coordinator_id: "Coordenador",
    class_assistant_id: "Auxiliar de Turma",
    class_name: "Nome da Turma",
    shift: "Turno",
    start_time: "Horário de Início",
    end_time: "Horário de Término",
    location_id: "Local / Sala",
    year_id: "Ano Letivo",
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
    curriculum_id: "ID Grade",
    force_password_change: "Forçar Troca de Senha",
    is_academic_blocker: "Bloqueio Acadêmico",
    deleted: "Excluído",
    active: "Ativo",
  };
  return map[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (val, key = "") => {
  const boolKeys = ["is_active", "active", "deleted", "is_pcd", "has_ac", "is_accessible", "is_consecrated", "is_mandatory", "is_academic_blocker"];

  if (key === "is_present" || key === "presença" || key === "presenca" || key === "Presença") {
    if (val === true || val === "t" || val === "true" || val === "Presente" || val === 1) return '<span class="badge bg-success-subtle text-success border border-success border-opacity-25">Presente</span>';
    if (val === false || val === "f" || val === "false" || val === "Ausente" || val === 0) return '<span class="badge bg-danger-subtle text-danger border border-danger border-opacity-25">Ausente</span>';
  }

  if (key === "absence_type") {
    const absMap = { UNJUSTIFIED: "Não Justificada", JUSTIFIED: "Justificada", RECURRENT: "Recorrente" };
    if (absMap[val]) return absMap[val];
  }

  if (!boolKeys.includes(key)) {
    if (isEffectivelyEmpty(val)) return '<em class="text-muted opacity-50">Não informado</em>';
  }

  if (val === true || val === "t" || val === "true" || val === 1) return '<span class="badge bg-success-subtle text-success border border-success border-opacity-25 px-2">Sim</span>';
  if (val === false || val === "f" || val === "false" || val === 0) return '<span class="badge bg-secondary-subtle text-secondary border border-secondary border-opacity-25 px-2">Não</span>';

  if (key === "content" && typeof val === "string" && val.includes("Oculto")) {
    return '<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2">Conteúdo HTML Oculto</span>';
  }

  const statusMap = { ACTIVE: "Ativa", PLANNED: "Planejada", FINISHED: "Encerrada", CANCELLED: "Cancelada", PENDING: "Pendente" };
  if (statusMap[val]) return statusMap[val];

  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    if (val.includes("T") || val.includes(" ")) {
      let parts = val.split(/[T ]/);
      let datePart = parts[0].split("-").reverse().join("/");
      let timePart = parts[1] ? parts[1].substring(0, 5) : "";
      return `${datePart} ${timePart}`.trim();
    } else {
      const p = val.split("-");
      return `${p[2]}/${p[1]}/${p[0]}`;
    }
  }

  if (typeof val === "object" && val !== null) {
    let str = "";
    const jsonMap = { baptism: "Batismo", baptism_date: "Data Batismo", baptism_place: "Local Batismo", eucharist: "Eucaristia", confirmation: "Crisma", marriage: "Casamento", has_wifi: "Wi-Fi" };
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
      str += `<div class="d-inline-block me-2 border rounded-pill px-3 py-1 mb-2 small text-body bg-body shadow-sm"><strong>${label}:</strong> ${displayVal}</div>`;
    }
    return hasContent ? str : '<em class="text-muted opacity-50">Não preenchido</em>';
  }

  return val;
};

window.doRollback = (logId, dateStr = "") => {
  Swal.fire({
    title: "Restaurar versão anterior?",
    html: `
        <div class="text-start">
            <p class="text-body mb-3">Irá reverter este registo para o estado exato de <b>${dateStr || "nesta data"}</b>.</p>
            <div class="alert bg-warning bg-opacity-10 border border-warning border-opacity-25 d-flex align-items-start mb-0 rounded-4 p-3">
                <i class="fas fa-exclamation-triangle text-warning me-3 fs-3 mt-1"></i>
                <div class="small text-body"><b>Aviso Crítico:</b> Quaisquer alterações guardadas <u>após</u> esta data serão permanentemente substituídas.</div>
            </div>
        </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#f59e0b", // Padrão warning Apple
    cancelButtonColor: "#64748b", // Padrão slate Apple
    confirmButtonText: '<i class="fas fa-history me-2"></i> Confirmar Restauro',
    cancelButtonText: "Cancelar",
    reverseButtons: true,
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Restaurando...", didOpen: () => Swal.showLoading() });
        const res = await ajaxValidator({ validator: "rollbackAuditLog", token: defaultApp.userInfo.token, log_id: logId });
        if (res.status) {
          Swal.fire({ title: "Registo Restaurado!", icon: "success", timer: 2000, showConfirmButton: false }).then(() => {
            $("#modalAudit").modal("hide");
            // Dispara um recarregamento na tela mãe baseada na URL
            const url = window.location.href;
            if (typeof window.getPessoas === "function") window.getPessoas();
            if (url.includes("turmas") && typeof window.getTurmas === "function") window.getTurmas();
            if (url.includes("cursos") && typeof window.getCursos === "function") window.getCursos();
            if (url.includes("disciplinas") && typeof window.getDisciplinas === "function") window.getDisciplinas();
            if (url.includes("organizacao") && typeof window.getOrganizacoes === "function") window.getOrganizacoes();
            if (url.includes("organizacao") && typeof window.getLocais === "function") window.getLocais();
            if (url.includes("eventos") && typeof window.loadEvents === "function") window.loadEvents();
            if (url.includes("usuarios") && typeof window.loadUsuarios === "function") window.loadUsuarios();
          });
        } else {
          Swal.fire("Falha no Restauro", res.alert, "error");
        }
      } catch (e) {
        Swal.fire("Erro Técnico", "Não foi possível concluir o processo.", "error");
      }
    }
  });
};
