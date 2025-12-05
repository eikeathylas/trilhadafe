// =========================================================
// CONFIGURAÇÃO DE TEMA (CLARO/ESCURO)
// =========================================================
const configTheme = (ele) => {
  let themeActive = localStorage.getItem("mode");
  let button = $('ul > li [onclick="configTheme(this)"] .icon-only'); // Seletor ajustado
  let temaBoot = $("body");

  if (ele !== undefined) {
    if (!themeActive || themeActive === "claro") {
      localStorage.setItem("mode", "escuro");
      temaBoot.attr("data-bs-theme", "dark").attr("data-theme", "escuro");
      button.html("light_mode");
    } else {
      localStorage.setItem("mode", "claro");
      temaBoot.attr("data-bs-theme", "light").attr("data-theme", "claro");
      button.html("dark_mode");
    }
  } else {
    // Carregamento inicial
    if (themeActive === "escuro") {
      temaBoot.attr("data-bs-theme", "dark").attr("data-theme", "escuro");
      button.html("light_mode");
    } else {
      temaBoot.attr("data-bs-theme", "light").attr("data-theme", "claro");
      button.html("dark_mode");
    }
  }
};
// Inicia o tema imediatamente
configTheme();

// =========================================================
// CONFIGURAÇÕES GLOBAIS DO APP
// =========================================================

const getUrl = () => {
  // Ajuste para pegar a URL base corretamente dentro de /modules/
  let path = window.location.pathname;
  let dir = path.substring(0, path.lastIndexOf("/"));
  // Se estiver em subpastas, ajuste conforme necessário.
  // Aqui assume que modules/ é a raiz do painel.
  return `${window.location.origin}${dir}`;
};

// Leitura segura do LocalStorage
const getSessionData = () => {
  try {
    return JSON.parse(localStorage.getItem("tf_data")) || {};
  } catch (e) {
    return {};
  }
};

const defaultApp = {
  userInfo: getSessionData(),
  validator: `app/validation/validation.php`,
};

// =========================================================
// FUNÇÕES UTILITÁRIAS
// =========================================================

const logOut = () => {
  localStorage.removeItem("tf_data");
  localStorage.removeItem("tf_access");
  localStorage.removeItem("tf_time");
  localStorage.removeItem("tf_time_confirm");

  // Redireciona para o login (ajuste o caminho se necessário)
  window.location.href = "../login/";
};

const load = (status = true) => {
  let divLoad = $("#div-loader");

  if (!divLoad[0]) {
    $("body").append(`
      <div id="div-loader" class="div-loader" style="display: none;">
          <span class="loader"></span>
      </div>
      `);
    divLoad = $("#div-loader");
  }

  if (status) divLoad.fadeIn(200);
  else divLoad.fadeOut(200);
};

const setButton = (status, btn, text) => {
  btn.prop("disabled", status).html(text);
};

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// =========================================================
// ALERTAS (SWEETALERT2)
// =========================================================

const alertDefault = (msg = "Ação realizada!", icon = "success", time = 4, position = "top-end") => {
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

// =========================================================
// COMUNICAÇÃO AJAX (FETCH/VALIDATION)
// =========================================================

const ajaxValidator = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: defaultApp.validator,
      data,
      dataType: "json",
      type: "POST",
      success: (response) => {
        resolve(response);
      },
      error: (xhr, status, error) => {
        // Se der erro de autenticação (401/403), desloga
        if (xhr.status === 401 || xhr.status === 403) {
          logOut();
        }
        reject(error);
      },
    });
  });
};

const ajaxValidatorFoto = (data) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: defaultApp.validator,
      data,
      dataType: "json",
      type: "POST",
      processData: false,
      contentType: false,
      success: (response) => {
        resolve(response);
      },
      error: (xhr, status, error) => {
        reject(error);
      },
    });
  });
};

// =========================================================
// CONTROLE DE SESSÃO E VERSÕES
// =========================================================

const validateToken = () => {
  // Verifica se o token ainda é válido no servidor
  ajaxValidator({ validator: "token", token: defaultApp.userInfo.token })
    .then((json) => {
      if (json.status && json.data.logout) {
        alertDefault("Sessão expirada.", "warning");
        setTimeout(logOut, 2000);
      }
      // Atualiza o timestamp local da última verificação
      localStorage.setItem("tf_time", Date.now());
    })
    .catch(() => {
      // Se falhar a comunicação, não desloga imediatamente para evitar problemas de rede intermitente
      console.warn("Falha ao validar token (Rede).");
    });
};

const confirmToken = () => {
  // "Ping" para manter a sessão ativa no banco (Update last_activity)
  ajaxValidator({ validator: "confirm", token: defaultApp.userInfo.token }).then((json) => {
    if (json.status) {
      localStorage.setItem("tf_time_confirm", Date.now());
    }
  });
};

const changeLogs = () => {
  if (!defaultApp.userInfo.versions) return;

  // Lógica de Changelog baseada no JSON recebido no login
  // Adaptado para ler 'tf_data' em vez de 'eadata'
  let logs = defaultApp.userInfo.versions;
  let items = "";

  logs.forEach((v) => {
    let versions = [];
    try {
      // O banco retorna versions como string JSON, precisamos parsear se necessário
      versions = typeof v.versions === "string" ? JSON.parse(v.versions) : v.versions;
    } catch (e) {
      versions = [];
    }

    let features = "";

    if (versions && versions.length > 0 && versions[0].title_version) {
      versions.forEach((v2) => {
        features += `
        <div class="feature">
          <div class="${v2.tag_version}">${v2.title_version}</div>
          <p>${v2.description_version}</p>
        </div>
        `;
      });
    }

    items += `
        <div class="item">
            <div class="timeline">
                <div>
                    <div class="meta">
                        <div class="version">v${v.version}</div>
                        <div class="release-date">${v.date ? v.date.split("-").reverse().join("/") : ""}</div>
                    </div>
                    <div class="connector"><div></div></div>
                </div>
            </div>
            <div class="content">
                <h3>${v.title}</h3>
                <p>${v.description}</p>
                ${features}
            </div>
        </div>
    `;
  });

  Swal.fire({
    width: 800,
    title: "Novidades do Sistema",
    html: `<div id="page-container">
              <section>
                  <div id="changelogs">
                      <div id="items">${items}</div>
                  </div>
              </section>
            </div>`,
    icon: "info",
    customClass: {
      popup: "changelog-popup",
    },
  });
};

// =========================================================
// LOOP DE VERIFICAÇÃO DE SESSÃO
// =========================================================

function verificarSessao() {
  const now = Date.now();

  // Se não tiver token, nem roda
  if (!defaultApp.userInfo.token) {
    // Evita loop infinito se estiver na tela de login, mas aqui estamos em modules/
    // logOut();
    return;
  }

  const timeLogin = parseInt(localStorage.getItem("tf_time") || 0);
  const timeConfirm = parseInt(localStorage.getItem("tf_time_confirm") || 0);

  const minutos = (ms) => Math.floor((now - ms) / 60000);

  const loginMin = minutos(timeLogin);
  const confirmMin = minutos(timeConfirm);

  // Lógica:
  // 1. Confirma presença (Heartbeat) a cada 5 minutos
  if (confirmMin >= 5) {
    confirmToken();
  }

  // 2. Valida se o servidor não derrubou a sessão a cada 15 minutos
  if (loginMin >= 15) {
    validateToken();
  }
}

// Executa na carga da página
// verificarSessao();

// Loop a cada 30 segundos (reduzi de 10s para economizar requisições)
// setInterval(verificarSessao, 30000);
