const { jsPDF } = window.jspdf;

// Estado Global do Relatório
const defaultReports = {
  currentType: null,
  currentTitle: "",
  lastData: null,
  lastFilters: null,
};

// =========================================================
// 1. CONFIGURAÇÃO E INTERFACE
// =========================================================

/**
 * Abre o modal e injeta os campos de filtro específicos
 */
window.openReportConfig = async (type) => {
  const $container = $("#reportFiltersArea");
  const $title = $("#reportTitle");
  const $desc = $("#reportDesc");

  defaultReports.currentType = type;

  $container.html('<div class="text-center py-4"><span class="loader"></span></div>');
  $("#modalReportConfig").modal("show");

  let html = "";

  switch (type) {
    case "pessoas_lista":
      defaultReports.currentTitle = "Lista Geral de Pessoas";
      $desc.text("Gera uma listagem completa baseada em vínculos e status.");
      html = `
                <div class="row g-3">
                    <div class="col-12">
                        <label class="form-label fw-bold small">FUNÇÃO:</label>
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
      defaultReports.currentTitle = "Aniversariantes do Mês";
      $desc.text("Lista de aniversariantes para mural e felicitações.");
      const currentMonth = new Date().getMonth() + 1;
      html = `
                <div class="col-12">
                    <label class="form-label fw-bold small">SELECIONE O MÊS:</label>
                    <select id="filter_month" class="form-control">
                        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => `<option value="${m}" ${m == currentMonth ? "selected" : ""}>${new Date(0, m - 1).toLocaleString("pt-BR", { month: "long" }).toUpperCase()}</option>`).join("")}
                    </select>
                </div>`;
      break;

    case "lista_presenca":
      defaultReports.currentTitle = "Diário de Classe (Em Branco)";
      $desc.text("Gera a folha de chamada oficial para as turmas.");
      try {
        // Busca turmas ativas para o seletor
        const res = await window.ajaxValidator({
          validator: "getTeacherClasses",
          token: defaultApp.userInfo.token,
          org_id: localStorage.getItem("tf_active_parish"),
          year_id: localStorage.getItem("sys_active_year"),
        });
        let options = res.data.map((t) => `<option value="${t.class_id}">${t.class_name}</option>`).join("");
        html = `
                    <div class="col-12">
                        <label class="form-label fw-bold small">TURMA:</label>
                        <select id="filter_class" class="form-control">
                            <option value="">Selecione...</option>
                            ${options}
                        </select>
                    </div>`;
      } catch (e) {
        html = '<div class="alert alert-danger">Erro ao carregar turmas.</div>';
      }
      break;

    case "auditoria":
      defaultReports.currentTitle = "Log de Auditoria";
      $desc.text("Histórico recente de operações de banco de dados.");
      html = '<div class="alert alert-info border-0 small shadow-sm"><i class="fas fa-info-circle me-1"></i> Este relatório exibe as últimas 100 alterações do sistema.</div>';
      break;

    case "ficha_cadastral_vazia":
      defaultReports.currentTitle = "Ficha Cadastral (Template)";
      $desc.text("Documento em branco para preenchimento manual.");
      html = '<div class="alert alert-info border-0 small shadow-sm"><i class="fas fa-print me-1"></i> Pronto para impressão. Clique em uma das opções abaixo.</div>';
      break;
  }

  $title.text(defaultReports.currentTitle);
  $container.html(html);
};

// =========================================================
// 2. MOTOR DE PROCESSAMENTO (GERAÇÃO E SAÍDA)
// =========================================================

/**
 * Coleta dados do backend e gera o PDF com a ação solicitada
 * @param {string} action - 'view' para abrir em nova aba, 'download' para baixar
 */
window.processReport = async (action) => {
  const btn = $(`#btn-report-${action}`);
  window.setButton(true, btn, action === "view" ? "Processando..." : "Gerando PDF...");

  try {
    const filters = {
      role: $("#filter_role").val(),
      status: $("#filter_status").val(),
      gender: $("#filter_gender").val(),
      month: $("#filter_month").val(),
      class_id: $("#filter_class").val(),
      org_id: localStorage.getItem("tf_active_parish"),
      year_id: localStorage.getItem("sys_active_year"),
    };

    const res = await window.ajaxValidator({
      validator: "getReportData",
      token: defaultApp.userInfo.token,
      report_type: defaultReports.currentType,
      filters: filters,
    });

    if (!res.status) throw new Error(res.alert || "Erro ao buscar dados do relatório.");

    const doc = new jsPDF();
    _buildPdfContent(doc, res.data || [], filters);

    if (action === "view") {
      // Abre o PDF em uma nova aba usando Blob para performance
      const blob = doc.output("bloburl");
      window.open(blob, "_blank");
    } else {
      // Faz o download direto
      const filename = `TF_${defaultReports.currentType}_${new Date().getTime()}.pdf`;
      doc.save(filename);
    }

    $("#modalReportConfig").modal("hide");
    window.alertDefault("Relatório gerado com sucesso!", "success");
  } catch (e) {
    console.error(e);
    window.alertDefault(e.message, "error");
  } finally {
    window.setButton(false, btn, action === "view" ? '<i class="fas fa-eye me-2"></i> Visualizar' : '<i class="fas fa-download me-2"></i> Baixar PDF');
  }
};

