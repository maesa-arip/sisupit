import { router, usePage } from '@inertiajs/react';
import { useEffect, useSyncExternalStore } from 'react';

/**
 * Navigasi instan (TASK_70). Inertia baru mengganti layar setelah respons server tiba, jadi
 * di ponsel ketukan terasa "menunggu" ~0,4-1 detik. Modul ini mencatat KUNJUNGAN HALAMAN
 * yang sedang berjalan supaya AppLayout bisa langsung menampilkan kerangka halaman tujuan
 * dan menu bisa langsung menandai tujuan itu aktif.
 *
 * Yang dihitung "kunjungan halaman" hanya GET penuh ke PATH lain - BUKAN reload parsial
 * (Reverb, `only`), filter/paginasi daftar (`preserveState`, path sama), kirim form (non-GET)
 * maupun prefetch. Kerangka di layar untuk hal-hal itu terbaca seperti halaman hilang.
 *
 * Pembatalan oleh listener `before` lain (konfirmasi tinggalkan form) diperiksa satu microtask
 * kemudian, setelah seluruh listener selesai.
 *
 * TANPA PREFETCH (sengaja): di @inertiajs/core 2.0.3 prefetch yang gagal (offline) atau disela
 * (prefetch lain / reload Reverb) tertinggal di daftar "sedang diambil" dengan promise yang
 * sudah ditolak, dan KLIK BERIKUTNYA ke link itu tidak melakukan apa pun. Dibuktikan di Chrome
 * 2026-10-04 (FINDINGS #166). Pakai `prefetch` hanya setelah Inertia di-upgrade.
 */

const SKELETON_DELAY_MS = 80;

let pending = null; // { url: '/path?query', skeleton: boolean }
let skeletonTimer = null;
let asyncInFlight = 0;
// Jumlah AppLayout yang terpasang = yang sanggup menggambar kerangka (Auth, Landing tidak).
let skeletonHosts = 0;
const listeners = new Set();

function emit(next) {
	pending = next;
	listeners.forEach((listener) => listener());
}

function subscribe(listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

const getSnapshot = () => pending;
const getServerSnapshot = () => null;

const pathOf = (url) => url.pathname + url.search;

function clearPending() {
	clearTimeout(skeletonTimer);
	if (pending) emit(null);
}

function isPageVisit(visit) {
	return (
		visit.method === 'get' &&
		!visit.prefetch &&
		!visit.async &&
		visit.preserveState === false &&
		visit.only.length === 0 &&
		visit.except.length === 0 &&
		visit.url.pathname !== window.location.pathname
	);
}

function isRealtimeReload(visit) {
	return visit.async && !visit.prefetch;
}

/** Dipanggil sekali dari app.jsx (hanya di browser). */
export function installNavigationTracking() {
	router.on('before', (event) => {
		const visit = event.detail.visit;
		if (!isPageVisit(visit)) return;

		// Kerangka sudah jadi penanda memuat -> progress bar oranye Inertia tidak ikut tampil
		// (permintaan user 2026-10-04). Halaman tanpa AppLayout tak punya kerangka, jadi
		// progress bar tetap satu-satunya penanda di sana. Harus diubah SINKRON di sini:
		// router.visit menyalin objek visit tepat setelah event `before`.
		if (skeletonHosts > 0) visit.showProgress = false;

		const url = pathOf(visit.url);
		queueMicrotask(() => {
			if (event.defaultPrevented) return;

			clearTimeout(skeletonTimer);
			emit({ url, skeleton: false });
			skeletonTimer = setTimeout(() => {
				if (pending?.url === url) emit({ url, skeleton: true });
			}, SKELETON_DELAY_MS);
		});
	});

	router.on('start', (event) => {
		if (isRealtimeReload(event.detail.visit)) asyncInFlight++;
	});

	router.on('finish', (event) => {
		const visit = event.detail.visit;

		if (isRealtimeReload(visit)) {
			asyncInFlight = Math.max(0, asyncInFlight - 1);
			return;
		}

		// Kunjungan halaman selesai - sukses, galat, dibatalkan, atau disela kunjungan lain.
		if (!visit.prefetch && pending?.url === pathOf(visit.url)) clearPending();
	});

	router.on('navigate', (event) => {
		if (!pending) return;
		const page = new URL(event.detail.page.url, window.location.origin);
		// Reload parsial juga memicu `navigate`; selama ada yang berjalan, hanya halaman
		// tujuan yang boleh menutup kerangka. Tanpa reload berjalan, `navigate` pasti milik
		// kunjungan ini (termasuk yang dialihkan server ke path lain).
		if (asyncInFlight === 0 || page.pathname === new URL(pending.url, window.location.origin).pathname) {
			clearPending();
		}
	});

}

/** Dipanggil AppLayout: menandai bahwa layar ini akan menggambar kerangka saat pindah halaman. */
export function useSkeletonHost() {
	useEffect(() => {
		skeletonHosts++;
		return () => {
			skeletonHosts--;
		};
	}, []);
}

/** Kunjungan halaman yang sedang berjalan, atau null. */
export function usePendingVisit() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** URL untuk menandai menu aktif: tujuan yang sedang dibuka bila ada, kalau tidak halaman kini. */
export function useNavUrl() {
	const { url } = usePage();
	return usePendingVisit()?.url ?? url;
}
