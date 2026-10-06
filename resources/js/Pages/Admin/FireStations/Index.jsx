import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { escapeHtml } from '@/lib/escape-html';
import { fitBoundsWhenSized } from '@/lib/leaflet-fit';
import { facilityStatusLabel, MAP_TILE_URL } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { IconEdit, IconFiretruck, IconMapPinFilled, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

export default function Index({ stations, filters, tenant_location }) {
	const [stationToDelete, setStationToDelete] = useState(null);
	const [activeStationId, setActiveStationId] = useState(null);

	const { data, setData, get } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
	});

	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const markersLayerRef = useRef(null);
	const mapContainerRef = useRef(null);

	useEffect(() => {
		if (!window.L || !mapRef.current) return;

		if (!mapInstanceRef.current) {
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

		if (stations.data && stations.data.length > 0) {
			stations.data.forEach((station) => {
				const lat = parseFloat(station.lat),
					lng = parseFloat(station.lng);
				if (!isNaN(lat) && !isNaN(lng)) {
					const iconColor = station.status === 'Aktif' ? 'text-info' : 'text-destructive';
					const customIcon = window.L.divIcon({
						html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
						className: 'bg-transparent border-none',
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					});
					const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
					marker.bindPopup(
						`<b>${escapeHtml(station.name)}</b><br><span class="text-xs text-muted-foreground">${escapeHtml(station.address)}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activeStationId)
				fitBoundsWhenSized(mapInstanceRef.current, bounds, { padding: [50, 50] });
		}
	}, [stations.data]);

	// Peta hanya tampil mulai lg (ponsel tanpa peta, TASK_69 bagian 15). Bila peta dibuat saat
	// tersembunyi lalu layar melebar, Leaflet perlu mengukur ulang wadahnya.
	useEffect(() => {
		if (!mapRef.current || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
		observer.observe(mapRef.current);
		return () => observer.disconnect();
	}, []);

	const focusToStation = (id, lat, lng) => {
		setActiveStationId(id);
		const parsedLat = parseFloat(lat),
			parsedLng = parseFloat(lng);
		if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
			mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('admin.fire-stations.index'), { preserveState: true, preserveScroll: true });
	};
	const applyStatusFilter = (val) => {
		setData('status', val);
		router.get(
			route('admin.fire-stations.index'),
			{ ...data, status: val },
			{ preserveState: true, preserveScroll: true },
		);
	};
	const confirmDelete = () => {
		if (stationToDelete)
			router.delete(route('admin.fire-stations.destroy', stationToDelete), {
				preserveScroll: true,
				onSuccess: () => setStationToDelete(null),
			});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen Pos Pemadam" />

			<AlertDialog open={!!stationToDelete} onOpenChange={(open) => !open && setStationToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus data aset ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Menghapus pos pemadam ini akan menghilangkan koordinatnya dari peta operasional secara
							permanen.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmDelete}
						>
							Hapus permanen
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen Pos Pemadam"
					subtitle="Kelola pos & markas armada pemadam di wilayah Anda."
					icon={IconFiretruck}
				/>
				<Button size="sm" className="h-10 rounded-full px-4" asChild>
					<Link href={route('admin.fire-stations.create')}>
						<IconPlus className="h-4 w-4" /> Tambah Pos
					</Link>
				</Button>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								enterKeyHint="search"
								placeholder="Cari nama atau alamat pos..."
								className="h-11 rounded-xl bg-card pl-9"
								value={data.search}
								onChange={(e) => setData('search', e.target.value)}
							/>
						</form>
						<div className="flex flex-wrap gap-2">
							{['Semua', 'Aktif', 'Perbaikan'].map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => applyStatusFilter(status)}
									className={`h-8 rounded-full border px-3 text-xs font-semibold transition-colors active:bg-muted ${
										data.status === status
											? 'border-primary/20 bg-primary/10 text-primary'
											: 'border-border/70 bg-card text-muted-foreground hover:text-foreground'
									}`}
								>
									{facilityStatusLabel(status)}
								</button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-3 pb-4 lg:h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{stations.data && stations.data.length > 0 ? (
							<>
								<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									{stations.data.map((station) => (
										<div
											role="button"
											tabIndex={0}
											key={station.id}
											onClick={() => focusToStation(station.id, station.lat, station.lng)}
											onKeyDown={(e) =>
												(e.key === 'Enter' || e.key === ' ') &&
												(e.preventDefault(),
												focusToStation(station.id, station.lat, station.lng))
											}
											className={`cursor-pointer transition-colors active:bg-muted ${activeStationId === station.id ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
										>
											<div className="flex flex-col gap-2 px-4 py-3.5">
												<div className="flex flex-row items-center gap-3">
													<div
														className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${station.status === 'Aktif' ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive'}`}
													>
														{station.status === 'Aktif' ? (
															<IconFiretruck className="h-5 w-5" />
														) : (
															<IconFiretruck className="h-5 w-5" />
														)}
													</div>
													<div className="w-full min-w-0 flex-1">
														<h3
															className={`break-words text-[15px] font-semibold leading-snug ${activeStationId === station.id ? 'text-primary' : 'text-foreground'}`}
														>
															{station.name}
														</h3>
														<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
															{station.type ? `${station.type} · ` : ''}
															{station.address}
														</p>
													</div>
													<div
														className="flex shrink-0 gap-1"
														onClick={(e) => e.stopPropagation()}
													>
														<Button
															variant="ghost"
															size="icon"
															asChild
															className="h-8 w-8 text-muted-foreground hover:text-info"
														>
															<Link href={route('admin.fire-stations.edit', station.id)}>
																<IconEdit className="h-4 w-4" />
															</Link>
														</Button>
														<Button
															variant="ghost"
															size="icon"
															onClick={() => setStationToDelete(station.id)}
															className="h-8 w-8 text-muted-foreground hover:text-destructive"
														>
															<IconTrash className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>

								<div className="mt-4 flex flex-col items-center gap-3 pt-1">
									<span className="text-xs font-medium text-muted-foreground">
										Menampilkan {stations.from} - {stations.to} dari {stations.total} aset
									</span>

									<PaginationLinks links={stations.links} />
								</div>
							</>
						) : (
							<div className="rounded-2xl border border-border/70 bg-card p-10 text-center">
								<span className="text-sm text-muted-foreground">Tidak ada data ditemukan.</span>
							</div>
						)}
					</div>
				</div>

				<div
					ref={mapContainerRef}
					className="hidden w-full flex-col lg:flex lg:h-[calc(100vh-140px)] lg:flex-1"
				>
					<div className="mb-2 flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-muted-foreground" />
						<h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
							Peta sebaran
						</h2>
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen Pos Pemadam" />;
