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
            {/* --- HEADER --- */}
            <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    icon={IconFiretruck}
                />
            </div>

            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

            {/* --- SECTION 1: AKSI DARURAT --- */}
            <div className="flex justify-center w-full mt-2">
                <Link
                    href={route('front.reports.create')}
                    className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b42826] rounded-xl"
                >
                    <div className="relative flex items-center justify-between p-6 sm:p-8 overflow-hidden transition-all duration-200 shadow-sm rounded-xl bg-[#b42826] hover:bg-[#9a2220]">
                        <div className="relative z-10 flex flex-col">
                            <span className="mb-1 text-xs font-semibold tracking-wider uppercase text-red-100/80">
                                Pusat Bantuan Darurat
                            </span>
                            <span className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                                Laporkan Kejadian
                            </span>
                        </div>
                        <div className="relative z-10 p-3 rounded-lg bg-black/10 backdrop-blur-sm">
                            <IconAlertTriangle className="w-10 h-10 text-white" stroke={2} />
                        </div>
                    </div>
                </Link>
            </div>

            {/* --- SECTION 2: QUICK ACTIONS --- */}
            <div className="grid grid-cols-2 gap-3 mb-2 sm:gap-4">
                {/* Menu Pompa Sisupit */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col p-5 sm:p-6 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-[#333] transition-colors"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Lokasi Pompa</span>
                        <IconDroplet size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Sisupit</span>
                </Link>

                {/* Menu Pos Damkar */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col p-5 sm:p-6 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-[#333] transition-colors"
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pos Damkar</span>
                        <IconFiretruck size={24} className="text-[#b42826] dark:text-[#e54845]" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Terdekat</span>
                </Link>

                {/* MENU KHUSUS ADMIN */}
                {isAdmin && (
                    <Link href={route('front.volunteers.index')} className="block w-full col-span-2 mt-1">
                        <div className="flex items-center justify-between p-4 sm:p-5 bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#262626] rounded-xl shadow-sm hover:border-gray-300 dark:hover:border-[#333] transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-300">
                                    <IconUsers className="w-5 h-5" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Manajemen Pengguna</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Kelola data admin & relawan</span>
                                </div>
                            </div>
                            <IconChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
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