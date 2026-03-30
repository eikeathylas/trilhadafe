/**
 * RELATORIOS.JS - O Maestro
 * Interface, Filtros Dinâmicos, Requisições API e Fábrica de Tabelas HTML Modernas.
 */

// ==========================================
// 1. O REGISTRO CENTRAL (Data-Driven UI)
// ==========================================
const DEFAULT_REPORTS = [
  {
    id: "lista_estudantes",
    title: "Listagem de Catequizandos",
    description: "Relação completa de catequizandos (alunos) ativos e inativos.",
    aba: "Pessoas",
    icon: "face",
    slug: "relatorios.estudantes",
  },
  {
    id: "lista_professores",
    title: "Listagem de Catequistas",
    description: "Relação de todos os professores, catequistas e auxiliares.",
    aba: "Pessoas",
    icon: "record_voice_over",
    slug: "relatorios.professores",
  },
  {
    id: "lista_pessoas",
    title: "Listagem Geral (Diretório)",
    description: "Diretório completo de todas as pessoas cadastradas na paróquia.",
    aba: "Pessoas",
    icon: "group",
    slug: "relatorios.pessoas",
  },
  {
    id: "lista_pendencias",
    title: "Listagem de Pendências",
    description: "Catequizandos com documentação ausente (RG/CPF) ou dados incompletos.",
    aba: "Secretaria",
    icon: "assignment_late",
    badge: "Atenção",
    slug: "relatorios.pendencias",
  },
  {
    id: "lista_encontros",
    title: "Listagem de Encontros",
    description: "Histórico de encontros catequéticos e sessões de diário realizadas.",
    aba: "Acadêmico",
    icon: "event_note",
    slug: "relatorios.encontros",
  },
  {
    id: "lista_turmas",
    title: "Listagem de Turmas",
    description: "Relação de turmas ativas, seus coordenadores e contagem de alunos.",
    aba: "Acadêmico",
    icon: "class",
    slug: "relatorios.turmas",
  },
  {
    id: "lista_fases",
    title: "Listagem de Fases",
    description: "Matriz das Fases da Iniciação (antigas disciplinas) cadastradas.",
    aba: "Acadêmico",
    icon: "account_tree",
    slug: "relatorios.fases",
  },
  {
    id: "relatorio_modelo",
    title: "Modelo de Teste e Design",
    description: "Relatório base para testes de layout tabular e quebra de páginas.",
    aba: "Sistema",
    icon: "biotech",
    slug: "relatorios.modelo",
  },
];

let activeTab = "";
let searchQuery = "";
let favoriteIds = [];

$(document).ready(function () {
  initMaestro();
});

function initMaestro() {
  loadFavorites();
  renderTabs();
  setupEventListeners();
}

function getPermittedReports() {
  let allowedSlugs = [];
  try {
    let access = localStorage.getItem("tf_access");
    if (access) {
      let parsed = JSON.parse(access);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      allowedSlugs = Array.isArray(parsed) ? parsed.map((a) => a.slug) : [];
    }
  } catch (e) { }

  return DEFAULT_REPORTS.filter((report) => {
    return !report.slug || allowedSlugs.includes(report.slug) || allowedSlugs.includes("master");
  });
}

function loadFavorites() {
  const saved = localStorage.getItem("trilhaDaFe_favReports");
  if (saved) favoriteIds = JSON.parse(saved);
}

window.toggleFavorite = function (event, reportId) {
  event.stopPropagation();
  const index = favoriteIds.indexOf(reportId);
  if (index === -1) favoriteIds.push(reportId);
  else favoriteIds.splice(index, 1);
  localStorage.setItem("trilhaDaFe_favReports", JSON.stringify(favoriteIds));
  if (searchQuery !== "") renderReports();
  else renderTabs();
};

