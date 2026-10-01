import HeaderTitle from '@/Components/HeaderTitle';
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
import { debitLabel, facilityStatusIsFaulty, facilityStatusLabel, MAP_TILE_URL, waterPressureLabel } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { IconDroplet, IconEdit, IconMapPinFilled, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react';
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
						`<b>${escapeHtml(pump.name)}</b><br><span class="text-xs text-muted-foreground">${escapeHtml(pump.address)}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activePumpId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [pumps.data]);

	// Peta hanya tampil mulai lg (ponsel tanpa peta, TASK_69 bagian 15). Bila peta dibuat saat
	// tersembunyi lalu layar melebar, Leaflet perlu mengukur ulang wadahnya.
	useEffect(() => {
		if (!mapRef.current || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
		observer.observe(mapRef.current);
		return () => observer.disconnect();
	}, []);

	const focusToPump = (key, lat, lng) => {
		setActivePumpId(key);
		const parsedLat = parseFloat(lat),
			parsedLng = parseFloat(lng);
		if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
			mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
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

			<AlertDialog open={!!pumpToDelete} onOpenChange={(open) => !open && setPumpToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus data aset ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Menghapus aset SKKL ini akan menghilangkan koordinatnya dari peta operasional secara
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
					title="Manajemen SKKL"
					subtitle="Sistem Ketahanan Kebakaran Lingkungan: pompa, aset air, & hydrant swadaya warga."
					icon={IconDroplet}
				/>
				<div className="flex flex-wrap gap-2">
					{/* Hydrant warga didata di menunya sendiri (tab di /admin/hydrants) tapi
					    dibaca di sini — jadi jalan pintasnya disediakan di tempat orang mencarinya. */}
					<Button size="sm" variant="outline" className="h-10 rounded-full px-4" asChild>
						<Link href={route('admin.hydrant-warga.create')}>
							<IconPlus className="h-4 w-4" /> Hydrant Warga
						</Link>
					</Button>
					<Button size="sm" className="h-10 rounded-full px-4" asChild>
						<Link href={route('admin.pumps.create')}>
							<IconPlus className="h-4 w-4" /> Tambah Aset SKKL
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
								type="search"
								enterKeyHint="search"
								placeholder="Cari nama atau lokasi aset..."
								className="h-11 rounded-xl bg-card pl-9"
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
						{pumps.data && pumps.data.length > 0 ? (
							<>
								<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									{pumps.data.map((pump) => (
										<div
											role="button"
											tabIndex={0}
											key={rowKey(pump)}
											onClick={() => focusToPump(rowKey(pump), pump.lat, pump.lng)}
											onKeyDown={(e) =>
												(e.key === 'Enter' || e.key === ' ') &&
												(e.preventDefault(), focusToPump(rowKey(pump), pump.lat, pump.lng))
											}
											className={`cursor-pointer transition-colors active:bg-muted ${activePumpId === rowKey(pump) ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
										>
											<div className="flex flex-col gap-2 px-4 py-3.5">
												<div className="flex flex-row items-center gap-3">
													<div
														className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${facilityStatusIsFaulty(pump.status) ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}
													>
														<IconDroplet className="h-5 w-5" />
													</div>
													<div className="w-full min-w-0 flex-1">
														<h3
															className={`truncate text-sm font-semibold ${activePumpId === rowKey(pump) ? 'text-primary' : 'text-foreground'}`}
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
											</div>
										</div>
									))}
								</div>

								<div className="mt-4 flex flex-col items-center gap-3 pt-1">
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
														className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
															link.active
																? 'border-primary bg-primary text-primary-foreground shadow-sm'
																: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
														}`}
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												) : (
													<span
														key={index}
														className="cursor-not-allowed rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
														dangerouslySetInnerHTML={{ __html: link.label }}
													/>
												),
											)}
										</div>
									)}
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen SKKL" />;
