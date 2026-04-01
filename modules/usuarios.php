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
                        <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                            <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                                <i class="fas fa-fingerprint" style="font-size: 1.1rem;"></i>
                            </div>
                            Gestão de Usuários
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">

                <div class="card-body p-3 p-md-4">
                    <div class="row g-2 g-md-3 align-items-end">


                        <div class="col-12 d-md-none mb-2 mt-2">
                            <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Gestão de Usuários</h5>
                        </div>

                        <div class="col-12 col-md flex-grow-1">


                            <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search opacity-50 me-1"></i> Buscar Usuário
                            </label>
                            <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                                <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Nome ou e-mail..." style="border-radius: 12px 0 0 12px !important; height: 48px;">
                                <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                    <i class="fas fa-search text-muted"></i>
                                </span>
                            </div>
                        </div>

                        <div class="col-12 col-md-3">
                            <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                                Perfil Mestre
                            </label>
                            <select id="filtro-perfil" class="form-select border-0 bg-fundo shadow-none rounded-4 fw-medium text-body px-3" style="height: 52px;">
                                <option value="">Carregando perfis...</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-auto d-grid mt-3 mt-md-0">
                            <div class="d-flex justify-content-end gap-2 h-100">
                                <button class="btn btn-light border fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-bg-light" style="height: 52px; width: 52px; border-radius: 14px;" onclick="loadUsuarios()" title="Recarregar Lista">
                                    <i class="fas fa-sync-alt text-secondary"></i>
                                </button>
                                <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="openCreateModal()" data-slug="usuarios.create" style="height: 48px; border-radius: 12px; min-width: 160px;">
                                    <i class="fas fa-user-plus me-2"></i>
                                    <span>Novo Usuário</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
                <div class="card-body p-0 pt-md-4 px-md-0">
                    <div class="table-responsive list-table-usuarios">
                        <div class="text-center py-5 opacity-50">
                            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                            <p class="mt-3 fw-medium">Sincronizando acessos...</p>
                        </div>
                    </div>
                    <div class="pagination-usuarios pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100">
                    </div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>

        <div class="modal fade" id="modalUsuario" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
            <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                    <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                        <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 m-0 text-center" id="modalUsuarioTitle" style="letter-spacing: -0.5px;">
                            <i class="fas fa-user-shield me-3 opacity-75"></i> Gerenciar Acesso
                        </h5>
                        <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body p-0 modal-body-scrollable bg-body">
                        <input type="hidden" id="edit_id_user" value="" />

                        <div class="px-2 pb-1 border-bottom border-secondary border-opacity-10 shadow-sm text-center sticky-top" style="z-index: 1080 !important; top: 0;">
                            <div class="modern-tabs-wrapper" style="overflow-x: auto; white-space: nowrap;">
                                <ul class="nav nav-pills gap-2 flex-nowrap justify-content-md-center px-4" id="userTab" role="tablist">
                                    <li class="nav-item">
                                        <button class="nav-link active fw-bold px-4 rounded-pill" id="acesso-tab" data-bs-toggle="tab" data-bs-target="#tab-acesso" type="button">
                                            <i class="fas fa-id-badge me-2 opacity-75"></i> Acesso
                                        </button>
                                    </li>
                                    <li class="nav-item">
                                        <button class="nav-link fw-bold px-4 rounded-pill" id="perfil-tab" data-bs-toggle="tab" data-bs-target="#tab-perfil" type="button">
                                            <i class="fas fa-shield-alt me-2 opacity-75"></i> Perfil de Permissões
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="tab-content p-4 p-md-5">

                            <div class="tab-pane fade show active" id="tab-acesso">
                                <div class="text-center mb-5 d-flex flex-column align-items-center" id="modal_photo_container">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-3" style="letter-spacing: 0.5px;">Foto de Perfil</label>
                                    <img id="modal_user_photo" src="./assets/img/trilhadafe.png" alt="Foto de Perfil"
                                        class="rounded-circle border border-secondary border-opacity-25 shadow-sm"
                                        style="width: 140px; height: 140px; object-fit: cover; cursor: pointer; transition: transform 0.2s;"
                                        onclick="if(typeof zoomAvatar === 'function') zoomAvatar(this.src, 'Foto de Perfil')"
                                        onmouseover="this.style.transform='scale(1.05)'"
                                        onmouseout="this.style.transform='scale(1)'">
                                    <p class="text-muted small mt-3 mb-0 fw-bold text-uppercase" style="font-size: 0.7rem; letter-spacing: 0.5px;"><i class="fas fa-info-circle me-1 opacity-50"></i> Foto vinculada ao diretório de Pessoas.</p>
                                </div>

                                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                                    <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                                        <i class="fas fa-id-badge me-2 opacity-75"></i> Identidade e Permissões
                                    </h6>
                                    <div class="row g-4">
                                        <div class="col-md-12" id="div_select_person" style="display: none;">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Vincular a uma Pessoa <span class="text-danger">*</span></label>
                                            <select id="edit_person_id" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;"></select>
                                            <small class="text-muted d-block mt-2 opacity-75 fw-medium ms-1" style="font-size: 0.75rem;">Busque pelo nome ou CPF da pessoa já cadastrada no sistema.</small>
                                        </div>

                                        <div class="col-md-12" id="div_input_name">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome Completo</label>
                                            <input type="text" id="edit_name" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" disabled style="height: 52px;" />
                                        </div>

                                        <div class="col-md-6">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">E-mail de Login <span class="text-danger">*</span></label>
                                            <input type="email" id="edit_email" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" placeholder="nome@exemplo.com" style="height: 52px;" />
                                        </div>

                                        <div class="col-md-6">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Perfil Mestre <span class="text-danger">*</span></label>
                                            <select id="edit_profile" class="form-select border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                                <option value="">Carregando perfis...</option>
                                            </select>
                                        </div>

                                        <div class="col-md-12 mt-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Anos Letivos Vinculados (Permissões de Turma)</label>
                                            <select id="edit_years" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" multiple style="min-height: 52px;"></select>
                                        </div>
                                    </div>
                                </div>

                                <div class="card border-0 rounded-4 bg-danger bg-opacity-10 p-4 border-start border-4 border-danger transition-all hover-bg-light" id="div_reset_password" data-slug="usuarios.password">
                                    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                                        <div>
                                            <h6 class="fw-bold text-danger mb-1"><i class="fas fa-key me-2"></i> Segurança da Conta</h6>
                                            <small class="text-danger opacity-75 fw-medium">A senha será redefinida para o padrão temporário: <strong>mudar123</strong></small>
                                        </div>
                                        <button type="button" class="btn btn-danger fw-bold shadow-sm rounded-pill px-4 transition-all hover-scale" onclick="resetPassword(this)" style="height: 48px;">
                                            <i class="fas fa-unlock-alt me-2"></i> Resetar Senha
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div class="tab-pane fade" id="tab-perfil">
                                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                                    <h6 class="fw-bold text-primary mb-2 d-flex align-items-center">
                                        <i class="fas fa-list-check me-2 opacity-75"></i> Matriz de Funcionalidades
                                    </h6>
                                    <p class="text-muted small mb-4">Abaixo estão listadas todas as permissões liberadas para o perfil selecionado. Esta visualização serve apenas para conferência (auditoria).</p>

                                    <div id="lista-permissoes" class="d-flex flex-column bg-white rounded-4 border border-secondary border-opacity-10 p-2">
                                        <div class="text-center py-5 text-muted opacity-50">
                                            <i class="fas fa-shield-alt fa-3x mb-3"></i>
                                            <p>Selecione um perfil para visualizar a matriz.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                        <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light me-2" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                        <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm transition-all hover-scale" onclick="salvarUsuario(this)" data-slug="usuarios.save" style="height: 48px;">
                            <i class="fas fa-save me-2 opacity-75"></i> Salvar
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <div class="modal fade" id="modalHistoricoUsuario" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                    <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                        <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5 text-center m-0" style="letter-spacing: -0.5px;">
                            <i class="fas fa-book-open-reader me-3 opacity-75"></i> Atividades do Usuário
                        </h5>
                        <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                    </div>

                    <div class="modal-body p-4 bg-body">
                        <div id="lista-historico-timeline" class="d-flex flex-column gap-3">
                        </div>
                    </div>

                    <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                        <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
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