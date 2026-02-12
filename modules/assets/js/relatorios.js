const { jsPDF } = window.jspdf;

// Estado Global do Relatório Atual
let currentReportConfig = {
  type: null,
  title: "",
  filters: {},
};

// =========================================================
// 1. CONFIGURAÇÃO E ABERTURA DE MODAL
// =========================================================

/**
 * Abre o modal de configuração baseado no tipo de relatório clicado
 * @param {string} type - O ID do relatório (ex: 'pessoas_lista', 'aniversariantes')
 */
window.openReportConfig = async (type) => {
  currentReportConfig.type = type;
  const $container = $("#reportFiltersArea");
  const $title = $("#reportTitle");
  const $desc = $("#reportDesc");

  $container.html('<div class="text-center py-3"><span class="loader"></span></div>');
  $("#modalReportConfig").modal("show");

  let html = "";

  // --- LÓGICA DE FILTROS POR TIPO ---
  switch (type) {
    case "pessoas_lista":
      currentReportConfig.title = "Lista Geral de Pessoas";
      $desc.text("Gera uma listagem completa com contatos e funções.");
      html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold">Filtrar por Função:</label>
                        <select id="filter_role" class="form-control">
                            <option value="">Todas</option>
                            <option value="STUDENT">Catequizandos</option>
                            <option value="CATECHIST">Catequistas</option>
                            <option value="PRIEST">Clero</option>
                            <option value="PARENT">Pais/Responsáveis</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold">Status:</label>
                        <select id="filter_status" class="form-control">
                            <option value="1">Ativos</option>
                            <option value="0">Inativos</option>
                            <option value="">Todos</option>
                        </select>
                    </div>
                    <div class="col-6">
                        <label class="form-label fw-bold">Gênero:</label>
                        <select id="filter_gender" class="form-control">
                            <option value="">Todos</option>
                            <option value="M">Masculino</option>
                            <option value="F">Feminino</option>
                        </select>
                    </div>
                </div>`;
      break;

    case "aniversariantes":
      currentReportConfig.title = "Aniversariantes do Mês";
      $desc.text("Lista pessoas que fazem aniversário no período selecionado.");
      const currentMonth = new Date().getMonth() + 1;
      html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold">Selecione o Mês:</label>
                        <select id="filter_month" class="form-control">
                            <option value="1" ${currentMonth == 1 ? "selected" : ""}>Janeiro</option>
                            <option value="2" ${currentMonth == 2 ? "selected" : ""}>Fevereiro</option>
                            <option value="3" ${currentMonth == 3 ? "selected" : ""}>Março</option>
                            <option value="4" ${currentMonth == 4 ? "selected" : ""}>Abril</option>
                            <option value="5" ${currentMonth == 5 ? "selected" : ""}>Maio</option>
                            <option value="6" ${currentMonth == 6 ? "selected" : ""}>Junho</option>
                            <option value="7" ${currentMonth == 7 ? "selected" : ""}>Julho</option>
                            <option value="8" ${currentMonth == 8 ? "selected" : ""}>Agosto</option>
                            <option value="9" ${currentMonth == 9 ? "selected" : ""}>Setembro</option>
                            <option value="10" ${currentMonth == 10 ? "selected" : ""}>Outubro</option>
                            <option value="11" ${currentMonth == 11 ? "selected" : ""}>Novembro</option>
                            <option value="12" ${currentMonth == 12 ? "selected" : ""}>Dezembro</option>
                        </select>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-bold">Filtrar por Grupo (Opcional):</label>
                        <select id="filter_role" class="form-control">
                            <option value="">Todos os Grupos</option>
                            <option value="CATECHIST">Apenas Catequistas</option>
                            <option value="STUDENT">Apenas Alunos</option>
                        </select>
                    </div>
                </div>`;
      break;

    case "lista_presenca":
      currentReportConfig.title = "Lista de Presença (Diário)";
      $desc.text("Gera uma folha de chamada para turmas.");

      // Carrega turmas via AJAX antes de mostrar
      try {
        const turmas = await _fetchClassesForSelect();
        let optionsTurma = '<option value="">Selecione a Turma...</option>';
        turmas.forEach((t) => (optionsTurma += `<option value="${t.id}">${t.name}</option>`));

        html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold">Turma:</label>
                        <select id="filter_class" class="form-control">${optionsTurma}</select>
                    </div>
                    <div class="col-12">
                        <label class="form-label fw-bold">Modelo:</label>
                        <select id="filter_model" class="form-control">
                            <option value="blank">Em Branco (Para Preencher)</option>
                            <option value="filled">Preenchido (Histórico)</option>
                        </select>
                    </div>
                </div>`;
      } catch (e) {
        html = `<div class="alert alert-danger">Erro ao carregar turmas.</div>`;
      }
      break;

    case "ficha_cadastral_vazia":
      currentReportConfig.title = "Ficha Cadastral (Em Branco)";
      $desc.text("Imprime uma ficha padrão para preenchimento manual.");
      html = `<div class="alert alert-info border-0 shadow-sm"><i class="fas fa-info-circle me-2"></i> Este relatório não possui filtros. Clique em gerar para baixar o PDF.</div>`;
      break;

    default:
      currentReportConfig.title = "Relatório";
      html = `<p class="text-muted">Configurações padrão.</p>`;
  }

  $title.text(currentReportConfig.title);
  $container.html(html);
};

// =========================================================
// 2. GERAÇÃO DE PDF (ENGINE)
// =========================================================

window.generatePDF = async () => {
  const btn = $("#formReport button[type=button]");
  window.setButton(true, btn, "Gerando PDF...");

  try {
    // 1. Coleta Filtros
    const filters = {
      role: $("#filter_role").val(),
      status: $("#filter_status").val(),
      gender: $("#filter_gender").val(),
      month: $("#filter_month").val(),
      class_id: $("#filter_class").val(),
      model: $("#filter_model").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year_id: localStorage.getItem("sys_active_year"),
    };

    // Validação específica
    if (currentReportConfig.type === "lista_presenca" && !filters.class_id) {
      throw new Error("Por favor, selecione uma turma.");
    }

    // 2. Busca Dados no Backend
    const result = await window.ajaxValidator({
      validator: "getReportData",
      token: defaultApp.userInfo.token,
      report_type: currentReportConfig.type,
      filters: filters,
    });

    if (!result.status) throw new Error(result.alert || "Sem dados para exibir.");

    // 3. Inicializa jsPDF
    const doc = new jsPDF();
    const data = result.data || [];

    // 4. Constrói o Relatório
    _buildPdfContent(doc, data, filters);

    // 5. Salva
    const filename = `${currentReportConfig.type}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);

    $("#modalReportConfig").modal("hide");
    window.alertDefault("Relatório gerado com sucesso!", "success");
  } catch (e) {
    console.error(e);
    window.alertDefault(e.message || "Erro ao gerar relatório.", "error");
  } finally {
    window.setButton(false, btn, '<i class="fas fa-print me-2"></i> Gerar PDF');
  }
};

