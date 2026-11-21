import StarRating from '@/Components/AppReview/StarRating';
import { Carousel, CarouselContent, CarouselItem } from '@/Components/ui/carousel';
import { cn, roleLabel } from '@/lib/utils';
import { IconQuote } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

/**
 * Testimoni pengguna di halaman depan (TASK_86). Isinya dari AppReview::testimonials(): semua
 * ulasan yang tidak disembunyikan admin, termasuk yang hanya bintang (comment null = tanpa
 * kutipan), yang berkomentar didahulukan, nama publik = nama sapaan + inisial. Tidak
 * dirender sama sekali bila belum ada - seksi kosong di halaman darurat hanya memakan layar.
 *
 * `carousel` (Spotlight, #249): satu baris yang digeser - kartu berikutnya mengintip sebagai tanda
 * bisa digeser, jadi banyak ulasan tak memanjangkan halaman darurat. Tanpa itu = grid (Landing).
 */
export default function Testimonials({
	items,
	title = 'Kata Mereka tentang Sisupit',
	className,
	gridClassName,
	carousel = false,
}) {
	if (!items?.length) return null;

	return (
		<section className={cn('w-full', className)}>
			<h2 className="text-center text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
			{carousel ? (
				<TestimonialCarousel items={items} />
			) : (
				<div className={cn('mt-4 grid gap-3', gridClassName)}>
					{items.map((item) => (
						<TestimonialCard key={item.id} item={item} />
					))}
				</div>
			)}
		</section>
	);
}

function TestimonialCarousel({ items }) {
	const [api, setApi] = useState(null);
	const [selected, setSelected] = useState(0);
	const [snaps, setSnaps] = useState(0);

	useEffect(() => {
		if (!api) return;
		const sync = () => {
			setSelected(api.selectedScrollSnap());
			setSnaps(api.scrollSnapList().length);
		};
		sync();
		api.on('select', sync);
		api.on('reInit', sync);
		return () => {
			api.off('select', sync);
			api.off('reInit', sync);
		};
	}, [api]);

	return (
		<Carousel setApi={setApi} opts={{ align: 'start' }} className="mt-4" aria-label="Testimoni pengguna">
			<CarouselContent className="-ml-3">
				{items.map((item, index) => (
					<CarouselItem
						key={item.id}
						className="basis-[85%] pl-3 sm:basis-1/2"
						aria-label={`${index + 1} dari ${items.length}`}
					>
						<TestimonialCard item={item} className="h-full" />
					</CarouselItem>
				))}
			</CarouselContent>
			{snaps > 1 && (
				<div className="mt-3 flex justify-center gap-0.5">
					{Array.from({ length: snaps }, (_, index) => (
						<button
							key={index}
							type="button"
							aria-label={`Testimoni ${index + 1}`}
							aria-current={index === selected}
							onClick={() => api?.scrollTo(index)}
							className="flex h-6 w-5 items-center justify-center"
						>
							<span
								className={cn(
									'h-1.5 rounded-full transition-all duration-200',
									index === selected ? 'w-4 bg-foreground/60' : 'w-1.5 bg-muted-foreground/30',
								)}
							/>
						</button>
					))}
				</div>
			)}
		</Carousel>
	);
}

function TestimonialCard({ item, className }) {
	return (
		<figure
			className={cn(
				'flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm',
				className,
			)}
		>
			<div className="flex items-center justify-between gap-2">
				<StarRating value={item.rating} size="sm" />
				<IconQuote className="h-5 w-5 text-muted-foreground/30" stroke={1.5} />
			</div>
			{item.comment && (
				<blockquote className="whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">
					{item.comment}
				</blockquote>
			)}
			<figcaption className="mt-auto text-[13px] text-muted-foreground">
				<span className="font-semibold text-foreground">{item.name}</span>
				{item.role ? ` - ${roleLabel(item.role)}` : ''}
			</figcaption>
		</figure>
	);
}
