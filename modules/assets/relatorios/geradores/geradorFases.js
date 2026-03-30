window.renderReportFases = function (list, reportId) {
  if (!list || list.length === 0) return `<div class="empty-state-box">Nenhuma fase encontrada.</div>`;
  let html = `<table class="modern-table"><thead><tr><th>Matriz da Fase</th><th>Resumo / Ementa</th><th style="text-align:center;">Utilização</th><th style="text-align:center;">Status</th></tr></thead><tbody>`;
  list.forEach((item) => {
    const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "badge-green" : "badge-gray";
    const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "Ativa" : "Inativa";
    html += `<tr><td style="font-weight:600; color:#0f172a;">${item.fase_name}</td><td style="font-size:8.5pt;">${item.syllabus_summary || "-"}</td><td style="text-align:center;"><span class="modern-badge badge-blue">${item.total_usos} Grade(s)</span></td><td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td></tr>`;
  });
  return html + `</tbody></table>`;
};
