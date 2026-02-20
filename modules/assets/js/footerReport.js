(function () {
  function formatarDataHoraBR(date) {
    const d = date instanceof Date ? date : new Date();
    return d.toLocaleString("pt-BR");
  }

  window.buildReportFooter = function ({ emissor = "Sistema", dataEmissao = new Date() } = {}) {
    const dataTxt = formatarDataHoraBR(dataEmissao);
    return `
            <div class="report-footer">
                <div class="footer-line"></div>
                <div class="report-footer-grid">
                    <div class="footer-left"><b>Emissor:</b> ${emissor}</div>
                    <div class="footer-center"><b>Data:</b> ${dataTxt}</div>
                    <div class="footer-right page-number-container"></div>
                </div>
            </div>
        `;
  };
})();
