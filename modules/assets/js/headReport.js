/* =====================================================
   HEADREPORT.JS — Cabeçalho padrão do relatório
   - Compatível com thead / table-header-group
   - Logo preservada
   - Layout estável para impressão A4
   - Repetição automática na impressão
===================================================== */

(function () {

    /**
     * Gera HTML do cabeçalho do relatório
     */
    window.buildReportHeader = function ({
        titulo = "Relatório",
        subtitulo = "",
        organizacao = "",
        cnpj = "",
        endereco = "",
        logo = ""
    } = {}) {

        return `
            <div class="report-header">

                <div class="report-header-top">

                    ${logo ? `
                        <div class="report-header-logo">
                            <img src="${logo}" alt="Logo" />
                        </div>
                    ` : ``}

                    <div class="report-header-org">
                        <div class="report-header-org-nome">${organizacao}</div>
                        ${cnpj ? `<div class="report-header-org-cnpj">CNPJ: ${cnpj}</div>` : ""}
                        ${endereco ? `<div class="report-header-org-endereco">${endereco}</div>` : ""}
                    </div>

                </div>

                <div class="report-header-titulo">
                    <h2>${titulo}</h2>
                    ${subtitulo ? `<div class="report-header-subtitulo">${subtitulo}</div>` : ""}
                </div>

            </div>
        `;
    };

})();
