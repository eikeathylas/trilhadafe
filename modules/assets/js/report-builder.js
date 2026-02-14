/**
 * TRILHA DA FÉ - Construtor de Relatórios Profissional (V7.0)
 * Responsável por: Processamento de Dados, Gráficos Chart.js e Estrutura de Visualização A4.
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

    // 1. Abertura IMEDIATA para enganar o bloqueador do Safari/iPhone
    const win = window.open("", "_blank");

    if (!win) {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
      return window.alertDefault("Por favor, permita pop-ups para visualizar o relatório.", "error");
    }

    // Coloca um loader temporário na nova janela
    win.document.write("<html><head><title>Carregando...</title></head><body><p style='font-family:sans-serif; text-align:center; margin-top:50px;'>Preparando seu relatório, por favor aguarde...</p></body></html>");

    try {
      // 2. Coleta dados enquanto a janela já está aberta
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

      const chartData = this._processChartData(dataList);
      const htmlContent = this._assemble(config.type, dataList, org, meta);

      // 3. Passa a janela já aberta para a renderização final
      this._executePrint(win, htmlContent, chartData);

      window.alertDefault("Relatório gerado com sucesso!", "success");
    } catch (e) {
      win.close(); // Fecha a aba se der erro na busca dos dados
      window.alertDefault(e.message, "error");
    } finally {
      window.setButton(false, btn, action === "view" ? "Visualizar" : "Imprimir");
    }
  },

  /**
   * Calcula a distribuição de cargos para o gráfico horizontal
   */
  _processChartData: function (list) {
    const stats = {};
    list.forEach((item) => {
      // Usa o tradutor do Engine para os rótulos do gráfico
      const label = ReportEngine.translate(item.main_role || "Outros");
      stats[label] = (stats[label] || 0) + 1;
    });

    return {
      labels: Object.keys(stats),
      datasets: [
        {
          label: "Quantidade",
          data: Object.values(stats),
          backgroundColor: ["#003366", "#3b6cc9", "#718096", "#2d3748", "#4a5568"],
          borderRadius: 5,
          barThickness: 20,
        },
      ],
    };
  },

  /**
   * Monta a estrutura HTML completa do relatório
   */
  _assemble: function (type, data, org, meta) {
    const header = ReportEngine.getHeaderHTML(org); //
    const metadata = ReportEngine.getMetadataHTML(meta); //
    const table = this._buildTableHTML(type, data);

    return `
            <div class="print-container">
                ${header}
                ${metadata}
                
                <div class="report-chart-container">
                    <canvas id="reportChart"></canvas>
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
   * Constrói a tabela com Badges profissionais e Tradução
   */
  _buildTableHTML: function (type, data) {
    let thead = "";
    let tbody = "";

    switch (type) {
      case "pessoas_lista":
        thead = `<tr><th>NOME COMPLETO</th><th>FUNÇÃO / VÍNCULO</th><th>CONTACTO</th><th class="text-center">STATUS</th></tr>`;
        tbody = data
          .map((i) => {
            // Lógica de Badges Profissionais solicitada
            const isAtivo = i.is_active == 1 || i.is_active == true;
            const badgeClass = isAtivo ? "badge bg-success-subtle text-success border border-success" : "badge bg-secondary-subtle text-secondary border border-secondary";

            return `
                <tr>
                    <td><b>${i.full_name}</b></td>
                    <td>${ReportEngine.translate(i.main_role)}</td>
                    <td>${i.email || "-"}<br><small>${i.phone_mobile || ""}</small></td>
                    <td class="text-center">
                        <span class="${badgeClass}">${ReportEngine.translate(i.is_active)}</span>
                    </td>
                </tr>`;
          })
          .join("");
        break;
    }

    return `<table class="report-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  },

  /**
   * Abre a nova aba com estilo A4 e botão flutuante
   */
  _executePrint: function (win, html, chartData) {
    // Limpa o "Carregando..." e injeta o conteúdo real
    win.document.open();
    win.document.write(`
            <html>
                <head>
                    <title>Visualização de Relatório - Trilha da Fé</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link href="assets/css/report-print.css" rel="stylesheet">
                    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body>
                    <button class="floating-print-btn" onclick="window.print()" title="Imprimir Relatório">
                        <i class="fas fa-print fa-lg"></i>
                    </button>
                    ${html}
                    <script>
                        const ctx = document.getElementById('reportChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: ${JSON.stringify(chartData)},
                            options: {
                                indexAxis: 'y',
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    title: {
                                        display: true,
                                        text: 'DISTRIBUIÇÃO DE VÍNCULOS',
                                        font: { size: 14, weight: '800' },
                                        color: '#003366',
                                        padding: { bottom: 15 }
                                    }
                                },
                                scales: {
                                    x: { beginAtZero: true, grid: { display: false } },
                                    y: { grid: { display: false }, ticks: { font: { weight: '600' } } }
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
