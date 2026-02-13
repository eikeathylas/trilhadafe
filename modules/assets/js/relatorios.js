/**
 * TRILHA DA FÉ - Controlador de Interface de Relatórios
 * Orquestra a abertura de modais, coleta de filtros e dispara o Builder.
 */

// Estado Global de Controle de Interface
const defaultReportUI = {
  currentType: null,
  currentTitle: "",
};

// =========================================================
// 1. GESTÃO DE INTERFACE E FILTROS
// =========================================================

/**
 * Prepara o modal de configuração de acordo com o relatório escolhido
 * @param {string} type - Identificador do relatório (ex: 'pessoas_lista')
 */
window.openReportConfig = async (type) => {
  const $container = $("#reportFiltersArea");
  const $title = $("#reportTitle");
  const $desc = $("#reportDesc");

  defaultReportUI.currentType = type;

  // Feedback visual de carregamento dentro do modal
  $container.html('<div class="text-center py-4"><span class="loader"></span></div>');
  $("#modalReportConfig").modal("show");

  let html = "";

  switch (type) {
    case "pessoas_lista":
      defaultReportUI.currentTitle = "Lista Geral de Pessoas";
      $desc.text("Gera uma listagem completa baseada em vínculos e status.");
      html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold small">FILTRAR POR FUNÇÃO:</label>
                        <select id="filter_role" class="form-control">
                            <option value="">Todas as Funções</option>
                            <option value="PRIEST">Clero</option>
                            <option value="CATECHIST">Catequistas</option>
                            <option value="STUDENT">Catequizandos</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold small">STATUS:</label>
                        <select id="filter_status" class="form-control">
                            <option value="1">Ativos</option>
                            <option value="0">Inativos</option>
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold small">GÊNERO:</label>
                        <select id="filter_gender" class="form-control">
                            <option value="">Todos</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                </div>`;
      break;

    case "aniversariantes":
      defaultReportUI.currentTitle = "Aniversariantes do Mês";
      $desc.text("Lista de aniversariantes para mural e felicitações.");
      const currentMonth = new Date().getMonth() + 1;
      html = `
                <div class="col-12">
                    <label class="form-label fw-bold small">SELECIONE O MÊS:</label>
                    <select id="filter_month" class="form-control">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
                          .map(
                            (m) => `
                            <option value="${m}" ${m == currentMonth ? "selected" : ""}>
                                ${new Date(0, m - 1).toLocaleString("pt-BR", { month: "long" }).toUpperCase()}
                            </option>`,
                          )
                          .join("")}
                    </select>
                </div>`;
      break;

    case "lista_presenca":
      defaultReportUI.currentTitle = "Diário de Classe (Em Branco)";
      $desc.text("Gera a folha de chamada oficial para as turmas.");
      try {
        // Busca turmas ativas
        const res = await window.ajaxValidator({
          validator: "getTeacherClasses",
          token: defaultApp.userInfo.token,
          org_id: localStorage.getItem("tf_active_parish"),
          year_id: localStorage.getItem("sys_active_year"),
        });

        // Injeta metadados no data-attribute para o cabeçalho do relatório
        let options = res.data
          .map((t) => {
            const metaStr = JSON.stringify({
              class_name: t.class_name,
              course_name: t.course_name,
              location_name: t.location_name,
              year_name: t.year_name,
              coordinator_name: t.coordinator_name || "Não Informado",
            });
            return `<option value="${t.class_id}" data-meta='${metaStr}'>${t.class_name}</option>`;
          })
          .join("");

        html = `
                    <div class="col-12">
                        <label class="form-label fw-bold small">TURMA:</label>
                        <select id="filter_class" class="form-control">
                            <option value="">Selecione a turma...</option>
                            ${options}
                        </select>
                    </div>`;
      } catch (e) {
        html = '<div class="alert alert-danger">Erro ao carregar turmas.</div>';
      }
      break;

    case "auditoria":
      defaultReportUI.currentTitle = "Log de Auditoria";
      $desc.text("Histórico recente de operações de banco de dados.");
      html = '<div class="alert alert-info border-0 small shadow-sm">Este relatório lista as últimas 100 alterações do sistema.</div>';
      break;

    case "ficha_cadastral_vazia":
      defaultReportUI.currentTitle = "Ficha Cadastral (Template)";
      $desc.text("Documento em branco para preenchimento manual.");
      html = '<div class="alert alert-info border-0 small shadow-sm">Documento pronto para geração.</div>';
      break;
  }

  $title.text(defaultReportUI.currentTitle);
  $container.html(html);
};

// =========================================================
// 2. PROCESSAMENTO (DISPARO PARA O BUILDER)
// =========================================================

/**
 * Coleta filtros e dispara a geração via ReportBuilder
 * @param {string} action - 'view' ou 'download'
 */
window.processReport = async (action) => {
  // 1. Captura metadados contextuais da seleção
  const $classSelect = $("#filter_class");
  let selectedMeta = {};
  if ($classSelect.length && $classSelect.val()) {
    selectedMeta = $classSelect.find(":selected").data("meta") || {};
  }

  const config = {
    type: defaultReportUI.currentType,
    title: defaultReportUI.currentTitle,
    filters: {
      role: $("#filter_role").val(),
      status: $("#filter_status").val(),
      gender: $("#filter_gender").val(),
      month: $("#filter_month").val(),
      class_id: $("#filter_class").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year_id: localStorage.getItem("sys_active_year"),
    },
    // Metadados iniciais para o motor HTML
    meta: {
      class_name: selectedMeta.class_name || "Geral",
      course_name: selectedMeta.course_name || "N/A",
      location_name: selectedMeta.location_name || "Sede",
      year_name: selectedMeta.year_name || localStorage.getItem("sys_active_year"),
      coordinator_name: selectedMeta.coordinator_name || "Secretaria",
      total_meetings: "10",
    },
  };

  // 2. Chama o Builder para processar o HTML e disparar a impressão
  await ReportBuilder.generate(action, config);

  $("#modalReportConfig").modal("hide");
};