function renderTabs() {
  const $pillsTab = $("#pills-tab");
  $pillsTab.empty();

  const permittedReports = getPermittedReports();
  const abasUnicas = [...new Set(permittedReports.map((r) => r.aba))];
  const hasPermittedFavs = favoriteIds.some((id) => permittedReports.find((r) => r.id === id));

  let tabsHtml = "";
  if (hasPermittedFavs) {
    tabsHtml += `<li class="nav-item"><button class="nav-link rounded-pill px-4 ${activeTab === "Favoritos" || activeTab === "" ? "active" : ""}" data-aba="Favoritos">⭐ Favoritos</button></li>`;
    if (activeTab === "") activeTab = "Favoritos";
  } else if (activeTab === "Favoritos") activeTab = "";

  abasUnicas.forEach((aba, index) => {
    if (activeTab === "" && index === 0 && !hasPermittedFavs) activeTab = aba;
    const isActive = activeTab === aba ? "active" : "";
    tabsHtml += `<li class="nav-item"><button class="nav-link rounded-pill px-4 ${isActive}" data-aba="${aba}">${aba}</button></li>`;
  });

  $pillsTab.html(tabsHtml);
  renderReports();
}

function renderReports() {
  const $container = $("#reportsContainer");
  const $emptyState = $("#emptyState");
  const $navPillsWrapper = $(".nav-pills-wrapper");

  $container.empty();
  let filtered = [];
  const permittedReports = getPermittedReports();

  if (searchQuery !== "") {
    $navPillsWrapper.hide();
    filtered = permittedReports.filter((r) => r.title.toLowerCase().includes(searchQuery) || r.description.toLowerCase().includes(searchQuery));
  } else {
    $navPillsWrapper.show();
    if (activeTab === "Favoritos") filtered = permittedReports.filter((r) => favoriteIds.includes(r.id));
    else filtered = permittedReports.filter((r) => r.aba === activeTab);
  }

  if (filtered.length === 0) {
    $container.hide();
    $emptyState.show();
    return;
  } else {
    $emptyState.hide();
    $container.show();
  }

  filtered.forEach((r) => {
    const isFav = favoriteIds.includes(r.id);
    const starIcon = isFav ? "star" : "star_border";
    const starClass = isFav ? "text-warning" : "text-muted opacity-50";
    const badgeHtml = r.badge ? `<span class="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 ms-2 align-middle fw-bold" style="font-size: 0.65em; padding: 0.35em 0.65em;">${r.badge}</span>` : "";

    $container.append(`
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card clickable h-100 p-1" onclick="prepareReportConfig('${r.id}')">
                <div class="card-body p-3 d-flex align-items-start gap-3">
                    <div class="icon-circle bg-primary bg-opacity-10 text-primary shadow-sm border border-primary border-opacity-25" style="width: 48px; height: 48px;">
                        <span class="material-symbols-outlined fs-4">${r.icon}</span>
                    </div>
                    <div class="flex-grow-1 pt-1" style="min-width: 0;">
                        <h6 class="fw-bold mb-1 text-body d-flex align-items-center flex-wrap gap-1">${r.title} ${badgeHtml}</h6>
                        <p class="small text-muted mb-0 lh-sm" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${r.description}</p>
                    </div>
                    <div class="ms-auto z-2 p-1 hover-scale cursor-pointer" onclick="toggleFavorite(event, '${r.id}')" style="margin-top: -5px; margin-right: -5px;" title="Favoritar">
                        <span class="material-symbols-outlined ${starClass} fs-4">${starIcon}</span>
                    </div>
                </div>
            </div>
        </div>
    `);
  });
}

function setupEventListeners() {
  $("#pills-tab").on("click", "button", function () {
    $("#pills-tab button").removeClass("active");
    $(this).addClass("active");
    activeTab = $(this).data("aba");
    renderReports();
  });
  const $search = $("#reportSearch");
  const $clearBtn = $("#clearSearchBtn");
  $clearBtn.show();
  $search.on("keyup", function () {
    searchQuery = $(this).val().toLowerCase();
    renderReports();
  });
  $clearBtn.on("click", function () {
    $search.val("");
    searchQuery = "";
    renderReports();
  });
}

// ==========================================
// 6. COMPILAÇÃO E IMPRESSÃO COM DESIGN PREMIUM
// ==========================================
let currentReportToGenerate = null;

