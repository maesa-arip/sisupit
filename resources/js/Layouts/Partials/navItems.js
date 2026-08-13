import {
	IconBuildingCommunity,
	IconClipboardPlus,
	IconDashboard,
	IconDroplet,
	IconEngine,
	IconFireHydrant,
	IconFiretruck,
	IconFlame,
	IconGavel,
	IconHeartHandshake,
	IconHistory,
	IconInfoCircle,
	IconKey,
	IconLifebuoy,
	IconLockAccess,
	IconLogin2,
	IconLogout,
	IconMapSearch,
	IconRoute,
	IconSettings,
	IconShieldLock,
	IconSpeakerphone,
	IconUser,
	IconUsersGroup,
} from '@tabler/icons-react';

/**
 * SUMBER KEBENARAN TUNGGAL daftar navigasi aplikasi.
 *
 * Aturan yang lahir dari FINDINGS #53: JANGAN pernah membuat daftar menu kedua. Menu baru
 * cukup ditulis di sini dan otomatis muncul di semua permukaan yang memakainya:
 *   - <Sidebar/>          → sidebar penuh (≥lg) & rail ikon (md)
 *   - <MobileMenuPanel/>  → drawer "Menu" di bawah md — TIDAK LAGI DIPAKAI, lihat di bawah
 *
 * Yang dipisah di sini hanyalah DATA-nya. Presentasi sengaja berbeda per permukaan —
 * menuang sidebar desktop apa adanya ke ponsel adalah persis keluhan yang memicu perubahan
 * ini (daftar 25 baris tanpa hierarki). Selama daftarnya satu, presentasi boleh beda.
 *
 * PENGECUALIAN SEJAK 2026-08-13 (permintaan user, catatan pembalikan #53/#54 di
 * FINDINGS_LOG): <MobileBottomNav/> dikembalikan ke bentuk pra-TASK_20 dan kini
 * memelihara daftar menunya SENDIRI, jadi aturan "satu daftar" hanya berlaku untuk
 * desktop/tablet. Menu baru yang juga harus tampil di ponsel wajib ditulis DUA KALI:
 * di sini dan di MobileBottomNav.jsx.
 */

/**
 * Detektor peran sapu jagat: kebal terhadap semua bentuk keluaran Spatie yang pernah
 * dipakai di codebase ini (array string, array objek, nilai tunggal, atau ter-nest di
 * `auth.user`). Dipindah ke sini supaya Sidebar & bottom-nav tak lagi menyalinnya.
 */
export function resolveRoles(auth) {
	const rawRoles = auth?.roles || auth?.role || auth?.user?.roles || auth?.user?.role || [];
	const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];

	return rolesArray.map((r) => (typeof r === 'object' && r !== null ? r.name : r)).filter(Boolean);
}

/**
 * Ringkasan hak akses dari peran. Ketiganya dipakai bersama oleh sidebar & bottom-nav,
 * dan HARUS selaras dengan gating route di backend:
 *   - isAdminOrSuperadmin → seluruh /admin/* (routes/web.php & routes/admin.php).
 *     Petugas TIDAK punya akses ke sana; ia bekerja lewat dashboard taktis + aksi di
 *     halaman detail laporan. Menyertakan petugas di sini hanya melahirkan link 403.
 *   - isStaff            → Pusat Komando (daftar relawan)
 *   - isCommandCenter    → Pusat Komando + pejabat pemantau (peta pemantauan)
 */
export function resolveAbilities(auth) {
	const userRoles = resolveRoles(auth);
	const isAdminOrSuperadmin = userRoles.includes('admin') || userRoles.includes('superadmin');
	const isStaff = userRoles.includes('petugas') || isAdminOrSuperadmin;

	return {
		userRoles,
		isSuperadmin: userRoles.includes('superadmin'),
		isAdminOrSuperadmin,
		isStaff,
		isCommandCenter: isStaff || userRoles.includes('pejabat'),
		isLoggedIn: Boolean(auth?.name || auth?.user?.name),
	};
}

/**
 * Membangun seluruh seksi navigasi untuk peran & halaman aktif tertentu.
 *
 * Setiap seksi punya `mobile` — dulu dibaca <MobileMenuPanel/> (kini tak dipakai) untuk
 * menentukan cara menyajikannya:
 *   - 'list'        → daftar terbuka
 *   - 'collapsible' → terlipat, default tertutup (seksi admin yang jarang disentuh)
 *   - 'legal'       → tautan teks kecil di kaki panel
 *   - 'account'     → baris aksi akun di kaki panel
 * <Sidebar/> mengabaikan `mobile` dan merender semua seksi secara seragam.
 */
