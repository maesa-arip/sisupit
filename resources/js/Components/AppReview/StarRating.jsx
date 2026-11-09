import { cn } from '@/lib/utils';
import { IconStar, IconStarFilled } from '@tabler/icons-react';

const LABELS = ['Sangat buruk', 'Buruk', 'Cukup', 'Bagus', 'Sangat membantu'];

export const ratingLabel = (rating) => LABELS[rating - 1] ?? '';

/**
 * Bintang ulasan aplikasi (TASK_86). Tanpa `onChange` = tampilan saja (kecil, untuk daftar &
 * testimoni). Dengan `onChange` = pemilih: tiap bintang tombol >= 44px supaya mudah diketuk di HP.
 */
export default function StarRating({ value = 0, onChange, size = 'md', className }) {
	const interactive = typeof onChange === 'function';
	const iconClass = size === 'lg' ? 'h-9 w-9' : size === 'sm' ? 'h-4 w-4' : 'h-6 w-6';

	if (!interactive) {
		return (
			<span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} dari 5 bintang`}>
				{[1, 2, 3, 4, 5].map((star) =>
					star <= value ? (
						<IconStarFilled key={star} className={cn(iconClass, 'text-foreground')} />
					) : (
						<IconStar key={star} className={cn(iconClass, 'text-muted-foreground/40')} stroke={1.5} />
					),
				)}
			</span>
		);
	}

	return (
		<div role="radiogroup" aria-label="Jumlah bintang" className={cn('flex items-center gap-1', className)}>
			{[1, 2, 3, 4, 5].map((star) => (
				<button
					key={star}
					type="button"
					role="radio"
					aria-checked={value === star}
					aria-label={`${star} bintang - ${ratingLabel(star)}`}
					onClick={() => onChange(star)}
					className="flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-90 motion-reduce:active:scale-100"
				>
					{star <= value ? (
						<IconStarFilled className={cn(iconClass, 'text-foreground')} />
					) : (
						<IconStar className={cn(iconClass, 'text-muted-foreground/50')} stroke={1.5} />
					)}
				</button>
			))}
		</div>
	);
}
