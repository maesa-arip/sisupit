import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function flashMessage(params) {
	return params.props.flash_message;
}

// URL basemap Leaflet terpusat. SEMUA peta membaca dari sini. Nilainya di-inject RUNTIME dari
// server (config services.map.tile_url → window.MAP_TILE_URL di app.blade.php), jadi bisa
// dialihkan ke tile server sendiri cukup dengan 1 env var (MAP_TILE_URL) TANPA rebuild —
// pola sama seperti NOMINATIM_BASE_URL/OSRM_BASE_URL. Fallback ke basemap CARTO Voyager
// (turunan OpenStreetMap, di-host CARTO) bila env belum di-set. Untuk self-host penuh lihat
// docker/ (pola Nominatim/OSRM) — mis. TileServer-GL/OpenMapTiles.
const CARTO_VOYAGER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const MAP_TILE_URL = (typeof window !== 'undefined' && window.MAP_TILE_URL) || CARTO_VOYAGER;

// Opsi navigator.geolocation bersama. Default browser (timeout: Infinity, maximumAge: 0)
// membuat request bisa menggantung selamanya, dan maximumAge:0 melarang pakai fix terbaru
// sehingga selalu menunggu cold fix GPS. Preset di bawah memberi timeout tegas + mengizinkan
// reuse fix yang baru agar deteksi lebih cepat dan tidak sering gagal (terutama di WebView).
export const GEO_OPTIONS = {
	// Deteksi sekali (cari aset terdekat, lengkapi profil):
	// akurat, boleh pakai fix <= 30 dtk terakhir, beri 20 dtk untuk cold fix.
	oneShot: { enableHighAccuracy: true, timeout: 20000, maximumAge: 30000 },
	// Pelacakan live (watchPosition responder): tetap akurat & cukup segar, timeout longgar.
	tracking: { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
	// Lapor darurat langkah-1: butuh fix PALING segar (maximumAge:0, tanpa cache basi)
	// dengan GPS akurasi tinggi. Timeout dipendekkan agar cepat jatuh ke fallback.
	fresh: { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
	// Lapor darurat langkah-2 (fallback): jika GPS akurat gagal/timeout, pakai lokasi
	// jaringan (WiFi/IP) sekali. Lebih cepat & jarang gagal, walau kurang presisi.
	lowAccuracy: { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
};

// Ambang akurasi (meter). Fix dengan akurasi di atas ini kemungkinan berbasis
// jaringan/IP (bisa meleset puluhan km — gejala "lokasi lari ke kota lain"), jadi
// tidak boleh dipakai untuk auto-isi yurisdiksi; user diminta menggeser pin manual.
export const GEO_ACCURACY_THRESHOLD = 1000;

// Pusat peta default (Denpasar, Bali) — dipakai sebagai titik awal pin yang bisa
// digeser saat deteksi lokasi gagal total. Selaras dengan setView UserLeafletMap.
export const DEFAULT_MAP_CENTER = { lat: -8.65, lng: 115.22 };

// Waktu relatif singkat berbahasa Indonesia ("3 menit lalu") untuk kartu triase admin —
// menonjolkan umur laporan agar operator cepat menilai urgensi.
export function timeAgo(value) {
	if (!value) return '-';
	const then = new Date(value).getTime();
	if (isNaN(then)) return '-';
	const diff = Math.max(0, Date.now() - then);
	const menit = Math.floor(diff / 60000);
	if (menit < 1) return 'Baru saja';
	if (menit < 60) return `${menit} menit lalu`;
	const jam = Math.floor(menit / 60);
	if (jam < 24) return `${jam} jam lalu`;
	const hari = Math.floor(jam / 24);
	if (hari < 7) return `${hari} hari lalu`;
	return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Nomor laporan yang bisa dibacakan warga ke Damkar. Sumber kebenaran tunggal untuk
// formatnya (mula-mula dihitung inline di halaman Thanks) → dipakai konsisten di detail,
// antrean admin, dan dasbor petugas. Murni turunan dari id + tahun created_at (tak disimpan).
export function reportNumber(report) {
	if (!report?.id) return '-';
	const year = report.created_at ? new Date(report.created_at).getFullYear() : new Date().getFullYear();
	return `LP-${year}-${String(report.id).padStart(5, '0')}`;
}

// Ambil satu fix GPS untuk lapor darurat: coba akurat & segar dulu; jika gagal atau
// timeout, jatuh SEKALI ke mode akurasi-rendah (jaringan) sebelum menyerah. Mengembalikan
// Promise<GeolocationPosition>. Mempercepat fix pertama (mis. cold start di WebView).
export const getFreshPosition = () =>
	new Promise((resolve, reject) => {
		if (!navigator.geolocation) {
			reject(new Error('geolocation-unsupported'));
			return;
		}
		navigator.geolocation.getCurrentPosition(
			resolve,
			() => navigator.geolocation.getCurrentPosition(resolve, reject, GEO_OPTIONS.lowAccuracy),
			GEO_OPTIONS.fresh,
		);
	});

export const messages = {
	503: {
		title: 'Service Unavailable',
		description: 'Sorry, we are doing some maintenance. Please check back soon',
		status: '503,',
	},
	500: {
		title: 'Server Error',
		description: 'Oops, something when wrong on our servers',
		status: '500,',
	},
	404: {
		title: 'Not Found',
		description: 'Sorry, the page you are looking for could not be found',
		status: '404,',
	},
	403: {
		title: 'Forbidden',
		description: 'Sorry, you are forbidden from accessing this page',
		status: '403,',
	},
	401: {
		title: 'Unauthorized',
		description: 'Sorry, you are unauthorized to  access this page',
		status: '401,',
	},
	429: {
		title: 'Too Many Request',
		description: 'Please try again in just a second',
		status: '429,',
	},
};
