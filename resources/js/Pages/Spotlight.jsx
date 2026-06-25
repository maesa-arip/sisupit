import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { 
    IconBrandAndroid,
    IconDownload,
    IconFlame, 
    IconPhoneCall, 
    IconShieldCheck 
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';



export default function Spotlight(props) {
    const [isWebView, setIsWebView] = useState(true); 
        
            useEffect(() => {
                const checkWebView = () => {
                    const ua = navigator.userAgent || navigator.vendor || window.opera;
                    const isAndroidWebView = /wv|Android.*Version\/[\d\.]+/i.test(ua);
                    const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
                    const isInAppBrowser = /FBAV|FBAN|Instagram|Line|Twitter|MicroMessenger/i.test(ua);
                    const isMyOwnApp = /SisupitApp/i.test(ua); 
        
                    return isAndroidWebView || isIOSWebView || isInAppBrowser || isMyOwnApp;
                };
                setIsWebView(checkWebView());
            }, []);
    return (
        <div className="relative flex flex-col items-center justify-center w-full min-h-[75vh] py-6 px-6 space-y-8 text-center">
            
            {/* --- HEADER TEKS BARU (TAKTIS & TEGAS) --- */}
            <div className="mt-4 space-y-2">
                <h1 className="text-2xl font-black tracking-tight uppercase text-foreground sm:text-3xl">
                    Damkar Kota Denpasar
                </h1>

                <p className="text-xs font-bold tracking-widest uppercase sm:text-sm text-destructive">
                    Lapor Damkar Cepat Lindungi Warga.
                </p>
            </div>

            {/* --- ILUSTRASI BERBASIS IKON (Solid & Flat Design) --- */}
            <div className="relative flex items-center justify-center w-full max-w-[240px] sm:max-w-[280px] mx-auto aspect-square">

                {/* Latar Belakang Lingkaran (Solid, tanpa blur) */}
                <div className="absolute inset-0 transition-colors scale-90 rounded-full bg-red-50 dark:bg-red-950/40"></div>

                {/* Ikon Utama (Tengah) */}
                <div className="relative z-10 flex items-center justify-center w-32 h-32 transition-transform duration-300 rotate-3 bg-red-700 rounded-[24px] shadow-none border-4 border-white dark:border-neutral-900 hover:rotate-0 hover:scale-105">
                    <IconFlame className="w-16 h-16 text-white" stroke={1.5} />
                </div>

                {/* Elemen Dekorasi (Kanan Bawah - Perisai) */}
                <div className="absolute z-20 flex items-center justify-center transition-colors bg-white border shadow-none w-14 h-14 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 rounded-xl bottom-8 right-6 sm:right-10 -rotate-6">
                    <IconShieldCheck className="text-green-600 dark:text-green-500 w-7 h-7" stroke={1.5} />
                </div>

                {/* Elemen Dekorasi (Kiri Atas - Telepon) */}
                <div className="absolute z-0 flex items-center justify-center w-12 h-12 transition-colors bg-white border rounded-full shadow-none dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 top-10 left-6 sm:left-10 -rotate-12">
                    <IconPhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-500" stroke={1.5} />
                </div>

            </div>

            {/* --- KONTEN TEKS DESKRIPSI --- */}
            <div className="max-w-xl mx-auto space-y-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    Ada yang Bisa Kami Bantu?
                </h2>
                <p className="text-[14px] leading-relaxed text-muted-foreground sm:text-base">
                    Segera laporkan kejadian kebakaran atau keadaan darurat lainnya kepada tim kami.
                    Informasi yang Anda berikan akan membantu kami dalam merespons dengan cepat dan tepat!
                </p>
            </div>

            {/* --- TOMBOL AKSI (CTA) --- */}
            <Button
                asChild
                className="h-12 px-8 text-sm font-bold tracking-wider text-white uppercase transition-colors bg-red-700 border border-red-800 shadow-none rounded-xl hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700/50"
            >
                <Link href={route('front.reports.create')}>
                    <IconFlame className="w-5 h-5 mr-2" stroke={2.5} />
                    LAPOR SEKARANG!
                </Link>
            </Button>
            {/* --- UNDUH APLIKASI --- */}
            {!isWebView && (
                <div className="flex flex-col items-center w-full mt-4">
                    <a
                        href="/apk/sisupit.apk"
                        download="Sisupit.apk"
                        className="flex items-center justify-center w-full h-12 gap-3 px-6 font-medium transition-colors border shadow-sm outline-none sm:w-auto text-foreground bg-card border-border rounded-xl hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
                    >
                        <div className="flex items-center justify-center p-1 rounded-md bg-green-50 dark:bg-success/10">
                            <IconBrandAndroid className="w-5 h-5 text-green-600 dark:text-success" stroke={2} />
                        </div>
                        <span className="text-sm">Unduh Aplikasi Android</span>
                        <IconDownload className="w-4 h-4 ml-1 text-muted-foreground" stroke={2} />
                    </a>
                </div>
            )}
        </div>
    );
}

Spotlight.layout = (page) => <AppLayout children={page} title="Pusat Bantuan" />;