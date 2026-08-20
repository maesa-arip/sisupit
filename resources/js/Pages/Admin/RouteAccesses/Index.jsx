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
	IconCalendarTime,
	IconLock,
	IconPencil,
	IconPlus,
	IconRefresh,
	IconRoute,
	IconTrash,
	IconUserShield,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

function DeleteRouteAccessDialog({ routeAccess }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="red" size="sm">
					<IconTrash className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah anda benar benar yakin ?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data anda secara permanen dan
						menghapus data anda dari server kami
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={() =>
							router.delete(route('admin.route-accesses.destroy', [routeAccess]), {
								preserveScroll: true,
								preserveState: true,
								onSuccess: (success) => {
									const flash = flashMessage(success);
									if (flash) toast[flash.type](flash.message);
								},
							})
						}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function MobileInfo({ icon: Icon, label, value }) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<Icon className="size-4 shrink-0 text-muted-foreground" />
			<span className="text-muted-foreground">{label}</span>
			<span className="ml-auto truncate font-medium">{value || '-'}</span>
		</div>
	);
}

export default function Index(props) {
	const { data: route_accesses, meta } = props.route_accesses;
	const [params, setParams] = useState(props.state);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('admin.route-accesses.index'),
		values: params,
		only: ['route_accesses'],
	});

	const rowNumber = (index) => index + 1 + (meta.current_page - 1) * meta.per_page;

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconRoute}
				/>
				<Button variant="orange" size="sm" className="w-full lg:w-auto" asChild>
					<Link href={route('admin.route-accesses.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>
			<Card>
				<CardHeader>
					<div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
						<Input
							className="w-full lg:w-1/4"
							placeholder="Search"
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="w-full lg:w-24">
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
						<Button
							variant="red"
							onClick={() => setParams(props.state)}
							size="sm"
							className="w-full lg:w-auto"
						>
							<IconRefresh className="size-4" /> Bersihkan
						</Button>
					</div>
				</CardHeader>
				<CardContent className="p-0 [&_td]:px-6 [&_th]:px-6">
					{route_accesses.length === 0 ? (
						<div className="p-10 text-center text-sm text-muted-foreground">Data tidak ditemukan.</div>
					) : (
						<>
							{/* Tablet & desktop: tabel */}
							<div className="hidden overflow-x-auto md:block">
								<Table className="w-full">
									<TableHeader>
										<TableRow>
											<TableHead>
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('id')}
												>
													#{' '}
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('route_name')}
												>
													Rute
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('role_id')}
												>
													Peran
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('permission_id')}
												>
													Izin
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead className="hidden lg:table-cell">
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('created_at')}
												>
													Dibuat pada
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>Aksi</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{route_accesses.map((route_access, index) => (
											<TableRow key={index}>
												<TableCell>{rowNumber(index)}</TableCell>
												<TableCell className="font-medium">{route_access.route_name}</TableCell>
												<TableCell>{route_access.role?.name}</TableCell>
												<TableCell>{route_access.permission?.name}</TableCell>
												<TableCell className="hidden lg:table-cell">
													{route_access.created_at}
												</TableCell>
												<TableCell>
													<div className="flex items-center gap-x-1">
														<Button variant="blue" size="sm" asChild>
															<Link
																href={route('admin.route-accesses.edit', [
																	route_access,
																])}
															>
																<IconPencil className="size-4" />
															</Link>
														</Button>
														<DeleteRouteAccessDialog routeAccess={route_access} />
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Mobile: daftar kartu (tanpa tabel) */}
							<div className="space-y-3 p-4 md:hidden">
								{route_accesses.map((route_access, index) => (
									<div key={index} className="overflow-hidden rounded-xl border bg-card shadow-sm">
										<div className="flex items-center gap-3 border-b bg-muted/40 p-4">
											<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
												<IconRoute className="size-5" />
											</div>
											<span className="min-w-0 truncate font-semibold leading-tight">
												{route_access.route_name}
											</span>
											<span className="ml-auto shrink-0 text-xs text-muted-foreground">
												#{rowNumber(index)}
											</span>
										</div>
										<div className="space-y-2 p-4">
											<MobileInfo
												icon={IconUserShield}
												label="Peran"
												value={route_access.role?.name}
											/>
											<MobileInfo
												icon={IconLock}
												label="Izin"
												value={route_access.permission?.name}
											/>
											<MobileInfo
												icon={IconCalendarTime}
												label="Dibuat pada"
												value={route_access.created_at}
											/>
										</div>
										<div className="flex items-center gap-2 border-t bg-muted/30 px-4 py-3">
											<Button variant="blue" size="sm" className="flex-1" asChild>
												<Link href={route('admin.route-accesses.edit', [route_access])}>
													<IconPencil className="size-4" /> Edit
												</Link>
											</Button>
											<DeleteRouteAccessDialog routeAccess={route_access} />
										</div>
									</div>
								))}
							</div>
						</>
					)}
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menamplikan <span className="font-medium text-warning">{meta.from ?? 0}</span> dari {meta.total}{' '}
						Rute Akses
					</p>
					<div className="overflow-x-auto">
						{meta.has_pages && (
							<Pagination>
								<PaginationContent className="flex flex-wrap justify-center lg:justify-end">
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
