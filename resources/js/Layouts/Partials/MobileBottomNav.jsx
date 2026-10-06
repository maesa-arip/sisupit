import BrandBoltIcon, { BrandBoltIconFilled } from '@/Components/BrandBoltIcon';
import { useNavUrl } from '@/lib/navigation';
import PullToRefreshLock from '@/lib/pull-to-refresh-lock';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import {
	IconClock,
	IconClockFilled,
	IconDashboard,
	IconDashboardFilled,
	IconLayoutGrid,
	IconLayoutGridFilled,
	IconMapPin,
	IconMapPinFilled,
} from '@tabler/icons-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { buildNavSections, flattenNavItems, resolveAbilities } from './navItems';

/**
 * Navigasi bawah untuk layar kecil - DITULIS ULANG DARI NOL dengan skill `apple-design`
 * (permintaan user 2026-10-07: "buat dari 0 dan bebas tanpa pengecualian", FINDINGS #189).
 * Bentuk sebelumnya (bilah minimalis menempel + popover) tersimpan di tag git
 * `pra-bottomnav-apple-design`; "kembalikan bilah bawah" = pulihkan berkas ini dari tag itu.
 *
 * BENTUK - pola tab bar iOS 26:
 *   - KAPSUL KACA MELAYANG (`material-chrome`) berisi lima slot: Beranda, Fasilitas, LAPOR,
 *     Riwayat, Menu (tamu: Masuk). Konten terus bergulir di belakangnya; di bawah kapsul ada
 *     "scroll edge effect" (gradien ke warna latar) alih-alih garis pemisah keras (§12).
 *   - LENSA AKTIF: satu pil yang BERGESER ke tab yang sedang dibuka dengan kurva pegas
 *     (`ease-spring`). Transisi CSS (bukan @keyframes) sengaja dipakai: ia selalu berangkat dari
 *     nilai yang sedang tampil, jadi mengetuk tab lain di tengah geseran membelokkan lensa tanpa
 *     lompatan (§3). Saat tak ada tab berlensa yang aktif (mis. halaman lapor), lensa memudar DI
 *     TEMPAT terakhirnya. Reduced motion: hanya cross-fade.
 *   - LAPOR DI TENGAH (koreksi user 2026-10-07: "jangan taruh dikanan, taruh ditengah, jika tidak
 *     aktif dia abu, jika aktif baru merah"): lingkaran ABU dengan petir garis saat diam, lingkaran
 *     MERAH dengan petir padat putih hanya saat halaman lapor dibuka. Ia menonjol lewat BENTUK
 *     (lingkaran), warnanya tetap mengikuti aturan "merah = lokasi" seperti empat tetangganya.
 *   - Penanda tab aktif = lensa + warna brand + ikon PADAT + tebal huruf.
 *   - Umpan balik tekan langsung saat jari menyentuh (`active:scale`), bukan saat dilepas (§1).
 *
 * PANEL - Fasilitas & Menu = PANEL KACA MELAYANG gaya menu iOS 26 (koreksi user 2026-10-07: lembar
 * bawah bergaya Settings dengan ubin warna & chevron dinilai "sangat jadul"). Panel TUMBUH DARI TAB
 * PEMICUNYA (`transform-origin` = posisi tab itu, §7) dengan skala + pudar berkurva pegas, dan
 * menyusut kembali ke tab yang sama saat ditutup - jalur masuk & keluar simetris. Ia selalu
 * terpasang dan hanya berganti keadaan, sehingga membuka/menutup di tengah gerak membelokkan
 * transisinya, bukan memulai ulang (§3). Saat tertutup ia `inert` + `pointer-events-none`.
 * Scrim tipis peredup; ketuk di luar / Esc / pindah halaman menutupnya.
 *   - Fasilitas: kisi tombol bulat ala Control Center - glyph berwarna jenis fasilitas (legenda
 *     peta), lingkaran terisi warna itu bila halamannya sedang dibuka.
 *   - Menu: profil di puncak, lalu daftar ringkas berikon MONOKROM (tanpa ubin, tanpa chevron) dan
 *     "Keluar" merah di dasar - gaya menu konteks iOS 26.
 *
 * ISI - TETAP dari `buildNavSections()` (aturan #71, MobileNavParityTest): bilah memegang jangkar
 * lewat KUNCI (BAR_ITEM_KEYS/FASILITAS_ITEM_KEYS), sisa seksi otomatis jatuh ke panel Menu, dan
 * slot "Masuk" tamu mengambil tujuannya dari item `login`. Tak ada tujuan yang dipaku di sini
 * selain cadangan route tiga jangkar.
 *
 * ANGKA YANG TERIKAT pada tinggi bilah (72px = `h-[72px]` + safe-area; kapsul 56px di tengahnya,
 * jadi puncak kapsul ada di 64px dari dasar + safe-area):
 *   - `AppLayout` ruang konten `pb-[calc(5rem+env(safe-area-inset-bottom))]` (80px, cukup)
 *   - tombol Kirim `Front/Reports/Create.jsx` `bottom-[calc(4rem+env(safe-area-inset-bottom))]` -
 *     tepi bawah bar itu jatuh TEPAT di puncak kapsul, tanpa celah tempat konten mengintip.
 *   - panel kaca di berkas ini `bottom-[calc(4.5rem+env(safe-area-inset-bottom))]` (8px di atas kapsul).
 *   Mengubah tinggi kapsul/bilah = hitung ulang ketiganya.
 * Bilah disembunyikan selama keyboard layar terbuka (#187).
 */

