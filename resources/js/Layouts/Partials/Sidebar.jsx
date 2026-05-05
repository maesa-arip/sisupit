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

    const NavHeading = ({ children }) => (
        <div className="px-3 py-2 mt-4 mb-1 text-[10px] font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400">
            {children}
        </div>
    );

    const SidebarButton = ({ icon: Icon, children, ...props }) => (
        <Button
            variant="ghost"
            className="justify-start w-full h-auto gap-3 px-3 py-2.5 text-sm font-medium text-left transition-colors rounded-md text-gray-700 dark:text-gray-300 hover:text-[#b42826] hover:bg-red-50 dark:hover:bg-[#2a1313] dark:hover:text-[#e54845] outline-none focus-visible:ring-2 focus-visible:ring-[#b42826]/50"
            {...props}
        >
            <Icon className="w-5 h-5 shrink-0" stroke={2} />
            <span className="truncate">{children}</span>
        </Button>
    );

    return (
        <nav className="flex flex-col items-start w-full gap-1 px-3 pb-24 overflow-hidden text-sm lg:px-4">
            
            <>
                <NavHeading>Dashboard</NavHeading>
                <NavLink
                    url={route('dashboard')}
                    active={url.startsWith('/dashboard')}
                    title="Dashboard"
                    icon={IconDashboard}
                />
                
                <NavHeading>Sisupit</NavHeading>
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
                    <DialogContent className="max-w-md rounded-xl bg-white border-[#e5e5e5] dark:bg-[#151515] dark:border-[#262626]">
                        <DialogHeader className="p-1">
                            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                Fitur pelacakan lokasi pompa sedang diproses, mohon untuk bersabar.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 mt-4 sm:justify-end">
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-[#e5e5e5] rounded-md h-9 text-gray-700 dark:text-gray-300 dark:border-[#333] dark:bg-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-[#262626]">
                                    Tutup
                                </Button>
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
                    <DialogContent className="max-w-md rounded-xl bg-white border-[#e5e5e5] dark:bg-[#151515] dark:border-[#262626]">
                        <DialogHeader className="p-1">
                            <DialogTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Segera Hadir</DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                                Fitur rute ke Pos Damkar terdekat sedang diproses, mohon untuk bersabar.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2 mt-4 sm:justify-end">
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-[#e5e5e5] rounded-md h-9 text-gray-700 dark:text-gray-300 dark:border-[#333] dark:bg-[#1f1f1f] hover:bg-gray-50 dark:hover:bg-[#262626]">
                                    Tutup
                                </Button>
                            </DialogTrigger>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>

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
                        className="w-full text-[#b42826] hover:text-[#9a2220] hover:bg-red-50 dark:text-[#e54845] dark:hover:bg-[#2a1313]"
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