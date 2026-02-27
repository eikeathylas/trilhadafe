// =========================================================
// MOTOR DE NOTIFICAÇÕES E WEB PUSH (TRILHA DA FÉ)
// =========================================================

const publicVapidKey = "BOdx7BJ0sEDIqtDjKmwHD0r6LX7edbehBLgE0vxVRr20qjBF2PH5mWeWXuDFBd43t_nFjoGX0h4AHucG5psDKXE";
let swRegistration = null;
let notificationInterval = null;

$(document).ready(async () => {
    // 1. Registro do Service Worker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            swRegistration = await navigator.serviceWorker.register('./assets/js/sw.js');
            checkSubscriptionStatus();
        } catch (error) {
            console.error('Erro no Service Worker:', error);
        }
    } else {
        $("#togglePushNotifications").prop("disabled", true);
        $("#push-status-text").text("Navegador não suportado.");
    }

    // 2. Ouvinte do Toggle Push
    $("#togglePushNotifications").on("change", async function () {
        const isChecked = $(this).is(":checked");
        $(this).prop("disabled", true);
        if (isChecked) await subscribeUser();
        else await unsubscribeUser();
    });

    // 3. Inicialização de dados
    window.loadNotifications();
    window.startNotificationPolling();
});

// =========================================================
// GESTÃO DE PUSH (ASSINATURAS)
// =========================================================

const checkSubscriptionStatus = async () => {
    if (!swRegistration) return;
    const subscription = await swRegistration.pushManager.getSubscription();
    if (Notification.permission === 'denied') {
        $("#togglePushNotifications").prop("checked", false).prop("disabled", true);
        $("#push-status-text").text("Bloqueado no navegador.");
    } else if (subscription) {
        $("#togglePushNotifications").prop("checked", true);
        $("#push-status-text").text("Ativo neste dispositivo.");
    } else {
        $("#togglePushNotifications").prop("checked", false);
        $("#push-status-text").text("Ative para receber alertas.");
    }
};

const subscribeUser = async () => {
    try {
        const applicationServerKey = urlB64ToUint8Array(publicVapidKey);
        const subscription = await swRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey
        });

        await window.ajaxValidator({
            validator: 'savePushSubscription',
            token: defaultApp.userInfo.token,
            subscription: JSON.stringify(subscription),
            userAgent: navigator.userAgent
        });

        $("#push-status-text").text("Ativo neste dispositivo.");
        $("#togglePushNotifications").prop("disabled", false);
        if (window.alertDefault) window.alertDefault("Notificações ativadas!", "success");

    } catch (err) {
        console.error('Falha ao assinar push:', err);
        $("#togglePushNotifications").prop("checked", false).prop("disabled", false);
    }
};

const unsubscribeUser = async () => {
    try {
        const subscription = await swRegistration.pushManager.getSubscription();
        if (subscription) {
            await window.ajaxValidator({
                validator: 'removePushSubscription',
                token: defaultApp.userInfo.token,
                endpoint: subscription.endpoint
            });
            await subscription.unsubscribe();
        }
        $("#push-status-text").text("Ative para receber alertas.");
        $("#togglePushNotifications").prop("disabled", false);
    } catch (error) {
        console.error('Erro ao cancelar:', error);
        $("#togglePushNotifications").prop("disabled", false);
    }
};

// =========================================================
// UI E RENDERIZAÇÃO (SEM TAG <a> PARA EVITAR HOVER BRANCO)
// =========================================================

window.loadNotifications = async () => {
    try {
        const result = await window.ajaxValidator({
            validator: 'getNotifications',
            token: defaultApp.userInfo.token,
            role: defaultApp.userInfo.office,
            org_id: localStorage.getItem("tf_active_parish")
        });

        if (result.status) {
            window.renderNotifications(result.data);
        }
    } catch (e) {
        console.error("Erro ao carregar notificações", e);
    }
};

