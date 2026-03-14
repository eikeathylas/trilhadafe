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

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Painel</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Organização</li>
                </ol>
            </nav>

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
                                <div class="text-center py-5"><span class="loader"></span></div>
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
                                <div class="text-center py-5"><span class="loader"></span></div>
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
                                <div class="text-center py-5"><span class="loader"></span></div>
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
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white" id="modalInstituicaoLabel">Gerenciar Paróquia</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="org_id">

                    <h6 class="title txt-theme border-bottom pb-2 mb-3">Dados Jurídicos e Canônicos</h6>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label">Nome Fantasia <span class="text-danger">*</span></label>
                            <input type="text" id="org_display_name" class="form-control" placeholder="Ex: Paróquia São José">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Razão Social</label>
                            <input type="text" id="org_legal_name" class="form-control" placeholder="Ex: Mitra Arquidiocesana...">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Tipo</label>
                            <select id="org_type" class="form-control">
                                <option value="DIOCESE">Diocese</option>
                                <option value="PARISH">Paróquia</option>
                                <option value="CHAPEL">Capela</option>
                                <option value="CONVENT">Convento</option>
                                <option value="CURIA">Cúria</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">CNPJ</label>
                            <input type="text" id="org_tax_id" class="form-control mask-cnpj">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Diocese / Arquidiocese</label>
                            <input type="text" id="org_diocese" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Padroeiro</label>
                            <input type="text" id="org_patron" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Decreto Canônico (Nº)</label>
                            <input type="text" id="org_decree" class="form-control">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Data de Fundação</label>
                            <input type="date" id="org_foundation" class="form-control">
                        </div>
                    </div>

                    <h6 class="title txt-theme border-bottom pb-2 mb-3 mt-4">Contatos Oficiais</h6>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Telefone Principal</label>
                            <input type="text" id="org_phone" class="form-control mask-phone">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Telefone Secundário</label>
                            <input type="text" id="org_phone2" class="form-control mask-phone">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">E-mail Oficial</label>
                            <input type="email" id="org_email" class="form-control">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Site / Rede Social</label>
                            <input type="text" id="org_website" class="form-control" placeholder="https://...">
                        </div>
                    </div>

                    <h6 class="title txt-theme border-bottom pb-2 mb-3 mt-4">Endereço</h6>
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">CEP</label>
                            <input type="text" id="org_zip" class="form-control mask-cep" onblur="buscarCep(this.value)">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Logradouro</label>
                            <input type="text" id="org_street" class="form-control">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Número</label>
                            <input type="text" id="org_number" class="form-control">
                        </div>
                        <div class="col-md-5">
                            <label class="form-label">Bairro</label>
                            <input type="text" id="org_district" class="form-control">
                        </div>
                        <div class="col-md-5">
                            <label class="form-label">Cidade</label>
                            <input type="text" id="org_city" class="form-control">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">UF</label>
                            <input type="text" id="org_state" class="form-control" maxlength="2">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save-org" onclick="salvarInstituicao()">
                        <i class="fas fa-save me-2"></i> Salvar
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="modal fade" id="modalLocal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white">Gerenciar Espaço Físico</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="loc_id">
                    <div class="mb-3">
                        <label class="form-label title">Paróquia Vinculada</label>
                        <select id="loc_org_id" class="form-control select-orgs-modal" placeholder="Selecione..."></select>
                    </div>
                    <div class="row g-3 mb-3">
                        <div class="col-md-8">
                            <label class="form-label">Nome do Espaço <span class="text-danger">*</span></label>
                            <input type="text" id="loc_name" class="form-control" placeholder="Ex: Sala 10, Salão de Festas">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Capacidade</label>
                            <input type="number" id="loc_capacity" class="form-control" placeholder="0">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Responsável (Chaves)</label>
                        <select id="loc_responsible" class="form-control" placeholder="Selecione..."></select>
                    </div>
                    <div class="card bg-light border-0 mb-3 shadow-sm">
                        <div class="card-body py-2">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_diff_address" onchange="toggleLocAddress()">
                                <label class="form-check-label ms-2 fw-bold" for="loc_diff_address">Endereço diferente da Matriz?</label>
                            </div>
                            <div id="loc_address_block" class="mt-3 d-none">
                                <div class="row g-2">
                                    <div class="col-md-3">
                                        <input type="text" id="loc_zip" class="form-control mask-cep" placeholder="CEP" onblur="buscarCepLoc(this.value)">
                                    </div>
                                    <div class="col-md-9">
                                        <input type="text" id="loc_street" class="form-control" placeholder="Rua e Bairro">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <label class="form-label title mb-2">Recursos Disponíveis</label>
                    <div class="row g-3">
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_ac">
                                <label class="form-check-label ms-1" for="loc_ac">Ar-Condicionado</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_fan">
                                <label class="form-check-label ms-1" for="loc_fan">Ventilador</label>
                            </div>
                        </div>

                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_access">
                                <label class="form-check-label ms-1" for="loc_access">Acessibilidade</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_sacred">
                                <label class="form-check-label ms-1" for="loc_sacred">Altar/Sagrado</label>
                            </div>
                        </div>

                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_wifi">
                                <label class="form-check-label ms-1" for="loc_wifi">Wi-Fi</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_projector">
                                <label class="form-check-label ms-1" for="loc_projector">Projetor/TV</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_sound">
                                <label class="form-check-label ms-1" for="loc_sound">Som</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_computer">
                                <label class="form-check-label ms-1" for="loc_computer">Computadores</label>
                            </div>
                        </div>

                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_whiteboard">
                                <label class="form-check-label ms-1" for="loc_whiteboard">Lousa/Quadro</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_kitchen">
                                <label class="form-check-label ms-1" for="loc_kitchen">Copa/Cozinha</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_water">
                                <label class="form-check-label ms-1" for="loc_water">Bebedouro</label>
                            </div>
                        </div>
                        <div class="col-6 col-md-4">
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="loc_parking">
                                <label class="form-check-label ms-1" for="loc_parking">Estacionamento</label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save-loc" onclick="salvarLocal()">
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