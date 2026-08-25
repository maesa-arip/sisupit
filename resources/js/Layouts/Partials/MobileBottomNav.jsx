import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { IconDashboard, IconHistory, IconMapPin, IconMenu2 } from '@tabler/icons-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { buildNavSections, flattenNavItems, resolveAbilities } from './navItems';

/**
 * Navigasi bawah untuk layar kecil.
 *
 * BENTUK (keputusan user 2026-08-13, membalikkan TASK_20/21): dua popover melayang buatan
 * tangan tepat di atas tombol pemicunya — bukan Sheet dari kanan maupun drawer-dari-bawah.
 * Jangan hidupkan lagi pola drawer tanpa menanyakan user.
 *
 * ISI (keputusan user 2026-08-19, TASK_31): daftar menunya TIDAK lagi ditulis di sini.
 * Kedua popover dibangun dari `buildNavSections()` — sumber yang sama dengan sidebar
 * desktop. Pengecualian "dua daftar" yang berlaku sejak 2026-08-13 dengan demikian
 * DICABUT: sembilan menu desktop (Manajemen SKKL, Pos Pemadam, OPD Terkait,
 * Instansi/Kabupaten, empat tautan Bantuan & Legal, dan Daftar Baru) sempat hilang tanpa
 * gejala di ponsel karena aturan "tulis dua kali" itu — lihat FINDINGS_LOG #71.
 *
 * Pembagiannya: bilah memegang empat jangkar tetap (Beranda, Fasilitas, SOS, Riwayat),
 * dan slot ke-5 "Menu" memuat SEMUA seksi yang belum terwakili di bilah. Karena
 * pembagian itu memakai daftar KUNCI (bukan daftar menu), item baru di navItems.js
 * otomatis mendarat di popover "Menu" tanpa perubahan apa pun di berkas ini.
 *
 * Slot ke-5 tampil untuk SEMUA PERAN yang sudah login (dulu popover admin saja, peran lain
 * hanya dapat tautan Profil) — itulah yang membuat Pusat Bantuan/S&K/Privasi dan tombol
 * Keluar akhirnya terjangkau pengguna ponsel non-admin (temuan #53).
 *
 * TAMU (keputusan user 2026-08-25): slot ke-5 BUKAN popover "Menu" melainkan tombol
 * **Masuk**. Alasannya, isi menu bagi tamu nyaris seluruhnya bukan tujuan yang ia cari
 * (empat tautan legal + dua tautan akun), sementara satu-satunya hal yang ingin ia lakukan
 * — masuk — terkubur satu ketukan di dalam panel. Harga yang DISETUJUI user: bagi tamu,
 * Bantuan/S&K/Privasi/Tentang hanya lewat footer AppLayout dan "Daftar Baru" hanya lewat
 * tautan di halaman login. Keduanya sudah ada dan sudah dipakai, jadi tak ada tujuan yang
 * benar-benar buntu — tapi ingat #71 sebelum memindahkan salah satunya: begitu footer atau
 * tautan daftar itu hilang, menu-menu tadi ikut hilang dari ponsel tanpa gejala apa pun.
 *
 * Tujuan tombolnya TIDAK dipaku di sini: ia diambil dari item `login` milik navItems.js,
 * sumber yang sama dengan sidebar (aturan #71). Kalau item itu suatu saat tak ada, slotnya
 * jatuh kembali ke popover "Menu" — bukan menjadi tombol mati.
 *
 * RUPA (FINDINGS #72): bilah ini dulu memakai bahasa visualnya sendiri — ikon 28px
 * (sistem: 16–20px), pil `rounded-full` (satu-satunya di aplikasi), dan ketebalan garis
 * yang berubah saat aktif sehingga ikon seolah bergetar tiap pindah halaman. Sekarang
 * ikon 20px, `stroke` tetap 1.75, label 12px.
 *
 * DUA KEADAAN YANG TIDAK BOLEH TERTUKAR (koreksi user 2026-08-19 — "seolah ada 2 yang
 * sedang aktif"): sebelumnya tombol pembuka popover ikut memerah saat panelnya dibuka,
 * warna yang sama dengan penanda halaman aktif, jadi dua slot tampak aktif bersamaan.
 * Aturannya sekarang:
 *   - **Halaman aktif** (di mana saya berada) = kotak `rounded-xl bg-destructive` berikon
 *     putih, dialek <NavLink/> yang sama dengan sidebar. Hanya satu slot boleh punya ini.
 *     (Percobaan "garis tipis" 2026-08-19 ditolak user; jangan dihidupkan lagi.)
 *     BERLAKU UNTUK SLOT BILAH SAJA — di DALAM popover, baris aktif memakai tint 10%
 *     seperti production, bukan blok solid (keputusan user 2026-08-20, lihat
 *     <FloatingLink/> & prompt/docs/PENGECUALIAN_ATURAN.md).
 *   - **Panel terbuka** (keadaan sesaat tombol) = latar netral `bg-accent` pada kotak
 *     ikonnya + `aria-expanded`. TIDAK memakai merah sama sekali.
 * Karena merah kini berarti "lokasi", hover pun netral (`hover:text-foreground`), bukan
 * merah seperti dulu. Satu-satunya pengecualian: slot "Lapor" merah permanen karena ia
 * aksi darurat, bukan sekadar tujuan.
 *
 * Empat slot memakai glyph monokrom yang mewarisi warna kotaknya. Slot "Lapor" memakai
 * ikon brand `/icon.png` (keputusan user 2026-08-19) — dan karena berkas itu sudah berupa
 * petir putih DI DALAM kotak merah, ia MENGGANTIKAN kotak ikon, tidak ditaruh di dalamnya.
 * Aturan turunannya: jangan pernah memberi slot itu latar merah lagi (dua nuansa merah &
 * dua sudut membulat akan bertumpuk) — penanda aktifnya cincin, bukan bidang.
 *
 * Dua hal dari TASK_20/21 sengaja DIPERTAHANKAN karena bukan bagian dari panel menu dan
 * mencabutnya akan merusak tata letak lain:
 *   - `md:hidden` (bukan `lg:hidden` seperti versi lama) — AppLayout memasang rail ikon
 *     mulai md; dengan lg:hidden tablet akan memunculkan dua navigasi sekaligus dan
 *     menimpa konten yang sudah ber-`md:pb-0`.
 *   - padding `env(safe-area-inset-bottom)` — di ponsel berponi/gesture-bar (mayoritas
 *     perangkat APK) tanpa ini baris ikon tertimpa indikator sistem.
 */

