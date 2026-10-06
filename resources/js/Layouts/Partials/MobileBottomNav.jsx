import { BrandBoltIconFilled } from '@/Components/BrandBoltIcon';
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from '@/Components/ui/drawer';
import { useNavUrl } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
	IconCheck,
	IconChevronRight,
	IconClock,
	IconClockFilled,
	IconDashboard,
	IconDashboardFilled,
	IconLayoutGrid,
	IconLayoutGridFilled,
	IconMapPin,
	IconMapPinFilled,
} from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { buildNavSections, flattenNavItems, resolveAbilities } from './navItems';

/**
 * Navigasi bawah untuk layar kecil - DITULIS ULANG DARI NOL dengan skill `apple-design`
 * (permintaan user 2026-10-07: "buat dari 0 dan bebas tanpa pengecualian"). Bentuk sebelumnya
 * (bilah minimalis menempel + popover) tersimpan di tag git `pra-bottomnav-apple-design`;
 * "kembalikan bilah bawah" = pulihkan berkas-berkas redesign ini dari tag itu.
 *
 * BENTUK - pola tab bar iOS 26:
 *   - KAPSUL KACA MELAYANG (`material-chrome`) berisi empat tab: Beranda, Fasilitas, Riwayat,
 *     Menu (tamu: Masuk). Konten terus bergulir di belakangnya; di bawah kapsul ada "scroll edge
 *     effect" (gradien ke warna latar) alih-alih garis pemisah keras (§12).
 *   - LENSA AKTIF: satu pil yang BERGESER ke tab yang sedang dibuka dengan kurva pegas
 *     (`ease-spring`). Transisi CSS (bukan @keyframes) sengaja dipakai: ia selalu berangkat dari
 *     nilai yang sedang tampil, jadi mengetuk tab lain di tengah geseran membelokkan lensa tanpa
 *     lompatan (§3). Saat tak ada tab yang cocok, lensa memudar DI TEMPAT terakhirnya - tidak
 *     meluncur dari kiri saat muncul lagi. Reduced motion: hanya cross-fade.
 *   - TOMBOL AKSI "LAPOR" terpisah di kanan kapsul, bulat merah brand dengan petir putih -
 *     seperti tombol aksi yang berdiri di samping tab bar iOS 26. Di aplikasi darurat aksi utama
 *     pantas punya bentuknya sendiri: ia bukan tujuan navigasi melainkan aksi, jadi tak ikut
 *     lensa. Saat halaman lapor sedang dibuka ia diberi cincin (aria-current).
 *   - Penanda tab aktif = lensa + warna brand + ikon PADAT + tebal huruf.
 *   - Umpan balik tekan langsung saat jari menyentuh (`active:scale`), bukan saat dilepas (§1).
 *
 * PANEL - Fasilitas & Menu dibuka sebagai LEMBAR BAWAH (`ui/drawer`, vaul): diseret 1:1,
 * dilempar untuk ditutup, mantul di batas, scrim peredup. Isinya daftar berkelompok gaya iOS
 * Settings - ubin ikon berwarna, chevron, centang untuk halaman yang sedang dibuka. Menu diawali
 * kartu profil (bila item `profile` ada) dan diakhiri baris "Keluar" tersendiri.
 *
 * ISI - TETAP dari `buildNavSections()` (aturan #71, MobileNavParityTest): bilah memegang jangkar
 * lewat KUNCI (BAR_ITEM_KEYS/FASILITAS_ITEM_KEYS), sisa seksi otomatis jatuh ke lembar Menu, dan
 * slot "Masuk" tamu mengambil tujuannya dari item `login`. Tak ada tujuan yang dipaku di sini
 * selain cadangan route tiga jangkar.
 *
 * ANGKA YANG TERIKAT pada tinggi bilah (72px = `h-[72px]` + safe-area; kapsul 56px di tengahnya,
 * jadi puncak kapsul ada di 64px dari dasar + safe-area):
 *   - `AppLayout` ruang konten `pb-[calc(5rem+env(safe-area-inset-bottom))]` (80px, cukup)
 *   - tombol Kirim `Front/Reports/Create.jsx` `bottom-[calc(4rem+env(safe-area-inset-bottom))]` -
 *     tepi bawah bar itu jatuh TEPAT di puncak kapsul, tanpa celah tempat konten mengintip.
 *   Mengubah tinggi kapsul/bilah = hitung ulang keduanya.
 * Bilah disembunyikan selama keyboard layar terbuka (#187).
 */

/** Kunci item yang sudah punya tombolnya sendiri di bilah - dikeluarkan dari lembar Menu. */
const BAR_ITEM_KEYS = ['dashboard', 'report.create', 'reports.mine'];

