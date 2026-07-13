import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { cn, GEO_OPTIONS, MAP_TILE_URL, reportNumber } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconArrowBackUp,
	IconCheck,
	IconChevronLeft,
	IconFileText,
	IconFiretruck,
	IconFlag,
	IconLoader2,
	IconMap,
	IconMapPin,
	IconPhone,
	IconPlus,
	IconRadar,
	IconShieldCheck,
	IconTrash,
	IconTruck,
	IconUser,
	IconUsersGroup,
	IconX,
	IconZoomIn,
} from '@tabler/icons-react';
import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// Ambil ulang rute jalan hanya saat responder bergeser lebih dari ambang ini (meter),
// supaya pergerakan kecil tidak terus-menerus memanggil OSRM.
const ROUTE_REFETCH_METERS = 30;

// Sakelar fitur: panel "Pengerahan Armada" disembunyikan sementara (keputusan user
// 2026-06-29) karena masih terpisah dari pelacakan petugas. Set true untuk menampilkannya
// kembali — seluruh backend & alur dispatch/release tetap utuh.
const SHOW_ARMADA_PANEL = false;

// Jarak haversine kasar (meter) antara dua titik koordinat.
function distanceMeters(lat1, lng1, lat2, lng2) {
	const R = 6371000;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

// Gerakkan marker Leaflet secara halus dari posisi sekarang ke posisi baru (interpolasi),
// supaya pergerakan responden "maju" mulus alih-alih melompat tiap update dari database.
// Lompatan jauh (mis. data awal saat halaman dibuka) langsung diset tanpa animasi.
function animateMarkerTo(marker, to, duration = 1500) {
	if (marker._moveRaf) cancelAnimationFrame(marker._moveRaf);
	const from = marker.getLatLng();
	if (distanceMeters(from.lat, from.lng, to[0], to[1]) > 1500) {
		marker.setLatLng(to);
		return;
	}
	const start = performance.now();
	const tick = (now) => {
		const t = Math.min(1, (now - start) / duration);
		const e = t * (2 - t); // easeOutQuad
		marker.setLatLng([from.lat + (to[0] - from.lat) * e, from.lng + (to[1] - from.lng) * e]);
		if (t < 1) marker._moveRaf = requestAnimationFrame(tick);
	};
	marker._moveRaf = requestAnimationFrame(tick);
}

export default function ReportShow(props) {
	const auth = props.auth;
	const report = props.report;

	const mapRef = useRef(null);
	const mapInstance = useRef(null);
	const markersRef = useRef({});
	const incidentMarkerRef = useRef(null);
	// Garis rute jalan asli (mengikuti jalan via OSRM) dari posisi responder ke titik insiden
	const routeLinesRef = useRef({});
	// Cache rute per responder: { originLat, originLng, incLat, incLng, coords } agar tidak
	// memanggil OSRM tiap redraw / pergerakan kecil
	const routeCacheRef = useRef({});
	// Pas-kan batas peta hanya sekali di awal supaya tidak melompat tiap update posisi
	const hasFitRef = useRef(false);

	const [officerList, setOfficerList] = useState(report.officers || []);
	const [helperList, setHelperList] = useState(report.helpers || []);
	// Status & alasan tolak disimpan di state agar bisa update real-time via broadcast
	// ReportStatusChanged (FINDINGS #28) tanpa refresh halaman.
	const [reportStatus, setReportStatus] = useState(report.status);
	const [rejectedReason, setRejectedReason] = useState(report.rejected_reason);
	// Galeri foto (FINDINGS #17): pakai relasi photos bila ada, fallback ke kolom `photo` lama.
	const photos =
		report.photos && report.photos.length > 0
			? report.photos.map((p) => p.path)
			: report.photo
				? [report.photo]
				: [];
	const [modalPhoto, setModalPhoto] = useState(null);

	const [confirmApprove, setConfirmApprove] = useState(false);
	const [confirmReject, setConfirmReject] = useState(false);
	const [rejectReason, setRejectReason] = useState('');
	const [confirmResolve, setConfirmResolve] = useState(false);

	// Pengerahan unit/armada (TASK_09): daftar unit tersedia ter-scope wilayah dari server,
	// unit yang sedang dikerahkan dibaca dari relasi report_units.
	const availableUnits = props.availableUnits || [];
	const unitsTotal = props.unitsTotal || 0;
	const canManageUnits = props.canManageUnits || false;
	const dispatchedUnits = (report.report_units || []).filter((ru) => ru.status === 'dispatched');
	// Bedakan kenapa tidak ada unit yang bisa dipilih: wilayah belum punya unit sama
	// sekali, vs ada unit tapi semuanya sedang bertugas.
	const noUnitsRegistered = unitsTotal === 0;
	const allUnitsBusy = unitsTotal > 0 && availableUnits.length === 0;
	const [unitToDispatch, setUnitToDispatch] = useState('');
	const [isUnitProcessing, setIsUnitProcessing] = useState(false);

	// Berita Acara / Laporan Kegiatan Penyelamatan (FINDINGS #39) — staf saja. Append-only:
	// banyak entri (sementara/final) yang bisa dibandingkan.
	const resolutions = props.resolutions || [];
	const canManageResolution = props.canManageResolution || false;
	const [resolutionToDelete, setResolutionToDelete] = useState(null);
	const [isDeletingResolution, setIsDeletingResolution] = useState(false);

	const [isProcessing, setIsProcessing] = useState(false);
	const [isActionLoading, setIsActionLoading] = useState(false);

	// Titik insiden bisa dikoreksi oleh responder yang sudah tiba (lihat handleConfirmCorrection)
	const [incidentLocation, setIncidentLocation] = useState({
		lat: report.lat,
		lng: report.lng,
		address: report.address,
	});
	const [isCorrectingMode, setIsCorrectingMode] = useState(false);
	const [pendingPosition, setPendingPosition] = useState(null);
	const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

	const userRoles = Array.isArray(auth.user?.role) ? auth.user.role : auth.user?.role ? [auth.user.role] : [];
	const isStaffOrAdmin = userRoles.some((r) => ['admin', 'superadmin', 'petugas'].includes(r));
	const isRelawan = userRoles.includes('relawan');
	const isOwner = auth.user?.id === report.user_id;

	useEffect(() => {
		setOfficerList(props.report.officers || []);
		setHelperList(props.report.helpers || []);
		setReportStatus(props.report.status);
		setRejectedReason(props.report.rejected_reason);
	}, [props.report]);

	const myOfficerRecord = officerList.find((o) => o.user_id === auth.user.id);
	const myHelperRecord = helperList.find((h) => h.user_id === auth.user.id);
	const myRecord = myOfficerRecord || myHelperRecord;
	const isCurrentlyResponding = myRecord && myRecord.status !== 'finished';

	// -----------------------------------------------------------------
	// KAMUS BAHASA & WARNA SEMANTIK (FLAT)
	// -----------------------------------------------------------------
	const getReportStatus = (status) => {
		switch (status) {
			case 'TERLAPOR':
				return {
					label: 'Laporan Masuk',
					color: 'bg-destructive/10 text-destructive border-destructive/20',
				};
			case 'pending':
				return {
					label: 'Laporan Terverifikasi',
					color: 'bg-warning/10 text-warning border-warning/20',
				};
			case 'handling':
				return {
					label: 'Penanganan',
					color: 'bg-success/10 text-success border-success/20',
				};
			case 'resolved':
				return {
					label: 'Selesai',
					color: 'bg-info/10 text-info border-info/20',
				};
			case 'ditolak':
				return { label: 'Ditolak', color: 'bg-muted text-muted-foreground border-border' };
			default:
				return { label: status, color: 'bg-muted text-muted-foreground border-border' };
		}
	};

	const getResponderStatus = (status) => {
		switch (status) {
			case 'en_route':
				return {
					label: 'Meluncur',
					color: 'bg-warning/10 text-warning border-warning/20',
				};
			case 'arrived':
				return {
					label: 'Tiba di Lokasi',
					color: 'bg-info/10 text-info border-info/20',
				};
			case 'finished':
				return { label: 'Selesai Tugas', color: 'bg-muted text-muted-foreground border-border' };
			case 'waiting':
				// Status legacy dari alur respons kartu lama (front.helpers.store); alur baru
				// memakai 'en_route'. Tetap diberi label Indonesia agar tidak tampil mentah.
				return { label: 'Bersiap', color: 'bg-muted text-muted-foreground border-border' };
			default:
				return { label: status, color: 'bg-muted text-muted-foreground border-border' };
		}
	};

	const currentStatus = getReportStatus(reportStatus);

	// -----------------------------------------------------------------
	// AKSI OPERASIONAL
	// -----------------------------------------------------------------
	const executeApprove = () => {
		setIsProcessing(true);
		router.post(
			route('reports.approve', report.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => {
					setConfirmApprove(false);
					toast.success('Sinyal darurat disiarkan!');
				},
				onFinish: () => setIsProcessing(false),
			},
		);
	};

	const executeReject = () => {
		setIsProcessing(true);
		router.post(
			route('reports.reject', report.id),
			{ reason: rejectReason },
			{
				preserveScroll: true,
				onSuccess: () => {
					setConfirmReject(false);
					setRejectReason('');
					toast.success('Laporan ditolak & diarsipkan.');
				},
				onFinish: () => setIsProcessing(false),
			},
		);
	};

	const handleTakeAction = () => {
		setIsActionLoading(true);
		router.post(
			route('reports.take-action', report.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Meluncur ke lokasi.'),
				onFinish: () => setIsActionLoading(false),
			},
		);
	};

	const handleArrive = () => {
		setIsActionLoading(true);
		router.post(
			route('reports.arrive', report.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Status diperbarui: Tiba di lokasi.'),
				onFinish: () => setIsActionLoading(false),
			},
		);
	};

	const handleCancelResponse = () => {
		setIsActionLoading(true);
		router.post(
			route('reports.cancel-response', report.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Keberangkatan dibatalkan.'),
				onError: () => toast.error('Gagal membatalkan keberangkatan.'),
				onFinish: () => setIsActionLoading(false),
			},
		);
	};

	const executeResolve = () => {
		setIsActionLoading(true);
		router.post(
			route('reports.resolve', report.id),
			{},
			{
				preserveScroll: true,
				onSuccess: () => {
					setConfirmResolve(false);
					toast.success('Insiden dinyatakan selesai.');
				},
				onFinish: () => setIsActionLoading(false),
			},
		);
	};

	const fmtDateTime = (v) =>
		v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(v)) : '-';
	const fmtDate = (v) => (v ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(v)) : '-');

	const handleDeleteResolution = () => {
		if (!resolutionToDelete) return;
		setIsDeletingResolution(true);
		router.delete(route('reports.resolution.destroy', [report.id, resolutionToDelete]), {
			preserveScroll: true,
			onSuccess: () => {
				setResolutionToDelete(null);
				toast.success('Entri berita acara dihapus.');
			},
			onError: () => toast.error('Gagal menghapus entri.'),
			onFinish: () => setIsDeletingResolution(false),
		});
	};

	const handleDispatchUnit = () => {
		if (!unitToDispatch) return;
		setIsUnitProcessing(true);
		router.post(
			route('reports.dispatch-unit', report.id),
			{ unit_id: unitToDispatch },
			{
				preserveScroll: true,
				onSuccess: () => {
					setUnitToDispatch('');
					toast.success('Unit dikerahkan ke insiden.');
				},
				onError: () => toast.error('Gagal mengerahkan unit.'),
				onFinish: () => setIsUnitProcessing(false),
			},
		);
	};

	const handleReleaseUnit = (unitId) => {
		setIsUnitProcessing(true);
		router.post(
			route('reports.release-unit', report.id),
			{ unit_id: unitId },
			{
				preserveScroll: true,
				onSuccess: () => toast.success('Unit ditarik dari insiden.'),
				onError: () => toast.error('Gagal menarik unit.'),
				onFinish: () => setIsUnitProcessing(false),
			},
		);
	};

	const handleCancelCorrection = () => {
		setIsCorrectingMode(false);
		setPendingPosition(null);
	};

	const handleConfirmCorrection = async () => {
		const target = pendingPosition || {
			lat: parseFloat(incidentLocation.lat),
			lng: parseFloat(incidentLocation.lng),
		};
		setIsSubmittingCorrection(true);

		let address = incidentLocation.address;
		try {
			const res = await axios.get(route('api.geocode.reverse'), { params: { lat: target.lat, lng: target.lng } });
			address = res.data?.display_name || address;
		} catch (e) {
			// Tetap lanjutkan dengan alamat lama jika reverse geocode gagal
		}

		router.post(
			route('reports.correct-location', report.id),
			{ lat: target.lat, lng: target.lng, address },
			{
				preserveScroll: true,
				onSuccess: () => {
					setIncidentLocation({ lat: target.lat, lng: target.lng, address });
					setIsCorrectingMode(false);
					setPendingPosition(null);
					toast.success('Lokasi insiden berhasil dikoreksi.');
				},
				onError: () => toast.error('Gagal mengoreksi lokasi insiden.'),
				onFinish: () => setIsSubmittingCorrection(false),
			},
		);
	};

	useEffect(() => {
		if (!isCurrentlyResponding || !navigator.geolocation) return;
		const watchId = navigator.geolocation.watchPosition(
			(pos) => {
				const lat = pos.coords.latitude;
				const lng = pos.coords.longitude;
				// Tampilkan posisi sendiri di peta SEGERA dari GPS lokal — jangan menunggu
				// echo broadcast (yang butuh Reverb aktif). Tanpa ini, responder tak melihat
				// markernya sendiri saat websocket mati. Update record-ku di list mana pun.
				setOfficerList((prev) =>
					prev.map((o) => (o.user_id === auth.user.id ? { ...o, location_lat: lat, location_lng: lng } : o)),
				);
				setHelperList((prev) =>
					prev.map((h) => (h.user_id === auth.user.id ? { ...h, location_lat: lat, location_lng: lng } : h)),
				);
				axios.post(`/reports/${report.id}/update-location`, { lat, lng }).catch(() => {});
			},
			(err) => console.error(err),
			GEO_OPTIONS.tracking,
		);
		return () => navigator.geolocation.clearWatch(watchId);
	}, [isCurrentlyResponding, report.id]);

	useEffect(() => {
		if (!mapRef.current || !window.L) return;
		if (!mapInstance.current) {
			const map = window.L.map(mapRef.current, { zoomControl: false }).setView(
				[parseFloat(incidentLocation.lat), parseFloat(incidentLocation.lng)],
				15,
			);
			window.L.tileLayer(MAP_TILE_URL).addTo(map);
			window.L.control.zoom({ position: 'topright' }).addTo(map);
			mapInstance.current = map;
		}

		const map = mapInstance.current;
		const boundsGroup = [];

		const dangerIcon = window.L.divIcon({
			html: `<div class="text-destructive ${reportStatus !== 'resolved' ? 'animate-pulse' : ''}"><svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C7.58 2 4 5.58 4 10c0 4.42 8 12 8 12s8-7.58 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg></div>`,
			className: 'bg-transparent border-none',
			iconSize: [36, 36],
			iconAnchor: [16, 36],
		});

		if (incidentMarkerRef.current) incidentMarkerRef.current.remove();
		const incidentMarker = window.L.marker([parseFloat(incidentLocation.lat), parseFloat(incidentLocation.lng)], {
			icon: dangerIcon,
			draggable: isCorrectingMode,
		}).addTo(map);
		if (isCorrectingMode) {
			incidentMarker.on('dragend', (e) => {
				const { lat, lng } = e.target.getLatLng();
				setPendingPosition({ lat, lng });
			});
		}
		incidentMarkerRef.current = incidentMarker;
		boundsGroup.push(incidentMarker);

		const renderMarker = (userId, name, type, latStr, lngStr) => {
			const lat = parseFloat(latStr);
			const lng = parseFloat(lngStr);
			if (isNaN(lat) || isNaN(lng)) return null;

			// Pakai ulang marker yang sudah ada → animasikan ke posisi baru (mulus, tidak melompat)
			const existing = markersRef.current[userId];
			if (existing) {
				animateMarkerTo(existing, [lat, lng]);
				return existing;
			}

			const iconEmoji = type === 'petugas' ? '🚒' : '🏃‍♂️';
			const iconColor =
				type === 'petugas' ? 'bg-destructive text-destructive-foreground' : 'bg-info text-info-foreground';
			const htmlMarkup = `<div class="${iconColor} text-xs w-7 h-7 font-bold flex items-center justify-center rounded-full border-2 border-card shadow-none">${iconEmoji}</div>`;

			const marker = window.L.marker([lat, lng], {
				icon: window.L.divIcon({
					html: htmlMarkup,
					className: 'bg-transparent border-none',
					iconSize: [28, 28],
					iconAnchor: [14, 14],
				}),
			})
				.addTo(map)
				.bindPopup(`<div class="text-xs font-bold">${name}</div>`);

			markersRef.current[userId] = marker;
			return marker;
		};

		// Bersihkan garis rute lama agar tidak menumpuk tiap redraw. Cache rute (routeCacheRef)
		// sengaja TIDAK dibersihkan agar rute jalan bisa digambar ulang instan dari cache
		// tanpa memanggil OSRM tiap redraw.
		Object.values(routeLinesRef.current).forEach((l) => l.remove());
		routeLinesRef.current = {};

		const incLat = parseFloat(incidentLocation.lat);
		const incLng = parseFloat(incidentLocation.lng);

		// Gambar garis rute jalan asli (mengikuti jalan via proxy OSRM) dari posisi terkini
		// responder ke titik insiden. Dipakai cache + ambang pergerakan agar tidak memanggil
		// OSRM tiap redraw/gerakan kecil; bila routing gagal fallback ke garis lurus.
		const drawRouteLine = (userId, color, curLat, curLng) => {
			const paint = (coords) => {
				if (!coords || coords.length < 2 || !mapInstance.current) return;
				if (routeLinesRef.current[userId]) routeLinesRef.current[userId].remove();
				routeLinesRef.current[userId] = window.L.polyline(coords, {
					color,
					weight: 4,
					opacity: 0.75,
					lineJoin: 'round',
					lineCap: 'round',
				}).addTo(map);
			};

			const cache = routeCacheRef.current[userId];
			const fresh =
				cache &&
				cache.incLat === incLat &&
				cache.incLng === incLng &&
				distanceMeters(cache.originLat, cache.originLng, curLat, curLng) <= ROUTE_REFETCH_METERS;

			// Selalu gambar dari cache dulu (instan) supaya garis tidak hilang saat redraw
			if (cache?.coords) paint(cache.coords);
			if (fresh) return;

			axios
				.get(route('api.route.directions'), {
					params: { from_lat: curLat, from_lng: curLng, to_lat: incLat, to_lng: incLng },
				})
				.then((res) => {
					const coords = res.data?.route;
					const finalCoords =
						coords && coords.length >= 2
							? coords
							: [
									[curLat, curLng],
									[incLat, incLng],
								];
					routeCacheRef.current[userId] = {
						originLat: curLat,
						originLng: curLng,
						incLat,
						incLng,
						coords: finalCoords,
					};
					paint(finalCoords);
				})
				.catch(() => {
					const straight = [
						[curLat, curLng],
						[incLat, incLng],
					];
					routeCacheRef.current[userId] = {
						originLat: curLat,
						originLng: curLng,
						incLat,
						incLng,
						coords: straight,
					};
					paint(straight);
				});
		};

		// Hanya gambar rute jalan DI DEPAN (posisi sekarang → titik insiden) untuk responder
		// yang masih meluncur. Jejak yang sudah dilalui sengaja tidak digambar agar peta bersih.
		const drawResponderRoute = (userId, type, status, curLatStr, curLngStr) => {
			if (status !== 'en_route' || reportStatus === 'resolved') return;
			const curLat = parseFloat(curLatStr);
			const curLng = parseFloat(curLngStr);
			if (isNaN(curLat) || isNaN(curLng) || isNaN(incLat) || isNaN(incLng)) return;
			const color = type === 'petugas' ? '#dc2626' : '#2563eb';
			drawRouteLine(userId, color, curLat, curLng);
		};

		officerList.forEach((o) => {
			const m = renderMarker(o.user_id, o.user?.name, 'petugas', o.location_lat, o.location_lng);
			if (m) boundsGroup.push(m);
			drawResponderRoute(o.user_id, 'petugas', o.status, o.location_lat, o.location_lng);
		});
		helperList.forEach((h) => {
			const m = renderMarker(h.user_id, h.user?.name, 'relawan', h.location_lat, h.location_lng);
			if (m) boundsGroup.push(m);
			drawResponderRoute(h.user_id, 'relawan', h.status, h.location_lat, h.location_lng);
		});

		// Hapus marker (+ cache rute) responder yang sudah tidak ada di manifes — mis. setelah
		// "Batal Meluncur" barisnya dihapus, agar markernya tidak tertinggal di peta.
		const activeResponderIds = new Set([...officerList.map((o) => o.user_id), ...helperList.map((h) => h.user_id)]);
		Object.keys(markersRef.current).forEach((idStr) => {
			if (!activeResponderIds.has(Number(idStr))) {
				markersRef.current[idStr].remove();
				delete markersRef.current[idStr];
				delete routeCacheRef.current[idStr];
			}
		});

		// Pas-kan batas peta sekali saja di awal (saat sudah ada marker) supaya tidak melompat
		// tiap update posisi — pengguna bebas menggeser/zoom setelahnya.
		if (!hasFitRef.current && boundsGroup.length > 0) {
			map.fitBounds(new window.L.featureGroup(boundsGroup).getBounds().pad(0.3));
			hasFitRef.current = true;
		}

		let channel = null;
		if (window.Echo) {
			channel = window.Echo.private(`report-tracking.${report.id}`);
			channel.listen('ResponderLocationUpdated', (e) => {
				const { responderId, responderType, lat, lng } = e;
				// Cukup update state posisi; effect akan menjalankan ulang & menganimasikan marker
				// mulus ke posisi baru serta memperbarui rute jalan di depan.
				if (responderType === 'petugas') {
					setOfficerList((prev) =>
						prev.map((o) =>
							o.user_id === responderId ? { ...o, location_lat: lat, location_lng: lng } : o,
						),
					);
				} else {
					setHelperList((prev) =>
						prev.map((h) =>
							h.user_id === responderId ? { ...h, location_lat: lat, location_lng: lng } : h,
						),
					);
				}
			});
			channel.listen('IncidentLocationCorrected', (e) => {
				setIncidentLocation({ lat: e.lat, lng: e.lng, address: e.address });
			});
			// Daftar responder berubah dari sisi lain (responder baru meluncur / batal /
			// tiba) — muat ulang prop `report` agar manifes & marker peta ikut tampil tanpa
			// refresh. Ambil ulang lewat controller supaya tetap ter-scope & konsisten bentuknya.
			channel.listen('ResponderRosterChanged', () => {
				router.reload({ only: ['report'] });
			});
			// Status laporan berubah dari sisi lain (approve/reject/handling/resolve) —
			// perbarui badge, panel aksi, dan banner tanpa perlu refresh.
			channel.listen('ReportStatusChanged', (e) => {
				setReportStatus(e.status);
				setRejectedReason(e.rejectedReason ?? null);
			});
		}
		return () => {
			if (channel) window.Echo.leave(`report-tracking.${report.id}`);
		};
	}, [
		report.id,
		incidentLocation.lat,
		incidentLocation.lng,
		reportStatus,
		officerList,
		helperList,
		isCorrectingMode,
	]);

	return (
		<div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 pb-32">
			<Head title={`Komando Insiden #${report.id}`} />

			{/* --- TOP BAR --- */}
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="icon"
					className="h-9 w-9 rounded-xl border-border bg-card shadow-none"
					asChild
				>
					<Link href="/dashboard">
						<IconChevronLeft className="h-5 w-5 text-muted-foreground" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="truncate text-lg font-bold uppercase tracking-tight text-foreground sm:text-xl">
							{report.title}
						</h1>
						<Badge
							variant="outline"
							className={cn(
								'whitespace-nowrap rounded-md px-2.5 py-0.5 font-bold shadow-none',
								currentStatus.color,
							)}
						>
							{currentStatus.label}
						</Badge>
					</div>
					<p className="mt-1 font-mono text-xs font-semibold tracking-tight text-muted-foreground">
						{reportNumber(report)}
					</p>
				</div>
				{/* Pelapor boleh mengedit hanya selama laporan belum divalidasi (TERLAPOR) — #30 */}
				{isOwner && reportStatus === 'TERLAPOR' && (
					<Button
						variant="outline"
						className="h-9 shrink-0 border-border bg-card px-3 text-xs font-bold uppercase tracking-wider shadow-none"
						asChild
					>
						<Link href={route('front.reports.edit', report.id)}>Edit</Link>
					</Button>
				)}
			</div>

			{/* --- 🛡️ PANEL VERIFIKASI --- */}
			{reportStatus === 'TERLAPOR' && isStaffOrAdmin && (
				<Card className="rounded-xl border border-border bg-card shadow-none">
					<CardContent className="flex flex-col items-start justify-between gap-4 p-4 sm:p-5 md:flex-row md:items-center">
						<div className="flex items-start gap-3">
							<div className="mt-0.5 shrink-0 rounded-lg bg-muted p-2 text-foreground/80">
								<IconAlertCircle className="h-5 w-5" />
							</div>
							<div>
								<h3 className="text-sm font-bold text-foreground">Verifikasi Laporan Masuk</h3>
								<p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
									Laporan ini belum divalidasi. Periksa bukti atau hubungi pelapor di{' '}
									<b>
										<a href={`tel:${report.phone}`}>{report.phone}</a>
									</b>{' '}
									sebelum menugaskan armada.
								</p>
							</div>
						</div>

						<div className="flex w-full shrink-0 flex-col items-stretch gap-2 border-t border-border pt-4 sm:items-center md:w-auto md:border-t-0 md:pt-0">
							{/* Satu aksi dominan (Broadcast); Tolak diturunkan jadi tombol teks destructive kecil (#37 Kluster E). */}
							<Button
								onClick={() => setConfirmApprove(true)}
								className="h-12 w-full rounded-lg border border-destructive bg-destructive text-xs font-bold uppercase tracking-wider text-destructive-foreground transition-colors hover:bg-destructive/90 md:h-11 md:w-auto md:px-6"
							>
								<IconRadar className="mr-1.5 h-4 w-4" /> Broadcast Misi
							</Button>
							<Button
								onClick={() => setConfirmReject(true)}
								variant="ghost"
								className="h-8 gap-1.5 rounded-md px-2 text-xs font-bold text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
							>
								<IconX className="h-3.5 w-3.5" /> Tolak laporan
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* --- LAYOUT SPLIT VIEW --- */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				{/* BLOK KIRI: DOKUMEN & MAP */}
				<div className="space-y-6 lg:col-span-2">
					<Card className="rounded-xl border border-border bg-card shadow-none">
						<CardHeader className="flex flex-row items-center gap-2 overflow-hidden rounded-t-xl border-b border-border bg-muted/50 p-4 pb-3">
							<IconFileText className="h-5 w-5 text-muted-foreground" />
							<CardTitle className="text-sm font-bold text-foreground">Informasi Insiden</CardTitle>
						</CardHeader>
						<CardContent className="space-y-5 p-4 sm:p-5">
							<div className="space-y-1.5 border-b border-border pb-4">
								<div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Judul Insiden:
								</div>
								<div className="text-base font-bold leading-snug text-destructive sm:text-lg">
									{report.title}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
								<div className="space-y-1 rounded-lg border border-border bg-muted p-3">
									<div className="font-medium text-muted-foreground">Pelapor</div>
									<div className="flex items-center gap-1.5 font-bold text-foreground">
										<IconUser className="h-3.5 w-3.5 text-muted-foreground" /> {report.name}
									</div>
								</div>
								<div className="space-y-1 rounded-lg border border-border bg-muted p-3">
									<div className="font-medium text-muted-foreground">Telepon</div>
									<a
										href={`tel:${report.phone}`}
										className="flex items-center gap-1.5 font-bold text-foreground transition-colors hover:text-info"
									>
										<IconPhone className="h-3.5 w-3.5 text-muted-foreground" /> {report.phone}
									</a>
								</div>

								<div className="space-y-2 rounded-lg border border-border bg-muted p-4 sm:col-span-2">
									<div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
										<IconMap className="h-3.5 w-3.5" /> Wilayah Administratif
									</div>
									<div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
										<div>
											<div className="mb-0.5 text-[10px] text-muted-foreground">Provinsi</div>
											<div className="truncate font-bold text-foreground">
												{report.province?.name || report.province_code || 'Bali'}
											</div>
										</div>
										<div>
											<div className="mb-0.5 text-[10px] text-muted-foreground">
												Kabupaten/Kota
											</div>
											<div className="truncate font-bold text-foreground">
												{report.city?.name || report.city_code || '-'}
											</div>
										</div>
										<div>
											<div className="mb-0.5 text-[10px] text-muted-foreground">Kecamatan</div>
											<div className="truncate font-bold text-foreground">
												{report.district?.name || report.district_code || '-'}
											</div>
										</div>
										<div>
											<div className="mb-0.5 text-[10px] text-muted-foreground">
												Desa/Kelurahan
											</div>
											<div className="truncate font-bold text-foreground">
												{report.village?.name || report.village_code || '-'}
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-1 rounded-lg border border-border bg-muted p-3 sm:col-span-2">
									<div className="font-medium text-muted-foreground">Alamat Presisi</div>
									<div className="mt-1 flex items-start gap-1.5 font-bold text-foreground">
										<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
										<span className="leading-relaxed">{incidentLocation.address}</span>
									</div>
									{incidentLocation.lat && incidentLocation.lng && (
										<a
											href={`https://www.google.com/maps/dir/?api=1&destination=${incidentLocation.lat},${incidentLocation.lng}`}
											target="_blank"
											rel="noopener noreferrer"
											className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground shadow-none transition-colors hover:bg-accent"
										>
											<IconMap className="h-3.5 w-3.5 text-destructive" /> Navigasi ke Lokasi
										</a>
									)}
								</div>
							</div>

							<div className="mt-2 space-y-2 border-t border-border pt-4">
								<label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									Deskripsi Kejadian:
								</label>
								<p className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground/80">
									{report.description || '-'}
								</p>
							</div>

							{photos.length > 0 && (
								<div className="space-y-2 pt-2">
									<label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
										Lampiran Foto {photos.length > 1 && `(${photos.length})`}:
									</label>
									<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
										{photos.map((path, i) => (
											<div
												key={i}
												onClick={() => setModalPhoto(path)}
												className="group relative h-32 w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted"
											>
												<img
													src={`/storage/${path}`}
													onError={(e) => (e.target.src = path)}
													className="h-full w-full object-cover transition-all duration-300"
													alt={`Bukti ${i + 1}`}
												/>
												<div className="absolute inset-0 flex items-center justify-center bg-black/5 transition-colors group-hover:bg-black/40">
													<span className="flex items-center gap-1.5 rounded-md bg-card/95 px-2.5 py-1 text-[11px] font-bold text-foreground opacity-0 transition-opacity group-hover:opacity-100">
														<IconZoomIn className="h-3.5 w-3.5" /> Perbesar
													</span>
												</div>
											</div>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					<Card className="relative h-[400px] overflow-hidden rounded-xl border border-border shadow-none">
						<div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs font-bold text-foreground shadow-none">
							<IconRadar
								className={`h-4 w-4 text-destructive ${reportStatus !== 'resolved' ? 'animate-pulse' : ''}`}
							/>
							PETA DISPATCHER KOMANDO
						</div>
						<div ref={mapRef} className="z-0 h-full w-full bg-muted"></div>
					</Card>
				</div>

				{/* BLOK KANAN: MANIFEST & KONTROL */}
				<div className="space-y-4">
					{reportStatus === 'ditolak' && (
						<Card className="rounded-xl border border-border bg-card shadow-none">
							<CardContent className="space-y-2 p-4 sm:p-5">
								<h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
									<IconX className="h-4 w-4" /> Laporan Ditolak
								</h2>
								<p className="text-xs leading-relaxed text-muted-foreground">
									Laporan ini ditandai tidak valid/hoax oleh Pusat Komando dan diarsipkan.
								</p>
								{rejectedReason && (
									<div className="mt-1 rounded-lg border border-border bg-muted p-3 text-xs text-foreground/80">
										<span className="font-bold">Alasan: </span>
										{rejectedReason}
									</div>
								)}
							</CardContent>
						</Card>
					)}

					{reportStatus !== 'TERLAPOR' && reportStatus !== 'ditolak' && (isRelawan || isStaffOrAdmin) && (
						<Card className="rounded-xl border border-border bg-card shadow-none">
							<CardContent className="space-y-4 p-4 sm:p-5">
								<h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-foreground">
									<IconShieldCheck className="h-4 w-4 text-info" /> Panel Tindakan Anda
								</h2>

								{reportStatus === 'resolved' ? (
									<div className="flex items-center justify-center gap-2 rounded-lg border border-info/20 bg-info/10 p-3 text-center text-xs font-bold text-info">
										<IconCheck className="h-4 w-4" /> INSIDEN SELESAI DITANGANI
									</div>
								) : (
									<>
										{/* 👇 TOMBOL TAKTIS (Dengan Warna Solid Semantik) 👇 */}
										{!myRecord ? (
											<Button
												onClick={handleTakeAction}
												disabled={isActionLoading}
												className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-destructive text-xs font-bold uppercase tracking-wider text-destructive-foreground shadow-none transition-colors hover:bg-destructive/90"
											>
												{isActionLoading ? (
													<IconLoader2 className="h-4 w-4 animate-spin" />
												) : (
													<>
														<IconFlag className="h-4 w-4" /> Meluncur ke Lokasi
													</>
												)}
											</Button>
										) : myRecord.status === 'en_route' ? (
											<>
												<Button
													onClick={handleArrive}
													disabled={isActionLoading}
													className="flex h-12 w-full animate-pulse items-center justify-center gap-2 rounded-lg bg-info text-xs font-bold uppercase tracking-wider text-info-foreground shadow-none transition-colors hover:bg-info/90"
												>
													{isActionLoading ? (
														<IconLoader2 className="h-4 w-4 animate-spin" />
													) : (
														<>
															<IconMapPin className="h-4 w-4" /> Tiba di Lokasi
														</>
													)}
												</Button>
												<Button
													onClick={handleCancelResponse}
													disabled={isActionLoading}
													variant="outline"
													className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg border-border text-xs font-bold uppercase tracking-wider text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground"
												>
													<IconX className="h-4 w-4" /> Batal Meluncur
												</Button>
											</>
										) : myRecord.status === 'arrived' ? (
											<div className="rounded-lg border border-info/20 bg-info/10 p-3 text-center text-xs font-bold text-info">
												Anda Sedang di Lokasi.
											</div>
										) : (
											// Status tak terduga (mis. legacy 'waiting') — jangan klaim sudah di lokasi.
											<div className="rounded-lg border border-border bg-muted p-3 text-center text-xs font-bold text-muted-foreground">
												Status Anda: {getResponderStatus(myRecord.status).label}
											</div>
										)}

										{myRecord?.status === 'arrived' && !isCorrectingMode && (
											<Button
												onClick={() => setIsCorrectingMode(true)}
												variant="outline"
												className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg border-border text-xs font-bold uppercase tracking-wider text-foreground/80 shadow-none transition-colors hover:bg-muted"
											>
												<IconMapPin className="h-4 w-4" /> Koreksi Lokasi Insiden
											</Button>
										)}

										{myRecord?.status === 'arrived' && isCorrectingMode && (
											<div className="mt-2 space-y-2 rounded-lg border border-warning/20 bg-warning/10 p-3 text-xs text-warning">
												<p className="font-bold leading-relaxed">
													Titik laporan mungkin belum tepat. Geser pin merah ke lokasi
													kejadian sebenarnya agar rekan lain menuju titik yang benar, lalu
													konfirmasi.
												</p>
												<div className="flex gap-2 pt-1">
													<Button
														onClick={handleCancelCorrection}
														variant="outline"
														className="h-9 flex-1 border-border bg-card text-foreground/80"
													>
														Batal
													</Button>
													<Button
														onClick={handleConfirmCorrection}
														disabled={isSubmittingCorrection}
														className="h-9 flex-1 bg-destructive font-bold text-destructive-foreground hover:bg-destructive/90"
													>
														{isSubmittingCorrection ? (
															<IconLoader2 className="h-4 w-4 animate-spin" />
														) : (
															'Konfirmasi Lokasi'
														)}
													</Button>
												</div>
											</div>
										)}

										{isStaffOrAdmin && (
											<Button
												onClick={() => setConfirmResolve(true)}
												variant="outline"
												className="mt-2 h-12 w-full rounded-lg border-success/30 text-xs font-bold uppercase tracking-wider text-success shadow-none transition-colors hover:bg-success/10"
											>
												Tandai Insiden Selesai
											</Button>
										)}
									</>
								)}
							</CardContent>
						</Card>
					)}

					{/* --- 🚒 PANEL PENGERAHAN ARMADA (staf saja, insiden aktif) --- */}
					{/* SEMENTARA DISEMBUNYIKAN (keputusan user 2026-06-29): fitur armada masih
					    terpisah dari pelacakan petugas & belum dibutuhkan. Backend (dispatchUnit/
					    releaseUnit, Admin Units CRUD) tetap utuh — hapus `SHOW_ARMADA_PANEL` (atau
					    set true) untuk mengaktifkan kembali. */}
					{SHOW_ARMADA_PANEL &&
						isStaffOrAdmin &&
						reportStatus !== 'TERLAPOR' &&
						reportStatus !== 'ditolak' &&
						reportStatus !== 'resolved' && (
							<Card className="rounded-xl border border-border bg-card shadow-none">
								<CardContent className="space-y-3 p-4 sm:p-5">
									<h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-foreground">
										<IconTruck className="h-4 w-4 text-teal-600 dark:text-teal" /> Pengerahan Armada
									</h2>

									{dispatchedUnits.length > 0 ? (
										<div className="space-y-2">
											{dispatchedUnits.map((ru) => (
												<div
													key={ru.id}
													className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 p-2.5"
												>
													<div className="min-w-0">
														<div className="truncate text-xs font-bold text-foreground">
															{ru.unit?.name || 'Unit'}
														</div>
														<div className="truncate text-[10px] text-muted-foreground">
															{ru.unit?.type}
														</div>
													</div>
													<Button
														onClick={() => handleReleaseUnit(ru.unit_id)}
														disabled={isUnitProcessing}
														variant="outline"
														className="h-8 shrink-0 rounded-md border-border px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-none hover:bg-muted hover:text-foreground"
													>
														<IconArrowBackUp className="mr-1 h-3.5 w-3.5" /> Tarik
													</Button>
												</div>
											))}
										</div>
									) : (
										<p className="text-xs text-muted-foreground">
											Belum ada unit yang dikerahkan ke insiden ini.
										</p>
									)}

									{availableUnits.length > 0 ? (
										<div className="flex flex-col gap-2 border-t border-border pt-2 sm:flex-row">
											<select
												value={unitToDispatch}
												onChange={(e) => setUnitToDispatch(e.target.value)}
												className="h-10 flex-1 rounded-lg border border-border bg-card px-3 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
											>
												<option value="">Pilih unit tersedia...</option>
												{availableUnits.map((u) => (
													<option key={u.id} value={u.id}>
														{u.name} — {u.type}
													</option>
												))}
											</select>
											<Button
												onClick={handleDispatchUnit}
												disabled={isUnitProcessing || !unitToDispatch}
												className="h-10 shrink-0 rounded-lg bg-teal-600 text-xs font-bold uppercase tracking-wider text-white shadow-none hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90"
											>
												{isUnitProcessing ? (
													<IconLoader2 className="h-4 w-4 animate-spin" />
												) : (
													<>
														<IconTruck className="mr-1.5 h-4 w-4" /> Kerahkan
													</>
												)}
											</Button>
										</div>
									) : (
										<div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-3">
											<IconAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
											<div className="space-y-1">
												<p className="text-xs font-medium text-foreground">
													{allUnitsBusy
														? 'Semua unit sedang bertugas'
														: 'Belum ada unit terdaftar di wilayah ini'}
												</p>
												<p className="text-[11px] leading-relaxed text-muted-foreground">
													{allUnitsBusy
														? 'Tarik salah satu unit dari insiden lain atau tunggu unit selesai bertugas sebelum mengerahkan.'
														: 'Tambahkan armada terlebih dahulu agar bisa dikerahkan ke insiden.'}
												</p>
												{noUnitsRegistered && canManageUnits && (
													<Link
														href={route('admin.units.index')}
														className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-600 hover:underline dark:text-teal"
													>
														<IconTruck className="h-3.5 w-3.5" /> Kelola Armada
													</Link>
												)}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						)}

					<h2 className="px-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Manifes Responden
					</h2>

					<Card className="rounded-xl border border-border bg-card shadow-none">
						<CardContent className="divide-y divide-border p-0">
							<div className="flex items-center gap-2 bg-muted p-3 text-xs font-bold uppercase text-muted-foreground">
								<IconFiretruck className="h-4 w-4" /> Damkar
							</div>
							{officerList.length > 0 ? (
								officerList.map((officer) => {
									const stat = getResponderStatus(officer.status);
									return (
										<div
											key={officer.id}
											className="flex items-center justify-between gap-3 p-3.5 text-xs"
										>
											<div className="min-w-0 flex-1 truncate font-bold text-foreground">
												{officer.user?.name}
											</div>
											<Badge
												className={cn(
													'rounded-md border px-2 py-0.5 text-xs font-semibold shadow-none',
													stat.color,
												)}
											>
												{stat.label}
											</Badge>
										</div>
									);
								})
							) : (
								<div className="p-4 text-center text-xs text-muted-foreground">-</div>
							)}

							<div className="flex items-center gap-2 bg-muted p-3 text-xs font-bold uppercase text-muted-foreground">
								<IconUsersGroup className="h-4 w-4" /> Relawan Sipil
							</div>
							{helperList.length > 0 ? (
								helperList.map((helper) => {
									const stat = getResponderStatus(helper.status);
									return (
										<div
											key={helper.id}
											className="flex items-center justify-between gap-3 p-3.5 text-xs"
										>
											<div className="min-w-0 flex-1 truncate font-bold text-foreground">
												{helper.user?.name}
											</div>
											<Badge
												className={cn(
													'rounded-md border px-2 py-0.5 text-xs font-semibold shadow-none',
													stat.color,
												)}
											>
												{stat.label}
											</Badge>
										</div>
									);
								})
							) : (
								<div className="p-4 text-center text-xs text-muted-foreground">-</div>
							)}
						</CardContent>
					</Card>

					{/* --- 📝 LAPORAN KEGIATAN PENYELAMATAN / BERITA ACARA (staf saja) --- */}
					{canManageResolution && (reportStatus === 'resolved' || reportStatus === 'handling') && (
						<Card className="rounded-xl border border-border bg-card shadow-none">
							<CardContent className="space-y-3 p-4 sm:p-5">
								<div className="flex items-center justify-between gap-2">
									<h2 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-foreground">
										<IconFileText className="h-4 w-4 text-info" /> Laporan Kegiatan Penyelamatan
									</h2>
									<Link
										href={route('reports.resolution.create', report.id)}
										className="inline-flex items-center gap-1 rounded-lg bg-info px-2.5 py-1.5 text-xs font-bold text-info-foreground shadow-none transition-colors hover:bg-info/90"
									>
										<IconPlus className="h-3.5 w-3.5" /> Buat
									</Link>
								</div>

								<p className="text-[11px] leading-relaxed text-muted-foreground">
									Data awal diisi sebagai <b>sementara</b>; setelah investigasi, buat entri <b>final</b>{' '}
									baru (tidak menimpa yang lama) agar bisa dibandingkan.
								</p>

								{resolutions.length === 0 ? (
									<div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
										Belum ada berita acara. Klik "Buat" untuk mengisi data kejadian, korban, dan foto.
									</div>
								) : (
									<div className="space-y-3">
										{resolutions.map((r) => (
											<div key={r.id} className="rounded-lg border border-border bg-muted/40 p-3">
												<div className="flex items-center justify-between gap-2">
													<Badge
														className={cn(
															'rounded-md border px-2 py-0.5 text-xs font-semibold shadow-none',
															r.status === 'final'
																? 'border-success/30 bg-success/10 text-success'
																: 'border-warning/30 bg-warning/10 text-warning',
														)}
													>
														{r.status === 'final' ? 'Final' : 'Sementara'}
													</Badge>
													<button
														type="button"
														onClick={() => setResolutionToDelete(r.id)}
														className="text-muted-foreground transition-colors hover:text-destructive"
														aria-label="Hapus entri"
													>
														<IconTrash className="h-4 w-4" />
													</button>
												</div>

												<div className="mt-1 text-[10px] text-muted-foreground">
													{r.creator ? `${r.creator} · ` : ''}
													{fmtDateTime(r.created_at)}
												</div>

												<dl className="mt-2 space-y-1 text-xs">
													{r.jenis_kejadian && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Jenis:</dt>
															<dd className="text-foreground">{r.jenis_kejadian}</dd>
														</div>
													)}
													{r.sumber_informasi && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Sumber:</dt>
															<dd className="text-foreground">{r.sumber_informasi}</dd>
														</div>
													)}
													{r.occurred_at && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Waktu:</dt>
															<dd className="text-foreground">{fmtDateTime(r.occurred_at)}</dd>
														</div>
													)}
													{(r.lokasi_alamat || r.kelurahan || r.kecamatan) && (
														<div>
															<dt className="font-semibold text-muted-foreground">Lokasi:</dt>
															<dd className="mt-0.5 leading-relaxed text-foreground">
																{r.lokasi_alamat && (
																	<div className="whitespace-pre-line">{r.lokasi_alamat}</div>
																)}
																{(r.kelurahan || r.kecamatan) && (
																	<div className="text-muted-foreground">
																		{[r.kelurahan, r.kecamatan].filter(Boolean).join(', ')}
																	</div>
																)}
															</dd>
														</div>
													)}
													{(r.pemilik_nama || r.pemilik_umur) && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Pemilik:</dt>
															<dd className="text-foreground">
																{r.pemilik_nama || '-'}
																{r.pemilik_umur ? ` (${r.pemilik_umur} th)` : ''}
															</dd>
														</div>
													)}
													{r.kerugian && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Kerugian:</dt>
															<dd className="text-foreground">{r.kerugian}</dd>
														</div>
													)}
													{r.tim_atensi && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Tim:</dt>
															<dd className="text-foreground">{r.tim_atensi}</dd>
														</div>
													)}
													{r.kronologi && (
														<div className="flex gap-1.5">
															<dt className="shrink-0 font-semibold text-muted-foreground">Kronologi:</dt>
															<dd className="whitespace-pre-line text-foreground">{r.kronologi}</dd>
														</div>
													)}
												</dl>

												{r.victims.length > 0 && (
													<div className="mt-2 border-t border-border pt-2">
														<div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
															Korban ({r.victims.length})
														</div>
														<div className="mt-1 space-y-1.5">
															{r.victims.map((v) => (
																<div
																	key={v.id}
																	className="flex items-center justify-between gap-2 text-xs"
																>
																	<span className="min-w-0 truncate text-foreground">
																		{v.nama || '-'}
																		{v.tanggal_lahir ? ` · ${fmtDate(v.tanggal_lahir)}` : ''}
																	</span>
																	{v.ktp_url && (
																		<a
																			href={v.ktp_url}
																			target="_blank"
																			rel="noopener noreferrer"
																			className="shrink-0 font-semibold text-info hover:underline"
																		>
																			Lihat KTP
																		</a>
																	)}
																</div>
															))}
														</div>
													</div>
												)}

												{r.photos.length > 0 && (
													<div className="mt-2 border-t border-border pt-2">
														<div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
															Foto kejadian ({r.photos.length})
														</div>
														<div className="mt-1.5 flex flex-wrap gap-1.5">
															{r.photos.map((p) => (
																<button
																	key={p.id}
																	type="button"
																	onClick={() => setModalPhoto(p.path)}
																	className="h-14 w-14 overflow-hidden rounded-md border border-border"
																>
																	<img
																		src={`/storage/${p.path}`}
																		alt="Foto kejadian"
																		className="h-full w-full object-cover"
																	/>
																</button>
															))}
														</div>
													</div>
												)}
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			{/* MODALS */}
			<Dialog open={confirmApprove} onOpenChange={setConfirmApprove}>
				<DialogContent className="max-w-sm rounded-xl border border-border bg-card p-6 shadow-none">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10 text-info">
							<IconRadar className="h-6 w-6" />
						</div>
						<h2 className="text-lg font-bold text-foreground">Broadcast Darurat?</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Aksi ini memicu notifikasi ke seluruh personil aktif di area tersebut.
						</p>
						<div className="mt-2 flex w-full gap-3 border-t border-border pt-4">
							<Button
								onClick={() => setConfirmApprove(false)}
								variant="outline"
								className="h-10 flex-1 border-border bg-transparent text-foreground/80 shadow-none"
							>
								Batal
							</Button>
							<Button
								onClick={executeApprove}
								className="h-10 flex-1 bg-info font-bold text-info-foreground shadow-none hover:bg-info/90"
								disabled={isProcessing}
							>
								{isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Ya, Siarkan'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmReject} onOpenChange={setConfirmReject}>
				<DialogContent className="max-w-sm rounded-xl border border-border bg-card p-6 shadow-none">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<IconTrash className="h-6 w-6" />
						</div>
						<h2 className="text-lg font-bold text-foreground">Tolak Laporan?</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Laporan ditandai <b>ditolak</b> dan diarsipkan (tidak dihapus) — tetap bisa ditelusuri Pusat
							Komando.
						</p>
						<div className="w-full text-left">
							<label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								Alasan penolakan <span className="font-normal normal-case">(opsional)</span>
							</label>
							<Textarea
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								placeholder="Contoh: tidak dapat dihubungi, lokasi tidak ditemukan, duplikat..."
								maxLength={500}
								className="mt-1.5 min-h-[72px] resize-y rounded-lg border-border bg-card text-sm focus-visible:ring-1 focus-visible:ring-destructive"
							/>
						</div>
						<div className="mt-2 flex w-full gap-3 border-t border-border pt-4">
							<Button
								onClick={() => setConfirmReject(false)}
								variant="outline"
								className="h-10 flex-1 border-border bg-transparent text-foreground/80 shadow-none"
							>
								Batal
							</Button>
							<Button
								onClick={executeReject}
								className="h-10 flex-1 bg-destructive font-bold text-destructive-foreground shadow-none hover:bg-destructive/90"
								disabled={isProcessing}
							>
								{isProcessing ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Ya, Tolak'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={confirmResolve} onOpenChange={setConfirmResolve}>
				<DialogContent className="max-w-sm rounded-xl border border-border bg-card p-6 shadow-none">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
							<IconCheck className="h-6 w-6" />
						</div>
						<h2 className="text-lg font-bold text-foreground">Tutup Insiden?</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Laporan ditandai selesai. Seluruh personil di lapangan akan dihentikan penugasannya.
						</p>
						<div className="mt-2 flex w-full gap-3 border-t border-border pt-4">
							<Button
								onClick={() => setConfirmResolve(false)}
								variant="outline"
								className="h-10 flex-1 border-border bg-transparent text-foreground/80 shadow-none"
							>
								Batal
							</Button>
							<Button
								onClick={executeResolve}
								className="h-10 flex-1 bg-success font-bold text-success-foreground shadow-none hover:bg-success/90"
								disabled={isActionLoading}
							>
								{isActionLoading ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Ya, Selesaikan'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={resolutionToDelete !== null} onOpenChange={(open) => !open && setResolutionToDelete(null)}>
				<DialogContent className="max-w-sm rounded-xl border border-border bg-card p-6 shadow-none">
					<div className="flex flex-col items-center space-y-4 text-center">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
							<IconTrash className="h-6 w-6" />
						</div>
						<h2 className="text-lg font-bold text-foreground">Hapus Entri Berita Acara?</h2>
						<p className="text-sm leading-relaxed text-muted-foreground">
							Entri ini beserta data korban & fotonya akan dihapus permanen. Tindakan tidak dapat
							dibatalkan.
						</p>
						<div className="mt-2 flex w-full gap-3 border-t border-border pt-4">
							<Button
								onClick={() => setResolutionToDelete(null)}
								variant="outline"
								className="h-10 flex-1 border-border bg-transparent text-foreground/80 shadow-none"
							>
								Batal
							</Button>
							<Button
								onClick={handleDeleteResolution}
								className="h-10 flex-1 bg-destructive font-bold text-destructive-foreground shadow-none hover:bg-destructive/90"
								disabled={isDeletingResolution}
							>
								{isDeletingResolution ? <IconLoader2 className="h-4 w-4 animate-spin" /> : 'Ya, Hapus'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={modalPhoto !== null} onOpenChange={(open) => !open && setModalPhoto(null)}>
				<DialogContent className="flex w-[95vw] max-w-4xl items-center justify-center border-none bg-transparent p-0 shadow-none outline-none md:w-full [&>button]:hidden">
					<div className="relative inline-flex h-full w-full items-center justify-center">
						<button
							onClick={() => setModalPhoto(null)}
							className="absolute right-2 top-2 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none hover:bg-muted"
						>
							<IconX size={20} />
						</button>
						{modalPhoto && (
							<img
								src={`/storage/${modalPhoto}`}
								onError={(e) => (e.target.src = modalPhoto)}
								className="h-auto max-h-[90vh] w-auto max-w-[100vw] rounded-md border border-border bg-black/20 object-contain shadow-none"
								alt="Bukti"
							/>
						)}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
ReportShow.layout = (page) => <AppLayout children={page} title="Pusat Kendali Operasional" />;
