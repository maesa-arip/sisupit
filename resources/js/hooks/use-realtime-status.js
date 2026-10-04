import { useEffect, useState } from 'react';

// Status koneksi WebSocket Reverb yang SEBENARNYA - pengganti titik "Sistem Online" yang dulu
// ditulis mati di dashboard admin dan tetap hijau walau Reverb tumbang. Broadcaster `reverb`
// memakai PusherConnector, jadi statusnya dibaca dari `connector.pusher.connection`.
//
// Nilai: 'connected' | 'connecting' | 'offline' | 'disabled' (window.Echo tak ada karena
// REVERB_APP_KEY belum di-set, lihat echo.js).
function normalize(state) {
	if (state === 'connected') return 'connected';
	if (state === 'connecting' || state === 'initialized') return 'connecting';
	return 'offline'; // unavailable, failed, disconnected
}

export default function useRealtimeStatus() {
	const connection = typeof window !== 'undefined' ? window.Echo?.connector?.pusher?.connection : null;
	const [status, setStatus] = useState(() => (connection ? normalize(connection.state) : 'disabled'));

	useEffect(() => {
		if (!connection) return;

		const onChange = ({ current }) => setStatus(normalize(current));
		connection.bind('state_change', onChange);
		setStatus(normalize(connection.state));

		return () => connection.unbind('state_change', onChange);
	}, [connection]);

	return status;
}
