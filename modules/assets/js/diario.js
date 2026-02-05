// =========================================================
// GESTÃO DE DIÁRIO - PADRÃO V3.2 (FINAL)
// =========================================================

const defaultDiary = {
  currentPage: 1,
  rowsPerPage: 10,
  totalPages: 1,
};

let currentStudents = [];
let currentSessionId = null;

$(document).ready(() => {
  initFilters();

  // Listener Global do Menu (Ano Letivo)
  // Se o usuário mudar o ano no menu lateral, resetamos a tela
  window.addEventListener("yearChanged", () => {
    const selClass = $("#sel_filter_class")[0].selectize;
    if (selClass) {
      selClass.clear();
      selClass.clearOptions();
      // Força recarregamento das opções na próxima abertura
      selClass.load(function (callback) {
        callback();
      });
    }
    resetInterface();
  });
});

// =========================================================
// 1. FILTROS E SELETORES (CASCATA)
// =========================================================

const initFilters = () => {
  // 1.1 Seletor de Turma
  $("#sel_filter_class").selectize({
    valueField: "class_id",
    labelField: "class_name",
    searchField: ["class_name", "course_name"],
    placeholder: "Selecione a Turma...",
    preload: true,
    render: {
      option: function (item, escape) {
        return `<div class="py-1 px-2">
                            <div class="fw-bold">${escape(item.class_name)}</div>
                            <div class="small text-muted">${escape(item.course_name)}</div>
                        </div>`;
      },
    },
    load: function (query, callback) {
      const globalYear = localStorage.getItem("sys_active_year");
      // Se não tiver ano selecionado no menu, não carrega nada
      if (!globalYear) return callback();

      $.ajax({
        url: defaultApp.validator,
        type: "POST",
        dataType: "json",
        data: {
          validator: "getMyClasses",
          token: defaultApp.userInfo.token,
          role: defaultApp.userInfo.office,
          year: globalYear, // Passa o contexto global
        },
        success: (res) => callback(res.data),
        error: () => callback(),
      });
    },
    onChange: function (value) {
      if (value) {
        loadSubjects(value);
        // Habilita o próximo passo
        $("#sel_filter_subject")[0].selectize.enable();
      } else {
        resetInterface();
      }
    },
  });

  // 1.2 Seletor de Disciplina
  $("#sel_filter_subject").selectize({
    valueField: "subject_id",
    labelField: "subject_name",
    searchField: "subject_name",
    placeholder: "Selecione a Disciplina...",
    onChange: function (value) {
      if (value) {
        // Se escolheu disciplina, carrega a grid e habilita o botão de ação
        defaultDiary.currentPage = 1;
        getHistory();
        $("#btn_new_session").prop("disabled", false);
      } else {
        $("#btn_new_session").prop("disabled", true);
        // Limpa a grid se desmarcar
        $(".list-table-diario").empty();
      }
    },
  });
};

const loadSubjects = async (classId) => {
  const selSub = $("#sel_filter_subject")[0].selectize;
  selSub.clear();
  selSub.clearOptions();
  selSub.disable();

  try {
    const res = await window.ajaxValidator({
      validator: "getClassSubjects",
      token: defaultApp.userInfo.token,
      class_id: classId,
    });

    if (res.status && res.data.length > 0) {
      selSub.enable();
      res.data.forEach((item) => selSub.addOption(item));

      // UX: Se só tiver uma disciplina, seleciona automático
      if (res.data.length === 1) {
        selSub.setValue(res.data[0].subject_id);
      }
    } else {
      window.alertDefault("Esta turma não possui disciplinas vinculadas na grade.", "warning");
    }
  } catch (e) {
    console.error("Erro ao carregar disciplinas", e);
  }
};

const resetInterface = () => {
  const selSub = $("#sel_filter_subject")[0].selectize;
  if (selSub) {
    selSub.clear();
    selSub.disable();
  }
  $("#btn_new_session").prop("disabled", true);
  $(".list-table-diario").html('<div class="text-center py-5 text-muted opacity-50"><i class="fas fa-arrow-up mb-2 d-block" style="font-size: 2rem;"></i>Selecione Turma e Disciplina acima.</div>');
  $(".pagination-diario").empty();
};

