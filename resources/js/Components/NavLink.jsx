import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function NavLink({ active = false, url = '#', title, icon: Icon, className, ...props }) {
    return (
        <Link
            {...props}
            href={url}
            className={cn(
                // Base classes: w-full memastikan rentang full, overflow tersembunyi
                'flex items-center w-full gap-3 rounded-xl p-3 font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-red-500',
                
                // Active State: Gradasi red ke rose (mendukung dark mode)
                active
                    ? 'bg-gradient-to-r from-red-500 to-rose-500 dark:from-red-600 dark:to-rose-600 font-bold text-white shadow-sm'
                    
                // Inactive State: Warna redup dengan efek hover red
                    : 'text-muted-foreground hover:bg-red-50 dark:hover:bg-slate-800/50 hover:text-red-600 dark:hover:text-red-400',
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