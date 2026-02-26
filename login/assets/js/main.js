/* ==========================================================
   MOTOR DE ACESSO E SEGURANÇA - TRILHA DA FÉ V5.0
   ========================================================== */

const LoginApp = (() => {
  "use strict";

  // --- 1. CONFIGURAÇÕES PRIVADAS ---
  const config = {
    validator: "app/validation/validation.php", // Caminho do seu backend
    tokenFull: ""
  };

  // --- 2. INICIALIZAÇÃO E TEMA ---
  const init = () => {
    applyTheme();
    protectConsole();
    bindEvents();
    // Não limpamos o storage todo aqui para preservar o tema escolhido
  };

  const applyTheme = () => {
    const data = localStorage.getItem("mode") || "claro";
    if (data === "escuro") document.body.classList.add("dark-mode");
  };

  const toggleTheme = () => {
    const isDark = document.body.classList.toggle("dark-mode");
    let data = localStorage.getItem("mode") || "claro";
    data = isDark ? "escuro" : "claro";
    localStorage.setItem("mode", data);
  };

  // --- 3. SEGURANÇA FRONT-END ---
  const protectConsole = () => {
    console.log("%cPARE!", "color: red; font-size: 40px; font-weight: bold;");
    console.log("Este recurso é para desenvolvedores. Não cole códigos aqui.");
    setInterval(() => {
      (function () { return false; }['constructor']('debugger')['call']());
    }, 1000);
  };

  // --- 4. FEEDBACK VISUAL PREMIUM ---
  const triggerError = (selector) => {
    const $el = $(selector);
    $el.addClass("is-invalid-shake is-invalid");
    setTimeout(() => $el.removeClass("is-invalid-shake"), 400);
  };

  const loading = (active, selector) => {
    const $ele = $(selector);
    if (active) {
      $ele.prop("disabled", true).css("pointer-events", "none");

      if ($ele.hasClass("unit-card")) {
        const $icon = $ele.find("i");
        if (!$icon.data("original-class")) $icon.data("original-class", $icon.attr("class"));
        $icon.attr("class", "fa-solid fa-circle-notch fa-spin");
        $ele.css("opacity", "0.6");
      } else {
        if (!$ele.data("original-text")) $ele.data("original-text", $ele.html());
        $ele.html('<i class="fa-solid fa-circle-notch fa-spin me-2"></i>Processando...');
        $ele.css("opacity", "0.8");
      }
    } else {
      $ele.prop("disabled", false).css("pointer-events", "auto");

      if ($ele.hasClass("unit-card")) {
        const $icon = $ele.find("i");
        $icon.attr("class", $icon.data("original-class"));
        $ele.css("opacity", "1");
      } else {
        $ele.html($ele.data("original-text"));
        $ele.css("opacity", "1");
      }
    }
  };

  // --- 5. FLUXO DE AUTENTICAÇÃO (LOGIN) ---
  const login = async () => {
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();
    const honey = $("#honey").val(); // Proteção contra Bots

    if (honey) return;

    $(".form-control").removeClass("is-invalid");

    if (!email || !password) {
      if (!email) triggerError("#email");
      if (!password) triggerError("#password");
      return;
    }

    loading(true, ".btn-login");
    try {
      const res = await $.post(config.validator, { validator: "login", email, password, token: "active" });
      const response = JSON.parse(res);

      if (response.status) {
        // Compatibilidade com o backend: Passamos 'active@ID_USUARIO'
        config.tokenFull = `active@${response.data.id}`;

        // Exibe o nome do utilizador, renderiza os cards e muda de ecrã
        $("#userNameDisplay").text(response.data.name);

        // Parse necessário caso a string venha como JSON do backend
        let information = typeof response.data.information === 'string' ? JSON.parse(response.data.information) : response.data.information;
        renderUnits(information);

        switchSection("access");
      } else {
        triggerError("#email");
        triggerError("#password");
        Swal.fire("Atenção", response.alert, "warning");
      }
    } catch (e) {
      Swal.fire("Erro", "Falha de comunicação com o servidor.", "error");
    } finally {
      loading(false, ".btn-login");
    }
  };

  // --- 6. SELEÇÃO DE UNIDADE E REDIRECIONAMENTO ---
  const renderUnits = (units) => {
    const $container = $("#unitsContainer");
    $container.empty();

    units.forEach(unit => {
      const card = `
                <div class="unit-card" data-id="${unit.id_client}" data-name="${unit.name_client.toLowerCase()}">
                    <i class="fa-solid fa-church"></i>
                    <div class="unit-name">${unit.name_client}</div>
                </div>
            `;
      $container.append(card);
    });
  };

  const handleUnitSelection = function () {
    const clientId = $(this).data("id");
    loading(true, this); // Spinner na paróquia clicada

    $.post(config.validator, {
      validator: "toEnter",
      clients: clientId,
      token: config.tokenFull
    }, (res) => {
      const response = JSON.parse(res);
      if (response.status) {
        let jsonData = response.data;
        let timeCurrent = new Date().getTime();

        // Mantém o tema atual antes de subscrever o tf_data
        const currentData = JSON.parse(localStorage.getItem("tf_data") || "{}");
        jsonData.theme = currentData.theme;

        // Salva rigorosamente nos padrões do sistema original
        localStorage.setItem("tf_data", JSON.stringify(jsonData));
        localStorage.setItem("tf_access", JSON.stringify(jsonData.access));
        localStorage.setItem("tf_time", timeCurrent);

        // Redirecionamento dinâmico lido do banco de dados (link)
        if (jsonData.link && jsonData.link !== "null" && jsonData.link !== "") {
          window.location.href = jsonData.link;
        } else {
          window.location.href = "../modules/dashboard.php"; // Fallback seguro
        }
      } else {
        Swal.fire("Erro", response.alert, "error");
        loading(false, this);
      }
    }).fail(() => {
      Swal.fire("Erro", "Falha na conexão.", "error");
      loading(false, this);
    });
  };

  // --- 7. LÓGICA OTP E REDEFINIÇÃO DE SENHA ---
  const sendResetCode = () => {
    const email = $("#resetEmail").val().trim();
    if (!email) return triggerError("#resetEmail");

    loading(true, ".btn-resetEmail");
    $.post(config.validator, { validator: "sendMail", email, token: "active" }, (res) => {
      const response = JSON.parse(res);
      if (response.status) {
        $("#reset-steps").fadeIn();
        $(".resetEmail-div").hide();
        $(".otp-input").first().focus();
      } else {
        triggerError("#resetEmail");
        Swal.fire("Erro", response.alert, "error");
      }
      loading(false, ".btn-resetEmail");
    });
  };

  const bindOtpLogic = () => {
    const inputs = $(".otp-input");

    inputs.on("input", function () {
      const val = $(this).val();
      if (/[^0-9]/.test(val)) {
        $(this).val(val.replace(/[^0-9]/g, ''));
        return;
      }
      if (val !== "") {
        const next = $(this).next(".otp-input");
        if (next.length) next.focus();
      }
      updateOtpCode();
    });

    inputs.on("keydown", function (e) {
      if (e.key === "Backspace" && $(this).val() === "") {
        const prev = $(this).prev(".otp-input");
        if (prev.length) prev.focus().val("");
      }
      updateOtpCode();
    });

    // Permitir colar os 6 números (Ctrl+V)
    inputs.on("paste", function (e) {
      e.preventDefault();
      const pastedData = (e.originalEvent || e).clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      if (pastedData) {
        inputs.each(function (i) { $(this).val(pastedData[i] || ""); });
        inputs.eq(pastedData.length < 6 ? pastedData.length : 5).focus();
        updateOtpCode();
      }
    });
  };

  const updateOtpCode = () => {
    let code = "";
    $(".otp-input").each(function () { code += $(this).val(); });
    $("#resetCode").val(code);

    if (code.length === 6) {
      $("#new-password-fields").slideDown();
    } else {
      $("#new-password-fields").slideUp();
    }
  };

  const executeReset = () => {
    const pass = $("#resetNewPassword").val();
    const confirm = $("#resetConfirmNewpassword").val();
    const code = $("#resetCode").val();

    if (code.length < 6) return Swal.fire("Atenção", "Preencha todo o código de 6 dígitos.", "warning");

    if (pass !== confirm || !pass) {
      triggerError("#resetNewPassword");
      triggerError("#resetConfirmNewpassword");
      return Swal.fire("Erro", "As senhas não coincidem.", "error");
    }

    loading(true, ".btn-resetPassword");
    $.post(config.validator, {
      validator: "resetPassword",
      resetEmail: $("#resetEmail").val(),
      resetCode: code,
      resetNewPassword: pass,
      resetConfirmNewpassword: confirm,
      token: "active"
    }, (res) => {
      const response = JSON.parse(res);
      if (response.status) {
        Swal.fire("Sucesso", response.alert, "success").then(() => location.reload());
      } else {
        Swal.fire("Erro", response.alert, "error");
      }
      loading(false, ".btn-resetPassword");
    });
  };

  // --- 8. EVENTOS GLOBAIS ---
  const bindEvents = () => {
    $(".btn-login").on("click", login);
    $(".btn-voltar").on("click", () => location.reload()); // Logout / Voltar ao inicio
    $(".forgot-password").on("click", () => switchSection("reset"));
    $(".btn-resetEmail").on("click", sendResetCode);
    $(".btn-resetPassword").on("click", executeReset);
    $("#toggleTheme").on("click", toggleTheme);

    // Submeter login com a tecla ENTER
    $("#email, #password").on("keypress", function (e) {
      if (e.which === 13) login();
    });

    // Alternar Visibilidade da Senha (O "Olhinho") - Funciona para todos
    $(".toggle-password").on("click", function () {
      const input = $(this).siblings("input");
      const isPassword = input.attr("type") === "password";
      input.attr("type", isPassword ? "text" : "password");
      $(this).toggleClass("fa-eye fa-eye-slash");
    });

    // Delegação de evento para clicar no Card de Unidade
    $("#unitsContainer").on("click", ".unit-card", handleUnitSelection);

    // Busca Inteligente de Unidades
    $("#searchUnit").on("keyup", function () {
      const term = $(this).val().toLowerCase();
      $("#clearSearch").toggle(term.length > 0);
      $(".unit-card").each(function () {
        $(this).toggle($(this).data("name").includes(term));
      });
    });

    $("#clearSearch").on("click", () => {
      $("#searchUnit").val("").trigger("keyup");
      $("#clearSearch").hide();
    });

    bindOtpLogic(); // Inicia monitorização dos quadrados OTP
  };

  const switchSection = (target) => {
    $(".section-fade").hide();
    $(`#section-${target}`).fadeIn();
  };

  // Retorna a função de inicialização para ser chamada
  return { init };

})();

// Arranca o módulo assim que o documento estiver pronto
$(document).ready(() => LoginApp.init());