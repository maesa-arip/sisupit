import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StandbyCard from '@/Components/StandbyCard';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import useRealtimeStatus from '@/hooks/use-realtime-status';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconDroplet,
	IconFileText,
	IconFireHydrant,
	IconFiretruck,
	IconHeartHandshake,
	IconMapSearch,
} from '@tabler/icons-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';

/**
 * Dashboard pejabat - TASK_72 fase 5, dirancang ulang dari nol.
 *
 * Pertanyaan utamanya: "apakah layanan berjalan baik, dan di mana masalahnya?". Strategis, TANPA tombol
 * aksi (pejabat memantau): situasi saat ini dalam satu kalimat, kinerja per periode, tren, titik rawan
 * per kecamatan, kesiapan sarana, Laporan Kejadian final.
 *
 * Grafik mengikuti skill dataviz: satu seri (tanpa legenda, judulnya yang menamai), satu sumbu, warna
 * `--chart-2` yang lolos validator di kedua mode (bukan warna status), tooltip per batang, dan tampilan
 * tabel untuk pembaca layar / yang lebih suka angka.
 */

const REALTIME_META = {
	connected: { label: 'Realtime aktif', className: 'bg-success/10 text-success', dot: 'bg-success' },
	connecting: { label: 'Menyambung ulang...', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
	offline: { label: 'Realtime terputus', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
	disabled: { label: 'Realtime nonaktif', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

const PERIOD_PROPS = ['period', 'performance', 'trend', 'trendUnit', 'districts'];
const LIVE_PROPS = ['situation', 'performance', 'trend', 'districts', 'finalReports'];
const TREND_UNIT = { day: 'per hari', week: 'per minggu', month: 'per bulan' };
const chartConfig = { count: { label: 'Kejadian', color: 'hsl(var(--chart-2))' } };

function situationSentence({ waiting = 0, verified = 0, handling = 0 }) {
	const active = waiting + verified + handling;
	if (active === 0) return 'Saat ini tidak ada kejadian aktif di wilayah Anda.';
	const parts = [];
	if (handling) parts.push(`${handling} sedang ditangani`);
	if (verified) parts.push(`${verified} menunggu petugas`);
	if (waiting) parts.push(`${waiting} menunggu verifikasi`);
	return `Saat ini ${active} kejadian aktif di wilayah Anda: ${parts.join(', ')}.`;
}

function Kpi({ label, value, unit, note }) {
	return (
		<div className="rounded-2xl border border-border/70 bg-card p-3.5 shadow-sm md:p-4">
			<div className="text-[13px] font-medium leading-snug text-muted-foreground">{label}</div>
			<div className="mt-1 text-[28px] font-bold tabular-nums leading-none tracking-tight text-foreground">
				{value}
				{unit && <span className="ml-1 text-sm font-semibold text-muted-foreground">{unit}</span>}
			</div>
			{note && <div className="mt-1.5 text-xs leading-snug text-muted-foreground">{note}</div>}
		</div>
	);
}

function formatDate(iso) {
	if (!iso) return '-';
	return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
}

export default function PejabatDashboard({
	auth,
	period = '30',
	periods = {},
	situation = {},
	performance = {},
	trend = [],
	trendUnit = 'week',
	districts = [],
	readiness = {},
	finalReports = [],
	feed_channel = null,
}) {
	const realtime = REALTIME_META[useRealtimeStatus()];
	const periodLabel = periods[period] || '';

	useReportFeed(feed_channel, () => router.reload({ only: LIVE_PROPS }));

	// Saklar siaga pejabat - kembaran kartu relawan (profile.standby / users.is_standby).
	const isStandby = auth?.user?.is_standby ?? true;
	const [isTogglingStandby, setIsTogglingStandby] = useState(false);
	const handleToggleStandby = () => {
		setIsTogglingStandby(true);
		router.post(
			route('profile.standby'),
			{},
			{
				preserveScroll: true,
				onSuccess: () =>
					toast.success(
						isStandby
							? 'Siaga dinonaktifkan. Anda tidak akan menerima notifikasi insiden.'
							: 'Siaga diaktifkan. Anda akan menerima notifikasi insiden.',
					),
				onError: () => toast.error('Gagal mengubah status siaga. Silakan coba lagi.'),
				onFinish: () => setIsTogglingStandby(false),
			},
		);
	};

	const choosePeriod = (key) =>
		router.get(
			route('dashboard'),
			{ periode: key },
			{ only: PERIOD_PROPS, preserveScroll: true, preserveState: true, replace: true },
		);

	const activeCount = (situation.waiting ?? 0) + (situation.verified ?? 0) + (situation.handling ?? 0);
	const maxDistrict = Math.max(1, ...districts.map((d) => d.total));
	const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

	return (
		<div className="h-full w-full space-y-6 pb-10 lg:space-y-8">
			<Head title="Dashboard Eksekutif" />

			<AppGreeting
				title="Ringkasan Layanan"
				meta={
					<span
						className={cn(
							'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
							realtime.className,
						)}
					>
						<span className={cn('h-1.5 w-1.5 rounded-full', realtime.dot)} />
						{realtime.label}
					</span>
				}
			/>

			{/* Situasi SAAT INI - satu kalimat yang bisa dibacakan di rapat. */}
			<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm md:p-5">
				<p className="text-[17px] font-semibold leading-snug text-foreground md:text-lg">
					{situationSentence(situation)}
				</p>
				<div className="mt-3 flex flex-wrap gap-2">
					{activeCount > 0 && (
						<Link
							href={route('front.reports.index', { status: 'aktif' })}
							className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-[13px] font-medium text-primary active:bg-muted"
						>
							Lihat {activeCount} kejadian aktif
						</Link>
					)}
					<Link
						href={route('front.monitoring.map')}
						className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-[13px] font-medium text-primary active:bg-muted"
					>
						<IconMapSearch className="h-4 w-4" /> Peta Pemantauan
					</Link>
				</div>
			</div>

			{/* Pejabat memantau, jadi ia boleh memilih tidak dibangunkan notifikasi insiden. */}
			<StandbyCard isStandby={isStandby} busy={isTogglingStandby} onToggle={handleToggleStandby} />

			{/* Pemilih periode - satu baris di atas semua angka & grafik yang ia atur. */}
			<div
				role="group"
				aria-label="Periode"
				className="flex gap-1 rounded-xl border border-border/70 bg-card p-1 shadow-sm"
			>
				{Object.entries(periods).map(([key, label]) => (
					<button
						key={key}
						type="button"
						aria-pressed={period === key}
						onClick={() => choosePeriod(key)}
						className={cn(
							'flex-1 rounded-lg px-2 py-2 text-[13px] font-semibold transition-colors',
							period === key
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:text-foreground active:bg-muted',
						)}
					>
						{label}
					</button>
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
				<div className="space-y-6 lg:col-span-2 lg:space-y-8">
					<AppSection title={`Kinerja - ${periodLabel}`}>
						<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
							<Kpi
								label="Total kejadian"
								value={performance.total ?? 0}
								note="Tanpa laporan ditolak & ganda"
							/>
							<Kpi
								label="Selesai ditangani"
								value={performance.resolved_pct ?? '-'}
								unit={performance.resolved_pct != null ? '%' : null}
								note={`${performance.resolved ?? 0} dari ${performance.total ?? 0} kejadian`}
							/>
							<Kpi
								label="Biasanya merespons"
								value={performance.median_response?.minutes ?? '-'}
								unit={performance.median_response ? 'mnt' : null}
								note={
									performance.median_response
										? `Lapor ke petugas meluncur, nilai tengah ${performance.median_response.sample} kejadian`
										: 'Belum ada data'
								}
							/>
							<Kpi
								label="Biasanya tiba"
								value={performance.median_arrival?.minutes ?? '-'}
								unit={performance.median_arrival ? 'mnt' : null}
								note={
									performance.median_arrival
										? `Lapor ke petugas tiba, nilai tengah ${performance.median_arrival.sample} kejadian`
										: 'Belum ada data'
								}
							/>
							<Kpi
								label="Korban tercatat"
								value={performance.victims ?? 0}
								note="Dari Laporan Kejadian final"
							/>
						</div>
					</AppSection>

					<AppSection title={`Kejadian ${TREND_UNIT[trendUnit] || ''}`.trim()}>
						<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							{trend.some((t) => t.count > 0) ? (
								<ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
									<BarChart data={trend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
										<CartesianGrid vertical={false} strokeDasharray="3 3" />
										<XAxis
											dataKey="label"
											tickLine={false}
											axisLine={false}
											tickMargin={8}
											minTickGap={12}
										/>
										<YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
										<ChartTooltip
											cursor={{ fill: 'hsl(var(--muted))' }}
											content={<ChartTooltipContent hideIndicator />}
										/>
										<Bar
											dataKey="count"
											fill="var(--color-count)"
											radius={[4, 4, 0, 0]}
											maxBarSize={36}
										/>
									</BarChart>
								</ChartContainer>
							) : (
								<AppEmpty
									icon={IconFileText}
									title="Belum ada kejadian"
									description={`Tidak ada kejadian tercatat dalam ${periodLabel.toLowerCase()}.`}
								/>
							)}
							{/* Tampilan tabel: angka yang sama, untuk pembaca layar & untuk dikutip di laporan. */}
							<details className="mt-3 text-[13px]">
								<summary className="cursor-pointer font-medium text-primary">
									Lihat sebagai tabel
								</summary>
								<table className="mt-2 w-full tabular-nums">
									<thead>
										<tr className="text-left text-muted-foreground">
											<th className="py-1 font-medium">Periode</th>
											<th className="py-1 text-right font-medium">Kejadian</th>
										</tr>
									</thead>
									<tbody>
										{trend.map((t) => (
											<tr key={t.key} className="border-t border-border/70">
												<td className="py-1">{t.label}</td>
												<td className="py-1 text-right">{t.count}</td>
											</tr>
										))}
									</tbody>
								</table>
							</details>
						</div>
					</AppSection>

					<AppSection title="Titik Rawan per Kecamatan">
						<div className="space-y-2.5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							{districts.map((d) => (
								<div
									key={d.code ?? 'none'}
									className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-[13px]"
								>
									<span className="truncate text-foreground">{d.name}</span>
									<span className="h-2 rounded-full bg-muted">
										<span
											className="block h-2 rounded-full bg-chart-2"
											style={{ width: `${(d.total / maxDistrict) * 100}%` }}
										/>
									</span>
									<span className="text-right font-semibold tabular-nums text-foreground">
										{d.total}
									</span>
								</div>
							))}
							{districts.length === 0 && (
								<p className="py-4 text-center text-[13px] text-muted-foreground">
									Belum ada kejadian dalam periode ini.
								</p>
							)}
						</div>
					</AppSection>
				</div>

				<div className="space-y-6 lg:space-y-8">
					<AppSection title="Kesiapan Sarana">
						<AppList>
							<AppListRow
								href={route('front.hydrants.index')}
								leading={
									<div className="rounded-xl bg-teal/10 p-2.5 text-teal">
										<IconFireHydrant className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Hydrant aktif"
								meta={`${readiness.hydrants_active ?? 0} dari ${readiness.hydrants_total ?? 0} (${pct(readiness.hydrants_active, readiness.hydrants_total)}%)`}
							/>
							<AppListRow
								href={route('front.pumps.index')}
								leading={
									<div className="rounded-xl bg-info/10 p-2.5 text-info">
										<IconDroplet className="h-5 w-5" stroke={2} />
									</div>
								}
								title="SKKL"
								meta={`${readiness.skkl ?? 0} titik`}
							/>
							<AppListRow
								href={route('front.fire_stations.index')}
								leading={
									<div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
										<IconFiretruck className="h-5 w-5" stroke={2} />
									</div>
								}
								title="Pos pemadam"
								meta={`${readiness.stations ?? 0} pos`}
							/>
							{/* Bukan tautan: daftar relawan (/relawan) milik staf, pejabat tak punya akses - baris
							    tanpa panah supaya tak menjanjikan ketukan yang berujung 403. */}
							<div className="flex items-start gap-3 px-4 py-3.5 md:px-5 md:py-4">
								<div className="shrink-0 rounded-xl bg-volunteer/10 p-2.5 text-volunteer">
									<IconHeartHandshake className="h-5 w-5" stroke={2} />
								</div>
								<div className="min-w-0 flex-1">
									<div className="text-[15px] font-semibold leading-snug text-foreground">
										Relawan siaga
									</div>
									<div className="mt-1 text-[13px] text-muted-foreground">
										{readiness.volunteers_standby ?? 0} dari {readiness.volunteers_total ?? 0}{' '}
										terdaftar
									</div>
								</div>
							</div>
						</AppList>
					</AppSection>

					<AppSection title="Laporan Kejadian Final">
						<AppList>
							{finalReports.map((r) => (
								<a
									key={r.id}
									href={route('reports.resolution.pdf', [r.report_id, r.id])}
									target="_blank"
									rel="noreferrer"
									className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50 active:bg-muted md:px-5 md:py-4"
								>
									<div className="shrink-0 rounded-xl bg-info/10 p-2.5 text-info">
										<IconFileText className="h-5 w-5" stroke={2} />
									</div>
									<div className="min-w-0 flex-1">
										<div className="text-[15px] font-semibold leading-snug text-foreground">
											{r.title}
										</div>
										<div className="mt-0.5 text-[13px] text-muted-foreground">
											{formatDate(r.date)}
											{r.victims > 0 ? ` - ${r.victims} korban` : ''}
										</div>
									</div>
									<span className="shrink-0 self-center rounded-full border border-border/70 px-2.5 py-0.5 text-xs font-semibold text-foreground">
										PDF
									</span>
								</a>
							))}
							{finalReports.length === 0 && (
								<AppEmpty
									icon={IconFileText}
									title="Belum ada Laporan Kejadian final"
									description="Laporan yang sudah difinalkan admin tampil di sini."
								/>
							)}
						</AppList>
					</AppSection>
				</div>
			</div>
		</div>
	);
}

PejabatDashboard.layout = (page) => <AppLayout children={page} title="Dashboard Eksekutif" />;
