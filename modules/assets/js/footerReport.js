/* =====================================================
   FOOTERREPORT.JS — Rodapé padrão do relatório
   - Layout 3 colunas
   - Numeração via JS
   - Compatível com master-table / tfoot
   - Estável para impressão A4
===================================================== */

(function () {

    function formatarDataHoraBR(date) {
        const d = date instanceof Date ? date : new Date();

        const dia = String(d.getDate()).padStart(2, '0');
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const ano = d.getFullYear();

        const hora = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        const seg = String(d.getSeconds()).padStart(2, '0');

        return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
    }

    /**
     * Gera HTML do rodapé
     */
    window.buildReportFooter = function ({
        emissor = "Sistema",
        dataEmissao = new Date(),
        pagina = ""
    } = {}) {

        const dataTxt = formatarDataHoraBR(dataEmissao);

        return `
            <div class="report-footer">

                <div class="report-footer-grid">

                    <div class="report-footer-left">
                        <strong>EMISSOR:</strong> ${emissor}
                    </div>

                    <div class="report-footer-center">
                        <strong>DATA:</strong> ${dataTxt}
                    </div>

                    <div class="report-footer-right page-number">
                        ${pagina}
                    </div>

                </div>

            </div>
        `;
    };

    /**
     * Numera todas as páginas depois que o relatório estiver montado
     * Procura todos os elementos .page-number
     */
    window.numerarPaginasRelatorio = function () {
        const nodes = document.querySelectorAll('.page-number');

        nodes.forEach((el, i) => {
            el.textContent = `Página ${i + 1}`;
        });
    };

})();
