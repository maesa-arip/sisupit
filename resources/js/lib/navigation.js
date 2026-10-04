import { router, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

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

// 120 ms: respons yang tiba sedikit di atas ambang membuat kerangka berkedip sekilas lalu langsung
// diganti - dua lompatan beruntun itulah yang terasa "patah-patah" (keluhan user 2026-10-04 di dev).
// Menu aktif tetap berubah seketika; ambang ini hanya untuk kerangka.
const SKELETON_DELAY_MS = 120;
// Masuknya halaman baru setelah kerangka (skill animate: pencegah perubahan mendadak, puluhan kali
// sehari -> opacity saja, singkat). Kurvanya = token `ease-spring` di tailwind.config.js.
const PAGE_FADE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const ARRIVAL_FADE = { duration: 200, easing: PAGE_FADE_EASING };

let pending = null; // { url: '/path?query', skeleton: boolean }
let skeletonTimer = null;
let asyncInFlight = 0;
// Jumlah AppLayout yang terpasang = yang sanggup menggambar kerangka (Auth, Landing tidak).
let skeletonHosts = 0;
// Kerangka sempat tampil untuk kunjungan yang baru selesai -> halaman berikutnya masuk dengan fade.
let arrivedFromSkeleton = false;
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
	if (!pending) return;
	if (pending.skeleton) arrivedFromSkeleton = true;
	emit(null);
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

/**
 * Transisi isi halaman (skill animate: pencegah perubahan mendadak, puluhan kali sehari -> opacity
 * saja, singkat, kurva token `ease-spring`; data yang dibaca tak boleh bergeser demi gaya; reduced
 * motion tetap fade). WAAPI pada opacity berjalan di compositor (dicek di trace Chrome). Urutan tanpa
 * satu pun potongan keras (dulu tiga, terasa "patah-patah"):
 *   1. ketukan        -> halaman lama memudar keluar selama jeda kerangka;
 *   2. kerangka tampil -> fade keluar dilepas (halaman lama sudah tersembunyi), kerangka memudar masuk
 *                         lewat kelas CSS-nya sendiri;
 *   3. respons tiba    -> halaman baru memudar masuk. Bila datang dari kerangka, fade ditunda DUA frame:
 *                         frame pertama halaman baru itu berat (render, layout awal, peta - 0,5-1 dtk
 *                         pada CPU 4x lebih lambat) dan fade yang dimulai saat commit habis di dalamnya.
 * Kunjungan gagal/batal = halaman lama kembali penuh.
 */
export function usePageTransition(ref, pendingVisit) {
	const leaving = useRef(null);
	const navigating = Boolean(pendingVisit);
	const skeleton = Boolean(pendingVisit?.skeleton);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el?.animate) return;

		if (navigating && !skeleton) {
			leaving.current = el.animate([{ opacity: 1 }, { opacity: 0 }], {
				duration: SKELETON_DELAY_MS,
				easing: PAGE_FADE_EASING,
				fill: 'forwards',
			});
			return;
		}

		// Opasitas terakhir halaman lama (respons yang tiba sebelum kerangka sempat tampil).
		const from = leaving.current ? Number(getComputedStyle(el).opacity) : 1;
		leaving.current?.cancel();
		leaving.current = null;
		if (navigating) return; // kerangka tampil: ia memudar masuk sendiri

		if (!arrivedFromSkeleton) {
			if (from < 1) el.animate([{ opacity: from }, { opacity: 1 }], ARRIVAL_FADE);
			return;
		}
		arrivedFromSkeleton = false;

		el.style.opacity = '0';
		let second;
		const first = requestAnimationFrame(() => {
			second = requestAnimationFrame(() => {
				el.style.opacity = '';
				el.animate([{ opacity: 0 }, { opacity: 1 }], ARRIVAL_FADE);
			});
		});

		return () => {
			cancelAnimationFrame(first);
			cancelAnimationFrame(second);
			el.style.opacity = '';
		};
	}, [navigating, skeleton, ref]);
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
