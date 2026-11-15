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

// Peta (#241, 2026-11-15): menggeser peta Leaflet ke bawah saat HALAMAN di puncak juga direbut
// tarik-untuk-refresh APK - peta Pemantauan yang diperbesar, peta fasilitas, peta detail insiden,
// dst. Daripada memasang kunci di tiap peta, satu penjaga global: sentuhan yang DIMULAI di atas
// peta (atau lapisan bertanda `data-no-pull-refresh`, mis. peta layar penuh) mematikan refresh
// sampai jari diangkat. Panel yang masih terbuka (openPanelCount) tetap memegang kuncinya.
const NO_PULL_SELECTOR = '.leaflet-container, [data-no-pull-refresh]';
let touchGuardActive = false;

const onGuardTouchStart = (event) => {
	const target = event.target;
	if (!(target instanceof Element) || !target.closest(NO_PULL_SELECTOR)) return;
	touchGuardActive = true;
	setNativePullToRefresh(false);
};

const onGuardTouchEnd = (event) => {
	// Masih ada jari lain di layar (cubit zoom): tunggu jari terakhir.
	if (!touchGuardActive || event.touches.length > 0) return;
	touchGuardActive = false;
	if (openPanelCount === 0) setNativePullToRefresh(true);
};

/** Dipasang sekali di app.jsx. Browser biasa & .exe tak punya jembatan - tanpa efek. */
export function installMapPullToRefreshGuard() {
	if (typeof window === 'undefined') return;
	window.addEventListener('touchstart', onGuardTouchStart, { capture: true, passive: true });
	window.addEventListener('touchend', onGuardTouchEnd, { capture: true, passive: true });
	window.addEventListener('touchcancel', onGuardTouchEnd, { capture: true, passive: true });
}
