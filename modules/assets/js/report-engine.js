/**
 * TRILHA DA FÉ - Motor de Inteligência de Dados e Templates (V5.0)
 * Responsável por: Traduções, Limpeza de Dados e Estrutura HTML Institucional.
 */

const ReportEngine = {
  /**
   * DICIONÁRIO DE TRADUÇÃO (Mapeamento Banco -> Humano)
   * Traduz roles e status definidos no schema do banco.
   */
  translate: function (term) {
    console.log(term)
    if (!term) return "-";

    const dictionary = {
      // Papéis e Funções
      PRIEST: "Clero / Padre",
      SECRETARY: "Secretaria",
      CATECHIST: "Catequista",
      STUDENT: "Catequizando",
      PARENT: "Responsável / Familiar",
      VENDOR: "Fornecedor / Externo",

      // Status e Estados
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      1: "Ativo",
      0: "Inativo",
      TRUE: "Ativo",
      FALSE: "Inativo",
      M: "Masculino",
      F: "Feminino",

      // Cursos e Turmas
      "N/A": "Não Informado",
      PLANNED: "Planejada",
    };

    const key = String(term).toUpperCase().trim();
    return dictionary[key] || term;
  },

  /**
   * LIMPEZA DE ENDEREÇO (Anti-Null)
   * Filtra valores nulos para evitar o erro "null, nº null".
   */
  cleanAddress: function (org) {
    if (!org) return "Endereço não cadastrado";

    // Mapeia partes do endereço e remove o que for "null", "undefined" ou vazio
    const components = [org.address_street, org.address_number ? `nº ${org.address_number}` : null, org.address_district, org.address_city, org.address_state].filter((p) => p && String(p).toLowerCase() !== "null" && String(p).trim() !== "");

    return components.length > 0 ? components.join(", ") : "Endereço não cadastrado";
  },

  /**
   * TEMPLATE: CABEÇALHO INSTITUCIONAL
   */
  getHeaderHTML: function (org) {
    const logoPath = "assets/img/trilhadafe.png"; //
    const address = this.cleanAddress(org);

    return `
            <div class="report-header">
                <div class="logo-box">
                    <img src="${logoPath}" alt="Logo Trilha da Fé">
                </div>
                <div class="org-info">
                    <h2>${org.display_name || "Gestão Pastoral Inteligente"}</h2>
                    <p>${address}</p>
                </div>
            </div>`;
  },

  /**
   * TEMPLATE: GRADE DE METADADOS (3 COLUNAS)
   */
  getMetadataHTML: function (meta) {
    // Cálculo de Lotação com base nos dados do PHP
    let lotacaoLabel = "N/A";
    if (meta.max_capacity) {
      const current = parseInt(meta.current_enrollments) || 0;
      const max = parseInt(meta.max_capacity);
      const percent = Math.round((current / max) * 100);
      lotacaoLabel = `${current}/${max} (${percent}%)`;
    }

    return `
            <div class="metadata-container">
                <div class="meta-item"><b>Turma / Grupo</b><span>${meta.class_name || "Geral"}</span></div>
                <div class="meta-item"><b>Ano Letivo</b><span>${meta.year_name || "2026"}</span></div>
                <div class="meta-item"><b>Lotação Atual</b><span>${lotacaoLabel}</span></div>
                
                <div class="meta-item"><b>Curso / Etapa</b><span>${meta.course_name || "N/A"}</span></div>
                <div class="meta-item"><b>Local</b><span>${meta.location_name || "Sede Paroquial"}</span></div>
                <div class="meta-item"><b>Coordenação</b><span>${this.translate(meta.coordinator_name || "Secretaria")}</span></div>
            </div>`;
  },
};
