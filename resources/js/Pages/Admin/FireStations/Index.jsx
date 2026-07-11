import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { MAP_TILE_URL } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconArrowDown,
	IconEdit,
	IconFiretruck,
	IconMapPinFilled,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
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
					const iconColor =
						station.status === 'Aktif'
							? 'text-info'
							: 'text-destructive';
					const customIcon = window.L.divIcon({
						html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
						className: 'bg-transparent border-none',
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					});
					const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
					marker.bindPopup(
						`<b>${station.name}</b><br><span class="text-xs text-muted-foreground">${station.address}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activeStationId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [stations.data]);

	const focusToStation = (id, lat, lng) => {
		setActiveStationId(id);
		const parsedLat = parseFloat(lat),
			parsedLng = parseFloat(lng);
		if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
			mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
			if (window.innerWidth < 1024 && mapContainerRef.current) {
				mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
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

			{stationToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
						<div className="flex items-center gap-3 text-destructive">
							<IconAlertTriangle className="h-6 w-6" />{' '}
							<h3 className="text-lg font-bold">Hapus Data Aset?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Menghapus pos pemadam ini akan menghilangkan koordinatnya dari peta operasional secara
							permanen.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setStationToDelete(null)}>
								Batal
							</Button>
							<Button
								className="bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90"
								onClick={confirmDelete}
							>
								Hapus Permanen
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen Pos Pemadam"
					subtitle="Kelola pos & markas armada pemadam di wilayah Anda."
					icon={IconFiretruck}
				/>
				<Button
					size="sm"
					className="border-none bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90"
					asChild
				>
					<Link href={route('admin.fire-stations.create')}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Pos
					</Link>
				</Button>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Cari nama atau alamat pos..."
								className="h-10 pl-9 focus-visible:ring-destructive"
								value={data.search}
								onChange={(e) => setData('search', e.target.value)}
							/>
						</form>
						<div className="flex gap-2">
							{['Semua', 'Aktif', 'Perbaikan'].map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => applyStatusFilter(status)}
									className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
										data.status === status
											? 'border-destructive/30 bg-destructive/10 text-destructive'
											: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
									}`}
								>
									{status === 'Aktif' ? 'Aktif' : status === 'Perbaikan' ? 'Perbaikan' : 'Semua'}
								</button>
							))}
						</div>
					</div>

					<div className="flex h-[500px] flex-col gap-3 overflow-y-auto pb-4 pr-1 lg:h-[calc(100vh-240px)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{stations.data && stations.data.length > 0 ? (
							<>
								{stations.data.map((station) => (
									<Card
										key={station.id}
										onClick={() => focusToStation(station.id, station.lat, station.lng)}
										className={`cursor-pointer transition-colors ${activeStationId === station.id ? 'border-destructive bg-destructive/5' : 'hover:border-destructive/50'}`}
									>
										<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
											<div className="flex flex-row items-center gap-3">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${station.status === 'Aktif' ? 'bg-info/10 text-info' : 'bg-destructive/10 text-destructive'}`}
												>
													{station.status === 'Aktif' ? (
														<IconFiretruck className="h-5 w-5" />
													) : (
														<IconFiretruck className="h-5 w-5" />
													)}
												</div>
												<div className="w-full min-w-0 flex-1">
													<h3
														className={`truncate text-sm font-semibold ${activeStationId === station.id ? 'text-destructive' : 'text-foreground'}`}
													>
														{station.name}
													</h3>
													<p className="mt-0.5 truncate text-xs text-muted-foreground">
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
											<div className="mt-1 flex items-center justify-center gap-1 rounded-md bg-destructive/10 py-1.5 text-[10px] font-bold text-destructive lg:hidden">
												<IconArrowDown className="h-3 w-3" /> Lihat Peta Lokasi
											</div>
										</CardContent>
									</Card>
								))}

								<div className="mt-4 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
									<span className="text-[11px] font-medium text-muted-foreground">
										Menampilkan {stations.from} - {stations.to} dari {stations.total} aset
									</span>

									{stations.links && stations.links.length > 3 && (
										<div className="flex flex-wrap justify-center gap-1">
											{stations.links.map((link, index) =>
												link.url ? (
													<Link
														key={index}
														href={link.url}
														preserveScroll
														className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
															link.active
																? 'border-destructive bg-destructive text-destructive-foreground shadow-sm'
																: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
														}`}
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
								<span className="text-sm text-muted-foreground">Tidak ada data ditemukan.</span>
							</div>
						)}
					</div>
				</div>

				<div
					ref={mapContainerRef}
					className="flex h-[450px] w-full scroll-mt-24 flex-col lg:h-[calc(100vh-140px)] lg:flex-1"
				>
					<div className="mb-3 flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-destructive" />
						<h2 className="text-sm font-semibold text-foreground">Peta Sebaran Interaktif</h2>
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen Pos Pemadam" />;
