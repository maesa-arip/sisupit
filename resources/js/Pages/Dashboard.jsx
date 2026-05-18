import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import ReportCard from '@/Components/ReportCard';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
    IconAlertCircle,
    IconCheckupList,
    IconChevronRight,
    IconClock,
    IconHistory,
    IconLoader2,
    IconMapPin,
    IconPower,
    IconRadar,
    IconRefresh,
    IconShieldCheck,
    IconUserCheck,
    IconUsersGroup,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard(props) {
    const auth = props.auth.user;
    const firstName = auth?.name ? auth.name.split(' ').find((word) => word.length >= 3) || 'Warga' : 'Warga';

    const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

    const myReports = props.myReports || [];
    const initialReports = props.page_data?.reports?.data || [];
    const initialNextPageUrl = props.page_data?.reports?.links?.next || null;

    const [reports, setReports] = useState(initialReports);
    const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    
    // State Loading untuk Pendaftaran Relawan
    const [isRegistering, setIsRegistering] = useState(false);

    const userRoles = Array.isArray(auth?.role) ? auth.role : auth?.role ? [auth.role] : [];
    const isRelawan = userRoles.includes('relawan');

    const [activeTab, setActiveTab] = useState(isRelawan ? 'menunggu' : 'semua');
    const [isStandby, setIsStandby] = useState(true);

    useEffect(() => {
        if (!auth.phone) setShowIncompleteDialog(true);
    }, [auth]);

    useEffect(() => {
        if (!isRelawan) setActiveTab('semua');
    }, [isRelawan]);

    const handleConfirm = () => router.visit(route('profile.edit'));

    // 👇 FUNGSI PENDAFTARAN RELAWAN 👇
    const handleRegisterVolunteer = () => {
        setIsRegistering(true);
        router.post(route('volunteer.register'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Selamat! Anda sekarang resmi terdaftar sebagai Relawan.');
            },
            onError: () => {
                toast.error('Gagal mendaftar. Silakan coba lagi.');
            },
            onFinish: () => setIsRegistering(false)
        });
    };

    const filteredReports = useMemo(() => {
        return reports.filter((report) => {
            const hasHelpers = report.helpers?.length > 0;
            const isMyTask = report.helpers?.some((helper) => helper.user?.id === auth.id);

            if (activeTab === 'menunggu') return !hasHelpers;
            if (activeTab === 'tugas_saya') return isMyTask;
            return true;
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
                    setReports((prev) => [...prev, ...page.props.page_data.reports.data]);
                    setNextPageUrl(page.props.page_data.reports.links.next || null);
                    setIsLoadingMore(false);
                },
                onError: () => {
                    setIsLoadingMore(false);
                    toast.error('Gagal memuat data tambahan.');
                },
            },
        );
    };

    const StatusBadge = ({ status }) => {
        const variants = {
            pending: {
                className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400',
                label: 'Menunggu',
            },
            handling: {
                className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400',
                label: 'Penanganan',
            },
            resolved: {
                className: 'bg-gray-100 text-gray-600 border-[#e5e5e5] dark:bg-[#1a1a1a] dark:border-[#333] dark:text-gray-400',
                label: 'Selesai',
            },
            TERLAPOR: {
                className: 'bg-red-50 text-[#b42826] border-red-200 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400',
                label: 'Butuh Bantuan',
            },
        };
        const active = variants[status] || variants.pending;
        return (
            <Badge variant="outline" className={cn('rounded-md px-2 py-0.5 font-bold shadow-none', active.className)}>
                {active.label}
            </Badge>
        );
    };

    const RenderMyHistory = () => (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 px-1 text-lg font-bold tracking-tight text-gray-900 uppercase dark:text-gray-100">
                <IconHistory className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                Riwayat Laporan Saya
            </h2>
            <Card className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-none dark:border-[#262626] dark:bg-[#151515]">
                <CardContent className="p-0">
                    <div className="flex flex-col divide-y divide-[#e5e5e5] dark:divide-[#262626]">
                        {myReports && myReports.length > 0 ? (
                            myReports.map((report) => (
                                <Link
                                    key={report.id}
                                    href={route('reports.show', report.id)}
                                    className="group flex flex-col justify-between p-4 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] sm:flex-row sm:items-center"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="truncate text-sm font-bold text-gray-900 transition-colors group-hover:text-[#b42826] dark:text-gray-100 dark:group-hover:text-[#e54845]">
                                            {report.title}
                                        </h4>
                                        <div className="mt-1 flex flex-col gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 sm:flex-row sm:items-center sm:gap-2.5">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <IconMapPin className="h-3.5 w-3.5 shrink-0" />{' '}
                                                <span className="truncate">
                                                    {report.address || 'Lokasi Terdeteksi'}
                                                </span>
                                            </span>
                                            <span className="hidden text-gray-300 dark:text-gray-600 sm:inline">•</span>
                                            <span className="flex shrink-0 items-center gap-1.5">
                                                <IconClock className="h-3.5 w-3.5 shrink-0" />{' '}
                                                {new Date(report.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 mt-3 shrink-0 sm:mt-0 sm:justify-end">
                                        <StatusBadge status={report.status} />
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent shadow-none transition-colors group-hover:border-[#e5e5e5] group-hover:bg-white dark:group-hover:border-[#333] dark:group-hover:bg-[#262626]">
                                            <IconChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#b42826] dark:group-hover:text-gray-200" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-gray-50/50 px-4 py-10 text-center dark:bg-[#101010]/50">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-gray-400 shadow-none dark:border-[#333] dark:bg-[#151515]">
                                    <IconHistory className="w-6 h-6" stroke={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                    Belum ada riwayat
                                </h3>
                                <p className="mt-1 max-w-[250px] text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Laporan kejadian darurat yang Anda buat akan muncul di sini.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const RenderRadarFeed = () => (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-gray-900 uppercase dark:text-gray-100">
                    <IconCheckupList className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    {isRelawan ? 'Radar Insiden' : 'Kejadian di Sekitar'}
                </h2>

                {isRelawan && (
                    <div className="no-scrollbar flex space-x-1 overflow-x-auto rounded-lg border border-[#e5e5e5] bg-gray-100 p-1 shadow-none dark:border-[#262626] dark:bg-[#101010]">
                        <button
                            onClick={() => setActiveTab('menunggu')}
                            className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold outline-none transition-colors',
                                activeTab === 'menunggu'
                                    ? 'border border-[#e5e5e5] bg-white text-[#b42826] dark:border-[#333] dark:bg-[#151515] dark:text-[#e54845]'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                            )}
                        >
                            <IconAlertCircle className="w-4 h-4" stroke={activeTab === 'menunggu' ? 2 : 1.5} /> Butuh
                            Respons
                        </button>
                        <button
                            onClick={() => setActiveTab('tugas_saya')}
                            className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold outline-none transition-colors',
                                activeTab === 'tugas_saya'
                                    ? 'border border-[#e5e5e5] bg-white text-gray-900 dark:border-[#333] dark:bg-[#151515] dark:text-white'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                            )}
                        >
                            <IconUserCheck className="w-4 h-4" stroke={activeTab === 'tugas_saya' ? 2 : 1.5} /> Tugas
                            Saya
                        </button>
                        <button
                            onClick={() => setActiveTab('semua')}
                            className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold outline-none transition-colors',
                                activeTab === 'semua'
                                    ? 'border border-[#e5e5e5] bg-white text-gray-900 dark:border-[#333] dark:bg-[#151515] dark:text-white'
                                    : 'border border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                            )}
                        >
                            <IconCheckupList className="w-4 h-4" stroke={activeTab === 'semua' ? 2 : 1.5} /> Semua
                            Laporan
                        </button>
                    </div>
                )}
            </div>

            {filteredReports.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e5e5e5] bg-gray-50/50 p-12 text-center shadow-none dark:border-[#333] dark:bg-[#101010]">
                    <div className="mb-4 rounded-full border border-[#e5e5e5] bg-gray-100 p-4 dark:border-[#262626] dark:bg-[#151515]">
                        <IconShieldCheck className="w-8 h-8 text-gray-400 dark:text-gray-500" stroke={1.5} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {activeTab === 'menunggu'
                            ? 'Kondisi Terkendali'
                            : activeTab === 'tugas_saya'
                                ? 'Belum Ada Tugas'
                                : 'Data Kosong'}
                    </h3>
                    <p className="max-w-sm mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        {activeTab === 'menunggu'
                            ? 'Tidak ada laporan baru di sekitar yang membutuhkan respons.'
                            : activeTab === 'tugas_saya'
                                ? 'Anda belum mengambil tugas penyelamatan apa pun saat ini.'
                                : 'Tidak ada data laporan tersedia.'}
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
                                isRelawan={isRelawan}
                                onSuccess={() => router.reload({ only: ['page_data'] })}
                            />
                        ))}
                    </div>
                    {nextPageUrl && (
                        <div className="flex justify-center w-full pt-4 pb-8">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={isLoadingMore}
                                className="flex h-8 items-center gap-2 rounded-md border border-[#e5e5e5] bg-white px-5 text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-none transition-colors hover:bg-gray-50 dark:border-[#333] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1a1a1a]"
                            >
                                {isLoadingMore ? (
                                    <>
                                        <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> Memuat...
                                    </>
                                ) : (
                                    <>
                                        <IconRefresh className="h-3.5 w-3.5" /> Muat Lebih Banyak
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    return (
        <div className="flex flex-col w-full pb-32 mx-auto space-y-6 max-w-7xl">
            <IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />

            <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 uppercase dark:text-gray-100">
                    Halo, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            'rounded-md border border-[#e5e5e5] px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest shadow-none dark:border-[#333]',
                            isRelawan
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                                : 'bg-gray-100 text-gray-700 dark:bg-[#1a1a1a] dark:text-gray-400',
                        )}
                    >
                        <IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
                        {isRelawan ? 'Relawan Siaga' : 'Warga Umum'}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <IconMapPin className="h-3.5 w-3.5 text-[#b42826] dark:text-[#e54845]" /> Pusat Komando Sisupit
                    </span>
                </div>
            </div>

            <div className="w-full">
                {isRelawan ? (
                    <Card
                        className={cn(
                            'overflow-hidden rounded-xl border shadow-none transition-colors',
                            isStandby
                                ? 'border-[#b42826] bg-red-50 dark:border-[#4a1c1c] dark:bg-[#2a1313]'
                                : 'border-[#e5e5e5] bg-white dark:border-[#262626] dark:bg-[#151515]',
                        )}
                    >
                        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
                                        isStandby
                                            ? 'border-red-200 bg-white text-[#b42826] dark:border-red-900 dark:bg-[#151515] dark:text-[#e54845]'
                                            : 'border-[#e5e5e5] bg-gray-50 text-gray-400 dark:border-[#333] dark:bg-[#101010] dark:text-gray-500',
                                    )}
                                >
                                    <IconRadar className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div>
                                    <h3
                                        className={cn(
                                            'text-sm font-bold',
                                            isStandby
                                                ? 'text-red-900 dark:text-red-200'
                                                : 'text-gray-900 dark:text-gray-100',
                                        )}
                                    >
                                        Mode Kesiapan
                                    </h3>
                                    <p
                                        className={cn(
                                            'mt-0.5 text-xs font-medium',
                                            isStandby
                                                ? 'text-red-700/80 dark:text-red-400/80'
                                                : 'text-gray-500 dark:text-gray-400',
                                        )}
                                    >
                                        Terima notif darurat sekitar.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={isStandby ? 'default' : 'outline'}
                                className={cn(
                                    'h-8 w-full shrink-0 rounded-md px-4 text-[10px] font-bold uppercase tracking-wider shadow-none transition-colors sm:w-auto',
                                    isStandby
                                        ? 'border border-[#9a2220] bg-[#b42826] text-white hover:bg-[#9a2220]'
                                        : 'border-[#e5e5e5] bg-white text-gray-700 hover:bg-gray-50 dark:border-[#333] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1a1a1a]',
                                )}
                                onClick={() => setIsStandby(!isStandby)}
                            >
                                <IconPower className="mr-1.5 h-3.5 w-3.5" />
                                {isStandby ? 'Siaga Aktif' : 'Mulai Siaga'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-none transition-colors dark:border-[#262626] dark:bg-[#151515]">
                        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#e5e5e5] bg-gray-50 text-gray-900 dark:border-[#333] dark:bg-[#101010] dark:text-gray-300">
                                    <IconUsersGroup className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Bantu Sesama</h3>
                                    <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Daftar jadi relawan damkar.
                                    </p>
                                </div>
                            </div>
                            {/* 👇 FIX: TOMBOL PENDAFTARAN RELAWAN (FUNCTIONAL) 👇 */}
                            <Button 
                                onClick={handleRegisterVolunteer}
                                disabled={isRegistering}
                                className="h-8 w-full shrink-0 rounded-md border border-transparent bg-gray-900 px-4 text-[10px] font-bold uppercase tracking-wider text-white shadow-none transition-colors hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 sm:w-auto"
                            >
                                {isRegistering ? (
                                    <><IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Mendaftar...</>
                                ) : (
                                    'Daftar Relawan'
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            <hr className="border-[#e5e5e5] dark:border-[#262626]" />

            {isRelawan ? (
                <>
                    <RenderRadarFeed />
                    <hr className="border-[#e5e5e5] pt-4 dark:border-[#262626]" />
                    <RenderMyHistory />
                </>
            ) : (
                <>
                    <RenderMyHistory />
                    <hr className="border-[#e5e5e5] pt-4 dark:border-[#262626]" />
                    <RenderRadarFeed />
                </>
            )}
        </div>
    );
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Beranda'} />;