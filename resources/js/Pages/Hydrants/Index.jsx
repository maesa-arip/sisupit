import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { GEO_OPTIONS } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
	IconDroplet,
	IconLoader2,
	IconMapPinFilled,
	IconRadar,
	IconRoute,
	IconSearch,
	IconTool,
} from '@tabler/icons-react';
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
					title="Jaringan Hydrant"
					subtitle="Temukan titik hydrant pemadam terdekat dari lokasi Anda."
					icon={IconDroplet}
				/>
			</div>

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				{/* --- KOLOM KIRI (Filter & List) --- */}
				<div className="flex w-full shrink-0 flex-col gap-5 lg:w-5/12 xl:w-1/3">
					{/* Kotak Pencarian & Filter */}
					<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
						<CardContent className="p-5">
							<form onSubmit={handleSearch} className="flex flex-col gap-4">
								<Button
									type="button"
									onClick={handleNearestSearch}
									disabled={isLocating || processing}
									className="flex h-10 w-full items-center gap-2 rounded-md border border-teal-200 bg-teal-50 text-sm font-medium text-teal-700 shadow-sm transition-colors hover:bg-teal-100 dark:border-teal/30 dark:bg-teal/10 dark:text-teal dark:hover:bg-teal/20"
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
										type="text"
										placeholder="Cari nama area atau jalan..."
										className="h-10 w-full rounded-md border-border bg-muted pl-9 text-sm focus-visible:ring-1 focus-visible:ring-teal"
										value={data.search}
										onChange={(e) => setData('search', e.target.value)}
									/>
								</div>

								<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
									<button
										type="button"
										onClick={() => applyFilter('status', 'Semua')}
										className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
											activeStatus === 'Semua'
												? 'border-transparent bg-foreground text-background'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										Semua
									</button>
									<button
										type="button"
										onClick={() => applyFilter('status', 'Aktif')}
										className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
											activeStatus === 'Aktif'
												? 'border-transparent bg-foreground text-background'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										Berfungsi
									</button>
									<button
										type="button"
										onClick={() => applyFilter('status', 'Perbaikan')}
										className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
											activeStatus === 'Perbaikan'
												? 'border-transparent bg-foreground text-background'
												: 'border-border bg-card text-foreground/80 hover:bg-muted'
										}`}
									>
										Perbaikan
									</button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Daftar List Hydrant */}
					<div className="flex flex-col gap-3">
						{hydrants.data && hydrants.data.length > 0 ? (
							hydrants.data.map((hydrant) => (
								<Card
									key={hydrant.id}
									className="group shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:border-muted-foreground/30"
								>
									<CardContent className="flex flex-row flex-nowrap items-center gap-3 p-3 sm:p-4">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
												hydrant.status === 'Aktif'
													? 'border-teal-200 bg-teal-50 text-teal-600 dark:border-teal/30 dark:bg-teal/10 dark:text-teal'
													: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-warning/30 dark:bg-warning/10 dark:text-warning'
											}`}
										>
											{hydrant.status === 'Aktif' ? (
												<IconDroplet className="h-5 w-5" stroke={1.5} />
											) : (
												<IconTool className="h-5 w-5" stroke={1.5} />
											)}
										</div>

										<div className="w-full min-w-0 flex-1 py-1">
											<h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-teal">
												{hydrant.name}
											</h3>
											<p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
												{hydrant.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span
													className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
														hydrant.status === 'Aktif'
															? 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal'
															: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-warning/30 dark:bg-warning/10 dark:text-warning'
													}`}
												>
													{hydrant.status === 'Aktif' ? 'Berfungsi' : 'Perbaikan'}
												</span>
												<span className="max-w-[80px] truncate border-l border-border pl-1.5 text-[10px] font-medium text-muted-foreground sm:max-w-none sm:pl-2">
													Hydrant {hydrant.type}
												</span>
											</div>
										</div>

										<div className="flex shrink-0 flex-col items-end justify-center gap-2">
											{hydrant.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
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
													className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground/80"
												>
													<IconRoute className="h-4 w-4" />
												</Button>
											</a>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-10 text-center">
								<IconDroplet className="mb-2 h-10 w-10 text-muted-foreground" stroke={1.5} />
								<h4 className="text-sm font-semibold text-foreground">Tidak ada data hydrant</h4>
								<p className="mt-1 text-xs text-muted-foreground">
									Coba ubah kata kunci pencarian Anda.
								</p>
							</div>
						)}
					</div>

					{/* PERBAIKAN 3: PAGINASI RESPONSIF (Berlaku untuk Mobile dan Desktop) */}
					{hydrants.links && hydrants.links.length > 3 && (
						<div className="scrollbar-hide flex justify-center overflow-x-auto pb-4 pt-4">
							<div className="flex gap-1">
								{hydrants.links.map((link, index) => (
									<Link
										key={index}
										href={link.url}
										preserveScroll
										className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
											link.active
												? 'bg-foreground text-background'
												: 'border border-border bg-card text-foreground/80 hover:bg-muted'
										} ${!link.url && 'pointer-events-none cursor-not-allowed opacity-50'}`}
										dangerouslySetInnerHTML={{ __html: link.label }}
									/>
								))}
							</div>
						</div>
					)}
				</div>

				{/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
				<div className="flex w-full flex-col gap-3 lg:sticky lg:top-[90px] lg:flex-1">
					<div className="flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-destructive" />
						<h2 className="text-sm font-semibold text-foreground">Sebaran Titik Hydrant</h2>
					</div>

					<div className="relative z-0 h-[400px] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:h-[calc(100vh-160px)]">
						{/* PETA MENGGUNAKAN map_markers */}
						<UserLeafletMap markers={map_markers} lat={filters.lat} lng={filters.lng} />
					</div>
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Lokasi Hydrant Pemadam" />;
