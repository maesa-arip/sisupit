import StarRating from '@/Components/AppReview/StarRating';
import { cn, roleLabel } from '@/lib/utils';
import { IconQuote } from '@tabler/icons-react';

/**
 * Testimoni pengguna di halaman depan (TASK_86). Isinya dari AppReview::testimonials(): hanya
 * ulasan yang pemiliknya izinkan DAN admin setujui, nama publik = nama sapaan + inisial. Tidak
 * dirender sama sekali bila belum ada - seksi kosong di halaman darurat hanya memakan layar.
 */
export default function Testimonials({ items, title = 'Kata Mereka tentang Sisupit', className, gridClassName }) {
	if (!items?.length) return null;

	return (
		<section className={cn('w-full', className)}>
			<h2 className="text-center text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
			<div className={cn('mt-4 grid gap-3', gridClassName)}>
				{items.map((item) => (
					<figure
						key={item.id}
						className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 text-left shadow-sm"
					>
						<div className="flex items-center justify-between gap-2">
							<StarRating value={item.rating} size="sm" />
							<IconQuote className="h-5 w-5 text-muted-foreground/30" stroke={1.5} />
						</div>
						<blockquote className="whitespace-pre-line break-words text-[15px] leading-relaxed text-foreground">
							{item.comment}
						</blockquote>
						<figcaption className="mt-auto text-[13px] text-muted-foreground">
							<span className="font-semibold text-foreground">{item.name}</span>
							{item.role ? ` - ${roleLabel(item.role)}` : ''}
						</figcaption>
					</figure>
				))}
			</div>
		</section>
	);
}
