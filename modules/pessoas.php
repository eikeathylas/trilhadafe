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

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-3 align-items-end">
                    <div class="col-12 col-md flex-grow-1">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search opacity-50 me-2 mt-1"></i> Localizar Pessoa
                        </label>
                        <div class="input-group bg-fundo rounded-4 overflow-hidden border-0">
                            <span class="input-group-text border-0 bg-transparent ps-4">
                                <i class="fas fa-search text-muted opacity-75"></i>
                            </span>
                            <input type="text" id="busca-texto" class="form-control border-0 bg-transparent shadow-none fw-medium" placeholder="Buscar por Nome, CPF, E-mail ou Telefone..." style="height: 52px;">
                        </div>
                    </div>

                    <div class="col-12 col-md-3">
                        <label class="form-label d-none d-md-flex small fw-bold text-uppercase text-muted mb-2" style="letter-spacing: 0.5px;">
                            Filtrar por Vínculo
                        </label>
                        <select id="filtro-role" class="form-select border-0 bg-fundo shadow-none rounded-4 fw-medium text-body" style="height: 52px; padding-left: 20px;">
                            <option value="">Todos os vínculos</option>
                            <option value="1">Fiéis / Membros</option>
                            <option value="2">Catequizandos</option>
                            <option value="3">Catequistas / Professores</option>
                            <option value="4">Coordenadores</option>
                            <option value="5">Funcionários</option>
                        </select>
                    </div>

                    <div class="col-12 col-md-auto d-grid" data-slug="pessoas.create">
                        <button class="btn btn-primary fw-bold shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="modalPessoa()" style="height: 52px; border-radius: 14px; min-width: 170px;">
                            <i class="fas fa-user-plus me-2"></i>
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
                    <button type="button" class="btn-close btn-close-white shadow-none position-absolute end-0 me-4" data-bs-dismiss="modal"></button>
                </div>

                <div class="modal-body p-0 bg-body">
                    <input type="hidden" id="person_id">

                    <div class="px-2 pt-3 pb-2 border-bottom border-secondary border-opacity-10 bg-white shadow-sm text-center sticky-top" style="z-index: 1080 !important; top: 0;">
                        <div class="modern-tabs-wrapper" style="overflow-x: auto; white-space: nowrap;">
                            <ul class="nav nav-pills gap-2 flex-nowrap justify-content-md-center" id="pessoaTab" role="tablist">
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
                            </ul>
                        </div>
                    </div>

                    <div class="tab-content p-4 p-md-5">

                        <div class="tab-pane fade show active" id="tab-dados">
                            <div class="row g-3">

                                <div class="col-12 d-flex flex-column align-items-center mb-4">
                                    <label for="profile_photo" class="position-relative d-inline-block m-0" style="cursor: pointer; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                        <img id="preview_photo" src="assets/img/avatar-placeholder.png" class="rounded-circle object-fit-cover shadow border border-4 border-white" style="width: 120px; height: 120px; background: #f8f9fa;">
                                        <div class="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-lg border border-2 border-white" style="width: 38px; height: 38px;">
                                            <i class="fas fa-camera" style="font-size: 0.9rem;"></i>
                                        </div>
                                    </label>
                                    <input type="file" id="profile_photo" class="d-none" accept="image/*" onchange="previewImage(this)">
                                </div>

                                <div class="col-12 col-md-8">
                                    <div class="form-floating">
                                        <input type="text" id="full_name" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-bold text-body" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Nome Completo *</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="form-floating">
                                        <input type="date" id="birth_date" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium text-uppercase cursor-pointer" onclick="this.showPicker()">
                                        <label class="text-muted fw-bold small text-uppercase">Data de Nascimento *</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="form-floating">
                                        <input type="text" id="tax_id" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">CPF</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="form-floating">
                                        <input type="text" id="national_id" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">RG / Documento</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-4">
                                    <div class="form-floating">
                                        <select id="gender" class="form-select border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium text-body">
                                            <option value="">Selecione...</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Feminino</option>
                                        </select>
                                        <label class="text-muted fw-bold small text-uppercase">Sexo Biológico *</label>
                                    </div>
                                </div>

                                <div class="col-12 mt-4 pt-4 border-top border-secondary border-opacity-10">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 36px; height: 36px;">
                                            <i class="fas fa-wheelchair" style="font-size: 1rem;"></i>
                                        </div>
                                        <div class="form-check form-switch m-0 p-0 d-flex align-items-center">
                                            <input class="form-check-input m-0 shadow-none me-3" type="checkbox" id="is_pcd" style="width: 48px; height: 26px; cursor: pointer;">
                                            <label class="fw-bold text-body small text-uppercase mb-0" for="is_pcd" style="cursor: pointer; padding-top: 3px; letter-spacing: 0.5px;">Pessoa com Deficiência (PCD) / Necessidade Especial</label>
                                        </div>
                                    </div>
                                    <input type="text" id="pcd_details" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none d-none mt-2 fw-medium" placeholder="Descreva laudos, restrições médicas ou acessibilidade necessária..." style="height: 54px;">
                                </div>

                                <div class="col-12 mt-4 pt-4 border-top border-secondary border-opacity-10">
                                    <h6 class="fw-bold text-body mb-4 d-flex align-items-center">
                                        <div class="bg-warning bg-opacity-10 text-warning rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                            <i class="fas fa-tags" style="font-size: 0.85rem;"></i>
                                        </div>
                                        Vínculos no Sistema
                                    </h6>

                                    <div class="row g-3 px-1">
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
                                                    <div class="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center mb-3" style="width: 46px; height: 46px;">
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
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-contato">
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <div class="form-floating mb-3">
                                        <input type="text" id="phone_mobile" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-bold text-body" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Celular / WhatsApp *</label>
                                    </div>
                                    <div class="form-check form-switch m-0 d-flex align-items-center p-3 bg-success bg-opacity-10 rounded-4 border border-success border-opacity-25 shadow-inner">
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
                                    <div class="form-floating">
                                        <input type="email" id="email_contact" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">E-mail Principal</label>
                                    </div>
                                </div>
                                <div class="col-12 mt-5 pt-4 border-top border-secondary border-opacity-10">
                                    <h6 class="fw-bold text-body mb-3 d-flex align-items-center">
                                        <div class="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                            <i class="fas fa-map-marker-alt" style="font-size: 0.85rem;"></i>
                                        </div>
                                        Endereço Residencial
                                    </h6>
                                </div>
                                <div class="col-12 col-md-3">
                                    <div class="form-floating position-relative">
                                        <input type="text" id="zip_code" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-bold" placeholder=" " onblur="buscarCep(this.value)">
                                        <label class="text-muted fw-bold small text-uppercase">CEP</label>
                                        <i class="fas fa-search position-absolute top-50 end-0 translate-middle-y me-4 text-primary opacity-50"></i>
                                    </div>
                                </div>
                                <div class="col-12 col-md-7">
                                    <div class="form-floating">
                                        <input type="text" id="address_street" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Logradouro (Rua, Av)</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-2">
                                    <div class="form-floating">
                                        <input type="text" id="address_number" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-bold" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Número</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-5">
                                    <div class="form-floating">
                                        <input type="text" id="address_district" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Bairro</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-5">
                                    <div class="form-floating">
                                        <input type="text" id="address_city" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-medium" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">Cidade</label>
                                    </div>
                                </div>
                                <div class="col-12 col-md-2">
                                    <div class="form-floating">
                                        <input type="text" id="address_state" class="form-control border-0 bg-secondary bg-opacity-10 rounded-4 shadow-none fw-bold text-uppercase" placeholder=" ">
                                        <label class="text-muted fw-bold small text-uppercase">UF</label>
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
                                <div class="row g-3 align-items-center">
                                    <div class="col-12 col-md-6">
                                        <div class="bg-white rounded-4 shadow-sm border border-secondary border-opacity-10 px-2 py-1 h-100 d-flex align-items-center" style="min-height: 58px;">
                                            <div class="w-100">
                                                <select id="sel_relative" class="form-control shadow-none border-0"></select>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-4">
                                        <div class="form-floating">
                                            <select id="sel_relationship" class="form-select border-0 shadow-sm rounded-4 fw-bold text-body" style="height: 58px;">
                                                <option value="MOTHER">Mãe</option>
                                                <option value="FATHER">Pai</option>
                                                <option value="GRANDPARENT">Avô / Avó</option>
                                                <option value="UNCLE">Tio / Tia</option>
                                                <option value="SIBLING">Irmão / Irmã</option>
                                                <option value="SPOUSE">Cônjuge</option>
                                                <option value="OTHER">Outro</option>
                                            </select>
                                            <label class="text-muted fw-bold small text-uppercase">Grau de Parentesco</label>
                                        </div>
                                    </div>
                                    <div class="col-12 col-md-2 d-grid">
                                        <button class="btn btn-primary px-4 rounded-4 shadow-sm h-100 d-flex align-items-center justify-content-center transition-all hover-scale" onclick="addRelative()" style="min-height: 58px;">
                                            <i class="fas fa-plus me-2 d-none d-md-inline"></i> Vincular
                                        </button>
                                    </div>
                                    <div class="col-12 mt-3">
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
                                                <input class="form-check-input shadow-none m-0 cursor-pointer" type="checkbox" id="has_baptism" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                        <div id="baptism_details" class="d-none mt-4 pt-3 border-top border-secondary border-opacity-10">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-5">
                                                    <input type="date" id="baptism_date" class="form-control border-0 shadow-sm rounded-3 text-muted text-uppercase small" title="Data do Batismo">
                                                </div>
                                                <div class="col-12 col-md-7">
                                                    <input type="text" id="baptism_place" class="form-control border-0 shadow-sm rounded-3" placeholder="Paróquia ou Local">
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
                                                <input class="form-check-input shadow-none m-0 cursor-pointer" type="checkbox" id="has_eucharist" style="width: 48px; height: 26px;">
                                            </div>
                                        </div>
                                        <div id="eucharist_details" class="d-none mt-4 pt-3 border-top border-secondary border-opacity-10">
                                            <div class="row g-2">
                                                <div class="col-12 col-md-5">
                                                    <input type="date" id="eucharist_date" class="form-control border-0 shadow-sm rounded-3 text-muted text-uppercase small" title="Data da Eucaristia">
                                                </div>
                                                <div class="col-12 col-md-7">
                                                    <input type="text" id="eucharist_place" class="form-control border-0 shadow-sm rounded-3" placeholder="Paróquia ou Local">
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
                                                <input class="form-check-input shadow-none m-0 cursor-pointer" type="checkbox" id="has_chrism" style="width: 48px; height: 26px;">
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
                                                <input class="form-check-input shadow-none m-0 cursor-pointer" type="checkbox" id="has_matrimony" style="width: 48px; height: 26px;">
                                                <input type="hidden" id="matrimony_date"><input type="hidden" id="matrimony_place">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-anexos">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 mb-4 shadow-inner">
                                <h6 class="fw-bold text-body mb-3 d-flex align-items-center">
                                    <i class="fas fa-cloud-upload-alt me-2 text-primary opacity-75"></i> Enviar Novo Documento
                                </h6>
                                <div class="row g-3 align-items-center">
                                    <div class="col-12 col-md-5">
                                        <input type="text" id="attachment_desc" class="form-control border-0 shadow-sm rounded-4 fw-medium" placeholder="Descrição (Ex: RG, Foto, Laudo...)" style="height: 52px;">
                                    </div>
                                    <div class="col-12 col-md-5">
                                        <input type="file" id="attachment_file" class="form-control border-0 shadow-sm rounded-4 bg-white text-muted fw-medium" style="height: 52px; line-height: 38px;">
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

                <div class="modal-footer border-0 p-2 bg-transparent align-items-center">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-4 border shadow-sm d-flex align-items-center justify-content-center me-2 transition-all hover-bg-light" data-bs-dismiss="modal" style="height: 48px;">Fechar</button>
                    <button type="button" class="btn btn-primary fw-bold px-5 rounded-4 shadow-sm d-flex align-items-center justify-content-center transition-all hover-scale" onclick="salvarPessoa(this)" data-slug="pessoas.save" style="height: 48px;">
                        <i class="fas fa-save me-2 opacity-75"></i> Salvar
                    </button>
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