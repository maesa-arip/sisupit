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

// Kata jenis wilayah yang dibuang sebelum membandingkan nama: OSM menulis "Kota Denpasar"
// / "Kecamatan Denpasar Utara", tabel indonesia_* menulis "DENPASAR" / "DENPASAR UTARA".
const REGION_NOISE_WORDS = [
	'provinsi',
	'prov',
	'kota',
	'kabupaten',
	'kab',
	'administrasi',
	'kecamatan',
	'kec',
	'kelurahan',
	'desa',
];

export const normalizeRegionName = (name) => {
	if (!name) return '';
	let clean = String(name).toLowerCase();
	REGION_NOISE_WORDS.forEach((word) => {
		clean = clean.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
	});

	return clean
		.replace(/[^\w\s]/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
};

// Level wilayah dari yang terluas — urutannya menentukan level TERLUAR yang dilaporkan saat
// pin meleset, karena itulah yang paling penting diberitahukan (salah kabupaten jauh lebih
// berbahaya daripada salah desa tetangga).
const JURISDICTION_LEVELS = [
	['city_code', 'city', 'Kabupaten/Kota'],
	['district_code', 'district', 'Kecamatan'],
	['village_code', 'village', 'Desa/Kelurahan'],
];

/**
 * Apakah titik yang baru saja dipilih di peta berada di luar wilayah tugas admin?
 *
 * Form pendataan fasilitas mengunci level wilayah yang sudah jadi wewenang admin dan
 * mengisinya dari akun, BUKAN dari pin — jadi sebelum ini pin bisa digeser melewati batas
 * kota tanpa satu pun tanda, dan asetnya tersimpan seolah masih di wilayah sendiri.
 * Perbandingannya memakai nama wilayah dari reverse-geocode (yang memang sudah diambil untuk
 * auto-isi alamat), jadi tidak ada panggilan jaringan tambahan.
 *
 * Sengaja PERINGATAN, bukan pemblokir: nama OSM tidak selalu selengkap tabel wilayah
 * (kadang hanya nama banjar yang keluar), jadi keputusan akhir tetap di tangan petugas yang
 * berdiri di lokasi. Penjaga kerasnya ada di server (ResolvesFacilityJurisdiction).
 *
 * @returns {{level: string, name: string}|null} level & nama wilayah yang tidak cocok
 */
export function jurisdictionMismatch(osmNames = [], adminLevel = {}, adminRegionNames = {}) {
	const detected = (osmNames || []).map(normalizeRegionName).filter(Boolean);
	if (detected.length === 0) return null;

	for (const [codeKey, nameKey, label] of JURISDICTION_LEVELS) {
		if (!adminLevel?.[codeKey]) continue;

		const own = normalizeRegionName(adminRegionNames?.[nameKey]);
		if (!own) continue;

		const matched = detected.some((name) => name === own || name.includes(own) || own.includes(name));
		if (!matched) return { level: label, name: adminRegionNames[nameKey] };
	}

	return null;
}

// Kosakata status FASILITAS (hydrant, SKKL/pompa, pos pemadam) — TASK_30.
//
// Nilai yang tersimpan di database tetap 'Aktif'/'Perbaikan'; yang diseragamkan hanya kata
// yang dibaca manusia. Sengaja tidak diubah sampai ke DB: nilai itu dipakai bersama oleh
// empat tabel + hukum warna peta ("Perbaikan = merah"), dan mengubahnya berarti migrasi enum
// + backfill di semua modul demi perubahan yang murni kebahasaan.
//
// Dipakai SEMUA permukaan fasilitas supaya satu aset tidak berbunyi "Aktif" di satu halaman
// dan "Berfungsi" di halaman lain — persis keluhan yang memunculkan aturan ini.
export const FACILITY_STATUS_LABELS = {
	Aktif: 'Berfungsi',
	Perbaikan: 'Tidak Berfungsi',
	// Hydrant warga (tandon/groundtank swadaya) punya kosakata sendiri sejak 2026-08-21 —
	// permintaan user. Yang ditanya di sana bukan "rusak atau tidak" (tandon berisi air tidak
	// rusak) melainkan apakah mulutnya sudah dimodifikasi agar bisa dihisap mobil pemadam.
	// Kata "Terdaftar" hidup HANYA di label ini; nilai simpanannya tetap dua kata.
	'Belum Modifikasi': 'Terdaftar Belum Dimodifikasi',
	'Sudah Modifikasi': 'Terdaftar Sudah Dimodifikasi',
};

export const facilityStatusLabel = (status) => FACILITY_STATUS_LABELS[status] ?? status ?? '-';

// Merah atau tidak. Sumber kebenaran tunggal untuk hukum warna fasilitas ("Perbaikan = merah"),
// menggantikan pemeriksaan `status === 'Aktif'` yang tersebar di kartu & marker. Perbedaannya
// baru terasa sejak ada status keempat & kelima: dengan bentuk lama, hydrant warga yang
// 'Sudah Modifikasi' akan digambar MERAH di mana-mana hanya karena bukan 'Aktif' — padahal
// tak ada yang rusak. Yang merah hanya fasilitas yang benar-benar tidak berfungsi.
export const facilityStatusIsFaulty = (status) => status === 'Perbaikan';

// Kondisi tekanan air hydrant (TASK_30). Nilai tersimpan cuma 'Keras'/'Sedang'/'Kecil' —
// kata "Tekanan" ditambahkan saat tampil supaya berdiri sendiri tanpa label kolom.
// Hanya hydrant RESMI yang punya kolom ini; hydrant warga tak lagi memakainya sejak 2026-08-21.
export const waterPressureLabel = (pressure) => (pressure ? `Tekanan ${pressure}` : null);

// Debit air dalam liter per menit. Satuannya selalu ikut: angka telanjang di kartu aset
// gampang dikira volume tangki.
export const debitLabel = (lpm) =>
	lpm === null || lpm === undefined || lpm === '' ? null : `${Number(lpm).toLocaleString('id-ID')} lpm`;

// Kapasitas tampungan dalam liter (tandon/groundtank warga). SENGAJA fungsi terpisah dari
// debitLabel walau bentuknya mirip: liter adalah simpanan dan lpm adalah aliran, dan satu
// helper bersama akan mengundang kedua angka itu dijumlahkan — persis kekeliruan yang
// membuat rekap air per desa harus dipecah jadi dua angka pada 2026-08-21.
export const capacityLabel = (liter) =>
	liter === null || liter === undefined || liter === '' ? null : `${Number(liter).toLocaleString('id-ID')} liter`;

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
