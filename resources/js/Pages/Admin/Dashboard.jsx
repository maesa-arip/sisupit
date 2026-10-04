import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StatusBadge from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import useRealtimeStatus from '@/hooks/use-realtime-status';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { reportIcon } from '@/lib/report-icon';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconBuildingCommunity,
	IconChecks,
	IconFileText,
	IconFireHydrant,
	IconHeartHandshake,
	IconMapPin,
	IconMapSearch,
	IconPhoto,
	IconShieldHalf,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Dashboard Pusat Komando (admin & superadmin) - TASK_72, dirancang ulang dari nol.
 *
 * Pertanyaan utamanya: "laporan mana yang harus saya putuskan sekarang?". Urutan di ponsel =
 * urutan prioritas: antrian verifikasi -> kejadian aktif -> angka kunci -> perlu ditindaklanjuti ->
 * siaga -> peta. Desktop: dua kolom, kerja di kiri, angka & konteks di kanan.
 *
 * Verifikasi SENGAJA tidak dikerjakan dari sini: menyetujui laporan membunyikan sirine se-wilayah dan
 * memilih OPD yang dilibatkan (dialog di halaman detail). Keputusan itu harus diambil sambil melihat
 * foto & peta, jadi baris antrian membawa pratinjau foto lalu membuka detailnya.
 */

const REALTIME_META = {
	connected: { label: 'Realtime aktif', className: 'bg-success/10 text-success', dot: 'bg-success' },
	connecting: { label: 'Menyambung ulang...', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
	offline: { label: 'Realtime terputus', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
	disabled: { label: 'Realtime nonaktif', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

// Prop yang dimuat ulang saat feed wilayah berubah. `resources` tidak ikut: siaran laporan tak mengubahnya.
// `regions` & `systemHealth` hanya dikirim untuk superadmin; meminta prop yang tak ada tidak apa-apa.
const LIVE_PROPS = ['triage', 'triageTotal', 'activeIncidents', 'kpis', 'pendingWork', 'regions', 'systemHealth'];

const CHIP_TONE = {
	danger: 'border-destructive/30 bg-destructive/10 text-destructive',
	warn: 'border-warning/30 bg-warning/10 text-warning',
	ok: 'border-success/30 bg-success/10 text-success',
	muted: 'border-border bg-muted text-muted-foreground',
	primary: 'border-primary bg-primary text-primary-foreground',
};

function Chip({ tone = 'muted', icon: Icon, children }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
				CHIP_TONE[tone],
			)}
		>
			{Icon && <Icon className="h-3.5 w-3.5" stroke={2} />}
			{children}
		</span>
	);
}

/** Jam yang berdetak tiap 30 detik, supaya umur laporan terus bertambah tanpa memuat ulang. */
function useNow(intervalMs = 30000) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

function minutesSince(iso, now) {
	const then = new Date(iso).getTime();
	return isNaN(then) ? 0 : Math.max(0, Math.floor((now - then) / 60000));
}

function formatAge(minutes) {
	if (minutes < 1) return 'Baru saja';
	if (minutes < 60) return `${minutes} mnt`;
	const jam = Math.floor(minutes / 60);
	if (jam < 24) return `${jam} j ${minutes % 60} mnt`;
	return `${Math.floor(jam / 24)} hari`;
}

/** Ambang umur antrian: 2 menit kuning, 5 menit merah. Laporan menunggu = sirine yang belum bunyi. */
function ageTone(minutes) {
	if (minutes >= 5) return 'text-destructive font-bold';
	if (minutes >= 2) return 'text-warning font-bold';
	return 'text-muted-foreground';
}

/** Id yang baru muncul sejak render sebelumnya - diberi animasi masuk. Muatan pertama tidak. */
function useFreshIds(items) {
	const seen = useRef(null);
	const ids = items.map((i) => i.id);
	const fresh = seen.current ? new Set(ids.filter((id) => !seen.current.has(id))) : new Set();
	useEffect(() => {
		seen.current = new Set(ids);
	});
	return fresh;
}

const ENTER = 'duration-500 ease-spring animate-in fade-in slide-in-from-top-2 motion-reduce:slide-in-from-top-0';

function Kpi({ label, value, unit, note, href }) {
	const body = (
		<>
			<div className="text-[13px] font-medium leading-snug text-muted-foreground">{label}</div>
			<div className="mt-1 text-[28px] font-bold tabular-nums leading-none tracking-tight text-foreground">
				{value}
				{unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
			</div>
			{note && <div className="mt-1.5 text-xs leading-snug text-muted-foreground">{note}</div>}
		</>
	);
	const classes = 'block rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm md:p-4';

	if (!href) return <div className={classes}>{body}</div>;

	return (
		<Link
			href={href}
			className={cn(
				classes,
				'outline-none transition-colors hover:border-border focus-visible:ring-2 focus-visible:ring-ring active:bg-muted',
			)}
		>
			{body}
		</Link>
	);
}

function median(stat) {
	return stat ? { value: stat.minutes, unit: 'mnt', note: `7 hari, dari ${stat.sample} laporan` } : null;
}

function TriageRow({ report, now, fresh }) {
	const age = minutesSince(report.created_at, now);
	const { Icon: ReportIcon, className: iconStyle } = reportIcon(report);

	return (
		<AppListRow
			href={route('reports.show', report.id)}
			className={cn(fresh && ENTER, age >= 5 && 'bg-destructive/[0.04]')}
			leading={
				report.photo ? (
					<img
						src={`/storage/${report.photo}`}
						alt=""
						loading="lazy"
						className="h-12 w-12 rounded-xl border border-border/70 object-cover"
					/>
				) : (
					<div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconStyle)}>
						<ReportIcon className="h-5 w-5" stroke={2} />
					</div>
				)
			}
			title={report.title}
			aside={<span className={cn('tabular-nums', ageTone(age))}>{formatAge(age)}</span>}
			meta={
				<span className="flex items-start gap-1.5">
					<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
					<span>{report.location || 'Lokasi belum terbaca'}</span>
				</span>
			}
			badges={
				<>
					<Chip tone="primary">Tinjau & verifikasi</Chip>
					<Chip tone={report.photos_count ? 'muted' : 'warn'} icon={IconPhoto}>
						{report.photos_count ? `${report.photos_count} foto` : 'Tanpa foto'}
					</Chip>
					{!report.has_coords && (
						<Chip tone="warn" icon={IconMapPin}>
							Tanpa titik
						</Chip>
					)}
					{report.duplicate_of && <Chip tone="warn">Mungkin ganda: {report.duplicate_of.title}</Chip>}
				</>
			}
		/>
	);
}

