<div class="modal fade" id="duvidasFrequentes" aria-hidden="true" aria-labelledby="duvidas_frequentesLabel" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5 text-white" id="duvidas_frequentesLabel">
          <i class="fas fa-question-circle m-2"></i> Central de Ajuda
        </h1>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body" style="max-height: 75vh; overflow-y: auto;">
        <div class="accordion" id="accordionDuvidas">

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse1">
                <i class="fas fa-user m-2 txt-theme"></i> Como cadastrar um novo fiel, aluno ou catequista?
              </button>
            </h2>
            <div id="collapse1" class="accordion-collapse collapse show" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Todo cadastro começa no <strong>Diretório de Pessoas</strong>. Lá você preenche os dados pessoais, endereço e define o vínculo (se é aluno, pai, catequista ou clero). É o "Prontuário Único" do sistema.
                <div class="mt-3 text-end">
                  <a href="pessoas.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Ir para Pessoas</a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3">
                <i class="fas fa-book m-2 txt-theme"></i> Sou Catequista. Como faço a chamada?
              </button>
            </h2>
            <div id="collapse3" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                No menu <strong>Escola da Fé > Diário de Classe</strong>, você verá suas turmas. Clique em "Acessar", selecione a data da aula e marque "Presente" ou "Ausente" para cada aluno. Não esqueça de descrever o tema dado no dia.
                <div class="mt-3 text-end">
                  <a href="diario.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Meus Diários</a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse4">
                <i class="fas fa-chalkboard-teacher m-2 txt-theme"></i> Como abrir novas turmas para o próximo ano?
              </button>
            </h2>
            <div id="collapse4" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Vá em <strong>Gestão de Turmas</strong>. Clique em "Nova Turma", defina o Ano Letivo, o Curso (ex: Eucaristia I) e a Sala. Você também define o horário e o Catequista responsável nesta tela.
                <div class="mt-3 text-end">
                  <a href="turmas.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Gerenciar Turmas</a>
                </div>
              </div>
            </div>
          </div>
<!-- 
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse5">
                <i class="fas fa-church m-2 txt-theme"></i> Como agendar Missas e Intenções?
              </button>
            </h2>
            <div id="collapse5" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Acesse o módulo <strong>Liturgia</strong>. No calendário, clique no dia desejado para agendar uma celebração. Dentro da celebração, você pode adicionar as <strong>Intenções (Súplicas)</strong> dos fiéis e gerar o recibo da oferta.
                <div class="mt-3 text-end">
                  <a href="liturgia.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Agenda Litúrgica</a>
                </div>
              </div>
            </div>
          </div> -->
<!-- 
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse6">
                <i class="fas fa-file-signature m-2 txt-theme"></i> Onde emito Certidões de Batismo?
              </button>
            </h2>
            <div id="collapse6" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Utilize o módulo <strong>Livros de Tombo</strong>. Pesquise pelo nome do fiel. Ao encontrar o registro de batismo, clique no ícone de impressora para gerar o documento oficial com os dados do Livro/Folha/Termo.
                <div class="mt-3 text-end">
                  <a href="sacramentos.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Livros de Tombo</a>
                </div>
              </div>
            </div>
          </div> -->
<!-- 
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse7">
                <i class="fas fa-hand-holding-usd m-2 txt-theme"></i> Como lançar Dízimo e Ofertas?
              </button>
            </h2>
            <div id="collapse7" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                No <strong>Financeiro</strong>, clique em "Nova Entrada". Se for Dízimo, selecione a categoria "Dízimo" e vincule a pessoa. Se for Oferta de Missa, selecione a categoria "Oferta" e vincule (opcionalmente) à celebração do dia.
                <div class="mt-3 text-end">
                  <a href="financeiro.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Caixa</a>
                </div>
              </div>
            </div>
          </div> -->
<!-- 
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse8">
                <i class="fas fa-glass-cheers m-2 txt-theme"></i> Como funciona o sistema da Quermesse?
              </button>
            </h2>
            <div id="collapse8" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Crie o evento em <strong>Eventos e Festas</strong>. Cadastre as Barracas (ex: Pastel, Bebidas). No dia da festa, utilize a tela de "Venda de Fichas/Caixa" para carregar saldo no cartão do fiel. As barracas apenas bipam o cartão para debitar.
                <div class="mt-3 text-end">
                  <a href="eventos.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Gerir Eventos</a>
                </div>
              </div>
            </div>
          </div> -->

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse9">
                <i class="fas fa-building m-2 txt-theme"></i> Preciso cadastrar uma nova Sala ou Capela.
              </button>
            </h2>
            <div id="collapse9" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Vá em <strong>Minha Paróquia</strong> (Configurações). Na aba "Salas e Espaços", você pode cadastrar novos locais, definir a capacidade máxima e se possui recursos como Ar-Condicionado.
                <div class="mt-3 text-end">
                  <a href="organizacao.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Estrutura</a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse10">
                <i class="fas fa-graduation-cap m-2 txt-theme"></i> Como definir o que é ensinado (Grade Curricular)?
              </button>
            </h2>
            <div id="collapse10" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Primeiro cadastre as matérias em <strong>Disciplinas</strong> (ex: Bíblia). Depois vá em <strong>Cursos</strong> (ex: Crisma) e vincule quais disciplinas compõem aquele curso e a carga horária.
                <div class="mt-3 text-end">
                  <a href="cursos.php" class="btn btn-sm btn-outline-primary"><i class="fas fa-arrow-right"></i> Configurar Cursos</a>
                </div>
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse12">
                <i class="fas fa-headset m-2 txt-theme"></i> Erro no sistema ou Dúvida Técnica?
              </button>
            </h2>
            <div id="collapse12" class="accordion-collapse collapse" data-bs-parent="#accordionDuvidas">
              <div class="accordion-body">
                Se encontrou um erro técnico ou precisa de ajuda urgente que não está listada aqui, entre em contato com nosso suporte via WhatsApp.
                <div class="mt-3 text-end">
                  <a class="btn btn-success text-white" target="_blank" href="https://wa.me/5581982549914?text=Olá,%20preciso%20de%20ajuda%20no%20sistema%20Trilha%20da%20Fé.">
                    <i class="fab fa-whatsapp"></i> Falar com Suporte
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div class="modal-footer" style="border-top: 1px solid #dee2e6;">
        <button class="btn btn-secondary text-white" data-bs-dismiss="modal">
          <i class="fas fa-times mr-1"></i> Fechar Ajuda
        </button>
      </div>
    </div>
  </div>
</div>