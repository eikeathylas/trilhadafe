/**
 * TRILHA DA FÉ - Construtor de Relatórios Profissional (V5.0)
 * Responsável por: Processamento de Dados, Gráficos Chart.js e Montagem de Tabelas.
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

    try {
      // 1. Coleta dados e informações da organização em paralelo
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

      // 2. Processa estatísticas para o gráfico (Distribuição de Cargos/Vínculos)
      const chartData = this._processChartData(dataList);

      // 3. Monta o HTML do documento
      const htmlContent = this._assemble(config.type, dataList, org, meta);

      // 4. Dispara a janela de impressão com o Gráfico
      this._executePrint(htmlContent, chartData);

      window.alertDefault("Documento preparado para impressão!", "success");
    } catch (e) {
      console.error("Erro no Builder:", e);
      window.alertDefault(e.message, "error");
    } finally {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
    }
  },

  /**
   * Calcula a contagem de cada vínculo para alimentar o gráfico
   */
  _processChartData: function (list) {
    const stats = {};
    list.forEach((item) => {
      const label = ReportEngine.translate(item.main_role || "Outros");
      stats[label] = (stats[label] || 0) + 1;
    });

    return {
      labels: Object.keys(stats),
      datasets: [
        {
          label: "Quantidade por Vínculo",
          data: Object.values(stats),
          backgroundColor: ["#003366", "#3b6cc9", "#718096", "#2d3748", "#4a5568"],
          borderWidth: 0,
        },
      ],
    };
  },

  /**
   * Monta a estrutura HTML do relatório
   */
  _assemble: function (type, data, org, meta) {
    const header = ReportEngine.getHeaderHTML(org);
    const metadata = ReportEngine.getMetadataHTML(meta);
    const table = this._buildTableHTML(type, data);

    return `
            <div class="print-container">
                ${header}
                ${metadata}
                
                <div class="report-chart-container no-break">
                    <canvas id="reportChart" style="max-width: 450px; max-height: 220px;"></canvas>
                </div>

                <div class="report-content">
                    ${table}
                </div>

                <div class="report-footer">
                    <span>Gerado por ${defaultApp.userInfo.name_user} em ${new Date().toLocaleString("pt-BR")}</span>
                    <span>Trilha da Fé - Gestão Pastoral Inteligente</span>
                </div>
            </div>`;
  },

  /**
   * Constrói a tabela de dados com suporte a múltiplos tipos
   */
  _buildTableHTML: function (type, data) {
    let thead = "";
    let tbody = "";

    switch (type) {
      case "pessoas_lista":
        thead = `<tr><th>Nome Completo</th><th>Vínculo</th><th>Contacto</th><th>Status</th></tr>`;
        tbody = data
          .map((i) => {
            const statusClass = i.is_active == 1 ? "badge bg-success-subtle text-success border-success" : "badge bg-secondary-subtle text-secondary border-secondary";
            return `
                        <tr>
                            <td><b>${i.full_name}</b></td>
                            <td>${ReportEngine.translate(i.main_role)}</td>
                            <td>${i.email || "-"}<br><small>${i.phone_mobile || ""}</small></td>
                            <td><span class="badge-status ${statusClass}">${ReportEngine.translate(i.is_active)}</span></td>
                        </tr>`;
          })
          .join("");
        break;

      // Espaço para novos relatórios (Diário, Auditoria, etc)
    }

    return `<table class="report-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  },

  /**
   * Executa a impressão injetando Chart.js e o CSS de fidelidade
   */
  _executePrint: function (html, chartData) {
    const win = window.open("", "_blank");

    win.document.write(`
            <html>
                <head>
                    <title>Relatório Institucional - Trilha da Fé</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link href="assets/css/report-print.css" rel="stylesheet">
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body>
                    ${html}
                    
                    <script>
                        // Inicializa o gráfico após o carregamento da biblioteca
                        const ctx = document.getElementById('reportChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar', // Pode ser 'pie' ou 'bar' conforme sua preferência
                            data: ${JSON.stringify(chartData)},
                            options: {
                                responsive: true,
                                plugins: {
                                    legend: { position: 'right', labels: { font: { size: 10 } } }
                                },
                                scales: {
                                    y: { beginAtZero: true, grid: { display: false } }
                                }
                            }
                        });

                        // Aguarda a renderização do gráfico e dispara a impressão
                        setTimeout(() => {
                            window.print();
                            // window.close(); // Opcional: fecha a aba após imprimir
                        }, 800);
                    </script>
                </body>
            </html>
        `);
    win.document.close();
  },
};
