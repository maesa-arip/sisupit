import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import { IconUserEdit } from '@tabler/icons-react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;
    const fileInputKTP = useRef(null);
    
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        ktp: user.ktp ?? null,
    });

    const onHandleChange = (e) => {
        const key = e.target.name;
        const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setData(key, value);
    };

    const onHandleSubmit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <Card className={`overflow-hidden border-gray-200 dark:border-slate-800 shadow-sm ${className}`}>
            <CardHeader className="pb-6 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl">
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
                            <Label htmlFor="ktp">Dokumen KTP (Opsional)</Label>
                            <Input
                                name="ktp"
                                id="ktp"
                                type="file"
                                ref={fileInputKTP}
                                onChange={onHandleChange}
                                className="cursor-pointer file:text-amber-700 file:bg-amber-50 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-4 file:font-medium dark:file:bg-amber-500/20 dark:file:text-amber-400 focus-visible:ring-amber-500 dark:bg-slate-900"
                            />
                            {errors.ktp && <InputError message={errors.ktp} />}
                        </div>
                    </div>

                    {mustVerifyEmail && user.email_verified_at === null && (
                        <div className="p-4 mt-4 border bg-amber-50 dark:bg-amber-900/10 rounded-xl border-amber-200 dark:border-amber-900/30">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                Alamat email Anda belum diverifikasi.
                                <Link
                                    href={route('verification.send')}
                                    method="post"
                                    as="button"
                                    className="ml-2 font-semibold underline rounded-md hover:text-amber-900 dark:hover:text-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                                >
                                    Klik di sini untuk mengirim ulang email verifikasi.
                                </Link>
                            </p>

                            {status === 'verification-link-sent' && (
                                <Alert className="mt-3 text-green-800 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30">
                                    <AlertDescription>
                                        Tautan verifikasi baru telah dikirim ke alamat email Anda.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-4 pt-2">
                        <Button 
                            className="px-8 text-white bg-amber-600 hover:bg-amber-700 rounded-xl" 
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
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                Tersimpan.
                            </p>
                        </Transition>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}