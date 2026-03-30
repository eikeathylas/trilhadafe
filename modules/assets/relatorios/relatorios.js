const DEFAULT_REPORTS = [
  {
    id: "lista_estudantes",
    title: "Listagem de Catequizandos",
    description: "Relação completa de catequizandos (alunos) ativos e inativos.",
    aba: "Pessoas",
    icon: "face",
    slug: "relatorios.estudantes",
    import: "geradores/geradorPessoas.js",
    function: "renderReportPessoas",
  },
  {
    id: "lista_professores",
    title: "Listagem de Catequistas",
    description: "Relação de todos os professores, catequistas e auxiliares.",
    aba: "Pessoas",
    icon: "record_voice_over",
    slug: "relatorios.professores",
    import: "geradores/geradorPessoas.js",
    function: "renderReportPessoas",
  },
  {
    id: "lista_pessoas",
    title: "Listagem Geral (Diretório)",
    description: "Diretório completo de todas as pessoas cadastradas na paróquia.",
    aba: "Pessoas",
    icon: "group",
    slug: "relatorios.pessoas",
    import: "geradores/geradorPessoas.js",
    function: "renderReportPessoas",
  },
  {
    id: "lista_pendencias",
    title: "Listagem de Pendências",
    description: "Catequizandos com documentação ausente (RG/CPF) ou dados incompletos.",
    aba: "Secretaria",
    icon: "assignment_late",
    badge: "Novidade",
    slug: "relatorios.pendencias",
    import: "geradores/geradorPendencias.js",
    function: "renderReportPendencias",
  },
  {
    id: "lista_encontros",
    title: "Listagem de Encontros",
    description: "Histórico de encontros catequéticos e sessões de diário realizadas.",
    aba: "Acadêmico",
    icon: "event_note",
    slug: "relatorios.encontros",
    import: "geradores/geradorEncontros.js",
    function: "renderReportEncontros",
  },
  {
    id: "lista_turmas",
    title: "Listagem de Turmas",
    description: "Relação de turmas ativas, seus coordenadores e contagem de alunos.",
    aba: "Acadêmico",
    icon: "class",
    slug: "relatorios.turmas",
    import: "geradores/geradorTurmas.js",
    function: "renderReportTurmas",
  },
  {
    id: "lista_fases",
    title: "Listagem de Fases",
    description: "Matriz das Fases da Iniciação (antigas disciplinas) cadastradas.",
    aba: "Acadêmico",
    icon: "account_tree",
    slug: "relatorios.fases",
    import: "geradores/geradorFases.js",
    function: "renderReportFases",
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
  } catch (e) {}

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

let currentReportToGenerate = null;

window.prepareReportConfig = function (reportId) {
  const report = DEFAULT_REPORTS.find((r) => r.id === reportId);
  if (!report) return;

  currentReportToGenerate = report;
  $("#reportTitle").text(report.title);
  $("#reportDesc").text(report.description);

  let htmlFiltros = `
      <div class="row g-3">
          <div class="col-12 col-md-8">
              <label class="form-label fw-bold small text-muted text-uppercase mb-2">Filtrar por Nome (Opcional)</label>
              <input type="text" id="report_filter_search" class="form-control border bg-white rounded-3 shadow-none px-3" placeholder="Deixe em branco para buscar todos..." style="height: 48px;">
          </div>
  `;

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

function getLoggedUserName() {
  try {
    const tfDataStr = localStorage.getItem("tf_data");
    if (tfDataStr) {
      const tfData = JSON.parse(tfDataStr);
      if (tfData && tfData.name_user) return tfData.name_user;
    }
    if (window.defaultApp && window.defaultApp.userInfo && window.defaultApp.userInfo.name_user) {
      return window.defaultApp.userInfo.name_user;
    }
    return "Administrador do Sistema";
  } catch (e) {
    return "Secretaria Paroquial";
  }
}

$(document).on("click", "#btnGenerateReport", async function () {
  if (!currentReportToGenerate) return;
  const btn = $(this);
  const originalHtml = btn.html();

  const filters = {
    search: $("#report_filter_search").val() || "",
    status: $("#report_filter_status").length ? $("#report_filter_status").val() : "ALL",
    org_id: localStorage.getItem("tf_active_parish") || 0,
  };

  btn.html('<i class="fas fa-spinner fa-spin me-2"></i> Processando...').prop("disabled", true);

  try {
    // 1. Busca os Dados na API
    const result = await window.ajaxValidator({
      validator: "getReportData",
      token: window.defaultApp ? window.defaultApp.userInfo.token : localStorage.getItem("tf_token"),
      report_type: currentReportToGenerate.id,
      filters: filters,
    });

    if (result.status) {
      // 2. INJEÇÃO DINÂMICA DO GERADOR DE TABELA (Lazy Loading)
      const scriptPath = "assets/relatorios/" + currentReportToGenerate.import;
      const funcName = currentReportToGenerate.function;

      try {
        if (typeof window[funcName] !== "function") {
          await $.getScript(scriptPath);
        }

        // Chama a função do gerador que acabou de ser carregado
        const generatedHTML = window[funcName](result.data?.list || [], currentReportToGenerate.id);
        compileAndPrintReport(currentReportToGenerate, generatedHTML);
      } catch (scriptError) {
        console.error("Falha ao carregar o módulo do relatório:", scriptError);
        Swal.fire("Erro de Módulo", "O gerador de tabelas deste relatório não foi encontrado no servidor.", "error");
      }
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
        const contentHTML = \`${tableHtmlContent}\`;

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
          let page = createPage();
          root.appendChild(page);
          page.querySelector(".page-body").innerHTML = contentHTML;
          
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
