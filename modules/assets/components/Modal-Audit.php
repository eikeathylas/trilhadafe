<div class="modal fade no-print" id="modalAudit" tabindex="-1" aria-hidden="true" style="z-index: 1060;">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-transparent-card">

            <div class="modal-header border-0 bg-secondary bg-opacity-75 py-3 px-4">
                <h5 class="modal-title fs-5 fw-bold text-white d-flex align-items-center">
                    <i class="fas fa-history me-3 opacity-75"></i> Histórico de Alterações
                </h5>
                <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body p-4 bg-body">

                <div class="alert bg-primary bg-opacity-10 text-primary border-0 rounded-4 d-flex align-items-center mb-4 shadow-sm p-3">
                    <i class="fas fa-shield-alt fs-4 me-3"></i>
                    <div class="small fw-medium">O sistema regista automaticamente quem alterou, o que mudou e quando. Pode expandir os detalhes para ver o "Antes e Depois" ou reverter uma alteração.</div>
                </div>

                <div class="timeline-audit d-flex flex-column gap-3" id="audit-timeline-container" style="padding-right: 5px;">
                </div>

            </div>

            <div class="modal-footer border-0 p-4 pt-0 bg-body text-center justify-content-center">
                <button type="button" class="btn btn-light fw-bold px-5 rounded-3 border shadow-sm" data-bs-dismiss="modal">Fechar Auditoria</button>
            </div>

        </div>
    </div>
</div>