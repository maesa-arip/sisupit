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

/**
 * Render DI DALAM isi panel yang hanya terpasang selama panel terbuka (Content milik Radix,
 * atau panel yang dirender bersyarat) - bukan di komponen yang tetap terpasang saat tertutup.
 */
export default function PullToRefreshLock() {
	useEffect(() => {
		openPanelCount += 1;
		if (openPanelCount === 1) setNativePullToRefresh(false);
		return () => {
			openPanelCount -= 1;
			if (openPanelCount === 0) setNativePullToRefresh(true);
		};
	}, []);
	return null;
}
