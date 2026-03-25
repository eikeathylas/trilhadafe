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
                    <li class="breadcrumb-item active fw-bold text-body d-flex align-items-center" aria-current="page" style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                            <i class="fas fa-church" style="font-size: 1.1rem;"></i>
                        </div>
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
                                <i class="fa-solid fa-synagogue me-1 me-md-2 opacity-75"></i> Diocese
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-medium text-nowrap py-2 px-3 px-md-4" id="inst-tab" data-bs-toggle="tab" data-bs-target="#instituicoes" type="button" role="tab" onclick="$('.pane-btn').addClass('d-none'); $('#pane-btn-paroquia').removeClass('d-none');">
                                <i class="fas fa-church me-1 me-md-2 opacity-75"></i> Paróquia
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link fw-medium text-nowrap py-2 px-3 px-md-4" id="locais-tab-btn" data-bs-toggle="tab" data-bs-target="#locais" type="button" role="tab" onclick="$('.pane-btn').addClass('d-none'); $('#pane-btn-locais').removeClass('d-none');">
                                <i class="fas fa-door-open me-1 me-md-2 opacity-75"></i>
                                <span class="d-none d-md-inline">Salas/Espaços</span>
                                <span class="d-inline d-md-none">Salas</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            <div class="card-body p-3 p-md-4 mt-2">
                <div class="row g-3 align-items-center">
                    <div class="col-12 col-md-5 text-center text-md-start d-none d-md-flex">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;"></h5>
                    </div>

                    <div class="col-12 col-md-7">

                        <div id="pane-btn-diocese" class="pane-btn d-block text-center text-md-end" data-slug="organizacao.create">
                            <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100 w-md-auto transition-all hover-scale" style="height: 48px;" onclick="modalDiocese()">
                                <i class="fas fa-plus-circle me-2"></i>
                                <span>Nova Diocese</span>
                            </button>
                        </div>

                        <div id="pane-btn-paroquia" class="pane-btn d-none text-center text-md-end" data-slug="organizacao.create">
                            <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100 w-md-auto transition-all hover-scale" style="height: 48px;" onclick="modalInstituicao()">
                                <i class="fas fa-plus-circle me-2"></i>
                                <span>Nova Paróquia</span>
                            </button>
                        </div>

                        <div id="pane-btn-locais" class="pane-btn d-none">
                            <div class="row g-2 align-items-end justify-content-center justify-content-md-end">
                                <div class="col-12 col-md-7 text-start">
                                    <label class="form-label small fw-bold text-uppercase text-body mb-2" style="font-size: 0.75rem; letter-spacing: 0.5px;"><i class="fas fa-filter me-1 opacity-50"></i> Filtrar Paróquia</label>
                                    <select id="filtro-org-locais" class="form-control select-orgs" placeholder="Selecione a Paróquia..."></select>
                                </div>
                                <div class="col-12 col-md-5 text-center text-md-end" data-slug="organizacao.create">
                                    <button class="btn btn-primary fw-bold shadow-sm rounded-4 px-4 w-100 transition-all hover-scale" style="height: 48px;" onclick="modalLocal()">
                                        <i class="fas fa-plus-circle me-2"></i>
                                        <span>Novo Local</span>
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
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center m-0 text-center" id="modalInstituicaoLabel" style="letter-spacing: -0.5px;">
                        <i class="fas fa-church me-3 opacity-75"></i> Cadastro Institucional
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-0 modal-body-scrollable bg-body">
                    <input type="hidden" id="org_id">

                    <div class="p-4 p-md-5">

                        <div class="col-12 d-flex flex-column align-items-center mb-5">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-3" style="letter-spacing: 0.5px;">Brasão / Logo</label>
                            <div id="image-upload-container-org" class="border border-2 border-secondary border-opacity-25 p-1 rounded-circle bg-secondary bg-opacity-10 position-relative shadow-sm transition-all hover-scale" style="cursor: pointer; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; overflow: hidden;" data-slug="organizacao.save">
                                <div id="placeholder-logo-org" class="text-center">
                                    <i class="fas fa-camera fa-2x text-primary opacity-50 mb-2"></i>
                                    <p class="text-muted small mb-0 lh-1 fw-bold text-uppercase" style="font-size: 0.7rem;">Adicionar</p>
                                </div>
                                <img id="img-preview-org" src="" class="img-fluid w-100 h-100 object-fit-cover rounded-circle position-absolute top-0 start-0" style="display: none; z-index: 2;" />
                                <input type="file" id="org_photo" class="d-none" accept="image/*" />
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-danger mt-3 rounded-pill px-3 d-none fw-bold shadow-sm transition-all hover-scale" id="btn-remove-logo" onclick="removeLogoOrg()" data-slug="organizacao.save">
                                <i class="fas fa-trash-can me-1"></i> Remover
                            </button>
                        </div>

                        <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                            <h6 class="fw-bold text-primary mb-4 d-flex align-items-center"><i class="fas fa-id-card me-2 opacity-75"></i> Identificação</h6>
                            <div class="row g-3">
                                <div class="col-md-8">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome Fantasia <span class="text-danger">*</span></label>
                                    <input type="text" id="org_display_name" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-body px-3" placeholder="Ex: Paróquia São José" style="height: 52px;" />
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Tipo</label>
                                    <select id="org_type" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-body px-3" style="height: 52px;">
                                        <option value="DIOCESE" disabled>Diocese</option>
                                        <option value="PARISH">Paróquia</option>
                                    </select>
                                </div>
                                <div class="col-md-8 mt-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Razão Social / Mitra</label>
                                    <input type="text" id="org_legal_name" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3" placeholder="Razão Social completa..." style="height: 52px;" />
                                </div>
                                <div class="col-md-4 mt-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">CNPJ</label>
                                    <input type="text" id="org_tax_id" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3 mask-cnpj" placeholder="00.000.000/0000-00" style="height: 52px;" />
                                </div>
                            </div>
                        </div>

                        <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                            <h6 class="fw-bold text-primary mb-4 d-flex align-items-center"><i class="fas fa-map-location-dot me-2 opacity-75"></i> Endereço e Contato</h6>
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">CEP</label>
                                    <div class="input-group bg-white rounded-4 shadow-none border-0 overflow-hidden">
                                        <input type="text" id="org_zip" class="form-control border-0 shadow-none bg-transparent fw-bold text-body px-3 mask-cep" onblur="buscarCep(this.value)" placeholder="00000-000" style="height: 52px;" />
                                        <span class="input-group-text border-0 bg-transparent pe-3 cursor-pointer transition-all hover-scale" onclick="buscarCep($('#org_zip').val())">
                                            <i class="fas fa-search text-primary opacity-50"></i>
                                        </span>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Rua / Logradouro</label>
                                    <input type="text" id="org_street" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3" style="height: 52px;" />
                                </div>
                                <div class="col-md-5 mt-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Bairro</label>
                                    <input type="text" id="org_district" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3" style="height: 52px;" />
                                </div>
                                <div class="col-md-5 mt-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Cidade</label>
                                    <input type="text" id="org_city" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3" style="height: 52px;" />
                                </div>
                                <div class="col-md-2 mt-3">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">UF</label>
                                    <input type="text" id="org_state" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-uppercase text-body px-3" maxlength="2" style="height: 52px;" />
                                </div>
                                <div class="col-12 border-top border-secondary border-opacity-10 mt-4 pt-4"></div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Telefone</label>
                                    <input type="text" id="org_phone" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-body px-3 mask-phone" placeholder="(00) 0000-0000" style="height: 52px;" />
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">E-mail</label>
                                    <input type="email" id="org_email" class="form-control border-0 rounded-4 shadow-none bg-white fw-medium text-body px-3" placeholder="contato@paroquia.com" style="height: 52px;" />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm d-flex align-items-center justify-content-center me-2 transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="salvarInstituicao(this)" data-slug="organizacao.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalLocal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">
                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center m-0 text-center" style="letter-spacing: -0.5px;">
                        <i class="fas fa-door-open me-3 opacity-75"></i> Espaço / Sala
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4 p-md-5 bg-body">
                    <input type="hidden" id="loc_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Vincular à Paróquia <span class="text-danger">*</span></label>
                                <select id="loc_org_id" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3 select-orgs-modal" style="height: 48px;"></select>
                            </div>
                            <div class="col-12 mt-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome do Espaço <span class="text-danger">*</span></label>
                                <input type="text" id="loc_name" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-body px-3" style="height: 52px;" />
                            </div>
                            <div class="col-12 col-md-8 mt-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Responsável Pelo Espaço</label>
                                <select id="loc_responsible" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 48px;"></select>
                            </div>
                            <div class="col-12 col-md-4 mt-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Lotação Max.</label>
                                <input type="number" id="loc_capacity" class="form-control border-0 rounded-4 shadow-none bg-white fw-bold text-body text-center px-3" placeholder="0" style="height: 52px;" />
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                        <h6 class="fw-bold text-primary mb-4 d-flex align-items-center"><i class="fas fa-cubes me-2 opacity-75"></i> Infraestrutura e Recursos</h6>
                        <div class="row g-3">
                            <?php
                            $recursos = [
                                'ac' => ['label' => 'Ar-Condic.', 'icon' => 'fas fa-snowflake text-info'],
                                'fan' => ['label' => 'Ventilador', 'icon' => 'fas fa-fan text-info'],
                                'water' => ['label' => 'Água/Bebedouro', 'icon' => 'fas fa-tint text-primary'],
                                'sacred' => ['label' => 'Sagrado', 'icon' => 'fas fa-cross text-danger'],
                                'kitchen' => ['label' => 'Cozinha', 'icon' => 'fas fa-utensils text-warning'],
                                'parking' => ['label' => 'Vagas', 'icon' => 'fas fa-car text-secondary'],
                                'access' => ['label' => 'Acessíb.', 'icon' => 'fas fa-wheelchair text-success'],
                                'wifi' => ['label' => 'Wi-Fi', 'icon' => 'fas fa-wifi text-primary'],
                                'projector' => ['label' => 'Projetor', 'icon' => 'fas fa-video text-secondary'],
                                'sound' => ['label' => 'Som', 'icon' => 'fas fa-volume-up text-warning'],
                                'computer' => ['label' => 'Computador', 'icon' => 'fas fa-desktop text-secondary'],
                                'whiteboard' => ['label' => 'Lousa', 'icon' => 'fas fa-chalkboard text-secondary'],
                            ];
                            foreach ($recursos as $id => $data): ?>
                                <div class="col-6 col-md-4 col-lg-3">
                                    <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                        <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                            <div class="rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 40px; height: 40px; background-color: rgba(0,0,0,0.03);">
                                                <i class="<?php echo $data['icon']; ?> fs-5"></i>
                                            </div>
                                            <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="loc_<?php echo $id; ?>"><?php echo $data['label']; ?></label>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="loc_<?php echo $id; ?>" style="width: 38px; height: 20px; position: relative; z-index: 2;">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm d-flex align-items-center justify-content-center me-2 transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="salvarLocal(this)" data-slug="organizacao.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar Local
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