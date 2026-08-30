import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import {
	capacityLabel,
	debitLabel,
	facilityStatusIsFaulty,
	facilityStatusLabel,
	MAP_TILE_URL,
	waterPressureLabel,
} from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconArrowDown,
	IconDroplet,
	IconEdit,
	IconFireHydrant,
	IconMapPinFilled,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { HydrantTabs, hydrantVariant, tenantWilayah } from './variants';

export default function Index({ variant = 'resmi', counts = {}, hydrants, summary = [], filters, tenant_location }) {
	const v = hydrantVariant(variant);
	// Keterangan hydrant resmi menyebut pemiliknya, jadi nama wilayahnya ikut tenant yang
	// sedang dibuka — bukan dipaku "Kota Denpasar" yang akan terbaca juga oleh admin Badung.
	const wilayah = tenantWilayah(usePage().props.tenant?.nama_instansi);
	const [hydrantToDelete, setHydrantToDelete] = useState(null);
	const [activeHydrantId, setActiveHydrantId] = useState(null);

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
			// Peta akan selalu berpusat di wilayah admin masing-masing
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

		if (hydrants.data && hydrants.data.length > 0) {
			hydrants.data.forEach((hydrant) => {
				const lat = parseFloat(hydrant.lat),
					lng = parseFloat(hydrant.lng);
				if (!isNaN(lat) && !isNaN(lng)) {
					const iconColor = facilityStatusIsFaulty(hydrant.status) ? 'text-destructive' : 'text-info';
					const customIcon = window.L.divIcon({
						html: `<div class="${iconColor} drop-shadow-md hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M18.364 17.364L12 23.728l-6.364-6.364a9 9 0 1 1 12.728 0zM12 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" /></svg></div>`,
						className: 'bg-transparent border-none',
						iconSize: [32, 32],
						iconAnchor: [16, 32],
					});
					const marker = window.L.marker([lat, lng], { icon: customIcon }).addTo(markersLayerRef.current);
					marker.bindPopup(
						`<b>${hydrant.name}</b><br><span class="text-xs text-muted-foreground">${hydrant.address}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activeHydrantId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [hydrants.data]);

	const focusToHydrant = (id, lat, lng) => {
		setActiveHydrantId(id);
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
		get(route(v.routes.index), { preserveState: true, preserveScroll: true });
	};
	const applyStatusFilter = (val) => {
		setData('status', val);
		router.get(route(v.routes.index), { ...data, status: val }, { preserveState: true, preserveScroll: true });
	};
	const confirmDelete = () => {
		if (hydrantToDelete)
			router.delete(route(v.routes.destroy, hydrantToDelete), {
				preserveScroll: true,
				onSuccess: () => setHydrantToDelete(null),
			});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title={v.head} />

			{hydrantToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
						<div className="flex items-center gap-3 text-destructive">
							<IconAlertTriangle className="h-6 w-6" />{' '}
							<h3 className="text-lg font-bold">Hapus Data Aset?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							Menghapus hydrant ini akan menghilangkan koordinatnya dari peta operasional secara permanen.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setHydrantToDelete(null)}>
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
				<HeaderTitle title={v.title} subtitle={v.subtitle({ wilayah })} icon={IconFireHydrant} />
				<Button
					size="sm"
					className="border-none bg-teal-600 text-white shadow-none hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90"
					asChild
				>
					<Link href={route(v.routes.create)}>
						<IconPlus className="mr-1.5 h-4 w-4" /> {v.addLabel}
					</Link>
				</Button>
			</div>

			<HydrantTabs active={variant} counts={counts} />

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Cari nama area atau jalan..."
								className="h-10 pl-9 focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
								value={data.search}
								onChange={(e) => setData('search', e.target.value)}
							/>
						</form>
						{/* `flex-wrap` WAJIB, dan itulah bedanya dengan bentuk sebelumnya: kosakata
						    statusnya beda per jenis hydrant (lihat ./variants.jsx) — resmi Berfungsi/Tidak
						    Berfungsi, warga Terdaftar Belum/Sudah Dimodifikasi. Label warga hampir tiga kali
						    lebih panjang sementara kolom ini cuma ~1/3 layar, jadi tanpa wrap ketiga chip
						    dipaksa berdesakan dalam satu baris: teksnya patah di tengah pill dan barisnya
						    melewati lebar kolom. Bentuk ini menyalin /admin/pumps, yang memang sudah
						    menghadapi keempat kosakata itu sekaligus. */}
						<div className="flex flex-wrap gap-2">
							{['Semua', ...v.statusOptions].map((status) => (
								<button
									key={status}
									type="button"
									onClick={() => applyStatusFilter(status)}
									className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
										data.status === status
											? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal'
											: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
									}`}
								>
									{facilityStatusLabel(status)}
								</button>
							))}
						</div>
					</div>

					{/* Rekap kapasitas air per desa — PINDAH dari daftar SKKL 2026-08-26 (permintaan
					    user) dan kini menjumlahkan hydrant warga SAJA. Kartunya muncul karena
					    controller mengirim `summary`, BUKAN karena komponen ini memeriksa
					    `variant === 'warga'` — hydrant resmi tak punya angka kapasitas, jadi
					    halamannya cukup tidak mengirim propnya. Ikut filter & pencarian aktif. */}
					{summary.length > 0 && (
						<Card className="border-teal-200 bg-teal-50/60 shadow-none dark:border-teal/20 dark:bg-teal/5">
							<CardContent className="p-3 sm:p-4">
								<div className="mb-2 flex items-center gap-1.5">
									<IconDroplet className="h-4 w-4 text-teal-700 dark:text-teal" />
									<h3 className="text-xs font-bold uppercase tracking-wide text-teal-700 dark:text-teal">
										Ringkasan Air Desa
									</h3>
								</div>
								<div className="flex flex-col gap-1.5">
									{summary.map((row) => (
										<div
											key={row.village_code ?? 'tanpa-desa'}
											className="flex items-baseline justify-between gap-2 text-xs"
										>
											<span className="truncate font-medium text-foreground">
												{row.village}
												<span className="ml-1 font-normal text-muted-foreground">
													({row.points} titik)
												</span>
											</span>
											<span className="shrink-0 font-semibold text-foreground">
												{/* "0 liter" akan terbaca sebagai fakta, padahal artinya
												    belum ada satu pun titik yang mengisi angkanya. */}
												{row.capacity_liter > 0 ? capacityLabel(row.capacity_liter) : '—'}
											</span>
										</div>
									))}
								</div>
								{summary.some((row) => row.unknown_capacity > 0) && (
									<p className="mt-2 border-t border-teal-200 pt-2 text-[11px] leading-relaxed text-muted-foreground dark:border-teal/20">
										Sebagian titik belum mengisi kapasitasnya, jadi angka di atas adalah batas bawah
										— bukan total sebenarnya.
									</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Area Scroll Daftar Hydrant */}
					<div className="flex h-[500px] flex-col gap-3 overflow-y-auto pb-4 pr-1 lg:h-[calc(100vh-240px)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{hydrants.data && hydrants.data.length > 0 ? (
							<>
								{hydrants.data.map((hydrant) => (
									<Card
										key={hydrant.id}
										onClick={() => focusToHydrant(hydrant.id, hydrant.lat, hydrant.lng)}
										className={`cursor-pointer transition-colors ${activeHydrantId === hydrant.id ? 'border-teal-500 bg-teal-50/50 dark:border-teal dark:bg-teal/5' : 'hover:border-teal-300 dark:hover:border-teal/50'}`}
									>
										<CardContent className="flex flex-col gap-3 p-3 sm:p-4">
											<div className="flex flex-row items-center gap-3">
												<div
													className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${facilityStatusIsFaulty(hydrant.status) ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}
												>
													<IconFireHydrant className="h-5 w-5" />
												</div>
												<div className="w-full min-w-0 flex-1">
													<h3
														className={`truncate text-sm font-semibold ${activeHydrantId === hydrant.id ? 'text-teal-700 dark:text-teal' : 'text-foreground'}`}
													>
														{hydrant.name}
													</h3>
													<p className="mt-0.5 truncate text-xs text-muted-foreground">
														{hydrant.address}
													</p>
													<p className="mt-0.5 truncate text-[11px] text-muted-foreground">
														{[
															facilityStatusLabel(hydrant.status),
															// Kolom air berbeda per jenis: hydrant resmi punya tekanan
															// & debit, hydrant warga punya kapasitas volume. Yang tak
															// ada pada baris ini bernilai undefined → tersaring sendiri.
															waterPressureLabel(hydrant.water_pressure),
															debitLabel(hydrant.debit_lpm),
															capacityLabel(hydrant.capacity_liter),
															// Hanya ada pada hydrant warga; pada hydrant resmi bernilai
															// undefined dan tersaring sendiri seperti kolom air di atas.
															hydrant.banjar?.name,
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
														<Link href={route(v.routes.edit, hydrant.id)}>
															<IconEdit className="h-4 w-4" />
														</Link>
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setHydrantToDelete(hydrant.id)}
														className="h-8 w-8 text-muted-foreground hover:text-destructive"
													>
														<IconTrash className="h-4 w-4" />
													</Button>
												</div>
											</div>
											<div className="mt-1 flex items-center justify-center gap-1 rounded-md bg-teal-50 py-1.5 text-[10px] font-bold text-teal-600 dark:bg-teal/10 dark:text-teal lg:hidden">
												<IconArrowDown className="h-3 w-3" /> Lihat Peta Lokasi
											</div>
										</CardContent>
									</Card>
								))}

								{/* ========================================== */}
								{/* BAGIAN PAGINASI SHADCN-STYLE */}
								{/* ========================================== */}
								<div className="mt-4 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
									<span className="text-[11px] font-medium text-muted-foreground">
										Menampilkan {hydrants.from} - {hydrants.to} dari {hydrants.total} aset
									</span>

									{hydrants.links && hydrants.links.length > 3 && (
										<div className="flex flex-wrap justify-center gap-1">
											{hydrants.links.map((link, index) => {
												return link.url ? (
													<Link
														key={index}
														href={link.url}
														preserveScroll
														className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
															link.active
																? 'border-teal-600 bg-teal-600 text-white shadow-sm dark:border-teal dark:bg-teal'
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
												);
											})}
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
						<IconMapPinFilled className="h-4 w-4 text-teal-600 dark:text-teal" />
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen Hydrant" />;
