<div class="modal fade modal-fullscreen-native no-print" id="modalAudit" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content shadow-lg">
            <div class="modal-header border-0 bg-secondary bg-opacity-75 px-4">
                <h6 class="modal-title fs-5 fw-bold text-white d-flex align-items-center mb-0">
                    <i class="fas fa-history me-3 opacity-75"></i> Histórico de Alterações
                </h6>
                <button type="button" class="btn-close btn-close-white shadow-none" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-3 p-md-4">
                <div class="alert bg-primary bg-opacity-10 text-primary border-0 rounded-4 d-flex align-items-center mb-4 shadow-sm p-3">
                    <i class="fas fa-shield-alt fs-4 me-3 flex-shrink-0"></i>
                    <div class="small fw-medium">O sistema regista automaticamente quem alterou, o que mudou e quando. Pode expandir os detalhes para ver o "Antes e Depois" ou reverter uma alteração.</div>
                </div>
                <div class="timeline-audit d-flex flex-column gap-3" id="audit-timeline-container" style="padding-right: 5px;"></div>
            </div>
            <div class="modal-footer border-0 p-3 text-center justify-content-center">
                <button type="button" class="btn btn-light fw-bold px-4 rounded-pill border shadow-sm w-100 w-md-auto hover-scale" data-bs-dismiss="modal" style="height: 38px;">
                    Fechar Auditoria
                </button>
            </div>

        </div>
    </div>
</div>