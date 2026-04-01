# 🔧 BLOCO — AJUSTES DE INTERFACE E FUNCIONAMENTO

---

# 📓 Tela: Diário

## [ ] Restaurar botões de ações do encontro

**Objetivo**

Reativar os botões de gerenciamento de encontros.

**Botões esperados**

- Log
- Editar
- Deletar

**Referência visual**

Seguir exatamente o mesmo padrão existente na **Tela de Pessoas**.

---

## [ ] Corrigir lógica de sequência dos encontros

**Objetivo**

Corrigir o algoritmo responsável por determinar a ordem dos encontros registrados no diário.

**Problema atual**

O sistema não está considerando corretamente:

- a sequência dos encontros
- a mudança de datas
- múltiplos encontros no mesmo dia

**Comportamento esperado**

A lógica deve:

1. Identificar o último encontro registrado
2. Verificar a data do encontro
3. Entender que **cada novo registro pode representar um novo encontro**
4. Incrementar corretamente a numeração

**Exemplo correto**

| Data  | Encontro   |
| ----- | ---------- |
| 01/04 | Encontro 1 |
| 01/04 | Encontro 2 |
| 08/04 | Encontro 3 |

Mesmo quando dois encontros ocorrerem no mesmo dia, a sequência deve continuar corretamente.

---

## [ ] Ajustar margens do accordion dos encontros para Mobile

**Objetivo**

Melhorar o layout visual da listagem de encontros.

**Alteração esperada**

- reduzir margens externas do accordion
- deixar a lista de encontros mais compacta

---

## [ ] Ajustar nome do botão de novo encontro baseado no plano catequético

**Objetivo**

Utilizar os planos de aula cadastrados para definir o nome do encontro.

**Tabela utilizada**

education.curriculum_plans

**Coluna utilizada**

title

**Regra de funcionamento**

Todos os registros existentes na tabela `education.curriculum_plans` e pertencente a turma devem aparecer como opções de encontro.

**Exemplo**

Se a tabela possuir:

| id  | title                  |
| --- | ---------------------- |
| 1   | Deus nos chama         |
| 2   | A criação              |
| 3   | A história da salvação |

O sistema deve mostrar:

- Adicionar Deus nos chama
- Adicionar A criação
- Adicionar A história da salvação

---

**Quando os planos cadastrados forem ultrapassados**

Se existirem apenas **3 planos cadastrados**, o próximo encontro deve aparecer como:

- Adicionar Encontro 4 (Novo)

---

**Quando for um professor diferente reiniciar os encontros**

Se um novo professor for registrar deverá reiniciar a listagem de encontros, assim sendo compreendido que cada professor terá uma cronologia de encontros separados.

---

## [ ] Corrigir título exibido nos encontros salvos

**Objetivo**

A listagem de encontros deve utilizar o título correto do plano de aula.

**Problema atual**

O sistema está exibindo a coluna:

content

**Comportamento correto**

Deve exibir a coluna:

title

da tabela:

education.curriculum_plans

---

# 👤 Tela: Usuários

## [ ] Melhorar auditoria de usuários

**Objetivo**

Tornar o sistema de auditoria mais detalhado.

**Informações esperadas no log**

- usuário responsável pela ação
- data e hora
- tipo de ação realizada
- entidade afetada
- alteração executada

**Referência**

Seguir o mesmo padrão do **LOG de registros do sistema**.

---

## [ ] Ajustar abas do modal de usuários

**Objetivo**

Melhorar a organização das abas dentro do modal de edição de usuário.

Possíveis melhorias:

- reorganização lógica das informações
- melhor separação entre permissões e dados do usuário
- padronização visual igual pessoas, "modern-tabs-wrapper" dentro de "modal-body"

---

## [ ] Listar ações disponíveis por tela

**Objetivo**

Exibir claramente quais ações cada usuário pode executar em cada tela do sistema.

**Exemplo de visualização**

| Tela    | Permissões                     |
| ------- | ------------------------------ |
| Pessoas | Ver / Criar / Editar / Deletar |
| Turmas  | Ver / Criar / Editar           |
| Diário  | Ver / Registrar encontro       |

---

## [ ] Melhorar modal de usuários no mobile

**Objetivo**

Ajustar responsividade e espaçamento do modal em dispositivos móveis.

**Melhorias esperadas**

- melhorar espaçamento entre campos
- evitar quebra de layout
- melhorar leitura e navegação

---

# 🧭 Interface Global

## [ ] Ajustar select de paróquias no menu lateral

**Objetivo**

Evitar quebra do layout quando nomes de paróquias forem muito longos.

**Problema atual**

O select pode quebrar o layout do menu lateral.

**Ajustes esperados**

- definir altura máxima do select
- aplicar truncamento de texto quando necessário
- manter estabilidade do layout




# 🧭 Interface Global II

Geral -> Ajustar o setButton em todas as telas
