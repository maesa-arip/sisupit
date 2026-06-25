import Echo from 'laravel-echo';

import Pusher from 'pusher-js';
window.Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

// Tanpa key, `new Echo(...)` melempar "You must pass your app key" saat modul
// di-load → seluruh aplikasi blank. Degradasi mulus: kalau VITE_REVERB_APP_KEY
// belum di-set saat build, lewati Echo (fitur realtime nonaktif). Semua pemakai
// window.Echo sudah dijaga dengan `if (window.Echo)`.
if (reverbKey) {
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: import.meta.env.VITE_REVERB_HOST,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
    });
} else {
    console.warn(
        '[echo] VITE_REVERB_APP_KEY tidak di-set saat build — fitur realtime (Reverb) ' +
            'dinonaktifkan. Set VITE_REVERB_* di .env lalu jalankan `npm run build` ulang.',
    );
}
