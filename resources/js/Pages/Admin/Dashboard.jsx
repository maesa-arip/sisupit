import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconBolt,
	IconBug,
	IconCheck,
	IconChevronRight,
	IconClock,
	IconDroplet,
	IconFiretruck,
	IconFlame,
	IconLoader2,
	IconMapPin,
	IconMapSearch,
	IconPower,
	IconRadar,
	IconShieldCheck,
	IconTree,
	IconUsersGroup,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function AdminDashboard({ auth, stats, recentReports, isPejabat = false, feed_channel = null }) {
	const isTopLevelAdmin = !auth?.user?.city_code;

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
					'h-full rounded-xl border shadow-sm transition-all',
					hasEmergency
						? 'border-destructive bg-destructive text-destructive-foreground shadow-destructive/20 duration-500 animate-in zoom-in-95'
						: 'border-border bg-card hover:border-border/80',
					href && 'cursor-pointer hover:shadow-md',
				)}
			>
				<CardContent className="p-3.5 md:p-5 lg:p-6">
					<div className="flex items-center justify-between gap-2">
						{/* Ikon: kiri di ponsel, kanan di desktop - urutannya dibalik lewat `order`
						    supaya markupnya tetap satu, bukan dua cabang tata letak. */}
						<div
							className={cn(
								'order-1 shrink-0 rounded-xl p-2 md:order-2 md:rounded-2xl md:p-3.5',
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
									'text-2xl font-extrabold tracking-tight md:text-3xl',
									hasEmergency ? 'text-destructive-foreground' : 'text-foreground',
								)}
							>
								{value}
							</div>
						</div>
					</div>
					<p
						className={cn(
							'mt-1 truncate text-xs font-semibold md:hidden',
							hasEmergency ? 'text-destructive-foreground/80' : 'text-muted-foreground',
						)}
					>
						{title}
					</p>
					{subtitle && (
						<div
							className={cn(
								'mt-4 hidden text-[11px] font-semibold uppercase tracking-wider md:block',
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
				className={cn('block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
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
				framed
				title={`Halo, ${auth.user.name}`}
				meta={
					<>
						<Badge
							variant="secondary"
							className={cn(
								'rounded-md border-none px-2 py-0.5 font-semibold',
								isPejabat ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive',
							)}
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
							{isPejabat ? 'Pejabat/Eksekutif' : 'Administrator'}
						</Badge>
						<span className="flex items-center gap-1 text-xs font-medium text-muted-foreground md:text-sm">
							<IconMapPin className="h-3.5 w-3.5 text-teal md:h-4 md:w-4" />
							Yurisdiksi: <strong className="text-foreground">{getAdminLevelName()}</strong>
						</span>
					</>
				}
				trailing={
					<div className="flex w-full items-center gap-3 md:w-auto">
						<div className="mr-2 hidden text-right lg:block">
							<div className="text-sm font-bold text-foreground">
								{new Intl.DateTimeFormat('id-ID', {
									weekday: 'long',
									day: 'numeric',
									month: 'long',
									year: 'numeric',
								}).format(new Date())}
							</div>
							<div className="flex items-center justify-end gap-1 text-xs font-medium text-teal-600 dark:text-teal">
								<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500 dark:bg-teal"></span>{' '}
								Sistem Online
							</div>
						</div>
						{/* Pejabat bersifat read-only (pemantau) — sembunyikan aksi input insiden */}
						{!isPejabat && (
							<Button
								className="h-12 w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 md:h-10 md:w-auto"
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
			{isPejabat && (
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
							{/* Label = KEADAAN, bukan ajakan (permintaan user 2026-08-26). Dulu berbunyi
						    'Siaga Aktif' saat menyala tapi 'Mulai Siaga' saat mati — satu keadaan
						    dibaca sebagai status, satunya sebagai perintah, sehingga tak jelas mana
						    yang sedang berlaku. Kini keduanya simetris. */}
							{isStandby ? 'Siaga' : 'Non Aktif'}
						</Button>
					</CardContent>
				</Card>
			)}

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
					colorClass="text-teal-600 dark:text-teal"
					bgIconClass="bg-teal-50 dark:bg-teal/10"
					subtitle="Sumber Air Aktif"
					href={route(isPejabat ? 'front.hydrants.index' : 'admin.hydrants.index')}
				/>
				{/* `resolved_this_month` SUDAH dihitung DashboardController sejak dulu tapi tak
				    pernah ada kartu yang menampilkannya - nilai yang dihitung lalu dibuang
				    (bentuk ringan #115). Ia dipasang di sini karena barisnya kini memang butuh
				    isi keempat, dan datanya sudah terlanjur dibayar tiap kali halaman dibuka.
				    Biru mengikuti hukum warna repo: Selesai = biru/air. */}
				<StatCard
					title="Selesai Bulan Ini"
					value={currentStats.resolved_this_month}
					icon={IconCheck}
					colorClass="text-info"
					bgIconClass="bg-info/10"
					subtitle="Insiden Ditutup"
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
					<AppList>
						{reports.map((report) => {
							const t = report.title.toLowerCase();
							let ReportIcon = IconFlame;
							let colorStyle = 'text-destructive bg-destructive/10';

							if (t.includes('pohon')) {
								ReportIcon = IconTree;
								// Teal - selaras warna teks "Hydrant" di kartu Peta Pemantauan.
								colorStyle = 'text-teal-700 dark:text-teal bg-teal-50 dark:bg-teal/10';
							} else if (t.includes('hewan') || t.includes('ular') || t.includes('tawon')) {
								ReportIcon = IconBug;
								colorStyle = 'text-warning bg-warning/10';
							} else if (t.includes('listrik') || t.includes('korsleting')) {
								ReportIcon = IconBolt;
								colorStyle = 'text-info bg-info/10';
							}

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
									meta={
										<>
											<span className="flex min-w-0 items-center gap-1.5">
												<IconMapPin className="h-3.5 w-3.5 shrink-0" stroke={2} />
												<span className="truncate">{report.location}</span>
											</span>
											<span className="text-border">•</span>
											<span className="flex shrink-0 items-center gap-1.5">
												<IconClock className="h-3.5 w-3.5 shrink-0" stroke={2} />
												{report.time}
											</span>
										</>
									}
									trailing={
										/* Badge status berbingkai (selaras admin/reports). Status "Penanganan"
										   memakai teal seperti teks "Hydrant" pada kartu Peta Pemantauan. */
										<StatusBadge
											status={report.status}
											className={
												report.status === 'handling'
													? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal'
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
						className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<Card className="relative overflow-hidden rounded-xl border-border shadow-sm transition-all hover:border-teal-500 hover:shadow-md dark:hover:border-teal">
							<CardContent className="flex flex-row items-center gap-3 p-4 md:flex-col md:items-stretch md:gap-4 md:p-5 lg:p-6">
								{/* Di ponsel kartu ini jadi SATU BARIS yang bisa diketuk (ikon, judul, panah);
								    uraian panjang & lencana lapisannya baru muncul mulai `md` - di layar sempit
								    keduanya kalimat pemasaran yang mendorong daftar insiden turun tanpa menambah
								    satu pun keputusan. */}
								<div className="flex shrink-0 items-center justify-between md:w-full">
									<div className="rounded-xl bg-teal-50 p-2.5 dark:bg-teal/10 md:rounded-2xl md:p-3.5">
										<IconMapSearch
											className="h-5 w-5 text-teal-600 dark:text-teal md:h-6 md:w-6"
											stroke={2}
										/>
									</div>
									<IconChevronRight className="hidden h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 dark:group-hover:text-teal md:block" />
								</div>
								<div className="min-w-0 flex-1">
									<h3 className="text-sm font-bold text-foreground md:text-lg">Peta Pemantauan</h3>
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
										className="rounded-md border-none bg-destructive/10 text-destructive"
									>
										Kejadian
									</Badge>
									<Badge
										variant="secondary"
										className="rounded-md border-none bg-teal-50 text-teal-700 dark:bg-teal/10 dark:text-teal"
									>
										Hydrant
									</Badge>
									<Badge variant="secondary" className="rounded-md border-none bg-info/10 text-info">
										Pos & Pompa
									</Badge>
									<Badge variant="secondary" className="rounded-md border-none bg-info/10 text-info">
										Relawan
									</Badge>
								</div>
							</CardContent>
						</Card>
					</Link>

					{/* BENTO GRID HANYA MUNCUL UNTUK ADMIN (Disembunyikan untuk Pejabat Eksekutif) */}
					{!isPejabat && isTopLevelAdmin && (
						<div className="grid grid-cols-1 gap-3">
							<Button
								variant="outline"
								className="group flex h-auto flex-row items-center gap-2 rounded-xl border-border bg-card px-4 py-3 shadow-sm transition-all hover:border-destructive"
								asChild
							>
								<Link href={route('admin.hydrants.index', { type: 'pos' })}>
									<div className="rounded-lg bg-destructive/10 p-2 transition-colors group-hover:bg-destructive/20">
										<IconFiretruck className="h-5 w-5 text-destructive" />
									</div>
									<div className="ml-1 text-left">
										<div className="text-sm font-bold text-foreground">Pos Armada</div>
										<div className="text-[10px] text-muted-foreground">Distribusi Kendaraan</div>
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

AdminDashboard.layout = (page) => <AppLayout children={page} title="Pusat Komando" />;
