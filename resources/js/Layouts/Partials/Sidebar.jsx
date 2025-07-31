import NavLink from '@/Components/NavLink';
import { Button } from '@/Components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/Components/ui/dialog';
import { flashMessage } from '@/lib/utils';
import { router } from '@inertiajs/react';
import {
	IconAlertCircle,
	IconBuilding,
	IconClipboardPlus,
	IconDashboard,
	IconLogin2,
	IconLogout,
	IconUser,
} from '@tabler/icons-react';
import { useState } from 'react';

export default function Sidebar({ url, auth }) {
	const [open, setOpen] = useState(false);
	return (
		<nav className="grid items-start px-2 text-sm font-semibold lg:px-4">
			{/* {auth?.role.some((role) => ['petugas', 'relawan', 'member'].includes(role)) && ( */}
			<>
				<div className="px-3 py-2 text-sm font-semibold text-foreground">Dashboard</div>
				<NavLink
					url={route('dashboard')}
					active={url.startsWith('/dashboard')}
					title="Dashboard"
					icon={IconDashboard}
				/>
				<div className="px-3 py-2 text-sm font-semibold text-foreground">Sisupit</div>
				{/* <NavLink
						url={route('front.companies.index')}
						active={url.startsWith('/companies')}
						title="Daftar Sebagai Relawan"
						icon={IconBuilding}
					/> */}
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button
							onClick={() => setOpen(true)}
							variant="ghost"
							className="justify-start w-full gap-2 text-left"
						>
							<IconBuilding className="w-4 h-4" />
							Daftar Sebagai Relawan
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Konfirmasi Pendaftaran Relawan</DialogTitle>
							<DialogDescription>
								Dengan mendaftar sebagai relawan, Anda akan dapat membantu menanggapi laporan kejadian
								yang masuk. Pastikan informasi profil Anda sudah lengkap sebelum melanjutkan.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2 sm:justify-end">
							<Button
								variant="outline"
								
								onClick={() =>
									router.put(
										route('admin.relawan.update', { user: auth.id }),
										{},
										{
											onSuccess: () => {
												setOpen(false); // Tutup dialog
												const flash = flashMessage(success);
																		if (flash) toast[flash.type](flash.message);
												// Tidak perlu router.visit, biarkan backend redirect agar flash muncul
											},
											onError: () => {
												// Optionally tangani error jika mau
												// toast.error("Pendaftaran gagal.");
											},
										},
									)
								}
							>
								Ya, Daftarkan Saya
							</Button>
							<DialogTrigger asChild>
								<Button variant="ghost">Batal</Button>
							</DialogTrigger>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" className="justify-start w-full gap-2 text-left">
							<IconBuilding className="w-4 h-4" />
							Lihat Lokasi Pompa Supit
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Coming Soon</DialogTitle>
							<DialogDescription>Fitur ini sedang diproses, mohon untuk bersabar.</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2 sm:justify-end">
							<DialogTrigger asChild>
								<Button variant="ghost">Batal</Button>
							</DialogTrigger>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				<Dialog>
					<DialogTrigger asChild>
						<Button variant="ghost" className="justify-start w-full gap-2 text-left">
							<IconBuilding className="w-4 h-4" />
							Lihat Lokasi Pos Damkar Terdekat
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle>Coming Soon</DialogTitle>
							<DialogDescription>Fitur ini sedang diproses, mohon untuk bersabar.</DialogDescription>
						</DialogHeader>
						<DialogFooter className="gap-2 sm:justify-end">
							<DialogTrigger asChild>
								<Button variant="ghost">Batal</Button>
							</DialogTrigger>
						</DialogFooter>
					</DialogContent>
				</Dialog>
				{/* <NavLink
					url={route('front.settings.index')}
					active={url.startsWith('/settings')}
					title="Lihat Lokasi Pompa Supit"
					icon={IconSettings}
				/>
				<NavLink
					url={route('cashiers')}
					active={url.startsWith('/cashiers2')}
					title="Lihat Lokasi Pos Damkar Terdekat"
					icon={IconCategory}
				/> */}
			</>
			{/* )} */}

			{/* {auth.role.some((role) => ['admin'].includes(role)) && (
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Statistik</div>
					<NavLink
						url={route('admin.loan-statistics.index')}
						active={url.startsWith('/admin/loan-statistics')}
						title="Statistik Peminjaman"
						icon={IconChartDots2}
					/>
					<NavLink
						url={route('admin.fine-reports.index')}
						active={url.startsWith('/admin/fine-reports')}
						title="Laporan Denda"
						icon={IconMoneybag}
					/>
					<NavLink
						url={route('admin.book-stock-reports.index')}
						active={url.startsWith('/admin/book-stock-reports')}
						title="Laporan Stok Buku"
						icon={IconStack3}
					/>
				</>
			)}

			{auth.role.some((role) => ['admin', 'operator'].includes(role)) && (
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Master</div>
					<NavLink
						url={route('admin.categories.index')}
						active={url.startsWith('/admin/categories')}
						title="Kategori"
						icon={IconCategory}
					/>
					<NavLink
						url={route('admin.publishers.index')}
						active={url.startsWith('/admin/publishers')}
						title="Penerbit"
						icon={IconBuildingCommunity}
					/>
					<NavLink
						url={route('admin.books.index')}
						active={url.startsWith('/admin/books')}
						title="Buku"
						icon={IconBooks}
					/>
					<NavLink
						url={route('admin.users.index')}
						active={url.startsWith('/admin/users')}
						title="Pengguna"
						icon={IconUsersGroup}
					/>
					<NavLink
						url={route('admin.fine-settings.create')}
						active={url.startsWith('/admin/fine-settings')}
						title="Pengaturan Denda"
						icon={IconSettingsExclamation}
					/>
				</>
			)}

			{auth.role.some((role) => ['admin'].includes(role)) && (
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Peran dan Izin</div>
					<NavLink
						url={route('admin.roles.index')}
						active={url.startsWith('/admin/roles')}
						title="Peran"
						icon={IconCircleKey}
					/>
					<NavLink
						url={route('admin.permissions.index')}
						active={url.startsWith('/admin/permissions')}
						title="Izin"
						icon={IconVersions}
					/>
					<NavLink
						url={route('admin.assign-permissions.index')}
						active={url.startsWith('/admin/assign-permissions')}
						title="Tetapkan Izin"
						icon={IconKeyframe}
					/>
					<NavLink
						url={route('admin.assign-users.index')}
						active={url.startsWith('/admin/assign-users')}
						title="Tetapkan Peran"
						icon={IconLayoutKanban}
					/>
					<NavLink
						url={route('admin.route-accesses.index')}
						active={url.startsWith('/admin/route-accesses')}
						title="Akses Rute"
						icon={IconRoute}
					/>
				</>
			)}

			{auth.role.some((role) => ['admin', 'operator'].includes(role)) && (
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Transaksi</div>
					<NavLink
						url={route('admin.loans.index')}
						active={url.startsWith('/admin/loans')}
						title="Peminjaman"
						icon={IconCreditCardPay}
					/>
					<NavLink
						url={route('admin.return-books.index')}
						active={url.startsWith('/admin/return-books')}
						title="Pengembalian"
						icon={IconCreditCardRefund}
					/>
				</>
			)}
			{auth.role.some((role) => ['member'].includes(role)) && (
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Transaksi Member</div>
					<NavLink
						url={route('front.books.index')}
						active={url.startsWith('/books')}
						title="Buku"
						icon={IconBook}
					/>
					<NavLink
						url={route('front.categories.index')}
						active={url.startsWith('/categories')}
						title="Kategori"
						icon={IconCategory}
					/>
					<NavLink
						url={route('front.loans.index')}
						active={url.startsWith('/loans')}
						title="Peminjaman"
						icon={IconCreditCardPay}
					/>
					<NavLink
						url={route('front.return-books.index')}
						active={url.startsWith('/return-books')}
						title="Pengembalian"
						icon={IconCreditCardRefund}
					/>
					<NavLink
						url={route('front.fines.index')}
						active={url.startsWith('/fines')}
						title="Denda"
						icon={IconMoneybag}
					/>
				</>
			)} */}

			<div className="px-3 py-2 text-sm font-semibold text-foreground">Lainnya</div>
			{auth?.role.some((role) => ['admin', 'operator'].includes(role)) && (
				<NavLink
					url={route('admin.announcements.index')}
					active={url.startsWith('/admin/announcements')}
					title="Pengumuman"
					icon={IconAlertCircle}
				/>
			)}
			{auth?.name ? (
				<>
					<NavLink
						url={route('profile.edit')}
						active={url.startsWith('/profile')}
						title="Profile"
						icon={IconUser}
					/>
					<NavLink
						url={route('logout')}
						title="Logout"
						icon={IconLogout}
						method="post"
						as="button"
						className="w-full"
					/>
				</>
			) : (
				<>
					<NavLink url={route('login')} title="Masuk" icon={IconLogin2} />
					<NavLink url={route('register')} title="Daftar" icon={IconClipboardPlus} />
				</>
			)}
		</nav>
	);
}
