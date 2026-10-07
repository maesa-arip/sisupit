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
import { Fragment, useEffect, useState } from 'react';
import { buildNavSections, flattenNavItems, resolveAbilities } from './navItems';

/**
 * Navigasi bawah untuk layar kecil.
 *
 * #189 (apple-design, 2026-10-07) - REVISI 2 atas koreksi user: "animasi smooth dan pop up menunya
 * sudah oke, tapi pakai tampilan yang sebelumnya, hanya tiru tombol lapor yang tengah dan
 * animasinya, dan tambahkan animasi saat klik lapor". Jadi bilah di bawah ini KEMBALI ke bentuk
 * minimalis yang dijelaskan docblock lama (tag `pra-bottomnav-apple-design`), dengan TIGA
 * perubahan dari redesign:
 *   1. Slot "Lapor" = LINGKARAN di tengah: ABU + petir garis saat diam, MERAH + petir padat hanya
 *      saat halaman lapor dibuka (<LaporSlot/>). Ketukan memantulkan lingkaran + riak memudar.
 *      Karena tiap halaman memasang AppLayout sendiri (bilah dipasang ulang saat pindah halaman),
 *      waktu ketukan disimpan di tingkat modul dan bilah halaman tujuan MELANJUTKAN animasi itu
 *      lewat animation-delay negatif - tanpa itu animasinya terpotong atau terulang dari awal.
 *   2. Popover Fasilitas & Menu = PANEL KACA MELAYANG (<GlassPanel/>) yang tumbuh dari slot
 *      pemicunya (transform-origin per slot, pegas, selalu terpasang supaya bisa disela).
 *   3. Popover buatan tangan, listener `mousedown` di luar, dan <FloatingLink/> lama DIGANTI scrim +
 *      Esc + pindah halaman. Paragraf docblock lama tentang popover/`bottom-[72px]`/tint baris
 *      (PENGECUALIAN #2) dan tentang slot Lapor 24px berlaku untuk bentuk di tag, BUKAN berkas ini.
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
 * sedang dibuka. Konsekuensinya waktu itu: slot "Lapor" kehilangan seluruh penonjolan tetapnya
 * dan jadi sama rata dengan empat tujuan lain - harga yang di aplikasi darurat tidak sepele,
 * disadari & diterima saat menyepakatinya.
 * HARGA ITU DIBAYAR KEMBALI 2026-09-09 (permintaan user): slot "Lapor" kini berikon 24px
 * sementara empat tetangganya 20px. Penonjolannya lewat UKURAN saja - bukan bidang, bukan warna
 * sendiri, bukan tombol melayang - sehingga bentuk minimalisnya utuh dan #106 tidak mungkin
 * kembali lewat pintu ini. Kalau kelak dirasa masih kurang, sepakat 1 atau
 * kapsul-dengan-tombol-tengah adalah dua jalan yang sudah terbukti jalan.
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
 * UKURAN. Mula-mula diukur dari `Menu 6.png` (ikon 21px : pitch slot 102px = 20,6%) lalu
 * dinormalkan ke layar 390px jadi ikon 16px. Sejak 2026-09-09 (permintaan user, "buat iconnya
 * lebih besar dan teksnya lebih slim", lalu "hurufnya juga buat lebih kecil, dan untuk icon
 * lapor buat agar lebih besar dari yang lain") angkanya: ikon **20px** (`h-5 w-5`) KECUALI slot
 * "Lapor" yang **24px** (`h-6 w-6`), label **11px** (`text-[11px]`) ber-`font-normal`/
 * `font-medium` (lihat `slotClass`), jarak ikon-label 8px (`gap-2`), bilah 64px (`h-16`).
 * BARIS IKON DIPATOK 24px (`h-6`) untuk KELIMA slot - lihat `SlotContent`. Itu bukan hiasan:
 * tanpanya ikon Lapor yang lebih tinggi akan mendorong labelnya turun sendirian dan satu label
 * berdiri tidak sebaris dengan empat tetangganya.
 * Baris ikon 24px + jarak 8px + baris label 16px = 48px di dalam bilah 64px, jadi TINGGI BILAH
 * TIDAK IKUT BERUBAH - dan itu memang yang menjaga ketiga angka di berkas lain (lihat di bawah)
 * tetap sah tanpa disentuh. Ikon yang melewati 24px akan menabrak angka-angka itu: ia menuntut
 * baris ikon dinaikkan, dan ketiganya harus dihitung ulang bersamaan.
 * Ketebalan garis ikon TETAP 1,75 - ia bukan pembeda aktif (#72) dan tidak ikut disetel di
 * sini; yang "lebih slim" adalah TEKSnya.
 * Referensi `Menu 6.png` membedakan aktif lewat ikon PADAT vs garis, dan sejak 2026-09-06 itu
 * MEMANG ditiru (lihat paragraf di atas) - kalimat lama di sini yang menyatakan sebaliknya
 * sudah tidak benar sejak hari itu.
 *
 * DUA angka di luar berkas ini terikat pada tinggi bilah - mengubahnya sendirian membuat
 * konten & tombol kirim laporan darurat tertutup bilah, tanpa galat apa pun:
 *   - `AppLayout` ruang konten `pb-[calc(5rem+env(safe-area-inset-bottom))]`
 *   - tombol Kirim melayang `Front/Reports/Create.jsx`
 *     `bottom-[calc(4rem+env(safe-area-inset-bottom))]` — RAPAT ke bilah, tanpa celah
 * Ditambah panel kaca <GlassPanel/> `bottom-[calc(4.5rem+…)]` di berkas ini sendiri (8px di atas bilah).
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
 * Warna jenis fasilitas di panel kaca (gema legenda peta): `glyph` saat diam, `fill` saat
 * halamannya sedang dibuka. Kelas ditulis UTUH supaya terpindai Tailwind; kunci tak terdaftar
 * jatuh ke netral.
 */
