// Força o z-index do SweetAlert para ficar acima dos modais nativos do Bootstrap
if (!$("#swal-z-index-fix").length) {
  $('<style id="swal-z-index-fix">.swal2-container { z-index: 109000 !important; }</style>').appendTo("head");
}

window.openAudit = async (table, id, btn) => {
  btn = $(btn);
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");

  container.removeClass("timeline-audit").css({ "padding-left": "0", "border-left": "none", "margin-left": "0" });
  modal.modal("show");

  container.html(`
      <div class="text-center py-5 opacity-50">
          <div class="spinner-border text-primary mb-3" style="width: 3rem; height: 3rem;" role="status"></div>
          <p class="mt-2 fw-bold text-body fs-5 mb-1">Rastreando Assinaturas Digitais...</p>
          <small class="text-secondary fw-medium">Analisando o banco de dados seguro.</small>
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
              <i class="fas fa-shield-alt fa-4x mb-3"></i>
              <p class="fw-bold fs-5">${result.alert}</p>
          </div>
      `);
    }
  } catch (e) {
    container.html(`
        <div class="text-center py-5 text-danger opacity-75">
            <i class="fas fa-server fa-4x mb-3"></i>
            <p class="fw-bold fs-5">Erro na decodificação da auditoria.</p>
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

// O GRANDE TRADUTOR DE SEGURANÇA
const formatKey = (key) => {
  const kLow = String(key).toLowerCase();
  const map = {
    // Acadêmico e Diário
    meeting_number: "Nº do Encontro/Aula",
    title: "Tema / Título",
    content: "Conteúdo Programático",
    session_date: "Data e Hora da Sessão",
    content_type: "Tipo de Metodologia",
    signed_at: "Assinatura Digital em",
    is_present: "Situação de Presença",
    presença: "Status de Frequência",
    presenca: "Status de Frequência",
    justification: "Justificativa da Ausência",
    absence_type: "Classificação da Falta",
    student_observation: "Observações do Aluno",
    aluno: "Catequizando / Aluno",
    coordinator_id: "Gestor Coordenador",
    class_assistant_id: "Auxiliar Oficial",
    class_name: "Nomenclatura da Turma",
    shift: "Turno Letivo",
    start_time: "Horário de Início",
    end_time: "Horário de Término",
    year_id: "Ciclo / Ano Letivo",
    subject_id: "Matriz Disciplinar",
    is_mandatory: "Requisito Obrigatório",
    disciplina: "Componente Curricular",
    syllabus_summary: "Ementa Acadêmica",
    course_id: "ID do Curso",
    class_id: "ID da Turma",
    year_cycle: "Ciclo Vigente",
    semester: "Módulo / Semestre",
    start_date: "Data de Abertura",
    end_date: "Data de Fechamento",
    max_capacity: "Limite de Vagas",
    curriculum_id: "Grade Curricular",
    is_academic_blocker: "Bloqueio de Calendário (Feriado)",
    description: "Descrição",

    // Pessoal e Identidade
    name: "Nome de Registro",
    full_name: "Nome Completo",
    religious_name: "Nome Social / Religioso",
    birth_date: "Data de Nascimento",
    gender: "Identidade de Gênero",
    national_id: "Documento de Identidade (RG)",
    tax_id: "Documento Fiscal (CPF/CNPJ)",
    is_pcd: "Pessoa com Deficiência (PcD)",
    pcd_details: "Laudo / Detalhes PcD",
    profile_photo_url: "Caminho do Avatar",
    sacraments_info: "Registros Sacramentais",
    eucharist_date: "Data da Eucaristia",
    eucharist_place: "Local da Eucaristia",

    // Contatos e Endereços
    phone_main: "Telefone Primário",
    phone_secondary: "Telefone Secundário",
    phone_mobile: "Celular / WhatsApp",
    phone_landline: "Linha Fixa",
    email_contact: "Endereço de E-mail",
    website_url: "Portal Eletrônico",
    address_street: "Logradouro (Rua/Av)",
    address_number: "Número Predial",
    address_district: "Bairro / Setor",
    address_city: "Município",
    address_state: "Unidade Federativa (UF)",
    zip_code: "Código Postal (CEP)",

    // Organizacional e Infraestrutura
    is_active: "Estado Operacional",
    active: "Status Geral",
    deleted: "Lixeira (Soft Delete)",
    display_name: "Nome Fantasia",
    legal_name: "Razão Social",
    org_type: "Natureza da Organização",
    patron_saint: "Santo Padroeiro",
    diocese_name: "Diocese Vinculada",
    decree_number: "Número do Decreto",
    foundation_date: "Data de Fundação",
    instituicao: "Instituição Matriz",
    location_id: "ID do Espaço Físico",
    capacity: "Capacidade Máxima",
    has_ac: "Climatização (Ar-Cond.)",
    has_ceiling_fan: "Ventilação de Teto",
    is_accessible: "Infraestrutura Acessível",
    is_consecrated: "Rito de Consagração",
    is_sacred: "Ambiente Sagrado",
    is_lodging: "Alojamento Disponível",
    resources_detail: "Inventário de Recursos",
    responsible_id: "Responsável Legal",

    // Vínculos e Segurança
    vinculo: "Função Desempenhada",
    relationship_type: "Grau de Parentesco",
    is_financial_responsible: "Titular Financeiro",
    is_legal_guardian: "Tutela Legal",
    relative_id: "ID do Familiar",
    relative_name: "Nome do Familiar",
    force_password_change: "Exigir Redefinição de Senha",
    status: "Status do Sistema",
    file_name: "Nomenclatura do Arquivo",
    file_path: "Diretório de Armazenamento",
  };
  return map[kLow] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const formatValue = (val, key = "") => {
  const boolKeys = ["is_active", "active", "deleted", "is_pcd", "has_ac", "is_accessible", "is_consecrated", "is_mandatory", "is_academic_blocker", "force_password_change", "is_financial_responsible", "is_legal_guardian", "is_sacred", "is_lodging"];

  if (key === "is_present" || key.toLowerCase() === "presença" || key === "presenca" || key === "is_present") {
    if (val === true || val === "t" || val === "true" || val === "Presente" || val === 1) return `<span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25"><i class="fas fa-check me-1"></i> Presente</span>`;
    if (val === false || val === "f" || val === "false" || val === "Ausente" || val === 0) return `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25"><i class="fas fa-times me-1"></i> Ausente</span>`;
  }

  if (key === "absence_type") {
    const absMap = {
      UNJUSTIFIED: `<span class="text-danger fw-bold">Não Justificada</span>`,
      JUSTIFIED: `<span class="text-warning fw-bold">Falta Justificada</span>`,
      RECURRENT: `<span class="text-danger fw-bolder">Falta Recorrente</span>`,
    };
    if (absMap[val]) return absMap[val];
  }

  // Traduções de Parentescos e Metodologias (DOCTRINAL, FATHER, etc)
  if (typeof val === "string") {
    const valUpper = val.toUpperCase();
    const translateMap = {
      FATHER: "PAI",
      MOTHER: "MÃE",
      OTHER: "OUTRO(A)",
      GRANDPARENT: "AVÔ/AVÓ",
      UNCLE: "TIO(A)",
      AUNT: "TIA",
      SIBLING: "IRMÃO/IRMÃ",
      SPOUSE: "CÔNJUGE",
      DOCTRINAL: "Doutrinário",
      BIBLICAL: "Bíblico",
      LITURGICAL: "Litúrgico",
      SYSTEMATIC: "Sistemático",
      PEDAGOGICAL: "Pedagógico",
    };
    if (translateMap[valUpper]) return translateMap[valUpper];
  }

  if (!boolKeys.includes(key) && isEffectivelyEmpty(val)) return `<span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-normal">Não informado</span>`;

  if (boolKeys.includes(key)) {
    if (val === true || val === "t" || val === "true" || val === 1) return `<span class="badge bg-success text-white px-2 py-1"><i class="fas fa-check-circle me-1"></i> Sim</span>`;
    if (val === false || val === "f" || val === "false" || val === 0) return `<span class="badge bg-secondary text-white px-2 py-1"><i class="fas fa-minus-circle me-1"></i> Não</span>`;
  }

  if (key === "content" && typeof val === "string" && (val.includes("Oculto") || val.includes("<p>"))) return `<span class="text-secondary fst-italic"><i class="fas fa-code me-1"></i> Documento Rico (HTML)</span>`;

  const statusMap = {
    ACTIVE: `<span class="text-success fw-bold">Operacional</span>`,
    PLANNED: `<span class="text-info fw-bold">Planejado</span>`,
    FINISHED: `<span class="text-secondary fw-bold">Encerrado</span>`,
    CANCELLED: `<span class="text-danger fw-bold">Cancelado</span>`,
    PENDING: `<span class="text-warning fw-bold">Pendente</span>`,
    PUBLISHED: `<span class="text-primary fw-bold"><i class="fas fa-bullhorn me-1"></i> Publicado</span>`,
    DRAFT: `<span class="text-secondary fw-bold"><i class="fas fa-file-alt me-1"></i> Rascunho</span>`,
  };
  if (typeof val === "string" && statusMap[val.toUpperCase()]) return statusMap[val.toUpperCase()];

  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
    if (val.includes("T") || val.includes(" ")) {
      let parts = val.split(/[T ]/);
      let datePart = parts[0].split("-").reverse().join("/");
      let timePart = parts[1] ? parts[1].substring(0, 5) : "";
      return `<i class="far fa-calendar-alt text-secondary me-1"></i> ${datePart} <i class="far fa-clock text-secondary ms-2 me-1"></i> ${timePart}`.trim();
    } else {
      const p = val.split("-");
      return `<i class="far fa-calendar-alt text-secondary me-1"></i> ${p[2]}/${p[1]}/${p[0]}`;
    }
  }

  if (typeof val === "object" && val !== null) {
    return `<span class="text-primary fw-medium"><i class="fas fa-database me-1"></i> Dados Estruturados em Lote</span>`;
  }

  return val;
};

