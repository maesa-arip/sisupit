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
        <div className="w-full bg-white dark:bg-[#101010] lg:grid lg:min-h-screen lg:grid-cols-2">
            {/* PANE KIRI */}
            <div className="relative flex flex-col px-6 py-6 lg:px-12 bg-white dark:bg-[#101010] z-0">
                
                <div className="flex items-center justify-between w-full pt-2 mb-12 lg:mb-0">
                    <ApplicationLogo />
                    <ThemeSwitcher />
                </div>

                <div className="z-10 flex flex-col justify-center flex-1">
                    <div className="w-full max-w-sm mx-auto space-y-8">
                        
                        <div className="flex justify-center mb-4">
                            <div className="p-4 rounded-full bg-red-50 text-[#b42826] dark:bg-[#2a1313] dark:text-[#e54845]">
                                <IconMail className="w-10 h-10" stroke={1.5} />
                            </div>
                        </div>

                        <div className="text-center">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Verifikasi Email
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                                Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi alamat email Anda dengan mengklik tautan yang baru saja kami kirimkan. Jika Anda tidak menerimanya, kami akan mengirimkan ulang.
                            </p>
                        </div>

                        {status === 'verification-link-sent' && (
                            <Alert variant="success" className="text-green-800 border-green-200 bg-green-50 dark:border-[#112a1d] dark:bg-[#0a1811] dark:text-green-500 rounded-md">
                                <AlertDescription>
                                    Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat pendaftaran.
                                </AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={onHandleSubmit} className="space-y-5">
                            <Button
                                type="submit" 
                                disabled={processing}
                                className="w-full h-11 text-sm font-medium text-white transition-colors rounded-md bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                                Kirim Ulang Email Verifikasi
                            </Button>
                        </form>

                        <div className="text-sm text-center">
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button" 
                                className="font-medium transition-colors text-gray-500 hover:text-[#b42826] dark:text-gray-400 dark:hover:text-[#e54845]"
                            >
                                Keluar Akun
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANE KANAN */}
            <div className="relative hidden lg:block bg-gray-100 dark:bg-[#151515] border-l border-[#e5e5e5] dark:border-[#262626] z-0">
                <div className="absolute inset-0 z-10 bg-black/10 dark:bg-[#101010]/60 mix-blend-multiply"></div>
                <img src="/images/login.webp" alt="Verify Email" className="object-cover w-full h-full" />
            </div>
        </div>
    );
}

VerifyEmail.layout = (page) => <GuestLayout children={page} title="Verifikasi Email" />;