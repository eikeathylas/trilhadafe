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
          <p class="mt-2 fw-bold text-body fs-5 mb-1">Rastreando linha do tempo...</p>
          <small class="text-secondary fw-medium">Buscando histórico de alterações e acessos.</small>
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
              <i class="fas fa-exclamation-triangle fa-4x mb-3"></i>
              <p class="fw-bold fs-5">${result.alert}</p>
          </div>
      `);
    }
  } catch (e) {
    container.html(`
        <div class="text-center py-5 text-danger opacity-75">
            <i class="fas fa-bomb fa-4x mb-3"></i>
            <p class="fw-bold fs-5">Erro técnico ao carregar auditoria.</p>
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

  if (key === "is_present" || key.toLowerCase() === "presença" || key === "presenca") {
    if (val === true || val === "t" || val === "true" || val === "Presente" || val === 1) return "Presente";
    if (val === false || val === "f" || val === "false" || val === "Ausente" || val === 0) return "Ausente";
  }

  if (key === "absence_type") {
    const absMap = { UNJUSTIFIED: "Não Justificada", JUSTIFIED: "Justificada", RECURRENT: "Recorrente" };
    if (absMap[val]) return absMap[val];
  }

  if (!boolKeys.includes(key) && isEffectivelyEmpty(val)) return "Não informado";

  if (val === true || val === "t" || val === "true" || val === 1) return "Sim";
  if (val === false || val === "f" || val === "false" || val === 0) return "Não";

  if (key === "content" && typeof val === "string" && val.includes("Oculto")) return "Conteúdo HTML Oculto";

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
    return "Dados Estruturados";
  }

  return val;
};