window.renderNotifications = (data) => {
    const list = $("#notifications-list");
    const footer = $(".offcanvas-footer");
    list.empty();
    let unreadCount = 0;

    if (!data || data.length === 0) {
        list.html(`<div class="text-center p-5 opacity-50"><span class="material-symbols-outlined" style="font-size: 40px;">notifications_paused</span><p class="mt-2 text-muted small">Tudo limpo por aqui.</p></div>`);
        footer.addClass('d-none');
    } else {
        footer.removeClass('d-none');
        data.forEach(notif => {
            if (!notif.read_at) unreadCount++;

            const isUnreadClass = !notif.read_at ? 'unread bg-primary bg-opacity-10' : '';
            const iconColor = notif.type === 'SUCCESS' ? 'text-success' : (notif.type === 'DANGER' ? 'text-danger' : 'text-primary');
            const icon = notif.type === 'SUCCESS' ? 'check_circle' : (notif.type === 'DANGER' ? 'error' : 'info');

            list.append(`
                <div class="list-group-item ${isUnreadClass}" id="notif-item-${notif.notification_id}">
                    <button class="btn-delete-notification" onclick="window.deleteNotification(${notif.notification_id}, event)">
                        <span class="material-symbols-outlined" style="font-size: 18px;">close</span>
                    </button>

                    <div class="pe-2">
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <h6 class="mb-0 fw-bold d-flex align-items-center" style="font-size: 0.85rem;">
                                <span class="material-symbols-outlined me-2 ${iconColor}" style="font-size: 18px;">${icon}</span>
                                ${notif.title}
                            </h6>
                        </div>
                        <p class="mb-2 small ms-4" style="line-height: 1.3;">
                            ${notif.message}
                        </p>
                        <div class="d-flex align-items-center justify-content-between ms-4">
                            <button class="btn btn-sm btn-outline-primary btn-notif-action px-3" onclick="window.notifAction('${notif.action_url}', ${notif.notification_id})" style="font-size: 0.7rem; border-radius: 20px;">
                                Ver detalhes
                            </button>
                            <small class=" style="font-size: 0.65rem;">${notif.time_ago}</small>
                        </div>
                    </div>
                </div>
            `);
        });
    }
    window.updateBadge(unreadCount);
};

// =========================================================
// AÇÕES DE NOTIFICAÇÃO
// =========================================================

window.notifAction = async (url, id) => {
    try {
        await window.ajaxValidator({
            validator: 'markRead',
            token: defaultApp.userInfo.token,
            id: id
        });
        if (url && url !== '#') window.location.href = url;
        else window.loadNotifications();
    } catch (e) { console.error(e); }
};

window.deleteNotification = async (id, event) => {
    if (event) event.stopPropagation();
    try {
        const res = await window.ajaxValidator({
            validator: 'deleteNotification',
            token: defaultApp.userInfo.token,
            id: id
        });
        if (res.status) {
            $(`#notif-item-${id}`).slideUp(200, function () {
                $(this).remove();
                if ($("#notifications-list").children().length === 0) window.loadNotifications();
            });
        }
    } catch (e) { console.error(e); }
};

window.markAllAsRead = async () => {
    await window.ajaxValidator({
        validator: 'markRead', // Reaproveita lógica de marcar como lida no bulk
        token: defaultApp.userInfo.token,
        role: defaultApp.userInfo.office,
        org_id: localStorage.getItem("tf_active_parish"),
        bulk: true
    });
    window.loadNotifications();
};

window.clearAllNotifications = () => {
    Swal.fire({
        title: "Limpar notificações?",
        text: "Isso removerá todos os alertas da sua visualização.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#5C8EF1",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, limpar tudo",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await window.ajaxValidator({
                    validator: 'clearNotifications',
                    token: defaultApp.userInfo.token,
                    org_id: localStorage.getItem("tf_active_parish"),
                    role: defaultApp.userInfo.office
                });
                if (res.status) {
                    window.loadNotifications();
                    Swal.fire("Concluído!", "Notificações removidas.", "success");
                }
            } catch (e) { console.error(e); }
        }
    });
};

window.updateBadge = (count) => {
    const badges = $("#desk-notif-badge, #mob-notif-badge");
    if (count > 0) {
        badges.removeClass("d-none").text(count > 9 ? '9+' : count);
    } else {
        badges.addClass("d-none");
    }
};

// =========================================================
// HELPERS E POLLING
// =========================================================

function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

window.startNotificationPolling = () => {
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        if (!document.hidden) window.loadNotifications();
    }, 25000);
};

window.stopNotificationPolling = () => {
    if (notificationInterval) {
        clearInterval(notificationInterval);
        notificationInterval = null;
    }
};