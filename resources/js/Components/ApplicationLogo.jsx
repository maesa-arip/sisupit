import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function ApplicationLogo({ url = '/', size = 'size-10', isTitle = true, className }) {
	return (
		<Link
			href={url}
			className={cn(
				'group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-destructive',
				className,
			)}
		>
			{/* Ikon Logo Sisupit (brand baru: petir merah) */}
			<img
				src="/icon.png"
				alt="SISUPIT"
				className={cn('rounded-lg object-contain transition-transform', size)}
			/>

			{/* Area Teks Logo */}
			{isTitle && (
				// TASK_87 putaran 10 (keputusan user 2026-11-09): tagline merah kapital di bawah nama dibuang.
				<span className="text-xl font-bold leading-none tracking-tight text-foreground">SISUPIT</span>
			)}
		</Link>
	);
}
