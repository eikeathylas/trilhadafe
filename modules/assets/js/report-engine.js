/**
 * TRILHA DA FÉ - Motor de Inteligência de Dados e Templates (V8.1)
 * Responsável por: Traduções, Limpeza de Dados e Cabeçalhos de Alta Nitidez.
 */

const ReportEngine = {
  /**
   * DICIONÁRIO DE TRADUÇÃO (Mapeamento Banco -> Humano)
   * Garante que 100% dos termos técnicos sejam exibidos em português paroquial.
   */
  translate: function (term) {
    if (term === undefined || term === null || term === "") return "-";

    const dictionary = {
      // Funções e Papéis
      'PRIEST': 'Clero / Padre',
      'SECRETARY': 'Secretaria',
      'CATECHIST': 'Catequista',
      'STUDENT': 'Catequizando',
      'PARENT': 'Responsável / Familiar',
      'VENDOR': 'Fornecedor / Externo',

      // Status e Estados (Correção para mapeamento de valores de auditoria)
      'ACTIVE': 'Ativo',
      'INACTIVE': 'Inativo',
      '1': 'Ativo',
      '0': 'Inativo',
      'TRUE': 'Ativo',
      'FALSE': 'Inativo',

      // Atributos Gerais
      'M': 'Masculino',
      'F': 'Feminino',
      'N/A': 'Não Informado',
      'PLANNED': 'Planejada'
    };

    const key = String(term).toUpperCase().trim();
    return dictionary[key] || term;
  },

  /**
   * LIMPEZA DE ENDEREÇO (Anti-Null)
   * Filtra componentes nulos para garantir um cabeçalho limpo e profissional.
   */
  cleanAddress: function (org) {
    if (!org) return "Endereço não cadastrado";

    const components = [
      org.address_street,
      org.address_number ? `nº ${org.address_number}` : null,
      org.address_district,
      org.address_city,
      org.address_state
    ].filter((p) => p && String(p).toLowerCase() !== "null" && String(p).trim() !== "");

    return components.length > 0 ? components.join(", ") : "Endereço não cadastrado";
  },

  /**
   * DATA DE EMISSÃO
   * Gera o carimbo de data e hora para auditoria em cada página.
   */
  getEmissionDate: function () {
    return new Date().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  },

  /**
   * TEMPLATE: CABEÇALHO INSTITUCIONAL DE ALTA NITIDEZ
   * Inclui Logo, Nome do Relatório em destaque e Data de Emissão.
   */
  getHeaderHTML: function (org, reportTitle) {
    const logoPath = "assets/img/trilhadafe.png";
    const address = this.cleanAddress(org);
    const date = this.getEmissionDate();

    return `
      <div class="report-header">
          <div class="logo-box">
              <img src="${logoPath}" alt="Logo Trilha da Fé">
          </div>
          <div class="org-info">
              <h2>${org.display_name || "Gestão Pastoral Inteligente"}</h2>
              <p style="font-weight: 800; font-size: 12pt; margin: 5px 0; text-decoration: underline;">
                ${reportTitle.toUpperCase()}
              </p>
              <p>${address}</p>
              <p style="font-size: 8pt; margin-top: 4px; font-weight: bold;">
                EMISSÃO: ${date}
              </p>
          </div>
      </div>`;
  },

  /**
   * TEMPLATE: GRADE DE METADADOS (3 COLUNAS)
   * Organiza as informações da turma e local com contraste preto no branco.
   */
  getMetadataHTML: function (meta) {
    // Cálculo de lotação com base nos dados do banco
    let lotacaoLabel = "N/A";
    if (meta.max_capacity) {
      const current = parseInt(meta.current_enrollments) || 0;
      const max = parseInt(meta.max_capacity);
      const percent = Math.round((current / max) * 100);
      lotacaoLabel = `${current}/${max} (${percent}%)`;
    }

    return `
      <div class="metadata-container">
          <div class="meta-item"><b>TURMA / GRUPO</b><span>${meta.class_name || "Geral / Todos"}</span></div>
          <div class="meta-item"><b>ANO LETIVO</b><span>${meta.year_name || "2026"}</span></div>
          <div class="meta-item"><b>LOTAÇÃO ATUAL</b><span>${lotacaoLabel}</span></div>
          
          <div class="meta-item"><b>CURSO / ETAPA</b><span>${meta.course_name || "N/A"}</span></div>
          <div class="meta-item"><b>LOCAL / SALA</b><span>${meta.location_name || "Sede Paroquial"}</span></div>
          <div class="meta-item"><b>COORDENAÇÃO</b><span>${this.translate(meta.coordinator_name || "Secretaria")}</span></div>
      </div>`;
  }
};