import { useCallback, useEffect, useRef } from 'react';

/**
 * Membuat panel melayang (drawer/sheet) menghormati tombol Back perangkat.
 *
 * Di WebView APK, Back memanggil `history.back()`. Tanpa hook ini panel yang sedang terbuka
 * tidak menangkap Back sama sekali, sehingga user yang bermaksud menutup menu justru
 * terlempar keluar dari halaman — keluhan nyata pemakai APK dan salah satu syarat NN/g
 * (bottom sheet wajib menghormati Back perangkat).
 *
 * Caranya: saat panel dibuka, satu entri riwayat "boneka" didorong ke stack. Back memicu
 * `popstate` → panel ditutup, halaman tetap. Saat panel ditutup lewat jalur lain (tombol ✕,
 * swipe, klik overlay) entri boneka itu dipanen kembali dengan `history.back()`.
 *
 * Entri boneka menyalin `history.state` milik Inertia + satu penanda, dan memakai URL yang
 * sama persis. Ini penting: kalau state Inertia hilang, `popstate` membuat Inertia me-reload
 * halaman penuh alih-alih memulihkannya dari memori.
 *
 * Catatan sengaja: saat panel tertutup KARENA pindah halaman, entri boneka dibiarkan
 * tertinggal di stack — itulah gunanya `releaseWithoutBack()` yang dikembalikan hook ini.
 * Memaksa `history.back()` di titik itu akan memicu popstate tepat saat Inertia hendak
 * mendorong halaman barunya, dan navigasi yang baru saja diminta user bisa mental. Ongkos
 * dari membiarkannya hanyalah satu entri riwayat ekstra yang memulihkan halaman yang sama.
 *
 * @returns {() => void} tandai penutupan yang TIDAK boleh memanggil history.back()
 */
export default function useSheetHistory(open, onClose, key = 'sheet') {
	const pushedRef = useRef(false);
	// Simpan callback di ref supaya listener popstate tidak perlu dipasang ulang tiap render
	// hanya karena pemanggil mengoper fungsi inline.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (typeof window === 'undefined') return;

		if (open && !pushedRef.current) {
			window.history.pushState({ ...window.history.state, sisupitSheet: key }, '', window.location.href);
			pushedRef.current = true;
			return;
		}

		if (!open && pushedRef.current) {
			pushedRef.current = false;
			if (window.history.state?.sisupitSheet === key) {
				window.history.back();
			}
		}
	}, [open, key]);

	useEffect(() => {
		if (!open || typeof window === 'undefined') return;

		const handlePopState = () => {
			// Entri boneka sudah dilepas oleh browser; jangan sampai efek di atas
			// memanggil history.back() sekali lagi.
			pushedRef.current = false;
			onCloseRef.current?.();
		};

		window.addEventListener('popstate', handlePopState);

		return () => window.removeEventListener('popstate', handlePopState);
	}, [open]);

	return useCallback(() => {
		pushedRef.current = false;
	}, []);
}
