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

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';

export default function AppLayout({ title, children }) {
    const { url } = usePage();
    const announcemet = usePage().props.announcemet;
    const auth = usePage().props.auth?.user ?? null;

    // Sugesti: Di masa depan, pindahkan logika ini ke custom hook misal: usePushNotificationAudio()
    useEffect(() => {
        let audio;
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.onmessage = (event) => {
                if (event.data && event.data.type === 'PLAY_SOUND') {
                    if (!audio) {
                        audio = new Audio(event.data.soundUrl);
                        audio.loop = true;
                        audio.play().catch((error) => console.warn('Gagal memutar suara:', error));
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
            
            <div className="flex w-full min-h-screen bg-gray-50/50 dark:bg-slate-950">
                
                {/* SIDEBAR */}
                <div className="z-20 hidden w-64 bg-white border-r shrink-0 lg:block dark:border-slate-800 dark:bg-slate-950">
                    <div className="sticky top-0 flex flex-col h-screen">
                        <div className="flex items-center h-16 px-6 border-b dark:border-slate-800 shrink-0">
                            <ApplicationLogo />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar url={url} auth={auth} />
                        </div>
                    </div>
                </div>
                
                {/* AREA KONTEN UTAMA */}
                {/* Perbaikan: Menggunakan flex-col dan min-h-screen di sini agar Footer bisa menempel di bawah */}
                <div className="flex flex-col flex-1 min-w-0 min-h-screen pb-20 lg:pb-0">
                    
                    {/* HEADER */}
                    <header className="sticky top-0 z-40 flex items-center justify-end h-16 px-4 border-b lg:px-8 border-gray-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl">
                        
                        <div className="flex items-center gap-2 lg:gap-4">
                            {auth?.name && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        {/* Perbaikan Desain Tombol: Menggunakan gaya 'Ghost' agar menyatu dengan Glassmorphism */}
                                        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-500 cursor-pointer group">
                                            <div className="flex items-center justify-center w-8 h-8 overflow-hidden text-sm font-bold transition-transform rounded-full shadow-inner bg-slate-100 dark:bg-slate-900/40 text-slate-600 dark:text-slate-500 shrink-0 group-hover:scale-105">
                                                {auth.avatar ? (
                                                    <img src={auth.avatar} alt="Avatar" className="object-cover w-full h-full" />
                                                ) : (
                                                    auth.name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            {/* Menyembunyikan nama di layar super kecil (mobile portrait) agar header tidak sesak */}
                                            <span className="hidden sm:block text-sm font-semibold text-gray-700 dark:text-slate-200 truncate max-w-[120px]">
                                                {auth.name}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    
                                    <DropdownMenuContent align="end" className="w-64 p-5 mt-2 shadow-2xl rounded-3xl dark:bg-slate-900 dark:border-slate-800">
                                        <div className="flex flex-col items-center space-y-3 text-center">
                                            <div className="flex items-center justify-center w-16 h-16 overflow-hidden text-2xl font-extrabold border-2 rounded-full shadow-sm border-slate-200 dark:border-slate-900/50 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900/40 dark:to-orange-900/40 text-slate-700 dark:text-slate-500">
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
                                                        <span key={i} className="px-3 py-1 bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-slate-100 dark:border-slate-900/30">
                                                            {role_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Divider halus antara profil dan theme switcher */}
                            <div className="w-px h-6 mx-1 bg-gray-200 dark:bg-slate-700"></div>

                            <ThemeSwitcher />
                        </div>
                    </header>

                    {/* BANNER GLOBAL (Sekarang merentang penuh di bawah header) */}
                    {announcemet && announcemet.is_active == 1 && (
                        <div className="w-full">
                            <Banner message={announcemet.message} url={announcemet.url} />
                        </div>
                    )}
                    
                    {/* MAIN CONTENT (Menggunakan flex-1 agar mendesak footer ke bawah) */}
                    <main className="flex-1 w-full mx-auto max-w-7xl">
                        <div className="p-4 lg:p-8">
                            {children}
                        </div>
                    </main>
                    
                    {/* FOOTER */}
                    <footer className="w-full px-4 py-6 mt-auto border-t lg:px-8 border-gray-200/60 dark:border-slate-800/60 shrink-0">
                        <p className="text-sm font-medium text-center text-gray-400 lg:text-left dark:text-slate-500">
                            &copy; {new Date().getFullYear()} Sisupit. Developed by PT. Tawarin Dimana Saja.
                        </p>
                    </footer>
                </div>
            </div>

            <MobileBottomNav url={url} auth={auth} />
        </>
    );
}