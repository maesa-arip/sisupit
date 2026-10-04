import { AppGreeting, AppList, AppListRow, AppSection } from '@/Components/AppSection';
import StatusBadge from '@/Components/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import useRealtimeStatus from '@/hooks/use-realtime-status';
import useReportFeed from '@/hooks/use-report-feed';
import AppLayout from '@/Layouts/AppLayout';
import { getClickLocation } from '@/lib/click-location';
import { escapeHtml } from '@/lib/escape-html';
import { firstName as getFirstName } from '@/lib/first-name';
import { reportIcon } from '@/lib/report-icon';
import { cn, GEO_OPTIONS, MAP_TILE_URL, reportNumber } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconBuildingCommunity,
	IconCheck,
	IconDroplet,
	IconFileText,
	IconHourglass,
	IconMapPin,
	IconNavigation,
	IconRuler2,
	IconShieldCheck,
	IconShieldHalf,
	IconUsers,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

/**
 * Dashboard petugas - TASK_72 fase 2, dirancang ulang dari nol.
 *
 * Pertanyaan utamanya: "ke mana saya harus pergi, dan apa yang belum beres?". Layar berubah menurut
 * keadaan: saat petugas sedang meluncur/di lokasi, kartu "Misi Saya" MENGAMBIL ALIH puncak (Tiba,
 * Navigasi, sumber air terdekat, regu, OPD); saat tenang, kepala hijau yang menenangkan.
 *
 * Meluncur dari dashboard langsung MEMBUKA halaman detail sesudah berhasil: pelacakan GPS langsung
 * (watchPosition -> update-location) hanya hidup di sana. Tanpa pindah, petugas meluncur tanpa terlihat
 * di peta siapa pun.
 */

// Warna pin misi = kamus status Peta Pemantauan (Monitoring/Map.jsx REPORT_STATUS): Laporan
// Masuk merah, Terverifikasi kuning, Penanganan hijau. Dulu semua pin merah sama rata.
const MISSION_PIN_COLOR = {
	TERLAPOR: 'text-destructive',
	pending: 'text-warning',
	handling: 'text-success',
};

const REALTIME_META = {
	connected: { label: 'Realtime aktif', className: 'bg-success/10 text-success', dot: 'bg-success' },
	connecting: { label: 'Menyambung ulang...', className: 'bg-warning/10 text-warning', dot: 'bg-warning' },
	offline: { label: 'Realtime terputus', className: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
	disabled: { label: 'Realtime nonaktif', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
};

const LIVE_PROPS = ['activeMissions', 'pendingResolutions', 'myMissions', 'reguBoard'];

// Papan regu danru dibatasi (permintaan user 2026-10-04: "terlalu panjang di HP" - 14 kartu di data lokal).
// Server sudah menaruh insiden dengan anggota yang belum memilih di atas, jadi 3 kartu pertama = yang penting.
const REGU_BOARD_LIMIT = 3;

const REGU_STATE = {
	tiba: { label: 'Tiba', className: 'border-success/30 bg-success/10 text-success' },
	meluncur: { label: 'Meluncur', className: 'border-warning/30 bg-warning/10 text-warning' },
	jaga: { label: 'Jaga kantor', className: 'border-info/30 bg-info/10 text-info' },
	belum: { label: 'Belum memilih', className: 'border-destructive/30 bg-destructive/10 text-destructive' },
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

/** Jam yang berdetak tiap 30 detik, supaya durasi misi terus bertambah tanpa memuat ulang. */
function useNow(intervalMs = 30000) {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), intervalMs);
		return () => clearInterval(id);
	}, [intervalMs]);
	return now;
}

function formatDuration(iso, now) {
	const then = new Date(iso).getTime();
	if (!iso || isNaN(then)) return '-';
	const minutes = Math.max(0, Math.floor((now - then) / 60000));
	if (minutes < 1) return 'baru saja';
	if (minutes < 60) return `${minutes} mnt`;
	return `${Math.floor(minutes / 60)} j ${minutes % 60} mnt`;
}