/** Kunci item lembar Fasilitas, seurutan dengan seksi "Fasilitas Publik" di navItems.js. */
const FASILITAS_ITEM_KEYS = ['hydrants', 'pumps', 'fire_stations', 'volunteers', 'monitoring.map'];

/**
 * Warna ubin ikon (gaya iOS Settings). Fasilitas mengikuti legenda peta - satu warna per jenis;
 * item lain mengikuti seksinya. Kelas ditulis UTUH supaya terpindai Tailwind.
 */
const ITEM_TILE = {
	pumps: 'bg-info text-info-foreground',
	fire_stations: 'bg-destructive text-destructive-foreground',
	hydrants: 'bg-teal text-teal-foreground',
	volunteers: 'bg-volunteer text-volunteer-foreground',
	'monitoring.map': 'bg-teal text-teal-foreground',
};
const SECTION_TILE = {
	utama: 'bg-info text-info-foreground',
	operasional: 'bg-warning text-warning-foreground',
	fasilitas: 'bg-teal text-teal-foreground',
	administrasi: 'bg-success text-success-foreground',
	'kontrol-akses': 'bg-volunteer text-volunteer-foreground',
};
const NEUTRAL_TILE = 'bg-muted-foreground text-background';

/**
 * Permukaan sel daftar. Di atas kaca lembar yang terang, sel putih tak terpisah dari latarnya -
 * iOS memisahkannya dengan latar berkelompok abu-abu (lapis tint di NavSheet) di mode terang dan
 * sel yang sedikit LEBIH TERANG dari latarnya di mode gelap.
 */
const GROUP_SURFACE = 'bg-card dark:bg-white/[0.07]';

