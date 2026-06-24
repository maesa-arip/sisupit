import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconInnerShadowBottomRight } from '@tabler/icons-react';

export default function ApplicationLogo({ url = '/', size = 'size-7', isTitle = true, className }) {
    return (
        <Link href={url} className={cn("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-red-700 rounded-md", className)}>

            {/* Kotak Ikon Logo (Flat & Minimalis) */}
            <div className="flex items-center justify-center p-2 transition-colors rounded-lg bg-red-700 group-hover:bg-red-800">
                <IconInnerShadowBottomRight className={cn('text-white', size)} stroke={2} />
            </div>

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