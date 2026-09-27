/**
 * Escape teks sebelum masuk ke HTML MENTAH (#131).
 *
 * React selalu meng-escape teks sendiri, jadi di JSX helper ini tidak dibutuhkan. Yang
 * membutuhkannya hanya popup Leaflet: `bindPopup(string)` memasang string itu lewat `innerHTML`.
 * Tanpa escape, judul laporan yang diketik warga seperti `<img src=x onerror=...>` berjalan di
 * browser admin/petugas/pejabat yang membuka peta, dengan sesi mereka.
 *
 * ATURAN: SETIAP nilai data yang disisipkan ke string HTML popup WAJIB lewat sini - termasuk yang
 * "cuma ditulis admin" (nama fasilitas, nama regu): hydrant warga, nama akun, dan alamat hasil
 * geocode tidak ditulis admin, dan aturan yang punya pengecualian akan dilanggar. Dijaga
 * `LeafletPopupEscapeTest`.
 *
 * Sengaja berkas sendiri, bukan di `lib/utils.js`: berkas itu memuat byte NUL (#93) dan
 * menyuntingnya menuntut penanganan biner.
 */
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
	if (value === null || value === undefined) return '';
	return String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch]);
}
