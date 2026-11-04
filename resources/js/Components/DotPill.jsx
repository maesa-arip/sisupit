import { cn } from '@/lib/utils';

// Warna titik per nada. Kelas ditulis utuh (bukan `bg-${tone}`) supaya tidak dibuang purge Tailwind.
const DOT = {
	destructive: 'bg-destructive',
	info: 'bg-info',
	success: 'bg-success',
	teal: 'bg-teal',
	warning: 'bg-warning',
	muted: 'bg-muted-foreground/50',
};

/**
 * Pil status netral bertitik (TASK_87, desain clean minimalis - branch feat/desain-clean-minimalis + dev).
 * Rupa sama dengan `StatusBadge` untuk status laporan: pil putih bergaris, teks gelap, warna hanya di
 * titik kecil (kesepakatan desain "warna status hanya berupa titik"). Dipakai untuk status fasilitas.
 */
export default function DotPill({ tone = 'muted', className, children }) {
	return (
		<span
			className={cn(
				'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-foreground',
				className,
			)}
		>
			<span aria-hidden="true" className={cn('h-1.5 w-1.5 shrink-0 rounded-full', DOT[tone] || DOT.muted)} />
			{children}
		</span>
	);
}
