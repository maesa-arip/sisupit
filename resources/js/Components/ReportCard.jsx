import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { cn, timeAgo } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { CheckCircle2, Clock, Flame, MapPin, Navigation, ShieldAlert, User, Users, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import DialogRelawanDetail from './DialogRelawanDetail';
import DialogRelawanList from './DialogRelawanList';

// Jarak garis-lurus (km) haversine — taksiran kedekatan insiden untuk relawan.
function distanceKm(lat1, lng1, lat2, lng2) {
	const R = 6371;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ReportCard({ report, currentUser, onSuccess, isRelawan, myPos }) {
	const [showList, setShowList] = useState(false);
	const [selectedHelper, setSelectedHelper] = useState(null);
	const [showImage, setShowImage] = useState(false);

	const handleSelectHelper = (helper) => {
		setSelectedHelper(helper);
		setShowList(false);
	};

	const handleBackToList = () => {
		setSelectedHelper(null);
		setShowList(true);
	};

	const lat = report.lat || report.location_lat;
	const lng = report.lng || report.location_lng;
	const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
	const distKm = myPos && lat && lng ? distanceKm(myPos.lat, myPos.lng, parseFloat(lat), parseFloat(lng)) : null;

	const hasHelpers = report.helpers?.length > 0;
	const hasPhoto = !!report.photo;

	const isOwner = currentUser && currentUser.id === report.user_id;
	const isMyTask = currentUser && report.helpers?.some((h) => h.user_id === currentUser.id);

	const getStatusConfig = () => {
		if (report.status === 'resolved')
			return {
				label: 'Selesai',
				color: 'bg-info/10 text-info border-info/20',
				icon: <CheckCircle2 size={12} className="mr-1 shrink-0" />,
			};
		if (report.status === 'handling' || hasHelpers)
			return {
				label: 'Penanganan',
				color: 'bg-success/10 text-success border-success/20',
				icon: <ShieldAlert size={12} className="mr-1 shrink-0" />,
			};
		return {
			label: 'Darurat',
			color: 'bg-destructive/10 text-destructive border-destructive/20',
			icon: <span className="mr-1.5 h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-destructive"></span>,
		};
	};
	const statusConfig = getStatusConfig();

	return (
		<div className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-none transition-colors duration-200 hover:border-muted-foreground/50">
			<div className="flex flex-1 flex-col p-4">
				<div className="mb-3 flex items-start justify-between gap-3">
					<h2 className="line-clamp-2 flex min-w-0 flex-1 items-start gap-2 text-base font-bold leading-snug text-foreground">
						<Flame size={16} className="mt-0.5 shrink-0 text-destructive" strokeWidth={2.5} />
						{report.title}
					</h2>
					<span
						className={cn(
							'flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-none',
							statusConfig.color,
						)}
					>
						{statusConfig.icon}
						{statusConfig.label}
					</span>
				</div>

				<div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
					<span className="flex items-center gap-1">
						<Clock size={12} strokeWidth={2.5} className="shrink-0" />
						{timeAgo(report.created_at)}
					</span>
					<span className="flex min-w-0 items-center gap-1">
						<User size={12} strokeWidth={2.5} className="shrink-0" />
						<span className="truncate">{report.name || report.user?.name || 'Warga'}</span>
					</span>
					{distKm != null && (
						<span className="flex items-center gap-1 text-foreground">
							<Navigation size={12} strokeWidth={2.5} className="shrink-0" />±
							{distKm < 10 ? distKm.toFixed(1) : Math.round(distKm)} km
						</span>
					)}
				</div>

				{hasPhoto && (
					<div
						className="group/img relative mb-3 h-36 w-full shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border bg-muted shadow-none"
						onClick={() => setShowImage(true)}
					>
						<img
							src={`/storage/${report.photo}`}
							alt="Foto laporan"
							onError={(e) => (e.target.src = report.photo)}
							className="h-full w-full object-cover grayscale-[15%] transition-all duration-500 group-hover/img:scale-105 group-hover/img:grayscale-0"
						/>
						<div className="absolute inset-0 flex items-center justify-center bg-black/5 transition-colors duration-300 group-hover/img:bg-black/30">
							<div className="flex translate-y-2 transform items-center gap-1.5 rounded-md border border-border bg-card/95 p-1.5 px-3 text-foreground opacity-0 shadow-none backdrop-blur-sm transition-all duration-300 group-hover/img:translate-y-0 group-hover/img:opacity-100">
								<ZoomIn size={12} />
								<span className="text-[10px] font-bold uppercase tracking-wider">Perbesar</span>
							</div>
						</div>
					</div>
				)}

				<div className="mb-1.5 flex items-start gap-2 text-xs font-bold text-muted-foreground">
					<MapPin size={14} className="mt-0.5 shrink-0 text-destructive" />
					<span className="line-clamp-2 leading-snug">{report.address}</span>
				</div>
				<p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
					{report.description || 'Tidak ada deskripsi rinci.'}
				</p>
			</div>

			<div className="mt-auto border-t border-border bg-muted/50 px-4 pb-4 pt-3">
				{hasHelpers ? (
					<button
						type="button"
						className="group/helper mb-3 flex w-full items-center justify-between text-[11px] font-bold text-foreground outline-none transition-colors hover:text-destructive"
						onClick={() => setShowList(true)}
					>
						<div className="flex items-center gap-2.5">
							<div className="flex -space-x-1.5">
								{report.helpers.slice(0, 3).map((h, i) => (
									<div
										key={i}
										className="flex h-5 w-5 items-center justify-center rounded-full border border-card bg-foreground/90 text-[8px] font-bold text-primary-foreground shadow-none transition-colors group-hover/helper:bg-destructive"
									>
										{h.user?.name?.[0]?.toUpperCase() ?? '?'}
									</div>
								))}
							</div>
							<span>{report.helpers.length} Relawan Merespons</span>
						</div>
						<span className="text-base leading-none">›</span>
					</button>
				) : (
					<div className="mb-3 flex w-full items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						<Users size={12} /> Belum Ada Responden
					</div>
				)}

				{/* 👇 FIX: TOMBOL EKSTRA KOMPAK (h-8 atau 32px) 👇 */}
				<div className="flex items-stretch gap-2">
					<a
						href={googleMapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="flex-none outline-none"
					>
						<button
							type="button"
							className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
						>
							<Navigation size={14} strokeWidth={2.5} />
						</button>
					</a>

					<div className="flex-1">
						{isOwner ? (
							<Link
								href={route('reports.show', report.id)}
								className="flex h-10 w-full items-center justify-center rounded-md border border-border bg-card text-[10px] font-bold uppercase tracking-wider text-foreground shadow-none transition-colors hover:bg-accent"
							>
								Pantau Laporan
							</Link>
						) : isMyTask ? (
							<Link
								href={route('reports.show', report.id)}
								className="flex h-10 w-full items-center justify-center rounded-md border border-transparent bg-foreground text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-none transition-colors hover:bg-foreground/90"
							>
								Peta Operasional
							</Link>
						) : report.status === 'resolved' ? (
							<button
								disabled
								type="button"
								className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md border border-border bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 shadow-none transition-colors"
							>
								Kasus Selesai
							</button>
						) : isRelawan ? (
							<Link
								href={route('reports.show', report.id)}
								className="flex h-10 w-full items-center justify-center rounded-md border border-destructive bg-destructive text-[10px] font-bold uppercase tracking-wider text-destructive-foreground shadow-none outline-none transition-colors hover:bg-destructive/90 focus:ring-2 focus:ring-destructive/50"
							>
								Lihat &amp; Respons
							</Link>
						) : (
							<button
								disabled
								type="button"
								className="flex h-10 w-full cursor-not-allowed items-center justify-center rounded-md border border-border bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-none transition-colors"
							>
								{hasHelpers ? 'Dalam Penanganan' : 'Menunggu Relawan'}
							</button>
						)}
					</div>
				</div>
			</div>

			{/* MODALS */}
			<DialogRelawanList
				open={showList}
				onClose={() => setShowList(false)}
				helpers={report.helpers}
				onSelect={handleSelectHelper}
			/>
			<DialogRelawanDetail
				open={!!selectedHelper}
				onClose={() => setSelectedHelper(null)}
				onBack={handleBackToList}
				helper={selectedHelper}
			/>
			<Dialog open={showImage} onOpenChange={setShowImage}>
				<DialogContent className="flex w-[95vw] max-w-4xl items-center justify-center border-none bg-transparent p-0 shadow-none outline-none md:w-full [&>button]:hidden">
					<div className="relative inline-flex h-full w-full items-center justify-center">
						<button
							onClick={() => setShowImage(false)}
							className="absolute right-2 top-2 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none outline-none transition-colors hover:bg-accent"
						>
							<X size={20} />
						</button>
						<img
							src={`/storage/${report.photo}`}
							onError={(e) => (e.target.src = report.photo)}
							alt="Foto kejadian detail"
							className="h-auto max-h-[90vh] w-auto max-w-[100vw] rounded-md border border-border bg-black/20 object-contain shadow-none"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
