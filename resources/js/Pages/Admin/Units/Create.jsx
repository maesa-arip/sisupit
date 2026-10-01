import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Combobox } from '@/Components/ui/combobox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconDeviceFloppy, IconInfoCircle, IconTruck } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Create({ pos_options = [], type_options = [] }) {
	const { data, setData, post, processing, errors } = useForm({
		name: '',
		type: type_options[0] || '',
		status: 'available',
		pos_pemadam_id: '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('admin.units.store'), {
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
			<Head title="Registrasi Unit Baru" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Registrasi Unit Baru"
					subtitle="Tambahkan unit/armada operasional ke katalog wilayah Anda."
					icon={IconTruck}
				/>
				<Button className="rounded-full" variant="outline" size="sm" asChild>
					<Link href={route('admin.units.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="mx-auto w-full max-w-2xl">
					
					<CardContent className="p-5 sm:p-6">
						<form className="space-y-5" onSubmit={onHandleSubmit}>
							<div className="flex items-start gap-3 rounded-2xl border border-border/70 bg-card p-4 text-muted-foreground shadow-sm">
								<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
								<p className="text-xs font-medium leading-relaxed">
									Unit otomatis terdaftar pada yurisdiksi wilayah Anda. Status <b>Dikerahkan</b>{' '}
									diatur otomatis lewat alur penanganan insiden, bukan dari sini.
								</p>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="name">Nama Unit</Label>
								<Input
									name="name"
									id="name"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
									className="h-11 rounded-xl"
									placeholder="Misal: Truk Pemadam 01"
								/>
								{errors.name && <InputError message={errors.name} />}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="grid gap-1.5">
									<Label>Jenis Unit</Label>
									<Select value={data.type} onValueChange={(value) => setData('type', value)}>
										<SelectTrigger className="h-11 rounded-xl">
											<SelectValue placeholder="Pilih Jenis" />
										</SelectTrigger>
										<SelectContent>
											{type_options.map((t) => (
												<SelectItem key={t} value={t}>
													{t}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{errors.type && <InputError message={errors.type} />}
								</div>

								<div className="grid gap-1.5">
									<Label>Status</Label>
									<Select value={data.status} onValueChange={(value) => setData('status', value)}>
										<SelectTrigger className="h-11 rounded-xl">
											<SelectValue placeholder="Pilih Status" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="available">Siap Pakai</SelectItem>
											<SelectItem value="maintenance">Perbaikan</SelectItem>
										</SelectContent>
									</Select>
									{errors.status && <InputError message={errors.status} />}
								</div>
							</div>

							<div className="grid gap-1.5">
								<Label>Homebase / Pos Pemadam (Opsional)</Label>
								{/* Kosong = "Tanpa Pos"; mengetuk pos yang sedang terpilih melepasnya kembali. */}
								<Combobox
									items={pos_options.map((pos) => ({ code: String(pos.id), name: pos.name }))}
									value={data.pos_pemadam_id ? String(data.pos_pemadam_id) : ''}
									onChange={(value) => setData('pos_pemadam_id', value)}
									placeholder="Tanpa Pos"
									emptyText="Pos tidak ditemukan."
									className="h-11 rounded-xl"
								/>
								{errors.pos_pemadam_id && <InputError message={errors.pos_pemadam_id} />}
							</div>

							<div className="flex justify-end gap-2 border-t border-border pt-2">
								<Button className="h-11 rounded-xl" type="button" variant="ghost" asChild>
									<Link href={route('admin.units.index')}>Batal</Link>
								</Button>
								<Button type="submit" disabled={processing} className="h-11 rounded-xl px-6">
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
Create.layout = (page) => <AppLayout children={page} title="Registrasi Unit" />;
