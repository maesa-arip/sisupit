import { AppEmpty } from '@/Components/AppSection';
import DatePicker from '@/Components/DatePicker';
import HeaderTitle from '@/Components/HeaderTitle';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { escapeHtml } from '@/lib/escape-html';
import { alamatLaporan, cn, MAP_TILE_URL, reportNumber, timeAgo } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconChevronRight,
	IconCircleCheck,
	IconClipboardPlus,
	IconEye,
	IconFileSpreadsheet,
	IconMapPin,
	IconMapPinFilled,
	IconPhone,
	IconPhoto,
	IconSearch,
	IconStack2,
	IconUser,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// 'aktif' dulu & jadi default triase (laporan yang masih perlu tindakan). 'Semua' tetap ada.
const STATUS_OPTIONS = ['aktif', 'Semua', 'TERLAPOR', 'pending', 'handling', 'resolved', 'ditolak', 'digabung'];

// Status yang TIDAK PERNAH sampai ke pemantau (pejabat/relawan): ReportController::index
// menyaringnya di server (whereNotIn TERLAPOR/ditolak/digabung). Chip yang selalu memulangkan
// daftar kosong terbaca sebagai bug, jadi ketiganya dibuang dari pill DAN legenda bagi pemantau.
const MONITOR_HIDDEN_STATUSES = ['TERLAPOR', 'ditolak', 'digabung'];

// Metadata status kejadian (badge + pin peta + titik legenda). Warna selaras Peta Pemantauan,
// KECUALI "Penanganan" yang memakai teal (permintaan produk). Gaya kartu/pill/paginasi
// mengikuti halaman Hydrant (Admin/Hydrants/Index.jsx): aksen seleksi primer sejak TASK_69 (apple-design).
const TEAL_ACCENT = {
	title: 'text-primary',
	pillActive: 'border-primary/20 bg-primary/10 text-primary',
	pageActive: 'border-primary bg-primary text-primary-foreground shadow-sm',
};

const STATUS_META = {
	TERLAPOR: {
		label: 'Laporan Masuk',
		badge: 'bg-destructive/10 text-destructive border-destructive/30',
		pin: 'text-destructive',
		dot: 'bg-destructive',
		ring: 'bg-destructive/10 text-destructive',
	},
	pending: {
		label: 'Laporan Terverifikasi',
		badge: 'bg-warning/10 text-warning border-warning/30',
		pin: 'text-warning',
		dot: 'bg-warning',
		ring: 'bg-warning/10 text-warning',
	},
	handling: {
		label: 'Penanganan',
		badge: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal/10 dark:text-teal dark:border-teal/30',
		pin: 'text-teal-600 dark:text-teal',
		dot: 'bg-teal-600 dark:bg-teal',
		ring: 'bg-teal-50 text-teal-700 dark:bg-teal/10 dark:text-teal',
	},
	resolved: {
		label: 'Selesai',
		badge: 'bg-info/10 text-info border-info/30',
		pin: 'text-info',
		dot: 'bg-info',
		ring: 'bg-info/10 text-info',
	},
	// `ditolak` (FINDINGS #24) = arsip, bukan kemajuan alur — karena itu netral/abu-abu,
	// sewarna dengan Components/StatusBadge.jsx yang jadi kamus kanoniknya. Selama entri ini
	// tidak ada, cadangan di markerStyle/StatusBadge menyebut laporan yang ditolak
	// "Laporan Terverifikasi" (FINDINGS #94).
	ditolak: {
		label: 'Ditolak',
		badge: 'bg-muted text-muted-foreground border-border',
		pin: 'text-muted-foreground',
		dot: 'bg-muted-foreground',
		ring: 'bg-muted text-muted-foreground',
	},
	// Laporan ganda yang digabung ke kejadian lain (TASK_55), sewarna Components/StatusBadge.jsx.
	digabung: {
		label: 'Digabung',
		badge: 'border-dashed border-muted-foreground/40 bg-muted/40 text-foreground',
		pin: 'text-muted-foreground/60',
		dot: 'bg-muted-foreground/60',
		ring: 'bg-muted/40 text-muted-foreground',
	},
};

