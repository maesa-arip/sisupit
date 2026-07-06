import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { MAP_TILE_URL } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheck,
	IconChevronRight,
	IconClock,
	IconFiretruck,
	IconMapPin,
	IconRadar,
	IconShieldCheck,
} from '@tabler/icons-react';
import { useEffect, useRef } from 'react';

export default function PetugasDashboard({ auth, activeMissions = [] }) {
	const user = auth.user;

	// Ambil nama depan saja untuk sapaan
	const firstName = user?.name ? user.name.split(' ')[0] : 'Komandan';

	// Peta taktis misi — petugas adalah peran lapangan yang paling butuh peta.
	// Pola Leaflet manual mengikuti Admin/Dashboard (window.L sudah dimuat global di app.blade.php).
	const miniMapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const missionsWithCoords = activeMissions.filter((m) => m.lat && m.lng);

	useEffect(() => {
		if (!miniMapRef.current || !window.L) return;

		if (mapInstanceRef.current) {
			mapInstanceRef.current.remove();
			mapInstanceRef.current = null;
		}

		const map = window.L.map(miniMapRef.current, {
			zoomControl: false,
			scrollWheelZoom: false,
			dragging: !window.L.Browser.mobile,
			tap: !window.L.Browser.mobile,
		}).setView([-8.65, 115.216667], 12);

		window.L.tileLayer(MAP_TILE_URL).addTo(map);
		mapInstanceRef.current = map;

		const markers = [];
		missionsWithCoords.forEach((mission) => {
			const lat = parseFloat(mission.lat);
			const lng = parseFloat(mission.lng);
			if (isNaN(lat) || isNaN(lng)) return;

			const incidentIcon = window.L.divIcon({
				html: `<div class="text-destructive animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
				className: 'bg-transparent border-none filter drop-shadow-md',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
			});

			const marker = window.L.marker([lat, lng], { icon: incidentIcon })
				.addTo(map)
				.bindPopup(`<div class="text-xs font-bold text-destructive font-sans">⚠️ ${mission.title}</div>`);
			markers.push(marker);
		});

		if (markers.length > 0) {
			const group = new window.L.featureGroup(markers);
			map.fitBounds(group.getBounds().pad(0.3));
		}

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [activeMissions]);

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 pb-32">
			<Head title="Dashboard Operasional" />

			{/* --- HEADER WELCOME --- */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">Siaga, {firstName}!</h1>
				<div className="mt-2 flex flex-wrap items-center gap-2">
					<Badge
						variant="secondary"
						className="rounded-md border-none bg-destructive px-2.5 py-1 text-[10px] font-bold tracking-wider text-destructive-foreground"
					>
						<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} /> PETUGAS DAMKAR
					</Badge>
					<span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
						<IconMapPin className="h-4 w-4 text-destructive" /> Wilayah Yurisdiksi Anda
					</span>
				</div>
			</div>

			{/* --- BANNER STATUS SIAGA --- */}
			{activeMissions.length > 0 ? (
				<Card className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 shadow-sm">
					<CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 shrink-0 animate-pulse items-center justify-center rounded-lg border border-destructive/30 bg-destructive/20 text-destructive">
								<IconAlertCircle className="h-6 w-6" stroke={2} />
							</div>
							<div>
								<h3 className="text-sm font-bold text-destructive">
									Ada {activeMissions.length} Insiden Aktif!
								</h3>
								<p className="text-xs font-medium text-destructive/80">
									Segera pantau dan ambil tindakan operasional.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card className="overflow-hidden rounded-xl border border-teal-200 bg-teal-50/50 shadow-sm dark:border-success/30 dark:bg-success/10">
					<CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
						<div className="flex items-center gap-4">
							<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-100 text-teal-600 dark:border-success/30 dark:bg-success/20 dark:text-success">
								<IconShieldCheck className="h-6 w-6" stroke={2} />
							</div>
							<div>
								<h3 className="text-sm font-bold text-teal-900 dark:text-success">
									Wilayah Aman Terkendali
								</h3>
								<p className="text-xs font-medium text-teal-700/80 dark:text-success/80">
									Tidak ada insiden darurat di wilayah tugas Anda saat ini.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<hr className="border-border" />

			{/* --- PETA TAKTIS MISI --- */}
			<Card className="relative flex h-[300px] flex-col overflow-hidden rounded-xl border border-border shadow-sm sm:h-[360px]">
				<div className="absolute left-0 right-0 top-0 z-10 flex items-center gap-2 border-b bg-card/90 px-4 py-2.5 backdrop-blur-sm">
					<IconMapPin className="h-4 w-4 text-destructive" stroke={2.5} />
					<span className="text-[11px] font-extrabold uppercase tracking-widest text-foreground">
						Peta Taktis Misi
					</span>
				</div>
				<div ref={miniMapRef} className="z-0 h-full w-full bg-accent/30 pt-11"></div>
				{missionsWithCoords.length === 0 && (
					<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 pt-11 backdrop-blur-[2px]">
						<IconMapPin className="mb-2 h-8 w-8 text-muted-foreground/50" />
						<p className="text-xs font-medium text-muted-foreground">Belum ada titik misi</p>
					</div>
				)}
			</Card>

			{/* --- DAFTAR MISI AKTIF --- */}
			<div className="space-y-4">
				<h2 className="flex items-center gap-2 px-1 text-lg font-semibold text-foreground">
					<IconRadar className="h-5 w-5 text-muted-foreground" />
					Daftar Misi Operasional
				</h2>

				<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
					<CardContent className="p-0">
						<div className="flex flex-col">
							{activeMissions.length > 0 ? (
								activeMissions.map((mission) => (
									<Link
										key={mission.id}
										href={route('reports.show', mission.id)}
										className="group flex flex-col justify-between border-b border-border p-4 transition-all duration-200 last:border-b-0 hover:bg-destructive/5 sm:flex-row sm:items-center sm:p-5"
									>
										<div className="min-w-0 flex-1 pr-4">
											<h4 className="flex items-center gap-2 truncate text-sm font-bold text-foreground transition-colors group-hover:text-destructive sm:text-base">
												<IconFiretruck className="h-4 w-4 text-destructive" />
												{mission.title}
											</h4>
											<div className="mt-2 flex flex-col gap-1.5 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:gap-3">
												<span className="flex items-center gap-1.5 truncate">
													<IconMapPin className="h-4 w-4 shrink-0" />
													<span className="truncate">{mission.location}</span>
												</span>
												<span className="hidden text-muted-foreground/60 sm:inline">•</span>
												<span className="flex shrink-0 items-center gap-1.5">
													<IconClock className="h-4 w-4 shrink-0" />
													Dilaporkan {mission.time}
												</span>
											</div>
										</div>

										{/* Kolom Status & Aksi */}
										<div className="mt-4 flex w-full items-center justify-between gap-4 border-t border-border pt-3 sm:mt-0 sm:w-auto sm:justify-end sm:border-t-0 sm:pt-0">
											<StatusBadge status={mission.status} />

											<div className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-muted px-3 text-xs font-bold uppercase tracking-wider text-foreground/80 transition-all group-hover:border-destructive group-hover:bg-destructive group-hover:text-destructive-foreground group-hover:shadow-md">
												Pantau
												<IconChevronRight className="h-4 w-4" />
											</div>
										</div>
									</Link>
								))
							) : (
								<div className="flex flex-col items-center justify-center bg-muted/50 px-4 py-16 text-center">
									<div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm">
										<IconCheck className="h-7 w-7" stroke={1.5} />
									</div>
									<h3 className="text-base font-semibold text-foreground">Tidak ada misi aktif</h3>
									<p className="mt-1 max-w-[280px] text-sm text-muted-foreground">
										Anda sedang dalam mode siaga. Laporan darurat baru akan muncul di sini.
									</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

PetugasDashboard.layout = (page) => <AppLayout children={page} title="Dashboard Petugas" />;
