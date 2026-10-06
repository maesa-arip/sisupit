import { useEffect } from 'react';

// Keyboard layar terbuka (#187). Di APK, MainActivity memberi root view padding setinggi keyboard
// (inset ime), jadi WebView menyusut ke ruang DI ATAS keyboard - dan semua yang `fixed` ikut naik:
// header (64px), bar Kirim form lapor (~73px), bilah bawah (64px). Di ponsel biasa sisa ~420px itu
// tinggal ~220px untuk isi, dan WebView menggulir kolom terfokus hanya sampai tepi bawah layar -
// tepat di belakang bar Kirim & bilah bawah ("Patokan Lokasi tak kelihatan, harus scroll dulu").
//
// Aturannya (mengikuti aplikasi native): bilah bawah TIDAK ikut naik - ia disembunyikan selama
// mengetik; bar aksi halaman (tombol Kirim) naik sendirian tepat di atas keyboard; kolom terfokus
// digulir ke TENGAH ruang yang tersisa. Helper ini hanya memasang penanda di <html>:
//   data-keyboard="open"  -> dipakai varian Tailwind `[html[data-keyboard=open]_&]:...`
//   --keyboard-inset      -> jarak tepi bawah layout ke tepi atas keyboard. 0 di APK (layout ikut
//                            menyusut); setinggi keyboard di iOS/WKWebView, yang menimpakan keyboard
//                            di atas layout tanpa menyusutkannya.
// Tak ada media query untuk keyboard, jadi tandanya: kolom ketik sedang fokus DAN tinggi layar
// tampak menyusut > KEYBOARD_MIN_PX dibanding saat tak ada yang difokus.
const KEYBOARD_MIN_PX = 150;
const NON_TEXT_TYPES = ['button', 'checkbox', 'color', 'file', 'hidden', 'image', 'radio', 'range', 'reset', 'submit'];

function isTextEntry(el) {
	if (!el || el.disabled || el.readOnly) return false;
	if (el.tagName === 'TEXTAREA') return true;
	if (el.tagName === 'INPUT') return !NON_TEXT_TYPES.includes((el.type || 'text').toLowerCase());
	return el.isContentEditable === true;
}

export function useKeyboardOpenFlag() {
	useEffect(() => {
		const vv = window.visualViewport;
		if (!vv) return;

		const root = document.documentElement;
		// Tinggi tampak tanpa zoom cubit (vv.height mengecil saat diperbesar, bukan karena keyboard).
		const visibleHeight = () => vv.height * vv.scale;
		let restingHeight = visibleHeight();
		let open = false;
		let frame = 0;

		const centerFocused = () => {
			const el = document.activeElement;
			if (isTextEntry(el)) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
		};

		const update = () => {
			frame = 0;
			const focused = isTextEntry(document.activeElement);
			// Selama tak ada kolom terfokus keyboard pasti tertutup: tinggi saat itu jadi patokan
			// (ikut berubah saat layar diputar).
			if (!focused) restingHeight = visibleHeight();
			const nextOpen = focused && restingHeight - visibleHeight() > KEYBOARD_MIN_PX;

			if (nextOpen) {
				const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
				root.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`);
			}
			if (nextOpen === open) return;
			open = nextOpen;
			if (open) {
				root.dataset.keyboard = 'open';
				// Setelah bilah bawah hilang & bar Kirim pindah (satu frame), baru kolom ditengahkan.
				requestAnimationFrame(centerFocused);
			} else {
				delete root.dataset.keyboard;
				root.style.removeProperty('--keyboard-inset');
			}
		};
		const schedule = () => {
			if (!frame) frame = requestAnimationFrame(update);
		};
		// Pindah kolom selagi keyboard tetap terbuka (Patokan -> Detail): WebView tak menggulir
		// apa pun karena tinggi layar tak berubah, jadi tengahkan sendiri.
		const onFocusIn = (e) => {
			schedule();
			if (open && isTextEntry(e.target)) requestAnimationFrame(centerFocused);
		};

		// window 'resize' juga: di APK layout-nya sendiri yang menyusut, dan event visualViewport
		// tak selalu terpicu (mis. di dalam iframe).
		window.addEventListener('resize', schedule);
		vv.addEventListener('resize', schedule);
		vv.addEventListener('scroll', schedule);
		document.addEventListener('focusin', onFocusIn);
		document.addEventListener('focusout', schedule);
		return () => {
			window.removeEventListener('resize', schedule);
			vv.removeEventListener('resize', schedule);
			vv.removeEventListener('scroll', schedule);
			document.removeEventListener('focusin', onFocusIn);
			document.removeEventListener('focusout', schedule);
			if (frame) cancelAnimationFrame(frame);
			delete root.dataset.keyboard;
			root.style.removeProperty('--keyboard-inset');
		};
	}, []);
}
