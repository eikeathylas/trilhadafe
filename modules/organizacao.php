<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Organizações - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>
    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="main-only">
        <div class="d-none d-md-flex align-items-center mb-4">
            <nav aria-label="breadcrumb" class="w-100">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page"
                        style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão das Organizações
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-header bg-transparent border-bottom-0 pt-3 pb-0 px-2 px-md-3">
                <div class="modern-tabs-wrapper mobile-segmented-control">
                    <ul class="nav nav-pills m-0 d-flex flex-nowrap" id="orgTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active fw-medium text-nowrap py-2 px-3 px-md-4" id="dioc-tab" data-bs-toggle="tab" data-bs-target="#diocese" type="button" role="tab" onclick="$('.pane-btn').addClass('d-none'); $('#pane-btn-diocese').removeClass('d-none');">
                                <i class="fa-solid fa-synagogue me-1 me-md-2"></i> Diocese
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-medium text-nowrap py-2 px-3 px-md-4" id="inst-tab" data-bs-toggle="tab" data-bs-target="#instituicoes" type="button" role="tab" onclick="$('.pane-btn').addClass('d-none'); $('#pane-btn-paroquia').removeClass('d-none');">
                                <i class="fas fa-church me-1 me-md-2"></i> Paróquia
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-medium text-nowrap py-2 px-3 px-md-4" id="locais-tab-btn" data-bs-toggle="tab" data-bs-target="#locais" type="button" role="tab" onclick="$('.pane-btn').addClass('d-none'); $('#pane-btn-locais').removeClass('d-none');">
                                <i class="fas fa-door-open me-1 me-md-2"></i>
                                <span class="d-none d-md-inline">Salas/Espaços</span>
                                <span class="d-inline d-md-none">Salas</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card-body p-3 p-md-4 mt-2">
                <div class="row g-3 align-items-center">
                    <div class="col-12 col-md-5 text-center text-md-start">
                        <h4 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;"></h4>
                    </div>

                    <div class="col-12 col-md-7">

                        <div id="pane-btn-diocese" class="pane-btn d-block text-center text-md-end" data-slug="organizacao.create">
                            <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100 w-md-auto" style="height: 44px;" onclick="modalDiocese()">
                                <i class="fas fa-plus me-2"></i> Nova Diocese
                            </button>
                        </div>

                        <div id="pane-btn-paroquia" class="pane-btn d-none text-center text-md-end" data-slug="organizacao.create">
                            <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100 w-md-auto" style="height: 44px;" onclick="modalInstituicao()">
                                <i class="fas fa-plus me-2"></i> Nova Paróquia
                            </button>
                        </div>

                        <div id="pane-btn-locais" class="pane-btn d-none">
                            <div class="row g-2 align-items-end justify-content-center justify-content-md-end">
                                <div class="col-12 col-md-7 text-start">
                                    <label class="form-label small fw-bold text-uppercase text-body mb-1" style="font-size: 0.7rem;"><i class="fas fa-filter me-1 opacity-50"></i> Filtrar Paróquia</label>
                                    <select id="filtro-org-locais" class="form-control select-orgs" placeholder="Selecione a Paróquia..."></select>
                                </div>
                                <div class="col-12 col-md-5 text-center text-md-end" data-slug="organizacao.create">
                                    <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100" style="height: 44px;" onclick="modalLocal()">
                                        <i class="fas fa-plus me-2"></i> Novo Local
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body p-0 pt-md-4 px-md-0">
                <div class="tab-content">
                    <div class="tab-pane fade show active" id="diocese" role="tabpanel">
                        <div class="table-responsive list-table-diocese">
                            <div class="text-center py-5 opacity-50">
                                <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                                <p class="mt-3 fw-medium">Carregando diretório...</p>
                            </div>
                        </div>
                    </div>

                    <div class="tab-pane fade" id="instituicoes" role="tabpanel">
                        <div class="table-responsive list-table-orgs"></div>
                        <div class="pagination paginationButtons pagination-orgs mt-3 pb-4 pb-md-0 text-center justify-content-center"></div>
                    </div>

                    <div class="tab-pane fade" id="locais" role="tabpanel">
                        <div class="table-responsive list-table-locais"></div>
                        <div class="pagination paginationButtons pagination-locais mt-3 pb-4 pb-md-0 text-center justify-content-center"></div>
                    </div>
                </div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalInstituicao" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5" id="modalInstituicaoLabel">
                        <i class="fas fa-church me-3 opacity-75"></i> Cadastro Institucional
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-0 modal-body-scrollable">
                    <input type="hidden" id="org_id">

                    <div class="p-4">
                        <div class="row g-4">
                            <div class="col-12 col-md-3 d-flex flex-column align-items-center">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Brasão / Logo</label>
                                <div id="image-upload-container-org" class="border border-2 border-secondary border-opacity-25 p-1 rounded-circle bg-secondary bg-opacity-10 position-relative shadow-sm transition-all" style="cursor: pointer; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden;" data-slug="organizacao.save">
                                    <div id="placeholder-logo-org" class="text-center">
                                        <i class="fas fa-camera fa-2x text-primary opacity-50 mb-1"></i>
                                        <p class="text-muted small mb-0 lh-1" style="font-size: 0.75rem;">Adicionar</p>
                                    </div>
                                    <img id="img-preview-org" src="" class="img-fluid w-100 h-100 object-fit-cover rounded-circle position-absolute top-0 start-0" style="display: none; z-index: 2;" />
                                    <input type="file" id="org_photo" class="d-none" accept="image/*" />
                                </div>
                                <button type="button" class="btn btn-sm btn-outline-danger mt-3 rounded-pill px-3 d-none fw-medium" id="btn-remove-logo" onclick="removeLogoOrg()" data-slug="organizacao.save">
                                    <i class="fas fa-trash-can me-1"></i> Remover Logo
                                </button>
                            </div>

                            <div class="col-12 col-md-9">
                                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner mb-4">
                                    <h6 class="fw-bold text-primary mb-3 d-flex align-items-center"><i class="fas fa-id-card me-2 opacity-75"></i> Identificação</h6>
                                    <div class="row g-3">
                                        <div class="col-md-8">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome Fantasia <span class="text-danger">*</span></label>
                                            <input type="text" id="org_display_name" class="form-control border-0 shadow-none" placeholder="Ex: Paróquia São José" />
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Tipo</label>
                                            <select id="org_type" class="form-control border-0 shadow-none">
                                                <option value="DIOCESE">Diocese</option>
                                                <option value="PARISH">Paróquia</option>
                                            </select>
                                        </div>
                                        <div class="col-md-8">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Razão Social / Mitra</label>
                                            <input type="text" id="org_legal_name" class="form-control border-0 shadow-none" />
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">CNPJ</label>
                                            <input type="text" id="org_tax_id" class="form-control border-0 shadow-none mask-cnpj" placeholder="00.000.000/0000-00" />
                                        </div>
                                    </div>
                                </div>

                                <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                                    <h6 class="fw-bold text-primary mb-3 d-flex align-items-center"><i class="fas fa-map-location-dot me-2 opacity-75"></i> Endereço e Contato</h6>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">CEP</label>
                                            <div class="input-group">
                                                <input type="text" id="org_zip" class="form-control border-0 shadow-none mask-cep" onblur="buscarCep(this.value)" placeholder="00000-000" />
                                                <span class="input-group-text border-0 text-primary cursor-pointer" onclick="buscarCep($('#org_zip').val())"><i class="fas fa-search"></i></span>
                                            </div>
                                        </div>
                                        <div class="col-md-8">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Rua / Logradouro</label>
                                            <input type="text" id="org_street" class="form-control border-0 shadow-none" />
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Bairro</label>
                                            <input type="text" id="org_district" class="form-control border-0 shadow-none" />
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Cidade</label>
                                            <input type="text" id="org_city" class="form-control border-0 shadow-none" />
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">UF</label>
                                            <input type="text" id="org_state" class="form-control border-0 shadow-none text-center" maxlength="2" />
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">Telefone</label>
                                            <input type="text" id="org_phone" class="form-control border-0 shadow-none mask-phone" placeholder="(00) 0000-0000" />
                                        </div>
                                        <div class="col-md-6">
                                            <label class="form-label small fw-bold text-uppercase text-muted mb-2">E-mail</label>
                                            <input type="email" id="org_email" class="form-control border-0 shadow-none" placeholder="contato@paroquia.com" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarInstituicao(this)" data-slug="organizacao.save">
                        <i class="fas fa-save me-2"></i> Gravar Cadastro
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalLocal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5">
                        <i class="fas fa-door-open me-3 opacity-75"></i> Espaço / Sala
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="loc_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Vincular à Paróquia</label>
                                <select id="loc_org_id" class="form-control border-0 shadow-none select-orgs-modal"></select>
                            </div>
                            <div class="col-md-9">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome do Espaço <span class="text-danger">*</span></label>
                                <input type="text" id="loc_name" class="form-control border-0 shadow-none" placeholder="Ex: Sala Catequese 01" />
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Lotação</label>
                                <input type="number" id="loc_capacity" class="form-control border-0 shadow-none" placeholder="0" />
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                        <h6 class="fw-bold text-primary mb-3 d-flex align-items-center"><i class="fas fa-cubes me-2 opacity-75"></i> Infraestrutura</h6>
                        <div class="row g-2">
                            <?php
                            $recursos = [
                                'wifi' => 'Wi-Fi',
                                'ac' => 'Ar-Condic.',
                                'projector' => 'Projetor',
                                'sound' => 'Som',
                                'whiteboard' => 'Lousa',
                                'access' => 'Acessíb.',
                                'sacred' => 'Sagrado',
                                'kitchen' => 'Cozinha',
                                'parking' => 'Vagas'
                            ];
                            foreach ($recursos as $id => $label): ?>
                                <div class="col-6 col-md-4">
                                    <div class="form-check form-switch d-flex align-items-center p-2 px-3 rounded-3 border border-secondary border-opacity-10 transition-all cursor-pointer">
                                        <input class="form-check-input shadow-none m-0 me-3" type="checkbox" id="loc_<?php echo $id; ?>" style="cursor:pointer;">
                                        <label class="form-check-label small fw-bold text-body m-0" for="loc_<?php echo $id; ?>" style="cursor:pointer;"><?php echo $label; ?></label>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarLocal(this)" data-slug="organizacao.save">
                        <i class="fas fa-save me-2"></i> Salvar Local
                    </button>
                </div>
            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/organizacao.js?v=<?php echo time(); ?>"></script>
</body>

</html>