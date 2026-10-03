import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import ReportCard from '@/Components/ReportCard';
import { ReportStepper } from '@/Components/ReportProgress';
import StandbyCard from '@/Components/StandbyCard';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { reportIcon } from '@/lib/report-icon';
import { cn, GEO_OPTIONS, reportNumber, timeAgo } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheckupList,
	IconChevronRight,
	IconFlame,
	IconHistory,
	IconLoader2,
	IconMapPin,
	IconRadar,
	IconRefresh,
	IconShieldCheck,
	IconUserCheck,
} from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function Dashboard(props) {
	const auth = props.auth.user;
	const firstName = auth?.name ? auth.name.split(' ').find((word) => word.length >= 3) || 'Warga' : 'Warga';

	const myReports = props.myReports || [];
	// Laporan milik sendiri yang masih berjalan (#165) - status & tahapnya di puncak Beranda.
	const activeReports = props.activeReports || [];
	// Tugas relawan ini (lintas wilayah, bypass scope desa) — dipakai khusus tab "Tugas Saya"
	// agar tugasnya sendiri tak hilang saat insidennya di luar desanya.
	const myTasks = props.myTasks || [];
	const initialReports = props.page_data?.reports?.data || [];
	const initialNextPageUrl = props.page_data?.reports?.links?.next || null;

	const [reports, setReports] = useState(initialReports);
	const [nextPageUrl, setNextPageUrl] = useState(initialNextPageUrl);
	const [isLoadingMore, setIsLoadingMore] = useState(false);

	// Kejadian baru / status berubah di wilayah ini. Feed halaman ini punya state LOKAL karena
	// gulir-tak-berujung menambahkan halaman berikutnya ke dalamnya, jadi memuat ulang prop saja
	// tidak cukup — sementara mengganti seluruh daftar akan merenggut halaman-halaman yang sudah
	// digulir pengguna. Karena itu halaman PERTAMA yang segar digabungkan: baris yang sudah ada
	// diperbarui di tempatnya, yang benar-benar baru masuk di puncak (server mengurutkan
	// created_at menurun, jadi yang baru memang milik puncak).
	const mergeFreshPage = (incoming) => {
		if (!Array.isArray(incoming)) return;

		setReports((prev) => {
			const fresh = new Map(incoming.map((report) => [report.id, report]));
			const known = new Set(prev.map((report) => report.id));

			return [
				...incoming.filter((report) => !known.has(report.id)),
				...prev.map((report) => fresh.get(report.id) ?? report),
			];
		});
	};

	// Sengaja menembak route('dashboard'), bukan router.reload(): setelah "muat lebih banyak"
	// URL halaman ini sudah berpindah ke ?page=N, dan memuat ulang URL ITU akan mengambil
	// halaman N — padahal kejadian baru selalu ada di halaman pertama.
	useReportFeed(props.feed_channel, () =>
		router.get(
			route('dashboard'),
			{},
			{
				only: ['page_data', 'myReports', 'myTasks', 'activeReports'],
				preserveState: true,
				preserveScroll: true,
				replace: true,
				onSuccess: (page) => mergeFreshPage(page.props.page_data?.reports?.data),
			},
		),
	);

	// Feed wilayah di atas tidak menjangkau laporan sendiri yang lokasinya di luar wilayah akun,
	// jadi kartu "Laporan Anda" berlangganan channel tiap laporannya sendiri - channel yang sama
	// dengan halaman Thanks & detail (pelapor memang berhak di sana). Isinya tetap dimuat ulang
	// dari server, bukan disusun dari payload siaran.
	const activeIds = activeReports.map((r) => r.id).join(',');
	useEffect(() => {
		if (!activeIds || !window.Echo) return;

		const names = activeIds.split(',').map((id) => `report-tracking.${id}`);
		names.forEach((name) =>
			window.Echo.private(name).listen('ReportStatusChanged', () =>
				router.reload({ only: ['activeReports', 'myReports'] }),
			),
		);

		return () => names.forEach((name) => window.Echo.leave(name));
	}, [activeIds]);

	const userRoles = Array.isArray(auth?.role) ? auth.role : auth?.role ? [auth.role] : [];
	const isRelawan = userRoles.includes('relawan');

	const [activeTab, setActiveTab] = useState(isRelawan ? 'menunggu' : 'semua');
	const isStandby = auth?.is_standby ?? true;
	const [isTogglingStandby, setIsTogglingStandby] = useState(false);

	// Fix GPS relawan (sekali) untuk menaksir jarak ke tiap insiden di feed (senyap bila ditolak).
	const [myPos, setMyPos] = useState(null);
	useEffect(() => {
		if (!isRelawan || !navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(p) => setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
			() => {},
			GEO_OPTIONS.oneShot,
		);
	}, [isRelawan]);

	const handleToggleStandby = () => {
		setIsTogglingStandby(true);
		router.post(
			route('profile.standby'),
			{},
			{
				preserveScroll: true,
				onSuccess: () => {
					toast.success(
						isStandby
							? 'Siaga dinonaktifkan. Anda tidak akan menerima notifikasi insiden.'
							: 'Siaga diaktifkan. Anda akan menerima notifikasi insiden.',
					);
				},
				onError: () => toast.error('Gagal mengubah status siaga. Silakan coba lagi.'),
				onFinish: () => setIsTogglingStandby(false),
			},
		);
	};

	useEffect(() => {
		if (!isRelawan) setActiveTab('semua');
	}, [isRelawan]);

	// Feed ter-scope desa untuk tab "Butuh Respons" & "Semua Laporan".
	const feedReports = useMemo(() => {
		return reports.filter((report) => {
			if (activeTab === 'menunggu') {
				// "Butuh Respons" = insiden yang MASIH aktif (belum selesai) dan belum kamu
				// ikuti — bukan sekadar "tanpa helper". Jadi banyak relawan bisa merespons satu
				// insiden, dan baru hilang dari antrianmu saat kamu bergabung atau insiden selesai.
				const isMyTask = report.helpers?.some((h) => h.user_id === auth.id);
				return report.status !== 'resolved' && !isMyTask;
			}
			return true; // 'semua'
		});
	}, [reports, activeTab, auth.id]);

	// "Tugas Saya" memakai sumber terpisah (myTasks, lintas wilayah); tab lain pakai feed.
	const displayedReports = activeTab === 'tugas_saya' ? myTasks : feedReports;

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
		<AppSection
			title="Riwayat Laporan Saya"
			icon={IconHistory}
			action={myReports?.length > 3 ? { href: route('front.reports.index'), label: 'Lihat semua' } : undefined}
		>
			<AppList className="max-md:[&>a:nth-of-type(n+4)]:hidden">
				{myReports && myReports.length > 0 ? (
					myReports.map((report) => {
						// Ikon jenis kejadian - sama dengan halaman Arsip & Riwayat (#161).
						const { Icon: ReportIcon, className: iconStyle } = reportIcon(report);

						return (
							<AppListRow
								key={report.id}
								href={route('reports.show', report.id)}
								leading={
									<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', iconStyle)}>
										<ReportIcon className="h-5 w-5" stroke={2} />
									</div>
								}
								title={report.title}
								aside={
									<>
										<span className="md:hidden">{timeAgo(report.created_at)}</span>
										<span className="hidden md:inline">
											{new Date(report.created_at).toLocaleDateString('id-ID', {
												day: 'numeric',
												month: 'short',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</>
								}
								meta={
									<span className="flex items-start gap-1.5">
										<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
										<span>{report.address || 'Lokasi Terdeteksi'}</span>
									</span>
								}
								badges={<StatusBadge status={report.status} />}
							/>
						);
					})
				) : (
					<AppEmpty
						icon={IconHistory}
						title="Belum ada riwayat"
						description="Laporan kejadian darurat yang Anda buat akan muncul di sini."
					/>
				)}
			</AppList>
		</AppSection>
	);

	const RenderRadarFeed = () => (
		<AppSection title={isRelawan ? 'Radar Insiden' : 'Kejadian di Sekitar'} icon={IconCheckupList}>
			{isRelawan && (
				<div className="no-scrollbar flex space-x-1 overflow-x-auto rounded-xl bg-muted p-1">
					<button
						onClick={() => setActiveTab('menunggu')}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none transition-colors',
							activeTab === 'menunggu'
								? 'border border-border bg-card text-destructive'
								: 'border border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						<IconAlertCircle className="h-4 w-4" stroke={activeTab === 'menunggu' ? 2 : 1.5} /> Butuh
						Respons
					</button>
					<button
						onClick={() => setActiveTab('tugas_saya')}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none transition-colors',
							activeTab === 'tugas_saya'
								? 'border border-border bg-card text-foreground'
								: 'border border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						<IconUserCheck className="h-4 w-4" stroke={activeTab === 'tugas_saya' ? 2 : 1.5} /> Tugas Saya
					</button>
					<button
						onClick={() => setActiveTab('semua')}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold outline-none transition-colors',
							activeTab === 'semua'
								? 'border border-border bg-card text-foreground'
								: 'border border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						<IconCheckupList className="h-4 w-4" stroke={activeTab === 'semua' ? 2 : 1.5} /> Semua Laporan
					</button>
				</div>
			)}

			{displayedReports.length === 0 ? (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<AppEmpty
						icon={IconShieldCheck}
						title={
							activeTab === 'menunggu'
								? 'Kondisi Terkendali'
								: activeTab === 'tugas_saya'
									? 'Belum Ada Tugas'
									: 'Data Kosong'
						}
						description={
							activeTab === 'menunggu'
								? 'Tidak ada laporan baru di sekitar yang membutuhkan respons.'
								: activeTab === 'tugas_saya'
									? 'Anda belum mengambil tugas penyelamatan apa pun saat ini.'
									: 'Tidak ada data laporan tersedia.'
						}
					/>
				</div>
			) : (
				<>
					<div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
						{displayedReports.map((report) => (
							<ReportCard
								key={report.id}
								report={report}
								currentUser={auth}
								isRelawan={isRelawan}
								myPos={myPos}
								onSuccess={() => router.reload({ only: ['page_data'] })}
							/>
						))}
					</div>
					{nextPageUrl && activeTab !== 'tugas_saya' && (
						<div className="flex w-full justify-center pt-4">
							<Button
								variant="outline"
								onClick={handleLoadMore}
								disabled={isLoadingMore}
								className="flex h-10 items-center gap-2 rounded-full border border-border/70 bg-card px-5 text-[13px] font-semibold text-foreground/80 shadow-sm transition-colors hover:bg-muted sm:h-8"
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
		</AppSection>
	);

	return (
		<div className="flex w-full flex-col space-y-5 pb-32 md:space-y-6">
			{/* Pembungkus `mx-auto max-w-7xl` dicabut: AppLayout sudah memberi max-width DAN
			    padding halaman, jadi yang kedua cuma menumpuk. */}
			<AppGreeting
				title={`Halo, ${firstName}!`}
				meta={
					<>
						<Badge
							variant="outline"
							className={cn(
								'rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-none',
								isRelawan ? 'bg-volunteer text-volunteer-foreground' : 'bg-muted text-foreground/80',
							)}
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
							{isRelawan ? 'Relawan Siaga' : 'Warga Umum'}
						</Badge>
						<span className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground md:flex">
							<IconMapPin className="h-3.5 w-3.5 text-destructive" /> Layanan Darurat Sisupit
						</span>
					</>
				}
			/>

			{/* CTA UTAMA: LAPOR DARURAT - aksi inti yang harus paling menonjol bagi warga */}
			<Link
				href={route('front.reports.create')}
				className="group flex items-center justify-between gap-3 rounded-2xl border border-destructive bg-destructive p-4 text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90 active:scale-[0.98] active:bg-destructive/90 motion-reduce:active:scale-100"
			>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive-foreground/15">
						<IconFlame className="h-5 w-5" stroke={2} />
					</div>
					<div>
						<h3 className="text-[17px] font-semibold tracking-tight">Lapor Darurat</h3>
						<p className="mt-0.5 text-xs font-medium text-destructive-foreground/80">
							Kebakaran atau keadaan darurat lain? Laporkan sekarang.
						</p>
					</div>
				</div>
				<IconChevronRight className="h-5 w-5 shrink-0" />
			</Link>

			{/* LAPORAN ANDA YANG MASIH BERJALAN (#165). Halaman Thanks hanya dicapai sekali sesudah
			    kirim; tanpa kartu ini pelapor harus mencari statusnya lewat Riwayat. Ketuk = detail
			    laporan, yang memuat stepper yang sama + posisi bantuan di peta. */}
			{activeReports.length > 0 && (
				<AppSection title="Laporan Anda" icon={IconRadar}>
					<div className="space-y-3">
						{activeReports.map((report) => (
							<Link
								key={report.id}
								href={route('reports.show', report.id)}
								className="block rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-transform active:scale-[0.98] motion-reduce:active:scale-100"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<h3 className="truncate text-[15px] font-semibold text-foreground">
											{report.title}
										</h3>
										<p className="mt-0.5 text-xs text-muted-foreground">
											<span className="font-mono">{reportNumber(report)}</span> -{' '}
											{timeAgo(report.created_at)}
										</p>
									</div>
									<span className="flex shrink-0 items-center gap-0.5 text-[13px] font-medium text-primary">
										Lihat <IconChevronRight className="h-4 w-4" />
									</span>
								</div>
								<ReportStepper status={report.status} className="mt-3" />
							</Link>
						))}
					</div>
				</AppSection>
			)}

			{/* Kartu Mode Kesiapan - HANYA relawan. Cabang sebelahnya dulu berisi ajakan
			    "Daftar Relawan" bagi warga; DICABUT 2026-09-02 atas permintaan user, sehingga
			    peran relawan kini hanya diberikan admin lewat /admin/users. Jangan hidupkan
			    lagi tanpa menanyakan user. */}
			{isRelawan && <StandbyCard isStandby={isStandby} busy={isTogglingStandby} onToggle={handleToggleStandby} />}

			{/* Pemisah `<hr>` antar-seksi dicabut: tiap seksi kini membawa labelnya sendiri
			    (AppSection), dan garis mendatar selebar halaman adalah idiom dokumen. */}
			{isRelawan ? (
				<>
					<RenderRadarFeed />
					<RenderMyHistory />
				</>
			) : (
				<>
					<RenderMyHistory />
					<RenderRadarFeed />
				</>
			)}
		</div>
	);
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Beranda'} />;
