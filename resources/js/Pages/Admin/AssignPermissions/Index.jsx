import HeaderTitle from '@/Components/HeaderTitle';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/Components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import UseFilter from '@/hooks/UseFilter';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconArrowsDownUp, IconKeyframe, IconRefresh } from '@tabler/icons-react';
import { useState } from 'react';

function PermissionBadges({ permissions }) {
	if (!permissions || permissions.length === 0) {
		return <span className="text-xs text-muted-foreground">Tanpa Izin</span>;
	}

	return permissions.map((permission, index) => (
		<Badge variant="outline" className="my-0.5 mr-1" key={index}>
			{permission}
		</Badge>
	));
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
		route: route('admin.assign-permissions.index'),
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
					icon={IconKeyframe}
				/>
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
													onClick={() => onSortable('name')}
												>
													Nama
													<span className="ml-2 flex-none rounded text-muted-foreground">
														<IconArrowsDownUp className="size-4 text-muted-foreground" />
													</span>
												</Button>
											</TableHead>
											<TableHead>Izin</TableHead>
											<TableHead>Aksi</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{roles.map((role, index) => (
											<TableRow key={index}>
												<TableCell>{rowNumber(index)}</TableCell>
												<TableCell className="font-medium">{role.name}</TableCell>
												<TableCell>
													<div className="flex max-w-xl flex-wrap items-center">
														<PermissionBadges permissions={role.permissions} />
													</div>
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
															<Link href={route('admin.assign-permissions.edit', [role])}>
																<IconRefresh className="size-4" />
															</Link>
														</Button>
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
									<Link
										key={index}
										href={route('admin.assign-permissions.edit', [role])}
										className="flex items-start gap-3 px-4 py-3 transition-colors active:bg-muted"
									>
										<div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
											<IconKeyframe className="size-5" />
										</div>
										<div className="min-w-0 flex-1">
											<p className="break-words text-[15px] font-semibold leading-snug">
												{role.name}
											</p>
											<p className="mt-0.5 text-[13px] text-muted-foreground">
												Izin ({role.permissions?.length ?? 0})
											</p>
											<div className="mt-2 flex flex-wrap items-center">
												<PermissionBadges permissions={role.permissions} />
											</div>
										</div>
										<IconChevronRight className="mt-2.5 size-4 shrink-0 text-muted-foreground/50" />
									</Link>
								))}
							</div>
						</>
					)}
				</div>
				<div className="flex w-full flex-col items-center justify-between gap-2 px-1 lg:flex-row">
					<p className="text-[13px] text-muted-foreground">
						Menampilkan <span className="font-medium text-foreground">{meta.from ?? 0}</span> dari{' '}
						{meta.total} Tetapkan Izin
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
