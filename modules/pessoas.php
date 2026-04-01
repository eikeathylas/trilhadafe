<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Pessoas - Trilha da Fé</title>
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
                            <i class="fas fa-users" style="font-size: 1.1rem;"></i>
                        </div>
                        Gestão de Pessoas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-3 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">

            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">


                    <div class="col-12 d-md-none mb-2 mt-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Buscar Pessoa</h5>
                    </div>

                    <div class="col-12 col-md flex-grow-1">


                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-1"></i> Localizar Pessoa
                        </label>
                        <div class="input-group bg-fundo rounded-3 overflow-hidden border-0">
                            <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Buscar por Nome, CPF, E-mail ou Telefone..." style="border-radius: 12px 0 0 12px !important; height: 48px;">
                            <span class="input-group-text border-0 ps-3 d-flex d-md-none bg-primary bg-opacity-25">
                                <i class="fas fa-search text-muted"></i>
                            </span>
                        </div>
                    </div>

                    <div class="col-12 col-md-3">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            Filtrar por Vínculo
                        </label>
                        <select id="filtro-role" class="form-select border-0 bg-fundo shadow-none rounded-4 fw-medium text-body" style="height: 52px; padding-left: 20px;">
                            <option value="">Todos os vínculos</option>
                            <option value="1">Clero (Padre/Diácono)</option>
                            <option value="2">Secretária(o)s</option>
                            <option value="3">Catequistas</option>
                            <option value="4">Catequizandos</option>
                            <option value="5">Membros/Responsáveis</option>
                        </select>
                    </div>

                    <div class="col-12 col-md-auto d-grid mt-3 mt-md-0" data-slug="pessoas.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="modalPessoa()" style="height: 48px; border-radius: 12px; min-width: 160px;">
                            <i class="fas fa-plus-circle me-2"></i>
                            <span>Nova Pessoa</span>
                        </button>
                    </div>

                </div>
            </div>

        </div>


        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body p-0 p-md-4">
                <div class="list-table-pessoas w-100">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary border-2" role="status"></div>
                        <p class="mt-3 small fw-medium">Sincronizando banco de dados...</p>
                    </div>
                </div>
                <div class="pagination-pessoas pagination paginationButtons mt-4 pb-3 mb-5 mb-md-0 text-center justify-content-center w-100"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalPessoa" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-4 px-4 w-100 d-flex justify-content-center position-relative shadow-sm" style="z-index: 1090;">
                    <h4 class="modal-title fw-bold text-white d-flex align-items-center m-0 text-center" id="modalLabel" style="letter-spacing: -0.5px;">
                        <i class="fas fa-user-edit me-3 opacity-75"></i> Ficha da Pessoa
                    </h4>
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4 hover-scale" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <input type="hidden" id="person_id">

                    <div class="px-2 pb-1 border-bottom border-secondary border-opacity-10 shadow-sm text-center sticky-top" style="z-index: 1080 !important; top: 0;">
                        <div class="modern-tabs-wrapper" style="overflow-x: auto; white-space: nowrap;">
                            <ul class="nav nav-pills gap-2 flex-nowrap justify-content-md-center px-4" id="pessoaTab" role="tablist">
                                <li class="nav-item">
                                    <button class="nav-link active fw-bold px-4 rounded-pill" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button"><i class="fas fa-id-card me-2 opacity-75"></i> Pessoal</button>
                                </li>
                                <li class="nav-item" data-slug="pessoas.tab_contact">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="contato-tab" data-bs-toggle="tab" data-bs-target="#tab-contato" type="button"><i class="fas fa-address-book me-2 opacity-75"></i> Contato</button>
                                </li>
                                <li class="nav-item" data-slug="pessoas.tab_family">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="familia-tab" data-bs-toggle="tab" data-bs-target="#tab-familia" type="button"><i class="fas fa-users me-2 opacity-75"></i> Família</button>
                                </li>
                                <li class="nav-item" data-slug="pessoas.tab_sacraments">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="sacramentos-tab" data-bs-toggle="tab" data-bs-target="#tab-sacramentos" type="button"><i class="fas fa-cross me-2 opacity-75"></i> Sacramentos</button>
                                </li>
                                <li class="nav-item" data-slug="pessoas.tab_attachments">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="anexos-tab" data-bs-toggle="tab" data-bs-target="#tab-anexos" type="button"><i class="fas fa-paperclip me-2 opacity-75"></i> Anexos</button>
                                </li>
                                <li class="nav-item" data-slug="pessoas.tab_godparents">
                                    <button class="nav-link fw-bold px-4 rounded-pill" id="padrinhamento-tab" data-bs-toggle="tab" data-bs-target="#tab-padrinhamento" type="button"><i class="fas fa-dove me-2 opacity-75"></i> Padrinhamento</button>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content p-4 p-md-5">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="col-12 d-flex flex-column align-items-center mb-5">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-3" style="letter-spacing: 0.5px;">Foto de Perfil</label>
                                <div id="image-upload-container-person" class="border border-2 border-secondary border-opacity-25 p-1 rounded-circle bg-secondary bg-opacity-10 position-relative shadow-sm transition-all hover-scale" style="cursor: pointer; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center; overflow: hidden;" data-slug="pessoas.save">
                                    <div id="placeholder-logo-person" class="text-center">
                                        <i class="fas fa-camera fa-2x text-primary opacity-50 mb-2"></i>
                                        <p class="text-muted small mb-0 lh-1 fw-bold text-uppercase" style="font-size: 0.7rem;">Adicionar</p>
                                    </div>
                                    <img id="preview_photo" src="" class="img-fluid w-100 h-100 object-fit-cover rounded-circle position-absolute top-0 start-0" style="display: none; z-index: 2;" />
                                    <input type="file" id="profile_photo" class="d-none" accept="image/*" />
                                </div>
                                <button type="button" class="btn btn-sm btn-outline-danger mt-3 rounded-pill px-3 d-none fw-bold shadow-sm transition-all hover-scale" id="btn-remove-photo" onclick="removePhotoPerson()" data-slug="pessoas.save">
                                    <i class="fas fa-trash-can me-1"></i> Remover
                                </button>
                            </div>

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                                <div class="row g-3">
                                    <div class="col-12 col-md-8">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Nome Completo <span class="text-danger">*</span></label>
                                        <input type="text" id="full_name" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Data de Nascimento *</label>
                                        <input type="date" id="birth_date" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-uppercase text-body px-3 cursor-pointer" style="height: 52px;" onclick="this.showPicker()">
                                    </div>
                                    <div class="col-12 col-md-4 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">CPF</label>
                                        <input type="text" id="tax_id" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" placeholder="000.000.000-00" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-4 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">RG / Documento</label>
                                        <input type="text" id="national_id" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-4 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Sexo Biológico *</label>
                                        <select id="gender" class="form-select border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                            <option value="" selected disabled>Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 rounded-4 bg-info bg-opacity-10 p-4 shadow-inner mb-4 transition-all">
                                <div class="m-0 d-flex align-items-center">
                                    <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                        <i class="fas fa-wheelchair" style="font-size: 0.9rem;"></i>
                                    </div>
                                    <div class="d-flex flex-column flex-grow-1">
                                        <label class="form-check-label fw-bold text-body mb-0 cursor-pointer" for="is_pcd">Pessoa com Deficiência / Necessidade Especial</label>
                                        <span class="text-muted opacity-75 lh-sm" style="font-size: 0.75rem;">Habilite para registrar restrições médicas ou necessidades de acessibilidade</span>
                                    </div>
                                    <div class="ms-3 form-switch" style="margin-left: 0 !important; padding-left: 0 !important;">
                                        <input class="form-check-input shadow-none m-0 border-info cursor-pointer" type="checkbox" id="is_pcd" style="width: 48px; height: 26px;">
                                    </div>
                                </div>
                                <input type="text" id="pcd_details" class="form-control border-0 bg-white rounded-4 shadow-none d-none mt-4 fw-bold text-body px-3" placeholder="Descreva laudos, restrições médicas ou acessibilidade necessária..." style="height: 52px;">
                            </div>

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                                <h6 class="fw-bold text-body mb-4 d-flex align-items-center">
                                    <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                        <i class="fas fa-tags" style="font-size: 0.9rem;"></i>
                                    </div>
                                    Vínculos no Sistema
                                </h6>
                                <div class="row g-3">
                                    <div class="col-6 col-md-3">
                                        <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                            <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
                                                    <i class="fas fa-book-reader fs-5"></i>
                                                </div>
                                                <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="role_student">Catequizando</label>
                                                <div class="form-check form-switch m-0 p-0">
                                                    <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="role_student" style="width: 42px; height: 22px; position: relative; z-index: 2;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                            <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                                <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
                                                    <i class="fas fa-chalkboard-teacher fs-5"></i>
                                                </div>
                                                <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="role_catechist">Catequista</label>
                                                <div class="form-check form-switch m-0 p-0">
                                                    <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="role_catechist" style="width: 42px; height: 22px; position: relative; z-index: 2;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                            <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                                <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
                                                    <i class="fas fa-cross fs-5"></i>
                                                </div>
                                                <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="role_priest">Clero</label>
                                                <div class="form-check form-switch m-0 p-0">
                                                    <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="role_priest" style="width: 42px; height: 22px; position: relative; z-index: 2;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                            <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                                <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
                                                    <i class="fas fa-user-shield fs-5"></i>
                                                </div>
                                                <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="role_parent">Responsável</label>
                                                <div class="form-check form-switch m-0 p-0">
                                                    <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="role_parent" style="width: 42px; height: 22px; position: relative; z-index: 2;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-6 col-md-3">
                                        <div class="card h-100 border-0 shadow-sm rounded-4 bg-white transition-all hover-scale" style="border: 1px solid rgba(0,0,0,0.05) !important;">
                                            <div class="card-body p-3 d-flex flex-column align-items-center text-center position-relative">
                                                <div class="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
                                                    <i class="fas fa-desktop fs-5"></i>
                                                </div>
                                                <label class="fw-bold text-body small stretched-link cursor-pointer mb-3" for="role_secretary">Secretário(a)</label>
                                                <div class="form-check form-switch m-0 p-0">
                                                    <input class="form-check-input m-0 shadow-none cursor-pointer border-secondary" type="checkbox" id="role_secretary" style="width: 42px; height: 22px; position: relative; z-index: 2;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-contato">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner mb-4">
                                <div class="row g-3">
                                    <div class="col-12 col-md-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Celular / WhatsApp *</label>
                                        <input type="text" id="phone_mobile" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3 mask-phone" style="height: 52px;">
                                        <div class="form-check form-switch mt-3 d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 shadow-inner">
                                            <i class="fab fa-whatsapp text-success fs-3 me-3"></i>
                                            <div class="d-flex flex-column">
                                                <label class="form-check-label small fw-bold text-success mb-1" for="wants_whatsapp_group" style="cursor: pointer;">Grupo de WhatsApp</label>
                                                <span class="text-success opacity-75 lh-sm" style="font-size: 0.75rem;">Autoriza ser adicionado aos grupos da paróquia</span>
                                            </div>
                                            <div class="ms-auto ps-3">
                                                <input class="form-check-input shadow-none m-0 border-success" type="checkbox" id="wants_whatsapp_group" style="width: 44px; height: 24px; cursor: pointer;">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">E-mail Principal</label>
                                        <input type="email" id="email_contact" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                                <h6 class="fw-bold text-body mb-4 d-flex align-items-center">
                                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                        <i class="fas fa-map-marker-alt" style="font-size: 0.9rem;"></i>
                                    </div>
                                    Endereço Residencial
                                </h6>
                                <div class="row g-3">
                                    <div class="col-12 col-md-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">CEP</label>
                                        <div class="input-group bg-white rounded-4 shadow-none border-0 overflow-hidden">
                                            <input type="text" id="zip_code" class="form-control border-0 bg-transparent shadow-none fw-bold text-body px-3 mask-cep" onblur="buscarCep(this.value)" placeholder="00000-000" style="height: 52px;">
                                            <span class="input-group-text border-0 bg-transparent pe-3 cursor-pointer transition-all hover-scale" onclick="buscarCep($('#zip_code').val())">
                                                <i class="fas fa-search text-primary opacity-50"></i>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-7">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Logradouro (Rua, Av)</label>
                                        <input type="text" id="address_street" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-2">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Número</label>
                                        <input type="text" id="address_number" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-5 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Bairro</label>
                                        <input type="text" id="address_district" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-5 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Cidade</label>
                                        <input type="text" id="address_city" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-2 mt-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">UF</label>
                                        <input type="text" id="address_state" class="form-control border-0 bg-white rounded-4 shadow-none fw-bold text-uppercase text-body px-3" maxlength="2" style="height: 52px;">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-familia">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner">
                                <h6 class="fw-bold text-primary mb-4 d-flex align-items-center">
                                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                        <i class="fas fa-user-plus" style="font-size: 0.9rem;"></i>
                                    </div>
                                    Vincular Novo Familiar
                                </h6>
                                <div class="row g-3 align-items-end">
                                    <div class="col-12 col-md-6">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Familiar / Pessoa Cadastrada</label>
                                        <select id="sel_relative" class="form-control bg-white rounded-4 border-0 shadow-none px-3" style="height: 52px;"></select>
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Grau de Parentesco</label>
                                        <select id="sel_relationship" class="form-select border-0 shadow-none rounded-4 bg-white fw-bold text-body px-3" style="height: 52px;">
                                            <option value="MOTHER">Mãe</option>
                                            <option value="FATHER">Pai</option>
                                            <option value="GRANDPARENT">Avô / Avó</option>
                                            <option value="UNCLE">Tio / Tia</option>
                                            <option value="SIBLING">Irmão / Irmã</option>
                                            <option value="SPOUSE">Cônjuge</option>
                                            <option value="OTHER">Outro</option>
                                        </select>
                                    </div>
                                    <div class="col-12 col-md-2 d-grid">
                                        <button class="btn btn-primary px-4 rounded-4 shadow-sm h-100 d-flex align-items-center justify-content-center transition-all hover-scale" onclick="addRelative()" style="min-height: 52px;">
                                            <i class="fas fa-plus-circle me-2 d-none d-md-inline"></i> Vincular
                                        </button>
                                    </div>
                                    <div class="col-12 mt-4">
                                        <div class="form-check form-switch m-0 d-flex align-items-center bg-white p-3 rounded-4 shadow-sm border border-secondary border-opacity-10 transition-all hover-bg-light">
                                            <div class="bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 42px; height: 42px;">
                                                <i class="fas fa-balance-scale fs-6"></i>
                                            </div>
                                            <div class="d-flex flex-column flex-grow-1">
                                                <label class="form-check-label fw-bold text-body mb-0 cursor-pointer" for="is_legal_guardian">Responsável Legal e Financeiro</label>
                                                <span class="text-muted opacity-75 lh-sm" style="font-size: 0.75rem;">Concede permissões para assinar documentos e assumir responsabilidades</span>
                                            </div>
                                            <div class="ms-3">
                                                <input class="form-check-input shadow-none m-0 border-secondary cursor-pointer" type="checkbox" id="is_legal_guardian" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div id="lista-familiares" class="d-flex flex-column gap-2 mt-3"></div>
                        </div>

                        <div class="tab-pane fade" id="tab-sacramentos">
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-secondary bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between mb-0">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-water fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-body m-0">Batismo</h6>
                                                    <small class="text-muted fw-medium" style="font-size: 0.75rem;">Primeiro sacramento</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-secondary" type="checkbox" id="has_baptism" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                        <div id="baptism_details" class="d-none mt-4 pt-3 border-top border-secondary border-opacity-10">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-5">
                                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Data</label>
                                                    <input type="date" id="baptism_date" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body text-uppercase px-3" style="height: 48px;">
                                                </div>
                                                <div class="col-12 col-md-7">
                                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Local da Celebração</label>
                                                    <input type="text" id="baptism_place" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body px-3" placeholder="Paróquia ou Local" style="height: 48px;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-secondary bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between mb-0">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-bread-slice fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-body m-0">1ª Eucaristia</h6>
                                                    <small class="text-muted fw-medium" style="font-size: 0.75rem;">Primeira Comunhão</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-secondary" type="checkbox" id="has_eucharist" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                        <div id="eucharist_details" class="d-none mt-4 pt-3 border-top border-secondary border-opacity-10">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-5">
                                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Data</label>
                                                    <input type="date" id="eucharist_date" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body text-uppercase px-3" style="height: 48px;">
                                                </div>
                                                <div class="col-12 col-md-7">
                                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Local da Celebração</label>
                                                    <input type="text" id="eucharist_place" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body px-3" placeholder="Paróquia ou Local" style="height: 48px;">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-secondary bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between h-100">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-danger bg-opacity-10 text-danger rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-fire fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-body m-0">Crisma</h6>
                                                    <small class="text-muted fw-medium" style="font-size: 0.75rem;">Confirmação da fé</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-secondary" type="checkbox" id="has_chrism" style="width: 48px; height: 26px;">
                                                <input type="hidden" id="chrism_date"><input type="hidden" id="chrism_place">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-secondary bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between h-100">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-ring fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-body m-0">Casado(a) na Igreja</h6>
                                                    <small class="text-muted fw-medium" style="font-size: 0.75rem;">Matrimônio Canônico</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-secondary" type="checkbox" id="has_matrimony" style="width: 48px; height: 26px;">
                                                <input type="hidden" id="matrimony_date"><input type="hidden" id="matrimony_place">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-padrinhamento">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner">
                                <h6 class="fw-bold text-body mb-4 d-flex align-items-center">
                                    <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                        <i class="fas fa-user-friends" style="font-size: 0.9rem;"></i>
                                    </div>
                                    Dados do Padrinho ou Madrinha
                                </h6>
                                <div class="row g-3">
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Tipo de Vínculo</label>
                                        <select id="godparent_type" class="form-select border-0 bg-white rounded-4 shadow-none fw-bold text-body px-3" style="height: 52px;">
                                            <option value="" selected disabled>Selecione...</option>
                                            <option value="PADRINHO">Padrinho</option>
                                            <option value="MADRINHA">Madrinha</option>
                                        </select>
                                    </div>
                                    <div class="col-12 col-md-8">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Nome Completo</label>
                                        <input type="text" id="godparent_name" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body px-3" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Telefone / WhatsApp</label>
                                        <input type="text" id="godparent_phone" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body px-3 mask-phone" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Data de Nascimento</label>
                                        <input type="date" id="godparent_dob" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-uppercase text-body px-3 cursor-pointer" style="height: 52px;" onclick="this.showPicker()">
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1">Endereço Residencial</label>
                                        <input type="text" id="godparent_address" class="form-control border-0 shadow-sm rounded-4 bg-white fw-bold text-body px-3" placeholder="Rua, Número, Bairro..." style="height: 52px;">
                                    </div>
                                </div>
                            </div>

                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-success bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between h-100">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-church fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-success m-0">Casado(a) na Igreja</h6>
                                                    <small class="text-success opacity-75 fw-medium" style="font-size: 0.75rem;">Possui matrimônio sacramental</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-success" type="checkbox" id="godparent_married" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="card p-4 border-0 bg-info bg-opacity-10 rounded-4 h-100 shadow-inner transition-all hover-bg-light">
                                        <div class="d-flex align-items-center justify-content-between h-100">
                                            <div class="d-flex align-items-center gap-3">
                                                <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px;">
                                                    <i class="fas fa-user fs-5"></i>
                                                </div>
                                                <div>
                                                    <h6 class="fw-bold text-info m-0">Solteiro(a)</h6>
                                                    <small class="text-info opacity-75 fw-medium" style="font-size: 0.75rem;">Sem vínculo matrimonial religioso</small>
                                                </div>
                                            </div>
                                            <div class="form-check form-switch m-0 p-0">
                                                <input class="form-check-input shadow-none m-0 cursor-pointer border-info" type="checkbox" id="godparent_single" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-anexos">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner">
                                <h6 class="fw-bold text-body mb-4 d-flex align-items-center">
                                    <i class="fas fa-cloud-upload-alt me-2 text-primary opacity-75"></i> Enviar Novo Documento
                                </h6>
                                <div class="row g-3 align-items-end">
                                    <div class="col-12 col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Descrição</label>
                                        <input type="text" id="attachment_desc" class="form-control border-0 shadow-sm rounded-4 fw-bold text-body bg-white px-3" placeholder="Ex: RG, Foto, Laudo..." style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2 ms-1" style="letter-spacing: 0.5px;">Selecione o Arquivo</label>
                                        <input type="file" id="attachment_file" class="form-control border-0 shadow-sm rounded-4 bg-white text-muted fw-bold text-body px-3" style="height: 52px; line-height: 38px;">
                                    </div>
                                    <div class="col-12 col-md-2 d-grid">
                                        <button class="btn btn-primary fw-bold shadow-sm rounded-4 d-flex align-items-center justify-content-center transition-all hover-scale" onclick="uploadAttachment(this)" style="height: 52px;">
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-column gap-2 mt-3" id="lista-anexos-cards"></div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center w-100 d-flex">
                    <div id="btn-print-termos" class="d-none me-auto">
                        <button type="button" class="btn btn-secondary bg-opacity-10 fw-bold px-2 rounded-4 border-0 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="abrirTermos()" style="height: 48px;" title="Imprimir Autorizações">
                            <i class="fas fa-print me-2 opacity-75"></i> <span class="d-none d-md-inline">Termos LGPD / Imagem</span><span class="d-inline d-md-none">Termos</span>
                        </button>
                    </div>
                    <div class="d-flex align-items-center ms-auto">
                        <button type="button" class="btn btn-light fw-bold px-3 rounded-4 border shadow-sm d-flex align-items-center justify-content-center me-2 transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                        <button type="button" class="btn btn-primary fw-bold px-4 rounded-4 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="salvarPessoa(this)" data-slug="pessoas.save" style="height: 48px;">
                            <i class="fas fa-save me-2 opacity-75"></i> Salvar
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <?php include "./assets/components/Modal-Faqs.php"; ?>
    <?php include "./assets/components/Modal-Audit.php"; ?>
    <?php include "./assets/components/Scripts.php"; ?>

    <script src="assets/js/pessoas.js?v=<?php echo time(); ?>"></script>
</body>

</html>