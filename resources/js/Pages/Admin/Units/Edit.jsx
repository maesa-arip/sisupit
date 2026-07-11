import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconAlertTriangle, IconArrowLeft, IconDeviceFloppy, IconTruck } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Edit({ unit, pos_options = [], type_options = [] }) {
	const isDispatched = unit.status === 'dispatched';

	const { data, setData, put, processing, errors } = useForm({
		name: unit.name || '',
		type: unit.type || type_options[0] || '',
		// status hanya available/maintenance; unit yang sedang dikerahkan diset ke 'available'
		// sebagai default form (lihat peringatan), pengelolaan dispatch via alur insiden.
		status: ['available', 'maintenance'].includes(unit.status) ? unit.status : 'available',
		pos_pemadam_id: unit.pos_pemadam_id ? String(unit.pos_pemadam_id) : '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		put(route('admin.units.update', unit.id), {
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
			<Head title={`Modifikasi Unit: ${unit.name}`} />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Modifikasi Data Unit"
					subtitle="Perbarui nama, jenis, status, atau homebase unit."
					icon={IconTruck}
				/>
				<Button variant="secondary" size="sm" asChild>
					<Link href={route('admin.units.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="border-border shadow-none">
					<CardContent className="p-6">
						<form className="space-y-5" onSubmit={onHandleSubmit}>
							{isDispatched && (
								<div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3 text-warning">
									<IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
									<p className="text-xs font-medium leading-relaxed">
										Unit ini sedang <b>dikerahkan</b> ke sebuah insiden. Sebaiknya tarik unit dari
										insiden terlebih dahulu — menyimpan dari sini akan mengubah statusnya.
									</p>
								</div>
							)}

							<div className="grid gap-1.5">
								<Label htmlFor="name">Nama Unit</Label>
								<Input
									name="name"
									id="name"
									value={data.name}
									onChange={(e) => setData('name', e.target.value)}
									className="focus-visible:ring-teal-500 dark:focus-visible:ring-teal"
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
									value={data.pos_pemadam_id || 'none'}
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

							<div className="flex justify-end gap-2 border-t border-border pt-2">
								<Button type="button" variant="secondary" asChild>
									<Link href={route('admin.units.index')}>Batal</Link>
								</Button>
								<Button
									type="submit"
									disabled={processing}
									className="border-transparent bg-teal-600 text-white shadow-none hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90"
								>
									<IconDeviceFloppy className="mr-2 h-4 w-4" /> Simpan Update
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
Edit.layout = (page) => <AppLayout children={page} title="Modifikasi Unit" />;
