// =========================================================
// 1. CONFIGURAÇÃO DE TEMA (CLARO/ESCURO)
// =========================================================
const configTheme = (ele) => {
  let themeActive = localStorage.getItem("mode");
  let button = $('ul > li [onclick="configTheme(this)"] .icon-only');
  let temaBoot = $("body");

  if (ele !== undefined) {
    // Alternância pelo clique
    if (!themeActive || themeActive === "claro") {
      localStorage.setItem("mode", "escuro");
      temaBoot.attr("data-bs-theme", "dark").attr("data-theme", "escuro");
      if (button.length) button.html("light_mode");
    } else {
      localStorage.setItem("mode", "claro");
      temaBoot.attr("data-bs-theme", "light").attr("data-theme", "claro");
      if (button.length) button.html("dark_mode");
    }
  } else {
    // Carregamento inicial (persistência)
    if (themeActive === "escuro") {
      temaBoot.attr("data-bs-theme", "dark").attr("data-theme", "escuro");
      if (button.length) button.html("light_mode");
    } else {
      temaBoot.attr("data-bs-theme", "light").attr("data-theme", "claro");
      if (button.length) button.html("dark_mode");
    }
  }
};
// Executa imediatamente ao carregar
configTheme();

// =========================================================
// 2. CONFIGURAÇÕES GLOBAIS & UTILITÁRIOS
// =========================================================

const getUrl = () => {
  let path = window.location.pathname;
  let dir = path.substring(0, path.lastIndexOf("/"));
  return `${window.location.origin}${dir}`;
};

const getSessionData = () => {
  try {
    return JSON.parse(localStorage.getItem("tf_data")) || {};
  } catch (e) {
    return {};
  }
};

window.defaultApp = {
  userInfo: getSessionData(),
  validator: `app/validation/validation.php`,
};

// --- MÁSCARAS (jQuery Mask Plugin) ---
window.initMasks = () => {
  if ($.fn.mask) {
    $(".mask-date").mask("00/00/0000");
    $(".mask-time").mask("00:00:00");
    $(".mask-cep").mask("00000-000");
    $(".mask-cpf").mask("000.000.000-00", { reverse: true });
    $(".mask-cnpj").mask("00.000.000/0000-00", { reverse: true });
    $(".mask-money").mask("000.000.000,00", { reverse: true });

    // Máscara dinâmica para celular (8 ou 9 dígitos)
    var phoneMaskBehavior = function (val) {
        return val.replace(/\D/g, "").length === 11 ? "(00) 00000-0000" : "(00) 0000-00009";
      },
      phoneOptions = {
        onKeyPress: function (val, e, field, options) {
          field.mask(phoneMaskBehavior.apply({}, arguments), options);
        },
      };
    $(".mask-phone").mask(phoneMaskBehavior, phoneOptions);
  }
};

// --- CONTROLE DE BOTÃO (LOADING) ---
window.setButton = (isLoading, element, originalText = "Salvar") => {
  if (isLoading) {
    element.prop("disabled", true);
    element.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processando...');
  } else {
    element.prop("disabled", false);
    element.html(originalText);
  }
};

// --- ÍCONES DE RECURSOS (USADO EM GRIDS) ---
window.getResourceIcon = (key) => {
  const icons = {
    // CLIMATIZAÇÃO E ÁGUA (Cyan/Info - Excelente contraste em ambos)
    ac: '<i class="fas fa-snowflake text-info me-2" title="Ar-Condicionado"></i>',
    fan: '<i class="fas fa-fan text-info me-2" title="Ventilador"></i>',
    water: '<i class="fas fa-glass-water text-info me-2" title="Bebedouro"></i>',

    // DESTAQUES (Amarelo, Verde, Vermelho)
    sacred: '<i class="fas fa-cross text-warning me-2" title="Local Sagrado / Altar"></i>',
    kitchen: '<i class="fas fa-mug-hot text-danger me-2" title="Copa / Cozinha"></i>',
    parking: '<i class="fas fa-square-parking text-success me-2" title="Estacionamento"></i>',

    // TECNOLOGIA E ACESSO (Azul Primário - Cor base do sistema)
    access: '<i class="fas fa-wheelchair text-primary me-2" title="Acessibilidade"></i>',
    wifi: '<i class="fas fa-wifi text-primary me-2" title="Wi-Fi"></i>',
    projector: '<i class="fas fa-display text-primary me-2" title="Projetor / TV"></i>',
    sound: '<i class="fas fa-volume-high text-primary me-2" title="Som"></i>',
    computer: '<i class="fas fa-laptop text-primary me-2" title="Computadores"></i>',

    // INFRAESTRUTURA BÁSICA (Cinza Adaptativo - Resolve o problema do ícone invisível)
    whiteboard: '<i class="fas fa-chalkboard text-secondary me-2" title="Lousa / Quadro"></i>',
  };
  return icons[key] || "";
};