window.prepareReportConfig = function (reportId) {
  const report = DEFAULT_REPORTS.find((r) => r.id === reportId);
  if (!report) return;

  currentReportToGenerate = report;
  $("#reportTitle").text(report.title);
  $("#reportDesc").text(report.description);

  // Injeta formulário de filtros dinâmicos REAIS baseados no tipo
  let htmlFiltros = `
      <div class="row g-3">
          <div class="col-12 col-md-8">
              <label class="form-label fw-bold small text-muted text-uppercase mb-2">Filtrar por Nome (Opcional)</label>
              <input type="text" id="report_filter_search" class="form-control border bg-white rounded-3 shadow-none px-3" placeholder="Deixe em branco para buscar todos..." style="height: 48px;">
          </div>
  `;

  // Relatório de pendências e encontros não precisam de filtro de status
  if (reportId !== "lista_pendencias" && reportId !== "lista_encontros") {
    htmlFiltros += `
          <div class="col-12 col-md-4">
              <label class="form-label fw-bold small text-muted text-uppercase mb-2">Status</label>
              <select id="report_filter_status" class="form-select border bg-white rounded-3 shadow-none px-3" style="height: 48px;">
                  <option value="ALL" selected>Todos</option>
                  <option value="ACTIVE">Apenas Ativos</option>
                  <option value="INACTIVE">Apenas Inativos</option>
              </select>
          </div>
      `;
  }

  htmlFiltros += `</div>`;
  $("#reportFiltersArea").html(htmlFiltros);
  $("#modalReportConfig").modal("show");
};

// EXTRATOR SEGURO DE NOME DO USUÁRIO LOGADO
function getLoggedUserName() {
  try {
    // 1. Tenta extrair do token JWT direto do navegador
    const token = localStorage.getItem("tf_token");
    if (token) {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(window.atob(base64));
      if (payload.name) return payload.name;
    }
    // 2. Tenta extrair da variável de sessão local
    const tfAccess = localStorage.getItem("tf_user");
    if (tfAccess) {
      const u = JSON.parse(tfAccess);
      if (u.name) return u.name;
    }
    // 3. Fallback do cache do browser
    return localStorage.getItem("tf_name") || "Administrador do Sistema";
  } catch (e) {
    return "Secretaria Paroquial";
  }
}

