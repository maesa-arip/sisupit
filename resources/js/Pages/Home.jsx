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
	IconPhoneCall,
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
		<div className="relative flex w-full flex-col space-y-6 pb-32">
			{/* --- HEADER --- */}
			<div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Informasi Publik"
					subtitle="Fasilitas dan edukasi keselamatan warga."
					icon={IconInfoCircle}
				/>

				{/* Indikator Sistem Online */}
				<div className="flex w-fit items-center gap-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-1.5 shadow-sm dark:border-success/30 dark:bg-success/10">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 dark:bg-success/60"></span>
						<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500 dark:bg-success"></span>
					</span>
					<span className="text-[10px] font-bold uppercase tracking-wider text-green-700 dark:text-success">
						Siaga 24/7
					</span>
				</div>
			</div>

			{/* --- PINTASAN UTILITAS WARGA --- */}
			<div className="mt-1 grid grid-cols-2 gap-3 sm:gap-4">
				{/* Menu Lokasi Pompa */}
				<Link
					href={route('front.pumps.index')}
					className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-colors hover:border-muted-foreground/30 focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
				>
					<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition-colors duration-200 group-hover:bg-blue-100 dark:border-info/20 dark:bg-info/10 dark:text-info dark:group-hover:bg-info/20 sm:h-14 sm:w-14">
						<IconDroplet size={24} stroke={1.5} className="sm:h-7 sm:w-7" />
					</div>
					<span className="text-center text-xs font-semibold leading-tight text-foreground sm:text-sm">
						Lokasi Pompa
						<br />
						Sisupit
					</span>
				</Link>

				{/* Menu Pos Damkar */}
				<Link
					href={route('front.fire_stations.index')}
					className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-5 shadow-sm outline-none transition-colors hover:border-muted-foreground/30 focus-visible:ring-2 focus-visible:ring-ring sm:p-6"
				>
					<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive transition-colors duration-200 group-hover:bg-destructive/20 sm:h-14 sm:w-14">
						<IconFiretruck size={24} stroke={1.5} className="sm:h-7 sm:w-7" />
					</div>
					<span className="text-center text-xs font-semibold leading-tight text-foreground sm:text-sm">
						Pos Damkar
						<br />
						Terdekat
					</span>
				</Link>

				{/* Tombol Telepon Darurat */}
				<a
					href="tel:113"
					className="col-span-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive shadow-sm outline-none transition-colors hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-destructive"
				>
					<IconPhoneCall size={18} stroke={2} />
					<span>Telepon Darurat (113)</span>
				</a>
			</div>

			<hr className="my-2 border-border" />

			{/* --- CAROUSEL INFORMASI --- */}
			<div className="flex w-full flex-col items-center space-y-4">
				<div className="w-full px-1 text-left">
					<h3 className="text-base font-semibold text-foreground">Informasi & Edukasi</h3>
					<p className="mt-0.5 text-sm text-muted-foreground">
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
								<CarouselItem key={index} className="pl-3 md:basis-1/2 md:pl-4 lg:basis-1/3">
									<Card className="group h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-colors hover:border-muted-foreground/30">
										<div className="flex h-28 w-full items-center justify-center border-b border-border bg-muted">
											<IconNews
												className="h-8 w-8 text-muted-foreground/60 transition-colors group-hover:text-muted-foreground"
												stroke={1.5}
											/>
										</div>
										<CardContent className="p-4">
											<div className="flex h-full flex-col gap-1.5">
												<span
													className={`text-[10px] font-semibold uppercase tracking-wider ${isWarning ? 'text-amber-600 dark:text-warning' : 'text-blue-600 dark:text-info'}`}
												>
													{isWarning ? 'Peringatan Dini' : 'Berita Warga'}
												</span>
												<h4 className="line-clamp-2 text-sm font-semibold text-foreground">
													{isWarning
														? 'Waspada Potensi Kebakaran Lahan di Musim Kemarau'
														: `Informasi Kegiatan Edukasi Damkar Sesi ${index + 1}`}
												</h4>
												<p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
													Klik untuk membaca selengkapnya mengenai informasi penting ini demi
													keselamatan bersama.
												</p>
											</div>
										</CardContent>
									</Card>
								</CarouselItem>
							);
						})}
					</CarouselContent>
					<div className="hidden lg:block">
						<CarouselPrevious className="border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground" />
						<CarouselNext className="border-border bg-card text-foreground/80 hover:bg-muted hover:text-foreground" />
					</div>
				</Carousel>
			</div>

			{/* --- UNDUH APLIKASI --- */}
			{!isWebView && (
				<div className="mt-4 flex w-full flex-col items-center">
					<a
						href="/apk/sisupit.apk"
						download="Sisupit.apk"
						className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 font-medium text-foreground/80 shadow-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
					>
						<div className="flex items-center justify-center rounded-md bg-green-50 p-1 dark:bg-success/10">
							<IconBrandAndroid className="h-5 w-5 text-green-600 dark:text-success" stroke={2} />
						</div>
						<span className="text-sm">Unduh Aplikasi Android</span>
						<IconDownload className="ml-1 h-4 w-4 text-muted-foreground" stroke={2} />
					</a>
				</div>
			)}
		</div>
	);
}

Home.layout = (page) => <AppLayout children={page} title={page.props.page_settings?.title || 'Beranda'} />;
