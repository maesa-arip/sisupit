import { Link } from '@inertiajs/react';
import { IconHome, IconAlertTriangle, IconUser, IconLogin2 } from '@tabler/icons-react';

export default function MobileBottomNav({ url, auth }) {
    const isActive = (path) => {
        if (path === '/dashboard') return url === '/dashboard';
        return url.startsWith(path);
    };

    const navItems = [
        { name: 'Beranda', href: route('dashboard'), icon: IconHome, active: isActive('/dashboard') },
        { name: 'Darurat', href: route('front.reports.create'), icon: IconAlertTriangle, active: isActive('/reports/create') },
        { name: auth?.name ? 'Profil' : 'Masuk', href: auth?.name ? route('profile.edit') : route('login'), icon: auth?.name ? IconUser : IconLogin2, active: auth?.name ? isActive('/profile') : isActive('/login') }
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none lg:hidden">
            <div className="pointer-events-auto w-full max-w-[360px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-gray-200 dark:border-slate-600 rounded-full shadow-[0_15px_40px_-5px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] p-1.5">
                <div className="flex items-center justify-between w-full gap-1">
                    {navItems.map((item, index) => {
                        const Icon = item.icon;
                        const isDarurat = item.name === 'Darurat';

                        return (
                            <Link 
                                key={index} 
                                href={item.href} 
                                /* PERBAIKAN: flex-1 membuat semua item punya ruang yang sama besar, jadi lebarnya tidak ikut panjang teks */
                                className={`relative flex items-center justify-center outline-none group flex-1`}
                            >
                                <div className={`flex w-full items-center justify-center gap-2 px-2 py-3 rounded-full transition-all duration-500 ease-out ${
                                    item.active 
                                        ? (isDarurat ? 'bg-red-500 text-white shadow-md shadow-red-500/20' : 'bg-amber-500 text-white shadow-md shadow-amber-500/20') 
                                        : 'bg-transparent text-gray-500 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                }`}>
                                    <div className="relative flex items-center justify-center shrink-0">
                                        <Icon 
                                            className={`transition-all duration-500 ${!item.active && (isDarurat ? 'group-hover:text-red-500 group-hover:scale-105' : 'group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:scale-105')}`} 
                                            stroke={item.active ? 2.5 : 1.5} 
                                            size={22} 
                                        />
                                    </div>
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out flex items-center justify-center ${item.active ? 'max-w-[100px] opacity-100' : 'max-w-0 opacity-0'}`}>
                                        <span className="text-[13px] font-bold tracking-wide whitespace-nowrap">{item.name}</span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}