// =========================================================
// 2. LISTAGEM DE HISTÓRICO (GRID)
// =========================================================

const getHistory = async () => {
  const classId = $("#sel_filter_class").val();
  const subjectId = $("#sel_filter_subject").val();

  if (!classId || !subjectId) return;

  const page = Math.max(0, defaultDiary.currentPage - 1);
  $(".list-table-diario").html('<div class="text-center py-5"><span class="loader"></span></div>');

  try {
    const res = await window.ajaxValidator({
      validator: "getClassHistory",
      token: defaultApp.userInfo.token,
      class_id: classId,
      subject_id: subjectId,
      page: page * defaultDiary.rowsPerPage,
      limit: defaultDiary.rowsPerPage,
    });

    if (res.status) {
      const total = res.data[0]?.total_registros || 0;
      defaultDiary.totalPages = Math.max(1, Math.ceil(total / defaultDiary.rowsPerPage));
      renderTableHistory(res.data || []);
    } else {
      $(".list-table-diario").html('<div class="text-center py-5 text-muted"><p>Nenhuma aula registrada para esta disciplina.</p></div>');
      $(".pagination-diario").empty();
    }
  } catch (e) {
    $(".list-table-diario").html('<p class="text-center py-4 text-danger">Erro ao carregar histórico.</p>');
  }
};

const renderTableHistory = (data) => {
  const container = $(".list-table-diario");
  if (data.length === 0) {
    container.html('<div class="text-center py-5 text-muted"><p>Nenhuma aula registrada.</p></div>');
    return;
  }

  const typeMap = { DOCTRINAL: "Doutrinal", BIBLICAL: "Bíblico", LITURGICAL: "Litúrgico", EXPERIENTIAL: "Vivencial", REVIEW: "Avaliação" };

  let rows = data
    .map((item) => {
      const dateFmt = item.session_date.split("-").reverse().join("/");
      const summary = item.description.length > 80 ? item.description.substring(0, 80) + "..." : item.description;
      const typeLabel = typeMap[item.content_type] || item.content_type;

      const total = parseInt(item.total_students);
      const present = parseInt(item.present_count);
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      let badgeColor = pct < 70 ? "bg-danger" : pct < 90 ? "bg-warning" : "bg-success";

      return `
            <tr>
                <td class="ps-4 fw-bold text-dark align-middle">${dateFmt}</td>
                <td class="align-middle"><div class="text-muted small">${summary}</div></td>
                <td class="align-middle"><span class="badge bg-light text-dark border">${typeLabel}</span></td>
                <td class="text-center align-middle">
                    <div class="d-flex align-items-center justify-content-center gap-2">
                        <span class="small fw-bold">${present}/${total}</span>
                        <div class="progress" style="width: 50px; height: 6px;">
                            <div class="progress-bar ${badgeColor}" role="progressbar" style="width: ${pct}%"></div>
                        </div>
                    </div>
                </td>
                <td class="text-end pe-4 align-middle">
                    <button class="btn btn-icon-action" onclick="openSessionModal(${item.session_id})" title="Editar Diário"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-icon-action text-warning" onclick="openAudit('education.class_sessions', ${item.session_id})" title="Log de Auditoria"><i class="fas fa-bolt"></i></button>
                </td>
            </tr>
        `;
    })
    .join("");

  container.html(`<table class="table-custom"><thead><tr><th class="ps-4" width="120">Data</th><th>Conteúdo</th><th width="120">Tipo</th><th class="text-center" width="150">Presença</th><th class="text-end pe-4" width="120">Ações</th></tr></thead><tbody>${rows}</tbody></table>`);
  _generatePaginationButtons("pagination-diario", "currentPage", "totalPages", "changePage", defaultDiary);
};

// =========================================================
// 3. MODAL DE AULA (LANÇAMENTO/EDIÇÃO)
// =========================================================

