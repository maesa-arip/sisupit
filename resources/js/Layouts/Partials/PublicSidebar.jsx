import NavLink from '@/Components/NavLink';
import {
	IconAlertCircle,
	IconBook,
	IconBooks,
	IconBrandProducthunt,
	IconBrandUnity,
	IconBuilding,
	IconBuildingCommunity,
	IconCash,
	IconCategory,
	IconChartDots2,
	IconCircleKey,
	IconCreditCardPay,
	IconCreditCardRefund,
	IconDashboard,
	IconKeyframe,
	IconLayoutKanban,
	IconLayoutNavbarExpand,
	IconLogout,
	IconMoneybag,
	IconRoute,
	IconSettings,
	IconSettingsExclamation,
	IconStack3,
	IconTable,
	IconUser,
	IconUsersGroup,
	IconVersions,
} from '@tabler/icons-react';

export default function PublicSidebar({ url }) {
	return (
		<nav className="grid items-start px-2 text-sm font-semibold lg:px-4">
			
				<>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Dashboard</div>
					<NavLink
						url={route('dashboard')}
						active={url.startsWith('/dashboard')}
						title="Dashboard"
						icon={IconDashboard}
					/>
					<div className="px-3 py-2 text-sm font-semibold text-foreground">Sisupit</div>
					<NavLink
						url={route('front.companies.index')}
						active={url.startsWith('/companies')}
						title="Perusahaan"
						icon={IconBuilding}
					/>
					<NavLink
						url={route('front.settings.index')}
						active={url.startsWith('/settings')}
						title="Pengaturan"
						icon={IconSettings}
					/>
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers2')}
						title="Kategori"
						icon={IconCategory}
					/>
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers2')}
						title="Unit"
						icon={IconBrandUnity}
					/>
					
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers2')}
						title="Area"
						icon={IconLayoutNavbarExpand}
					/>
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers2')}
						title="Meja"
						icon={IconTable}
					/>
					<NavLink
						url={route('front.products.index')}
						active={url.startsWith('/products')}
						title="Produk"
						icon={IconBrandProducthunt}
					/>
					<NavLink
						url={route('cashiers')}
						active={url.startsWith('/cashiers')}
						title="POS"
						icon={IconCash}
					/>
				</>
			

			

			<div className="px-3 py-2 text-sm font-semibold text-foreground">Lainnya</div>
			<NavLink url={route('profile.edit')} active={url.startsWith('/profile')} title="Profile" icon={IconUser} />
			<NavLink
				url={route('logout')}
				title="Logout"
				icon={IconLogout}
				method="post"
				as="button"
				className="w-full"
			/>
		</nav>
	);
}
