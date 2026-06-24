import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
					<SelectValue>{props.levels.find((level) => level.value === data[name])?.label ?? 'Pilih Tingkat'}</SelectValue>
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
		<div className="flex flex-col w-full pb-32">
			<div className="flex flex-col items-start justify-between mb-8 gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle title={props.page_settings.title} subtitle={props.page_settings.subtitle} icon={IconSettings} />
			</div>
			<Card>
				<CardContent className="p-6">
					<form className="space-y-6" onSubmit={onHandleSubmit}>
						<p className="text-sm text-muted-foreground">
							Notifikasi laporan selalu dimulai dari desa lokasi laporan, lalu disiarkan naik ke tingkat di atasnya
							sampai batas yang dipilih di sini. Petugas dan relawan bisa diatur dengan batas yang berbeda.
						</p>
						{renderLevelSelect('notify_level_petugas', 'Tingkat Siaran Petugas', errors.notify_level_petugas)}
						{renderLevelSelect('notify_level_relawan', 'Tingkat Siaran Relawan', errors.notify_level_relawan)}
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