// --- GERADOR DE TOGGLE (HTML PADRÃO) ---
window.renderToggle = (id, isChecked, onChangeFunction) => {
  const checkedAttr = isChecked ? "checked" : "";
  return `
        <div class="form-check form-switch d-flex justify-content-center align-items-center mb-0">
            <input class="form-check-input" type="checkbox" 
                   onchange="${onChangeFunction}(${id}, this)" ${checkedAttr} style="cursor: pointer;">
            <span class="toggle-loader spinner-border spinner-border-sm text-secondary d-none ms-2" role="status"></span>
        </div>
    `;
};

// --- ZOOM DE IMAGEM (SWEETALERT) ---
window.zoomAvatar = (url, altText = "Foto") => {
  if (!url) return;
  Swal.fire({
    imageUrl: url,
    imageAlt: altText,
    imageWidth: "auto",
    customClass: {
      image: "rounded-4 shadow-lg border border-white",
      popup: "bg-transparent shadow-none",
    },
    showConfirmButton: false,
    showCloseButton: true,
    backdrop: `rgba(0,0,0,0.85)`,
    scrollbarPadding: false,
    animation: true,
  });
};

// =========================================================
// 3. COMUNICAÇÃO E SESSÃO
// =========================================================

window.logOut = (reason = null) => {
  localStorage.removeItem("tf_data");
  localStorage.removeItem("tf_access");
  localStorage.removeItem("tf_time");
  localStorage.removeItem("tf_time_confirm");

  if (reason) alert("Sessão encerrada: " + reason);
  window.location.href = "../login/";
};

window.load = (status = true) => {
  let divLoad = $("#div-loader");
  if (!divLoad[0]) {
    $("body").append(`<div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>`);
    divLoad = $("#div-loader");
  }
  if (status) divLoad.fadeIn(200);
  else divLoad.fadeOut(200);
};

window.alertDefault = (msg = "Sucesso!", icon = "success", time = 3, position = "top-end") => {
  Swal.mixin({
    icon: icon,
    title: msg,
    toast: true,
    position: position,
    showConfirmButton: false,
    timer: time * 1000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  }).fire();
};

// Wrapper de AJAX (Dados)
window.ajaxValidator = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: window.defaultApp.validator,
      data,
      dataType: "json",
      type: "POST",
      success: (response) => resolve(response),
      error: (xhr, status, error) => {
        if (xhr.status === 401 || xhr.status === 403) {
          console.warn("Sessão inválida.");
          window.logOut();
        }
        reject(error);
      },
    });
  });
};

// Wrapper de AJAX (Arquivos/FormData)
window.ajaxValidatorFoto = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: window.defaultApp.validator,
      data,
      dataType: "json",
      type: "POST",
      processData: false,
      contentType: false,
      success: (response) => resolve(response),
      error: (xhr, status, error) => {
        if (xhr.status === 401) {
          window.logOut();
        }
        reject(error);
      },
    });
  });
};

// Verifica validade do token periodicamente
const checkSessionStatus = () => {
  if (!defaultApp.userInfo.token) return;
  ajaxValidator({ validator: "token", token: defaultApp.userInfo.token })
    .then((json) => {
      if (json.status && json.data.logout) {
        let msg = "Sessão expirada.";
        if (json.data.reason === "financial") msg = "Acesso suspenso. Contate o suporte.";
        Swal.fire({ icon: "warning", title: "Atenção", text: msg, confirmButtonColor: "#5C8EF1", allowOutsideClick: false }).then(() => window.logOut());
      }
    })
    .catch(() => console.warn("Falha ao verificar sessão."));
};

const keepAlive = () => {
  if (!defaultApp.userInfo.token) return;
  ajaxValidator({ validator: "confirm", token: defaultApp.userInfo.token });
};

// =========================================================
// 4. CONTEXTO GLOBAL (UNIDADE E ANO)
// =========================================================

