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
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconAddressBook,
	IconDownload,
	IconEdit,
	IconMail,
	IconPlus,
	IconSearch,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Daftar Penerima Email Dinas (TASK_56) - daftar putih yang dibaca gerbang kirim.
 * Hanya admin yang boleh mengubahnya; petugas boleh mengirim surat tapi tidak menambah
 * orang yang bisa dikirimi.
 */
export default function Index({ contacts, filters }) {
	const [contactToDelete, setContactToDelete] = useState(null);

	const { data, setData, get } = useForm({
		search: filters?.search || '',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('admin.mail-contacts.index'), { preserveState: true, preserveScroll: true });
	};

	const confirmDelete = () => {
		if (contactToDelete)
			router.delete(route('admin.mail-contacts.destroy', contactToDelete), {
				preserveScroll: true,
				onSuccess: (success) => {
					setContactToDelete(null);
					const flash = flashMessage(success);
					if (flash) toast[flash.type](flash.message);
				},
			});
	};

	const tarikDariOpd = () => {
		router.post(
			route('admin.mail-contacts.tarik-opd'),
			{},
			{
				preserveScroll: true,
				onSuccess: (success) => {
					const flash = flashMessage(success);
					if (flash) toast[flash.type](flash.message);
				},
			},
		);
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Daftar Penerima Email" />

			<AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus penerima?</AlertDialogTitle>
						<AlertDialogDescription>
							Alamat ini tidak lagi bisa dikirimi surat. Surat yang sudah terkirim tetap mencatat nama dan
							alamatnya.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
						<AlertDialogAction
							className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={confirmDelete}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Daftar Penerima Email"
					subtitle="Hanya alamat di daftar ini yang bisa dikirimi surat dinas."
					icon={IconAddressBook}
				/>
				<div className="flex flex-wrap gap-2">
					<Button size="sm" variant="secondary" onClick={tarikDariOpd}>
						<IconDownload className="mr-1.5 h-4 w-4" /> Tarik dari Master OPD
					</Button>
					<Button size="sm" asChild>
						<Link href={route('admin.mail-contacts.create')}>
							<IconPlus className="mr-1.5 h-4 w-4" /> Tambah Penerima
						</Link>
					</Button>
				</div>
			</div>

			<form onSubmit={handleSearch} className="relative max-w-md">
				<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari nama, jabatan, instansi, atau email..."
					className="h-10 pl-9"
					value={data.search}
					onChange={(e) => setData('search', e.target.value)}
				/>
			</form>

			<div className="flex flex-col gap-3">
				{contacts.data && contacts.data.length > 0 ? (
					<>
						<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
							{contacts.data.map((contact) => (
								<div key={contact.id} className="transition-colors hover:bg-muted/40 active:bg-muted">
									<CardContent className="flex flex-row items-start gap-3 p-3 sm:p-4">
										<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
											<IconMail className="h-5 w-5" />
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="truncate text-sm font-semibold text-foreground">
													{contact.name}
												</h3>
												{!contact.is_active && (
													<span className="shrink-0 rounded-2xl border border-border bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-muted-foreground">
														Nonaktif
													</span>
												)}
											</div>
											{(contact.jabatan || contact.instansi) && (
												<p className="mt-0.5 truncate text-xs text-muted-foreground">
													{[contact.jabatan, contact.instansi].filter(Boolean).join(' . ')}
												</p>
											)}
											<p className="mt-1 truncate text-xs font-medium text-foreground">
												{contact.email}
											</p>
										</div>
										<div className="flex shrink-0 gap-1">
											<Button variant="ghost" size="icon" asChild>
												<Link href={route('admin.mail-contacts.edit', contact.id)}>
													<IconEdit className="h-4 w-4" />
												</Link>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="text-destructive hover:text-destructive"
												onClick={() => setContactToDelete(contact.id)}
											>
												<IconTrash className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</div>
							))}
						</div>

						<div className="mt-2 flex flex-col items-center justify-between gap-3 sm:flex-row">
							<span className="text-[11px] font-medium text-muted-foreground">
								Menampilkan {contacts.from} - {contacts.to} dari {contacts.total} penerima
							</span>

							<PaginationLinks links={contacts.links} />
						</div>
					</>
				) : (
					<div className="rounded-2xl border border-border/70 bg-card p-10 text-center shadow-sm">
						<span className="text-sm text-muted-foreground">
							Belum ada penerima terdaftar. Tambahkan pejabat yang berhak menerima surat dinas, atau tarik
							alamat yang sudah ada di master OPD.
						</span>
					</div>
				)}
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Daftar Penerima Email" />;
