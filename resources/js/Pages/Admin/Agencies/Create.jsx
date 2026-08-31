import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconBuildingCommunity, IconDeviceFloppy, IconInfoCircle } from '@tabler/icons-react';
import { toast } from 'sonner';
import { INCIDENT_LABELS } from './incidentLabels';

export default function Create({ category_options = [], incident_types = [] }) {
	const { data, setData, post, processing, errors } = useForm({
		name: '',
		code: '',
		category: '',
		contact_person: '',
		phone: '',
		email: '',
		notes: '',
		is_active: true,
		default_incident_types: [],
		requires_confirmation: false,
		confirmation_label: '',
	});

	const toggleIncidentType = (value) => {
		setData(
			'default_incident_types',
			data.default_incident_types.includes(value)
				? data.default_incident_types.filter((t) => t !== value)
				: [...data.default_incident_types, value],
		);
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.agencies.store'), {
			preserveScroll: true,
			onSuccess: (page) => {
				const flash = page.props.flash;
				if (flash?.success) toast.success(flash.success);
				else if (flash?.error) toast.error(flash.error);
			},
		});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Tambah OPD" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Tambah OPD Terkait"
					subtitle="Instansi ini akan bisa dipilih saat Pusat Komando memverifikasi laporan."
					icon={IconBuildingCommunity}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.agencies.index')}>
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
									OPD otomatis terdaftar pada yurisdiksi wilayah Anda. Kedua pengaturan di bawah -
									auto-centang & konfirmasi wajib - membuat perilaku tiap instansi bisa berbeda tanpa
									perubahan aplikasi.
								</p>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="name">Nama Instansi</Label>
								<Input
									id="name"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
									placeholder="Misal: PLN UP3 Bali Selatan"
								/>
								{errors.name && <InputError message={errors.name} />}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="grid gap-1.5">
									<Label htmlFor="code">Kode Singkat (Opsional)</Label>
									<Input
										id="code"
										value={data.code}
										onChange={(e) => setData('code', e.target.value)}
										placeholder="PLN"
									/>
									{errors.code && <InputError message={errors.code} />}
								</div>

								<div className="grid gap-1.5">
									<Label>Kategori</Label>
									<Select value={data.category} onValueChange={(value) => setData('category', value)}>
										<SelectTrigger>
											<SelectValue placeholder="Pilih kategori" />
										</SelectTrigger>
										<SelectContent>
											{category_options.map((c) => (
												<SelectItem key={c} value={c}>
													{c}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.category && <InputError message={errors.category} />}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<div className="grid gap-1.5">
									<Label htmlFor="contact_person">Narahubung</Label>
									<Input
										id="contact_person"
										value={data.contact_person}
										onChange={(e) => setData('contact_person', e.target.value)}
									/>
									{errors.contact_person && <InputError message={errors.contact_person} />}
								</div>
								<div className="grid gap-1.5">
									<Label htmlFor="phone">Telepon</Label>
									<Input
										id="phone"
										value={data.phone}
										onChange={(e) => setData('phone', e.target.value)}
									/>
									{errors.phone && <InputError message={errors.phone} />}
								</div>
								<div className="grid gap-1.5">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={data.email}
										onChange={(e) => setData('email', e.target.value)}
									/>
									{errors.email && <InputError message={errors.email} />}
								</div>
							</div>

							{/* Aturan auto-centang: inilah yang membuat "kebakaran → BPBD & PLN tercentang"
							    bisa diubah admin, bukan ditanam di kode. */}
							<div className="grid gap-2 rounded-lg border border-border p-4">
								<Label>Centang otomatis untuk jenis kejadian</Label>
								<p className="text-xs text-muted-foreground">
									OPD ini akan tercentang otomatis di dialog verifikasi untuk jenis kejadian yang
									dipilih. Operator tetap bisa melepas centangnya sebelum menyiarkan.
								</p>
								<div className="mt-1 flex flex-wrap gap-3">
									{incident_types.map((type) => (
										<label key={type} className="flex cursor-pointer items-center gap-2">
											<Checkbox
												checked={data.default_incident_types.includes(type)}
												onCheckedChange={() => toggleIncidentType(type)}
											/>
											<span className="text-sm text-foreground">
												{INCIDENT_LABELS[type] || type}
											</span>
										</label>
									))}
								</div>
								{errors.default_incident_types && (
									<InputError message={errors.default_incident_types} />
								)}
							</div>

							{/* Konfirmasi berkondisi: kalimatnya diketik admin, sehingga OPD baru yang
							    butuh konfirmasi tidak perlu penambahan kode apa pun. */}
							<div className="grid gap-2 rounded-lg border border-border p-4">
								<label className="flex cursor-pointer items-center gap-2">
									<Checkbox
										checked={data.requires_confirmation}
										onCheckedChange={(checked) => setData('requires_confirmation', !!checked)}
									/>
									<span className="text-sm font-medium text-foreground">
										Menuntut konfirmasi tindakan di lokasi
									</span>
								</label>
								<p className="text-xs text-muted-foreground">
									Contoh: PLN harus mengonfirmasi listrik sudah dipadamkan sebelum penyemprotan.
									Kalimat ini muncul di halaman insiden dan di notifikasi ke OPD.
								</p>
								{data.requires_confirmation && (
									<div className="grid gap-1.5">
										<Input
											value={data.confirmation_label}
											onChange={(e) => setData('confirmation_label', e.target.value)}
											placeholder="Listrik sudah dipadamkan di lokasi kejadian"
										/>
										{errors.confirmation_label && (
											<InputError message={errors.confirmation_label} />
										)}
									</div>
								)}
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="notes">Catatan (Opsional)</Label>
								<Textarea
									id="notes"
									value={data.notes}
									onChange={(e) => setData('notes', e.target.value)}
									placeholder="Jam layanan, prosedur khusus, dsb."
								/>
								{errors.notes && <InputError message={errors.notes} />}
							</div>

							<label className="flex cursor-pointer items-center gap-2">
								<Checkbox
									checked={data.is_active}
									onCheckedChange={(checked) => setData('is_active', !!checked)}
								/>
								<span className="text-sm text-foreground">Aktif (bisa dipilih saat verifikasi)</span>
							</label>

							<div className="flex justify-end gap-2 border-t border-border pt-4">
								<Button type="button" variant="secondary" asChild>
									<Link href={route('admin.agencies.index')}>Batal</Link>
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
Create.layout = (page) => <AppLayout children={page} title="Tambah OPD" />;