// =========================================================
// 3. LAYOUT "PREMIUM" (FIX: doc.polygon removido)
// =========================================================

const _buildPdfContent = (doc, data, filters) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  const cores = {
    primaria: [59, 108, 201], // Azul Escuro
    secundaria: [92, 142, 241], // Azul Celeste
    detalhe: [255, 217, 102], // Dourado
    texto: [44, 62, 80],
  };

  /**
   * Desenha o timbrado dinâmico em cada página
   */
  const drawTemplate = (pageData) => {
    // --- CABEÇALHO GEOMÉTRICO (Referência Infográfico) ---

    // Lado Esquerdo (Azul Escuro)
    doc.setFillColor(cores.primaria[0], cores.primaria[1], cores.primaria[2]);
    doc.triangle(0, 0, pageWidth * 0.45, 0, 0, 45, "F");
    doc.rect(0, 0, pageWidth * 0.35, 35, "F");

    // Lado Direito (Azul Celeste) - CORREÇÃO: Usando triangle em vez de polygon
    doc.setFillColor(cores.secundaria[0], cores.secundaria[1], cores.secundaria[2]);
    doc.triangle(pageWidth, 0, pageWidth * 0.4, 0, pageWidth, 50, "F");

    // Divisória Dourada
    doc.setDrawColor(cores.detalhe[0], cores.detalhe[1], cores.detalhe[2]);
    doc.setLineWidth(1.5);
    doc.line(pageWidth * 0.38, 0, pageWidth * 0.95, 48);

    // --- IDENTIFICAÇÃO DO SISTEMA (LOGO) ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("TRILHA DA FÉ", 15, 20);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("GESTÃO PASTORAL INTELIGENTE", 15, 25);

    // --- INFORMAÇÕES DA UNIDADE (DIREITA) ---
    // Aqui deve-se usar os dados da organização vindo do contexto
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("PARÓQUIA SÃO JOSÉ OPERÁRIO", pageWidth - 15, 12, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("Documento Auditado • Gestão Interna de Dados", pageWidth - 15, 17, { align: "right" });

    // Título Principal
    doc.setTextColor(cores.texto[0], cores.texto[1], cores.texto[2]);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text(defaultReports.currentTitle.toUpperCase(), pageWidth / 2, 60, { align: "center" });

    // --- RODAPÉ COM AUDITORIA ---
    const footerY = pageHeight - 15;
    doc.setDrawColor(230, 230, 230);
    doc.line(15, footerY, pageWidth - 15, footerY);

    doc.setFontSize(7);
    doc.setTextColor(150);
    const now = new Date().toLocaleString("pt-BR");
    const user = defaultApp.userInfo.name_user || "Usuário do Sistema";
    doc.text(`Documento gerado eletronicamente em: ${now} | Emitido por: ${user}`, 15, footerY + 7);
    doc.text(`Página ${pageData.pageNumber} de ${doc.internal.getNumberOfPages()}`, pageWidth - 15, footerY + 7, { align: "right" });
  };

  // Configurações da Tabela
  const tableBase = {
    startY: 70,
    margin: { left: 15, right: 15 },
    theme: "striped",
    headStyles: { fillColor: cores.primaria, textColor: 255, fontStyle: "bold", fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    didDrawPage: drawTemplate,
  };

  // Renderização baseada no tipo de relatório
  if (defaultReports.currentType === "pessoas_lista") {
    doc.autoTable({
      ...tableBase,
      head: [["NOME COMPLETO", "VÍNCULO", "CONTATO", "SITUAÇÃO"]],
      body: data.map((i) => [i.full_name, i.main_role, i.phone_mobile || i.email || "-", i.is_active ? "ATIVO" : "INATIVO"]),
    });
  } else if (defaultReports.currentType === "aniversariantes") {
    doc.autoTable({
      ...tableBase,
      head: [["DIA", "NOME COMPLETO", "IDADE A COMPLETAR", "TELEFONE"]],
      headStyles: { fillColor: cores.detalhe, textColor: 40 }, // Header Dourado
      body: data.map((i) => [i.day, i.full_name, i.age_turning + " ANOS", i.phone_mobile || "-"]),
    });
  } else if (defaultReports.currentType === "auditoria") {
    doc.autoTable({
      ...tableBase,
      head: [["AÇÃO", "TABELA", "ID REG.", "DATA/HORA", "OPERADOR"]],
      body: data.map((i) => [i.action_type, i.table_name, i.record_id, i.date, i.user_name]),
    });
  } else if (defaultReports.currentType === "ficha_cadastral_vazia") {
    drawTemplate({ pageNumber: 1 });
    _drawFichaPlaceholder(doc);
  }
};

/**
 * Desenha campos vazios para preenchimento manual
 */
const _drawFichaPlaceholder = (doc) => {
  let y = 80;
  const line = (label) => {
    doc.setFontSize(9);
    doc.text(label, 15, y);
    doc.setDrawColor(200);
    doc.line(15, y + 2, 195, y + 2);
    y += 12;
  };
  line("NOME COMPLETO:");
  line("DATA DE NASCIMENTO: ____/____/____   SEXO: ( ) M ( ) F");
  line("CPF: _________________________  RG: _________________________");
  line("ENDEREÇO:");
  line("BAIRRO: ______________________ CIDADE: _______________________");
  line("NOME DO PAI:");
  line("NOME DA MÃE:");
};
