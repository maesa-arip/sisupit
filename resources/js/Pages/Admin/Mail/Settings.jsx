import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, router, useForm } from '@inertiajs/react';
import {
	IconAlertTriangle,
	IconCircleCheck,
	IconDeviceFloppy,
	IconInfoCircle,
	IconMailCog,
	IconPlugConnected,
} from '@tabler/icons-react';
import { toast } from 'sonner';

/**
 * Pengaturan kotak surat Email Dinas per kabupaten (TASK_56, K8) - diisi ADMIN kabupaten
 * sendiri, bukan superadmin dan bukan lewat `.env`.
 *
 * Tiga hal di layar ini adalah ATURAN, bukan pilihan gaya:
 *  1. Kolom password selalu KOSONG saat halaman dibuka, dan kosong berarti "jangan ubah".
 *     Servernya tak pernah mengirimkan passwordnya ke sini - yang dikirim cuma `has_password`.
 *  2. Tombol "Uji Koneksi" ada supaya salah ketik host/port ketahuan DI SINI, bukan nanti
 *     saat surat resmi pertama gagal terkirim - kegagalan yang menimpa orang lain.
 *  3. Alamat pengirim dipakai sekaligus sebagai nama akun kotak suratnya; yang bebas diatur
 *     hanya NAMA pengirim. Penyedia surat menulis ulang alamat yang tak cocok dengan akunnya.
 */
