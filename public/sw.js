// KILL-SWITCH — PWA/Service Worker Sisupit sudah DIHAPUS.
//
// File ini sengaja dibiarkan (bukan dihapus) supaya browser/HP pengguna lama yang
// masih punya service worker terdaftar akan mengambil versi ini saat update berkala,
// lalu service worker mencabut diri sendiri + membersihkan cache. Setelah beberapa
// minggu (saat dipastikan tidak ada lagi klien lama), file ini boleh dihapus permanen.
//
// Notifikasi sekarang sepenuhnya lewat FCM (aplikasi native Android), bukan WebPush.

self.addEventListener('install', () => {
  // Aktif secepatnya tanpa menunggu.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Bersihkan semua cache milik service worker lama.
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch (e) {
        // abaikan
      }
      // Cabut pendaftaran service worker ini.
      await self.registration.unregister();
      // Reload semua tab yang dikontrol agar lepas dari service worker.
      const clientsList = await self.clients.matchAll({ type: 'window' });
      clientsList.forEach((client) => client.navigate(client.url));
    })(),
  );
});
