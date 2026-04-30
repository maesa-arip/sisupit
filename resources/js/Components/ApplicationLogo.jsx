import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconInnerShadowBottomRight } from '@tabler/icons-react';

export default function ApplicationLogo({ url = '/', size = 'size-7', isTitle = true, className }) {
    return (
        <Link href={url} className={cn("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg rounded-r-2xl", className)}>
            
            {/* Kotak Ikon Logo yang Elegan */}
            <div className="flex items-center justify-center p-2.5 transition-all rounded-[14px] bg-gradient-to-br from-amber-500 to-orange-600 shadow-sm group-hover:shadow-md group-hover:scale-105">
                <IconInnerShadowBottomRight className={cn('text-white', size)} stroke={2.5} />
            </div>
            
            {/* Area Teks Logo */}
            {isTitle && (
                <div className="flex flex-col justify-center">
                    <span className="text-xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-slate-100">
                        Sisupit
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest mt-1">
                        Pahlawan Sekitar
                    </span>
                </div>
            )}
            
        </Link>
    );
}