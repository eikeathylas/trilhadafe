window.renderReportTurmas = function (list, reportId) {
  if (!list || list.length === 0) return `<div class="empty-state-box">Nenhuma turma encontrada.</div>`;
  let html = `<table class="modern-table"><thead><tr><th>Turma</th><th>Curso Base</th><th>Coordenador</th><th style="text-align:center;">Alunos / Vagas</th><th style="text-align:center;">Status</th></tr></thead><tbody>`;
  list.forEach((item) => {
    const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "badge-green" : "badge-gray";
    const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 ? "Ativa" : "Encerrada";
    html += `<tr><td style="font-weight:600; color:#0f172a;">${item.turma_name}</td><td>${item.curso_name}</td><td>${item.coordinator_name}</td><td style="text-align:center;"><b>${item.total_alunos}</b> / ${item.max_capacity || "∞"}</td><td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td></tr>`;
  });
  return html + `</tbody></table>`;
};
