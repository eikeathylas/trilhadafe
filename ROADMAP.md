# 🗺️ ROADMAP ESTRATÉGICO — TRILHA DA FÉ

## 📍 VISÃO GERAL DO PRODUTO

O **Trilha da Fé** é um ERP Eclesiástico e plataforma de gestão paroquial em formato SaaS (Multi-tenant).
Ele foi projetado para ser o ecossistema digital central de uma Diocese ou Paróquia. Seu objetivo é unificar a secretaria paroquial (sacramentos), a gestão financeira (dízimo e livro caixa), a administração de eventos (quermesses cashless), a organização pastoral (missas e catequese) e a comunicação com os fiéis (Portal e App).

---

## 📦 ESTADO ATUAL DO SISTEMA

### 🟢 Módulos Implementados (Backend + UI Ativos)

- **Gestão de Pessoas (CRM):** Prontuário único integrando alunos, clero e familiares, com suporte a upload de anexos.
- **Educação / Catequese:** Gestão de turmas, matrículas, matriz curricular, e Diário de Classe Eletrônico.
- **Segurança e Auditoria:** Controle de acesso, perfis dinâmicos e motor de rastreamento de logs contínuo (Audit Trail).

### 🟡 Módulos Parcialmente Implementados (Prontos no Banco, sem Interface)

O banco de dados já possui a fundação arquitetural para:

- **Comunicação interna e Avisos:** Tabelas de posts, notificações direcionadas e leitura.
- **Sacramentos (Batismo/Casamento):** Estrutura relacional para Livros de Tombo, certidões e averbações.
- **Financeiro & Dízimo:** Contas, categorias, fluxo de caixa e gestão de dizimistas.
- **Agenda Pastoral:** Missas e Intenções.
- **Festas e Eventos:** Ingressos, produtos, PDVs e sistema Cashless.

### 🔴 Módulos Ainda Inexistentes (Lacunas Estruturais a serem criadas)

- **Assistente IA (GuIA):** Requer integração com LLMs e base de conhecimento.
- **Módulo Cáritas:** Extensão do CRM atual para gestão de assistidos e doações sociais continuadas.
- **Geolocalização (Mapa):** Integração de coordenadas com APIs externas.
- **Portal dos Pais / Portal do Fiel:** Ecossistema voltado para o usuário final (leitura).
- **Loja / E-commerce:** PDV e controle de estoque de artigos religiosos.

---

## 🚀 ROADMAP DE EVOLUÇÃO

### 📌 VERSÃO 1 — BASE OPERACIONAL E UX (Curto Prazo)

**Foco:** Refinar a experiência das telas atuais e ativar o módulo básico de Comunicação para engajar alunos e professores.

#### 🎛️ Módulo: Interface e Usabilidade

- [ ] **Ajustar abas do modal de usuários**
  - _Descrição:_ Reorganizar informações no padrão "modern-tabs-wrapper".
  - _Objetivo:_ Padronizar a usabilidade com a tela de Pessoas.
  - _Complexidade:_ Baixa

- [ ] **Ajustar Calendário Global (antiga Agenda)**
  - _Descrição:_ Renomear telas e calcular dias da semana dinamicamente no mobile.
  - _Objetivo:_ Clareza semântica e interface mobile fluida.
  - _Complexidade:_ Baixa

- [ ] **Listar ações disponíveis por tela**
  - _Descrição:_ Matriz visual de permissões por usuário no perfil.
  - _Objetivo:_ Transparência e segurança na delegação de acessos.
  - _Complexidade:_ Média

#### 📢 Módulo: Avisos e Comunicação Interna

- [ ] **Sistema Hierárquico de Avisos**
  - _Descrição:_ Interface para disparar notificações (Push/Sistema/Email). Regras de hierarquia: Pároco/Secretaria (Todos/Grupos) e Professor (Apenas Turma).
  - _Objetivo:_ Eliminar ruído no WhatsApp e centralizar a comunicação oficial da Igreja.
  - _Complexidade:_ Média

---

### 📌 VERSÃO 2 — SECRETARIA E ECOSSISTEMA ACADÊMICO (Médio Prazo)

**Foco:** Substituir o papel da secretaria paroquial, ativando os módulos de cartório e integrando os pais ao sistema.

#### 🏛️ Módulo: Sacramentos (Cartório Paroquial)

- [ ] **Gestão de Batismo**
  - _Descrição:_ Inscrição, registro nos Livros de Tombo, autorizações, negativas e emissão de certidões em PDF. Envio automático para Cúria.
  - _Objetivo:_ Digitalizar o arquivo paroquial com busca rápida.
  - _Complexidade:_ Alta

- [ ] **Gestão de Casamento (Matrimônio)**
  - _Descrição:_ Cadastro dos noivos, processo matrimonial, transferências online, licenças, registro no livro e notificações de casamento.
  - _Objetivo:_ Acelerar e digitalizar o trâmite canônico.
  - _Complexidade:_ Alta

