import HeaderTitle from '@/Components/HeaderTitle';
import PublicPageHeader from '@/Components/PublicPageHeader';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { GEO_OPTIONS } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import {
	IconDroplet,
	IconLoader2,
	IconMapPinFilled,
	IconRadar,
	IconRoute,
	IconSearch,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Index({ pumps, filters, ...props }) {
	// Tampilan berbeda per status: tamu = chrome landing (hero + navbar publik), sudah
	// login = tampilan lama ber-sidebar (AppLayout + HeaderTitle). Lihat Index.layout.
	const { auth } = usePage().props;
	const isGuest = !auth?.user;

	const [isLocating, setIsLocating] = useState(false);

	// Sorot tombol berdasarkan filter yang BENAR-BENAR diterapkan server (prop `filters`),
	// bukan state lokal `data` yang bisa tidak sinkron — agar tombol selalu sesuai hasil.
	const activeStatus = filters?.status || 'Semua';

	const { data, setData, processing } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
		is_nearest: filters?.is_nearest || false,
		lat: filters?.lat || '',
		lng: filters?.lng || '',
	});

	// Kirim filter dengan payload terbaru agar tidak menunggu state React yang asynchronous.
	const applyFilter = (key, value) => {
		setData(key, value); // Update UI state
		const payload = { ...data, [key]: value };

		router.get(route('front.pumps.index'), payload, {
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
						route('front.pumps.index'),
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
					alert('Gagal mendapatkan lokasi. Pastikan izin GPS (Location) aktif di browser Anda.');
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
		<div
			className={
				isGuest
					? 'mx-auto flex w-full max-w-6xl flex-col space-y-6 px-4 py-8 pb-24 sm:px-6'
					: 'relative flex w-full flex-col space-y-6 pb-32'
			}
		>
			{isGuest ? (
				<PublicPageHeader
					icon={IconDroplet}
					eyebrow="Jelajahi"
					title="Lokasi SKKL"
					subtitle="Temukan Sistem Ketahanan Kebakaran Lingkungan (SKKL) terdekat dari lokasi Anda."
				/>
			) : (
				<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
					<HeaderTitle
						title="Lokasi SKKL"
						subtitle="Sistem Ketahanan Kebakaran Lingkungan (SKKL) terdekat."
						icon={IconDroplet}
					/>
				</div>
			)}

			<div className="flex w-full flex-col items-start gap-5 lg:flex-row lg:gap-6">
				{/* KOLOM KIRI */}
				<div className="flex w-full shrink-0 flex-col gap-5 lg:w-5/12 xl:w-1/3">
					{/* Kotak Pencarian */}
					<Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
						<CardContent className="p-5">
							<form onSubmit={handleSearch} className="flex flex-col gap-4">
								<Button
									type="button"
									onClick={handleNearestSearch}
									disabled={isLocating || processing}
									className="flex h-10 w-full items-center gap-2 rounded-md border border-info/30 bg-info/10 text-sm font-medium text-info shadow-sm transition-colors hover:bg-info/20"
								>
									{isLocating ? (
										<IconLoader2 className="h-4 w-4 animate-spin" />
									) : (
										<IconRadar className="h-4 w-4" />
									)}
									{isLocating ? 'Melacak Lokasi Anda...' : 'Cari SKKL Terdekat'}
								</Button>

								<div className="relative">
									<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
										<IconSearch className="h-4 w-4 text-muted-foreground" />
									</div>
									<Input
										type="text"
										placeholder="Cari nama area atau jalan..."
										className="h-10 w-full rounded-md border-border bg-muted pl-9 text-sm focus-visible:ring-1 focus-visible:ring-info"
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
										Aktif
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

					{/* List Daftar Pompa */}
					<div className="flex flex-col gap-3 pb-4">
						{pumps.data && pumps.data.length > 0 ? (
							pumps.data.map((pump) => (
								<Card
									key={pump.id}
									className="group shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:border-muted-foreground/30"
								>
									<CardContent className="flex flex-row flex-nowrap items-center gap-3 p-3 sm:p-4">
										{/* KIRI: Ikon */}
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
												pump.status === 'Aktif'
													? 'border-info/20 bg-info/10 text-info'
													: 'border-destructive/30 bg-destructive/10 text-destructive'
											}`}
										>
											{pump.status === 'Aktif' ? (
												<IconDroplet className="h-5 w-5" stroke={1.5} />
											) : (
												<IconDroplet className="h-5 w-5" stroke={1.5} />
											)}
										</div>

										{/* TENGAH: Info Text */}
										<div className="w-full min-w-0 flex-1 py-1">
											<h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-info">
												{pump.name}
											</h3>
											<p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
												{pump.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span
													className={`whitespace-nowrap rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
														pump.status === 'Aktif'
															? 'border-info/30 bg-info/10 text-info'
															: 'border-destructive/30 bg-destructive/10 text-destructive'
													}`}
												>
													{pump.status}
												</span>
												<span className="max-w-[80px] truncate border-l border-border pl-1.5 text-[10px] font-medium text-muted-foreground sm:max-w-none sm:pl-2">
													{pump.type}
												</span>
											</div>
										</div>

										{/* KANAN: Aksi & Jarak */}
										<div className="flex shrink-0 flex-col items-end justify-center gap-2">
											{pump.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
													{pump.distance}
												</span>
											) : (
												<span className="h-[20px]"></span>
											)}
											<a
												href={`https://www.google.com/maps/dir/?api=1&destination=${pump.lat},${pump.lng}`}
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
								<h4 className="text-sm font-semibold text-foreground">Tidak ada data SKKL</h4>
								<p className="mt-1 text-xs text-muted-foreground">
									Coba ubah kata kunci pencarian Anda.
								</p>
							</div>
						)}
					</div>
				</div>

				{/* --- KOLOM KANAN: Peta Interaktif (Sticky) --- */}
				<div className="flex w-full flex-col gap-3 lg:sticky lg:top-[90px] lg:flex-1">
					{/* Header Peta */}
					<div className="flex items-center gap-2 px-1">
						<IconMapPinFilled className="h-4 w-4 text-info" />
						<h2 className="text-sm font-semibold text-foreground">Sebaran Titik SKKL</h2>
					</div>

					{/* Wrapper Peta */}
					<div className="relative z-0 h-[400px] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:h-[calc(100vh-160px)]">
						<UserLeafletMap markers={pumps.data} />
					</div>
				</div>
			</div>
		</div>
	);
}

// Layout adaptif: tamu → chrome landing (PublicLayout), sudah login → AppLayout (sidebar).
Index.layout = (page) => {
	const title = 'Lokasi SKKL';
	return page.props?.auth?.user ? (
		<AppLayout children={page} title={title} />
	) : (
		<PublicLayout children={page} title={title} />
	);
};
