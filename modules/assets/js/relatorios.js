/**
 * TRILHA DA FÉ - Controlador de Interface de Relatórios (V7.0)
 * Responsável por: Gestão de Modais, Injeção de Filtros e Disparo do Builder Profissional.
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
 * Prepara o modal de configuração injetando os campos necessários.
 * @param {string} type - ID do relatório definido na relatorios.php
 */
window.openReportConfig = async (type) => {
  const $container = $("#reportFiltersArea");
  const $title = $("#reportTitle");
  const $desc = $("#reportDesc");

  defaultReportUI.currentType = type;

  // Feedback visual de carregamento
  $container.html('<div class="text-center py-4"><span class="loader"></span></div>');
  $("#modalReportConfig").modal("show");

  let html = "";

  switch (type) {
    case "pessoas_lista":
      defaultReportUI.currentTitle = "Lista Geral de Pessoas";
      $desc.text("Relação completa com estatísticas por cargo e filtros de status.");
      html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold small">FILTRAR POR FUNÇÃO:</label>
                        <select id="filter_role" class="form-control shadow-sm">
                            <option value="">Todas as Funções</option>
                            <option value="PRIEST">Clero / Padres</option>
                            <option value="CATECHIST">Catequistas</option>
                            <option value="STUDENT">Catequizandos</option>
                            <option value="PARENT">Responsáveis</option>
                            <option value="VENDOR">Fornecedores</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold small">STATUS:</label>
                        <select id="filter_status" class="form-control shadow-sm">
                            <option value="1">Apenas Ativos</option>
                            <option value="0">Apenas Inativos</option>
                            <option value="">Todos (Ativos e Inativos)</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold small">GÊNERO:</label>
                        <select id="filter_gender" class="form-control shadow-sm">
                            <option value="">Todos</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                </div>`;
      break;

    case "lista_presenca":
      defaultReportUI.currentTitle = "Diário de Classe";
      $desc.text("Gera a folha de presença oficial com metadados da turma selecionada.");
      try {
        // Busca turmas ativas para o ano corrente
        const res = await window.ajaxValidator({
          validator: "getTeacherClasses",
          token: defaultApp.userInfo.token,
          org_id: localStorage.getItem("tf_active_parish"),
          year_id: localStorage.getItem("sys_active_year"),
        });

        // Mapeia turmas e injeta metadados JSON para o cabeçalho
        let options = res.data
          .map((t) => {
            const metaStr = JSON.stringify({
              class_name: t.class_name,
              course_name: t.course_name,
              location_name: t.location_name,
              year_name: t.year_name,
              coordinator_name: t.coordinator_name || "Secretaria Paroquial",
              max_capacity: t.max_capacity,
              current_enrollments: t.current_enrollments,
            });
            return `<option value="${t.class_id}" data-meta='${metaStr}'>${t.class_name}</option>`;
          })
          .join("");

        html = `
                <div class="col-12">
                    <label class="form-label fw-bold small">SELECIONE A TURMA:</label>
                    <select id="filter_class" class="form-control shadow-sm">
                        <option value="">Escolha uma turma...</option>
                        ${options}
                    </select>
                </div>`;
      } catch (e) {
        html = '<div class="alert alert-danger py-2 small">Falha ao carregar lista de turmas.</div>';
      }
      break;

    case "aniversariantes":
      defaultReportUI.currentTitle = "Aniversariantes do Mês";
      $desc.text("Lista mensal para felicitações e avisos paroquiais.");
      const currentMonth = new Date().getMonth() + 1;
      html = `
                <div class="col-12">
                    <label class="form-label fw-bold small">MÊS DE REFERÊNCIA:</label>
                    <select id="filter_month" class="form-control shadow-sm">
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

    case "auditoria":
      defaultReportUI.currentTitle = "Histórico de Auditoria";
      $desc.text("Exibe os últimos 100 registros de alteração no banco de dados.");
      html = '<div class="alert alert-info border-0 small shadow-sm">Clique em visualizar para processar o log de segurança.</div>';
      break;
  }

  $title.text(defaultReportUI.currentTitle);
  $container.html(html);
};

// =========================================================
// 2. PROCESSAMENTO E DISPARO
// =========================================================

/**
 * Coleta os dados dos inputs e delega para o ReportBuilder.
 * @param {string} action - 'view' ou 'download'
 */
window.processReport = async (action) => {
  // 1. Extração de Metadados Contextuais (Essencial para o cabeçalho A4)
  const $classSelect = $("#filter_class");
  let selectedMeta = {};
  if ($classSelect.length && $classSelect.val()) {
    selectedMeta = $classSelect.find(":selected").data("meta") || {};
  }

  // 2. Objeto de Configuração para o Builder
  const config = {
    type: defaultReportUI.currentType,
    title: defaultReportUI.currentTitle,
    filters: {
      role: $("#filter_role").val() || "",
      status: $("#filter_status").val() || "",
      gender: $("#filter_gender").val() || "",
      month: $("#filter_month").val() || "",
      class_id: $("#filter_class").val() || "",
      org_id: localStorage.getItem("tf_active_parish"),
      year_id: localStorage.getItem("sys_active_year"),
    },
    // Metadados para o grid de 3 colunas
    meta: {
      class_name: selectedMeta.class_name || "Geral / Unidade",
      course_name: selectedMeta.course_name || "N/A",
      location_name: selectedMeta.location_name || "Sede",
      year_name: selectedMeta.year_name || localStorage.getItem("sys_active_year"),
      coordinator_name: selectedMeta.coordinator_name || "Secretaria",
      max_capacity: selectedMeta.max_capacity || null,
      current_enrollments: selectedMeta.current_enrollments || null,
    },
  };

  // 3. Validação de segurança
  if (config.type === "lista_presenca" && !config.filters.class_id) {
    return window.alertDefault("Por favor, selecione uma turma ativa.", "error");
  }

  // 4. Chamada ao Cérebro de Processamento
  await ReportBuilder.generate(action, config);

  // 5. Fecha o modal após o processamento
  $("#modalReportConfig").modal("hide");
};
