import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
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
	IconMapPin,
	IconMapSearch,
	IconShieldCheck,
	IconTree,
	IconUsersGroup,
} from '@tabler/icons-react';

export default function AdminDashboard({ auth, stats, recentReports, isPejabat = false }) {
	const isTopLevelAdmin = !auth?.user?.city_code;

	const getAdminLevelName = () => {
		if (auth?.user?.village_code) return `Desa/Kelurahan`;
		if (auth?.user?.district_code) return `Kecamatan`;
		if (auth?.user?.city_code) return `Kabupaten/Kota`;
		if (auth?.user?.province_code) return `Provinsi`;
		return 'Pusat (Nasional)';
	};

	const currentStats = stats || { active_reports: 0, standby_helpers: 0, active_hydrants: 0, resolved_this_month: 0 };
	const reports = recentReports || [];

	const StatCard = ({ title, value, icon: Icon, colorClass, bgIconClass, subtitle, isCritical = false, href }) => {
		const hasEmergency = isCritical && value > 0;
		const card = (
			<Card
				className={cn(
					'rounded-xl border shadow-sm transition-all',
					hasEmergency
						? 'border-destructive bg-destructive text-destructive-foreground shadow-destructive/20 duration-500 animate-in zoom-in-95'
						: 'border-border bg-card hover:border-border/80',
					href && 'cursor-pointer hover:shadow-md',
				)}
			>
				<CardContent className="p-5 sm:p-6">
					<div className="flex items-center justify-between">
						<div className="space-y-1.5">
							<p
								className={cn(
									'text-sm font-medium',
									hasEmergency ? 'text-destructive-foreground/80' : 'text-muted-foreground',
								)}
							>
								{title}
							</p>
							<div
								className={cn(
									'text-3xl font-extrabold tracking-tight',
									hasEmergency ? 'text-destructive-foreground' : 'text-foreground',
								)}
							>
								{value}
							</div>
						</div>
						<div
							className={cn(
								'rounded-2xl p-3.5',
								hasEmergency ? 'bg-destructive-foreground/20' : bgIconClass,
							)}
						>
							<Icon
								className={cn('h-6 w-6', hasEmergency ? 'text-destructive-foreground' : colorClass)}
								stroke={2}
							/>
						</div>
					</div>
					{subtitle && (
						<div
							className={cn(
								'mt-4 text-[11px] font-semibold uppercase tracking-wider',
								hasEmergency ? 'text-destructive-foreground/70' : 'text-muted-foreground',
							)}
						>
							{subtitle}
						</div>
					)}
				</CardContent>
			</Card>
		);

		if (!href) return card;

		return (
			<Link href={href} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
				{card}
			</Link>
		);
	};

	return (
		<div className="h-full w-full space-y-6 pb-10 lg:space-y-8">
			<Head title={isPejabat ? 'Dashboard Eksekutif' : 'Pusat Komando'} />

			{/* HEADER SECTION */}
			<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6 md:flex-row md:items-center">
				<div>
					<h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
						Halo, {auth.user.name}
					</h1>
					<div className="mt-2 flex flex-wrap items-center gap-2">
						<Badge
							variant="secondary"
							className={cn(
								'rounded-md border-none px-2 py-0.5 font-semibold',
								isPejabat
									? 'bg-info/10 text-info'
									: 'bg-destructive/10 text-destructive',
							)}
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
							{isPejabat ? 'Pejabat/Eksekutif' : 'Administrator'}
						</Badge>
						<span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
							<IconMapPin className="h-4 w-4 text-teal" />
							Yurisdiksi: <strong className="text-foreground">{getAdminLevelName()}</strong>
						</span>
					</div>
				</div>
				<div className="flex w-full items-center gap-3 border-t border-border pt-4 md:w-auto md:border-t-0 md:pt-0">
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
							className="w-full rounded-xl bg-foreground text-background hover:bg-foreground/90 md:w-auto"
							asChild
						>
							<Link href="/reports/create">
								<IconAlertCircle className="mr-2 h-4 w-4" /> Input Insiden Manual
							</Link>
						</Button>
					)}
				</div>
			</div>

			{/* KARTU STATISTIK */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* KIRI: LAPORAN TERBARU */}
				<Card className="flex flex-col overflow-hidden rounded-xl border-border shadow-sm lg:col-span-2">
					<CardHeader className="flex flex-row items-center justify-between border-b bg-card pb-4">
						<div className="space-y-1">
							<CardTitle className="text-lg font-bold text-foreground">Laporan Insiden Terbaru</CardTitle>
							<CardDescription className="text-[13px]">
								Pemantauan waktu nyata dari masyarakat & relawan.
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							className="hidden rounded-lg border-border bg-card font-medium shadow-sm hover:bg-accent sm:flex"
							asChild
						>
							{/* Pejabat (read-only) tidak punya akses ke antrean verifikasi admin (role:admin|superadmin) → arahkan ke arsip publik agar tidak 403 */}
							<Link href={route(isPejabat ? 'front.reports.index' : 'admin.reports.index')}>
								{' '}
								Lihat Semua Laporan{' '}
							</Link>
						</Button>
					</CardHeader>

					<CardContent className="flex-1 bg-card p-0">
						<div className="flex flex-col divide-y divide-border">
							{reports.map((report) => {
								const t = report.title.toLowerCase();
								let ReportIcon = IconFlame;
								let colorStyle = 'text-destructive bg-destructive/10';

								if (t.includes('pohon')) {
									ReportIcon = IconTree;
									// Teal — selaras warna teks "Hydrant" di kartu Peta Pemantauan.
									colorStyle = 'text-teal-700 dark:text-teal bg-teal-50 dark:bg-teal/10';
								} else if (t.includes('hewan') || t.includes('ular') || t.includes('tawon')) {
									ReportIcon = IconBug;
									colorStyle = 'text-warning bg-warning/10';
								} else if (t.includes('listrik') || t.includes('korsleting')) {
									ReportIcon = IconBolt;
									colorStyle = 'text-info bg-info/10';
								}

								return (
									<Link key={report.id} href={route('reports.show', report.id)}>
										<div
											key={report.id}
											className="group relative flex flex-col justify-between p-4 transition-all duration-200 hover:bg-teal-50/50 dark:hover:bg-teal/5 sm:flex-row sm:items-center sm:p-5"
										>
											<Link
												href={route('reports.show', report.id)}
												className="absolute inset-0 z-0"
											></Link>
											<div className="relative z-10 flex w-full items-start gap-4 overflow-hidden sm:w-auto">
												<div className={cn('mt-0.5 shrink-0 rounded-xl p-2.5', colorStyle)}>
													<ReportIcon className="h-5 w-5" stroke={2} />
												</div>
												<div className="min-w-0 flex-1 pr-4">
													<h4 className="truncate text-[15px] font-bold text-foreground transition-colors group-hover:text-destructive">
														{report.title}
													</h4>
													<div className="mt-1 flex flex-col gap-1 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:gap-2.5">
														<span className="flex items-center gap-1.5 truncate">
															<IconMapPin className="h-3.5 w-3.5 shrink-0" stroke={2} />
															<span className="truncate">{report.location}</span>
														</span>
														<span className="hidden text-border sm:inline">•</span>
														<span className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
															<IconClock className="h-3.5 w-3.5 shrink-0" stroke={2} />
															{report.time}
														</span>
													</div>
												</div>
											</div>
											<div className="relative z-10 mt-3.5 flex shrink-0 items-center justify-between gap-4 border-t border-border pt-3.5 sm:mt-0 sm:justify-end sm:border-0 sm:pt-0">
												{/* Badge status berbingkai (selaras admin/reports). Status "Penanganan"
											    memakai teal seperti teks "Hydrant" pada kartu Peta Pemantauan. */}
												<StatusBadge
													status={report.status}
													className={
														report.status === 'handling'
															? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal'
															: undefined
													}
												/>
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-muted-foreground transition-all group-hover:bg-destructive/10 group-hover:text-destructive">
													<IconChevronRight className="h-5 w-5" stroke={2} />
												</div>
											</div>
										</div>
									</Link>
								);
							})}
							{reports.length === 0 && (
								<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
									<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-sm">
										<IconCheck className="h-6 w-6 text-muted-foreground" />
									</div>
									<p className="text-sm font-semibold text-foreground">Tidak ada laporan insiden</p>
									<p className="mt-1 text-xs text-muted-foreground">
										Wilayah Anda saat ini aman terkendali.
									</p>
								</div>
							)}
						</div>
					</CardContent>
					<div className="block border-t border-border bg-card p-3 sm:hidden">
						<Button variant="outline" className="w-full rounded-lg text-xs" asChild>
							<Link href={route(isPejabat ? 'front.reports.index' : 'admin.reports.index')}>
								{' '}
								Lihat Semua Laporan{' '}
							</Link>
						</Button>
					</div>
				</Card>

				{/* KANAN: PINTASAN PETA PEMANTAUAN & AKSI */}
				<div className="flex flex-col gap-6">
					{/* CTA menuju halaman Peta Pemantauan terpadu (menggantikan mini-peta lama) */}
					<Link
						href={route('front.monitoring.map')}
						className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<Card className="relative overflow-hidden rounded-xl border-border shadow-sm transition-all hover:border-teal-500 hover:shadow-md dark:hover:border-teal">
							<CardContent className="flex flex-col gap-4 p-5 sm:p-6">
								<div className="flex items-center justify-between">
									<div className="rounded-2xl bg-teal-50 p-3.5 dark:bg-teal/10">
										<IconMapSearch className="h-6 w-6 text-teal-600 dark:text-teal" stroke={2} />
									</div>
									<IconChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600 dark:group-hover:text-teal" />
								</div>
								<div>
									<h3 className="text-lg font-bold text-foreground">Peta Pemantauan</h3>
									<p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
										Peta terpadu dengan filter lengkap — kejadian, hydrant, pos pemadam, pompa, &
										relawan di seluruh yurisdiksi Anda.
									</p>
								</div>
								<div className="flex flex-wrap gap-1.5">
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
									<Badge
										variant="secondary"
										className="rounded-md border-none bg-info/10 text-info"
									>
										Pos & Pompa
									</Badge>
									<Badge
										variant="secondary"
										className="rounded-md border-none bg-info/10 text-info"
									>
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
