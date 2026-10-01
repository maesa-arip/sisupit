import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function NavLink({
	active = false,
	url = '#',
	title,
	icon: Icon,
	className,
	// Kelas tambahan untuk label. Dipakai sidebar mode rail (tablet) untuk menyembunyikan
	// teks lewat CSS saja — komponen yang sama tetap menampilkan label penuh di layar besar
	// maupun di dalam Sheet menu mobile.
	labelClassName,
	...props
}) {
	return (
		<Link
			{...props}
			href={url}
			// Tooltip native: satu-satunya penanda tujuan saat label disembunyikan di mode rail.
			title={typeof title === 'string' ? title : undefined}
			className={cn(
				// Base classes: w-full memastikan rentang full, overflow tersembunyi
				'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 active:bg-muted',

				// Aktif = sorotan bertint seperti sidebar iPadOS/macOS (apple-design, TASK_69, khusus branch
				// ini) - dulu blok merah padat, yang di dalam daftar menu terbaca seperti tombol darurat.
				active
					? 'bg-primary/10 font-semibold text-primary'
					: 'text-foreground/80 hover:bg-muted hover:text-foreground',
				className,
			)}
		>
			{/* shrink-0 memastikan ikon tidak gepeng saat teks panjang */}
			{Icon && <Icon className="h-5 w-5 shrink-0" />}

			{/* truncate memotong teks menjadi "..." jika melewati batas sidebar */}
			<span className={cn('truncate', labelClassName)}>{title}</span>
		</Link>
	);
}
