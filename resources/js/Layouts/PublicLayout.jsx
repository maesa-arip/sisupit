import { Button } from '@/Components/ui/button';
import { Head, Link, usePage } from '@inertiajs/react';
import {
	IconBuildingCommunity,
	IconChevronRight,
	IconDroplet,
	IconFireHydrant,
	IconFlame,
	IconLogin2,
	IconPhoneCall,
	IconUsersGroup,
} from '@tabler/icons-react';

/**
 * Chrome publik bersama untuk landing page + halaman publik lain (Hidran/SKKL/Pos
 * Pemadam): navbar + footer ala landing, TANPA sidebar AppLayout. Konten halaman
 * mengatur lebarnya sendiri (main tidak memberi container) agar section full-bleed
 * landing tetap utuh; halaman biasa membungkus kontennya dengan container sendiri.
 */
export default function PublicLayout({ children, title }) {
	const { auth } = usePage().props;
	const isAuthenticated = Boolean(auth?.user?.name || auth?.name);
	const primaryHref = isAuthenticated ? route('dashboard') : route('login');

	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			{title && <Head title={title} />}

			{/* ===== NAVBAR ===== */}
			<header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
					<Link href="/" className="flex items-center gap-2.5 outline-none">
						<img src="/icon.png" alt="SISUPIT" className="size-9 rounded-lg object-contain" />
						<div className="flex flex-col leading-none">
							<span className="text-lg font-black tracking-tight text-foreground">SISUPIT</span>
							<span className="mt-0.5 hidden text-[9px] font-bold uppercase tracking-widest text-destructive sm:block">
								Damkar Terintegrasi
							</span>
						</div>
					</Link>

					<div className="flex items-center gap-2">
						<Button asChild variant="ghost" className="h-9 px-3 text-sm font-semibold sm:px-4">
							<Link href={primaryHref}>
								<IconLogin2 className="mr-1.5 h-4 w-4" stroke={2.2} />
								{isAuthenticated ? 'Dashboard' : 'Masuk'}
							</Link>
						</Button>
						<Button
							asChild
							className="h-9 rounded-lg bg-destructive px-3 text-sm font-bold text-destructive-foreground shadow-none hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 sm:px-4"
						>
							<Link href={route('front.reports.create')}>
								<IconFlame className="mr-1.5 h-4 w-4" stroke={2.5} />
								Lapor
							</Link>
						</Button>
					</div>
				</div>
			</header>

			<main className="flex-1">{children}</main>

			{/* ===== FOOTER ===== */}
			<footer className="border-t border-border bg-background">
				<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
					<div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
						<div className="sm:col-span-2 lg:col-span-1">
							<div className="flex items-center gap-2.5">
								<img src="/icon.png" alt="SISUPIT" className="size-9 rounded-lg object-contain" />
								<span className="text-lg font-black tracking-tight text-foreground">SISUPIT</span>
							</div>
							<p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
								Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi.
							</p>
						</div>

						<div>
							<h4 className="text-sm font-bold uppercase tracking-wide text-foreground">Jelajahi</h4>
							<ul className="mt-4 space-y-2.5 text-sm">
								<li>
									<FooterLink
										href={route('front.hydrants.index')}
										icon={IconFireHydrant}
										label="Hidran"
									/>
								</li>
								<li>
									<FooterLink href={route('front.pumps.index')} icon={IconDroplet} label="SKKL" />
								</li>
								<li>
									<FooterLink
										href={route('front.fire_stations.index')}
										icon={IconBuildingCommunity}
										label="Pos Pemadam"
									/>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="text-sm font-bold uppercase tracking-wide text-foreground">Akun</h4>
							<ul className="mt-4 space-y-2.5 text-sm">
								<li>
									<FooterLink href={route('login')} icon={IconLogin2} label="Masuk" />
								</li>
								<li>
									<FooterLink href={route('register')} icon={IconUsersGroup} label="Daftar" />
								</li>
								<li>
									<FooterLink
										href={route('front.reports.create')}
										icon={IconFlame}
										label="Lapor Darurat"
									/>
								</li>
							</ul>
						</div>

						<div>
							<h4 className="text-sm font-bold uppercase tracking-wide text-foreground">Darurat</h4>
							<ul className="mt-4 space-y-2.5 text-sm">
								<li>
									<a
										href="tel:(0361)223333"
										className="inline-flex items-center gap-2 font-semibold text-destructive hover:underline"
									>
										<IconPhoneCall className="h-4 w-4" stroke={2} />
										(0361) 223333
									</a>
								</li>
								<li>
									<a
										href="tel:112"
										className="inline-flex items-center gap-2 text-muted-foreground hover:text-destructive"
									>
										<IconPhoneCall className="h-4 w-4" stroke={2} />
										112 — Panggilan Darurat
									</a>
								</li>
							</ul>
						</div>
					</div>

					<div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
						© {new Date().getFullYear()} SISUPIT DAMKAR. Seluruh hak cipta dilindungi.
					</div>
				</div>
			</footer>
		</div>
	);
}

function FooterLink({ href, icon: Icon, label }) {
	return (
		<Link
			href={href}
			className="group inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
		>
			<Icon className="h-4 w-4" stroke={1.8} />
			<span>{label}</span>
			<IconChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" stroke={2} />
		</Link>
	);
}
