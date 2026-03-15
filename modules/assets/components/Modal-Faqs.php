<div class="modal fade" id="duvidasFrequentes" aria-hidden="true" aria-labelledby="duvidas_frequentesLabel" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

      <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
        <h1 class="modal-title fs-4 fw-bold text-white d-flex align-items-center" id="duvidas_frequentesLabel">
          <i class="fas fa-circle-question me-3 opacity-75"></i> Central de Ajuda
        </h1>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body p-4" style="max-height: 75vh; overflow-y: auto;">

        <style>
          #accordionDuvidas .accordion-item {
            border: 1px solid rgba(0, 0, 0, 0.05) !important;
            border-radius: 12px !important;
            margin-bottom: 12px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.5);
            transition: all 0.3s ease;
          }

          [data-theme="escuro"] #accordionDuvidas .accordion-item {
            background: rgba(30, 41, 59, 0.4);
            border-color: rgba(255, 255, 255, 0.05) !important;
          }

          #accordionDuvidas .accordion-button {
            background: transparent !important;
            box-shadow: none !important;
            font-weight: 600;
            padding: 1.25rem;
            color: var(--bs-body-color);
          }

          #accordionDuvidas .accordion-button:not(.collapsed) {
            color: var(--bs-primary);
          }

          #accordionDuvidas .accordion-button::after {
            background-size: 1rem;
          }

          #accordionDuvidas .accordion-body {
            padding-top: 0;
            color: var(--bs-secondary-color);
            line-height: 1.6;
          }
        </style>

        <div class="accordion accordion-flush" id="accordionDuvidas">

          <div class="accordion-item shadow-sm">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1">
                <i class="fas fa-user-plus me-3 text-primary opacity-75"></i> Como cadastrar fiéis ou catequistas?
              </button>
            </h2>
            <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Todo cadastro começa no <span class="fw-bold text-primary">Diretório de Pessoas</span>. Preencha os dados e defina o vínculo. É o "Prontuário Único" que centraliza toda a vida do fiel no sistema.
                <div class="mt-3">
                  <a href="pessoas.php" class="btn btn-sm btn-light border fw-bold px-3 rounded-pill text-primary">
                    <i class="fas fa-external-link-alt me-2"></i> Abrir Pessoas
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3">
                <i class="fas fa-book-open me-3 text-primary opacity-75"></i> Sou Catequista. Como faço a chamada?
              </button>
            </h2>
            <div id="collapse3" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Acesse <span class="fw-bold text-primary">Escola da Fé > Diário</span>. Escolha sua turma, clique em "Acessar" e marque a presença. Lembre-se de registrar o tema da aula para gerar relatórios futuros.
                <div class="mt-3">
                  <a href="diario.php" class="btn btn-sm btn-light border fw-bold px-3 rounded-pill text-primary">
                    <i class="fas fa-external-link-alt me-2"></i> Meus Diários
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4">
                <i class="fas fa-school me-3 text-primary opacity-75"></i> Como abrir novas turmas?
              </button>
            </h2>
            <div id="collapse4" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Em <span class="fw-bold text-primary">Gestão de Turmas</span>, clique em "Nova Turma". Defina o Ano Letivo, o Curso e vincule o Catequista responsável e a sala de aula.
                <div class="mt-3">
                  <a href="turmas.php" class="btn btn-sm btn-light border fw-bold px-3 rounded-pill text-primary">
                    <i class="fas fa-external-link-alt me-2"></i> Gerenciar Turmas
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm border-primary border-opacity-25" style="background: rgba(37, 211, 102, 0.05) !important;">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse12">
                <i class="fab fa-whatsapp me-3 text-success"></i> Dúvida Técnica ou Erro?
              </button>
            </h2>
            <div id="collapse12" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Se encontrou algo que não funciona ou precisa de auxílio técnico urgente, chame nosso suporte oficial no WhatsApp.
                <div class="mt-3">
                  <button class="btn btn-success fw-bold px-4 py-2 rounded-pill text-white shadow-sm" onclick="abrirWhatsAppSuporte();">
                    <i class="fab fa-whatsapp me-2"></i> Chamar no Zap
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="modal-footer border-0 p-4">
        <button class="btn btn-light fw-bold px-4 py-2 rounded-3 border w-100 w-md-auto" data-bs-dismiss="modal">
          Entendi, obrigado!
        </button>
      </div>
    </div>
  </div>
</div>