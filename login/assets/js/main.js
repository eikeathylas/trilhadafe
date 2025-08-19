(function (window, document) {
  "use strict";
  const supports = !!document.querySelector;

  const settings = {};

  const defaults = {
    validator: `${window.location.origin}${["http://localhost", "https://localhost", "http://192.168.0.11"].includes(window.location.origin) ? "/trilhodafe" : ""}/login/app/validation/validation.php`,
    jsonData: [],
    keysToRemove: ["mode", "eadata", "eaaccess", "eatime", "eatimeconfirm", "eatimepayment"],
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
    defaults.keysToRemove.forEach((key) => localStorage.removeItem(key));
  };

  const validar = async () => {
    const token = Math.random().toString(16).slice(2);

    settings.eleEmail.removeClass("is-invalid");
    settings.elePassword.removeClass("is-invalid");
    $("#emailError, #passwordError").addClass("d-none");

    if (!validarInput(settings.eleEmail.val(), "e-mail")) {
      settings.eleEmail.addClass("is-invalid");
      $("#emailError").addClass("d-none");
      settings.eleEmail.focus();
      return;
    }

    if (!validarInput(settings.elePassword.val(), "senha")) {
      settings.elePassword.addClass("is-invalid");
      $("#passwordError").addClass("d-none");
      settings.elePassword.focus();
      return;
    }

    setButton(true, settings.btnLogin, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando informações...');

    try {
      let result = await ajaxLogin({
        validator: "login",
        token: token,
        email: settings.eleEmail.val().trim().toLowerCase(),
        password: settings.elePassword.val().trim().toLowerCase(),
      });

      if (result.status) {
        let jsonData = result.data;
        let options = [];

        jsonData.information = JSON.parse(jsonData.information);
        defaults.jsonData = jsonData;

        jsonData.information.forEach((v, i) => {
          options.push({ id: v.id_client, title: v.name_client });
        });

        settings.selectCliente.selectize({
          valueField: "id",
          labelField: "title",
          searchField: ["id", "title"],
          options: options,
          create: false,
          onInitialize: function () {
            if (options.length == 1) {
              this.setValue(options[0].id);
            }
          },
        });

        settings.loginPart.hide();
        settings.acessarPart.show();
      } else {
        Swal.fire({
          timer: 5000,
          timerProgressBar: true,
          confirmButtonColor: "#FF7622",
          confirmButtonText: "Ok",
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          },
          icon: "error",
          title: "Oops...",
          text: "Seu acesso a plataforma foi negado!",
          footer: result.alert,
          // footer: `<p>Verifique se o <b>e-mail e/ou a senha</b> informado está correto e se o seu <b>pagamento está em dia</b>.</p>`,
          // footer: `<p>Entre em contato para obter informações sobre seu acesso. <a href="https://wa.me/558182549914?text=Ol%C3%A1,%20n%C3%A3o%20consigo%20acessar%20minha%20plataforma%20*EaCode*." class="txt-theme"><i class="fa fa-whatsapp"></i> WhatsApp<a/></p>`
        });
      }
    } catch (error) {
      console.log(error);
      Toast.fire({
        icon: "error",
        timer: 15000,
        title: "Identificamos um erro ao realizar a solicitação, por favor verifique a sua internet e tente novamente.",
      });
    } finally {
      setButton(false, settings.btnLogin, "Entrar");
    }
  };

  const toEnter = async () => {
    const token = Math.random().toString(16).slice(2);
    settings.selectCliente.removeClass("is-invalid");
    $("#clientsError").addClass("d-none");

    if (!validarInput(settings.eleEmail.val(), "e-mail")) {
      settings.eleEmail.focus();
      return;
    }

    if (!validarInput(settings.elePassword.val(), "senha")) {
      settings.elePassword.focus();
      return;
    }

    if (!settings.selectCliente.val()) {
      settings.selectCliente.addClass("is-invalid");
      $("#clientsError").removeClass("d-none");
      $(`.selectize-input.items.has-options.not-full`).addClass("focus input-active dropdown-active");
      $(`.single.selectize-dropdown`).css("display", "block");
      return;
    }

    setButton(true, settings.btnAcessar, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando informações...');

    try {
      let result = await ajaxLogin({
        validator: "toEnter",
        token: `${token}@${defaults.jsonData.id}`,
        clients: settings.selectCliente.val(),
      });

      if (result.status) {
        let jsonData = result.data;
        let options = [];
        defaults.jsonData = jsonData;

        if (jsonData.codePIX) {
          // Swal.fire({
          //   timer: 120000,
          //   timerProgressBar: true,
          //   confirmButtonColor: "#FF7622",
          //   confirmButtonText: "Ok",
          //   showConfirmButton: false,
          //   didOpen: (toast) => {
          //     toast.onmouseenter = Swal.stopTimer;
          //     toast.onmouseleave = Swal.resumeTimer;
          //   },
          //   allowOutsideClick: false,
          //   icon: "warning",
          //   title: result.alert,
          //   html: `
          //         <div id="qrcode"></div>
          //         Olá <b>${jsonData.name}</b>, tudo bem?! Infelizmente encontramos uma irregularidade em seu acesso 😓, vamos deixar tudo ok!?<br><br>
          //         Fico feliz em te ajudar a resolver o problema. Seu acesso será liberado em <b>até 10 minutos</b> após o pagamento. Aproveite! 😁`,
          // });

          // setTimeout(() => {
          //   let qrCode = getQRCode(jsonData.codePIX);
          //   qrCode.append($("#qrcode")[0]);
          // }, 150);

          Swal.fire({
            timer: 120000,
            timerProgressBar: true,
            confirmButtonColor: "#FF7622",
            confirmButtonText: "Ok",
            showConfirmButton: false,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
            allowOutsideClick: false,
            icon: "warning",
            title: result.alert,
            html: `
              <div id="qrcode" class="mb-3"></div>
              <p>
                Olá <b>${jsonData.name}</b>, tudo bem?!<br>
                Encontramos uma <b>pendência no seu acesso</b> 😓.<br>
                Vamos deixar tudo certo agora?
              </p>
              <p>
                Após o pagamento, seu acesso será liberado em <b>até 10 minutos</b>.
              </p>
              <button id="btnCopiarPIX" class="btn btn-outline-secondary btn-sm w-100 my-4">
                <i class="fa-solid fa-copy me-1"></i> Copiar chave PIX
              </button>
            `,
          });

          setTimeout(() => {
            const qrCode = getQRCode(jsonData.codePIX);
            qrCode.append(document.getElementById("qrcode"));

            document.getElementById("btnCopiarPIX").addEventListener("click", function () {
              copiarChavePIX(jsonData.codePIX);
            });
          }, 150);
        } else {
          let timeCurrent = new Date().getTime();
          localStorage.setItem("eadata", JSON.stringify(jsonData));
          localStorage.setItem("eaaccess", result.access);
          localStorage.setItem("eatime", timeCurrent);
          localStorage.setItem("eatimeconfirm", timeCurrent);
          localStorage.setItem("eatimepayment", timeCurrent);
          setTimeout(() => {
            window.location.href = "../modules/index.php";
          }, 150);
        }
      } else {
        Toast.fire({
          icon: "error",
          timer: 15000,
          title: "Identificamos um erro ao realizar a solicitação, por favor verifique a sua internet e tente novamente.",
        });
      }
    } catch (error) {
      console.log(error);
      Toast.fire({
        icon: "error",
        timer: 15000,
        title: "Identificamos um erro ao realizar a solicitação, por favor verifique a sua internet e tente novamente.",
      });
    } finally {
      setButton(false, settings.btnAcessar, "Acessar");
    }
  };

  const copiarChavePIX = (chave) => {
    if (!navigator.clipboard) {
      // Fallback antigo
      const tempInput = document.createElement("input");
      tempInput.value = chave;
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand("copy");
        Toast.fire({
          icon: "success",
          title: "Chave PIX copiada com sucesso!",
        });
      } catch (err) {
        Toast.fire({
          icon: "error",
          title: "Erro ao copiar chave PIX!",
        });
      }
      document.body.removeChild(tempInput);
      return;
    }

    navigator.clipboard
      .writeText(chave)
      .then(() => {
        Toast.fire({
          icon: "success",
          title: "Chave PIX copiada com sucesso!",
        });
      })
      .catch(() => {
        Toast.fire({
          icon: "error",
          title: "Erro ao copiar chave PIX!",
        });
      });
  };

  // TODO: Recovery Password

  const forgotPassword = () => {
    settings.resetEmail.val(settings.eleEmail.val());
    settings.login.hide();
    settings.resetPassword.show();
  };

  const sendMail = async () => {
    let token = Math.random().toString(16).slice(2);

    if (!validarInput(settings.resetEmail.val(), "e-mail")) {
      settings.resetEmail.focus();
      return;
    }

    setButton(true, settings.btnResetEmail, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando código...');

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
      } else {
        Swal.fire({
          title: "Erro inesperado",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Save",
          denyButtonText: `${result.alert}`,
        }).then((result) => {
          window.location.href = window.location.href;
        });
      }
    } catch (error) {
      console.log(error);
      Toast.fire({
        icon: "error",
        timer: 15000,
        title: "Identificamos um erro ao realizar a solicitação, por favor verifique a sua internet e tente novamente.",
      });
    } finally {
      setButton(false, settings.btnResetEmail, "Enviar");
    }
  };

  const resetPassword = async () => {
    const fields = [settings.resetEmail, settings.resetCode, settings.resetNewPassword, settings.resetConfirmNewpassword];
    if (fields.some((field) => field.val() === "")) return false;

    let token = Math.random().toString(16).slice(2);

    setButton(true, settings.btnResetPassword, '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Validando informações...');

    try {
      let result = await ajaxLogin({
        validator: "resetPassword",
        token: token,
        resetEmail: settings.resetEmail.val().trim().toLowerCase(),
        resetCode: settings.resetCode.val(),
        resetNewPassword: settings.resetNewPassword.val(),
        resetConfirmNewpassword: settings.resetConfirmNewpassword.val(),
      });
      if (result.status) {
        window.location.reload();
      } else {
        Swal.fire({
          title: "Erro inesperado",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Save",
          denyButtonText: `${result.alert}`,
        }).then((result) => {
          window.location.href = window.location.href;
        });
      }
    } catch (error) {
      console.log(error);
      Toast.fire({
        icon: "error",
        timer: 15000,
        title: "Identificamos um erro ao realizar a solicitação, por favor verifique a sua internet e tente novamente.",
      });
    } finally {
      setButton(false, settings.btnResetPassword, "Redefinir");
    }
  };

  // TODO: Tools

  const toggle = (e) => {
    $(e).toggleClass("fa-eye fa-eye-slash");
    let input = $($(e).attr("toggle"));

    switch (input.attr("type")) {
      case "password":
        input.attr("type", "text");
        break;
      default:
        input.attr("type", "password");
        break;
    }
  };

  const getQRCode = (code) => {
    let qrCode = new QRCodeStyling({
      width: 300,
      height: 300,
      data: code,
      margin: 5,
      qrOptions: { typeNumber: "0", mode: "Byte", errorCorrectionLevel: "Q" },
      imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
      dotsOptions: { type: "classy", color: "#FF7622" },
      backgroundOptions: { color: "#FFFFFF", gradient: null },
      image:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAAEH5aXCAAAKN2lDQ1BzUkdCIElFQzYxOTY2LTIuMQAAeJydlndUU9kWh8+9N71QkhCKlNBraFICSA29SJEuKjEJEErAkAAiNkRUcERRkaYIMijggKNDkbEiioUBUbHrBBlE1HFwFBuWSWStGd+8ee/Nm98f935rn73P3Wfvfda6AJD8gwXCTFgJgAyhWBTh58WIjYtnYAcBDPAAA2wA4HCzs0IW+EYCmQJ82IxsmRP4F726DiD5+yrTP4zBAP+flLlZIjEAUJiM5/L42VwZF8k4PVecJbdPyZi2NE3OMErOIlmCMlaTc/IsW3z2mWUPOfMyhDwZy3PO4mXw5Nwn4405Er6MkWAZF+cI+LkyviZjg3RJhkDGb+SxGXxONgAoktwu5nNTZGwtY5IoMoIt43kA4EjJX/DSL1jMzxPLD8XOzFouEiSniBkmXFOGjZMTi+HPz03ni8XMMA43jSPiMdiZGVkc4XIAZs/8WRR5bRmyIjvYODk4MG0tbb4o1H9d/JuS93aWXoR/7hlEH/jD9ld+mQ0AsKZltdn6h21pFQBd6wFQu/2HzWAvAIqyvnUOfXEeunxeUsTiLGcrq9zcXEsBn2spL+jv+p8Of0NffM9Svt3v5WF485M4knQxQ143bmZ6pkTEyM7icPkM5p+H+B8H/nUeFhH8JL6IL5RFRMumTCBMlrVbyBOIBZlChkD4n5r4D8P+pNm5lona+BHQllgCpSEaQH4eACgqESAJe2Qr0O99C8ZHA/nNi9GZmJ37z4L+fVe4TP7IFiR/jmNHRDK4ElHO7Jr8WgI0IABFQAPqQBvoAxPABLbAEbgAD+ADAkEoiARxYDHgghSQAUQgFxSAtaAYlIKtYCeoBnWgETSDNnAYdIFj4DQ4By6By2AE3AFSMA6egCnwCsxAEISFyBAVUod0IEPIHLKFWJAb5AMFQxFQHJQIJUNCSAIVQOugUqgcqobqoWboW+godBq6AA1Dt6BRaBL6FXoHIzAJpsFasBFsBbNgTzgIjoQXwcnwMjgfLoK3wJVwA3wQ7oRPw5fgEVgKP4GnEYAQETqiizARFsJGQpF4JAkRIauQEqQCaUDakB6kH7mKSJGnyFsUBkVFMVBMlAvKHxWF4qKWoVahNqOqUQdQnag+1FXUKGoK9RFNRmuizdHO6AB0LDoZnYsuRlegm9Ad6LPoEfQ4+hUGg6FjjDGOGH9MHCYVswKzGbMb0445hRnGjGGmsVisOtYc64oNxXKwYmwxtgp7EHsSewU7jn2DI+J0cLY4X1w8TogrxFXgWnAncFdwE7gZvBLeEO+MD8Xz8MvxZfhGfA9+CD+OnyEoE4wJroRIQiphLaGS0EY4S7hLeEEkEvWITsRwooC4hlhJPEQ8TxwlviVRSGYkNimBJCFtIe0nnSLdIr0gk8lGZA9yPFlM3kJuJp8h3ye/UaAqWCoEKPAUVivUKHQqXFF4pohXNFT0VFysmK9YoXhEcUjxqRJeyUiJrcRRWqVUo3RU6YbStDJV2UY5VDlDebNyi/IF5UcULMWI4kPhUYoo+yhnKGNUhKpPZVO51HXURupZ6jgNQzOmBdBSaaW0b2iDtCkVioqdSrRKnkqNynEVKR2hG9ED6On0Mvph+nX6O1UtVU9Vvuom1TbVK6qv1eaoeajx1UrU2tVG1N6pM9R91NPUt6l3qd/TQGmYaYRr5Grs0Tir8XQObY7LHO6ckjmH59zWhDXNNCM0V2ju0xzQnNbS1vLTytKq0jqj9VSbru2hnaq9Q/uE9qQOVcdNR6CzQ+ekzmOGCsOTkc6oZPQxpnQ1df11Jbr1uoO6M3rGelF6hXrtevf0Cfos/ST9Hfq9+lMGOgYhBgUGrQa3DfGGLMMUw12G/YavjYyNYow2GHUZPTJWMw4wzjduNb5rQjZxN1lm0mByzRRjyjJNM91tetkMNrM3SzGrMRsyh80dzAXmu82HLdAWThZCiwaLG0wS05OZw2xljlrSLYMtCy27LJ9ZGVjFW22z6rf6aG1vnW7daH3HhmITaFNo02Pzq62ZLde2xvbaXPJc37mr53bPfW5nbse322N3055qH2K/wb7X/oODo4PIoc1h0tHAMdGx1vEGi8YKY21mnXdCO3k5rXY65vTW2cFZ7HzY+RcXpkuaS4vLo3nG8/jzGueNueq5clzrXaVuDLdEt71uUnddd457g/sDD30PnkeTx4SnqWeq50HPZ17WXiKvDq/XbGf2SvYpb8Tbz7vEe9CH4hPlU+1z31fPN9m31XfKz95vhd8pf7R/kP82/xsBWgHcgOaAqUDHwJWBfUGkoAVB1UEPgs2CRcE9IXBIYMj2kLvzDecL53eFgtCA0O2h98KMw5aFfR+OCQ8Lrwl/GGETURDRv4C6YMmClgWvIr0iyyLvRJlESaJ6oxWjE6Kbo1/HeMeUx0hjrWJXxl6K04gTxHXHY+Oj45vipxf6LNy5cDzBPqE44foi40V5iy4s1licvvj4EsUlnCVHEtGJMYktie85oZwGzvTSgKW1S6e4bO4u7hOeB28Hb5Lvyi/nTyS5JpUnPUp2Td6ePJninlKR8lTAFlQLnqf6p9alvk4LTduf9ik9Jr09A5eRmHFUSBGmCfsytTPzMoezzLOKs6TLnJftXDYlChI1ZUPZi7K7xTTZz9SAxESyXjKa45ZTk/MmNzr3SJ5ynjBvYLnZ8k3LJ/J9879egVrBXdFboFuwtmB0pefK+lXQqqWrelfrry5aPb7Gb82BtYS1aWt/KLQuLC98uS5mXU+RVtGaorH1futbixWKRcU3NrhsqNuI2ijYOLhp7qaqTR9LeCUXS61LK0rfb+ZuvviVzVeVX33akrRlsMyhbM9WzFbh1uvb3LcdKFcuzy8f2x6yvXMHY0fJjpc7l+y8UGFXUbeLsEuyS1oZXNldZVC1tep9dUr1SI1XTXutZu2m2te7ebuv7PHY01anVVda926vYO/Ner/6zgajhop9mH05+x42Rjf2f836urlJo6m06cN+4X7pgYgDfc2Ozc0tmi1lrXCrpHXyYMLBy994f9Pdxmyrb6e3lx4ChySHHn+b+O31w0GHe4+wjrR9Z/hdbQe1o6QT6lzeOdWV0iXtjusePhp4tLfHpafje8vv9x/TPVZzXOV42QnCiaITn07mn5w+lXXq6enk02O9S3rvnIk9c60vvG/wbNDZ8+d8z53p9+w/ed71/LELzheOXmRd7LrkcKlzwH6g4wf7HzoGHQY7hxyHui87Xe4Znjd84or7ldNXva+euxZw7dLI/JHh61HXb95IuCG9ybv56Fb6ree3c27P3FlzF3235J7SvYr7mvcbfjT9sV3qID0+6j068GDBgztj3LEnP2X/9H686CH5YcWEzkTzI9tHxyZ9Jy8/Xvh4/EnWk5mnxT8r/1z7zOTZd794/DIwFTs1/lz0/NOvm1+ov9j/0u5l73TY9P1XGa9mXpe8UX9z4C3rbf+7mHcTM7nvse8rP5h+6PkY9PHup4xPn34D94Tz+49wZioAAAAJcEhZcwAALiMAAC4jAXilP3YAABMISURBVHic7V0JeBRFFn4JUVQEVIi4urvq4qK7ggpEue8jXEYOwUXBZT0XRFcFCbeAJByiAoIugvHCdbhDUI5wGG7EgKCgHIlGEZZLMECA3Ft/Vzoz3dNV3V0zhJGd//tm+qrqV69edZ3vvYoqZiCXiHIbQRzpyH6i19vx8wmZDiPpERxTWjlFO0zOqUvPV9hGFF/dj5p/pFVTtcPsLd/Ts52rUbnTR4jyzxFddqUg0uux2qFfJns7naB6yXmU3oqdDq9poGaMdCRDO7w1P1U7rlu3jgrWD6WoU/8lOriL6KaapkiDb+PHkVv5cUZPavrTDqKE7zhfUx8opeaNpMu4QhUv8zgCVW8hOp5FtCGJqPFjJZH0h3gr0PQJftQj6sclCT6RzALsOMR7rj8TZoRDRLktsK6pWEfQM8RRIf1mmTGibVmb3V87FFWsRpEoZ2AxIkIQYfYz2mH4kTtp+epDvIyhVAiz9pvl2mH5rkPasaDSDax8HSY6xShVqmaK8PI9/DhkPaVPuFE7jYmJ4VQSGlqUrfOn+fGaG0tzKT2dBZrYkuiXH4l2rSCqGWsqV2N28uM99xP1nGwsUx/1086NPJS/2jIrKfpPRMe+J0oZY1EIrc4HrhTkkgO4LnwqUPosLhwRXWJmWHwIakREBPRnNoTsiZgIxKy+VjumtzrpmJCciICAfu6UkJiIOYvYC9KJf5duCclrNx8C/Nic0lM+JLrxr+Lwjio4EYEhNVitV+glgHBPfED058bGRsqCkJGIiIBVva2/GO0TGjYJoSjDTacEzIT+u4fooUlCQlGGCFaw+9jMz60E/39Yd106RKwqSQc1sHMiP3zpOC3qRP79N+v7Dqp5Z0Q2zzZeX8766nnnnCTNBZHklw2XMcuuYDWvD5GAG63kkYbLxBN3sf8DVFixZBSio6iAKFL8KjmRzR8bLhd+dUA7lo5adAy5XbFlNAl74IE72L839YWsF1oOvVAd57KJrqzskoip2KbtO2K4rrco18jNqDoum9+EBsbrQWtYt/hmWrhwISUmJpbeLqjI+tSnfbg5/gMbWd3qkMipo8brKjdrh65du2o/AG19/WQTN6+2dtjGD73DeD1ss/ccHf7RO7TT9PR0fm9iC9Z3/8kbJpOFr27MCX8ihfnG60rX8+Oo2t5BAr6NV75hH+ZVLCs/N9Zr7/Sy6UiYK8FR273n504R/aWl93pELe/LkJ0YiehIn8fys7uEE1/oRVIn3mcmP+pt+fZkojqdtYJhSOC8wQIiZi7G7jJe17OoJOcM4EQAlCqULh0r2fCpzfM2nOiTFjrxrgnG5zo3S8cTdWApf2mVMaGr3jQRMXORuMd43eZfwrTQ2pmcCKCP33TMHUjUY5JgQsGcYqfPfMZ8vgixNj4QImXRuSsLlElulQXCjEgxlPUqCgvEz5s96a0igoTgM4JJN7vPDnUd2qZuifJwLhBcRmTTL2ZsncOZ6TUtKKSDx4gbJnRgknbWo0RPfBgw+eAwYsNE0/XRtK7JMeuH+zcSTWM9xf4LA0pC4IzYMMHnxgqoCWNmvYiZAzuJXmtDNMC62XaCwBhxxATHubwCaryuKm1oetw68FHWuUlsxGq8jUpJUWfEBRM6zucXUqO1VWhjs1+sI2WzEc7oumzMsM11ctQYkTEREUExq64RPs4tKKKGadfRpuYnrAOc/ZUPEzAecQF3jGCMjiG0CJGRlD04nSpt7UKnTp0SBssrLJYzk3eWj/LM/XAJnDOSe4Zo5N3i5+XYqxL3EkZKa9asMUbNzaUePXrQwYMHvWllzDT4/Fra3OIkWQIjSTSu4zMcJc8ZI6dZbTO2vuQtl3uXOy1Qvnx5Wrx4seFeUVERPfXUU4yZHWJm0EMI2gTXUfaS19qKn192BWNyt/EeFq2H1/RexzzIFxcfHF96K5IVw1mzZvELzMdjXl6EgOe3stKJ3n5I/Lx8BaIxXxvvoeZBNapDT8Ci4cZKwjdhkeWIxu0LiBkxI7tTiT7sK37xlZWIRn1lvHeISWZKnHViu4xl3xErghs/sE5YgMxYM/LFJ0QLh4tfWIG1ESPTjfd2s1b5w39aM6EjbiT/ntbOtE5YAMz4M7Ka9UZT3xC/qGI0K/9bjPc2vEe0ZKycCR0Yh5S7jFVtb1knDMyM389qrD+L32G7SLZ4NNEmSU/0mt+x3NpgvAcGwIgTJnTEDuDMlKjE+CUsItI1M15Gvl3Fc6PxP6wjop0wj+p2c8WX0jj3S4qjGa2fI6rGEppV0h1BhvjG15n5VDL48onjZeSvrfnPDe5sy3+qqNWe/0QAMw4zJzz5EGoIT9CFGsKMhBrCjIQawowIceKAph0lhUMFDTcIPiOvtrQPg87pAy/bh3OB4DLy8zcYjNuHQw87pBl5s7PzsFgUfui1oJEOHiN717oLjyX0kGQk6TH3cd5/0qsjECCCw8g2xSWB79bYh3GI4DAy9yX1uJhu6jsn4CQEzshaedGYfv5e6hv9I0WePmodICvd+r5LBM7I0vHSx+9tzCDP5VG0vokk0OSORM9/FlAyAmPEholJp2qz/yxtkafUNsMKUPAtLuJjdEUExohNsfJ8mVV63vSzQtrQVBIYhhvxacpJUWcEuj8SjD5ei/3/XHqN1So/nUhfoI9WkMdnIhWgzsi2ReJnERG0ZOfPfrebflpAG5tJ3jmOfUgjvlBKjhojSYJJvBLE/wydwsN+97HsJpXKmeN8QQkWPS6hxsjeddLHq/f4M6HDViqJjUuVJ93APSMw65PgX1mYSResp5MulRuYVATMQkEz5xduIegC7hhBFXlwl/h5ZCRtzBQzoaPJkjza1FwSIJF9KwnfukqaO0Ym2gyaBqRS/9vX0rRpckUZLISWWuNZoSCX6ORBomtvcpw054zg5ScOiJ9jJr/qrdSnD359KCcnh7p160bHj1trOjRZnEubW0joQakYiz4O4ZwR33VBKwwy9mQrVKhAy5dzm8gVK1bQsGHDDM/ziyz0uX2BBdLDe4lukKzr+8AZI9BGyBEsIQNYtLn298LHsbGx2q+goIB69epFGRl87bxJio1U0AcL6jq7nTQcdi2ioqLI4/Fo59u3b9fW2aVSwfz6j9uJbq5j/27bECdZC51/XvKG8kSVbzDeg9YCVDAa9CLqPNoyWp06dbiSPXQfh0qKz1vdg6QwMFEme4YhFo3juJI+O6xpsGSN3i205KxyFkt6Vf5otBYwY28a0e3NpcmQM3LoW/n0Dsx8rq5qvAdzktM+bUm/+UQLhvKcBe5m5f7hqcY4A1fJl6STHg9Q82HK/dLHMLr2g68FSo0SyUCbdGvJcHYnG0A16mOUDqpus9WDGTtSiO6JEz4WM7J/g/CRhitYx+4qk3IZDBbyc73Xj7/vPW/Ym2jTR/zcqtxDe18mlU9eUGRk1t/FLwXM6+3ApDbe81omPxQPjPIyAmBp23dF2IlU8M2hArGANSNfJYtfBlxVmUmkovFe5haj4nKv6f7xmjxGtD6Jn0PPxa1UYCXnihHPAPHLgMEW38Y7j3jPY7pZx+s0zMsIsOU/RPUf9l5r3ZxbuA8MET5/m6iFv7KPPyPr3xW/BLi6Cldv8sW2Bcbr7hPF8Zs/TZQ2g58vGmFkBIBUZKobyyc5ZESmMgEMtmg35g7ynjd6VB6//SAvIwC8rUCdQwdmUsyWTmYsm8DeE2+4ZWRkmSQnAVioQWPOF6tMbUKcg+WCVv25FhIAxRpfRoCBqXKppL1jw4hvTllhsMWMu67hA7TsJ4+vo+0LXkYAWKJ2HuO9hlTMFltmLBxmMC/zMjIv3iq4FxjklDNN1ZjjxNpUEoawL7L+/ev8HNauvowAA1bIpfKFR8AIqlORihPQ0cJwxTfOLXXtkm5Ey2eMQwNzuwKpoGLAXJcIUM0q0WjyMuJG1yqQOG7itx8kf+6D8PJ0qCHMSKjh0mHkUtGgu1RwyZSsSwVhgYQYwgIJMYQFEmIICyTE8NsRyJdz5dMQdmj2FFGF64KXnguE34ZA5gwk2i5RenEC6OYOSvO6jQpRhL5A4D8XTncDBdZrJjQjemk1d+4boghtgbzbh2ifxcqFKjDHhzXdAamlbuJCDaErEGgBB0mB1gCs5k9qTfTCMqLrbwv++wNEaApkahzRwd324VQBhQHsFPBcir//4ouM0BJIcUlGHQ2+uZI/rWKuBPHMAqI/3nPh6TlE6AgESkSoSk74qwhfUEzvRvTPT4huva9s6QoQGgKBhiSM/Mz+WR3iXNUatP5sNLU9q+b7if7dk2vK1JAZUZQNLr5AoDM+vhlXlFRATvQd1MwDnfRjVNSpIbU7t0ktHejR/X2Ge/8QQcbFFcjZk/zLOH9GKfqZ6L9Qc49XkXP4p98RBSKUD54memQq0V0d1eIHARdPIKieJjY3Kti5iR59J7X0HPK7D6EUd2xA7c9vtojlAB8/x9NUt6ta/ABxcQQCzWH45TZ7w3aIX6NrUmvPQeHzEZ/toeIODahDrqJQYEWJdq1eT7X4AaDsBXI0g+iN9s5swy1wIroWtfXY98RGLoVQ6lPH3C22YS0BH1wQCvR4yxBlKxBY/sC+XXEZ/3j0XdTOI7FXMeHlpXupuH196pSnKJSUV3j1BdWqMkLZCSTrS6K3BdtxOMDR6Lupg0ei8y/AqGVMKO3q0/35ikKBSmdhHlGrZ9Xiu0TZCGTfOtatlJtbynC46t3USUEYOkYvZ0KJrUdxBWr2pZQ6mX8p7eQGvMHAhRfIruVEHz2jHP1Q1doUNycr4GSMWbGPKBChQGcdbUqnYfZhA8CFFQgWleaol6qjN9anuI/2Bi05EEpR2/uoc+FWtRfAEAFCMesiBxEXTiBbPiZaNNI+nAh1u9D1PSZResnWINDn2717N82cOZM2bdpEqvp9Y1P3U3Gbe6lLkeIeVlAOR/XVfYJafBtcGIGsm0X02Tj1+Pd2N3gABiIiIqhmzZo0ZcoUw/3MzExKSkqilStXai6PnSBhZYYmlK6qQkmfz78U7A4aZARfIDAaWTnFPpwI97GeWLcE+3AlqF69OiUkJGg/jmI68eN+mulZRMnJyZSfbz34TGRCodYx1LVYcRFsxxIulN5vq8UXILgCgVkQLGpU0eCRINTPEXTdzTUoPj5e++k4duwYzZ8/n2bPnq15RgcSV2VSUasYepAUhbIrlXuqeizJPqxDBE8gi0cZbSLdouGjzjy2wSgV5r7woGs26ZIgOjqa+vbtq/10ZGdnU0pKCiXviaLOBYrjFPhAm9mL6MnZavFNCI5A5g1i9eoC+3AiwIDJif3PZibw5FH83Lf3dtOdfHszWOu6cP9SuXJl6t27NzvrzdsFO0syETI2cwvjfvPU4vsgcIF8zEawXy9Vj4+da313WBdhzXSvGZwZcMYN633s6aFvx1TtNtY56MFnbc1m3FbAdgKAqlDgswG6AFinDwCBCeS9x4n2pKnHxxyRE8s1OBwT+erq6yG65V5+/tIaoldb8VnkIxncHFc3yb2jBdE/Zsnp6Hs8zHVuTWcAFDMwcfr8UsNG9G6gLpAZPYm+VxxgAbB2dWIouoCNjLd6rJ9hI6U/+Gx5AuPU+M+55x+zneUedn/Gw0RP/0dOr26JhbqqUA7v47oB0P2C1bpLqAlkWheiA1/bhxOh9bOlO0dKIaoOUfpEKjyVf8d3EdWEYlr8+v4Lnvb+NmqpmlAi1L1Lwm0AFPKgJQkfPS7g0nkWGx1P7sBLgSpg3w1jdTuItBYhDCi5VZOYTcMtDuzRoTpqXpFEQYKq0QtL5b4S9RVDVaHAZxboo3DAVY9DOBcItnWCKxCZ2xs7tGNVVAsHhvnTWWb8tNP/PqoA2LBbbDPsB+yBApcNUKAw+zU6sp9/QdjzVbKdtCYUFADV+bjsI9y1EBxAYf9fB3AmEHz6+ASzBR4HnaBDPDcJkAGKcm904BlmBvwgwX3QdX9wThMui4aUCMW8Szkcs+mZJSvBdbrwo6pQzvzC6DRmdNb6u4mxgL1AcnO4ZkiOYKMyJ0C3Ft1bGbAIhHX2kxZr5XD4CadvaB/cAg4Q4YYJQgEvvoCiBdybQSiy8YsmlAjuoVsFZ7NLhJJm2wWXCwROsMCIvv22CuJG2K9Ly4R+WXleulAFqQKZoAmlqb/KETxj6EKRZZa+f7aqUEAX7j7RtpmdjflALBBMTyCTZH7l7AAXU/CXJQOEgOrQSjcL9S4YCIblE3ZGh4ssCOWcaetCLbMa2Rv0QCgYXtg5fxIBeTmO0R+0Wvi1Wwvk10O80VNU09HQ5RV/B0xWdDCQs/LNgvoWjTK2igsW9HdaCQW9sfFN7Nup2iVfiqpQdLVZAR1/gRz7gXULY7ljTVXAJd59kk0FAWi4v9HOWh0IftKQcQpuiW0Boehfill9FdMu2IMDI21Zt1oTCvtUPC+qpUGn8+IK7sLJB/4Cib7VlatWZVxfndGx6E2VBeCGTWEfWwNqP8B/QcbFV7YOw4CwQEIMYYGEGMICCTGEBRJiCAskxPA/Ba2UX6Ufs6EAAAAASUVORK5CYII=",
      dotsOptionsHelper: { colorType: { single: true, gradient: false }, gradient: { linear: true, radial: false, color1: "#6A1A4C", color2: "#6A1A4C", rotation: "0" } },
      cornersSquareOptions: { type: "extra-rounded", color: "#FF7622" },
      cornersSquareOptionsHelper: { colorType: { single: true, gradient: false }, gradient: { linear: true, radial: false, color1: "#000000", color2: "#000000", rotation: "0" } },
      cornersDotOptions: { type: "", color: "#FF7622" },
      cornersDotOptionsHelper: { colorType: { single: true, gradient: false }, gradient: { linear: true, radial: false, color1: "#000000", color2: "#000000", rotation: "0" } },
      backgroundOptionsHelper: { colorType: { single: true, gradient: false }, gradient: { linear: true, radial: false, color1: "#FFFFFF", color2: "#FFFFFF", rotation: "0" } },
    });

    return qrCode;
    // qrCode.download({ name: "qr", extension: "svg" });
  };

  const analyzer = (event) => {
    console.log(event);
    switch (event.key) {
      case "Enter":
        validar();
        break;

      default:
        break;
    }
  };

  const setButton = (status, btn, text) => {
    btn.prop("disabled", status).html(text);
  };

  const validarInput = (input, fieldName) => {
    if (input.length < defaults.minLength) {
      Toast.fire({
        icon: "error",
        title: `Preencha corretamente seu ${fieldName}, deve possuir no mínimo ${defaults.minLength} caracteres.`,
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
        success: (response) => {
          resolve(response);
        },
        error: (xhr, status, error) => {
          reject(error);
        },
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
    settings.btnToggle.on("click", function () {
      toggle(this);
    });
    settings.btnVoltar.on("click", function () {
      window.location.reload();
    });
    settings.btnLogin.on("click", validar);
    settings.btnAcessar.on("click", toEnter);
    settings.eleEmail.on("keydown", analyzer);
    settings.elePassword.on("keydown", analyzer);

    settings.btnEsqueciSenha.on("click", forgotPassword);
    settings.btnResetEmail.on("click", sendMail);
    settings.btnResetPassword.on("click", resetPassword);
  };

  const init = (options) => {
    if (!supports) return;
    setUp();
    events();
  };

  init();
})(window, document);
