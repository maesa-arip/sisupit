import axios from 'axios';

// Jaring pengaman TASK_73: bila aplikasi Android/iOS menampilkan halaman dalam keadaan TAMU,
// token FCM perangkat ini dilepas dari server. Aturannya jadi pasti: layar masuk = tidak ada
// notifikasi, apa pun sebab ia keluar (sesi dicabut, sandi direset, "Keluar dari semua
// perangkat" di HP lain). Pasangannya: AppLayout mendaftarkan token lagi begitu login.
//
// Sekali per periode tamu - berhenti meminta sampai pengguna masuk lalu keluar lagi.
let sudahDilepas = false;

export function releaseFcmTokenIfGuest(page) {
	if (typeof window === 'undefined') return;

	if (page?.props?.auth?.user) {
		sudahDilepas = false;
		return;
	}

	if (sudahDilepas) return;
	sudahDilepas = true;

	// Jembatan native bisa belum terpasang saat halaman pertama dimuat - polanya sama dengan
	// AppLayout: cek tiap 500 ms, menyerah setelah 15 dtk (browser biasa tak pernah punya).
	const mulai = Date.now();
	const coba = () => {
		const bridge = window.AndroidBridge;
		if (bridge && typeof bridge.postToken === 'function') {
			// Callback yang sama dipakai AppLayout; begitu pengguna masuk, AppLayout memasang
			// miliknya sendiri (mendaftarkan, bukan melepas). Balasan native yang telat sampai
			// sesudah login ditolak rute ini (middleware guest), jadi tak pernah melepas token
			// pengguna yang baru masuk.
			window.receiveFcmTokenFromNative = (token) => {
				if (!token) return;
				axios.post(route('fcm.release'), { token }).catch(() => {
					// Best-effort: gagal melepas tidak boleh mengganggu halaman tamu.
				});
			};
			bridge.postToken('');
			return;
		}
		if (Date.now() - mulai < 15000) setTimeout(coba, 500);
	};
	coba();
}
