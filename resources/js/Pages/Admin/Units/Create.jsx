import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
		<div className="flex flex-col w-full h-full space-y-6">
			<Head title="Registrasi Unit Baru" />

			<div className="flex flex-col items-start justify-between mb-2 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Registrasi Unit Baru"
					subtitle="Tambahkan unit/armada operasional ke katalog wilayah Anda."
					icon={IconTruck}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.units.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="shadow-none border-border">
					<CardContent className="p-6">
						<form className="space-y-5" onSubmit={onHandleSubmit}>
							<div className="flex items-start gap-3 p-3 text-teal-700 dark:text-teal border border-teal-100 dark:border-teal/30 rounded-md bg-teal-50 dark:bg-teal/10">
								<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
								<p className="text-xs font-medium leading-relaxed">
									Unit otomatis terdaftar pada yurisdiksi wilayah Anda. Status <b>Dikerahkan</b> diatur
									otomatis lewat alur penanganan insiden, bukan dari sini.
								</p>
							</div>

							<div className="grid gap-1.5">
								<Label htmlFor="name">Nama Unit</Label>
								<Input
									name="name"
									id="name"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
									className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
									placeholder="Misal: Truk Pemadam 01"
								/>
								{errors.name && <InputError message={errors.name} />}
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="grid gap-1.5">
									<Label>Jenis Unit</Label>
									<Select value={data.type} onValueChange={(value) => setData('type', value)}>
										<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
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
										<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
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
								<Select
									value={data.pos_pemadam_id ? String(data.pos_pemadam_id) : 'none'}
									onValueChange={(value) => setData('pos_pemadam_id', value === 'none' ? '' : value)}
								>
									<SelectTrigger className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal">
										<SelectValue placeholder="Tanpa Pos" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="none">Tanpa Pos</SelectItem>
										{pos_options.map((pos) => (
											<SelectItem key={pos.id} value={String(pos.id)}>
												{pos.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.pos_pemadam_id && <InputError message={errors.pos_pemadam_id} />}
							</div>

							<div className="flex justify-end gap-2 pt-2 border-t border-border">
								<Button type="button" variant="secondary" asChild>
									<Link href={route('admin.units.index')}>Batal</Link>
								</Button>
								<Button
									type="submit"
									disabled={processing}
									className="text-white bg-teal-600 dark:bg-teal border-transparent shadow-none hover:bg-teal-700 dark:hover:bg-teal/90"
								>
									<IconDeviceFloppy className="w-4 h-4 mr-2" /> Simpan
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
