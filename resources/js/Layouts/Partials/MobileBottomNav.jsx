import { Link } from '@inertiajs/react';
import { IconHome, IconAlertTriangle, IconUser, IconLogin2 } from '@tabler/icons-react';

export default function MobileBottomNav({ url, auth }) {
    const isActive = (path) => {
        if (path === '/dashboard') return url === '/dashboard';
        return url.startsWith(path);
    };

    return (
        // pb-[env(safe-area-inset-bottom)] = tidak tertutup garis home iPhone
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden">
            <div className="relative flex items-center justify-between w-full h-[68px] px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.4)]">

                {/* KIRI: Beranda */}
                <Link
                    href={route('dashboard')}
                    className="flex flex-col items-center justify-center flex-1 gap-1 py-2 outline-none group"
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

                {/* TENGAH: Tombol Darurat — FIX: diperbesar jadi 72px untuk kemudahan di kondisi panik */}
                <div className="relative flex justify-center flex-1">
                    <Link
                        href={route('front.reports.create')}
                        className="absolute flex flex-col items-center justify-center transition-all duration-300 rounded-full shadow-xl outline-none -top-10
                            w-[72px] h-[72px]
                            border-[4px] border-white dark:border-slate-900
                            bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-800
                            hover:scale-105 hover:shadow-red-500/50
                            focus:ring-4 focus:ring-red-500/30
                            active:scale-95"
                        aria-label="Laporkan Kejadian Darurat"
                    >
                        <IconAlertTriangle
                            size={30}
                            stroke={2.5}
                            className="text-white"
                        />
                        <span className="text-[9px] font-black text-white uppercase tracking-wider mt-0.5 leading-none">
                            Lapor
                        </span>
                    </Link>
                </div>

                {/* KANAN: Profil / Masuk */}
                <Link
                    href={auth?.name ? route('profile.edit') : route('login')}
                    className="flex flex-col items-center justify-center flex-1 gap-1 py-2 outline-none group"
                >
                    {auth?.name ? (
                        // FIX: Tampilkan avatar inisial jika ada, lebih personal
                        auth.avatar ? (
                            <img
                                src={auth.avatar}
                                alt="Avatar"
                                className={`w-7 h-7 rounded-full object-cover ring-2 transition-all duration-200 ${
                                    isActive('/profile')
                                    ? 'ring-blue-500'
                                    : 'ring-gray-200 dark:ring-slate-600'
                                }`}
                            />
                        ) : (
                            <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-extrabold transition-all duration-200 ${
                                isActive('/profile')
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                                {auth.name.substring(0, 1).toUpperCase()}
                            </div>
                        )
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
