<div class="modal fade" id="modalAudit" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header text-white">
                <h5 class="modal-title fs-5">
                    <i class="fas fa-bolt text-warning mr-2"></i> Histórico de Alterações
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body bg-light">
                <div class="timeline-audit" id="audit-timeline-container">
                </div>
            </div>

            <div class="modal-footer d-flex justify-content-between">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i> O sistema registra automaticamente quem alterou e o que mudou.
                </small>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
            </div>
        </div>
    </div>
</div>