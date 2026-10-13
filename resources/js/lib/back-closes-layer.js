import { useCallback, useEffect, useRef } from 'react';

// Tombol Kembali APK (`web.goBack()`), gestur geser-kembali iOS, dan tombol Kembali browser
// menutup LAPISAN layar penuh (mis. peta form lapor, #192) alih-alih meninggalkan halaman.
// Saat lapisan dibuka, satu entri history dengan URL sama didorong; Kembali memunculkan
// `popstate` yang kita cegat lalu menutup lapisan.
//
// Dua jebakan Inertia 2.0.3 (node_modules/@inertiajs/core):
//  - `handlePopstateEvent` memulihkan halaman dengan `preserveState: false` = komponen di-mount
//    ulang dan isian form hilang. Listener kita harus jalan LEBIH DULU lalu
//    `stopImmediatePropagation()`. Di `window` urutannya = urutan pendaftaran (fase capture
//    TIDAK mendahului listener bubble Inertia - terbukti di Chrome), jadi listener dipasang
//    oleh `installBackClosesLayer()` di app.jsx SEBELUM `createInertiaApp` (router.init).
//  - Inertia menimpa `history.state` di setiap event gulir (simpan posisi), jadi penanda entri
//    kita disimpan di modul ini, bukan di `history.state`.
//
// Semua jalur tutup di UI WAJIB lewat `close()` dari hook: ia memakai `history.back()`
// supaya entri dorongan tak tertinggal (entri sisa = Kembali berikutnya me-mount ulang form).

// Lapisan terbuka yang punya entri history, urut dari bawah ke atas.
const layers = [];

export function installBackClosesLayer() {
	window.addEventListener('popstate', (event) => {
		const layer = layers.pop();
		if (!layer) return;
		event.stopImmediatePropagation();
		layer.onClose();
	});
}

export default function useBackClosesLayer(open, onClose) {
	const layerRef = useRef(null);
	const closingRef = useRef(false);
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (!open) return;

		const layer = { onClose: () => onCloseRef.current() };
		window.history.pushState(window.history.state, '', window.location.href);
		layers.push(layer);
		layerRef.current = layer;
		closingRef.current = false;

		return () => {
			// Terlepas tanpa Kembali (mis. pindah halaman): jangan sampai popstate berikutnya
			// salah menutup lapisan yang sudah tak ada.
			const index = layers.indexOf(layer);
			if (index !== -1) layers.splice(index, 1);
			layerRef.current = null;
		};
	}, [open]);

	return useCallback(() => {
		// Ketukan ganda: `history.back()` kedua akan meninggalkan halaman.
		if (closingRef.current) return;
		if (layerRef.current && layers.includes(layerRef.current)) {
			closingRef.current = true;
			window.history.back();
		} else {
			onCloseRef.current();
		}
	}, []);
}
