import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconInnerShadowBottomRight } from '@tabler/icons-react';

export default function ApplicationLogo({ url = '/', size = 'size-7', isTitle = true, className }) {
    return (
        <Link href={url} className={cn("flex items-center gap-3 outline-none group focus-visible:ring-2 focus-visible:ring-[#b42826] rounded-md", className)}>
            
            {/* Kotak Ikon Logo (Flat & Minimalis) */}
            <div className="flex items-center justify-center p-2 transition-colors rounded-lg bg-[#b42826] group-hover:bg-[#9a2220]">
                <IconInnerShadowBottomRight className={cn('text-white', size)} stroke={2} />
            </div>
            
            {/* Area Teks Logo */}
            {isTitle && (
                <div className="flex flex-col justify-center">
                    <span className="text-xl font-bold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                        Sisupit
                    </span>
                    <span className="text-[10px] font-bold text-[#b42826] dark:text-[#e54845] uppercase tracking-widest mt-1">
                        Pahlawan Sekitar
                    </span>
                </div>
            )}
            
        </Link>
    );
}