<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Pessoas - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>

    <link href="assets/css/foto.css?v=<?php echo time(); ?>" rel="stylesheet">
</head>

<body>

    <div id="div-loader" class="div-loader" style="display: none;"><span class="loader"></span></div>

    <div id="sidebar-only" class="sidebar-only">
        <?php include "./assets/components/Sidebar.php"; ?>
    </div>

    <div class="container">

        <div class="main-only">

            <nav aria-label="breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="dashboard.php">Painel</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Diretório de Pessoas</li>
                </ol>
            </nav>

            <div class="card list-commanded border-0 shadow-sm mb-4 rounded-4 bg-transparent-card">
                <div class="card-body p-3 p-md-4">
                    <div class="row g-3 align-items-end">

                        <div class="col-12 col-md-3">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="filtro-role" style="letter-spacing: 0.5px;">
                                <i class="fas fa-filter me-1 opacity-50"></i> Filtrar por Função
                            </label>
                            <select id="filtro-role" class="form-select" placeholder="Todos...">
                                <option value="">Todos</option>
                                <option value="STUDENT">Catequizandos</option>
                                <option value="CATECHIST">Catequistas</option>
                                <option value="PRIEST">Clero</option>
                                <option value="PARENT">Responsáveis</option>
                            </select>
                        </div>

                        <div class="col-12 col-md-5">
                            <label class="form-label small fw-bold text-uppercase text-muted mb-2" for="busca-texto" style="letter-spacing: 0.5px;">
                                <i class="fas fa-search me-1 opacity-50"></i> Buscar
                            </label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Nome, CPF ou Email...">
                        </div>

                        <div class="col-12 col-md-4 d-grid d-md-block mt-3 mt-md-0">
                            <button class="btn btn-primary fw-bold shadow-sm w-100" style="height: 42px;" onclick="modalPessoa()">
                                <i class="fas fa-user-plus me-2"></i> Nova Pessoa
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            <div class="card list-commanded mb-4 border-0 shadow-sm">
                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-pessoas" style="max-height: 600px;">
                        <div class="text-center py-5"><span class="loader"></span></div>
                    </div>
                    <div class="pagination paginationButtons pagination-pessoas mt-3 text-center justify-content-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalPessoa" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl modal-fullscreen-lg-down">
            <div class="modal-content border-0 shadow-lg">

                <div class="modal-header bg-primary text-white rounded-top-md">
                    <h5 class="modal-title fs-5" id="modalPessoaLabel">Cadastro de Pessoa</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>

                <div class="tabs-scroll-wrapper pt-3 z-2 shadow-sm">
                    <ul class="nav nav-tabs mb-2" id="pessoaTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab"><i class="fas fa-id-card"></i> Pessoal</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="contato-tab" data-bs-toggle="tab" data-bs-target="#tab-contato" type="button" role="tab"><i class="fas fa-map-marker-alt"></i> Contato</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="vinculos-tab" data-bs-toggle="tab" data-bs-target="#tab-vinculos" type="button" role="tab"><i class="fas fa-users-cog"></i> Vínculos</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="familia-tab" data-bs-toggle="tab" data-bs-target="#tab-familia" type="button" role="tab"><i class="fas fa-home"></i> Família</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="sacra-tab" data-bs-toggle="tab" data-bs-target="#tab-sacramentos" type="button" role="tab"><i class="fas fa-church"></i> Sacramentos</button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="anexos-tab" data-bs-toggle="tab" data-bs-target="#tab-anexos" type="button" role="tab"><i class="fas fa-paperclip"></i> Arquivos</button>
                        </li>
                    </ul>
                    <div class="tabs-scroll-hint"><i class="fas fa-chevron-right"></i></div>
                </div>

                <div class="modal-body modal-body-scrollable">
                    <input type="hidden" id="person_id" value="" />

                    <div class="tab-content" id="pessoaTabContent">

                        <div class="tab-pane fade show active" id="tab-dados" role="tabpanel">
                            <div class="card border-0 shadow-sm">
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-3 text-center mb-3">
                                            <label class="form-label fw-bold">Foto de Perfil</label>
                                            <div id="image-upload-container" class="border border-2 border-dashed p-2 rounded bg-light" style="cursor: pointer; height: 180px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative">
                                                <div id="placeholder-foto">
                                                    <i class="fas fa-camera fa-3x text-muted opacity-50"></i>
                                                    <p class="text-muted small mt-2 mb-0">Clique para foto</p>
                                                </div>
                                                <img id="img-preview" src="" class="img-fluid w-100 h-100 object-fit-cover" style="display: none;" />
                                                <input type="file" id="person_photo" class="d-none" accept="image/*" />
                                            </div>
                                            <button type="button" class="btn btn-sm btn-outline-danger mt-2 w-100 d-none" id="btn-remove-foto" onclick="removeFoto()"><i class="fas fa-trash mr-1"></i> Remover</button>
                                        </div>
                                        <div class="col-md-9">
                                            <div class="row g-3">
                                                <div class="col-md-8">
                                                    <label class="form-label">Nome Completo <span class="text-danger">*</span></label>
                                                    <input type="text" id="full_name" class="form-control" />
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label">Nome Social / Religioso</label>
                                                    <input type="text" id="religious_name" class="form-control" />
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label">Data de Nascimento</label>
                                                    <input type="date" id="birth_date" class="form-control" />
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label">CPF</label>
                                                    <input type="text" id="tax_id" class="form-control mask-cpf" maxlength="14" />
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label">Gênero</label>
                                                    <select id="gender" class="form-select">
                                                        <option value="M">Masculino</option>
                                                        <option value="F">Feminino</option>
                                                    </select>
                                                </div>
                                                <div class="col-md-4">
                                                    <label class="form-label">RG (Opcional)</label>
                                                    <input type="text" id="national_id" class="form-control" />
                                                </div>
                                                <div class="col-md-12">
                                                    <div class="form-check form-switch mt-2">
                                                        <input class="form-check-input" type="checkbox" id="is_pcd" />
                                                        <label class="form-check-label ms-2 fw-bold text-primary" for="is_pcd">Pessoa com Deficiência (PCD)</label>
                                                    </div>
                                                    <input type="text" id="pcd_details" class="form-control mt-2 d-none" placeholder="Descreva a necessidade (Ex: Cadeirante)..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-contato" role="tabpanel">
                            <div class="card border-0 shadow-sm mb-3">
                                <div class="card-body">
                                    <h6 class="txt-theme border-bottom pb-2 mb-3 fw-bold">Contatos</h6>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <label class="form-label">WhatsApp/Celular</label>
                                            <input type="text" id="phone_mobile" class="form-control mask-phone" maxlength="15" />
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Telefone Fixo</label>
                                            <input type="text" id="phone_landline" class="form-control mask-phone" maxlength="15" />
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">E-mail</label>
                                            <input type="email" id="email" class="form-control" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 shadow-sm">
                                <div class="card-body">
                                    <h6 class="txt-theme border-bottom pb-2 mb-3 fw-bold">Endereço</h6>
                                    <div class="row g-3">
                                        <div class="col-md-3">
                                            <label class="form-label">CEP</label>
                                            <div class="input-group">
                                                <input type="text" id="zip_code" class="form-control mask-cep" onblur="buscarCep(this.value)" maxlength="9" />
                                                <span class="input-group-text bg-white"><i class="fas fa-search text-muted"></i></span>
                                            </div>
                                        </div>
                                        <div class="col-md-7">
                                            <label class="form-label">Logradouro</label>
                                            <input type="text" id="address_street" class="form-control" />
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label">Número</label>
                                            <input type="text" id="address_number" class="form-control" />
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label">Bairro</label>
                                            <input type="text" id="address_district" class="form-control" />
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label">Cidade</label>
                                            <input type="text" id="address_city" class="form-control" />
                                        </div>
                                        <div class="col-md-2">
                                            <label class="form-label">UF</label>
                                            <input type="text" id="address_state" class="form-control" maxlength="2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-vinculos" role="tabpanel">
                            <div class="alert alert-primary bg-primary bg-opacity-10 border-0 mb-4">
                                <i class="fas fa-info-circle me-2"></i> Selecione os papéis que esta pessoa exerce na paróquia.
                            </div>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm cursor-pointer border-start border-4 border-primary" onclick="$('#role_student').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3"><input class="form-check-input fs-5" type="checkbox" id="role_student" onclick="event.stopPropagation()" /></div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-primary">Catequizando (Aluno)</h6><small class="text-muted lh-1">Habilita matrícula e histórico.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm cursor-pointer border-start border-4 border-warning" onclick="$('#role_catechist').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3"><input class="form-check-input fs-5" type="checkbox" id="role_catechist" onclick="event.stopPropagation()" /></div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-warning">Catequista (Professor)</h6><small class="text-muted lh-1">Acesso aos diários de classe.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm cursor-pointer border-start border-4 border-success" onclick="$('#role_parent').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3"><input class="form-check-input fs-5" type="checkbox" id="role_parent" onclick="event.stopPropagation()" /></div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-success">Responsável / Pai</h6><small class="text-muted lh-1">Vínculo financeiro e autorizações.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-0 shadow-sm cursor-pointer border-start border-4 border-dark" onclick="$('#role_priest').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3"><input class="form-check-input fs-5" type="checkbox" id="role_priest" onclick="event.stopPropagation()" /></div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-dark">Clero (Padre/Diácono)</h6><small class="text-muted lh-1">Funções litúrgicas e agenda.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-familia" role="tabpanel">
                            <div class="card border-0 shadow-sm mb-3">
                                <div class="card-body">
                                    <label class="form-label fw-bold">Buscar e Vincular Parente:</label>
                                    <select id="search_relative" class="form-control" placeholder="Digite o nome do pai, mãe..."></select>
                                </div>
                            </div>
                            <div class="card border-0 shadow-sm">
                                <div class="card-body p-0">
                                    <div class="table-responsive">
                                        <table class="table table-hover align-middle mb-0">
                                            <thead class="table-light">
                                                <tr>
                                                    <th class="ps-3">Nome</th>
                                                    <th>Vínculo</th>
                                                    <th class="text-center">Permissões</th>
                                                    <th class="text-end pe-3">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody id="lista-familia">
                                                <tr>
                                                    <td colspan="4" class="text-center text-muted py-4">Nenhum familiar vinculado.</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-sacramentos" role="tabpanel">
                            <div class="card border-0 shadow-sm">
                                <div class="card-body">
                                    <h6 class="txt-theme border-bottom pb-2 mb-3 fw-bold">Situação Canônica Atual</h6>

                                    <div class="mb-4">
                                        <div class="form-check form-switch fs-6 mb-2">
                                            <input class="form-check-input" type="checkbox" id="has_baptism" />
                                            <label class="form-check-label fw-bold" for="has_baptism">Batizado na Igreja Católica</label>
                                        </div>
                                        <div id="baptism_details" class="ms-md-5 ms-3 ps-3 border-start border-2 border-primary d-none">
                                            <div class="row g-2">
                                                <div class="col-md-7"><input type="text" class="form-control" id="baptism_place" placeholder="Paróquia do Batismo" /></div>
                                                <div class="col-md-5"><input type="date" class="form-control" id="baptism_date" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-4">
                                        <div class="form-check form-switch fs-6 mb-2">
                                            <input class="form-check-input" type="checkbox" id="has_eucharist" />
                                            <label class="form-check-label fw-bold" for="has_eucharist">Recebeu Primeira Eucaristia</label>
                                        </div>
                                        <div id="eucharist_details" class="ms-md-5 ms-3 ps-3 border-start border-2 border-warning d-none">
                                            <div class="row g-2">
                                                <div class="col-md-7"><input type="text" class="form-control" id="eucharist_place" placeholder="Paróquia da Eucaristia" /></div>
                                                <div class="col-md-5"><input type="date" class="form-control" id="eucharist_date" /></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-check form-switch fs-6 mb-3">
                                        <input class="form-check-input" type="checkbox" id="has_confirmation" />
                                        <label class="form-check-label" for="has_confirmation">Crismado</label>
                                    </div>
                                    <div class="form-check form-switch fs-6">
                                        <input class="form-check-input" type="checkbox" id="has_marriage" />
                                        <label class="form-check-label" for="has_marriage">Casado na Igreja (Matrimônio)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade disabled" id="tab-anexos" role="tabpanel">
                            <div class="card border-0 shadow-sm bg-primary bg-opacity-10 mb-4">
                                <div class="card-body">
                                    <div class="row g-3 align-items-end">
                                        <div class="col-md-5">
                                            <label class="form-label small fw-bold">DESCRIÇÃO DO DOC <span class="text-danger">*</span></label>
                                            <input type="text" id="new_attachment_desc" class="form-control bg-white" placeholder="Ex: Certidão de Batismo..." />
                                        </div>
                                        <div class="col-md-5">
                                            <label class="form-label small fw-bold">ARQUIVO <span class="text-danger">*</span></label>
                                            <input type="file" id="new_attachment_file" class="form-control bg-white" accept=".pdf, .jpg, .jpeg, .png, .doc, .docx" />
                                        </div>
                                        <div class="col-md-2 text-md-end">
                                            <button class="btn btn-primary w-100 fw-bold shadow-sm" id="btn-add-attachment" onclick="uploadAttachment()">
                                                <i class="fas fa-upload me-2"></i> Enviar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="card border-0 shadow-sm">
                                <div class="card-body p-0">
                                    <div id="lista-anexos">
                                        <div class="text-center py-5 text-muted"><i class="fas fa-folder-open fa-3x mb-2 opacity-50"></i>
                                            <p>Nenhum documento anexado.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div class="modal-footer bg-white border-top shadow-sm z-2">
                    <button type="button" class="btn btn-light border fw-medium" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary fw-bold px-4 btn-save-person" onclick="salvarPessoa()">
                        <i class="fas fa-save me-2"></i> Salvar Cadastro
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