function ActiveRow({ incident, now, fresh }) {
	const age = minutesSince(incident.created_at, now);
	const responders = incident.officers_count + incident.helpers_count;
	const { Icon: ReportIcon, className: iconStyle } = reportIcon(incident);

	return (
		<AppListRow
			href={route('reports.show', incident.id)}
			className={cn(fresh && ENTER)}
			leading={
				<div className={cn('rounded-xl p-2.5', iconStyle)}>
					<ReportIcon className="h-5 w-5" stroke={2} />
				</div>
			}
			title={incident.title}
			aside={
				<span className={cn('tabular-nums', responders === 0 ? ageTone(age) : 'text-muted-foreground')}>
					{formatAge(age)}
				</span>
			}
			meta={
				<span className="flex items-start gap-1.5">
					<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
					<span>{incident.location || 'Lokasi belum terbaca'}</span>
				</span>
			}
			badges={
				<>
					<StatusBadge status={incident.status} />
					{responders === 0 ? (
						<Chip tone="danger">Belum ada yang meluncur</Chip>
					) : (
						<>
							{incident.officers_count > 0 && (
								<Chip tone="ok">
									{incident.officers_count} petugas
									{incident.officers_arrived_count > 0 &&
										` - ${incident.officers_arrived_count} tiba`}
								</Chip>
							)}
							{incident.helpers_count > 0 && <Chip>{incident.helpers_count} relawan</Chip>}
						</>
					)}
					{incident.agencies_waiting_count > 0 && (
						<Chip tone="warn" icon={IconBuildingCommunity}>
							{incident.agencies_waiting_count} OPD belum konfirmasi
						</Chip>
					)}
				</>
			}
		/>
	);
}

