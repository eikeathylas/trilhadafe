// =========================================================
// 1. CONFIGURAÇÃO DE TEMA (CLARO/ESCURO)
// =========================================================
const configTheme = (ele) => {
  let themeActive = localStorage.getItem("mode");
  let button = $('ul > li [onclick="configTheme(this)"] .icon-only');
  let temaBoot = $("body");

  if (ele !== undefined) {
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
    // Carregamento inicial
    if (themeActive === "escuro") {
      temaBoot.attr("data-bs-theme", "dark").attr("data-theme", "escuro");
      if (button.length) button.html("light_mode");
    } else {
      temaBoot.attr("data-bs-theme", "light").attr("data-theme", "claro");
      if (button.length) button.html("dark_mode");
    }
  }
};
// Inicia o tema
configTheme();

// =========================================================
// 2. CONFIGURAÇÕES GLOBAIS E SESSÃO
// =========================================================

// Leitura segura do LocalStorage
const getSessionData = () => {
  try {
    return JSON.parse(localStorage.getItem("tf_data")) || {};
  } catch (e) {
    return {};
  }
};

// Objeto Global da Aplicação
window.defaultApp = {
  userInfo: getSessionData(),
  validator: `app/validation/validation.php`,
};

const getUrl = () => {
  let path = window.location.pathname;
  let dir = path.substring(0, path.lastIndexOf("/"));
  return `${window.location.origin}${dir}`;
};

// =========================================================
// 3. FUNÇÕES UTILITÁRIAS (AJAX, ALERTS, UI)
// =========================================================

// Função de Logout Global
window.logOut = (reason = null) => {
  // Limpa dados sensíveis
  localStorage.removeItem("tf_data");
  localStorage.removeItem("tf_access");

  if (reason) {
    alert("Sessão encerrada: " + reason);
  }

  // Redireciona para o login
  window.location.href = "../login/";
};

// Loader (Tela de Carregamento)
window.load = (status = true) => {
  let divLoad = $("#div-loader");
  if (!divLoad[0]) {
    $("body").append(`<div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>`);
    divLoad = $("#div-loader");
  }

  if (status) divLoad.fadeIn(200);
  else divLoad.fadeOut(200);
};

// Controle de Botões
window.setButton = (status, btn, text) => {
  btn.prop("disabled", status).html(text);
};

// Formatador de Moeda
window.formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Alertas (SweetAlert2)
window.alertDefault = (msg = "Ação realizada!", icon = "success", time = 4, position = "top-end") => {
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

// Wrapper AJAX Padrão (Promise)
window.ajaxValidator = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: window.defaultApp.validator,
      data,
      dataType: "json",
      type: "POST",
      success: (response) => {
        resolve(response);
      },
      error: (xhr, status, error) => {
        // Se der erro de autenticação (401/403), força logout
        if (xhr.status === 401 || xhr.status === 403) {
          console.warn("Erro de autenticação no AJAX.");
          window.logOut();
        }
        reject(error);
      },
    });
  });
};

// =========================================================
// 4. MOTOR DE SESSÃO (PING ECONÔMICO)
// =========================================================

// A. Validação de Status (Roda a cada 5 min)
// Verifica se o token ainda existe ou se há bloqueio financeiro
const checkSessionStatus = () => {
  if (!defaultApp.userInfo.token) return;

  ajaxValidator({
    validator: "token",
    token: defaultApp.userInfo.token,
  })
    .then((json) => {
      if (json.status && json.data.logout) {
        // O servidor mandou deslogar
        let msg = "Sessão expirada.";

        // Verifica se é bloqueio financeiro
        if (json.data.reason === "financial") {
          msg = "Acesso suspenso. Entre em contato com a administração.";
        }

        Swal.fire({
          icon: "warning",
          text: msg,
          confirmButtonColor: "#5C8EF1",
          allowOutsideClick: false,
        }).then(() => {
          window.logOut();
        });
      }
    })
    .catch(() => console.warn("Falha ao verificar sessão (Rede)."));
};

// B. Renovação de Sessão (Roda a cada 10 min)
// Diz ao banco: "Estou aqui, não me derrube por inatividade"
const keepAlive = () => {
  if (!defaultApp.userInfo.token) return;

  ajaxValidator({
    validator: "confirm",
    token: defaultApp.userInfo.token,
  }).then((json) => {
    if (json.status) {
      console.log("Sessão renovada com sucesso.");
    }
  });
};

// C. Inicialização dos Timers
$(document).ready(() => {
  // Verifica imediatamente ao carregar
  checkSessionStatus();

  // Loop de Validação (5 minutos = 300.000 ms)
  setInterval(checkSessionStatus, 300000);

  // Loop de Renovação (10 minutos = 600.000 ms)
  setInterval(keepAlive, 600000);

  // Remove loader inicial se existir
  setTimeout(() => {
    $("#div-loader").fadeOut();
  }, 500);
});
