import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, useForm } from '@inertiajs/react';
import { IconLoader2, IconMail } from '@tabler/icons-react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const onHandleSubmit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
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
                        <div className="flex justify-center mb-4 text-red-500 dark:text-red-400">
                            <div className="p-4 rounded-full bg-red-50 dark:bg-red-900/20">
                                <IconMail className="w-12 h-12" stroke={1.5} />
                            </div>
                        </div>

                        <div className="text-center">
                            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
                                Verifikasi Email
                            </h1>
                            <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
                                Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan. Jika Anda tidak menerimanya, kami akan mengirimkan ulang.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <Alert variant="success" className="text-green-800 border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-900/20 dark:text-green-400">
                                <AlertDescription>
                                    Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat pendaftaran.
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            <Button
                                type="submit" disabled={processing}
                                className="w-full h-12 text-base font-bold text-white transition-all duration-200 shadow-md rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                Kirim Ulang Email Verifikasi
                            </Button>
                        </form>

                        <div className="text-sm text-center">
                            <Link 
                                href={route('logout')} method="post" as="button" 
                                className="font-semibold transition-colors text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                            >
                                Keluar Akun
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANE KANAN */}
            <div className="relative hidden lg:block bg-slate-100 dark:bg-slate-900">
                <div className="absolute inset-0 z-10 bg-slate-900/20 mix-blend-multiply dark:bg-slate-900/70"></div>
                <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-red-900/30 to-transparent dark:from-red-900/40"></div>
                <img src="/images/login.webp" alt="Verify Email" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}
VerifyEmail.layout = (page) => <GuestLayout children={page} title="Verifikasi Email" />;