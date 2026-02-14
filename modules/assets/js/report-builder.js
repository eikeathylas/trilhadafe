/**
 * TRILHA DA FÉ - Construtor de Relatórios Profissional (V8.1 - Correção de Fluxo)
 * Responsável por: Paginação Física, Alta Nitidez e Compatibilidade iOS.
 */

const ReportBuilder = {
  /**
   * Função Principal de Geração
   * @param {string} action - 'view' ou 'download'
   * @param {object} config - { type, title, filters, meta }
   */
  generate: async function (action, config) {
    const btn = $(`#btn-report-${action}`);
    window.setButton(true, btn, "A processar...");

    // 1. Abertura IMEDIATA para compatibilidade com iPhone/Safari
    const win = window.open("", "_blank");

    if (!win) {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
      return window.alertDefault("Por favor, permita pop-ups para gerar o relatório.", "error");
    }

    // Loader minimalista para evitar saltos de layout iniciais
    win.document.write("<!DOCTYPE html><html><head><title>Processando...</title></head><body style='margin:0;padding:20px;font-family:sans-serif;'>Preparando documento institucional...</body></html>");

    try {
      // 2. Coleta de dados (PHP) e organização
      const [resData, resOrg] = await Promise.all([
        window.ajaxValidator({
          validator: "getReportData",
          token: defaultApp.userInfo.token,
          report_type: config.type,
          filters: config.filters,
        }),
        window.ajaxValidator({
          validator: "getOrgById",
          token: defaultApp.userInfo.token,
          id: config.filters.org_id,
        }),
      ]);

      if (!resData.status) throw new Error(resData.alert || "Erro ao obter dados.");

      const dataList = resData.data.list || [];
      const meta = resData.data.metadata || config.meta;
      const org = resOrg.data || {};

      // 3. Processamento estatístico para o gráfico horizontal
      const chartData = this._processChartData(dataList);

      // 4. Montagem do HTML usando a Tabela Mestre (Paginação Física)
      const htmlContent = this._assemble(config.type, config.title, dataList, org, meta);

      // 5. Renderização final e injeção do botão de impressão manual
      this._renderFinal(win, htmlContent, chartData);

    } catch (e) {
      if (win) win.close();
      window.alertDefault(e.message, "error");
    } finally {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
    }
  },

  /**
   * Calcula a distribuição para o gráfico
   */
  _processChartData: function (list) {
    const stats = {};
    list.forEach((item) => {
      const label = ReportEngine.translate(item.main_role || "Outros");
      stats[label] = (stats[label] || 0) + 1;
    });

    return {
      labels: Object.keys(stats),
      datasets: [{
        label: "Quantidade",
        data: Object.values(stats),
        backgroundColor: "#000", // Preto sólido para nitidez de auditoria
        borderRadius: 4,
        barThickness: 18,
      }],
    };
  },

  /**
   * Monta a estrutura de Tabela Mestre para repetição de cabeçalho
   */
  _assemble: function (type, title, data, org, meta) {
    const headerHTML = ReportEngine.getHeaderHTML(org, title);
    const metadataHTML = ReportEngine.getMetadataHTML(meta);
    const tableHTML = this._buildTableHTML(type, data);

    // Estrutura Mestra: Sem divs intermediárias para não quebrar o cálculo de páginas
    return `
      <table class="master-report-table">
        <thead>
          <tr>
            <td>
              ${headerHTML}
              ${metadataHTML}
            </td>
          </tr>
        </thead>
        
        <tbody>
          <tr>
            <td>
              <div class="report-chart-container">
                <canvas id="reportChart"></canvas>
              </div>
              <div class="report-content">
                ${tableHTML}
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot>
          <tr>
            <td>
              <div class="report-footer">
                <span><b>EMISSOR:</b> ${defaultApp.userInfo.name_user}</span>
                <span class="page-number"></span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>`;
  },

  /**
   * Constrói a tabela de dados com badges de alto contraste
   */
  _buildTableHTML: function (type, data) {
    let thead = "";
    let tbody = "";

    switch (type) {
      case "pessoas_lista":
        thead = `<tr><th>NOME COMPLETO</th><th>VÍNCULO</th><th>CONTATO</th><th class="text-center">STATUS</th></tr>`;
        tbody = data.map((i) => {
          const badgeLabel = ReportEngine.translate(i.is_active);

          return `
                <tr>
                    <td><b>${i.full_name}</b></td>
                    <td>${ReportEngine.translate(i.main_role)}</td>
                    <td>${i.email || "-"}<br><small>${i.phone_mobile || ""}</small></td>
                    <td class="text-center">
                        <span class="badge">${badgeLabel}</span>
                    </td>
                </tr>`;
        }).join("");
        break;
    }
    return `<table class="report-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  },

  /**
   * Renderização final na janela aberta com DOCTYPE para cálculo correto de margens
   */
  _renderFinal: function (win, html, chartData) {
    win.document.open();
    win.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Relatório - Trilha da Fé</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link href="assets/css/report-print.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                    <style>
                        /* Força a limpeza de margens iniciais para evitar a primeira página em branco */
                        html, body { margin: 0; padding: 0; }
                    </style>
                </head>
                <body>
                    <button class="floating-print-btn" onclick="window.print()" title="Imprimir">
                        <i class="fas fa-print fa-lg"></i>
                    </button>
                    
                    <div class="print-container">
                        ${html}
                    </div>
                    
                    <script>
                        const ctx = document.getElementById('reportChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: ${JSON.stringify(chartData)},
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { color: '#000', font: { size: 10, weight: 'bold' } } },
                                    y: { grid: { display: false }, ticks: { color: '#000', font: { weight: 'bold' } } }
                                }
                            }
                        });
                    </script>
                </body>
            </html>
        `);
    win.document.close();
  },
};