import HeaderTitle from '@/Components/HeaderTitle';
import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import InstallPWAButton from '@/Components/InstallPWAButton';
import ReportCard from '@/Components/ReportCard';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconCheckupList,
    IconChevronRight,
    IconDashboard,
    IconDroplet,
    IconFiretruck,
    IconUsers,
    IconLoader2, 
    IconRefresh,
    IconShieldCheck
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function Dashboard(props) {
    const auth = props.auth.user;
    const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);
    
    const initialReports = props.page_data?.reports?.data || [];
    const initialNextPageUrl = props.page_data?.reports?.links?.next || null;

    const [reports, setReports] = useState(initialReports); 
    const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Pengecekan Admin (Sesuaikan dengan struktur database Anda)
    const isAdmin = auth && auth.role === 'admin';

    const handleLoadMore = () => {
        if (!nextPageUrl) return;

        setIsLoadingMore(true);

        router.get(nextPageUrl, {}, {
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
            }
        });
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

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            {/* --- HEADER --- */}
            <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconDashboard}
                />
            </div>

            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

            {/* --- SECTION 1: AKSI DARURAT (KONSISTEN DENGAN HOME) --- */}
            <div className="flex justify-center w-full mt-2">
                <Link
                    href={route('front.reports.create')}
                    className="block w-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500"
                >
                    <div className="relative flex items-center justify-between p-6 overflow-hidden transition-all duration-300 shadow-xl group rounded-3xl bg-gradient-to-br from-red-600 to-rose-700 hover:-translate-y-1 hover:shadow-red-500/40 dark:from-red-700 dark:to-rose-900 dark:hover:shadow-red-900/50 sm:p-8">
                        <div className="relative z-10 flex flex-col">
                            <span className="mb-1 text-sm font-bold tracking-wider uppercase text-red-100/90">
                                Pusat Bantuan Darurat
                            </span>
                            <span className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                                Laporkan
                                <br />
                                Kejadian!
                            </span>
                        </div>
                        <div className="relative z-10 p-4 transition-transform duration-300 rounded-full bg-white/20 backdrop-blur-md group-hover:rotate-12 group-hover:scale-110">
                            <IconAlertTriangle className="w-12 h-12 text-white" stroke={2.5} />
                        </div>
                        <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 transform -translate-x-12 translate-y-12 rounded-full bg-black/10 blur-xl"></div>
                    </div>
                </Link>
            </div>

            {/* --- SECTION 2: QUICK ACTIONS --- */}
            <div className="grid grid-cols-2 gap-3 mb-2 sm:gap-4">
                {/* Menu Pompa Sisupit (Biru) */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col items-center justify-center rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-center mb-3 text-blue-600 transition-transform duration-300 rounded-full h-14 w-14 sm:h-16 sm:w-16 bg-blue-50 group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-400">
                        <IconDroplet size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-center text-gray-800 sm:text-base dark:text-slate-200">
                        Lokasi Pompa<br />Sisupit
                    </span>
                </Link>
                
                {/* Menu Pos Damkar (Oranye) */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col items-center justify-center rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 dark:border-slate-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-center mb-3 text-red-500 transition-transform duration-300 rounded-full h-14 w-14 sm:h-16 sm:w-16 bg-red-50 group-hover:scale-110 dark:bg-red-900/30 dark:text-red-400">
                        <IconFiretruck size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-center text-gray-800 sm:text-base dark:text-slate-200">
                        Pos Damkar<br />Terdekat
                    </span>
                </Link>

                {/* MENU KHUSUS ADMIN */}
                {isAdmin && (
                    <Link href={route('front.volunteers.index')} className="block w-full col-span-2 mt-1">
                        <Card className="overflow-hidden transition-all duration-300 border border-indigo-100 shadow-sm cursor-pointer group rounded-[20px] bg-indigo-50/50 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/30 dark:bg-slate-800/80 dark:hover:border-indigo-700">
                            <CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
                                <div className="flex items-center justify-center w-12 h-12 text-indigo-600 transition-transform bg-white border border-indigo-200 rounded-full shadow-inner shrink-0 group-hover:scale-110 dark:border-indigo-800/50 dark:bg-indigo-900/50 dark:text-indigo-400">
                                    <IconUsers className="w-6 h-6" />
                                </div>
                                <div className="flex-1 w-full min-w-0 py-1">
                                    <h3 className="truncate text-[15px] font-bold text-gray-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                        Manajemen Pengguna
                                    </h3>
                                    <p className="mt-0.5 truncate text-[13px] text-gray-600 dark:text-slate-400">
                                        Kelola data admin & relawan.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center shrink-0">
                                    <div className="flex items-center justify-center w-8 h-8 text-indigo-400 transition-colors rounded-full bg-indigo-100/50 group-hover:bg-indigo-200 group-hover:text-indigo-700 dark:bg-slate-800 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-300">
                                        <IconChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>

            <hr className="my-2 border-gray-200 dark:border-slate-800" />

            {/* --- SECTION 3: FEED LAPORAN --- */}
            <div className="space-y-6">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-slate-100">
                        <IconCheckupList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        Laporan Terbaru
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Kejadian di sekitar yang membutuhkan pantauan atau bantuan
                    </p>
                </div>

                {reports.length === 0 ? (
                    // REVISI: Empty State menggunakan warna Hijau/Emerald (Aman/Terkendali)
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-gray-200 border-dashed rounded-[24px] bg-emerald-50/50 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="p-4 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                            <IconShieldCheck className="w-12 h-12 text-emerald-600 dark:text-emerald-500" stroke={1.5} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-200">Situasi Aman Terkendali</h3>
                        <p className="max-w-sm mt-1 text-sm text-gray-500 dark:text-slate-400">
                            Belum ada laporan aktif saat ini. Tetap waspada dan jaga keselamatan lingkungan sekitar.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Di dalam Dashboard.jsx */}
<div className="grid items-stretch grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {reports.map((report) => (
        <ReportCard 
            key={report.id} 
            report={report} 
            currentUser={auth} // <-- TAMBAHKAN INI: Kirim data user yang login
            onHelpClick={handleHelpClick} 
        />
    ))}
</div>
                        
                        {/* TOMBOL LOAD MORE (Warna Netral/Biru agar tidak menyaingi tombol Lapor) */}
                        {nextPageUrl && (
                            <div className="flex justify-center w-full pt-4 pb-8">
                                <Button 
                                    variant="outline" 
                                    onClick={handleLoadMore} 
                                    disabled={isLoadingMore}
                                    className="flex items-center gap-2 px-6 font-bold text-blue-600 transition-all border-gray-200 h-11 rounded-xl hover:text-blue-700 hover:bg-blue-50 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <IconLoader2 className="w-5 h-5 animate-spin" />
                                            Memuat Data...
                                        </>
                                    ) : (
                                        <>
                                            <IconRefresh className="w-5 h-5" />
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

Dashboard.layout = (page) => <AppLayout children={page} title={'Dashboard'} />;