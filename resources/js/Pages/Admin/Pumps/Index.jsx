import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { debitLabel, facilityStatusIsFaulty, facilityStatusLabel, MAP_TILE_URL, waterPressureLabel } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconArrowDown,
	IconDroplet,
	IconEdit,
	IconMapPinFilled,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Manajemen SKKL (Sistem Ketahanan Kebakaran Lingkungan) — ASET POMPA saja.
 *
 * Sampai 2026-08-26 daftar ini menggabungkan dua sumber (aset pompa + hydrant warga, TASK_30).
 * Atas permintaan user hydrant warga dikeluarkan dari menu admin ini dan sepenuhnya hidup di
 * menu Hydrant Warga, berikut rekap airnya. Ikut hilang sebagai konsekuensinya: kolom kapasitas
 * (liter — hanya dimiliki hydrant warga) dan dua chip status "Belum/Sudah Modifikasi".
 *
 * Pemisahan ini HANYA di menu admin: halaman publik `/pumps` dan layer SKKL di Peta Pemantauan
 * TETAP menggabungkan keduanya, karena bagi warga & operator lapangan "SKKL" berarti seluruh
 * sumber air lingkungan. Karena itu `Pages/Pumps/Index.jsx` (publik) masih memuat keempat chip
 * status — jangan "seragamkan" dengan berkas ini.
 *
 * `rowKey` tetap memakai `source-id` walau sumbernya tinggal satu: bentuk baris `toSkklRow()`
 * masih kembar dengan hydrant warga demi halaman publik, dan kunci gabungan tetap benar.
 */
const rowKey = (row) => `${row.source}-${row.id}`;

/** Chip filter status aset pompa. Kosakata "Belum/Sudah Modifikasi" milik hydrant warga. */
const STATUS_FILTERS = ['Semua', 'Aktif', 'Perbaikan'];

