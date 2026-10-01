import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { IconBellCog } from '@tabler/icons-react';
import { toast } from 'sonner';

// Radix Select tak menerima item bernilai string kosong, jadi "ikut setelan global" memakai
// penanda ini di layar dan dikirim ke server sebagai null (TASK_62).
const IKUT_GLOBAL = 'ikut-global';

export default function Edit(props) {
	const { data, setData, put, processing, errors, transform } = useForm({
		notify_level_petugas: props.notify_level_petugas || IKUT_GLOBAL,
	});

	transform((form) => ({
		notify_level_petugas: form.notify_level_petugas === IKUT_GLOBAL ? null : form.notify_level_petugas,
	}));

	const options = [
		{ value: IKUT_GLOBAL, label: `Ikut setelan pusat (${props.global_level_label})` },
		...props.levels,
	];

	const onHandleSubmit = (e) => {
		e.preventDefault();
		put(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconBellCog}
				/>
			</div>
			<Card className="mx-auto w-full max-w-2xl">
				<CardContent className="p-5 sm:p-6">
					<form
						className="divide-y divide-border/70 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-4"
						onSubmit={onHandleSubmit}
					>
						<div className="space-y-2 text-sm text-muted-foreground">
							{/* TASK_63: setelan ini mengatur notifikasi DAN data yang tampil - satu wilayah
							    untuk keduanya, supaya yang membangunkan petugas selalu bisa ia buka. */}
							<p>
								Tingkat ini menentukan jangkauan petugas di{' '}
								{props.nama_instansi ? <b>{props.nama_instansi}</b> : 'kabupaten Anda'}: notifikasi
								laporan yang ia terima DAN data yang tampil di dashboard, daftar laporan, halaman
								detail, serta daftar fasilitas. Keduanya selalu sama, jadi laporan yang membangunkan
								petugas pasti bisa ia buka.
							</p>
							<p>
								Contoh: bila dipilih Kota/Kabupaten, petugas yang akunnya terdaftar di satu desa ikut
								menerima dan melihat laporan se-kota. Akun petugas yang wilayahnya sudah lebih luas dari
								pilihan ini tetap melihat data sesuai akunnya.
							</p>
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="notify_level_petugas">Jangkauan Petugas</Label>
							<Select
								value={data.notify_level_petugas}
								onValueChange={(value) => setData('notify_level_petugas', value)}
							>
								<SelectTrigger id="notify_level_petugas">
									<SelectValue>
										{options.find((option) => option.value === data.notify_level_petugas)?.label ??
											'Pilih Tingkat'}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									{options.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{errors.notify_level_petugas && <InputError message={errors.notify_level_petugas} />}
						</div>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button className="h-11 rounded-xl px-6" type="submit" disabled={processing}>
								Simpan
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
Edit.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
