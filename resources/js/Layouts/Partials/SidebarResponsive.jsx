import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import NavLinkResponsive from '@/Components/NavLinkResponsive';
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/Components/ui/sheet';
import { router } from '@inertiajs/react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
	IconBuilding,
	IconCategory,
	IconDashboard,
	IconLayoutSidebar,
	IconLogout,
	IconSettings,
	IconUser,
} from '@tabler/icons-react';
export default function SidebarResponsive({ url, auth }) {
	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="outline" size="icon" className="shrink-0 md:hidden">
					<IconLayoutSidebar className="size-5" />
				</Button>
			</SheetTrigger>
			<SheetContent side="left" className="flex flex-col max-h-screen overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						<VisuallyHidden.Root>Sidebar Responsive</VisuallyHidden.Root>
					</SheetTitle>
					<SheetDescription>
						<VisuallyHidden.Root>Sidebar Responsive</VisuallyHidden.Root>
					</SheetDescription>
				</SheetHeader>
				{/* Menu sidebar responsive */}
				<nav className="grid gap-6 text-lg font-medium">
					<ApplicationLogo />
					<nav className="grid items-start text-sm font-semibold lg:px-4">
						<>
							<div className="px-3 py-2 text-sm font-semibold text-foreground">Dashboard</div>
							<NavLinkResponsive
								url={route('dashboard')}
								active={url.startsWith('/dashboard')}
								title="Dashboard"
								icon={IconDashboard}
							/>
						</>
						<div className="px-3 py-2 text-sm font-semibold text-foreground">Sisupit</div>
						{/* <NavLink
						url={route('front.companies.index')}
						active={url.startsWith('/companies')}
						title="Daftar Sebagai Relawan"
						icon={IconBuilding}
					/> */}
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="ghost" className="justify-start w-full gap-2 text-left">
									<IconBuilding className="w-4 h-4" />
									Daftar Sebagai Relawan
								</Button>
							</DialogTrigger>
							<DialogContent className="max-w-md">
								<DialogHeader>
									<DialogTitle>Konfirmasi Pendaftaran Relawan</DialogTitle>
									<DialogDescription>
										Dengan mendaftar sebagai relawan, Anda akan dapat membantu menanggapi laporan
										kejadian yang masuk. Pastikan informasi profil Anda sudah lengkap sebelum
										melanjutkan.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter className="gap-2 sm:justify-end">
									<Button
										variant="outline"
									onClick={() => router.put(route('admin.relawan.update',auth))}
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
							<DialogDescription>
								Fitur ini sedang diproses, mohon untuk bersabar.
							</DialogDescription>
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
							<DialogDescription>
								Fitur ini sedang diproses, mohon untuk bersabar.
							</DialogDescription>
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

						<div className="px-3 py-2 text-sm font-semibold text-foreground">Lainnya</div>

						<NavLinkResponsive
							url={route('profile.edit')}
							active={url.startsWith('/profile')}
							title="Profile"
							icon={IconUser}
						/>
						<NavLinkResponsive
							url={route('logout')}
							title="Logout"
							icon={IconLogout}
							method="post"
							as="button"
							className="w-full"
						/>
					</nav>
				</nav>
			</SheetContent>
		</Sheet>
	);
}
