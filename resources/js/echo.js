import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

// Konfigurasi Reverb dibaca RUNTIME dari window.REVERB_CONFIG yang di-inject server di
// app.blade.php (pola sama dengan MAP_TILE_URL), BUKAN dari import.meta.env saat build.
// Sebelumnya nilai VITE_REVERB_* dipaku ke bundel saat `npm run build`, dengan dua akibat:
// (1) sekali build dijalankan tanpa env tersebut — mis. dari git worktree yang tak punya
// `.env` — blok `new Echo(...)` hilang sebagai kode mati dan window.Echo TIDAK PERNAH ada,
// gagal tanpa gejala di semua environment; (2) host-nya terpaku satu domain sehingga
// staging/dev menyambung ke Reverb produksi. Keduanya = FINDINGS #58.
const reverb = (typeof window !== 'undefined' && window.REVERB_CONFIG) || {};

// Tanpa key, `new Echo(...)` melempar "You must pass your app key" saat modul
// di-load → seluruh aplikasi blank. Degradasi mulus: kalau REVERB_APP_KEY belum
// di-set di server, lewati Echo (fitur realtime nonaktif). Semua pemakai
// window.Echo sudah dijaga dengan `if (window.Echo)`.
if (reverb.key) {
	window.Echo = new Echo({
		broadcaster: 'reverb',
		key: reverb.key,
		wsHost: reverb.host,
		wsPort: reverb.port ?? 80,
		wssPort: reverb.port ?? 443,
		forceTLS: (reverb.scheme ?? 'https') === 'https',
		enabledTransports: ['ws', 'wss'],
	});
} else {
	console.warn(
		'[echo] REVERB_APP_KEY tidak di-set di server - fitur realtime (Reverb) dinonaktifkan. ' +
			'Set REVERB_APP_KEY/REVERB_HOST/REVERB_PORT/REVERB_SCHEME di .env server; ' +
			'TIDAK perlu rebuild frontend, nilainya dibaca runtime.',
	);
}
