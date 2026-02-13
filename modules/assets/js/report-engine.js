const ReportEngine = {
  // Dicionário de tradução para termos do banco
  translate: (term) => {
    const dictionary = {
      STUDENT: "Catequizando",
      CATECHIST: "Catequista",
      PRIEST: "Clero/Padre",
      PARENT: "Responsável",
      SECRETARY: "Secretaria",
      VENDOR: "Fornecedor",
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      MALE: "Masculino",
      FEMALE: "Feminino",
    };
    return dictionary[term] || term;
  },

  getHeader: function (org) {
    // Limpeza de campos null para o endereço
    const partes = [org.address_street, org.address_number, org.address_district, org.address_city].filter(Boolean);
    const endereco = partes.length > 0 ? partes.join(", ") : "Endereço não informado";

    return `
            <div class="report-header">
                <div class="logo-box">
                    <img src="assets/img/trilhadafe.png" alt="Logo">
                </div>
                <div class="org-info">
                    <h2>${org.display_name || "Gestão Pastoral"}</h2>
                    <p>${endereco}</p>
                </div>
            </div>`;
  },

  getMetadataBlock: function (meta) {
    const lotacao = meta.max_capacity ? `${meta.current_enrollments || 0}/${meta.max_capacity} (${Math.round((meta.current_enrollments / meta.max_capacity) * 100)}%)` : "N/A";

    return `
            <div class="metadata-grid">
                <div class="meta-item"><b>Turma / Grupo</b>${meta.class_name || "Geral"}</div>
                <div class="meta-item"><b>Ano Letivo</b>${meta.year_name || "2026"}</div>
                <div class="meta-item"><b>Lotação Atual</b>${lotacao}</div>
                <div class="meta-item"><b>Curso / Etapa</b>${meta.course_name || "N/A"}</div>
                <div class="meta-item"><b>Local</b>${meta.location_name || "Sede"}</div>
                <div class="meta-item"><b>Coordenação</b>${meta.coordinator_name || "Secretaria"}</div>
            </div>`;
  },
};
