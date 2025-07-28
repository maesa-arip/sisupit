self.addEventListener('push', function (event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icon.png',
        data: {
            url: data.url // agar bisa redirect saat klik notifikasi
        }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.notification.data && event.notification.data.url) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
self.addEventListener('install', event => {
  console.log('Service Worker: Installed');
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activated');
  return self.clients.claim(); // optional
});

self.addEventListener('fetch', event => {
  // Just pass through for now
  // This will make "Fetch handler existence" become EXISTS
  event.respondWith(fetch(event.request));
});