/** Kunci item yang sudah punya tombolnya sendiri di bilah - dikeluarkan dari panel Menu. */
const BAR_ITEM_KEYS = ['dashboard', 'report.create', 'reports.mine'];

/** Kunci item panel Fasilitas, seurutan dengan seksi "Fasilitas Publik" di navItems.js. */
const FASILITAS_ITEM_KEYS = ['hydrants', 'pumps', 'fire_stations', 'volunteers', 'monitoring.map'];

/**
 * Warna jenis fasilitas (gema legenda peta): `glyph` saat diam, `fill` saat halamannya dibuka.
 * Kelas ditulis UTUH supaya terpindai Tailwind; kunci tak terdaftar jatuh ke netral.
 */
const FASILITAS_TONE = {
	hydrants: { glyph: 'text-teal', fill: 'bg-teal text-teal-foreground' },
	pumps: { glyph: 'text-info', fill: 'bg-info text-info-foreground' },
	fire_stations: { glyph: 'text-destructive', fill: 'bg-destructive text-destructive-foreground' },
	volunteers: { glyph: 'text-volunteer', fill: 'bg-volunteer text-volunteer-foreground' },
	'monitoring.map': { glyph: 'text-teal', fill: 'bg-teal text-teal-foreground' },
};

const SLOT_COUNT = 5;

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

	// Sisa seksi = apa pun yang tak dipegang bilah/panel Fasilitas/baris profil. Menu baru di
	// navItems.js otomatis mendarat di sini.
	const handledKeys = new Set([...BAR_ITEM_KEYS, ...FASILITAS_ITEM_KEYS, 'profile']);
	const menuSections = sections
		.map((section) => ({ ...section, items: section.items.filter((item) => !handledKeys.has(item.key)) }))
		.filter((section) => section.items.length > 0);
	const menuRows = menuSections.map((section) => ({
		...section,
		items: section.items.filter((item) => item.variant !== 'danger'),
	}));
	const dangerItems = menuSections.flatMap((section) => section.items.filter((item) => item.variant === 'danger'));

	// Satu panel terbuka pada satu waktu: null | 'fasilitas' | 'menu'.
	const [panel, setPanel] = useState(null);
	const closePanel = () => setPanel(null);

	// Pindah halaman (termasuk tombol kembali) menutup panel.
	useEffect(() => setPanel(null), [url]);

	useEffect(() => {
		if (!panel) return undefined;
		const onKey = (event) => event.key === 'Escape' && setPanel(null);
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [panel]);

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
			panel: 'fasilitas',
		},
		{
			key: 'lapor',
			label: 'Lapor',
			ariaLabel: 'Lapor Darurat',
			href: itemByKey('report.create')?.url ?? route('front.reports.create'),
			icon: BrandBoltIcon,
			iconActive: BrandBoltIconFilled,
			active: isReportActive,
			action: true,
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
					panel: 'menu',
				},
	];

	// Lensa hanya untuk tab biasa - slot Lapor menandai dirinya sendiri lewat lingkarannya.
	const activeIndex = tabs.findIndex((tab) => tab.active && !tab.action);
	// Posisi terakhir lensa: saat tak ada tab aktif ia memudar di sini, bukan kembali ke kiri.
	const lensIndexRef = useRef(Math.max(activeIndex, 0));
	if (activeIndex >= 0) lensIndexRef.current = activeIndex;

	// Panel tumbuh dari tab pemicunya: titik asal = pusat mendatar tab itu, tepi bawah panel.
	const originFor = (key) => `${((tabs.findIndex((tab) => tab.key === key) + 0.5) / SLOT_COUNT) * 100}% 100%`;

	return (
		<>
			{/* Scrim tipis: tugas di panel bersifat sesaat, latar cukup diredupkan sedikit. Kapsul
			    (z-50) tetap di atasnya, jadi tab lain tetap bisa langsung diketuk. */}
			<div
				aria-hidden="true"
				onClick={closePanel}
				className={cn(
					'fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ease-out md:hidden dark:bg-black/45',
					panel ? 'opacity-100' : 'pointer-events-none opacity-0',
				)}
			/>

			<GlassPanel
				open={panel === 'fasilitas'}
				origin={originFor('fasilitas')}
				label="Fasilitas Publik"
			>
				<p className="px-2 pb-3 pt-1 text-[13px] font-semibold text-muted-foreground">Fasilitas Publik</p>
				<div className="grid grid-cols-3 gap-x-2 gap-y-4 pb-1">
					{fasilitasItems.map((item) => (
						<FasilitasButton key={item.key} item={item} tone={FASILITAS_TONE[item.key]} onNavigate={closePanel} />
					))}
				</div>
			</GlassPanel>

			{!showLoginSlot && (
				<GlassPanel open={panel === 'menu'} origin={originFor('menu')} label="Menu">
					{profileItem && <ProfileRow auth={auth} item={profileItem} onNavigate={closePanel} />}
					{menuRows.map((section) =>
						section.items.length === 0 ? null : (
							<Fragment key={section.key}>
								<div aria-hidden="true" className="mx-2 my-1.5 h-px bg-foreground/[0.08]" />
								<p className="px-3 pb-0.5 pt-1.5 text-[12px] font-semibold text-muted-foreground">
									{section.title}
								</p>
								{section.items.map((item) => (
									<MenuRow key={item.key} item={item} onNavigate={closePanel} />
								))}
							</Fragment>
						),
					)}
					{dangerItems.length > 0 && (
						<>
							<div aria-hidden="true" className="mx-2 my-1.5 h-px bg-foreground/[0.08]" />
							{dangerItems.map((item) => (
								<MenuRow key={item.key} item={item} onNavigate={closePanel} />
							))}
						</>
					)}
				</GlassPanel>
			)}

			{/* Pembungkus tak menangkap sentuhan (pointer-events-none) - hanya kapsul yang bisa
			    diketuk; konten di sela-selanya tetap bisa disentuh. */}
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

				<div className="relative mx-auto flex h-[72px] max-w-md items-center px-4">
					<div className="material-chrome pointer-events-auto relative grid h-14 flex-1 grid-cols-5 rounded-full border border-white/60 p-1 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.35)] dark:border-white/10">
						{/* Lensa aktif - lebar satu sel; translateX dalam persen lebarnya sendiri. */}
						<span
							aria-hidden="true"
							className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/5)] rounded-full bg-foreground/[0.07] transition-[transform,opacity] duration-500 ease-spring motion-reduce:transition-opacity dark:bg-white/[0.12]"
							style={{
								transform: `translateX(${lensIndexRef.current * 100}%)`,
								opacity: activeIndex >= 0 ? 1 : 0,
							}}
						/>
						{tabs.map((tab) => (
							<Tab
								key={tab.key}
								tab={tab}
								open={Boolean(tab.panel) && panel === tab.panel}
								onTogglePanel={(name) => setPanel((current) => (current === name ? null : name))}
							/>
						))}
					</div>
				</div>
			</nav>
		</>
	);
}

