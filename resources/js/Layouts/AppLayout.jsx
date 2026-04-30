import ApplicationLogo from '@/Components/ApplicationLogo';
import Banner from '@/Components/Banner';
import SoundNotificationControl from '@/Components/SoundNotificationControl';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Toaster } from '@/Components/ui/sonner';
import WebPushSubscribe from '@/Components/WebPushSubscribe';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import Sidebar from './Partials/Sidebar';
import MobileBottomNav from './Partials/MobileBottomNav';

// Dropdown Menu untuk Profil User
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

export default function AppLayout({ title, children }) {
    const { url } = usePage();
    const announcemet = usePage().props.announcemet;
    const auth = usePage().props.auth?.user ?? null;

    useEffect(() => {
        let audio;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.onmessage = (event) => {
                if (event.data && event.data.type === 'PLAY_SOUND') {
                    if (!audio) {
                        audio = new Audio(event.data.soundUrl);
                        audio.loop = true;
                        audio.play().catch((error) => {
                            console.warn('Gagal memutar suara:', error);
                        });
                    }
                }
            };

            window.addEventListener('focus', () => {
                if (audio) {
                    audio.pause();
                    audio = null;
                }
            });
        }
    }, []);

    return (
        <>
            <Head title={title} />
            <Toaster position="top-center" richColors />
            <WebPushSubscribe />
            <SoundNotificationControl />
            <div className="flex flex-row w-full min-h-screen pb-28 lg:pb-0">
                
                {/* SIDEBAR HANYA MUNCUL DI DESKTOP (lg:block) */}
                <div className="z-10 hidden w-1/5 bg-white border-r lg:block dark:border-slate-800 dark:bg-slate-950">
                    <div className="sticky top-0 flex flex-col h-full min-h-screen gap-2">
                        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6 dark:border-slate-800">
                            <ApplicationLogo />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar url={url} auth={auth} />
                        </div>
                    </div>
                </div>
                
                {/* AREA KONTEN UTAMA */}
                <div className="flex flex-col w-full lg:w-4/5">
                    
                    {/* HEADER: Ubah justify-between menjadi justify-end karena tombol hamburger di kiri sudah dihapus */}
                    <header className="flex h-14 items-center justify-end gap-4 border-b px-4 lg:h-[60px] lg:px-6 dark:border-slate-800 dark:bg-slate-900/70 bg-white/70 backdrop-blur-md sticky top-0 z-40">
                        
                        <div className="flex items-center gap-3">
                            {/* --- LABEL NAMA USER (BISA DIKLIK) --- */}
                            {auth?.name && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full shadow-sm hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer group">
                                            <div className="flex items-center justify-center w-6 h-6 overflow-hidden text-xs font-bold transition-transform rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-500 shrink-0 group-hover:scale-105">
                                                {auth.avatar ? (
                                                    <img src={auth.avatar} alt="Avatar" className="object-cover w-full h-full" />
                                                ) : (
                                                    auth.name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <span className="text-sm font-bold text-gray-700 dark:text-slate-200 truncate max-w-[100px] sm:max-w-[150px]">
                                                {auth.name}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    
                                    <DropdownMenuContent align="end" className="w-64 p-5 mt-1 shadow-xl rounded-3xl dark:bg-slate-900 dark:border-slate-800">
                                        <div className="flex flex-col items-center space-y-3 text-center">
                                            <div className="flex items-center justify-center w-16 h-16 overflow-hidden text-2xl font-extrabold border-2 rounded-full shadow-sm border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-orange-900/40 text-amber-700 dark:text-amber-500">
                                                {auth.avatar ? (
                                                    <img src={auth.avatar} alt="User Avatar" className="object-cover w-full h-full" />
                                                ) : (
                                                    auth.name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-gray-900 break-words dark:text-slate-100">
                                                    {auth.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 break-words">
                                                    {auth.email}
                                                </p>
                                            </div>
                                            {auth.role && auth.role.length > 0 && (
                                                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                                    {auth.role.map((role_name, i) => (
                                                        <span key={i} className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                            {role_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Theme Switcher */}
                            <ThemeSwitcher />
                        </div>
                    </header>
                    
                    <main className="w-full">
                        <div className="relative">
                            <div className="gap-4 p-4 lg:gap-6">
                                {children}
                                {announcemet && announcemet.is_active == 1 && (
                                    <Banner message={announcemet.message} url={announcemet.url} />
                                )}
                            </div>
                        </div>
                    </main>
                    
                    <footer>
                        <div className="mt-24 flex h-12 flex-col items-center justify-between gap-4 border-t border-gray-200 dark:border-slate-800 px-4 py-3 align-middle text-sm font-medium text-gray-500 dark:text-slate-400 md:flex-row md:items-center lg:h-[60px] lg:justify-start lg:px-6">
                            <p className="text-center">Developed by PT. Tawarin Dimana Saja</p>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Bottom Nav hanya akan merender jika di mobile karena ada class lg:hidden di dalamnya */}
            <MobileBottomNav url={url} auth={auth} />
        </>
    );
}