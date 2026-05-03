import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { IconCamera, IconUserEdit } from '@tabler/icons-react';
import { useRef, useState } from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
	const user = usePage().props.auth.user;
	const fileInputKTP = useRef(null);

    // 1. Tambahkan state untuk local preview gambar baru
    const [previewUrl, setPreviewUrl] = useState(null);

	// Ekstrak 'post', bukan 'patch'
	const { data, setData, post, errors, processing, recentlySuccessful,reset } = useForm({
		name: user.name ?? '',
		email: user.email ?? '',
		phone: user.phone ?? '',
		ktp: null, // WAJIB null, jangan gunakan user.ktp agar validasi backend tidak error
		_method: 'patch', // Tambahkan method spoofing di sini
	});
	console.log(data);
	// const onHandleChange = (e) => {
	// 	const key = e.target.name;
	// 	const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
	// 	setData(key, value);
	// };
    const onHandleChange = (e) => {
        const key = e.target.name;
        const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;

        // 2. Jika input yang berubah adalah file dan ada isinya, buat local preview
        if (e.target.type === 'file' && value) {
            setPreviewUrl(URL.createObjectURL(value));
        } 
        // Opsional: jika user cancel (memilih file tapi kemudian batal), hapus preview
        else if (e.target.type === 'file' && !value) {
            setPreviewUrl(null);
        }

        setData(key, value);
    };

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('profile.update'), {
            preserveScroll: true, // Agar halaman tidak loncat ke atas saat disave
            // Opsional: Setelah sukses, kita bisa mereset previewUrl karena user.ktp akan terupdate dari server
            onSuccess: () => {
                setPreviewUrl(null);
                fileInputKTP.current.value = null;
                reset('ktp'); // Reset data ktp ke null
            },
        });
	};



	return (
		<Card className={`overflow-hidden border-gray-200 shadow-sm dark:border-slate-800 ${className}`}>
			<CardHeader className="pb-6 border-b border-gray-100 bg-gray-50/50 dark:border-slate-800 dark:bg-slate-800/20">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-500">
						<IconUserEdit size={24} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-xl">Informasi Profil</CardTitle>
						<CardDescription className="mt-1.5">
							Perbarui informasi akun dan alamat email Anda di sini.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-6">
				<form onSubmit={onHandleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Nama Lengkap</Label>
							<Input
								id="name"
								name="name"
								value={data.name}
								onChange={onHandleChange}
								autoComplete="name"
								className="focus-visible:ring-amber-500 dark:bg-slate-900"
							/>
							{errors.name && <InputError message={errors.name} />}
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								name="email"
								value={data.email}
								onChange={onHandleChange}
								autoComplete="email"
								className="focus-visible:ring-amber-500 dark:bg-slate-900"
							/>
							{errors.email && <InputError message={errors.email} />}
						</div>

						<div className="space-y-2">
							<Label htmlFor="phone">Nomor Telepon</Label>
							<Input
								id="phone"
								name="phone"
								value={data.phone}
								onChange={onHandleChange}
								autoComplete="phone"
								className="focus-visible:ring-amber-500 dark:bg-slate-900"
							/>
							{errors.phone && <InputError message={errors.phone} />}
						</div>
						<div className="space-y-2">
                            <Label htmlFor="ktp" className="flex items-center gap-2">
                                <IconCamera className="w-4 h-4" /> Dokumen KTP (Opsional)
                            </Label>
                            
                            {/* 3. LOGIKA PREVIEW TERBAIK */}
                            {/* Tampilkan jika ada preview baru ATAU jika user sudah punya KTP di DB */}
                            {(previewUrl || user.ktp) && (
                                <div className="relative inline-block mb-4">
                                    <img
                                        // Prioritaskan previewUrl (file baru), jika tidak ada tampilkan user.ktp (file lama)
                                        // src={previewUrl ? previewUrl : `/storage/${user.ktp}`}
                                        src={previewUrl ? previewUrl : `${user.ktp}`}
                                        alt="Preview KTP"
                                        className={`object-cover h-32 border shadow-sm w-44 rounded-xl ${previewUrl ? 'border-amber-400 ring-2 ring-amber-400/50' : 'border-gray-200 dark:border-slate-700'}`}
                                    />
                                    
                                    {/* Badge Indikator agar user tahu ini belum tersimpan */}
                                    {previewUrl && (
                                        <span className="absolute top-2 left-2 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                            File Baru Terpilih
                                        </span>
                                    )}
                                </div>
                            )}

                            <div className="relative">
                                <Input
                                    name="ktp"
                                    id="ktp"
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputKTP}
                                    onChange={onHandleChange}
                                    className="h-12 cursor-pointer rounded-xl pt-2.5 file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-amber-100 file:px-4 file:py-1 file:text-xs file:font-bold file:text-amber-700 focus-visible:ring-amber-500 dark:bg-slate-900 dark:file:bg-amber-900/30 dark:file:text-amber-400"
                                />
                            </div>
                            {errors.ktp && <InputError message={errors.ktp} />}
                        </div>

						{/* <div className="space-y-2">
                            <Label htmlFor="ktp">Dokumen KTP (Opsional)</Label>
                            {user.ktp && (
                                <div className="mb-4">
                                    <img 
                                        src={`${user.ktp}`} 
                                        alt="Preview KTP" 
                                        className="object-cover h-32 border border-gray-200 shadow-sm w-44 rounded-xl dark:border-slate-700"
                                    />
                                </div>
                            )}
                            <Input
                                name="ktp"
                                id="ktp"
                                type="file"
                                ref={fileInputKTP}
                                onChange={onHandleChange}
                                className="cursor-pointer file:text-amber-700 file:bg-amber-50 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 file:font-medium dark:file:bg-amber-500/20 dark:file:text-amber-400 focus-visible:ring-amber-500 dark:bg-slate-900"
                            />
                            {errors.ktp && <InputError message={errors.ktp} />}
                        </div> */}
					</div>

					{mustVerifyEmail && user.email_verified_at === null && (
						<div className="p-4 mt-4 border rounded-xl border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-900/10">
							<p className="text-sm text-amber-800 dark:text-amber-300">
								Alamat email Anda belum diverifikasi.
								<Link
									href={route('verification.send')}
									method="post"
									as="button"
									className="ml-2 font-semibold underline rounded-md hover:text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:hover:text-amber-100 dark:focus:ring-offset-slate-900"
								>
									Klik di sini untuk mengirim ulang email verifikasi.
								</Link>
							</p>

							{status === 'verification-link-sent' && (
								<Alert className="mt-3 text-green-800 border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400">
									<AlertDescription>
										Tautan verifikasi baru telah dikirim ke alamat email Anda.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					<div className="flex items-center gap-4 pt-2">
						<Button
							className="px-8 text-white rounded-xl bg-amber-600 hover:bg-amber-700"
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
							<p className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-500">
								<span className="w-2 h-2 rounded-full animate-pulse bg-amber-500"></span>
								Tersimpan.
							</p>
						</Transition>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
