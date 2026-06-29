import NavLink from '@/Components/NavLink';
import {
	IconClipboardPlus,
	IconDashboard,
	IconDroplet,
	IconEngine,
	IconFireHydrant,
	IconFiretruck,
	IconFlame,
	IconHeartHandshake,
	IconHistory,
	IconKey,
	IconLockAccess,
	IconLogin2,
	IconLogout,
	IconMapPin,
	IconRoute,
	IconSettings,
	IconShieldLock,
	IconSpeakerphone,
	IconTruck,
	IconUser,
	IconUsersGroup,
} from '@tabler/icons-react';

export default function Sidebar({ url, auth }) {
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

	// Komponen Header Seksi Menu (Tipografi Taktis/Militeristik)
	const NavHeading = ({ children }) => (
		<div className="mb-1 mt-6 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground first:mt-2">
			{children}
		</div>
	);

	return (
		<nav className="no-scrollbar flex w-full flex-col items-start gap-0.5 overflow-y-auto px-3 pb-24 text-sm lg:px-4">
			{/* --- SEKSI UTAMA --- */}
			<NavHeading>Menu Utama</NavHeading>
			<NavLink
				url={route('dashboard')}
				active={url.startsWith('/dashboard')}
				title="Beranda"
				icon={IconDashboard}
			/>
			<NavLink url={'/'} active={url === '/'} title="Pusat Bantuan" icon={IconMapPin} />

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
								url={route('admin.settings.edit')}
								active={url.startsWith('/admin/settings')}
								title="Pengaturan Notifikasi"
								icon={IconSettings}
							/>
						</>
					)}
				</>
			)}

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