// 'aktif' = filter gabungan (TERLAPOR+pending+handling), bukan status nyata — tidak lagi
// ditampilkan sebagai pill, tapi label tetap ada agar deep-link dari kartu "Darurat Aktif"
// di dashboard (admin.reports.index?status=aktif) tidak error.
const FILTER_LABEL = {
	Semua: 'Semua',
	aktif: 'Aktif',
	TERLAPOR: STATUS_META.TERLAPOR.label,
	pending: STATUS_META.pending.label,
	handling: STATUS_META.handling.label,
	resolved: STATUS_META.resolved.label,
	ditolak: STATUS_META.ditolak.label,
	digabung: STATUS_META.digabung.label,
};

// Urutan legenda peta = urutan alur insiden, ditutup 'ditolak' & 'digabung' (jalan keluar, bukan tahap).
const LEGEND_STATUSES = ['TERLAPOR', 'pending', 'handling', 'resolved', 'ditolak', 'digabung'];

const markerStyle = (status) => STATUS_META[status] || STATUS_META.pending;

// Pilihan isi berkas Export Excel (#141). Dipilih SENDIRI di pop-up, TIDAK lagi diwarisi dari
// chip yang sedang aktif: default chip halaman ini 'aktif', jadi dulu tombol Export diam-diam
// mengunduh laporan belum-selesai saja dan rekap lengkap baru keluar setelah chip "Semua"
// diklik - tanpa satu pun tanda di layar. Nilainya = nilai filter yang SAMA dengan chip
// (ReportsExport::query() menerimanya apa adanya), labelnya dari FILTER_LABEL supaya tak ada
// kamus status ketiga. 'Semua' sengaja di urutan pertama & jadi pilihan awal.
const EXPORT_OPTIONS = ['Semua', 'aktif', ...LEGEND_STATUSES];
// 'digabung' berbunyi "Laporan Sama" DI POP-UP INI SAJA (permintaan user TASK_64) - chip filter &
// lencana tetap "Digabung", jadi label STATUS_META sengaja tidak disentuh. Sejalan dengan
// ReportsExport::STATUS_LABELS supaya pilihan di pop-up = tulisan di berkasnya.
const EXPORT_LABEL = {
	...FILTER_LABEL,
	Semua: 'Semua Laporan',
	aktif: 'Darurat Aktif (belum selesai)',
	digabung: 'Laporan Sama',
};

