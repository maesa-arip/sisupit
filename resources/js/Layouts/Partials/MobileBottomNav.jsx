import { Link } from '@inertiajs/react';
import { IconHome, IconAlertTriangle, IconUser, IconLogin2 } from '@tabler/icons-react';

export default function MobileBottomNav({ url, auth }) {
    const isActive = (path) => {
        if (path === '/dashboard') return url === '/dashboard';
        return url.startsWith(path);
    };

    return (
        // Gunakan pb-[env(safe-area-inset-bottom)] agar tidak tertutup garis home iPhone
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden">
            <div className="relative flex items-center justify-between w-full h-16 px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.4)]">
                
                {/* KIRI: Beranda */}
                <Link 
                    href={route('dashboard')} 
                    className="flex flex-col items-center justify-center flex-1 gap-1 outline-none group"
                >
                    <IconHome 
                        size={24} 
                        stroke={isActive('/dashboard') ? 2.5 : 1.5} 
                        className={`transition-colors duration-200 ${
                            isActive('/dashboard') 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                        }`} 
                    />
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                        isActive('/dashboard') 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                    }`}>
                        Beranda
                    </span>
                </Link>

                {/* TENGAH: TOMBOL DARURAT (Center Prominent Button) */}
                <div className="relative flex justify-center flex-1">
                    <Link 
                        href={route('front.reports.create')}
                        className="absolute flex flex-col items-center justify-center w-16 h-16 transition-transform duration-300 border-[4px] border-white dark:border-slate-900 rounded-full shadow-lg outline-none bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-800 -top-8 hover:scale-105 hover:shadow-red-500/40 focus:ring-4 focus:ring-red-500/30"
                    >
                        <IconAlertTriangle 
                            size={28} 
                            stroke={2.5} 
                            className="text-white" 
                        />
                        {/* Opsional: Jika ingin teks 'Lapor' di dalam/bawah tombol tengah */}
                        <span className="text-[9px] font-bold text-white uppercase tracking-wider mt-0.5">
                            Lapor
                        </span>
                    </Link>
                </div>

                {/* KANAN: Profil / Masuk */}
                <Link 
                    href={auth?.name ? route('profile.edit') : route('login')} 
                    className="flex flex-col items-center justify-center flex-1 gap-1 outline-none group"
                >
                    {auth?.name ? (
                        <IconUser 
                            size={24} 
                            stroke={isActive('/profile') ? 2.5 : 1.5} 
                            className={`transition-colors duration-200 ${
                                isActive('/profile') 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                            }`} 
                        />
                    ) : (
                        <IconLogin2 
                            size={24} 
                            stroke={isActive('/login') ? 2.5 : 1.5} 
                            className={`transition-colors duration-200 ${
                                isActive('/login') 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                            }`} 
                        />
                    )}
                    <span className={`text-[10px] font-semibold transition-colors duration-200 ${
                        isActive('/profile') || isActive('/login')
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-300'
                    }`}>
                        {auth?.name ? 'Profil' : 'Masuk'}
                    </span>
                </Link>

            </div>
        </div>
    );
}