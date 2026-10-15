import { router } from '@inertiajs/react';
import { createElement, useEffect, useRef } from 'react';

// Tombol Kembali APK (`web.goBack()`), gestur geser-kembali iOS, dan tombol Kembali browser
// menutup LAPISAN yang terbuka (peta layar penuh form lapor #192, dialog/sheet/alert #205)
// alih-alih meninggalkan halaman. Tiap lapisan yang terbuka mendorong satu entri history
// (URL sama); Kembali memunculkan `popstate` yang kita cegat lalu menutup lapisan TERATAS.
//
// Jebakan Inertia 2.0.3 (node_modules/@inertiajs/core):
//  - `handlePopstateEvent` memulihkan halaman dengan `preserveState: false` = komponen di-mount
//    ulang dan isian form hilang. Listener kita harus jalan LEBIH DULU lalu
//    `stopImmediatePropagation()`. Di `window` urutannya = urutan pendaftaran (fase capture
//    TIDAK mendahului listener bubble Inertia - terbukti di Chrome), jadi listener dipasang
//    oleh `installBackClosesLayer()` di app.jsx SEBELUM `createInertiaApp` (router.init).
//  - Inertia menimpa `history.state` di setiap event gulir, jadi penanda lapisan disimpan di
//    modul ini, bukan di `history.state`.
//  - Kunjungan yang kembali ke URL yang SAMA (mis. simpan dari dialog lalu redirect back)
//    memakai replaceState = entri lapisan kita yang berisi halaman terbaru. Saat lapisan
//    ditutup lewat UI, entri itu dicabut (`history.back()`) dan entri di bawahnya diisi ulang
//    dengan state terbaru - tanpa itu Kembali/Maju nanti menampilkan data sebelum simpan.

//  - Tautan BIASA (<a href>, bukan <Link> Inertia) yang memuat URL lain selagi lapisan terbuka,
//    mis. Unduh di pop-up Ekspor Excel: menutup lapisannya TIDAK boleh memanggil
//    `history.back()` - traversal riwayat membatalkan navigasi yang belum dijawab server
//    (net::ERR_ABORTED, unduhan hilang tanpa pesan, #212). Lapisan itu ditandai `leaving`
//    dan entrinya dibiarkan; bila navigasinya berakhir sebagai unduhan, Kembali nanti
//    mendarat di salinan halaman yang sama (satu ketukan ekstra, sama dengan releaseLayer).

// Lapisan terbuka, urut dari bawah ke atas: { onBack, url, waiting, leaving }.
// `waiting` = belum punya entri history (didorong setelah pencabutan yang sedang berjalan).
const stack = [];
// Lapisan yang ditandai `leaving` oleh klik yang sedang diproses (dicabut lagi bila
// ternyata Inertia/handler lain membatalkan navigasinya).
let leavingByClick = [];

/** Klik ini memuat dokumen lain di tab yang sama lewat tautan biasa? */
const clickLeavesPage = (event) => {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
	const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
	if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return false;
	const url = new URL(anchor.href, window.location.href);
	if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
	const here = new URL(window.location.href);
	// Lompat ke #anchor di halaman yang sama bukan navigasi dokumen.
	return !(url.origin === here.origin && url.pathname === here.pathname && url.search === here.search && url.hash);
};
// Pencabutan entri yang sedang berjalan: popstate berikutnya milik kita sendiri.
let unwinding = null;

const pushWaiting = () => {
	for (const layer of stack) {
		if (!layer.waiting) continue;
		window.history.pushState(window.history.state, '', window.location.href);
		layer.url = window.location.href;
		layer.waiting = false;
	}
};

