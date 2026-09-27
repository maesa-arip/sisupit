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
import { IconAddressBook, IconArrowLeft, IconDeviceFloppy, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Create() {
	const { data, setData, post, processing, errors } = useForm({
		name: '',
		jabatan: '',
		instansi: '',
		email: '',
		notes: '',
		is_active: true,
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.mail-contacts.store'), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Tambah Penerima" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Tambah Penerima Email"
					subtitle="Hanya alamat di daftar ini yang bisa dikirimi surat dinas."
					icon={IconAddressBook}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.mail-contacts.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="border-border shadow-none">
					<CardContent className="p-6">
						<form className="space-y-5" onSubmit={onHandleSubmit}>
							<div className="flex items-start gap-3 rounded-md border border-info/20 bg-info/10 p-3 text-info">
								<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
								<p className="text-xs font-medium leading-relaxed">
									Penerima otomatis terdaftar pada yurisdiksi wilayah Anda, dan hanya bisa dikirimi
									surat oleh petugas di wilayah yang sama.
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="name">Nama</Label>
								<Input
									id="name"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
									placeholder="Nama pejabat"
								/>
								{errors.name && <InputError message={errors.name} />}
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="jabatan">Jabatan</Label>
									<Input
										id="jabatan"
										value={data.jabatan}
										onChange={(e) => setData('jabatan', e.target.value)}
										placeholder="Camat, Lurah, Kepala Dinas, ..."
									/>
									{errors.jabatan && <InputError message={errors.jabatan} />}
								</div>
								<div className="space-y-2">
									<Label htmlFor="instansi">Instansi</Label>
									<Input
										id="instansi"
										value={data.instansi}
										onChange={(e) => setData('instansi', e.target.value)}
										placeholder="Kecamatan Denpasar Barat"
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
									placeholder="camat@namakota.go.id"
								/>
								{errors.email && <InputError message={errors.email} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Catatan</Label>
								<Textarea
									id="notes"
									value={data.notes}
									onChange={(e) => setData('notes', e.target.value)}
									placeholder="Keterangan tambahan, mis. hanya untuk laporan bulanan."
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

							<div className="flex justify-end gap-2 border-t border-border pt-4">
								<Button type="button" variant="secondary" asChild>
									<Link href={route('admin.mail-contacts.index')}>Batal</Link>
								</Button>
								<Button type="submit" disabled={processing}>
									<IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Tambah Penerima" />;
