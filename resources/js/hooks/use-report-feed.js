import { useEffect, useRef } from 'react';

// Jeda sebelum bereaksi. Satu insiden bisa memicu beberapa siaran beruntun (laporan masuk →
// diverifikasi → responder pertama meluncur), dan tiap dashboard yang terbuka akan menjawab
// tiap siaran dengan satu request. Menunggu sebentar membuat rentetan itu jadi SATU
// pemuatan ulang, bukan tiga.
const DEBOUNCE_MS = 1000;

/**
 * Dengarkan aba-aba "feed laporan wilayah ini berubah", lalu jalankan `onChange`.
 *
 * Yang DIDENGAR cuma aba-aba: siarannya hanya berisi id + status (lihat ReportFeedChanged),
 * dan penerimanya satu wilayah penuh. Karena itu hook ini SENGAJA tidak menyusun data dari
 * isi siaran — tiap halaman menjawabnya dengan memuat ulang prop dari server, sehingga
 * penyaringan wilayah, scope Tenantable, dan bentuk datanya tetap dihitung di sana. Menyalin
 * logika itu ke sisi klien berarti dua sumber kebenaran untuk "apa yang boleh saya lihat".
 *
 * Apa yang dimuat ulang berbeda tiap dashboard, jadi itu keputusan halaman — hook ini hanya
 * memegang langganan channel dan jedanya.
 *
 * @param {string|null|undefined} channel  Nama channel dari prop `feed_channel` (server yang
 *   menentukan, lihat User::reportFeedChannel). Null = tak ada yang perlu didengar.
 * @param {() => void} onChange  Dipanggil setelah jeda saat feed berubah.
 */
export default function useReportFeed(channel, onChange) {
	// `onChange` adalah fungsi baru tiap render; dibaca lewat ref supaya effect di bawah tidak
	// berlangganan-ulang tiap render (yang berarti memutus & menyambung WebSocket berkali-kali).
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;

	useEffect(() => {
		// window.Echo tidak ada bila REVERB_APP_KEY belum di-set di server (lihat echo.js) —
		// halaman tetap berfungsi, hanya tidak memperbarui dirinya sendiri.
		if (!channel || !window.Echo) return;

		let timer = null;
		const subscription = window.Echo.private(channel);

		subscription.listen('ReportFeedChanged', () => {
			clearTimeout(timer);
			timer = setTimeout(() => onChangeRef.current(), DEBOUNCE_MS);
		});

		return () => {
			clearTimeout(timer);
			window.Echo.leave(channel);
		};
	}, [channel]);
}
