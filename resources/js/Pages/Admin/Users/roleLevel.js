// Tingkat yurisdiksi saat menetapkan peran - dipakai dialog "Tetapkan Peran" (Index.jsx) DAN
// form Tambah Pengguna (Create.jsx). Satu berkas supaya usulan tingkat per peran tidak
// hidup sebagai dua kamus yang bisa menyimpang. Berekstensi .js, jadi tidak ikut
// glob halaman Inertia (./Pages/**/*.jsx).

const RANK_TO_LEVEL = { 4: 'desa', 3: 'kecamatan', 2: 'kabupaten', 1: 'provinsi' };

// Tingkat yurisdiksi yang DIUSULKAN saat sebuah peran dipilih (permintaan user 2026-08-28:
// "jika memberikan role Petugas, yurisdiksi auto ke kota"). Sengaja DATA, bukan cabang `if`
// di dalam defaultLevelFor: menambah peran berikutnya cukup satu baris di sini.
//
// Ini USULAN, bukan kunci — admin tetap bisa menggantinya, dan dua penjaga yang sudah ada
// tetap berlaku lebih dulu: levelOptionsFor() menyaring tingkat yang tak dimiliki pengguna,
// dan `assignable_levels` dari server menolak tingkat yang lebih luas dari yurisdiksi admin
// itu sendiri. Kalau usulannya tidak tersedia, jatuh ke perilaku lama (tingkat terdalam).
// Nilainya WAJIB salah satu value enum TenantLevel — dijaga AssignRoleDefaultLevelTest,
// sebab tingkat yang tak dikenal tidak menimbulkan galat, dropdown-nya sekadar kosong.
const ROLE_DEFAULT_LEVEL = { petugas: 'kabupaten' };

// Rank wilayah terdalam dari kode wilayah (desa=4 … provinsi=1, 0 bila kosong) - rumus yang
// sama dengan `region_level` di UserResource.
export const regionRankOf = (codes) =>
	codes?.village_code ? 4 : codes?.district_code ? 3 : codes?.city_code ? 2 : codes?.province_code ? 1 : 0;

export const levelOptionsFor = (assignableLevels, regionRank) =>
	(assignableLevels ?? []).filter((level) => level.rank <= (regionRank ?? 0));

export const defaultLevelFor = (assignableLevels, regionRank, role) => {
	const options = levelOptionsFor(assignableLevels, regionRank);
	if (options.length === 0) return '';
	const preferred = ROLE_DEFAULT_LEVEL[role];
	if (preferred && options.some((option) => option.value === preferred)) return preferred;
	const current = RANK_TO_LEVEL[regionRank];
	if (options.some((option) => option.value === current)) return current;
	return options.reduce((a, b) => (a.rank >= b.rank ? a : b)).value;
};
