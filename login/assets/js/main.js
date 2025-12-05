(function (window, document) {
  "use strict";
  const supports = !!document.querySelector;

  const settings = {};

  const defaults = {
    // Ajuste o caminho conforme sua pasta real
    validator: "app/validation/validation.php", 
    jsonData: [],
    // Chaves que serão limpas ao carregar a página (Logout forçado)
    keysToRemove: ["tf_data", "tf_access", "tf_time"],
    minLength: 5,
    eleEmail: $("#email"),
    elePassword: $("#password"),
    btnLogin: $(".btn-login"),
    btnVoltar: $(".btn-voltar"),
    btnAcessar: $(".btn-acessar"),
    btnToggle: $(".toggle-password"),
    loginPart: $(".form-login"),
    acessarPart: $(".form-toEnter"),
    selectCliente: $("#clients"),
    btnEsqueciSenha: $(".forgot-password"),
    btnResetPassword: $(".btn-resetPassword"),
    login: $(".login"),
    resetPassword: $(".resetPassword"),
    resetEmail: $("#resetEmail"),
    resetCode: $("#resetCode"),
    resetNewPassword: $("#resetNewPassword"),
    resetConfirmNewpassword: $("#resetConfirmNewpassword"),
    btnResetEmail: $(".btn-resetEmail"),
    divResetEmail: $(".resetEmail"),
    divResetCode: $(".resetCode"),
    divResetNewPassword: $(".resetNewPassword"),
    divResetConfirmNewpassword: $(".resetConfirmNewpassword"),
    divReset: $(".divReset"),
  };

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 4000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const main = () => {
    // Limpa sessão antiga ao abrir a tela de login
    defaults.keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  // Etapa 1: Validar Credenciais e Buscar Paróquias
  const validar = async () => {
    // Gera um token temporário de handshake (Client-Side)
    const token = Math.random().toString(16).slice(2);

    settings.eleEmail.removeClass("is-invalid");
    settings.elePassword.removeClass("is-invalid");
    $("#emailError, #passwordError").addClass("d-none");

    if (!validarInput(settings.eleEmail.val(), "e-mail")) {
      settings.eleEmail.addClass("is-invalid");
      $("#emailError").removeClass("d-none");
      settings.eleEmail.focus();
      return;
    }

    if (!validarInput(settings.elePassword.val(), "senha")) {
      settings.elePassword.addClass("is-invalid");
      $("#passwordError").removeClass("d-none");
      settings.elePassword.focus();
      return;
    }

    setButton(true, settings.btnLogin, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Autenticando...');

    try {
      let result = await ajaxLogin({
        validator: "login",
        token: token,
        email: settings.eleEmail.val().trim().toLowerCase(),
        password: settings.elePassword.val().trim(), // Senha não deve ter toLowerCase()
      });

      if (result.status) {
        let jsonData = result.data;
        let options = [];

        // O PHP retorna 'information' como string JSON, precisamos parsear
        // Se já vier como objeto, remova o JSON.parse
        let clientsList = typeof jsonData.information === 'string' ? JSON.parse(jsonData.information) : jsonData.information;
        
        defaults.jsonData = jsonData;

        // Popula o Select com as Paróquias disponíveis para este usuário
        clientsList.forEach((v) => {
          options.push({ id: v.id_client, title: v.name_client });
        });

        // Inicializa o Selectize (Dropdown bonito)
        var $select = settings.selectCliente.selectize({
          valueField: "id",
          labelField: "title",
          searchField: ["title"],
          options: options,
          create: false,
          placeholder: "Selecione a Paróquia...",
          onInitialize: function () {
            // Se só tiver uma paróquia, seleciona automaticamente
            if (options.length === 1) {
              this.setValue(options[0].id);
            }
          },
        });

        // Troca a tela (Login -> Seleção de Cliente)
        settings.loginPart.fadeOut(200, () => {
            settings.acessarPart.fadeIn(200);
        });
        
      } else {
        Swal.fire({
          icon: "error",
          title: "Acesso Negado",
          text: result.alert || "Usuário ou senha incorretos.",
          confirmButtonColor: "#5C8EF1",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: "Erro de comunicação com o servidor.",
      });
    } finally {
      setButton(false, settings.btnLogin, "Entrar");
    }
  };

  // Etapa 2: Entrar na Paróquia Escolhida
  const toEnter = async () => {
    const token = Math.random().toString(16).slice(2);
    settings.selectCliente.removeClass("is-invalid");
    $("#clientsError").addClass("d-none");

    if (!settings.selectCliente.val()) {
      $("#clientsError").removeClass("d-none");
      // Força foco no selectize
      let selectize = settings.selectCliente[0].selectize;
      selectize.focus();
      return;
    }

    setButton(true, settings.btnAcessar, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Acessando ambiente...');

    try {
      // Envia o ID do usuário (recuperado no passo 1) e o ID do cliente escolhido
      let result = await ajaxLogin({
        validator: "toEnter",
        token: `${token}@${defaults.jsonData.id}`, // Formato: HASH@ID_USER
        clients: settings.selectCliente.val(),
      });

      if (result.status) {
        let jsonData = result.data;
        let timeCurrent = new Date().getTime();

        // Armazena dados criptografados/sessão no LocalStorage
        // Importante: "tf_" prefixo para evitar conflito com outros apps
        localStorage.setItem("tf_data", JSON.stringify(jsonData)); // Dados do usuário
        localStorage.setItem("tf_access", JSON.stringify(result.data.access)); // Permissões (Menu)
        localStorage.setItem("tf_time", timeCurrent);

        // Sucesso! Redireciona para o Dashboard
        Toast.fire({
            icon: "success",
            title: "Acesso liberado! Redirecionando..."
        });

        setTimeout(() => {
            // Caminho para o módulo principal
            window.location.href = "../modules/index.php"; 
        }, 200);

      } else {
        Swal.fire({
          icon: "warning",
          title: "Atenção",
          text: result.alert,
          confirmButtonColor: "#5C8EF1",
        });
      }
    } catch (error) {
      console.error(error);
      Toast.fire({
        icon: "error",
        title: "Erro ao tentar acessar o ambiente.",
      });
    } finally {
      setButton(false, settings.btnAcessar, "Acessar");
    }
  };

  // Funções Utilitárias e de Recuperação de Senha

  const forgotPassword = () => {
    settings.resetEmail.val(settings.eleEmail.val());
    settings.login.fadeOut(200, () => {
        settings.resetPassword.fadeIn(200);
    });
  };

  const sendMail = async () => {
    let token = Math.random().toString(16).slice(2);

    if (!validarInput(settings.resetEmail.val(), "e-mail")) {
      settings.resetEmail.focus();
      return;
    }

    setButton(true, settings.btnResetEmail, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

    try {
      let result = await ajaxLogin({
        validator: "sendMail",
        token: token,
        email: settings.resetEmail.val().trim().toLowerCase(),
      });
      if (result.status) {
        settings.divResetEmail.hide();
        settings.divResetCode.show();
        settings.divResetNewPassword.show();
        settings.divResetConfirmNewpassword.show();
        settings.divReset.show();
        Toast.fire({ icon: "success", title: "Código enviado para o e-mail!" });
      } else {
        Toast.fire({ icon: "error", title: result.alert });
      }
    } catch (error) {
      Toast.fire({ icon: "error", title: "Erro ao enviar e-mail." });
    } finally {
      setButton(false, settings.btnResetEmail, "Enviar");
    }
  };

  const resetPassword = async () => {
    const fields = [settings.resetEmail, settings.resetCode, settings.resetNewPassword, settings.resetConfirmNewpassword];
    if (fields.some((field) => field.val() === "")) {
        Toast.fire({ icon: "warning", title: "Preencha todos os campos." });
        return false;
    }

    if (settings.resetNewPassword.val() !== settings.resetConfirmNewpassword.val()) {
        Toast.fire({ icon: "error", title: "As senhas não coincidem." });
        return false;
    }

    let token = Math.random().toString(16).slice(2);
    setButton(true, settings.btnResetPassword, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

    try {
      let result = await ajaxLogin({
        validator: "resetPassword",
        token: token,
        resetEmail: settings.resetEmail.val().trim().toLowerCase(),
        resetCode: settings.resetCode.val(),
        resetNewPassword: settings.resetNewPassword.val(),
      });
      if (result.status) {
        Swal.fire({
            icon: "success",
            title: "Senha Alterada",
            text: "Sua senha foi redefinida com sucesso. Faça login.",
            confirmButtonColor: "#5C8EF1"
        }).then(() => {
            window.location.reload();
        });
      } else {
        Toast.fire({ icon: "error", title: result.alert });
      }
    } catch (error) {
      Toast.fire({ icon: "error", title: "Erro ao redefinir senha." });
    } finally {
      setButton(false, settings.btnResetPassword, "Redefinir");
    }
  };

  const toggle = (e) => {
    $(e).toggleClass("fa-eye fa-eye-slash");
    let input = $($(e).attr("toggle"));
    input.attr("type", input.attr("type") === "password" ? "text" : "password");
  };

  const analyzer = (event) => {
    if (event.key === "Enter") validar();
  };

  const setButton = (status, btn, text) => {
    btn.prop("disabled", status).html(text);
  };

  const validarInput = (input, fieldName) => {
    if (!input || input.length < defaults.minLength) {
      Toast.fire({
        icon: "warning",
        title: `Informe um ${fieldName} válido (mínimo ${defaults.minLength} caracteres).`,
      });
      return false;
    }
    return true;
  };

  const ajaxLogin = (data) => {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: defaults.validator,
        data,
        dataType: "json",
        type: "POST",
        success: (response) => resolve(response),
        error: (xhr, status, error) => reject(error),
      });
    });
  };

  const setUp = () => {
    settings.eleEmail = defaults.eleEmail;
    settings.elePassword = defaults.elePassword;
    settings.btnLogin = defaults.btnLogin;
    settings.btnVoltar = defaults.btnVoltar;
    settings.btnAcessar = defaults.btnAcessar;
    settings.btnToggle = defaults.btnToggle;
    settings.loginPart = defaults.loginPart;
    settings.acessarPart = defaults.acessarPart;
    settings.selectCliente = defaults.selectCliente;
    settings.btnEsqueciSenha = defaults.btnEsqueciSenha;
    settings.btnResetPassword = defaults.btnResetPassword;
    settings.login = defaults.login;
    settings.resetPassword = defaults.resetPassword;
    settings.btnResetEmail = defaults.btnResetEmail;
    settings.divResetCode = defaults.divResetCode;
    settings.divResetNewPassword = defaults.divResetNewPassword;
    settings.divResetConfirmNewpassword = defaults.divResetConfirmNewpassword;
    settings.divReset = defaults.divReset;
    settings.divResetEmail = defaults.divResetEmail;
    settings.resetEmail = defaults.resetEmail;
    settings.resetCode = defaults.resetCode;
    settings.resetNewPassword = defaults.resetNewPassword;
    settings.resetConfirmNewpassword = defaults.resetConfirmNewpassword;
  };

  const events = () => {
    window.addEventListener("load", main);
    settings.btnToggle.on("click", function () { toggle(this); });
    settings.btnVoltar.on("click", function () { window.location.reload(); });
    settings.btnLogin.on("click", validar);
    settings.btnAcessar.on("click", toEnter);
    settings.eleEmail.on("keydown", analyzer);
    settings.elePassword.on("keydown", analyzer);
    settings.btnEsqueciSenha.on("click", forgotPassword);
    settings.btnResetEmail.on("click", sendMail);
    settings.btnResetPassword.on("click", resetPassword);
  };

  const init = () => {
    if (!supports) return;
    setUp();
    events();
  };

  init();
})(window, document);