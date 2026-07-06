import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export function flashMessage(params) {
	return params.props.flash_message;
}

// URL basemap Leaflet terpusat. SEMUA peta membaca dari sini agar bisa dialihkan ke tile
// server sendiri cukup dari satu tempat (lalu `npm run build`). Kini memakai basemap CARTO
// Voyager (turunan OpenStreetMap, di-host CARTO). Untuk self-host lihat docker/ (pola serupa
// Nominatim/OSRM) — mis. TileServer-GL/OpenMapTiles — lalu ganti nilai ini ke URL lokal.
export const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

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
