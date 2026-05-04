import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, useForm } from '@inertiajs/react';
import { IconLoader2, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';

export default function Login({ status, canResetPassword }) {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const onHandleSubmit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const handleGoogleLogin = () => {
        setIsGoogleLoading(true);
        window.location.href = '/auth/google';
    };

    return (
        <div className="w-full bg-white dark:bg-slate-950 lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* PANE KIRI: AREA FORM */}
            <div className="relative flex flex-col px-6 py-6 lg:px-12">
                
                {/* REVISI: Latar Belakang Dekoratif Ambient Merah (Damkar) */}
                <div className="absolute top-0 left-0 right-0 flex justify-center w-full pointer-events-none -z-10">
                    <div className="-mt-20 h-[300px] w-[80vw] max-w-[600px] rounded-[100%] bg-red-500/10 blur-[80px] dark:bg-red-500/5 sm:blur-[120px]"></div>
                </div>

                {/* Header: Logo & Theme Switcher */}
                <div className="flex items-center justify-between w-full pt-2 mb-12 lg:mb-0">
                    <ApplicationLogo />
                    <ThemeSwitcher />
                </div>

                {/* Container Form */}
                <div className="flex flex-col justify-center flex-1">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        {/* Judul */}
                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
                                Selamat Datang
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                Portal Akses Sistem Pelaporan Darurat
                            </p>
                        </div>

                        {status && (
                            <Alert
                                variant="success"
                                className="text-green-800 border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400"
                            >
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            {/* Input Email */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    placeholder="nama@email.com"
                                    onChange={(e) => setData(e.target.name, e.target.value)}
                                    // REVISI: Focus Ring diubah ke biru (aksen aman) agar tidak terlalu agresif
                                    className="h-12 transition-all duration-200 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                                />
                                {errors.email && <InputError message={errors.email} />}
                            </div>

                            {/* Input Password */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                                        Kata Sandi
                                    </Label>
                                    {canResetPassword && (
                                        <Link
                                            href={route('password.request')}
                                            // REVISI: Teks Lupa Password menggunakan Biru 
                                            className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400"
                                        >
                                            Lupa Password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        value={data.password}
                                        placeholder="••••••••"
                                        onChange={(e) => setData(e.target.name, e.target.value)}
                                        // REVISI: Focus Ring Biru
                                        className="h-12 pr-12 transition-all duration-200 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                                    />
                                    
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        // REVISI: Hover icon mata jadi Merah Damkar
                                        className="absolute flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-full right-1 top-1/2 text-slate-400 hover:text-red-600 dark:hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                    >
                                        {showPassword ? (
                                            <IconEyeOff className="w-5 h-5" stroke={1.5} />
                                        ) : (
                                            <IconEye className="w-5 h-5" stroke={1.5} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && <InputError message={errors.password} />}
                            </div>

                            {/* Checkbox Ingat Saya */}
                            <div className="flex items-center pt-1 space-x-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', checked)}
                                    // REVISI: Checkbox Aktif berwarna Merah
                                    className="data-[state=checked]:border-red-600 data-[state=checked]:bg-red-600 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-sm font-normal text-gray-600 cursor-pointer dark:text-slate-400"
                                >
                                    Ingat Saya
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing || isGoogleLoading}
                                // REVISI: Tombol Utama Merah Damkar yang berani
                                className="w-full h-12 mt-2 text-base font-bold text-white transition-all duration-200 shadow-md rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Masuk Akun'}
                            </Button>
                        </form>

                        {/* Garis Pemisah (Divider) */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="px-3 text-gray-500 bg-white dark:bg-slate-950 dark:text-slate-400">
                                    Atau lanjutkan dengan
                                </span>
                            </div>
                        </div>

                        {/* Tombol Register Google */}
                        <Button
                            type="button"
                            variant="outline"
                            disabled={processing || isGoogleLoading}
                            onClick={handleGoogleLogin}
                            className="flex items-center justify-center w-full h-12 gap-3 font-semibold text-gray-700 transition-all duration-200 bg-white border border-gray-300 rounded-xl dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 disabled:cursor-not-allowed"
                        >
                            {isGoogleLoading ? (
                                <IconLoader2 className="w-5 h-5 text-slate-500 animate-spin" />
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M23.7449 12.27C23.7449 11.48 23.6749 10.73 23.5549 10H12.2549V14.51H18.7249C18.4349 15.99 17.5849 17.24 16.3249 18.09V21.09H20.1849C22.4449 19.01 23.7449 15.92 23.7449 12.27Z" fill="#4285F4"/>
                                    <path d="M12.2549 24C15.4949 24 18.2049 22.92 20.1849 21.09L16.3249 18.09C15.2449 18.81 13.8749 19.25 12.2549 19.25C9.13491 19.25 6.47491 17.14 5.52491 14.29H1.54492V17.38C3.51492 21.3 7.56491 24 12.2549 24Z" fill="#34A853"/>
                                    <path d="M5.52491 14.29C5.27491 13.57 5.14491 12.8 5.14491 12C5.14491 11.2 5.28491 10.43 5.52491 9.71V6.62H1.54492C0.724923 8.24 0.254913 10.06 0.254913 12C0.254913 13.94 0.724923 15.76 1.54492 17.38L5.52491 14.29Z" fill="#FBBC05"/>
                                    <path d="M12.2549 4.75C14.0249 4.75 15.6049 5.36 16.8549 6.55L20.2749 3.13C18.2049 1.19 15.4949 0 12.2549 0C7.56491 0 3.51492 2.7 1.54492 6.62L5.52491 9.71C6.47491 6.86 9.13491 4.75 12.2549 4.75Z" fill="#EA4335"/>
                                </svg>
                            )}
                            {isGoogleLoading ? 'Mengalihkan...' : 'Lanjutkan dengan Google'}
                        </Button>

                        {/* Link Daftar */}
                        <div className="text-sm text-center text-gray-600 dark:text-slate-400">
                            Belum punya akun?{' '}
                            <Link
                                href={route('register')}
                                // REVISI: Link daftar warna Merah Damkar
                                className="font-bold text-red-600 transition-colors hover:text-red-700 hover:underline dark:text-red-500"
                            >
                                Daftar Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANE KANAN: AREA GAMBAR */}
            <div className="relative hidden bg-slate-100 dark:bg-slate-900 lg:block">
                {/* REVISI: Overlay campuran Biru Navy & Merah untuk mendramatisir gambar ala Damkar */}
                <div className="absolute inset-0 z-10 bg-slate-900/20 mix-blend-multiply dark:bg-slate-900/70"></div>
                {/* Opsional: Tambahkan gradient merah transparan dari bawah agar lebih epik */}
                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-red-900/30 to-transparent dark:from-red-900/40"></div>
                <img src="/images/login.webp" alt="Login Illustration" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}

Login.layout = (page) => <GuestLayout children={page} title="Masuk Akun" />;