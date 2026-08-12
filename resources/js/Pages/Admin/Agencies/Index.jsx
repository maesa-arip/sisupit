import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconBolt,
	IconBuildingCommunity,
	IconEdit,
	IconPhone,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { INCIDENT_LABELS } from './incidentLabels';

export default function Index({ agencies, filters }) {
	const [agencyToDelete, setAgencyToDelete] = useState(null);

	const { data, setData, get } = useForm({
		search: filters?.search || '',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('admin.agencies.index'), { preserveState: true, preserveScroll: true });
	};

	const confirmDelete = () => {
		if (agencyToDelete)
			router.delete(route('admin.agencies.destroy', agencyToDelete), {
				preserveScroll: true,
				onSuccess: () => setAgencyToDelete(null),
			});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Manajemen OPD" />

			{agencyToDelete && (
				<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
					<div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
						<div className="flex items-center gap-3 text-destructive">
							<IconAlertTriangle className="h-6 w-6" /> <h3 className="text-lg font-bold">Hapus OPD?</h3>
						</div>
						<p className="mt-2 text-sm text-muted-foreground">
							OPD ini tidak lagi muncul saat verifikasi laporan. Pelibatannya di insiden yang sudah lewat
							tetap tercatat.
						</p>
						<div className="mt-6 flex justify-end gap-3">
							<Button variant="ghost" onClick={() => setAgencyToDelete(null)}>
								Batal
							</Button>
							<Button
								className="bg-destructive text-destructive-foreground shadow-none hover:bg-destructive/90"
								onClick={confirmDelete}
							>
								Hapus
							</Button>
						</div>
					</div>
				</div>
			)}

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Manajemen OPD Terkait"
					subtitle="Instansi yang bisa dilibatkan saat verifikasi laporan (BPBD, PLN, PMI, ...)."
					icon={IconBuildingCommunity}
				/>
				<Button size="sm" asChild>
					<Link href={route('admin.agencies.create')}>
						<IconPlus className="mr-1.5 h-4 w-4" /> Tambah OPD
					</Link>
				</Button>
			</div>

			<form onSubmit={handleSearch} className="relative max-w-md">
				<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari nama, kode, atau kategori OPD..."
					className="h-10 pl-9"
					value={data.search}
					onChange={(e) => setData('search', e.target.value)}
				/>
			</form>

			<div className="flex flex-col gap-3">
				{agencies.data && agencies.data.length > 0 ? (
					<>
						{agencies.data.map((agency) => (
							<Card key={agency.id} className="transition-colors hover:border-primary/40">
								<CardContent className="flex flex-row items-start gap-3 p-3 sm:p-4">
									<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
										<IconBuildingCommunity className="h-5 w-5" />
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex flex-wrap items-center gap-2">
											<h3 className="truncate text-sm font-semibold text-foreground">
												{agency.name}
											</h3>
											{agency.code && (
												<span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
													{agency.code}
												</span>
											)}
											{!agency.is_active && (
												<span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
													Nonaktif
												</span>
											)}
										</div>

										<p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
											{agency.category && <span>{agency.category}</span>}
											{agency.phone && (
												<span className="flex items-center gap-1">
													<IconPhone className="h-3 w-3 shrink-0" /> {agency.phone}
												</span>
											)}
										</p>

										{/* Dua baris di bawah inilah isi "dinamis"-nya: aturan auto-centang &
										    konfirmasi berkondisi tersimpan sebagai data, bukan sebagai kode. */}
										{agency.default_incident_types?.length > 0 && (
											<p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
												<span className="font-semibold">Auto-centang:</span>
												{agency.default_incident_types.map((t) => (
													<span
														key={t}
														className="rounded border border-info/20 bg-info/10 px-1.5 py-0.5 font-medium text-info"
													>
														{INCIDENT_LABELS[t] || t}
													</span>
												))}
											</p>
										)}
										{agency.requires_confirmation && (
											<p className="mt-1 flex items-start gap-1 text-[11px] font-medium text-warning">
												<IconBolt className="mt-0.5 h-3 w-3 shrink-0" />
												{agency.confirmation_label}
											</p>
										)}
									</div>

									<div className="flex shrink-0 gap-1">
										<Button
											variant="ghost"
											size="icon"
											asChild
											className="h-8 w-8 text-muted-foreground hover:text-info"
										>
											<Link href={route('admin.agencies.edit', agency.id)}>
												<IconEdit className="h-4 w-4" />
											</Link>
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setAgencyToDelete(agency.id)}
											className="h-8 w-8 text-muted-foreground hover:text-destructive"
										>
											<IconTrash className="h-4 w-4" />
										</Button>
									</div>
								</CardContent>
							</Card>
						))}

						<div className="mt-2 flex flex-col items-center gap-3 border-t border-dashed border-border pt-4">
							<span className="text-[11px] font-medium text-muted-foreground">
								Menampilkan {agencies.from} - {agencies.to} dari {agencies.total} OPD
							</span>

							{agencies.links && agencies.links.length > 3 && (
								<div className="flex flex-wrap justify-center gap-1">
									{agencies.links.map((link, index) =>
										link.url ? (
											<Link
												key={index}
												href={link.url}
												preserveScroll
												className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
													link.active
														? 'border-primary bg-primary text-primary-foreground shadow-sm'
														: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
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
					</>
				) : (
					<div className="rounded-xl border border-dashed border-input p-10 text-center">
						<span className="text-sm text-muted-foreground">
							Belum ada OPD terdaftar di wilayah Anda.
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
Index.layout = (page) => <AppLayout children={page} title="Manajemen OPD" />;
