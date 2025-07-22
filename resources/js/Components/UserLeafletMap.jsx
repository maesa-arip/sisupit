import { useEffect, useRef } from 'react';

const UserLeafletMap = () => {
	const mapRef = useRef(null);

	useEffect(() => {
		if (!window.L) {
			console.error('Leaflet belum dimuat dari CDN.');
			return;
		}

		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					console.log(position.coords);

					const map = window.L.map(mapRef.current).setView([latitude, longitude], 13);

					window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						attribution: '&copy; OpenStreetMap contributors',
					}).addTo(map);

					window.L.marker([latitude, longitude]).addTo(map).bindPopup('Lokasi Anda').openPopup();
				},
				(err) => {
					console.error('Gagal mendapatkan lokasi:', err);
				},
			);
		} else {
			alert('Geolocation tidak didukung browser ini');
		}
	}, []);

	return (
		<div>
			<h2>Peta Lokasi Anda</h2>
			<div
				id="map"
				ref={mapRef}
				style={{
					width: '100%',
					height: '500px',
					borderRadius: '5px',
					zIndex: 0,
					position: 'relative', // penting agar z-index berfungsi
				}}
			></div>
		</div>
	);
};

export default UserLeafletMap;