export default function MobileBottomNav({ auth }) {
	// URL tujuan selama navigasi berjalan (TASK_70): tab yang diketuk langsung aktif.
	const url = useNavUrl();

	const sections = buildNavSections({ auth, url });
	const allItems = flattenNavItems(sections);
	const itemByKey = (key) => allItems.find((item) => item.key === key) ?? null;

	const fasilitasItems = FASILITAS_ITEM_KEYS.map(itemByKey).filter(Boolean);

	const { isLoggedIn } = resolveAbilities(auth);
	const loginItem = itemByKey('login');
	const showLoginSlot = !isLoggedIn && Boolean(loginItem);
	const profileItem = itemByKey('profile');

	// Sisa seksi = apa pun yang tak dipegang bilah/lembar Fasilitas/kartu profil. Menu baru di
	// navItems.js otomatis mendarat di sini.
	const handledKeys = new Set([...BAR_ITEM_KEYS, ...FASILITAS_ITEM_KEYS, 'profile']);
	const menuSections = sections
		.map((section) => ({ ...section, items: section.items.filter((item) => !handledKeys.has(item.key)) }))
		.filter((section) => section.items.length > 0);

	// Satu lembar terbuka pada satu waktu: null | 'fasilitas' | 'menu'.
	const [sheet, setSheet] = useState(null);
	const closeSheet = () => setSheet(null);

	const isReportActive = url.startsWith('/reports/create');
	const tabs = [
		{
			key: 'dashboard',
			label: 'Beranda',
			href: itemByKey('dashboard')?.url ?? route('dashboard'),
			icon: IconDashboard,
			iconActive: IconDashboardFilled,
			active: url === '/dashboard' || url === '/',
		},
		{
			key: 'fasilitas',
			label: 'Fasilitas',
			icon: IconMapPin,
			iconActive: IconMapPinFilled,
			active: fasilitasItems.some((item) => item.active),
			sheet: 'fasilitas',
		},
		{
			key: 'riwayat',
			label: 'Riwayat',
			href: itemByKey('reports.mine')?.url ?? route('front.reports.index', { filter: 'mine' }),
			icon: IconClock,
			iconActive: IconClockFilled,
			active: url.startsWith('/reports') && !isReportActive,
		},
		showLoginSlot
			? {
					key: 'login',
					label: 'Masuk',
					ariaLabel: loginItem.title,
					href: loginItem.url,
					icon: loginItem.icon,
					active: url.startsWith('/login'),
				}
			: {
					key: 'menu',
					label: 'Menu',
					icon: IconLayoutGrid,
					iconActive: IconLayoutGridFilled,
					active:
						Boolean(profileItem?.active) ||
						menuSections.some((section) => section.items.some((item) => item.active)),
					sheet: 'menu',
				},
	];

	const activeIndex = tabs.findIndex((tab) => tab.active);
	// Posisi terakhir lensa: saat tak ada tab aktif ia memudar di sini, bukan kembali ke kiri.
	const lensIndexRef = useRef(Math.max(activeIndex, 0));
	if (activeIndex >= 0) lensIndexRef.current = activeIndex;

	return (
		<>
			{/* Pembungkus tak menangkap sentuhan (pointer-events-none) - hanya kapsul & tombol
			    Lapor yang bisa diketuk; konten di sela-selanya tetap bisa disentuh. */}
			<nav
				aria-label="Navigasi utama"
				className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden [html[data-keyboard=open]_&]:hidden"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				{/* Scroll edge effect: konten melebur ke latar di bawah kapsul, bukan garis keras. */}
				<div
					aria-hidden="true"
					className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
				/>

				<div className="relative mx-auto flex h-[72px] max-w-md items-center gap-3 px-4">
					<div className="material-chrome pointer-events-auto relative grid h-14 flex-1 grid-cols-4 rounded-full border border-white/60 p-1 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.35)] dark:border-white/10">
						{/* Lensa aktif - lebar satu sel; translateX dalam persen lebarnya sendiri. */}
						<span
							aria-hidden="true"
							className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/4)] rounded-full bg-foreground/[0.07] transition-[transform,opacity] duration-500 ease-spring motion-reduce:transition-opacity dark:bg-white/[0.12]"
							style={{
								transform: `translateX(${lensIndexRef.current * 100}%)`,
								opacity: activeIndex >= 0 ? 1 : 0,
							}}
						/>
						{tabs.map((tab) => (
							<Tab key={tab.key} tab={tab} open={sheet === tab.sheet} onOpenSheet={setSheet} />
						))}
					</div>

					<Link
						href={itemByKey('report.create')?.url ?? route('front.reports.create')}
						aria-label="Lapor Darurat"
						aria-current={isReportActive ? 'page' : undefined}
						className={cn(
							'pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-[0_10px_24px_-8px_hsl(var(--destructive)/0.65)] outline-none transition-transform duration-100 ease-out active:scale-[0.9] focus-visible:ring-4 focus-visible:ring-destructive/40 motion-reduce:active:scale-100',
							isReportActive && 'ring-4 ring-destructive/25',
						)}
					>
						<BrandBoltIconFilled className="h-7 w-7" stroke={1.5} />
					</Link>
				</div>
			</nav>

			<Drawer open={sheet === 'fasilitas'} onOpenChange={(open) => !open && closeSheet()}>
				<NavSheet title="Fasilitas Publik" description="Lokasi fasilitas pemadam & relawan">
					<RowGroup>
						{fasilitasItems.map((item) => (
							<SheetRow key={item.key} item={item} tile={ITEM_TILE[item.key]} onNavigate={closeSheet} />
						))}
					</RowGroup>
				</NavSheet>
			</Drawer>

			{!showLoginSlot && (
				<Drawer open={sheet === 'menu'} onOpenChange={(open) => !open && closeSheet()}>
					<NavSheet title="Menu" description="Semua menu Sisupit">
						{profileItem && <ProfileCard auth={auth} item={profileItem} onNavigate={closeSheet} />}
						{menuSections.map((section) => {
							const rows = section.items.filter((item) => item.variant !== 'danger' || section.key !== 'akun');
							const dangerRows = section.items.filter((item) => item.variant === 'danger' && section.key === 'akun');
							return (
								<div key={section.key}>
									{rows.length > 0 && (
										<>
											<h3 className="px-4 pb-1.5 pt-5 text-[13px] font-normal text-muted-foreground">
												{section.title}
											</h3>
											<RowGroup>
												{rows.map((item) => (
													<SheetRow
														key={item.key}
														item={item}
														tile={ITEM_TILE[item.key] ?? SECTION_TILE[section.key] ?? NEUTRAL_TILE}
														onNavigate={closeSheet}
													/>
												))}
											</RowGroup>
										</>
									)}
									{dangerRows.map((item) => (
										<DangerRow key={item.key} item={item} onNavigate={closeSheet} />
									))}
								</div>
							);
						})}
					</NavSheet>
				</Drawer>
			)}
		</>
	);
}

/** Satu tab di kapsul: tautan, atau pembuka lembar bila `tab.sheet` ada. */
function Tab({ tab, open, onOpenSheet }) {
	const Glyph = tab.active && tab.iconActive ? tab.iconActive : tab.icon;
	const className = cn(
		'relative z-10 flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-[color,transform] duration-100 ease-out active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-destructive motion-reduce:active:scale-100',
		tab.active ? 'text-destructive' : open ? 'text-foreground' : 'text-muted-foreground',
	);
	const content = (
		<>
			<Glyph className="h-6 w-6" stroke={1.75} />
			<span
				className={cn(
					'max-w-full truncate text-[10px] leading-3 tracking-[0.01em]',
					tab.active ? 'font-semibold' : 'font-medium',
				)}
			>
				{tab.label}
			</span>
		</>
	);

	if (tab.sheet) {
		return (
			<button
				type="button"
				onClick={() => onOpenSheet(tab.sheet)}
				aria-haspopup="dialog"
				aria-expanded={open}
				className={className}
			>
				{content}
			</button>
		);
	}

	return (
		<Link
			href={tab.href}
			aria-label={tab.ariaLabel}
			aria-current={tab.active ? 'page' : undefined}
			className={className}
		>
			{content}
		</Link>
	);
}