function formatMeters(m) {
	return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Tautan rute Google Maps ke TKP - aplikasi peta ponsel yang membuka & memandu. */
function directionsUrl(lat, lng) {
	return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function Chip({ className, icon: Icon, children }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold',
				className,
			)}
		>
			{Icon && <Icon className="h-3.5 w-3.5" stroke={2} />}
			{children}
		</span>
	);
}

function MyMissionCard({ mission, now, busy, onArrive }) {
	const arrived = mission.my_status === 'arrived';

	return (
		<Card className="overflow-hidden rounded-2xl border-destructive/30 bg-destructive/[0.06] p-4 shadow-sm md:p-5">
			<div className="text-xs font-bold uppercase tracking-wide text-destructive">
				Misi Saya -{' '}
				{arrived
					? `di lokasi ${formatDuration(mission.arrived_at, now)}`
					: `meluncur ${formatDuration(mission.dispatched_at, now)}`}
			</div>
			<h2 className="mt-1 text-[19px] font-bold leading-snug tracking-tight text-foreground md:text-xl">
				{mission.title}
			</h2>
			<p className="mt-1 flex items-start gap-1.5 text-[13px] text-muted-foreground">
				<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" stroke={2} />
				<span>{mission.location || 'Lokasi belum terbaca'}</span>
			</p>

			{mission.water.length > 0 && (
				<div className="mt-3">
					<div className="mb-1.5 text-[13px] font-semibold text-foreground">Sumber air terdekat</div>
					<div className="flex flex-wrap gap-2">
						{mission.water.map((w) => (
							<a
								key={`${w.kind}-${w.id}`}
								href={directionsUrl(w.lat, w.lng)}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-1.5 rounded-full border border-info/30 bg-info/10 px-2.5 py-1 text-xs font-semibold text-info transition-opacity active:opacity-70"
							>
								<IconDroplet className="h-3.5 w-3.5" stroke={2} />
								{w.kind === 'skkl' ? 'SKKL' : 'Hydrant'} {formatMeters(w.distance_m)}
								{w.detail && <span className="font-normal">- {w.detail}</span>}
							</a>
						))}
					</div>
				</div>
			)}

			{(mission.regu.length > 0 || mission.agencies.length > 0) && (
				<div className="mt-3 flex flex-wrap gap-2">
					{mission.regu.map((m) => (
						<Chip key={m.id} className={REGU_STATE[m.state].className}>
							{getFirstName(m.name, m.name)} - {REGU_STATE[m.state].label}
						</Chip>
					))}
					{mission.agencies.map((a) => (
						<Chip
							key={a.name}
							icon={IconBuildingCommunity}
							className={
								a.waiting
									? 'border-warning/30 bg-warning/10 text-warning'
									: 'border-border bg-muted text-muted-foreground'
							}
						>
							{a.name}
							{a.waiting && ' - belum konfirmasi'}
						</Chip>
					))}
				</div>
			)}

			<div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
				{!arrived && (
					<Button
						className="col-span-2 h-11 rounded-xl sm:col-span-1"
						disabled={busy}
						onClick={() => onArrive(mission)}
					>
						<IconCheck className="mr-1.5 h-4 w-4" /> Tiba di Lokasi
					</Button>
				)}
				{mission.lat && mission.lng && (
					<Button variant="outline" className="h-11 rounded-xl" asChild>
						<a href={directionsUrl(mission.lat, mission.lng)} target="_blank" rel="noreferrer">
							<IconNavigation className="mr-1.5 h-4 w-4" /> Navigasi
						</a>
					</Button>
				)}
				<Button variant="outline" className="h-11 rounded-xl" asChild>
					<Link href={route('reports.show', mission.id)}>Detail</Link>
				</Button>
			</div>
		</Card>
	);
}

