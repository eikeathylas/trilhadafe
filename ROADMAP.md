# 🔧 1 — CORREÇÕES (BUGFIX)

## Tela: Usuários

[ ] Ajustar paginação da listagem  
Objetivo:
Padronizar paginação visual e funcional com o restante do sistema.

---

[ ] Ajustar modal de ações do usuário  
Objetivo:
Deixar o modal idêntico ao modal de auditoria (mesmo padrão visual).

---

[ ] Corrigir coluna `last_login`

Objetivo:
Registrar automaticamente o último login do usuário.

Sugestão técnica:

- Atualizar no momento da autenticação
- Registrar timestamp no banco

---

## Tela: Organização

[ ] Corrigir paginação da listagem de organizações

Objetivo:
Padronizar paginação conforme padrão do sistema.

---

# 🚀 2 — MELHORIAS

## Tela: Pessoas

[ ] Criar filtro de escopo de pessoas

Adicionar opção de visualização:

- Pessoas da Paróquia atual
- Pessoas do Banco Global

Objetivo:

Permitir alternar entre visão **local** e **global** do CRM.

---

# 🔔 3 — SISTEMA DE NOTIFICAÇÕES

Criar um motor de notificações baseado em eventos do sistema.

## Eventos previstos

[ ] Aniversariante do dia

Regras:

- Respeitar hierarquia
- Paróquia
- Comunidade
- Usuário

---

[ ] Feriado para professor

Quando um feriado for cadastrado em uma turma:

- Notificar professor responsável

---

# 📊 4 — RELATÓRIOS

## Correções

[ ] Revisar problema de itens sumindo conforme perfil

Possível causa:

- Permissões mal filtradas
- Query não respeitando RBAC

---

# Arquitetura de Relatórios

Criar estrutura modular:

/relatorios
/base
/templates
/geradores

---

## Implementações

[ ] Criar relatórios base

[ ] Criar templates de cabeçalho

[ ] Criar templates de rodapé

[ ] Criar estrutura de montagem

[ ] Criar arquivo central registrador de relatórios

---

# Relatórios necessários

[ ] Listagem de estudantes

[ ] Listagem de professores

[ ] Listagem geral de pessoas

[ ] Listagem de pendências

[ ] Listagem de encontros

[ ] Listagem de turmas

[ ] Listagem de disciplinas

---

# 🗺️ 5 — NOVAS TELAS

---

## Tela: Mapa

Funcionalidades:

[ ] Exibir paróquias no mapa

[ ] Exibir pontos de doação

Possível integração:

- Google Maps
- OpenStreetMap

Objetivo:

Criar visualização geográfica da igreja.

---

## Tela: Avisos

Sistema de comunicação interno.

Hierarquia:

Pároco
- pode enviar para todos
- pode enviar para grupos

Secretaria
- pode enviar para todos
- pode enviar para grupos

Professor
- pode enviar apenas para alunos da turma

Possíveis canais:

- sistema
- push
- email
- app

---

## Tela: Portal dos Pais

Funcionalidades:

[ ] acompanhar progresso do filho

[ ] ver conteúdos da aula

[ ] ver presença

[ ] receber avisos

[ ] receber notificações

---

## Tela: Blog / Portal

Funcionalidades:

[ ] publicar eventos

[ ] notícias da igreja

[ ] agenda paroquial

[ ] integração com mapa

Objetivo:

Transformar sistema em CMS da paróquia.

---

# 🤖 6 — ASSISTENTE IA

Nome do assistente:

GuIA

Significado:

G → Guia  
u → Unificado  
I → Inteligência  
A → Artificial  

Frase oficial:

GuIA: O companheiro digital da sua jornada espiritual.

---

## Funções

[ ] responder dúvidas do sistema

[ ] ajudar navegação

[ ] explicar telas

[ ] informar eventos

[ ] suporte ao usuário

Tecnologia prevista:

- processamento de linguagem natural
- base de conhecimento do sistema

---

# ⛪ 7 — MÓDULOS ERP ECLESIÁSTICOS

Referência funcional:

https://sigepa.com.br

---

## Batismo

[ ] inscrição do batizando

[ ] registro de batismo

[ ] certidão de batismo

[ ] autorizações

[ ] negativas

[ ] certificados de preparação

[ ] gerador de livro de batismo

[ ] envio para cúria

[ ] relatórios

---

## Casamento

[ ] cadastro dos noivos

[ ] processo matrimonial

[ ] dispensas e licenças

[ ] transferência online

[ ] notificação de casamento

[ ] registro de casamento

[ ] livro de casamento

[ ] envio para cúria

---

## Catequese

[ ] cadastro catequizando

[ ] cadastro catequista

[ ] cadastro de turmas

[ ] formação de turmas

[ ] registro de crisma

[ ] envio para cúria

[ ] relatórios

---

## Agenda de Missas

[ ] cadastro de intenções

[ ] agendamento de missas

[ ] relatórios

---

## Dízimo

[ ] cadastro de dizimistas

[ ] registro de contribuições

[ ] contribuição via app

[ ] envio de comprovante

[ ] notificações automáticas

Tipos:

- aniversário
- aniversário de casamento

[ ] gerador de carnê

[ ] carteira de dizimista

[ ] mapa do dízimo

[ ] relatórios

---

## Financeiro

[ ] plano de contas

[ ] cadastro de contas

[ ] lançamentos

[ ] livro caixa

[ ] gerador de recibos

[ ] bingos

[ ] rifas

---

## Loja

[ ] cadastro de produtos

[ ] cadastro de clientes

[ ] controle de estoque

[ ] registro de vendas

[ ] relatórios

---

## Central de Consultas

Pesquisa unificada de:

- batismos
- casamentos
- crismas
- negativas

Integração com:

- paróquias
- clero diocesano

---

## Cáritas

[ ] cadastro de assistidos

[ ] gestão de assistência social

---

## Festa

[ ] gestão de eventos

[ ] gestão de barraqueiros

[ ] vendas em eventos

[ ] integração com maquininhas

---

# 🧠 8 — AUDITORIA DO SISTEMA

Criar prompt para IA analisar:

- banco de dados
- funcionalidades existentes
- telas existentes

Objetivo:

Identificar:

✔ funcionalidades já implementadas  
✔ funcionalidades incompletas  
✔ funcionalidades ausentes  

---

# 🔮 9 — RECURSOS FUTUROS

## Edição inline

Implementar edição direta na interface.

Exemplo:

contenteditable

Referências:

https://codepen.io/rickoroni/pen/jOoBZjr

https://codepen.io/jvillanueva/pen/gqwzBv

---