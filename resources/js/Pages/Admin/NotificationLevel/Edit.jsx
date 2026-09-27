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
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<div className="space-y-2 text-sm text-muted-foreground">
							<p>
								Notifikasi laporan di{' '}
								{props.nama_instansi ? <b>{props.nama_instansi}</b> : 'kabupaten Anda'} selalu dikirim
								ke petugas yang wilayah akunnya di desa lokasi laporan, lalu naik ke petugas berwilayah
								kecamatan dan kota/kabupaten sampai batas yang dipilih di sini.
							</p>
							<p>
								Batas ini tidak melebarkan jangkauan akun petugas yang wilayahnya diatur sampai desa:
								akun seperti itu hanya menerima laporan dari desanya sendiri. Agar petugas menerima
								laporan se-kota, atur wilayah akunnya ke tingkat kota/kabupaten di Manajemen Pengguna.
							</p>
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="notify_level_petugas">Tingkat Siaran Petugas</Label>
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
						<div className="flex justify-end gap-x-2">
							<Button type="submit" variant="orange" size="sm" disabled={processing}>
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
