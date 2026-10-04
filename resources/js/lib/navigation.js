import { router, usePage } from '@inertiajs/react';
import { useEffect, useLayoutEffect, useSyncExternalStore } from 'react';

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

// KAPAN KERANGKA TAMPIL (keputusan user 2026-10-04, setelah kajian: batas respons 0,1/1/10 dtk
// Nielsen Norman Group; React mempertahankan tampilan lama selama transisi & menahan Suspense
// ~300 ms; pola "delay + durasi minimum"). Halaman yang tiba cepat langsung diganti TANPA kerangka -
// kerangka yang muncul sekejap justru terasa lebih lambat dan berkedip.
//  - 0 ms   : menu langsung aktif di tujuan (tanda ketukan diterima); halaman lama tetap utuh.
//  - < 300  : respons tiba -> ganti langsung, tanpa kerangka, tanpa fade.
//  - 300 ms : masih menunggu -> kerangka memudar masuk.
//  - kerangka yang sudah tampil ditahan minimal 300 ms (tak berkedip), lalu halaman baru memudar masuk.
// Dua angka ini yang disetel bila hasil di ponsel belum pas.
const SKELETON_DELAY_MS = 300;
const SKELETON_MIN_MS = 300;
// Masuknya halaman baru setelah kerangka (skill animate: pencegah perubahan mendadak, puluhan kali
// sehari -> opacity saja, singkat). Kurvanya = token `ease-spring` di tailwind.config.js.
const PAGE_FADE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';
const ARRIVAL_FADE = { duration: 200, easing: PAGE_FADE_EASING };

let pending = null; // { url: '/path?query', skeleton: boolean }
let skeletonTimer = null;
let skeletonShownAt = 0;
// Penahan durasi minimum kerangka; selama berjalan, kunjungan dianggap belum selesai di layar.
let holdTimer = null;
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

function reveal() {
	if (!pending) return;
	if (pending.skeleton) arrivedFromSkeleton = true;
	emit(null);
}

function clearPending() {
	clearTimeout(skeletonTimer);
	if (!pending || holdTimer) return;

	const remaining = pending.skeleton ? SKELETON_MIN_MS - (performance.now() - skeletonShownAt) : 0;
	if (remaining > 0) {
		holdTimer = setTimeout(() => {
			holdTimer = null;
			reveal();
		}, remaining);
		return;
	}
	reveal();
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
			clearTimeout(holdTimer);
			holdTimer = null;
			// Kerangka sedang tampil (ketukan beruntun): biarkan tetap tampil - mencopotnya
			// memperlihatkan halaman setengah jadi sekejap. Hitungan minimumnya tetap berjalan.
			const keepSkeleton = Boolean(pending?.skeleton);
			emit({ url, skeleton: keepSkeleton });
			if (keepSkeleton) return;
			skeletonTimer = setTimeout(() => {
				if (pending?.url !== url) return;
				skeletonShownAt = performance.now();
				emit({ url, skeleton: true });
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
 * Masuknya halaman baru SETELAH kerangka (skill animate: pencegah perubahan mendadak, puluhan kali
 * sehari -> opacity saja, singkat, kurva token `ease-spring`; data yang dibaca tak boleh bergeser
 * demi gaya; reduced motion tetap fade). Tanpa kerangka tidak ada animasi sama sekali: halaman yang
 * tiba cepat diganti langsung, seperti pindah tab di aplikasi native. Halaman lama juga TIDAK
 * dipudarkan saat diketuk - itu membuat halaman cepat pun tampak sedang memuat.
 *
 * - `resize`: selama kerangka ditahan, halaman baru sudah terpasang tapi tersembunyi (display:none),
 *   jadi peta Leaflet di dalamnya mengukur dirinya 0x0. Leaflet mendengar resize jendela
 *   (`trackResize`, bawaan) lalu menghitung ulang ukurannya.
 * - DUA requestAnimationFrame: frame pertama halaman baru itu berat (layout awal, peta - 0,5-1 dtk
 *   pada CPU 4x lebih lambat); fade yang dimulai saat commit habis di dalamnya. WAAPI pada opacity
 *   berjalan di compositor (dicek di trace Chrome).
 */
export function usePageTransition(ref, pendingVisit) {
	useLayoutEffect(() => {
		if (pendingVisit || !arrivedFromSkeleton) return;
		arrivedFromSkeleton = false;
		window.dispatchEvent(new Event('resize'));

		const el = ref.current;
		if (!el?.animate) return;

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
	}, [pendingVisit, ref]);
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
