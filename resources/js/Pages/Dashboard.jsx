import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import ReportCard from '@/Components/ReportCard';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import {
    IconAlertCircle,
    IconCheckupList,
    IconChevronRight,
    IconLoader2,
    IconRefresh,
    IconShieldCheck,
    IconUserCheck,
    IconUsers,
} from '@tabler/icons-react';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils'; // Pastikan utilitas cn() ada

export default function Dashboard(props) {
    const auth = props.auth.user;
    const firstName = auth?.name ? auth.name.split(' ').find(word => word.length >= 3) || 'Relawan' : 'Relawan';
    const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

    const initialReports = props.page_data?.reports?.data || [];
    const initialNextPageUrl = props.page_data?.reports?.links?.next || null;

    const [reports, setReports] = useState(initialReports);
    const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    // STATE BARU: Untuk menyimpan Tab yang sedang aktif
    const [activeTab, setActiveTab] = useState('menunggu'); 

    const userRoles = Array.isArray(auth?.role) ? auth.role : (auth?.role ? [auth.role] : []);
    const isAdmin = userRoles.includes('petugas') || userRoles.includes('admin');

    // LOGIKA FILTERING: Memisahkan laporan berdasarkan Tab yang dipilih
    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const hasHelpers = report.helpers?.length > 0;
            // Cek apakah relawan yang sedang login ada di dalam daftar helpers laporan ini
            const isMyTask = report.helpers?.some(helper => helper.user?.id === auth.id);

            if (activeTab === 'menunggu') {
                return !hasHelpers; // Hanya tampilkan yang belum ada relawannya
            }
            if (activeTab === 'tugas_saya') {
                return isMyTask; // Hanya tampilkan yang ditangani oleh saya
            }
            return true; // Tab 'semua': Tampilkan semuanya
        });
    }, [reports, activeTab, auth.id]);

    const handleLoadMore = () => {
        if (!nextPageUrl) return;
        setIsLoadingMore(true);

        router.get(
            nextPageUrl,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['page_data'],
                onSuccess: (page) => {
                    const newReports = page.props.page_data.reports.data;
                    const nextUrl = page.props.page_data.reports.links.next || null;

                    setReports((prevReports) => [...prevReports, ...newReports]);
                    setNextPageUrl(nextUrl);
                    setIsLoadingMore(false);
                },
                onError: () => {
                    setIsLoadingMore(false);
                    alert('Gagal memuat data tambahan.');
                },
            },
        );
    };

    useEffect(() => {
        if (!auth.phone) {
            setShowIncompleteDialog(true);
        }
    }, [auth]);

    const handleConfirm = () => {
        router.visit(route('profile.edit'));
    };

    const handleHelpClick = (id) => {
        console.log('Relawan akan bantu laporan ID:', id);
    };

    const refreshData = () => {
        router.reload({ 
            only: ['page_data'],
            onSuccess: (page) => {
                setReports(page.props.page_data.reports.data);
            }
        });
    };

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            
            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

            {/* --- HEADER WELCOME --- */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    Selamat bertugas, {firstName}!
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Pusat Komando Sisupit
                </p>
            </div>

            {/* --- MENU KHUSUS ADMIN --- */}
            {isAdmin && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Link href={route('front.volunteers.index')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-xl">
                        <Card className="overflow-hidden transition-colors border border-[#e5e5e5] cursor-pointer group rounded-xl bg-white shadow-sm hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333]">
                            <CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
                                <div className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-50 border border-[#e5e5e5] rounded-lg shrink-0 dark:border-[#333] dark:bg-[#101010] dark:text-gray-300">
                                    <IconUsers className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div className="flex-1 w-full min-w-0 py-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                                        Manajemen Pengguna
                                    </h3>
                                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                        Kelola data admin & relawan.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center shrink-0">
                                    <IconChevronRight className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('front.reports.index')} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-xl">
                        <Card className="overflow-hidden transition-colors border border-[#e5e5e5] cursor-pointer group rounded-xl bg-white shadow-sm hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333]">
                            <CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
                                <div className="flex items-center justify-center w-10 h-10 text-gray-700 bg-gray-50 border border-[#e5e5e5] rounded-lg shrink-0 dark:border-[#333] dark:bg-[#101010] dark:text-gray-300">
                                    <IconCheckupList className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div className="flex-1 w-full min-w-0 py-1">
                                    <h3 className="text-sm font-semibold text-gray-900 truncate dark:text-gray-100">
                                        Semua Laporan & Riwayat
                                    </h3>
                                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                        Lihat riwayat kejadian dan rekap.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center shrink-0">
                                    <IconChevronRight className="w-5 h-5 text-gray-400 transition-transform group-hover:translate-x-1 dark:text-gray-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}

            <hr className="my-2 border-[#e5e5e5] dark:border-[#262626]" />

            {/* --- FEED LAPORAN MASUK DENGAN TABS --- */}
            <div className="space-y-4">
                
                {/* Judul & TABS */}
                <div className="flex flex-col gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        <IconCheckupList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Laporan Masuk
                    </h2>
                    
                    {/* Navigation Tabs */}
                    <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl dark:bg-[#101010] border border-[#e5e5e5] dark:border-[#262626] overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('menunggu')}
                            className={cn(
                                "flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#b42826]",
                                activeTab === 'menunggu' 
                                    ? "bg-white text-[#b42826] shadow-sm border border-[#e5e5e5] dark:bg-[#1f1f1f] dark:border-[#333] dark:text-[#e54845]" 
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            <IconAlertCircle className="w-4 h-4" stroke={activeTab === 'menunggu' ? 2 : 1.5} />
                            Butuh Respons
                        </button>
                        <button
                            onClick={() => setActiveTab('tugas_saya')}
                            className={cn(
                                "flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#b42826]",
                                activeTab === 'tugas_saya' 
                                    ? "bg-white text-blue-600 shadow-sm border border-[#e5e5e5] dark:bg-[#1f1f1f] dark:border-[#333] dark:text-blue-400" 
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            <IconUserCheck className="w-4 h-4" stroke={activeTab === 'tugas_saya' ? 2 : 1.5} />
                            Tugas Saya
                        </button>
                        <button
                            onClick={() => setActiveTab('semua')}
                            className={cn(
                                "flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-[#b42826]",
                                activeTab === 'semua' 
                                    ? "bg-white text-gray-900 shadow-sm border border-[#e5e5e5] dark:bg-[#1f1f1f] dark:border-[#333] dark:text-white" 
                                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            )}
                        >
                            <IconCheckupList className="w-4 h-4" stroke={activeTab === 'semua' ? 2 : 1.5} />
                            Semua Aktif
                        </button>
                    </div>
                </div>

                {/* Konten Daftar Laporan yang Sudah Difilter */}
                {filteredReports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e5e5] bg-gray-50 p-12 text-center dark:border-[#262626] dark:bg-[#101010] mt-4">
                        <div className="p-4 mb-4 rounded-full bg-emerald-50 dark:bg-[#112a1d]">
                            <IconShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-500" stroke={1.5} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {activeTab === 'menunggu' ? 'Kondisi Terkendali' : activeTab === 'tugas_saya' ? 'Tidak Ada Tugas Aktif' : 'Kosong'}
                        </h3>
                        <p className="max-w-sm mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {activeTab === 'menunggu' 
                                ? 'Tidak ada laporan baru yang membutuhkan respons saat ini.' 
                                : activeTab === 'tugas_saya'
                                ? 'Anda belum mengambil tugas laporan apa pun saat ini.'
                                : 'Tidak ada data laporan.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid items-stretch grid-cols-1 gap-4 mt-2 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    currentUser={auth}
                                    onHelpClick={handleHelpClick}
                                    onSuccess={refreshData}
                                />
                            ))}
                        </div>

                        {/* Tombol Load More hanya dimunculkan jika ada halaman selanjutnya 
                            (Ini tetap akan memuat data tambahan dari database) */}
                        {nextPageUrl && (
                            <div className="flex justify-center w-full pt-4 pb-8">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="flex items-center gap-2 px-6 font-medium text-gray-700 bg-white border border-[#e5e5e5] h-10 rounded-md hover:bg-gray-50 dark:bg-[#151515] dark:border-[#262626] dark:text-gray-300 dark:hover:bg-[#1f1f1f] transition-colors shadow-sm"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <IconLoader2 className="w-4 h-4 animate-spin" />
                                            Memuat...
                                        </>
                                    ) : (
                                        <>
                                            <IconRefresh className="w-4 h-4" />
                                            Muat Lebih Banyak
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Dashboard Operasional'} />;