import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { useForm } from '@inertiajs/react';
import { IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const onHandleSubmit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <div className="w-full bg-white dark:bg-slate-950 lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* PANE KIRI */}
            <div className="relative flex flex-col px-6 py-6 lg:px-12">
                <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                    <div className="w-[80vw] max-w-[600px] h-[300px] bg-red-500/10 dark:bg-red-500/5 rounded-[100%] blur-[80px] sm:blur-[120px] -mt-20"></div>
                </div>

                <div className="flex items-center justify-between w-full pt-2 mb-12 lg:mb-0">
                    <ApplicationLogo />
                    <ThemeSwitcher />
                </div>

                <div className="flex flex-col justify-center flex-1">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
                                Buat Sandi Baru
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                Silakan buat kata sandi baru yang aman dan mudah Anda ingat.
                            </p>
                        </div>

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-slate-300">Email</Label>
                                <Input
                                    id="email" type="email" name="email" value={data.email} autoComplete="username" readOnly
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="h-12 text-gray-500 border-gray-200 bg-gray-50 rounded-xl dark:border-slate-800 dark:bg-slate-900/50"
                                />
                                {errors.email && <InputError message={errors.email} />}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-slate-300">Kata Sandi Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="password" name="password" type={showPassword ? 'text' : 'password'} value={data.password} autoComplete="new-password"
                                        placeholder="••••••••" onChange={(e) => setData('password', e.target.value)}
                                        className="h-12 pr-12 transition-all duration-200 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                                    />
                                    <button
                                        type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-full right-1 top-1/2 text-slate-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        {showPassword ? <IconEyeOff className="w-5 h-5" stroke={1.5} /> : <IconEye className="w-5 h-5" stroke={1.5} />}
                                    </button>
                                </div>
                                {errors.password && <InputError message={errors.password} />}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-700 dark:text-slate-300">Konfirmasi Sandi Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation" name="password_confirmation" type={showConfirmPassword ? 'text' : 'password'} value={data.password_confirmation} autoComplete="new-password"
                                        placeholder="••••••••" onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="h-12 pr-12 transition-all duration-200 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                                    />
                                    <button
                                        type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-full right-1 top-1/2 text-slate-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                    >
                                        {showConfirmPassword ? <IconEyeOff className="w-5 h-5" stroke={1.5} /> : <IconEye className="w-5 h-5" stroke={1.5} />}
                                    </button>
                                </div>
                                {errors.password_confirmation && <InputError message={errors.password_confirmation} />}
                            </div>

                            <Button
                                type="submit" disabled={processing}
                                className="w-full h-12 mt-2 text-base font-bold text-white transition-all duration-200 shadow-md rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Simpan Sandi Baru'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* PANE KANAN */}
            <div className="relative hidden lg:block bg-slate-100 dark:bg-slate-900">
                <div className="absolute inset-0 z-10 bg-slate-900/20 mix-blend-multiply dark:bg-slate-900/70"></div>
                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-red-900/30 to-transparent dark:from-red-900/40"></div>
                <img src="/images/login.webp" alt="Reset Password" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}
ResetPassword.layout = (page) => <GuestLayout children={page} title="Reset Password" />;