window.initGlobalContext = async () => {
  if (!defaultApp.userInfo.token) return;

  const $elParish = $("#global_parish");
  const $elYear = $("#global_year");

  if (!$elParish.length || !$elYear.length) return;

  // Configuração comum para ambos os selects
  const commonConfig = {
    create: false,
    sortField: "text",
    searchField: ["text"],
    placeholder: "Carregando...",
    dropdownParent: "body", // <--- CRÍTICO: Tira o menu de dentro da sidebar
    render: { option: (item, escape) => `<div class="option"><span>${escape(item.text)}</span></div>` },
  };

  // --- SELETOR DE UNIDADE ---
  const selectParish = $elParish.selectize({
    ...commonConfig,
    onChange: function (val) {
      if (!val) return;
      const current = localStorage.getItem("tf_active_parish");
      if (current != val) {
        localStorage.setItem("tf_active_parish", val);
        $(".sidebar-context-card.top-card").css("border-color", "var(--padrao2)");
        window.location.reload();
      }
    },
  })[0].selectize;

  // Adiciona classe para estilização CSS
  selectParish.$dropdown.addClass("sidebar-context-dropdown");

  // --- SELETOR DE ANO LETIVO ---
  const selectYear = $elYear.selectize({
    ...commonConfig,
    onChange: function (val) {
      if (!val) return;
      localStorage.setItem("sys_active_year", val);
      window.dispatchEvent(new CustomEvent("yearChanged", { detail: val }));

      const card = document.querySelector(".sidebar-context-card.bottom-card");
      if (card) {
        card.style.borderColor = "var(--padrao2)";
        setTimeout(() => (card.style.borderColor = "rgba(255,255,255,0.15)"), 800);
      }
    },
  })[0].selectize;

  // Adiciona classe para estilização CSS
  selectYear.$dropdown.addClass("sidebar-context-dropdown");

  selectParish.disable();
  selectYear.disable();

  // Carregamento de Dados
  try {
    const res = await ajaxValidator({
      validator: "getGlobalContext",
      token: defaultApp.userInfo.token,
    });

    if (res.status) {
      const data = res.data;

      // Paróquias
      selectParish.clearOptions();
      selectParish.enable();
      selectParish.settings.placeholder = "Selecione...";
      selectParish.updatePlaceholder();

      if (data.parishes && data.parishes.length > 0) {
        const savedParish = localStorage.getItem("tf_active_parish");
        let isActiveSet = false;
        data.parishes.forEach((p) => {
          selectParish.addOption({ value: p.id, text: p.name });
          if (savedParish && p.id == savedParish) isActiveSet = true;
        });
        if (isActiveSet) selectParish.setValue(savedParish, true);
        else {
          const firstId = data.parishes[0].id;
          localStorage.setItem("tf_active_parish", firstId);
          selectParish.setValue(firstId, true);
        }
      }

      // Anos
      selectYear.clearOptions();
      selectYear.enable();
      selectYear.settings.placeholder = "Selecione...";
      selectYear.updatePlaceholder();

      if (data.years && data.years.length > 0) {
        let activeYear = null;
        const cachedYear = localStorage.getItem("sys_active_year");
        data.years.forEach((y) => {
          selectYear.addOption({ value: y.year_id, text: y.name });
          if (y.now && y.is_active && !activeYear) activeYear = y.year_id;
        });
        if (cachedYear) selectYear.setValue(cachedYear, true);
        else if (activeYear) {
          selYear.setValue(activeYear, true);
          localStorage.setItem("sys_active_year", activeYear);
        }
        if (selectYear.getValue()) window.dispatchEvent(new CustomEvent("yearChanged", { detail: selectYear.getValue() }));
      }
    }
  } catch (e) {
    console.error("Erro contexto:", e);
  }
};