window.openSessionModal = async (sessionId = null) => {
  const classId = $("#sel_filter_class").val();
  const subjectId = $("#sel_filter_subject").val();

  // Labels para o cabeçalho do modal
  const classTxt = $("#sel_filter_class")[0].selectize.getItem(classId).text();
  const subjectTxt = $("#sel_filter_subject")[0].selectize.getItem(subjectId).text();

  currentSessionId = sessionId;
  $("#session_id").val(sessionId || "");
  $("#modal_subtitle").text(`Turma: ${classTxt} | Disciplina: ${subjectTxt}`);
  $("#modalSessionLabel").text(sessionId ? "Editar Aula" : "Registrar Nova Aula");

  // Limpa campos visuais
  $("#session_date").val(new Date().toISOString().split("T")[0]);
  $("#session_content").val("");
  $("#session_type").val("DOCTRINAL");
  $("#modal_syllabus_ref").html('<em class="small text-muted">Carregando...</em>');
  $("#table_attendance_modal").html('<tr><td colspan="3" class="text-center py-5"><span class="loader-sm"></span> Carregando alunos...</td></tr>');

  $("#modalSession").modal("show");

  // AJAX para buscar dados da sessão (se houver) e lista de alunos
  try {
    const res = await window.ajaxValidator({
      validator: "getClassDailyInfo",
      token: defaultApp.userInfo.token,
      class_id: classId,
      subject_id: subjectId,
      session_id: sessionId,
    });

    if (res.status) {
      const data = res.data;

      // 1. Ementa (Ajuda o professor)
      if (data.info && data.info.syllabus_summary) {
        $("#modal_syllabus_ref").html(data.info.syllabus_summary.replace(/\n/g, "<br>"));
      } else {
        $("#modal_syllabus_ref").html('<em class="small text-muted">Nenhuma ementa cadastrada.</em>');
      }

      // 2. Dados da Aula (Se for edição)
      if (data.session) {
        $("#session_date").val(data.session.session_date);
        $("#session_content").val(data.session.description);
        $("#session_type").val(data.session.content_type);
      }

      // 3. Lista de Chamada
      currentStudents = data.students || [];
      renderModalAttendance();
    }
  } catch (e) {
    window.alertDefault("Erro ao carregar dados do diário.", "error");
    $("#modalSession").modal("hide");
  }
};

