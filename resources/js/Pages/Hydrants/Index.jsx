import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { facilityStatusLabel, GEO_OPTIONS } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { IconFireHydrant, IconLoader2, IconMapPinFilled, IconRadar, IconRoute, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ map_markers, hydrants, filters, ...props }) {
	const [isLocating, setIsLocating] = useState(false);

	// Sorot tombol berdasarkan filter yang BENAR-BENAR diterapkan server (prop `filters`),
	// bukan state lokal `data` yang bisa tidak sinkron — agar tombol selalu sesuai hasil.
	const activeStatus = filters?.status || 'Semua';

	const { data, setData, get, processing } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
		is_nearest: filters?.is_nearest || false,
		lat: filters?.lat || '',
		lng: filters?.lng || '',
	});

	// PERBAIKAN 2: Fungsi khusus agar filter status dikirim bersamaan dengan parameter terbaru
	const applyFilter = (key, value) => {
		setData(key, value); // Update UI state

		// Buat payload baru agar tidak menunggu state React yang asynchronous
		const payload = { ...data, [key]: value };

		router.get(route('front.hydrants.index'), payload, {
			preserveState: true,
			preserveScroll: true,
		});
	};

	const handleSearch = (e) => {
		e.preventDefault();
		applyFilter('search', data.search);
	};

	const handleNearestSearch = () => {
		setIsLocating(true);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					setData('is_nearest', true);
					setData('lat', latitude);
					setData('lng', longitude);

					router.get(
						route('front.hydrants.index'),
						{
							...data,
							is_nearest: true,
							lat: latitude,
							lng: longitude,
						},
						{
							preserveState: true,
							preserveScroll: true,
							onFinish: () => setIsLocating(false),
						},
					);
				},
				(error) => {
					console.error('Gagal akses GPS:', error);
					alert('Gagal mendapatkan lokasi. Pastikan izin GPS aktif.');
					setIsLocating(false);
				},
				GEO_OPTIONS.oneShot,
			);
		} else {
			alert('Browser Anda tidak mendukung fitur lokasi.');
			setIsLocating(false);
		}
	};

	return (
		<div className="relative flex w-full flex-col space-y-6 pb-32">
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Jaringan Hidran"
					subtitle="Temukan titik hidran pemadam terdekat dari lokasi Anda."
					icon={IconFireHydrant}
				/>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				{/* --- KOLOM KIRI (Filter & List) --- */}
				<div className="flex w-full shrink-0 flex-col gap-5 lg:w-5/12 xl:w-1/3">
					{/* Kotak Pencarian & Filter */}
					<div>
						<div>
							<form onSubmit={handleSearch} className="flex flex-col gap-3">
								<Button
									type="button"
									onClick={handleNearestSearch}
									disabled={isLocating || processing}
									className="flex h-11 w-full items-center gap-2 rounded-xl border-transparent bg-primary/10 text-[15px] font-medium text-primary shadow-none transition-colors hover:bg-primary/15"
								>
									{isLocating ? (
										<IconLoader2 className="h-4 w-4 animate-spin" />
									) : (
										<IconRadar className="h-4 w-4" />
									)}
									{isLocating ? 'Melacak Lokasi Anda...' : 'Cari Hydrant Terdekat'}
								</Button>

								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<IconSearch className="h-4 w-4 text-muted-foreground" />
									</div>
									<Input
										type="search"
										enterKeyHint="search"
										placeholder="Cari nama area atau jalan..."
										className="h-11 w-full rounded-xl border-transparent bg-muted pl-9 text-[15px] focus-visible:ring-2 focus-visible:ring-primary/30"
										value={data.search}
										onChange={(e) => setData('search', e.target.value)}
									/>
								</div>

								<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
									<button
										type="button"
										onClick={() => applyFilter('status', 'Semua')}
										className={`h-8 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
											activeStatus === 'Semua'
												? 'border-transparent bg-primary text-primary-foreground'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										Semua
									</button>
									<button
										type="button"
										onClick={() => applyFilter('status', 'Aktif')}
										className={`h-8 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
											activeStatus === 'Aktif'
												? 'border-transparent bg-primary text-primary-foreground'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										{facilityStatusLabel('Aktif')}
									</button>
									<button
										type="button"
										onClick={() => applyFilter('status', 'Perbaikan')}
										className={`h-8 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium transition-colors ${
											activeStatus === 'Perbaikan'
												? 'border-transparent bg-primary text-primary-foreground'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										{facilityStatusLabel('Perbaikan')}
									</button>
								</div>
							</form>
						</div>
					</div>

					{/* Daftar List Hydrant */}
					<div className="flex flex-col divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
						{hydrants.data && hydrants.data.length > 0 ? (
							hydrants.data.map((hydrant) => (
								<div
									key={hydrant.id}
									className="group shrink-0 transition-colors hover:bg-muted/40 active:bg-muted"
								>
									<div className="flex flex-row flex-nowrap items-center gap-3 px-4 py-3.5">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
												hydrant.status === 'Aktif'
													? 'bg-info/10 text-info'
													: 'bg-destructive/10 text-destructive'
											}`}
										>
											{hydrant.status === 'Aktif' ? (
												<IconFireHydrant className="h-5 w-5" stroke={1.5} />
											) : (
												<IconFireHydrant className="h-5 w-5" stroke={1.5} />
											)}
										</div>

										<div className="w-full min-w-0 flex-1 py-1">
											<h3 className="break-words text-[15px] font-semibold leading-snug text-foreground">
												{hydrant.name}
											</h3>
											<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
												{hydrant.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span
													className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
														hydrant.status === 'Aktif'
															? 'bg-info/10 text-info'
															: 'bg-destructive/10 text-destructive'
													}`}
												>
													{facilityStatusLabel(hydrant.status)}
												</span>
												<span className="text-[13px] text-muted-foreground">
													Hydrant {hydrant.type}
												</span>
												{/* Kondisi air, sekata dengan kartu /admin/hydrants (permintaan user
														2026-09-14). SELALU disebut, termasuk saat kosong: medan yang lenyap tanpa
														jejak tak pernah memberi tahu siapa pun bahwa ada yang belum diisi (#117).
														Tanpa gerbang varian - halaman ini hanya memuat hydrant resmi, yang memang
														punya kolomnya. */}
												<span
													className={`w-full text-[13px] ${
														hydrant.water_pressure
															? 'font-medium text-foreground'
															: 'italic text-muted-foreground'
													}`}
												>
													{hydrant.water_pressure
														? `Kondisi air: ${hydrant.water_pressure}`
														: 'Kondisi air belum didata'}
												</span>
											</div>
										</div>

										<div className="flex shrink-0 flex-col items-end justify-center gap-2">
											{hydrant.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
													{hydrant.distance}
												</span>
											) : (
												<span className="h-[20px]"></span>
											)}

											<a
												href={`https://www.google.com/maps/dir/?api=1&destination=${hydrant.lat},${hydrant.lng}`}
												target="_blank"
												rel="noopener noreferrer"
											>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground/80"
												>
													<IconRoute className="h-4 w-4" />
												</Button>
											</a>
										</div>
									</div>
								</div>
							))
						) : (
							<div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
								<IconFireHydrant className="mb-2 h-10 w-10 text-muted-foreground" stroke={1.5} />
								<h4 className="text-sm font-semibold text-foreground">Tidak ada data hydrant</h4>
								<p className="mt-1 text-xs text-muted-foreground">
									Coba ubah kata kunci pencarian Anda.
								</p>
							</div>
						)}
					</div>

					{/* PERBAIKAN 3: PAGINASI RESPONSIF (Berlaku untuk Mobile dan Desktop) */}
					<PaginationLinks links={hydrants.links} />
				</div>

				{/* --- KOLOM KANAN: Peta Interaktif (Sticky). Desktop saja - di ponsel peta disembunyikan (permintaan user 2026-10-02, TASK_69 bagian 15) --- */}
				<div className="hidden w-full flex-col gap-3 lg:sticky lg:top-[90px] lg:flex lg:flex-1">
					<div className="flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-teal-600 dark:text-teal" />
						<h2 className="text-sm font-semibold text-foreground">Sebaran Titik Hydrant</h2>
					</div>

					<div className="relative z-0 h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm lg:h-[calc(100vh-160px)]">
						{/* PETA MENGGUNAKAN map_markers */}
						<UserLeafletMap markers={map_markers} lat={filters.lat} lng={filters.lng} />
					</div>
				</div>
			</div>
		</div>
	);
}

