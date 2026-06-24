import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function NavLink({ active = false, url = '#', title, icon: Icon, className, ...props }) {
    return (
        <Link
            {...props}
            href={url}
            className={cn(
                // Base classes: w-full memastikan rentang full, overflow tersembunyi
                'flex items-center w-full gap-3 rounded-xl p-3 font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-destructive',

                // Active State: warna destructive solid (mendukung dark mode otomatis)
                active
                    ? 'bg-destructive font-bold text-destructive-foreground shadow-sm'

                // Inactive State: Warna redup dengan efek hover destructive
                    : 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive',
                className
            )}
        >
            {/* shrink-0 memastikan ikon tidak gepeng saat teks panjang */}
            {Icon && <Icon className="w-5 h-5 shrink-0" />}
            
            {/* truncate memotong teks menjadi "..." jika melewati batas sidebar */}
            <span className="truncate">{title}</span>
        </Link>
    );
}