/** Kunci item yang sudah punya tombolnya sendiri di bilah — dikeluarkan dari popover "Menu". */
const BAR_ITEM_KEYS = ['dashboard', 'report.create', 'reports.mine'];

/**
 * Kunci item yang masuk popover "Fasilitas", berikut urutannya di panel. Tiga fasilitas
 * pertama HARUS seurutan dengan seksi "Fasilitas Publik" di navItems.js (yang pada
 * gilirannya mengikuti urutan fasilitas di seksi Administrasi) — kalau berbeda, satu jenis
 * fasilitas menempati posisi berlainan di ponsel dan desktop. Peta Pemantauan sengaja
 * ditaruh terakhir meski di navItems.js ia ada di seksi "Menu Utama".
 */
const FASILITAS_ITEM_KEYS = ['hydrants', 'pumps', 'fire_stations', 'volunteers', 'monitoring.map'];

/**
 * Warna per item panel Fasilitas — gemanya legenda peta, jadi satu warna per jenis
 * fasilitas. `icon` dipakai saat baris TIDAK aktif, `active` saat baris itu halaman yang
 * sedang dibuka (tint 10% + teks sewarna, bentuk yang dipakai production; lihat catatan
 * di <FloatingLink/>). Kunci yang tak terdaftar — termasuk semua isi popover "Menu" dan
 * menu baru mana pun — jatuh ke netral/`MENU_ACTIVE_TONE`, jadi tak ada yang rusak.
 *
 * Kelasnya sengaja ditulis UTUH, bukan dirakit dari nama warna: Tailwind memindai teks
 * sumber, kelas hasil template string tak akan pernah ikut ter-generate.
 */
const FASILITAS_ITEM_TONE = {
	pumps: { icon: 'text-info', active: 'bg-info/10 text-info' },
	fire_stations: { icon: 'text-destructive', active: 'bg-destructive/10 text-destructive' },
	hydrants: { icon: 'text-teal', active: 'bg-teal/10 text-teal' },
	volunteers: { icon: 'text-volunteer', active: 'bg-volunteer/10 text-volunteer' },
	'monitoring.map': { icon: 'text-teal', active: 'bg-teal/10 text-teal' },
};