/** Satu slot di kapsul: tautan, pembuka panel (`tab.panel`), atau aksi bulat Lapor (`tab.action`). */
function Tab({ tab, open, onTogglePanel }) {
	const Glyph = tab.active && tab.iconActive ? tab.iconActive : tab.icon;
	const className = cn(
		'relative z-10 flex h-full w-full flex-col items-center justify-center gap-0.5 rounded-full outline-none transition-[color,transform] duration-100 ease-out active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-destructive motion-reduce:active:scale-100',
		tab.active ? 'text-destructive' : open ? 'text-foreground' : 'text-muted-foreground',
	);

	if (tab.action) {
		// Abu saat diam, merah HANYA saat halaman lapor dibuka (koreksi user 2026-10-07).
		return (
			<Link
				href={tab.href}
				aria-label={tab.ariaLabel}
				aria-current={tab.active ? 'page' : undefined}
				className={className}
			>
				<span
					className={cn(
						'flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-300 ease-out',
						tab.active
							? 'bg-destructive text-destructive-foreground shadow-[0_6px_16px_-6px_hsl(var(--destructive)/0.7)]'
							: 'bg-foreground/[0.08] text-muted-foreground dark:bg-white/[0.12]',
					)}
				>
					<Glyph className="h-6 w-6" stroke={1.75} />
				</span>
			</Link>
		);
	}

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

	if (tab.panel) {
		return (
			<button
				type="button"
				onClick={() => onTogglePanel(tab.panel)}
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

/**
 * Panel kaca melayang di atas kapsul. Selalu terpasang; keadaan terbuka/tertutup hanya
 * mengganti kelas, jadi transisi pegasnya bisa dibelokkan di tengah jalan. Tepi atas terang +
 * bayangan dalam = cahaya yang tertangkap tepi kaca. JANGAN beri `bg-*` di elemen material ini.
 * PullToRefreshLock hanya terpasang selama terbuka: daftar Menu bergulir, dan tanpa kunci itu
 * menggulir ke atas memuat ulang halaman di APK.
 */
function GlassPanel({ open, origin, label, children }) {
	return (
		<div
			role="dialog"
			aria-label={label}
			aria-hidden={!open}
			inert={open ? undefined : ''}
			style={{ transformOrigin: origin }}
			className={cn(
				'material-thick no-scrollbar fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-h-[68dvh] max-w-[26rem] overflow-y-auto overscroll-contain rounded-[30px] border border-white/60 p-2.5 text-popover-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_24px_60px_-18px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-500 ease-spring motion-reduce:transition-opacity md:hidden dark:border-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_24px_60px_-18px_rgba(0,0,0,0.7)]',
				open ? 'scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-[0.55] opacity-0 motion-reduce:translate-y-0 motion-reduce:scale-100',
			)}
		>
			{open && <PullToRefreshLock />}
			{children}
		</div>
	);
}

/** Tombol bulat ala Control Center: glyph berwarna jenis fasilitas, terisi bila halamannya dibuka. */
function FasilitasButton({ item, tone, onNavigate }) {
	const Icon = item.icon;

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			aria-current={item.active ? 'page' : undefined}
			className="group flex flex-col items-center gap-1.5 rounded-2xl px-1 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-destructive"
		>
			<span
				className={cn(
					'flex h-14 w-14 items-center justify-center rounded-full transition-transform duration-100 ease-out group-active:scale-[0.9] motion-reduce:group-active:scale-100',
					item.active
						? (tone?.fill ?? 'bg-destructive text-destructive-foreground')
						: cn('bg-foreground/[0.06] dark:bg-white/[0.1]', tone?.glyph ?? 'text-foreground'),
				)}
			>
				<Icon size={26} stroke={1.75} />
			</span>
			<span
				className={cn(
					'line-clamp-2 text-center text-[12px] leading-4',
					item.active ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
				)}
			>
				{item.title}
			</span>
		</Link>
	);
}

/**
 * Satu baris menu gaya menu konteks iOS 26: ikon monokrom, tanpa ubin & chevron. Menerima item
 * apa adanya dari navItems.js - termasuk `linkProps` (logout = POST + token FCM ikut dilepas).
 * Halaman aktif = pil tint merah; aksi `danger` (Keluar) = teks & ikon merah.
 */
function MenuRow({ item, onNavigate }) {
	const Icon = item.icon;
	const isDanger = item.variant === 'danger';

	return (
		<Link
			href={item.url}
			onClick={onNavigate}
			aria-current={item.active ? 'page' : undefined}
			{...(item.linkProps ?? {})}
			className={cn(
				'flex min-h-[46px] w-full items-center gap-3 rounded-2xl px-3 text-left text-[16px] outline-none transition-colors duration-100 focus-visible:bg-foreground/[0.06]',
				item.active
					? 'bg-destructive/10 font-semibold text-destructive'
					: isDanger
						? 'text-destructive active:bg-destructive/10'
						: 'text-foreground active:bg-foreground/[0.06]',
			)}
		>
			<Icon size={21} stroke={1.75} className={cn('shrink-0', !item.active && !isDanger && 'text-foreground/70')} />
			<span className="truncate">{item.title}</span>
		</Link>
	);
}

/** Baris profil di puncak panel Menu: avatar inisial + nama + email. */
function ProfileRow({ auth, item, onNavigate }) {
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
				'flex items-center gap-3 rounded-[22px] p-2 outline-none transition-colors duration-100 active:bg-foreground/[0.06] focus-visible:bg-foreground/[0.06]',
				item.active && 'bg-destructive/10',
			)}
		>
			<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-destructive/80 to-destructive text-[15px] font-semibold text-destructive-foreground">
				{initials}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[16px] font-semibold leading-5 tracking-[-0.01em]">{name}</span>
				<span className="block truncate text-[13px] leading-5 text-muted-foreground">
					{email || item.title}
				</span>
			</span>
		</Link>
	);
}
