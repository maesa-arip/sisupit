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

// Lapisan terbuka, urut dari bawah ke atas: { onBack, url, waiting }.
// `waiting` = belum punya entri history (didorong setelah pencabutan yang sedang berjalan).
const stack = [];
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
	if (layer.waiting) return;
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
