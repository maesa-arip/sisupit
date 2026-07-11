import { Button } from '@/Components/ui/button';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import {
	IconArrowRight,
	IconBell,
	IconBrandAndroid,
	IconClipboardCheck,
	IconDownload,
	IconDroplet,
	IconFlame,
	IconLogin2,
	IconMap2,
	IconMapPin,
	IconPhoneCall,
	IconRoute,
	IconShieldCheck,
	IconUsersGroup,
} from '@tabler/icons-react';

/* Konten landing publik. Navbar + footer disediakan PublicLayout (dipakai bersama halaman
 * publik lain). WebView di-redirect di HomeController::landing sebelum halaman ini termuat;
 * useEffect di bawah hanya jaring pengaman untuk masa deploy. */
export default function Landing({ page_data }) {
	const { auth } = usePage().props;
	const isAuthenticated = Boolean(auth?.user?.name || auth?.name);
	const primaryHref = isAuthenticated ? route('dashboard') : route('login');

	// Jaring pengaman untuk aplikasi WebView (UA ∋ SisupitApp). Normalnya server sudah
	// meredirect app SEBELUM halaman ini termuat; ini hanya menutup celah saat masa deploy
	// (kode server baru belum ter-pull) agar app tidak tersangkut di landing publik.
	useEffect(() => {
		if (typeof navigator !== 'undefined' && /SisupitApp/i.test(navigator.userAgent || '')) {
			window.location.replace(isAuthenticated ? route('dashboard') : route('home.spotlight'));
		}
	}, [isAuthenticated]);

	const stats = [
		{ label: 'Total Laporan Masuk', value: page_data?.total_reports ?? 0, icon: IconFlame },
		{ label: 'Kejadian Tertangani', value: page_data?.total_handled_reports ?? 0, icon: IconShieldCheck },
		{ label: 'Petugas & Relawan Siaga', value: page_data?.total_users ?? 0, icon: IconUsersGroup },
	];

	const steps = [
		{
			icon: IconMapPin,
			title: 'Laporkan Kejadian',
			desc: 'Warga mengirim laporan kebakaran atau darurat lengkap dengan foto dan titik lokasi otomatis.',
		},
		{
			icon: IconClipboardCheck,
			title: 'Validasi Pusat Komando',
			desc: 'Petugas memverifikasi laporan yang masuk dan menentukan prioritas penanganan.',
		},
		{
			icon: IconRoute,
			title: 'Respons & Pelacakan Live',
			desc: 'Petugas dan relawan meluncur ke lokasi dengan posisi terpantau secara real-time.',
		},
		{
			icon: IconShieldCheck,
			title: 'Kejadian Terkendali',
			desc: 'Status diperbarui hingga insiden ditutup, dengan riwayat penanganan tercatat rapi.',
		},
	];

	const features = [
		{
			icon: IconFlame,
			title: 'Pelaporan Cepat',
			desc: 'Satu ketuk untuk melapor darurat, tanpa formulir berbelit.',
		},
		{
			icon: IconRoute,
			title: 'Pelacakan Lokasi Live',
			desc: 'Pantau pergerakan responder menuju lokasi kejadian secara langsung.',
		},
		{
			icon: IconMap2,
			title: 'Peta Pemantauan Terpadu',
			desc: 'Kejadian, hidran, pos pemadam, dan SKKL dalam satu peta.',
		},
		{
			icon: IconBell,
			title: 'Notifikasi Real-time',
			desc: 'Pelapor menerima kabar di setiap perubahan status penanganan.',
		},
		{
			icon: IconDroplet,
			title: 'Data Sumber Air',
			desc: 'Lokasi hidran dan SKKL terdekat siap dijadikan rujukan di lapangan.',
		},
		{
			icon: IconUsersGroup,
			title: 'Koordinasi Relawan',
			desc: 'Relawan terverifikasi ikut merespons sesuai wilayah dan keahlian.',
		},
	];

	return (
		<>
			{/* ===== HERO ===== */}
			<section className="relative overflow-hidden bg-gradient-to-b from-destructive/5 to-background">
				<div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2">
					<div className="text-center lg:text-left">
						<span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
								<span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
							</span>
							Siaga 24 Jam
						</span>

						<h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
							Lapor Damkar <span className="text-destructive">Cepat</span>,
							<br className="hidden sm:block" /> Respons Tepat.
						</h1>

						<p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg lg:mx-0">
							Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi. Laporkan kebakaran dan
							keadaan darurat, langsung terhubung ke Pusat Komando dan tim di lapangan.
						</p>

						<div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
							<Button
								asChild
								className="h-12 w-full rounded-xl bg-destructive px-8 py-3 text-base font-bold uppercase tracking-wider text-destructive-foreground shadow-lg shadow-destructive/20 transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 sm:w-auto"
							>
								<Link href={route('front.reports.create')}>
									<IconFlame className="mr-2 h-5 w-5" stroke={2.5} />
									Lapor Darurat
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								className="h-12 w-full rounded-xl border-border px-8 py-3 text-base font-bold uppercase tracking-wider text-foreground shadow-none transition-colors hover:bg-accent sm:w-auto"
							>
								<Link href={primaryHref}>
									<IconLogin2 className="mr-2 h-5 w-5" stroke={2.5} />
									{isAuthenticated ? 'Dashboard' : 'Masuk'}
								</Link>
							</Button>
						</div>

						<a
							href="tel:(0361)223333"
							className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
						>
							<IconPhoneCall className="h-4 w-4 text-destructive" stroke={2} />
							Darurat tanpa internet? Telepon{' '}
							<span className="font-bold text-destructive">(0361) 223333</span>
						</a>
					</div>

					{/* Ilustrasi ikon */}
					<div className="relative mx-auto flex aspect-square w-full max-w-sm items-center justify-center">
						<div className="absolute inset-6 rounded-full bg-destructive/10"></div>
						<div className="absolute inset-16 rounded-full bg-destructive/15"></div>
						<div className="relative z-10 flex h-40 w-40 rotate-3 items-center justify-center rounded-[36px] border-4 border-white bg-destructive shadow-2xl shadow-destructive/30 transition-transform duration-300 hover:rotate-0 dark:border-neutral-900">
							<IconFlame className="h-24 w-24 text-white" stroke={1.5} />
						</div>
						<div className="absolute right-4 top-10 z-20 flex h-16 w-16 -rotate-6 items-center justify-center rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
							<IconShieldCheck className="h-8 w-8 text-success" stroke={1.5} />
						</div>
						<div className="absolute bottom-8 left-2 z-20 flex h-14 w-14 rotate-6 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
							<IconMapPin className="h-6 w-6 text-info" stroke={1.8} />
						</div>
					</div>
				</div>
			</section>

			{/* ===== STATISTIK ===== */}
			<section className="border-y border-border bg-card/40">
				<div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-border px-4 py-8 sm:px-6">
					{stats.map(({ label, value, icon: Icon }) => (
						<div key={label} className="flex flex-col items-center gap-1.5 px-2 text-center">
							<Icon className="h-5 w-5 text-destructive" stroke={2} />
							<span className="text-2xl font-black text-foreground sm:text-4xl">
								{Number(value).toLocaleString('id-ID')}
							</span>
							<span className="text-[11px] font-medium leading-tight text-muted-foreground sm:text-sm">
								{label}
							</span>
						</div>
					))}
				</div>
			</section>

			{/* ===== ALUR / CARA KERJA ===== */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
				<div className="mx-auto max-w-2xl text-center">
					<span className="text-sm font-bold uppercase tracking-widest text-destructive">Cara Kerja</span>
					<h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
						Dari Laporan ke Penanganan
					</h2>
					<p className="mt-3 text-muted-foreground">
						Empat langkah sederhana yang menghubungkan warga dengan tim pemadam kebakaran.
					</p>
				</div>

				<div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{steps.map(({ icon: Icon, title, desc }, i) => (
						<div
							key={title}
							className="relative rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
						>
							<span className="absolute right-5 top-5 text-4xl font-black text-destructive/15">
								{String(i + 1).padStart(2, '0')}
							</span>
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
								<Icon className="h-6 w-6 text-destructive" stroke={1.8} />
							</div>
							<h3 className="mt-4 text-lg font-bold text-foreground">{title}</h3>
							<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
						</div>
					))}
				</div>
			</section>

			{/* ===== FITUR ===== */}
			<section className="border-t border-border bg-card/40">
				<div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
					<div className="mx-auto max-w-2xl text-center">
						<span className="text-sm font-bold uppercase tracking-widest text-destructive">Fitur</span>
						<h2 className="mt-2 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
							Satu Platform, Respons Menyeluruh
						</h2>
					</div>

					<div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
						{features.map(({ icon: Icon, title, desc }) => (
							<div key={title} className="flex gap-4 rounded-2xl border border-border bg-background p-5">
								<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
									<Icon className="h-5 w-5 text-destructive" stroke={1.8} />
								</div>
								<div>
									<h3 className="font-bold text-foreground">{title}</h3>
									<p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* ===== UNDUH APLIKASI ===== */}
			<section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
				<div className="flex flex-col items-center gap-6 rounded-3xl border border-border bg-card p-8 text-center sm:p-12">
					<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
						<IconBrandAndroid className="h-7 w-7 text-success" stroke={2} />
					</div>
					<div>
						<h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
							Pasang Aplikasi Android
						</h2>
						<p className="mx-auto mt-2 max-w-md text-muted-foreground">
							Lapor lebih cepat, terima notifikasi darurat, dan pantau langsung dari genggaman.
						</p>
					</div>
					<a
						href="/apk/sisupit.apk"
						download="Sisupit.apk"
						className="inline-flex h-12 items-center justify-center gap-3 rounded-xl border border-border bg-background px-6 font-semibold text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50"
					>
						<IconDownload className="h-5 w-5 text-success" stroke={2} />
						Unduh APK
					</a>
				</div>
			</section>

			{/* ===== CTA BESAR ===== */}
			<section className="bg-destructive">
				<div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
					<h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
						Melihat Kejadian Darurat?
					</h2>
					<p className="max-w-lg text-destructive-foreground/90">
						Jangan tunda. Laporan Anda membantu tim kami merespons lebih cepat dan menyelamatkan lebih
						banyak nyawa.
					</p>
					<Button
						asChild
						className="h-12 rounded-xl bg-white px-8 py-3 text-base font-bold uppercase tracking-wider text-destructive shadow-none transition-colors hover:bg-white/90 focus-visible:ring-2 focus-visible:ring-white/60"
					>
						<Link href={route('front.reports.create')}>
							Lapor Sekarang
							<IconArrowRight className="ml-2 h-5 w-5" stroke={2.5} />
						</Link>
					</Button>
				</div>
			</section>
		</>
	);
}

Landing.layout = (page) => <PublicLayout children={page} title="Beranda" />;
