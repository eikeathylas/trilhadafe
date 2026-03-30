window.renderReportPendencias = function (list, reportId) {
  if (!list || list.length === 0) return `<div class="empty-state-box">Nenhuma pendência encontrada.</div>`;
  let html = `<table class="modern-table"><thead><tr><th>Nome Completo</th><th>Telefone</th><th>CPF (Fiscal)</th><th>RG (Identidade)</th></tr></thead><tbody>`;
  list.forEach((item) => {
    const cpf = item.tax_id ? item.tax_id : `<span class="modern-badge badge-red">Pendente</span>`;
    const rg = item.national_id ? item.national_id : `<span class="modern-badge badge-red">Pendente</span>`;
    html += `<tr><td style="font-weight:600; color:#0f172a;">${item.full_name}</td><td>${item.phone_mobile || "-"}</td><td>${cpf}</td><td>${rg}</td></tr>`;
  });
  return html + `</tbody></table>`;
};