// AppLayout untuk SEMUA pengunjung, termasuk tamu (permintaan user 2026-08-25). Dulu tamu
// diberi PublicLayout — chrome navbar+footer milik landing page — dan konsekuensinya bilah
// bawah HILANG begitu tamu mengetuk "Fasilitas" dari bilah itu sendiri: ia berpindah ke
// halaman ini lalu kehilangan jalan pulang. Landing page yang melahirkan chrome tersebut
// akhirnya tidak jadi dipakai, jadi percabangannya ikut dibuang di sini.
//
// Percabangan `isGuest` di BADAN halaman ikut dibuang (permintaan user, hari yang sama):
// dulu tamu mendapat hero `PublicPageHeader` + pembungkus `max-w-6xl px-4 py-8` sementara
// yang sudah login mendapat `HeaderTitle` + lebar penuh, sehingga satu halaman punya dua
// wajah tergantung status login. Sekarang satu wajah untuk semua — wajah yang sudah login.
// (`PublicPageHeader` sejak 2026-08-26 TIDAK punya pemakai lagi: kelima halaman info/legal
// ikut memakai `HeaderTitle` seperti halaman ini — lihat FINDINGS #81, nasibnya menunggu user.)
Index.layout = (page) => <AppLayout children={page} title="Jaringan Hidran" />;
