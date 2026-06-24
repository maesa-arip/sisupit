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
        <div className="w-full bg-background lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* PANE KIRI: AREA FORM */}
            <div className="relative flex flex-col px-6 py-6 lg:px-12 bg-background z-0">

                {/* Header: Logo & Theme Switcher */}
                <div className="flex items-center justify-between w-full pt-2 mb-12 lg:mb-0">
                    <ApplicationLogo />
                    <ThemeSwitcher />
                </div>

                {/* Container Form */}
                <div className="z-10 flex flex-col justify-center flex-1">
                    <div className="w-full max-w-sm mx-auto space-y-8">

                        {/* Judul */}
                        <div className="text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Buat Sandi Baru
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Silakan buat kata sandi baru yang aman dan mudah Anda ingat.
                            </p>
                        </div>

                        <form onSubmit={onHandleSubmit} className="space-y-4">
                            {/* Input Email (Read-Only) */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    readOnly
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full h-11 border-border bg-muted text-muted-foreground rounded-md focus-visible:ring-0 cursor-not-allowed transition-colors"
                                />
                                {errors.email && <InputError message={errors.email} />}
                            </div>

                            {/* Input Kata Sandi Baru */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-sm font-medium text-foreground">Kata Sandi Baru</Label>
                                <div className="relative flex items-center">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full h-11 pr-11 border-border bg-background rounded-md focus-visible:ring-1 focus-visible:ring-destructive focus-visible:border-destructive transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute z-10 flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-md right-0.5 top-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                    >
                                        {showPassword ? <IconEyeOff className="w-5 h-5" stroke={1.5} /> : <IconEye className="w-5 h-5" stroke={1.5} />}
                                    </button>
                                </div>
                                {errors.password && <InputError message={errors.password} />}
                            </div>

                            {/* Input Konfirmasi Kata Sandi */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">Konfirmasi Sandi Baru</Label>
                                <div className="relative flex items-center">
                                    <Input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full h-11 pr-11 border-border bg-background rounded-md focus-visible:ring-1 focus-visible:ring-destructive focus-visible:border-destructive transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute z-10 flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-md right-0.5 top-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                                        aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                    >
                                        {showConfirmPassword ? <IconEyeOff className="w-5 h-5" stroke={1.5} /> : <IconEye className="w-5 h-5" stroke={1.5} />}
                                    </button>
                                </div>
                                {errors.password_confirmation && <InputError message={errors.password_confirmation} />}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full h-11 mt-4 text-sm font-medium text-destructive-foreground transition-colors rounded-md bg-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Simpan Sandi Baru'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            {/* PANE KANAN: AREA GAMBAR */}
            <div className="relative hidden lg:block bg-muted border-l border-border z-0">
                <div className="absolute inset-0 z-10 bg-black/10 dark:bg-black/60 mix-blend-multiply"></div>
                <img src="/images/login.webp" alt="Reset Password" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}

ResetPassword.layout = (page) => <GuestLayout children={page} title="Reset Password" />;