import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Leaflet dari bundel sendiri, bukan unpkg.com. Dulu dimuat sebagai <script defer> pihak ketiga
 * SESUDAH bundel Vite di app.blade.php: skrip defer & module dijalankan berurutan, jadi pada
 * kunjungan pertama koneksi baru ke unpkg (DNS+TLS ~0,2 dtk) + unduhannya (~1 dtk di 4G) ikut
 * menahan seluruh aplikasi, dan peta baru mulai meminta tile di detik ~2,7. Diimpor di
 * app.jsx secara statis (hanya klien - Leaflet menyentuh window saat diimpor, jangan dari ssr.jsx).
 *
 * window.L tetap diisi karena semua peta memakai window.L langsung (lihat CONVENTIONS).
 */
L.Control.Zoom.mergeOptions({ zoomInTitle: 'Perbesar', zoomOutTitle: 'Perkecil' });

window.L = L;

export default L;
