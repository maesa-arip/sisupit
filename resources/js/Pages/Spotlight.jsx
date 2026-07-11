import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconBrandAndroid, IconDownload, IconFlame, IconPhoneCall, IconShieldCheck } from '@tabler/icons-react';
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
		<div className="relative flex min-h-[75vh] w-full flex-col items-center justify-center space-y-8 px-6 py-6 text-center">
			{/* --- HEADER TEKS BARU (TAKTIS & TEGAS) --- */}
			<div className="mt-4 space-y-2">
				<h1 className="text-2xl font-black tracking-tight uppercase text-foreground sm:text-3xl">
					Damkar Kota Denpasar
				</h1>

				<p className="text-sm font-bold text-destructive sm:text-base">Lapor Damkar Cepat,Tepat Lindungi Warga.</p>
			</div>

			{/* --- ILUSTRASI BERBASIS IKON (Solid & Flat Design) --- */}
			<div className="relative mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center sm:max-w-[280px]">
				{/* Latar Belakang Lingkaran (Solid, tanpa blur) */}
				<div className="absolute inset-0 transition-colors scale-90 rounded-full bg-destructive/10"></div>

				{/* Ikon Utama (Tengah) */}
				<div className="relative z-10 flex h-32 w-32 rotate-3 items-center justify-center rounded-[24px] border-4 border-white bg-destructive shadow-none transition-transform duration-300 hover:rotate-0 hover:scale-105 dark:border-neutral-900">
					<IconFlame className="w-16 h-16 text-white" stroke={1.5} />
				</div>

				{/* Elemen Dekorasi (Kanan Bawah - Perisai) */}
				<div className="absolute z-20 flex items-center justify-center transition-colors bg-white border shadow-none bottom-8 right-6 h-14 w-14 -rotate-6 rounded-xl border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 sm:right-10">
					<IconShieldCheck className="text-success h-7 w-7" stroke={1.5} />
				</div>

				{/* Elemen Dekorasi (Kiri Atas - Telepon) */}
				<div className="absolute z-0 flex items-center justify-center w-12 h-12 transition-colors bg-white border rounded-full shadow-none left-6 top-10 -rotate-12 border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 sm:left-10">
					<IconPhoneCall className="w-5 h-5 text-info" stroke={1.5} />
				</div>
			</div>

			{/* --- KONTEN TEKS DESKRIPSI --- */}
			<div className="max-w-xl mx-auto space-y-3">
				<h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
					Ada yang Bisa Kami Bantu?
				</h2>
				<p className="text-[14px] leading-relaxed text-muted-foreground sm:text-base">
					Segera laporkan kejadian kebakaran atau keadaan darurat lainnya kepada tim kami. Informasi yang Anda
					berikan akan membantu kami dalam merespons dengan cepat dan tepat!
				</p>
			</div>

			{/* --- TOMBOL AKSI (CTA) --- */}
			<Button
				asChild
				className="h-12 px-8 text-sm font-bold tracking-wider text-destructive-foreground uppercase transition-colors bg-destructive border border-destructive shadow-none rounded-xl hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
			>
				<Link href={route('front.reports.create')}>
					<IconFlame className="w-5 h-5 mr-2" stroke={2.5} />
					LAPOR SEKARANG!
				</Link>
			</Button>

			{/* --- TELEPON DARURAT RESMI --- */}
			<a
				href="tel:(0361)223333"
				className="flex items-center gap-1 text-sm font-semibold transition-colors text-muted-foreground hover:text-destructive"
			>
				<IconPhoneCall className="w-4 h-4 text-destructive"/>
				Darurat tanpa internet? Telepon <span className="font-bold text-destructive">(0361)223333</span>
			</a>

			{/* --- UNDUH APLIKASI --- */}
			{!isWebView && (
				<div className="flex flex-col items-center w-full mt-4">
					<a
						href="/apk/sisupit.apk"
						download="Sisupit.apk"
						className="flex items-center justify-center w-full h-12 gap-3 px-6 font-medium transition-colors border shadow-sm outline-none rounded-xl border-border bg-card text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50 sm:w-auto"
					>
						<div className="flex items-center justify-center p-1 rounded-md bg-success/10">
							<IconBrandAndroid className="w-5 h-5 text-success" stroke={2} />
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
