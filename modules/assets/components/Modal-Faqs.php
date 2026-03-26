<!-- data-slug="ajuda.secretary" -->
<!-- data-slug="ajuda.professor" -->

<div class="modal fade" id="duvidasFrequentes" aria-hidden="true" aria-labelledby="duvidas_frequentesLabel" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

    <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

      <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
        <h1 class="modal-title fs-4 fw-bold text-white d-flex align-items-center m-0" id="duvidas_frequentesLabel" style="letter-spacing: -0.5px;">
          <i class="fas fa-circle-question me-3 opacity-75"></i> Central de Ajuda
        </h1>
        <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body p-0 bg-body">
        <div class="accordion accordion-flush" id="accordionDuvidas">

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec1">
                <i class="fas fa-user-plus me-3 text-primary opacity-75 fs-5"></i> Como cadastrar novos fiéis ou catequizandos?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec1" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Todo cadastro começa no <span class="fw-bold text-primary">Gestão de Pessoas</span>. Preencha os dados e defina o vínculo (ex: Catequizando, Fiel). É o "Prontuário Único" que centraliza toda a vida da pessoa no sistema.
                <div class="mt-3">
                  <a href="pessoas.php" class="btn btn-sm text-primary bg-primary bg-opacity-10 hover-scale shadow-none rounded-pill px-3 fw-bold border border-primary border-opacity-25">
                    <i class="fas fa-external-link-alt me-2"></i> Ir para Pessoas
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec2">
                <i class="fas fa-users me-3 text-primary opacity-75 fs-5"></i> Como vincular familiares e responsáveis?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec2" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Na ficha de cadastro de qualquer pessoa, vá até a aba <span class="fw-bold text-body">Família</span>. Pesquise pelo nome do familiar, defina o grau de parentesco e assinale se ele é o Responsável Legal/Financeiro.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.desativado">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec3">
                <i class="fas fa-cross me-3 text-primary opacity-75 fs-5"></i> Como registrar Sacramentos (Batismo, Eucaristia)?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec3" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Na aba <span class="fw-bold text-body">Sacramentos</span> dentro da ficha da pessoa, você pode habilitar quais sacramentos ela já possui, registrando a data e a paróquia onde foram realizados.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec4">
                <i class="fas fa-door-open me-3 text-primary opacity-75 fs-5"></i> Como cadastrar novas salas ou espaços físicos?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec4" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Acesse o menu de <span class="fw-bold text-primary">Organizações</span> e vá na aba <span class="fw-bold text-body">Salas/Espaços</span>. Clique em "Novo Local" para cadastrar salas de catequese, auditórios e listar a infraestrutura disponível (Wi-Fi, Projetor, Ar-Condicionado).
                <div class="mt-3">
                  <a href="organizacao.php" class="btn btn-sm text-primary bg-primary bg-opacity-10 hover-scale shadow-none rounded-pill px-3 fw-bold border border-primary border-opacity-25">
                    <i class="fas fa-external-link-alt me-2"></i> Ir para Organizações
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec5">
                <i class="fas fa-school me-3 text-primary opacity-75 fs-5"></i> Como criar e estruturar novas turmas?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec5" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Em <span class="fw-bold text-primary">Gestão de Turmas</span>, clique em "Nova Turma". É preciso vincular o curso, o Ano Letivo, determinar a sala de aula e atribuir qual Catequista será o responsável por aquele diário.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec6">
                <i class="fas fa-user-graduate me-3 text-primary opacity-75 fs-5"></i> Como matricular alunos nas turmas?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec6" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Após criar a turma em Gestão de Turmas, clique no botão de <span class="fw-bold text-body">Matrículas (ícone de lista)</span> na linha da turma correspondente. Busque o aluno cadastrado previamente e adicione-o à lista de chamada.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.secretary">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec7">
                <i class="fas fa-paperclip me-3 text-primary opacity-75 fs-5"></i> É possível anexar RGs ou Laudos Médicos?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec7" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Sim! Na ficha da Pessoa, acesse a aba <span class="fw-bold text-body">Anexos</span>. O sistema permite o upload seguro de arquivos em PDF ou Imagem, e registra auditoria de qual usuário anexou o documento.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec8">
                <i class="fas fa-history me-3 text-primary opacity-75 fs-5"></i> Como visualizar o histórico de alterações?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec8" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Qualquer tela administrativa possui botões amarelos de <span class="fw-bold text-warning">Auditoria (ícone de relógio)</span>. Ao clicar, o sistema exibe uma linha do tempo mostrando quem alterou a informação, quando alterou, o que estava escrito antes e como ficou depois.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSec9">
                <i class="fas fa-user-slash me-3 text-primary opacity-75 fs-5"></i> O que acontece ao excluir um cadastro?
                <!-- <span class="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill ms-auto badge-perfil">SECRETARIA</span> -->
              </button>
            </h2>
            <div id="collapseSec9" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                O Trilha da Fé utiliza "Soft Delete". Ao excluir, o registro é movido para uma lixeira segura oculta. Nenhuma nota ou frequência antiga do diário será corrompida, garantindo a integridade dos relatórios históricos da paróquia.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm mt-4" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf1">
                <i class="fas fa-book-open me-3 text-info opacity-75 fs-5"></i> Onde encontro a lista da minha turma?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf1" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                No painel lateral, acesse <span class="fw-bold text-info">Escola da Fé > Meu Diário</span>. Lá estarão listadas exclusivamente as turmas às quais a secretaria atribuiu a você como catequista titular.
                <div class="mt-3">
                  <a href="diario.php" class="btn btn-sm text-info bg-info bg-opacity-10 hover-scale shadow-none rounded-pill px-3 fw-bold border border-info border-opacity-25">
                    <i class="fas fa-external-link-alt me-2"></i> Acessar Meu Diário
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf2">
                <i class="fas fa-user-check me-3 text-info opacity-75 fs-5"></i> Como realizar a chamada eletrônica?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf2" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Abra o diário da turma, adicione um <span class="fw-bold text-body">Novo Encontro</span> e selecione a data. A lista de alunos será carregada. Basta alternar as chaves para "Presente" ou "Ausente" e salvar.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf3">
                <i class="fas fa-user-clock me-3 text-info opacity-75 fs-5"></i> É possível justificar faltas?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf3" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Sim. Ao marcar um catequizando como "Ausente" na chamada, o sistema exibe opções para selecionar se a falta é Não Justificada, Justificada (motivos de saúde/viagem) ou se é uma falta recorrente/preocupante.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf4">
                <i class="fas fa-pen-clip me-3 text-info opacity-75 fs-5"></i> Onde informo o tema ensinado na aula?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf4" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Dentro do registro de frequência do encontro, existe a aba <span class="fw-bold text-body">Conteúdo Programático</span>. Lá você descreve o tema bíblico/doutrinário estudado, que integrará os relatórios da pastoral no final do semestre.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.implementar">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf5">
                <i class="fas fa-user-shield me-3 text-info opacity-75 fs-5"></i> Como descubro o contato dos pais do aluno?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf5" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Ao acessar a lista de matriculados da sua turma no Diário, você terá ícones de atalho na frente do nome de cada aluno. Clique em "Família" para visualizar os responsáveis legais e os seus telefones.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf6">
                <i class="fas fa-comment-dots me-3 text-info opacity-75 fs-5"></i> Posso fazer anotações sobre o comportamento?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf6" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Na própria folha de chamada, ao lado do botão de Presença, existe um campo de <span class="fw-bold text-body">Observação Individual</span>. Use-o para reportar atitudes, participações excepcionais ou dificuldades na aprendizagem.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.professor">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf7">
                <i class="fas fa-user-minus me-3 text-info opacity-75 fs-5"></i> O catequizando está na sala mas não na lista!
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf7" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                O catequista não possui permissão de adicionar alunos diretamente no diário. Solicite à <b>Secretaria Paroquial</b> para realizar a matrícula oficial da criança na sua turma. Ela aparecerá na lista instantaneamente.
              </div>
            </div>
          </div>

          <div class="accordion-item shadow-sm" data-slug="ajuda.implementar">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProf8">
                <i class="fas fa-print me-3 text-info opacity-75 fs-5"></i> Consigo imprimir a lista de presença física?
                <!-- <span class="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 rounded-pill ms-auto badge-perfil">CATEQUISTA</span> -->
              </button>
            </h2>
            <div id="collapseProf8" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4">
                Sim. Dentro do painel da sua turma, localize a aba "Relatórios" ou clique no botão de Impressão para gerar um arquivo PDF otimizado contendo os nomes dos alunos em branco, caso queira assinalar em papel e digitalizar depois.
              </div>
            </div>
          </div>

          <div slug class="accordion-item shadow-sm border border-success border-opacity-50 mt-4" style="background: rgba(37, 211, 102, 0.05) !important;">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed py-4" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSuporte">
                <div class="d-flex align-items-center">
                  <div class="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-3 shadow-sm" style="width: 48px; height: 48px;">
                    <i class="fab fa-whatsapp fs-4"></i>
                  </div>
                  <div>
                    <div class="fw-bold text-success fs-5 mb-1" style="letter-spacing: -0.5px;">Dúvida Técnica ou Erro?</div>
                    <div class="text-success opacity-75 small fw-medium" style="font-size: 0.75rem;">Canal Oficial de Atendimento Trilha da Fé</div>
                  </div>
                </div>
              </button>
            </h2>
            <div id="collapseSuporte" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body px-4 pt-2">
                Encontrou algum problema no sistema? A página congelou, os botões sumiram ou você precisa solicitar o cadastro de um recurso novo? <br><br>A nossa equipe de engenharia está pronta para lhe atender pelo <b>WhatsApp Oficial</b>.
                <div class="mt-4 pb-2">
                  <button class="btn btn-success fw-bold px-4 py-2 rounded-pill shadow-sm transition-all hover-scale" onclick="abrirWhatsAppSuporte();">
                    <i class="fab fa-whatsapp me-2 fs-5 align-middle"></i> Chamar Equipe no Zap
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
        <button class="btn btn-light fw-bold px-5 rounded-4 shadow-sm border transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">
          Entendi, fechar ajuda!
        </button>
      </div>

    </div>

  </div>
</div>