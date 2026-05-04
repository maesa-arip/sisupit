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
                                Lupa Kata Sandi?
                            </h1>
                            <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                                Tidak masalah. Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
                            </p>
                        </div>

                        {status && (
                            <Alert variant="success" className="text-green-800 border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-slate-300">Email Terdaftar</Label>
                                <Input
                                    id="email" type="email" name="email" value={data.email}
                                    placeholder="nama@email.com" onChange={(e) => setData('email', e.target.value)}
                                    className="h-12 transition-all duration-200 border-gray-200 rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                                />
                                {errors.email && <InputError message={errors.email} />}
                            </div>

                            <Button
                                type="submit" disabled={processing}
                                className="w-full h-12 mt-2 text-base font-bold text-white transition-all duration-200 shadow-md rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tautan Reset'}
                            </Button>
                        </form>

                        <div className="text-sm text-center">
                            <Link href={route('login')} className="flex items-center justify-center gap-1 font-semibold transition-colors text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400">
                                <IconArrowLeft className="w-4 h-4" /> Kembali ke halaman Masuk
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANE KANAN */}
            <div className="relative hidden lg:block bg-slate-100 dark:bg-slate-900">
                <div className="absolute inset-0 z-10 bg-slate-900/20 mix-blend-multiply dark:bg-slate-900/70"></div>
                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-red-900/30 to-transparent dark:from-red-900/40"></div>
                <img src="/images/login.webp" alt="Forgot Password Illustration" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}
ForgotPassword.layout = (page) => <GuestLayout children={page} title="Lupa Password" />;