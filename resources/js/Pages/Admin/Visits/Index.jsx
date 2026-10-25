import HeaderTitle from '@/Components/HeaderTitle';
import { FilterPill } from '@/Components/ReportFilterFields';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/Components/ui/chart';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { IconChartBar } from '@tabler/icons-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

// Statistik kunjungan per hari (TASK_79), superadmin saja. Angka "pengunjung" = pengunjung unik
// PER HARI; angka periode adalah jumlahnya (orang yang sama di dua hari terhitung dua) - server
// sengaja tak menyimpan pengenal lintas hari. Lihat Admin\SiteVisitController.

const METRICS = {
	visitors: { label: 'Pengunjung unik', color: 'hsl(var(--chart-1))' },
	views: { label: 'Halaman dibuka', color: 'hsl(var(--chart-2))' },
};

const CHANNEL_LABEL = { web: 'Browser (web)', apk: 'Aplikasi Android', desktop: 'Aplikasi Desktop' };
const AUTH_LABEL = { 1: 'Sudah masuk akun', 0: 'Tamu (belum masuk)' };

// Nama rute -> nama halaman yang dikenali manusia. Rute di luar daftar tampil apa adanya.
const PAGE_LABEL = {
	'home.index': 'Beranda',
	'home.spotlight': 'Beranda (Spotlight)',
	'home.landing': 'Landing',
	'home.landing.page': 'Landing',
	dashboard: 'Dashboard',
	login: 'Masuk',
	register: 'Daftar',
	'front.reports.create': 'Form Lapor',
	'front.reports.thanks': 'Laporan Diterima',
	'front.reports.guest.status': 'Status Laporan Tamu',
	'front.reports.index': 'Riwayat Laporan',
	'reports.show': 'Detail Laporan',
	'front.monitoring.map': 'Peta Pemantauan',
	'front.hydrants.index': 'Hydrant',
	'front.pumps.index': 'Pompa',
	'front.volunteers.index': 'Daftar Relawan',
	'profile.edit': 'Profil',
	'info.help': 'Bantuan',
	'info.about': 'Tentang',
	'info.terms': 'Syarat & Ketentuan',
	'info.privacy': 'Kebijakan Privasi',
	'forum.index': 'Forum Warga',
	'admin.reports.index': 'Admin - Daftar Laporan',
	'admin.visits.index': 'Statistik Kunjungan',
};

const nf = new Intl.NumberFormat('id-ID');
const shortDate = (v) =>
	new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(`${v}T00:00:00`));
const longDate = (v) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(new Date(`${v}T00:00:00`));

