import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { 
    IconFlame, 
    IconPhoneCall, 
    IconShieldCheck 
} from '@tabler/icons-react';

export default function Spotlight(props) {
    return (
        <div className="relative flex flex-col items-center justify-center w-full min-h-[75vh] py-6 px-6 space-y-8 text-center">
            
            {/* --- HEADER TEKS BARU (TAKTIS & TEGAS) --- */}
            <div className="mt-4 space-y-2">
                <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase sm:text-3xl dark:text-gray-100">
                    LAPOR SISUPIT
                </h1>
                <p className="text-xs sm:text-sm font-bold tracking-widest text-[#b42826] dark:text-[#e54845] uppercase">
                    Lapor Damkar Cepat Lindungi Warga.
                </p>
            </div>

            {/* --- ILUSTRASI BERBASIS IKON (Solid & Flat Design) --- */}
            <div className="relative flex items-center justify-center w-full max-w-[240px] sm:max-w-[280px] mx-auto aspect-square">
                
                {/* Latar Belakang Lingkaran (Solid, tanpa blur) */}
                <div className="absolute inset-0 transition-colors bg-red-50 dark:bg-[#1a0f0f] rounded-full scale-90"></div>
                
                {/* Ikon Utama (Tengah) */}
                <div className="relative z-10 flex items-center justify-center w-32 h-32 transition-transform duration-300 rotate-3 bg-[#b42826] rounded-[24px] shadow-none border-4 border-white dark:border-[#151515] hover:rotate-0 hover:scale-105">
                    <IconFlame className="w-16 h-16 text-white" stroke={1.5} />
                </div>
                
                {/* Elemen Dekorasi (Kanan Bawah - Perisai) */}
                <div className="absolute z-20 flex items-center justify-center w-14 h-14 transition-colors bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#333] rounded-xl shadow-none bottom-8 right-6 sm:right-10 -rotate-6">
                    <IconShieldCheck className="text-green-600 w-7 h-7 dark:text-green-500" stroke={1.5} />
                </div>
                
                {/* Elemen Dekorasi (Kiri Atas - Telepon) */}
                <div className="absolute z-0 flex items-center justify-center w-12 h-12 transition-colors bg-white dark:bg-[#151515] border border-[#e5e5e5] dark:border-[#333] rounded-full shadow-none top-10 left-6 sm:left-10 -rotate-12">
                    <IconPhoneCall className="w-5 h-5 text-blue-600 dark:text-blue-500" stroke={1.5} />
                </div>

            </div>

            {/* --- KONTEN TEKS DESKRIPSI --- */}
            <div className="max-w-xl mx-auto space-y-3">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl dark:text-gray-100">
                    Ada yang Bisa Kami Bantu?
                </h2>
                <p className="text-[14px] leading-relaxed text-gray-500 sm:text-base dark:text-gray-400">
                    Segera laporkan kejadian kebakaran atau keadaan darurat lainnya kepada tim kami. 
                    Informasi yang Anda berikan akan membantu kami dalam merespons dengan cepat dan tepat!
                </p>
            </div>

            {/* --- TOMBOL AKSI (CTA) --- */}
            <Button
                asChild
                className="h-12 px-8 text-sm font-bold tracking-wider text-white uppercase transition-colors bg-[#b42826] rounded-xl hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50 shadow-none border border-[#9a2220]"
            >
                <Link href={route('front.reports.create')}>
                    <IconFlame className="w-5 h-5 mr-2" stroke={2.5} />
                    LAPOR SEKARANG!
                </Link>
            </Button>
            
        </div>
    );
}

Spotlight.layout = (page) => <AppLayout children={page} title="Pusat Bantuan" />;