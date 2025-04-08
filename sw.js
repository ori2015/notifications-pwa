self.addEventListener('install', event => {
    console.log('Service Worker מותקן');
});

self.addEventListener('activate', event => {
    console.log('Service Worker פעיל');
});

self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: 'icon.png',
        badge: 'icon.png'
    };

    event.waitUntil(
        self.registration.showNotification('התראה חדשה', options)
    );
}); 