export default function Index({ pumps, filters, tenant_location }) {
	const [pumpToDelete, setPumpToDelete] = useState(null);
	const [activePumpId, setActivePumpId] = useState(null);

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

		if (pumps.data && pumps.data.length > 0) {
			pumps.data.forEach((pump) => {
				const lat = parseFloat(pump.lat),
					lng = parseFloat(pump.lng);
				if (!isNaN(lat) && !isNaN(lng)) {
					const iconColor = facilityStatusIsFaulty(pump.status) ? 'text-destructive' : 'text-info';
					const customIcon = window.L.divIcon({
						html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
						className: 'bg-transparent border-none',
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					});
					const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
					marker.bindPopup(
						`<b>${pump.name}</b><br><span class="text-xs text-muted-foreground">${pump.address}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activePumpId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [pumps.data]);

	const focusToPump = (key, lat, lng) => {
		setActivePumpId(key);
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
		get(route('admin.pumps.index'), { preserveState: true, preserveScroll: true });
	};
	const applyStatusFilter = (val) => {
		setData('status', val);
		router.get(route('admin.pumps.index'), { ...data, status: val }, { preserveState: true, preserveScroll: true });
	};
	const confirmDelete = () => {
		if (!pumpToDelete) return;

		router.delete(route('admin.pumps.destroy', pumpToDelete.id), {
			preserveScroll: true,
			onSuccess: () => setPumpToDelete(null),
		});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen SKKL" />

			{pumpToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
						<div className="flex items-center gap-3 text-destructive">
							<IconAlertTriangle className="h-6 w-6" />{' '}
							<h3 className="text-lg font-bold">Hapus Data Aset?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Menghapus aset SKKL ini akan menghilangkan koordinatnya dari peta operasional secara
							permanen.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setPumpToDelete(null)}>
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
					title="Manajemen SKKL"
					subtitle="Sistem Ketahanan Kebakaran Lingkungan: pompa, aset air, & hydrant swadaya warga."
					icon={IconDroplet}
				/>
				<div className="flex flex-wrap gap-2">
					{/* Hydrant warga didata di menunya sendiri (tab di /admin/hydrants) tapi
					    dibaca di sini — jadi jalan pintasnya disediakan di tempat orang mencarinya. */}
					<Button size="sm" variant="secondary" asChild>
						<Link href={route('admin.hydrant-warga.create')}>
							<IconPlus className="mr-1.5 h-4 w-4" /> Hydrant Warga
						</Link>
					</Button>
					<Button
						size="sm"
						className="border-none bg-info text-info-foreground shadow-none hover:bg-info/90"
						asChild
					>
						<Link href={route('admin.pumps.create')}>
							<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Aset SKKL
						</Link>
					</Button>
				</div>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Cari nama atau lokasi aset..."
								className="h-10 pl-9 focus-visible:ring-info"
								value={data.search}
								onChange={(e) => setData('search', e.target.value)}
							/>
						</form>
						{/* Dua kosakata status hidup berdampingan di daftar gabungan ini: aset pompa
						    memakai Berfungsi/Tidak Berfungsi, hydrant warga memakai Terdaftar Belum/
						    Sudah Dimodifikasi (2026-08-21). Keempatnya WAJIB tersedia sebagai chip —
						    tanpa itu memilih "Berfungsi" membuang seluruh hydrant warga dari daftar
						    tanpa gejala apa pun, karena filter status berjalan di level query. */}
						<div className="flex flex-wrap gap-2">
							{STATUS_FILTERS.map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => applyStatusFilter(status)}
									className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
										data.status === status
											? 'border-info/30 bg-info/10 text-info'
											: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
									}`}
								>
									{facilityStatusLabel(status)}
								</button>
							))}
						</div>
					</div>

					<div className="flex h-[500px] flex-col gap-3 overflow-y-auto pb-4 pr-1 lg:h-[calc(100vh-240px)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{pumps.data && pumps.data.length > 0 ? (
							<>
								{pumps.data.map((pump) => (
									<Card
										key={rowKey(pump)}
										onClick={() => focusToPump(rowKey(pump), pump.lat, pump.lng)}
										className={`cursor-pointer transition-colors ${activePumpId === rowKey(pump) ? 'border-info bg-info/5' : 'hover:border-info/50'}`}
									>
										<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
											<div className="flex flex-row items-center gap-3">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${facilityStatusIsFaulty(pump.status) ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}
												>
													<IconDroplet className="h-5 w-5" />
												</div>
												<div className="w-full min-w-0 flex-1">
													<h3
														className={`truncate text-sm font-semibold ${activePumpId === rowKey(pump) ? 'text-info' : 'text-foreground'}`}
													>
														{pump.name}
													</h3>
													<p className="mt-0.5 truncate text-xs text-muted-foreground">
														{pump.type ? `${pump.type} · ` : ''}
														{pump.address}
													</p>
													<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
														{[
															facilityStatusLabel(pump.status),
															waterPressureLabel(pump.water_pressure),
															debitLabel(pump.debit_lpm),
														]
															.filter(Boolean)
															.join(' · ')}
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
														<Link href={route('admin.pumps.edit', pump.id)}>
															<IconEdit className="h-4 w-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setPumpToDelete(pump)}
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
													>
														<IconTrash className="h-4 w-4" />
													</Button>
												</div>
											</div>
											<div className="mt-1 flex items-center justify-center gap-1 rounded-md bg-info/10 py-1.5 text-[10px] font-bold text-info lg:hidden">
												<IconArrowDown className="h-3 w-3" /> Lihat Peta Lokasi
											</div>
										</CardContent>
									</Card>
								))}

								<div className="mt-4 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
									<span className="text-[11px] font-medium text-muted-foreground">
										Menampilkan {pumps.from} - {pumps.to} dari {pumps.total} aset
									</span>

									{pumps.links && pumps.links.length > 3 && (
										<div className="flex flex-wrap justify-center gap-1">
											{pumps.links.map((link, index) =>
												link.url ? (
													<Link
														key={index}
														href={link.url}
														preserveScroll
														className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
															link.active
																? 'border-info bg-info text-info-foreground shadow-sm'
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
						<IconMapPinFilled className="h-4 w-4 text-info" />
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen SKKL" />;
