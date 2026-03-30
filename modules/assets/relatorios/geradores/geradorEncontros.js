window.renderReportEncontros = function (list, reportId) {
  if (!list || list.length === 0) return `<div class="empty-state-box">Nenhum encontro encontrado.</div>`;
  let html = `<table class="modern-table"><thead><tr><th>Data</th><th>Turma / Fase</th><th>Assunto / Tema</th><th style="text-align:center;">Presentes</th></tr></thead><tbody>`;
  list.forEach((item) => {
    html += `<tr><td style="font-weight:600; color:#0f172a; white-space:nowrap;">${item.data_encontro}</td><td><b>${item.turma_name}</b><br><span style="font-size:8pt; color:#64748b;">${item.fase_name}</span></td><td style="font-size:8.5pt;">${item.description || "-"}</td><td style="text-align:center;"><span class="modern-badge badge-blue">${item.total_presentes} Alunos</span></td></tr>`;
  });
  return html + `</tbody></table>`;
};
