(function () {
    window.buildReportHeader = function ({ titulo = "Relatório", subtitulo = "", organizacao = "", anoLetivo = "", cnpj = "", endereco = "", logoDiocese = "", logoParoquia = "" } = {}) {
        return `
            <div class="report-header">
                <div class="report-header-grid">
                    <div class="header-column-left">
                        ${logoDiocese ? `<img src="${logoDiocese}" class="report-logo" alt="Logo Diocese" />` : ""}
                    </div>
                    <div class="header-column-center">
                        <div class="org-name">${organizacao}</div>
                        ${anoLetivo ? `<div class="org-info fw-bold mt-1 text-primary">Ano Letivo: ${anoLetivo}</div>` : ""}
                        ${cnpj ? `<div class="org-info">CNPJ: ${cnpj}</div>` : ""}
                        ${endereco ? `<div class="org-info">${endereco}</div>` : ""}
                    </div>
                    <div class="header-column-right text-end">
                        ${logoParoquia ? `<img src="${logoParoquia}" class="report-logo" alt="Logo Paróquia" />` : ""}
                    </div> 
                </div>

                <div class="report-title-section">
                    <h2>${titulo}</h2>
                    ${subtitulo ? `<div class="report-subtitle">${subtitulo}</div>` : ""}
                </div>
            </div>
        `;
    };
})();