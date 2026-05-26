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

    useEffect(() => {
        // PENTING: Hanya jalankan jika user sudah login
        if (!auth?.user) return;

        // 1. SIAPKAN PENANGKAP TOKEN (DARI ANDROID KE REACT)
        window.receiveFcmTokenFromNative = (token) => {
            console.log("🎯 Token FCM berhasil ditangkap oleh React:", token);
            
            // React yang bertugas mengirim ke Laravel (Karena React punya Session & CSRF Token yang valid!)
            axios.post(route('fcm.store'), {
                token: token,
                device_type: 'android'
            }).then(response => {
                console.log("✅ Token sukses disimpan di Database Laravel!");
            }).catch(error => {
                console.error("❌ Gagal menyimpan token ke Laravel:", error);
            });
        };

        // 2. TRIGGER ANDROID UNTUK MENGAMBIL TOKEN (INI YANG SEBELUMNYA KURANG!)
        // Kita cek apakah aplikasi dibuka di dalam WebView Android Sisupit
        if (window.AndroidBridge && typeof window.AndroidBridge.postToken === 'function') {
            console.log("📱 Meminta Token dari Aplikasi Android...");
            // Panggil fungsi Java! Kita kirim string kosong '' karena kita tidak pakai Bearer Token
            window.AndroidBridge.postToken(''); 
        } else {
            console.log("💻 Dibuka di Browser biasa, mengabaikan jembatan Android.");
        }

        return () => {
            delete window.receiveFcmTokenFromNative;
        };
    }, [auth]); // Akan dijalankan ulang jika status auth berubah

    return (
        <>
            <Head title={title} />
            <Toaster position="top-center" richColors />
            <WebPushSubscribe />
            <SoundNotificationControl />
            
            <div className="flex w-full min-h-screen bg-gray-50 dark:bg-[#101010]">
                
                {/* SIDEBAR */}
                <div className="z-20 hidden w-64 bg-white border-r border-[#e5e5e5] shrink-0 lg:block dark:border-[#262626] dark:bg-[#151515]">
                    <div className="sticky top-0 flex flex-col h-screen">
                        <div className="flex items-center h-16 px-6 border-b border-[#e5e5e5] dark:border-[#262626] shrink-0">
                            <ApplicationLogo />
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <Sidebar url={url} auth={auth} />
                        </div>
                    </div>
                </div>
                
                {/* AREA KONTEN UTAMA */}
                <div className="flex flex-col flex-1 min-w-0 min-h-screen pb-20 lg:pb-0">
                    
                    {/* HEADER */}
                    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 border-b lg:px-8 border-[#e5e5e5] dark:border-[#262626] bg-white/95 dark:bg-[#101010] backdrop-blur-md">
                        <ApplicationLogo />
                        <div className="flex items-center gap-2 lg:gap-4">
                            {auth?.name && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-300 cursor-pointer group">
                                            <div className="flex items-center justify-center w-8 h-8 overflow-hidden text-sm font-semibold transition-transform rounded-md shadow-sm border border-[#e5e5e5] bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#262626] text-gray-600 dark:text-gray-400 shrink-0 group-hover:scale-105">
                                                {auth.avatar ? (
                                                    <img src={auth.avatar} alt="Avatar" className="object-cover w-full h-full" />
                                                ) : (
                                                    auth.name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 truncate max-w-[120px]">
                                                {auth.name}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    
                                    <DropdownMenuContent align="end" className="w-64 p-5 mt-2 shadow-md rounded-xl bg-white border-[#e5e5e5] dark:bg-[#151515] dark:border-[#262626]">
                                        <div className="flex flex-col items-center space-y-3 text-center">
                                            <div className="flex items-center justify-center w-16 h-16 overflow-hidden text-2xl font-semibold border border-[#e5e5e5] rounded-full shadow-sm dark:border-[#262626] bg-gray-50 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-400">
                                                {auth.avatar ? (
                                                    <img src={auth.avatar} alt="User Avatar" className="object-cover w-full h-full" />
                                                ) : (
                                                    auth.name.substring(0, 1).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-semibold text-gray-900 break-words dark:text-gray-100">
                                                    {auth.name}
                                                </h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                                                    {auth.email}
                                                </p>
                                            </div>
                                            {auth.role && auth.role.length > 0 && (
                                                <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                                                    {auth.role.map((role_name, i) => (
                                                        <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-300 text-[10px] font-medium uppercase tracking-wider rounded-md border border-[#e5e5e5] dark:border-[#333]">
                                                            {role_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}

                            {/* Divider */}
                            <div className="w-px h-5 mx-1 bg-[#e5e5e5] dark:bg-[#262626]"></div>

                            <ThemeSwitcher />
                        </div>
                    </header>

                    {/* BANNER GLOBAL */}
                    {announcemet && announcemet.is_active == 1 && (
                        <div className="w-full">
                            <Banner message={announcemet.message} url={announcemet.url} />
                        </div>
                    )}
                    
                    {/* MAIN CONTENT */}
                    <main className="flex-1 w-full mx-auto max-w-7xl">
                        <div className="p-4 lg:p-8">
                            {children}
                        </div>
                    </main>
                    
                    {/* FOOTER */}
                    <footer className="w-full px-4 py-6 mt-auto border-t lg:px-8 border-[#e5e5e5] dark:border-[#262626] shrink-0">
                        <p className="text-xs font-medium text-center text-gray-400 lg:text-left dark:text-gray-500">
                            &copy; {new Date().getFullYear()} Sisupit. Developed by PT. Tawarin Dimana Saja.
                        </p>
                    </footer>
                </div>
            </div>

            <MobileBottomNav url={url} auth={auth} />
        </>
    );
}