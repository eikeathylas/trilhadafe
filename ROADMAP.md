# 🔧 1 — CORREÇÕES (BUGFIX)

---

## Tela: Diário

[ ] Permitir registrar encontro somente quando houver estudantes na turma

Objetivo:

Evitar registros inválidos de encontros em turmas sem catequizandos.

---

## Tela: Diário

[ ] Ajustar nomenclatura **Aula → Encontro**

Objetivo:

Catequese não possui aulas, mas **encontros catequéticos**.

---

# 🚀 2 — MELHORIAS

---

## Estrutura do Sistema: Catequese

[ ] Substituir **Disciplina** por **Fase**

Objetivo:

Adequar o sistema ao modelo real de catequese, que trabalha com **fases da iniciação cristã** em vez de disciplinas.

---

[ ] Ajustar banco local para trabalhar com **fases**

Objetivo:

Modificar a estrutura do banco para substituir disciplinas por fases.

Exemplo de fases da iniciação cristã:

- Pré-catecumenato (Querigma / Acolhida)
- Catecumenato
- Purificação e Iluminação
- Mistagogia

---

## Tela: Pessoas

[ ] Criar nova aba **Padrinhamento**

Objetivo:

Registrar padrinhos e madrinhas dos catequizandos.

---

[ ] Criar select **Padrinho**

Objetivo:

Selecionar padrinho a partir do cadastro de pessoas.

---

[ ] Criar select **Madrinha**

Objetivo:

Selecionar madrinha a partir do cadastro de pessoas.

---

[ ] Criar campo **Endereço**

Objetivo:

Registrar endereço do padrinho/madrinha.

---

[ ] Criar campo **Telefone**

Objetivo:

Registrar telefone de contato.

---

[ ] Criar campo **Data de nascimento**

Objetivo:

Registrar data de nascimento do padrinho/madrinha.

---

[ ] Criar toggle **Casados na Igreja**

Objetivo:

Registrar se os padrinhos são casados sacramentalmente.

---

[ ] Criar toggle **Solteiros**

Objetivo:

Registrar estado civil dos padrinhos.

---

[ ] Gerar **Termo LGPD** após cadastro

Objetivo:

Garantir autorização de uso de dados conforme legislação.

---

[ ] Gerar **Termo de uso de imagem**

Objetivo:

Permitir autorização para uso de imagem em atividades da paróquia.

---

## Tela: Turmas

[ ] Adicionar toggle **Turma Ano II**

Objetivo:

Identificar turmas do segundo ano de catequese.

Regra:

Somente turmas **Ano II** podem ser concluídas.

---

[ ] Implementar **Conclusão de Turma**

Objetivo:

Permitir finalizar turmas que chegaram ao fim do ciclo catequético.

Ações esperadas:

- Marcar turma como concluída
- Bloquear novos encontros
- Preparar geração de certificados

---

[ ] Gerar **lembrancinhas / certificados de conclusão**

Objetivo:

Emitir certificado para catequizandos que concluíram a formação.

Dados possíveis:

- Nome do catequizando
- Paróquia
- Fase concluída
- Data
- Assinatura responsável

---

## Experiência do Usuário (UX)

[ ] Permitir **cadastro direto nas telas**

Objetivo:

Evitar que o usuário precise sair da tela atual para cadastrar novos registros.

Exemplo:

Dentro de selects adicionar opção:

- **+ Novo cadastro**

Abrir modal de cadastro rápido.

---

## Estrutura do Sistema

[ ] Alterar nome **Organização → Entidade**

Objetivo:

Tornar o sistema mais genérico e adequado à estrutura paroquial.

Impacto esperado:

- Labels do sistema
- Telas
- Permissões
- Banco de dados (caso necessário)

---

## Tela: Diário

[ ] Permitir **dois encontros na mesma data**

Objetivo:

Registrar múltiplos encontros catequéticos realizados no mesmo dia.

Exemplo:

14/04  
- Encontro 1  
- Encontro 2

---

[ ] Permitir **selecionar o encontro ao registrar presença**

Objetivo:

Garantir que a presença seja vinculada ao encontro correto quando houver mais de um no mesmo dia.

---

# 🔔 3 — SISTEMA DE NOTIFICAÇÕES

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