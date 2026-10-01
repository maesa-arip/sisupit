import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { IconSettings } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Edit(props) {
	const { data, setData, put, processing, errors } = useForm({
		notify_level_petugas: props.settings.notify_level_petugas,
		notify_level_relawan: props.settings.notify_level_relawan,
		notify_level_pejabat: props.settings.notify_level_pejabat,
		duplikat_radius_m: props.settings.duplikat_radius_m,
		duplikat_jendela_menit: props.settings.duplikat_jendela_menit,
	});

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

	const renderLevelSelect = (name, label, errorMessage) => (
		<div className="grid w-full items-center gap-1.5">
			<Label htmlFor={name}>{label}</Label>
			<Select value={data[name]} onValueChange={(value) => setData(name, value)}>
				<SelectTrigger>
					<SelectValue>
						{props.levels.find((level) => level.value === data[name])?.label ?? 'Pilih Tingkat'}
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{props.levels.map((level) => (
						<SelectItem key={level.value} value={level.value}>
							{level.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{errorMessage && <InputError message={errorMessage} />}
		</div>
	);

	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconSettings}
				/>
			</div>
			<Card className="mx-auto w-full max-w-2xl">
				<CardContent className="p-5 sm:p-6">
					<form
						className="divide-y divide-border/70 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0 [&>*]:py-4"
						onSubmit={onHandleSubmit}
					>
						<p className="text-sm text-muted-foreground">
							Notifikasi laporan selalu dimulai dari desa lokasi laporan, lalu disiarkan naik ke tingkat
							di atasnya sampai batas yang dipilih di sini. Petugas, relawan, dan pejabat bisa diatur
							dengan batas yang berbeda. Tingkat petugas juga menentukan DATA yang tampil bagi petugas
							(dashboard, daftar, detail, fasilitas): akun petugas yang lebih sempit diperluas sampai
							tingkat ini. Nilai di sini adalah BAWAAN; admin tiap kabupaten bisa menggantinya untuk
							kabupatennya sendiri lewat menu Jangkauan Petugas.
						</p>
						{renderLevelSelect(
							'notify_level_petugas',
							'Tingkat Siaran Petugas',
							errors.notify_level_petugas,
						)}
						{renderLevelSelect(
							'notify_level_relawan',
							'Tingkat Siaran Relawan',
							errors.notify_level_relawan,
						)}
						{renderLevelSelect(
							'notify_level_pejabat',
							'Tingkat Siaran Pejabat',
							errors.notify_level_pejabat,
						)}
						{/* Laporan ganda (TASK_55). */}
						<div className="space-y-4">
							<div>
								<h3 className="text-[15px] font-semibold text-foreground">Deteksi Laporan Ganda</h3>
								<p className="mt-1 text-sm text-muted-foreground">
									Laporan kebakaran baru dalam radius dan rentang waktu ini dari laporan yang masih
									aktif diusulkan sebagai kejadian yang sama. Usulan tidak membunyikan notifikasi
									laporan masuk lagi, dan admin yang memutuskan menggabungkannya. Isi 0 untuk
									mematikan deteksi.
								</p>
							</div>
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="grid w-full items-center gap-1.5">
									<Label htmlFor="duplikat_radius_m">Radius (meter)</Label>
									<Input
										id="duplikat_radius_m"
										type="number"
										inputMode="numeric"
										min={0}
										max={5000}
										value={data.duplikat_radius_m}
										onChange={(e) => setData('duplikat_radius_m', e.target.value)}
									/>
									{errors.duplikat_radius_m && <InputError message={errors.duplikat_radius_m} />}
								</div>
								<div className="grid w-full items-center gap-1.5">
									<Label htmlFor="duplikat_jendela_menit">Rentang waktu (menit)</Label>
									<Input
										id="duplikat_jendela_menit"
										type="number"
										inputMode="numeric"
										min={0}
										max={1440}
										value={data.duplikat_jendela_menit}
										onChange={(e) => setData('duplikat_jendela_menit', e.target.value)}
									/>
									{errors.duplikat_jendela_menit && (
										<InputError message={errors.duplikat_jendela_menit} />
									)}
								</div>
							</div>
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
