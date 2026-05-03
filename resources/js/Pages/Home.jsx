import HeaderTitle from '@/Components/HeaderTitle';
import InstallPWAButton from '@/Components/InstallPWAButton';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconBell, IconBellRinging, IconDashboard, IconDroplet, IconFiretruck, IconNews,IconUsers,IconChevronRight } from '@tabler/icons-react';
import Autoplay from 'embla-carousel-autoplay';
import { useRef } from 'react';

export default function Home(props) {
    const plugin = useRef(Autoplay({ delay: 3000, stopOnInteraction: true }));
    
    // Pastikan aman jika user belum login (auth.user bisa null)
    const auth = props.auth?.user ?? null;

    return (
        <div className="relative flex flex-col w-full pb-32 space-y-6">
            
            

            <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
							<HeaderTitle
								title={props.page_settings.title}
								subtitle={props.page_settings.subtitle}
								icon={IconDashboard}
							/>
						</div>
			
			
						<div className="grid grid-cols-2 gap-4 mt-2 mb-4">
				{/* Menu Pompa Sisupit */}

				<Link
					href={route('front.pumps.index')}
					className="group flex flex-col items-center justify-center rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900"
				>
					<div className="flex items-center justify-center mb-3 text-blue-500 transition-transform duration-300 rounded-full h-14 w-14 bg-blue-50 group-hover:scale-110 dark:bg-blue-900/20">
						<IconDroplet size={28} />
					</div>
					<span className="text-sm font-bold leading-tight text-center text-gray-800 dark:text-slate-200">
						Lokasi Pompa
						<br />
						Sisupit
					</span>
				</Link>
				
				{/* Menu Pos Damkar */}
				<Link
					href={route('front.fire_stations.index')}
					className="group flex flex-col items-center justify-center rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900"
				>
					<div className="flex items-center justify-center mb-3 text-red-500 transition-transform duration-300 rounded-full h-14 w-14 bg-red-50 group-hover:scale-110 dark:bg-red-900/20">
						<IconFiretruck size={28} />
					</div>
					<span className="text-sm font-bold leading-tight text-center text-gray-800 dark:text-slate-200">
						Pos Damkar
						<br />
						Terdekat
					</span>
				</Link>
				{/* TOMBOL DAFTAR PENGGUNA */}
				{/* Tambahkan col-span-2 di sini agar membentang penuh di bawah 2 tombol lainnya */}
				<Link href={route('front.volunteers.index')} className="block w-full col-span-2">
					<Card className="overflow-hidden transition-all duration-300 border border-gray-100 shadow-sm cursor-pointer group rounded-2xl bg-white/80 backdrop-blur-sm hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-indigo-700">
						<CardContent className="flex flex-row items-center gap-4 p-4 flex-nowrap">
							{/* KIRI: Ikon Pengguna (Menggunakan warna Indigo/Ungu khas Admin) */}
							<div className="flex items-center justify-center w-12 h-12 text-indigo-600 transition-transform border border-indigo-100 rounded-full shadow-inner shrink-0 bg-indigo-50 group-hover:scale-110 dark:border-indigo-800/50 dark:bg-indigo-900/30 dark:text-indigo-400">
								<IconUsers className="w-6 h-6" />
							</div>

							{/* TENGAH: Teks & Keterangan */}
							<div className="flex-1 w-full min-w-0 py-1">
								<h3 className="truncate text-[15px] font-bold text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
									Daftar Pengguna
								</h3>
								<p className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-slate-400">
									Kelola data admin, relawan, dan hak akses.
								</p>
							</div>

							{/* KANAN: Ikon Panah (Indikator bisa di-klik) */}
							<div className="flex flex-col items-end justify-center shrink-0">
								<div className="flex items-center justify-center w-8 h-8 text-gray-400 transition-colors rounded-full bg-gray-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:bg-slate-800 dark:group-hover:bg-indigo-900/30 dark:group-hover:text-indigo-400">
									<IconChevronRight className="w-5 h-5" />
								</div>
							</div>
						</CardContent>
					</Card>
				</Link>
			</div>
			
						{/* --- TOMBOL LAPOR --- */}
						<div className="flex justify-center w-full">
							<Link href={route('front.reports.create')} className="block w-full max-w-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500 rounded-3xl">
								<div className="relative flex items-center justify-between p-6 overflow-hidden transition-all duration-300 shadow-lg sm:p-8 bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-700 rounded-3xl hover:shadow-amber-500/30 dark:hover:shadow-amber-900/40 hover:-translate-y-1 group">
									<div className="relative z-10 flex flex-col">
										<span className="mb-1 text-sm font-bold tracking-wider uppercase text-amber-100">Pusat Bantuan</span>
										<span className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">Laporkan<br />Kejadian</span>
									</div>
									<div className="relative z-10 p-4 transition-transform duration-300 rounded-full bg-white/20 backdrop-blur-md group-hover:scale-110 group-hover:rotate-12">
										 <IconBell className="w-12 h-12 text-white" />
									</div>
									<div className="absolute top-0 right-0 w-40 h-40 transform translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-2xl"></div>
									<div className="absolute bottom-0 left-0 w-32 h-32 transform -translate-x-12 translate-y-12 rounded-full bg-black/10 blur-xl"></div>
								</div>
							</Link>
						</div>

						<hr className="my-2 border-gray-200 dark:border-slate-800" />

            {/* --- SECTION: CAROUSEL INFORMASI --- */}
            <div className="flex flex-col items-center w-full space-y-6">
                <div className="w-full max-w-4xl px-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                        Informasi Terkini
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                        Pembaruan berita dan laporan terbaru di sekitar Anda.
                    </p>
                </div>

                <Carousel
                    plugins={[plugin.current]}
                    className="w-full max-w-4xl"
                    onMouseEnter={plugin.current.stop}
                    onMouseLeave={plugin.current.reset}
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <Card className="overflow-hidden transition-colors border border-gray-200 shadow-sm dark:border-slate-800 rounded-3xl dark:bg-slate-900/60 backdrop-blur-sm group hover:border-amber-300 dark:hover:border-amber-700/50">
                                        {/* Area Gambar/Ilustrasi Placeholder */}
                                        <div className="flex items-center justify-center w-full h-32 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-slate-800 dark:to-slate-800/50">
                                            <IconNews className="w-12 h-12 transition-colors text-amber-500/40 group-hover:text-amber-500/70" />
                                        </div>
                                        {/* Konten Teks */}
                                        <CardContent className="p-5">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="text-[10px] font-bold tracking-widest text-amber-600 uppercase dark:text-amber-500">
                                                    Pengumuman
                                                </span>
                                                <h4 className="font-bold text-gray-900 text-md dark:text-slate-100 line-clamp-2">
                                                    Informasi Penting Terkait Wilayah {index + 1}
                                                </h4>
                                                <p className="mt-1 text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                                                    Ini adalah deskripsi singkat mengenai informasi atau berita terkini yang perlu diketahui oleh warga.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    
                    {/* Navigasi Carousel disembunyikan di HP, muncul di Desktop */}
                    <div className="hidden lg:block">
                        <CarouselPrevious className="border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-amber-400 text-amber-600" />
                        <CarouselNext className="border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-amber-400 text-amber-600" />
                    </div>
                </Carousel>
            </div>

            {/* --- SECTION: INSTALL PWA --- */}
            <div className="flex justify-center w-full mt-8">
                <div className="w-full max-w-sm">
                    <InstallPWAButton />
                </div>
            </div>

        </div>
    );
}

// Tetap menggunakan AppLayout sesuai dengan routing Anda
Home.layout = (page) => <AppLayout children={page} title={page.props.page_settings?.title || 'Home'} />;