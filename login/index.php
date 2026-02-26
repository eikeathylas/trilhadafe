<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <link rel="shortcut icon" href="assets/img/favicon.png" type="image/x-icon">
    <title>Trilha da Fé | Login</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <link href="assets/css/main.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <main class="login-wrapper position-relative">

        <button id="toggleTheme" class="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-4 rounded-circle" style="width: 40px; height: 40px; border: none;">
            <i class="fa-solid fa-moon fs-5"></i>
        </button>

        <div class="logo-container">
            <img src="assets/img/trilhadafe.png" alt="Logo Trilha da Fé">
        </div>

        <div id="section-login" class="section-fade">
            <h4 class="fw-bold mb-1">Acesso ao Sistema</h4>
            <p class="small mb-4">Insira suas credenciais para continuar</p>

            <div class="mb-3">
                <label class="form-label">E-mail</label>
                <input type="email" id="email" class="form-control" placeholder="exemplo@gmail.com">
            </div>

            <div class="mb-4 position-relative">
                <label class="form-label d-flex justify-content-between">
                    Senha
                    <a href="javascript:void(0)" class="forgot-password text-decoration-none" style="color: var(--primary);">Esqueceu?</a>
                </label>
                <input type="password" id="password" class="form-control" placeholder="••••••••">
                <i class="fa fa-eye toggle-password position-absolute" style="right: 15px; top: 43px; cursor: pointer; color: var(--text-muted);"></i>
            </div>

            <input type="text" id="honey" style="display:none" tabindex="-1" autocomplete="off">

            <button class="btn btn-theme w-100 btn-login">Acessar</button>
        </div>

        <div id="section-access" class="section-fade" style="display: none;">
            <h4 class="fw-bold mb-1">Bem-vindo(a)!</h4>
            <p class="small mb-4">Selecione onde deseja trabalhar hoje</p>

            <div class="position-relative mb-3">
                <i class="fa fa-search position-absolute" style="left: 15px; top: 16px; color: var(--text-muted);"></i>
                <input type="text" id="searchUnit" class="form-control" placeholder="Buscar unidade..." style="padding-left: 45px;">
                <span id="clearSearch" class="position-absolute end-0 top-50 translate-middle-y me-3 fs-5" style="display:none; cursor:pointer; color: var(--text-muted);">&times;</span>
            </div>

            <div id="unitsContainer" class="units-grid">
            </div>

            <button class="btn btn-outline-custom w-100 mt-4 btn-voltar">Sair da Conta</button>
        </div>

        <div id="section-reset" class="section-fade" style="display: none;">
            <h4 class="fw-bold mb-1">Recuperar Senha</h4>

            <div class="resetEmail-div">
                <p class="small mb-4">Informe o seu e-mail para receber o código de 6 dígitos.</p>
                <input type="email" id="resetEmail" class="form-control mb-4" placeholder="Seu e-mail cadastrado">
                <button class="btn btn-theme w-100 btn-resetEmail">Enviar Código</button>
            </div>

            <div id="reset-steps" style="display: none;">
                <p class="small mb-3">Digite o código enviado para o seu e-mail.</p>

                <div class="otp-grid mb-4">
                    <input type="text" maxlength="1" class="form-control otp-input" autofocus>
                    <input type="text" maxlength="1" class="form-control otp-input">
                    <input type="text" maxlength="1" class="form-control otp-input">
                    <input type="text" maxlength="1" class="form-control otp-input">
                    <input type="text" maxlength="1" class="form-control otp-input">
                    <input type="text" maxlength="1" class="form-control otp-input">
                </div>
                <input type="hidden" id="resetCode">

                <div id="new-password-fields" style="display: none;">
                    <label class="form-label">Crie uma nova senha</label>

                    <div class="position-relative mb-2">
                        <input type="password" id="resetNewPassword" class="form-control" placeholder="Nova Senha">
                        <i class="fa fa-eye toggle-password position-absolute" style="right: 15px; top: 16px; cursor: pointer; color: var(--text-muted);"></i>
                    </div>

                    <div class="position-relative mb-4">
                        <input type="password" id="resetConfirmNewpassword" class="form-control" placeholder="Confirme a Senha">
                        <i class="fa fa-eye toggle-password position-absolute" style="right: 15px; top: 16px; cursor: pointer; color: var(--text-muted);"></i>
                    </div>

                    <button class="btn btn-theme w-100 btn-resetPassword">Confirmar Alteração</button>
                </div>
            </div>

            <button class="btn btn-outline-custom w-100 mt-3 btn-voltar">Voltar para Login</button>
        </div>

    </main>

    <script src="assets/lib/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="assets/js/main.js?v=<?php echo time(); ?>"></script>
</body>

</html>