/** Isi lembar: judul besar gaya iOS + daftar bergulir. */
function NavSheet({ title, description, children }) {
	return (
		<DrawerContent>
			{/* Latar berkelompok (light): lapis tint DI BAWAH isi (-z-10 dalam konteks tumpukan
			    lembar), bukan `bg-*` di elemen kacanya - itu akan membuat materialnya padat. */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 -z-10 rounded-t-[28px] bg-muted/70 dark:bg-transparent"
			/>
			<div className="px-5 pb-2 pt-3">
				<DrawerTitle className="text-[22px] font-bold leading-7 tracking-[-0.01em]">{title}</DrawerTitle>
				<DrawerDescription className="sr-only">{description}</DrawerDescription>
			</div>
			<div className="no-scrollbar overflow-y-auto overscroll-contain px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
				{children}
			</div>
		</DrawerContent>
	);
}

/** Kelompok baris (inset grouped list). Permukaan padat di atas kaca - kaca tak ditumpuk kaca. */
function RowGroup({ children }) {
	return <div className={cn('overflow-hidden rounded-2xl', GROUP_SURFACE)}>{children}</div>;
}

/**
 * Satu baris lembar. Menerima item apa adanya dari navItems.js - termasuk `linkProps`
 * (logout = POST + token FCM ikut dilepas). Target sentuh 48px.
 */
function SheetRow({ item, tile, onNavigate }) {
	const Icon = item.icon;
	const linkProps = item.linkProps ?? {};
	const isDanger = item.variant === 'danger';

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			aria-current={item.active ? 'page' : undefined}
			{...linkProps}
			className="flex w-full items-center gap-3 pl-3.5 text-left outline-none transition-colors duration-100 active:bg-foreground/[0.06] focus-visible:bg-accent [&:last-child>span:last-child]:border-b-0"
		>
			<span
				className={cn(
					'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[8px]',
					isDanger ? 'bg-destructive text-destructive-foreground' : tile,
				)}
			>
				<Icon size={18} stroke={1.75} />
			</span>
			<span className="flex min-h-[48px] min-w-0 flex-1 items-center gap-2 border-b border-border/70 pr-3.5">
				<span
					className={cn(
						'flex-1 truncate text-[15px]',
						item.active ? 'font-semibold text-destructive' : isDanger ? 'text-destructive' : 'text-foreground',
					)}
				>
					{item.title}
				</span>
				{item.active ? (
					<IconCheck size={18} stroke={2.25} className="shrink-0 text-destructive" />
				) : (
					<IconChevronRight size={16} stroke={2} className="shrink-0 text-muted-foreground/60" />
				)}
			</span>
		</Link>
	);
}

/** Aksi merusak akun (Keluar) - kelompok sendiri, teks merah di tengah, seperti iOS "Sign Out". */
function DangerRow({ item, onNavigate }) {
	return (
		<div className={cn('mt-6 overflow-hidden rounded-2xl', GROUP_SURFACE)}>
			<Link
				href={item.url}
				onClick={onNavigate}
				{...(item.linkProps ?? {})}
				className="flex min-h-[48px] w-full items-center justify-center text-[15px] font-medium text-destructive outline-none transition-colors duration-100 active:bg-destructive/10 focus-visible:bg-destructive/10"
			>
				{item.title}
			</Link>
		</div>
	);
}

/** Kartu profil di puncak lembar Menu (gaya kartu akun iOS Settings). */
function ProfileCard({ auth, item, onNavigate }) {
	const name = auth?.name || auth?.user?.name || item.title;
	const email = auth?.email || auth?.user?.email;
	const initials = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			aria-current={item.active ? 'page' : undefined}
			className={cn(
				'mt-1 flex items-center gap-3 rounded-2xl p-3.5 outline-none transition-colors duration-100 active:bg-foreground/[0.06] focus-visible:ring-2 focus-visible:ring-destructive',
				GROUP_SURFACE,
			)}
		>
			<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-base font-semibold text-destructive">
				{initials}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[17px] font-semibold leading-6 tracking-[-0.01em]">{name}</span>
				<span className="block truncate text-[13px] text-muted-foreground">{email || item.title}</span>
			</span>
			<IconChevronRight size={16} stroke={2} className="shrink-0 text-muted-foreground/60" />
		</Link>
	);
}
