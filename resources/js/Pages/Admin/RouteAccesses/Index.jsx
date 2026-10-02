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
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	stickyActionsClass,
} from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { IconArrowsDownUp, IconPencil, IconPlus, IconRefresh, IconRoute, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

function DeleteRouteAccessDialog({ routeAccess }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Hapus"
					className="h-9 w-9 text-muted-foreground hover:text-destructive"
				>
					<IconTrash className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus data ini?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Tindakan ini akan menghapus data ini secara permanen dari
						server.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Batal</AlertDialogCancel>
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
						Hapus
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
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
				<Button size="sm" className="h-10 w-full rounded-full px-4 lg:w-auto" asChild>
					<Link href={route('admin.route-accesses.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>
			<div className="space-y-4">
				<div>
					<div className="flex w-full items-center gap-2 lg:gap-3">
						<Input
							className="h-11 min-w-0 flex-1 rounded-xl border-transparent bg-muted/60 lg:max-w-xs"
							type="search"
							enterKeyHint="search"
							placeholder="Cari..."
							value={params?.search}
							onChange={(e) => setParams((prev) => ({ ...prev, search: e.target.value }))}
						/>
						<Select value={params?.load} onValueChange={(e) => setParams({ ...params, load: e })}>
							<SelectTrigger className="h-11 w-20 shrink-0 rounded-xl border-transparent bg-muted/60">
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
							variant="ghost"
							onClick={() => setParams(props.state)}
							size="icon"
							aria-label="Bersihkan"
							className="h-11 w-11 shrink-0 rounded-xl text-muted-foreground"
						>
							<IconRefresh className="size-4" />
						</Button>
					</div>
				</div>
				<div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm [&_td]:px-6 [&_th]:px-6">
					{route_accesses.length === 0 ? (
						<div className="p-10 text-center text-sm text-muted-foreground">Data tidak ditemukan.</div>
					) : (
						<>
							{/* Tablet & desktop: tabel */}
							<div className="hidden overflow-x-auto md:block">
								<Table className={`w-full ${stickyActionsClass}`}>
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
														<Button
															variant="ghost"
															size="icon"
															aria-label="Ubah"
															className="h-9 w-9 text-muted-foreground hover:text-primary"
															asChild
														>
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

							{/* Ponsel: daftar bergrup bergaris rambut (TASK_69 bagian 16) - dulu kartu bertumpuk di dalam kartu. */}
							<div className="divide-y divide-border/70 md:hidden">
								{route_accesses.map((route_access, index) => (
									<div key={index} className="flex items-center gap-3 px-4 py-3">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconRoute className="size-5" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="break-words text-[15px] font-semibold leading-snug">
												{route_access.route_name}
											</p>
											<p className="mt-0.5 text-[13px] text-muted-foreground">
												{route_access.role?.name || '-'} ·{' '}
												{route_access.permission?.name || '-'}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Ubah"
											className="h-9 w-9 text-muted-foreground hover:text-primary"
											asChild
										>
											<Link href={route('admin.route-accesses.edit', [route_access])}>
												<IconPencil className="size-4" />
											</Link>
										</Button>
										<DeleteRouteAccessDialog routeAccess={route_access} />
									</div>
								))}
							</div>
						</>
					)}
				</div>
				<div className="flex w-full flex-col items-center justify-between gap-2 px-1 lg:flex-row">
					<p className="text-[13px] text-muted-foreground">
						Menampilkan <span className="font-medium text-foreground">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Rute Akses
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
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
