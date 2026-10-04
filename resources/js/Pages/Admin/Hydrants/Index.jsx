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
import {
	capacityLabel,
	facilityStatusIsFaulty,
	facilityStatusLabel,
	MAP_TILE_URL,
	roleLabel,
	timeAgo,
} from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
	IconDroplet,
	IconEdit,
	IconFireHydrant,
	IconHistory,
	IconMapPinFilled,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { HydrantTabs, hydrantVariant, tenantWilayah } from './variants';

/**
 * Keterangan tambahan pada kartu yang hanya dimiliki hydrant WARGA: kapasitas tampungan &
 * banjar pengelolanya. Pada hydrant resmi keduanya undefined dan tersaring sendiri, jadi
 * gerbangnya tetap bentuk data - bukan `if (variant === 'warga')`.
 *
 * Dipisah dari JSX supaya daftarnya tidak ditulis dua kali (sekali untuk memutuskan tampil,
 * sekali untuk dirangkai); dua salinan daftar yang sama persis adalah bentuk yang paling
 * gampang menyimpang saat kelak ada kolom ketiga.
 */
const metaTambahan = (hydrant) =>
	[capacityLabel(hydrant.capacity_liter), hydrant.banjar?.name].filter(Boolean).join(' · ');

export default function Index({
	variant = 'resmi',
	counts = {},
	hydrants,
	summary = [],
	filters,
	tenant_location,
	// Dari server (HydrantController::abilities). Halaman hydrant warga tak mengirimnya dan
	// hanya terbuka untuk admin, jadi bawaannya "semua boleh".
	can = { delete: true, warga: true },
}) {
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
						`<b>${escapeHtml(hydrant.name)}</b><br><span class="text-xs text-muted-foreground">${escapeHtml(hydrant.address)}</span>`,
					);
					bounds.push([lat, lng]);
				}
			});
			if (bounds.length > 0 && !activeHydrantId) mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
		}
	}, [hydrants.data]);

	// Peta hanya tampil mulai lg (ponsel tanpa peta, TASK_69 bagian 15). Bila peta dibuat saat
	// tersembunyi lalu layar melebar, Leaflet perlu mengukur ulang wadahnya.
	useEffect(() => {
		if (!mapRef.current || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(() => mapInstanceRef.current?.invalidateSize());
		observer.observe(mapRef.current);
		return () => observer.disconnect();
	}, []);

	const focusToHydrant = (id, lat, lng) => {
		setActiveHydrantId(id);
		const parsedLat = parseFloat(lat),
			parsedLng = parseFloat(lng);
		if (!isNaN(parsedLat) && !isNaN(parsedLng) && mapInstanceRef.current) {
			mapInstanceRef.current.flyTo([parsedLat, parsedLng], 17, { animate: true, duration: 1.5 });
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

			<AlertDialog open={!!hydrantToDelete} onOpenChange={(open) => !open && setHydrantToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus data aset ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Menghapus hydrant ini akan menghilangkan koordinatnya dari peta operasional secara permanen.
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
				<HeaderTitle title={v.title} subtitle={v.subtitle({ wilayah })} icon={IconFireHydrant} />
				<Button size="sm" className="h-10 rounded-full px-4" asChild>
					<Link href={route(v.routes.create)}>
						<IconPlus className="h-4 w-4" /> {v.addLabel}
					</Link>
				</Button>
			</div>

			<HydrantTabs active={variant} counts={counts} showWarga={can.warga} />

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				<div className="flex w-full shrink-0 flex-col gap-4 lg:w-5/12 xl:w-1/3">
					<div className="flex flex-col gap-3">
						<form onSubmit={handleSearch} className="relative">
							<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								enterKeyHint="search"
								placeholder="Cari nama area atau jalan..."
								className="h-11 rounded-xl bg-card pl-9"
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

					{/* Rekap kapasitas air per desa — PINDAH dari daftar SKKL 2026-08-26 (permintaan
					    user) dan kini menjumlahkan hydrant warga SAJA. Kartunya muncul karena
					    controller mengirim `summary`, BUKAN karena komponen ini memeriksa
					    `variant === 'warga'` — hydrant resmi tak punya angka kapasitas, jadi
					    halamannya cukup tidak mengirim propnya. Ikut filter & pencarian aktif. */}
					{summary.length > 0 && (
						<div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
							<div>
								<div className="mb-2 flex items-center gap-1.5">
									<IconDroplet className="h-4 w-4 text-teal" />
									<h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
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
												{row.capacity_liter > 0 ? capacityLabel(row.capacity_liter) : '-'}
											</span>
										</div>
									))}
								</div>
								{summary.some((row) => row.unknown_capacity > 0) && (
									<p className="mt-3 border-t border-border/70 pt-2 text-xs leading-relaxed text-muted-foreground">
										Sebagian titik belum mengisi kapasitasnya, jadi angka di atas adalah batas bawah
										- bukan total sebenarnya.
									</p>
								)}
							</div>
						</div>
					)}

					{/* Area Scroll Daftar Hydrant */}
					<div className="flex flex-col gap-3 pb-4 lg:h-[calc(100vh-240px)] lg:overflow-y-auto lg:pr-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar]:w-1.5">
						{hydrants.data && hydrants.data.length > 0 ? (
							<>
								<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									{hydrants.data.map((hydrant) => (
										<div
											role="button"
											tabIndex={0}
											key={hydrant.id}
											onClick={() => focusToHydrant(hydrant.id, hydrant.lat, hydrant.lng)}
											onKeyDown={(e) =>
												(e.key === 'Enter' || e.key === ' ') &&
												(e.preventDefault(),
												focusToHydrant(hydrant.id, hydrant.lat, hydrant.lng))
											}
											className={`cursor-pointer transition-colors active:bg-muted ${activeHydrantId === hydrant.id ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
										>
											<div className="flex flex-col gap-2 px-4 py-3.5">
												<div className="flex flex-row items-center gap-3">
													<div
														className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${facilityStatusIsFaulty(hydrant.status) ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info'}`}
													>
														<IconFireHydrant className="h-5 w-5" />
													</div>
													<div className="w-full min-w-0 flex-1">
														<h3
															className={`break-words text-[15px] font-semibold leading-snug ${activeHydrantId === hydrant.id ? 'text-primary' : 'text-foreground'}`}
														>
															{hydrant.name}
														</h3>
														<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
															{hydrant.address}
														</p>
														{/* Status berpill seperti /hydrants (permintaan user 2026-09-09), TAPI warnanya
															dipilih `facilityStatusIsFaulty()` dan BUKAN `status === 'Aktif'` yang dipakai
															halaman publik itu: halaman ini juga melayani hydrant warga, yang statusnya
															"Belum/Sudah Modifikasi", jadi perbandingan literal itu akan memerahkan SELURUH
															hydrant warga padahal tak ada yang rusak (FINDINGS #76). Pill sengaja TIDAK
															`whitespace-nowrap` seperti di /hydrants - label warga "Terdaftar Belum
															Dimodifikasi" tiga kali lebih panjang dan kolom ini cuma ~1/3 layar. */}
														<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
															<span
																className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
																	facilityStatusIsFaulty(hydrant.status)
																		? 'bg-destructive/10 text-destructive'
																		: 'bg-info/10 text-info'
																}`}
															>
																{facilityStatusLabel(hydrant.status)}
															</span>
															{/* Kondisi air SELALU disebut selama jenisnya memang punya kolom itu, termasuk
																saat kosong. Bentuk lama memakai `waterPressureLabel()` di dalam
																`.filter(Boolean)`, dan helper itu memulangkan null untuk nilai kosong -
																sehingga medannya HILANG tanpa jejak dari kartu, bukan terbaca "belum diisi".
																Seluruh 51 hydrant di dev kosong, jadi praktis tak ada yang pernah melihat
																medan ini ada. Digerbangi `v.showWaterPressure` (DATA di ./variants.jsx),
																bukan `variant === 'warga'`: tabel hydrant warga memang tak punya kolomnya
																sejak 2026-08-21, jadi di sana "belum didata" akan jadi tuduhan yang salah.
																Katanya mengikuti label formnya sendiri ("Kondisi Air"), bukan
																`waterPressureLabel()` yang berbunyi "Tekanan Keras" - helper itu tetap utuh
																dan tetap dipakai /admin/pumps. */}
															{v.showWaterPressure && (
																<span
																	className={`text-xs ${hydrant.water_pressure ? 'font-medium text-foreground' : 'italic text-muted-foreground'}`}
																>
																	{hydrant.water_pressure
																		? `Kondisi air: ${hydrant.water_pressure}`
																		: 'Kondisi air belum didata'}
																</span>
															)}
															{/* Debit (lpm) SENGAJA tidak ditampilkan di sini (permintaan user 2026-09-09);
																kolomnya tetap ada di form & tetap tampil di /admin/pumps. Kapasitas &
																banjar hanya ada pada hydrant warga - pada hydrant resmi bernilai undefined
																dan tersaring sendiri. */}
															{metaTambahan(hydrant) && (
																<span className="text-[13px] text-muted-foreground">
																	{metaTambahan(hydrant)}
																</span>
															)}
														</div>
														{/* Jejak suntingan terakhir (hydrant_logs). Hanya hydrant resmi yang punya
															riwayat; hydrant warga dan hydrant lama yang belum pernah disentuh sejak
															riwayat ada tidak membawa `latest_log`, jadi barisnya tidak muncul -
															bukan diisi nama tebakan. */}
														{hydrant.latest_log && (
															<p className="mt-1 flex items-start gap-1 text-[13px] leading-snug text-muted-foreground">
																<IconHistory className="h-3 w-3 shrink-0" />
																<span className="truncate">
																	{hydrant.latest_log.action === 'dibuat'
																		? 'Ditambahkan'
																		: 'Terakhir diedit'}{' '}
																	oleh{' '}
																	<span className="font-medium text-foreground">
																		{hydrant.latest_log.user_name}
																	</span>
																	{hydrant.latest_log.user_role &&
																		` (${roleLabel(hydrant.latest_log.user_role)})`}{' '}
																	· {timeAgo(hydrant.latest_log.created_at)}
																</span>
															</p>
														)}
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
														{can.delete && (
															<Button
																variant="ghost"
																size="icon"
																onClick={() => setHydrantToDelete(hydrant.id)}
																className="h-8 w-8 text-muted-foreground hover:text-destructive"
															>
																<IconTrash className="h-4 w-4" />
															</Button>
														)}
													</div>
												</div>
											</div>
										</div>
									))}
								</div>

								{/* ========================================== */}
								{/* BAGIAN PAGINASI SHADCN-STYLE */}
								{/* ========================================== */}
								<div className="mt-4 flex flex-col items-center gap-3 pt-1">
									<span className="text-xs font-medium text-muted-foreground">
										Menampilkan {hydrants.from} - {hydrants.to} dari {hydrants.total} aset
									</span>

									<PaginationLinks links={hydrants.links} />
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
Index.layout = (page) => <AppLayout children={page} title="Manajemen Hydrant" />;
