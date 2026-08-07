import { Drawer, DrawerContent, DrawerTitle } from '@/Components/ui/drawer';
import useSheetHistory from '@/hooks/use-sheet-history';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { IconFiretruck, IconHistory, IconHome, IconMenu2 } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import MobileMenuPanel from './MobileMenuPanel';
import { buildNavSections, findNavItem } from './navItems';

/**
 * Navigasi bawah untuk layar <md. Lima slot tetap sesuai batas wajar bottom nav
 * (Material: 3–5 destinasi): Beranda, Fasilitas, Lapor, Riwayat, Menu.
 *
 * Dua slot membuka panel, dan keduanya kini memakai drawer-dari-bawah yang sama
 * (`Components/ui/drawer`, vaul) alih-alih satu popover buatan tangan + satu sheet dari
 * kanan. Alasannya bukan kerapian kode semata: panel yang muncul dari sisi berlawanan
 * dengan tombolnya memutus hubungan sebab-akibat, dan isinya mendarat jauh dari jempol.
 *
 * Daftar menunya sendiri berasal dari `navItems.js` — satu sumber untuk semua permukaan.
 */
export default function MobileBottomNav({ auth }) {
	const { url } = usePage();

	const [showFasilitas, setShowFasilitas] = useState(false);
	const [showMenu, setShowMenu] = useState(false);

	useSheetHistory(showFasilitas, () => setShowFasilitas(false), 'fasilitas');

	const sections = useMemo(() => buildNavSections({ auth, url }), [auth, url]);

	// Peta Pemantauan tinggal di seksi "Menu Utama", tapi bagi pengguna ponsel ia adalah
	// tujuan berbasis lokasi — jadi ikut ditawarkan di panel Fasilitas. Diambil lewat key,
	// bukan didefinisikan ulang.
	const fasilitasItems = useMemo(() => {
		const items = sections.find((s) => s.key === 'fasilitas')?.items ?? [];
		const monitoring = findNavItem(sections, 'monitoring.map');

		return monitoring ? [...items, monitoring] : items;
	}, [sections]);

	const isFasilitasActive = fasilitasItems.some((item) => item.active);
	const isActive = (path) => url.startsWith(path);

	// Tutup panel begitu Inertia berpindah halaman. Jaring pengaman untuk jalur navigasi yang
	// tidak lewat onClick baris menu (mis. redirect dari server setelah aksi).
	useEffect(() => {
		setShowMenu(false);
		setShowFasilitas(false);
	}, [url]);

	return (
		<>
			{/* Padding bawah env(safe-area-inset-bottom): di ponsel berponi/gesture-bar
			    (mayoritas perangkat APK) tanpa ini baris ikon tertimpa indikator sistem. */}
			<div
				className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-card md:hidden"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
					{/* 1. Beranda */}
					<NavItem
						href={route('dashboard')}
						icon={IconHome}
						label="Beranda"
						active={url === '/dashboard' || url === '/'}
					/>

					{/* 2. Fasilitas Publik */}
					<NavButton
						icon={IconFiretruck}
						label="Fasilitas"
						active={isFasilitasActive || showFasilitas}
						ariaLabel="Buka daftar fasilitas publik"
						onClick={() => {
							setShowFasilitas(true);
							setShowMenu(false);
						}}
					/>

					{/* 3. SOS Spotlight */}
					<Link
						href={route('front.reports.create')}
						className={cn(
							'group z-50 flex h-full w-full items-center justify-center outline-none transition-all',
							url.startsWith('/reports/create') ? 'scale-105' : 'hover:scale-105 active:scale-95',
						)}
					>
						<img
							src="/icon.png"
							alt="SOS"
							className={cn(
								'relative z-10 h-11 w-11 rounded-xl object-contain shadow-sm transition-all group-focus-visible:ring-2 group-focus-visible:ring-destructive group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-card',
								url.startsWith('/reports/create') ? 'ring-2 ring-destructive/50' : '',
							)}
						/>
					</Link>

					{/* 4. Riwayat */}
					<NavItem
						href={route('front.reports.index', { filter: 'mine' })}
						icon={IconHistory}
						label="Riwayat"
						active={isActive('/reports') && !isActive('/reports/create')}
					/>

					{/* 5. Menu lengkap — berlaku untuk SEMUA peran, termasuk tamu & warga.
					    Di sinilah Pusat Bantuan, Syarat & Ketentuan, dan Kebijakan Privasi
					    bisa dijangkau dari ponsel (syarat distribusi APK). */}
					<NavButton
						icon={IconMenu2}
						label="Menu"
						active={showMenu}
						ariaLabel="Buka menu"
						onClick={() => {
							setShowMenu(true);
							setShowFasilitas(false);
						}}
					/>
				</div>
			</div>

			{/* Panel fasilitas: pendek dan sekali pilih, jadi tanpa titik henti — tinggi
			    mengikuti isi. */}
			<Drawer open={showFasilitas} onOpenChange={setShowFasilitas} shouldScaleBackground={false}>
				<DrawerContent className="md:hidden">
					<DrawerTitle className="px-5 pb-1 pt-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
						Fasilitas Publik
					</DrawerTitle>
					<div
						className="space-y-0.5 px-3 pt-2"
						style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
					>
						{fasilitasItems.map((item) => (
							<Link
								key={item.key}
								href={item.url}
								className={cn(
									'flex w-full items-center gap-3 rounded-xl px-2 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
									item.active
										? 'bg-destructive text-destructive-foreground'
										: 'text-foreground hover:bg-accent',
								)}
							>
								<span
									className={cn(
										'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
										item.active ? 'bg-destructive-foreground/15' : 'bg-muted text-muted-foreground',
									)}
								>
									<item.icon className="h-5 w-5" />
								</span>
								<span
									className={cn(
										'min-w-0 flex-1 truncate text-sm',
										item.active ? 'font-bold' : 'font-medium',
									)}
								>
									{item.title}
								</span>
							</Link>
						))}
					</div>
				</DrawerContent>
			</Drawer>

			<MobileMenuPanel open={showMenu} onOpenChange={setShowMenu} auth={auth} url={url} />
		</>
	);
}

function NavItem({ href, icon: Icon, label, active }) {
	return (
		<Link
			href={href}
			className={cn(
				'group z-50 flex h-full w-full flex-col items-center justify-center gap-1 outline-none transition-colors',
				active ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
			)}
		>
			<NavItemBody icon={Icon} label={label} active={active} />
		</Link>
	);
}

function NavButton({ icon: Icon, label, active, ariaLabel, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={ariaLabel}
			className={cn(
				'group z-50 flex h-full w-full flex-col items-center justify-center gap-1 outline-none transition-colors',
				active ? 'text-destructive' : 'text-muted-foreground hover:text-destructive',
			)}
		>
			<NavItemBody icon={Icon} label={label} active={active} />
		</button>
	);
}

function NavItemBody({ icon: Icon, label, active }) {
	return (
		<>
			<span
				className={cn(
					'flex items-center justify-center rounded-full px-4 py-1.5 transition-colors group-focus-visible:ring-2 group-focus-visible:ring-destructive',
					active ? 'bg-destructive/10' : 'bg-transparent group-hover:bg-destructive/10',
				)}
			>
				<Icon className="h-7 w-7" stroke={active ? 2 : 1.5} />
			</span>
			<span className="text-[10px] font-semibold tracking-wide">{label}</span>
		</>
	);
}
