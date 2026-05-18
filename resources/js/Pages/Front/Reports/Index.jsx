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
            TERLAPOR: { className: "bg-red-50 text-[#b42826] border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50", label: "TERLAPOR" },
            pending: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50", label: "MENUNGGU" },
            handling: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50", label: "PENANGANAN" },
            resolved: { className: "bg-gray-100 text-gray-600 border-[#e5e5e5] dark:bg-[#1a1a1a] dark:text-gray-400 dark:border-[#333]", label: "SELESAI" },
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
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase dark:text-gray-100">
                        Arsip & Riwayat
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Pantau seluruh rekam jejak insiden dan laporan operasional.
                    </p>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full md:w-80">
                    <IconSearch className="absolute w-4 h-4 text-gray-400 left-3" />
                    <Input 
                        type="text" 
                        placeholder="Cari kejadian atau lokasi..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-10 h-11 bg-white dark:bg-[#151515] border-[#e5e5e5] dark:border-[#333] shadow-none rounded-lg focus-visible:ring-1 focus-visible:ring-gray-400"
                    />
                    {searchQuery && (
                        <button type="button" onClick={clearSearch} className="absolute text-gray-400 right-3 hover:text-gray-600">
                            <IconX className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>

            {/* --- TABS FILTER (Flat Design) --- */}
            <div className="flex p-1 space-x-1 bg-gray-100 dark:bg-[#101010] rounded-lg border border-[#e5e5e5] dark:border-[#262626] w-full sm:w-fit shadow-none">
                <button
                    onClick={() => handleFilterChange('all')}
                    className={cn(
                        "flex items-center justify-center gap-2 w-full sm:w-40 px-4 py-2 text-xs font-bold rounded-md transition-colors outline-none",
                        activeTab === 'all' 
                            ? "bg-white text-gray-900 border border-[#e5e5e5] shadow-none dark:bg-[#151515] dark:border-[#333] dark:text-white" 
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-transparent"
                    )}
                >
                    <IconList className="w-4 h-4" /> Semua Laporan
                </button>
                <button
                    onClick={() => handleFilterChange('mine')}
                    className={cn(
                        "flex items-center justify-center gap-2 w-full sm:w-40 px-4 py-2 text-xs font-bold rounded-md transition-colors outline-none",
                        activeTab === 'mine' 
                            ? "bg-white text-[#b42826] border border-[#e5e5e5] shadow-none dark:bg-[#151515] dark:border-[#333] dark:text-red-400" 
                            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border border-transparent"
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
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#262626] rounded-xl hover:border-gray-300 dark:hover:border-[#444] hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-all duration-200 shadow-none"
                        >
                            <div className="flex flex-col flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <IconFlame className="w-4 h-4 text-[#b42826] dark:text-[#e54845] shrink-0" stroke={2.5} />
                                    <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-[#b42826] dark:group-hover:text-[#e54845] transition-colors">
                                        {report.title}
                                    </h4>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1.5 truncate">
                                        <IconMapPin className="w-3.5 h-3.5 shrink-0" /> 
                                        <span className="truncate">{report.address}</span>
                                    </span>
                                    <span className="hidden text-gray-300 sm:inline dark:text-gray-600">•</span>
                                    <span className="flex items-center gap-1.5 shrink-0">
                                        <IconClock className="w-3.5 h-3.5 shrink-0" /> 
                                        {new Date(report.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="mt-4 sm:mt-0 flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-[#e5e5e5] dark:border-[#262626] pt-3 sm:pt-0">
                                <StatusBadge status={report.status} />
                                
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent group-hover:bg-white dark:group-hover:bg-[#262626] border border-transparent group-hover:border-[#e5e5e5] dark:group-hover:border-[#333] transition-colors">
                                    <IconChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#b42826] dark:group-hover:text-red-400" />
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border border-dashed border-[#e5e5e5] dark:border-[#333] rounded-xl bg-gray-50/50 dark:bg-[#101010]/50">
                        <div className="flex items-center justify-center mb-4 w-12 h-12 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#333] rounded-full shadow-none text-gray-400">
                            <IconShieldCheck className="w-6 h-6" stroke={1.5} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Pencarian Kosong</h3>
                        <p className="mt-1 text-xs text-gray-500 max-w-[280px] dark:text-gray-400">
                            Tidak ada data laporan yang ditemukan berdasarkan filter atau kata kunci tersebut.
                        </p>
                    </div>
                )}
            </div>

            {/* --- PAGINASI (Jika ada lebih dari 10 data) --- */}
            {reports?.meta?.has_pages && (
                <div className="flex items-center justify-between pt-4 border-t border-[#e5e5e5] dark:border-[#262626]">
                    <Button 
                        variant="outline" 
                        disabled={!reports.links?.prev}
                        onClick={() => router.get(reports.links.prev, {}, { preserveScroll: true })}
                        className="bg-white dark:bg-[#151515] border-[#e5e5e5] dark:border-[#333] shadow-none text-xs font-bold uppercase"
                    >
                        Sebelumnya
                    </Button>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        Halaman {reports.meta.current_page} dari {reports.meta.last_page}
                    </span>
                    <Button 
                        variant="outline" 
                        disabled={!reports.links?.next}
                        onClick={() => router.get(reports.links.next, {}, { preserveScroll: true })}
                        className="bg-white dark:bg-[#151515] border-[#e5e5e5] dark:border-[#333] shadow-none text-xs font-bold uppercase"
                    >
                        Selanjutnya
                    </Button>
                </div>
            )}
        </div>
    );
}

ReportIndex.layout = (page) => <AppLayout children={page} title="Daftar Laporan" />;