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
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import {
	IconArrowsDownUp,
	IconBuildingCommunity,
	IconPencil,
	IconPlus,
	IconRefresh,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Index(props) {
	const { data: publishers, meta } = props.publishers;
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
		route: route('admin.publishers.index'),
		values: params,
		only: ['publishers'],
	});

	return (
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBuildingCommunity}
				/>
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.publishers.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>
			<Card>
				<CardHeader>
					<div className="flex flex-col w-full gap-4 lg:flex-row lg:items-center">
						<Input
							className="w-full sm:w-1/4"
							placeholder="Search"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value, page: 1 }))}
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
										onClick={() => onSortable('name')}
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
										onClick={() => onSortable('address')}
									>
										Alamat
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('email')}
									>
										Email
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
								</TableHead>
								<TableHead>
									<Button
										variant="ghost"
										className="inline-flex group"
										onClick={() => onSortable('phone')}
									>
										Nomor Handphone
										<span className="flex-none ml-2 rounded text-muted-foreground">
											<IconArrowsDownUp className="size-4 text-muted-foreground" />
										</span>
									</Button>
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
							{publishers.map((publisher, index) => (
								<TableRow key={index}>
									<TableCell>{index + 1 + (meta.current_page - 1) * meta.per_page}</TableCell>
									<TableCell>{publisher.name}</TableCell>
									<TableCell>{publisher.address}</TableCell>
									<TableCell>{publisher.email}</TableCell>
									<TableCell>{publisher.phone}</TableCell>
									<TableCell>{publisher.created_at}</TableCell>
									<TableCell>
										<div className="flex items-center gap-x-1">
											<Button variant="blue" size="sm" asChild>
												<Link href={route('admin.publishers.edit', [publisher])}>
													<IconPencil className="size-4" />
												</Link>
											</Button>
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button variant="red" size="sm">
														<IconTrash size="4" />
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Apakah anda benar benar yakin ?
														</AlertDialogTitle>
														<AlertDialogDescription>
															Tindakan ini tidak dapat dibatalkan. Tindakan ini akan
															menghapus data anda secara permanen dan menghapus data anda
															dari server kami
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancel</AlertDialogCancel>
														<AlertDialogAction
															onClick={() =>
																router.delete(
																	route('admin.publishers.destroy', [publisher]),
																	{
																		preserveScroll: true,
																		preserveState: true,
																		onSuccess: (success) => {
																			const flash = flashMessage(success);
																			if (flash) toast[flash.type](flash.message);
																		},
																	},
																)
															}
														>
															Continue
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
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
						{meta.total} Penerbit
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
