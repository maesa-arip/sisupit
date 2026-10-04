import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import { ReportStepper } from '@/Components/ReportProgress';
import StandbyCard from '@/Components/StandbyCard';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { getClickLocation } from '@/lib/click-location';
import { firstName as getFirstName } from '@/lib/first-name';
import { reportIcon } from '@/lib/report-icon';
import { cn, GEO_OPTIONS, NOMOR_DARURAT_NASIONAL, reportNumber, timeAgo } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
	IconCheck,
	IconChevronRight,
	IconFireHydrant,
	IconFiretruck,
	IconFlame,
	IconHeartHandshake,
	IconHistory,
	IconMapPin,
	IconMessages,
	IconNavigation,
	IconPhone,
	IconRadar,
	IconShieldCheck,
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

/**
 * Beranda warga & relawan - TASK_72 fase 3, dirancang ulang dari nol.
 *
 * Warga: "kalau terjadi sesuatu, saya tahu harus apa, dan laporan saya diurus". Laporan aktif
 * mengambil alih puncak; dua aksi darurat (Lapor + 113); fasilitas terdekat; kejadian TERVERIFIKASI di
 * kecamatan (tanpa data pelapor); riwayat.
 * Relawan: "apakah saya dibutuhkan sekarang, dan apakah saya siaga?". Tugas berjalan mengambil alih
 * puncak; sakelar siaga; daftar butuh bantuan dari server, urut jarak; kontribusi.
 *
 * Feed paginasi "Semua Laporan" lama DIBUANG (keputusan user 2026-10-04): bising, dan menampilkan
 * laporan orang lain.
 */

const LIVE_PROPS = ['areaIncidents', 'needHelp', 'activeTasks', 'activeReports', 'myReports'];

