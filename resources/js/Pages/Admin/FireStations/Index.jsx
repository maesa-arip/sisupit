import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconArrowDown,
	IconBuildingWarehouse,
	IconEdit,
	IconFiretruck,
	IconMapPinFilled,
	IconPlus,
	IconSearch,
	IconTool,
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
			window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
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
					const iconColor = station.status === 'Aktif' ? 'text-teal-600 dark:text-teal' : 'text-amber-500 dark:text-warning';
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
		router.get(route('admin.fire-stations.index'), { ...data, status: val }, { preserveState: true, preserveScroll: true });
	};
	const confirmDelete = () => {
		if (stationToDelete)
			router.delete(route('admin.fire-stations.destroy', stationToDelete), {
				preserveScroll: true,
				onSuccess: () => setStationToDelete(null),
			});
	};

	return (
		<div className="flex flex-col w-full h-full space-y-6">
			<Head title="Manajemen Pos Pemadam" />

			{stationToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md p-6 border shadow-xl rounded-2xl bg-background">
						<div className="flex items-center gap-3 text-red-500 dark:text-destructive">
							<IconAlertTriangle className="w-6 h-6" /> <h3 className="text-lg font-bold">Hapus Data Aset?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Menghapus pos pemadam ini akan menghilangkan koordinatnya dari peta operasional secara permanen.
						</p>
						<div className="flex justify-end gap-3 mt-6">
							<Button variant="ghost" onClick={() => setStationToDelete(null)}>
								Batal
							</Button>
							<Button
								className="text-white bg-red-600 dark:bg-destructive shadow-none hover:bg-red-700 dark:hover:bg-destructive/90"
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
				<Button size="sm" className="text-white bg-teal-600 dark:bg-teal border-none shadow-none hover:bg-teal-700 dark:hover:bg-teal/90" asChild>
					<Link href={route('admin.fire-stations.create')}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Pos
					</Link>
				</Button>
			</div>

			<div className="flex flex-col items-start w-full gap-5 lg:flex-row lg:gap-6">
				<div className="flex flex-col w-full gap-4 shrink-0 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Cari nama atau alamat pos..."
								className="h-10 pl-9 focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
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
											? 'border-teal-200 dark:border-teal/30 bg-teal-50 dark:bg-teal/10 text-teal-700 dark:text-teal'
											: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
									}`}
								>
									{status === 'Aktif' ? 'Beroperasi' : status === 'Perbaikan' ? 'Perbaikan' : 'Semua'}
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
										className={`cursor-pointer transition-colors ${activeStationId === station.id ? 'border-teal-500 dark:border-teal bg-teal-50/50 dark:bg-teal/5' : 'hover:border-teal-300 dark:hover:border-teal/50'}`}
									>
										<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
											<div className="flex flex-row items-center gap-3">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${station.status === 'Aktif' ? 'bg-teal-100 dark:bg-teal/10 text-teal-600 dark:text-teal' : 'bg-amber-100 dark:bg-warning/10 text-amber-600 dark:text-warning'}`}
												>
													{station.status === 'Aktif' ? (
														<IconBuildingWarehouse className="w-5 h-5" />
													) : (
														<IconTool className="w-5 h-5" />
													)}
												</div>
												<div className="flex-1 w-full min-w-0">
													<h3
														className={`truncate text-sm font-semibold ${activeStationId === station.id ? 'text-teal-700 dark:text-teal' : 'text-foreground'}`}
													>
														{station.name}
													</h3>
													<p className="mt-0.5 truncate text-xs text-muted-foreground">
														{station.type ? `${station.type} · ` : ''}
														{station.address}
													</p>
												</div>
												<div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
													<Button
														variant="ghost"
														size="icon"
														asChild
														className="w-8 h-8 text-muted-foreground hover:text-blue-500 dark:hover:text-info"
													>
														<Link href={route('admin.fire-stations.edit', station.id)}>
															<IconEdit className="w-4 h-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setStationToDelete(station.id)}
														className="w-8 h-8 text-muted-foreground hover:text-red-500 dark:hover:text-destructive"
													>
														<IconTrash className="w-4 h-4" />
													</Button>
												</div>
											</div>
											<div className="mt-1 flex items-center justify-center gap-1 rounded-md bg-teal-50 dark:bg-teal/10 py-1.5 text-[10px] font-bold text-teal-600 dark:text-teal lg:hidden">
												<IconArrowDown className="w-3 h-3" /> Lihat Peta Lokasi
											</div>
										</CardContent>
									</Card>
								))}

								<div className="flex flex-col items-center gap-3 pt-4 mt-4 border-t border-dashed border-border">
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
																? 'border-teal-600 bg-teal-600 dark:border-teal dark:bg-teal text-white shadow-sm'
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
							<div className="p-10 text-center border border-dashed rounded-xl border-input">
								<span className="text-sm text-muted-foreground">Tidak ada data ditemukan.</span>
							</div>
						)}
					</div>
				</div>

				<div
					ref={mapContainerRef}
					className="flex h-[450px] w-full scroll-mt-24 flex-col lg:h-[calc(100vh-140px)] lg:flex-1"
				>
					<div className="flex items-center gap-2 px-1 mb-3">
						<IconMapPinFilled className="w-4 h-4 text-teal-600 dark:text-teal" />
						<h2 className="text-sm font-semibold text-foreground">Peta Sebaran Interaktif</h2>
					</div>
					<div
						ref={mapRef}
						className="relative z-0 w-full h-full overflow-hidden border rounded-2xl bg-accent"
					></div>
				</div>
			</div>
		</div>
	);
}
Index.layout = (page) => <AppLayout children={page} title="Manajemen Pos Pemadam" />;