// =========================================================
// 3. CONSTRUTOR DE LAYOUT (TIMBRADO E TABELAS)
// =========================================================

const _buildPdfContent = (doc, data, filters) => {
  const orgName = "Paróquia São José Operário"; // Idealmente viria do defaultApp.userInfo
  const user = defaultApp.userInfo.name_user || "Usuário do Sistema";
  const today = new Date().toLocaleDateString("pt-BR") + " às " + new Date().toLocaleTimeString("pt-BR");

  // --- FUNÇÃO DE CABEÇALHO E RODAPÉ (Timbrado) ---
  const drawTemplate = (data) => {
    const pageCount = doc.internal.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;

    // Cabeçalho
    doc.setFillColor(92, 142, 241); // Azul Principal
    doc.rect(0, 0, 15, doc.internal.pageSize.height, "F"); // Barra lateral decorativa

    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.setFont("helvetica", "bold");
    doc.text(orgName.toUpperCase(), 25, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema de Gestão Pastoral - Trilha da Fé", 25, 26);

    // Título do Relatório
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(currentReportConfig.title, 25, 40);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(25, 45, pageWidth - 15, 45);

    // Rodapé
    doc.setFontSize(8);
    doc.setTextColor(150);
    const footerText = `Gerado por ${user} em ${today}`;
    doc.text(footerText, 25, doc.internal.pageSize.height - 10);
    doc.text(`Página ${data.pageNumber}`, pageWidth - 25, doc.internal.pageSize.height - 10, { align: "right" });
  };

  // --- RENDERIZAÇÃO ESPECÍFICA POR TIPO ---

  if (currentReportConfig.type === "pessoas_lista") {
    // Formata Colunas
    const columns = [
      { header: "Nome", dataKey: "full_name" },
      { header: "Perfil", dataKey: "role" },
      { header: "Contato", dataKey: "contact" },
      { header: "Status", dataKey: "status_label" },
    ];

    // Processa Dados
    const rows = data.map((item) => ({
      full_name: item.full_name,
      role: _translateRole(item.main_role),
      contact: item.phone_mobile || item.email || "-",
      status_label: item.is_active ? "Ativo" : "Inativo",
    }));

    doc.autoTable({
      columns: columns,
      body: rows,
      startY: 50,
      margin: { left: 25 },
      theme: "grid",
      headStyles: { fillColor: [92, 142, 241] },
      didDrawPage: drawTemplate,
    });
  } else if (currentReportConfig.type === "aniversariantes") {
    const rows = data.map((item) => ({
      day: item.day,
      name: item.full_name,
      age: item.age_turning + " anos",
      contact: item.phone_mobile || "-",
    }));

    doc.autoTable({
      head: [["Dia", "Nome", "Vai fazer", "Contato"]],
      body: rows.map((r) => [r.day, r.name, r.age, r.contact]),
      startY: 50,
      margin: { left: 25 },
      theme: "striped",
      headStyles: { fillColor: [246, 194, 62], textColor: [50, 50, 50] }, // Amarelo para festa
      didDrawPage: drawTemplate,
    });
  } else if (currentReportConfig.type === "lista_presenca") {
    // Se for modelo em branco, cria linhas vazias
    let body = [];
    if (filters.model === "blank") {
      body = data.map((aluno) => [aluno.full_name, "", "", "", ""]);
    } else {
      // Lógica para preenchido viria aqui
      body = data.map((aluno) => [aluno.full_name, "P", "P", "F", "P"]); // Exemplo dummy
    }

    doc.autoTable({
      head: [["Aluno", "Aula 1", "Aula 2", "Aula 3", "Aula 4"]],
      body: body,
      startY: 50,
      margin: { left: 25 },
      theme: "grid",
      styles: { cellPadding: 4, valign: "middle" },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
      },
      headStyles: { fillColor: [28, 200, 138] }, // Verde
      didDrawPage: drawTemplate,
    });
  } else if (currentReportConfig.type === "ficha_cadastral_vazia") {
    drawTemplate({ pageNumber: 1 });

    // Desenha linhas manuais para preenchimento
    let y = 60;
    const line = (label) => {
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(label, 25, y);
      doc.line(25, y + 2, 190, y + 2);
      y += 15;
    };

    doc.setFontSize(14);
    doc.text("Ficha Cadastral", 105, y - 10, { align: "center" });

    line("Nome Completo:");
    line("Endereço:");
    line("Bairro:");
    line("Data de Nascimento:       /       /           Telefone:");
    line("Pai:");
    line("Mãe:");

    y += 10;
    doc.text("Sacramentos:", 25, y);
    y += 10;
    doc.rect(25, y, 5, 5);
    doc.text("Batismo", 32, y + 4);
    doc.rect(70, y, 5, 5);
    doc.text("Eucaristia", 77, y + 4);
    doc.rect(115, y, 5, 5);
    doc.text("Crisma", 122, y + 4);
    doc.rect(160, y, 5, 5);
    doc.text("Matrimônio", 167, y + 4);
  }
};

// =========================================================
// 4. HELPERS E UTILITÁRIOS
// =========================================================

const _fetchClassesForSelect = () => {
  return new Promise((resolve, reject) => {
    // Simulação de chamada ou chamada real
    // window.ajaxValidator({ validator: 'getClasses', ... })...

    // Mock temporário para não travar se não tiver backend pronto
    resolve([
      { id: 1, name: "Eucaristia I - Sábado" },
      { id: 2, name: "Eucaristia II - Domingo" },
      { id: 3, name: "Crisma Jovem" },
    ]);
  });
};

const _translateRole = (role) => {
  const map = {
    STUDENT: "Catequizando",
    CATECHIST: "Catequista",
    PRIEST: "Clero",
    PARENT: "Responsável",
    SECRETARY: "Secretaria",
  };
  return map[role] || role || "Outro";
};

$(document).ready(() => {
  // Inicialização se necessário
});
