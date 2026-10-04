// Posisi perangkat saat tombol Meluncur / Jaga di Kantor ditekan (TASK_66). Ditunggu SEBENTAR
// lalu tombol tetap jalan tanpa lokasi - aksi darurat tak boleh tertahan GPS. Penjaga waktu
// kedua ada karena getCurrentPosition bisa tak pernah memanggil balik selama prompt izin
// lokasi WebView belum dijawab. Dipakai halaman detail & dashboard petugas (TASK_72).
export const getClickLocation = () =>
	new Promise((resolve) => {
		if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve({});
		const guard = setTimeout(() => resolve({}), 4000);
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				clearTimeout(guard);
				resolve({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
					accuracy: Math.round(pos.coords.accuracy),
				});
			},
			() => {
				clearTimeout(guard);
				resolve({});
			},
			{ enableHighAccuracy: true, timeout: 3000, maximumAge: 30000 },
		);
	});
