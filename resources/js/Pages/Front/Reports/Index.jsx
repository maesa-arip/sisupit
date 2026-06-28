import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Button } from '@/Components/ui/button';
import {
    IconSearch, IconMapPin, IconClock, IconChevronRight,
    IconHistory, IconList, IconFlame, IconShieldCheck, IconX
} from '@tabler/icons-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ReportIndex(props) {
    const { reports, page_settings, state, auth } = props;

    // State untuk Pencarian dan Tab
    const [searchQuery, setSearchQuery] = useState(state?.search || '');
    
    // Mengambil parameter 'filter' dari URL untuk menentukan Tab yang aktif
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get('filter') === 'mine' ? 'mine' : 'all';
    const [activeTab, setActiveTab] = useState(initialTab);

    // Fungsi untuk menangani pencarian & ganti tab
    const handleFilterChange = (tab, search = searchQuery) => {
        setActiveTab(tab);
        router.get(route('front.reports.index'), {
            search: search,
            filter: tab === 'mine' ? 'mine' : null,
            load: 10
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        handleFilterChange(activeTab, searchQuery);
    };

    const clearSearch = () => {
        setSearchQuery('');
        handleFilterChange(activeTab, '');
    };

    const StatusBadge = ({ status }) => {
        const variants = {
            TERLAPOR: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "TERLAPOR" },
            pending: { className: "bg-destructive/10 text-destructive border-destructive/20", label: "MENUNGGU" },
            handling: { className: "bg-warning/10 text-warning border-warning/20", label: "PENANGANAN" },
            resolved: { className: "bg-success/10 text-success border-success/20", label: "SELESAI" },
            ditolak: { className: "bg-muted text-muted-foreground border-border", label: "DITOLAK" },
        };
        const active = variants[status] || variants.pending;
        return (
            <Badge variant="outline" className={cn("font-bold px-2 py-0.5 rounded-md shadow-none whitespace-nowrap", active.className)}>
                {active.label}
            </Badge>
        );
    };

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <Head title={page_settings?.title || "Daftar Laporan"} />

            {/* --- HEADER & PENCARIAN --- */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                        Arsip & Riwayat
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Pantau seluruh rekam jejak insiden dan laporan operasional.
                    </p>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-80">
                    <IconSearch className="absolute w-4 h-4 text-muted-foreground left-3" />
                    <Input
                        type="text"
                        placeholder="Cari kejadian atau lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-10 h-11 bg-card border-border shadow-none rounded-lg focus-visible:ring-1 focus-visible:ring-muted-foreground"
                    />
                    {searchQuery && (
                        <button type="button" onClick={clearSearch} className="absolute text-muted-foreground right-3 hover:text-foreground">
                            <IconX className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>

            {/* --- TABS FILTER (Flat Design) --- */}
            <div className="flex p-1 space-x-1 bg-muted rounded-lg border border-border w-full sm:w-fit shadow-none">
                <button
                    onClick={() => handleFilterChange('all')}
                    className={cn(
                        "flex items-center justify-center gap-2 w-full sm:w-40 px-4 py-2 text-xs font-bold rounded-md transition-colors outline-none",
                        activeTab === 'all'
                            ? "bg-card text-foreground border border-border shadow-none"
                            : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                >
                    <IconList className="w-4 h-4" /> Semua Laporan
                </button>
                <button
                    onClick={() => handleFilterChange('mine')}
                    className={cn(
                        "flex items-center justify-center gap-2 w-full sm:w-40 px-4 py-2 text-xs font-bold rounded-md transition-colors outline-none",
                        activeTab === 'mine'
                            ? "bg-card text-destructive border border-border shadow-none"
                            : "text-muted-foreground hover:text-foreground border border-transparent"
                    )}
                >
                    <IconHistory className="w-4 h-4" /> Riwayat Saya
                </button>
            </div>

            {/* --- DAFTAR LAPORAN (List View) --- */}
            <div className="flex flex-col space-y-3">
                {reports?.data?.length > 0 ? (
                    reports.data.map((report) => (
                        <Link
                            key={report.id}
                            href={route('reports.show', report.id)}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-card border border-border rounded-xl hover:border-muted-foreground/40 hover:bg-accent transition-all duration-200 shadow-none"
                        >
                            <div className="flex flex-col flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <IconFlame className="w-4 h-4 text-destructive shrink-0" stroke={2.5} />
                                    <h4 className="text-sm sm:text-base font-bold text-foreground truncate group-hover:text-destructive transition-colors">
                                        {report.title}
                                    </h4>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-1 text-xs font-medium text-muted-foreground">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <IconMapPin className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">{report.address}</span>
                                    </span>
                                    <span className="hidden text-muted-foreground/50 sm:inline">•</span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <IconClock className="w-3.5 h-3.5 shrink-0" />
                                        {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-border pt-3 sm:pt-0">
                                <StatusBadge status={report.status} />

                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent group-hover:bg-card border border-transparent group-hover:border-border transition-colors">
                                    <IconChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-border rounded-xl bg-muted/50">
                        <div className="flex items-center justify-center mb-4 w-12 h-12 bg-card border border-border rounded-full shadow-none text-muted-foreground">
                            <IconShieldCheck className="w-6 h-6" stroke={1.5} />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Pencarian Kosong</h3>
                        <p className="mt-1 text-xs text-muted-foreground max-w-[280px]">
                            Tidak ada data laporan yang ditemukan berdasarkan filter atau kata kunci tersebut.
                        </p>
                    </div>
                )}
            </div>

            {/* --- PAGINASI (Jika ada lebih dari 10 data) --- */}
            {reports?.meta?.has_pages && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                        variant="outline"
                        disabled={!reports.links?.prev}
                        onClick={() => router.get(reports.links.prev, {}, { preserveScroll: true })}
                        className="bg-card border-border shadow-none text-xs font-bold uppercase"
                    >
                        Sebelumnya
                    </Button>
                    <span className="text-xs font-bold text-muted-foreground">
                        Halaman {reports.meta.current_page} dari {reports.meta.last_page}
                    </span>
                    <Button
                        variant="outline"
                        disabled={!reports.links?.next}
                        onClick={() => router.get(reports.links.next, {}, { preserveScroll: true })}
                        className="bg-card border-border shadow-none text-xs font-bold uppercase"
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}
        </div>
    );
}

ReportIndex.layout = (page) => <AppLayout children={page} title="Daftar Laporan" />;