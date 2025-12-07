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
configTheme();

// =========================================================
// 2. CONFIGURAÇÕES GLOBAIS
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

// =========================================================
// 3. UTILITÁRIOS GLOBAIS (O QUE VOCÊ PEDIU)
// =========================================================

// MÁSCARAS GLOBAIS
// Use classes no HTML: .mask-cpf, .mask-cnpj, .mask-phone, .mask-cep
window.initMasks = () => {
  if ($.fn.mask) {
    $(".mask-date").mask("00/00/0000");
    $(".mask-time").mask("00:00:00");
    $(".mask-cep").mask("00000-000");
    $(".mask-cpf").mask("000.000.000-00", { reverse: true });
    $(".mask-cnpj").mask("00.000.000/0000-00", { reverse: true });
    $(".mask-money").mask("000.000.000,00", { reverse: true });

    // Máscara dinâmica para telefone (8 ou 9 dígitos)
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

// BOTÃO DE LOADING (Salvando...)
window.setButton = (isLoading, element, originalText = "Salvar") => {
  if (isLoading) {
    element.prop("disabled", true);
    element.html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processando...');
  } else {
    element.prop("disabled", false);
    element.html(originalText);
  }
};

// BIBLIOTECA DE ÍCONES DE RECURSOS (Para Tabelas)
window.getResourceIcon = (key) => {
  // Nota: Em Bootstrap 5, usa-se 'me-2' (margin-end) e não 'mr-2'
  const icons = {
    // Estruturais
    ac: '<i class="fas fa-snowflake text-info me-2" title="Ar-Condicionado"></i>',
    fan: '<i class="fas fa-fan text-secondary me-2" title="Ventilador"></i>',
    access: '<i class="fas fa-wheelchair text-primary me-2" title="Acessibilidade (PCD)"></i>',
    sacred: '<i class="fas fa-church text-warning me-2" title="Local Sagrado / Altar"></i>',

    // Equipamentos
    wifi: '<i class="fas fa-wifi text-success me-2" title="Wi-Fi Disponível"></i>',
    projector: '<i class="fas fa-video text-secondary me-2" title="Projetor / TV"></i>',
    sound: '<i class="fas fa-volume-up text-danger me-2" title="Sistema de Som"></i>',
    whiteboard: '<i class="fas fa-chalkboard text-dark me-2" title="Quadro / Lousa"></i>',
    computer: '<i class="fas fa-desktop text-dark me-2" title="Computadores"></i>',

    // Apoio
    kitchen: '<i class="fas fa-utensils text-warning me-2" title="Cozinha / Copa"></i>',
    water: '<i class="fas fa-tint text-info me-2" title="Bebedouro Próximo"></i>',
    parking: '<i class="fas fa-parking text-muted me-2" title="Estacionamento"></i>',
  };
  return icons[key] || "";
};

// GERADOR DE TOGGLE SWITCH (Para Tabelas)
window.renderToggle = (id, isChecked, onChangeFunction) => {
  const checkedAttr = isChecked ? "checked" : "";
  // Passamos 'this' para o JS manipular o botão
  return `
        <div class="form-check form-switch d-flex justify-content-center align-items-center">
            <input class="form-check-input toggleSwitch" type="checkbox" 
                   onchange="${onChangeFunction}(${id}, this)" ${checkedAttr}>
            <div class="spinner-border spinner-border-sm text-primary ms-2 d-none toggle-loader" role="status"></div>
        </div>
    `;
};

// =========================================================
// 4. FUNÇÕES CORE (LOGOUT, LOAD, ALERTAS)
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
          console.warn("Erro de autenticação.");
          window.logOut();
        }
        reject(error);
      },
    });
  });
};

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
        if (xhr.status === 401 || xhr.status === 403) {
          console.warn("Erro de autenticação.");
          window.logOut();
        }
        reject(error);
      },
    });
  });
};


// =========================================================
// 5. MOTOR DE SESSÃO
// =========================================================

const checkSessionStatus = () => {
  if (!defaultApp.userInfo.token) return;
  ajaxValidator({ validator: "token", token: defaultApp.userInfo.token })
    .then((json) => {
      if (json.status && json.data.logout) {
        let msg = "Sessão expirada.";
        if (json.data.reason === "financial") msg = "Acesso suspenso. Contate o financeiro.";

        Swal.fire({ icon: "warning", title: "Atenção", text: msg, confirmButtonColor: "#5C8EF1", allowOutsideClick: false }).then(() => window.logOut());
      }
    })
    .catch(() => console.warn("Falha ao verificar sessão."));
};

const keepAlive = () => {
  if (!defaultApp.userInfo.token) return;
  ajaxValidator({ validator: "confirm", token: defaultApp.userInfo.token });
};

$(document).ready(() => {
  checkSessionStatus();
  setInterval(checkSessionStatus, 300000); // 5 min
  setInterval(keepAlive, 600000); // 10 min

  setTimeout(() => {
    $("#div-loader").fadeOut();
  }, 500);

  // Inicializa máscaras globais ao carregar
  initMasks();
});