const renderTimeline = (logs, container) => {
  if (!logs || logs.length === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined" style="font-size: 64px;">history_toggle_off</span>
            <p class="mt-3 fw-bold fs-5 text-body">Nenhum histórico encontrado.</p>
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

  // Sem deduplicação: Mostramos todos os registos para não esconder histórico
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

    let icon = "pen";
    let colorClass = "primary";
    let diffHtml = "";
    let hasVisibleChanges = false;
    let isCollapsible = false;

    let headerText = log.target_name || "Atualização de Dados";

    if (!log.target_name) {
      const labelsMap = {
        person_roles: "Cargos e Funções",
        family_ties: "Vínculos Familiares",
        locations: "Espaço / Sala",
        curriculum: "Grade Curricular",
        curriculum_plans: "Planejamento",
        class_sessions: "Dados da Aula",
        attendance: "Frequência",
        person_attachments: "Arquivos",
      };
      if (labelsMap[log.table_name]) headerText = labelsMap[log.table_name];
    }

    if (isInsert) {
      icon = "plus";
      colorClass = "success";
      headerText = "Criação de Registo";

      let diffLines = "";
      Object.keys(newVal).forEach((key) => {
        if (globalBlacklist.includes(key)) return;
        const displayNew = formatValue(newVal[key], key);
        if (isEffectivelyEmpty(displayNew) || displayNew === "Não informado") return;
        diffLines += `
            <div class="mb-3 d-flex flex-column">
                <span class="text-muted fw-bold" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">${formatKey(key)}</span>
                <div class="text-success fw-bold mt-1" style="font-size: 0.85rem;">${displayNew}</div>
            </div>`;
      });

      if (diffLines) {
        diffHtml = `<div class="text-success fw-medium mb-3" style="font-size: 0.8rem;">Registo principal estruturado no sistema com os seguintes dados iniciais:</div>${diffLines}`;
        isCollapsible = true;
      } else {
        diffHtml = `<div class="text-success fw-medium mt-1" style="font-size: 0.8rem;">Registo principal estruturado no sistema.</div>`;
      }
      hasVisibleChanges = true;
    } else if (isHardDelete || isSoftDelete) {
      icon = "trash";
      colorClass = "danger";
      headerText = "Exclusão";

      let diffLines = "";
      Object.keys(oldVal).forEach((key) => {
        if (globalBlacklist.includes(key)) return;
        const displayOld = formatValue(oldVal[key], key);
        if (isEffectivelyEmpty(displayOld) || displayOld === "Não informado") return;
        diffLines += `
            <div class="mb-3 d-flex flex-column">
                <span class="text-muted fw-bold" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">${formatKey(key)}</span>
                <div class="text-danger fw-bold text-decoration-line-through opacity-75 mt-1" style="font-size: 0.85rem;">${displayOld}</div>
            </div>`;
      });

      if (diffLines) {
        diffHtml = `<div class="text-danger fw-medium mb-3" style="font-size: 0.8rem;">Registo removido do sistema. Dados apagados:</div>${diffLines}`;
        isCollapsible = true;
      } else {
        diffHtml = `<div class="text-danger fw-medium mt-1" style="font-size: 0.8rem;">Registo removido do sistema.</div>`;
      }
      hasVisibleChanges = true;
    } else if (isReactivation) {
      icon = "recycle";
      colorClass = "info";
      headerText = "Restauração";
      diffHtml = `<div class="text-info fw-medium mt-1" style="font-size: 0.8rem;">Registo restaurado da lixeira.</div>`;
      hasVisibleChanges = true;
    } else {
      let diffLines = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach((key) => {
        if (globalBlacklist.includes(key)) return;

        const displayOld = formatValue(oldVal[key], key);
        const displayNew = formatValue(newVal[key], key);

        if (displayOld === displayNew) return;

        diffLines += `
            <div class="mb-3 d-flex flex-column">
                <span class="text-muted fw-bold" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">${formatKey(key)}</span>
                <div class="d-flex align-items-center flex-wrap gap-2 mt-1" style="font-size: 0.85rem;">
                    <span class="text-danger text-decoration-line-through opacity-75">${displayOld}</span>
                    <i class="fas fa-arrow-right text-secondary opacity-50 mx-1" style="font-size: 0.7rem;"></i>
                    <span class="text-success fw-bold">${displayNew}</span>
                </div>
            </div>`;
      });

      if (diffLines) {
        diffHtml = diffLines;
        hasVisibleChanges = true;
        isCollapsible = true;
      }
    }

    if (!hasVisibleChanges) return;
    visibleLogsCount++;

    let rollbackBtn = "";
    if (op === "UPDATE" && !isSoftDelete && !isReactivation) {
      rollbackBtn = `
        <div class="mt-2 pt-3 border-top border-secondary border-opacity-10 text-end">
            <button class="btn btn-sm rounded-3 px-3 fw-bold border border-warning text-warning bg-warning bg-opacity-10 hover-scale w-100 w-md-auto" onclick="doRollback(${log.log_id}, '${log.date_fmt}'); event.stopPropagation();">
                <i class="fas fa-undo-alt me-2"></i> Restaurar esta versão
            </button>
        </div>`;
    }

    const isLast = index === logs.length - 1;
    const lineHtml = !isLast ? `<div class="position-absolute border-start border-2 border-secondary border-opacity-10" style="left: 17px; top: 36px; bottom: -12px; z-index: 1;"></div>` : ``;

    const toggleAttr = isCollapsible ? `data-bs-toggle="collapse" data-bs-target="#collapseAudit${index}" style="cursor: pointer;"` : ``;
    const chevron = isCollapsible ? `<i class="fas fa-chevron-down text-secondary opacity-50 ms-2 toggle-chevron transition-all" style="font-size: 0.7rem;"></i>` : ``;

    html += `
        <div class="d-flex position-relative mb-0 pb-4 transition-all" ${toggleAttr}>
            ${lineHtml}
            
            <div class="flex-shrink-0 position-relative z-2">
                <div class="rounded-circle bg-${colorClass} text-white d-flex align-items-center justify-content-center shadow-sm" style="width: 36px; height: 36px;">
                    <i class="fas fa-${icon}" style="font-size: 0.85rem;"></i>
                </div>
            </div>
            
            <div class="flex-grow-1 ms-3 w-100">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="fw-bold mb-0 text-body d-flex align-items-center" style="font-size: 0.95rem;">
                            ${headerText} ${chevron}
                        </h6>
                        <div class="text-secondary fw-medium mt-1" style="font-size: 0.75rem;">
                            ${log.user_name || "Sistema"}
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold text-body" style="font-size: 0.8rem;">${log.date_fmt.split(" ")[0]}</div>
                        <div class="text-secondary opacity-75" style="font-size: 0.7rem;">${log.date_fmt.split(" ")[1] || ""}</div>
                    </div>
                </div>
                
                ${!isCollapsible ? diffHtml : ""}
                
                ${
                  isCollapsible
                    ? `
                <div class="collapse mt-3" id="collapseAudit${index}">
                    <div class="card card-body bg-secondary bg-opacity-10 border-0 p-3 rounded-4 shadow-inner" onclick="event.stopPropagation();">
                        ${diffHtml}
                        ${rollbackBtn}
                    </div>
                </div>`
                    : ""
                }
            </div>
        </div>`;
  });

  if (visibleLogsCount === 0) {
    container.html(`
        <div class="text-center py-5 text-muted opacity-50">
            <span class="material-symbols-outlined" style="font-size: 48px;">history_edu</span>
            <p class="mt-2 fw-bold text-body fs-5">Registo sem alterações visíveis.</p>
        </div>`);
  } else {
    container.html(`<div class="pt-2 px-2">${html}</div>`);

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
    confirmButtonColor: "#f59e0b",
    cancelButtonColor: "#64748b",
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
