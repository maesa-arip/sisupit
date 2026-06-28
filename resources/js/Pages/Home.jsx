import HeaderTitle from '@/Components/HeaderTitle';
import { Card, CardContent } from '@/Components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/Components/ui/carousel';
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
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-green-50 dark:bg-success/10 border border-green-200 dark:border-success/30 rounded-md w-fit shadow-sm">
                    <span className="relative flex w-2 h-2">
                        <span className="absolute inline-flex w-full h-full bg-green-400 dark:bg-success/60 rounded-full opacity-75 animate-ping"></span>
                        <span className="relative inline-flex w-2 h-2 bg-green-500 dark:bg-success rounded-full"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-700 dark:text-success uppercase tracking-wider">
                        Siaga 24/7
                    </span>
                </div>
            </div>
            
            {/* --- PINTASAN UTILITAS WARGA --- */}
            <div className="grid grid-cols-2 gap-3 mt-1 sm:gap-4">
                {/* Menu Lokasi Pompa */}
                <Link
                    href={route('front.pumps.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-muted-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <div className="flex items-center justify-center mb-3 text-blue-600 dark:text-info border border-blue-100 dark:border-info/20 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-blue-50 dark:bg-info/10 group-hover:bg-blue-100 dark:group-hover:bg-info/20">
                        <IconDroplet size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-foreground sm:text-sm">
                        Lokasi Pompa<br />Sisupit
                    </span>
                </Link>

                {/* Menu Pos Damkar */}
                <Link
                    href={route('front.fire_stations.index')}
                    className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 sm:p-6 shadow-sm outline-none transition-colors hover:border-muted-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <div className="flex items-center justify-center mb-3 text-destructive border border-destructive/20 transition-colors duration-200 rounded-lg h-12 w-12 sm:h-14 sm:w-14 bg-destructive/10 group-hover:bg-destructive/20">
                        <IconFiretruck size={24} stroke={1.5} className="sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xs font-semibold leading-tight text-center text-foreground sm:text-sm">
                        Pos Damkar<br />Terdekat
                    </span>
                </Link>

                {/* Tombol Telepon Darurat */}
                <a href="tel:113" className="flex items-center justify-center w-full col-span-2 gap-2 h-11 text-sm font-semibold text-destructive transition-colors border border-destructive/30 shadow-sm bg-destructive/10 rounded-xl hover:bg-destructive/20 outline-none focus-visible:ring-2 focus-visible:ring-destructive">
                    <IconPhoneCall size={18} stroke={2} />
                    <span>Telepon Darurat (113)</span>
                </a>
            </div>

            <hr className="my-2 border-border" />

            {/* --- CAROUSEL INFORMASI --- */}
            <div className="flex flex-col items-center w-full space-y-4">
                <div className="w-full px-1 text-left">
                    <h3 className="text-base font-semibold text-foreground">
                        Informasi & Edukasi
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
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
                                    <Card className="h-full overflow-hidden transition-colors border border-border shadow-sm rounded-xl hover:border-muted-foreground/30 group bg-card">
                                        <div className="flex items-center justify-center w-full h-28 bg-muted border-b border-border">
                                            <IconNews className="w-8 h-8 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground" stroke={1.5} />
                                        </div>
                                        <CardContent className="p-4">
                                            <div className="flex flex-col gap-1.5 h-full">
                                                <span className={`text-[10px] font-semibold tracking-wider uppercase ${isWarning ? 'text-amber-600 dark:text-warning' : 'text-blue-600 dark:text-info'}`}>
                                                    {isWarning ? 'Peringatan Dini' : 'Berita Warga'}
                                                </span>
                                                <h4 className="text-sm font-semibold text-foreground line-clamp-2">
                                                    {isWarning ? 'Waspada Potensi Kebakaran Lahan di Musim Kemarau' : `Informasi Kegiatan Edukasi Damkar Sesi ${index + 1}`}
                                                </h4>
                                                <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
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
                        <CarouselPrevious className="text-foreground/80 border-border bg-card hover:bg-muted hover:text-foreground" />
                        <CarouselNext className="text-foreground/80 border-border bg-card hover:bg-muted hover:text-foreground" />
                    </div>
                </Carousel>
            </div>

            {/* --- UNDUH APLIKASI --- */}
            {!isWebView && (
                <div className="flex flex-col items-center w-full mt-4">
                    <a
                        href="/apk/sisupit.apk"
                        download="Sisupit.apk"
                        className="flex items-center justify-center w-full sm:w-auto h-12 px-6 gap-3 font-medium text-foreground/80 transition-colors bg-card border border-border rounded-xl hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm"
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

Home.layout = (page) => <AppLayout children={page} title={page.props.page_settings?.title || 'Beranda'} />;