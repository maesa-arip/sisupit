import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function NavLinkResponsive({ active = false, url = '#', title, icon: Icon, ...props }) {
	return (
		<Link
			{...props}
			href={url}
			className={cn(
				active
					? 'bg-warning font-semibold text-warning-foreground hover:text-warning-foreground'
					: 'text-muted-foreground hover:text-warning',
				'flex items-center gap-3 rounded-lg p-2 font-medium transition-all',
			)}
		>
			<Icon className="h-4 w-4" />
			{title}
		</Link>
	);
}