export function buildNavSections({ auth, url = '' }) {
	const { isSuperadmin, isAdminOrSuperadmin, isStaff, isCommandCenter, isLoggedIn } = resolveAbilities(auth);
	const startsWith = (path) => url.startsWith(path);

	const sections = [
		{
			key: 'utama',
			title: 'Menu Utama',
			mobile: 'list',
			items: [
				{
					key: 'dashboard',
					title: 'Beranda',
					icon: IconDashboard,
					url: route('dashboard'),
					active: startsWith('/dashboard'),
				},
				isCommandCenter && {
					key: 'monitoring.map',
					title: 'Peta Pemantauan',
					icon: IconMapSearch,
					url: route('front.monitoring.map'),
					active: startsWith('/peta-pemantauan'),
				},
			],
		},
		{
			key: 'operasional',
			title: 'Operasional',
			mobile: 'list',
			items: isLoggedIn
				? [
						{
							key: 'report.create',
							title: 'Lapor Darurat!',
							icon: IconFlame,
							url: route('front.reports.create'),
							active: startsWith('/reports/create'),
							variant: 'danger',
						},
						{
							key: 'reports.mine',
							title: 'Arsip & Riwayat',
							icon: IconHistory,
							url: route('front.reports.index', { filter: 'mine' }),
							active: startsWith('/reports') && !startsWith('/reports/create'),
						},
					]
				: [],
		},
		{
			key: 'fasilitas',
			title: 'Fasilitas Publik',
			mobile: 'list',
			items: [
				{
					key: 'pumps',
					title: 'Lokasi SKKL',
					icon: IconDroplet,
					url: route('front.pumps.index'),
					active: startsWith('/pumps'),
				},
				{
					key: 'fire_stations',
					title: 'Pos Pemadam',
					icon: IconFiretruck,
					url: route('front.fire_stations.index'),
					active: startsWith('/fire-stations'),
				},
				{
					key: 'hydrants',
					title: 'Lokasi Hydrant',
					icon: IconFireHydrant,
					url: route('front.hydrants.index'),
					active: startsWith('/hydrants'),
				},
				isStaff && {
					key: 'volunteers',
					title: 'Daftar Relawan',
					icon: IconHeartHandshake,
					url: route('front.volunteers.index'),
					active: startsWith('/relawan'),
				},
			],
		},
		{
			key: 'administrasi',
			title: 'Administrasi',
			mobile: 'collapsible',
			items: isAdminOrSuperadmin
				? [
						{
							key: 'admin.users',
							title: 'Manajemen Pengguna',
							icon: IconUsersGroup,
							url: route('admin.users.index'),
							active: startsWith('/admin/users'),
						},
						{
							key: 'admin.reports',
							title: 'Verifikasi Laporan',
							icon: IconClipboardPlus,
							url: route('admin.reports.index'),
							active: startsWith('/admin/reports'),
						},
						{
							key: 'admin.hydrants',
							title: 'Manajemen Hydrant',
							icon: IconFireHydrant,
							url: route('admin.hydrants.index'),
							active: startsWith('/admin/facilities') || startsWith('/admin/hydrants'),
						},
						{
							key: 'admin.pumps',
							title: 'Manajemen Pompa',
							icon: IconEngine,
							url: route('admin.pumps.index'),
							active: startsWith('/admin/pumps'),
						},
						{
							key: 'admin.fire-stations',
							title: 'Manajemen Pos Pemadam',
							icon: IconFiretruck,
							url: route('admin.fire-stations.index'),
							active: startsWith('/admin/fire-stations'),
						},
						{
							key: 'admin.agencies',
							title: 'Manajemen OPD Terkait',
							icon: IconBuildingCommunity,
							url: route('admin.agencies.index'),
							active: startsWith('/admin/agencies'),
						},
						// SEMENTARA DISEMBUNYIKAN (keputusan user 2026-06-29): menu "Kelola Armada"
						// disembunyikan selaras dengan panel Pengerahan Armada di Show.jsx.
						// Backend & route admin.units.* tetap utuh — buka kembali entri ini
						// (beserta import IconTruck) untuk menampilkannya.
						// {
						// 	key: 'admin.units',
						// 	title: 'Manajemen Armada',
						// 	icon: IconTruck,
						// 	url: route('admin.units.index'),
						// 	active: startsWith('/admin/units'),
						// },

						// Pengumuman global = lintas-tenant, superadmin saja (sesuai gating
						// route admin.php). Admin wilayah tak melihat menu ini.
						isSuperadmin && {
							key: 'admin.announcements',
							title: 'Pengumuman Sistem',
							icon: IconSpeakerphone,
							url: route('admin.announcements.index'),
							active: startsWith('/admin/announcements'),
						},
					]
				: [],
		},
		{
			key: 'kontrol-akses',
			title: 'Kontrol Akses',
			mobile: 'collapsible',
			items: isSuperadmin
				? [
						{
							key: 'admin.roles',
							title: 'Manajemen Role',
							icon: IconShieldLock,
							url: route('admin.roles.index'),
							active: startsWith('/admin/roles'),
						},
						{
							key: 'admin.permissions',
							title: 'Hak Akses',
							icon: IconKey,
							url: route('admin.permissions.index'),
							active: startsWith('/admin/permissions'),
						},
						{
							key: 'admin.assign-permissions',
							title: 'Assign Hak Akses',
							icon: IconLockAccess,
							url: route('admin.assign-permissions.index'),
							active: startsWith('/admin/assign-permissions'),
						},
						{
							key: 'admin.route-accesses',
							title: 'Akses Route',
							icon: IconRoute,
							url: route('admin.route-accesses.index'),
							active: startsWith('/admin/route-accesses'),
						},
					]
				: [],
		},
		{
			key: 'sistem',
			title: 'Sistem',
			mobile: 'collapsible',
			items: isSuperadmin
				? [
						{
							key: 'admin.tenants',
							title: 'Instansi / Kabupaten',
							icon: IconBuildingCommunity,
							url: route('admin.tenants.index'),
							active: startsWith('/admin/tenants'),
						},
						{
							key: 'admin.settings',
							title: 'Pengaturan Notifikasi',
							icon: IconSettings,
							url: route('admin.settings.edit'),
							active: startsWith('/admin/settings'),
						},
					]
				: [],
		},
		{
			key: 'legal',
			title: 'Bantuan & Legal',
			mobile: 'legal',
			items: [
				{
					key: 'info.help',
					title: 'Pusat Bantuan',
					icon: IconLifebuoy,
					url: route('info.help'),
					active: startsWith('/pusat-bantuan'),
				},
				{
					key: 'info.terms',
					title: 'Syarat & Ketentuan',
					icon: IconGavel,
					url: route('info.terms'),
					active: startsWith('/syarat-ketentuan'),
				},
				{
					key: 'info.privacy',
					title: 'Kebijakan Privasi',
					icon: IconShieldLock,
					url: route('info.privacy'),
					active: startsWith('/kebijakan-privasi'),
				},
				{
					key: 'info.about',
					title: 'Tentang Aplikasi',
					icon: IconInfoCircle,
					url: route('info.about'),
					active: startsWith('/tentang'),
				},
			],
		},
		{
			key: 'akun',
			title: 'Akun & Sistem',
			mobile: 'account',
			items: isLoggedIn
				? [
						{
							key: 'profile',
							title: 'Profil Saya',
							icon: IconUser,
							url: route('profile.edit'),
							active: startsWith('/profile'),
						},
						{
							key: 'logout',
							title: 'Keluar (Logout)',
							icon: IconLogout,
							url: route('logout'),
							active: false,
							variant: 'danger',
							// Lepas token FCM device ini saat logout agar HP berhenti menerima
							// notif sirine. globalThis aman saat SSR (window undefined di server).
							linkProps: {
								method: 'post',
								as: 'button',
								data: { fcm_token: globalThis.__sisupitFcmToken },
							},
						},
					]
				: [
						{
							key: 'login',
							title: 'Masuk Akun',
							icon: IconLogin2,
							url: route('login'),
							active: false,
						},
						{
							key: 'register',
							title: 'Daftar Baru',
							icon: IconClipboardPlus,
							url: route('register'),
							active: false,
						},
					],
		},
	];

	return sections
		.map((section) => ({ ...section, items: section.items.filter(Boolean) }))
		.filter((section) => section.items.length > 0);
}

/** Semua item dari semua seksi, diratakan — dipakai pencarian & penghitung ambang. */
export function flattenNavItems(sections) {
	return sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionTitle: section.title })));
}

/** Cari satu item lintas seksi berdasarkan key. */
export function findNavItem(sections, key) {
	return flattenNavItems(sections).find((item) => item.key === key) ?? null;
}

/**
 * Urutan prioritas aksi cepat. Panel mobile mengambil EMPAT key pertama yang benar-benar
 * tersedia bagi peran tersebut, jadi satu daftar ini melayani semua peran sekaligus —
 * tak ada tabel per-peran yang harus dijaga sinkron.
 */
const QUICK_ACTION_PRIORITY = [
	'report.create',
	'admin.reports',
	'monitoring.map',
	'reports.mine',
	'volunteers',
	'fire_stations',
	'hydrants',
	'pumps',
	'login',
];

export function buildQuickActions(sections, limit = 4) {
	const all = flattenNavItems(sections);

	return QUICK_ACTION_PRIORITY.map((key) => all.find((item) => item.key === key))
		.filter(Boolean)
		.slice(0, limit);
}
