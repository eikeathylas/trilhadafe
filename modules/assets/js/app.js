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
    ac: '<i class="fas fa-snowflake text-info me-2" title="Ar-Condicionado"></i>',
    fan: '<i class="fas fa-fan text-secondary me-2" title="Ventilador"></i>',
    access: '<i class="fas fa-wheelchair text-primary me-2" title="Acessibilidade"></i>',
    sacred: '<i class="fas fa-church text-warning me-2" title="Local Sagrado"></i>',
    wifi: '<i class="fas fa-wifi text-success me-2" title="Wi-Fi"></i>',
    projector: '<i class="fas fa-video text-secondary me-2" title="Projetor"></i>',
    sound: '<i class="fas fa-volume-up text-danger me-2" title="Som"></i>',
    whiteboard: '<i class="fas fa-chalkboard text-dark me-2" title="Lousa"></i>',
    computer: '<i class="fas fa-desktop text-dark me-2" title="PC"></i>',
    kitchen: '<i class="fas fa-utensils text-warning me-2" title="Cozinha"></i>',
    water: '<i class="fas fa-tint text-info me-2" title="Água"></i>',
    parking: '<i class="fas fa-parking text-muted me-2" title="Estacionamento"></i>',
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
