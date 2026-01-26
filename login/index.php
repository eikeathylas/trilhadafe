<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="assets/img/favicon.png" type="image/x-icon">
    <title>Trilha da Fé - Login</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="assets/css/selectize.bootstrap4.css" rel="stylesheet">
    <link href="assets/css/main.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <div class="login">
        <div class="login-div">
            <div class="row justify-content-md-center align-items-center">
                <div class="col-12 col-lg-6 pt-lg-0 pl-0 pr-0">
                    <div id="form-login" class="pt-lg-0 pl-lg-0 pl-xl-4">
                         <div class="text-center">
                             <img class="p-0 logo" src="assets/img/trilhadafe.png" alt="Logo" />
                         </div>
                        <h5 class="mb-3 text-center">Faça login e acesse o Sistema de Gestão Paroquial</h5>

                        <div class="mt-2 form-login">
                            <div class="mb-4">
                                <label for="email" class="form-label">Informe seu e-mail:</label>
                                <input type="email" class="form-control w-100" id="email" placeholder="nome@exemplo.com" autocomplete="off" required aria-describedby="emailError">
                                <small id="emailError" class="form-text text-danger d-none">E-mail inválido</small>
                            </div>
                            <div class="mb-4">
                                <label for="password" class="form-label">Informe sua senha:</label>
                                <input type="password" class="form-control w-100" id="password" placeholder="********" autocomplete="off" required aria-describedby="passwordError">
                                <small id="passwordError" class="form-text text-danger d-none">Senha obrigatória</small>
                                <i toggle="#password" class="fa fa-fw fa-eye toggle-password field-icon"></i>
                            </div>
                            <div class="mb-4 float-right txt-theme forgot-password" style="cursor: pointer;">
                                Esqueci minha senha.
                            </div>
                            <div class="mb-4">
                                <button class="btn btn-theme w-100 btn-login"> Entrar </button>
                            </div>
                        </div>

                        <div class="mt-5 form-toEnter" style="display: none;">
                            <div class="mb-4">
                                <label for="clients" class="form-label">Acesso:</label>
                                <select name="clients" id="clients" placeholder="Selecione uma opção..."></select>
                                <small id="clientsError" class="form-text text-danger d-none">Selecione uma opção.</small>

                            </div>
                            <div class="mb-4">
                                <button class="btn btn-theme btn-acessar w-100"> Acessar </button>
                            </div>
                            <div class="mb-4">
                                <button class="btn btn-secondary btn-voltar w-100"> Voltar </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="resetPassword" style="display: none;">
        <div class="resetPassword-div">
            <div class="row justify-content-md-center align-items-center">
                <div class="col-12 col-lg-6 pt-2 pt-lg-0 pl-0 pr-0">
                    <div id="form-resetPassword" class="pt-2 pt-lg-0 pl-lg-0 pl-xl-5">
                        <div class="text-center">
                             <img class="p-0 logo" src="assets/img/trilhadafe.png" alt="Logo" />
                         </div>
                        <h6 class="mb-5">Estaremos lhe enviando um código para o e-mail cadastrado para redefinir sua senha. Após informar um email válido, clique em <b class="txt-theme">Enviar</b>.</h6>
                        <div class="mt-5">
                            <div class="mb-4 resetEmail">
                                <label for="resetEmail" class="form-label">Informe seu e-mail cadastrado:</label>
                                <div class="input-group mb-4">
                                    <input type="email" class="form-control" id="resetEmail" placeholder="nome@exemplo.com" autocomplete="off" required aria-describedby="resetEmailError">
                                    <small id="resetEmailError" class="form-text text-danger d-none">E-mail inválido</small>
                                    <div class="input-group-append">
                                        <button class="btn btn-theme btn-resetEmail" type="button">Enviar</button>
                                    </div>
                                </div>
                            </div>
                            <div class="mb-4 resetCode" style="display: none;">
                                <label for="resetCode" class="form-label">Informe seu código:</label>
                                <input type="number" class="form-control w-100" id="resetCode" placeholder="Seu código possui 6 dígitos" autocomplete="off" required aria-describedby="resetCodeError">
                                <small id="resetCodeError" class="form-text text-danger d-none">Código inválido</small>

                            </div>
                            <div class="mb-4 resetNewPassword" style="display: none;">
                                <label for="resetNewPassword" class="form-label">Informe sua nova senha:</label>
                                <input type="password" class="form-control w-100" id="resetNewPassword" placeholder="********" autocomplete="off" required aria-describedby="newPasswordError">
                                <small id="newPasswordError" class="form-text text-danger d-none">Senha inválida</small>
                                <i toggle="#resetNewPassword" class="fa fa-fw fa-eye toggle-password field-icon"></i>
                            </div>
                            <div class="mb-4 resetConfirmNewpassword" style="display: none;">
                                <label for="resetConfirmNewpassword" class="form-label">Confirme sua nova senha:</label>
                                <input type="password" class="form-control w-100" id="resetConfirmNewpassword" placeholder="********" autocomplete="off" required aria-describedby="confirmPasswordError">
                                <small id="confirmPasswordError" class="form-text text-danger d-none">As senhas não coincidem</small>
                            </div>
                            <div class="mb-4 divReset" style="display: none;">
                                <button class="btn btn-theme btn-resetPassword w-100"> Redefinir </button>
                            </div>
                            <div class="mb-4">
                                <button class="btn btn-secondary btn-voltar w-100"> Voltar </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="assets/lib/jquery-3.7.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js" integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js" integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous"></script>
    <script src="assets/lib/selectize.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <!-- <script src="assets/lib/qrcode.js?v=<?php echo time(); ?>"></script> -->
    <script src="assets/js/main.js?v=<?php echo time(); ?>"></script>
</body>

</html>