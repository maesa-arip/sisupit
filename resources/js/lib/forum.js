// Forum Tanya Jawab Warga (TASK_54).
//
// Sengaja berkas sendiri, bukan lib/utils.js: berkas itu memuat byte NUL mentah (#93) dan
// menyuntingnya dengan alat biasa berisiko merusak regex AKSARA_TAK_TERBACA tanpa gejala.

import { toast } from 'sonner';

// Batas panjang pertanyaan forum. WAJIB sama dengan `min:`/`max:` di ForumThreadRequest -
// penjaganya di ForumTest menarik angka dari KEDUA berkas lalu mengadunya (pelajaran #79),
// bukan mengulang angka yang sama di test. Batas minimal ditampilkan di penghitung supaya
// diketahui SEBELUM mengirim: dulu penghitungnya cuma "4/150", seolah hanya ada batas
// maksimal, dan judul pendek ditolak tanpa warga tahu sebabnya (#122).
export const FORUM_LIMITS = {
	threadTitle: { min: 10, max: 150 },
	threadBody: { min: 10, max: 3000 },
};

export const lengthHint = (value, { min, max }) => `${value.length}/${max} · min. ${min}`;

/**
 * Umumkan galat validasi di tempat pengguna sedang melihat (#122).
 *
 * Pesan galat per isian hanya dirender tepat di bawah isiannya, sedangkan form forum dikirim
 * dengan `preserveScroll` sehingga layar tetap di posisi tombol Kirim. Di ponsel pesan galat
 * judul jatuh TEPAT DI BAWAH HEADER STICKY (dibuktikan lewat elementFromPoint di 390x844), dan
 * `onError` lama sengaja tak memunculkan toast selama ada galat per isian - hasilnya tombol
 * diketuk, kiriman ditolak, dan layar tidak berubah sedikit pun.
 *
 * `fields` = { kunciGalat: idElemen } dalam urutan tampil; yang pertama bergalat diumumkan
 * lewat toast (sonner berada di atas header) lalu isiannya digulir ke TENGAH layar - bukan
 * `start`, yang akan menaruhnya kembali di bawah header. Memulangkan false bila tak ada galat
 * pada isian yang dikenal, supaya pemanggil bisa memberi pesan umum.
 */
export function announceFormErrors(errors, fields) {
	const key = Object.keys(fields).find((field) => errors?.[field]);
	if (!key) return false;

	toast.error(errors[key]);

	const element = document.getElementById(fields[key]);
	if (element) {
		element.scrollIntoView({ block: 'center', behavior: 'smooth' });
		element.focus({ preventScroll: true });
	}

	return true;
}

// Kata yang biasanya muncul saat seseorang sedang MENGALAMI kejadian. Dipakai untuk
// MENANYAKAN ulang sebelum mengirim, BUKAN untuk menolak: "cara memadamkan api kompor" adalah
// pertanyaan forum yang sah. Server tidak memakai daftar ini sama sekali - jangan jadikan
// validasi, karena kata darurat yang lolos dari daftar tetap harus bisa dikirim dan yang tertahan
// salah akan membuat warga tak bisa bertanya.
export const EMERGENCY_KEYWORDS = [
	'kebakaran',
	'terbakar',
	'kobaran',
	'api',
	'asap tebal',
	'tolong',
	'darurat',
	'korban',
	'terjebak',
	'meledak',
	'ledakan',
	'sekarang juga',
];

export function containsEmergencyWords(...texts) {
	const haystack = texts.join(' ').toLowerCase();

	return EMERGENCY_KEYWORDS.some((word) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`).test(haystack));
}

// Status thread & balasan. Tidak ada cadangan yang MENGAKU jadi status lain (pelajaran #94):
// nilai tak dikenal tampil apa adanya.
export const FORUM_STATUS_META = {
	menunggu: { label: 'Menunggu Tinjauan Admin', tone: 'border-warning/30 bg-warning/10 text-warning' },
	tampil: { label: 'Tayang', tone: 'border-success/20 bg-success/10 text-success' },
	disembunyikan: { label: 'Disembunyikan Admin', tone: 'border-destructive/30 bg-destructive/10 text-destructive' },
};

export const forumStatusMeta = (status) =>
	FORUM_STATUS_META[status] ?? { label: status ?? '-', tone: 'border-border bg-muted text-muted-foreground' };
