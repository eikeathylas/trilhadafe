/**
 * RELATORIOS.JS - O Maestro
 * Orquestra a interface dinâmica, sistema de busca, favoritos e a compilação de impressão.
 */

// ==========================================
// 1. O REGISTRO CENTRAL (Data-Driven UI)
// ==========================================
const DEFAULT_REPORTS = [
    {
        id: 'relatorio_modelo',
        title: 'Modelo',
        description: 'Relatório base para testes de layout e paginação modular.',
        aba: 'Sistema',
        icon: 'biotech',
        badge: 'Novo',
        import: 'modelReport.js',
        function: 'renderModel'
    }
];

// Estado da Aplicação
let activeTab = '';
let searchQuery = '';
let favoriteIds = [];

$(document).ready(function () {
    initMaestro();
});

function initMaestro() {
    loadFavorites();
    renderTabs();
    setupEventListeners();
}

// ==========================================
// 2. SISTEMA DE FAVORITOS (UX 4)
// ==========================================
function loadFavorites() {
    const saved = localStorage.getItem('trilhaDaFe_favReports');
    if (saved) {
        favoriteIds = JSON.parse(saved);
    }
}

window.toggleFavorite = function (event, reportId) {
    event.stopPropagation();

    const index = favoriteIds.indexOf(reportId);
    if (index === -1) {
        favoriteIds.push(reportId);
    } else {
        favoriteIds.splice(index, 1);
    }

    localStorage.setItem('trilhaDaFe_favReports', JSON.stringify(favoriteIds));

    if (searchQuery !== '') {
        renderReports();
    } else {
        renderTabs();
    }
}

// ==========================================
// 3. RENDERIZAÇÃO DE ABAS DINÂMICAS
// ==========================================
function renderTabs() {
    const $pillsTab = $('#pills-tab');
    $pillsTab.empty();

    const abasUnicas = [...new Set(DEFAULT_REPORTS.map(r => r.aba))];
    let tabsHtml = '';

    if (favoriteIds.length > 0) {
        tabsHtml += `
            <li class="nav-item" role="presentation">
                <button class="nav-link rounded-pill px-4 ${activeTab === 'Favoritos' || activeTab === '' ? 'active' : ''}" 
                        data-aba="Favoritos" type="button" role="tab">⭐ Favoritos</button>
            </li>
        `;
        if (activeTab === '') activeTab = 'Favoritos';
    }

    abasUnicas.forEach((aba, index) => {
        if (activeTab === '' && index === 0 && favoriteIds.length === 0) {
            activeTab = aba;
        }

        const isActive = activeTab === aba ? 'active' : '';
        tabsHtml += `
            <li class="nav-item" role="presentation">
                <button class="nav-link rounded-pill px-4 ${isActive}" 
                        data-aba="${aba}" type="button" role="tab">${aba}</button>
            </li>
        `;
    });

    $pillsTab.html(tabsHtml);
    renderReports();
}

// ==========================================
// 4. RENDERIZAÇÃO DE CARDS E BUSCA GLOBAL
// ==========================================
function renderReports() {
    const $container = $('#reportsContainer');
    const $emptyState = $('#emptyState');
    const $navPillsWrapper = $('.nav-pills-wrapper');

    $container.empty();
    let filtered = [];

    if (searchQuery !== '') {
        $navPillsWrapper.hide();
        filtered = DEFAULT_REPORTS.filter(r => {
            return r.title.toLowerCase().includes(searchQuery) ||
                r.description.toLowerCase().includes(searchQuery);
        });
    } else {
        $navPillsWrapper.show();
        if (activeTab === 'Favoritos') {
            filtered = DEFAULT_REPORTS.filter(r => favoriteIds.includes(r.id));
        } else {
            filtered = DEFAULT_REPORTS.filter(r => r.aba === activeTab);
        }
    }

    if (filtered.length === 0) {
        $container.hide();
        $emptyState.show();
        return;
    } else {
        $emptyState.hide();
        $container.show();
    }

    filtered.forEach(r => {
        const isFav = favoriteIds.includes(r.id);
        const starIcon = isFav ? 'star' : 'star_border';
        const starClass = isFav ? 'text-warning' : 'text-muted';

        const badgeHtml = r.badge ? `<span class="badge bg-danger ms-2 align-middle" style="font-size: 0.65em; padding: 0.35em 0.65em;">${r.badge}</span>` : '';

        $container.append(`
            <div class="col-12 col-md-6 col-lg-4">
                <div class="mobile-card h-100 hover-scale shadow-sm cursor-pointer p-3 rounded border" onclick="prepareReportConfig('${r.id}')">
                    <div class="d-flex align-items-start gap-3">
                        
                        <div class="icon-circle bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-flex align-items-center justify-content-center">
                            <span class="material-symbols-outlined">${r.icon}</span>
                        </div>
                        
                        <div class="flex-grow-1 pt-1">
                            <h6 class="fw-bold mb-1 d-flex align-items-center flex-wrap">
                                ${r.title} ${badgeHtml}
                            </h6>
                            <p class="small text-muted mb-0" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${r.description}</p>
                        </div>
                        
                        <div class="ms-auto z-1" onclick="toggleFavorite(event, '${r.id}')" style="margin-top: -2px;">
                            <span class="material-symbols-outlined ${starClass} fs-4 hover-opacity">
                                ${starIcon}
                            </span>
                        </div>

                    </div>
                </div>
            </div>
        `);
    });
}

