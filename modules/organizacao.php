<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organização - Trilha da Fé</title>
    <?php include "./assets/components/Head.php"; ?>
</head>

<body>

    <div id="div-loader" class="div-loader d-none"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">
        <div class="main-only">

            <div class="d-flex align-items-center mb-4">
                <nav aria-label="breadcrumb" class="w-100">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item active fw-bold text-body" aria-current="page" style="font-size: 1.2rem;">
                            Gestão das Organizações
                        </li>
                    </ol>
                </nav>
            </div>

            <div class="card list-commanded border-0 shadow-sm mb-4">
                <div class="card-header bg-transparent border-bottom-0 pt-3 pb-0 px-0">
                    <div class="modern-tabs-wrapper">
                        <ul class="nav nav-pills m-0" id="orgTab" role="tablist" style="flex-wrap: nowrap;">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="dioc-tab" data-bs-toggle="tab" data-bs-target="#diocese" type="button" role="tab">
                                    <i class="fa-solid fa-synagogue me-2 opacity-75"></i> Diocese
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="inst-tab" data-bs-toggle="tab" data-bs-target="#instituicoes" type="button" role="tab">
                                    <i class="fas fa-church me-2 opacity-75"></i> Paróquia
                                </button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="locais-tab" data-bs-toggle="tab" data-bs-target="#locais" type="button" role="tab">
                                    <i class="fas fa-door-open me-2 opacity-75"></i> Salas/Espaços
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="card-body px-0 pt-4">
                    <div class="tab-content">

                        <div class="tab-pane fade show active" id="diocese" role="tabpanel">
                            <div class="d-grid d-md-flex justify-content-md-end mb-4">
                                <button class="btn btn-primary fw-bold shadow-sm" onclick="modalDiocese()">
                                    <i class="fas fa-plus me-2"></i> Nova Diocese
                                </button>
                            </div>

                            <div class="table-responsive list-table-diocese" style="max-height: 600px;">
                                <div class="text-center py-5 opacity-50">
                                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                                    <p class="mt-3 fw-medium">Carregando dioceses...</p>
                                </div>
                            </div>
                            <div class="pagination paginationButtons pagination-diocese mt-3 d-flex justify-content-center"></div>
                        </div>

                        <div class="tab-pane fade" id="instituicoes" role="tabpanel">
                            <div class="d-grid d-md-flex justify-content-md-end mb-4">
                                <button class="btn btn-primary fw-bold shadow-sm" onclick="modalInstituicao()">
                                    <i class="fas fa-plus me-2"></i> Nova Paróquia
                                </button>
                            </div>

                            <div class="table-responsive list-table-orgs" style="max-height: 600px;">
                                <div class="text-center py-5 opacity-50">
                                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                                    <p class="mt-3 fw-medium">Carregando paróquias...</p>
                                </div>
                            </div>
                            <div class="pagination paginationButtons pagination-orgs mt-3 d-flex justify-content-center"></div>
                        </div>

                        <div class="tab-pane fade" id="locais" role="tabpanel">
                            <div class="row g-3 mb-3 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label title">Filtrar por Paróquia:</label>
                                    <select id="filtro-org-locais" class="form-control select-orgs" placeholder="Selecione..."></select>
                                </div>
                                <div class="col-md-8 text-end">
                                    <button class="btn btn-primary w-100 shadow-sm" onclick="modalLocal()">
                                        <i class="fas fa-plus me-2"></i> Novo Local
                                    </button>
                                </div>
                            </div>

                            <div class="table-responsive list-table-locais" style="max-height: 600px;">
                                <div class="text-center py-5 opacity-50">
                                    <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                                    <p class="mt-3 fw-medium">Carregando locais...</p>
                                </div>
                            </div>
                            <div class="pagination paginationButtons pagination-locais mt-3 d-flex justify-content-center"></div>
                        </div>

                    </div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalInstituicao" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5" id="modalInstituicaoLabel">
                        <i class="fas fa-church me-3 opacity-75"></i> Gerenciar Paróquia
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="org_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-file-contract me-2 opacity-75"></i> Dados Jurídicos e Canônicos
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Nome Fantasia <span class="text-danger">*</span></label>
                                <input type="text" id="org_display_name" class="form-control bg-body border-0 shadow-none" placeholder="Ex: Paróquia São José">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Razão Social</label>
                                <input type="text" id="org_legal_name" class="form-control bg-body border-0 shadow-none" placeholder="Ex: Mitra Arquidiocesana...">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Tipo</label>
                                <select id="org_type" class="form-control bg-body border-0 shadow-none">
                                    <option value="DIOCESE">Diocese</option>
                                    <option value="PARISH">Paróquia</option>
                                    <option value="CHAPEL">Capela</option>
                                    <option value="CONVENT">Convento</option>
                                    <option value="CURIA">Cúria</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">CNPJ</label>
                                <input type="text" id="org_tax_id" class="form-control bg-body border-0 shadow-none mask-cnpj" placeholder="00.000.000/0000-00">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Diocese / Arquidiocese</label>
                                <input type="text" id="org_diocese" class="form-control bg-body border-0 shadow-none" placeholder="Nome da Diocese responsável">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Padroeiro(a)</label>
                                <input type="text" id="org_patron" class="form-control bg-body border-0 shadow-none">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Decreto Canônico (Nº)</label>
                                <input type="text" id="org_decree" class="form-control bg-body border-0 shadow-none">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Data de Fundação</label>
                                <input type="date" id="org_foundation" class="form-control bg-body border-0 shadow-none">
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-address-book me-2 opacity-75"></i> Contatos Oficiais
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Tel. Principal</label>
                                <input type="text" id="org_phone" class="form-control bg-body border-0 shadow-none mask-phone" placeholder="(00) 0000-0000">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Tel. Secundário</label>
                                <input type="text" id="org_phone2" class="form-control bg-body border-0 shadow-none mask-phone">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">E-mail Oficial</label>
                                <input type="email" id="org_email" class="form-control bg-body border-0 shadow-none" placeholder="contato@paroquia.com">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Site / Rede Social</label>
                                <input type="text" id="org_website" class="form-control bg-body border-0 shadow-none" placeholder="https://...">
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-map-location-dot me-2 opacity-75"></i> Endereço
                        </h6>
                        <div class="row g-3">
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">CEP</label>
                                <div class="input-group">
                                    <input type="text" id="org_zip" class="form-control bg-body border-0 shadow-none mask-cep" onblur="buscarCep(this.value)" placeholder="00000-000" maxlength="9">
                                    <span class="input-group-text bg-body border-0 text-primary cursor-pointer" onclick="buscarCep($('#org_zip').val())" title="Buscar CEP"><i class="fas fa-search"></i></span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Logradouro</label>
                                <input type="text" id="org_street" class="form-control bg-body border-0 shadow-none" placeholder="Rua, Avenida...">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Número</label>
                                <input type="text" id="org_number" class="form-control bg-body border-0 shadow-none" placeholder="Nº">
                            </div>
                            <div class="col-md-5">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Bairro</label>
                                <input type="text" id="org_district" class="form-control bg-body border-0 shadow-none">
                            </div>
                            <div class="col-md-5">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Cidade</label>
                                <input type="text" id="org_city" class="form-control bg-body border-0 shadow-none">
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">UF</label>
                                <input type="text" id="org_state" class="form-control bg-body border-0 shadow-none text-center" maxlength="2" placeholder="PE">
                            </div>
                        </div>
                    </div>

                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarInstituicao(this)">
                        <i class="fas fa-save me-2"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalLocal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5">
                        <i class="fas fa-door-open me-3 opacity-75"></i> Gerenciar Espaço Físico
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-4">
                    <input type="hidden" id="loc_id">

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-info-circle me-2 opacity-75"></i> Identificação
                        </h6>
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Paróquia Vinculada</label>
                                <select id="loc_org_id" class="form-control bg-body border-0 shadow-none select-orgs-modal" placeholder="Selecione..."></select>
                            </div>
                            <div class="col-md-8">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Nome do Espaço <span class="text-danger">*</span></label>
                                <input type="text" id="loc_name" class="form-control bg-body border-0 shadow-none" placeholder="Ex: Sala 10, Salão de Festas">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Capacidade (Pessoas)</label>
                                <input type="number" id="loc_capacity" class="form-control bg-body border-0 shadow-none" placeholder="0">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Responsável (Chaves)</label>
                                <select id="loc_responsible" class="form-control bg-body border-0 shadow-none" placeholder="Selecione..."></select>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-map-marker-alt me-2 opacity-75"></i> Localização
                        </h6>

                        <div class="bg-body p-3 rounded-3 border border-secondary border-opacity-10">
                            <div class="form-check form-switch d-flex align-items-center mb-0">
                                <input class="form-check-input fs-5 shadow-none m-0 me-3" type="checkbox" id="loc_diff_address" onchange="toggleLocAddress()" style="cursor: pointer;">
                                <label class="form-check-label fw-bold text-body m-0" for="loc_diff_address" style="cursor: pointer;">Endereço diferente da Matriz?</label>
                            </div>
                        </div>

                        <div id="loc_address_block" class="mt-3 d-none ms-md-4 ms-2 ps-3 border-start border-2 border-primary">
                            <div class="row g-3">
                                <div class="col-md-4">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">CEP</label>
                                    <div class="input-group">
                                        <input type="text" id="loc_zip" class="form-control bg-body border-0 shadow-none mask-cep" placeholder="00000-000" onblur="buscarCepLoc(this.value)">
                                        <span class="input-group-text bg-body border-0 text-primary cursor-pointer" onclick="buscarCepLoc($('#loc_zip').val())"><i class="fas fa-search"></i></span>
                                    </div>
                                </div>
                                <div class="col-md-8">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">Rua e Bairro</label>
                                    <input type="text" id="loc_street" class="form-control bg-body border-0 shadow-none" placeholder="Av Principal, Centro...">
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                        <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                            <i class="fas fa-cubes me-2 opacity-75"></i> Recursos Disponíveis
                        </h6>

                        <div class="row g-2">
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_ac" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_ac" style="cursor:pointer;">Ar-Condic.</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_fan" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_fan" style="cursor:pointer;">Ventilador</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_access" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_access" style="cursor:pointer;">Acessibilidade</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_sacred" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_sacred" style="cursor:pointer;">Altar/Sagrado</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_wifi" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_wifi" style="cursor:pointer;">Wi-Fi</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_projector" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_projector" style="cursor:pointer;">Projetor/TV</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_sound" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_sound" style="cursor:pointer;">Som</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_computer" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_computer" style="cursor:pointer;">Computador</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_whiteboard" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_whiteboard" style="cursor:pointer;">Lousa</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_kitchen" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_kitchen" style="cursor:pointer;">Copa/Cozinha</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_water" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_water" style="cursor:pointer;">Bebedouro</label>
                                </div>
                            </div>
                            <div class="col-6 col-md-4">
                                <div class="form-check form-switch d-flex align-items-center bg-body p-2 rounded-3 border border-secondary border-opacity-10">
                                    <input class="form-check-input shadow-none m-0 me-2" type="checkbox" id="loc_parking" style="cursor:pointer;">
                                    <label class="form-check-label small fw-bold text-body m-0" for="loc_parking" style="cursor:pointer;">Vaga/Estac.</label>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarLocal(this)">
                        <i class="fas fa-save me-2"></i> Salvar
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