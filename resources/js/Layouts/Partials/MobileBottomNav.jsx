import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { 
    IconDroplet,
    IconFiretruck, 
    IconFlame, 
    IconHistory, 
    IconHome, 
    IconLogin2, 
    IconUser,
    IconFireHydrant,
    IconMenu2,
    IconUsersGroup,
    IconBuilding,
    IconDashboard,
    IconLogout,
    IconClipboardPlus,
    IconHeartHandshake,
    IconSpeakerphone,
    IconSettings
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

export default function MobileBottomNav({ auth }) {
    const { url } = usePage();
    
    // 🛠️ Detektor Role Sapu Jagat (Sinkronisasi dengan Sidebar)
    const rawRoles = auth?.roles || auth?.role || auth?.user?.roles || auth?.user?.role || [];
    const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const userRoles = rolesArray.map(r => (typeof r === 'object' && r !== null) ? r.name : r);
    
    const isDashboardRedirect = userRoles.some(r => ['petugas', 'admin', 'relawan', 'superadmin'].includes(r));
    const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
    const isSuperadmin = userRoles.includes('superadmin');
    
    const [showFasilitas, setShowFasilitas] = useState(false);
    const fasilitasRef = useRef(null);

    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const adminMenuRef = useRef(null);

    const isActive = (path) => url.startsWith(path);
    const isFasilitasActive = isActive('/fire-stations') || isActive('/pumps') || isActive('/hydrants') || isActive('/relawan');
    const isAdminActive = isActive('/admin');

    useEffect(() => {
        function handleClickOutside(event) {
            if (fasilitasRef.current && !fasilitasRef.current.contains(event.target)) setShowFasilitas(false);
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) setShowAdminMenu(false);
        }
        if (showFasilitas || showAdminMenu) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFasilitas, showAdminMenu]);

    return (
        <>
            {(showFasilitas || showAdminMenu) && (
                <div className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20" onClick={() => { setShowFasilitas(false); setShowAdminMenu(false); }}></div>
            )}

            <div className="fixed bottom-0 left-0 z-50 w-full h-16 border-t bg-card border-border lg:hidden">
                <div className="grid h-full max-w-md grid-cols-5 px-1 mx-auto">

                    {/* 1. Beranda */}
                    <NavItem
                    href={route('dashboard')}
                        // href={auth?.name || auth?.user?.name ? (isDashboardRedirect ? route('dashboard') : route('home.index')) : route('home.index')}
                        icon={IconHome}
                        label="Beranda"
                        active={url === '/dashboard' || url === '/home' || url === '/'}
                    />

                    {/* 2. Fasilitas Publik */}
                    <div className="relative flex flex-col items-center justify-center w-full h-full" ref={fasilitasRef}>
                        {showFasilitas && (
                            <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2 flex flex-col p-1.5 bg-card border border-border shadow-lg rounded-xl w-44 animate-in slide-in-from-bottom-2 fade-in-20 duration-200 z-50">
                                <FloatingLink href={route('front.pumps.index')} active={isActive('/pumps')} icon={IconDroplet} label="SKKL" colorClass="text-info" bgClass="bg-info/10 text-info" onClick={() => setShowFasilitas(false)} />
                                <FloatingLink href={route('front.fire_stations.index')} active={isActive('/fire-stations')} icon={IconFiretruck} label="Pos Damkar" colorClass="text-destructive" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowFasilitas(false)} />
                                <FloatingLink href={route('front.hydrants.index')} active={isActive('/hydrants')} icon={IconFireHydrant} label="Lokasi Hydrant" colorClass="text-teal" bgClass="bg-teal/10 text-teal" onClick={() => setShowFasilitas(false)} />
                                <FloatingLink href={route('front.volunteers.index')} active={isActive('/relawan')} icon={IconHeartHandshake} label="Daftar Relawan" colorClass="text-info" bgClass="bg-info/10 text-info" onClick={() => setShowFasilitas(false)} />
                                <div className="absolute left-1/2 -bottom-[6px] -translate-x-1/2 w-3 h-3 bg-card border-b border-r border-border transform rotate-45"></div>
                            </div>
                        )}
                        <button
                            onClick={() => { setShowFasilitas(!showFasilitas); setShowAdminMenu(false); }}
                            className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none z-50", isFasilitasActive || showFasilitas ? "text-destructive" : "text-muted-foreground hover:text-foreground")}
                        >
                            <div className={cn("flex items-center justify-center p-1 rounded-md transition-colors", isFasilitasActive || showFasilitas ? "bg-destructive/10" : "bg-transparent")}>
                                <IconFiretruck className="w-5 h-5" stroke={isFasilitasActive || showFasilitas ? 2 : 1.5} />
                            </div>
                            <span className="text-[9px] font-semibold tracking-wide">Fasilitas</span>
                        </button>
                    </div>

                    {/* 3. SOS Spotlight */}
<div className="relative flex items-center justify-center w-full h-full px-1 py-2">
    <Link
        href={route('home.spotlight')}
        className={cn(
            "relative flex items-center justify-center w-full h-full text-white transition-all bg-red-700 rounded-lg shadow-sm hover:scale-105 active:scale-95 focus-visible:outline-none", 
            url === '/' || url === '/reports/create' ? "ring-2 ring-red-100 dark:ring-red-950 scale-105" : "focus-visible:ring-2 focus-visible:ring-red-700/50"
        )}
    >
        <div className="absolute inset-0 rounded-lg bg-white/20 animate-ping opacity-20"></div>
        <IconFlame className="relative z-10 w-6 h-6" stroke={2} />
    </Link>
</div>

                    {/* 4. Riwayat */}
                    <NavItem href={route('front.reports.index', { filter: 'mine' })} icon={IconHistory} label="Riwayat" />

                    {/* 5. Profil / Hub Kendali Admin Terpadu */}
                    {isAdmin ? (
                        <div className="relative flex flex-col items-center justify-center w-full h-full" ref={adminMenuRef}>
                            {showAdminMenu && (
                                <div className="absolute bottom-[72px] right-2 flex flex-col p-1.5 bg-card border border-border shadow-lg rounded-xl w-52 animate-in slide-in-from-bottom-2 fade-in-20 duration-200 z-50">
                                    <div className="px-2.5 py-1.5 mb-1 text-[10px] font-bold text-muted-foreground uppercase">Administrasi</div>

                                    {/* MENGARAHKAN HAK AKSES DRIVER KE RUTENAMA BACKEND YANG VALID */}
                                    <FloatingLink href={route('dashboard')} active={url === '/dashboard'} icon={IconDashboard} label="Dashboard Admin" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    <FloatingLink href={route('admin.users.index')} active={url.startsWith('/admin/users')} icon={IconUsersGroup} label="Kelola Pengguna" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    <FloatingLink href={route('admin.hydrants.index')} active={url.startsWith('/admin/facilities') || url.startsWith('/admin/hydrants')} icon={IconBuilding} label="Kelola Fasilitas" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    <FloatingLink href={route('admin.reports.index')} active={url.startsWith('/admin/reports')} icon={IconClipboardPlus} label="Verifikasi Laporan" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    <FloatingLink href={route('admin.announcements.index')} active={url.startsWith('/admin/announcements')} icon={IconSpeakerphone} label="Pengumuman Sistem" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    {isSuperadmin && (
                                        <FloatingLink href={route('admin.settings.edit')} active={url.startsWith('/admin/settings')} icon={IconSettings} label="Pengaturan Notifikasi" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />
                                    )}

                                    <div className="h-px w-full bg-border my-1.5"></div>
                                    <FloatingLink href={route('profile.edit')} active={isActive('/profile')} icon={IconUser} label="Profil Saya" colorClass="text-muted-foreground" bgClass="bg-destructive/10 text-destructive" onClick={() => setShowAdminMenu(false)} />

                                    <Link href={route('logout')} method="post" as="button" data={{ fcm_token: globalThis.__sisupitFcmToken }} className="flex items-center w-full gap-2.5 p-2.5 text-sm font-medium text-left text-destructive rounded-lg hover:bg-destructive/10 transition-colors mt-1">
                                        <IconLogout size={18} /> Keluar
                                    </Link>
                                    <div className="absolute right-[22px] -bottom-[6px] w-3 h-3 bg-card border-b border-r border-border transform rotate-45"></div>
                                </div>
                            )}
                            <button
                                onClick={() => { setShowAdminMenu(!showAdminMenu); setShowFasilitas(false); }}
                                className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none z-50", isAdminActive || showAdminMenu ? "text-destructive" : "text-muted-foreground hover:text-foreground")}
                            >
                                <div className={cn("flex items-center justify-center p-1 rounded-md transition-colors", isAdminActive || showAdminMenu ? "bg-destructive/10" : "bg-transparent")}>
                                    <IconMenu2 className="w-5 h-5" stroke={isAdminActive || showAdminMenu ? 2 : 1.5} />
                                </div>
                                <span className="text-[9px] font-semibold tracking-wide">Menu</span>
                            </button>
                        </div>
                    ) : (
                        <NavItem
                            icon={auth?.name || auth?.user?.name ? IconUser : IconLogin2} 
                            label={auth?.name || auth?.user?.name ? 'Profil' : 'Masuk'}
                            active={isActive('/profile')} 
                            href={auth?.name || auth?.user?.name ? route('profile.edit') : route('login')}
                        />
                    )}
                </div>
            </div>
        </>
    );
}

function NavItem({ href, icon: Icon, label, active }) {
    return (
        <Link
            href={href}
            className={cn("flex flex-col items-center justify-center w-full h-full gap-1 transition-colors outline-none z-50", active ? "text-destructive" : "text-muted-foreground hover:text-foreground")}
        >
            <div className={cn("flex items-center justify-center p-1 rounded-md transition-colors", active ? "bg-destructive/10" : "bg-transparent")}>
                <Icon className="w-5 h-5" stroke={active ? 2 : 1.5} />
            </div>
            <span className="text-[9px] font-semibold tracking-wide">{label}</span>
        </Link>
    );
}

function FloatingLink({ href, active, icon: Icon, label, colorClass, bgClass, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={cn("flex items-center gap-2.5 p-2.5 text-sm font-medium rounded-lg transition-colors mt-1 first:mt-0", active ? bgClass : "text-foreground hover:bg-accent")}
        >
            <Icon size={18} className={active ? "" : colorClass} />
            <span className="truncate">{label}</span>
        </Link>
    );
}