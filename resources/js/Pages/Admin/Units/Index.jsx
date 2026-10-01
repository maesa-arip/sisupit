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
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconBuildingWarehouse,
	IconEdit,
	IconMapPin,
	IconPlus,
	IconSearch,
	IconTrash,
	IconTruck,
} from '@tabler/icons-react';
import { useState } from 'react';

// Kamus label & warna status armada (selaras dengan UnitController: available/maintenance,
// plus 'dispatched' yang diset otomatis saat unit dikerahkan ke insiden).
const STATUS_META = {
	available: {
		label: 'Siap',
		color: 'bg-success/10 text-success border-success/20',
	},
	dispatched: {
		label: 'Dikerahkan',
		color: 'bg-warning/10 text-warning border-warning/20',
	},
	maintenance: { label: 'Perbaikan', color: 'bg-muted text-muted-foreground border-border' },
};

export default function Index({ units, filters }) {
	const [unitToDelete, setUnitToDelete] = useState(null);

	const { data, setData, get } = useForm({
		search: filters?.search || '',
		status: filters?.status || 'Semua',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('admin.units.index'), { preserveState: true, preserveScroll: true });
	};

	const applyStatusFilter = (val) => {
		setData('status', val);
		router.get(route('admin.units.index'), { ...data, status: val }, { preserveState: true, preserveScroll: true });
	};

	const confirmDelete = () => {
		if (unitToDelete)
			router.delete(route('admin.units.destroy', unitToDelete), {
				preserveScroll: true,
				onSuccess: () => setUnitToDelete(null),
			});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen Armada" />

			<AlertDialog open={!!unitToDelete} onOpenChange={(open) => !open && setUnitToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus Unit?</AlertDialogTitle>
						<AlertDialogDescription>
							Unit ini akan dihapus dari katalog armada wilayah Anda.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmDelete}
						>
							Hapus Permanen
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen Armada / Unit"
					subtitle="Kelola katalog unit operasional (truk, tangki, rescue) di wilayah Anda."
					icon={IconTruck}
				/>
				<Button size="sm" className="h-10 rounded-full px-4" asChild>
					<Link href={route('admin.units.create')}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Unit
					</Link>
				</Button>
			</div>

			<div className="flex flex-col gap-3">
				<form onSubmit={handleSearch} className="relative max-w-md">
					<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Cari nama unit..."
						className="h-11 rounded-xl bg-card pl-9"
						value={data.search}
						onChange={(e) => setData('search', e.target.value)}
					/>
				</form>
				<div className="flex flex-wrap gap-2">
					{['Semua', 'available', 'dispatched', 'maintenance'].map((status) => (
						<button
							key={status}
							type="button"
							onClick={() => applyStatusFilter(status)}
							className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
								data.status === status
									? 'border-primary/20 bg-primary/10 text-primary'
									: 'border-input bg-transparent text-muted-foreground hover:bg-accent'
							}`}
						>
							{status === 'Semua' ? 'Semua' : STATUS_META[status]?.label || status}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				{units.data && units.data.length > 0 ? (
					<>
						<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
							{units.data.map((unit) => {
								const meta = STATUS_META[unit.status] || {
									label: unit.status,
									color: 'bg-muted text-muted-foreground border-border',
								};
								return (
									<div key={unit.id} className="transition-colors hover:bg-muted/40 active:bg-muted">
										<CardContent className="flex flex-row items-center gap-3 p-3 sm:p-4">
											<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/10 text-teal">
												<IconBuildingWarehouse className="h-5 w-5" />
											</div>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<h3 className="truncate text-sm font-semibold text-foreground">
														{unit.name}
													</h3>
													<span
														className={`shrink-0 rounded-xl border px-2 py-0.5 text-[11px] font-bold uppercase ${meta.color}`}
													>
														{meta.label}
													</span>
												</div>
												<p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
													{unit.type}
													{unit.pos_pemadam && (
														<>
															{' · '}
															<IconMapPin className="h-3 w-3 shrink-0" />{' '}
															{unit.pos_pemadam.name}
														</>
													)}
												</p>
											</div>
											<div className="flex shrink-0 gap-1">
												<Button
													variant="ghost"
													size="icon"
													asChild
													className="h-8 w-8 text-muted-foreground hover:text-info"
												>
													<Link href={route('admin.units.edit', unit.id)}>
														<IconEdit className="h-4 w-4" />
													</Link>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setUnitToDelete(unit.id)}
													className="h-8 w-8 text-muted-foreground hover:text-destructive"
												>
													<IconTrash className="h-4 w-4" />
												</Button>
											</div>
										</CardContent>
									</div>
								);
							})}
						</div>

						<div className="mt-2 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
							<span className="text-[11px] font-medium text-muted-foreground">
								Menampilkan {units.from} - {units.to} dari {units.total} unit
							</span>

							{units.links && units.links.length > 3 && (
								<div className="flex flex-wrap justify-center gap-1">
									{units.links.map((link, index) =>
										link.url ? (
											<Link
												key={index}
												href={link.url}
												preserveScroll
												className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
													link.active
														? 'border-primary bg-primary text-primary-foreground shadow-sm'
														: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
												}`}
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										) : (
											<span
												key={index}
												className="cursor-not-allowed rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-50"
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										),
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="rounded-xl border border-dashed border-input p-10 text-center">
						<span className="text-sm text-muted-foreground">Belum ada unit terdaftar.</span>
					</div>
				)}
			</div>
		</div>
	);
}
Index.layout = (page) => <AppLayout children={page} title="Manajemen Armada" />;
