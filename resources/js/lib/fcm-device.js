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
// "active" berarti TERDAFTAR, bukan pasti berbunyi: izin notifikasi yang dimatikan di Setelan
// Android tak terlihat dari web (APK membuang notifikasinya diam-diam). Itu gunanya tombol uji.

const isNativeApp = () => typeof navigator !== 'undefined' && /SisupitApp/i.test(navigator.userAgent || '');

let state = { status: isNativeApp() ? 'checking' : 'browser', token: null };
const listeners = new Set();

export function setFcmDevice(patch) {
	state = { ...state, ...patch };
	listeners.forEach((listener) => listener());
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