export default function Settings({ settings, encryption_options = [], feature_enabled, nama_instansi }) {
	const { data, setData, put, processing, errors } = useForm({
		mail_from_address: settings?.mail_from_address || '',
		mail_from_name: settings?.mail_from_name || '',
		mail_reply_to: settings?.mail_reply_to || '',
		mail_host: settings?.mail_host || '',
		mail_port: settings?.mail_port || 587,
		mail_encryption: settings?.mail_encryption || 'tls',
		mail_signature: settings?.mail_signature || '',
		// Sengaja selalu kosong: server tidak pernah mengirim nilainya, dan kosong = jangan ubah.
		mail_password: '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		put(route('admin.mail-settings.update'), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	const ujiKoneksi = () => {
		router.post(
			route('admin.mail-settings.test'),
			{},
			{
				preserveScroll: true,
				onSuccess: (success) => {
					const flash = flashMessage(success);
					if (flash) toast[flash.type](flash.message);
				},
			},
		);
	};

	const terakhirDiuji = settings?.mail_verified_at
		? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(
				new Date(settings.mail_verified_at),
			)
		: null;

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Pengaturan Email Dinas" />

			<HeaderTitle
				title="Pengaturan Email Dinas"
				subtitle={`Kotak surat yang dipakai ${nama_instansi || 'instansi ini'} untuk mengirim surat ke pejabat.`}
				icon={IconMailCog}
			/>

			{!feature_enabled && (
				<div className="flex items-start gap-3 rounded-md border border-warning/20 bg-warning/10 p-3 text-warning">
					<IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
					<p className="text-xs font-medium leading-relaxed">
						Fitur Email Dinas belum dinyalakan untuk kabupaten ini. Pengaturan di bawah tetap bisa disimpan,
						tapi menu Email Dinas baru muncul setelah superadmin menyalakannya.
					</p>
				</div>
			)}

			<div className="w-full max-w-2xl">
				<Card className="mx-auto w-full max-w-2xl">
					
					<CardContent className="p-5 sm:p-6">
						<form className="space-y-5" onSubmit={onHandleSubmit}>
							<div className="flex items-start gap-3 rounded-md border border-info/20 bg-info/10 p-3 text-info">
								<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
								<p className="text-xs font-medium leading-relaxed">
									Alamat di bawah dipakai sekaligus sebagai nama akun kotak surat. Untuk Google
									Workspace, isi Sandi Aplikasi (App Password) - bukan kata sandi akun biasa.
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_from_address">Alamat kotak surat</Label>
								<Input
									id="mail_from_address"
									type="email"
									value={data.mail_from_address}
									onChange={(e) => setData('mail_from_address', e.target.value)}
									placeholder="damkar@namakota.go.id"
								/>
								{errors.mail_from_address && <InputError message={errors.mail_from_address} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_from_name">Nama pengirim</Label>
								<Input
									id="mail_from_name"
									value={data.mail_from_name}
									onChange={(e) => setData('mail_from_name', e.target.value)}
									placeholder="Damkar Kota Denpasar"
								/>
								<p className="text-xs text-muted-foreground">
									Nama ini yang terlihat penerima. Alamatnya tidak bisa dibedakan dari akun di atas.
								</p>
								{errors.mail_from_name && <InputError message={errors.mail_from_name} />}
							</div>

							<div className="grid gap-4 sm:grid-cols-3">
								<div className="space-y-2 sm:col-span-2">
									<Label htmlFor="mail_host">Server SMTP</Label>
									<Input
										id="mail_host"
										value={data.mail_host}
										onChange={(e) => setData('mail_host', e.target.value)}
										placeholder="smtp.gmail.com"
									/>
									{errors.mail_host && <InputError message={errors.mail_host} />}
								</div>
								<div className="space-y-2">
									<Label htmlFor="mail_port">Port</Label>
									<Input
										id="mail_port"
										type="number"
										value={data.mail_port}
										onChange={(e) => setData('mail_port', e.target.value)}
									/>
									{errors.mail_port && <InputError message={errors.mail_port} />}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_encryption">Enkripsi</Label>
								<Select
									value={data.mail_encryption}
									onValueChange={(value) => setData('mail_encryption', value)}
								>
									<SelectTrigger id="mail_encryption">
										<SelectValue placeholder="Pilih enkripsi" />
									</SelectTrigger>
									<SelectContent>
										{encryption_options.map((option) => (
											<SelectItem key={option} value={option}>
												{option.toUpperCase()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{errors.mail_encryption && <InputError message={errors.mail_encryption} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_password">
									Sandi kotak surat{' '}
									<span className="font-normal text-muted-foreground">
										{settings?.has_password ? '(tersimpan)' : '(belum diisi)'}
									</span>
								</Label>
								<Input
									id="mail_password"
									type="password"
									autoComplete="new-password"
									value={data.mail_password}
									onChange={(e) => setData('mail_password', e.target.value)}
									placeholder={settings?.has_password ? 'Biarkan kosong bila tidak diubah' : ''}
								/>
								{errors.mail_password && <InputError message={errors.mail_password} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_reply_to">Alamat balasan (opsional)</Label>
								<Input
									id="mail_reply_to"
									type="email"
									value={data.mail_reply_to}
									onChange={(e) => setData('mail_reply_to', e.target.value)}
									placeholder="humas@namakota.go.id"
								/>
								{errors.mail_reply_to && <InputError message={errors.mail_reply_to} />}
							</div>

							<div className="space-y-2">
								<Label htmlFor="mail_signature">Tanda tangan surat (opsional)</Label>
								<Textarea
									id="mail_signature"
									rows={4}
									value={data.mail_signature}
									onChange={(e) => setData('mail_signature', e.target.value)}
									placeholder={'Hormat kami,\nDinas Pemadam Kebakaran dan Penyelamatan'}
								/>
								{errors.mail_signature && <InputError message={errors.mail_signature} />}
							</div>

							<div className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3">
								{terakhirDiuji ? (
									<IconCircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
								) : (
									<IconAlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
								)}
								<div className="space-y-1">
									<p className="text-xs font-medium leading-relaxed text-foreground">
										{terakhirDiuji
											? `Koneksi terakhir berhasil ${terakhirDiuji}.`
											: 'Koneksi belum pernah diuji sejak kredensial terakhir diubah.'}
									</p>
									<p className="text-xs leading-relaxed text-muted-foreground">
										Uji koneksi membuktikan server, port, dan sandi dapat dipakai login. Ia tidak
										membuktikan surat pasti diterima penerima.
									</p>
								</div>
							</div>

							<div className="flex flex-col justify-end gap-2 border-t border-border pt-4 sm:flex-row">
								<Button
									className="h-11 rounded-xl"
									type="button"
									variant="outline"
									onClick={ujiKoneksi}
								>
									<IconPlugConnected className="mr-2 h-4 w-4" /> Uji Koneksi
								</Button>
								<Button className="h-11 rounded-xl px-6" type="submit" disabled={processing}>
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

Settings.layout = (page) => <AppLayout children={page} title="Pengaturan Email Dinas" />;
