window.renderReportPessoas = function (list, reportId) {
  if (!list || list.length === 0) return `<div class="empty-state-box">Nenhum registro encontrado para os filtros selecionados.</div>`;

  let html = `<table class="modern-table"><thead><tr>
        <th>Nome Completo</th><th>E-mail</th><th>CPF</th><th>Nascimento</th><th>Telefone</th><th style="text-align:center;">Status</th>
    </tr></thead><tbody>`;

  list.forEach((item) => {
    const statusClass = item.is_active === true || item.is_active === "t" || item.is_active === 1 || item.is_active === "1" ? "badge-green" : "badge-red";
    const statusText = item.is_active === true || item.is_active === "t" || item.is_active === 1 || item.is_active === "1" ? "Ativo" : "Inativo";
    const email = item.email ? item.email : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
    const cpf = item.tax_id ? item.tax_id : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
    const nasc = item.birth_date_fmt ? item.birth_date_fmt : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;
    const tel = item.phone_mobile ? item.phone_mobile : `<span style="color:#94a3b8; font-style:italic;">Não disp.</span>`;

    html += `<tr>
            <td style="font-weight:600; color:#0f172a;">${item.full_name}</td>
            <td>${email}</td>
            <td>${cpf}</td>
            <td>${nasc}</td>
            <td>${tel}</td>
            <td style="text-align:center;"><span class="modern-badge ${statusClass}">${statusText}</span></td>
        </tr>`;
  });
  return html + `</tbody></table>`;
};
