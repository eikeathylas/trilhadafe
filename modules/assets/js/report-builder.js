/**
 * TRILHA DA FÉ - Construtor de Relatórios Profissional (V6.0)
 * Responsável por: Processamento de Dados, Gráficos Chart.js e Montagem de Documentos.
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

      // 2. Processa estatísticas para o gráfico moderno
      const chartData = this._processChartData(dataList);

      // 3. Monta o HTML do documento
      const htmlContent = this._assemble(config.type, dataList, org, meta);

      // 4. Dispara a janela de impressão com Gráfico Largo e Moderno
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
   * Calcula a contagem de cada vínculo para alimentar o gráfico horizontal
   */
  _processChartData: function (list) {
    const stats = {};
    list.forEach((item) => {
      // Tradução automática do vínculo vinda do Engine
      const label = ReportEngine.translate(item.main_role || "Outros");
      stats[label] = (stats[label] || 0) + 1;
    });

    return {
      labels: Object.keys(stats),
      datasets: [
        {
          label: "Quantidade de Pessoas",
          data: Object.values(stats),
          backgroundColor: ["#003366", "#3b6cc9", "#718096", "#2d3748", "#4a5568", "#718096"],
          borderRadius: 5,
          barThickness: 20,
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
                
                <div class=\"report-chart-container\">
                    <canvas id=\"reportChart\"></canvas>
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
        thead = `<tr><th>NOME COMPLETO</th><th>FUNÇÃO / VÍNCULO</th><th>CONTACTO</th><th class="text-center">STATUS</th></tr>`;
        tbody = data
          .map((i) => {
            const statusClass = i.is_active == 1 ? "status-ativo" : "status-inativo";
            return `
                        <tr>
                            <td><b>${i.full_name}</b></td>
                            <td>${ReportEngine.translate(i.main_role)}</td>
                            <td>${i.email || "-"}<br><small>${i.phone_mobile || ""}</small></td>
                            <td class="text-center">
                                <span class="badge-status ${statusClass}">${ReportEngine.translate(i.is_active)}</span>
                            </td>
                        </tr>`;
          })
          .join("");
        break;

      // Novos cases podem ser adicionados aqui mantendo o padrão
    }

    return `<table class="report-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  },

  /**
   * Executa a impressão com o Gráfico Horizontal Moderno
   */
  _executePrint: function (html, chartData) {
    const win = window.open("", "_blank");

    win.document.write(`
            <html>
                <head>
                    <title>Relatório - Trilha da Fé</title>
                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                    <link href="assets/css/report-print.css" rel="stylesheet">
                    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                </head>
                <body>
                    ${html}
                    <script>
                        const ctx = document.getElementById('reportChart').getContext('2d');
                        new Chart(ctx, {
                            type: 'bar',
                            data: ${JSON.stringify(chartData)},
                            options: {
                                indexAxis: 'y', // GRÁFICO HORIZONTAL (Moderna Visualização)
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
                                    x: { 
                                        beginAtZero: true, 
                                        grid: { display: false },
                                        ticks: { stepSize: 1, font: { size: 10 } }
                                    },
                                    y: { 
                                        grid: { display: false },
                                        ticks: { 
                                            font: { size: 11, weight: '600' }, 
                                            color: '#2d3748' 
                                        }
                                    }
                                }
                            }
                        });

                        // Aguarda renderização e dispara impressão
                        setTimeout(() => { window.print(); }, 1200);
                    </script>
                </body>
            </html>
        `);
    win.document.close();
  },
};
