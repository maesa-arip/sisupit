import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import UserLeafletMap from '@/Components/UserLeafletMap';
import AppLayout from '@/Layouts/AppLayout';
import { GEO_OPTIONS } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import {
	IconFiretruck,
	IconLoader2,
	IconMapPinFilled,
	IconPhoneCall,
	IconRadar,
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
					<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
						<CardContent className="p-5">
							<form onSubmit={handleSearch} className="flex flex-col gap-4">
								{/* Tombol Lacak */}
								<Button
									type="button"
									onClick={handleNearestSearch}
									disabled={isLocating || processing}
									className="flex h-10 w-full items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 text-sm font-medium text-destructive shadow-sm transition-colors hover:bg-destructive/20"
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
										type="text"
										placeholder="Cari nama pos atau area..."
										className="h-10 w-full rounded-md border-border bg-muted pl-9 text-sm focus-visible:ring-1 focus-visible:ring-destructive"
										value={data.search}
										onChange={(e) => setData('search', e.target.value)}
									/>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* List Daftar Pos */}
					<div className="flex flex-col gap-3 pb-4">
						{stations.data && stations.data.length > 0 ? (
							stations.data.map((station) => (
								<Card
									key={station.id}
									className="group shrink-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:border-muted-foreground/30"
								>
									<CardContent className="flex flex-row flex-nowrap items-center gap-3 p-3 sm:p-4">
										{/* KIRI: Ikon Mobil Pemadam */}
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-destructive/20 bg-destructive/10 text-destructive">
											<IconFiretruck className="h-5 w-5" stroke={1.5} />
										</div>

										{/* TENGAH: Info Text */}
										<div className="w-full min-w-0 flex-1 py-1">
											<h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-destructive">
												{station.name}
											</h3>
											<p className="mt-0.5 truncate text-[11px] text-muted-foreground sm:text-xs">
												{station.address}
											</p>
											<div className="mt-1.5 flex flex-wrap items-center gap-1.5">
												<span className="whitespace-nowrap rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-green-700 dark:border-success/30 dark:bg-success/10 dark:text-success">
													{station.status}
												</span>
												<span className="border-l border-border pl-1.5 text-[10px] font-medium text-muted-foreground sm:pl-2">
													{station.vehicle_count} Armada
												</span>
											</div>
										</div>

										{/* KANAN: Jarak & Telepon */}
										<div className="flex shrink-0 flex-col items-end justify-center gap-2">
											{station.distance !== '-' ? (
												<span className="whitespace-nowrap rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground/80">
													{station.distance}
												</span>
											) : (
												<span className="h-[20px]"></span>
											)}

											{/* Tombol Telepon Langsung */}
											<a href={`tel:${station.phone}`}>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-md text-muted-foreground transition-colors hover:bg-emerald-600 hover:text-white dark:hover:bg-success/20 dark:hover:text-success"
												>
													<IconPhoneCall className="h-4 w-4" />
												</Button>
											</a>
										</div>
									</CardContent>
								</Card>
							))
						) : (
							<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 p-10 text-center">
								<IconFiretruck className="mb-2 h-10 w-10 text-muted-foreground" stroke={1.5} />
								<h4 className="text-sm font-semibold text-foreground">Tidak ada pos pemadam</h4>
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
						<IconMapPinFilled className="h-4 w-4 text-destructive" />
						<h2 className="text-sm font-semibold text-foreground">Sebaran Pos Pemadam</h2>
					</div>

					{/* Wrapper Peta */}
					<div className="relative z-0 h-[400px] w-full overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:h-[calc(100vh-160px)]">
						<UserLeafletMap markers={stations.data} />
					</div>
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Pos Pemadam Terdekat" />;
