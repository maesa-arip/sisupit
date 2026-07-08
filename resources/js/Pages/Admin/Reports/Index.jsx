import HeaderTitle from '@/Components/HeaderTitle';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { cn, MAP_TILE_URL } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
	IconArrowDown,
	IconClipboardPlus,
	IconClock,
	IconEye,
	IconFileSpreadsheet,
	IconMapPin,
	IconMapPinFilled,
	IconPhone,
	IconSearch,
	IconUser,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

const STATUS_OPTIONS = ['Semua', 'TERLAPOR', 'pending', 'handling', 'resolved'];

// Metadata status kejadian (badge + pin peta + titik legenda). Warna selaras Peta Pemantauan,
// KECUALI "Penanganan" yang memakai teal (permintaan produk). Gaya kartu/pill/paginasi
// mengikuti halaman Hydrant (Admin/Hydrants/Index.jsx): tetap pakai border, aksen seleksi teal.
const TEAL_ACCENT = {
	cardActive: 'border-teal-500 bg-teal-50/50 dark:border-teal dark:bg-teal/5',
	cardHover: 'hover:border-teal-300 dark:hover:border-teal/50',
	title: 'text-teal-700 dark:text-teal',
	pillActive: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal',
	pageActive: 'border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal dark:bg-teal',
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
		badge: 'bg-info/10 text-blue-600 border-info/30 dark:text-info',
		pin: 'text-blue-600 dark:text-info',
		dot: 'bg-blue-600 dark:bg-info',
		ring: 'bg-info/10 text-blue-600 dark:text-info',
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
};

const markerStyle = (status) => STATUS_META[status] || STATUS_META.pending;

function StatusBadge({ status }) {
	const active = STATUS_META[status] || STATUS_META.pending;
	return (
		<Badge
			variant="outline"
			className={cn('whitespace-nowrap rounded-md px-2 py-0.5 font-bold shadow-none', active.badge)}
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

export default function Index(props) {
	const { data: reports, links, from, to, total } = props.reports;
	const { tenant_location } = props;
	const [params, setParams] = useState(props.state);
	const [activeReportId, setActiveReportId] = useState(null);

	UseFilter({
		route: route('admin.reports.index'),
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
						`<b>${report.title ?? 'Laporan'}</b><br><span class="text-xs text-muted-foreground">${report.address ?? '-'}</span>`,
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
			if (window.innerWidth < 1024 && mapContainerRef.current) {
				mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
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
				<Button variant="outline" size="sm" asChild>
					<a href={route('admin.reports.export', { search: params?.search, status: params?.status })}>
						<IconFileSpreadsheet className="size-4" /> Export Excel
					</a>
				</Button>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-2/5">
					<div className="flex flex-col gap-3">
						<div className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Cari judul, alamat, atau pelapor..."
								className="h-10 pl-9 focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
								value={params?.search ?? ''}
								onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
							/>
						</div>
						<div className="flex flex-wrap gap-1.5">
							{STATUS_OPTIONS.map((status) => {
								const isActive = params?.status === status;
								const dot = STATUS_META[status]?.dot;
								return (
									<button
										key={status}
										type="button"
										onClick={() => setParams((prev) => ({ ...prev, status }))}
										className={cn(
											'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
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

					{/* Area Scroll Daftar Laporan */}
					<div className="flex h-[500px] flex-col gap-3 overflow-y-auto pb-4 pr-1 lg:h-[calc(100vh-240px)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{reports.length > 0 ? (
							<>
								{reports.map((report) => {
									const style = markerStyle(report.status);
									const isActive = activeReportId === report.id;
									const hasCoords = !isNaN(parseFloat(report.lat)) && !isNaN(parseFloat(report.lng));
									return (
										<Card
											key={report.id}
											onClick={() => focusToReport(report.id, report.lat, report.lng)}
											className={cn(
												'cursor-pointer transition-colors',
												isActive ? TEAL_ACCENT.cardActive : TEAL_ACCENT.cardHover,
											)}
										>
											<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
												<div className="flex flex-row items-start gap-3">
													<div
														className={cn(
															'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
															style.ring,
														)}
													>
														<IconMapPin className="h-5 w-5" />
													</div>
													<div className="w-full min-w-0 flex-1">
														<div className="flex items-start justify-between gap-2">
															<h3
																className={cn(
																	'truncate text-sm font-semibold',
																	isActive ? TEAL_ACCENT.title : 'text-foreground',
																)}
															>
																{report.title}
															</h3>
															<StatusBadge status={report.status} />
														</div>
														<p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
															<IconMapPin className="mt-0.5 h-3 w-3 shrink-0" />
															<span className="line-clamp-2">
																{report.address ?? '-'}
															</span>
														</p>
													</div>
												</div>

												<div className="grid grid-cols-1 gap-1.5 border-t border-dashed border-border pt-2.5 text-xs text-muted-foreground sm:grid-cols-2">
													<span className="flex items-center gap-1.5 truncate">
														<IconUser className="h-3.5 w-3.5 shrink-0" />
														{report.name ?? report.user?.name ?? '-'}
													</span>
													<span className="flex items-center gap-1.5 truncate">
														<IconPhone className="h-3.5 w-3.5 shrink-0" />
														{report.phone ?? '-'}
													</span>
													<span className="flex items-center gap-1.5 truncate sm:col-span-2">
														<IconClock className="h-3.5 w-3.5 shrink-0" />
														{formatDate(report.created_at)}
													</span>
												</div>

												<div
													className="flex items-center justify-end gap-2"
													onClick={(e) => e.stopPropagation()}
												>
													{!hasCoords && (
														<span className="mr-auto text-[10px] font-semibold text-muted-foreground">
															Tanpa koordinat
														</span>
													)}
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

												{hasCoords && (
													<div className="flex items-center justify-center gap-1 rounded-md bg-teal-50 py-1.5 text-[10px] font-bold text-teal-600 dark:bg-teal/10 dark:text-teal lg:hidden">
														<IconArrowDown className="h-3 w-3" /> Lihat Peta Lokasi
													</div>
												)}
											</CardContent>
										</Card>
									);
								})}

								<div className="mt-4 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
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
															'rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors',
															link.active
																? TEAL_ACCENT.pageActive
																: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
														)}
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												) : (
													<span
														key={index}
														className="cursor-not-allowed rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												),
											)}
										</div>
									)}
								</div>
							</>
						) : (
							<div className="rounded-xl border border-dashed border-input p-10 text-center">
								<span className="text-sm text-muted-foreground">Tidak ada laporan yang ditemukan.</span>
							</div>
						)}
					</div>
				</div>

				<div
					ref={mapContainerRef}
					className="flex h-[450px] w-full scroll-mt-24 flex-col lg:h-[calc(100vh-140px)] lg:flex-1"
				>
					<div className="mb-3 flex items-center justify-between gap-2 px-1">
						<div className="flex items-center gap-2">
							<IconMapPinFilled className="h-4 w-4 text-primary" />
							<h2 className="text-sm font-semibold text-foreground">Peta Sebaran Laporan</h2>
						</div>
						<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-muted-foreground">
							{['TERLAPOR', 'pending', 'handling', 'resolved'].map((status) => (
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
						className="relative z-0 h-full w-full overflow-hidden rounded-2xl border bg-accent"
					></div>
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
