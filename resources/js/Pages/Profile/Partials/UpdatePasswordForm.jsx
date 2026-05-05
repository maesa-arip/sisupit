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
        <Card className={`overflow-hidden border border-[#e5e5e5] bg-white shadow-sm dark:bg-[#151515] dark:border-[#262626] rounded-xl ${className}`}>
            <CardHeader className="pb-5 border-b border-[#e5e5e5] bg-transparent dark:border-[#262626]">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-50 border border-[#e5e5e5] p-2 text-gray-600 dark:bg-[#1f1f1f] dark:border-[#262626] dark:text-gray-300">
                        <IconLock size={20} stroke={1.5} />
                    </div>
                    <div>
                        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Keamanan Kata Sandi</CardTitle>
                        <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Pastikan akun Anda menggunakan kata sandi yang panjang dan acak agar tetap aman.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="pt-5">
                <form onSubmit={updatePassword} className="max-w-xl space-y-5">
                    <div className="space-y-1.5">
                        <Label htmlFor="current_password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kata Sandi Saat Ini</Label>
                        <Input
                            id="current_password"
                            name="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="current-password"
                            className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
                        />
                        {errors.current_password && (
                            <InputError message={errors.current_password} />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kata Sandi Baru</Label>
                        <Input
                            id="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="new-password"
                            className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
                        />
                        {errors.password && (
                            <InputError message={errors.password} />
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password_confirmation" className="text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Kata Sandi Baru</Label>
                        <Input
                            id="password_confirmation"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={onHandleChange}
                            type="password"
                            autoComplete="new-password"
                            className="h-10 rounded-md border-[#e5e5e5] bg-white focus-visible:ring-1 focus-visible:ring-[#b42826] dark:border-[#262626] dark:bg-[#101010] dark:text-gray-100"
                        />
                        {errors.password_confirmation && (
                            <InputError message={errors.password_confirmation} />
                        )}
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <Button 
                            className="h-9 px-4 rounded-md text-sm font-medium text-white transition-colors bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50" 
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