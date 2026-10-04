import { AppEmpty, AppList, AppListRow } from '@/Components/AppSection';
import PaginationLinks from '@/Components/PaginationLinks';
import StatusBadge from '@/Components/StatusBadge';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { reportIcon } from '@/lib/report-icon';
import { alamatLaporan, cn, timeAgo } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { IconHistory, IconList, IconMapPin, IconSearch, IconShieldCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';

export default function ReportIndex(props) {
	const { reports, page_settings, state, auth } = props;
	// Akun OPD melihat daftar ber-cakupan instansi (FINDINGS #91): kedua tab di bawah tak
	// berlaku baginya — "Semua Laporan" bukan haknya dan "Riwayat Saya" selalu kosong karena
	// OPD tak pernah membuat laporan. Tab yang selalu memulangkan daftar kosong terbaca
	// sebagai bug, jadi disembunyikan, bukan dinonaktifkan.
	const isAgencyScope = props.scope === 'agency';

	// State untuk Pencarian dan Tab
	const [searchQuery, setSearchQuery] = useState(state?.search || '');

	// Mengambil parameter 'filter' dari URL untuk menentukan Tab yang aktif
	const urlParams = new URLSearchParams(window.location.search);
	const initialTab = urlParams.get('filter') === 'mine' ? 'mine' : 'all';
	const [activeTab, setActiveTab] = useState(initialTab);

	// Fungsi untuk menangani pencarian & ganti tab
	const handleFilterChange = (tab, search = searchQuery) => {
		setActiveTab(tab);
		router.get(
			route('front.reports.index'),
			{
				search: search,
				filter: tab === 'mine' ? 'mine' : null,
				load: 10,
			},
			{ preserveState: true, preserveScroll: true },
		);
	};

	const handleSearchSubmit = (e) => {
		e.preventDefault();
		handleFilterChange(activeTab, searchQuery);
	};

	const clearSearch = () => {
		setSearchQuery('');
		handleFilterChange(activeTab, '');
	};

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 pb-32">
			<Head title={page_settings?.title || 'Daftar Laporan'} />

			{/* --- HEADER & PENCARIAN --- */}
			<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">Arsip & Riwayat</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Pantau seluruh rekam jejak insiden dan laporan operasional.
					</p>
				</div>

				<form onSubmit={handleSearchSubmit} className="relative flex w-full items-center md:w-80">
					<IconSearch className="absolute left-3 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Cari kejadian atau lokasi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="h-11 w-full rounded-lg border-border bg-card pl-9 pr-10 shadow-none focus-visible:ring-1 focus-visible:ring-muted-foreground"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={clearSearch}
							className="absolute right-3 text-muted-foreground hover:text-foreground"
						>
							<IconX className="h-4 w-4" />
						</button>
					)}
				</form>
			</div>

			{/* --- TABS FILTER (Flat Design) --- */}
			{!isAgencyScope && (
				<div className="flex w-full space-x-1 rounded-lg border border-border bg-muted p-1 shadow-none sm:w-fit">
					<button
						onClick={() => handleFilterChange('all')}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold outline-none transition-colors sm:w-40',
							activeTab === 'all'
								? 'border border-border bg-card text-foreground shadow-none'
								: 'border border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						<IconList className="h-4 w-4" /> Semua Laporan
					</button>
					<button
						onClick={() => handleFilterChange('mine')}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold outline-none transition-colors sm:w-40',
							activeTab === 'mine'
								? 'border border-border bg-card text-destructive shadow-none'
								: 'border border-transparent text-muted-foreground hover:text-foreground',
						)}
					>
						<IconHistory className="h-4 w-4" /> Riwayat Saya
					</button>
				</div>
			)}

			{/* --- DAFTAR LAPORAN --- Baris & ikon jenis kejadian SAMA dengan dashboard
			    (AppListRow + reportIcon): dulu halaman ini punya markup baris sendiri dan api
			    untuk semua jenis, sehingga satu insiden terlihat beda di dua layar (2026-10-02). */}
			<AppList>
				{reports?.data?.length > 0 ? (
					reports.data.map((report) => {
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
												year: 'numeric',
												hour: '2-digit',
												minute: '2-digit',
											})}
										</span>
									</>
								}
								meta={
									<span className="flex items-start gap-1.5">
										<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
										<span>{alamatLaporan(report)}</span>
									</span>
								}
								badges={<StatusBadge status={report.status} />}
							/>
						);
					})
				) : (
					<AppEmpty
						icon={IconShieldCheck}
						title="Pencarian Kosong"
						description="Tidak ada data laporan yang ditemukan berdasarkan filter atau kata kunci tersebut."
					/>
				)}
			</AppList>

			{/* --- PAGINASI. Dulu dijaga `reports.meta.has_pages`, padahal controller mengirim paginator mentah
			    (tanpa `meta`) - tombolnya tak pernah tampil (2026-10-05). Kini pola /hydrants. --- */}
			<PaginationLinks links={reports?.links} />
		</div>
	);
}

ReportIndex.layout = (page) => <AppLayout children={page} title="Daftar Laporan" />;
