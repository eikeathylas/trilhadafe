(function () {
  window.buildReportHeader = function ({ titulo = "Relatório", subtitulo = "", organizacao = "", cnpj = "", endereco = "", logo = "" } = {}) {
    return `
            <div class="report-header">
                <div class="report-header-grid">
                    <div class="header-column-left">
                        ${logo ? `<img src="${logo}" class="report-logo" alt="Logo" />` : ""}
                    </div>
                    <div class="header-column-center">
                        <div class="org-name">${organizacao}</div>
                        ${cnpj ? `<div class="org-info">CNPJ: ${cnpj}</div>` : ""}
                        ${endereco ? `<div class="org-info">${endereco}</div>` : ""}
                    </div>
                    <div class="header-column-right"></div> </div>

                <div class="report-title-section">
                    <h2>${titulo}</h2>
                    ${subtitulo ? `<div class="report-subtitle">${subtitulo}</div>` : ""}
                </div>
            </div>
        `;
  };
})();
