/**
 * TRILHA DA FÉ - Motor de Inteligência de Dados e Templates (V7.0)
 * Responsável por: Traduções, Limpeza de Dados e Estrutura HTML Institucional.
 */

const ReportEngine = {
  /**
   * DICIONÁRIO DE TRADUÇÃO (Mapeamento Banco -> Humano)
   * Traduz papéis, vínculos e status para o português paroquial.
   */
  translate: function (term) {
    // Retorna um hífen apenas se o valor for estritamente nulo ou indefinido
    if (term === undefined || term === null || term === "") return "-";

    const dictionary = {
      // Papéis e Funções
      PRIEST: "Clero / Padre",
      SECRETARY: "Secretaria",
      CATECHIST: "Catequista",
      STUDENT: "Catequizando",
      PARENT: "Responsável / Familiar",
      VENDOR: "Fornecedor / Externo",

      // Status e Estados (Correção para mapeamento de valores booleanos e numéricos)
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      1: "Ativo",
      0: "Inativo",
      TRUE: "Ativo",
      FALSE: "Inativo",

      // Gênero e Outros
      M: "Masculino",
      F: "Feminino",
      "N/A": "Não Informado",
      PLANNED: "Planejada",
    };

    const key = String(term).toUpperCase().trim();
    return dictionary[key] || term;
  },

  /**
   * LIMPEZA DE ENDEREÇO (Anti-Null)
   * Filtra valores nulos para evitar falhas visuais no cabeçalho.
   */
  cleanAddress: function (org) {
    if (!org) return "Endereço não cadastrado";

    // Filtra partes do endereço removendo strings "null", vazias ou indefinidas
    const components = [org.address_street, org.address_number ? `nº ${org.address_number}` : null, org.address_district, org.address_city, org.address_state].filter((p) => p && String(p).toLowerCase() !== "null" && String(p).trim() !== "");

    return components.length > 0 ? components.join(", ") : "Endereço não cadastrado";
  },

  /**
   * TEMPLATE: CABEÇALHO INSTITUCIONAL
   * Gera o topo do documento com logo e dados da paróquia.
   */
  getHeaderHTML: function (org) {
    const logoPath = "assets/img/trilhadafe.png";
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
   * Organiza as informações contextuais do relatório.
   */
  getMetadataHTML: function (meta) {
    // Cálculo inteligente de lotação percentual
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
