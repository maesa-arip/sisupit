import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { IconCamera, IconUserEdit, IconX } from '@tabler/icons-react';
import { useRef, useState } from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
	const user = usePage().props.auth.user;
	const fileInputKTP = useRef(null);

	const [previewUrl, setPreviewUrl] = useState(null);

	const { data, setData, post, errors, processing, recentlySuccessful, reset } = useForm({
		name: user.name ?? '',
		email: user.email ?? '',
		phone: user.phone ?? '',
		ktp: null,
		_method: 'patch',
	});

	const onHandleChange = (e) => {
		const key = e.target.name;
		const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;

		if (e.target.type === 'file' && value) {
			setPreviewUrl(URL.createObjectURL(value));
		} else if (e.target.type === 'file' && !value) {
			setPreviewUrl(null);
		}

		setData(key, value);
	};

	// Fungsi ini sekarang hanya membatalkan file baru yang dipilih
	const removePhoto = () => {
		setData('ktp', null);
		setPreviewUrl(null);
		if (fileInputKTP.current) {
			fileInputKTP.current.value = '';
		}
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('profile.update'), {
			preserveScroll: true,
			onSuccess: () => {
				setPreviewUrl(null);
				if (fileInputKTP.current) fileInputKTP.current.value = null;
				reset('ktp');
			},
		});
	};

	return (
		<Card className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
			<CardHeader className="border-b border-border bg-transparent pb-5">
				<div className="flex items-center gap-3">
					<div className="rounded-lg border border-border bg-muted p-2 text-muted-foreground">
						<IconUserEdit size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-base font-semibold text-foreground">Informasi Profil</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Perbarui informasi akun dan alamat email Anda di sini.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				<form onSubmit={onHandleSubmit} className="space-y-5">
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="name" className="text-sm font-medium text-foreground">
								Nama Lengkap
							</Label>
							<Input
								id="name"
								name="name"
								value={data.name}
								onChange={onHandleChange}
								autoComplete="name"
								className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="email" className="text-sm font-medium text-foreground">
								Email
							</Label>
							<Input
								id="email"
								name="email"
								value={data.email}
								onChange={onHandleChange}
								autoComplete="email"
								className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="phone" className="text-sm font-medium text-foreground">
								Nomor Telepon
							</Label>
							<Input
								id="phone"
								name="phone"
								value={data.phone}
								onChange={onHandleChange}
								autoComplete="phone"
								className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>

						{/* --- REVISI: BAGIAN KTP --- */}
						<div className="space-y-2 md:col-span-2 lg:col-span-1">
							<Label htmlFor="ktp" className="text-sm font-medium text-foreground">
								Dokumen KTP (Opsional)
							</Label>

							<div className="flex flex-col gap-4 sm:flex-row">
								{/* Menampilkan Foto jika sudah ada atau sedang dipreview */}
								{(previewUrl || user.ktp) && (
									<div className="group relative h-32 w-full shrink-0 overflow-hidden rounded-lg border border-border shadow-sm sm:w-48">
										<img
											src={
												previewUrl
													? previewUrl
													: user.ktp.startsWith('http')
														? user.ktp
														: `${user.ktp}`
											}
											alt="Preview KTP"
											className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
										/>
										{/* Tombol X hanya muncul jika user sedang mem-preview file baru */}
										{previewUrl && (
											<button
												type="button"
												onClick={removePhoto}
												className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md border border-transparent bg-background/90 text-red-600 shadow-sm backdrop-blur-sm transition-colors hover:border-red-200 hover:bg-red-50 dark:text-destructive dark:hover:border-destructive/20 dark:hover:bg-destructive/10"
												title="Batal gunakan file ini"
											>
												<IconX stroke={2} className="h-4 w-4" />
											</button>
										)}
									</div>
								)}

								{/* Kotak Upload selalu ditampilkan agar bisa "Ganti File" */}
								<div
									className={`flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center transition-colors hover:bg-muted ${
										previewUrl || user.ktp ? 'h-32 w-full flex-1 sm:w-auto' : 'w-full'
									}`}
								>
									<IconCamera className="mb-1.5 h-5 w-5 text-muted-foreground" />
									<p className="mb-3 text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
									<label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background px-4 text-xs font-medium text-foreground transition-colors focus-within:ring-2 focus-within:ring-destructive/50 hover:bg-accent">
										{previewUrl || user.ktp ? 'Ganti File' : 'Browse Files'}
										<input
											name="ktp"
											id="ktp"
											type="file"
											accept="image/*"
											ref={fileInputKTP}
											onChange={onHandleChange}
											className="sr-only"
										/>
									</label>
								</div>
							</div>
							{errors.ktp && <InputError message={errors.ktp} />}
						</div>
					</div>

					{mustVerifyEmail && user.email_verified_at === null && (
						<div className="mt-2 rounded-md border border-border bg-muted p-4">
							<p className="text-sm text-foreground">
								Alamat email Anda belum diverifikasi.
								<Link
									href={route('verification.send')}
									method="post"
									as="button"
									className="ml-1 rounded-sm font-semibold underline hover:text-foreground/80 focus:outline-none focus:ring-2 focus:ring-destructive"
								>
									Klik di sini untuk mengirim ulang.
								</Link>
							</p>

							{status === 'verification-link-sent' && (
								<Alert className="mt-3 border-green-200 bg-green-50 text-green-800 dark:border-success/20 dark:bg-success/10 dark:text-success">
									<AlertDescription>
										Tautan verifikasi baru telah dikirim ke alamat email Anda.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					<div className="flex items-center gap-4 pt-2">
						<Button
							className="h-9 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
							disabled={processing}
						>
							Simpan Perubahan
						</Button>

						<Transition
							show={recentlySuccessful}
							enter="transition ease-in-out duration-300"
							enterFrom="opacity-0 translate-x-2"
							enterTo="opacity-100 translate-x-0"
							leave="transition ease-in-out duration-300"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<p className="text-sm font-medium text-success">Tersimpan.</p>
						</Transition>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
