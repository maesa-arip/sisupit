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
				<h1 className="text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
					Damkar Kota Denpasar
				</h1>

				<p className="text-sm font-bold text-destructive sm:text-base">Lapor Damkar Cepat, Lindungi Warga.</p>
			</div>

			{/* --- ILUSTRASI BERBASIS IKON (Solid & Flat Design) --- */}
			<div className="relative mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center sm:max-w-[280px]">
				{/* Latar Belakang Lingkaran (Solid, tanpa blur) */}
				<div className="absolute inset-0 scale-90 rounded-full bg-red-50 transition-colors dark:bg-red-950/40"></div>

				{/* Ikon Utama (Tengah) */}
				<div className="relative z-10 flex h-32 w-32 rotate-3 items-center justify-center rounded-[24px] border-4 border-white bg-red-700 shadow-none transition-transform duration-300 hover:rotate-0 hover:scale-105 dark:border-neutral-900">
					<IconFlame className="h-16 w-16 text-white" stroke={1.5} />
				</div>

				{/* Elemen Dekorasi (Kanan Bawah - Perisai) */}
				<div className="absolute bottom-8 right-6 z-20 flex h-14 w-14 -rotate-6 items-center justify-center rounded-xl border border-neutral-200 bg-white shadow-none transition-colors dark:border-neutral-700 dark:bg-neutral-900 sm:right-10">
					<IconShieldCheck className="h-7 w-7 text-green-600 dark:text-green-500" stroke={1.5} />
				</div>

				{/* Elemen Dekorasi (Kiri Atas - Telepon) */}
				<div className="absolute left-6 top-10 z-0 flex h-12 w-12 -rotate-12 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-none transition-colors dark:border-neutral-700 dark:bg-neutral-900 sm:left-10">
					<IconPhoneCall className="h-5 w-5 text-blue-600 dark:text-blue-500" stroke={1.5} />
				</div>
			</div>

			{/* --- KONTEN TEKS DESKRIPSI --- */}
			<div className="mx-auto max-w-xl space-y-3">
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
				className="h-12 rounded-xl border border-red-800 bg-red-700 px-8 text-sm font-bold uppercase tracking-wider text-white shadow-none transition-colors hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-700/50"
			>
				<Link href={route('front.reports.create')}>
					<IconFlame className="mr-2 h-5 w-5" stroke={2.5} />
					LAPOR SEKARANG!
				</Link>
			</Button>

			{/* --- TELEPON DARURAT RESMI --- */}
			<a
				href="tel:113"
				className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
			>
				<IconPhoneCall className="h-4 w-4 text-destructive" stroke={2.5} />
				Darurat tanpa internet? Telepon <span className="font-bold text-destructive">113</span>
			</a>

			{/* --- UNDUH APLIKASI --- */}
			{!isWebView && (
				<div className="mt-4 flex w-full flex-col items-center">
					<a
						href="/apk/sisupit.apk"
						download="Sisupit.apk"
						className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50 sm:w-auto"
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

Spotlight.layout = (page) => <AppLayout children={page} title="Pusat Bantuan" />;