export default function AdminDashboard({
	auth,
	triage = [],
	triageTotal = 0,
	activeIncidents = [],
	kpis = {},
	pendingWork = {},
	resources = {},
	regions = null,
	systemHealth = null,
	feed_channel = null,
}) {
	const now = useNow();
	const realtime = REALTIME_META[useRealtimeStatus()];
	const freshTriage = useFreshIds(triage);
	const freshActive = useFreshIds(activeIncidents);

	// Laporan masuk / status berubah di wilayah ini -> muat ulang bagian yang hidup saja.
	useReportFeed(feed_channel, () => router.reload({ only: LIVE_PROPS }));

	const isSuperadmin = (auth?.user?.role || []).includes('superadmin');
	const approval = median(kpis.median_approval);
	const response = median(kpis.median_response);
	const baItems = pendingWork.ba_items || [];
	const agencyItems = pendingWork.agency_items || [];
	const moreBa = (pendingWork.ba_total || 0) - baItems.length;
	const moreAgency = (pendingWork.agency_total || 0) - agencyItems.length;
	const hasPending = baItems.length > 0 || agencyItems.length > 0 || pendingWork.hydrant_repair > 0;

	return (
		<div className="h-full w-full space-y-6 pb-10 lg:space-y-8">
			<Head title="Pusat Komando" />

			<AppGreeting
				title="Pusat Komando"
				meta={
					<>
						<span className="text-[13px] font-medium text-muted-foreground md:text-sm">
							{isSuperadmin ? 'Semua wilayah' : 'Wilayah yurisdiksi Anda'}
						</span>
						{/* Status koneksi Reverb sungguhan - di ponsel juga, karena tanpa realtime antrian ini basi. */}
						<span
							className={cn(
								'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
								realtime.className,
							)}
						>
							<span className={cn('h-1.5 w-1.5 rounded-full', realtime.dot)} />
							{realtime.label}
						</span>
					</>
				}
				trailing={
					<Button variant="outline" className="h-11 w-full rounded-xl md:h-10 md:w-auto" asChild>
						<Link href={route('front.reports.create')}>
							<IconAlertCircle className="mr-2 h-4 w-4" /> Input Laporan Telepon
						</Link>
					</Button>
				}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
				{/* KIRI: pekerjaan */}
				<div className="space-y-6 lg:col-span-2 lg:space-y-8">
					{/* Superadmin (fase 6): wilayah yang laporannya paling lama menunggu di atas. Baris bukan
					    tautan - daftar laporan admin belum bisa disaring per kabupaten, jadi tautan akan membuka
					    daftar yang hitungannya tak sama dengan baris ini (#133). */}
					{regions && (
						<AppSection title="Per Wilayah" count={regions.length}>
							<AppList>
								{regions.map((region) => {
									const age = region.oldest_waiting_at
										? minutesSince(region.oldest_waiting_at, now)
										: null;

									return (
										<div
											key={region.city_code}
											className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4"
										>
											<div className="min-w-0 flex-1">
												<div className="text-[15px] font-semibold leading-snug text-foreground">
													{region.name}
												</div>
												<div className="mt-0.5 text-[13px] text-muted-foreground">
													{region.has_tenant
														? region.city
														: `${region.city} - belum ada tenant`}
												</div>
												<div className="mt-2 flex flex-wrap gap-2">
													{region.waiting > 0 && (
														<Chip tone="danger">{region.waiting} menunggu verifikasi</Chip>
													)}
													{region.active > 0 && (
														<Chip tone="ok">{region.active} ditangani</Chip>
													)}
													{region.waiting === 0 && region.active === 0 && <Chip>Tenang</Chip>}
												</div>
											</div>
											{age != null && (
												<span className={cn('shrink-0 text-[13px] tabular-nums', ageTone(age))}>
													{formatAge(age)}
												</span>
											)}
										</div>
									);
								})}
								{regions.length === 0 && (
									<AppEmpty
										icon={IconChecks}
										title="Belum ada wilayah"
										description="Tenant aktif & wilayah berkejadian tampil di sini."
									/>
								)}
							</AppList>
						</AppSection>
					)}

					<AppSection
						title="Menunggu Verifikasi"
						count={triageTotal}
						action={
							triageTotal > triage.length
								? { href: route('admin.reports.index', { status: 'TERLAPOR' }), label: 'Lihat semua' }
								: undefined
						}
					>
						<AppList>
							{triage.map((report) => (
								<TriageRow
									key={report.id}
									report={report}
									now={now}
									fresh={freshTriage.has(report.id)}
								/>
							))}
							{triage.length === 0 && (
								<AppEmpty
									icon={IconChecks}
									title="Tidak ada laporan menunggu"
									description="Semua laporan masuk sudah diputuskan. Laporan baru muncul di sini tanpa memuat ulang."
								/>
							)}
						</AppList>
					</AppSection>

					<AppSection
						title="Kejadian Aktif"
						count={activeIncidents.length}
						action={{ href: route('admin.reports.index', { status: 'aktif' }), label: 'Semua laporan' }}
					>
						<AppList>
							{activeIncidents.map((incident) => (
								<ActiveRow
									key={incident.id}
									incident={incident}
									now={now}
									fresh={freshActive.has(incident.id)}
								/>
							))}
							{activeIncidents.length === 0 && (
								<AppEmpty
									icon={IconChecks}
									title="Tidak ada kejadian aktif"
									description="Belum ada laporan terverifikasi yang sedang ditangani."
								/>
							)}
						</AppList>
					</AppSection>
				</div>

				{/* KANAN: angka & konteks */}
				<div className="space-y-6 lg:space-y-8">
					{/* Superadmin (fase 6): hanya angka yang bisa dibuktikan - koneksi realtime klien & tabel queue. */}
					{systemHealth && (
						<AppSection title="Kesehatan Sistem">
							<AppList>
								<div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
									<span className="text-[15px] font-medium text-foreground">Realtime</span>
									<span
										className={cn(
											'rounded-full px-2.5 py-0.5 text-xs font-semibold',
											realtime.className,
										)}
									>
										{realtime.label}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
									<span className="text-[15px] font-medium text-foreground">Antrian queue</span>
									<span className="text-right text-[13px] text-muted-foreground">
										{systemHealth.queue_pending == null
											? 'tidak terbaca'
											: systemHealth.queue_pending === 0
												? 'kosong'
												: `${systemHealth.queue_pending} job, tertua ${formatAge(minutesSince(systemHealth.queue_oldest_at, now))}`}
									</span>
								</div>
								<div className="flex items-center justify-between gap-3 px-4 py-3.5 md:px-5">
									<span className="text-[15px] font-medium text-foreground">Job gagal</span>
									<span
										className={cn(
											'text-right text-[13px]',
											systemHealth.failed_24h > 0
												? 'font-semibold text-destructive'
												: 'text-muted-foreground',
										)}
									>
										{systemHealth.failed_24h == null
											? 'tidak terbaca'
											: `${systemHealth.failed_24h} dalam 24 jam, ${systemHealth.failed_total} total`}
									</span>
								</div>
							</AppList>
						</AppSection>
					)}

					<AppSection title="Angka Kunci">
						<div className="grid grid-cols-2 gap-3">
							<Kpi label="Masuk hari ini" value={kpis.incoming_today ?? 0} note="Sejak 00.00 WITA" />
							<Kpi
								label="Aktif sekarang"
								value={kpis.active_now ?? 0}
								note="Menunggu + terverifikasi + ditangani"
								href={route('admin.reports.index', { status: 'aktif' })}
							/>
							<Kpi
								label="Median verifikasi"
								value={approval?.value ?? '-'}
								unit={approval?.unit}
								note={approval?.note ?? 'Belum ada data 7 hari'}
							/>
							<Kpi
								label="Median respons"
								value={response?.value ?? '-'}
								unit={response?.unit}
								note={
									response ? `Lapor ke petugas meluncur, ${response.note}` : 'Belum ada data 7 hari'
								}
							/>
						</div>
					</AppSection>

					<AppSection title="Perlu Ditindaklanjuti">
						<AppList>
							{agencyItems.map((item) => (
								<AppListRow
									key={`opd-${item.report_id}-${item.agency_name}`}
									href={route('reports.show', item.report_id)}
									leading={
										<div className="rounded-xl bg-warning/10 p-2.5 text-warning">
											<IconBuildingCommunity className="h-5 w-5" stroke={2} />
										</div>
									}
									title={`${item.agency_name} belum konfirmasi`}
									meta={[item.label, item.title].filter(Boolean).join(' - ')}
								/>
							))}
							{moreAgency > 0 && (
								<div className="px-4 py-2.5 text-[13px] text-muted-foreground md:px-5">
									dan {moreAgency} konfirmasi OPD lainnya
								</div>
							)}
							{baItems.map((item) => (
								<AppListRow
									key={`ba-${item.id}`}
									href={route('reports.show', item.id)}
									leading={
										<div className="rounded-xl bg-info/10 p-2.5 text-info">
											<IconFileText className="h-5 w-5" stroke={2} />
										</div>
									}
									title={item.title}
									meta={
										item.has_draft
											? 'Laporan Kejadian sementara sudah diisi - tinggal difinalkan'
											: 'Laporan Kejadian belum diisi petugas'
									}
								/>
							))}
							{moreBa > 0 && (
								<div className="px-4 py-2.5 text-[13px] text-muted-foreground md:px-5">
									dan {moreBa} Laporan Kejadian lainnya (30 hari terakhir)
								</div>
							)}
							{pendingWork.hydrant_repair > 0 && (
								<AppListRow
									href={route('admin.hydrants.index', { status: 'Perbaikan' })}
									leading={
										<div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
											<IconFireHydrant className="h-5 w-5" stroke={2} />
										</div>
									}
									title={`${pendingWork.hydrant_repair} hydrant dalam perbaikan`}
									meta={`dari ${resources.hydrants_total ?? 0} hydrant terdata`}
								/>
							)}
							{!hasPending && (
								<AppEmpty
									icon={IconChecks}
									title="Tidak ada yang tertunda"
									description="Laporan Kejadian sudah final, OPD sudah menjawab, dan tak ada hydrant dalam perbaikan."
								/>
							)}
						</AppList>
					</AppSection>

					<AppSection title="Siaga di Wilayah">
						<AppList>
							<AppListRow
								href={route('front.volunteers.index', { status: 'siaga' })}
								leading={
									<div className="rounded-xl bg-volunteer/10 p-2.5 text-volunteer">
										<IconHeartHandshake className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Relawan siaga"
								aside={
									<span className="text-[15px] font-semibold tabular-nums text-foreground">
										{resources.standby_volunteers ?? 0}
									</span>
								}
							/>
							<AppListRow
								href={route('regu.index')}
								leading={
									<div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
										<IconShieldHalf className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Regu petugas"
								aside={
									<span className="text-[15px] font-semibold tabular-nums text-foreground">
										{resources.regus ?? 0}
									</span>
								}
							/>
							<AppListRow
								href={route('admin.hydrants.index')}
								leading={
									<div className="rounded-xl bg-teal/10 p-2.5 text-teal">
										<IconFireHydrant className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Hydrant aktif"
								aside={
									<span className="text-[15px] font-semibold tabular-nums text-foreground">
										{resources.hydrants_active ?? 0}
										<span className="font-normal text-muted-foreground">
											{' '}
											/ {resources.hydrants_total ?? 0}
										</span>
									</span>
								}
							/>
						</AppList>
					</AppSection>

					<AppList>
						<AppListRow
							href={route('front.monitoring.map')}
							leading={
								<div className="rounded-xl bg-teal/10 p-2.5 text-teal">
									<IconMapSearch className="h-5 w-5" stroke={2} />
								</div>
							}
							title="Peta Pemantauan"
							meta="Kejadian, hydrant, pos, pompa & relawan"
						/>
					</AppList>
				</div>
			</div>
		</div>
	);
}

AdminDashboard.layout = (page) => <AppLayout children={page} title="Pusat Komando" />;
