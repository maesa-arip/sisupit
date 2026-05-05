import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { useForm, Link } from '@inertiajs/react';
import { IconLoader2, IconArrowLeft } from '@tabler/icons-react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const onHandleSubmit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <div className="w-full bg-white dark:bg-[#101010] lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* PANE KIRI */}
            <div className="relative flex flex-col px-6 py-6 lg:px-12 bg-white dark:bg-[#101010] z-0">
                
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
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Lupa Kata Sandi?
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                Tidak masalah. Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                            </p>
                        </div>

                        {status && (
                            <Alert 
                                variant="success" 
                                className="text-green-800 border-green-200 bg-green-50 dark:border-[#112a1d] dark:bg-[#0a1811] dark:text-green-500 rounded-md"
                            >
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Terdaftar</Label>
                                <Input
                                    id="email" 
                                    type="email" 
                                    name="email" 
                                    value={data.email}
                                    placeholder="nama@email.com" 
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full h-11 border-[#e5e5e5] bg-white rounded-md focus-visible:ring-1 focus-visible:ring-[#b42826] focus-visible:border-[#b42826] dark:border-[#333] dark:bg-[#151515] dark:text-gray-100 dark:focus-visible:ring-gray-500 dark:focus-visible:border-gray-500 transition-colors"
                                />
                                {errors.email && <InputError message={errors.email} />}
                            </div>

                            <Button
                                type="submit" 
                                disabled={processing}
                                className="w-full h-11 mt-2 text-sm font-medium text-white transition-colors rounded-md bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tautan Reset'}
                            </Button>
                        </form>

                        <div className="text-sm text-center">
                            <Link 
                                href={route('login')} 
                                className="flex items-center justify-center gap-1.5 font-medium transition-colors text-gray-500 hover:text-[#b42826] dark:text-gray-400 dark:hover:text-[#e54845]"
                            >
                                <IconArrowLeft className="w-4 h-4" /> Kembali ke halaman Masuk
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANE KANAN */}
            <div className="relative hidden lg:block bg-gray-100 dark:bg-[#151515] border-l border-[#e5e5e5] dark:border-[#262626] z-0">
                <div className="absolute inset-0 z-10 bg-black/10 dark:bg-[#101010]/60 mix-blend-multiply"></div>
                <img src="/images/login.webp" alt="Forgot Password Illustration" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}

ForgotPassword.layout = (page) => <GuestLayout children={page} title="Lupa Password" />;