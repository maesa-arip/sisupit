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
		<Card className={`overflow-hidden border border-[#e5e5e5] bg-white shadow-sm dark:bg-[#151515] dark:border-[#262626] rounded-xl ${className}`}>
			<CardHeader className="pb-5 border-b border-[#e5e5e5] bg-transparent dark:border-[#262626]">
				<div className="flex items-center gap-3">
					<div className="rounded-lg bg-gray-50 border border-[#e5e5e5] p-2 text-gray-600 dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300">
						<IconUserEdit size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Informasi Profil</CardTitle>
						<CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
							Perbarui informasi akun dan alamat email Anda di sini.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				<form onSubmit={onHandleSubmit} className="space-y-5">
					<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div className="space-y-1.5">
							<Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</Label>
							<Input
								id="name"
								name="name"
								value={data.name}
								onChange={onHandleChange}
								autoComplete="name"
								className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</Label>
							<Input
								id="email"
								name="email"
								value={data.email}
								onChange={onHandleChange}
								autoComplete="email"
								className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>

						<div className="space-y-1.5">
							<Label htmlFor="phone" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Telepon</Label>
							<Input
								id="phone"
								name="phone"
								value={data.phone}
								onChange={onHandleChange}
								autoComplete="phone"
								className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>
						
						{/* --- REVISI: BAGIAN KTP --- */}
						<div className="space-y-2 md:col-span-2 lg:col-span-1">
							<Label htmlFor="ktp" className="text-sm font-medium text-gray-700 dark:text-gray-300">Dokumen KTP (Opsional)</Label>
							
							<div className="flex flex-col gap-4 sm:flex-row">
								{/* Menampilkan Foto jika sudah ada atau sedang dipreview */}
								{(previewUrl || user.ktp) && (
									<div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden border border-[#e5e5e5] dark:border-[#262626] shadow-sm group shrink-0">
										<img
											src={previewUrl ? previewUrl : (user.ktp.startsWith('http') ? user.ktp : `${user.ktp}`)}
											alt="Preview KTP"
											className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
										/>
										{/* Tombol X hanya muncul jika user sedang mem-preview file baru */}
										{previewUrl && (
											<button
												type="button"
												onClick={removePhoto}
												className="absolute flex items-center justify-center text-red-600 transition-colors border border-transparent rounded-md shadow-sm top-2 right-2 w-7 h-7 bg-white/90 dark:bg-black/80 hover:bg-red-50 dark:text-red-400 backdrop-blur-sm hover:border-red-200 dark:hover:border-red-900/50"
												title="Batal gunakan file ini"
											>
												<IconX stroke={2} className="w-4 h-4" />
											</button>
										)}
									</div>
								)}

								{/* Kotak Upload selalu ditampilkan agar bisa "Ganti File" */}
								<div className={`border border-dashed border-[#e5e5e5] dark:border-[#333] rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-[#101010] transition-colors hover:bg-gray-50 dark:hover:bg-[#151515] ${
									(previewUrl || user.ktp) ? 'w-full sm:w-auto flex-1 h-32' : 'w-full'
								}`}>
									<IconCamera className="w-5 h-5 text-gray-500 mb-1.5" />
									<p className="mb-3 text-xs text-gray-500 dark:text-gray-400">PNG, JPG up to 5MB</p>
									<label className="cursor-pointer inline-flex items-center justify-center h-8 px-4 rounded-md bg-white border border-[#e5e5e5] text-xs font-medium text-gray-700 hover:bg-gray-50 dark:bg-[#1f1f1f] dark:border-[#333] dark:text-gray-300 dark:hover:bg-[#262626] transition-colors focus-within:ring-2 focus-within:ring-[#b42826]/50">
										{(previewUrl || user.ktp) ? 'Ganti File' : 'Browse Files'}
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
						<div className="p-4 mt-2 border border-[#e5e5e5] rounded-md bg-gray-50 dark:border-[#333] dark:bg-[#101010]">
							<p className="text-sm text-gray-700 dark:text-gray-300">
								Alamat email Anda belum diverifikasi.
								<Link
									href={route('verification.send')}
									method="post"
									as="button"
									className="ml-1 font-semibold underline rounded-sm hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#b42826] dark:hover:text-gray-100"
								>
									Klik di sini untuk mengirim ulang.
								</Link>
							</p>

							{status === 'verification-link-sent' && (
								<Alert className="mt-3 text-green-800 border-green-200 bg-green-50 dark:border-[#112a1d] dark:bg-[#0a1811] dark:text-green-400">
									<AlertDescription>
										Tautan verifikasi baru telah dikirim ke alamat email Anda.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					<div className="flex items-center gap-4 pt-2">
						<Button
							className="h-9 px-4 rounded-md text-sm font-medium text-white transition-colors bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50"
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
							<p className="text-sm font-medium text-gray-600 dark:text-gray-400">
								Tersimpan.
							</p>
						</Transition>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}