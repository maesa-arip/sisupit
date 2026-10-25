import { useEffect, useState } from 'react';

// Aplikasi desktop Windows (Sisupit Desktop, Electron). Dikenali dari JEMBATANNYA, bukan dari
// navigator.userAgent: exe sengaja membersihkan UA-nya supaya login Google tidak ditolak
// sebagai embedded browser, jadi di JS ia tampak seperti Chrome biasa. `window.sisupitDesktop`
// dipasang preload exe sejak 1.0.2 (#220). Server mengenalinya lewat token UA `SisupitDesktop`
// yang exe 1.0.3+ tambahkan HANYA di request ke Sisupit (helper isNativeApp() di PHP).
export function isDesktopApp() {
	return typeof window !== 'undefined' && !!window.sisupitDesktop;
}

// Aplikasi apa pun milik Sisupit: wrapper Android/iOS (UA ∋ SisupitApp) atau exe desktop.
// Dipakai untuk menyembunyikan ajakan "Unduh Aplikasi Android" dan kotak "Ingat saya".
export function isSisupitApp() {
	return isDesktopApp() || (typeof navigator !== 'undefined' && /SisupitApp/i.test(navigator.userAgent || ''));
}

// Status notifikasi exe desktop untuk kartu Profil & banner dashboard. Desktop tidak memakai FCM:
// main process exe berlangganan channel Reverb akun yang sedang masuk, dan `state` di sini adalah
// keadaan langganan itu (src/realtime.js di SisupitDesktop): 'aktif' = channel diterima server.
//   null                      - bukan desktop
//   { bridge: false }         - exe lama (1.0.2) tanpa notificationStatus: status tak diketahui
//   { bridge: true, state, supported }
const DESKTOP_GAGAL = ['terputus', 'otorisasi gagal', 'ditolak server'];

export function desktopNotifFailed(desktop) {
	return !!desktop?.bridge && (desktop.supported === false || DESKTOP_GAGAL.includes(desktop.state));
}

export function useDesktopNotificationStatus() {
	const [status, setStatus] = useState(null);

	useEffect(() => {
		if (!isDesktopApp()) return undefined;
		const bridge = window.sisupitDesktop;
		if (typeof bridge.notificationStatus !== 'function') {
			setStatus({ bridge: false });
			return undefined;
		}

		let alive = true;
		const read = () =>
			Promise.resolve(bridge.notificationStatus())
				.then((s) => alive && setStatus({ bridge: true, state: s?.state ?? null, supported: s?.supported }))
				.catch(() => alive && setStatus({ bridge: true, state: null }));
		read();
		// Langganan berubah sendiri (sambung ulang, sesudah login) - cukup dibaca ulang berkala.
		const timer = setInterval(read, 5000);

		return () => {
			alive = false;
			clearInterval(timer);
		};
	}, []);

	return status;
}