const renderModalAttendance = () => {
  const container = $("#table_attendance_modal");
  container.empty();
  $("#count_students").text(currentStudents.length + " Alunos");

  if (currentStudents.length === 0) {
    container.html('<tr><td colspan="3" class="text-center py-4 text-muted">Nenhum aluno ativo nesta turma.</td></tr>');
    return;
  }

  currentStudents.forEach((student, index) => {
    // Lógica bool do Postgres (t/f ou true/false)
    const isPresent = student.is_present === true || student.is_present === "t" || student.is_present === "true";
    const isAbsent = student.is_present === false || student.is_present === "f" || student.is_present === "false";

    // Se tem justificativa, ícone fica amarelo
    let obsBtnClass = "text-muted opacity-25";
    if (student.justification || student.absence_type) obsBtnClass = "text-warning opacity-100";

    const html = `
            <tr class="student-row">
                <td class="align-middle ps-4">
                    <div class="fw-bold text-dark" style="font-size: 0.9rem;">${student.full_name}</div>
                </td>
                <td class="align-middle text-center">
                    <div class="btn-group w-100" role="group">
                        <input type="radio" class="btn-check" name="att_${student.student_id}" id="p_${student.student_id}" ${isPresent ? "checked" : ""} onchange="updateAtt(${index}, true)">
                        <label class="btn btn-outline-success btn-sm btn-attendance" for="p_${student.student_id}">Presente</label>

                        <input type="radio" class="btn-check" name="att_${student.student_id}" id="a_${student.student_id}" ${isAbsent ? "checked" : ""} onchange="updateAtt(${index}, false)">
                        <label class="btn btn-outline-danger btn-sm btn-attendance" for="a_${student.student_id}">Ausente</label>
                    </div>
                </td>
                <td class="align-middle text-end pe-3">
                    <button class="btn btn-link btn-sm ${obsBtnClass}" onclick="openJustifyModal(${index})" title="Adicionar Observação/Justificativa">
                        <i class="fas fa-comment-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    container.append(html);
  });
};

// Atualiza o estado local ao clicar no radio button
window.updateAtt = (index, status) => {
  currentStudents[index].is_present = status;

  if (status === true) {
    // Se marcou presente, limpa justificativas antigas (Regra de Negócio)
    currentStudents[index].justification = null;
    currentStudents[index].absence_type = null;
    renderModalAttendance(); // Re-renderiza para atualizar a cor do ícone de obs
  } else {
    // Se marcou ausente, sugere abrir a modal de justificativa
    openJustifyModal(index);
  }
};

// =========================================================
// 4. JUSTIFICATIVA (MODAL SATÉLITE)
// =========================================================

window.openJustifyModal = (index) => {
  const s = currentStudents[index];
  $("#just_student_index").val(index);
  $("#just_student_name").text(s.full_name);
  $("#just_type").val(s.absence_type || "UNJUSTIFIED"); // Padrão: Não justificada
  $("#just_obs").val(s.justification || "");

  // Abre o modal pequeno por cima do grande
  $("#modalJustification").modal("show");
};

window.confirmJustification = () => {
  const idx = $("#just_student_index").val();
  if (idx !== "") {
    currentStudents[idx].absence_type = $("#just_type").val();
    currentStudents[idx].justification = $("#just_obs").val();

    // Se abriu a modal de justificativa, assume que é falta
    currentStudents[idx].is_present = false;
  }
  $("#modalJustification").modal("hide");
  renderModalAttendance(); // Atualiza a lista principal com o ícone amarelo
};

// =========================================================
// 5. SALVAR NO BACKEND
// =========================================================

window.saveSession = async () => {
  // Coleta dados
  const classId = $("#sel_filter_class").val();
  const subjectId = $("#sel_filter_subject").val();
  const date = $("#session_date").val();
  const content = $("#session_content").val();
  const type = $("#session_type").val();
  const sessionId = $("#session_id").val();

  // Validações básicas
  if (!date) return window.alertDefault("Por favor, informe a data da aula.", "warning");
  if (!content.trim()) return window.alertDefault("Por favor, descreva o conteúdo ministrado.", "warning");

  // Valida se todos os alunos têm presença marcada (não pode ser null/undefined)
  const pending = currentStudents.filter((s) => s.is_present === null || s.is_present === undefined);
  if (pending.length > 0) {
    return window.alertDefault(`Ainda há ${pending.length} alunos sem registro de frequência.`, "warning");
  }

  // Trava botão
  window.setButton(true, ".btn-save", "Salvando...");

  try {
    const res = await window.ajaxValidator({
      validator: "saveDailyLog",
      token: defaultApp.userInfo.token,
      class_id: classId,
      subject_id: subjectId,
      session_id: sessionId,
      date: date,
      description: content,
      content_type: type,
      attendance_json: JSON.stringify(currentStudents), // Envia array completo
    });

    if (res.status) {
      window.alertDefault("Diário salvo com sucesso!", "success");
      $("#modalSession").modal("hide");
      getHistory(); // Atualiza a grid principal
    } else {
      window.alertDefault(res.alert, "error");
    }
  } catch (e) {
    window.alertDefault("Erro técnico ao salvar.", "error");
    console.error(e);
  } finally {
    window.setButton(false, ".btn-save", "Salvar Diário");
  }
};

// =========================================================
// 6. PAGINAÇÃO (HELPER PADRÃO)
// =========================================================

window.changePage = (page) => {
  defaultDiary.currentPage = page;
  getHistory();
};

const _generatePaginationButtons = (containerClass, currentPageKey, totalPagesKey, funcName, contextObj) => {
  let container = $(`.${containerClass}`);
  container.empty();
  let total = contextObj[totalPagesKey];
  let current = contextObj[currentPageKey];

  // Botão Primeira
  let html = `<button onclick="${funcName}(1)" class="btn btn-sm btn-secondary me-1" ${current === 1 ? "disabled" : ""}>Primeira</button>`;

  // Botões Numéricos (Lógica de Janela deslizante)
  for (let p = Math.max(1, current - 2); p <= Math.min(total, current + 2); p++) {
    const activeClass = p === current ? "btn-primary" : "btn-secondary";
    html += `<button onclick="${funcName}(${p})" class="btn btn-sm ${activeClass} me-1">${p}</button>`;
  }

  // Botão Última
  html += `<button onclick="${funcName}(${total})" class="btn btn-sm btn-secondary" ${current === total ? "disabled" : ""}>Última</button>`;

  container.html(html);
};
