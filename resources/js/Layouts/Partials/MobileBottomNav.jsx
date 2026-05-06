import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { 
    IconDroplet,
    IconFiretruck, 
    IconFlame, 
    IconHistory, 
    IconHome, 
    IconLogin2, 
    IconUser 
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

export default function MobileBottomNav({auth}) {
    const { url } = usePage();
    const userRoles = Array.isArray(auth?.role) ? auth.role : (auth?.role ? [auth.role] : []);
    const isDashboardRedirect = userRoles.includes('petugas') || userRoles.includes('admin') || userRoles.includes('relawan');
    
    // State untuk mengontrol buka/tutup menu Fasilitas
    const [showFasilitas, setShowFasilitas] = useState(false);
    const menuRef = useRef(null);

    // Fungsi pembantu untuk mengecek halaman aktif
    const isActive = (path) => url.startsWith(path);
    const isFasilitasActive = isActive('/fire-stations') || isActive('/pumps');

    // Menutup menu jika pengguna mengklik di luar area menu
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowFasilitas(false);
            }
        }
        if (showFasilitas) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showFasilitas]);

    return (
        <>
            {/* Lapisan transparan (Overlay) agar bisa ditutup dengan klik di mana saja */}
            {showFasilitas && (
                <div className="fixed inset-0 z-40" onClick={() => setShowFasilitas(false)}></div>
            )}

            <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-[#e5e5e5] sm:hidden dark:bg-[#151515] dark:border-[#262626]">
                <div className="grid h-full max-w-md grid-cols-5 px-1 mx-auto">
                    
                    {/* 1. Menu Beranda */}
                    <NavItem 
                    href={auth?.name && isDashboardRedirect ? route('dashboard') : route('home.index')} 
                    icon={IconHome} 
                    label="Beranda" 
                    active={url === '/dashboard' || url === '/home'}
                />

                    {/* 2. Menu Fasilitas (Interaktif) */}
                    <div className="relative flex flex-col items-center justify-center w-full h-full" ref={menuRef}>
                        
                        {/* --- FLOATING MENU FASILITAS --- */}
                        {showFasilitas && (
                            <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex flex-col p-1.5 bg-white border border-[#e5e5e5] shadow-lg rounded-xl dark:bg-[#151515] dark:border-[#262626] w-40 animate-in slide-in-from-bottom-2 fade-in-20 duration-200 z-50">
                                
                                <Link
                                    href={route('front.pumps.index')}
                                    onClick={() => setShowFasilitas(false)}
                                    className={cn(
                                        "flex items-center gap-2.5 p-2.5 text-sm font-medium rounded-lg transition-colors",
                                        isActive('/pumps') 
                                            ? "bg-blue-50 text-blue-700 dark:bg-[#111e36] dark:text-blue-500" 
                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#1f1f1f]"
                                    )}
                                >
                                    <IconDroplet size={18} className={isActive('/pumps') ? "" : "text-blue-500"} />
                                    Pompa Air
                                </Link>
                                
                                <Link
                                    href={route('front.fire_stations.index')}
                                    onClick={() => setShowFasilitas(false)}
                                    className={cn(
                                        "flex items-center gap-2.5 p-2.5 text-sm font-medium rounded-lg transition-colors mt-1",
                                        isActive('/fire-stations') 
                                            ? "bg-red-50 text-[#b42826] dark:bg-[#2a1313] dark:text-[#e54845]" 
                                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-[#1f1f1f]"
                                    )}
                                >
                                    <IconFiretruck size={18} className={isActive('/fire-stations') ? "" : "text-[#b42826] dark:text-[#e54845]"} />
                                    Pos Damkar
                                </Link>

                                {/* Ekor Panah Segitiga */}
                                <div className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#151515] border-b border-r border-[#e5e5e5] dark:border-[#262626] transform rotate-45"></div>
                            </div>
                        )}

                        {/* Tombol Pemicu Menu */}
                        <button
                            onClick={() => setShowFasilitas(!showFasilitas)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none z-50",
                                isFasilitasActive || showFasilitas ? "text-[#b42826] dark:text-[#e54845]" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center p-1 rounded-md transition-colors",
                                isFasilitasActive || showFasilitas ? "bg-red-50 dark:bg-[#2a1313]" : "bg-transparent"
                            )}>
                                <IconFiretruck className="w-5 h-5" stroke={isFasilitasActive || showFasilitas ? 2 : 1.5} />
                            </div>
                            <span className="text-[9px] font-semibold tracking-wide">
                                Fasilitas
                            </span>
                        </button>
                    </div>

                    {/* 3. CENTER BUTTON (SPOTLIGHT - Gerbang Utama '/') */}
                    <div className="relative flex items-center justify-center w-full h-full">
                        <Link
                            href={route('home.spotlight')}
                            className={cn(
                                "absolute -top-5 flex items-center justify-center w-[52px] h-[52px] text-white transition-all bg-[#b42826] rounded-xl shadow-sm hover:scale-105 active:scale-95 focus-visible:outline-none",
                                url === '/' 
                                    ? "ring-4 ring-red-100 dark:ring-[#4a1c1c] scale-105" 
                                    : "focus-visible:ring-2 focus-visible:ring-[#b42826]/50"
                            )}
                        >
                            <div className="absolute inset-0 rounded-xl bg-white/20 animate-ping opacity-20"></div>
                            <IconFlame className="relative z-10 w-6 h-6" stroke={2} />
                        </Link>
                    </div>

                    {/* 4. Menu Riwayat */}
                    <NavItem 
                        href={route('front.reports.index')} 
                        icon={IconHistory} 
                        label="Riwayat" 
                        active={isActive('/reports')} 
                    />

                    {/* 5. Menu Profil */}
                    <NavItem
                icon={auth?.name ? IconUser : IconLogin2} 
                    label={auth?.name ? 'Profil' : 'Masuk'}
                    active={isActive('/profile')} 
                    href={auth?.name ? route('profile.edit') : route('login')}
                    className="flex flex-col items-center justify-center w-16 gap-1 transition-transform duration-200 outline-none group active:scale-95"
                >
                </NavItem>

                </div>
            </div>
        </>
    );
}

// Sub-komponen NavItem
function NavItem({ href, icon: Icon, label, active }) {
    return (
        <Link 
            href={href} 
            className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none z-50",
                active ? "text-[#b42826] dark:text-[#e54845]" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            )}
        >
            <div className={cn(
                "flex items-center justify-center p-1 rounded-md transition-colors",
                active ? "bg-red-50 dark:bg-[#2a1313]" : "bg-transparent"
            )}>
                <Icon className="w-5 h-5" stroke={active ? 2 : 1.5} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide">
                {label}
            </span>
        </Link>
    );
}