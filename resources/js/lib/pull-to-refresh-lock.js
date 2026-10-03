import { useEffect } from 'react';

// Tarik-untuk-refresh milik APK (SwipeRefreshLayout) merebut SETIAP tarikan ke bawah selama
// HALAMAN berada di puncak - ia tak tahu ada daftar bergulir di dalam panel melayang, jadi
// menggulir daftar itu ke atas malah memuat ulang halaman (TASK_65: dialog "Atur Anggota";
// 2026-10-03: popover "Menu" bilah bawah). Selama panel semacam itu terbuka, halaman meminta
// APK mematikannya lewat AndroidBridge. Pemanggilannya OPSIONAL: APK lama tanpa method ini,
// browser, dan .exe tak terpengaruh. Hitungan dipakai karena panel bisa bertumpuk (mis. Select
// di dalam Dialog) - yang pertama tertutup tak boleh menyalakannya lagi.
let openPanelCount = 0;
const setNativePullToRefresh = (enabled) => {
	const bridge = typeof window !== 'undefined' ? window.AndroidBridge : null;
	if (bridge && typeof bridge.setPullToRefreshEnabled === 'function') bridge.setPullToRefreshEnabled(enabled);
};

// APK <= 1.1.5 menyalakan refresh lagi di setiap onPageFinished, dan WebView memanggilnya juga
// saat Inertia menyimpan posisi gulir (history.replaceState) - jadi kunci lepas di tengah gulir
// (#162). Selama terkunci, ulangi permintaan "mati" di awal setiap sentuhan. APK 1.1.6+ memakai
// bendera yang tak terpengaruh onPageFinished; pengulangan ini tak berbahaya di sana.
const reassertLock = () => setNativePullToRefresh(false);

/**
 * Render DI DALAM isi panel yang hanya terpasang selama panel terbuka (Content milik Radix,
 * atau panel yang dirender bersyarat) - bukan di komponen yang tetap terpasang saat tertutup.
 */
export default function PullToRefreshLock() {
	useEffect(() => {
		openPanelCount += 1;
		if (openPanelCount === 1) {
			setNativePullToRefresh(false);
			window.addEventListener('touchstart', reassertLock, { capture: true, passive: true });
		}
		return () => {
			openPanelCount -= 1;
			if (openPanelCount === 0) {
				window.removeEventListener('touchstart', reassertLock, { capture: true });
				setNativePullToRefresh(true);
			}
		};
	}, []);
	return null;
}
