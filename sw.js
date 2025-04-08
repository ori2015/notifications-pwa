self.addEventListener('install', event => {
    console.log('Service Worker מותקן');
});

self.addEventListener('activate', event => {
    console.log('Service Worker פעיל');
});

self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
        body: data.body || 'הודעה חדשה',
        icon: './apple-touch-icon.png',
        badge: './apple-touch-icon.png',
        data: data.url,
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'התראה חדשה', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.notification.data) {
        event.waitUntil(
            clients.openWindow(event.notification.data)
        );
    }
}); 