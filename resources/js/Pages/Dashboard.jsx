import ReportCard from '@/Components/ReportCard';
import StatusBadge from '@/Components/StatusBadge';
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
    IconDeviceFloppy,
    IconFlame,
    IconHistory,
    IconLoader2,
    IconMapPin,
    IconMedal,
    IconPower,
    IconRadar,
    IconRefresh,
    IconShieldCheck,
    IconUserCheck,
    IconUsersGroup,
} from '@tabler/icons-react';

// Harus selaras dengan VolunteerController::SKILL_OPTIONS (whitelist server).
const SKILL_OPTIONS = [
    'Pemadaman',
    'P3K / Medis',
    'Evakuasi',
    'SAR',
    'Distribusi Air',
    'Logistik',
    'Komunikasi',
    'Pengaturan Lalu Lintas',
];
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard(props) {
    const auth = props.auth.user;
    const firstName = auth?.name ? auth.name.split(' ').find((word) => word.length >= 3) || 'Warga' : 'Warga';

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
    const isStandby = auth?.is_standby ?? true;
    const [isTogglingStandby, setIsTogglingStandby] = useState(false);

    // Editor keahlian relawan (lihat VolunteerController::updateSkills)
    const [skills, setSkills] = useState(Array.isArray(auth?.skills) ? auth.skills : []);
    const [isSavingSkills, setIsSavingSkills] = useState(false);

    const toggleSkill = (skill) => {
        setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
    };

    const handleSaveSkills = () => {
        setIsSavingSkills(true);
        router.post(route('volunteer.skills'), { skills }, {
            preserveScroll: true,
            onSuccess: () => toast.success('Keahlian berhasil diperbarui.'),
            onError: () => toast.error('Gagal menyimpan keahlian. Silakan coba lagi.'),
            onFinish: () => setIsSavingSkills(false),
        });
    };

    const handleToggleStandby = () => {
        setIsTogglingStandby(true);
        router.post(route('volunteer.standby'), {}, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(isStandby ? 'Siaga dinonaktifkan. Anda tidak akan menerima notifikasi insiden.' : 'Siaga diaktifkan. Anda akan menerima notifikasi insiden.');
            },
            onError: () => toast.error('Gagal mengubah status siaga. Silakan coba lagi.'),
            onFinish: () => setIsTogglingStandby(false),
        });
    };

    useEffect(() => {
        if (!isRelawan) setActiveTab('semua');
    }, [isRelawan]);

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

    const RenderMyHistory = () => (
        <div className="space-y-4">
            <h2 className="flex items-center gap-2 px-1 text-lg font-bold tracking-tight text-foreground">
                <IconHistory className="w-5 h-5 text-muted-foreground" />
                Riwayat Laporan Saya
            </h2>
            <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-none">
                <CardContent className="p-0">
                    <div className="flex flex-col divide-y divide-border">
                        {myReports && myReports.length > 0 ? (
                            myReports.map((report) => (
                                <Link
                                    key={report.id}
                                    href={route('reports.show', report.id)}
                                    className="group flex flex-col justify-between p-4 transition-colors duration-200 hover:bg-muted sm:flex-row sm:items-center"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-destructive">
                                            {report.title}
                                        </h4>
                                        <div className="mt-1 flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:gap-2.5">
                                            <span className="flex items-center gap-1.5 truncate">
                                                <IconMapPin className="h-3.5 w-3.5 shrink-0" />{' '}
                                                <span className="truncate">
                                                    {report.address || 'Lokasi Terdeteksi'}
                                                </span>
                                            </span>
                                            <span className="hidden text-muted-foreground/60 sm:inline">•</span>
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
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent shadow-none transition-colors group-hover:border-border group-hover:bg-card">
                                            <IconChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-destructive" />
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center bg-muted/50 px-4 py-10 text-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-none">
                                    <IconHistory className="w-6 h-6" stroke={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-foreground">
                                    Belum ada riwayat
                                </h3>
                                <p className="mt-1 max-w-[250px] text-xs font-medium text-muted-foreground">
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
                <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground">
                    <IconCheckupList className="w-5 h-5 text-muted-foreground" />
                    {isRelawan ? 'Radar Insiden' : 'Kejadian di Sekitar'}
                </h2>

                {isRelawan && (
                    <div className="no-scrollbar flex space-x-1 overflow-x-auto rounded-lg border border-border bg-muted p-1 shadow-none">
                        <button
                            onClick={() => setActiveTab('menunggu')}
                            className={cn(
                                'flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-bold outline-none transition-colors',
                                activeTab === 'menunggu'
                                    ? 'border border-border bg-card text-destructive'
                                    : 'border border-transparent text-muted-foreground hover:text-foreground',
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
                                    ? 'border border-border bg-card text-foreground'
                                    : 'border border-transparent text-muted-foreground hover:text-foreground',
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
                                    ? 'border border-border bg-card text-foreground'
                                    : 'border border-transparent text-muted-foreground hover:text-foreground',
                            )}
                        >
                            <IconCheckupList className="w-4 h-4" stroke={activeTab === 'semua' ? 2 : 1.5} /> Semua
                            Laporan
                        </button>
                    </div>
                )}
            </div>

            {filteredReports.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-12 text-center shadow-none">
                    <div className="mb-4 rounded-full border border-border bg-muted p-4">
                        <IconShieldCheck className="w-8 h-8 text-muted-foreground" stroke={1.5} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">
                        {activeTab === 'menunggu'
                            ? 'Kondisi Terkendali'
                            : activeTab === 'tugas_saya'
                                ? 'Belum Ada Tugas'
                                : 'Data Kosong'}
                    </h3>
                    <p className="max-w-sm mt-1 text-xs font-medium text-muted-foreground">
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
                                className="flex h-8 items-center gap-2 rounded-md border border-border bg-card px-5 text-[10px] font-bold uppercase tracking-wider text-foreground/80 shadow-none transition-colors hover:bg-muted"
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
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Halo, {firstName}!
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                        variant="outline"
                        className={cn(
                            'rounded-md border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-none',
                            isRelawan
                                ? 'bg-foreground text-background'
                                : 'bg-muted text-foreground/80',
                        )}
                    >
                        <IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
                        {isRelawan ? 'Relawan Siaga' : 'Warga Umum'}
                    </Badge>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <IconMapPin className="h-3.5 w-3.5 text-destructive" /> Layanan Darurat Sisupit
                    </span>
                </div>
            </div>

            {/* CTA UTAMA: LAPOR DARURAT — aksi inti yang harus paling menonjol bagi warga */}
            <Link
                href={route('front.reports.create')}
                className="group flex items-center justify-between gap-3 rounded-xl border border-destructive bg-destructive p-4 text-destructive-foreground shadow-none transition-colors hover:bg-destructive/90"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive-foreground/30 bg-destructive-foreground/10">
                        <IconFlame className="w-5 h-5" stroke={2} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold">Lapor Darurat</h3>
                        <p className="mt-0.5 text-xs font-medium text-destructive-foreground/80">
                            Kebakaran atau keadaan darurat lain? Laporkan sekarang.
                        </p>
                    </div>
                </div>
                <IconChevronRight className="w-5 h-5 shrink-0" />
            </Link>

            <div className="w-full">
                {isRelawan ? (
                    <Card
                        className={cn(
                            'overflow-hidden rounded-xl border shadow-none transition-colors',
                            isStandby
                                ? 'border-destructive bg-destructive/10'
                                : 'border-border bg-card',
                        )}
                    >
                        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md border',
                                        isStandby
                                            ? 'border-destructive/30 bg-card text-destructive'
                                            : 'border-border bg-muted text-muted-foreground',
                                    )}
                                >
                                    <IconRadar className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div>
                                    <h3
                                        className={cn(
                                            'text-sm font-bold',
                                            isStandby
                                                ? 'text-destructive'
                                                : 'text-foreground',
                                        )}
                                    >
                                        Mode Kesiapan
                                    </h3>
                                    <p
                                        className={cn(
                                            'mt-0.5 text-xs font-medium',
                                            isStandby
                                                ? 'text-destructive/80'
                                                : 'text-muted-foreground',
                                        )}
                                    >
                                        {isStandby
                                            ? 'Anda menerima notifikasi insiden sesuai wilayah & aturan siaran.'
                                            : 'Anda tidak menerima notifikasi insiden sampai siaga diaktifkan kembali.'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={isStandby ? 'default' : 'outline'}
                                disabled={isTogglingStandby}
                                className={cn(
                                    'h-8 w-full shrink-0 rounded-md px-4 text-[10px] font-bold uppercase tracking-wider shadow-none transition-colors sm:w-auto',
                                    isStandby
                                        ? 'border border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                        : 'border-border bg-card text-foreground/80 hover:bg-muted',
                                )}
                                onClick={handleToggleStandby}
                            >
                                {isTogglingStandby ? (
                                    <IconLoader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <IconPower className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {isStandby ? 'Siaga Aktif' : 'Mulai Siaga'}
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-none transition-colors">
                        <CardContent className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                                    <IconUsersGroup className="w-5 h-5" stroke={1.5} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">Bantu Sesama</h3>
                                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                        Daftar jadi relawan damkar.
                                    </p>
                                </div>
                            </div>
                            {/* 👇 FIX: TOMBOL PENDAFTARAN RELAWAN (FUNCTIONAL) 👇 */}
                            <Button
                                onClick={handleRegisterVolunteer}
                                disabled={isRegistering}
                                className="h-8 w-full shrink-0 rounded-md border border-transparent bg-foreground px-4 text-[10px] font-bold uppercase tracking-wider text-background shadow-none transition-colors hover:bg-foreground/90 sm:w-auto"
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

            {/* EDITOR KEAHLIAN — relawan mengatur keahlian yang tampil di Daftar Relawan */}
            {isRelawan && (
                <Card className="overflow-hidden rounded-xl border border-border bg-card shadow-none">
                    <CardContent className="flex flex-col gap-4 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                                <IconMedal className="w-5 h-5" stroke={1.5} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground">Keahlian Saya</h3>
                                <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                                    Pilih keahlian Anda agar Pusat Komando tahu kemampuan Anda saat insiden.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map((skill) => {
                                const selected = skills.includes(skill);
                                return (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => toggleSkill(skill)}
                                        className={cn(
                                            'flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                                            selected
                                                ? 'border-destructive bg-destructive/10 text-destructive'
                                                : 'border-border bg-card text-foreground/80 hover:bg-muted',
                                        )}
                                    >
                                        <IconMedal className="w-3.5 h-3.5" stroke={selected ? 2 : 1.5} />
                                        {skill}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                onClick={handleSaveSkills}
                                disabled={isSavingSkills}
                                className="h-8 shrink-0 rounded-md border border-transparent bg-foreground px-4 text-[10px] font-bold uppercase tracking-wider text-background shadow-none transition-colors hover:bg-foreground/90"
                            >
                                {isSavingSkills ? (
                                    <IconLoader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <IconDeviceFloppy className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Simpan Keahlian
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <hr className="border-border" />

            {isRelawan ? (
                <>
                    <RenderRadarFeed />
                    <hr className="border-border pt-4" />
                    <RenderMyHistory />
                </>
            ) : (
                <>
                    <RenderMyHistory />
                    <hr className="border-border pt-4" />
                    <RenderRadarFeed />
                </>
            )}
        </div>
    );
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Beranda'} />;