// CONSTRUTOR DE TABELAS HTML MODERNAS PARA IMPRESSÃO
function buildReportHTML(reportId, list) {
  // O Código de CSS abaixo anula as "duas linhas" do cabeçalho (.report-header-grid) 
  // e aplica o design corporativo premium às tabelas (Cores, zebrado, Badges arredondados).
  let html = `
    <style>
        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; font-family: 'Inter', sans-serif; font-size: 10pt; margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .modern-table thead th { background-color: #f1f5f9; color: #475569; text-transform: uppercase; font-size: 8.5pt; font-weight: 700; letter-spacing: 0.5px; padding: 12px 15px; border-bottom: 2px solid #cbd5e1; text-align: left; }
        .modern-table tbody tr { transition: background-color 0.2s; page-break-inside: avoid; }
        .modern-table tbody tr:nth-child(even) { background-color: #f8fafc; }
        .modern-table tbody td { padding: 12px 15px; color: #334155; vertical-align: middle; border-bottom: 1px solid #e2e8f0; }
        .modern-table tbody tr:last-child td { border-bottom: none; }
        
        .modern-badge { display: inline-flex; align-items: center; justify-content: center; padding: 4px 10px; border-radius: 50rem; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
        .badge-green { background-color: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0; }
        .badge-red { background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .badge-gray { background-color: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .badge-blue { background-color: #dbeafe; color: #2563eb; border: 1px solid #bfdbfe; }
        
        .empty-state-box { text-align: center; padding: 40px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; color: #64748b; font-weight: 600; margin-top: 20px; }

        /* Correção Suprema: Anula o conflito de bordas das duas linhas no topo */
        .report-header-grid { border-bottom: 2px solid #1e293b !important; padding-bottom: 15px !important; margin-bottom: 15px !important; }
        .report-title-section { border-top: none !important; margin-top: 0 !important; padding-top: 0 !important; }
        .report-title-section h2 { margin-top: 0 !important; color: #0f172a; font-size: 16pt; letter-spacing: -0.5px; }
    </style>
    `;

  if (!list || list.length === 0) {
    return html + `<div class="empty-state-box">Nenhum registro encontrado para os filtros selecionados.</div>`;
  }

  html += `<table class="modern-table"><thead><tr>`;

  // Definição Inteligente de Colunas baseada no Tipo
  if (reportId.includes("pessoas") || reportId.includes("estudantes") || reportId.includes("professores") || reportId === "relatorio_modelo") {
    html += `<th>Nome Completo</th><th>E-mail</th><th>CPF</th><th>Nascimento</th><th>Telefone</th><th style="text-align:center;">Status</th></tr></thead><tbody>`;
    list.forEach((item) => {
      const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 || item.is_active === "1" ? "badge-green" : "badge-red";
      const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 || item.is_active === "1" ? "Ativo" : "Inativo";
      const email = item.email ? item.email : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
      const cpf = item.tax_id ? item.tax_id : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
      const nasc = item.birth_date_fmt ? item.birth_date_fmt : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
      const tel = item.phone_mobile ? item.phone_mobile : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;

      html += `<tr>
            <td style="font-weight:600; color:#0f172a;">${item.full_name}</td>
            <td>${email}</td>
            <td>${cpf}</td>
            <td>${nasc}</td>
            <td>${tel}</td>
            <td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    });
  } else if (reportId === "lista_pendencias") {
    html += `<th>Nome Completo</th><th>Telefone</th><th>CPF (Fiscal)</th><th>RG (Identidade)</th></tr></thead><tbody>`;
    list.forEach((item) => {
      const cpf = item.tax_id ? item.tax_id : `<span class="modern-badge badge-red">Pendente</span>`;
      const rg = item.national_id ? item.national_id : `<span class="modern-badge badge-red">Pendente</span>`;
      html += `<tr>
            <td style="font-weight:600; color:#0f172a;">${item.full_name}</td>
            <td>${item.phone_mobile || "-"}</td>
            <td>${cpf}</td>
            <td>${rg}</td>
        </tr>`;
    });
  } else if (reportId === "lista_turmas") {
    html += `<th>Turma</th><th>Curso Base</th><th>Coordenador</th><th style="text-align:center;">Alunos / Vagas</th><th style="text-align:center;">Status</th></tr></thead><tbody>`;
    list.forEach((item) => {
      const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "badge-green" : "badge-gray";
      const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "Ativa" : "Encerrada";
      const capacity = item.max_capacity || "∞";
      html += `<tr>
            <td style="font-weight:600; color:#0f172a;">${item.turma_name}</td>
            <td>${item.curso_name}</td>
            <td>${item.coordinator_name}</td>
            <td style="text-align:center;"><b>${item.total_alunos}</b> / ${capacity}</td>
            <td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    });
  } else if (reportId === "lista_fases") {
    html += `<th>Matriz da Fase</th><th>Resumo / Ementa</th><th style="text-align:center;">Utilização</th><th style="text-align:center;">Status</th></tr></thead><tbody>`;
    list.forEach((item) => {
      const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "badge-green" : "badge-gray";
      const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "Ativa" : "Inativa";
      html += `<tr>
            <td style="font-weight:600; color:#0f172a;">${item.fase_name}</td>
            <td style="font-size:8.5pt;">${item.syllabus_summary || "-"}</td>
            <td style="text-align:center;"><span class="modern-badge badge-blue">${item.total_usos} Grade(s)</span></td>
            <td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
    });
  } else if (reportId === "lista_encontros") {
    html += `<th>Data</th><th>Turma / Fase</th><th>Assunto / Tema</th><th style="text-align:center;">Presentes</th></tr></thead><tbody>`;
    list.forEach((item) => {
      html += `<tr>
            <td style="font-weight:600; color:#0f172a; white-space:nowrap;">${item.data_encontro}</td>
            <td><b>${item.turma_name}</b><br><span style="font-size:8pt; color:#64748b;">${item.fase_name}</span></td>
            <td style="font-size:8.5pt;">${item.description || "-"}</td>
            <td style="text-align:center;"><span class="modern-badge badge-blue">${item.total_presentes} Alunos</span></td>
        </tr>`;
    });
  }

  html += `</tbody></table>`;
  return html;
}

$(document).on("click", "#btnGenerateReport", async function () {
  if (!currentReportToGenerate) return;
  const btn = $(this);
  const originalHtml = btn.html();

  // Coleta filtros da tela
  const filters = {
    search: $("#report_filter_search").val() || "",
    status: $("#report_filter_status").length ? $("#report_filter_status").val() : "ALL",
    org_id: localStorage.getItem("tf_active_parish") || 0,
  };

  btn.html('<i class="fas fa-spinner fa-spin me-2"></i> Processando...').prop("disabled", true);

  try {
    // CHAMADA REAL À API
    const result = await window.ajaxValidator({
      validator: "getReportData",
      token: window.defaultApp ? window.defaultApp.userInfo.token : localStorage.getItem("tf_token"),
      report_type: currentReportToGenerate.id,
      filters: filters,
    });

    if (result.status) {
      const generatedHTML = buildReportHTML(currentReportToGenerate.id, result.data?.list || []);
      compileAndPrintReport(currentReportToGenerate, generatedHTML);
    } else {
      Swal.fire("Falha na Geração", result.alert || "Não foi possível carregar os dados.", "error");
    }
  } catch (error) {
    console.error(error);
    Swal.fire("Erro de Conexão", "Falha ao se comunicar com o banco de dados.", "error");
  } finally {
    btn.html(originalHtml).prop("disabled", false);
  }
});

function compileAndPrintReport(report, tableHtmlContent) {
  $("#modalReportConfig").modal("hide");

  const printWindow = window.open("", "_blank");

  // Dados provisórios da Paróquia (Serão substituídos via API em atualizações futuras)
  const dadosParoquia = {
    titulo: report.title,
    organizacao: "Paróquia São João Batista",
    anoLetivo: "2026",
    cnpj: "12.345.678/0001-99",
    endereco: "Rua da Matriz, 123 - Centro",
    logoDiocese: "assets/img/favicon.png",
    logoParoquia: "assets/img/trilhadafe.png",
  };

  const headerHTML = buildReportHeader(dadosParoquia);

  // Utilizando o extrator rigoroso de identidade do usuário
  const userName = getLoggedUserName();
  const footerHTML = buildReportFooter({ emissor: userName });

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <title>Impressão - ${report.title}</title>
      <link href="assets/css/report-print.css?v=${Date.now()}" rel="stylesheet">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  </head>
  <body>

      <button class="fab-print no-print" onclick="window.print();">
          <span class="material-symbols-outlined">print</span> Imprimir
      </button>

      <div id="reportRoot"></div>

      <script>
        const contentHTML = \`
          ${tableHtmlContent}
        \`;

        function createPage() {
          const page = document.createElement("div");
          page.className = "page";
          page.innerHTML = \`
            <div class="page-header">${headerHTML}</div>
            <div class="page-body"></div>
            <div class="page-footer">${footerHTML}</div>
          \`;
          return page;
        }

        function paginate() {
          const root = document.getElementById("reportRoot");
          const temp = document.createElement("div");
          temp.innerHTML = contentHTML;

          // Injetamos a tabela no corpo e o navegador cuida nativamente da quebra
          // no @media print mantendo a integridade visual dos thead/tbody.
          let page = createPage();
          root.appendChild(page);
          page.querySelector(".page-body").innerHTML = contentHTML;
          
          // Fallback da numeração
          const number = page.querySelector(".page-number");
          if (number) number.textContent = "Pág. 1";
        }

        window.onload = paginate;
      </script>

  </body>
  </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}