/** Tint baris aktif untuk item tanpa warna jenis (popover "Menu") — sama dengan production. */
const MENU_ACTIVE_TONE = 'bg-destructive/10 text-destructive';

export default function MobileBottomNav({ auth }) {
	const { url } = usePage();

	// Peran & gating tidak dihitung di sini lagi (dulu detektor role disalin dari
	// navItems.js) — buildNavSections sudah menyaring item sesuai peran.
	const sections = buildNavSections({ auth, url });
	const allItems = flattenNavItems(sections);
	const itemByKey = (key) => allItems.find((item) => item.key === key) ?? null;

	const fasilitasItems = FASILITAS_ITEM_KEYS.map(itemByKey).filter(Boolean);

	// Slot ke-5 punya dua wujud: tombol "Masuk" bagi tamu, popover "Menu" bagi yang sudah
	// login. `login` SENGAJA tidak dimasukkan ke BAR_ITEM_KEYS — daftar itu menyaring isi
	// popover, dan bagi tamu popovernya memang tidak dirender sama sekali.
	const { isLoggedIn } = resolveAbilities(auth);
	const loginItem = itemByKey('login');
	const showLoginSlot = !isLoggedIn && Boolean(loginItem);

	// Sisa seksi = apa pun yang tidak dipegang bilah/panel Fasilitas. Inilah yang membuat
	// menu baru mustahil hilang: ia jatuh ke sini secara otomatis.
	const handledKeys = new Set([...BAR_ITEM_KEYS, ...FASILITAS_ITEM_KEYS]);
	const menuSections = sections
		.map((section) => ({ ...section, items: section.items.filter((item) => !handledKeys.has(item.key)) }))
		.filter((section) => section.items.length > 0);

	const [showFasilitas, setShowFasilitas] = useState(false);
	const fasilitasRef = useRef(null);

	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef(null);

	// "Aktif" di bilah HANYA berarti halaman yang sedang dibuka — terbukanya popover
	// dilacak terpisah (showFasilitas/showMenu) supaya tak ada dua slot yang tampak aktif.
	const isFasilitasActive = fasilitasItems.some((item) => item.active);
	const isMenuActive = menuSections.some((section) => section.items.some((item) => item.active));
	const isReportActive = url.startsWith('/reports/create');

	useEffect(() => {
		function handleClickOutside(event) {
			if (fasilitasRef.current && !fasilitasRef.current.contains(event.target)) setShowFasilitas(false);
			if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
		}
		if (showFasilitas || showMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showFasilitas, showMenu]);

	return (
		<>
			{(showFasilitas || showMenu) && (
				<div
					className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
					onClick={() => {
						setShowFasilitas(false);
						setShowMenu(false);
					}}
				></div>
			)}

			<div
				className="fixed bottom-0 left-0 z-50 w-full border-t border-border bg-card md:hidden"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
					{/* 1. Beranda — ikon disamakan dengan sidebar (dulu IconHome di sini saja) */}
					<NavItem
						href={itemByKey('dashboard')?.url ?? route('dashboard')}
						icon={IconDashboard}
						label="Beranda"
						active={url === '/dashboard' || url === '/'}
					/>

					{/* 2. Fasilitas Publik — IconMapPin, bukan IconFiretruck: ikon truk di seluruh
					    sistem berarti "Pos Pemadam", satu ikon tak boleh punya dua makna. */}
					<div
						className="relative flex h-full w-full flex-col items-center justify-center"
						ref={fasilitasRef}
					>
						{showFasilitas && (
							<FloatingPanel className="left-1/2 w-56 -translate-x-1/2">
								{fasilitasItems.map((item) => (
									<FloatingLink
										key={item.key}
										item={item}
										tone={FASILITAS_ITEM_TONE[item.key]}
										onClick={() => setShowFasilitas(false)}
									/>
								))}
							</FloatingPanel>
						)}
						<PanelTrigger
							icon={IconMapPin}
							label="Fasilitas"
							active={isFasilitasActive}
							open={showFasilitas}
							onClick={() => {
								setShowFasilitas(!showFasilitas);
								setShowMenu(false);
							}}
						/>
					</div>

					{/* 3. Lapor — memakai ikon brand `/icon.png` (keputusan user 2026-08-19):
					    berkas itu petir PUTIH di dalam kotak merah, jadi ia menggantikan kotak
					    ikon slot alih-alih ditaruh di dalamnya. Ukurannya disamakan dengan
					    kotak slot lain (32px) sehingga barisnya satu irama, dan ia satu-satunya
					    bidang berwarna penuh saat tak ada halaman aktif — hierarki yang memang
					    diinginkan untuk tombol darurat. */}
					<NavItem
						href={itemByKey('report.create')?.url ?? route('front.reports.create')}
						imageSrc="/icon.png"
						label="Lapor"
						active={isReportActive}
						ariaLabel="Lapor Darurat"
						// Satu-satunya slot yang labelnya merah permanen: ini aksi darurat,
						// bukan sekadar tujuan.
						className="text-destructive hover:text-destructive"
					/>

					{/* 4. Riwayat */}
					<NavItem
						href={itemByKey('reports.mine')?.url ?? route('front.reports.index', { filter: 'mine' })}
						icon={IconHistory}
						label="Riwayat"
						active={url.startsWith('/reports') && !url.startsWith('/reports/create')}
					/>

					{/* 5a. Masuk — wujud slot ke-5 bagi TAMU (keputusan user 2026-08-25). Label
					    dipendekkan jadi satu kata seperti slot lain; judul panjangnya
					    ("Masuk Akun") tetap hidup di sidebar & di aria-label. */}
					{showLoginSlot ? (
						<NavItem
							href={loginItem.url}
							icon={loginItem.icon}
							label="Masuk"
							active={url.startsWith('/login')}
							ariaLabel={loginItem.title}
						/>
					) : (
						/* 5b. Menu — semua seksi yang tak terwakili di bilah, untuk semua
						   peran yang sudah login */
						<div className="relative flex h-full w-full flex-col items-center justify-center" ref={menuRef}>
							{showMenu && (
								<FloatingPanel className="right-2 w-64">
									{menuSections.map((section, index) => (
										<Fragment key={section.key}>
											<div
												className={cn(
													'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
													index === 0 ? 'mt-0' : 'mt-2',
												)}
											>
												{section.title}
											</div>
											{section.items.map((item) => (
												<FloatingLink
													key={item.key}
													item={item}
													onClick={() => setShowMenu(false)}
												/>
											))}
										</Fragment>
									))}
								</FloatingPanel>
							)}
							<PanelTrigger
								icon={IconMenu2}
								label="Menu"
								active={isMenuActive}
								open={showMenu}
								onClick={() => {
									setShowMenu(!showMenu);
									setShowFasilitas(false);
								}}
							/>
						</div>
					)}
				</div>
			</div>
		</>
	);
}

/**
 * Isi satu slot bilah. Dipakai <NavItem/> (tautan) & <PanelTrigger/> (pembuka popover)
 * supaya keduanya mustahil berbeda rupa. Penanda aktif = kotak solid merah `rounded-xl`,
 * dialek yang sama dengan <NavLink/> di sidebar.
 */
function SlotContent({ icon: Icon, imageSrc, label, active, open = false }) {
	return (
		<>
			{imageSrc ? (
				/* Slot "Lapor": ikon brand SUDAH berupa petir putih di dalam kotak merah,
				   jadi berkas itu MENGGANTIKAN kotak ikon — bukan diletakkan di dalamnya.
				   Kalau ditumpuk, dua kotak merah (nuansa PNG vs token) dan dua sudut
				   membulat bertabrakan. Tingginya 32px, sama dengan kotak slot lain, supaya
				   barisnya tetap satu irama. Saat aktif ia tak diberi latar merah lagi —
				   penandanya cincin, karena bidangnya memang sudah merah. */
				<img
					src={imageSrc}
					alt=""
					className={cn(
						'h-8 w-8 rounded-xl object-contain shadow-sm transition-shadow',
						active && 'ring-2 ring-destructive/50 ring-offset-2 ring-offset-card',
					)}
				/>
			) : (
				/* Penanda HALAMAN AKTIF: kotak solid merah — dialek yang sama dengan
				   <NavLink/> di sidebar, jadi satu menu tampak sama di ponsel maupun
				   desktop. (Percobaan "garis tipis" 2026-08-19 ditolak user.) Keadaan PANEL
				   TERBUKA memakai latar netral `bg-accent`, bukan merah, supaya dua keadaan
				   itu tak tertukar. */
				<span
					className={cn(
						'flex h-8 w-12 items-center justify-center rounded-xl transition-colors',
						active
							? 'bg-destructive text-destructive-foreground shadow-sm'
							: open
								? 'bg-accent'
								: 'group-hover:bg-accent',
					)}
				>
					<Icon className="h-5 w-5" stroke={1.75} />
				</span>
			)}
			<span className={cn('text-xs', active ? 'font-semibold' : 'font-medium')}>{label}</span>
		</>
	);
}

const slotClass = (active, open = false) =>
	cn(
		'group relative flex h-full w-full flex-col items-center justify-center gap-1 rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
		// Merah = lokasi. Hover & keadaan terbuka sengaja netral agar merah tetap satu makna.
		active ? 'text-destructive' : open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
	);

function NavItem({ href, icon, imageSrc, label, active, ariaLabel, className }) {
	return (
		<Link
			href={href}
			aria-label={ariaLabel}
			aria-current={active ? 'page' : undefined}
			className={cn(slotClass(active), className)}
		>
			<SlotContent icon={icon} imageSrc={imageSrc} label={label} active={active} />
		</Link>
	);
}

function PanelTrigger({ icon, label, active, open, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-haspopup="menu"
			aria-expanded={open}
			className={slotClass(active, open)}
		>
			<SlotContent icon={icon} label={label} active={active} open={open} />
		</button>
	);
}

/**
 * Wadah popover. Tokennya sengaja sama dengan <DropdownMenuContent/> (satu-satunya panel
 * melayang lain di aplikasi, yaitu lonceng notifikasi di AppLayout): `rounded-xl`,
 * `bg-popover`, `shadow-md`. Panah segitiga versi lama dibuang — idiom itu tak ada di
 * mana pun lagi dan justru membuat panel ini terlihat tertempel.
 */
function FloatingPanel({ className, children }) {
	return (
		<div
			className={cn(
				'no-scrollbar absolute bottom-[72px] z-50 flex max-h-[70vh] flex-col overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-md duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
				className,
			)}
		>
			{children}
		</div>
	);
}

/**
 * Satu baris di dalam popover. Menerima item apa adanya dari navItems.js — termasuk
 * `variant: 'danger'` (Keluar) dan `linkProps` (logout = POST + token FCM ikut dilepas).
 * Tinggi minimum 48px = target sentuh yang dipakai tombol utama di aplikasi ini.
 *
 * PENANDA AKTIF DI SINI SENGAJA BERBEDA DARI SIDEBAR (keputusan user 2026-08-20): baris
 * yang sedang dibuka memakai TINT 10% + teks sewarna — bentuk yang selama ini berjalan di
 * production — bukan blok solid `bg-destructive` ala <NavLink/>. Blok solid sempat dipakai
 * sehari (TASK_31) demi "satu dialek di semua permukaan", lalu ditolak user: di dalam
 * popover ia terbaca seperti tombol darurat, bukan seperti "kamu di sini". Warnanya
 * mengikuti jenis fasilitas (FASILITAS_ITEM_TONE) supaya baris aktif seirama dengan
 * legenda peta; item tanpa warna jenis memakai MENU_ACTIVE_TONE.
 * Pengecualian ini tercatat di prompt/docs/PENGECUALIAN_ATURAN.md — jangan "seragamkan"
 * lagi dengan sidebar tanpa menanyakan user. Kotak ikon di BILAH bawah TIDAK ikut berubah:
 * di sana blok solid merah tetap berlaku (keputusan user 2026-08-19).
 */
function FloatingLink({ item, tone, onClick }) {
	const Icon = item.icon;
	const linkProps = item.linkProps ?? {};
	const isDanger = item.variant === 'danger';

	return (
		<Link
			href={item.url}
			onClick={onClick}
			aria-current={item.active ? 'page' : undefined}
			{...linkProps}
			className={cn(
				'mt-0.5 flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium outline-none transition-colors first:mt-0 focus-visible:ring-2 focus-visible:ring-destructive',
				item.active
					? cn('font-semibold', tone?.active ?? MENU_ACTIVE_TONE)
					: isDanger
						? 'text-destructive hover:bg-destructive/10'
						: 'text-foreground hover:bg-accent',
			)}
		>
			<Icon
				size={18}
				className={cn('shrink-0', !item.active && !isDanger && (tone?.icon ?? 'text-muted-foreground'))}
			/>
			<span className="truncate">{item.title}</span>
		</Link>
	);
}
