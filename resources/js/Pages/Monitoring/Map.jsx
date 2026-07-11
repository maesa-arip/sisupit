import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { cn, MAP_TILE_URL } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import {
	IconAdjustmentsHorizontal,
	IconChevronDown,
	IconDroplet,
	IconEye,
	IconEyeOff,
	IconFireHydrant,
	IconFiretruck,
	IconFlame,
	IconHeartHandshake,
	IconMapPin,
	IconMaximize,
	IconMinimize,
	IconX,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Metadata status kejadian — selaras dengan Components/StatusBadge (token semantik).
const REPORT_STATUS = [
	{ key: 'TERLAPOR', label: 'Laporan Masuk', pin: 'text-destructive animate-pulse', dot: 'bg-destructive', badge: 'bg-destructive/10 text-destructive border-destructive/30' },
	{ key: 'pending', label: 'Laporan Terverifikasi', pin: 'text-warning', dot: 'bg-warning', badge: 'bg-warning/10 text-warning border-warning/30' },
	{ key: 'handling', label: 'Penanganan', pin: 'text-success', dot: 'bg-success', badge: 'bg-success/10 text-success border-success/30' },
	{ key: 'resolved', label: 'Selesai', pin: 'text-info', dot: 'bg-info', badge: 'bg-info/10 text-info border-info/30' },
];
const REPORT_META = Object.fromEntries(REPORT_STATUS.map((s) => [s.key, s]));

// Glyph di dalam lingkaran marker. Fasilitas memakai path ikon Tabler asli (stroke,
// samakan dgn ikon di app: fire-hydrant / firetruck / droplet). Relawan tetap ikon
// sosok orang (fill). Warna lingkaran fasilitas ditentukan status (lihat facilityColor).
const GLYPH = {
	hydrant:
		'<path d="M5 21h14"/><path d="M17 21v-5h1a1 1 0 0 0 1 -1v-2a1 1 0 0 0 -1 -1h-1v-4a5 5 0 0 0 -10 0v4h-1a1 1 0 0 0 -1 1v2a1 1 0 0 0 1 1h1v5"/><path d="M12 14m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M6 8h12"/>',
	pump: '<path d="M7.502 19.423c2.602 2.105 6.395 2.105 8.996 0c2.602 -2.105 3.262 -5.708 1.566 -8.546l-4.89 -7.26c-.42 -.625 -1.287 -.803 -1.936 -.397a1.376 1.376 0 0 0 -.41 .397l-4.893 7.26c-1.695 2.838 -1.035 6.441 1.567 8.546z"/>',
	station:
		'<path d="M5 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M7 18h8m4 0h2v-6a5 5 0 0 0 -5 -5h-1l1.5 5h4.5"/><path d="M12 18v-11h3"/><path d="M3 17l0 -5l9 0"/><path d="M3 9l18 -6"/><path d="M6 12l0 -4"/>',
	volunteer: '<path d="M12 4a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 20a6 6 0 0 1 12 0z"/>',
};

// Warna lingkaran marker fasilitas berdasarkan status: Aktif = biru, Perbaikan = merah.
const facilityColor = (status) => (status === 'Perbaikan' ? 'bg-destructive' : 'bg-info');

const LAYERS = [
	{ key: 'reports', label: 'Kejadian', icon: IconFlame, color: 'text-destructive', chip: 'status' },
	{ key: 'hydrants', label: 'Hydrant', icon: IconFireHydrant, color: 'text-teal-600 dark:text-teal', chip: 'facility' },
	{ key: 'stations', label: 'Pos Pemadam', icon: IconFiretruck, color: 'text-destructive', chip: 'facility' },
	{ key: 'pumps', label: 'SKKL / Pompa', icon: IconDroplet, color: 'text-info', chip: 'facility' },
	{ key: 'volunteers', label: 'Relawan', icon: IconHeartHandshake, color: 'text-volunteer', chip: 'volunteer' },
];

export default function MonitoringMap({ layers }) {
	const mapRef = useRef(null);
	const mapInstanceRef = useRef(null);
	const groupsRef = useRef({});
	const [panelOpen, setPanelOpen] = useState(false);
	const [panelCollapsed, setPanelCollapsed] = useState(false);
	const [isMaximized, setIsMaximized] = useState(false);

	const reports = layers?.reports ?? [];
	const hydrants = layers?.hydrants ?? [];
	const stations = layers?.stations ?? [];
	const pumps = layers?.pumps ?? [];
	const volunteers = layers?.volunteers ?? [];

	// Visibilitas layer & sub-filter (Set berisi status yang DISEMBUNYIKAN).
	const [visible, setVisible] = useState({ reports: true, hydrants: true, stations: true, pumps: true, volunteers: true });
	const [reportHidden, setReportHidden] = useState(() => new Set(['ditolak']));
	const [hydrantHidden, setHydrantHidden] = useState(() => new Set());
	const [stationHidden, setStationHidden] = useState(() => new Set());
	const [pumpHidden, setPumpHidden] = useState(() => new Set());
	const [volunteerHidden, setVolunteerHidden] = useState(() => new Set());

	// Status unik tiap layer fasilitas (untuk render chip filter).
	const hydrantStatuses = useMemo(() => [...new Set(hydrants.map((h) => h.status))], [hydrants]);
	const stationStatuses = useMemo(() => [...new Set(stations.map((s) => s.status))], [stations]);
	const pumpStatuses = useMemo(() => [...new Set(pumps.map((p) => p.status))], [pumps]);
	const volunteerStatuses = useMemo(() => [...new Set(volunteers.map((v) => v.status))], [volunteers]);

	const toggleHidden = (setter) => (value) =>
		setter((prev) => {
			const next = new Set(prev);
			next.has(value) ? next.delete(value) : next.add(value);
			return next;
		});

	// Inisialisasi peta sekali.
	useEffect(() => {
		if (!mapRef.current || !window.L) return;

		const map = window.L.map(mapRef.current, { zoomControl: false }).setView([-8.65, 115.216667], 11);
		window.L.tileLayer(MAP_TILE_URL).addTo(map);
		window.L.control.zoom({ position: 'bottomright' }).addTo(map);

		groupsRef.current = {
			reports: window.L.layerGroup().addTo(map),
			hydrants: window.L.layerGroup().addTo(map),
			stations: window.L.layerGroup().addTo(map),
			pumps: window.L.layerGroup().addTo(map),
			volunteers: window.L.layerGroup().addTo(map),
		};
		mapInstanceRef.current = map;

		return () => {
			map.remove();
			mapInstanceRef.current = null;
		};
	}, []);

	// Bangun ulang marker tiap kali filter/visibilitas berubah.
	useEffect(() => {
		const map = mapInstanceRef.current;
		const groups = groupsRef.current;
		if (!map || !groups.reports || !window.L) return;

		const reportPin = (status) =>
			window.L.divIcon({
				html: `<div class="${(REPORT_META[status] || REPORT_META.pending).pin}"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
				className: 'bg-transparent border-none filter drop-shadow-md',
				iconSize: [30, 30],
				iconAnchor: [15, 30],
			});

		const glyphIcon = (bgClass, glyph, { dashed = false, stroke = true } = {}) => {
			const svgAttrs = stroke
				? 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
				: 'fill="currentColor"';
			return window.L.divIcon({
				html: `<div class="flex h-8 w-8 items-center justify-center rounded-full border-2 ${dashed ? 'border-dashed border-white/90' : 'border-white'} text-white shadow-md ${bgClass}"><svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" ${svgAttrs}>${glyph}</svg></div>`,
				className: 'bg-transparent border-none',
				iconSize: [32, 32],
				iconAnchor: [16, 16],
			});
		};

		const popupShell = (inner) => `<div class="font-sans w-[210px] space-y-1.5">${inner}</div>`;
		const facilityPopup = (title, address, status, extra = '') =>
			popupShell(`
				<h4 class="m-0 text-[13px] font-bold leading-snug text-foreground">${title}</h4>
				<div class="flex items-start gap-1.5 text-[11px] font-medium text-muted-foreground">
					<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-px shrink-0"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>
					<span>${address || 'Alamat tidak tersedia'}</span>
				</div>
				${extra}
				<span class="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">${status || '-'}</span>`);

		const allMarkers = [];

		// --- Kejadian ---
		groups.reports.clearLayers();
		if (visible.reports) {
			reports.forEach((r) => {
				if (reportHidden.has(r.status)) return;
				const meta = REPORT_META[r.status] || REPORT_META.pending;
				const html = popupShell(`
					<h4 class="m-0 text-[13px] font-bold leading-snug text-foreground">${r.title}</h4>
					<div class="space-y-1 text-[11px] font-medium text-muted-foreground">
						<div class="flex items-start gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-px shrink-0"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg><span>${r.location || 'Lokasi tidak tersedia'}</span></div>
						<div class="flex items-center gap-1.5"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span>${r.time || ''}</span></div>
					</div>
					<span class="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${meta.badge}">${meta.label}</span>`);
				const m = window.L.marker([r.lat, r.lng], { icon: reportPin(r.status) }).bindPopup(html);
				groups.reports.addLayer(m);
				allMarkers.push(m);
			});
		}

		// --- Fasilitas (ikon = jenis, warna lingkaran = status: Aktif biru / Perbaikan merah) ---
		const facilityLayer = (key, data, hidden, glyph, popupFn) => {
			groups[key].clearLayers();
			if (!visible[key]) return;
			data.forEach((d) => {
				if (hidden.has(d.status)) return;
				const m = window.L.marker([d.lat, d.lng], { icon: glyphIcon(facilityColor(d.status), glyph) }).bindPopup(popupFn(d));
				groups[key].addLayer(m);
				allMarkers.push(m);
			});
		};

		facilityLayer('hydrants', hydrants, hydrantHidden, GLYPH.hydrant, (d) =>
			facilityPopup(d.name, d.address, d.status, `<div class="text-[11px] font-medium text-muted-foreground">Jenis: ${d.type || '-'}</div>`),
		);
		facilityLayer('stations', stations, stationHidden, GLYPH.station, (d) =>
			facilityPopup(
				d.name,
				d.address,
				d.status,
				`<div class="text-[11px] font-medium text-muted-foreground">${d.type || 'Pos'} • Telp: ${d.phone || '112'}</div>`,
			),
		);
		facilityLayer('pumps', pumps, pumpHidden, GLYPH.pump, (d) =>
			facilityPopup(d.name, d.address, d.status, `<div class="text-[11px] font-medium text-muted-foreground">Jenis: ${d.type || '-'}</div>`),
		);

		// --- Relawan (ikon sosok orang tetap, lingkaran ungu, garis putus = posisi perkiraan) ---
		groups.volunteers.clearLayers();
		if (visible.volunteers) {
			volunteers.forEach((d) => {
				if (volunteerHidden.has(d.status)) return;
				const html = popupShell(`
					<h4 class="m-0 text-[13px] font-bold leading-snug text-foreground">${d.name}</h4>
					<div class="flex items-start gap-1.5 text-[11px] font-medium text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mt-px shrink-0"><path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg><span>${d.area || '-'}</span></div>
					${d.skills?.length ? `<div class="text-[11px] font-medium text-muted-foreground">Keahlian: ${d.skills.join(', ')}</div>` : ''}
					<div class="text-[10px] italic text-muted-foreground/80">Posisi perkiraan (pusat wilayah)</div>
					<span class="inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold ${d.status === 'Siaga' ? 'bg-success/10 text-success border-success/30' : 'bg-muted text-muted-foreground border-border'}">${d.status}</span>`);
				const m = window.L.marker([d.lat, d.lng], {
					icon: glyphIcon('bg-volunteer', GLYPH.volunteer, { dashed: true, stroke: false }),
				}).bindPopup(html);
				groups.volunteers.addLayer(m);
				allMarkers.push(m);
			});
		}

		// Auto zoom: sesuaikan tampilan peta agar pas dengan marker yang sedang
		// ditampilkan (mengecil/membesar mengikuti layer & filter yang dipilih).
		// padding kecil (px) agar mepet ke marker; maxZoom cegah over-zoom saat 1 marker.
		if (allMarkers.length > 0) {
			const bounds = new window.L.featureGroup(allMarkers).getBounds();
			map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
		}
	}, [
		visible,
		reportHidden,
		hydrantHidden,
		stationHidden,
		pumpHidden,
		volunteerHidden,
		reports,
		hydrants,
		stations,
		pumps,
		volunteers,
	]);

	// Saat toggle fullscreen, ukuran kontainer berubah → Leaflet perlu invalidateSize.
	useEffect(() => {
		const map = mapInstanceRef.current;
		if (!map) return;
		const id = setTimeout(() => map.invalidateSize(), 260);
		return () => clearTimeout(id);
	}, [isMaximized]);

	// Esc untuk keluar dari mode fullscreen.
	useEffect(() => {
		if (!isMaximized) return;
		const onKey = (e) => e.key === 'Escape' && setIsMaximized(false);
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isMaximized]);

	const layerCount = {
		reports: reports.length,
		hydrants: hydrants.length,
		stations: stations.length,
		pumps: pumps.length,
		volunteers: volunteers.length,
	};

	const StatusChip = ({ active, label, dot, onClick }) => (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
				active ? 'bg-muted text-foreground' : 'text-muted-foreground/50 line-through hover:text-muted-foreground',
			)}
		>
			{dot && <span className={cn('h-1.5 w-1.5 rounded-full', active ? dot : 'bg-muted-foreground/40')} />}
			{label}
		</button>
	);

	const LayerBlock = ({ layer, last }) => {
		const on = visible[layer.key];
		const Icon = layer.icon;
		return (
			<div className={cn('py-2', !last && 'border-b border-border/50')}>
				<button
					type="button"
					onClick={() => setVisible((v) => ({ ...v, [layer.key]: !v[layer.key] }))}
					className="flex w-full items-center gap-2.5 text-left"
				>
					<Icon className={cn('h-4 w-4 shrink-0', on ? layer.color : 'text-muted-foreground/40')} stroke={2} />
					<span className={cn('text-[13px] font-semibold', on ? 'text-foreground' : 'text-muted-foreground/50')}>
						{layer.label}
					</span>
					<span className="ml-auto text-[11px] font-medium tabular-nums text-muted-foreground/70">
						{layerCount[layer.key]}
					</span>
					{on ? (
						<IconEye className="h-4 w-4 text-muted-foreground" stroke={2} />
					) : (
						<IconEyeOff className="h-4 w-4 text-muted-foreground/40" stroke={2} />
					)}
				</button>

				{on && layer.chip === 'status' && (
					<div className="mt-1.5 flex flex-wrap gap-1 pl-6">
						{REPORT_STATUS.map((s) => (
							<StatusChip
								key={s.key}
								label={s.label}
								active={!reportHidden.has(s.key)}
								dot={s.dot}
								onClick={() => toggleHidden(setReportHidden)(s.key)}
							/>
						))}
					</div>
				)}

				{on && layer.chip === 'facility' && (
					<div className="mt-1.5 flex flex-wrap gap-1 pl-6">
						{(layer.key === 'hydrants' ? hydrantStatuses : layer.key === 'stations' ? stationStatuses : pumpStatuses).map((s) => {
							const hidden = layer.key === 'hydrants' ? hydrantHidden : layer.key === 'stations' ? stationHidden : pumpHidden;
							const setter = layer.key === 'hydrants' ? setHydrantHidden : layer.key === 'stations' ? setStationHidden : setPumpHidden;
							return <StatusChip key={s} label={s} active={!hidden.has(s)} onClick={() => toggleHidden(setter)(s)} />;
						})}
					</div>
				)}

				{on && layer.chip === 'volunteer' && (
					<div className="mt-1.5 flex flex-wrap gap-1 pl-6">
						{volunteerStatuses.map((s) => (
							<StatusChip
								key={s}
								label={s}
								active={!volunteerHidden.has(s)}
								dot={s === 'Siaga' ? 'bg-success' : 'bg-muted-foreground'}
								onClick={() => toggleHidden(setVolunteerHidden)(s)}
							/>
						))}
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			className={cn(
				'relative w-full overflow-hidden border-border bg-accent/30 shadow-sm',
				isMaximized
					? 'fixed inset-0 z-[200] h-screen w-screen rounded-none border-0'
					: 'h-[calc(100vh-8rem)] rounded-2xl border lg:h-[calc(100vh-6rem)]',
			)}
		>
			<Head title="Peta Pemantauan" />

			<div ref={mapRef} className="z-0 h-full w-full bg-accent/30" />

			{/* Header melayang */}
			<div className="pointer-events-none absolute left-0 right-0 top-0 z-[10] flex items-center justify-between gap-2 p-3 sm:p-4">
				<div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-sm">
					<IconMapPin className="h-4 w-4 text-teal-600 dark:text-teal" stroke={2.5} />
					<span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700 dark:text-teal sm:text-xs">
						Peta Pemantauan
					</span>
				</div>
				<div className="pointer-events-auto flex items-center gap-2">
					<button
						type="button"
						onClick={() => setIsMaximized((v) => !v)}
						aria-label={isMaximized ? 'Perkecil peta' : 'Perbesar peta'}
						className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card/90 text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:bg-muted hover:text-foreground"
					>
						{isMaximized ? <IconMinimize className="h-4 w-4" stroke={2} /> : <IconMaximize className="h-4 w-4" stroke={2} />}
					</button>
					<Button
						type="button"
						onClick={() => setPanelOpen((v) => !v)}
						className="rounded-xl bg-foreground text-background shadow-sm hover:bg-foreground/90 lg:hidden"
						size="sm"
					>
						<IconAdjustmentsHorizontal className="mr-1.5 h-4 w-4" /> Filter
					</Button>
				</div>
			</div>

			{/* Panel filter — tinggi mengikuti konten (tidak memenuhi layar ke bawah) */}
			<div
				className={cn(
					'absolute left-0 top-0 z-[20] w-full max-w-[15rem] transition-transform duration-300 lg:translate-x-0',
					panelOpen ? 'translate-x-0' : '-translate-x-full',
				)}
			>
				<div className="m-3 mt-16 flex max-h-[calc(100%-5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card/95 shadow-lg backdrop-blur-sm">
					<div className="flex items-center gap-1 px-3 py-2">
						<button
							type="button"
							onClick={() => setPanelCollapsed((v) => !v)}
							className="flex flex-1 items-center gap-1.5 text-left"
							aria-expanded={!panelCollapsed}
						>
							<IconChevronDown
								className={cn('h-4 w-4 text-muted-foreground transition-transform', panelCollapsed ? '' : 'rotate-180')}
								stroke={2}
							/>
							<h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Layer</h2>
						</button>
						<button
							type="button"
							onClick={() => setPanelOpen(false)}
							className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
							aria-label="Tutup filter"
						>
							<IconX className="h-4 w-4" />
						</button>
					</div>
					{!panelCollapsed && (
						<div className="no-scrollbar overflow-y-auto border-t border-border/50 px-3 pb-1">
							{LAYERS.map((layer, i) => (
								<LayerBlock key={layer.key} layer={layer} last={i === LAYERS.length - 1} />
							))}
						</div>
					)}
				</div>
			</div>

			{/* Overlay gelap saat panel terbuka di mobile */}
			{panelOpen && (
				<div className="absolute inset-0 z-[15] bg-black/30 lg:hidden" onClick={() => setPanelOpen(false)} />
			)}
		</div>
	);
}

MonitoringMap.layout = (page) => <AppLayout children={page} title="Peta Pemantauan" />;
