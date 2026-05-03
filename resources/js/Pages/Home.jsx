import HeaderTitle from '@/Components/HeaderTitle';
import InstallPWAButton from '@/Components/InstallPWAButton';
import { Card, CardContent } from '@/Components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { 
    IconDashboard, 
    IconDroplet, 
    IconFiretruck, 
    IconNews,
    IconUsers,
    IconChevronRight,
    IconAlertTriangle,
    IconPhoneCall
} from '@tabler/icons-react';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

export default function Home(props) {
    const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));
    
    // Pastikan aman jika user belum login
    const auth = props.auth?.user ?? null;
    
    // Contoh pengecekan peran admin
    const isAdmin = auth && auth.role === 'admin'; 

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            {/* --- HEADER & STATUS SISTEM --- */}
            <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
                <HeaderTitle
                    title={props.page_settings.title}
                    subtitle={props.page_settings.subtitle}
                    icon={IconDashboard}
                />
                
                {/* REVISI: Indikator Sistem Online (Memberikan rasa aman pada warga) */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full dark:bg-emerald-950/30 dark:border-emerald-900/50 w-fit">
                    <span className="relative flex w-2.5 h-2.5">
                        <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-emerald-400"></span>
                        <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider dark:text-emerald-400">
                        Siaga 24/7
                    </span>
                </div>
            </div>
            
            {/* --- SECTION 1: AKSI DARURAT (PRIORITAS UTAMA) --- */}
            <div className="flex flex-col items-center w-full gap-3 mt-1">
                {/* Tombol Lapor Utama (Merah) */}
                <Link href={route('front.reports.create')} className="block w-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500 rounded-3xl">
                    <div className="relative flex items-center justify-between p-6 overflow-hidden transition-all duration-300 shadow-xl sm:p-8 bg-gradient-to-br from-red-600 to-rose-700 dark:from-red-700 dark:to-rose-900 rounded-3xl hover:shadow-red-500/40 dark:hover:shadow-red-900/50 hover:-translate-y-1 group">
                        <div className="relative z-10 flex flex-col">
                            <span className="mb-1 text-sm font-bold tracking-wider uppercase text-red-100/90">Pusat Bantuan Darurat</span>
                            <span className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">Laporkan<br />Kejadian!</span>
                        </div>
                        <div className="relative z-10 p-4 transition-transform duration-300 rounded-full bg-white/20 backdrop-blur-md group-hover:scale-110 group-hover:rotate-12">
                            <IconAlertTriangle className="w-12 h-12 text-white" stroke={2.5} />
                        </div>
                        
                        {/* Efek Cahaya Latar */}
                        <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 transform -translate-x-12 translate-y-12 rounded-full bg-black/10 blur-xl"></div>
                    </div>
                </Link>

                {/* Tombol Alternatif: Telepon Langsung */}
                <a href="tel:113" className="flex items-center justify-center w-full gap-2 py-4 font-bold text-red-700 transition-colors border border-red-200 shadow-sm bg-red-50 rounded-2xl hover:bg-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40">
                    <IconPhoneCall size={22} />
                    <span>Telepon Darurat (113)</span>
                </a>
            </div>

            {/* --- SECTION 2: MENU INFORMASIONAL & UTILITAS --- */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* Menu Pompa Sisupit (Biru) - REVISI: Padding disesuaikan agar pas di jari */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col items-center justify-center rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-center mb-3 text-blue-600 transition-transform duration-300 rounded-full h-14 w-14 sm:h-16 sm:w-16 bg-blue-50 group-hover:scale-110 dark:bg-blue-900/40 dark:text-blue-400">
                        <IconDroplet size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-center text-gray-800 sm:text-base dark:text-slate-200">
                        Lokasi Pompa<br />Sisupit
                    </span>
                </Link>
                
                {/* Menu Pos Damkar (Oranye) */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col items-center justify-center rounded-[20px] border border-gray-200 bg-white p-5 sm:p-6 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-red-500 dark:border-slate-700 dark:bg-slate-800"
                >
                    <div className="flex items-center justify-center mb-3 text-red-500 transition-transform duration-300 rounded-full h-14 w-14 sm:h-16 sm:w-16 bg-red-50 group-hover:scale-110 dark:bg-red-900/30 dark:text-red-400">
                        <IconFiretruck size={28} className="sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-sm font-bold leading-tight text-center text-gray-800 sm:text-base dark:text-slate-200">
                        Pos Damkar<br />Terdekat
                    </span>
                </Link>

                {/* MENU KHUSUS ADMIN */}
                {isAdmin && (
                    <Link href={route('front.volunteers.index')} className="block w-full col-span-2 mt-1">
                        <Card className="overflow-hidden transition-all duration-300 border border-indigo-100 shadow-sm cursor-pointer group rounded-[20px] bg-indigo-50/50 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md dark:border-indigo-900/30 dark:bg-slate-800/80 dark:hover:border-indigo-700">
                            <CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
                                <div className="flex items-center justify-center w-12 h-12 text-indigo-600 transition-transform bg-white border border-indigo-200 rounded-full shadow-inner shrink-0 group-hover:scale-110 dark:border-indigo-800/50 dark:bg-indigo-900/50 dark:text-indigo-400">
                                    <IconUsers className="w-6 h-6" />
                                </div>
                                <div className="flex-1 w-full min-w-0 py-1">
                                    <h3 className="truncate text-[15px] font-bold text-gray-900 transition-colors group-hover:text-indigo-700 dark:text-slate-100 dark:group-hover:text-indigo-400">
                                        Manajemen Pengguna
                                    </h3>
                                    <p className="mt-0.5 truncate text-[13px] text-gray-600 dark:text-slate-400">
                                        Kelola data admin & relawan.
                                    </p>
                                </div>
                                <div className="flex flex-col items-end justify-center shrink-0">
                                    <div className="flex items-center justify-center w-8 h-8 text-indigo-400 transition-colors rounded-full bg-indigo-100/50 group-hover:bg-indigo-200 group-hover:text-indigo-700 dark:bg-slate-800 dark:group-hover:bg-indigo-900/50 dark:group-hover:text-indigo-300">
                                        <IconChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                )}
            </div>

            <hr className="my-2 border-gray-100 dark:border-slate-800" />

            {/* --- SECTION 3: CAROUSEL INFORMASI --- */}
            <div className="flex flex-col items-center w-full space-y-4">
                <div className="w-full px-1 text-left">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        Informasi & Edukasi
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Berita terkini dan panduan keselamatan untuk warga.
                    </p>
                </div>

                <Carousel
                    plugins={[plugin.current]}
                    className="w-full"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent className="-ml-3 md:-ml-4">
                        {Array.from({ length: 4 }).map((_, index) => {
                            // REVISI: Simulasi variasi label kategori agar informatif
                            const isWarning = index === 0; 
                            
                            return (
                                <CarouselItem key={index} className="pl-3 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                    <Card className="h-full overflow-hidden transition-colors border border-gray-200 shadow-sm dark:border-slate-700 rounded-[20px] dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700/50 group">
                                        <div className="flex items-center justify-center w-full h-32 bg-slate-100 dark:bg-slate-900/50">
                                            <IconNews className="w-10 h-10 transition-colors text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500" />
                                        </div>
                                        <CardContent className="p-5">
                                            <div className="flex flex-col gap-1.5 h-full">
                                                <span className={`text-[10px] font-bold tracking-widest uppercase ${isWarning ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {isWarning ? 'Peringatan Dini' : 'Berita Warga'}
                                                </span>
                                                <h4 className="font-bold text-gray-900 text-md dark:text-slate-100 line-clamp-2">
                                                    {isWarning ? 'Waspada Potensi Kebakaran Lahan di Musim Kemarau' : `Informasi Kegiatan Edukasi Damkar Sesi ${index + 1}`}
                                                </h4>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                                                    Klik untuk membaca selengkapnya mengenai informasi penting ini demi keselamatan bersama.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                    
                    {/* Navigasi Desktop */}
                    <div className="hidden lg:block">
                        <CarouselPrevious className="text-gray-600 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white" />
                        <CarouselNext className="text-gray-600 border-gray-200 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white" />
                    </div>
                </Carousel>
            </div>

            {/* --- SECTION 4: INSTALL PWA --- */}
            {/* <div className="flex justify-center w-full mt-6">
                <div className="w-full max-w-sm">
                    <InstallPWAButton />
                </div>
            </div> */}

        </div>
    );
}

Home.layout = (page) => <AppLayout children={page} title={page.props.page_settings?.title || 'Home'} />;