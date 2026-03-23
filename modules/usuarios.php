<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Usuários - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only px-0 px-md-3">

        <div class="d-none d-md-flex align-items-center mb-4 mt-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Usuários
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container list-commanded border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">

                    <div class="col-12 d-md-none mb-2">
                        <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Gestão de Usuários</h4>
                    </div>

                    <div class="col-12 col-md-5">
                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search me-1 opacity-50"></i> Buscar Usuário
                        </label>
                        <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Nome ou e-mail...">
                    </div>

                    <div class="col-12 col-md-4">
                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="filtro-perfil" style="letter-spacing: 0.5px;">
                            <i class="fas fa-filter me-1 opacity-50"></i> Perfil Mestre
                        </label>
                        <select id="filtro-perfil" class="form-control shadow-sm">
                            <option value="">Todos os Perfis</option>
                            <option value="50">Pároco / Administrador</option>
                            <option value="40">Coordenador / Secretaria</option>
                            <option value="30">Catequista / Professor</option>
                            <option value="10">Fiel / Aluno</option>
                        </select>
                    </div>

                    <div class="col-12 col-md-3 mt-3 mt-md-0">
                        <div class="d-flex justify-content-end gap-2 h-100">
                            <button class="btn btn-light border fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all" style="height: 42px; width: 42px; border-radius: 12px;" onclick="loadUsuarios()" title="Recarregar Lista">
                                <i class="fas fa-sync-alt text-secondary"></i>
                            </button>
                            <button class="btn btn-primary fw-bold shadow-sm flex-grow-1 flex-md-grow-0 d-flex align-items-center justify-content-center px-4 transition-all" style="height: 42px; border-radius: 12px;" onclick="openCreateModal()">
                                <i class="fas fa-user-plus me-2"></i> Novo
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body p-0 pt-md-4 px-md-0">
                <div class="table-responsive list-table-usuarios" style="max-height: 70vh;">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                        <p class="mt-3 fw-medium">Sincronizando acessos...</p>
                    </div>
                </div>
                <div class="pagination paginationButtons pagination-usuarios mt-3 pb-4 pb-md-0 text-center justify-content-center"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalUsuario" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5" id="modalUsuarioTitle">
                        <i class="fas fa-user-shield me-3 opacity-75"></i> Gerenciar Acesso
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4 modal-body-scrollable">
                    <input type="hidden" id="edit_id_user" value="" />

                    <div class="text-center mb-4" id="modal_photo_container">
                        <img id="modal_user_photo" src="./assets/img/trilhadafe.png" alt="Foto de Perfil"
                            class="rounded-circle border border-secondary border-opacity-25 shadow-sm"
                            style="width: 110px; height: 110px; object-fit: cover; cursor: pointer; transition: transform 0.2s;"
                            onclick="if(typeof zoomAvatar === 'function') zoomAvatar(this.src, 'Foto de Perfil')"
                            onmouseover="this.style.transform='scale(1.05)'"
                            onmouseout="this.style.transform='scale(1)'">
                        <p class="text-muted small mt-2 mb-0"><i class="fas fa-info-circle me-1 opacity-50"></i> Foto vinculada ao diretório de Pessoas.</p>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner mb-4">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-id-badge me-2 opacity-75"></i> Identidade e Permissões
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-12" id="div_select_person" style="display: none;">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Vincular a uma Pessoa <span class="text-danger">*</span></label>
                                <select id="edit_person_id" class="form-control bg-body border-0 shadow-none"></select>
                                <small class="text-muted d-block mt-1 opacity-75">Busque pelo nome ou CPF da pessoa já cadastrada no sistema.</small>
                            </div>

                            <div class="col-md-12" id="div_input_name">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome Completo</label>
                                <input type="text" id="edit_name" class="form-control bg-body border-0 shadow-none fw-medium" disabled />
                            </div>

                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">E-mail de Login <span class="text-danger">*</span></label>
                                <input type="email" id="edit_email" class="form-control bg-body border-0 shadow-none" placeholder="nome@exemplo.com" />
                            </div>

                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Perfil Mestre <span class="text-danger">*</span></label>
                                <select id="edit_profile" class="form-control bg-body border-0 shadow-none">
                                    <option value="">Selecione...</option>
                                    <option value="50">Pároco / Administrador</option>
                                    <option value="40">Coordenador / Secretaria</option>
                                    <option value="30">Catequista / Professor</option>
                                    <option value="10">Fiel / Aluno</option>
                                </select>
                            </div>

                            <div class="col-md-12 mt-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Anos Letivos Vinculados (Permissões de Turma)</label>
                                <select id="edit_years" class="form-control bg-body border-0 shadow-none" multiple></select>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-danger bg-opacity-10 p-3 p-md-4 border-start border-4 border-danger" id="div_reset_password">
                        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                            <div>
                                <h6 class="fw-bold text-danger mb-1"><i class="fas fa-key me-2"></i> Segurança da Conta</h6>
                                <small class="text-danger opacity-75">A senha será redefinida para o padrão temporário: <strong>mudar123</strong></small>
                            </div>
                            <button type="button" class="btn btn-danger fw-bold shadow-sm px-4" onclick="resetPassword(this)">
                                <i class="fas fa-unlock-alt me-2"></i> Resetar Senha
                            </button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarUsuario(this)">
                        <i class="fas fa-save me-2"></i> Salvar Acesso
                    </button>
                </div>

            </div>
        </div>
    </div>

    <div class="modal fade" id="modalHistoricoUsuario" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-secondary bg-opacity-75 py-3 px-4">
                    <h5 class="modal-title fs-5 fw-bold text-white">
                        <i class="fas fa-book-open-reader me-3"></i> Atividades do Usuário
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4 bg-body">
                    <div id="lista-historico-timeline" class="d-flex flex-column gap-3">
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-body text-center justify-content-center">
                    <button type="button" class="btn btn-light fw-bold px-5 rounded-3 border shadow-sm" data-bs-dismiss="modal">Fechar Histórico</button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/usuarios.js?v=<?php echo time(); ?>"></script>

</body>

</html>