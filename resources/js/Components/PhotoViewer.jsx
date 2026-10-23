import { Carousel, CarouselContent, CarouselItem } from '@/Components/ui/carousel';
import { Dialog, DialogContent } from '@/Components/ui/dialog';
import { cn } from '@/lib/utils';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Penampil foto layar penuh yang bisa digeser (#215). Dulu dialog hanya memegang SATU foto,
 * jadi melihat foto berikutnya harus tutup lalu buka lagi. Kini `viewer` = { photos, index }:
 * daftar path satu kelompok (lampiran laporan / foto satu entri berita acara) + foto yang
 * diketuk. Geser (HP), tombol kiri/kanan, atau panah keyboard berpindah foto.
 */
export default function PhotoViewer({ viewer, onClose }) {
	const photos = viewer?.photos ?? [];
	const [api, setApi] = useState(null);
	const [current, setCurrent] = useState(viewer?.index ?? 0);

	useEffect(() => {
		if (!api) return;
		const onSelect = () => setCurrent(api.selectedScrollSnap());
		onSelect();
		api.on('select', onSelect);
		return () => api.off('select', onSelect);
	}, [api]);

	const many = photos.length > 1;
	const navButton =
		'absolute top-1/2 z-50 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40 sm:flex';

	return (
		<Dialog open={viewer !== null} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="flex w-[95vw] max-w-4xl items-center justify-center border-none bg-transparent p-0 shadow-none outline-none md:w-full [&>button]:hidden">
				{viewer && (
					// key: buka foto lain = carousel baru yang mulai dari foto yang diketuk.
					<Carousel
						key={`${viewer.index}:${photos.join('|')}`}
						opts={{ startIndex: viewer.index }}
						setApi={setApi}
						className="w-full"
					>
						<button
							type="button"
							onClick={onClose}
							className="absolute right-2 top-2 z-50 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-none hover:bg-muted"
						>
							<IconX size={20} />
							<span className="sr-only">Tutup</span>
						</button>
						<CarouselContent>
							{photos.map((path, i) => (
								<CarouselItem key={i} className="flex items-center justify-center">
									<img
										src={`/storage/${path}`}
										onError={(e) => (e.target.src = path)}
										className="h-auto max-h-[90vh] w-auto max-w-full select-none rounded-xl border border-border bg-black/20 object-contain shadow-none"
										draggable={false}
										alt={`Bukti ${i + 1}`}
									/>
								</CarouselItem>
							))}
						</CarouselContent>
						{many && (
							<>
								<button
									type="button"
									onClick={() => api?.scrollPrev()}
									disabled={current === 0}
									className={cn(navButton, 'left-2')}
								>
									<IconChevronLeft size={20} />
									<span className="sr-only">Foto sebelumnya</span>
								</button>
								<button
									type="button"
									onClick={() => api?.scrollNext()}
									disabled={current === photos.length - 1}
									className={cn(navButton, 'right-2')}
								>
									<IconChevronRight size={20} />
									<span className="sr-only">Foto berikutnya</span>
								</button>
								<div className="pointer-events-none absolute bottom-2 left-1/2 z-50 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium tabular-nums text-white">
									{current + 1} / {photos.length}
								</div>
							</>
						)}
					</Carousel>
				)}
			</DialogContent>
		</Dialog>
	);
}