const FASILITAS_TONE = {
	hydrants: { glyph: 'text-teal', fill: 'bg-teal text-teal-foreground' },
	pumps: { glyph: 'text-info', fill: 'bg-info text-info-foreground' },
	fire_stations: { glyph: 'text-destructive', fill: 'bg-destructive text-destructive-foreground' },
	volunteers: { glyph: 'text-volunteer', fill: 'bg-volunteer text-volunteer-foreground' },
	'monitoring.map': { glyph: 'text-teal', fill: 'bg-teal text-teal-foreground' },
};

/** Panel tumbuh dari slot pemicunya: pusat mendatar slot ke-`index` dari lima, tepi bawah panel. */
const slotOrigin = (index) => `${((index + 0.5) / 5) * 100}% 100%`;

export default function MobileBottomNav({ auth }) {
	// URL tujuan selama navigasi berjalan (TASK_70): slot yang diketuk langsung aktif.
	const url = useNavUrl();

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

	// Satu panel terbuka pada satu waktu: null | 'fasilitas' | 'menu'.
	const [panel, setPanel] = useState(null);
	const closePanel = () => setPanel(null);
	const togglePanel = (name) => setPanel((current) => (current === name ? null : name));

	// "Aktif" di bilah HANYA berarti halaman yang sedang dibuka — terbukanya panel dilacak
	// terpisah (`panel`) supaya tak ada dua slot yang tampak aktif.
	const isFasilitasActive = fasilitasItems.some((item) => item.active);
	const isMenuActive = menuSections.some((section) => section.items.some((item) => item.active));
	const isReportActive = url.startsWith('/reports/create');

	// Isi panel Menu: baris profil di puncak, "Keluar" (variant danger) di dasar.
	const profileItem = itemByKey('profile');
	const menuRows = menuSections
		.map((section) => ({
			...section,
			items: section.items.filter((item) => item.key !== 'profile' && item.variant !== 'danger'),
		}))
		.filter((section) => section.items.length > 0);
	const dangerItems = menuSections.flatMap((section) => section.items.filter((item) => item.variant === 'danger'));

	// Pindah halaman (termasuk tombol kembali) menutup panel; Esc juga.
	useEffect(() => setPanel(null), [url]);
	useEffect(() => {
		if (!panel) return undefined;
		const onKey = (event) => event.key === 'Escape' && setPanel(null);
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [panel]);

	return (
		<>
			{/* Scrim tipis: panel bersifat sesaat. Bilah (z-50) tetap di atasnya, jadi slot lain tetap
			    bisa langsung diketuk. */}
			<div
				aria-hidden="true"
				onClick={closePanel}
				className={cn(
					'fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 ease-out md:hidden dark:bg-black/45',
					panel ? 'opacity-100' : 'pointer-events-none opacity-0',
				)}
			/>

			<GlassPanel open={panel === 'fasilitas'} origin={slotOrigin(1)} label="Fasilitas Publik">
				<p className="px-2 pb-3 pt-1 text-[13px] font-semibold text-muted-foreground">Fasilitas Publik</p>
				<div className="grid grid-cols-3 gap-x-2 gap-y-4 pb-1">
					{fasilitasItems.map((item) => (
						<FasilitasButton key={item.key} item={item} tone={FASILITAS_TONE[item.key]} onNavigate={closePanel} />
					))}
				</div>
			</GlassPanel>

			{!showLoginSlot && (
				<GlassPanel open={panel === 'menu'} origin={slotOrigin(4)} label="Menu">
					{profileItem && <ProfileRow auth={auth} item={profileItem} onNavigate={closePanel} />}
					{menuRows.map((section) => (
						<Fragment key={section.key}>
							<div aria-hidden="true" className="mx-2 my-1.5 h-px bg-foreground/[0.08]" />
							<p className="px-3 pb-0.5 pt-1.5 text-[12px] font-semibold text-muted-foreground">{section.title}</p>
							{section.items.map((item) => (
								<MenuRow key={item.key} item={item} onNavigate={closePanel} />
							))}
						</Fragment>
					))}
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
			    di ketinggian yang sama dan akan ikut tertutup.
			    Disembunyikan selama keyboard layar terbuka (#187): bilah navigasi tak ikut naik di atas
			    keyboard, seperti aplikasi native - ruang di atas keyboard milik kolom yang diketik. */}
			<div
				className="material-chrome fixed bottom-0 left-0 z-50 w-full shadow-[0_-1px_0_0_hsl(var(--border)),0_-8px_24px_-12px_rgba(0,0,0,0.22)] md:hidden [html[data-keyboard=open]_&]:hidden"
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
					<PanelTrigger
						icon={IconMapPin}
						iconActive={IconMapPinFilled}
						label="Fasilitas"
						active={isFasilitasActive}
						open={panel === 'fasilitas'}
						onClick={() => togglePanel('fasilitas')}
					/>

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
					{/* IKONNYA LEBIH BESAR DARI EMPAT TETANGGANYA - 24px lawan 20px (permintaan
					    user 2026-09-09). Ini MENGEMBALIKAN penonjolan tetap yang hilang saat
					    bentuk minimalis disepakati 2026-09-01; docblock berkas ini sendiri sudah
					    mencatat kehilangan itu sebagai harga yang "di aplikasi darurat tidak
					    sepele". Yang penting: penonjolannya lewat UKURAN, bukan lewat bidang atau
					    warna sendiri - jadi ia TIDAK mengulang #106, yang akarnya slot ini punya
					    latar merah permanen sehingga tampak aktif di setiap halaman. Warnanya
					    tetap ikut kelas slotnya seperti empat lainnya.
					    Ukuran ini juga menjawab catatan lama bahwa petir brand terbaca lebih
					    RAMPING dari tetangganya: bentuknya memang sempit (rasio ~0,44 lawan ~1,0
					    milik ikon persegi), jadi pada tinggi yang sama ia menutup lebih sedikit
					    bidang. Pada 24px lebarnya baru sekitar 10,5px - masih lebih ramping dari
					    ikon 20px persegi, dan itulah yang membuat pembesaran ini terbaca
					    seimbang, bukan menonjol berlebihan. */}
					{/* #189: lingkaran tengah - abu saat diam, merah hanya saat halaman lapor dibuka. */}
					<LaporSlot
						href={itemByKey('report.create')?.url ?? route('front.reports.create')}
						icon={BrandBoltIcon}
						iconActive={BrandBoltIconFilled}
						active={isReportActive}
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
						<PanelTrigger
							icon={IconLayoutGrid}
							iconActive={IconLayoutGridFilled}
							label="Menu"
							active={isMenuActive}
							open={panel === 'menu'}
							onClick={() => togglePanel('menu')}
						/>
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
function SlotContent({ icon: Icon, iconActive: IconActive, label, active, iconClassName }) {
	// Slot aktif memakai kembaran PADAT bila ada. `iconActive` opsional dan luruh rapi ke glyph
	// garis kalau tak diberikan - itu yang menyelamatkan slot tamu "Masuk", yang ikonnya datang
	// dari navItems.js dan tak punya kembaran padat di @tabler. Ikon padat @tabler MEMBUANG prop
	// `stroke` sebelum menyentuh DOM (createReactComponent, cabang type === 'filled'), jadi
	// mengirimnya ke keduanya aman dan pemanggilnya tak perlu tahu ia sedang memegang yang mana.
	const Glyph = active && IconActive ? IconActive : Icon;

	// BARIS IKON BERTINGGI TETAP (`h-6`), dan inilah yang menjaga bilah tetap harmonis begitu
	// satu slot boleh berikon lebih besar (permintaan user 2026-09-09: "untuk icon lapor buat
	// agar lebih besar dari yang lain, tapi buat agar tetap harmonis"). Tanpa baris ini, slot
	// diisi `justify-center` sehingga ikon yang 4px lebih tinggi MENDORONG labelnya turun ~2px
	// dan satu label berdiri tidak sebaris dengan empat tetangganya - tak ada galat, hanya
	// terbaca sebagai tata letak yang meleset. Dengan tinggi baris dipatok, ikon sebesar apa pun
	// (sampai 24px) duduk di tengah baris yang sama dan kelima label tetap satu garis.
	// `iconClassName` OPSIONAL dan menimpa ukuran bawaan lewat twMerge - bentuk yang sama dengan
	// `iconActive` yang juga opsional, jadi ini SATU jalur untuk kelima slot, bukan cabang khusus
	// untuk salah satunya (larangan yang sama dengan PENGECUALIAN_ATURAN #3).
	return (
		<>
			<span className="flex h-6 items-center justify-center">
				<Glyph className={cn('h-5 w-5', iconClassName)} stroke={1.75} />
			</span>
			<span className="max-w-full truncate text-[11px] leading-4">{label}</span>
		</>
	);
}

const slotClass = (active, open = false) =>
	cn(
		'group relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg px-1 outline-none transition-[color,background-color,transform] duration-100 ease-out active:scale-[0.92] motion-reduce:active:scale-100 focus-visible:ring-2 focus-visible:ring-destructive',
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
		// TEBAL HURUF DITURUNKAN SATU TINGKAT di ketiga keadaan (permintaan user 2026-09-09,
		// "teksnya lebih slim"): semibold -> medium untuk yang aktif, medium -> normal untuk
		// dua keadaan lain. Bedanya SATU tingkat, bukan nol - tebal huruf masih ikut menandai
		// slot aktif bersama warna & ikon padat, dan menyamakan ketiganya akan menyisakan
		// penanda yang lebih sedikit daripada yang sudah disepakati.
		active
			? 'font-medium text-destructive'
			: open
				? 'bg-accent font-normal text-foreground'
				: 'font-normal text-muted-foreground hover:text-foreground',
	);

function NavItem({ href, icon, iconActive, label, active, ariaLabel, iconClassName }) {
	return (
		<Link
			href={href}
			aria-label={ariaLabel}
			aria-current={active ? 'page' : undefined}
			className={slotClass(active)}
		>
			<SlotContent
				icon={icon}
				iconActive={iconActive}
				label={label}
				active={active}
				iconClassName={iconClassName}
			/>
		</Link>
	);
}

function PanelTrigger({ icon, iconActive, label, active, open, onClick, iconClassName }) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-haspopup="dialog"
			aria-expanded={open}
			className={slotClass(active, open)}
		>
			<SlotContent
				icon={icon}
				iconActive={iconActive}
				label={label}
				active={active}
				iconClassName={iconClassName}
			/>
		</button>
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

/** Durasi animasi ketukan Lapor - WAJIB sama dengan `animation.lapor-pop` di tailwind.config.js. */
const LAPOR_POP_MS = 650;

// Waktu ketukan Lapor terakhir, disimpan di tingkat MODUL (bukan state): tiap halaman memasang
// AppLayout sendiri, jadi bilah ini dipasang ulang begitu halaman lapor tiba. Bilah halaman tujuan
// membaca nilai ini dan MELANJUTKAN animasi yang sedang berjalan lewat animation-delay negatif,
// alih-alih memotongnya atau mengulanginya dari awal.
let laporTappedAt = 0;

/**
 * Slot tengah "Lapor" (#189, koreksi user 2026-10-07): lingkaran ABU + petir garis saat diam,
 * MERAH + petir padat hanya saat halaman lapor dibuka - menonjol lewat BENTUK, warnanya tetap
 * mengikuti aturan "merah = lokasi". Tekan = menyusut seketika (umpan balik saat jari menyentuh);
 * lepas = lingkaran memantul (efek "bounce" SF Symbols) + riak memudar keluar. Reduced motion:
 * tanpa pantulan & riak, hanya perubahan warna.
 */
function LaporSlot({ href, icon: Icon, iconActive: IconActive, active }) {
	const [pop, setPop] = useState(() => {
		const elapsed = Date.now() - laporTappedAt;
		return elapsed < LAPOR_POP_MS ? { key: laporTappedAt, delay: -elapsed } : null;
	});
	const Glyph = active && IconActive ? IconActive : Icon;
	const animationDelay = pop ? `${pop.delay}ms` : undefined;

	return (
		<Link
			href={href}
			aria-label="Lapor Darurat"
			aria-current={active ? 'page' : undefined}
			onClick={() => {
				laporTappedAt = Date.now();
				setPop({ key: laporTappedAt, delay: 0 });
			}}
			className="relative flex h-full w-full items-center justify-center rounded-lg outline-none transition-transform duration-100 ease-out active:scale-[0.9] focus-visible:ring-2 focus-visible:ring-destructive motion-reduce:active:scale-100"
		>
			<span className="relative flex h-11 w-11 items-center justify-center">
				{pop && (
					<span
						key={`ripple-${pop.key}`}
						aria-hidden="true"
						style={{ animationDelay }}
						className="pointer-events-none absolute inset-0 animate-lapor-ripple rounded-full bg-destructive motion-reduce:hidden"
					/>
				)}
				<span
					key={pop ? `pop-${pop.key}` : 'idle'}
					style={{ animationDelay }}
					className={cn(
						'relative flex h-11 w-11 items-center justify-center rounded-full transition-[background-color,color,box-shadow] duration-300 ease-out',
						pop && 'animate-lapor-pop motion-reduce:animate-none',
						active
							? 'bg-destructive text-destructive-foreground shadow-[0_6px_16px_-6px_hsl(var(--destructive)/0.7)]'
							: 'bg-foreground/[0.08] text-muted-foreground dark:bg-white/[0.12]',
					)}
				>
					<Glyph className="h-6 w-6" stroke={1.75} />
				</span>
			</span>
		</Link>
	);
}
