import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function ApplicationLogo({ url = '/', size = 'size-10', isTitle = true, className }) {
	return (
		<Link
			href={url}
			className={cn(
				'group flex items-center gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-red-700',
				className,
			)}
		>
			{/* Ikon Logo Sisupit (brand baru: petir merah) */}
			<img
				src="/icon.png"
				alt="SISUPIT"
				className={cn('rounded-lg object-contain transition-transform group-hover:scale-105', size)}
			/>

			{/* Area Teks Logo */}
			{isTitle && (
				<div className="flex flex-col justify-center">
					<span className="text-xl font-bold leading-none tracking-tight text-foreground">SISUPIT</span>
					<span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-destructive">
						Sistem Untuk Pelaporan Dini Terintegrasi
					</span>
				</div>
			)}
		</Link>
	);
}
