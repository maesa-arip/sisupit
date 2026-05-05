import { Link } from '@inertiajs/react';
import { IconHome, IconAlertTriangle, IconLogin2 } from '@tabler/icons-react';

export default function MobileBottomNav({ url, auth }) {
    const isActive = (path) => {
        if (path === '/dashboard') return url === '/dashboard';
        return url.startsWith(path);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[60] pb-[env(safe-area-inset-bottom)] lg:hidden">
            
            {/* Latar Navbar dengan lengkungan (rounded-t-xl) yang konsisten dengan desain Card di gambar */}
            <div className="relative flex items-center justify-between w-full h-[64px] px-8 bg-white dark:bg-[#151515] border-t border-[#e5e5e5] dark:border-[#262626] rounded-t-xl shadow-sm">

                {/* KIRI: Beranda */}
                <Link
                    href={route('dashboard')}
                    className="flex flex-col items-center justify-center w-16 gap-1 transition-transform duration-200 outline-none group active:scale-95"
                >
                    <IconHome
                        size={22}
                        stroke={isActive('/dashboard') ? 2 : 1.5}
                        className={`transition-colors duration-300 ${
                            isActive('/dashboard')
                            ? 'text-gray-900 dark:text-gray-100'
                            : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400'
                        }`}
                    />
                    <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                        isActive('/dashboard')
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                        Beranda
                    </span>
                </Link>

                {/* TENGAH: Tombol Darurat (Bentuk Rounded Rectangle menyesuaikan tombol di referensi) */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-[18px]">
                    <Link
                        href={route('front.reports.create')}
                        className="relative flex flex-col items-center justify-center transition-all duration-200 outline-none
                            w-[60px] h-[60px] rounded-xl
                            bg-[#b42826] hover:bg-[#9a2220] text-white
                            border border-[#9a2220] dark:border-[#b42826]
                            shadow-sm
                            focus:ring-2 focus:ring-[#b42826]/50 focus:outline-none
                            active:scale-95"
                        aria-label="Laporkan Kejadian Darurat"
                    >
                        <IconAlertTriangle
                            size={22}
                            stroke={2}
                            className="mb-0.5"
                        />
                        <span className="text-[10px] font-medium leading-none tracking-wide">
                            Lapor
                        </span>
                    </Link>
                </div>

                {/* KANAN: Profil / Masuk */}
                <Link
                    href={auth?.name ? route('profile.edit') : route('login')}
                    className="flex flex-col items-center justify-center w-16 gap-1 transition-transform duration-200 outline-none group active:scale-95"
                >
                    {auth?.name ? (
                        auth.avatar ? (
                            <img
                                src={auth.avatar}
                                alt="Avatar"
                                className={`w-[22px] h-[22px] rounded-md object-cover transition-all duration-300 ${
                                    isActive('/profile')
                                    ? 'border border-gray-900 dark:border-gray-100'
                                    : 'border border-transparent opacity-80 group-hover:opacity-100'
                                }`}
                            />
                        ) : (
                            <div className={`flex items-center justify-center w-[22px] h-[22px] rounded-md text-[10px] font-medium transition-all duration-300 ${
                                isActive('/profile')
                                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-[#101010]'
                                : 'bg-gray-100 text-gray-500 border border-[#e5e5e5] dark:bg-[#1f1f1f] dark:text-gray-400 dark:border-[#262626]'
                            }`}>
                                {auth.name.substring(0, 1).toUpperCase()}
                            </div>
                        )
                    ) : (
                        <IconLogin2
                            size={22}
                            stroke={isActive('/login') ? 2 : 1.5}
                            className={`transition-colors duration-300 ${
                                isActive('/login')
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-400'
                            }`}
                        />
                    )}
                    <span className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                        isActive('/profile') || isActive('/login')
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}>
                        {auth?.name ? 'Profil' : 'Masuk'}
                    </span>
                </Link>

            </div>
        </div>
    );
}