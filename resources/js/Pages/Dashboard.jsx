import HeaderTitle from '@/Components/HeaderTitle';
import IncompleteProfileDialog from '@/Components/IncompleteProfileDialog';
import InstallPWAButton from '@/Components/InstallPWAButton';
import ReportCard from '@/Components/ReportCard';
import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { IconBell, IconDashboard } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function Dashboard(props) {
const auth = props.auth.user;
const [showIncompleteDialog, setShowIncompleteDialog] = useState(false);

	useEffect(() => {
		if (!auth.phone) {
			setShowIncompleteDialog(true);
		}
	}, [auth]);
	const handleConfirm = () => {
		router.visit(route('profile.edit'));
	};
	const handleHelpClick = (id) => {
		console.log('Relawan akan bantu laporan ID:', id);
		// Panggil API, modal, dsb.
	};
	// console.log(props.page_data.reports)

	return (
		<div className="flex flex-col w-full pb-32 space-y-4">
			<div className="flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconDashboard}
				></HeaderTitle>
			</div>
			<IncompleteProfileDialog open={showIncompleteDialog} onConfirm={handleConfirm} />
			<Button
				variant="red"
				className="relative flex items-center justify-center w-56 h-56 mx-auto overflow-hidden text-lg font-extrabold text-white transition-transform duration-300 rounded-full shadow-2xl animate-pulse bg-gradient-to-br from-red-500 to-red-700 ring-4 ring-red-400/40 hover:scale-105"
				asChild
			>
				<Link href={route('front.reports.create')}>
					{/* Icon besar transparan sebagai background */}
					<IconBell
						className="absolute text-white/30"
						style={{
							width: '200px',
							height: '200px',
						}}
					/>

					{/* Teks di atas icon */}
					<span className="relative z-10 leading-tight tracking-wide text-center uppercase">
						Laporkan <br /> Kejadian
					</span>
				</Link>
			</Button>
			<hr className="my-6" />
			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Laporan Terbaru</h2>
				<p className="text-sm text-muted-foreground">Laporan kejadian yang membutuhkan bantuan</p>

				{props.page_data.reports.length === 0 ? (
					<p className="italic text-muted-foreground">Belum ada laporan aktif saat ini.</p>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{props.page_data.reports.map((report) => (
							<ReportCard key={report.id} report={report} onHelpClick={handleHelpClick} />
						))}
					</div>
				)}
			</div>

			<hr className="my-6" />
			{/* {auth.role.some((role) => ['petugas', 'relawan'].includes(role)) && (
				<div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
					<CardStat
						data={{
							title: 'Total Laporan',
							icon: IconBooks,
							background: 'text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_books}</div>
					</CardStat>
					<CardStat
						data={{
							title: 'Total Relawan',
							icon: IconUsersGroup,
							background: 'text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_users}</div>
					</CardStat>
					<CardStat
						data={{
							title: 'Total Kejadian',
							icon: IconCreditCardPay,
							background: 'text-white bg-gradient-to-r from-rose-400 via-rose-500 to-rose-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_loans}</div>
					</CardStat>
					<CardStat
						data={{
							title: 'Total Petugas',
							icon: IconCreditCardRefund,
							background: 'text-white bg-gradient-to-r from-lime-400 via-lime-500 to-lime-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_returns}</div>
					</CardStat>
				</div>
			)}
			{auth.role.some((role) => ['member'].includes(role)) && (
				<div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
					<CardStat
						data={{
							title: 'Total Peminjaman',
							icon: IconCreditCardPay,
							background: 'text-white bg-gradient-to-r from-blue-400 via-blue-500 to-blue-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_loans}</div>
					</CardStat>
					<CardStat
						data={{
							title: 'Total Pengembalian',
							icon: IconCreditCardRefund,
							background: 'text-white bg-gradient-to-r from-purple-400 via-purple-500 to-purple-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{props.page_data.total_returns}</div>
					</CardStat>
					<CardStat
						data={{
							title: 'Total Denda',
							icon: IconMoneybag,
							background: 'text-white bg-gradient-to-r from-rose-400 via-rose-500 to-rose-500',
							iconClassName: 'text-white',
						}}
					>
						<div className="text-2xl font bold">{formatToRupiah(props.page_data.total_fines)}</div>
					</CardStat>
				</div>
			)} */}
			{/* <ChartCustom chartData={props.page_data.transactionChart} /> */}
			<div className="flex flex-col justify-between w-full gap-2 lg:flex-row">
				{/* <Card className="w-full lg:w-1/2">
					<CardHeader>
						<div className="flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center">
							<div className="flex flex-col gap-y-2">
								<CardTitle>Transaksi Peminjaman</CardTitle>
								<CardDescription>Anda dapat melihat 5 transaksi terakhir peminjaman</CardDescription>
							</div>
							<Button variant="orange" asChild>
								{auth.role.some((role) => ['petugas', 'relawan'].includes(role)) ? (
									<Link href={route('admin.loans.index')}>
										Lihat Semua
										<IconArrowUpRight className="size-4" />
									</Link>
								) : (
									<Link href="#">
										Lihat Semua
										<IconArrowUpRight className="size-4" />
									</Link>
								)}
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0 [&_td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Kode Peminjaman</TableHead>
									<TableHead>Buku</TableHead>
									<TableHead>Member</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{props.page_data.loans.map((loan, index) => (
									<TableRow key={index}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{loan.loan_code}</TableCell>
										<TableCell>{loan.book.title}</TableCell>
										<TableCell>{loan.user.name}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card> */}
				{/* <Card className="w-full lg:w-1/2">
					<CardHeader>
						<div className="flex flex-col justify-between gap-y-4 lg:flex-row lg:items-center">
							<div className="flex flex-col gap-y-2">
								<CardTitle>Transaksi Pengembalian</CardTitle>
								<CardDescription>Anda dapat melihat 5 transaksi terakhir pengembalian</CardDescription>
							</div>
							<Button variant="orange" asChild>
								{auth.role.some((role) => ['petugas', 'relawan'].includes(role)) ? (
									<Link href={route('admin.return-books.index')}>
										Lihat Semua
										<IconArrowUpRight className="size-4" />
									</Link>
								) : (
									<Link href="#">
										Lihat Semua
										<IconArrowUpRight className="size-4" />
									</Link>
								)}
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0 [&_td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
						<Table className="w-full">
							<TableHeader>
								<TableRow>
									<TableHead>#</TableHead>
									<TableHead>Kode Pengembalian</TableHead>
									<TableHead>Buku</TableHead>
									<TableHead>Member</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{props.page_data.return_books.map((return_book, index) => (
									<TableRow key={index}>
										<TableCell>{index + 1}</TableCell>
										<TableCell>{return_book.return_book_code}</TableCell>
										<TableCell>{return_book.book.title}</TableCell>
										<TableCell>{return_book.user.name}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card> */}
			</div>
			<div className="mt-6">
				<InstallPWAButton />
			</div>
		</div>
	);
}

Dashboard.layout = (page) => <AppLayout children={page} title={'Dashboard'} />;
