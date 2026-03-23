window.openAudit = async (table, id, btn) => {
  btn = $(btn);
  const container = $("#audit-timeline-container");
  const modal = $("#modalAudit");

  // Limpa o CSS da classe antiga para evitar conflitos com o novo layout gerado pelo JS
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
    console.error(e);
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

// Nova função formatValue limpa de HTML para o design de diff elegante
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

    let icon = "pen"; // Lápis para edição
    let colorClass = "primary";
    let diffHtml = "";
    let hasVisibleChanges = false;

    let headerText = log.target_name || "Atualização";

    // Tratamento de Labels de Tabelas Relacionadas
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

    let itemName = oldVal.title || newVal.title || oldVal.description || newVal.description || oldVal.file_name || newVal.file_name || oldVal.name || newVal.name || "Registo";

    // COMPORTAMENTOS (Criação, Exclusão, Edição)
    if (isInsert) {
      icon = "plus";
      colorClass = "success";
      headerText = "Criação";
      diffHtml = `<div class="text-success fw-bold"><i class="fas fa-check-circle me-2"></i> Registo mestre criado no sistema.</div>`;
      hasVisibleChanges = true;
    } else if (isHardDelete || isSoftDelete) {
      icon = "trash";
      colorClass = "danger";
      headerText = "Exclusão";
      diffHtml = `<div class="text-danger fw-bold"><i class="fas fa-trash-alt me-2"></i> Registo removido do sistema.</div>`;
      hasVisibleChanges = true;
    } else if (isReactivation) {
      icon = "recycle";
      colorClass = "info";
      headerText = "Restauração";
      diffHtml = `<div class="text-info fw-bold"><i class="fas fa-recycle me-2"></i> Registo restaurado da lixeira.</div>`;
      hasVisibleChanges = true;
    } else {
      // PROCESSO DE UPDATE (Montagem do Diff Limpo)
      let diffLines = "";
      const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

      allKeys.forEach((key) => {
        if (globalBlacklist.includes(key)) return;

        const vOld = oldVal[key];
        const vNew = newVal[key];

        const displayOld = formatValue(vOld, key);
        const displayNew = formatValue(vNew, key);

        if (displayOld === displayNew) return;

        hasVisibleChanges = true;
        diffLines += `
            <div class="mb-3">
                <div class="fw-bold text-body small mb-1">${formatKey(key)}</div>
                <div class="d-flex align-items-center flex-wrap gap-2 fs-6">
                    <span class="text-danger text-decoration-line-through opacity-75">${displayOld}</span>
                    <i class="fas fa-arrow-right text-secondary opacity-50 mx-1" style="font-size: 0.8rem;"></i>
                    <span class="text-success fw-medium">${displayNew}</span>
                </div>
            </div>`;
      });

      if (diffLines) diffHtml = `<div>${diffLines}</div>`;
    }

    if (!hasVisibleChanges) return;

    visibleLogsCount++;

    // Botão de Rollback Imersivo (Aparece apenas em Updates válidos)
    let rollbackBtn = "";
    if (op === "UPDATE" && !isSoftDelete && !isReactivation) {
      rollbackBtn = `
        <div class="mt-3 text-end pt-3">
            <button class="btn btn-sm rounded-pill px-4 fw-bold border border-warning text-warning bg-transparent hover-scale w-100 w-md-auto d-inline-flex align-items-center justify-content-center" onclick="doRollback(${log.log_id}, '${log.date_fmt}')">
                <i class="fas fa-undo-alt me-2"></i> Restaurar versão
            </button>
        </div>`;
    }

    // Linha conectora gerada dinamicamente, exceto no último item
    const lineHtml = index !== logs.length - 1 ? `<div class="position-absolute border-start border-2 border-secondary border-opacity-25" style="left: 21px; top: 44px; bottom: -24px; z-index: 1;"></div>` : ``;

    // Montagem final do HTML idêntica à imagem
    html += `
        <div class="d-flex position-relative mb-4 pb-2">
            ${lineHtml}
            
            <div class="flex-shrink-0 position-relative z-2">
                <div class="rounded-circle bg-${colorClass} bg-opacity-10 text-${colorClass} d-flex align-items-center justify-content-center border border-${colorClass} border-opacity-25 shadow-sm" style="width: 44px; height: 44px;">
                    <i class="fas fa-${icon}"></i>
                </div>
            </div>
            
            <div class="flex-grow-1 ms-3 pt-1 w-100">
                <div class="d-flex justify-content-between align-items-start mb-1 flex-wrap gap-2">
                    <div>
                        <h6 class="fw-bold mb-1 text-body fs-6">${log.user_name || "Sistema"}</h6>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium px-2 py-1" style="font-size: 0.65rem; letter-spacing: 0.5px;">${headerText}</span>
                            <button class="btn btn-sm btn-light bg-transparent border-secondary border-opacity-25 rounded-circle p-0 d-flex align-items-center justify-content-center text-primary hover-scale" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAudit${index}" style="width: 24px; height: 24px;">
                                <i class="fas fa-chevron-down toggle-chevron" style="font-size: 0.7rem; transition: transform 0.3s ease;"></i>
                            </button>
                        </div>
                    </div>
                    <span class="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-medium px-2 py-1 d-flex align-items-center mt-1 mt-md-0" style="font-size: 0.7rem;">
                        <i class="fas fa-clock me-1 opacity-50"></i> ${log.date_fmt}
                    </span>
                </div>
                
                <div class="collapse mt-3" id="collapseAudit${index}">
                    <div class="card card-body bg-secondary bg-opacity-10 border-0 p-3 p-md-4 rounded-4 shadow-inner">
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
            <p class="mt-2 fw-bold text-body fs-5">Registo sem alterações visíveis.</p>
        </div>`);
  } else {
    container.html(`<div class="pt-2 px-2">${html}</div>`);

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
