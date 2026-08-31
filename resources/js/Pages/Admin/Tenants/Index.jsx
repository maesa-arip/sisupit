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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, router, useForm } from '@inertiajs/react';
import { IconBuildingCommunity, IconCheck, IconPencil, IconPlus, IconSearch, IconTrash, IconX } from '@tabler/icons-react';
import { toast } from 'sonner';

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
				<Button variant="orange" size="sm" asChild>
					<Link href={route('admin.tenants.create')}>
						<IconPlus className="size-4" /> Tambah
					</Link>
				</Button>
			</div>

			<form onSubmit={onSearch} className="relative mb-4 max-w-md">
				<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari instansi / subdomain / city_code..."
					className="h-10 pl-9"
					value={data.search}
					onChange={(e) => setData('search', e.target.value)}
				/>
			</form>

			<Card>
				<CardContent className="px-0 py-0 [&_td]:whitespace-nowrap [&_td]:px-6 [&_th]:px-6">
					<Table className="w-full">
						<TableHeader>
							<TableRow>
								<TableHead>#</TableHead>
								<TableHead>Instansi</TableHead>
								<TableHead>Subdomain</TableHead>
								<TableHead>Kabupaten / Kota</TableHead>
								<TableHead>Telepon Darurat</TableHead>
								<TableHead>Aktif</TableHead>
								<TableHead>Aksi</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{tenants.length > 0 ? (
								tenants.map((tenant, index) => (
									<TableRow key={tenant.id}>
										<TableCell>{index + 1 + (props.tenants.current_page - 1) * props.tenants.per_page}</TableCell>
										<TableCell className="font-medium">{tenant.nama_instansi}</TableCell>
										<TableCell>
											<span className="rounded bg-accent px-2 py-1 font-mono text-xs">
												{tenant.subdomain}
											</span>
										</TableCell>
										<TableCell>
											{tenant.city_name}{' '}
											<span className="text-xs text-muted-foreground">({tenant.city_code})</span>
										</TableCell>
										<TableCell>{tenant.telepon_darurat || '-'}</TableCell>
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
												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button variant="red" size="sm">
															<IconTrash className="size-4" />
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>Hapus tenant ini?</AlertDialogTitle>
															<AlertDialogDescription>
																Menghapus <b>{tenant.nama_instansi}</b> akan menonaktifkan
																subdomain <b>{tenant.subdomain}</b>. Laporan wilayah ini
																TIDAK ikut terhapus (routing tetap dari lokasi kejadian).
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Batal</AlertDialogCancel>
															<AlertDialogAction onClick={() => onDelete(tenant)}>
																Hapus
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</div>
										</TableCell>
									</TableRow>
								))
							) : (
								<TableRow>
									<TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
										Belum ada tenant. Klik Tambah untuk mendaftarkan kabupaten/kota.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
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
											className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
												link.active
													? 'border-warning bg-warning text-warning-foreground'
													: 'border-input bg-background text-muted-foreground hover:bg-accent'
											}`}
											dangerouslySetInnerHTML={{ __html: link.label }}
										/>
									) : (
										<span
											key={index}
											className="cursor-not-allowed rounded-md border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
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
