import HeaderTitle from '@/Components/HeaderTitle';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage, formatToRupiah } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconArrowsDownUp, IconCategory, IconCreditCardRefund, IconEye, IconPencil, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import Approve from './Approve';

export default function Index(props) {
	const { data: return_books, meta } = props.return_books;
	const [params, setParams] = useState(props.state);
	// console.log(params);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('admin.return-books.index'),
		values: params,
		only: ['return_books'],
	});
// console.log(return_books)
	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCreditCardRefund}
				/>
			</div>
			<Card>
				<CardHeader>
					<div className="flex flex-col w-full gap-4 lg:flex-row lg:items-center">
						<Input
							className="w-full sm:w-1/4"
							placeholder="Search"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="w-full sm:w-24">
								<SelectValue placeholder="load" />
							</SelectTrigger>
							<SelectContent>
								{[10, 25, 50, 75, 100].map((number, index) => (
									<SelectItem key={index} value={number}>
										{number}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button variant="red" onClick={() => setParams(props.state)} size="sm">
							<IconRefresh className="size-4" /> Bersihkan
						</Button>
					</div>
				</CardHeader>
				<CardContent className="px-0 py-0 [&-td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('id')}
									>
										#{' '}
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('return_book_code')}
									>
										Kode Pengembalian
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('loan_code')}
									>
										Kode Peminjaman
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('user_id')}
									>
										Nama
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('book_id')}
									>
										Buku
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('status')}
									>
										Status
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('loan_date')}
									>
										Tanggal Peminjaman
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('due_date')}
									>
										Batas Pengembalian
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('return_date')}
									>
										Tanggal Pengembalian
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									Denda
								</TableHead>
								<TableHead>
									Kondisi
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('created_at')}
									>
										Dibuat pada
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{return_books.map((return_book, index) => (
								<TableRow key={index}>
									<TableCell>{index + 1 + (meta.current_page - 1) * meta.per_page}</TableCell>
									<TableCell>{return_book.return_book_code}</TableCell>
									<TableCell>{return_book.loan.loan_code}</TableCell>
									<TableCell>{return_book.user.name}</TableCell>
									<TableCell>{return_book.book.title}</TableCell>
									<TableCell>{return_book.status}</TableCell>
									<TableCell>{return_book.loan.loan_date}</TableCell>
									<TableCell>{return_book.loan.due_date}</TableCell>
									<TableCell>{return_book.return_date}</TableCell>
									<TableCell className='text-red-500'>{formatToRupiah(return_book.fine)}</TableCell>
									<TableCell>{return_book.return_book_check}</TableCell>
									<TableCell>{return_book.created_at}</TableCell>
									<TableCell>
										<div className='flex items-center gap-x-1'>
											{return_book.fine && (
												<Button variant='blue' size='sm' asChild>
													<Link href={route('admin.fines.create',[return_book])}>
														<IconEye size='4'/>
													</Link>
												</Button>
											)}
											{return_book.status === 'Pengecekan' && (
												<Approve 
													conditions={props.conditions}
													action={route('admin.return-books.approve',[return_book])}
												/>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
				<CardFooter className="flex flex-col items-center justify-between w-full py-2 border-t lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menamplikan <span className="font-medium text-orange-500">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Pengembalian
					</p>
					<div className="overflow-x-auto">
						{meta.has_pages && (
							<Pagination>
								<PaginationContent className="flex justify-center fles-wrap lg:justify-end">
									{meta.links.map((link, index) => (
										<PaginationItem key={index} className="mx-1 mb-1 lg:mb-0">
											<PaginationLink href={link.url} isActive={link.active}>
												{link.label}
											</PaginationLink>
										</PaginationItem>
									))}
								</PaginationContent>
							</Pagination>
						)}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
