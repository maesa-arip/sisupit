import { AppEmpty, AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import NotificationDeviceBanner from '@/Components/NotificationDeviceBanner';
import StatusBadge from '@/Components/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent } from '@/Components/ui/card';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { escapeHtml } from '@/lib/escape-html';
import { firstName as getFirstName } from '@/lib/first-name';
import { reportIcon } from '@/lib/report-icon';
import { cn, GEO_OPTIONS, MAP_TILE_URL, reportNumber } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconCheck,
	IconFileText,
	IconHourglass,
	IconMapPin,
	IconRadar,
	IconRuler2,
	IconShieldCheck,
	IconShieldHalf,
	IconUsers,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

// Warna pin misi = kamus status Peta Pemantauan (Monitoring/Map.jsx REPORT_STATUS): Laporan
// Masuk merah, Terverifikasi kuning, Penanganan hijau. Dulu semua pin merah sama rata.
const MISSION_PIN_COLOR = {
	TERLAPOR: 'text-destructive',
	pending: 'text-warning',
	handling: 'text-success',
};

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

export default function PetugasDashboard({
	auth,
	activeMissions = [],
	pendingResolutions = [],
	myRegu = null,
	feed_channel = null,
	tenant_location = null,
	fcm_device_count = null,
}) {
	const user = auth.user;

	// Misi baru muncul / selesai di wilayah penugasan — peta taktis & antrian berita acara
	// ikut bergerak tanpa reload.
	useReportFeed(feed_channel, () => router.reload({ only: ['activeMissions', 'pendingResolutions'] }));

	// Ambil nama depan saja untuk sapaan
	const firstName = getFirstName(user?.name, 'Komandan');

	// Peta taktis misi — petugas adalah peran lapangan yang paling butuh peta.
	// Pola Leaflet manual mengikuti Admin/Dashboard (window.L sudah dimuat global di app.blade.php).
	const miniMapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const missionBoundsRef = useRef(null);
	const myMarkerRef = useRef(null);
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

	const awaitingCount = missions.filter((m) => m.isAwaitingAdmin).length;
	const actionableCount = missions.length - awaitingCount;

	useEffect(() => {
		if (!miniMapRef.current || !window.L) return;

		if (mapInstanceRef.current) {
			mapInstanceRef.current.remove();
			mapInstanceRef.current = null;
		}

		// Peta bisa digeser di ponsel - dulu `dragging: !mobile` mengunci peta justru di alat utama
		// petugas. Titik awal = lokasi akun (pola getTenantDefaultLocation), bukan Denpasar yang
		// ditulis mati di aplikasi multi-tenant.
		const map = window.L.map(miniMapRef.current, {
			zoomControl: false,
			scrollWheelZoom: false,
		}).setView([tenant_location?.lat ?? -8.65, tenant_location?.lng ?? 115.22], 12);

		window.L.tileLayer(MAP_TILE_URL, { attribution: '&copy; OpenStreetMap' }).addTo(map);
		mapInstanceRef.current = map;

		const markers = [];
		missionsWithCoords.forEach((mission) => {
			const lat = parseFloat(mission.lat);
			const lng = parseFloat(mission.lng);
			if (isNaN(lat) || isNaN(lng)) return;

			// Kelas warna milik kode (kamus di atas), bukan data - nama `statusClass` terdaftar aman
			// di LeafletPopupEscapeTest.
			const statusClass = MISSION_PIN_COLOR[mission.status] ?? 'text-destructive';
			const incidentIcon = window.L.divIcon({
				html: `<div class="${statusClass}"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
				className: 'bg-transparent border-none filter drop-shadow-md',
				iconSize: [32, 32],
				iconAnchor: [16, 32],
			});

			const marker = window.L.marker([lat, lng], { icon: incidentIcon })
				.addTo(map)
				.bindPopup(
					`<div class="text-xs font-bold text-foreground font-sans">${escapeHtml(mission.title)}</div>`,
				);
			markers.push(marker);
		});

		missionBoundsRef.current = markers.length > 0 ? new window.L.featureGroup(markers).getBounds() : null;
		myMarkerRef.current = null;
		fitMissionsAndMe(map);

		return () => {
			if (mapInstanceRef.current) {
				mapInstanceRef.current.remove();
				mapInstanceRef.current = null;
			}
		};
	}, [activeMissions]);

	// Posisi petugas sendiri (titik biru) - GPS-nya sudah diambil untuk jarak, kini juga tampil
	// di peta supaya TKP terbaca relatif terhadap dirinya. Effect terpisah: fix GPS datang
	// belakangan dan tak boleh membangun ulang seluruh peta.
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map || !myPos) return;

		myMarkerRef.current?.remove();
		myMarkerRef.current = window.L.marker([myPos.lat, myPos.lng], {
			icon: window.L.divIcon({
				html: '<div class="h-3.5 w-3.5 rounded-full border-2 border-white bg-info shadow-md"></div>',
				className: 'bg-transparent border-none',
				iconSize: [14, 14],
				iconAnchor: [7, 7],
			}),
			keyboard: false,
			zIndexOffset: 1000,
		})
			.addTo(map)
			.bindPopup('<div class="text-xs font-bold text-foreground font-sans">Posisi Anda</div>');
		fitMissionsAndMe(map);
	}, [myPos, activeMissions]);

	// Bingkai peta = semua misi + posisi petugas. Tanpa animasi zoom: peta ini dibuat tepat saat
	// halaman masuk, dan zoom beranimasi berjalan di frame tersibuk -> terasa patah di ponsel (TASK_70).
	function fitMissionsAndMe(map) {
		const bounds = missionBoundsRef.current ? window.L.latLngBounds(missionBoundsRef.current) : null;
		if (!bounds) {
			// Tanpa misi: pusatkan ke petugas sendiri, bukan ke titik awal akun.
			if (myMarkerRef.current) map.setView(myMarkerRef.current.getLatLng(), 13, { animate: false });
			return;
		}
		if (myMarkerRef.current) bounds.extend(myMarkerRef.current.getLatLng());
		map.fitBounds(bounds.pad(0.3), { animate: false });
	}

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
							className="rounded-full border-none bg-destructive px-2.5 py-0.5 text-xs font-semibold text-destructive-foreground"
						>
							<IconShieldCheck className="mr-1 h-3.5 w-3.5" stroke={2.5} /> Petugas Damkar
						</Badge>
						{/* Regu milik petugas ini (TASK_60) - tidak tampil bila belum beregu. */}
						{myRegu && (
							<span className="flex items-center gap-1.5 text-xs font-semibold text-foreground md:text-sm">
								<IconShieldHalf className="h-3.5 w-3.5 text-destructive md:h-4 md:w-4" />
								{myRegu.name}
								{myRegu.is_leader && ' - Danru'}
							</span>
						)}
					</>
				}
			/>

			{/* HP belum siap menerima sirine (#182) - tak tampil saat semuanya normal. */}
			<NotificationDeviceBanner deviceCount={fcm_device_count} />

			{/* --- BANNER STATUS SIAGA --- Merah HANYA untuk misi yang bisa petugas tindak
			    (`pending`/`handling`). `TERLAPOR` menunggu verifikasi admin sejak TASK_51, jadi
			    ikut menghitungnya di banner merah berdenyut = menyuruh panik atas laporan yang
			    belum boleh ia sentuh; ia dapat banner kuning yang tenang. */}
			{actionableCount > 0 ? (
				<Card className="overflow-hidden border border-destructive/30 bg-destructive/10">
					<CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center md:p-5">
						<div className="flex items-center gap-3 md:gap-4">
							<div className="flex h-11 w-11 shrink-0 animate-pulse items-center justify-center rounded-xl bg-destructive/15 text-destructive md:h-12 md:w-12">
								<IconAlertCircle className="h-6 w-6" stroke={2} />
							</div>
							<div>
								<h3 className="text-[15px] font-semibold text-destructive">
									Ada {actionableCount} Insiden Aktif!
								</h3>
								<p className="hidden text-[13px] text-destructive/80 sm:block">
									Segera pantau dan ambil tindakan operasional.
								</p>
								{awaitingCount > 0 && (
									<p className="mt-0.5 text-[13px] text-destructive/80">
										+{awaitingCount} laporan menunggu verifikasi admin
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			) : awaitingCount > 0 ? (
				<Card className="overflow-hidden border-warning/30 bg-warning/10">
					<CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center md:p-5">
						<div className="flex items-center gap-3 md:gap-4">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
								<IconHourglass className="h-6 w-6" stroke={2} />
							</div>
							<div>
								<h3 className="text-[15px] font-semibold text-warning">
									{awaitingCount} Laporan Menunggu Verifikasi Admin
								</h3>
								<p className="hidden text-[13px] text-warning/80 sm:block">
									Belum ada tindakan untuk Anda. Misi muncul merah begitu admin memverifikasi.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card className="overflow-hidden border-success/30 bg-success/10">
					<CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center md:p-5">
						<div className="flex items-center gap-3 md:gap-4">
							<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
								<IconShieldCheck className="h-6 w-6" stroke={2} />
							</div>
							<div>
								<h3 className="text-[15px] font-semibold text-success">Wilayah Aman Terkendali</h3>
								<p className="hidden text-[13px] text-success/80 sm:block">
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
			<Card className="relative flex h-[300px] flex-col overflow-hidden sm:h-[360px]">
				<div className="material-chrome absolute left-0 right-0 top-0 z-10 flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
					<IconMapPin className="h-4 w-4 text-destructive" stroke={2.5} />
					<span className="text-[13px] font-semibold text-foreground">Peta Taktis Misi</span>
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
						missions.map((mission) => {
							// Ikon = JENIS kejadian, sama dengan dashboard admin & Arsip/Riwayat (#161).
							// Urgensi tetap dibawa waktu merah + pil "Tanggapi" di bawah, bukan ikonnya.
							const { Icon: MissionIcon, className: iconStyle } = reportIcon(mission);

							return (
								<AppListRow
									key={mission.id}
									href={route('reports.show', mission.id)}
									leading={
										<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', iconStyle)}>
											<MissionIcon className="h-5 w-5" stroke={2} />
										</div>
									}
									title={mission.title}
									aside={
										<span className={cn(mission.isUrgent && 'font-semibold text-destructive')}>
											{mission.time}
										</span>
									}
									meta={
										<>
											<span className="hidden font-mono font-semibold md:inline">
												{reportNumber(mission)}
											</span>
											<span className="flex items-start gap-1.5">
												<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
												<span>{mission.location}</span>
											</span>
											{mission.distKm != null && (
												<span className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
													<IconRuler2 className="h-3.5 w-3.5 shrink-0" /> ±{' '}
													{mission.distKm < 10
														? mission.distKm.toFixed(1)
														: Math.round(mission.distKm)}{' '}
													km garis lurus
												</span>
											)}
											{/* Regu yang sudah meluncur ke insiden ini (TASK_60). */}
											{mission.regus?.length > 0 && (
												<span className="flex items-start gap-1.5 font-semibold text-foreground">
													<IconUsers className="mt-0.5 h-3.5 w-3.5 shrink-0" />
													<span>{mission.regus.join(', ')} meluncur</span>
												</span>
											)}
										</>
									}
									badges={
										<>
											<StatusBadge status={mission.status} />
											{/* Ajakan bertindak TETAP ada di ponsel (TASK_51): merah "Tanggapi" adalah
										    sinyal urgensi dashboard ini. Kini di baris lencana sendiri, bukan
										    dijejalkan di kolom kanan (keluhan user 2026-10-02). */}
											<span
												className={cn(
													'inline-flex h-7 items-center gap-1 rounded-full px-3 text-[13px] font-semibold transition-colors',
													mission.isUrgent && 'bg-destructive text-destructive-foreground',
													mission.isAwaitingAdmin && 'bg-warning/10 text-warning',
													!mission.isUrgent &&
														!mission.isAwaitingAdmin &&
														'bg-muted text-foreground/80',
												)}
											>
												{mission.isAwaitingAdmin ? (
													<>
														<IconHourglass className="h-3.5 w-3.5" /> Menunggu Admin
													</>
												) : mission.isUrgent ? (
													'Tanggapi'
												) : (
													'Pantau'
												)}
											</span>
										</>
									}
								/>
							);
						})
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
						Insiden sudah selesai ditangani, tetapi Laporan Kejadian belum dibuat. Isi entri sementaranya di
						sini; entri final ditutup admin.
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
								aside={`Selesai ${item.time}`}
								meta={
									<>
										<span className="font-mono font-semibold">{reportNumber(item)}</span>
										<span className="flex items-start gap-1.5">
											<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
											<span>{item.location}</span>
										</span>
									</>
								}
								badges={
									/* Antrian ini hanya berisi insiden yang BELUM punya entri berita acara
									   sama sekali (TASK_49), jadi cukup satu ajakan. */
									<span className="inline-flex h-7 items-center rounded-full bg-warning px-3 text-[13px] font-semibold text-warning-foreground">
										Buat Laporan
									</span>
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
