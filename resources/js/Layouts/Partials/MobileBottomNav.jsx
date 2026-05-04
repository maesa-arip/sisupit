import { Link } from '@inertiajs/react';
import { IconHome, IconAlertTriangle, IconLogin2 } from '@tabler/icons-react';

export default function MobileBottomNav({ url, auth }) {
    const isActive = (path) => {
        if (path === '/dashboard') return url === '/dashboard';
        return url.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden">
            
            <div className="relative flex items-center justify-between w-full h-[72px] px-8 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-t-[32px] border-t border-gray-200/50 dark:border-slate-800/50 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">

                {/* KIRI: Beranda */}
                <Link
                    href={route('dashboard')}
                    className="flex flex-col items-center justify-center w-16 gap-1.5 py-2 outline-none group transition-transform duration-200 active:scale-[0.92]"
                >
                    <IconHome
                        size={26}
                        stroke={isActive('/dashboard') ? 2.5 : 2}
                        className={`transition-colors duration-300 ${
                            isActive('/dashboard')
                            ? 'text-blue-600 dark:text-blue-500'
                            : 'text-gray-400 group-hover:text-blue-500/70 dark:text-slate-500'
                        }`}
                    />
                    <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                        isActive('/dashboard')
                        ? 'text-blue-600 dark:text-blue-500 translate-y-0 opacity-100'
                        : 'text-gray-400 dark:text-slate-500 translate-y-0.5 opacity-80'
                    }`}>
                        Beranda
                    </span>
                </Link>

                {/* TENGAH: Tombol Darurat */}
                {/* REVISI: Tombol diturunkan menjadi -top-[14px] agar lebih membumi / terbenam */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-[14px]">
                    
                    {/* Efek Glow Merah Berdenyut di Belakang Tombol */}
                    <div className="absolute inset-0 translate-y-2 rounded-full bg-red-500/30 dark:bg-red-600/30 blur-xl animate-pulse"></div>
                    
                    <Link
                        href={route('front.reports.create')}
                        className="relative flex flex-col items-center justify-center transition-all duration-300 rounded-full outline-none
                            w-[68px] h-[68px]
                            border-[6px] border-white dark:border-slate-900
                            bg-gradient-to-b from-red-500 to-red-600 dark:from-red-600 dark:to-red-700
                            shadow-xl shadow-red-500/40
                            hover:-translate-y-0.5 hover:shadow-red-500/60
                            focus:ring-4 focus:ring-red-500/30 focus:outline-none
                            active:scale-95 active:translate-y-0"
                        aria-label="Laporkan Kejadian Darurat"
                    >
                        <IconAlertTriangle
                            size={28}
                            stroke={2.5}
                            className="text-white drop-shadow-sm"
                        />
                        <span className="text-[9px] font-black text-white uppercase tracking-widest mt-0.5 drop-shadow-sm leading-none">
                            Lapor
                        </span>
                    </Link>
                </div>

                {/* KANAN: Profil / Masuk */}
                <Link
                    href={auth?.name ? route('profile.edit') : route('login')}
                    className="flex flex-col items-center justify-center w-16 gap-1.5 py-2 outline-none group transition-transform duration-200 active:scale-[0.92]"
                >
                    {auth?.name ? (
                        auth.avatar ? (
                            <img
                                src={auth.avatar}
                                alt="Avatar"
                                className={`w-[26px] h-[26px] rounded-full object-cover transition-all duration-300 ${
                                    isActive('/profile')
                                    ? 'ring-[2.5px] ring-blue-600 dark:ring-blue-500 ring-offset-2 dark:ring-offset-white dark:ring-offset-slate-900'
                                    : 'ring-2 ring-transparent opacity-80 group-hover:opacity-100'
                                }`}
                            />
                        ) : (
                            <div className={`flex items-center justify-center w-[26px] h-[26px] rounded-full text-xs font-black transition-all duration-300 ${
                                isActive('/profile')
                                ? 'bg-blue-600 text-white dark:bg-blue-500 shadow-md shadow-blue-500/30 ring-[2.5px] ring-blue-600/30 ring-offset-2 dark:ring-offset-white dark:ring-offset-slate-900'
                                : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                            }`}>
                                {auth.name.substring(0, 1).toUpperCase()}
                            </div>
                        )
                    ) : (
                        <IconLogin2
                            size={26}
                            stroke={isActive('/login') ? 2.5 : 2}
                            className={`transition-colors duration-300 ${
                                isActive('/login')
                                ? 'text-blue-600 dark:text-blue-500'
                                : 'text-gray-400 group-hover:text-blue-500/70 dark:text-slate-500'
                            }`}
                        />
                    )}
                    <span className={`text-[10px] font-bold tracking-wide transition-all duration-300 ${
                        isActive('/profile') || isActive('/login')
                        ? 'text-blue-600 dark:text-blue-500 translate-y-0 opacity-100'
                        : 'text-gray-400 dark:text-slate-500 translate-y-0.5 opacity-80'
                    }`}>
                        {auth?.name ? 'Profil' : 'Masuk'}
                    </span>
                </Link>

            </div>
        </div>
    );
}