const renderTimeline = (logs, container) => {
  if (!logs || logs.length === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined" style="font-size: 64px;">policy</span>
            <p class="mt-3 fw-bold fs-5 text-body">Nenhuma violação ou alteração registrada.</p>
        </div>
    `);
    return;
  }

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
    "syllabus_id",
  ];

  const isBlockedKey = (k) => {
    const kLow = k.toLowerCase();
    return kLow.endsWith("_id") || kLow === "id" || kLow === "deleted" || globalBlacklist.includes(kLow);
  };

  // LÓGICA DE AGRUPAMENTO (CONSOLIDAÇÃO POR TRANSAÇÃO)
  const groupedTransactions = [];
  const transactionMap = new Map();

  logs.forEach((log) => {
    const transKey = `${log.date_fmt}_${log.user_name}`;
    if (!transactionMap.has(transKey)) {
      const newGroup = {
        transKey: transKey,
        user_name: log.user_name || "SISTEMA_AUTO",
        date_fmt: log.date_fmt,
        log_id: log.log_id,
        items: [],
      };
      groupedTransactions.push(newGroup);
      transactionMap.set(transKey, newGroup);
    }
    transactionMap.get(transKey).items.push(log);
  });

  let html = "";
  let visibleLogsCount = 0;

  groupedTransactions.forEach((group, index) => {
    let sessionLog = group.items.find((l) => l.table_name === "class_sessions");
    let mainLog = sessionLog || group.items[0];

    let mainOp = (mainLog.operation || "").toUpperCase().trim();
    let isInsert = mainOp === "INSERT" || mainOp === "ADD VÍNCULO";
    let isDelete = mainOp === "DELETE" || mainOp === "RMV VÍNCULO";
    let isUpdate = mainOp === "UPDATE" || mainOp === "EDITAR";

    let icon = isInsert ? "check" : isDelete ? "ban" : "pen";
    let colorClass = isInsert ? "success" : isDelete ? "danger" : "primary";

    let headerText = "Modificação de Dados";
    if (sessionLog) {
      headerText = isInsert ? "Registro de Aula Criado" : isDelete ? "Registro de Aula Removido" : "Registro de Aula Atualizado";
    } else if (group.items.some((l) => l.table_name === "attendance")) {
      headerText = isInsert ? "Lançamento de Frequência" : isDelete ? "Remoção de Frequência" : "Atualização de Frequência";
    } else {
      const labelsMap = {
        person_roles: "Atribuição de Cargo/Função",
        family_ties: "Matriz Familiar",
        locations: "Mapeamento Físico",
        curriculum: "Estrutura Curricular",
        curriculum_plans: "Planejamento Estratégico",
        person_attachments: "Anexação de Documentos",
      };
      if (labelsMap[mainLog.table_name]) headerText = labelsMap[mainLog.table_name];
    }

    let generalFieldsHTML = "";
    let attendanceHTML = "";
    let attCount = 0;
    let hasVisibleChanges = false;

    group.items.forEach((log) => {
      let oldVal = {},
        newVal = {};
      try {
        oldVal = (typeof log.old_values === "string" ? JSON.parse(log.old_values) : log.old_values) || {};
      } catch (e) {}
      try {
        newVal = (typeof log.new_values === "string" ? JSON.parse(log.new_values) : log.new_values) || {};
      } catch (e) {}

      const logOp = (log.operation || "").toUpperCase().trim();

      // ==========================================
      // FILTRO DE FREQUÊNCIA (SÓ MOSTRA SE MUDOU)
      // ==========================================
      if (log.table_name === "attendance") {
        let valNew = newVal["Presença"] || newVal["presença"] || (newVal.is_present !== undefined ? formatValue(newVal.is_present, "is_present") : null);
        let valOld = oldVal["Presença"] || oldVal["presença"] || (oldVal.is_present !== undefined ? formatValue(oldVal.is_present, "is_present") : null);

        // Se for UPDATE e não houve mudança real no texto da presença, ignora este aluno no log
        if (logOp === "UPDATE" && valNew === valOld) return;

        attCount++;
        let sName = log.student_name || newVal.student_name || oldVal.student_name || "Aluno Indefinido";
        let stDiff = "";

        if (logOp === "INSERT" || isInsert) {
          stDiff = valNew || `<span class="badge bg-secondary border border-secondary border-opacity-25 bg-opacity-10 text-secondary">Registrada</span>`;
        } else if (logOp === "DELETE") {
          stDiff = `<span class="text-danger fw-bold"><i class="fas fa-trash me-1"></i> Removida</span>`;
        } else {
          stDiff = `<span class="opacity-50 text-decoration-line-through me-1">${valOld}</span> <i class="fas fa-chevron-right mx-1 text-secondary opacity-50" style="font-size:0.6rem"></i> ${valNew}`;
        }

        attendanceHTML += `
              <div class="d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10 py-2">
                  <span class="text-body fw-bold" style="font-size: 0.85rem;">${sName}</span>
                  <div style="font-size: 0.85rem; display: flex; align-items: center;">${stDiff}</div>
              </div>`;
      }
      // ==========================================
      // CAMPOS GERAIS
      // ==========================================
      else {
        const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
        allKeys.forEach((key) => {
          if (isBlockedKey(key)) return;

          const displayOld = formatValue(oldVal[key], key);
          const displayNew = formatValue(newVal[key], key);

          if (logOp === "INSERT") {
            if (isEffectivelyEmpty(displayNew) || String(displayNew).includes("Não informado")) return;
            generalFieldsHTML += `
                      <div class="col-12 col-md-6 mb-3">
                          <div class="text-muted fw-bold mb-1" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">
                              <i class="fas fa-tag me-1 opacity-50"></i> ${formatKey(key)}
                          </div>
                          <div class="p-2 rounded-3 bg-white border border-secondary border-opacity-10 text-body" style="font-size: 0.85rem;">
                              ${displayNew}
                          </div>
                      </div>`;
          } else {
            if (displayOld === displayNew) return;
            generalFieldsHTML += `
                      <div class="col-12 mb-3">
                          <div class="text-muted fw-bolder mb-2" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;">
                              <i class="fas fa-exchange-alt me-1 opacity-50"></i> ${formatKey(key)}
                          </div>
                          <div class="d-flex flex-column flex-md-row gap-2 align-items-stretch align-items-md-center">
                              <div class="flex-fill p-2 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 text-danger d-flex align-items-center" style="font-size: 0.85rem; min-height: 42px;">
                                  <del class="opacity-75 w-100">${displayOld}</del>
                              </div>
                              <div class="d-flex align-items-center justify-content-center text-secondary opacity-25 px-1 py-1">
                                  <i class="fas fa-chevron-right d-none d-md-block"></i>
                                  <i class="fas fa-chevron-down d-block d-md-none"></i>
                              </div>
                              <div class="flex-fill p-2 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success fw-bold d-flex align-items-center shadow-sm" style="font-size: 0.85rem; min-height: 42px;">
                                  ${displayNew}
                              </div>
                          </div>
                      </div>`;
          }
        });
      }
    });

    let diffHtml = "";
    if (generalFieldsHTML !== "") {
      diffHtml += isInsert
        ? `<div class="alert bg-success bg-opacity-10 border-success border-opacity-25 text-success fw-medium mb-3 p-2 small"><i class="fas fa-database me-2"></i> Conteúdo e Informações Iniciais:</div><div class="row">${generalFieldsHTML}</div>`
        : `<div class="row">${generalFieldsHTML}</div>`;
    }

    if (attendanceHTML !== "") {
      diffHtml += `
          <div class="${generalFieldsHTML !== "" ? "mt-3 pt-3 border-top border-secondary border-opacity-10" : ""}">
              <div class="text-body fw-bold mb-2 d-flex align-items-center">
                  <i class="fas fa-user-check me-2 text-primary opacity-75"></i> Alterações de Frequência
                  <span class="badge bg-primary bg-opacity-10 text-primary ms-2">${attCount} modificações</span>
              </div>
              <div class="d-flex flex-column">${attendanceHTML}</div>
          </div>`;
    }

    if (diffHtml !== "") hasVisibleChanges = true;
    if (!hasVisibleChanges) return;

    visibleLogsCount++;

    // Só gera botão de rollback se houver um UPDATE mestre
    let rollbackBtn = isUpdate
      ? `
          <div class="mt-3 pt-3 border-top border-secondary border-opacity-10 text-end">
              <button class="btn btn-sm rounded-3 px-4 fw-bold border border-warning text-warning bg-warning bg-opacity-10 hover-scale w-100 w-md-auto d-inline-flex align-items-center justify-content-center" onclick="doRollback(${group.log_id}, '${group.date_fmt}'); event.stopPropagation();" style="height: 42px;">
                  <i class="fas fa-history me-2"></i> Solicitar Reversão de Segurança
              </button>
          </div>`
      : "";

    const isLast = index === groupedTransactions.length - 1;
    const lineHtml = !isLast ? `<div class="position-absolute border-start border-2 border-secondary border-opacity-10" style="left: 17px; top: 36px; bottom: -12px; z-index: 1;"></div>` : ``;
    const toggleAttr = `data-bs-toggle="collapse" data-bs-target="#collapseAudit${index}" style="cursor: pointer;"`;
    const chevron = `<i class="fas fa-chevron-down text-secondary opacity-50 ms-2 toggle-chevron transition-all" style="font-size: 0.8rem;"></i>`;

    html += `
      <div class="d-flex position-relative mb-0 pb-4 transition-all hover-bg-light rounded-4" ${toggleAttr}>
          ${lineHtml}
          <div class="flex-shrink-0 position-relative z-2">
              <div class="rounded-circle bg-${colorClass} text-white d-flex align-items-center justify-content-center shadow-sm border border-${colorClass} border-opacity-25" style="width: 36px; height: 36px;">
                  <i class="fas fa-${icon}" style="font-size: 0.85rem;"></i>
              </div>
          </div>
          <div class="flex-grow-1 ms-3 w-100">
              <div class="d-flex justify-content-between align-items-start">
                  <div>
                      <h6 class="fw-bold mb-0 text-body d-flex align-items-center" style="font-size: 0.95rem;">${headerText} ${chevron}</h6>
                      <div class="text-secondary fw-medium mt-1 d-flex align-items-center gap-2" style="font-size: 0.75rem;">
                          <span class="text-body fw-bold"><i class="fas fa-fingerprint text-primary opacity-50 me-1"></i> ${group.user_name}</span>
                          <span class="opacity-50">|</span>
                          <span class="font-monospace text-muted opacity-75" style="font-size: 0.65rem;">LOG-ID #${group.log_id}</span>
                      </div>
                  </div>
                  <div class="text-end pe-1">
                      <div class="fw-bold text-body" style="font-size: 0.8rem;">${group.date_fmt.split(" ")[0]}</div>
                      <div class="text-secondary opacity-75" style="font-size: 0.7rem;">${group.date_fmt.split(" ")[1] || ""}</div>
                  </div>
              </div>
              <div class="collapse mt-3" id="collapseAudit${index}">
                  <div class="card card-body bg-secondary bg-opacity-10 border-0 p-3 p-md-4 rounded-4 shadow-inner" onclick="event.stopPropagation();">
                      ${diffHtml}
                      ${rollbackBtn}
                  </div>
              </div>
          </div>
      </div>`;
  });

  container.html(
    visibleLogsCount === 0 ? `<div class="text-center py-5 text-muted opacity-50"><span class="material-symbols-outlined" style="font-size: 64px;">policy</span><p class="mt-3 fw-bold fs-5 text-body">Nenhuma alteração real detectada.</p></div>` : `<div class="pt-2 px-1 px-md-3">${html}</div>`,
  );

  container
    .find(".collapse")
    .on("show.bs.collapse", function () {
      $(this).parent().find(".toggle-chevron").addClass("rotate-180");
    })
    .on("hide.bs.collapse", function () {
      $(this).parent().find(".toggle-chevron").removeClass("rotate-180");
    });
};

window.doRollback = (logId, dateStr = "") => {
  Swal.fire({
    title: "Protocolo de Reversão",
    html: `
        <div class="text-start">
            <p class="text-body mb-3">Irá forçar a restauração do banco de dados para a imagem exata de <b>${dateStr || "nesta data"}</b>.</p>
            <div class="alert bg-danger bg-opacity-10 border border-danger border-opacity-25 d-flex align-items-start mb-0 rounded-4 p-3">
                <i class="fas fa-shield-alt text-danger me-3 fs-3 mt-1"></i>
                <div class="small text-danger"><b>Aviso de Integridade:</b> Todas as transações efetuadas <u>após</u> esta assinatura serão permanentemente destruídas para garantir a consistência dos dados recuperados.</div>
            </div>
        </div>
    `,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: '<i class="fas fa-exclamation-triangle me-2"></i> Forçar Reversão',
    cancelButtonText: "Abortar",
    reverseButtons: true,
    focusCancel: true,
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Injetando Restauração...", didOpen: () => Swal.showLoading() });
        const res = await ajaxValidator({ validator: "rollbackAuditLog", token: defaultApp.userInfo.token, log_id: logId });
        if (res.status) {
          Swal.fire({ title: "Reversão Confirmada", icon: "success", timer: 2000, showConfirmButton: false }).then(() => {
            $("#modalAudit").modal("hide");
            const url = window.location.href;
            if (typeof window.getPessoas === "function") window.getPessoas();
            if (url.includes("turmas") && typeof window.getTurmas === "function") window.getTurmas();
            if (url.includes("cursos") && typeof window.getCursos === "function") window.getCursos();
            if (url.includes("disciplinas") && typeof window.getDisciplinas === "function") window.getDisciplinas();
            if (url.includes("organizacao") && typeof window.getOrganizacoes === "function") window.getOrganizacoes();
            if (url.includes("organizacao") && typeof window.getLocais === "function") window.getLocais();
            if (url.includes("eventos") && typeof window.loadEvents === "function") window.loadEvents();
            if (url.includes("usuarios") && typeof window.loadUsuarios === "function") window.loadUsuarios();
            if (url.includes("diario") && typeof window.getHistory === "function") window.getHistory();
          });
        } else {
          Swal.fire("Falha de Segurança", res.alert, "error");
        }
      } catch (e) {
        Swal.fire("Erro Crítico", "O núcleo recusou a operação de reversão.", "error");
      }
    }
  });
};
