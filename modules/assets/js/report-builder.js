const ReportBuilder = {
  generate: async function (action, config) {
    const btn = $(`#btn-report-${action}`);
    window.setButton(true, btn, "Gerando...");

    try {
      const [resData, resOrg] = await Promise.all([
        window.ajaxValidator({ validator: "getReportData", token: defaultApp.userInfo.token, report_type: config.type, filters: config.filters }),
        window.ajaxValidator({ validator: "getOrgById", token: defaultApp.userInfo.token, id: config.filters.org_id }),
      ]);

      const html = this._assemble(config.type, resData.data.list, resOrg.data, resData.data.metadata || config.meta);
      this._print(html);
    } catch (e) {
      window.alertDefault("Erro ao gerar relatório", "error");
    } finally {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
    }
  },

  _assemble: function (type, data, org, meta) {
    const table = this._buildTable(type, data);
    return `
            <div class="print-container">
                ${ReportEngine.getHeader(org)}
                ${ReportEngine.getMetadataBlock(meta)}
                <table class="report-table">${table}</table>
                <div class="report-footer">
                    <span>Gerado por ${defaultApp.userInfo.name_user} em ${new Date().toLocaleString()}</span>
                    <span>Trilha da Fé - Gestão Pastoral</span>
                </div>
            </div>`;
  },

  _buildTable: function (type, data) {
    let h = "";
    let b = "";
    if (type === "pessoas_lista") {
      h = `<thead><tr><th>Nome Completo</th><th>Função</th><th>Contato</th><th>Status</th></tr></thead>`;
      b = data.map((i) => `<tr><td>${i.full_name}</td><td>${ReportEngine.translate(i.main_role)}</td><td>${i.email || "-"}<br>${i.phone_mobile || ""}</td><td><span class="${i.is_active ? 'badge bg-success-subtle text-success border-success' : 'badge bg-secondary-subtle text-secondary border-secondary'}">${ReportEngine.translate(i.is_active ? "ACTIVE" : "INACTIVE")}</span></td></tr>`).join("");
    }
    // Adicione outros cases (aniversariantes, etc) seguindo este padrão
    return h + `<tbody>${b}<tbody>`;
  },

  _print: function (html) {
    const win = window.open("", "_blank");
    win.document.write(`
            <html><head><title>Relatório - Trilha da Fé</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <link href="assets/css/report-print.css" rel="stylesheet">
            </head><body onload="setTimeout(() => { window.print(); window.close(); }, 500)">${html}</body></html>`);
    win.document.close();
  },
};
