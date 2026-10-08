import { useSyncExternalStore } from 'react';

// Status notifikasi PERANGKAT INI (#182). Diisi AppLayout saat mendaftarkan token FCM, dibaca
// kartu "Notifikasi di HP ini" (Profil) & banner dashboard petugas/relawan. Disimpan di modul
// (bukan state komponen) supaya bertahan saat pindah halaman Inertia.
//
//   checking - aplikasi, token sedang diminta/didaftarkan
//   active   - aplikasi, token terdaftar di server
//   inactive - aplikasi, tapi token tak didapat atau gagal didaftarkan
//   browser  - bukan aplikasi Android/iOS; notifikasi HP tak berlaku di sini
//
// "active" berarti TERDAFTAR, bukan pasti berbunyi. Izin notifikasi Android ada di `notif`
// (APK 1.1.8+, AndroidBridge.getNotificationStatus): { enabled, blockedChannels }. Saat izinnya
// mati APK membuang notifikasi diam-diam padahal server & tombol uji melapor "terkirim"
// (keluhan 2026-10-08). `notif` null = APK lama tanpa fungsi itu -> tak diketahui, pakai tombol uji.

const isNativeApp = () => typeof navigator !== 'undefined' && /SisupitApp/i.test(navigator.userAgent || '');

let state = { status: isNativeApp() ? 'checking' : 'browser', token: null, notif: null };
const listeners = new Set();

export function setFcmDevice(patch) {
	state = { ...state, ...patch };
	listeners.forEach((listener) => listener());
}

// Baca ulang izin notifikasi dari APK. Dipanggil AppLayout saat jembatan terdeteksi, dan oleh
// APK sendiri (window.onNativeNotificationStatusChanged) tiap kembali ke aplikasi / sesudah
// dialog izin ditutup.
export function refreshNativeNotificationStatus() {
	const bridge = typeof window !== 'undefined' ? window.AndroidBridge : null;
	if (!bridge || typeof bridge.getNotificationStatus !== 'function') return;
	try {
		const parsed = JSON.parse(bridge.getNotificationStatus());
		setFcmDevice({
			notif: {
				enabled: parsed.enabled !== false,
				blockedChannels: Array.isArray(parsed.blockedChannels) ? parsed.blockedChannels : [],
			},
		});
	} catch {
		// Balasan rusak = anggap tak diketahui, jangan menakut-nakuti dengan "diblokir".
	}
}

// Tombol "Izinkan notifikasi": APK meminta izin atau membuka Setelan notifikasi aplikasi.
export function openNativeNotificationSettings() {
	window.AndroidBridge?.openNotificationSettings?.();
}

// Izin notifikasi HP ini bermasalah (APK 1.1.8+ saja): 'blocked' | 'channels' | null.
export function notificationProblem(device) {
	if (!device.notif) return null;
	if (!device.notif.enabled) return 'blocked';
	if (device.notif.blockedChannels.length > 0) return 'channels';
	return null;
}

const subscribe = (listener) => {
	listeners.add(listener);
	return () => listeners.delete(listener);
};

const serverSnapshot = { status: 'browser', token: null };

export function useFcmDevice() {
	return useSyncExternalStore(
		subscribe,
		() => state,
		() => serverSnapshot,
	);
}
