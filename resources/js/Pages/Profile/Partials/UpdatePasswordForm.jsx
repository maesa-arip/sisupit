import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { useRef } from 'react';
import { IconLock } from '@tabler/icons-react';

export default function UpdatePasswordForm({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const onHandleChange = (e) => setData(e.target.name, e.target.value);

    const updatePassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current.focus();
                }
                if (errors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    return (
        <Card className={`overflow-hidden border-gray-200 dark:border-slate-800 shadow-sm ${className}`}>
            <CardHeader className="pb-6 border-b border-gray-100 bg-gray-50/50 dark:bg-slate-800/20 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500 rounded-xl">
                        <IconLock size={24} stroke={1.5} />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Keamanan Kata Sandi</CardTitle>
                        <CardDescription className="mt-1.5">
                            Pastikan akun Anda menggunakan kata sandi yang panjang dan acak agar tetap aman.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-6">
                <form onSubmit={updatePassword} className="max-w-2xl space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="current_password">Kata Sandi Saat Ini</Label>
                        <Input
                            id="current_password"
                            name="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="current-password"
                            className="focus-visible:ring-amber-500 dark:bg-slate-900"
                        />
                        {errors.current_password && (
                            <InputError message={errors.current_password} />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Kata Sandi Baru</Label>
                        <Input
                            id="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="new-password"
                            className="focus-visible:ring-amber-500 dark:bg-slate-900"
                        />
                        {errors.password && (
                            <InputError message={errors.password} />
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi Baru</Label>
                        <Input
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="new-password"
                            className="focus-visible:ring-amber-500 dark:bg-slate-900"
                        />
                        {errors.password_confirmation && (
                            <InputError message={errors.password_confirmation} />
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Button 
                            className="px-8 text-white bg-amber-600 hover:bg-amber-700 rounded-xl" 
                            disabled={processing}
                        >
                            Perbarui Kata Sandi
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