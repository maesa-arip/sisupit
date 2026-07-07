import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconChevronRight,
	IconClock,
	IconFlame,
	IconHistory,
	IconList,
	IconMapPin,
	IconSearch,
	IconShieldCheck,
	IconX,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function ReportIndex(props) {
	const { reports, page_settings, state, auth } = props;

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

	const StatusBadge = ({ status }) => {
		const variants = {
			TERLAPOR: { className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'TERLAPOR' },
			pending: { className: 'bg-warning/10 text-warning border-warning/20', label: 'MENUNGGU' },
			handling: { className: 'bg-success/10 text-success border-success/20', label: 'PENANGANAN' },
			resolved: { className: 'bg-info/10 text-info border-info/20', label: 'SELESAI' },
			ditolak: { className: 'bg-muted text-muted-foreground border-border', label: 'DITOLAK' },
		};
		const active = variants[status] || variants.pending;
		return (
			<Badge
				variant="outline"
				className={cn('whitespace-nowrap rounded-md px-2 py-0.5 font-bold shadow-none', active.className)}
			>
				{active.label}
			</Badge>
		);
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
			<div className="flex w-full space-x-1 rounded-lg border border-border bg-muted p-1 shadow-none sm:w-fit">
				<button
					onClick={() => handleFilterChange('all')}
					className={cn(
						'flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold outline-none transition-colors sm:w-40',
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
						'flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-bold outline-none transition-colors sm:w-40',
						activeTab === 'mine'
							? 'border border-border bg-card text-destructive shadow-none'
							: 'border border-transparent text-muted-foreground hover:text-foreground',
					)}
				>
					<IconHistory className="h-4 w-4" /> Riwayat Saya
				</button>
			</div>

			{/* --- DAFTAR LAPORAN (List View) --- */}
			<div className="flex flex-col space-y-3">
				{reports?.data?.length > 0 ? (
					reports.data.map((report) => (
						<Link
							key={report.id}
							href={route('reports.show', report.id)}
							className="group flex flex-col justify-between rounded-xl border border-border bg-card p-4 shadow-none transition-all duration-200 hover:border-muted-foreground/40 hover:bg-accent sm:flex-row sm:items-center sm:p-5"
						>
							<div className="flex min-w-0 flex-1 flex-col pr-4">
								<div className="mb-1 flex items-center gap-2">
									<IconFlame className="h-4 w-4 shrink-0 text-destructive" stroke={2.5} />
									<h4 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-destructive sm:text-base">
										{report.title}
									</h4>
								</div>
								<div className="mt-1 flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
									<span className="flex items-center gap-1.5 truncate">
										<IconMapPin className="h-3.5 w-3.5 shrink-0" />
										<span className="truncate">{report.address}</span>
									</span>
									<span className="hidden text-muted-foreground/50 sm:inline">•</span>
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
								</div>
							</div>

							<div className="mt-4 flex w-full items-center justify-between gap-4 border-t border-border pt-3 sm:mt-0 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
								<StatusBadge status={report.status} />

								<div className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-transparent transition-colors group-hover:border-border group-hover:bg-card">
									<IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
								</div>
							</div>
						</Link>
					))
				) : (
					<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-4 py-16 text-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-none">
							<IconShieldCheck className="h-6 w-6" stroke={1.5} />
						</div>
						<h3 className="text-sm font-bold text-foreground">Pencarian Kosong</h3>
						<p className="mt-1 max-w-[280px] text-xs text-muted-foreground">
							Tidak ada data laporan yang ditemukan berdasarkan filter atau kata kunci tersebut.
						</p>
					</div>
				)}
			</div>

			{/* --- PAGINASI (Jika ada lebih dari 10 data) --- */}
			{reports?.meta?.has_pages && (
				<div className="flex items-center justify-between border-t border-border pt-4">
					<Button
						variant="outline"
						disabled={!reports.links?.prev}
						onClick={() => router.get(reports.links.prev, {}, { preserveScroll: true })}
						className="border-border bg-card text-xs font-bold uppercase shadow-none"
					>
						Sebelumnya
					</Button>
					<span className="text-xs font-bold text-muted-foreground">
						Halaman {reports.meta.current_page} dari {reports.meta.last_page}
					</span>
					<Button
						variant="outline"
						disabled={!reports.links?.next}
						onClick={() => router.get(reports.links.next, {}, { preserveScroll: true })}
						className="border-border bg-card text-xs font-bold uppercase shadow-none"
					>
						Selanjutnya
					</Button>
				</div>
			)}
		</div>
	);
}

ReportIndex.layout = (page) => <AppLayout children={page} title="Daftar Laporan" />;
