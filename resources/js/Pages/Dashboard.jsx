import HeaderTitle from '@/Components/HeaderTitle';
import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import ReportCard from '@/Components/ReportCard';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import {
    IconAlertTriangle,
    IconCheckupList,
    IconChevronRight,
    IconDroplet,
    IconFiretruck,
    IconLoader2,
    IconPhoneCall,
    IconRefresh,
    IconShieldCheck,
    IconUsers,
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

    const isAdmin = auth && auth.role === 'admin';

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
            {/* --- HEADER & STATUS SISTEM --- */}
						<div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
							<HeaderTitle
								title={props.page_settings.title}
								icon={IconFiretruck}               
							/>
							
							{/* Indikator Sistem Online */}
							<div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-md dark:bg-[#112a1d] dark:border-[#1e402c] w-fit shadow-sm">
								<span className="relative flex w-2 h-2">
									<span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
									<span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full"></span>
								</span>
								<span className="text-[10px] font-bold text-green-700 uppercase tracking-wider dark:text-green-500">
									Siaga 24/7
								</span>
							</div>
						</div>

            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

           {/* --- SECTION 1: AKSI DARURAT (PRIORITAS UTAMA) --- */}
            <div className="flex flex-col items-center w-full gap-3 mt-1">
                {/* Tombol Lapor Utama (Merah Solid) */}
                <Link href={route('front.reports.create')} className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42826] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#101010] rounded-xl">
                    <div className="relative flex items-center justify-between p-6 overflow-hidden transition-colors duration-200 shadow-sm sm:p-8 bg-[#b42826] hover:bg-[#9a2220] rounded-xl group">
                        <div className="relative z-10 flex flex-col">
                            <span className="mb-1 text-xs font-semibold tracking-wider uppercase text-red-100/80">Pusat Bantuan Darurat</span>
                            <span className="text-2xl font-bold leading-tight text-white sm:text-3xl">Laporkan<br />Kejadian!</span>
                        </div>
                        <div className="relative z-10 p-3 transition-transform duration-300 rounded-lg bg-black/10 group-hover:scale-105 group-hover:-rotate-6">
                            <IconAlertTriangle className="w-10 h-10 text-white" stroke={2} />
                        </div>
                    </div>
                </Link>

                {/* Tombol Alternatif: Telepon Langsung */}
                <a href="tel:113" className="flex items-center justify-center w-full gap-2 py-3.5 text-sm font-semibold text-[#b42826] transition-colors border border-red-200 shadow-sm bg-red-50 rounded-xl hover:bg-red-100 dark:bg-[#2a1313] dark:border-[#4a1c1c] dark:text-[#e54845] dark:hover:bg-[#3f1919]">
                    <IconPhoneCall size={20} stroke={2} />
                    <span>Telepon Darurat (113)</span>
                </a>
            </div>

            {/* --- SECTION 2: MENU INFORMASIONAL & UTILITAS --- */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Menu Pompa Sisupit */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333] focus-visible:ring-2 focus-visible:ring-gray-300"
                >
                    <div className="flex items-center justify-center mb-3 text-blue-600 border border-blue-100 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 group-hover:bg-blue-100 dark:border-[#1e3a5f] dark:bg-[#111e36] dark:text-[#60a5fa] dark:group-hover:bg-[#1a2c4e]">
                        <IconDroplet size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-gray-900 sm:text-sm dark:text-gray-100">
                        Lokasi Pompa<br />Sisupit
                    </span>
                </Link>
                
                {/* Menu Pos Damkar */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333] focus-visible:ring-2 focus-visible:ring-gray-300"
                >
                    <div className="flex items-center justify-center mb-3 text-[#b42826] border border-red-100 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-red-50 group-hover:bg-red-100 dark:border-[#4a1c1c] dark:bg-[#2a1313] dark:text-[#e54845] dark:group-hover:bg-[#3f1919]">
                        <IconFiretruck size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-gray-900 sm:text-sm dark:text-gray-100">
                        Pos Damkar<br />Terdekat
                    </span>
                </Link>

                {/* MENU KHUSUS ADMIN */}
                {isAdmin && (
                    <Link href={route('front.volunteers.index')} className="block w-full col-span-2 mt-1 outline-none focus-visible:ring-2 focus-visible:ring-gray-300 rounded-xl">
                        <Card className="overflow-hidden transition-colors border border-[#e5e5e5] shadow-sm cursor-pointer group rounded-xl bg-gray-50 hover:border-gray-300 dark:border-[#262626] dark:bg-[#1f1f1f] dark:hover:border-[#333]">
                            <CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
                                <div className="flex items-center justify-center w-10 h-10 text-gray-700 bg-white border border-[#e5e5e5] rounded-lg shrink-0 dark:border-[#333] dark:bg-[#151515] dark:text-gray-300">
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
                )}
            </div>

            <hr className="my-2 border-[#e5e5e5] dark:border-[#262626]" />

            {/* --- SECTION 3: FEED LAPORAN --- */}
            <div className="space-y-6">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                        <IconCheckupList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Laporan Terbaru
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Kejadian di sekitar yang membutuhkan pantauan atau bantuan
                    </p>
                </div>

                {reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e5e5] bg-white p-12 text-center dark:border-[#262626] dark:bg-[#151515]">
                        <div className="p-4 mb-4 rounded-full bg-emerald-50 dark:bg-[#112a1d]">
                            <IconShieldCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-500" stroke={1.5} />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Situasi Aman Terkendali</h3>
                        <p className="max-w-sm mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Belum ada laporan aktif saat ini. Tetap waspada dan jaga keselamatan.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid items-stretch grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {reports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    currentUser={auth}
                                    onHelpClick={handleHelpClick}
                                    onSuccess={refreshData}
                                />
                            ))}
                        </div>

                        {nextPageUrl && (
                            <div className="flex justify-center w-full pt-4 pb-8">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isLoadingMore}
                                    className="flex items-center gap-2 px-6 font-medium text-gray-700 bg-white border border-[#e5e5e5] h-10 rounded-md hover:bg-gray-50 dark:bg-[#151515] dark:border-[#262626] dark:text-gray-300 dark:hover:bg-[#1f1f1f] transition-colors"
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

Dashboard.layout = (page) => <AppLayout children={page} title={'Dashboard'} />;