function distanceKm(lat1, lng1, lat2, lng2) {
	const R = 6371;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

function formatKm(km) {
	return km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

function directionsUrl(lat, lng) {
	return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** Elemen terdekat dari `origin` (posisi GPS, atau pusat wilayah akun bila GPS belum ada). */
function nearest(items, origin) {
	if (!items?.length || !origin) return null;
	return items
		.map((item) => ({ ...item, km: distanceKm(origin.lat, origin.lng, item.lat, item.lng) }))
		.sort((a, b) => a.km - b.km)[0];
}

function minutesLabel(iso) {
	const then = new Date(iso).getTime();
	if (!iso || isNaN(then)) return '-';
	const m = Math.max(0, Math.floor((Date.now() - then) / 60000));
	return m < 1 ? 'baru saja' : m < 60 ? `${m} mnt` : `${Math.floor(m / 60)} j ${m % 60} mnt`;
}

function ActiveTaskCard({ task, busy, onArrive, onCancel }) {
	const arrived = task.my_status === 'arrived';

	return (
		<Card className="overflow-hidden rounded-2xl border-volunteer/30 bg-volunteer/[0.06] p-4 shadow-sm md:p-5">
			<div className="text-xs font-bold uppercase tracking-wide text-volunteer">
				Tugas berjalan -{' '}
				{arrived ? `di lokasi ${minutesLabel(task.arrived_at)}` : `meluncur ${minutesLabel(task.started_at)}`}
			</div>
			<h2 className="mt-1 text-[19px] font-bold leading-snug tracking-tight text-foreground">{task.title}</h2>
			<p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted-foreground">
				<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
				<span>{task.location || 'Lokasi belum terbaca'}</span>
			</p>
			<div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
				{!arrived && (
					<Button
						className="col-span-2 h-11 rounded-xl sm:col-span-1"
						disabled={busy}
						onClick={() => onArrive(task)}
					>
						<IconCheck className="mr-1.5 h-4 w-4" /> Saya Tiba
					</Button>
				)}
				{task.lat && task.lng && (
					<Button variant="outline" className="h-11 rounded-xl" asChild>
						<a href={directionsUrl(task.lat, task.lng)} target="_blank" rel="noreferrer">
							<IconNavigation className="mr-1.5 h-4 w-4" /> Navigasi
						</a>
					</Button>
				)}
				<Button variant="outline" className="h-11 rounded-xl" asChild>
					<Link href={route('reports.show', task.id)}>Detail</Link>
				</Button>
				{/* Batal hanya selama masih meluncur - pola endpoint cancel-response (#27). */}
				{!arrived && (
					<Button
						variant="ghost"
						className="h-11 rounded-xl text-muted-foreground"
						disabled={busy}
						onClick={() => onCancel(task)}
					>
						Batal
					</Button>
				)}
			</div>
		</Card>
	);
}

export default function Dashboard(props) {
	const auth = props.auth.user;
	const firstName = getFirstName(auth?.name, 'Warga');

	const myReports = props.myReports || [];
	// Laporan milik sendiri yang masih berjalan (#165) - status & tahapnya di puncak Beranda.
	const activeReports = props.activeReports || [];
	// Riwayat tanpa laporan yang sudah tampil di kartu "Laporan Anda" (TASK_71).
	const activeReportIds = new Set(activeReports.map((r) => r.id));
	const historyReports = myReports.filter((r) => !activeReportIds.has(r.id));
	const areaIncidents = props.areaIncidents || [];
	const needHelp = props.needHelp || [];
	const activeTasks = props.activeTasks || [];
	const facilities = props.facilities || { stations: [], hydrants: [], center: null };

	const userRoles = Array.isArray(auth?.role) ? auth.role : auth?.role ? [auth.role] : [];
	const isRelawan = userRoles.includes('relawan');
	const isStandby = auth?.is_standby ?? true;
	const [isTogglingStandby, setIsTogglingStandby] = useState(false);
	const [busyId, setBusyId] = useState(null);

	// Kejadian baru / status berubah di wilayah ini -> muat ulang bagian yang hidup dari server.
	useReportFeed(props.feed_channel, () => router.reload({ only: LIVE_PROPS }));

	// Feed wilayah tidak menjangkau laporan sendiri yang lokasinya di luar wilayah akun, jadi kartu
	// "Laporan Anda" berlangganan channel tiap laporannya sendiri - channel yang sama dengan halaman
	// Thanks & detail (pelapor memang berhak di sana). Isinya tetap dimuat ulang dari server.
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

	// Satu fix GPS (senyap bila ditolak): fasilitas terdekat untuk semua, jarak kejadian untuk relawan.
	const [myPos, setMyPos] = useState(null);
	useEffect(() => {
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(p) => setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
			() => {},
			GEO_OPTIONS.oneShot,
		);
	}, []);

	const origin = myPos || facilities.center;
	const station = nearest(facilities.stations, origin);
	const hydrant = nearest(facilities.hydrants, origin);

	const helpList = needHelp
		.map((r) => ({
			...r,
			km: myPos && r.lat && r.lng ? distanceKm(myPos.lat, myPos.lng, parseFloat(r.lat), parseFloat(r.lng)) : null,
		}))
		.sort((a, b) => (a.km != null && b.km != null ? a.km - b.km : new Date(a.created_at) - new Date(b.created_at)));

	const hasLiveSituation = activeReports.length > 0 || activeTasks.length > 0;

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

	// Meluncur dari Beranda lalu langsung ke halaman insiden: pelacakan GPS langsung hanya hidup di sana.
	const dispatch = async (report) => {
		setBusyId(report.id);
		const location = await getClickLocation();
		router.post(route('reports.take-action', report.id), location, {
			preserveScroll: true,
			onSuccess: () => {
				toast.success('Meluncur ke lokasi. Pelacakan posisi berjalan di halaman insiden.');
				router.visit(route('reports.show', report.id));
			},
			onError: () => toast.error('Gagal meluncur. Coba lagi dari halaman insiden.'),
			onFinish: () => setBusyId(null),
		});
	};

	const arrive = (task) => {
		setBusyId(task.id);
		router.post(
			route('reports.arrive', task.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Status diperbarui: Tiba di lokasi.'),
				onFinish: () => setBusyId(null),
			},
		);
	};

	const cancelTask = (task) => {
		setBusyId(task.id);
		router.post(
			route('reports.cancel-response', task.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Keberangkatan dibatalkan.'),
				onFinish: () => setBusyId(null),
			},
		);
	};

	// Fungsi render biasa, BUKAN komponen yang dideklarasikan di dalam render (#172).
	const renderMyHistory = () => (
		<AppSection
			title="Riwayat Laporan Saya"
			icon={IconHistory}
			action={
				historyReports.length > 3 ? { href: route('front.reports.index'), label: 'Lihat semua' } : undefined
			}
		>
			<AppList className="max-md:[&>a:nth-of-type(n+4)]:hidden">
				{historyReports.length > 0 ? (
					historyReports.map((report) => {
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
								aside={timeAgo(report.created_at)}
								meta={
									<span className="flex items-start gap-1.5">
										<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
										<span>{report.address || 'Alamat belum tersedia'}</span>
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

	return (
		<div className="flex w-full flex-col space-y-6 pb-32 lg:space-y-8">
			<AppGreeting
				title={`Halo, ${firstName}!`}
				meta={
					<Badge
						variant="outline"
						className={cn(
							'rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-none',
							isRelawan && isStandby
								? 'bg-volunteer text-volunteer-foreground'
								: 'bg-muted text-foreground/80',
						)}
					>
						<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} />{' '}
						{/* Lencana mengikuti saklar StandbyCard - dulu selalu "Siaga" walau siaga dimatikan. */}
						{isRelawan ? (isStandby ? 'Relawan Siaga' : 'Relawan - Tidak Siaga') : 'Warga'}
					</Badge>
				}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
				<div className="space-y-6 lg:col-span-2 lg:space-y-8">
					{/* MODE DARURAT: tugas relawan & laporan sendiri yang berjalan mengambil alih puncak. */}
					{activeTasks.map((task) => (
						<ActiveTaskCard
							key={task.id}
							task={task}
							busy={busyId === task.id}
							onArrive={arrive}
							onCancel={cancelTask}
						/>
					))}

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
												<h3 className="text-[15px] font-semibold text-foreground">
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

					{/* Dua aksi darurat di zona jempol. Saat ada keadaan berjalan, Lapor turun jadi garis -
					    tetap ada, tapi tak lagi bersaing dengan kartu di atasnya. */}
					<div className="grid grid-cols-2 gap-3">
						<Link
							href={route('front.reports.create')}
							className={cn(
								'flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border p-4 text-[16px] font-semibold shadow-sm transition-transform active:scale-[0.98] motion-reduce:active:scale-100',
								hasLiveSituation
									? 'border-destructive/40 bg-card text-destructive'
									: 'border-destructive bg-destructive text-destructive-foreground',
							)}
						>
							<IconFlame className="h-5 w-5" stroke={2} /> Lapor Darurat
						</Link>
						<a
							href={`tel:${NOMOR_DARURAT_NASIONAL}`}
							className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card p-4 text-[16px] font-semibold text-foreground shadow-sm transition-transform active:scale-[0.98] motion-reduce:active:scale-100"
						>
							<IconPhone className="h-5 w-5" stroke={2} /> Telepon {NOMOR_DARURAT_NASIONAL}
						</a>
					</div>

					{/* Sakelar siaga - HANYA relawan. Ajakan "Daftar Relawan" bagi warga DICABUT 2026-09-02
					    atas permintaan user; jangan hidupkan lagi tanpa menanyakan user. */}
					{isRelawan && (
						<StandbyCard isStandby={isStandby} busy={isTogglingStandby} onToggle={handleToggleStandby} />
					)}

					{isRelawan && (
						<AppSection title="Butuh Bantuan Sekarang" count={helpList.length || undefined}>
							<AppList>
								{helpList.map((report) => {
									const { Icon: ReportIcon, className: iconStyle } = reportIcon(report);
									const responders = report.officers_count + report.helpers_count;

									return (
										<div key={report.id}>
											<AppListRow
												href={route('reports.show', report.id)}
												leading={
													<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', iconStyle)}>
														<ReportIcon className="h-5 w-5" stroke={2} />
													</div>
												}
												title={report.title}
												aside={
													report.km != null ? formatKm(report.km) : timeAgo(report.created_at)
												}
												meta={
													<span className="flex items-start gap-1.5">
														<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
														<span>{report.location}</span>
													</span>
												}
												badges={
													<>
														<StatusBadge status={report.status} />
														<span className="text-xs font-semibold text-muted-foreground">
															{responders === 0
																? 'Belum ada yang menuju'
																: `${report.officers_count} petugas, ${report.helpers_count} relawan menuju`}
														</span>
													</>
												}
											/>
											<div className="px-4 pb-3.5 md:px-5 md:pb-4">
												<Button
													className="h-10 w-full rounded-xl bg-volunteer text-volunteer-foreground hover:bg-volunteer/90"
													disabled={busyId === report.id}
													onClick={() => dispatch(report)}
												>
													Bantu - Meluncur
												</Button>
											</div>
										</div>
									);
								})}
								{helpList.length === 0 && (
									<AppEmpty
										icon={IconShieldCheck}
										title="Tidak ada yang butuh bantuan"
										description="Kejadian terverifikasi di wilayah Anda yang butuh relawan akan muncul di sini."
									/>
								)}
							</AppList>
						</AppSection>
					)}

					{!isRelawan && (
						<AppSection
							title={
								props.areaLevel === 'kecamatan'
									? 'Kejadian di Kecamatan Anda'
									: 'Kejadian di Wilayah Anda'
							}
						>
							<AppList>
								{areaIncidents.map((report) => {
									const { Icon: ReportIcon, className: iconStyle } = reportIcon(report);

									// SENGAJA bukan tautan: detail laporan orang lain tertutup bagi warga
									// (ReportController::show -> 403). Baris ini kabar situasi, bukan pintu.
									return (
										<div
											key={report.id}
											className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4"
										>
											<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', iconStyle)}>
												<ReportIcon className="h-5 w-5" stroke={2} />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-start gap-3">
													<div className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground">
														{report.title}
													</div>
													<div className="shrink-0 text-[13px] text-muted-foreground">
														{timeAgo(report.created_at)}
													</div>
												</div>
												{report.location && (
													<div className="mt-1 text-[13px] leading-snug text-muted-foreground">
														{report.location}
													</div>
												)}
												<div className="mt-2.5">
													<StatusBadge status={report.status} />
												</div>
											</div>
										</div>
									);
								})}
								{areaIncidents.length === 0 && (
									<AppEmpty
										icon={IconShieldCheck}
										title="Tidak ada kejadian aktif"
										description="Hanya kejadian yang sudah diverifikasi petugas yang tampil di sini."
									/>
								)}
							</AppList>
						</AppSection>
					)}

					{(historyReports.length > 0 || activeReports.length === 0) && renderMyHistory()}
				</div>

				<div className="space-y-6 lg:space-y-8">
					{(station || hydrant) && (
						<AppSection title="Terdekat dari Anda">
							<AppList>
								{station && (
									<div className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4">
										<div className="shrink-0 rounded-xl bg-destructive/10 p-2.5 text-destructive">
											<IconFiretruck className="h-5 w-5" stroke={2} />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-[15px] font-semibold leading-snug text-foreground">
												{station.name}
											</div>
											<div className="mt-0.5 text-[13px] text-muted-foreground">
												{formatKm(station.km)}
												{myPos ? ' dari Anda' : ' dari pusat wilayah'}
												{station.address && ` - ${station.address}`}
											</div>
											<div className="mt-2.5 flex flex-wrap gap-2">
												{station.phone && (
													<Button variant="outline" size="sm" className="rounded-xl" asChild>
														<a href={`tel:${station.phone}`}>
															<IconPhone className="mr-1 h-4 w-4" /> {station.phone}
														</a>
													</Button>
												)}
												<Button variant="outline" size="sm" className="rounded-xl" asChild>
													<a
														href={directionsUrl(station.lat, station.lng)}
														target="_blank"
														rel="noreferrer"
													>
														<IconNavigation className="mr-1 h-4 w-4" /> Arah
													</a>
												</Button>
											</div>
										</div>
									</div>
								)}
								{hydrant && (
									<a
										href={directionsUrl(hydrant.lat, hydrant.lng)}
										target="_blank"
										rel="noreferrer"
										className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted md:px-5 md:py-4"
									>
										<div className="shrink-0 rounded-xl bg-teal/10 p-2.5 text-teal">
											<IconFireHydrant className="h-5 w-5" stroke={2} />
										</div>
										<div className="min-w-0 flex-1">
											<div className="text-[15px] font-semibold leading-snug text-foreground">
												Hydrant terdekat
											</div>
											<div className="mt-0.5 text-[13px] text-muted-foreground">
												{formatKm(hydrant.km)}
												{hydrant.water_pressure &&
													` - tekanan ${hydrant.water_pressure.toLowerCase()}`}
											</div>
										</div>
										<IconNavigation className="h-4 w-4 shrink-0 text-muted-foreground" />
									</a>
								)}
							</AppList>
							{!myPos && (
								<p className="px-1 text-xs text-muted-foreground">
									Izinkan akses lokasi agar jarak dihitung dari posisi Anda.
								</p>
							)}
						</AppSection>
					)}

					{isRelawan && (
						<AppSection title="Kontribusi Anda">
							<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
								<div className="flex items-center gap-3">
									<div className="shrink-0 rounded-xl bg-volunteer/10 p-2.5 text-volunteer">
										<IconHeartHandshake className="h-5 w-5" stroke={2} />
									</div>
									<div>
										<div className="text-[28px] font-bold tabular-nums leading-none tracking-tight text-foreground">
											{props.tasksDone ?? 0}
										</div>
										<div className="mt-1 text-[13px] text-muted-foreground">
											tugas selesai, sepanjang waktu
										</div>
									</div>
								</div>
								<div className="mt-3 flex flex-wrap gap-1.5">
									{(auth?.skills || []).map((skill) => (
										<span
											key={skill}
											className="rounded-full border border-volunteer/30 bg-volunteer/10 px-2.5 py-0.5 text-xs font-semibold text-volunteer"
										>
											{skill}
										</span>
									))}
									<Link href={route('profile.edit')} className="text-xs font-medium text-primary">
										{auth?.skills?.length ? 'Ubah keahlian' : 'Tambahkan keahlian'}
									</Link>
								</div>
							</div>
						</AppSection>
					)}

					{auth?.forum_enabled && (
						<AppList>
							<AppListRow
								href={route('forum.index')}
								leading={
									<div className="rounded-xl bg-info/10 p-2.5 text-info">
										<IconMessages className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Forum Warga"
								meta="Kabar & diskusi warga di wilayah Anda"
							/>
						</AppList>
					)}
				</div>
			</div>
		</div>
	);
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Beranda'} />;
