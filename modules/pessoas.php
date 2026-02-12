<!DOCTYPE html>
<html lang="pt-Br">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="shortcut icon" href="../login/assets/img/favicon.png" type="image/x-icon">
    <title>Pessoas - Trilha da Fé</title>

    <?php include "./assets/components/Head.php"; ?>

    <link href="assets/css/card.css?v=<?php echo time(); ?>" rel="stylesheet">
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
                    <li class="breadcrumb-item"><a href="index.php">Painel</a></li>
                    <li class="breadcrumb-item active" aria-current="page">Diretório de Pessoas</li>
                </ol>
            </nav>

            <div class="card list-commanded mb-4">
                <div class="card-header border-bottom-0 bg-transparent px-0 pb-0">
                    <div class="row align-items-end">
                        <div class="col-md-3 mb-3 mb-md-0">
                            <label class="form-label title">Filtrar por Função:</label>
                            <select id="filtro-role" class="form-control" placeholder="Todos...">
                                <option value="">Todos</option>
                                <option value="STUDENT">Catequizandos</option>
                                <option value="CATECHIST">Catequistas</option>
                                <option value="PRIEST">Clero</option>
                                <option value="PARENT">Responsáveis</option>
                            </select>
                        </div>
                        <div class="col-md-5 mb-3 mb-md-0">
                            <label class="form-label title">Buscar:</label>
                            <input type="text" id="busca-texto" class="form-control" placeholder="Nome, CPF ou Email...">
                        </div>
                        <div class="col-md-4 text-end">
                            <button class="btn-filter mt-4" onclick="modalPessoa()">
                                <i class="fas fa-user-plus mr-1"></i> Nova Pessoa
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card-body px-0 pt-4">
                    <div class="table-responsive list-table-pessoas" style="max-height: 600px;">
                    </div>
                    <div class="pagination paginationButtons pagination-pessoas mt-3 text-center"></div>
                </div>
            </div>

            <?php include "./assets/components/Footer.php"; ?>
        </div>
    </div>

    <div class="modal fade" id="modalPessoa" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title fs-5 text-white" id="modalPessoaLabel">Cadastro de Pessoa</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="person_id">

                    <ul class="nav nav-tabs mb-3" id="pessoaTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="dados-tab" data-bs-toggle="tab" data-bs-target="#tab-dados" type="button" role="tab" aria-selected="true">
                                <i class="fas fa-id-card mr-2"></i> Dados Pessoais
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="contato-tab" data-bs-toggle="tab" data-bs-target="#tab-contato" type="button" role="tab" aria-selected="false">
                                <i class="fas fa-map-marker-alt mr-2"></i> Contato & Endereço
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="vinculos-tab" data-bs-toggle="tab" data-bs-target="#tab-vinculos" type="button" role="tab" aria-selected="false">
                                <i class="fas fa-users-cog mr-2"></i> Vínculos (Cargos)
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="familia-tab" data-bs-toggle="tab" data-bs-target="#tab-familia" type="button" role="tab" aria-selected="false">
                                <i class="fas fa-home mr-2"></i> Família
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="sacra-tab" data-bs-toggle="tab" data-bs-target="#tab-sacramentos" type="button" role="tab" aria-selected="false">
                                <i class="fas fa-church mr-2"></i> Sacramentos
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="anexos-tab" data-bs-toggle="tab" data-bs-target="#tab-anexos" type="button" role="tab" aria-selected="false">
                                <i class="fas fa-paperclip mr-2"></i> Documentos
                            </button>
                        </li>
                    </ul>

                    <div class="tab-content pt-3" id="pessoaTabContent">

                        <div class="tab-pane fade show active" id="tab-dados" role="tabpanel">
                            <div class="row">
                                <div class="col-md-3 text-center mb-3">
                                    <label class="form-label fw-bold">Foto de Perfil</label>
                                    <div id="image-upload-container" class="border border-2 border-dashed p-2 rounded bg-light" style="cursor:pointer; height: 200px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                                        <div id="placeholder-foto">
                                            <i class="fas fa-camera fa-3x text-muted opacity-50"></i>
                                            <p class="text-muted small mt-2">Clique para adicionar</p>
                                        </div>
                                        <img id="img-preview" src="" class="img-fluid" style="display:none; width: 100%; height: 100%; object-fit: cover;">
                                        <input type="file" id="person_photo" class="d-none" accept="image/*">
                                    </div>
                                    <button type="button" class="btn btn-sm btn-outline-danger mt-2 w-100 d-none" id="btn-remove-foto" onclick="removeFoto()">
                                        <i class="fas fa-trash mr-1"></i> Remover Foto
                                    </button>
                                </div>

                                <div class="col-md-9">
                                    <div class="row g-3">
                                        <div class="col-md-8">
                                            <label class="form-label">Nome Completo <span class="text-danger">*</span></label>
                                            <input type="text" id="full_name" class="form-control">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Nome Social / Religioso</label>
                                            <input type="text" id="religious_name" class="form-control" placeholder="Ex: Irmã Maria">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Data de Nascimento</label>
                                            <input type="date" id="birth_date" class="form-control">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">CPF</label>
                                            <input type="text" id="tax_id" class="form-control mask-cpf">
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">Gênero</label>
                                            <select id="gender" class="form-control">
                                                <option value="M">Masculino</option>
                                                <option value="F">Feminino</option>
                                            </select>
                                        </div>
                                        <div class="col-md-4">
                                            <label class="form-label">RG (Opcional)</label>
                                            <input type="text" id="national_id" class="form-control">
                                        </div>
                                        <div class="col-md-12">
                                            <div class="card bg-light border-0">
                                                <div class="card-body py-2">
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" id="is_pcd">
                                                        <label class="form-check-label ms-2 fw-bold">Pessoa com Deficiência (PCD)</label>
                                                    </div>
                                                    <input type="text" id="pcd_details" class="form-control mt-2 d-none" placeholder="Descreva a necessidade especial (Ex: Cadeirante, Autismo)...">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-contato" role="tabpanel">
                            <h6 class="txt-theme border-bottom pb-2 mb-3">Contatos</h6>
                            <div class="row g-3 mb-4">
                                <div class="col-md-4">
                                    <label class="form-label">WhatsApp/Celular</label>
                                    <input type="text" id="phone_mobile" class="form-control mask-phone">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">Telefone Fixo</label>
                                    <input type="text" id="phone_landline" class="form-control mask-phone">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label">E-mail</label>
                                    <input type="email" id="email" class="form-control">
                                </div>
                            </div>

                            <h6 class="txt-theme border-bottom pb-2 mb-3">Endereço Residencial</h6>
                            <div class="row g-3">
                                <div class="col-md-3">
                                    <label class="form-label">CEP</label>
                                    <div class="input-group">
                                        <input type="text" id="zip_code" class="form-control mask-cep" onblur="buscarCep(this.value)">
                                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                                    </div>
                                </div>
                                <div class="col-md-7">
                                    <label class="form-label">Logradouro</label>
                                    <input type="text" id="address_street" class="form-control">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Número</label>
                                    <input type="text" id="address_number" class="form-control">
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label">Bairro</label>
                                    <input type="text" id="address_district" class="form-control">
                                </div>
                                <div class="col-md-5">
                                    <label class="form-label">Cidade</label>
                                    <input type="text" id="address_city" class="form-control">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">UF</label>
                                    <input type="text" id="address_state" class="form-control" maxlength="2">
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-vinculos" role="tabpanel">
                            <div class="alert alert-info border-0 shadow-sm mb-4">
                                <i class="fas fa-info-circle me-2"></i> Selecione os papéis que esta pessoa exerce na paróquia. Uma pessoa pode ter múltiplos vínculos.
                            </div>

                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="card h-100 border-primary-hover cursor-pointer" onclick="$('#role_student').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3">
                                                <input class="form-check-input" type="checkbox" id="role_student" onclick="event.stopPropagation()">
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-primary">Catequizando (Aluno)</h6>
                                                <small class="text-muted">Habilita matrícula em turmas e histórico escolar.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-primary-hover cursor-pointer" onclick="$('#role_catechist').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3">
                                                <input class="form-check-input" type="checkbox" id="role_catechist" onclick="event.stopPropagation()">
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-warning">Catequista (Professor)</h6>
                                                <small class="text-muted">Permite acesso aos diários de classe das turmas vinculadas.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-primary-hover cursor-pointer" onclick="$('#role_parent').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3">
                                                <input class="form-check-input" type="checkbox" id="role_parent" onclick="event.stopPropagation()">
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-success">Responsável / Pai</h6>
                                                <small class="text-muted">Para vínculo financeiro e autorizações de catequizando.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="card h-100 border-primary-hover cursor-pointer" onclick="$('#role_priest').click()">
                                        <div class="card-body d-flex align-items-center">
                                            <div class="form-check form-switch me-3">
                                                <input class="form-check-input" type="checkbox" id="role_priest" onclick="event.stopPropagation()">
                                            </div>
                                            <div>
                                                <h6 class="mb-1 fw-bold text-dark">Clero (Padre/Diácono)</h6>
                                                <small class="text-muted">Habilita funções litúrgicas e agenda de missas.</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-familia" role="tabpanel">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <label class="form-label fw-bold">Buscar e Vincular Parente (Já cadastrado):</label>
                                    <select id="search_relative" class="form-control" placeholder="Digite o nome do pai, mãe ou irmão..."></select>
                                </div>
                            </div>

                            <div class="table-responsive">
                                <table class="table table-hover align-middle">
                                    <thead class="table-light">
                                        <tr>
                                            <th>Nome</th>
                                            <th>Vínculo</th>
                                            <th class="text-center">Permissões</th>
                                            <th class="text-center">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-familia">
                                        <tr>
                                            <td colspan="4" class="text-center text-muted py-3">Nenhum familiar vinculado.</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-sacramentos" role="tabpanel">
                            <h6 class="txt-theme border-bottom pb-2 mb-3">Situação Canônica Atual</h6>
                            <div class="row g-3">
                                <div class="col-md-12">

                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="has_baptism">
                                        <label class="form-check-label fw-bold" for="has_baptism">Batizado na Igreja Católica</label>
                                    </div>
                                    <div id="baptism_details" class="ms-4 mb-3 d-none">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <input type="text" class="form-control form-control-sm" id="baptism_place" placeholder="Paróquia do Batismo">
                                            </div>
                                            <div class="col-md-4">
                                                <input type="date" class="form-control form-control-sm" id="baptism_date">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="has_eucharist">
                                        <label class="form-check-label fw-bold" for="has_eucharist">Recebeu Primeira Eucaristia</label>
                                    </div>
                                    <div id="eucharist_details" class="ms-4 mb-3 d-none">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <input type="text" class="form-control form-control-sm" id="eucharist_place" placeholder="Paróquia da Eucaristia">
                                            </div>
                                            <div class="col-md-4">
                                                <input type="date" class="form-control form-control-sm" id="eucharist_date">
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="has_confirmation">
                                        <label class="form-check-label" for="has_confirmation">Crismado</label>
                                    </div>

                                    <div class="form-check mb-2">
                                        <input class="form-check-input" type="checkbox" id="has_marriage">
                                        <label class="form-check-label" for="has_marriage">Casado na Igreja (Matrimônio)</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="tab-pane fade" id="tab-anexos" role="tabpanel">

                            <div class="d-flex flex-wrap align-items-end gap-3 p-3 mb-4 rounded border border-dashed">

                                <div class="flex-grow-1" style="min-width: 250px;">
                                    <label class="form-label small mb-1 opacity-75 fw-bold">DESCRIÇÃO DO DOCUMENTO <span class="text-danger">*</span></label>
                                    <input type="text" id="new_attachment_desc" class="form-control" placeholder="Ex: Certidão de Batismo, RG...">
                                </div>

                                <div class="flex-grow-1" style="min-width: 200px;">
                                    <label class="form-label small mb-1 opacity-75 fw-bold">ARQUIVO <span class="text-danger">*</span></label>
                                    <input type="file" id="new_attachment_file" class="form-control" accept=".pdf, .jpg, .jpeg, .png, .doc, .docx">
                                </div>

                                <div>
                                    <button class="btn btn-success btn-sm px-4 shadow-sm btn-hover-effect" id="btn-add-attachment" onclick="uploadAttachment()">
                                        <i class="fas fa-cloud-upload-alt me-2"></i> Enviar
                                    </button>
                                </div>
                            </div>

                            <div id="lista-anexos" class="table-responsive rounded border">
                                <!-- <table class="table table-hover align-middle mb-0 table-custom">
                                    <thead>
                                        <tr>
                                            <th class="ps-3 py-3 border-0 small opacity-75" style="width: 70px;">TIPO</th>
                                            <th class="py-3 border-0 small opacity-75">DOCUMENTO / ARQUIVO</th>
                                            <th class="text-center py-3 border-0 small opacity-75">DATA ENVIO</th>
                                            <th class="text-end pe-4 py-3 border-0 small opacity-75">AÇÕES</th>
                                        </tr>
                                    </thead>
                                    <tbody id="lista-anexos">
                                        <tr>
                                            <td colspan="4" class="text-center text-muted py-5 opacity-50">
                                                <span class="material-symbols-outlined" style="font-size: 48px;">folder_open</span>
                                                <p class="mt-2 mb-0">Nenhum documento anexado.</p>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table> -->
                            </div>

                        </div>

                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    <button type="button" class="btn btn-theme btn-save-person" onclick="salvarPessoa()">
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