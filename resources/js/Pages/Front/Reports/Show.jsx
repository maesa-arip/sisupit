import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
    IconMapPin, IconPhone, IconUser,
    IconFiretruck, IconUsersGroup, IconChevronLeft,
    IconRadar, IconX, IconAlertCircle, IconFileText, 
    IconZoomIn, IconShieldCheck, IconFlag, IconCheck,
    IconLoader2, IconTrash, IconMap
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

export default function ReportShow(props) {
    const auth = props.auth;
    const report = props.report;

    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const incidentMarkerRef = useRef(null);

    const [officerList, setOfficerList] = useState(report.officers || []);
    const [helperList, setHelperList] = useState(report.helpers || []);
    const [showImageModal, setShowImageModal] = useState(false);

    const [confirmApprove, setConfirmApprove] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);
    const [confirmResolve, setConfirmResolve] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);

    // Titik insiden bisa dikoreksi oleh responder yang sudah tiba (lihat handleConfirmCorrection)
    const [incidentLocation, setIncidentLocation] = useState({ lat: report.lat, lng: report.lng, address: report.address });
    const [isCorrectingMode, setIsCorrectingMode] = useState(false);
    const [pendingPosition, setPendingPosition] = useState(null);
    const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

    const userRoles = Array.isArray(auth.user?.role) ? auth.user.role : (auth.user?.role ? [auth.user.role] : []);
    const isStaffOrAdmin = userRoles.some(r => ['admin', 'superadmin', 'petugas'].includes(r));
    const isRelawan = userRoles.includes('relawan');

    useEffect(() => {
        setOfficerList(props.report.officers || []);
        setHelperList(props.report.helpers || []);
    }, [props.report]);

    const myOfficerRecord = officerList.find(o => o.user_id === auth.user.id);
    const myHelperRecord = helperList.find(h => h.user_id === auth.user.id);
    const myRecord = myOfficerRecord || myHelperRecord;
    const isCurrentlyResponding = myRecord && myRecord.status !== 'finished';

    // -----------------------------------------------------------------
    // KAMUS BAHASA & WARNA SEMANTIK (FLAT)
    // -----------------------------------------------------------------
    const getReportStatus = (status) => {
        switch(status) {
            case 'TERLAPOR': return { label: 'Laporan Masuk', color: 'bg-red-50 dark:bg-destructive/10 text-red-700 dark:text-destructive border-red-200 dark:border-destructive/20' };
            case 'pending': return { label: 'Menunggu Bantuan', color: 'bg-amber-50 dark:bg-warning/10 text-amber-700 dark:text-warning border-amber-200 dark:border-warning/20' };
            case 'handling': return { label: 'Dalam Penanganan', color: 'bg-blue-50 dark:bg-info/10 text-blue-700 dark:text-info border-blue-200 dark:border-info/20' };
            case 'resolved': return { label: 'Selesai', color: 'bg-emerald-50 dark:bg-success/10 text-emerald-700 dark:text-success border-emerald-200 dark:border-success/20' };
            default: return { label: status, color: 'bg-muted text-muted-foreground border-border' };
        }
    };

    const getResponderStatus = (status) => {
        switch(status) {
            case 'en_route': return { label: 'Meluncur', color: 'bg-amber-50 dark:bg-warning/10 text-amber-700 dark:text-warning border-amber-200 dark:border-warning/20' };
            case 'arrived': return { label: 'Tiba di Lokasi', color: 'bg-blue-50 dark:bg-info/10 text-blue-700 dark:text-info border-blue-200 dark:border-info/20' };
            case 'finished': return { label: 'Selesai Tugas', color: 'bg-muted text-muted-foreground border-border' };
            default: return { label: status, color: 'bg-muted text-muted-foreground border-border' };
        }
    };

    const currentStatus = getReportStatus(report.status);

    // -----------------------------------------------------------------
    // AKSI OPERASIONAL
    // -----------------------------------------------------------------
    const executeApprove = () => {
        setIsProcessing(true);
        router.post(route('reports.approve', report.id), {}, { 
            preserveScroll: true, onSuccess: () => { setConfirmApprove(false); toast.success('Sinyal darurat disiarkan!'); }, onFinish: () => setIsProcessing(false)
        });
    };

    const executeReject = () => {
        setIsProcessing(true);
        router.post(route('reports.destroy', report.id), { _method: 'DELETE' }, { 
            onSuccess: () => { setConfirmReject(false); toast.error('Laporan diarsipkan.'); }, onFinish: () => setIsProcessing(false)
        });
    };

    const handleTakeAction = () => {
        setIsActionLoading(true);
        router.post(route('reports.take-action', report.id), {}, { 
            preserveScroll: true, onSuccess: () => toast.success('Meluncur ke lokasi.'), onFinish: () => setIsActionLoading(false)
        });
    };

    const handleArrive = () => {
        setIsActionLoading(true);
        router.post(route('reports.arrive', report.id), {}, { 
            preserveScroll: true, onSuccess: () => toast.success('Status diperbarui: Tiba di lokasi.'), onFinish: () => setIsActionLoading(false)
        });
    };

    const executeResolve = () => {
        setIsActionLoading(true);
        router.post(route('reports.resolve', report.id), {}, {
            preserveScroll: true, onSuccess: () => { setConfirmResolve(false); toast.success('Insiden dinyatakan selesai.'); }, onFinish: () => setIsActionLoading(false)
        });
    };

    const handleCancelCorrection = () => {
        setIsCorrectingMode(false);
        setPendingPosition(null);
    };

    const handleConfirmCorrection = async () => {
        const target = pendingPosition || { lat: parseFloat(incidentLocation.lat), lng: parseFloat(incidentLocation.lng) };
        setIsSubmittingCorrection(true);

        let address = incidentLocation.address;
        try {
            const res = await axios.get(route('api.geocode.reverse'), { params: { lat: target.lat, lng: target.lng } });
            address = res.data?.display_name || address;
        } catch (e) {
            // Tetap lanjutkan dengan alamat lama jika reverse geocode gagal
        }

        router.post(route('reports.correct-location', report.id), { lat: target.lat, lng: target.lng, address }, {
            preserveScroll: true,
            onSuccess: () => {
                setIncidentLocation({ lat: target.lat, lng: target.lng, address });
                setIsCorrectingMode(false);
                setPendingPosition(null);
                toast.success('Lokasi insiden berhasil dikoreksi.');
            },
            onError: () => toast.error('Gagal mengoreksi lokasi insiden.'),
            onFinish: () => setIsSubmittingCorrection(false),
        });
    };

    useEffect(() => {
        if (!isCurrentlyResponding) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => axios.post(`/reports/${report.id}/update-location`, { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {}),
            (err) => console.error(err), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isCurrentlyResponding, report.id]);

    useEffect(() => {
        if (!mapRef.current || !window.L) return;
        if (!mapInstance.current) {
            const map = window.L.map(mapRef.current, { zoomControl: false }).setView([parseFloat(incidentLocation.lat), parseFloat(incidentLocation.lng)], 15);
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
            window.L.control.zoom({ position: 'topright' }).addTo(map);
            mapInstance.current = map;
        }

        const map = mapInstance.current;
        const boundsGroup = [];

        const dangerIcon = window.L.divIcon({
            html: `<div class="text-destructive ${report.status !== 'resolved' ? 'animate-pulse' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
            className: 'bg-transparent border-none', iconSize: [36, 36], iconAnchor: [16, 36],
        });

        if (incidentMarkerRef.current) incidentMarkerRef.current.remove();
        const incidentMarker = window.L.marker([parseFloat(incidentLocation.lat), parseFloat(incidentLocation.lng)], { icon: dangerIcon, draggable: isCorrectingMode }).addTo(map);
        if (isCorrectingMode) {
            incidentMarker.on('dragend', (e) => {
                const { lat, lng } = e.target.getLatLng();
                setPendingPosition({ lat, lng });
            });
        }
        incidentMarkerRef.current = incidentMarker;
        boundsGroup.push(incidentMarker);

        const renderMarker = (userId, name, type, latStr, lngStr) => {
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (isNaN(lat) || isNaN(lng)) return null;
            if (markersRef.current[userId]) markersRef.current[userId].remove();

            const iconEmoji = type === 'petugas' ? '🚒' : '🏃‍♂️';
            const iconColor = type === 'petugas' ? 'bg-destructive text-destructive-foreground' : 'bg-blue-600 dark:bg-info text-white dark:text-info-foreground';
            const htmlMarkup = `<div class="${iconColor} text-xs w-7 h-7 font-bold flex items-center justify-center rounded-full border-2 border-card shadow-none">${iconEmoji}</div>`;

            const marker = window.L.marker([lat, lng], {
                icon: window.L.divIcon({ html: htmlMarkup, className: 'bg-transparent border-none', iconSize: [28, 28], iconAnchor: [14, 14] })
            }).addTo(map).bindPopup(`<div class="text-xs font-bold">${name}</div>`);
            
            markersRef.current[userId] = marker;
            return marker;
        };

        officerList.forEach(o => { const m = renderMarker(o.user_id, o.user?.name, 'petugas', o.location_lat, o.location_lng); if (m) boundsGroup.push(m); });
        helperList.forEach(h => { const m = renderMarker(h.user_id, h.user?.name, 'relawan', h.location_lat, h.location_lng); if (m) boundsGroup.push(m); });

        if (boundsGroup.length > 0) map.fitBounds(new window.L.featureGroup(boundsGroup).getBounds().pad(0.3));

        let channel = null;
        if (window.Echo) {
            channel = window.Echo.private(`report-tracking.${report.id}`);
            channel.listen('ResponderLocationUpdated', (e) => {
                const { responderId, responderType, responderName, lat, lng } = e;
                if (responderType === 'petugas') {
                    setOfficerList(prev => prev.map(o => o.user_id === responderId ? { ...o, location_lat: lat, location_lng: lng } : o));
                } else {
                    setHelperList(prev => prev.map(h => h.user_id === responderId ? { ...h, location_lat: lat, location_lng: lng } : h));
                }
                renderMarker(responderId, responderName, responderType, lat, lng);
            });
            channel.listen('IncidentLocationCorrected', (e) => {
                setIncidentLocation({ lat: e.lat, lng: e.lng, address: e.address });
            });
        }
        return () => { if (channel) window.Echo.leave(`report-tracking.${report.id}`); };
    }, [report.id, incidentLocation.lat, incidentLocation.lng, report.status, officerList, helperList, isCorrectingMode]);

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <Head title={`Komando Insiden #${report.id}`} />

            {/* --- TOP BAR --- */}
            <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="w-9 h-9 border-border rounded-xl bg-card shadow-none" asChild>
                    <Link href="/dashboard"><IconChevronLeft className="w-5 h-5 text-muted-foreground" /></Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-bold tracking-tight text-foreground uppercase truncate sm:text-xl">{report.title}</h1>
                        <Badge variant="outline" className={cn("rounded-md font-bold px-2.5 py-0.5 shadow-none whitespace-nowrap", currentStatus.color)}>
                            {currentStatus.label}
                        </Badge>
                    </div>
                </div>
            </div>

            {/* --- 🛡️ PANEL VERIFIKASI --- */}
            {report.status === 'TERLAPOR' && isStaffOrAdmin && (
                <Card className="border border-border bg-card rounded-xl shadow-none">
                    <CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-muted text-foreground/80 rounded-lg mt-0.5 shrink-0">
                                <IconAlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Verifikasi Laporan Masuk</h3>
                                <p className="max-w-xl mt-1 text-xs leading-relaxed text-muted-foreground">
                                    Laporan ini belum divalidasi. Periksa bukti atau hubungi pelapor di <b>{report.phone}</b> sebelum menugaskan armada.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-4 md:pt-0 border-border">
                            <Button onClick={() => setConfirmReject(true)} variant="outline" className="w-full sm:w-auto border-border text-foreground/80 hover:bg-muted hover:text-foreground bg-card h-11 sm:h-10 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors">
                                <IconX className="w-4 h-4 mr-1.5" /> Tolak Data
                            </Button>
                            <Button onClick={() => setConfirmApprove(true)} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground h-11 sm:h-10 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-destructive">
                                <IconRadar className="w-4 h-4 mr-1.5" /> Broadcast Misi
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* --- LAYOUT SPLIT VIEW --- */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                
                {/* BLOK KIRI: DOKUMEN & MAP */}
                <div className="space-y-6 lg:col-span-2">
                    <Card className="border border-border rounded-xl shadow-none bg-card">
                        <CardHeader className="pb-3 border-b border-border flex flex-row items-center gap-2 p-4 bg-muted/50 rounded-t-xl overflow-hidden">
                            <IconFileText className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-sm font-bold text-foreground">Informasi Insiden</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-5 sm:p-5">

                            <div className="space-y-1.5 border-b border-border pb-4">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Judul Insiden:</div>
                                <div className="text-base sm:text-lg font-bold text-destructive leading-snug">{report.title}</div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                                <div className="space-y-1 p-3 bg-muted rounded-lg border border-border">
                                    <div className="font-medium text-muted-foreground">Pelapor</div>
                                    <div className="font-bold text-foreground flex items-center gap-1.5"><IconUser className="w-3.5 h-3.5 text-muted-foreground" /> {report.name}</div>
                                </div>
                                <div className="space-y-1 p-3 bg-muted rounded-lg border border-border">
                                    <div className="font-medium text-muted-foreground">Telepon</div>
                                    <a href={`tel:${report.phone}`} className="font-bold text-foreground hover:text-blue-600 dark:hover:text-info transition-colors flex items-center gap-1.5"><IconPhone className="w-3.5 h-3.5 text-muted-foreground" /> {report.phone}</a>
                                </div>

                                <div className="space-y-2 p-4 bg-muted rounded-lg border border-border sm:col-span-2">
                                    <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-[10px] uppercase tracking-widest mb-1">
                                        <IconMap className="w-3.5 h-3.5" /> Wilayah Administratif
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                                        <div><div className="text-muted-foreground text-[10px] mb-0.5">Provinsi</div><div className="font-bold text-foreground truncate">{report.province?.name || report.province_code || 'Bali'}</div></div>
                                        <div><div className="text-muted-foreground text-[10px] mb-0.5">Kabupaten/Kota</div><div className="font-bold text-foreground truncate">{report.city?.name || report.city_code || '-'}</div></div>
                                        <div><div className="text-muted-foreground text-[10px] mb-0.5">Kecamatan</div><div className="font-bold text-foreground truncate">{report.district?.name || report.district_code || '-'}</div></div>
                                        <div><div className="text-muted-foreground text-[10px] mb-0.5">Desa/Kelurahan</div><div className="font-bold text-foreground truncate">{report.village?.name || report.village_code || '-'}</div></div>
                                    </div>
                                </div>

                                <div className="space-y-1 p-3 bg-muted rounded-lg border border-border sm:col-span-2">
                                    <div className="font-medium text-muted-foreground">Alamat Presisi</div>
                                    <div className="font-bold text-foreground flex items-start gap-1.5 mt-1">
                                        <IconMapPin className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
                                        <span className="leading-relaxed">{incidentLocation.address}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 border-t border-border pt-4 mt-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Deskripsi Kejadian:</label>
                                <p className="text-sm text-foreground/80 leading-relaxed bg-card border border-border p-4 rounded-lg whitespace-pre-wrap">
                                    {report.description || '-'}
                                </p>
                            </div>

                            {report.photo && (
                                <div className="pt-2 space-y-2">
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lampiran Foto:</label>
                                    <div onClick={() => setShowImageModal(true)} className="relative border border-border rounded-lg overflow-hidden h-48 w-full max-w-sm bg-muted cursor-zoom-in group">
                                        <img src={`/storage/${report.photo}`} onError={(e) => e.target.src = report.photo} className="object-cover w-full h-full transition-all duration-300" alt="Bukti" />
                                        <div className="absolute inset-0 flex items-center justify-center transition-colors bg-black/5 group-hover:bg-black/40">
                                            <span className="bg-card/95 text-foreground px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <IconZoomIn className="w-4 h-4" /> Perbesar
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border border-border rounded-xl shadow-none h-[400px] relative">
                        <div className="absolute top-4 left-4 z-10 bg-card/95 px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 text-xs font-bold text-foreground shadow-none">
                            <IconRadar className={`w-4 h-4 text-destructive ${report.status !== 'resolved' ? 'animate-pulse' : ''}`} />
                            PETA DISPATCHER KOMANDO
                        </div>
                        <div ref={mapRef} className="w-full h-full z-0 bg-muted"></div>
                    </Card>
                </div>

                {/* BLOK KANAN: MANIFEST & KONTROL */}
                <div className="space-y-4">
                    
                    {report.status !== 'TERLAPOR' && (isRelawan || isStaffOrAdmin) && (
                        <Card className="border border-border bg-card shadow-none rounded-xl">
                            <CardContent className="p-4 space-y-4 sm:p-5">
                                <h2 className="text-xs font-black tracking-widest text-foreground uppercase flex items-center gap-1.5">
                                    <IconShieldCheck className="w-4 h-4 text-blue-600 dark:text-info" /> Panel Tindakan Anda
                                </h2>

                                {report.status === 'resolved' ? (
                                    <div className="flex items-center justify-center gap-2 p-3 text-xs font-bold text-center border rounded-lg bg-emerald-50 dark:bg-success/10 text-emerald-700 dark:text-success border-emerald-200 dark:border-success/20">
                                        <IconCheck className="w-4 h-4" /> INSIDEN SELESAI DITANGANI
                                    </div>
                                ) : (
                                    <>
                                        {/* 👇 TOMBOL TAKTIS (Dengan Warna Solid Semantik) 👇 */}
                                        {!myRecord ? (
                                            <Button onClick={handleTakeAction} disabled={isActionLoading} className="w-full h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-xs uppercase tracking-wider rounded-lg shadow-none flex items-center justify-center gap-2 transition-colors">
                                                {isActionLoading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <><IconFlag className="w-4 h-4" /> Meluncur ke Lokasi</>}
                                            </Button>
                                        ) : myRecord.status === 'en_route' ? (
                                            <Button onClick={handleArrive} disabled={isActionLoading} className="flex items-center justify-center w-full h-12 gap-2 text-xs font-bold tracking-wider text-white dark:text-info-foreground uppercase transition-colors bg-blue-600 dark:bg-info rounded-lg shadow-none hover:bg-blue-700 dark:hover:bg-info/90 animate-pulse">
                                                {isActionLoading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <><IconMapPin className="w-4 h-4" /> Tiba di Lokasi</>}
                                            </Button>
                                        ) : (
                                            <div className="p-3 text-xs font-bold text-center text-blue-700 dark:text-info border border-blue-200 dark:border-info/20 rounded-lg bg-blue-50 dark:bg-info/10">
                                                Anda Sedang di Lokasi.
                                            </div>
                                        )}

                                        {myRecord?.status === 'arrived' && !isCorrectingMode && (
                                            <Button onClick={() => setIsCorrectingMode(true)} variant="outline" className="flex items-center justify-center w-full h-11 gap-2 mt-2 text-xs font-bold tracking-wider uppercase transition-colors border-border text-foreground/80 hover:bg-muted rounded-lg shadow-none">
                                                <IconMapPin className="w-4 h-4" /> Koreksi Lokasi Insiden
                                            </Button>
                                        )}

                                        {myRecord?.status === 'arrived' && isCorrectingMode && (
                                            <div className="p-3 mt-2 space-y-2 text-xs border rounded-lg bg-amber-50 dark:bg-warning/10 border-amber-200 dark:border-warning/20 text-amber-800 dark:text-warning">
                                                <p className="font-bold leading-relaxed">Geser pin merah di peta ke lokasi insiden yang sebenarnya, lalu konfirmasi.</p>
                                                <div className="flex gap-2 pt-1">
                                                    <Button onClick={handleCancelCorrection} variant="outline" className="flex-1 h-9 border-border bg-card text-foreground/80">Batal</Button>
                                                    <Button onClick={handleConfirmCorrection} disabled={isSubmittingCorrection} className="flex-1 h-9 font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                        {isSubmittingCorrection ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Konfirmasi Lokasi'}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {isStaffOrAdmin && (
                                            <Button onClick={() => setConfirmResolve(true)} variant="outline" className="w-full h-12 mt-2 text-xs font-bold tracking-wider uppercase transition-colors rounded-lg shadow-none text-emerald-700 dark:text-success border-emerald-200 dark:border-success/30 hover:bg-emerald-50 dark:hover:bg-success/10">
                                                Tandai Insiden Selesai
                                            </Button>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <h2 className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-1 pt-2">Manifes Responden</h2>

                    <Card className="border border-border rounded-xl shadow-none bg-card">
                        <CardContent className="p-0 divide-y divide-border">
                            <div className="p-3 bg-muted text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <IconFiretruck className="w-4 h-4" /> Damkar
                            </div>
                            {officerList.length > 0 ? officerList.map((officer) => {
                                const stat = getResponderStatus(officer.status);
                                return (
                                    <div key={officer.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex-1 min-w-0 font-bold text-foreground truncate">{officer.user?.name}</div>
                                        <Badge className={cn("rounded-md px-2 py-0.5 font-bold uppercase text-[9px] shadow-none border", stat.color)}>
                                            {stat.label}
                                        </Badge>
                                    </div>
                                );
                            }) : <div className="p-4 text-xs text-center text-muted-foreground">-</div>}

                            <div className="p-3 bg-muted text-xs font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <IconUsersGroup className="w-4 h-4" /> Relawan Sipil
                            </div>
                            {helperList.length > 0 ? helperList.map((helper) => {
                                const stat = getResponderStatus(helper.status);
                                return (
                                    <div key={helper.id} className="p-3.5 flex items-center justify-between gap-3 text-xs">
                                        <div className="flex-1 min-w-0 font-bold text-foreground truncate">{helper.user?.name}</div>
                                        <Badge className={cn("rounded-md px-2 py-0.5 font-bold uppercase text-[9px] shadow-none border", stat.color)}>
                                            {stat.label}
                                        </Badge>
                                    </div>
                                );
                            }) : <div className="p-4 text-xs text-center text-muted-foreground">-</div>}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* MODALS */}
            <Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
                <DialogContent className="max-w-sm bg-card rounded-xl p-6 border border-border shadow-none">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 text-blue-600 dark:text-info rounded-full bg-blue-50 dark:bg-info/10">
                            <IconRadar className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Broadcast Darurat?</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">Aksi ini memicu notifikasi ke seluruh personil aktif di area tersebut.</p>
                        <div className="flex w-full gap-3 mt-2 pt-4 border-t border-border">
                            <Button onClick={() => setConfirmApprove(false)} variant="outline" className="flex-1 h-10 border-border text-foreground/80 shadow-none bg-transparent">Batal</Button>
                            <Button onClick={executeApprove} className="flex-1 h-10 font-bold text-white dark:text-info-foreground bg-blue-600 dark:bg-info shadow-none hover:bg-blue-700 dark:hover:bg-info/90" disabled={isProcessing}>
                                {isProcessing ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Ya, Siarkan'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmReject} onOpenChange={setConfirmReject}>
                <DialogContent className="max-w-sm bg-card rounded-xl p-6 border border-border shadow-none">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 text-red-600 dark:text-destructive rounded-full bg-red-50 dark:bg-destructive/10">
                            <IconTrash className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Tolak Laporan?</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">Data akan ditandai sebagai hoax dan diarsipkan dari sistem.</p>
                        <div className="flex w-full gap-3 mt-2 pt-4 border-t border-border">
                            <Button onClick={() => setConfirmReject(false)} variant="outline" className="flex-1 h-10 border-border text-foreground/80 shadow-none bg-transparent">Batal</Button>
                            <Button onClick={executeReject} className="flex-1 h-10 font-bold text-white dark:text-destructive-foreground bg-red-600 dark:bg-destructive shadow-none hover:bg-red-700 dark:hover:bg-destructive/90" disabled={isProcessing}>
                                {isProcessing ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Ya, Tolak'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={confirmResolve} onOpenChange={setConfirmResolve}>
                <DialogContent className="max-w-sm bg-card rounded-xl p-6 border border-border shadow-none">
                    <div className="flex flex-col items-center space-y-4 text-center">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 dark:bg-success/10 text-emerald-600 dark:text-success">
                            <IconCheck className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-foreground">Tutup Insiden?</h2>
                        <p className="text-sm leading-relaxed text-muted-foreground">Laporan ditandai selesai. Seluruh personil di lapangan akan dihentikan penugasannya.</p>
                        <div className="flex w-full gap-3 mt-2 pt-4 border-t border-border">
                            <Button onClick={() => setConfirmResolve(false)} variant="outline" className="flex-1 h-10 border-border text-foreground/80 shadow-none bg-transparent">Batal</Button>
                            <Button onClick={executeResolve} className="flex-1 h-10 font-bold text-white dark:text-success-foreground shadow-none bg-emerald-600 dark:bg-success hover:bg-emerald-700 dark:hover:bg-success/90" disabled={isActionLoading}>
                                {isActionLoading ? <IconLoader2 className="w-4 h-4 animate-spin" /> : 'Ya, Selesaikan'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent className="max-w-4xl w-[95vw] md:w-full p-0 bg-transparent border-none shadow-none flex justify-center items-center [&>button]:hidden outline-none">
                    <div className="relative inline-flex items-center justify-center w-full h-full">
                        <button onClick={() => setShowImageModal(false)} className="absolute z-50 flex items-center justify-center w-10 h-10 text-foreground bg-card hover:bg-muted rounded-full top-2 right-2 border border-border shadow-none"><IconX size={20} /></button>
                        <img src={`/storage/${report.photo}`} onError={(e) => e.target.src = report.photo} className="w-auto h-auto max-w-[100vw] max-h-[90vh] object-contain rounded-md shadow-none border border-border bg-black/20" alt="Bukti" />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
ReportShow.layout = (page) => <AppLayout children={page} title="Pusat Kendali Operasional" />;