export function installBackClosesLayer() {
	window.addEventListener('popstate', (event) => {
		if (unwinding) {
			event.stopImmediatePropagation();
			unwinding.count -= 1;
			if (unwinding.count > 0) return;
			window.history.replaceState(unwinding.state, '', window.location.href);
			unwinding = null;
			pushWaiting();
			return;
		}

		const top = stack[stack.length - 1];
		if (!top || top.waiting) return;
		stack.pop();
		event.stopImmediatePropagation();
		top.onBack();
	});

	// Tautan biasa (#212). Fase CAPTURE: jalan sebelum onClick React menutup dialognya (tanpa
	// animasi keluar, releaseLayer bisa terjadi sebelum klik selesai menggelembung).
	window.addEventListener(
		'click',
		(event) => {
			leavingByClick = [];
			if (!stack.length || !clickLeavesPage(event)) return;
			leavingByClick = stack.filter((layer) => !layer.leaving);
			for (const layer of leavingByClick) layer.leaving = true;
		},
		true,
	);
	// Fase bubble (sesudah React): <Link> Inertia & handler lain memanggil preventDefault -
	// tak ada navigasi dokumen, jadi lapisannya kembali normal.
	window.addEventListener('click', (event) => {
		if (event.defaultPrevented) for (const layer of leavingByClick) layer.leaving = false;
		leavingByClick = [];
	});

	// Pindah ke URL lain selagi lapisan terbuka (mis. tautan di dalam dialog): entrinya kini
	// terkubur di bawah halaman baru - Kembali berikutnya milik Inertia, bukan lapisan itu.
	router.on('navigate', () => {
		for (let i = stack.length - 1; i >= 0; i--) {
			if (!stack[i].waiting && stack[i].url !== window.location.href) stack.splice(i, 1);
		}
	});
}

/** Lapisan dibuka: dorong satu entri history. `onBack` dipanggil saat Kembali menutupnya. */
export function pushLayer(onBack) {
	const layer = { onBack, url: null, waiting: true };
	stack.push(layer);
	if (!unwinding) pushWaiting();

	return layer;
}

/** Lapisan tertutup (lewat UI atau Kembali). Entri yang masih ada dicabut. */
export function releaseLayer(layer) {
	const index = stack.indexOf(layer);
	// Sudah diambil Kembali, atau terkubur karena pindah halaman.
	if (index === -1) return;
	stack.splice(index, 1);
	// `leaving`: halaman sedang dimuat ulang/diunduh lewat tautan biasa - jangan dibatalkan (#212).
	if (layer.waiting || layer.leaving) return;
	// Hanya entri TERATAS di URL yang sama yang bisa dicabut; selain itu dibiarkan (Kembali
	// nanti mendarat di salinan halaman yang sama - satu ketukan ekstra, kasus langka).
	if (index !== stack.length || layer.url !== window.location.href) return;

	if (unwinding) {
		unwinding.count += 1;
	} else {
		unwinding = { count: 1, state: window.history.state };
	}
	window.history.back();
}

/**
 * Lapisan buatan sendiri (state React): `close()` yang dikembalikan menutupnya lewat
 * `onClose`. Bila `onClose` menolak menutup (lapisan masih terbuka sesudahnya), entrinya
 * didorong lagi supaya Kembali berikutnya tetap tertangkap.
 */
export default function useBackClosesLayer(open, onClose) {
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;
	const openRef = useRef(open);
	openRef.current = open;

	useEffect(() => {
		if (!open) return;

		let layer;
		const onBack = () => {
			onCloseRef.current();
			requestAnimationFrame(() => {
				if (openRef.current && layer && !stack.includes(layer)) layer = pushLayer(onBack);
			});
		};
		layer = pushLayer(onBack);

		return () => releaseLayer(layer);
	}, [open]);

	return () => onCloseRef.current();
}

/**
 * Dirender DI DALAM Content Radix (Dialog, AlertDialog, Sheet) - hanya terpasang selama
 * terbuka, seperti PullToRefreshLock. Kembali = tombol Escape untuk lapisan Radix teratas,
 * jadi berlaku sama untuk dialog terkendali maupun tidak. Escape ditolak (onEscapeKeyDown
 * preventDefault, mis. sedang menyimpan) = dialog tetap `data-state="open"` -> entri didorong
 * lagi.
 */
export function DismissOnBack() {
	const anchorRef = useRef(null);

	useEffect(() => {
		let layer;
		const onBack = () => {
			const anchor = anchorRef.current;
			(anchor ?? document).dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
			);
			requestAnimationFrame(() => {
				const content = anchorRef.current?.parentElement;
				if (content?.isConnected && content.getAttribute('data-state') === 'open') layer = pushLayer(onBack);
			});
		};
		layer = pushLayer(onBack);

		return () => releaseLayer(layer);
	}, []);

	return createElement('span', { ref: anchorRef, hidden: true });
}