- [ ] **Central de Consultas Unificada**
  - _Descrição:_ Pesquisa global indexada de batismos, crismas e casamentos entre paróquias e clero diocesano.
  - _Objetivo:_ Facilitar o trabalho do secretário na busca de registros.
  - _Complexidade:_ Média

#### 👨‍👩‍👧 Módulo: Portal dos Pais

- [ ] **Painel da Família**
  - _Descrição:_ Acesso restrito aos responsáveis para acompanhar progresso, ver conteúdos aplicados, verificar presença e receber notificações/avisos.
  - _Objetivo:_ Transparência pedagógica na catequese e engajamento familiar.
  - _Complexidade:_ Alta

---

### 📌 VERSÃO 3 — GESTÃO FINANCEIRA E LITÚRGICA (Longo Prazo)

**Foco:** Garantir a sustentabilidade, transparência e organização contábil/pastoral da Igreja.

#### 💰 Módulo: Dízimo

- [ ] **Ecossistema do Dizimista**
  - _Descrição:_ Cadastro de dizimistas, registro de contribuições e gerador de carnês.
  - _Objetivo:_ Previsibilidade de receita.
  - _Complexidade:_ Alta

- [ ] **Portal do Dizimista (App)**
  - _Descrição:_ Contribuição via App, envio de comprovante, carteira de dizimista e notificações de aniversário natalício/casamento.
  - _Objetivo:_ Fidelizar o doador e facilitar a contribuição digital.
  - _Complexidade:_ Alta

#### 📊 Módulo: Tesouraria Corporativa

- [ ] **Financeiro Global**
  - _Descrição:_ Cadastro de contas, plano de contas, lançamentos avulsos, livro caixa integrado e gerador de recibos.
  - _Objetivo:_ Eliminar o uso de planilhas externas para a contabilidade paroquial.
  - _Complexidade:_ Alta

#### ⛪ Módulo: Agenda de Missas

- [ ] **Controle Litúrgico e Intenções**
  - _Descrição:_ Agendamento de missas, cadastro de intenções (saúde, falecimento) e geração de relatórios de leitura para o altar.
  - _Objetivo:_ Organizar o roteiro do padre e a arrecadação das intenções.
  - _Complexidade:_ Média

---

### 📌 VERSÃO 4 — PLATAFORMA COMPLETA E IA (Visão de Futuro)

**Foco:** Escalabilidade comunitária, ecossistema do fiel e tecnologias de ponta.

#### 🎪 Módulo: Festa (Eventos e Quermesses)

- [ ] **Gestão de Quermesses Cashless**
  - _Descrição:_ Vendas em eventos, integração com maquininhas, gestão de barraqueiros e controle financeiro das barracas.
  - _Objetivo:_ Eliminar perdas financeiras com fichas de papel em eventos da padroeira.
  - _Complexidade:_ Muito Alta

#### 🛍️ Módulo: Loja Paroquial

- [ ] **PDV e Estoque Lojinha**
  - _Descrição:_ Cadastro de produtos/clientes, controle de estoque, registro de vendas e relatórios de saída.
  - _Objetivo:_ Integrar a receita da lojinha no fluxo de caixa global.
  - _Complexidade:_ Alta

#### 🌐 Módulo: Blog, Portal e Mapa

- [ ] **Portal da Paróquia (CMS)**
  - _Descrição:_ Publicação de notícias, agenda paroquial e publicação de eventos abertos à comunidade.
  - _Objetivo:_ O Trilha da Fé servir também como o Site oficial da paróquia.
  - _Complexidade:_ Média

- [ ] **Mapa de Organizações**
  - _Descrição:_ Exibir paróquias e pontos de doação integrados via Google Maps ou OpenStreetMap. Entidades e locais com geolocalização | Cadastro de pessoa com geolocalização
  - _Objetivo:_ Criar visualização geográfica da presença da Igreja.
  - _Complexidade:_ Média

#### 🤝 Módulo: Cáritas (Ação Social)

- [ ] **Gestão de Assistência Social**
  - _Descrição:_ Cadastro de assistidos e gestão de distribuição de cestas básicas/doações contínuas.
  - _Objetivo:_ Profissionalizar e mapear a caridade paroquial.
  - _Complexidade:_ Média

#### 🤖 Módulo: Assistente IA (GuIA)

- [ ] **GuIA: O companheiro digital da sua jornada espiritual.**
  - _Descrição:_ IA baseada em Processamento de Linguagem Natural treinada na base de conhecimento do sistema. Significado: G → Guia  |  u → Unificado  |  I → Inteligência  |  A → Artificial
  - _Objetivo:_ Responder dúvidas operacionais, ajudar na navegação, explicar telas, informar eventos e dar suporte ao usuário.
  - _Complexidade:_ Muito Alta


---

## 🔮 RECURSOS FUTUROS

### Edição inline

Implementar edição direta na interface.

Exemplo:

contenteditable

Referências:

https://codepen.io/rickoroni/pen/jOoBZjr

https://codepen.io/jvillanueva/pen/gqwzBv

---