// ==========================================
// 5. EVENTOS GERAIS
// ==========================================
function setupEventListeners() {

    $('#pills-tab').on('click', 'button', function () {
        $('#pills-tab button').removeClass('active');
        $(this).addClass('active');
        activeTab = $(this).data('aba');
        renderReports();
    });

    const $search = $('#reportSearch');
    const $clearBtn = $('#clearSearchBtn');
    $clearBtn.show();

    $search.on('keyup', function () {
        searchQuery = $(this).val().toLowerCase();
        renderReports();
    });

    $clearBtn.on('click', function () {
        $search.val('');
        searchQuery = '';
        renderReports();
    });
}

// ==========================================
// 6. COMPILAÇÃO E IMPRESSÃO — MOTOR LIMPO
// ==========================================
let currentReportToGenerate = null;

window.prepareReportConfig = function (reportId) {
    const report = DEFAULT_REPORTS.find(r => r.id === reportId);
    if (!report) return;

    currentReportToGenerate = report;

    $('#reportTitle').text(report.title);
    $('#reportDesc').text(report.description);
    $('#reportFiltersArea').html('<p class="text-muted small">Carregando filtros dinâmicos...</p>');

    $('#modalReportConfig').modal('show');
}

$(document).on('click', '#btnGenerateReport', function () {
    if (currentReportToGenerate) {
        compileAndPrintReport(currentReportToGenerate);
    }
});

function compileAndPrintReport(report) {

    $('#modalReportConfig').modal('hide');

    const printWindow = window.open('', '_blank');

    // 🔒 SEUS DADOS — LOGO PRESERVADA
    const dadosParoquia = {
        titulo: report.title,
        organizacao: "Paróquia São João Batista",
        cnpj: "12.345.678/0001-99",
        endereco: "Rua da Matriz, 123 - Centro",
        logo: "assets/img/trilhadafe.png"
    };

    const nomeEmissor = "Administrador do Sistema";

    // 🔒 USA SUAS FUNÇÕES ORIGINAIS
    const theadHTML = buildReportHeader(dadosParoquia);
    const tfootHTML = buildReportFooter({
        emissor: nomeEmissor
    });

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <title>${report.title}</title>
        <link href="assets/css/report-print.css" rel="stylesheet">
    </head>

    <body>

        <button class="fab-print no-print" onclick="window.print()">Imprimir</button>

        <div class="a4-wrapper">
        <table class="master-table">

            <thead>
    <tr><td>
    ${theadHTML}
    </td></tr>
    </thead>

    <tbody>
    <tr><td class="miolo-relatorio">

    <h3 style="margin-top:0;">${report.title}</h3>

    <div style="line-height:1.6;">
    ${'<p>Texto de teste de quebra automática de página.</p>'.repeat(60)}
    </div>

    </td></tr>
    </tbody>

    <tfoot>
    <tr><td>
    ${tfootHTML}
    </td></tr>
    </tfoot>

    </table>
    </div>

    <script>
        function numerarPaginasReal() {
            const footers = document.querySelectorAll('.page-number');
            footers.forEach((el, i) => {
                el.textContent = 'Pág. ' + (i + 1);
            });
        }

        window.addEventListener('load', numerarPaginasReal);
        window.addEventListener('afterprint', numerarPaginasReal);
    </script>


    </body>
    </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}
