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
import { Card, CardContent, CardFooter } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	stickyActionsClass,
} from '@/Components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import { cn, flashMessage } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import {
	IconBuildingCommunity,
	IconCheck,
	IconChevronRight,
	IconPencil,
	IconPlus,
	IconSearch,
	IconTrash,
	IconX,
} from '@tabler/icons-react';
import { toast } from 'sonner';

// Satu dialog hapus untuk tabel desktop & daftar ponsel (TASK_69), supaya keduanya tak menyimpang.
function DeleteTenantDialog({ tenant, onDelete }) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant="red" size="sm" aria-label="Hapus tenant">
					<IconTrash className="size-4" />
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus tenant ini?</AlertDialogTitle>
					<AlertDialogDescription>
						Menghapus <b>{tenant.nama_instansi}</b> akan menonaktifkan subdomain <b>{tenant.subdomain}</b>.
						Laporan wilayah ini TIDAK ikut terhapus (routing tetap dari lokasi kejadian).
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Batal</AlertDialogCancel>
					<AlertDialogAction onClick={() => onDelete(tenant)}>Hapus</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export default function Index(props) {
	const tenants = props.tenants.data;
	const { data, setData, get } = useForm({ search: props.filters?.search || '' });

	const onSearch = (e) => {
		e.preventDefault();
		get(route('admin.tenants.index'), { preserveState: true, preserveScroll: true });
	};

	const onDelete = (tenant) =>
		router.delete(route('admin.tenants.destroy', [tenant]), {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBuildingCommunity}
				/>
				<Button className="h-10 rounded-full px-4" size="sm" asChild>
					<Link href={route('admin.tenants.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>

			<form onSubmit={onSearch} className="relative mb-4 max-w-md">
				<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					enterKeyHint="search"
					placeholder="Cari instansi / subdomain / city_code..."
					className="h-10 pl-9"
					value={data.search}
					onChange={(e) => setData('search', e.target.value)}
				/>
			</form>

			<Card>
				<CardContent className="px-0 py-0 [&_td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
					{/* Ponsel: daftar bergrup ala iOS; ketuk baris = ubah. Tabel lengkap mulai md. */}
					<ul className="divide-y divide-border/70 md:hidden">
						{tenants.map((tenant) => (
							<li key={tenant.id} className="flex items-center gap-3 px-4 py-3">
								<Link
									href={route('admin.tenants.edit', [tenant])}
									className="flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-opacity active:opacity-70"
								>
									<span className="min-w-0 flex-1">
										<span className="block truncate text-[15px] font-medium text-foreground">
											{tenant.nama_instansi}
										</span>
										<span className="mt-1 flex min-w-0 items-center gap-2 text-[13px] text-muted-foreground">
											<span
												className={cn(
													'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
													tenant.is_active
														? 'bg-success/10 text-success'
														: 'bg-destructive/10 text-destructive',
												)}
											>
												{tenant.is_active ? 'Aktif' : 'Nonaktif'}
											</span>
											<span className="truncate">
												{tenant.subdomain} · {tenant.city_name}
											</span>
										</span>
									</span>
									<IconChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
								</Link>
								<DeleteTenantDialog tenant={tenant} onDelete={onDelete} />
							</li>
						))}
						{tenants.length === 0 && (
							<li className="px-4 py-10 text-center text-[15px] text-muted-foreground">
								Belum ada tenant. Ketuk Tambah untuk mendaftarkan kabupaten/kota.
							</li>
						)}
					</ul>
					<div className="hidden md:block">
						<Table className={`w-full ${stickyActionsClass}`}>
							<TableHeader>
								<TableRow>
									<TableHead className="hidden md:table-cell">#</TableHead>
									<TableHead>Instansi</TableHead>
									<TableHead className="hidden md:table-cell">Subdomain</TableHead>
									<TableHead className="hidden md:table-cell">Kabupaten / Kota</TableHead>
									<TableHead className="hidden md:table-cell">Telepon Darurat</TableHead>
									<TableHead>Aktif</TableHead>
									<TableHead>Aksi</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{tenants.length > 0 ? (
									tenants.map((tenant, index) => (
										<TableRow key={tenant.id}>
											<TableCell className="hidden md:table-cell">
												{index + 1 + (props.tenants.current_page - 1) * props.tenants.per_page}
											</TableCell>
											<TableCell className="font-medium">{tenant.nama_instansi}</TableCell>
											<TableCell className="hidden md:table-cell">
												<span className="rounded bg-accent px-2 py-1 font-mono text-xs">
													{tenant.subdomain}
												</span>
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{tenant.city_name}{' '}
												<span className="text-xs text-muted-foreground">
													({tenant.city_code})
												</span>
											</TableCell>
											<TableCell className="hidden md:table-cell">
												{tenant.telepon_darurat || '-'}
											</TableCell>
											<TableCell>
												{tenant.is_active ? (
													<IconCheck className="size-4 text-emerald-600" />
												) : (
													<IconX className="size-4 text-destructive" />
												)}
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-x-1">
													<Button variant="blue" size="sm" asChild>
														<Link href={route('admin.tenants.edit', [tenant])}>
															<IconPencil className="size-4" />
														</Link>
													</Button>
													<DeleteTenantDialog tenant={tenant} onDelete={onDelete} />
												</div>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell
											colSpan={7}
											className="py-10 text-center text-sm text-muted-foreground"
										>
											Belum ada tenant. Klik Tambah untuk mendaftarkan kabupaten/kota.
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				</CardContent>
				<CardFooter className="flex w-full flex-col items-center justify-between border-t py-2 lg:flex-row">
					<p className="mb-2 text-sm text-muted-foreground">
						Menampilkan <span className="font-medium text-warning">{props.tenants.from ?? 0}</span> dari{' '}
						{props.tenants.total} tenant
					</p>
					<div className="overflow-x-auto">
						{props.tenants.links && props.tenants.links.length > 3 && (
							<div className="flex flex-wrap justify-center gap-1 lg:justify-end">
								{props.tenants.links.map((link, index) =>
									link.url ? (
										<Link
											key={index}
											href={link.url}
											preserveScroll
											className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
												link.active
													? 'border-warning bg-warning text-warning-foreground'
													: 'border-input bg-background text-muted-foreground hover:bg-accent'
											}`}
											dangerouslySetInnerHTML={{ __html: link.label }}
										/>
									) : (
										<span
											key={index}
											className="cursor-not-allowed rounded-2xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
											dangerouslySetInnerHTML={{ __html: link.label }}
										/>
									),
								)}
							</div>
						)}
					</div>
				</CardFooter>
			</Card>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
