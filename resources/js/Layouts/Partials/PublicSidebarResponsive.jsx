import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import NavLinkResponsive from '@/Components/NavLinkResponsive';
import { Button } from '@/Components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/Components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
	IconAlertCircle,
	IconBook,
	IconBooks,
	IconBuilding,
	IconBuildingCommunity,
	IconCategory,
	IconChartDots2,
	IconCircleKey,
	IconCreditCardPay,
	IconCreditCardRefund,
	IconDashboard,
	IconKeyframe,
	IconLayoutKanban,
	IconLayoutSidebar,
	IconLogout,
	IconMoneybag,
	IconRoute,
	IconSettings,
	IconSettingsExclamation,
	IconStack3,
	IconUser,
	IconUsersGroup,
	IconVersions,
} from '@tabler/icons-react';
export default function PublicSidebarResponsive({ url }) {
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
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Sisupit</div>
					<NavLink
						url={route('front.companies.index')}
						active={url.startsWith('/companies')}
						title="Daftar Relawan"
						icon={IconBuilding}
					/>
					<NavLink
						url={route('front.settings.index')}
						active={url.startsWith('/settings')}
						title="Lihat Lokasi APAR"
						icon={IconSettings}
					/>
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers2')}
						title="Lihat Lokasi Kantor"
						icon={IconCategory}
					/>
				</>

			

			<div className="px-3 py-2 text-sm font-semibold text-foreground">Lainnya</div>

			<NavLinkResponsive url={route('profile.edit')} active={url.startsWith('/profile')} title="Profile" icon={IconUser} />
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
