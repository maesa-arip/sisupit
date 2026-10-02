// Validasi server gagal -> bawa pengguna ke isian PALING ATAS yang bermasalah (2026-10-03).
// Tanpa ini pesan "wajib diisi" bisa berdiri di luar layar (form panjang, atau papan ketik
// ponsel menutupi separuh layar) dan pengguna mengira tombol Simpan tidak bekerja.
// Patokannya <InputError> (ber-`data-input-error`) urutan DOM, bukan urutan kunci `errors`
// dari server: urutan kunci mengikuti aturan validasi, belum tentu urutan isian di layar.
const FIELD = [
	'input:not([type=hidden]):not([disabled])',
	'textarea:not([disabled])',
	'select:not([disabled])',
	'[role=combobox]:not([disabled])',
	'[role=checkbox]:not([disabled])',
	'[role=radio]:not([disabled])',
].join(',');

export function focusFirstError() {
	const error = Array.from(document.querySelectorAll('[data-input-error]')).find(
		(element) => element.offsetParent !== null,
	);
	if (!error) return;

	// Isiannya bersaudara dengan pesan galat di blok yang sama (pola Label + Input + InputError);
	// naik paling jauh tiga tingkat supaya tidak "menemukan" isian milik blok lain.
	let field = null;
	for (let parent = error.parentElement, depth = 0; parent && depth < 3 && !field; depth++) {
		field = parent.querySelector(FIELD);
		parent = parent.parentElement;
	}

	const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	(field ?? error).scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
	field?.focus({ preventScroll: true });
}
