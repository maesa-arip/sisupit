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
    self.registration.showNotification(data.title, options).then(() => {
      // Kirim pesan ke halaman agar bisa memutar suara
      self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(function(clients) {
        for (const client of clients) {
          client.postMessage({
            type: 'PLAY_SOUND',
            soundUrl: '/sounds/alert.mp3',
          });
        }
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
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