function SummaryTile({ label, value, hint }) {
	return (
		<Card>
			<CardContent className="p-4">
				<p className="text-[13px] font-medium text-muted-foreground">{label}</p>
				<p className="mt-1 text-2xl font-bold tracking-tight text-foreground">{nf.format(value)}</p>
				{hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
			</CardContent>
		</Card>
	);
}

// Rincian satu dimensi: label, pengunjung, halaman dibuka, dan bilah proporsi halaman dibuka.
function BreakdownCard({ title, description, rows }) {
	const max = Math.max(1, ...rows.map((r) => r.views));

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			<CardContent>
				{rows.length === 0 ? (
					<p className="text-sm text-muted-foreground">Belum ada kunjungan pada periode ini.</p>
				) : (
					<ul className="space-y-3">
						{rows.map((row) => (
							<li key={row.key}>
								<div className="flex items-baseline justify-between gap-3 text-sm">
									<span className="min-w-0 truncate font-medium text-foreground">{row.label}</span>
									<span className="shrink-0 tabular-nums text-muted-foreground">
										{nf.format(row.visitors)} pengunjung - {nf.format(row.views)} halaman
									</span>
								</div>
								<div className="mt-1.5 h-1.5 rounded-full bg-muted">
									<div
										className="h-1.5 rounded-full bg-primary"
										style={{ width: `${(row.views / max) * 100}%` }}
									/>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}

export default function Index(props) {
	const { daily, summary, byChannel, byAuth, byTenant, topPages, filters, rangeOptions, tenantOptions } = props;
	const [metric, setMetric] = useState('visitors');

	const applyFilter = (next) =>
		router.get(route('admin.visits.index'), { ...filters, ...next }, { preserveScroll: true, preserveState: true });

	const tenantLabel = tenantOptions.find((t) => t.value === filters.tenant)?.label;
	const periodTotal = daily.reduce((acc, d) => acc + d[metric], 0);

	return (
		<div className="flex w-full flex-col space-y-6 pb-32">
			<HeaderTitle
				title={props.page_settings.title}
				subtitle={props.page_settings.subtitle}
				icon={IconChartBar}
			/>

			<div className="space-y-3">
				<div className="flex gap-2 overflow-x-auto pb-1">
					{rangeOptions.map((days) => (
						<FilterPill
							key={days}
							active={filters.range === days}
							onClick={() => applyFilter({ range: days })}
						>
							{days} hari
						</FilterPill>
					))}
				</div>
				{tenantOptions.length > 1 && (
					<div className="flex gap-2 overflow-x-auto pb-1">
						<FilterPill
							size="sm"
							active={filters.tenant === ''}
							onClick={() => applyFilter({ tenant: '' })}
						>
							Semua wilayah
						</FilterPill>
						{tenantOptions.map((t) => (
							<FilterPill
								key={t.value}
								size="sm"
								active={filters.tenant === t.value}
								onClick={() => applyFilter({ tenant: t.value })}
							>
								{t.label}
							</FilterPill>
						))}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				<SummaryTile label="Pengunjung hari ini" value={summary.today_visitors} />
				<SummaryTile label="Halaman dibuka hari ini" value={summary.today_views} />
				<SummaryTile
					label="Rata-rata pengunjung/hari"
					value={summary.avg_visitors}
					hint={`${filters.range} hari terakhir`}
				/>
				<SummaryTile
					label="Total halaman dibuka"
					value={summary.total_views}
					hint={`${filters.range} hari terakhir`}
				/>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-3 space-y-0 pb-2 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle className="text-base">Kunjungan per hari</CardTitle>
						<CardDescription>
							{tenantLabel ?? 'Semua wilayah'} - {nf.format(periodTotal)}{' '}
							{METRICS[metric].label.toLowerCase()} dalam {filters.range} hari
						</CardDescription>
					</div>
					<div className="flex gap-2">
						{Object.entries(METRICS).map(([key, m]) => (
							<FilterPill key={key} size="sm" active={metric === key} onClick={() => setMetric(key)}>
								{m.label}
							</FilterPill>
						))}
					</div>
				</CardHeader>
				<CardContent className="px-2 sm:px-6">
					<ChartContainer config={{ [metric]: METRICS[metric] }} className="aspect-auto h-[260px] w-full">
						<BarChart data={daily} margin={{ left: 0, right: 8 }}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								minTickGap={24}
								tickFormatter={shortDate}
							/>
							<YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(_, payload) => longDate(payload?.[0]?.payload?.date)}
									/>
								}
							/>
							<Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[3, 3, 0, 0]} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">
				<BreakdownCard
					title="Web vs Aplikasi"
					rows={byChannel.map((r) => ({ ...r, label: CHANNEL_LABEL[r.key] ?? r.key }))}
				/>
				<BreakdownCard
					title="Tamu vs Masuk Akun"
					description="Pengunjung yang masuk akun di tengah kunjungan terhitung di keduanya."
					rows={byAuth.map((r) => ({ ...r, label: AUTH_LABEL[r.key] ?? r.key }))}
				/>
				{filters.tenant === '' && (
					<BreakdownCard
						title="Per Wilayah"
						description="Menurut subdomain yang dibuka, bukan lokasi pengunjung."
						rows={byTenant}
					/>
				)}
				<Card className={cn(filters.tenant !== '' && 'lg:col-span-2')}>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Halaman Terpopuler</CardTitle>
					</CardHeader>
					<CardContent>
						{topPages.length === 0 ? (
							<p className="text-sm text-muted-foreground">Belum ada kunjungan pada periode ini.</p>
						) : (
							<ol className="divide-y divide-border/70">
								{topPages.map((p, i) => (
									<li key={p.page} className="flex items-center justify-between gap-3 py-2 text-sm">
										<span className="flex min-w-0 items-center gap-2">
											<span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
												{i + 1}
											</span>
											<span className="min-w-0 truncate font-medium text-foreground">
												{PAGE_LABEL[p.page] ?? p.page}
											</span>
										</span>
										<span className="shrink-0 tabular-nums text-muted-foreground">
											{nf.format(p.views)}
										</span>
									</li>
								))}
							</ol>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout title={page.props.page_settings.title} children={page} />;
