import { groupedRowsClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Link, useForm } from '@inertiajs/react';
import { IconAlertCircle, IconArrowLeft, IconSpeakerphone } from '@tabler/icons-react';
import { toast } from 'sonner';

export default function Create(props) {
	const { data, setData, reset, post, processing, errors } = useForm({
		message: '',
		url: '',
		is_active: false,
		_method: props.page_settings.method,
	});
	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(props.page_settings.action, {
			preserveScroll: true,
			preserveState: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};
	const onHandleReset = () => {
		reset();
	};
	return (
		<div className="flex w-full flex-col pb-32">
			<div className="mb-8 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title={props.page_settings.title}
					subtitle={props.page_settings.subtitle}
					icon={IconAlertCircle}
				/>
				<Button className="rounded-full" variant="outline" size="sm" asChild>
					<Link href={route('admin.announcements.index')}>
						<IconArrowLeft className="size-4" />
						Kembali
					</Link>
				</Button>
			</div>
			<Card className="w-full max-w-2xl">
				<CardContent className="p-5 sm:p-6">
					<form className={groupedRowsClass} onSubmit={onHandleSubmit}>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="message">Pesan</Label>
							<Textarea
								name="message"
								id="message"
								value={data.message}
								rows={3}
								maxLength={255}
								placeholder="Mis. Pemeliharaan server Minggu 02.00-04.00 WITA, layanan lapor tetap aktif."
								onChange={onHandleChange}
							/>
							<div className="flex items-start justify-between gap-3">
								{errors.message ? <InputError message={errors.message} /> : <span />}
								<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
									{data.message.length}/255
								</span>
							</div>
						</div>
						<div className="grid w-full items-center gap-1.5">
							<Label htmlFor="url">
								Tautan <span className="font-normal text-muted-foreground">(opsional)</span>
							</Label>
							<Input
								name="url"
								id="url"
								value={data.url}
								type="text"
								inputMode="url"
								placeholder="https://..."
								onChange={onHandleChange}
							/>
							<p className="text-xs text-muted-foreground">
								Tampil sebagai tombol "Selengkapnya" di pengumuman.
							</p>
							{errors.url && <InputError message={errors.url} />}
						</div>
						<div className="grid w-full items-center gap-1.5">
							<div className="flex items-start justify-between gap-4">
								<div className="grid gap-1">
									<Label htmlFor="is_active">Tampilkan sekarang</Label>
									<p className="text-xs leading-snug text-muted-foreground">
										Hanya satu pengumuman yang tampil. Mengaktifkan ini menonaktifkan pengumuman
										lain.
									</p>
								</div>
								<Switch
									id="is_active"
									name="is_active"
									checked={!!data.is_active}
									onCheckedChange={(checked) => setData('is_active', checked)}
								/>
							</div>
							{errors.is_active && <InputError message={errors.is_active} />}
						</div>
						{/* Pratinjau: rupa ringkas kartu Components/Banner.jsx yang tampil di atas halaman pengguna. */}
						<div className="grid gap-1.5">
							<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								Pratinjau
							</p>
							<div className="flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
								<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
									<IconSpeakerphone className="h-4 w-4" stroke={2} />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
										Pengumuman
									</p>
									<p className="mt-0.5 whitespace-pre-line break-words text-sm leading-snug text-foreground">
										{data.message || (
											<span className="text-muted-foreground">Isi pesan tampil di sini.</span>
										)}
									</p>
									{data.url && (
										<p className="mt-1.5 text-sm font-semibold text-primary">
											Selengkapnya &rsaquo;
										</p>
									)}
								</div>
							</div>
						</div>
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button className="h-11 rounded-xl" type="button" variant="ghost" onClick={onHandleReset}>
								Atur ulang
							</Button>
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
Create.layout = (page) => <AppLayout children={page} title={page.props.page_settings.title} />;
