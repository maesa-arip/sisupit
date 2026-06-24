import NavLink from '@/Components/NavLink';
import {
    IconBuilding,
    IconClipboardPlus,
    IconDashboard,
    IconLogin2,
    IconLogout,
    IconUser,
    IconDroplet,
    IconFiretruck,
    IconUsersGroup,
    IconMapPin,
    IconFlame,
    IconHistory,
    IconSpeakerphone,
    IconFireHydrant,
    IconSettings
} from '@tabler/icons-react';

export default function Sidebar({ url, auth }) {
    // 🛠️ Detektor Role Sapu Jagat (Kebal Segala Format Output Spatie)
    const rawRoles = auth?.roles || auth?.role || auth?.user?.roles || auth?.user?.role || [];
    const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
    const userRoles = rolesArray.map(r => (typeof r === 'object' && r !== null) ? r.name : r);
    
    // Pengecekan Otoritas
    const isAdminOrSuperadmin = userRoles.includes('admin') || userRoles.includes('superadmin');
    const isSuperadmin = userRoles.includes('superadmin');
    const isPetugas = userRoles.includes('petugas');
    const isStaff = isAdminOrSuperadmin || isPetugas;

    // Komponen Header Seksi Menu (Tipografi Taktis/Militeristik)
    const NavHeading = ({ children }) => (
        <div className="px-3 py-2 mt-6 mb-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase first:mt-2">
            {children}
        </div>
    );

    return (
        <nav className="flex flex-col items-start w-full gap-0.5 px-3 pb-24 overflow-y-auto no-scrollbar text-sm lg:px-4">
            
            {/* --- SEKSI UTAMA --- */}
            <NavHeading>Pusat Komando</NavHeading>
            <NavLink
                url={route('dashboard')}
                active={url.startsWith('/dashboard') || url === '/home'}
                title="Beranda Dashboard"
                icon={IconDashboard}
            />
            <NavLink
                url={"/"}
                active={url === '/'}
                title="Peta Pantauan"
                icon={IconMapPin}
            />

            {/* --- SEKSI OPERASIONAL --- */}
            {auth?.user && (
                <>
                    <NavHeading>Operasional</NavHeading>
                    <NavLink
                        url={route('front.reports.create')}
                        active={url.startsWith('/reports/create')}
                        title="Lapor Darurat!"
                        icon={IconFlame}
                        className="text-destructive hover:bg-destructive/10"
                    />
                    <NavLink
                        url={route('front.reports.index', { filter: 'mine' })}
                        active={url.startsWith('/reports') && !url.startsWith('/reports/create')}
                        title="Arsip & Riwayat"
                        icon={IconHistory}
                    />
                </>
            )}

            {/* --- SEKSI FASILITAS PUBLIK --- */}
            <NavHeading>Fasilitas Publik</NavHeading>
            <NavLink
                url={route('front.pumps.index')} 
                active={url.startsWith('/pumps')}
                title="Lokasi SKKL"
                icon={IconDroplet}
            />
            <NavLink
                url={route('front.fire_stations.index')} 
                active={url.startsWith('/fire-stations')}
                title="Pos Pemadam"
                icon={IconFiretruck}
            />
            <NavLink
                url={route('front.hydrants.index')} 
                active={url.startsWith('/hydrants')}
                title="Lokasi Hydrant"
                icon={IconFireHydrant}
            />

            {/* --- SEKSI ADMINISTRASI (KHUSUS ADMIN/PETUGAS) --- */}
            {isStaff && (
                <>
                    <NavHeading>Administrasi</NavHeading>
                    
                    {isAdminOrSuperadmin && (
                        <NavLink
                            url={route('admin.users.index')}
                            active={url.startsWith('/admin/users')}
                            title="Manajemen Pengguna"
                            icon={IconUsersGroup}
                        />
                    )}
                    
                    <NavLink
                        url={route('admin.reports.index')}
                        active={url.startsWith('/admin/reports')}
                        title="Verifikasi Laporan"
                        icon={IconClipboardPlus}
                    />
                    
                    <NavLink
                        url={route('admin.hydrants.index')}
                        active={url.startsWith('/admin/facilities') || url.startsWith('/admin/hydrants')}
                        title="Manajemen Fasilitas"
                        icon={IconBuilding}
                    />
                    
                    <NavLink
                        url={route('admin.announcements.index')}
                        active={url.startsWith('/admin/announcements')}
                        title="Pengumuman Sistem"
                        icon={IconSpeakerphone}
                    />

                    {isSuperadmin && (
                        <NavLink
                            url={route('admin.settings.edit')}
                            active={url.startsWith('/admin/settings')}
                            title="Pengaturan Notifikasi"
                            icon={IconSettings}
                        />
                    )}
                </>
            )}

            {/* --- SEKSI AKUN & SISTEM --- */}
            <NavHeading>Akun & Sistem</NavHeading>
            
            {auth?.user?.name || auth?.name ? (
                <>
                    <NavLink
                        url={route('profile.edit')}
                        active={url.startsWith('/profile')}
                        title="Profil Saya"
                        icon={IconUser}
                    />
                    <NavLink
                        url={route('logout')}
                        title="Keluar (Logout)"
                        icon={IconLogout}
                        method="post"
                        as="button"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    />
                </>
            ) : (
                <>
                    <NavLink url={route('login')} title="Masuk Akun" icon={IconLogin2} />
                    <NavLink url={route('register')} title="Daftar Baru" icon={IconClipboardPlus} />
                </>
            )}
        </nav>
    );
}