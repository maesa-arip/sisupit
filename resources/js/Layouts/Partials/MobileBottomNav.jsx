import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import {
	IconBuilding,
	IconClipboardPlus,
	IconDashboard,
	IconDroplet,
	IconFireHydrant,
	IconFiretruck,
	IconHeartHandshake,
	IconHistory,
	IconHome,
	IconKey,
	IconLockAccess,
	IconLogin2,
	IconLogout,
	IconMapSearch,
	IconMenu2,
	IconRoute,
	IconSettings,
	IconShieldLock,
	IconSpeakerphone,
	IconTruck,
	IconUser,
	IconUsersGroup,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

export default function MobileBottomNav({ auth }) {
	const { url } = usePage();

	// 🛠️ Detektor Role Sapu Jagat (Sinkronisasi dengan Sidebar)
	const rawRoles = auth?.roles || auth?.role || auth?.user?.roles || auth?.user?.role || [];
	const rolesArray = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
	const userRoles = rolesArray.map((r) => (typeof r === 'object' && r !== null ? r.name : r));

	const isAdmin = userRoles.includes('admin') || userRoles.includes('superadmin');
	const isSuperadmin = userRoles.includes('superadmin');
	// Daftar relawan = Pusat Komando saja (petugas/admin/superadmin), selaras gating route.
	const isStaff = userRoles.includes('petugas') || isAdmin;
	// Peta Pemantauan = Pusat Komando + pejabat pemantau (selaras gating route front.monitoring.map).
	const isCommandCenter = isStaff || userRoles.includes('pejabat');

	const [showFasilitas, setShowFasilitas] = useState(false);
	const fasilitasRef = useRef(null);

	const [showAdminMenu, setShowAdminMenu] = useState(false);
	const adminMenuRef = useRef(null);

	const isActive = (path) => url.startsWith(path);
	const isFasilitasActive =
		isActive('/fire-stations') ||
		isActive('/pumps') ||
		isActive('/hydrants') ||
		(isStaff && isActive('/relawan')) ||
		(isCommandCenter && isActive('/peta-pemantauan'));
	const isAdminActive = isActive('/admin');

	useEffect(() => {
		function handleClickOutside(event) {
			if (fasilitasRef.current && !fasilitasRef.current.contains(event.target)) setShowFasilitas(false);
			if (adminMenuRef.current && !adminMenuRef.current.contains(event.target)) setShowAdminMenu(false);
		}
		if (showFasilitas || showAdminMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [showFasilitas, showAdminMenu]);

	return (
		<>
			{(showFasilitas || showAdminMenu) && (
				<div
					className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20"
					onClick={() => {
						setShowFasilitas(false);
						setShowAdminMenu(false);
					}}
				></div>
			)}

			<div className="fixed bottom-0 left-0 z-50 h-16 w-full border-t border-border bg-card lg:hidden">
				<div className="mx-auto grid h-full max-w-md grid-cols-5 px-1">
					{/* 1. Beranda */}
					<NavItem
						href={route('dashboard')}
						icon={IconHome}
						label="Beranda"
						active={url === '/dashboard' || url === '/'}
					/>

					{/* 2. Fasilitas Publik */}
					<div
						className="relative flex h-full w-full flex-col items-center justify-center"
						ref={fasilitasRef}
					>
						{showFasilitas && (
							<div className="absolute bottom-[72px] left-1/2 z-50 flex w-44 -translate-x-1/2 flex-col rounded-xl border border-border bg-card p-1.5 shadow-lg duration-200 animate-in fade-in-20 slide-in-from-bottom-2">
								<FloatingLink
									href={route('front.pumps.index')}
									active={isActive('/pumps')}
									icon={IconDroplet}
									label="SKKL"
									colorClass="text-info"
									bgClass="bg-info/10 text-info"
									onClick={() => setShowFasilitas(false)}
								/>
								<FloatingLink
									href={route('front.fire_stations.index')}
									active={isActive('/fire-stations')}
									icon={IconFiretruck}
									label="Pos Damkar"
									colorClass="text-destructive"
									bgClass="bg-destructive/10 text-destructive"
									onClick={() => setShowFasilitas(false)}
								/>
								<FloatingLink
									href={route('front.hydrants.index')}
									active={isActive('/hydrants')}
									icon={IconFireHydrant}
									label="Lokasi Hydrant"
									colorClass="text-teal"
									bgClass="bg-teal/10 text-teal"
									onClick={() => setShowFasilitas(false)}
								/>
								{isStaff && (
									<FloatingLink
										href={route('front.volunteers.index')}
										active={isActive('/relawan')}
										icon={IconHeartHandshake}
										label="Daftar Relawan"
										colorClass="text-info"
										bgClass="bg-info/10 text-info"
										onClick={() => setShowFasilitas(false)}
									/>
								)}
								{isCommandCenter && (
									<FloatingLink
										href={route('front.monitoring.map')}
										active={isActive('/peta-pemantauan')}
										icon={IconMapSearch}
										label="Peta Pemantauan"
										colorClass="text-teal"
										bgClass="bg-teal/10 text-teal"
										onClick={() => setShowFasilitas(false)}
									/>
								)}
								<div className="absolute -bottom-[6px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 transform border-b border-r border-border bg-card"></div>
							</div>
						)}
						<button
							onClick={() => {
								setShowFasilitas(!showFasilitas);
								setShowAdminMenu(false);
							}}
							className={cn(
								'group z-50 flex h-full w-full flex-col items-center justify-center gap-1 outline-none transition-colors',
								isFasilitasActive || showFasilitas
									? 'text-destructive'
									: 'text-muted-foreground hover:text-destructive',
							)}
						>
							<div
								className={cn(
									'flex items-center justify-center rounded-full px-4 py-1.5 transition-colors',
									isFasilitasActive || showFasilitas
										? 'bg-destructive/10'
										: 'bg-transparent group-hover:bg-destructive/10',
								)}
							>
								<IconFiretruck
									className="h-7 w-7"
									stroke={isFasilitasActive || showFasilitas ? 2 : 1.5}
								/>
							</div>
							<span className="text-[10px] font-semibold tracking-wide">Fasilitas</span>
						</button>
					</div>

					{/* 3. SOS Spotlight */}
					<Link
						href={route('front.reports.create')}
						className={cn(
							'z-50 flex h-full w-full items-center justify-center outline-none transition-all',
							url.startsWith('/reports/create') ? 'scale-105' : 'hover:scale-105 active:scale-95',
						)}
					>
						<img
							src="/icon.png"
							alt="SOS"
							className={cn(
								'relative z-10 h-11 w-11 rounded-xl object-contain shadow-sm transition-all',
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

					{/* 5. Profil / Hub Kendali Admin Terpadu */}
					{isAdmin ? (
						<div
							className="relative flex h-full w-full flex-col items-center justify-center"
							ref={adminMenuRef}
						>
							{showAdminMenu && (
								<div className="no-scrollbar absolute bottom-[72px] right-2 z-50 flex max-h-[70vh] w-52 flex-col overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg duration-200 animate-in fade-in-20 slide-in-from-bottom-2">
									<div className="mb-1 px-2.5 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
										Administrasi
									</div>

									{/* MENGARAHKAN HAK AKSES DRIVER KE RUTENAMA BACKEND YANG VALID */}
									<FloatingLink
										href={route('dashboard')}
										active={url === '/dashboard'}
										icon={IconDashboard}
										label="Dashboard Admin"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/>
									<FloatingLink
										href={route('admin.users.index')}
										active={url.startsWith('/admin/users')}
										icon={IconUsersGroup}
										label="Kelola Pengguna"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/>
									<FloatingLink
										href={route('admin.hydrants.index')}
										active={
											url.startsWith('/admin/facilities') || url.startsWith('/admin/hydrants')
										}
										icon={IconBuilding}
										label="Kelola Fasilitas"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/>
									<FloatingLink
										href={route('admin.reports.index')}
										active={url.startsWith('/admin/reports')}
										icon={IconClipboardPlus}
										label="Verifikasi Laporan"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/>
									{/* SEMENTARA DISEMBUNYIKAN (keputusan user 2026-06-29): menu "Kelola Armada"
										disembunyikan dari bottom-nav selaras dengan panel Pengerahan Armada di Show.jsx.
										Backend & route admin.units.* tetap utuh — buka kembali blok ini untuk menampilkan. */}
									{/* <FloatingLink
										href={route('admin.units.index')}
										active={url.startsWith('/admin/units')}
										icon={IconTruck}
										label="Kelola Armada"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/> */}

									{/* Pengumuman global + RBAC + Sistem = lintas-tenant, superadmin saja
										(sesuai gating route admin.php). Admin wilayah tak melihat menu ini. */}
									{isSuperadmin && (
										<>
											<FloatingLink
												href={route('admin.announcements.index')}
												active={url.startsWith('/admin/announcements')}
												icon={IconSpeakerphone}
												label="Pengumuman Sistem"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>
											<div className="mb-1 mt-2 px-2.5 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
												Kontrol Akses
											</div>
											<FloatingLink
												href={route('admin.roles.index')}
												active={url.startsWith('/admin/roles')}
												icon={IconShieldLock}
												label="Manajemen Role"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>
											<FloatingLink
												href={route('admin.permissions.index')}
												active={url.startsWith('/admin/permissions')}
												icon={IconKey}
												label="Hak Akses"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>
											<FloatingLink
												href={route('admin.assign-permissions.index')}
												active={url.startsWith('/admin/assign-permissions')}
												icon={IconLockAccess}
												label="Assign Hak Akses"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>
											<FloatingLink
												href={route('admin.route-accesses.index')}
												active={url.startsWith('/admin/route-accesses')}
												icon={IconRoute}
												label="Akses Route"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>

											<div className="mb-1 mt-2 px-2.5 py-1.5 text-[10px] font-bold uppercase text-muted-foreground">
												Sistem
											</div>
											<FloatingLink
												href={route('admin.settings.edit')}
												active={url.startsWith('/admin/settings')}
												icon={IconSettings}
												label="Pengaturan Notifikasi"
												colorClass="text-muted-foreground"
												bgClass="bg-destructive/10 text-destructive"
												onClick={() => setShowAdminMenu(false)}
											/>
										</>
									)}

									<div className="my-1.5 h-px w-full bg-border"></div>
									<FloatingLink
										href={route('profile.edit')}
										active={isActive('/profile')}
										icon={IconUser}
										label="Profil Saya"
										colorClass="text-muted-foreground"
										bgClass="bg-destructive/10 text-destructive"
										onClick={() => setShowAdminMenu(false)}
									/>

									<Link
										href={route('logout')}
										method="post"
										as="button"
										data={{ fcm_token: globalThis.__sisupitFcmToken }}
										className="mt-1 flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
									>
										<IconLogout size={18} /> Keluar
									</Link>
									<div className="absolute -bottom-[6px] right-[22px] h-3 w-3 rotate-45 transform border-b border-r border-border bg-card"></div>
								</div>
							)}
							<button
								onClick={() => {
									setShowAdminMenu(!showAdminMenu);
									setShowFasilitas(false);
								}}
								className={cn(
									'group z-50 flex h-full w-full flex-col items-center justify-center gap-1 outline-none transition-colors',
									isAdminActive || showAdminMenu
										? 'text-destructive'
										: 'text-muted-foreground hover:text-destructive',
								)}
							>
								<div
									className={cn(
										'flex items-center justify-center rounded-full px-4 py-1.5 transition-colors',
										isAdminActive || showAdminMenu
											? 'bg-destructive/10'
											: 'bg-transparent group-hover:bg-destructive/10',
									)}
								>
									<IconMenu2 className="h-7 w-7" stroke={isAdminActive || showAdminMenu ? 2 : 1.5} />
								</div>
								<span className="text-[10px] font-semibold tracking-wide">Menu</span>
							</button>
						</div>
					) : (
						<NavItem
							icon={auth?.name || auth?.user?.name ? IconUser : IconLogin2}
							label={auth?.name || auth?.user?.name ? 'Profil' : 'Masuk'}
							active={isActive('/profile')}
							href={auth?.name || auth?.user?.name ? route('profile.edit') : route('login')}
						/>
					)}
				</div>
			</div>
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
			<div
				className={cn(
					'flex items-center justify-center rounded-full px-4 py-1.5 transition-colors',
					active ? 'bg-destructive/10' : 'bg-transparent group-hover:bg-destructive/10',
				)}
			>
				<Icon className="h-7 w-7" stroke={active ? 2 : 1.5} />
			</div>
			<span className="text-[10px] font-semibold tracking-wide">{label}</span>
		</Link>
	);
}

function FloatingLink({ href, active, icon: Icon, label, colorClass, bgClass, onClick }) {
	return (
		<Link
			href={href}
			onClick={onClick}
			className={cn(
				'mt-1 flex items-center gap-2.5 rounded-lg p-2.5 text-sm font-medium transition-colors first:mt-0',
				active ? bgClass : 'text-foreground hover:bg-accent',
			)}
		>
			<Icon size={18} className={active ? '' : colorClass} />
			<span className="truncate">{label}</span>
		</Link>
	);
}
