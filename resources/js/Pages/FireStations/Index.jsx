import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { facilityStatusLabel, GEO_OPTIONS } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import {
	IconFiretruck,
	IconLoader2,
	IconMapPinFilled,
	IconPhoneCall,
	IconRadar,
	IconRoute,
	IconSearch,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ stations, filters, ...props }) {
	const [isLocating, setIsLocating] = useState(false);

	const { data, setData, get, processing } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
		is_nearest: filters?.is_nearest || false,
		lat: filters?.lat || '',
		lng: filters?.lng || '',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('front.fire_stations.index'), { preserveState: true, preserveScroll: true });
	};

	const handleNearestSearch = () => {
		setIsLocating(true);
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(position) => {
					data.is_nearest = true;
					data.lat = position.coords.latitude;
					data.lng = position.coords.longitude;
					get(route('front.fire_stations.index'), {
						preserveState: true,
						preserveScroll: true,
						onFinish: () => setIsLocating(false),
					});
				},
				(error) => {
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
					title="Pos Pemadam Terdekat"
					subtitle="Lacak pos pemadam kebakaran terdekat dari lokasi Anda."
					icon={IconFiretruck}
				/>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				{/* KOLOM KIRI */}
				<div className="flex w-full shrink-0 flex-col gap-5 lg:w-5/12 xl:w-1/3">
					{/* Kotak Pencarian */}
					<div>
						<div>
							<form onSubmit={handleSearch} className="flex flex-col gap-3">
								{/* Tombol Lacak */}
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
									{isLocating ? 'Melacak Lokasi Anda...' : 'Cari Pos Terdekat'}
								</Button>

								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<IconSearch className="h-4 w-4 text-muted-foreground" />
									</div>
									<Input
										type="search"
										enterKeyHint="search"
										placeholder="Cari nama pos atau area..."
										className="h-11 w-full rounded-xl border-transparent bg-muted pl-9 text-[15px] focus-visible:ring-2 focus-visible:ring-primary/30"
										value={data.search}
										onChange={(e) => setData('search', e.target.value)}
									/>
								</div>
							</form>
						</div>
					</div>

					{/* List Daftar Pos */}
					<div className="flex flex-col divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
						{stations.data && stations.data.length > 0 ? (
							stations.data.map((station) => (
								<div
									key={station.id}
									className="group shrink-0 transition-colors hover:bg-muted/40 active:bg-muted"
								>
									<div className="flex flex-row flex-nowrap items-center gap-3 px-4 py-3.5">
										{/* KIRI: Ikon Mobil Pemadam */}
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
												station.status === 'Aktif'
													? 'bg-info/10 text-info'
													: 'bg-destructive/10 text-destructive'
											}`}
										>
											<IconFiretruck className="h-5 w-5" stroke={1.5} />
										</div>

										{/* TENGAH: Info Text */}
										<div className="w-full min-w-0 flex-1 py-1">
											<h3 className="break-words text-[15px] font-semibold leading-snug text-foreground">
												{station.name}
											</h3>
											<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
												{station.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span
													className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${
														station.status === 'Aktif'
															? 'bg-info/10 text-info'
															: 'bg-destructive/10 text-destructive'
													}`}
												>
													{facilityStatusLabel(station.status)}
												</span>
												<span className="border-l border-border pl-1.5 text-xs font-medium text-muted-foreground sm:pl-2">
													{station.vehicle_count} Armada
												</span>
											</div>
										</div>

										{/* KANAN: Jarak & Telepon */}
										<div className="flex shrink-0 flex-col items-end justify-center gap-2">
											{station.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/80">
													{station.distance}
												</span>
											) : (
												<span className="h-[20px]"></span>
											)}

											<div className="flex items-center gap-1.5">
												{/* Tombol Telepon Langsung */}
												<a href={`tel:${station.phone}`}>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 rounded-lg text-muted-foreground transition-colors hover:bg-success/10 hover:text-success"
													>
														<IconPhoneCall className="h-4 w-4" />
													</Button>
												</a>

												{/* Tombol Rute ke Maps */}
												<a
													href={`https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`}
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
								</div>
							))
						) : (
							<div className="flex flex-col items-center justify-center rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
								<IconFiretruck className="mb-2 h-10 w-10 text-muted-foreground" stroke={1.5} />
								<h4 className="text-sm font-semibold text-foreground">Tidak ada pos pemadam</h4>
								<p className="mt-1 text-xs text-muted-foreground">
									Coba ubah kata kunci pencarian Anda.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* --- KOLOM KANAN: Peta Interaktif (Sticky). Desktop saja - di ponsel peta disembunyikan (permintaan user 2026-10-02, TASK_69 bagian 15) --- */}
				<div className="hidden w-full flex-col gap-3 lg:sticky lg:top-[90px] lg:flex lg:flex-1">
					{/* Header Peta */}
					<div className="flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-destructive" />
						<h2 className="text-sm font-semibold text-foreground">Sebaran Pos Pemadam</h2>
					</div>

					{/* Wrapper Peta */}
					<div className="relative z-0 h-[400px] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-sm lg:h-[calc(100vh-160px)]">
						<UserLeafletMap markers={stations.data} />
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
Index.layout = (page) => <AppLayout children={page} title="Pos Pemadam Terdekat" />;
