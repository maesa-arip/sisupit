import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { 
    IconFlame, IconFiretruck, IconUsersGroup, IconDroplet,
    IconArrowRight, IconMapPin, IconClock, IconCheck,
    IconAlertCircle, IconShieldCheck, IconMaximize,
    IconChevronRight, IconTree, IconBug, IconBolt,
    IconUserShield
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

export default function AdminDashboard({ auth, stats, recentReports, mapMarkers = [], activeIncidents = [], isPejabat = false }) {
    
    const miniMapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    const defaultLat = -8.650000;
    const defaultLng = 115.216667;
    const isTopLevelAdmin = !auth?.user?.city_code;

    useEffect(() => {
        if (!miniMapRef.current || !window.L) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const allMarkers = [];
        const map = window.L.map(miniMapRef.current, { 
            zoomControl: false,
            scrollWheelZoom: false,
            dragging: !window.L.Browser.mobile,
            tap: !window.L.Browser.mobile
        }).setView([defaultLat, defaultLng], 13);

        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
        mapInstanceRef.current = map;

        mapMarkers.forEach(facility => {
            const lat = parseFloat(facility.lat);
            const lng = parseFloat(facility.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const facilityIcon = window.L.divIcon({
                html: `<div class="text-teal-600"><svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
                className: 'bg-transparent border-none drop-shadow-sm',
                iconSize: [26, 26],
                iconAnchor: [13, 26],
            });

            const marker = window.L.marker([lat, lng], { icon: facilityIcon }).addTo(map)
                .bindPopup(`<div class="text-xs font-bold font-sans">${facility.name}</div>`);
            allMarkers.push(marker);
        });

        activeIncidents.forEach(incident => {
            const lat = parseFloat(incident.lat);
            const lng = parseFloat(incident.lng);
            if (isNaN(lat) || isNaN(lng)) return;

            const incidentIcon = window.L.divIcon({
                html: `<div class="text-[#b42826] animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
                className: 'bg-transparent border-none filter drop-shadow-md',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
            });

            const marker = window.L.marker([lat, lng], { icon: incidentIcon }).addTo(map)
                .bindPopup(`<div class="text-xs font-bold text-[#b42826] font-sans">⚠️ DARURAT: ${incident.title}</div>`);
            allMarkers.push(marker);
        });

        if (allMarkers.length > 0) {
            const group = new window.L.featureGroup(allMarkers);
            map.fitBounds(group.getBounds().pad(0.3));
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [mapMarkers, activeIncidents]);

    const getAdminLevelName = () => {
        if (auth?.user?.village_code) return `Desa/Kelurahan`;
        if (auth?.user?.district_code) return `Kecamatan`;
        if (auth?.user?.city_code) return `Kabupaten/Kota`;
        if (auth?.user?.province_code) return `Provinsi`;
        return 'Pusat (Nasional)';
    };

    const currentStats = stats || { active_reports: 0, standby_helpers: 0, active_hydrants: 0, resolved_this_month: 0 };
    const reports = recentReports || [];

    const StatCard = ({ title, value, icon: Icon, colorClass, bgIconClass, subtitle, isCritical = false }) => {
        const hasEmergency = isCritical && value > 0;
        return (
            <Card className={cn(
                "shadow-sm border transition-all rounded-xl",
                hasEmergency 
                    ? "border-red-500 bg-[#b42826] text-white animate-in zoom-in-95 duration-500 shadow-red-500/20" 
                    : "border-border bg-white dark:bg-[#151515] hover:border-border/80"
            )}>
                <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1.5">
                            <p className={cn("text-sm font-medium", hasEmergency ? "text-red-100" : "text-muted-foreground")}>{title}</p>
                            <div className={cn("text-3xl font-extrabold tracking-tight", hasEmergency ? "text-white" : "text-foreground")}>{value}</div>
                        </div>
                        <div className={cn("p-3.5 rounded-2xl", hasEmergency ? "bg-white/20" : bgIconClass)}>
                            <Icon className={cn("w-6 h-6", hasEmergency ? "text-white" : colorClass)} stroke={2} />
                        </div>
                    </div>
                    {subtitle && (
                        <div className={cn("mt-4 text-[11px] font-semibold uppercase tracking-wider", hasEmergency ? "text-red-200" : "text-muted-foreground")}>
                            {subtitle}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    const StatusBadge = ({ status }) => {
        const variants = {
            pending: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent", label: "Menunggu", icon: IconAlertCircle },
            handling: { className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-transparent", label: "Penanganan", icon: IconFiretruck },
            resolved: { className: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-transparent", label: "Selesai", icon: IconCheck },
            TERLAPOR: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-transparent animate-pulse", label: "Terlapor", icon: IconAlertCircle },
        };
        const active = variants[status] || variants.pending;
        const Icon = active.icon;
        return (
            <Badge variant="outline" className={cn("flex items-center gap-1.5 shadow-none font-semibold px-2.5 py-0.5", active.className)}>
                <Icon className="w-3.5 h-3.5" stroke={2.5} /> {active.label}
            </Badge>
        );
    };

    return (
        <div className="w-full h-full pb-10 space-y-6 lg:space-y-8">
            <Head title={isPejabat ? "Dashboard Eksekutif" : "Pusat Komando"} />

            {/* HEADER SECTION */}
            <div className="flex flex-col items-start justify-between gap-4 p-5 bg-white border shadow-sm md:flex-row md:items-center dark:bg-[#151515] sm:p-6 rounded-2xl border-border">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                        Halo, {auth.user.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className={cn("border-none px-2 py-0.5 rounded-md font-semibold", isPejabat ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-[#b42826]/10 text-[#b42826] dark:bg-[#e54845]/10 dark:text-[#e54845]")}>
                            <IconShieldCheck className="w-3.5 h-3.5 mr-1" stroke={2.5} /> {isPejabat ? 'Pejabat/Eksekutif' : 'Administrator'}
                        </Badge>
                        <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                            <IconMapPin className="w-4 h-4 text-teal-600" />
                            Yurisdiksi: <strong className="text-foreground">{getAdminLevelName()}</strong>
                        </span>
                    </div>
                </div>
                <div className="flex items-center w-full gap-3 pt-4 border-t md:w-auto md:pt-0 md:border-t-0 border-border">
                    <div className="hidden mr-2 text-right lg:block">
                        <div className="text-sm font-bold text-foreground">
                            {new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs font-medium text-teal-600 dark:text-teal-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span> Sistem Online
                        </div>
                    </div>
                    <Button className="w-full bg-foreground text-background hover:bg-foreground/90 rounded-xl md:w-auto" asChild>
                        <Link href="/reports/create"><IconAlertCircle className="w-4 h-4 mr-2" /> Input Insiden Manual</Link>
                    </Button>
                </div>
            </div>

            {/* KARTU STATISTIK */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Darurat Aktif" value={currentStats.active_reports} icon={IconFlame} colorClass="text-[#b42826] dark:text-[#e54845]" bgIconClass="bg-[#b42826]/10 dark:bg-[#e54845]/10" subtitle="Membutuhkan Respons" isCritical={true} />
                <StatCard title="Relawan Standby" value={currentStats.standby_helpers} icon={IconUsersGroup} colorClass="text-blue-600 dark:text-blue-400" bgIconClass="bg-blue-50 dark:bg-blue-900/30" subtitle="Terverifikasi di Area" />
                <StatCard title="Hydrant Siaga" value={currentStats.active_hydrants} icon={IconDroplet} colorClass="text-teal-600 dark:text-teal-400" bgIconClass="bg-teal-50 dark:bg-teal-900/30" subtitle="Sumber Air Aktif" />
                <StatCard title="Total Penanganan" value={currentStats.resolved_this_month} icon={IconCheck} colorClass="text-emerald-600 dark:text-emerald-400" bgIconClass="bg-emerald-50 dark:bg-emerald-900/30" subtitle="Bulan Ini" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                
                {/* KIRI: LAPORAN TERBARU */}
                <Card className="flex flex-col overflow-hidden shadow-sm lg:col-span-2 border-border rounded-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 bg-white border-b dark:bg-[#151515]">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-bold text-foreground">Laporan Insiden Terbaru</CardTitle>
                            <CardDescription className="text-[13px]">Pemantauan waktu nyata dari masyarakat & relawan.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex shadow-sm border-border font-medium bg-white hover:bg-gray-50 dark:bg-[#151515] dark:hover:bg-[#1f1f1f] rounded-lg" asChild>
                            <Link href={route('front.reports.index')}> Lihat Semua Riwayat </Link>
                            {/* <Link href={route('admin.reports.index')}>Lihat Semua <IconArrowRight className="w-4 h-4 ml-2" /></Link> */}
                        </Button>
                    </CardHeader>
                    
                    <CardContent className="p-0 flex-1 bg-gray-50/50 dark:bg-[#101010]/50">
                        <div className="flex flex-col divide-y divide-border">
                            {reports.map((report) => {
                                const t = report.title.toLowerCase();
                                let ReportIcon = IconFlame;
                                let colorStyle = "text-[#b42826] dark:text-[#e54845] bg-[#b42826]/10 dark:bg-[#e54845]/10";
                                
                                if (t.includes('pohon')) { ReportIcon = IconTree; colorStyle = "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30"; }
                                else if (t.includes('hewan') || t.includes('ular') || t.includes('tawon')) { ReportIcon = IconBug; colorStyle = "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"; }
                                else if (t.includes('listrik') || t.includes('korsleting')) { ReportIcon = IconBolt; colorStyle = "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"; }

                                return (
                                    <Link key={report.id} href={route('reports.show', report.id)}>
                                    <div key={report.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-white dark:hover:bg-[#1a1a1a] transition-all duration-200">
                                        <Link href={`/admin/reports`} className="absolute inset-0 z-0"></Link>
                                        <div className="relative z-10 flex items-start w-full gap-4 overflow-hidden sm:w-auto">
                                            <div className={cn("p-2.5 rounded-xl shrink-0 mt-0.5", colorStyle)}>
                                                <ReportIcon className="w-5 h-5" stroke={2} />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="font-bold text-foreground text-[15px] truncate group-hover:text-[#b42826] dark:group-hover:text-[#e54845] transition-colors">{report.title}</h4>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 mt-1 text-xs font-medium text-muted-foreground">
                                                    <span className="flex items-center gap-1.5 truncate"><IconMapPin className="w-3.5 h-3.5 shrink-0" stroke={2} /><span className="truncate">{report.location}</span></span>
                                                    <span className="hidden text-border sm:inline">•</span>
                                                    <span className="flex items-center gap-1.5 shrink-0 text-gray-500 dark:text-gray-400"><IconClock className="w-3.5 h-3.5 shrink-0" stroke={2} />{report.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 relative z-10 mt-3.5 pt-3.5 sm:mt-0 sm:pt-0 border-t border-border sm:border-0">
                                            <StatusBadge status={report.status} />
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent text-gray-400 group-hover:bg-red-50 group-hover:text-[#b42826] dark:group-hover:bg-[#2a1313] dark:group-hover:text-[#e54845] transition-all">
                                                <IconChevronRight className="w-5 h-5" stroke={2} />
                                            </div>
                                        </div>
                                    </div></Link>
                                );
                            })}
                            {reports.length === 0 && (
                                <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                                    <div className="w-12 h-12 mb-3 rounded-full bg-white dark:bg-[#1f1f1f] border border-border flex items-center justify-center shadow-sm">
                                        <IconCheck className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-semibold text-foreground">Tidak ada laporan insiden</p>
                                    <p className="mt-1 text-xs text-muted-foreground">Wilayah Anda saat ini aman terkendali.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                    <div className="block p-3 bg-white border-t sm:hidden border-border dark:bg-[#151515]">
                        <Button variant="outline" className="w-full text-xs rounded-lg" asChild>
                            <Link href={route('front.reports.index')}> Lihat Semua Riwayat </Link>
                            {/* <Link href={route('admin.reports.index')}>Lihat Semua Laporan</Link> */}
                        </Button>
                    </div>
                </Card>

                {/* KANAN: MAP FIRST & DYNAMIC BENTO GRID ACTIONS */}
                <div className="flex flex-col gap-6">
                    <Card className={cn(
                        "shadow-sm border-border overflow-hidden flex flex-col relative group rounded-xl",
                        isPejabat ? "h-full min-h-[350px]" : "h-[320px] sm:h-[350px]"
                    )}>
                        <CardHeader className="absolute top-0 left-0 right-0 z-10 flex flex-row items-center justify-between px-4 pt-3 pb-2 bg-white/90 border-b dark:bg-[#151515]/90 backdrop-blur-sm">
                            <CardTitle className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal-500">
                                <IconMapPin className="w-4 h-4" stroke={2.5} /> Peta Pemantauan
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="w-6 h-6 rounded-md opacity-50 hover:opacity-100" asChild>
                                <Link href="/"><IconMaximize className="w-4 h-4" /></Link>
                            </Button>
                        </CardHeader>
                        <div ref={miniMapRef} className="z-0 w-full h-full pt-11 bg-accent/30"></div>
                        {mapMarkers.length === 0 && activeIncidents.length === 0 && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none pt-11 bg-background/40 backdrop-blur-[2px]">
                                <IconMapPin className="w-8 h-8 mb-2 text-muted-foreground/50" />
                                <p className="text-xs font-medium text-muted-foreground">Area kosong</p>
                            </div>
                        )}
                    </Card>

                    {/* BENTO GRID HANYA MUNCUL UNTUK ADMIN (Disembunyikan untuk Pejabat Eksekutif) */}
                    {!isPejabat && (
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-2 bg-white dark:bg-[#151515] border-border hover:border-blue-500 shadow-sm transition-all rounded-xl group" asChild>
                                <Link href={route('admin.users.index', { tab: 'relawan' })}>
                                    <div className="p-2 transition-colors rounded-lg bg-blue-50 dark:bg-blue-900/30 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50">
                                        <IconUsersGroup className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="mt-1 text-left">
                                        <div className="text-sm font-bold text-foreground">Relawan Aktif</div>
                                        <div className="text-[10px] text-muted-foreground">Verifikasi & Plotting</div>
                                    </div>
                                </Link>
                            </Button>

                            <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-2 bg-white dark:bg-[#151515] border-border hover:border-teal-500 shadow-sm transition-all rounded-xl group" asChild>
                                <Link href={route('admin.hydrants.index')}>
                                    <div className="p-2 transition-colors rounded-lg bg-teal-50 dark:bg-teal-900/30 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/50">
                                        <IconDroplet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                                    </div>
                                    <div className="mt-1 text-left">
                                        <div className="text-sm font-bold text-foreground">Sumber Air</div>
                                        <div className="text-[10px] text-muted-foreground">Hydrant & Pompa</div>
                                    </div>
                                </Link>
                            </Button>

                            {isTopLevelAdmin && (
                                <Button variant="outline" className="h-auto py-3 px-4 flex flex-col items-start gap-2 bg-white dark:bg-[#151515] border-border hover:border-[#b42826] shadow-sm transition-all rounded-xl group" asChild>
                                    <Link href={route('admin.hydrants.index', { type: 'pos' })}>
                                        <div className="p-2 transition-colors rounded-lg bg-[#b42826]/10 dark:bg-[#e54845]/10 group-hover:bg-[#b42826]/20">
                                            <IconFiretruck className="w-5 h-5 text-[#b42826] dark:text-[#e54845]" />
                                        </div>
                                        <div className="mt-1 text-left">
                                            <div className="text-sm font-bold text-foreground">Pos Armada</div>
                                            <div className="text-[10px] text-muted-foreground">Distribusi Kendaraan</div>
                                        </div>
                                    </Link>
                                </Button>
                            )}

                            <Button variant="outline" className={cn("h-auto py-3 px-4 flex flex-col items-start gap-2 bg-white dark:bg-[#151515] border-border hover:border-amber-500 shadow-sm transition-all rounded-xl group", !isTopLevelAdmin && "col-span-2 flex-row items-center")} asChild>
                                <Link href={route('admin.users.index', { tab: 'struktural' })}>
                                    <div className="p-2 transition-colors rounded-lg bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50">
                                        <IconUserShield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className={cn("text-left", !isTopLevelAdmin ? "ml-1" : "mt-1")}>
                                        <div className="text-sm font-bold text-foreground">Struktural</div>
                                        <div className="text-[10px] text-muted-foreground">Kelola Admin & Petugas</div>
                                    </div>
                                </Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

AdminDashboard.layout = (page) => <AppLayout children={page} title="Pusat Komando" />;