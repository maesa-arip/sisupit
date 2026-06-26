import { useEffect, useRef } from 'react';
import { GEO_OPTIONS } from '@/lib/utils';

const UserLeafletMap = ({ markers = [], lat = null, lng = null }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const userMarkerLayerRef = useRef(null);

    // ==========================================
    // EFFECT 1: INISIALISASI PETA AWAL
    // ==========================================
    useEffect(() => {
        if (!window.L || mapInstanceRef.current) return;

        // Inisialisasi awal
        mapInstanceRef.current = window.L.map(mapRef.current).setView([-8.65, 115.22], 13);
        
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap',
        }).addTo(mapInstanceRef.current);

        markersLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);
        userMarkerLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);

        const resizeObserver = new ResizeObserver(() => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.invalidateSize();
            }
        });

        if (mapRef.current) {
            resizeObserver.observe(mapRef.current);
        }

        return () => {
            resizeObserver.disconnect();
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // ==========================================
    // EFFECT 2: TRACKING LOKASI USER
    // ==========================================
    useEffect(() => {
        if (!window.L || !mapInstanceRef.current || !userMarkerLayerRef.current) return;

        const plotUserLocation = (userLat, userLng) => {
            userMarkerLayerRef.current.clearLayers();

            const userIcon = window.L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center text-destructive drop-shadow-md hover:scale-110 transition-transform">
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

            // FIX: Tambahkan { autoPan: false } agar popup tidak menggeser peta di layar mobile
            const marker = window.L.marker([userLat, userLng], { icon: userIcon })
                .addTo(userMarkerLayerRef.current);
                // .bindPopup('<b style="color: #b42826;">Lokasi Anda</b>', { autoPan: false });

            // Buka popup secara terprogram
            marker.openPopup();

            // FIX MOBILE: Gunakan panTo dengan delay 300ms. 
            // Waktu ini cukup untuk React merender DOM secara penuh di browser HP
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize(true);
                    mapInstanceRef.current.panTo([userLat, userLng], { animate: true, duration: 0.5 });
                }
            }, 300);
        };

        if (lat && lng) {
            plotUserLocation(parseFloat(lat), parseFloat(lng));
        } else if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    plotUserLocation(position.coords.latitude, position.coords.longitude);
                },
                (err) => console.warn('Gagal mendapatkan lokasi GPS (Leaflet):', err.message),
                GEO_OPTIONS.oneShot
            );
        }
    }, [lat, lng]);

    // ==========================================
    // EFFECT 3: RENDER MARKER ASET (Pompa / Pos)
    // ==========================================
    useEffect(() => {
        if (!window.L || !mapInstanceRef.current || !markersLayerRef.current) return;

        markersLayerRef.current.clearLayers();

        const createCustomIcon = (status, category) => {
            const isPosPemadam = category === 'pos_pemadam';
            const isAktif = status === 'Aktif';

            let bgColor, borderColor, arrowColor, fgColor, svgIcon;

            if (isPosPemadam) {
                bgColor = 'bg-destructive';
                borderColor = 'border-destructive/20';
                arrowColor = 'border-t-destructive';
                fgColor = 'text-destructive-foreground';
                svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
            } else {
                bgColor = isAktif ? 'bg-blue-600 dark:bg-info' : 'bg-orange-500 dark:bg-warning';
                borderColor = isAktif ? 'border-blue-200 dark:border-info/20' : 'border-orange-200 dark:border-warning/20';
                arrowColor = isAktif ? 'border-t-blue-600 dark:border-t-info' : 'border-t-orange-500 dark:border-t-warning';
                fgColor = isAktif ? 'text-white dark:text-info-foreground' : 'text-white dark:text-warning-foreground';
                svgIcon = isAktif
                    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path></svg>`
                    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
            }

            return window.L.divIcon({
                html: `
                    <div class="relative flex items-center justify-center w-10 h-10 rounded-md shadow-sm ${bgColor} border-2 ${borderColor} ${fgColor} transition-transform hover:scale-110">
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
                const lat = parseFloat(marker.lat);
                const lng = parseFloat(marker.lng);

                if (!isNaN(lat) && !isNaN(lng)) {
                    const customIcon = createCustomIcon(marker.status, marker.category);
                    const isPosPemadam = marker.category === 'pos_pemadam';
                    const titleColorClass = isPosPemadam ? 'text-destructive' : (marker.status === 'Aktif' ? 'text-blue-700 dark:text-info' : 'text-orange-700 dark:text-warning');
                    const labelText = isPosPemadam
                        ? `${marker.status} &bull; ${marker.vehicle_count} Armada`
                        : `${marker.status} &bull; ${marker.type || 'Pompa'}`;

                    window.L.marker([lat, lng], { icon: customIcon })
                        .addTo(markersLayerRef.current)
                        .bindPopup(`
                            <div style="font-family: sans-serif; min-width: 180px;">
                                <div class="${titleColorClass}" style="font-size: 10px; font-weight: bold; text-transform: uppercase;">
                                    ${labelText}
                                </div>
                                <h4 class="text-foreground" style="margin: 4px 0; font-size: 14px; font-weight: bold;">${marker.name}</h4>
                                <p class="text-muted-foreground" style="margin: 0; font-size: 12px; line-height: 1.4;">${marker.address}</p>
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
                minHeight: '200px', // Fallback tinggi minimum
                borderRadius: 'inherit',
                zIndex: 1,
                position: 'relative',
            }}
        ></div>
    );
};

export default UserLeafletMap;