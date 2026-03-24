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
                    <li class="breadcrumb-item active fw-bold text-body" aria-current="page"
                        style="font-size: 1.5rem; letter-spacing: -0.8px;">
                        Gestão de Pessoas
                    </li>
                </ol>
            </nav>
        </div>

        <div class="ios-search-container border-0 shadow-sm mb-0 mb-md-4 rounded-sm-0 rounded-md-4 bg-transparent-card">
            <div class="card-body p-3 p-md-4">
                <div class="row g-2 g-md-3 align-items-end">

                    <div class="col-12 d-md-none mb-2">
                        <h5 class="fw-bold text-body m-0" style="letter-spacing: -0.5px;">Gestão de Pessoas</h5>
                    </div>

                    <div class="col-8 col-md-5">
                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                            <i class="fas fa-search me-1 opacity-50"></i> Buscar
                        </label>
                        <input type="text" id="busca-texto" class="form-control shadow-sm" placeholder="Buscar...">
                    </div>

                    <div class="col-4 col-md-3">
                        <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="filtro-role" style="letter-spacing: 0.5px;">
                            <i class="fas fa-filter me-1 opacity-50"></i> Função
                        </label>
                        <select id="filtro-role" class="form-control">
                            <option value="">Todos</option>
                            <option value="STUDENT">Catequizandos</option>
                            <option value="CATECHIST">Catequistas</option>
                            <option value="PRIEST">Clero</option>
                            <option value="PARENT">Responsáveis</option>
                        </select>
                    </div>

                    <div class="col-12 col-md-4 d-grid d-md-block mt-2 mt-md-0" data-slug="pessoas.create">
                        <button class="btn btn-primary fw-bold shadow-sm w-100" style="height: 42px; border-radius: 12px;" onclick="modalPessoa()">
                            <i class="fas fa-user-plus me-2"></i> <span class="d-none d-md-inline">Nova Pessoa</span><span class="d-inline d-md-none">Adicionar</span>
                        </button>
                    </div>

                </div>
            </div>
        </div>

        <div class="card list-commanded mb-0 mb-md-4 border-0 shadow-none shadow-md-sm rounded-sm-0 rounded-md-4">
            <div class="card-body p-0 pt-md-4 px-md-0">
                <div class="table-responsive list-table-pessoas">
                    <div class="text-center py-5 opacity-50">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
                        <p class="mt-3 fw-medium">Carregando diretório...</p>
                    </div>
                </div>
                <div class="pagination paginationButtons pagination-pessoas mt-3 pb-4 pb-md-0 text-center justify-content-center"></div>
            </div>
        </div>

        <?php include "./assets/components/Footer.php"; ?>
    </div>

    <div class="modal fade" id="modalPessoa" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

                <div class="modal-header border-0 bg-primary bg-gradient py-3 px-4">
                    <h5 class="modal-title fw-bold text-white d-flex align-items-center fs-5" id="modalPessoaLabel">
                        <i class="fas fa-user-plus me-3 opacity-75"></i> Cadastro de Pessoa
                    </h5>
                    <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-10 z-2 shadow-sm text-center">
                    <div class="modern-tabs-wrapper">
                        <ul class="nav nav-pills gap-1" id="pessoaTab" role="tablist" style="flex-wrap: nowrap;">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active fw-medium" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab" aria-selected="true">
                                    <i class="fas fa-id-card me-2"></i> Pessoal
                                </button>
                            </li>
                            <li class="nav-item" role="presentation" data-slug="pessoas.contact">
                                <button class="nav-link fw-medium" id="contato-tab" data-bs-toggle="tab" data-bs-target="#tab-contato" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-map-marker-alt me-2"></i> Contato
                                </button>
                            </li>
                            <li class="nav-item" role="presentation" data-slug="pessoas.roles">
                                <button class="nav-link fw-medium" id="vinculos-tab" data-bs-toggle="tab" data-bs-target="#tab-vinculos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-users-cog me-2"></i> Vínculos
                                </button>
                            </li>
                            <li class="nav-item" role="presentation" data-slug="pessoas.family">
                                <button class="nav-link fw-medium" id="familia-tab" data-bs-toggle="tab" data-bs-target="#tab-familia" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-home me-2"></i> Família
                                </button>
                            </li>
                            <li class="nav-item" role="presentation" data-slug="pessoas.sacraments">
                                <button class="nav-link fw-medium" id="sacra-tab" data-bs-toggle="tab" data-bs-target="#tab-sacramentos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-church me-2"></i> Sacramentos
                                </button>
                            </li>
                            <li class="nav-item" role="presentation" data-slug="pessoas.attachments">
                                <button class="nav-link fw-medium" id="anexos-tab" data-bs-toggle="tab" data-bs-target="#tab-anexos" type="button" role="tab" aria-selected="false" tabindex="-1">
                                    <i class="fas fa-paperclip me-2"></i> Arquivos
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="modal-body p-0 modal-body-scrollable">
                    <input type="hidden" id="person_id" value="" />

                    <div class="tab-content p-4" id="pessoaTabContent">

                        <div class="tab-pane fade show active" id="tab-dados" role="tabpanel">
                            <div class="row g-4">
                                <div class="col-12 col-md-3 d-flex flex-column align-items-center">
                                    <label class="form-label small fw-bold text-uppercase text-muted mb-2">Foto de Perfil</label>
                                    <div id="image-upload-container" class="border border-2 border-secondary border-opacity-25 p-1 rounded-circle bg-secondary bg-opacity-10 position-relative shadow-sm transition-all" style="cursor: pointer; width: 160px; height: 160px; display: flex; align-items: center; justify-content: center; overflow: hidden;" data-slug="pessoas.photo">
                                        <div id="placeholder-foto" class="text-center">
                                            <i class="fas fa-camera fa-2x text-primary opacity-50 mb-1"></i>
                                            <p class="text-muted small mb-0 lh-1" style="font-size: 0.75rem;">Adicionar</p>
                                        </div>
                                        <img id="img-preview" src="" class="img-fluid w-100 h-100 object-fit-cover rounded-circle position-absolute top-0 start-0" style="display: none; z-index: 2;" />
                                        <input type="file" id="person_photo" class="d-none" accept="image/*" />
                                    </div>
                                    <button type="button" class="btn btn-sm btn-outline-danger mt-3 rounded-pill px-3 d-none fw-medium" id="btn-remove-foto" onclick="removeFoto()" data-slug="pessoas.photo">
                                        <i class="fas fa-trash-can me-1"></i> Remover Foto
                                    </button>
                                </div>

                                <div class="col-12 col-md-9">
                                    <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                                        <div class="row g-3">
                                            <div class="col-md-8">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome Completo <span class="text-danger">*</span></label>
                                                <input type="text" id="full_name" class="form-control border-0 shadow-none" placeholder="Nome na certidão" />
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nome Social / Apelido</label>
                                                <input type="text" id="religious_name" class="form-control border-0 shadow-none" placeholder="Como gosta de ser chamado" />
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Nascimento</label>
                                                <input type="date" id="birth_date" class="form-control border-0 shadow-none" />
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">CPF</label>
                                                <input type="text" id="tax_id" class="form-control border-0 shadow-none mask-cpf" maxlength="14" placeholder="000.000.000-00" />
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Gênero</label>
                                                <select id="gender" class="form-control border-0 shadow-none">
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Feminino</option>
                                                </select>
                                            </div>
                                            <div class="col-md-4">
                                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">RG / Documento (Opcional)</label>
                                                <input type="text" id="national_id" class="form-control border-0 shadow-none" placeholder="Nº do Documento" />
                                            </div>

                                            <div class="col-md-12 mt-4">
                                                <div class="p-3 rounded-3 border border-secondary border-opacity-10">
                                                    <div class="form-check form-switch mb-0 d-flex align-items-center">
                                                        <input class="form-check-input shadow-none fs-5 m-0 me-3" type="checkbox" id="is_pcd" style="cursor:pointer;" />
                                                        <label class="form-check-label fw-bold text-primary m-0" for="is_pcd" style="cursor:pointer;">
                                                            Pessoa com Deficiência (PCD) / Necessidades Especiais
                                                        </label>
                                                    </div>
                                                    <input type="text" id="pcd_details" class="form-control bg-secondary bg-opacity-10 border-0 shadow-none mt-3 d-none" placeholder="Descreva a necessidade..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-contato" role="tabpanel" data-slug="pessoas.contact">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner">
                                <h6 class="fw-bold text-primary mb-3 d-flex align-items-center">
                                    <i class="fas fa-phone-volume me-2 opacity-75"></i> Telefones e Email
                                </h6>
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">WhatsApp/Celular</label>
                                        <input type="text" id="phone_mobile" class="form-control border-0 shadow-none mask-phone" maxlength="15" placeholder="(00) 00000-0000" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Fixo (Opcional)</label>
                                        <input type="text" id="phone_landline" class="form-control border-0 shadow-none mask-phone" maxlength="15" placeholder="(00) 0000-0000" />
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">E-mail</label>
                                        <input type="email" id="email" class="form-control border-0 shadow-none" placeholder="email@exemplo.com" />
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 p-md-4 shadow-inner">
                                <h6 class="fw-bold text-primary mb-3 d-flex align-items-center">
                                    <i class="fas fa-map-location-dot me-2 opacity-75"></i> Endereço
                                </h6>
                                <div class="row g-3">
                                    <div class="col-md-3">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">CEP</label>
                                        <div class="input-group">
                                            <input type="text" id="zip_code" class="form-control border-0 shadow-none mask-cep" onblur="buscarCep(this.value)" maxlength="9" placeholder="00000-000" />
                                            <span class="input-group-text border-0 text-primary cursor-pointer" onclick="buscarCep($('#zip_code').val())"><i class="fas fa-search"></i></span>
                                        </div>
                                    </div>
                                    <div class="col-md-7">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Logradouro</label>
                                        <input type="text" id="address_street" class="form-control border-0 shadow-none" placeholder="Rua, Avenida..." />
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Número</label>
                                        <input type="text" id="address_number" class="form-control border-0 shadow-none" placeholder="Nº" />
                                    </div>
                                    <div class="col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Bairro</label>
                                        <input type="text" id="address_district" class="form-control border-0 shadow-none" />
                                    </div>
                                    <div class="col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">Cidade</label>
                                        <input type="text" id="address_city" class="form-control border-0 shadow-none" />
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label small fw-bold text-uppercase text-muted mb-2">UF</label>
                                        <input type="text" id="address_state" class="form-control border-0 shadow-none text-center" maxlength="2" placeholder="PE" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-vinculos" role="tabpanel" data-slug="pessoas.roles">
                            <div class="alert bg-primary bg-opacity-10 text-primary border-0 rounded-4 d-flex align-items-center mb-4 shadow-sm p-3">
                                <i class="fas fa-circle-info fs-4 me-3"></i>
                                <div class="small fw-medium">Selecione os papéis que esta pessoa exerce na paróquia.</div>
                            </div>
                            <div class="row g-3">
                                <div class="col-12 col-md-6">
                                    <div class="card h-100 border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 cursor-pointer border-start border-4 border-primary" onclick="$('#role_student').click()">
                                        <div class="card-body p-4 d-flex align-items-center">
                                            <div class="form-check form-switch m-0 me-3">
                                                <input class="form-check-input fs-4 shadow-none m-0" type="checkbox" id="role_student" onclick="event.stopPropagation()" />
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-primary">Catequizando (Aluno)</h6>
                                                <small class="text-muted opacity-75">Habilita matrícula em turmas.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="card h-100 border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 cursor-pointer border-start border-4 border-warning" onclick="$('#role_catechist').click()">
                                        <div class="card-body p-4 d-flex align-items-center">
                                            <div class="form-check form-switch m-0 me-3">
                                                <input class="form-check-input fs-4 shadow-none m-0" type="checkbox" id="role_catechist" onclick="event.stopPropagation()" />
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-warning">Catequista (Professor)</h6>
                                                <small class="text-muted opacity-75">Permite assumir turmas.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="card h-100 border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 cursor-pointer border-start border-4 border-success" onclick="$('#role_parent').click()">
                                        <div class="card-body p-4 d-flex align-items-center">
                                            <div class="form-check form-switch m-0 me-3">
                                                <input class="form-check-input fs-4 shadow-none m-0" type="checkbox" id="role_parent" onclick="event.stopPropagation()" />
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-success">Responsável / Pais</h6>
                                                <small class="text-muted opacity-75">Vínculo familiar exigido para menores.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-12 col-md-6">
                                    <div class="card h-100 border-0 shadow-sm rounded-4 bg-secondary bg-opacity-10 cursor-pointer border-start border-4 border-dark" onclick="$('#role_priest').click()">
                                        <div class="card-body p-4 d-flex align-items-center">
                                            <div class="form-check form-switch m-0 me-3">
                                                <input class="form-check-input fs-4 shadow-none m-0" type="checkbox" id="role_priest" onclick="event.stopPropagation()" />
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-secondary">Clero (Padre / Diácono)</h6>
                                                <small class="text-muted opacity-75">Permite celebrar sacramentos.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-familia" role="tabpanel" data-slug="pessoas.family">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-3 mb-4 shadow-inner">
                                <label class="form-label small fw-bold text-uppercase text-muted mb-2">Buscar e Vincular Parente</label>
                                <select id="search_relative" class="form-control border-0 shadow-none" placeholder="Digite o nome..."></select>
                            </div>
                            <div class="d-flex flex-column gap-2" id="lista-familia-cards">
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-sacramentos" role="tabpanel" data-slug="pessoas.sacraments">
                            <div class="card border-0 rounded-4 bg-secondary bg-opacity-10 p-4 shadow-inner">
                                <h6 class="fw-bold text-primary border-bottom border-secondary border-opacity-10 pb-3 mb-4 d-flex align-items-center">
                                    <i class="fas fa-cross me-2 opacity-75"></i> Situação Canônica e Histórico
                                </h6>
                                <div class="mb-4">
                                    <div class="form-check form-switch d-flex align-items-center mb-3">
                                        <input class="form-check-input fs-4 shadow-none m-0 me-3" type="checkbox" id="has_baptism" />
                                        <label class="form-check-label fw-bold text-body m-0" for="has_baptism">Batizado na Igreja Católica</label>
                                    </div>
                                    <div id="baptism_details" class="ms-md-5 ms-3 ps-3 border-start border-2 border-primary d-none">
                                        <div class="row g-2">
                                            <div class="col-md-7"><input type="text" class="form-control border-0 shadow-none" id="baptism_place" placeholder="Paróquia" /></div>
                                            <div class="col-md-5"><input type="date" class="form-control border-0 shadow-none" id="baptism_date" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-4">
                                    <div class="form-check form-switch d-flex align-items-center mb-3">
                                        <input class="form-check-input fs-4 shadow-none m-0 me-3" type="checkbox" id="has_eucharist" />
                                        <label class="form-check-label fw-bold text-body m-0" for="has_eucharist">Recebeu Primeira Eucaristia</label>
                                    </div>
                                    <div id="eucharist_details" class="ms-md-5 ms-3 ps-3 border-start border-2 border-warning d-none">
                                        <div class="row g-2">
                                            <div class="col-md-7"><input type="text" class="form-control border-0 shadow-none" id="eucharist_place" placeholder="Paróquia" /></div>
                                            <div class="col-md-5"><input type="date" class="form-control border-0 shadow-none" id="eucharist_date" /></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <div class="form-check form-switch d-flex align-items-center p-3 rounded-3 border border-secondary border-opacity-10">
                                            <input class="form-check-input fs-4 shadow-none m-0 me-3" type="checkbox" id="has_confirmation" />
                                            <label class="form-check-label fw-bold text-body m-0" for="has_confirmation">Crisma</label>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-check form-switch d-flex align-items-center p-3 rounded-3 border border-secondary border-opacity-10">
                                            <input class="form-check-input fs-4 shadow-none m-0 me-3" type="checkbox" id="has_marriage" />
                                            <label class="form-check-label fw-bold text-body m-0" for="has_marriage">Casado(a) na Igreja</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-anexos" role="tabpanel" data-slug="pessoas.attachments">
                            <div class="card border-0 rounded-4 bg-primary bg-opacity-10 p-3 p-md-4 mb-4 shadow-inner border border-primary border-opacity-25">
                                <div class="row g-3 align-items-end">
                                    <div class="col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-primary mb-2">Descrição *</label>
                                        <input type="text" id="new_attachment_desc" class="form-control border-0 shadow-none" placeholder="Ex: Certidão de Batismo" />
                                    </div>
                                    <div class="col-md-5">
                                        <label class="form-label small fw-bold text-uppercase text-primary mb-2">Arquivo *</label>
                                        <input type="file" id="new_attachment_file" class="form-control border-0 shadow-none" />
                                    </div>
                                    <div class="col-md-2">
                                        <button class="btn btn-primary w-100 fw-bold shadow-sm rounded-3 py-2" onclick="uploadAttachment(this)">
                                            <i class="fas fa-cloud-upload-alt me-2"></i> Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="d-flex flex-column gap-2" id="lista-anexos-cards">
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer border-0 p-4 pt-0 bg-transparent">
                    <button type="button" class="btn btn-light fw-bold px-4 rounded-3 border" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 rounded-3 shadow-sm" onclick="salvarPessoa(this)" data-slug="pessoas.save">
                        <i class="fas fa-user-check me-2"></i> Salvar Cadastro
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