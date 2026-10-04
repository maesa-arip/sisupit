import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
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
import { IconArrowsDownUp, IconCircleKey, IconPencil, IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

function DeleteRoleDialog({ role }) {
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
							router.delete(route('admin.roles.destroy', [role]), {
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
	const { data: roles, meta } = props.roles;
	const [params, setParams] = useState(props.state);

	const onSortable = (field) => {
		setParams({
			...params,
			field: field,
			direction: params.direction === 'asc' ? 'desc' : 'asc',
		});
	};
	UseFilter({
		route: route('admin.roles.index'),
		values: params,
		only: ['roles'],
	});

	const rowNumber = (index) => index + 1 + (meta.current_page - 1) * meta.per_page;

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconCircleKey}
				/>
				<Button size="sm" className="h-10 w-full rounded-full px-4 lg:w-auto" asChild>
					<Link href={route('admin.roles.create')}>
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
					{roles.length === 0 ? (
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
													onClick={() => onSortable('name')}
												>
													Nama
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>
												<Button
													variant="ghost"
													className="group inline-flex"
													onClick={() => onSortable('guard_name')}
												>
													Guard
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
										{roles.map((role, index) => (
											<TableRow key={index}>
												<TableCell>{rowNumber(index)}</TableCell>
												<TableCell className="font-medium">{role.name}</TableCell>
												<TableCell>{role.guard_name}</TableCell>
												<TableCell className="hidden lg:table-cell">
													{role.created_at}
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
															<Link href={route('admin.roles.edit', [role])}>
																<IconPencil className="size-4" />
															</Link>
														</Button>
														<DeleteRoleDialog role={role} />
													</div>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Ponsel: daftar bergrup bergaris rambut (TASK_69 bagian 16) - dulu kartu bertumpuk di dalam kartu. */}
							<div className="divide-y divide-border/70 md:hidden">
								{roles.map((role, index) => (
									<div key={index} className="flex items-center gap-3 px-4 py-3">
										<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconCircleKey className="size-5" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="break-words text-[15px] font-semibold leading-snug">
												{role.name}
											</p>
											<p className="mt-0.5 text-[13px] text-muted-foreground">
												{role.guard_name} · {role.created_at}
											</p>
										</div>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Ubah"
											className="h-9 w-9 text-muted-foreground hover:text-primary"
											asChild
										>
											<Link href={route('admin.roles.edit', [role])}>
												<IconPencil className="size-4" />
											</Link>
										</Button>
										<DeleteRoleDialog role={role} />
									</div>
								))}
							</div>
						</>
					)}
				</div>
				<div className="flex w-full flex-col items-center justify-between gap-2 px-1 lg:flex-row">
					<p className="text-[13px] text-muted-foreground">
						Menampilkan <span className="font-medium text-foreground">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Peran
					</p>
					<div className="overflow-x-auto">
						<PaginationLinks links={meta.links} />
					</div>
				</div>
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