window.abrirWhatsAppSuporte = async (acaoErro = "Dúvida / Contato via Menu", descricaoErro = "Preciso de ajuda com o sistema.") => {
  // 1. EXTRAIR DADOS DO LOCAL STORAGE (Prevenção de Erros)
  let usuario = "Desconhecido";
  let cliente = "Desconhecido";
  let cargo = "Desconhecido";
  let token = "";

  try {
    const tfData = JSON.parse(localStorage.getItem("tf_data") || "{}");
    if (tfData.name_user) {
      usuario = tfData.name_user;
      cliente = tfData.name_client || "Não informado";
      cargo = tfData.office || "Não informado";
      token = tfData.token || "";
    }
  } catch (e) {
    console.warn("Aviso: Falha ao ler tf_data do LocalStorage.");
  }

  // 2. HELPERS DE NAVEGADOR E SO
  const getBrowser = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Chrome") && !ua.includes("Edg")) return "Google Chrome";
    if (ua.includes("Firefox")) return "Mozilla Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edg")) return "Microsoft Edge";
    if (ua.includes("Opera") || ua.includes("OPR")) return "Opera";
    return "Navegador desconhecido";
  };

  const getOS = () => {
    const ua = navigator.userAgent;
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac")) return "MacOS";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Linux")) return "Linux";
    return "SO desconhecido";
  };

  // 3. BUSCAR STATUS DO SERVIDOR (PING) VIA AJAX VALIDATOR
  let serverVersion = "Desconhecida";
  let serverIp = "Desconhecido";
  let pingStatus = "Falha na comunicação (Offline/Erro)";

  if (token) {
    try {
      // Usando sua função nativa de requisição
      const resData = await window.ajaxValidator({
        validator: "ping",
        token: token,
      });

      if (resData.status) {
        const d = resData.data || {};
        serverVersion = d.version || "1.0.0";
        serverIp = d.ip || "Desconhecido";
        pingStatus = "Online";
      }
    } catch (e) {
      console.warn("Ping falhou. O usuário pode estar sem internet ou servidor offline.");
    }
  }

  // 4. PREPARAR VARIÁVEIS DE AMBIENTE
  const plataforma = `${getBrowser()} no ${getOS()}`;
  const tela = document.title || window.location.pathname;
  const dataHora = new Date().toLocaleString("pt-BR");

  // 5. MONTAR A MENSAGEM (Com formatação nativa do WhatsApp)
  const mensagem = `*SUPORTE TÉCNICO - TRILHA DA FÉ*
-----------------------------------

*DADOS DO USUÁRIO*
• *Nome:* ${usuario}
• *Perfil:* ${cargo}
• *Paróquia:* ${cliente}

*CONTEXTO DO SISTEMA*
• *Tela:* ${tela}
• *Plataforma:* ${plataforma}
• *Horário:* ${dataHora}

*STATUS DA CONEXÃO*
• *Servidor:* ${pingStatus}
• *Versão:* ${serverVersion}
• *IP:* ${serverIp}

*MOTIVO DO CHAMADO*
• *Ação Tentada:* ${acaoErro}

*DESCRIÇÃO / LOG DO ERRO:*
\`\`\`
${descricaoErro}
\`\`\``;

  // 6. GERAR LINK E ABRIR (Com Bypass para iPhone/iOS)
  const telefoneEaCode = "5581982549914";
  const url = `https://wa.me/${telefoneEaCode}?text=${encodeURIComponent(mensagem)}`;

  // Detecta se é um dispositivo Apple (iPhone, iPad, iPod)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS) {
    // No iPhone, forçamos o redirecionamento da página atual.
    // Isso aciona o "Deep Link" e o iOS pergunta se quer abrir o App do WhatsApp.
    window.location.href = url;
  } else {
    // No Android e Computador, abrir em nova aba funciona perfeitamente
    window.open(url, "_blank");
  }
};

window.alertErrorWithSupport = (acao, mensagemErro) => {
  Swal.fire({
    icon: "error",
    title: "Ops! Ocorreu um erro",
    text: mensagemErro,
    showCancelButton: true,
    confirmButtonColor: "#25D366", // Cor oficial do WhatsApp
    cancelButtonColor: "#6c757d",
    confirmButtonText: '<i class="fab fa-whatsapp me-2"></i> Contatar Suporte',
    cancelButtonText: "Fechar",
  }).then((result) => {
    if (result.isConfirmed) {
      window.abrirWhatsAppSuporte(acao, mensagemErro);
    }
  });
};

const handleToggle = async (validator, id, element, successMsg, labelSelector) => {
  const $chk = $(element);
  const $wrapper = $chk.closest(".form-check");
  const $loader = $wrapper.find(".toggle-loader");
  const $labels = $(labelSelector);
  const status = $chk.is(":checked");

  // Define os estados visuais (Feedback Imediato com Badge)
  const setVisualState = (isActive) => {
    if (isActive) {
      $labels.html('<span class="badge bg-success-subtle text-success border border-success">Ativa</span>');
    } else {
      $labels.html('<span class="badge bg-secondary-subtle text-secondary border border-secondary">Inativa</span>');
    }
  };

  try {
    // 1. Bloqueia e mostra loader
    $chk.prop("disabled", true);
    $loader.removeClass("d-none");

    // 2. Atualiza visualmente (Otimista)
    setVisualState(status);

    // 3. Chamada API
    const result = await window.ajaxValidator({
      validator: validator,
      token: defaultApp.userInfo.token,
      id: id,
      active: status,
    });

    if (result.status) {
      window.alertDefault(successMsg, "success");
    } else {
      throw new Error(result.alert || "Erro ao atualizar");
    }
  } catch (e) {
    // Reverte estado
    $chk.prop("checked", !status);
    setVisualState(!status);

    const errorMessage = e.message || "Erro de conexão com o servidor.";
    window.alertErrorWithSupport(`Alternar Status`, errorMessage);
  } finally {
    // 4. Libera
    $chk.prop("disabled", false);
    $loader.addClass("d-none");
  }
};

// =========================================================
// 5. INICIALIZAÇÃO FINAL
// =========================================================

$(document).ready(() => {
  // Monitoramento de Sessão
  checkSessionStatus();
  setInterval(checkSessionStatus, 600000); // 10 min
  setInterval(keepAlive, 300000); // 5 min

  // Remove loader inicial
  setTimeout(() => {
    $("#div-loader").fadeOut();
  }, 500);

  // Inicia componentes
  initMasks();
  initGlobalContext();
});
