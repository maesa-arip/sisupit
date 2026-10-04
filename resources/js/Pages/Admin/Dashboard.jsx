import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StandbyCard from '@/Components/StandbyCard';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import useRealtimeStatus from '@/hooks/use-realtime-status';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { firstName as getFirstName } from '@/lib/first-name';
import { reportIcon } from '@/lib/report-icon';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheck,
	IconChevronRight,
	IconDroplet,
	IconFiretruck,
	IconFlame,
	IconMapPin,
	IconMapSearch,
	IconShieldCheck,
	IconUsersGroup,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const REALTIME_META = {
	connected: { label: 'Realtime aktif', text: 'text-success', dot: 'bg-success' },
	connecting: { label: 'Menyambung ulang...', text: 'text-warning', dot: 'bg-warning' },
	offline: { label: 'Realtime terputus', text: 'text-destructive', dot: 'bg-destructive' },
	disabled: { label: 'Realtime nonaktif', text: 'text-muted-foreground', dot: 'bg-muted-foreground' },
};

export default function AdminDashboard({ auth, stats, recentReports, isPejabat = false, feed_channel = null }) {
	const isTopLevelAdmin = !auth?.user?.city_code;
	const realtimeStatus = useRealtimeStatus();

	// Kejadian baru masuk / status berubah di wilayah ini — segarkan kartu statistik & daftar
	// laporan terbaru tanpa perlu me-reload halaman.
	useReportFeed(feed_channel, () => router.reload({ only: ['stats', 'recentReports'] }));

	// Siaga notifikasi pejabat — kembaran kartu "Mode Kesiapan" relawan di Pages/Dashboard.jsx,
	// endpoint & kolom yang sama (profile.standby / users.is_standby). Hanya pejabat & relawan
	// yang punya saklar ini; admin/petugas Pusat Komando sengaja tidak (User::STANDBY_ROLES).
	const isStandby = auth?.user?.is_standby ?? true;
	const [isTogglingStandby, setIsTogglingStandby] = useState(false);

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

	const getAdminLevelName = () => {
		if (auth?.user?.village_code) return `Desa/Kelurahan`;
		if (auth?.user?.district_code) return `Kecamatan`;
		if (auth?.user?.city_code) return `Kabupaten/Kota`;
		if (auth?.user?.province_code) return `Provinsi`;
		// Hanya superadmin yang benar-benar nasional; admin tanpa wilayah = belum diisi (#44).
		return (auth?.user?.role || []).includes('superadmin') ? 'Pusat (Nasional)' : 'Belum diisi';
	};

	const currentStats = stats || { active_reports: 0, standby_helpers: 0, active_hydrants: 0, resolved_this_month: 0 };
	const reports = recentReports || [];

	// Petak statistik. Di ponsel ia PETAK 2 KOLOM yang ringkas (ikon kiri, angka kanan, label
	// di bawah) supaya ketiga angka terbaca sekaligus tanpa menggulir - bentuk lama menumpuk
	// tiga kartu setinggi `p-5` + angka `text-3xl` secara vertikal, sehingga daftar insiden
	// baru terlihat setelah melewati semuanya. Gulir mendatar sengaja TIDAK dipakai (pilihan
	// user 2026-09-09): di aplikasi darurat angka "Darurat Aktif" tak boleh bisa tersembunyi
	// di luar layar. Mulai `md` bentuknya kembali persis seperti sebelumnya.
	const StatCard = ({
		title,
		value,
		icon: Icon,
		colorClass,
		bgIconClass,
		subtitle,
		isCritical = false,
		href,
		className,
	}) => {
		const hasEmergency = isCritical && value > 0;
		const card = (
			<Card
				className={cn(
					'h-full rounded-2xl border shadow-sm transition-all',
					hasEmergency
						? 'border-destructive bg-destructive text-destructive-foreground shadow-destructive/20 duration-500 animate-in zoom-in-95'
						: 'border-border/70 bg-card hover:border-border',
					href && 'cursor-pointer hover:shadow-md',
				)}
			>
				<CardContent className="p-3.5 md:p-5 lg:p-6">
					<div className="flex items-center justify-between gap-2">
						{/* Ikon: HANYA mulai `md` (kanan) - di ponsel sengaja disembunyikan supaya keempat
						    angka muat sekaligus (#159 bagian 16, dijaga AppleDesignMaterialTest). Komentar
						    lama menyebut "kiri di ponsel", keliru sejak ikon disembunyikan (TASK_71). */}
						<div
							className={cn(
								'order-1 hidden shrink-0 rounded-xl p-2 md:order-2 md:block md:rounded-2xl md:p-3.5',
								hasEmergency ? 'bg-destructive-foreground/20' : bgIconClass,
							)}
						>
							<Icon
								className={cn(
									'h-5 w-5 md:h-6 md:w-6',
									hasEmergency ? 'text-destructive-foreground' : colorClass,
								)}
								stroke={2}
							/>
						</div>
						<div className="order-2 min-w-0 md:order-1 md:space-y-1.5">
							<p
								className={cn(
									'hidden text-sm font-medium md:block',
									hasEmergency ? 'text-destructive-foreground/80' : 'text-muted-foreground',
								)}
							>
								{title}
							</p>
							<div
								className={cn(
									'text-3xl font-bold tabular-nums tracking-tight md:text-4xl',
									hasEmergency ? 'text-destructive-foreground' : 'text-foreground',
								)}
							>
								{value}
							</div>
						</div>
					</div>
					<p
						className={cn(
							'mt-0.5 truncate text-[13px] font-medium md:hidden',
							hasEmergency ? 'text-destructive-foreground/80' : 'text-muted-foreground',
						)}
					>
						{title}
					</p>
					{subtitle && (
						<div
							className={cn(
								'mt-3 hidden text-xs text-muted-foreground md:block',
								hasEmergency ? 'text-destructive-foreground/70' : 'text-muted-foreground',
							)}
						>
							{subtitle}
						</div>
					)}
				</CardContent>
			</Card>
		);

		if (!href) return <div className={className}>{card}</div>;

		return (
			<Link
				href={href}
				className={cn(
					'block rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-reduce:active:scale-100',
					className,
				)}
			>
				{card}
			</Link>
		);
	};

	return (
		<div className="h-full w-full space-y-5 pb-10 md:space-y-6 lg:space-y-8">
			<Head title={isPejabat ? 'Dashboard Eksekutif' : 'Pusat Komando'} />

			{/* KEPALA HALAMAN — bingkai kartunya hanya mulai `md` (lihat AppGreeting): kepala
			    halaman berbingkai adalah hal pertama yang membuat layar ponsel terbaca sebagai
			    halaman web, dan di sini ia memakan sepertiga layar sebelum ada satu data pun. */}
			<AppGreeting
				title={`Halo, ${getFirstName(auth.user.name, 'Admin')}`}
				meta={
					<>
						<Badge
							variant="secondary"
							className={cn(
								'rounded-full border-none px-2.5 py-0.5 font-semibold',
								isPejabat ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive',
							)}
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
							{isPejabat ? 'Pejabat/Eksekutif' : 'Administrator'}
						</Badge>
						<span className="hidden items-center gap-1 text-xs font-medium text-muted-foreground md:flex md:text-sm">
							<IconMapPin className="h-3.5 w-3.5 text-muted-foreground md:h-4 md:w-4" />
							Yurisdiksi: <strong className="text-foreground">{getAdminLevelName()}</strong>
						</span>
					</>
				}
				trailing={
					<div className="flex w-full items-center gap-3 md:w-auto">
						<div className="mr-2 hidden text-right lg:block">
							<div className="text-[15px] font-semibold text-foreground">
								{new Intl.DateTimeFormat('id-ID', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								}).format(new Date())}
							</div>
							{/* Status koneksi Reverb sungguhan (useRealtimeStatus) - dulu "Sistem Online"
							    yang ditulis mati dan tetap hijau walau realtime putus. */}
							<div
								className={cn(
									'flex items-center justify-end gap-1 text-xs font-medium',
									REALTIME_META[realtimeStatus].text,
								)}
							>
								<span
									className={cn(
										'h-1.5 w-1.5 rounded-full',
										REALTIME_META[realtimeStatus].dot,
										realtimeStatus === 'connected' && 'animate-pulse',
									)}
								></span>{' '}
								{REALTIME_META[realtimeStatus].label}
							</div>
						</div>
						{/* Pejabat bersifat read-only (pemantau) — sembunyikan aksi input insiden */}
						{!isPejabat && (
							<Button
								className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 md:h-10 md:w-auto"
								asChild
							>
								<Link href="/reports/create">
									<IconAlertCircle className="mr-2 h-4 w-4" /> Input Insiden Manual
								</Link>
							</Button>
						)}
					</div>
				}
			/>

			{/* MODE KESIAPAN PEJABAT — pejabat memantau, jadi ia boleh memilih tidak dibangunkan */}
			{isPejabat && <StandbyCard isStandby={isStandby} busy={isTogglingStandby} onToggle={handleToggleStandby} />}

			{/* KARTU STATISTIK - petak 2 kolom di ponsel supaya keempat angka terbaca
			    sekaligus tanpa digeser. Gulir mendatar sempat dipasang 2026-09-09 lalu
			    DICABUT atas koreksi user: gulir mendatar bersarang di dalam gulir vertikal
			    membuat halaman terasa berlapis ("scrollnya menumpuk"), dan di layar darurat
			    angka yang harus digeser dulu untuk terlihat adalah angka yang bisa terlewat. */}
			<div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
				<StatCard
					title="Darurat Aktif"
					value={currentStats.active_reports}
					icon={IconFlame}
					colorClass="text-destructive"
					bgIconClass="bg-destructive/10"
					subtitle="Membutuhkan Respons"
					isCritical={true}
					href={route(isPejabat ? 'front.reports.index' : 'admin.reports.index', { status: 'aktif' })}
				/>
				<StatCard
					title="Relawan Standby"
					value={currentStats.standby_helpers}
					icon={IconUsersGroup}
					colorClass="text-info"
					bgIconClass="bg-info/10"
					subtitle="Terverifikasi di Area"
					href={isPejabat ? undefined : route('front.volunteers.index', { status: 'siaga' })}
				/>
				<StatCard
					title="Hydrant Siaga"
					value={currentStats.active_hydrants}
					icon={IconDroplet}
					colorClass="text-teal"
					bgIconClass="bg-teal/10"
					subtitle="Sumber Air Aktif"
					href={route(isPejabat ? 'front.hydrants.index' : 'admin.hydrants.index')}
				/>
				{/* `resolved_this_month` SUDAH dihitung DashboardController sejak dulu tapi tak
				    pernah ada kartu yang menampilkannya - nilai yang dihitung lalu dibuang
				    (bentuk ringan #115). Ia dipasang di sini karena barisnya kini memang butuh
				    isi keempat, dan datanya sudah terlanjur dibayar tiap kali halaman dibuka.
				    Biru mengikuti hukum warna repo: Selesai = biru/air.
				    Meski bernama `_this_month`, query-nya menghitung SEMUA laporan selesai
				    (DashboardController $queryReportsResolved), jadi judulnya "Total Selesai" -
				    dulu "Selesai Bulan Ini" (TASK_71). Tautannya = daftar status=resolved, isi sama. */}
				<StatCard
					title="Total Selesai"
					value={currentStats.resolved_this_month}
					icon={IconCheck}
					colorClass="text-info"
					bgIconClass="bg-info/10"
					subtitle="Insiden Ditutup"
					href={route(isPejabat ? 'front.reports.index' : 'admin.reports.index', { status: 'resolved' })}
				/>
			</div>

			<div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-3">
				{/* KIRI: LAPORAN TERBARU - daftar menempel tepi layar di ponsel (AppList), bukan
				    kartu berbingkai yang duduk di dalam padding halaman. Bentuk lama juga menaruh
				    <Link> di dalam <Link> (jangkar bersarang, HTML tak sah) demi baris yang bisa
				    diketuk; AppListRow membuat SELURUH barisnya satu jangkar, jadi lapisan itu
				    tak perlu lagi. */}
				<AppSection
					className="lg:col-span-2"
					title="Laporan Insiden Terbaru"
					action={{
						/* Pejabat (read-only) tidak punya akses ke antrean verifikasi admin
						   (role:admin|superadmin) -> arahkan ke arsip publik agar tidak 403 */
						href: route(isPejabat ? 'front.reports.index' : 'admin.reports.index'),
						label: 'Lihat semua',
					}}
				>
					<p className="hidden px-1 text-[13px] text-muted-foreground md:block">
						Pemantauan waktu nyata dari masyarakat & relawan.
					</p>
					<AppList className="max-md:[&>a:nth-of-type(n+6)]:hidden">
						{reports.map((report) => {
							const { Icon: ReportIcon, className: colorStyle } = reportIcon(report);

							return (
								<AppListRow
									key={report.id}
									href={route('reports.show', report.id)}
									leading={
										<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', colorStyle)}>
											<ReportIcon className="h-5 w-5" stroke={2} />
										</div>
									}
									title={report.title}
									aside={report.time}
									meta={
										<span className="flex items-start gap-1.5">
											<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
											<span>{report.location}</span>
										</span>
									}
									badges={
										/* Badge status (selaras admin/reports). Status "Penanganan" memakai teal
										   seperti teks "Hydrant" pada kartu Peta Pemantauan. */
										<StatusBadge
											status={report.status}
											className={
												report.status === 'handling'
													? 'border-teal/30 bg-teal/10 text-teal'
													: undefined
											}
										/>
									}
								/>
							);
						})}
						{reports.length === 0 && (
							<AppEmpty
								icon={IconCheck}
								title="Tidak ada laporan insiden"
								description="Wilayah Anda saat ini aman terkendali."
							/>
						)}
					</AppList>
				</AppSection>

				{/* KANAN: PINTASAN PETA PEMANTAUAN & AKSI */}
				<div className="flex flex-col gap-5 md:gap-6">
					{/* CTA menuju halaman Peta Pemantauan terpadu (menggantikan mini-peta lama) */}
					<Link
						href={route('front.monitoring.map')}
						className="group block rounded-2xl outline-none transition-transform focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-reduce:active:scale-100"
					>
						<Card className="relative overflow-hidden transition-colors hover:bg-muted/30">
							<CardContent className="flex flex-row items-center gap-3 p-4 md:flex-col md:items-stretch md:gap-4 md:p-5 lg:p-6">
								{/* Di ponsel kartu ini jadi SATU BARIS yang bisa diketuk (ikon, judul, panah);
								    uraian panjang & lencana lapisannya baru muncul mulai `md` - di layar sempit
								    keduanya kalimat pemasaran yang mendorong daftar insiden turun tanpa menambah
								    satu pun keputusan. */}
								<div className="flex shrink-0 items-center justify-between md:w-full">
									<div className="rounded-xl bg-teal/10 p-2.5 md:rounded-2xl md:p-3.5">
										<IconMapSearch className="h-5 w-5 text-teal md:h-6 md:w-6" stroke={2} />
									</div>
									<IconChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground md:block" />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="text-[15px] font-semibold text-foreground md:text-[17px]">
										Peta Pemantauan
									</h3>
									<p className="mt-1 hidden text-[13px] leading-relaxed text-muted-foreground md:block">
										Peta terpadu dengan filter lengkap - kejadian, hydrant, pos pemadam, pompa, &
										relawan di seluruh yurisdiksi Anda.
									</p>
									<p className="mt-0.5 truncate text-xs font-medium text-muted-foreground md:hidden">
										Kejadian, hydrant, pos, pompa & relawan
									</p>
								</div>
								<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60 md:hidden" />
								<div className="hidden flex-wrap gap-1.5 md:flex">
									<Badge
										variant="secondary"
										className="rounded-full border-none bg-destructive/10 text-destructive"
									>
										Kejadian
									</Badge>
									<Badge
										variant="secondary"
										className="rounded-full border-none bg-teal/10 text-teal"
									>
										Hydrant
									</Badge>
									<Badge
										variant="secondary"
										className="rounded-full border-none bg-info/10 text-info"
									>
										Pos & Pompa
									</Badge>
									<Badge
										variant="secondary"
										className="rounded-full border-none bg-info/10 text-info"
									>
										Relawan
									</Badge>
								</div>
							</CardContent>
						</Card>
					</Link>

					{/* Pintasan Pos Pemadam - hanya admin tingkat atas (tanpa city_code), tidak untuk pejabat. */}
					{!isPejabat && isTopLevelAdmin && (
						<div className="grid grid-cols-1 gap-3">
							<Button
								variant="outline"
								className="group flex h-auto flex-row items-center justify-start gap-3 rounded-2xl border-border/70 bg-card px-4 py-3 shadow-sm hover:bg-muted/40"
								asChild
							>
								<Link href={route('admin.hydrants.index', { type: 'pos' })}>
									<div className="rounded-lg bg-destructive/10 p-2 transition-colors group-hover:bg-destructive/20">
										<IconFiretruck className="h-5 w-5 text-destructive" />
									</div>
									<div className="ml-1 text-left">
										<div className="text-[15px] font-semibold text-foreground">Pos Armada</div>
										<div className="text-[11px] text-muted-foreground">Daftar Pos Pemadam</div>
									</div>
								</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

// Judul layout mengikuti peran, sama dengan <Head> - dulu pejabat melihat "Dashboard Eksekutif" di
// tab peramban tetapi "Pusat Komando" di kepala aplikasi.
AdminDashboard.layout = (page) => (
	<AppLayout children={page} title={page.props.isPejabat ? 'Dashboard Eksekutif' : 'Pusat Komando'} />
);
