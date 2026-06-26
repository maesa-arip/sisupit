import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export default function ApplicationLogo({ url = '/', size = 'size-10', isTitle = true, className }) {
    return (
        <Link href={url} className={cn("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-red-700 rounded-md", className)}>

            {/* Ikon Logo Sisupit (brand baru: petir merah) */}
            <img
                src="/icon.png"
                alt="SISUPIT"
                className={cn('rounded-lg object-contain transition-transform group-hover:scale-105', size)}
            />

            {/* Area Teks Logo */}
            {isTitle && (
                <div className="flex flex-col justify-center">
                    <span className="text-xl font-bold leading-none tracking-tight text-foreground">
                       SISUPIT
                    </span>
                    <span className="text-[10px] font-bold text-destructive uppercase tracking-widest mt-1">
                        
                        Sistem Untuk Pelaporan Dini Terintegrasi
                    </span>
                </div>
            )}
            
        </Link>
    );
}