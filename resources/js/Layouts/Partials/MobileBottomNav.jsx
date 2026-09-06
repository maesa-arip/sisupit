import BrandBoltIcon, { BrandBoltIconFilled } from '@/Components/BrandBoltIcon';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
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
 * Navigasi bawah untuk layar kecil.
 *
 * BENTUK - MINIMALIS (permintaan user 2026-09-01, referensi `docs/example/Menu 6.png`):
 * bilah selebar layar yang menempel di tepi bawah, lima slot sama rata berisi ikon + label,
 * dan **tanpa bidang penanda aktif apa pun**. Referensinya juga tanpa pemisah sama sekali;
 * pemisah tipis DITAMBAHKAN atas permintaan user berikutnya (lihat komentar di wadah
 * bilahnya) karena tanpa itu bilah menyatu dengan konten di belakangnya. Yang menandai halaman
 * yang sedang dibuka hanya WARNA dan TEBAL HURUF. Tak ada kotak, pil, kapsul, garis, titik,
 * maupun tombol melayang.
 *
 * DUA bentuk lain sudah pernah dicoba dan JANGAN ditulis ulang dari ingatan kalau user
 * memintanya kembali - `docs/example/sepakat/` menyimpannya utuh berikut cara memulihkan &
 * angka-angka di berkas lain yang terikat padanya:
 *   - **sepakat 1** - bilah menempel 80px, penanda aktif KOTAK MERAH SOLID yang membungkus
 *     ikon + label. Model sekarang adalah sepakat 1 yang dilucuti bidangnya lalu dirampingkan
 *     (80px -> 64px, glyph 18px -> 16px, jarak ikon-label 4px -> 8px, garis atas dibuang).
 *   - **kapsul melayang** (referensi `menu 5.png`) - kapsul `rounded-full` mengambang di atas
 *     dasar layar + tombol bulat merah "Lapor" bertengger di tengahnya. Dicoba 2026-09-01,
 *     dinilai user "kurang sesuai"; TIDAK diarsipkan sebagai sepakat, ada di riwayat git.
 *
 * Karena tak ada lagi bidang berwarna permanen, temuan #106 ("logo merah seperti aktif
 * terus") tertutup dengan sendirinya di model ini: satu-satunya yang merah adalah slot yang
 * sedang dibuka. Konsekuensi yang harus disadari: slot "Lapor" kehilangan seluruh penonjolan
 * tetapnya - ia sama rata dengan empat tujuan lain. Itu memang harga bentuk minimalis, dan
 * di aplikasi darurat harganya tidak sepele; kalau kelak dianggap terlalu mahal, sepakat 1
 * atau kapsul-dengan-tombol-tengah adalah dua jalan yang sudah terbukti jalan.
 *
 * ISI (keputusan user 2026-08-19, TASK_31): daftar menunya TIDAK ditulis di sini. Kedua
 * popover dibangun dari `buildNavSections()` - sumber yang sama dengan sidebar desktop.
 * Pengecualian "dua daftar" yang berlaku sejak 2026-08-13 dengan demikian DICABUT: sembilan
 * menu desktop sempat hilang tanpa gejala di ponsel karena aturan "tulis dua kali" itu -
 * lihat FINDINGS_LOG #71. Bilah memegang jangkar tetap lewat daftar KUNCI
 * (BAR_ITEM_KEYS/FASILITAS_ITEM_KEYS), dan slot ke-5 "Menu" memuat SEMUA seksi yang belum
 * terwakili - jadi menu baru di navItems.js otomatis mendarat di sana tanpa menyentuh berkas
 * ini. Seksi "Bantuan & Legal" DIHAPUS dari navItems.js atas permintaan user 2026-08-28,
 * jadi Pusat Bantuan/S&K/Privasi/Tentang kini hanya lewat footer AppLayout.
 *
 * TAMU (keputusan user 2026-08-25): slot ke-5 BUKAN popover "Menu" melainkan tombol **Masuk**,
 * sebab isi menu bagi tamu nyaris seluruhnya bukan tujuan yang ia cari. Harga yang DISETUJUI
 * user: bagi tamu, "Daftar Baru" hanya lewat tautan di halaman login. Tujuannya TIDAK dipaku
 * di sini - diambil dari item `login` milik navItems.js (aturan #71); kalau item itu hilang,
 * slotnya jatuh kembali ke popover "Menu", bukan menjadi tombol mati. Ingat: footer AppLayout
 * kini satu-satunya jalan ke halaman legal.
 *
 * DUA KEADAAN YANG TIDAK BOLEH TERTUKAR (koreksi user 2026-08-19 - "seolah ada 2 yang sedang
 * aktif"):
 *   - **Halaman aktif** = `text-destructive` + `font-semibold`, tanpa bidang. Satu slot saja.
 *   - **Panel terbuka** (keadaan sesaat tombol) = latar netral `bg-accent`. Ini SATU-SATUNYA
 *     bidang yang tersisa di bilah, dan justru itu gunanya: karena "aktif" kini tak punya
 *     bidang sama sekali, keduanya mustahil tertukar. Ia hanya tampak selama popovernya
 *     terbuka. TIDAK memakai merah - merah tetap berarti lokasi.
 *
 * KELIMA slot memakai glyph monokrom yang mewarisi warna teksnya, TERMASUK "Lapor" yang
 * sejak 2026-09-06 memakai petir brand `<BrandBoltIcon/>`. Yang menentukan boleh-tidaknya
 * bukan MOTIFNYA melainkan BENTUK ASETNYA: ikon brand `/icon.png` pernah dipakai di slot itu
 * (2026-08-19 s/d 2026-09-01) lalu dilepas karena berkas itu sendiri sebuah kotak merah utuh,
 * sehingga slot itu selalu tampak aktif (FINDINGS #106). BrandBoltIcon adalah petir yang SAMA
 * tanpa platnya, digambar sebagai <svg> ber-`currentColor` - jadi ia mustahil mengulangi
 * kekeliruan itu: warnanya kembali ditentukan kelas, bukan piksel. Yang TETAP TERLARANG di
 * bilah ini adalah aset gambar berwarna apa pun (`<img>`); /icon.png sendiri tetap hidup
 * sebagai favicon & ApplicationLogo.
 *
 * KELIMA slot MEMADAT saat aktif (2026-09-06, permintaan user) lewat satu mekanisme:
 * `icon` + `iconActive`. Dua ikon DIGANTI supaya itu mungkin - `IconHistory` -> `IconClock`
 * dan `IconMenu2` -> `IconLayoutGrid` - sebab keduanya bentuk GARIS TERBUKA yang tak punya
 * bagian dalam untuk diisi, dan @tabler tak menyediakan kembaran padatnya. Beranda & Fasilitas
 * tidak berubah rupa (`IconDashboardFilled`/`IconMapPinFilled` memang ada). Tercatat sebagai
 * PENGECUALIAN_ATURAN #3. `iconActive` OPSIONAL dan luruh ke glyph garis kalau tak diberikan -
 * itu yang menyelamatkan slot tamu "Masuk" (`IconLogin2`, tanpa kembaran padat), satu-satunya
 * slot yang tidak memadat.
 *
 * UKURAN, dari `Menu 6.png` yang diukur (ikon 21px : pitch slot 102px = 20,6%) lalu
 * dinormalkan ke layar 390px: ikon 16px (`h-4 w-4`), label 12px (`text-xs`), jarak ikon-label
 * 8px (`gap-2`), bilah 64px (`h-16`). Referensi membedakan aktif lewat ikon PADAT vs garis;
 * itu sengaja TIDAK ditiru - lihat alasannya di `slotClass`.
 *
 * DUA angka di luar berkas ini terikat pada tinggi bilah - mengubahnya sendirian membuat
 * konten & tombol kirim laporan darurat tertutup bilah, tanpa galat apa pun:
 *   - `AppLayout` ruang konten `pb-[calc(5rem+env(safe-area-inset-bottom))]`
 *   - tombol Kirim melayang `Front/Reports/Create.jsx`
 *     `bottom-[calc(4rem+env(safe-area-inset-bottom))]` — RAPAT ke bilah, tanpa celah
 * Ditambah `FloatingPanel` `bottom-[72px]` di berkas ini sendiri.
 *
 * Dua hal dari TASK_20/21 sengaja DIPERTAHANKAN karena bukan bagian dari panel menu dan
 * mencabutnya akan merusak tata letak lain:
 *   - `md:hidden` (bukan `lg:hidden` seperti versi lama) - AppLayout memasang rail ikon mulai
 *     md; dengan lg:hidden tablet akan memunculkan dua navigasi sekaligus dan menimpa konten
 *     yang sudah ber-`md:pb-0`.
 *   - `env(safe-area-inset-bottom)` - di ponsel berponi/gesture-bar (mayoritas perangkat APK)
 *     tanpa itu baris ikon tertimpa indikator sistem.
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

			{/* PEMISAH dari konten di belakangnya (permintaan user 2026-09-01) berupa
			    box-shadow DUA LAPIS, bukan `border-t`:
			      - lapis 1 `0 -1px 0 0 hsl(var(--border))` = garis rambut setebal 1px yang
			        mengikuti token border, jadi ia terbaca di mode terang MAUPUN gelap.
			        Bayangan gelap sendirian tak akan pernah terlihat di atas latar gelap -
			        itulah sebabnya garis ini wajib ada, bukan sekadar hiasan.
			      - lapis 2 = angkatan lembut yang hanya kasatmata di mode terang.
			    Dipakai sebagai shadow (bukan border) supaya tak menambah 1px ke tinggi
			    kotaknya - `h-16` di sini terikat pada dua angka di berkas lain (lihat
			    docblock), dan border akan menggeser semuanya sejauh satu piksel.
			    CATATAN untuk halaman /reports/create: di sana bar tombol Kirim menempel
			    persis di atas bilah ini, sehingga garis rambut itu jatuh di sambungannya dan
			    keduanya terbaca sebagai DUA lapis - bar aksi milik halaman, bilah milik
			    aplikasi. Itu memang yang dikehendaki; jangan "rapikan" dengan menaikkan
			    z-index bar itu ke atas bilah, sebab popover Fasilitas & Menu melayang tepat
			    di ketinggian yang sama dan akan ikut tertutup. */}
			<div
				className="fixed bottom-0 left-0 z-50 w-full bg-card shadow-[0_-1px_0_0_hsl(var(--border)),0_-8px_24px_-12px_rgba(0,0,0,0.22)] md:hidden"
				style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
			>
				<div className="mx-auto grid h-16 max-w-md grid-cols-5 px-1">
					{/* 1. Beranda — ikon disamakan dengan sidebar (dulu IconHome di sini saja) */}
					<NavItem
						href={itemByKey('dashboard')?.url ?? route('dashboard')}
						icon={IconDashboard}
						iconActive={IconDashboardFilled}
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
							iconActive={IconMapPinFilled}
							label="Fasilitas"
							active={isFasilitasActive}
							open={showFasilitas}
							onClick={() => {
								setShowFasilitas(!showFasilitas);
								setShowMenu(false);
							}}
						/>
					</div>

					{/* 3. Lapor - petir SISUPIT (permintaan user 2026-09-06: "gunakan logo itu
					    untuk di mobile nav, dan sesuaikan dengan yang icon yang lain").
					    Ini MEMBALIK keputusan 2026-09-01 yang memasang IconFlame di sini, dan
					    pembalikannya sah karena alasan aslinya sudah gugur: yang ditolak waktu
					    itu adalah `/icon.png` - petir DI DALAM kotak merah - bukan petirnya.
					    <BrandBoltIcon/> memakai `currentColor` & `fill="none"`, jadi ia ikut
					    `text-destructive`/`text-muted-foreground` seperti empat tetangganya dan
					    tak bisa lagi tampak aktif terus (akar #106). Bentuknya GARIS, bukan padat:
					    bidang terisi di antara glyph garis punya bobot lebih berat tanpa alasan,
					    persis yang ditolak di #106 putaran kedua - KECUALI saat slot ini
					    sedang aktif, dan di situ ia MEMADAT lewat `iconActive` seperti keempat
					    slot lain (permintaan user 2026-09-06). Syarat "hanya saat aktif" itulah
					    yang membuatnya sah: "bidang terisi HANYA milik slot aktif" adalah aturan
					    yang lahir dari putaran kedua itu sendiri. Merahnya tidak ditulis di
					    mana pun - fill & stroke sama-sama `currentColor`, jadi ia ikut
					    `text-destructive` milik slotnya.
					    Ikonnya kini DIPAKU di sini seperti empat slot lain (yang juga memakai
					    IconDashboard/IconMapPin/IconClock/IconLayoutGrid sendiri) - bilah ini memang
					    memilih glyphnya sendiri; yang TIDAK boleh dipaku adalah TUJUANNYA, dan itu
					    tetap dibaca dari navItems.js (aturan #71). AKIBAT YANG DISENGAJA: sidebar
					    desktop tetap IconFlame untuk "Lapor Darurat!", jadi satu menu memakai dua
					    ikon di dua permukaan - kalau itu tak dikehendaki, ubah `report.create` di
					    navItems.js, jangan tambahkan paku kedua di sini. */}
					<NavItem
						href={itemByKey('report.create')?.url ?? route('front.reports.create')}
						icon={BrandBoltIcon}
						iconActive={BrandBoltIconFilled}
						label="Lapor"
						active={isReportActive}
						ariaLabel="Lapor Darurat"
					/>

					{/* 4. Riwayat - IconClock, dulu IconHistory (2026-09-06). Diganti BUKAN karena
					    rupanya kurang baik melainkan karena `IconHistory` MUSTAHIL memadat:
					    bentuknya busur terbuka + jarum (`M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5`),
					    dan garis terbuka tak punya bagian dalam untuk diisi - @tabler pun tak
					    menyediakan kembaran padatnya. IconClock punya keduanya. */}
					<NavItem
						href={itemByKey('reports.mine')?.url ?? route('front.reports.index', { filter: 'mine' })}
						icon={IconClock}
						iconActive={IconClockFilled}
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
							{/* IconLayoutGrid, dulu IconMenu2 (2026-09-06). Hamburger tak akan
							    pernah bisa memadat - ia TIGA GARIS LURUS TERBUKA (`M4 6l16 0`
							    dst.), dan garis tak punya bagian dalam, jadi `fill` di atasnya
							    benar-benar tak menghasilkan apa pun. Kotak 2x2 punya isi, dan
							    idiomnya lazim untuk slot "menu/lainnya" di bilah bawah. */}
							<PanelTrigger
								icon={IconLayoutGrid}
								iconActive={IconLayoutGridFilled}
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
function SlotContent({ icon: Icon, iconActive: IconActive, label, active }) {
	// Slot aktif memakai kembaran PADAT bila ada. `iconActive` opsional dan luruh rapi ke glyph
	// garis kalau tak diberikan - itu yang menyelamatkan slot tamu "Masuk", yang ikonnya datang
	// dari navItems.js dan tak punya kembaran padat di @tabler. Ikon padat @tabler MEMBUANG prop
	// `stroke` sebelum menyentuh DOM (createReactComponent, cabang type === 'filled'), jadi
	// mengirimnya ke keduanya aman dan pemanggilnya tak perlu tahu ia sedang memegang yang mana.
	const Glyph = active && IconActive ? IconActive : Icon;

	return (
		<>
			<Glyph className="h-4 w-4" stroke={1.75} />
			<span className="max-w-full truncate text-xs leading-4">{label}</span>
		</>
	);
}

const slotClass = (active, open = false) =>
	cn(
		'group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg px-1 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-destructive',
		// PENANDA AKTIF = WARNA + TEBAL HURUF + IKON PADAT. Tetap tidak ada bidang, kotak,
		// pil, garis, maupun titik - "minimalis" pada referensi `Menu 6.png` bertahan; yang
		// ditambahkan 2026-09-06 (permintaan user) hanya pemadatan glyphnya, dan itu justru
		// pembeda yang dipakai referensi itu sendiri.
		// SEBELUMNYA pembeda padat-vs-garis DITOLAK dengan alasan @tabler tak menyediakan
		// varian padat untuk semua ikon bilah - dan alasan itu BENAR: `IconMenu2` tiga garis
		// lurus terbuka & `IconHistory` busur terbuka, keduanya tanpa bagian dalam sehingga
		// `fill` di atasnya tak menghasilkan apa pun, dan tak ada kembaran padatnya di
		// @tabler. Yang berubah bukan faktanya melainkan KEPUTUSANNYA: kedua ikon itu DIGANTI
		// ke pasangan yang punya kembaran padat (IconClock, IconLayoutGrid) supaya kelima slot
		// bisa seragam. Lihat PENGECUALIAN_ATURAN #3.
		// Ketebalan garis tetap TIDAK dipakai sebagai pembeda: itu persis yang dicabut
		// FINDINGS #72 karena ikon terlihat bergetar tiap pindah halaman.
		active
			? 'font-semibold text-destructive'
			: open
				? 'bg-accent font-medium text-foreground'
				: 'font-medium text-muted-foreground hover:text-foreground',
	);

function NavItem({ href, icon, iconActive, label, active, ariaLabel }) {
	return (
		<Link
			href={href}
			aria-label={ariaLabel}
			aria-current={active ? 'page' : undefined}
			className={slotClass(active)}
		>
			<SlotContent icon={icon} iconActive={iconActive} label={label} active={active} />
		</Link>
	);
}

function PanelTrigger({ icon, iconActive, label, active, open, onClick }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-haspopup="menu"
			aria-expanded={open}
			className={slotClass(active, open)}
		>
			<SlotContent icon={icon} iconActive={iconActive} label={label} active={active} />
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
