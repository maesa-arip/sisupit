import { groupedRowsClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconAddressBook, IconArrowLeft, IconDeviceFloppy } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Edit({ contact }) {
	const { data, setData, put, processing, errors } = useForm({
		name: contact?.name || '',
		jabatan: contact?.jabatan || '',
		instansi: contact?.instansi || '',
		email: contact?.email || '',
		notes: contact?.notes || '',
		is_active: Boolean(contact?.is_active),
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		put(route('admin.mail-contacts.update', contact.id), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Ubah Penerima" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Ubah Penerima Email"
					subtitle="Perubahan di sini tidak mengubah surat yang sudah terkirim."
					icon={IconAddressBook}
				/>
				<Button className="rounded-full" variant="outline" size="sm" asChild>
					<Link href={route('admin.mail-contacts.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="mx-auto w-full max-w-2xl">
					<CardContent className="p-5 sm:p-6">
						<form
							className={groupedRowsClass}
							onSubmit={onHandleSubmit}
						>
							<div className="space-y-2">
								<Label htmlFor="name">Nama</Label>
								<Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
								{errors.name && <InputError message={errors.name} />}
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="jabatan">Jabatan</Label>
									<Input
										id="jabatan"
										value={data.jabatan}
										onChange={(e) => setData('jabatan', e.target.value)}
									/>
									{errors.jabatan && <InputError message={errors.jabatan} />}
								</div>
								<div className="space-y-2">
									<Label htmlFor="instansi">Instansi</Label>
									<Input
										id="instansi"
										value={data.instansi}
										onChange={(e) => setData('instansi', e.target.value)}
									/>
									{errors.instansi && <InputError message={errors.instansi} />}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Alamat email</Label>
								<Input
									id="email"
									type="email"
									value={data.email}
									onChange={(e) => setData('email', e.target.value)}
								/>
								{errors.email && <InputError message={errors.email} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Catatan</Label>
								<Textarea
									id="notes"
									value={data.notes}
									onChange={(e) => setData('notes', e.target.value)}
								/>
								{errors.notes && <InputError message={errors.notes} />}
							</div>

							<label className="flex cursor-pointer items-center gap-2">
								<Checkbox
									checked={data.is_active}
									onCheckedChange={(checked) => setData('is_active', !!checked)}
								/>
								<span className="text-sm text-foreground">Aktif (bisa dipilih saat menulis surat)</span>
							</label>

							<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
								<Button className="h-11 rounded-xl" type="button" variant="ghost" asChild>
									<Link href={route('admin.mail-contacts.index')}>Batal</Link>
								</Button>
								<Button className="h-11 rounded-xl px-6" type="submit" disabled={processing}>
									<IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Perubahan
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Edit.layout = (page) => <AppLayout children={page} title="Ubah Penerima" />;
