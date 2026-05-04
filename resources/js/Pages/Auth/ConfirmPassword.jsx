import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';

export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const onHandleSubmit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <Card className="max-w-md mx-auto mt-10 border-gray-200 shadow-lg dark:border-slate-800 rounded-2xl">
            <CardHeader className="pb-4 border-b border-gray-100 dark:border-slate-800">
                <CardTitle className="text-xl text-gray-900 dark:text-slate-100">Konfirmasi Kata Sandi</CardTitle>
                <CardDescription className="dark:text-slate-400">
                    Ini adalah area aman aplikasi. Harap konfirmasi kata sandi Anda sebelum melanjutkan ke halaman berikutnya.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={onHandleSubmit}>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-slate-300">Kata Sandi</Label>
                        <div className="relative">
                            <Input
                                id="password" name="password" type={showPassword ? 'text' : 'password'} value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
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

                    <div className="flex items-center justify-end mt-6">
                        <Button 
                            type="submit" disabled={processing}
                            className="h-11 px-6 font-bold text-white transition-all duration-200 shadow-sm rounded-xl bg-red-600 hover:bg-red-700 hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-70"
                        >
                            {processing ? <IconLoader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                            Konfirmasi
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
ConfirmPassword.layout = (page) => <AppLayout children={page} title="Konfirmasi Password" />;