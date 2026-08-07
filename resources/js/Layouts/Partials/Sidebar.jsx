import NavLink from '@/Components/NavLink';
import { cn } from '@/lib/utils';
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
 * Daftar navigasi tunggal untuk SELURUH ukuran layar — dipakai tiga kali:
 *   - AppLayout ≥lg  : sidebar penuh berlabel
 *   - AppLayout md   : rail ikon (`compact`), label & judul seksi disembunyikan lewat CSS
 *   - MobileBottomNav: isi Sheet "Menu" (<md), selalu berlabel penuh
 *
 * Sengaja SATU komponen: sebelumnya bottom-nav menyimpan salinan daftar menunya sendiri,
 * sehingga seksi "Bantuan & Legal" yang ditambahkan di sini tidak pernah muncul di mobile.
 */
export default function Sidebar({ url, auth, compact = false }) {
	// 🛠️ Detektor Role Sapu Jagat (Kebal Segala Format Output Spatie)
	const rawRoles = auth?.roles || auth?.role || auth?.user?.roles || auth?.user?.role || [];
	const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
	const userRoles = rolesArray.map((r) => (typeof r === 'object' && r !== null ? r.name : r));

	// Pengecekan Otoritas.
	// Catatan: SEMUA halaman /admin/* digating role:admin|superadmin di backend
	// (routes/web.php & routes/admin.php). Petugas TIDAK punya akses ke sana — ia
	// bekerja lewat Dashboard taktis + aksi di halaman detail laporan. Jadi seksi
	// Administrasi di bawah HARUS digating isAdminOrSuperadmin, bukan "staff",
	// agar petugas tidak melihat link yang berujung 403.
	const isAdminOrSuperadmin = userRoles.includes('admin') || userRoles.includes('superadmin');
	const isSuperadmin = userRoles.includes('superadmin');
	// Daftar relawan = Pusat Komando saja (petugas/admin/superadmin), selaras gating route.
	const isStaff = userRoles.includes('petugas') || isAdminOrSuperadmin;
	// Peta Pemantauan = Pusat Komando + pejabat pemantau (selaras gating route front.monitoring.map).
	const isCommandCenter = isStaff || userRoles.includes('pejabat');

	// Komponen Header Seksi Menu (Tipografi Taktis/Militeristik). Di mode rail judulnya
	// tak muat, jadi diganti garis pemisah tipis agar pengelompokan tetap terbaca.
	const NavHeading = ({ children }) => (
		<>
			{compact && <div className="mx-auto my-2 h-px w-8 shrink-0 bg-border lg:hidden" />}
			<div
				className={cn(
					'mb-1 mt-6 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground first:mt-2',
					compact && 'hidden lg:block',
				)}
			>
				{children}
			</div>
		</>
	);

	return (
		<nav
			className={cn(
				'no-scrollbar flex w-full flex-col items-start gap-0.5 overflow-y-auto px-3 pb-24 text-sm lg:px-4',
				// Mode rail (tablet): ikon saja di tengah, label disembunyikan lewat CSS —
				// bukan cabang render terpisah, supaya tak ada dua daftar menu lagi.
				compact &&
					'items-center px-2 lg:items-start lg:px-4 [&>a]:justify-center lg:[&>a]:justify-start [&>button]:justify-center lg:[&>button]:justify-start [&_span]:hidden lg:[&_span]:inline',
			)}
		>
			{/* --- SEKSI UTAMA --- */}
			<NavHeading>Menu Utama</NavHeading>
			<NavLink
				url={route('dashboard')}
				active={url.startsWith('/dashboard')}
				title="Beranda"
				icon={IconDashboard}
			/>
			{isCommandCenter && (
				<NavLink
					url={route('front.monitoring.map')}
					active={url.startsWith('/peta-pemantauan')}
					title="Peta Pemantauan"
					icon={IconMapSearch}
				/>
			)}

			{/* --- SEKSI OPERASIONAL --- */}
			{auth?.name && (
				<>
					<NavHeading>Operasional</NavHeading>
					<NavLink
						url={route('front.reports.create')}
						active={url.startsWith('/reports/create')}
						title="Lapor Darurat!"
						icon={IconFlame}
						// Warna merah hanya untuk state non-active; saat active biarkan
						// NavLink memakai text-destructive-foreground bawaannya (kalau
						// text-destructive ikut dikirim, ia menimpa warna teks active → teks tak terlihat).
						className={
							url.startsWith('/reports/create') ? undefined : 'text-destructive hover:bg-destructive/10'
						}
					/>
					<NavLink
						url={route('front.reports.index', { filter: 'mine' })}
						active={url.startsWith('/reports') && !url.startsWith('/reports/create')}
						title="Arsip & Riwayat"
						icon={IconHistory}
					/>
				</>
			)}

			{/* --- SEKSI FASILITAS PUBLIK --- */}
			<NavHeading>Fasilitas Publik</NavHeading>
			<NavLink
				url={route('front.pumps.index')}
				active={url.startsWith('/pumps')}
				title="Lokasi SKKL"
				icon={IconDroplet}
			/>
			<NavLink
				url={route('front.fire_stations.index')}
				active={url.startsWith('/fire-stations')}
				title="Pos Pemadam"
				icon={IconFiretruck}
			/>
			<NavLink
				url={route('front.hydrants.index')}
				active={url.startsWith('/hydrants')}
				title="Lokasi Hydrant"
				icon={IconFireHydrant}
			/>
			{isStaff && (
				<NavLink
					url={route('front.volunteers.index')}
					active={url.startsWith('/relawan')}
					title="Daftar Relawan"
					icon={IconHeartHandshake}
				/>
			)}

			{/* --- SEKSI ADMINISTRASI (KHUSUS ADMIN/SUPERADMIN) --- */}
			{isAdminOrSuperadmin && (
				<>
					<NavHeading>Administrasi</NavHeading>

					<NavLink
						url={route('admin.users.index')}
						active={url.startsWith('/admin/users')}
						title="Manajemen Pengguna"
						icon={IconUsersGroup}
					/>

					<NavLink
						url={route('admin.reports.index')}
						active={url.startsWith('/admin/reports')}
						title="Verifikasi Laporan"
						icon={IconClipboardPlus}
					/>

					<NavLink
						url={route('admin.hydrants.index')}
						active={url.startsWith('/admin/facilities') || url.startsWith('/admin/hydrants')}
						title="Manajemen Hydrant"
						icon={IconFireHydrant}
					/>

					<NavLink
						url={route('admin.pumps.index')}
						active={url.startsWith('/admin/pumps')}
						title="Manajemen Pompa"
						icon={IconEngine}
					/>

					<NavLink
						url={route('admin.fire-stations.index')}
						active={url.startsWith('/admin/fire-stations')}
						title="Manajemen Pos Pemadam"
						icon={IconFiretruck}
					/>

					{/* SEMENTARA DISEMBUNYIKAN (keputusan user 2026-06-29): menu "Kelola Armada"
                        disembunyikan dari sidebar selaras dengan panel Pengerahan Armada di Show.jsx.
                        Backend & route admin.units.* tetap utuh — buka kembali blok ini untuk menampilkan. */}
					{/* <NavLink
						url={route('admin.units.index')}
						active={url.startsWith('/admin/units')}
						title="Manajemen Armada"
						icon={IconTruck}
					/> */}

					{/* Pengumuman global + RBAC + Sistem = lintas-tenant, superadmin saja
                        (sesuai gating route admin.php). Admin wilayah tak melihat menu ini. */}
					{isSuperadmin && (
						<>
							<NavLink
								url={route('admin.announcements.index')}
								active={url.startsWith('/admin/announcements')}
								title="Pengumuman Sistem"
								icon={IconSpeakerphone}
							/>

							<NavHeading>Kontrol Akses</NavHeading>
							<NavLink
								url={route('admin.roles.index')}
								active={url.startsWith('/admin/roles')}
								title="Manajemen Role"
								icon={IconShieldLock}
							/>
							<NavLink
								url={route('admin.permissions.index')}
								active={url.startsWith('/admin/permissions')}
								title="Hak Akses"
								icon={IconKey}
							/>
							<NavLink
								url={route('admin.assign-permissions.index')}
								active={url.startsWith('/admin/assign-permissions')}
								title="Assign Hak Akses"
								icon={IconLockAccess}
							/>
							<NavLink
								url={route('admin.route-accesses.index')}
								active={url.startsWith('/admin/route-accesses')}
								title="Akses Route"
								icon={IconRoute}
							/>

							<NavHeading>Sistem</NavHeading>
							<NavLink
								url={route('admin.tenants.index')}
								active={url.startsWith('/admin/tenants')}
								title="Instansi / Kabupaten"
								icon={IconBuildingCommunity}
							/>
							<NavLink
								url={route('admin.settings.edit')}
								active={url.startsWith('/admin/settings')}
								title="Pengaturan Notifikasi"
								icon={IconSettings}
							/>
						</>
					)}
				</>
			)}

			{/* --- SEKSI BANTUAN & LEGAL (halaman publik, semua peran) --- */}
			<NavHeading>Bantuan & Legal</NavHeading>
			<NavLink
				url={route('info.help')}
				active={url.startsWith('/pusat-bantuan')}
				title="Pusat Bantuan"
				icon={IconLifebuoy}
			/>
			<NavLink
				url={route('info.terms')}
				active={url.startsWith('/syarat-ketentuan')}
				title="Syarat & Ketentuan"
				icon={IconGavel}
			/>
			<NavLink
				url={route('info.privacy')}
				active={url.startsWith('/kebijakan-privasi')}
				title="Kebijakan Privasi"
				icon={IconShieldLock}
			/>
			<NavLink
				url={route('info.about')}
				active={url.startsWith('/tentang')}
				title="Tentang Aplikasi"
				icon={IconInfoCircle}
			/>

			{/* --- SEKSI AKUN & SISTEM --- */}
			<NavHeading>Akun & Sistem</NavHeading>

			{auth?.user?.name || auth?.name ? (
				<>
					<NavLink
						url={route('profile.edit')}
						active={url.startsWith('/profile')}
						title="Profil Saya"
						icon={IconUser}
					/>
					<NavLink
						url={route('logout')}
						title="Keluar (Logout)"
						icon={IconLogout}
						method="post"
						as="button"
						// Lepas token FCM device ini saat logout agar HP berhenti menerima
						// notif sirine. globalThis aman saat SSR (window undefined di server).
						data={{ fcm_token: globalThis.__sisupitFcmToken }}
						className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
					/>
				</>
			) : (
				<>
					<NavLink url={route('login')} title="Masuk Akun" icon={IconLogin2} />
					<NavLink url={route('register')} title="Daftar Baru" icon={IconClipboardPlus} />
				</>
			)}
		</nav>
	);
}
