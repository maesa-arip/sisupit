import { Carousel, CarouselContent, CarouselItem } from '@/Components/ui/carousel';
import { DismissOnBack } from '@/lib/back-closes-layer';
import PullToRefreshLock from '@/lib/pull-to-refresh-lock';
import { cn } from '@/lib/utils';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { IconChevronLeft, IconChevronRight, IconDownload, IconX } from '@tabler/icons-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
// Ketuk dua kali = perbesar ke sini, ketuk dua kali lagi = kembali utuh.
const DOUBLE_TAP_SCALE = 2.5;
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)'; // = ease-spring di tailwind.config.js

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Foto lama bisa berupa URL penuh (kolom `photo`), sisanya path di disk public. */
const srcOf = (path) => (/^https?:\/\//.test(path) ? path : `/storage/${path}`);
const downloadUrlOf = (path) => (/^https?:\/\//.test(path) ? path : route('photos.download', { path }));

/**
 * Satu foto yang bisa diperbesar: cubit (dua jari), ketuk dua kali, roda tetikus; geser saat
 * diperbesar. Transform ditulis LANGSUNG ke style (tanpa setState per frame) dan hanya
 * `transform` yang bergerak - tetap mulus di HP kelas bawah. `onZoomChange` memberi tahu
 * carousel agar tak ikut menggeser slide selama foto diperbesar.
 */
function ZoomableImage({ path, alt, active, onZoomChange, onClose }) {
	const wrapRef = useRef(null);
	const imgRef = useRef(null);
	const view = useRef({ scale: 1, x: 0, y: 0 });
	const pointers = useRef(new Map());
	const gesture = useRef(null);
	const lastTap = useRef({ time: 0, x: 0, y: 0 });
	const lastPointerType = useRef('mouse');

	const apply = useCallback((animate) => {
		const img = imgRef.current;
		if (!img) return;
		const { scale, x, y } = view.current;
		img.style.transition = animate ? `transform 280ms ${EASE}` : 'none';
		img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
	}, []);

	// Titik layar -> koordinat relatif pusat wadah (pusat foto saat belum digeser).
	const local = (clientX, clientY) => {
		const r = wrapRef.current.getBoundingClientRect();
		return { x: clientX - r.left - r.width / 2, y: clientY - r.top - r.height / 2 };
	};

	// Batas geser: tepi foto tak boleh masuk melewati tepi layar.
	const bounded = (scale, x, y) => {
		const img = imgRef.current;
		const wrap = wrapRef.current;
		if (!img || !wrap) return { x: 0, y: 0 };
		const maxX = Math.max(0, (img.offsetWidth * scale - wrap.clientWidth) / 2);
		const maxY = Math.max(0, (img.offsetHeight * scale - wrap.clientHeight) / 2);
		return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
	};

	const setView = useCallback(
		(next, animate) => {
			const wasZoomed = view.current.scale > 1.01;
			view.current = next;
			apply(animate);
			const zoomed = next.scale > 1.01;
			if (zoomed !== wasZoomed) onZoomChange(zoomed);
		},
		[apply, onZoomChange],
	);

	// Perbesar/perkecil dengan titik `p` tetap di bawah jari/kursor.
	const zoomAt = (p, nextScale, animate) => {
		const { scale, x, y } = view.current;
		const s = clamp(nextScale, MIN_SCALE, MAX_SCALE);
		const tx = p.x - (p.x - x) * (s / scale);
		const ty = p.y - (p.y - y) * (s / scale);
		setView({ scale: s, ...bounded(s, tx, ty) }, animate);
	};

	const reset = useCallback((animate) => setView({ scale: 1, x: 0, y: 0 }, animate), [setView]);

	// Pindah ke foto lain = foto ini kembali utuh.
	useEffect(() => {
		if (!active) reset(false);
	}, [active, reset]);

	// Roda tetikus (desktop). Listener non-pasif supaya halaman di belakang tak ikut bergulir.
	useEffect(() => {
		const wrap = wrapRef.current;
		if (!wrap) return;
		const onWheel = (e) => {
			e.preventDefault();
			zoomAt(local(e.clientX, e.clientY), view.current.scale * Math.exp(-e.deltaY * 0.002), false);
		};
		wrap.addEventListener('wheel', onWheel, { passive: false });
		return () => wrap.removeEventListener('wheel', onWheel);
	});

	const startPinch = () => {
		const [a, b] = [...pointers.current.values()];
		const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
		gesture.current = {
			type: 'pinch',
			dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
			mid,
			start: { ...view.current },
		};
	};

	const startPan = (p) => {
		gesture.current = { type: 'pan', x: p.x, y: p.y, start: { ...view.current } };
	};

	const onPointerDown = (e) => {
		lastPointerType.current = e.pointerType;
		pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY, t: Date.now(), x0: e.clientX, y0: e.clientY });
		if (pointers.current.size === 2) startPinch();
		else if (pointers.current.size === 1 && view.current.scale > 1.01) startPan({ x: e.clientX, y: e.clientY });
	};

	const onPointerMove = (e) => {
		const p = pointers.current.get(e.pointerId);
		if (!p) return;
		p.x = e.clientX;
		p.y = e.clientY;
		const g = gesture.current;
		if (!g) return;

		if (g.type === 'pinch' && pointers.current.size >= 2) {
			const [a, b] = [...pointers.current.values()];
			const s = clamp((g.start.scale * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, MIN_SCALE * 0.85, MAX_SCALE);
			const mid = local((a.x + b.x) / 2, (a.y + b.y) / 2);
			// Titik foto yang tadinya di bawah tengah dua jari ikut berpindah bersama jari.
			const tx = mid.x - (g.mid.x - g.start.x) * (s / g.start.scale);
			const ty = mid.y - (g.mid.y - g.start.y) * (s / g.start.scale);
			setView({ scale: s, x: tx, y: ty }, false);
		} else if (g.type === 'pan') {
			const { scale } = view.current;
			setView({ scale, ...bounded(scale, g.start.x + e.clientX - g.x, g.start.y + e.clientY - g.y) }, false);
		}
	};

	const onPointerUp = (e) => {
		const p = pointers.current.get(e.pointerId);
		pointers.current.delete(e.pointerId);
		const wasPinch = gesture.current?.type === 'pinch';

		if (pointers.current.size === 1 && view.current.scale > 1.01) {
			const [rest] = [...pointers.current.values()];
			startPan(rest);
		} else if (pointers.current.size === 0) {
			gesture.current = null;
			const { scale, x, y } = view.current;
			// Lepas cubitan: di bawah ukuran utuh memantul kembali, sisanya dirapikan ke batas.
			if (scale < 1.01) reset(true);
			else if (wasPinch) setView({ scale, ...bounded(scale, x, y) }, true);
		}

		if (!p || wasPinch || e.type === 'pointercancel') return;
		const moved = Math.hypot(e.clientX - p.x0, e.clientY - p.y0);
		if (moved > 10 || Date.now() - p.t > 300) return;

		// Klik tetikus di area kosong (bukan fotonya) menutup penampil, seperti lightbox umumnya.
		// Klik ganda tetikus ditangani onDoubleClick (mengikuti jeda klik ganda OS, bukan 300 ms).
		if (e.pointerType === 'mouse') {
			if (e.target === wrapRef.current && view.current.scale <= 1.01) onClose();
			return;
		}

		// Ketukan pendek: dua kali berdekatan = perbesar/kembalikan di titik itu.
		const now = Date.now();
		const prev = lastTap.current;
		if (now - prev.time < 300 && Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < 30) {
			lastTap.current = { time: 0, x: 0, y: 0 };
			if (view.current.scale > 1.01) reset(true);
			else zoomAt(local(e.clientX, e.clientY), DOUBLE_TAP_SCALE, true);
			return;
		}
		lastTap.current = { time: now, x: e.clientX, y: e.clientY };
	};

	const onDoubleClick = (e) => {
		// Ketuk ganda SENTUH sudah ditangani onPointerUp; sebagian browser HP tetap mengirim
		// dblclick sesudahnya - tanpa penjaga ini zoom langsung terbalik lagi.
		if (lastPointerType.current !== 'mouse') return;
		if (view.current.scale > 1.01) reset(true);
		else zoomAt(local(e.clientX, e.clientY), DOUBLE_TAP_SCALE, true);
	};

	return (
		<div
			ref={wrapRef}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
			onDoubleClick={onDoubleClick}
			// touch-action none: cubitan & geser jadi milik kita, bukan zoom halaman browser.
			className="flex h-full w-full touch-none select-none items-center justify-center overflow-hidden"
		>
			<img
				ref={imgRef}
				src={srcOf(path)}
				onError={(e) => {
					// Sekali saja: path yang juga gagal tak boleh memicu onError berulang.
					if (e.target.dataset.fallback) return;
					e.target.dataset.fallback = '1';
					e.target.src = path;
				}}
				className="max-h-full max-w-full object-contain will-change-transform"
				style={{ transformOrigin: 'center center' }}
				draggable={false}
				alt={alt}
			/>
		</div>
	);
}

/**
 * Penampil foto layar penuh (#215; dirombak 2026-11-06). `viewer` = { photos, index }: daftar
 * path satu kelompok (lampiran laporan / foto satu entri Laporan Kejadian) + foto yang diketuk.
 * Geser (HP), tombol kiri/kanan, atau panah keyboard berpindah foto; cubit / ketuk dua kali /
 * roda tetikus memperbesar; tombol Unduh lewat route `photos.download` (lampiran, bukan
 * tampilan - lihat PhotoDownloadController).
 *
 * SENGAJA bukan `ui/dialog` DialogContent: animasinya (zoom + geser dari kiri-atas, ease-spring
 * 300 ms) dan latar yang di-blur membuat pembukaan foto terasa aneh & berat di HP. Di sini
 * hanya PUDAR 200 ms di atas latar hitam pekat. Kembali (APK/iOS/browser) tetap menutup lewat
 * <DismissOnBack />, tarik-untuk-refresh dikunci <PullToRefreshLock />, sama dengan Dialog.
 */
export default function PhotoViewer({ viewer, onClose }) {
	const photos = viewer?.photos ?? [];
	const [api, setApi] = useState(null);
	const [current, setCurrent] = useState(viewer?.index ?? 0);
	// Dibaca Embla di awal tiap seretan: foto diperbesar = seretan milik foto, bukan carousel.
	const zoomedRef = useRef(false);
	const [zoomed, setZoomed] = useState(false);

	const onZoomChange = useCallback((z) => {
		zoomedRef.current = z;
		setZoomed(z);
	}, []);

	useEffect(() => {
		if (!api) return;
		const onSelect = () => setCurrent(api.selectedScrollSnap());
		onSelect();
		api.on('select', onSelect);
		return () => api.off('select', onSelect);
	}, [api]);

	useEffect(() => {
		if (viewer) setCurrent(viewer.index);
		zoomedRef.current = false;
		setZoomed(false);
	}, [viewer]);

	const many = photos.length > 1;
	const roundButton =
		'flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:bg-white/25 disabled:opacity-30';

	return (
		<DialogPrimitive.Root open={viewer !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogPrimitive.Portal>
				<DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
				<DialogPrimitive.Content
					aria-describedby={undefined}
					className="fixed inset-0 z-50 outline-none duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
				>
					<PullToRefreshLock />
					<DismissOnBack />
					<DialogPrimitive.Title className="sr-only">Foto kejadian</DialogPrimitive.Title>
					{viewer && (
						// key: buka foto lain = carousel baru yang mulai dari foto yang diketuk.
						<Carousel
							key={`${viewer.index}:${photos.join('|')}`}
							opts={{ startIndex: viewer.index, watchDrag: () => !zoomedRef.current }}
							setApi={setApi}
							className="h-dvh w-full"
						>
							<CarouselContent className="ml-0 h-dvh">
								{photos.map((path, i) => (
									<CarouselItem key={i} className="h-dvh pl-0">
										<ZoomableImage
											path={path}
											alt={`Foto ${i + 1}`}
											active={i === current}
											onZoomChange={onZoomChange}
											onClose={onClose}
										/>
									</CarouselItem>
								))}
							</CarouselContent>

							{/* Bilah atas: penghitung kiri, Unduh + Tutup kanan. */}
							<div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-black/50 px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
								<span className="text-sm font-medium tabular-nums text-white/90">
									{many ? `${current + 1} / ${photos.length}` : ''}
								</span>
								<div className="pointer-events-auto flex items-center gap-2">
									{photos[current] && (
										<a
											href={downloadUrlOf(photos[current])}
											download
											className={roundButton}
											title="Unduh foto"
										>
											<IconDownload size={20} />
											<span className="sr-only">Unduh foto</span>
										</a>
									)}
									<DialogPrimitive.Close className={roundButton} title="Tutup">
										<IconX size={20} />
										<span className="sr-only">Tutup</span>
									</DialogPrimitive.Close>
								</div>
							</div>

							{many && !zoomed && (
								<>
									<button
										type="button"
										onClick={() => api?.scrollPrev()}
										disabled={current === 0}
										className={cn(
											roundButton,
											'absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex',
										)}
									>
										<IconChevronLeft size={22} />
										<span className="sr-only">Foto sebelumnya</span>
									</button>
									<button
										type="button"
										onClick={() => api?.scrollNext()}
										disabled={current === photos.length - 1}
										className={cn(
											roundButton,
											'absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 sm:flex',
										)}
									>
										<IconChevronRight size={22} />
										<span className="sr-only">Foto berikutnya</span>
									</button>
								</>
							)}

							<p className="pointer-events-none absolute inset-x-0 bottom-0 z-10 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] text-center text-xs text-white/60">
								{zoomed
									? 'Ketuk dua kali untuk kembali'
									: 'Cubit atau ketuk dua kali untuk memperbesar'}
							</p>
						</Carousel>
					)}
				</DialogPrimitive.Content>
			</DialogPrimitive.Portal>
		</DialogPrimitive.Root>
	);
}