function ExportDialog({ open, onOpenChange, search }) {
	const [status, setStatus] = useState('Semua');
	const [useSearch, setUseSearch] = useState(false);
	// Rentang tanggal laporan masuk (TASK_65), string 'YYYY-MM-DD' dari DatePicker. Kosong =
	// tak dibatasi di sisi itu. Tanggal WITA - server yang mengonversinya ke UTC.
	const [from, setFrom] = useState('');
	const [to, setTo] = useState('');
	const keyword = (search ?? '').trim();
	// String 'YYYY-MM-DD' bisa dibandingkan langsung. Rentang terbalik ditahan di sini karena
	// tautan unduhan yang ditolak server hanya memantulkan halaman tanpa pesan apa pun.
	const rangeInvalid = Boolean(from && to && to < from);

	// Tiap pop-up dibuka mulai dari keadaan bersih - pilihan unduhan sebelumnya tak boleh
	// terbawa diam-diam ke unduhan berikutnya (bentuk yang sama dengan bug yang diperbaiki).
	useEffect(() => {
		if (open) {
			setStatus('Semua');
			setUseSearch(false);
			setFrom('');
			setTo('');
		}
	}, [open]);

	const href = route('admin.reports.export', {
		status,
		...(useSearch && keyword ? { search: keyword } : {}),
		...(from ? { from } : {}),
		...(to ? { to } : {}),
	});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Ekspor Excel</DialogTitle>
					<DialogDescription>Pilih laporan mana yang ingin diunduh.</DialogDescription>
				</DialogHeader>
				<RadioGroup value={status} onValueChange={setStatus} className="gap-2">
					{EXPORT_OPTIONS.map((option) => (
						<Label
							key={option}
							htmlFor={`export-${option}`}
							className="flex cursor-pointer items-center gap-3 rounded-2xl border p-3 hover:bg-accent"
						>
							<RadioGroupItem value={option} id={`export-${option}`} />
							{STATUS_META[option]?.dot && (
								<span className={cn('h-2 w-2 rounded-full', STATUS_META[option].dot)} />
							)}
							<span>{EXPORT_LABEL[option] ?? option}</span>
						</Label>
					))}
				</RadioGroup>
				<div className="space-y-2">
					<Label className="text-sm font-semibold">Rentang tanggal laporan masuk</Label>
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
						<div className="space-y-1">
							<Label htmlFor="export-from" className="text-xs font-normal text-muted-foreground">
								Dari tanggal
							</Label>
							<DatePicker id="export-from" value={from} onChange={setFrom} placeholder="Awal" />
						</div>
						<div className="space-y-1">
							<Label htmlFor="export-to" className="text-xs font-normal text-muted-foreground">
								Sampai tanggal
							</Label>
							<DatePicker id="export-to" value={to} onChange={setTo} placeholder="Akhir" />
						</div>
					</div>
					{rangeInvalid ? (
						<p className="text-xs text-destructive">Tanggal akhir tidak boleh sebelum tanggal awal.</p>
					) : (
						<p className="text-xs text-muted-foreground">Kosongkan untuk mengunduh semua tanggal.</p>
					)}
				</div>
				{keyword && (
					<Label
						htmlFor="export-search"
						className="flex cursor-pointer items-start gap-3 text-sm font-normal"
					>
						<Checkbox
							id="export-search"
							checked={useSearch}
							onCheckedChange={(checked) => setUseSearch(checked === true)}
							className="mt-0.5"
						/>
						<span>Hanya yang cocok dengan pencarian &quot;{keyword}&quot;</span>
					</Label>
				)}
				<DialogFooter>
					<Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					{/* <a>, bukan <Link> Inertia - ini unduhan berkas. */}
					<Button asChild disabled={rangeInvalid}>
						<a
							href={rangeInvalid ? undefined : href}
							aria-disabled={rangeInvalid}
							className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
							onClick={() => onOpenChange(false)}
						>
							<IconFileSpreadsheet className="mr-1.5 h-4 w-4" /> Unduh
						</a>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function StatusBadge({ status }) {
	const active = STATUS_META[status] || STATUS_META.pending;
	return (
		<Badge
			variant="outline"
			className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 font-semibold shadow-none', active.badge)}
		>
			{active.label}
		</Badge>
	);
}

function formatDate(value) {
	if (!value) return '-';
	return new Date(value).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

// Chip ringkas untuk pemindaian triase cepat (umur laporan, ada/tanpa foto, tanpa titik).
const CHIP_TONE = {
	muted: 'border-border bg-muted/60 text-muted-foreground',
	ok: 'border-success/30 bg-success/10 text-success',
	warn: 'border-warning/30 bg-warning/10 text-warning',
	danger: 'border-destructive/30 bg-destructive/10 text-destructive',
};

function MetaChip({ icon: Icon, children, tone = 'muted' }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
				CHIP_TONE[tone],
			)}
		>
			<Icon className="h-3 w-3 shrink-0" />
			{children}
		</span>
	);
}

