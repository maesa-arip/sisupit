import HeaderTitle from '@/Components/HeaderTitle';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UseFilter from '@/hooks/UseFilter';
import { cn } from '@/lib/utils';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import {
    IconArrowDown,
    IconClipboardPlus,
    IconClock,
    IconEye,
    IconFileSpreadsheet,
    IconMapPin,
    IconMapPinFilled,
    IconPhone,
    IconSearch,
    IconUser,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_OPTIONS = ['Semua', 'TERLAPOR', 'pending', 'handling', 'resolved'];

const STATUS_BADGE = {
    TERLAPOR: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'TERLAPOR' },
    pending: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'MENUNGGU' },
    handling: { className: 'bg-warning/10 text-warning border-warning/20', label: 'PENANGANAN' },
    resolved: { className: 'bg-success/10 text-success border-success/20', label: 'SELESAI' },
};

// Warna pin peta per status penanganan (selaras token STATUS_BADGE)
const STATUS_MARKER = {
    TERLAPOR: { color: 'text-red-600 dark:text-destructive', ring: 'bg-red-100 dark:bg-destructive/10 text-red-600 dark:text-destructive', active: 'border-red-500 dark:border-destructive bg-red-50/50 dark:bg-destructive/5', activeText: 'text-red-700 dark:text-destructive', hover: 'hover:border-red-300 dark:hover:border-destructive/50' },
    pending: { color: 'text-red-600 dark:text-destructive', ring: 'bg-red-100 dark:bg-destructive/10 text-red-600 dark:text-destructive', active: 'border-red-500 dark:border-destructive bg-red-50/50 dark:bg-destructive/5', activeText: 'text-red-700 dark:text-destructive', hover: 'hover:border-red-300 dark:hover:border-destructive/50' },
    handling: { color: 'text-amber-500 dark:text-warning', ring: 'bg-amber-100 dark:bg-warning/10 text-amber-600 dark:text-warning', active: 'border-amber-500 dark:border-warning bg-amber-50/50 dark:bg-warning/5', activeText: 'text-amber-700 dark:text-warning', hover: 'hover:border-amber-300 dark:hover:border-warning/50' },
    resolved: { color: 'text-emerald-600 dark:text-success', ring: 'bg-emerald-100 dark:bg-success/10 text-emerald-600 dark:text-success', active: 'border-emerald-500 dark:border-success bg-emerald-50/50 dark:bg-success/5', activeText: 'text-emerald-700 dark:text-success', hover: 'hover:border-emerald-300 dark:hover:border-success/50' },
};

const markerStyle = (status) => STATUS_MARKER[status] || STATUS_MARKER.pending;

function StatusBadge({ status }) {
    const active = STATUS_BADGE[status] || STATUS_BADGE.pending;
    return (
        <Badge variant="outline" className={cn('font-bold px-2 py-0.5 rounded-md shadow-none whitespace-nowrap', active.className)}>
            {active.label}
        </Badge>
    );
}

function formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function Index(props) {
    const { data: reports, links, from, to, total } = props.reports;
    const { tenant_location } = props;
    const [params, setParams] = useState(props.state);
    const [activeReportId, setActiveReportId] = useState(null);

    UseFilter({
        route: route('admin.reports.index'),
        values: params,
        only: ['reports'],
    });

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersLayerRef = useRef(null);
    const mapContainerRef = useRef(null);

    useEffect(() => {
        if (!window.L || !mapRef.current) return;

        if (!mapInstanceRef.current) {
            // Peta berpusat di wilayah admin masing-masing
            const defaultLat = tenant_location?.lat || -8.65;
            const defaultLng = tenant_location?.lng || 115.22;
            mapInstanceRef.current = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 12);
            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap',
            }).addTo(mapInstanceRef.current);
            markersLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);
        }

        markersLayerRef.current.clearLayers();
        const bounds = [];

        if (reports && reports.length > 0) {
            reports.forEach((report) => {
                const lat = parseFloat(report.lat),
                    lng = parseFloat(report.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    const iconColor = markerStyle(report.status).color;
                    const customIcon = window.L.divIcon({
                        html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
                        className: 'bg-transparent border-none',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                    });
                    const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
                    marker.bindPopup(
                        `<b>${report.title ?? 'Laporan'}</b><br><span class="text-xs text-muted-foreground">${report.address ?? '-'}</span>`,
                    );
                    bounds.push([lat, lng]);
                }
            });
            if (bounds.length > 0 && !activeReportId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [reports]);

    const focusToReport = (id, lat, lng) => {
        setActiveReportId(id);
        const parsedLat = parseFloat(lat),
            parsedLng = parseFloat(lng);
        if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
            if (window.innerWidth < 1024 && mapContainerRef.current) {
                mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <div className="flex flex-col w-full h-full space-y-6">
            <div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconClipboardPlus}
                />
                <Button variant="outline" size="sm" asChild>
                    <a href={route('admin.reports.export', { search: params?.search, status: params?.status })}>
                        <IconFileSpreadsheet className="size-4" /> Export Excel
                    </a>
                </Button>
            </div>

            <div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
                <div className="flex flex-col w-full gap-4 shrink-0 lg:w-5/12 xl:w-2/5">
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            <IconSearch className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Cari judul, alamat, atau pelapor..."
                                className="h-10 pl-9"
                                value={params?.search ?? ''}
                                onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setParams((prev) => ({ ...prev, status }))}
                                    className={cn(
                                        'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                                        params?.status === status
                                            ? 'border-primary/30 bg-primary/10 text-primary'
                                            : 'border-input bg-transparent text-muted-foreground hover:bg-accent',
                                    )}
                                >
                                    {status === 'Semua' ? 'Semua' : (STATUS_BADGE[status]?.label ?? status)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Area Scroll Daftar Laporan */}
                    <div className="flex h-[500px] flex-col gap-3 overflow-y-auto pb-4 pr-1 lg:h-[calc(100vh-240px)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
                        {reports.length > 0 ? (
                            <>
                                {reports.map((report) => {
                                    const style = markerStyle(report.status);
                                    const isActive = activeReportId === report.id;
                                    const hasCoords =
                                        !isNaN(parseFloat(report.lat)) && !isNaN(parseFloat(report.lng));
                                    return (
                                        <Card
                                            key={report.id}
                                            onClick={() => focusToReport(report.id, report.lat, report.lng)}
                                            className={cn(
                                                'cursor-pointer transition-colors',
                                                isActive ? style.active : style.hover,
                                            )}
                                        >
                                            <CardContent className="flex flex-col gap-3 p-3 sm:p-4">
                                                <div className="flex flex-row items-start gap-3">
                                                    <div
                                                        className={cn(
                                                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                                                            style.ring,
                                                        )}
                                                    >
                                                        <IconMapPin className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 w-full min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <h3
                                                                className={cn(
                                                                    'truncate text-sm font-semibold',
                                                                    isActive ? style.activeText : 'text-foreground',
                                                                )}
                                                            >
                                                                {report.title}
                                                            </h3>
                                                            <StatusBadge status={report.status} />
                                                        </div>
                                                        <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                                                            <IconMapPin className="mt-0.5 h-3 w-3 shrink-0" />
                                                            <span className="line-clamp-2">{report.address ?? '-'}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-1.5 border-t border-dashed border-border pt-2.5 text-xs text-muted-foreground sm:grid-cols-2">
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <IconUser className="w-3.5 h-3.5 shrink-0" />
                                                        {report.name ?? report.user?.name ?? '-'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <IconPhone className="w-3.5 h-3.5 shrink-0" />
                                                        {report.phone ?? '-'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 truncate sm:col-span-2">
                                                        <IconClock className="w-3.5 h-3.5 shrink-0" />
                                                        {formatDate(report.created_at)}
                                                    </span>
                                                </div>

                                                <div
                                                    className="flex items-center justify-end gap-2"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {!hasCoords && (
                                                        <span className="mr-auto text-[10px] font-semibold text-muted-foreground">
                                                            Tanpa koordinat
                                                        </span>
                                                    )}
                                                    <Button variant="ghost" size="sm" asChild className="h-8 text-muted-foreground hover:text-primary">
                                                        <Link href={route('reports.show', report.id)}>
                                                            <IconEye className="mr-1 size-4" /> Detail
                                                        </Link>
                                                    </Button>
                                                </div>

                                                {hasCoords && (
                                                    <div className="flex items-center justify-center gap-1 rounded-md bg-muted py-1.5 text-[10px] font-bold text-muted-foreground lg:hidden">
                                                        <IconArrowDown className="w-3 h-3" /> Lihat Peta Lokasi
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                <div className="flex flex-col items-center gap-3 pt-4 mt-4 border-t border-dashed border-border">
                                    <span className="text-[11px] font-medium text-muted-foreground">
                                        Menampilkan {from ?? 0} - {to ?? 0} dari {total} laporan
                                    </span>

                                    {links && links.length > 3 && (
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {links.map((link, index) =>
                                                link.url ? (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        preserveScroll
                                                        className={cn(
                                                            'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
                                                            link.active
                                                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                                                : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                                                        )}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={index}
                                                        className="cursor-not-allowed rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ),
                                            )}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="p-10 text-center border border-dashed rounded-xl border-input">
                                <span className="text-sm text-muted-foreground">Tidak ada laporan yang ditemukan.</span>
                            </div>
                        )}
                    </div>
                </div>

                <div
                    ref={mapContainerRef}
                    className="flex h-[450px] w-full scroll-mt-24 flex-col lg:h-[calc(100vh-140px)] lg:flex-1"
                >
                    <div className="flex items-center justify-between gap-2 px-1 mb-3">
                        <div className="flex items-center gap-2">
                            <IconMapPinFilled className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-semibold text-foreground">Peta Sebaran Laporan</h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-red-600 dark:bg-destructive" /> Belum ditangani
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 dark:bg-warning" /> Penanganan
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-600 dark:bg-success" /> Selesai
                            </span>
                        </div>
                    </div>
                    <div
                        ref={mapRef}
                        className="relative z-0 w-full h-full overflow-hidden border rounded-2xl bg-accent"
                    ></div>
                </div>
            </div>
        </div>
    );
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