function MissionRow({ mission, now }) {
	const { Icon: MissionIcon, className: iconStyle } = reportIcon(mission);
	const responders = (mission.officers_count ?? 0) + (mission.helpers_count ?? 0);

	return (
		<AppListRow
			href={route('reports.show', mission.id)}
			leading={
				<div className={cn('shrink-0 rounded-xl p-2 md:p-2.5', iconStyle)}>
					<MissionIcon className="h-5 w-5" stroke={2} />
				</div>
			}
			title={mission.title}
			aside={
				<span className={cn('tabular-nums', mission.status === 'pending' && 'font-bold text-destructive')}>
					{formatDuration(mission.created_at, now)}
				</span>
			}
			meta={
				<>
					<span className="hidden font-mono font-semibold md:inline">{reportNumber(mission)}</span>
					<span className="flex items-start gap-1.5">
						<IconMapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
						<span>{mission.location}</span>
					</span>
					{mission.distKm != null && (
						<span className="flex shrink-0 items-center gap-1.5 font-semibold text-foreground">
							<IconRuler2 className="h-3.5 w-3.5 shrink-0" />
							{`± ${mission.distKm < 10 ? mission.distKm.toFixed(1) : Math.round(mission.distKm)} km garis lurus`}
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
					{responders === 0 ? (
						<Chip className="border-destructive/30 bg-destructive/10 text-destructive">
							Belum ada yang meluncur
						</Chip>
					) : (
						<Chip className="border-border bg-muted text-muted-foreground">
							{mission.officers_count} petugas
							{mission.helpers_count > 0 && `, ${mission.helpers_count} relawan`}
						</Chip>
					)}
					{mission.i_stay && <Chip className="border-info/30 bg-info/10 text-info">Anda jaga kantor</Chip>}
				</>
			}
		/>
	);
}

/** Baris aksi cepat di BAWAH baris misi - bukan di dalamnya: baris adalah satu tautan, tombol tak boleh bersarang. */
function QuickActions({ mission, canStay, busy, onDispatch, onStay }) {
	if (mission.i_stay) return null;

	return (
		<div className="flex gap-2 px-4 pb-3.5 md:px-5 md:pb-4">
			<Button className="h-10 flex-1 rounded-xl" disabled={busy} onClick={() => onDispatch(mission)}>
				Meluncur
			</Button>
			{canStay && (
				<Button
					variant="outline"
					className="h-10 flex-1 rounded-xl"
					disabled={busy}
					onClick={() => onStay(mission)}
				>
					Jaga di Kantor
				</Button>
			)}
		</div>
	);
}

export default function PetugasDashboard({
	auth,
	activeMissions = [],
	pendingResolutions = [],
	myRegu = null,
	myMissions = [],
	reguBoard = [],
	feed_channel = null,
	tenant_location = null,
}) {
	const user = auth.user;
	const now = useNow();
	const realtime = REALTIME_META[useRealtimeStatus()];
	const [busyId, setBusyId] = useState(null);
	const [showAllRegu, setShowAllRegu] = useState(false);
	const visibleReguBoard = showAllRegu ? reguBoard : reguBoard.slice(0, REGU_BOARD_LIMIT);

	// Misi baru muncul / berubah / selesai di wilayah penugasan -> muat ulang bagian yang hidup.
	useReportFeed(feed_channel, () => router.reload({ only: LIVE_PROPS }));

	const firstName = getFirstName(user?.name, 'Komandan');

	// Peta taktis misi — petugas adalah peran lapangan yang paling butuh peta.
	// Pola Leaflet manual (window.L sudah dimuat global di app.blade.php).
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

	const missions = activeMissions.map((m) => ({
		...m,
		distKm: myPos && m.lat && m.lng ? distanceKm(myPos.lat, myPos.lng, parseFloat(m.lat), parseFloat(m.lng)) : null,
	}));

	// TASK_51: `TERLAPOR` menunggu verifikasi ADMIN - bukan wewenang petugas, jadi bukan misi yang bisa
	// ia tindak. Ia hanya dihitung di satu baris tenang supaya petugas bisa bersiap.
	const awaitingCount = missions.filter((m) => m.status === 'TERLAPOR').length;
	const myIds = new Set(myMissions.map((m) => m.id));
	const open = missions.filter((m) => m.status !== 'TERLAPOR' && !myIds.has(m.id));
	// Butuh unit = terverifikasi tapi belum satu pun responder bergerak (status masih `pending`).
	// Urut jarak bila GPS petugas diketahui, selain itu terlama menunggu dulu.
	const needUnit = open
		.filter((m) => m.status === 'pending')
		.sort((a, b) =>
			a.distKm != null && b.distKm != null
				? a.distKm - b.distKm
				: new Date(a.created_at) - new Date(b.created_at),
		);
	const handled = open.filter((m) => m.status !== 'pending');
	const actionableCount = needUnit.length + handled.length;

	const dispatch = async (mission) => {
		setBusyId(mission.id);
		const location = await getClickLocation();
		router.post(route('reports.take-action', mission.id), location, {
			preserveScroll: true,
			onSuccess: () => {
				toast.success('Meluncur ke lokasi. Pelacakan posisi berjalan di halaman insiden.');
				// Pelacakan GPS langsung hanya hidup di halaman detail - buka sekarang.
				router.visit(route('reports.show', mission.id));
			},
			onError: () => toast.error('Gagal meluncur. Coba lagi dari halaman insiden.'),
			onFinish: () => setBusyId(null),
		});
	};

	const stayAtBase = async (mission) => {
		setBusyId(mission.id);
		const location = await getClickLocation();
		router.post(route('reports.stay-at-base', mission.id), location, {
			preserveScroll: true,
			onSuccess: () => toast.success('Anda tercatat Jaga di Kantor.'),
			onError: (errors) => toast.error(errors.jaga_kantor || 'Gagal mencatat Jaga di Kantor.'),
			onFinish: () => setBusyId(null),
		});
	};

	const arrive = (mission) => {
		setBusyId(mission.id);
		router.post(
			route('reports.arrive', mission.id),
			{},
			{
				preserveScroll: true,
				// Satu ketukan menandai SEREGU tiba (TASK_66).
				onSuccess: () =>
					toast.success(
						myRegu
							? 'Tiba di lokasi. Anggota regu yang meluncur ikut ditandai tiba.'
							: 'Status diperbarui: Tiba di lokasi.',
					),
				onFinish: () => setBusyId(null),
			},
		);
	};

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
		<div className="flex w-full flex-col space-y-6 pb-32 lg:space-y-8">
			<Head title="Dashboard Operasional" />

			<AppGreeting
				title={`Siaga, ${firstName}!`}
				meta={
					<>
						{myRegu ? (
							<span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground md:text-sm">
								<IconShieldHalf className="h-3.5 w-3.5 text-destructive md:h-4 md:w-4" />
								{myRegu.name}
								{myRegu.is_leader && ' - Danru'}
							</span>
						) : (
							<span className="text-[13px] font-medium text-muted-foreground md:text-sm">
								Petugas Damkar - belum beregu
							</span>
						)}
						<span
							className={cn(
								'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
								realtime.className,
							)}
						>
							<span className={cn('h-1.5 w-1.5 rounded-full', realtime.dot)} />
							{realtime.label}
						</span>
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
				<div className="space-y-6 lg:col-span-2 lg:space-y-8">
					{/* MODE DARURAT: misi saya mengambil alih puncak. MODE TENANG: kepala hijau. */}
					{myMissions.length > 0 ? (
						<div className="space-y-3">
							{myMissions.map((mission) => (
								<MyMissionCard
									key={mission.id}
									mission={mission}
									now={now}
									busy={busyId === mission.id}
									onArrive={arrive}
								/>
							))}
						</div>
					) : (
						actionableCount === 0 && (
							<Card className="flex items-center gap-3 rounded-2xl border-success/30 bg-success/10 p-4 shadow-none md:p-5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
									<IconShieldCheck className="h-6 w-6" stroke={2} />
								</div>
								<div>
									<h2 className="text-[15px] font-semibold text-success">
										Siaga - tidak ada misi aktif
									</h2>
									<p className="text-[13px] text-success/80">
										Misi baru muncul di sini begitu admin memverifikasi laporan.
									</p>
								</div>
							</Card>
						)
					)}

					{needUnit.length > 0 && (
						<AppSection title="Butuh Unit" count={needUnit.length}>
							<AppList>
								{needUnit.map((mission) => (
									<div key={mission.id}>
										<MissionRow mission={mission} now={now} />
										<QuickActions
											mission={mission}
											canStay={Boolean(myRegu)}
											busy={busyId === mission.id}
											onDispatch={dispatch}
											onStay={stayAtBase}
										/>
									</div>
								))}
							</AppList>
						</AppSection>
					)}

					{handled.length > 0 && (
						<AppSection title="Sedang Ditangani" count={handled.length}>
							<AppList>
								{handled.map((mission) => (
									<MissionRow key={mission.id} mission={mission} now={now} />
								))}
							</AppList>
						</AppSection>
					)}

					{awaitingCount > 0 && (
						<div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-card px-4 py-3 text-[13px] text-muted-foreground shadow-sm">
							<IconHourglass className="h-4 w-4 shrink-0 text-warning" stroke={2} />
							<span>
								<strong className="text-foreground">{awaitingCount} laporan</strong> menunggu verifikasi
								admin. Belum ada tindakan untuk Anda.
							</span>
						</div>
					)}

					{pendingResolutions.length > 0 && (
						<AppSection title="Laporan Kejadian Belum Dibuat" count={pendingResolutions.length}>
							<AppList>
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
											/* Antrian ini hanya berisi insiden yang BELUM punya entri sama sekali
											   (TASK_49); entri final ditutup admin. */
											<span className="inline-flex h-7 items-center rounded-full bg-warning px-3 text-[13px] font-semibold text-warning-foreground">
												Isi entri sementara
											</span>
										}
									/>
								))}
							</AppList>
						</AppSection>
					)}
				</div>

				<div className="space-y-6 lg:space-y-8">
					{/* Papan regu untuk danru: siapa yang belum memilih, selagi masih bisa diingatkan. */}
					{reguBoard.length > 0 && (
						<AppSection title={`Regu ${myRegu?.name ?? ''}`.trim()}>
							<div className="space-y-3">
								{visibleReguBoard.map((row) => {
									// Ringkas: hitungan per keadaan dalam satu baris; HANYA yang belum memilih disebut
									// namanya - merekalah yang perlu dihubungi danru.
									const count = (state) => row.members.filter((m) => m.state === state).length;
									const undecided = row.members.filter((m) => m.state === 'belum');
									const summary = [
										count('tiba') && `${count('tiba')} tiba`,
										count('meluncur') && `${count('meluncur')} meluncur`,
										count('jaga') && `${count('jaga')} jaga kantor`,
									]
										.filter(Boolean)
										.join(', ');

									return (
										<div
											key={row.id}
											className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
										>
											<Link
												href={route('reports.show', row.id)}
												className="text-[15px] font-semibold text-foreground hover:underline"
											>
												{row.title}
											</Link>
											<div className="mt-1 text-[13px] text-muted-foreground">{summary}</div>
											{undecided.length > 0 ? (
												<div className="mt-2 flex flex-wrap gap-1.5">
													{undecided.map((m) => (
														<Chip key={m.id} className={REGU_STATE.belum.className}>
															{getFirstName(m.name, m.name)} - belum memilih
														</Chip>
													))}
												</div>
											) : (
												<div className="mt-1 text-[13px] font-medium text-success">
													Semua anggota sudah memilih
												</div>
											)}
										</div>
									);
								})}
								{reguBoard.length > REGU_BOARD_LIMIT && (
									<Button
										variant="outline"
										className="h-10 w-full rounded-xl"
										onClick={() => setShowAllRegu((v) => !v)}
									>
										{showAllRegu
											? 'Tampilkan lebih sedikit'
											: `Tampilkan semua (${reguBoard.length})`}
									</Button>
								)}
							</div>
						</AppSection>
					)}

					<AppSection title="Peta Taktis">
						{/* Tak pernah menempel tepi layar (keputusan user 2026-09-09) - tetap bermargin. */}
						<Card className="relative flex h-[300px] flex-col overflow-hidden rounded-2xl sm:h-[360px]">
							<div ref={miniMapRef} className="z-0 h-full w-full bg-accent/30"></div>
							{missionsWithCoords.length === 0 && (
								<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px]">
									<IconMapPin className="mb-2 h-8 w-8 text-muted-foreground/50" />
									<p className="text-xs font-medium text-muted-foreground">Belum ada titik misi</p>
								</div>
							)}
						</Card>
					</AppSection>
				</div>
			</div>
		</div>
	);
}

PetugasDashboard.layout = (page) => <AppLayout children={page} title="Dashboard Petugas" />;
