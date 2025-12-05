const printingUtils = {
  // --- Configuração ---
  CHAR_WIDTH: 32, // Largura padrão para impressora 58mm

  // --- Funções Auxiliares de Formatação ---

  // NOVA função para remover acentos
  removeAccents(text = "") {
    if (text === null || typeof text === "undefined") {
      text = "";
    }
    // Garante que é uma string
    const strText = String(text);

    return strText
      .normalize("NFD") // Separa letra base e acento
      .replace(/[\u0300-\u036f]/g, "") // Remove os acentos (diacríticos)
      .replace(/ç/g, "c") // Trata cedilha minúscula
      .replace(/Ç/g, "C"); // Trata cedilha maiúscula
  },

  fillLine(char = "-") {
    return "".padEnd(this.CHAR_WIDTH, char);
  },

  centerText(text) {
    const cleanText = this.removeAccents(text); // Remove acentos antes de calcular
    const padding = Math.max(0, Math.floor((this.CHAR_WIDTH - cleanText.length) / 2));
    return "".padStart(padding, " ") + cleanText;
  },

  alignLeftRight(leftText, rightText) {
    const cleanLeft = this.removeAccents(leftText); // Remove acentos
    const cleanRight = this.removeAccents(rightText); // Remove acentos
    const space = Math.max(1, this.CHAR_WIDTH - cleanLeft.length - cleanRight.length);
    return cleanLeft + "".padStart(space, " ") + cleanRight;
  },

  // Formata um item, quebrando nome longo e adicionando complementos
  formatItemLine(quantity, name, value, complements = []) {
    const cleanName = this.removeAccents(name); // Remove acentos do nome
    const valueStr = `R$ ${Number(value || 0)
      .toFixed(2)
      .replace(".", ",")}`;
    const baseText = `${quantity}x ${cleanName}`;
    const maxBaseLen = this.CHAR_WIDTH - valueStr.length - 1;

    let lines = [];

    if (baseText.length <= maxBaseLen) {
      lines.push(this.alignLeftRight(baseText, valueStr));
    } else {
      const namePart = baseText.substring(0, maxBaseLen);
      lines.push(this.alignLeftRight(namePart, valueStr));
      // Opcional: Adiciona o restante em nova linha ou trunca
      // const remainingPart = baseText.substring(maxBaseLen);
      // lines.push(this.removeAccents(remainingPart).substring(0, this.CHAR_WIDTH));
    }

    if (complements && complements.length > 0) {
      complements.forEach((c) => {
        const cleanCompName = this.removeAccents(c.name); // Remove acentos complemento
        const compLine = `  + ${c.quantity}  ${cleanCompName}`;
        lines.push(compLine.substring(0, this.CHAR_WIDTH)); // Garante não estourar
      });
    }

    return lines.join("\n");
  },

  // --- Funções de Impressão (sem alterações diretas aqui) ---
  imprimirCupom(plainText) {
    if (this.isDispositivoMobile()) {
      this.imprimirViaBluetooth(plainText);
    } else {
      this.imprimirViaNavegador(plainText);
    }
  },

  isDispositivoMobile() {
    // ... (código original)
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  },

  imprimirViaNavegador(plainText) {
    // Envolve o texto pré-formatado em HTML mínimo
    const html = `
    <html>
    <head>
      <title>Impressao</title> <style>
        body { font-family: monospace; font-size: 10pt; line-height: 1.2; margin: 0; padding: 0; width: ${this.CHAR_WIDTH}ch; }
        pre { margin: 0; padding: 0; white-space: pre-wrap; word-wrap: break-word; }
      </style>
    </head>
    <body onload="window.print(); window.close();">
      <pre>${plainText}</pre> </body>
    </html>`;

    const win = window.open("", "PRINT", "height=600,width=300");
    win.document.write(html);
    win.document.close();
    win.focus();
  },

  imprimirViaBluetooth(plainText) {
    // plainText já está sem acentos
    const cleanedText = plainText
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");
    const base64 = btoa(unescape(encodeURIComponent(cleanedText))); // UTF-8 para Base64
    window.location.href = `rawbt:base64,${base64}`;
  },

  // --- Geração de Cupons (Refatorados com as modificações) ---
  gerarCupomCozinha(pedido) {
    const hora = pedido.hour || pedido.create_time?.substring(0, 5) || "--:--";

    console.log(pedido);

    const lines = [
      this.centerText("=== COZINHA ==="),
      "",
      this.alignLeftRight(
        this.removeAccents(`Comanda: #${pedido.number}`), // Remove acentos
        this.removeAccents(`Ped: #${pedido.id}`) // Remove acentos
      ),
      // "",
      this.formatItemLine(pedido.amount, pedido.product, pedido.value, pedido.complements),
      // "",
      this.centerText(`Observação: ${pedido.observacion || "Nenhuma."}`),
      // "",
      this.removeAccents(`Hora: ${hora}`), // Remove acentos
      // "",
      this.centerText("-------- EaCode --------"),
      "",
      "",
    ];

    // const plainText = lines.join("\n").replace(/\n\n+/g, "\n");
    const plainText = lines.join("\n");
    this.imprimirCupom(plainText);
  },

  imprimirContaCompleta(pedidos) {
    if (!pedidos || pedidos.length === 0) {
      alertDefault(this.removeAccents("Nenhum pedido encontrado para imprimir."), "error");
      return;
    }
    const pedidoAtivo = pedidos.find((p) => p.active);
    if (!pedidoAtivo) {
      alertDefault(this.removeAccents("Nenhum pedido ativo na comanda."), "warning");
      return;
    }

    // Aplica removeAccents aos dados variáveis
    const nomeCliente = this.removeAccents(pedidoAtivo?.name || "Cliente");
    const numeroComanda = this.removeAccents(pedidoAtivo?.number || "??");
    let tempoFormatado = pedidoAtivo?.duracao;
    const agora = new Date();

    let total = 0;
    let corpoItens = [];

    pedidos.forEach((p, index) => {
      // Adicionamos o index para controlar a última linha em branco
      const valor = Number(p.value || 0);

      if (p.active) {
        // --- Item Ativo ---
        total += valor;
        // formatItemLine já cuida de acentos e alinhamento para itens ativos
        corpoItens.push(this.formatItemLine(p.amount, p.product, valor, p.complements));

        // Adiciona linha em branco APÓS um item ativo, exceto se for o último da lista
        // if (index < pedidos.length - 1) {
        //   corpoItens.push("");
        // }
      } else {
        // --- Item Cancelado ---
        // 1. Mostra quantidade e nome do produto (sem valor)
        const itemCancelado = this.removeAccents(`${p.amount}  ${p.product}`);
        // Apenas alinha à esquerda, sem preço na direita
        corpoItens.push(itemCancelado.substring(0, this.CHAR_WIDTH));

        // 2. Adiciona o motivo, indentado
        const cleanReason = this.removeAccents(p.cancel_reason || "Nao informado");
        // Indenta o motivo com 2 espaços e limita ao tamanho da linha
        corpoItens.push(("  Motivo: " + cleanReason).substring(0, this.CHAR_WIDTH));

        // 3. Adiciona um marcador claro de cancelamento
        corpoItens.push(this.centerText("--- CANCELADO ---"));

        // Adiciona linha em branco APÓS o bloco do item cancelado, exceto se for o último
        // if (index < pedidos.length - 1) {
        //   corpoItens.push("");
        // }
      }
    }); // Fim do forEach

    const dataHoje = agora.toLocaleDateString("pt-BR");
    const horaHoje = agora.toTimeString().slice(0, 5);
    const totalStr = `R$ ${total.toFixed(2).replace(".", ",")}`;

    // Define o cabeçalho dos itens
    const itemHeader = this.alignLeftRight("Qtd Descricao", "Total"); // Não precisa de removeAccents aqui

    const lines = [
      // this.centerText("=== FECHAMENTO DE CONTA ==="),
      // "",
      this.centerText(this.removeAccents("EaCode - Comandas")),
      "",
      this.centerText(this.removeAccents("CNPJ: 12.345.678/0001-90")), // Ajuste o CNPJ
      this.fillLine("_"),
      "",
      // ADICIONADO: Cupom Não Fiscal
      this.centerText("*** CUPOM NAO FISCAL ***"),
      "",
      // Fim da adição
      `Comanda: #${numeroComanda}`,
      `Cliente: ${nomeCliente.substring(0, this.CHAR_WIDTH - 9)}`,
      `Duracao: ${tempoFormatado}`,
      `Data: ${dataHoje} - ${horaHoje}`,
      this.fillLine("-"),
      // ADICIONADO: Cabeçalho dos Itens
      itemHeader,
      // Fim da adição
      ...corpoItens,
      // Não precisa mais remover a última linha em branco aqui, pois o loop já cuida disso.
      this.fillLine("-"),
      this.alignLeftRight("TOTAL:", totalStr),
      this.fillLine("-"),
      // "",
      // Aplica removeAccents aos textos fixos do rodapé
      this.centerText(this.removeAccents("Agradecemos a preferencia!")),
      this.centerText(this.removeAccents("Volte sempre!")),
      // "",
      this.centerText("-------- EaCode --------"),
      "",
      "",
    ];

    // const plainText = lines.join("\n").replace(/\n\n+/g, "\n");
    const plainText = lines.join("\n");
    this.imprimirCupom(plainText);
  },

  imprimirParcialConta(pedidos) {
    if (!pedidos || pedidos.length === 0) {
      alertDefault(this.removeAccents("Nenhum pedido ativo para imprimir a parcial."), "error");
      return;
    }
    const ativos = pedidos.filter((p) => p.active);
    if (ativos.length === 0) {
      alertDefault(this.removeAccents("Nenhum pedido ativo encontrado."), "warning");
      return;
    }

    let total = 0;
    let corpoItens = [];
    const agora = new Date();
    const dataFormatada = agora.toLocaleDateString("pt-BR");
    const horaFormatada = agora.toTimeString().slice(0, 5);

    ativos.forEach((p) => {
      const valor = Number(p.value || 0);
      total += valor;
      // formatItemLine já chama removeAccents nos nomes
      corpoItens.push(this.formatItemLine(p.amount, p.product, valor, p.complements));
      // corpoItens.push(""); // Linha em branco entre itens
    });

    const totalStr = `R$ ${total.toFixed(2).replace(".", ",")}`;

    // Define o cabeçalho dos itens
    const itemHeader = this.alignLeftRight("Qtd Descricao", "Total"); // Não precisa de removeAccents

    const lines = [
      this.centerText("=== PARCIAL DA CONTA ==="),
      "",
      this.fillLine("-"),
      // ADICIONADO: Cabeçalho dos Itens
      itemHeader,
      // Fim da adição
      ...corpoItens,
      // Não precisa mais remover a última linha em branco aqui, pois o loop já cuida disso.
      this.fillLine("-"),
      this.alignLeftRight("TOTAL:", totalStr),
      this.fillLine("-"),
      this.centerText(`${dataFormatada} - ${horaFormatada}`),
      // "",
      this.centerText("-------- EaCode --------"),
      "",
      "",
    ];

    // const plainText = lines.join("\n").replace(/\n\n+/g, "\n");
    const plainText = lines.join("\n");
    this.imprimirCupom(plainText);
  },
};
