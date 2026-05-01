import NavLink from '@/Components/NavLink';
import { Button } from '@/Components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import { flashMessage } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
    IconAlertCircle,
    IconBuilding,
    IconClipboardPlus,
    IconDashboard,
    IconLogin2,
    IconLogout,
    IconUser,
    IconDroplet,
    IconFiretruck,
    IconUsersGroup
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Sidebar({ url, auth }) {
    const [open, setOpen] = useState(false);

    // Komponen Helper untuk Heading Menu agar konsisten
    const NavHeading = ({ children }) => (
        <div className="px-3 py-2 mt-4 mb-1 text-xs font-bold tracking-wider text-gray-500 uppercase dark:text-slate-400">
            {children}
        </div>
    );

    // Komponen Helper untuk Button Dialog agar tidak melewati batas (Bug Fix) & konsisten
    const SidebarButton = ({ icon: Icon, children, ...props }) => (
        <Button
            variant="ghost"
            className="justify-start w-full h-auto gap-3 px-3 py-2.5 font-medium text-left transition-colors rounded-xl text-gray-700 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 dark:hover:text-amber-400 outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            {...props}
        >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{children}</span>
        </Button>
    );

    return (
        // BUG FIX: Mengganti grid menjadi flex-col, memastikan w-full dan overflow-hidden agar tidak melewati garis
        <nav className="flex flex-col items-start w-full gap-1 px-2 pb-24 overflow-hidden text-sm lg:px-4">
            
            {/* {auth?.role.some((role) => ['petugas', 'relawan', 'member'].includes(role)) && ( */}
            <>
                <NavHeading>Dashboard</NavHeading>
                <NavLink
                    url={route('dashboard')}
                    active={url.startsWith('/dashboard')}
                    title="Dashboard"
                    icon={IconDashboard}
                />
                

                <NavHeading>Sisupit</NavHeading>
                {/* <NavLink
                        url={route('front.volunteers.index')}
                        active={url.startsWith('/volunteers')}
                        title="Relawan Sekitar"
                        icon={IconUsersGroup}
                /> */}
                 <NavLink
                        url={route('front.companies.index')}
                        active={url.startsWith('/companies')}
                        title="Daftar Sebagai Relawan"
                        icon={IconBuilding}
                />

                {/* --- Dialog Pompa Supit --- */}
                <Dialog>
                    <DialogTrigger asChild>
                        <SidebarButton icon={IconDroplet}>
                            Lihat Lokasi Pompa Supit
                        </SidebarButton>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">Fitur pelacakan lokasi pompa sedang diproses, mohon untuk bersabar.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-end">
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-gray-300 rounded-xl dark:border-slate-700">Tutup</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* --- Dialog Pos Damkar --- */}
                <Dialog>
                    <DialogTrigger asChild>
                        <SidebarButton icon={IconFiretruck}>
                            Lihat Lokasi Pos Damkar Terdekat
                        </SidebarButton>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-[24px] dark:bg-slate-900 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-slate-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="dark:text-slate-400">Fitur rute ke Pos Damkar terdekat sedang diproses, mohon untuk bersabar.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 sm:justify-end">
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-gray-300 rounded-xl dark:border-slate-700">Tutup</Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
            {/* )} */}

            {/* KOMENTAR MENU LAINNYA TETAP DIPERTAHANKAN SESUAI KODE ASLI */}
            {/* {auth.role.some((role) => ['admin'].includes(role)) && ( ... )} */}
            {/* {auth.role.some((role) => ['admin', 'operator'].includes(role)) && ( ... )} */}
            {/* {auth.role.some((role) => ['admin'].includes(role)) && ( ... )} */}
            {/* {auth.role.some((role) => ['admin', 'operator'].includes(role)) && ( ... )} */}
            {/* {auth.role.some((role) => ['member'].includes(role)) && ( ... )} */}

            <NavHeading>Lainnya</NavHeading>
            
            {auth?.role?.some((role) => ['admin', 'operator'].includes(role)) && (
                <NavLink
                    url={route('admin.announcements.index')}
                    active={url.startsWith('/admin/announcements')}
                    title="Pengumuman"
                    icon={IconAlertCircle}
                />
            )}

            {auth?.name ? (
                <>
                    <NavLink
                        url={route('profile.edit')}
                        active={url.startsWith('/profile')}
                        title="Profile"
                        icon={IconUser}
                    />
                    <NavLink
                        url={route('logout')}
                        title="Logout"
                        icon={IconLogout}
                        method="post"
                        as="button"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                    />
                </>
            ) : (
                <>
                    <NavLink url={route('login')} title="Masuk" icon={IconLogin2} />
                    <NavLink url={route('register')} title="Daftar" icon={IconClipboardPlus} />
                </>
            )}
        </nav>
    );
}