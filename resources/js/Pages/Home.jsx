import HeaderTitle from '@/Components/HeaderTitle';
import { Card, CardContent } from '@/Components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { 
    IconBrandAndroid,
    IconDownload,
    IconDroplet, 
    IconFiretruck, 
    IconInfoCircle,
    IconNews,
    IconPhoneCall
} from '@tabler/icons-react';
import Autoplay from 'embla-carousel-autoplay';
import { useEffect, useRef, useState } from 'react';

export default function Home(props) {
    const plugin = useRef(Autoplay({ delay: 3500, stopOnInteraction: true }));
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
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
                <HeaderTitle
                    title="Informasi Publik"
                    subtitle="Fasilitas dan edukasi keselamatan warga."
                    icon={IconInfoCircle}              
                />
                
                {/* Indikator Sistem Online */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-md dark:bg-[#112a1d] dark:border-[#1e402c] w-fit shadow-sm">
                    <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full bg-green-400 rounded-full opacity-75 animate-ping"></span>
                        <span className="relative inline-flex w-2 h-2 bg-green-500 rounded-full"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider dark:text-green-500">
                        Siaga 24/7
                    </span>
                </div>
            </div>
            
            {/* --- PINTASAN UTILITAS WARGA --- */}
            <div className="grid grid-cols-2 gap-3 mt-1 sm:gap-4">
                {/* Menu Lokasi Pompa */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333] focus-visible:ring-2 focus-visible:ring-gray-300"
                >
                    <div className="flex items-center justify-center mb-3 text-blue-600 border border-blue-100 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 group-hover:bg-blue-100 dark:border-[#1e3a5f] dark:bg-[#111e36] dark:text-[#60a5fa] dark:group-hover:bg-[#1a2c4e]">
                        <IconDroplet size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-gray-900 sm:text-sm dark:text-gray-100">
                        Lokasi Pompa<br />Sisupit
                    </span>
                </Link>
                
                {/* Menu Pos Damkar */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-gray-300 dark:border-[#262626] dark:bg-[#151515] dark:hover:border-[#333] focus-visible:ring-2 focus-visible:ring-gray-300"
                >
                    <div className="flex items-center justify-center mb-3 text-[#b42826] border border-red-100 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-red-50 group-hover:bg-red-100 dark:border-[#4a1c1c] dark:bg-[#2a1313] dark:text-[#e54845] dark:group-hover:bg-[#3f1919]">
                        <IconFiretruck size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-gray-900 sm:text-sm dark:text-gray-100">
                        Pos Damkar<br />Terdekat
                    </span>
                </Link>

                {/* Tombol Telepon Darurat */}
                <a href="tel:113" className="flex items-center justify-center w-full col-span-2 gap-2 h-11 text-sm font-semibold text-[#b42826] transition-colors border border-red-200 shadow-sm bg-red-50 rounded-xl hover:bg-red-100 dark:bg-[#2a1313] dark:border-[#4a1c1c] dark:text-[#e54845] dark:hover:bg-[#3f1919] outline-none focus-visible:ring-2 focus-visible:ring-[#b42826]">
                    <IconPhoneCall size={18} stroke={2} />
                    <span>Telepon Darurat (113)</span>
                </a>
            </div>

            <hr className="my-2 border-[#e5e5e5] dark:border-[#262626]" />

            {/* --- CAROUSEL INFORMASI --- */}
            <div className="flex flex-col items-center w-full space-y-4">
                <div className="w-full px-1 text-left">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Informasi & Edukasi
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
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
                            const isWarning = index === 0; 
                            return (
                                <CarouselItem key={index} className="pl-3 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                    <Card className="h-full overflow-hidden transition-colors border border-[#e5e5e5] shadow-sm dark:border-[#262626] rounded-xl dark:bg-[#151515] hover:border-gray-300 dark:hover:border-[#333] group bg-white">
                                        <div className="flex items-center justify-center w-full h-28 bg-gray-50 border-b border-[#e5e5e5] dark:bg-[#101010] dark:border-[#262626]">
                                            <IconNews className="w-8 h-8 text-gray-300 transition-colors group-hover:text-gray-400 dark:text-gray-600 dark:group-hover:text-gray-500" stroke={1.5} />
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-1.5 h-full">
                                                <span className={`text-[10px] font-semibold tracking-wider uppercase ${isWarning ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-400'}`}>
                                                    {isWarning ? 'Peringatan Dini' : 'Berita Warga'}
                                                </span>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                                                    {isWarning ? 'Waspada Potensi Kebakaran Lahan di Musim Kemarau' : `Informasi Kegiatan Edukasi Damkar Sesi ${index + 1}`}
                                                </h4>
                                                <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    Klik untuk membaca selengkapnya mengenai informasi penting ini demi keselamatan bersama.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </CarouselItem>
                            );
                        })}
                    </CarouselContent>
                    <div className="hidden lg:block">
                        <CarouselPrevious className="text-gray-600 border-[#e5e5e5] bg-white dark:border-[#333] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1f1f1f] dark:hover:text-white" />
                        <CarouselNext className="text-gray-600 border-[#e5e5e5] bg-white dark:border-[#333] dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-[#1f1f1f] dark:hover:text-white" />
                    </div>
                </Carousel>
            </div>

            {/* --- UNDUH APLIKASI --- */}
            {!isWebView && (
                <div className="flex flex-col items-center w-full mt-4">
                    <a
                        href="/apk/sisupit.apk" 
                        download="Sisupit.apk"
                        className="flex items-center justify-center w-full sm:w-auto h-12 px-6 gap-3 font-medium text-gray-700 transition-colors bg-white border border-[#e5e5e5] rounded-xl dark:bg-[#151515] dark:border-[#262626] dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#1f1f1f] outline-none focus-visible:ring-2 focus-visible:ring-gray-300 shadow-sm"
                    >
                        <div className="flex items-center justify-center p-1 rounded-md bg-green-50 dark:bg-[#112a1d]">
                            <IconBrandAndroid className="w-5 h-5 text-green-600 dark:text-green-500" stroke={2} />
                        </div>
                        <span className="text-sm">Unduh Aplikasi Android</span>
                        <IconDownload className="w-4 h-4 ml-1 text-gray-400 dark:text-gray-500" stroke={2} />
                    </a>
                </div>
            )}
        </div>
    );
}

Home.layout = (page) => <AppLayout children={page} title={page.props.page_settings?.title || 'Beranda'} />;