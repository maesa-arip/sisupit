/**
 * Nomor HP pelapor (TASK_90 "cek nomor sebelum kirim"). Pemicunya kejadian nyata: laporan benar
 * tapi nomornya tak bisa ditelepon Pusat Komando. Penormalan di sini SAMA dengan
 * GuestReportRequest::prepareForValidation (+62/62 -> 0, spasi & tanda baca dibuang) supaya yang
 * ditampilkan untuk dikonfirmasi persis yang akan disimpan server.
 */

const MOBILE = /^08\d{8,11}$/;
// Awalan seluler Indonesia yang dikenal. Hanya PERINGATAN, tak pernah menolak: awalan baru bisa
// lahir kapan saja, dan laporan darurat tak boleh tertolak karena daftar ini tertinggal.
const KNOWN_PREFIX = /^08(1[1-9]|2[1-3]|2[78]|3[1-38]|5[1-9]|7[78]|8[1-9]|9[5-9])/;

export function normalizePhone(raw) {
	let phone = String(raw ?? '').replace(/[\s\-().]/g, '');
	if (phone.startsWith('+62')) phone = '0' + phone.slice(3);
	else if (phone.startsWith('62')) phone = '0' + phone.slice(2);
	return phone;
}

/** "081234567890" -> "0812-3456-7890" (mudah dibaca ulang pelapor). */
export function formatPhone(raw) {
	const phone = normalizePhone(raw);
	if (!/^\d+$/.test(phone)) return String(raw ?? '').trim();
	return phone.replace(/^(\d{4})(\d{1,4})?(\d+)?$/, (_, a, b, c) => [a, b, c].filter(Boolean).join('-'));
}

/**
 * Masalah nomor: null = tampak wajar; { level: 'error' } = pasti ditolak/tak bisa ditelepon;
 * { level: 'warning' } = mungkin salah ketik, pelapor diminta memeriksa ulang.
 */
export function phoneProblem(raw) {
	const phone = normalizePhone(raw);
	if (!phone) return { level: 'error', message: 'Nomor HP belum diisi, petugas tidak bisa menelepon Anda.' };
	if (!MOBILE.test(phone)) return { level: 'error', message: 'Nomor HP tidak valid. Contoh: 081234567890.' };
	if (/^08(\d)\1{6,}/.test(phone) || /^08(\d{2})\1{3,}/.test(phone)) {
		return { level: 'warning', message: 'Nomor ini tampak tidak biasa (angka berulang). Pastikan nomornya benar.' };
	}
	if (!KNOWN_PREFIX.test(phone)) {
		return { level: 'warning', message: 'Awalan nomor ini tidak dikenal sebagai nomor seluler. Periksa lagi.' };
	}
	return null;
}
