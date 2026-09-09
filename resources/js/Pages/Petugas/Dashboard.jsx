import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { cn, GEO_OPTIONS, MAP_TILE_URL, reportNumber } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheck,
	IconClock,
	IconFileText,
	IconFiretruck,
	IconHourglass,
	IconMapPin,
	IconRadar,
	IconRoute,
	IconShieldCheck,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// Jarak garis-lurus (km) haversine dari posisi petugas ke titik insiden — cukup untuk
// menaksir kedekatan misi di dashboard tanpa memanggil OSRM per baris.
function distanceKm(lat1, lng1, lat2, lng2) {
	const R = 6371;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

export default function PetugasDashboard({ auth, activeMissions = [], pendingResolutions = [], feed_channel = null }) {
	const user = auth.user;

	// Misi baru muncul / selesai di wilayah penugasan — peta taktis & antrian berita acara
	// ikut bergerak tanpa reload.
	useReportFeed(feed_channel, () => router.reload({ only: ['activeMissions', 'pendingResolutions'] }));

	// Ambil nama depan saja untuk sapaan
	const firstName = user?.name ? user.name.split(' ')[0] : 'Komandan';

	// Peta taktis misi — petugas adalah peran lapangan yang paling butuh peta.
	// Pola Leaflet manual mengikuti Admin/Dashboard (window.L sudah dimuat global di app.blade.php).
	const miniMapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const missionsWithCoords = activeMissions.filter((m) => m.lat && m.lng);

	// Ambil satu fix GPS petugas untuk menaksir jarak ke tiap TKP (senyap bila ditolak).
	const [myPos, setMyPos] = useState(null);
	useEffect(() => {
		if (!navigator.geolocation) return;
		navigator.geolocation.getCurrentPosition(
			(p) => setMyPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
			() => {},
			GEO_OPTIONS.oneShot,
		);
	}, []);

	// Perkaya tiap misi dengan penanda urgensi + jarak km (bila lokasi petugas diketahui).
	//
	// TASK_51: yang MENDESAK bagi petugas kini `pending` — laporan yang sudah diverifikasi
	// admin dan sedang memanggil responder. `TERLAPOR` PINDAH jadi keadaan menunggu: sejak
	// verifikasi dicabut dari petugas, ajakan merah "Tanggapi" pada laporan mentah adalah
	// janji yang tak bisa ia tepati — dibuka pun tak ada tombol apa pun di sana.
	const missions = activeMissions.map((m) => ({
		...m,
		isUrgent: m.status === 'pending',
		isAwaitingAdmin: m.status === 'TERLAPOR',
		distKm: myPos && m.lat && m.lng ? distanceKm(myPos.lat, myPos.lng, parseFloat(m.lat), parseFloat(m.lng)) : null,
	}));

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

		window.L.tileLayer(MAP_TILE_URL, { attribution: '&copy; OpenStreetMap' }).addTo(map);
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
		<div className="flex w-full flex-col space-y-5 pb-32 md:space-y-6">
			<Head title="Dashboard Operasional" />

			{/* KEPALA HALAMAN. Pembungkus `mx-auto max-w-7xl` dicabut - AppLayout sudah
			    memberi max-width DAN padding halaman, jadi yang kedua cuma menumpuk. */}
			<AppGreeting
				title={`Siaga, ${firstName}!`}
				meta={
					<>
						<Badge
							variant="secondary"
							className="rounded-md border-none bg-destructive px-2.5 py-1 text-[10px] font-bold tracking-wider text-destructive-foreground"
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} /> PETUGAS DAMKAR
						</Badge>
						<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground md:text-sm">
							<IconMapPin className="h-3.5 w-3.5 text-destructive md:h-4 md:w-4" /> Wilayah Yurisdiksi
							Anda
						</span>
					</>
				}
			/>

			{/* --- BANNER STATUS SIAGA --- */}
			{activeMissions.length > 0 ? (
				<Card className="overflow-hidden rounded-xl border border-destructive/30 bg-destructive/10 shadow-sm">
					<CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center md:p-5">
						<div className="flex items-center gap-3 md:gap-4">
							<div className="flex h-11 w-11 shrink-0 animate-pulse items-center justify-center rounded-lg border border-destructive/30 bg-destructive/20 text-destructive md:h-12 md:w-12">
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
					<CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center md:p-5">
						<div className="flex items-center gap-3 md:gap-4">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-100 text-teal-600 dark:border-success/30 dark:bg-success/20 dark:text-success md:h-12 md:w-12">
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

			{/* --- PETA TAKTIS MISI --- Pemisah `<hr>` antar-seksi dicabut: tiap seksi kini
			    membawa labelnya sendiri, dan garis mendatar selebar halaman adalah idiom
			    dokumen. Petanya sempat dibuat menempel tepi layar 2026-09-09 lalu DICABUT
			    atas koreksi user - tidak boleh ada yang full kanan kiri, semua tetap
			    bermargin. */}
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
			<AppSection title="Daftar Misi Operasional" icon={IconRadar}>
				<AppList>
					{activeMissions.length > 0 ? (
						missions.map((mission) => (
							<AppListRow
								key={mission.id}
								href={route('reports.show', mission.id)}
								leading={
									<div
										className={cn(
											'shrink-0 rounded-xl p-2 md:p-2.5',
											mission.isUrgent
												? 'bg-destructive/10 text-destructive'
												: 'bg-muted text-muted-foreground',
										)}
									>
										<IconFiretruck className="h-5 w-5" stroke={2} />
									</div>
								}
								title={mission.title}
								meta={
									<>
										<span className="font-mono font-semibold">{reportNumber(mission)}</span>
										<span className="text-muted-foreground/60">•</span>
										<span className="flex min-w-0 items-center gap-1.5">
											<IconMapPin className="h-3.5 w-3.5 shrink-0" />
											<span className="truncate">{mission.location}</span>
										</span>
										<span className="text-muted-foreground/60">•</span>
										<span
											className={cn(
												'flex shrink-0 items-center gap-1.5',
												mission.isUrgent && 'font-semibold text-destructive',
											)}
										>
											<IconClock className="h-3.5 w-3.5 shrink-0" />
											Dilaporkan {mission.time}
										</span>
										{mission.distKm != null && (
											<>
												<span className="text-muted-foreground/60">•</span>
												<span className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
													<IconRoute className="h-3.5 w-3.5 shrink-0" /> ±{' '}
													{mission.distKm < 10
														? mission.distKm.toFixed(1)
														: Math.round(mission.distKm)}{' '}
													km
												</span>
											</>
										)}
									</>
								}
								trailing={
									<div className="flex flex-col items-end gap-1.5 md:flex-row md:items-center md:gap-4">
										<StatusBadge status={mission.status} />
										{/* Ajakan bertindak IKUT MENGECIL di ponsel, tidak dihilangkan: warna
										    merah "Tanggapi" adalah sinyal urgensi dashboard ini (TASK_51), dan
										    menyembunyikannya justru di perangkat yang dibawa ke lapangan akan
										    mencabut sinyalnya persis di tempat ia paling dibutuhkan. */}
										<div
											className={cn(
												'flex h-7 shrink-0 items-center justify-center gap-1 rounded-md px-2 text-[10px] font-bold uppercase tracking-wider transition-all md:h-10 md:rounded-lg md:px-4 md:text-xs',
												mission.isUrgent &&
													'bg-destructive text-destructive-foreground group-hover:bg-destructive/90',
												mission.isAwaitingAdmin &&
													'border border-warning/30 bg-warning/10 text-warning',
												!mission.isUrgent &&
													!mission.isAwaitingAdmin &&
													'border border-border bg-muted text-foreground/80 group-hover:border-destructive group-hover:bg-destructive group-hover:text-destructive-foreground',
											)}
										>
											{mission.isAwaitingAdmin ? (
												<>
													<IconHourglass className="h-3.5 w-3.5 md:h-4 md:w-4" /> Menunggu
													Admin
												</>
											) : (
												<>{mission.isUrgent ? 'Tanggapi' : 'Pantau'}</>
											)}
										</div>
									</div>
								}
							/>
						))
					) : (
						<AppEmpty
							icon={IconCheck}
							title="Tidak ada misi aktif"
							description="Anda sedang dalam mode siaga. Laporan darurat baru akan muncul di sini."
						/>
					)}
				</AppList>
			</AppSection>

			{/* --- MENUNGGU BERITA ACARA (insiden selesai, laporan kegiatan belum final) --- */}
			{pendingResolutions.length > 0 && (
				<AppSection title="Menunggu Berita Acara" icon={IconFileText} count={pendingResolutions.length}>
					<p className="px-1 pt-2.5 text-xs text-muted-foreground md:pt-0 md:text-sm">
						Insiden sudah selesai ditangani, tetapi Laporan Kegiatan Penyelamatan belum dibuat. Isi entri
						sementaranya di sini; entri final ditutup admin.
					</p>
					<AppList className="md:border-warning/30">
						{pendingResolutions.map((item) => (
							<AppListRow
								key={item.id}
								href={route('reports.resolution.create', item.id)}
								leading={
									<div className="shrink-0 rounded-xl bg-warning/10 p-2 text-warning md:p-2.5">
										<IconFileText className="h-5 w-5" stroke={2} />
									</div>
								}
								title={item.title}
								meta={
									<>
										<span className="font-mono font-semibold">{reportNumber(item)}</span>
										<span className="text-muted-foreground/60">•</span>
										<span className="flex min-w-0 items-center gap-1.5">
											<IconMapPin className="h-3.5 w-3.5 shrink-0" />
											<span className="truncate">{item.location}</span>
										</span>
										<span className="text-muted-foreground/60">•</span>
										<span className="flex shrink-0 items-center gap-1.5">
											<IconCheck className="h-3.5 w-3.5 shrink-0 text-success" />
											Selesai {item.time}
										</span>
									</>
								}
								trailing={
									/* Antrian ini hanya berisi insiden yang BELUM punya entri berita acara
									   sama sekali (TASK_49), jadi tak ada lagi dua keadaan yang perlu
									   dibedakan - `has_draft` ikut dihapus di server. */
									<div className="flex h-7 shrink-0 items-center justify-center rounded-md bg-warning px-2 text-[10px] font-bold uppercase tracking-wider text-warning-foreground transition-all group-hover:bg-warning/90 md:h-10 md:rounded-lg md:px-4 md:text-xs">
										Buat Laporan
									</div>
								}
							/>
						))}
					</AppList>
				</AppSection>
			)}
		</div>
	);
}

PetugasDashboard.layout = (page) => <AppLayout children={page} title="Dashboard Petugas" />;
