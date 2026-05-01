self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/icon.png', // Ganti dengan path ikon Anda
    badge: '/badge.png', // Ikon kecil untuk status bar Android
    vibrate: [200, 100, 200], // Pola getar
    data: {
      url: data.url || '/dashboard' // URL untuk dibuka saat notifikasi diklik
    }
  };

  // --- BEST PRACTICE: Mainkan suara langsung di Service Worker ---

  // 1. Buat promise untuk menampilkan notifikasi
  const showNotificationPromise = self.registration.showNotification(data.title, options);

  // 2. Buat promise untuk memainkan suara
  const playSoundPromise = () => {
    const audio = new Audio('/sounds/alert.mp3'); // PASTIKAN PATH INI BENAR
    return audio.play().catch(error => {
      // Tangani error jika audio gagal diputar (misal: browser block autoplay)
      console.warn('[Service Worker] Gagal memutar suara notifikasi:', error);
    });
  };

  // 3. Gunakan event.waitUntil() untuk memastikan KEDUA proses selesai
  event.waitUntil(
    Promise.all([
      showNotificationPromise,
      playSoundPromise()
    ])
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const redirectUrl = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(redirectUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(redirectUrl + '?refresh=1');
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
