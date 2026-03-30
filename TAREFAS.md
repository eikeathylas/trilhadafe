# 📦 Backlog de Implementação — Sistema Trilha da Fé

Este documento contém as tarefas planejadas para evolução do sistema.

As tarefas devem ser executadas **uma por vez**, seguindo o processo de **engenharia controlada**, garantindo estabilidade e evitando alterações indevidas na arquitetura.

---

# 🧱 BLOCO 1 — ESTRUTURA DA CATEQUESE


# 👥 BLOCO 2 — TELA DE PESSOAS


# 📄 BLOCO 3 — LGPD

## TAREFA 11 — Gerar **Termo LGPD**

**Objetivo**

Emitir termo de autorização de uso de dados pessoais conforme legislação.

**Fluxo esperado**

Após cadastro do catequizando:

- Gerar documento
- Permitir download
- Permitir impressão

---

## TAREFA 12 — Gerar **Termo de Uso de Imagem**

**Objetivo**

Permitir autorização para uso de imagem em atividades da paróquia.

**Fluxo esperado**

- Gerar documento automaticamente
- Permitir impressão ou download

---

# 🏫 BLOCO 4 — TURMAS

## TAREFA 13 — Adicionar toggle **Turma Ano II**

**Objetivo**

Identificar turmas do segundo ano de catequese.

**Regra**

Somente turmas **Ano II** podem ser concluídas.

---

## TAREFA 14 — Implementar **Conclusão de Turma**

**Objetivo**

Permitir finalizar turmas que chegaram ao fim do ciclo catequético.

**Ações esperadas**

- Marcar turma como concluída
- Bloquear novos encontros
- Manter histórico da turma

---

## TAREFA 15 — Gerar **Certificados de Conclusão**

**Objetivo**

Emitir certificados para catequizandos que concluíram a formação.

**Dados esperados**

- Nome do catequizando
- Paróquia
- Fase concluída
- Data
- Assinatura do responsável

**Formato sugerido**

- PDF
- Layout de lembrancinha

---

# ⚡ BLOCO 5 — EXPERIÊNCIA DO USUÁRIO (UX)

## TAREFA 16 — Permitir **cadastro direto nas telas**

**Objetivo**

Evitar que o usuário precise sair da tela atual para cadastrar novos registros.

**Exemplo**

Dentro de selects adicionar opção:


- Novo cadastro


**Comportamento esperado**

- Abrir modal de cadastro rápido
- Atualizar select após salvar

---

# 🏛 BLOCO 6 — ESTRUTURA DO SISTEMA

## TAREFA 17 — Alterar nome **Organização → Entidade**

**Objetivo**

Tornar o sistema mais genérico e adequado à estrutura paroquial.

**Impacto esperado**

- Labels do sistema
- Telas
- Permissões
- Banco de dados (se necessário)

---

# 📓 BLOCO 7 — DIÁRIO

## TAREFA 18 — Permitir **dois encontros na mesma data**

**Objetivo**

Registrar múltiplos encontros catequéticos realizados no mesmo dia.

**Exemplo**


14/04

Encontro 1
Encontro 2

---

## TAREFA 19 — Selecionar encontro ao registrar presença

**Objetivo**

Garantir que a presença seja vinculada ao encontro correto.

**Comportamento esperado**

Ao registrar presença:

- Selecionar qual encontro está sendo registrado

---

# 📊 Resumo

Total de tarefas planejadas:

**19 tarefas**

Distribuição:

- Estrutura da catequese: 2
- Tela de pessoas: 8
- LGPD: 2
- Turmas: 3
- Experiência do usuário: 1
- Estrutura do sistema: 1
- Diário: 2

---

# ⚠️ Boas práticas de execução

- Executar **uma tarefa por vez**
- Sempre enviar **apenas os arquivos envolvidos**
- Validar cada alteração antes de seguir para a próxima
- Nunca realizar múltiplas alterações estruturais simultaneamente





============== TAREFAS EXEMPLOS

# Tarefa

Tela: Usuários

Objetivo:
Criar uma nova aba no modal de usuário chamada **Perfil de Permissões**.

Nessa aba deve existir:

• lista de permissões do usuário
• descrição da ação
• toggle true/false indicando se está ativa

Seguir o padrão visual existente no sistema.

---

Arquivos envolvidos:

usuarios.php
usuarios.js
usuarios.css

==============

# Tarefa

Tela: Diário

Quero permitir **dois encontros na mesma data**.

Hoje o sistema aceita apenas um.

Não sei qual seria a melhor abordagem:

• permitir múltiplos encontros
• criar seleção de encontro
• ou outra solução

Analise os arquivos e proponha a melhor arquitetura sem quebrar o sistema.

---

Arquivos envolvidos:

diario.php
diario.js
diario_controller.php

==============
---






# Atual

Saudações, Arquiteto. Aqui é o Engineering Sentinel.

Excelente notícia! Fico feliz que a arquitetura dos Termos de LGPD e o ajuste visual do rodapé estejam operando com perfeição e fluidez no sistema.

Seguindo rigorosamente o nosso Backlog de Implementação, o próximo passo natural é avançarmos para o BLOCO 4 — TURMAS.

Relembrando as tarefas deste bloco:

    TAREFA 13: Adicionar toggle "Turma Ano II" (identificador de turmas formandas).

    TAREFA 14: Implementar "Conclusão de Turma" (finalizar ciclo, bloquear diário e manter histórico).

    TAREFA 15: Gerar "Certificados de Conclusão" (gerador em PDF/HTML de lembrancinhas para os formandos).

Para que eu possa iniciar a Camada 1 (Arquiteto Auditor) e analisar onde e como faremos essas inserções no banco de dados e no código atual (arquivos turmas.php, turmas.js e backend), preciso da sua autorização e que você faça o upload dos arquivos relacionados às turmas (como turmas.php, turmas.js, turmas-controller.php, turmas-functions.php e qualquer script de banco afetado, se necessário).

Posso dar início à análise do Bloco 4?