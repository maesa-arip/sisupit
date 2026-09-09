import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import ReportCard from '@/Components/ReportCard';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn, GEO_OPTIONS } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheckupList,
	IconChevronRight,
	IconClock,
	IconFlame,
	IconHistory,
	IconLoader2,
	IconMapPin,
	IconPower,
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
				only: ['page_data', 'myReports', 'myTasks'],
				preserveState: true,
				preserveScroll: true,
				replace: true,
				onSuccess: (page) => mergeFreshPage(page.props.page_data?.reports?.data),
			},
		),
	);

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
		<AppSection title="Riwayat Laporan Saya" icon={IconHistory}>
			<AppList>
				{myReports && myReports.length > 0 ? (
					myReports.map((report) => (
						<AppListRow
							key={report.id}
							href={route('reports.show', report.id)}
							title={report.title}
							meta={
								<>
									<span className="flex min-w-0 items-center gap-1.5">
										<IconMapPin className="h-3.5 w-3.5 shrink-0" />
										<span className="truncate">{report.address || 'Lokasi Terdeteksi'}</span>
									</span>
									<span className="text-muted-foreground/60">•</span>
									<span className="flex shrink-0 items-center gap-1.5">
										<IconClock className="h-3.5 w-3.5 shrink-0" />
										{new Date(report.created_at).toLocaleDateString('id-ID', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
											hour: '2-digit',
											minute: '2-digit',
										})}
									</span>
								</>
							}
							trailing={<StatusBadge status={report.status} />}
						/>
					))
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
						<IconAlertCircle className="h-4 w-4" stroke={activeTab === 'menunggu' ? 2 : 1.5} /> Butuh
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
						<IconUserCheck className="h-4 w-4" stroke={activeTab === 'tugas_saya' ? 2 : 1.5} /> Tugas Saya
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
						<IconCheckupList className="h-4 w-4" stroke={activeTab === 'semua' ? 2 : 1.5} /> Semua Laporan
					</button>
				</div>
			)}

			{displayedReports.length === 0 ? (
				<div className="rounded-xl border border-dashed border-border bg-muted/50">
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
								className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-5 text-[10px] font-bold uppercase tracking-wider text-foreground/80 shadow-none transition-colors hover:bg-muted sm:h-8"
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
								'rounded-md border border-border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-none',
								isRelawan ? 'bg-foreground text-background' : 'bg-muted text-foreground/80',
							)}
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
							{isRelawan ? 'Relawan Siaga' : 'Warga Umum'}
						</Badge>
						<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
							<IconMapPin className="h-3.5 w-3.5 text-destructive" /> Layanan Darurat Sisupit
						</span>
					</>
				}
			/>

			{/* CTA UTAMA: LAPOR DARURAT - aksi inti yang harus paling menonjol bagi warga */}
			<Link
				href={route('front.reports.create')}
				className="group flex items-center justify-between gap-3 rounded-xl border border-destructive bg-destructive p-4 text-destructive-foreground shadow-none transition-colors hover:bg-destructive/90 active:bg-destructive/90"
			>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive-foreground/30 bg-destructive-foreground/10">
						<IconFlame className="h-5 w-5" stroke={2} />
					</div>
					<div>
						<h3 className="text-sm font-bold">Lapor Darurat</h3>
						<p className="mt-0.5 text-xs font-medium text-destructive-foreground/80">
							Kebakaran atau keadaan darurat lain? Laporkan sekarang.
						</p>
					</div>
				</div>
				<IconChevronRight className="h-5 w-5 shrink-0" />
			</Link>

			{/* Kartu Mode Kesiapan - HANYA relawan. Cabang sebelahnya dulu berisi ajakan
			    "Daftar Relawan" bagi warga; DICABUT 2026-09-02 atas permintaan user, sehingga
			    peran relawan kini hanya diberikan admin lewat /admin/users. Jangan hidupkan
			    lagi tanpa menanyakan user. */}
			{isRelawan && (
				<Card
					className={cn(
						'overflow-hidden rounded-xl border shadow-none transition-colors',
						isStandby ? 'border-destructive bg-destructive/10' : 'border-border bg-card',
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
								<IconRadar className="h-5 w-5" stroke={1.5} />
							</div>
							<div>
								<h3
									className={cn(
										'text-sm font-bold',
										isStandby ? 'text-destructive' : 'text-foreground',
									)}
								>
									Mode Kesiapan
								</h3>
								<p
									className={cn(
										'mt-0.5 text-xs font-medium',
										isStandby ? 'text-destructive/80' : 'text-muted-foreground',
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
								'h-10 w-full shrink-0 rounded-md px-4 text-[10px] font-bold uppercase tracking-wider shadow-none transition-colors sm:h-8 sm:w-auto',
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
							{/* Label = KEADAAN, bukan ajakan (permintaan user 2026-08-26). Dulu berbunyi
							    'Siaga Aktif' saat menyala tapi 'Mulai Siaga' saat mati - satu keadaan
							    dibaca sebagai status, satunya sebagai perintah, sehingga tak jelas mana
							    yang sedang berlaku. Kini keduanya simetris. */}
							{isStandby ? 'Siaga' : 'Non Aktif'}
						</Button>
					</CardContent>
				</Card>
			)}

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
