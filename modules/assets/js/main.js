async function getConfig() {
  try {
    load(true);

    const res = await ajaxValidator({ validator: "config", token: defaultApp.userInfo.token });

    if (res.status) {
      const s = res.data;

      $("#name").val(s.name);
      $("#email").val(s.email);
      $("#contact").val(s.contact);
      $("#key_pix").val(s.key_pix);
      $("#alert").val(s.alert);
      $("#header").val(s.header);
      $("#footer").val(s.footer);
      $("#welcome").val(s.welcome);
      $("#description").val(s.description);

      $("#reading").prop("checked", s.reading === true);
      $("#open").prop("checked", s.open === true);
      $("#products_favorites").prop("checked", s.products_favorites === true);
      $("#products_discount").prop("checked", s.products_discount === true);
    } else {
      alertDefault("Erro ao carregar configurações.", "error");
    }
  } catch (e) {
    console.log(e);
    alertDefault("Erro inesperado ao buscar configurações.", "error");
  } finally {
    load(false);
  }
}

async function setConfig() {
  let hasError = false;
  $(".required-field").each(function () {
    const $input = $(this);
    if (!$input.val().trim()) {
      $input.addClass("is-invalid");
      $input.next("small").removeClass("d-none");
      hasError = true;
    } else {
      $input.removeClass("is-invalid");
      $input.next("small").addClass("d-none");
    }
  });

  if (hasError) {
    alertDefault("Preencha os campos obrigatórios corretamente.", "warning");
    return;
  }
  const data = {
    validator: "setConfig",
    token: defaultApp.userInfo.token,
    name: $("#name").val().trim(),
    email: $("#email").val().trim(),
    contact: $("#contact").val().trim(),
    key_pix: $("#key_pix").val().trim(),
    alert: $("#alert").val().trim(),
    header: $("#header").val().trim(),
    footer: $("#footer").val().trim(),
    welcome: $("#welcome").val().trim(),
    description: $("#description").val().trim(),
  };

  if (!data.name || !data.email || !data.contact || !data.key_pix) {
    alertDefault("Preencha todos os campos obrigatórios.", "warning");
    return;
  }

  const $btn = $(".btn-theme");
  $btn.prop("disabled", true).html(`<i class="fa fa-spinner fa-spin mr-2"></i> Salvando...`);

  try {
    const res = await ajaxValidator(data);

    if (res.status) {
      alertDefault("Configurações salvas com sucesso!", "success");
    } else {
      alertDefault(res.alert || "Erro ao salvar configurações.", "error");
    }
  } catch (e) {
    alertDefault("Erro inesperado ao salvar configurações.", "error");
  } finally {
    $btn.prop("disabled", false).html(`<i class="fas fa-save"></i>  Salvar`);
  }
}

async function toggleConfig(slug) {
  const valor = $(`#${slug}`).is(":checked");

  try {
    const res = await ajaxValidator({
      validator: "toggleConfig",
      token: defaultApp.userInfo.token,
      slug: slug,
      input: valor.toString(),
    });

    if (!res.status) {
      alertDefault("Erro ao atualizar configuração: " + slug, "error");
      $(`#${slug}`).prop("checked", !valor); // desfaz
    } else {
      alertDefault("Configuração atualizada com sucesso!", "success");
    }
  } catch (e) {
    alertDefault("Erro inesperado ao alterar: " + slug, "error");
    $(`#${slug}`).prop("checked", !valor); // desfaz
  }
}

$(document).ready(() => {
  getConfig();
});
