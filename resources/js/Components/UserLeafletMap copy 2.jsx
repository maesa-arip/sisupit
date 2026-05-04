import { useEffect, useRef } from 'react';

// PERBAIKAN 1: Tambahkan props lat dan lng
const UserLeafletMap = ({ markers = [], lat, lng }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userPinRef = useRef(null); // State referensi baru khusus untuk Pin Merah Pelapor

    // ==========================================
    // EFFECT 1: INISIALISASI PETA AWAL (Hanya Jalan 1x)
    // ==========================================
    useEffect(() => {
        if (!window.L || mapInstanceRef.current) return;

        // Default view di Bali (-8.65, 115.22)
        mapInstanceRef.current = window.L.map(mapRef.current).setView([-8.65, 115.22], 13);
        
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current);

        markersLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);

        // CATATAN: navigator.geolocation DIHAPUS dari sini karena sudah di-handle oleh Create.jsx

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // ==========================================
    // EFFECT 2: AUTO-CENTER & UPDATE PIN MERAH PELAPOR
    // ==========================================
    useEffect(() => {
        // Hanya eksekusi jika peta sudah siap dan lat/lng sudah dikirim dari Create.jsx
        if (!window.L || !mapInstanceRef.current || !lat || !lng) return;

        const currentLat = parseFloat(lat);
        const currentLng = parseFloat(lng);

        if (isNaN(currentLat) || isNaN(currentLng)) return;

        // 1. Animasi terbang ke lokasi (Auto-Center)
        // Zoom level 17 agar cukup dekat untuk melihat jalan
        mapInstanceRef.current.flyTo([currentLat, currentLng], 17, {
            animate: true,
            duration: 1.5
        });

        // 2. Buat atau Geser Pin Merah
        if (!userPinRef.current) {
            // Jika pin belum ada, buat baru
            const userIcon = window.L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center text-red-600 drop-shadow-md hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        </svg>
                    </div>
                `,
                className: 'bg-transparent border-none',
                iconSize: [36, 36],
                iconAnchor: [18, 36],
                popupAnchor: [0, -36],
            });

            userPinRef.current = window.L.marker([currentLat, currentLng], { icon: userIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup('<b>Titik Laporan Anda</b>')
                .openPopup(); // Otomatis buka popup saat pertama kali muncul
        } else {
            // Jika pin sudah ada (misal user reset GPS), cukup geser posisinya
            userPinRef.current.setLatLng([currentLat, currentLng]);
        }

    }, [lat, lng]); // Effect ini akan jalan ulang setiap kali lat/lng berubah

    // ==========================================
    // EFFECT 3: RENDER MARKER (Otomatis bedakan Pompa & Pos)
    // ==========================================
    useEffect(() => {
        if (!window.L || !mapInstanceRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();

        const createCustomIcon = (status, category) => {
            const isPosPemadam = category === 'pos_pemadam';
            const isAktif = status === 'Aktif';

            let bgColor, borderColor, arrowColor, svgIcon;

            if (isPosPemadam) {
                bgColor = 'bg-red-600';
                borderColor = 'border-red-200';
                arrowColor = 'border-t-red-600';
                svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
            } else {
                bgColor = isAktif ? 'bg-blue-600' : 'bg-orange-500';
                borderColor = isAktif ? 'border-blue-200' : 'border-orange-200';
                arrowColor = isAktif ? 'border-t-blue-600' : 'border-t-orange-500';
                svgIcon = isAktif 
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
            }

            return window.L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center w-10 h-10 rounded-full shadow-md ${bgColor} border-2 ${borderColor} text-white transition-transform hover:scale-110">
                        ${svgIcon}
                    </div>
                    <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${arrowColor}"></div>
                `,
                className: 'bg-transparent border-none',
                iconSize: [40, 48],
                iconAnchor: [20, 48],
                popupAnchor: [0, -48],
            });
        };

        if (markers && markers.length > 0) {
            markers.forEach((marker) => {
                const markerLat = parseFloat(marker.lat);
                const markerLng = parseFloat(marker.lng);

                if (!isNaN(markerLat) && !isNaN(markerLng)) {
                    const customIcon = createCustomIcon(marker.status, marker.category);
                    
                    const isPosPemadam = marker.category === 'pos_pemadam';
                    const titleColor = isPosPemadam ? '#dc2626' : (marker.status === 'Aktif' ? '#1d4ed8' : '#c2410c');
                    const labelText = isPosPemadam 
                        ? `${marker.status} &bull; ${marker.vehicle_count} Armada` 
                        : `${marker.status} &bull; ${marker.type || 'Pompa'}`;

                    window.L.marker([markerLat, markerLng], { icon: customIcon })
                        .addTo(markersLayerRef.current)
                        .bindPopup(`
                            <div style="font-family: sans-serif; min-width: 180px;">
                                <div style="font-size: 10px; font-weight: bold; color: ${titleColor}; text-transform: uppercase;">
                                    ${labelText}
                                </div>
                                <h4 style="margin: 4px 0; font-size: 14px; font-weight: bold;">${marker.name}</h4>
                                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${marker.address}</p>
                            </div>
                        `);
                }
            });
        }

    }, [markers]);

    return (
        <div
            ref={mapRef}
            style={{
                width: '100%',
                height: '100%',
                // Hapus minHeight: '400px' agar peta sepenuhnya patuh pada wadah (container) di Create.jsx
                borderRadius: 'inherit',
                zIndex: 1,
                position: 'relative',
            }}
        ></div>
    );
};

export default UserLeafletMap;