export default function Index(props) {
	const { data: reports, links, from, to, total } = props.reports;
	const { tenant_location } = props;
	const menungguVerifikasi = props.menunggu_verifikasi ?? 0;
	// Default = perilaku admin (verifikator penuh). Pemantau (pejabat/relawan) mengirim
	// canVerify/canExport=false + indexRouteName='front.reports.index' agar tak 403 di rute admin.
	const canVerify = props.canVerify ?? true;
	const canExport = props.canExport ?? true;
	const indexRouteName = props.indexRouteName || 'admin.reports.index';
	// Pemantau tak melihat laporan mentah (TERLAPOR) maupun yang ditolak — server memang
	// tak mengirimkannya (lihat MONITOR_HIDDEN_STATUSES), jadi buang dari pill & legenda.
	const statusOptions = canVerify
		? STATUS_OPTIONS
		: STATUS_OPTIONS.filter((s) => !MONITOR_HIDDEN_STATUSES.includes(s));
	const legendStatuses = canVerify
		? LEGEND_STATUSES
		: LEGEND_STATUSES.filter((s) => !MONITOR_HIDDEN_STATUSES.includes(s));
	const [params, setParams] = useState(props.state);
	const [activeReportId, setActiveReportId] = useState(null);
	const [exportOpen, setExportOpen] = useState(false);

	UseFilter({
		route: route(indexRouteName),
		values: params,
		only: ['reports'],
	});

	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersLayerRef = useRef(null);
	const mapContainerRef = useRef(null);

	useEffect(() => {
		if (!window.L || !mapRef.current) return;

		if (!mapInstanceRef.current) {
			// Peta berpusat di wilayah admin masing-masing
			const defaultLat = tenant_location?.lat || -8.65;
			const defaultLng = tenant_location?.lng || 115.22;
			mapInstanceRef.current = window.L.map(mapRef.current).setView([defaultLat, defaultLng], 12);
			window.L.tileLayer(MAP_TILE_URL, {
				attribution: '&copy; OpenStreetMap',
			}).addTo(mapInstanceRef.current);
			markersLayerRef.current = window.L.layerGroup().addTo(mapInstanceRef.current);
		}

		markersLayerRef.current.clearLayers();
		const bounds = [];

		if (reports && reports.length > 0) {
			reports.forEach((report) => {
				const lat = parseFloat(report.lat),
					lng = parseFloat(report.lng);
				if (!isNaN(lat) && !isNaN(lng)) {
					const iconColor = markerStyle(report.status).pin;
					const customIcon = window.L.divIcon({
						html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
						className: 'bg-transparent border-none',
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					});
					const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
					marker.bindPopup(
						`<b>${escapeHtml(report.title ?? 'Laporan')}</b><br><span class="text-xs text-muted-foreground">${escapeHtml(alamatLaporan(report) || '-')}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activeReportId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [reports]);

	const focusToReport = (id, lat, lng) => {
		setActiveReportId(id);
		const parsedLat = parseFloat(lat),
			parsedLng = parseFloat(lng);
		if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
			mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
		}
	};

	// Peta hanya tampil mulai lg (ponsel tanpa peta, TASK_69 bagian 15). Bila peta dibuat saat
	// tersembunyi lalu layar melebar, Leaflet perlu mengukur ulang wadahnya.
	useEffect(() => {
		if (!mapRef.current || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
		observer.observe(mapRef.current);
		return () => observer.disconnect();
	}, []);

	// Ketuk baris: desktop memusatkan peta; ponsel (tanpa peta) langsung membuka detail laporan.
	const openReport = (report) => {
		if (window.matchMedia('(min-width: 1024px)').matches) {
			focusToReport(report.id, report.lat, report.lng);
		} else {
			router.visit(route('reports.show', report.id));
		}
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconClipboardPlus}
				/>
				{/* Export TAMPIL LANGSUNG sebagai tombol, bukan di balik kebab ⋮ (permintaan user
				    2026-09-09). Dulu ia sengaja disembunyikan di menu sekunder (TASK_37 kluster C) supaya
				    tak bersaing dengan aksi triase; peran itu kini dipegang banner merah "menunggu
				    verifikasi" tepat di bawah, jadi tombol outline kecil di pojok tak lagi menyainginya.
				    Bentuknya menyalin tombol kepala halaman tetangga (Admin/Pumps & Admin/Hydrants);
				    Tombol ini MEMBUKA POP-UP pilihan isi berkas (#141), tidak langsung mengunduh -
				    dulu chip status yang sedang aktif ikut terbawa diam-diam, jadi isi berkas bergantung
				    pada chip yang kebetulan diklik (lihat EXPORT_OPTIONS).
				    Hanya untuk verifikator (admin) - pemantau tak punya rute admin.reports.export. */}
				{canExport && (
					<>
						<Button size="sm" variant="outline" onClick={() => setExportOpen(true)}>
							<IconFileSpreadsheet className="mr-1.5 h-4 w-4" /> Ekspor Excel
						</Button>
						<ExportDialog open={exportOpen} onOpenChange={setExportOpen} search={params?.search} />
					</>
				)}
			</div>

			{/* Header triase: berapa laporan MENUNGGU VERIFIKASI (TERLAPOR). Klik → filter TERLAPOR.
			    Hanya untuk verifikator — pemantau (pejabat/relawan) tak punya aksi verifikasi. */}
			{canVerify && menungguVerifikasi > 0 && (
				<button
					type="button"
					onClick={() => setParams((prev) => ({ ...prev, status: 'TERLAPOR' }))}
					className="flex items-center gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-left transition-[background-color,transform] hover:bg-destructive/15 active:scale-[0.99]"
				>
					<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
						<IconAlertTriangle className="h-4 w-4" />
					</span>
					<span className="min-w-0 flex-1">
						<span className="block text-[15px] font-semibold text-destructive">
							{menungguVerifikasi} laporan menunggu verifikasi
						</span>
						<span className="block text-[13px] text-destructive/80">Ketuk untuk meninjau antrean</span>
					</span>
					<IconChevronRight className="h-4 w-4 shrink-0 text-destructive/70" />
				</button>
			)}

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-2/5">
					<div className="flex flex-col gap-3">
						<div className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								enterKeyHint="search"
								placeholder="Cari judul, alamat, atau pelapor..."
								className="h-11 rounded-xl bg-card pl-9"
								value={params?.search ?? ''}
								onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
							/>
						</div>
						{/* Ponsel: satu baris chip yang digeser (bukan menumpuk 3 baris di atas daftar). */}
						<div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] lg:flex-wrap lg:overflow-visible [&::-webkit-scrollbar]:hidden">
							{statusOptions.map((status) => {
								const isActive = params?.status === status;
								const dot = STATUS_META[status]?.dot;
								return (
									<button
										key={status}
										type="button"
										onClick={() => setParams((prev) => ({ ...prev, status }))}
										className={cn(
											'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all',
											isActive
												? TEAL_ACCENT.pillActive
												: 'border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground',
										)}
									>
										{dot && (
											<span
												className={cn(
													'h-2 w-2 rounded-full transition-opacity',
													dot,
													isActive ? 'opacity-100' : 'opacity-60',
												)}
											/>
										)}
										{FILTER_LABEL[status] ?? status}
									</button>
								);
							})}
						</div>
					</div>

					{/* Daftar laporan. Desktop: kolom bergulir di samping peta. Ponsel: mengalir bersama
					    halaman (tanpa peta, tanpa gulir di dalam gulir) - TASK_69 bagian 15. */}
					<div className="flex flex-col gap-3 pb-4 lg:h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{reports.length > 0 ? (
							<>
								<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									{reports.map((report) => {
										const style = markerStyle(report.status);
										const isActive = activeReportId === report.id;
										const isUrgent = report.status === 'TERLAPOR'; // butuh verifikasi → tonjolkan
										const hasCoords =
											!isNaN(parseFloat(report.lat)) && !isNaN(parseFloat(report.lng));
										return (
											<div
												key={report.id}
												role="button"
												tabIndex={0}
												onClick={() => openReport(report)}
												onKeyDown={(e) =>
													(e.key === 'Enter' || e.key === ' ') &&
													(e.preventDefault(), openReport(report))
												}
												className={cn(
													'flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors active:bg-muted',
													isActive ? 'bg-primary/5' : 'hover:bg-muted/40',
												)}
											>
												<div
													className={cn(
														'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
														style.ring,
													)}
												>
													{isUrgent ? (
														<IconAlertTriangle className="h-5 w-5" />
													) : (
														<IconMapPin className="h-5 w-5" />
													)}
												</div>

												<div className="min-w-0 flex-1">
													{/* Judul utuh (tanpa potongan) + umur laporan di kanan, ala baris Mail iOS. */}
													<div className="flex items-start gap-3">
														<h3
															className={cn(
																'min-w-0 flex-1 break-words text-[15px] font-semibold leading-snug',
																isActive ? TEAL_ACCENT.title : 'text-foreground',
															)}
														>
															{report.title}
														</h3>
														<span
															title={formatDate(report.created_at)}
															className={cn(
																'shrink-0 pt-px text-[13px] leading-snug',
																isUrgent
																	? 'font-semibold text-destructive'
																	: 'text-muted-foreground',
															)}
														>
															{timeAgo(report.created_at)}
														</span>
													</div>
													<p className="mt-0.5 break-words text-[13px] leading-snug text-muted-foreground">
														<span className="font-mono font-semibold">
															{reportNumber(report)}
														</span>
														{' · '}
														{alamatLaporan(report) || '-'}
													</p>
													<p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] leading-snug text-muted-foreground">
														<span className="inline-flex items-center gap-1">
															<IconUser className="h-3.5 w-3.5 shrink-0" />
															{report.name ?? report.user?.name ?? '-'}
														</span>
														<span className="hidden items-center gap-1 sm:inline-flex">
															<IconPhone className="h-3.5 w-3.5 shrink-0" />
															{report.phone ?? '-'}
														</span>
														{/* Penutup insiden (FINDINGS #88). Hanya untuk laporan yang sudah
														    Selesai; laporan yang ditutup sebelum kolomnya ada memang tak
														    punya jejak pelaku — dikatakan apa adanya, bukan disamarkan. */}
														{report.status === 'resolved' && (
															<span className="inline-flex items-center gap-1">
																<IconCircleCheck className="h-3.5 w-3.5 shrink-0" />
																Ditutup oleh {report.resolver?.name ?? 'tidak tercatat'}
															</span>
														)}
													</p>

													{/* Lencana status + tanda triase (foto, titik, laporan ganda) di barisnya sendiri. */}
													<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
														<StatusBadge status={report.status} />
														{report.photo ? (
															<MetaChip icon={IconPhoto} tone="ok">
																Ada foto
															</MetaChip>
														) : (
															<MetaChip icon={IconPhoto} tone="muted">
																Tanpa foto
															</MetaChip>
														)}
														{!hasCoords && (
															<MetaChip icon={IconMapPin} tone="warn">
																Tanpa titik
															</MetaChip>
														)}
														{/* Laporan ganda (TASK_55). Usulan mesin, BUKAN keputusan: laporannya
														    tetap di antrean dan diputuskan admin di halaman detail. Jarak
														    dihitung server. */}
														{isUrgent && report.candidate_of && (
															<MetaChip icon={IconStack2} tone="warn">
																Kemungkinan sama dengan{' '}
																{reportNumber(report.candidate_of)}
																{report.candidate_distance_m != null &&
																	` · ±${report.candidate_distance_m} m`}
															</MetaChip>
														)}
														{report.merged_children_count > 0 && (
															<MetaChip icon={IconStack2} tone="muted">
																{report.merged_children_count} laporan terkait
															</MetaChip>
														)}
													</div>

													{isUrgent && canVerify ? (
														<div className="mt-3" onClick={(e) => e.stopPropagation()}>
															<Button
																size="sm"
																asChild
																className="h-9 w-full rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
															>
																<Link href={route('reports.show', report.id)}>
																	<IconEye className="mr-1 size-4" /> Tinjau &
																	Verifikasi
																</Link>
															</Button>
														</div>
													) : (
														<div
															className="mt-2 hidden justify-end lg:flex"
															onClick={(e) => e.stopPropagation()}
														>
															<Button
																variant="ghost"
																size="sm"
																asChild
																className="h-8 text-muted-foreground hover:text-primary"
															>
																<Link href={route('reports.show', report.id)}>
																	<IconEye className="mr-1 size-4" /> Detail
																</Link>
															</Button>
														</div>
													)}
												</div>

												{/* Ponsel: baris ini sendiri tautan ke detail - tanda panah ala iOS. */}
												<IconChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/50 lg:hidden" />
											</div>
										);
									})}
								</div>

								<div className="mt-4 flex flex-col items-center gap-3 pt-1">
									<span className="text-[11px] font-medium text-muted-foreground">
										Menampilkan {from ?? 0} - {to ?? 0} dari {total} laporan
									</span>

									{links && links.length > 3 && (
										<div className="flex flex-wrap justify-center gap-1">
											{links.map((link, index) =>
												link.url ? (
													<Link
														key={index}
														href={link.url}
														preserveScroll
														className={cn(
															'rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-colors',
															link.active
																? TEAL_ACCENT.pageActive
																: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
														)}
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												) : (
													<span
														key={index}
														className="cursor-not-allowed rounded-2xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												),
											)}
										</div>
									)}
								</div>
							</>
						) : (
							<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
								<AppEmpty
									icon={IconClipboardPlus}
									title="Tidak ada laporan yang ditemukan."
									description="Coba ubah kata kunci atau pilih status lain."
								/>
							</div>
						)}
					</div>
				</div>

				<div
					ref={mapContainerRef}
					className="hidden w-full flex-col lg:flex lg:h-[calc(100vh-140px)] lg:flex-1"
				>
					<div className="mb-3 flex items-center justify-between gap-2 px-1">
						<div className="flex items-center gap-2">
							<IconMapPinFilled className="h-4 w-4 text-muted-foreground" />
							<h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
								Peta sebaran
							</h2>
						</div>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
							{legendStatuses.map((status) => (
								<span key={status} className="flex items-center gap-1">
									<span
										className={cn('inline-block h-2 w-2 rounded-full', STATUS_META[status].dot)}
									/>{' '}
									{STATUS_META[status].label}
								</span>
							))}
						</div>
					</div>
					<div
						ref={mapRef}
						className="relative z-0 h-full w-full overflow-hidden rounded-2xl border border-border/70 bg-accent shadow-sm"
					></div>
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
