// =========================================================
// SERVICE WORKER - TRILHA DA FÉ
// Escuta eventos de Push mesmo com o sistema fechado
// =========================================================

// 1. FORÇA A INSTALAÇÃO IMEDIATA
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Instalando...');
    self.skipWaiting();
});

// 2. ASSUME O CONTROLE DA PÁGINA IMEDIATAMENTE
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Ativado e controlando clientes.');
    event.waitUntil(self.clients.claim());
});

// 3. RECEPÇÃO DA MENSAGEM DO BACKEND
self.addEventListener('push', function (event) {
    let data = {};

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: "Trilha da Fé", message: event.data.text() };
        }
    } else {
        data = { title: "Nova Notificação", message: "Você tem um novo aviso no sistema." };
    }

    const options = {
        body: data.message,
        icon: '../login/assets/img/favicon.png', // Corrigido para garantir que ache a logo
        badge: '../login/assets/img/favicon.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        data: {
            url: data.action_url || './dashboard.php'
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// 4. AÇÃO AO CLICAR NA NOTIFICAÇÃO DO CELULAR/WINDOWS
self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});