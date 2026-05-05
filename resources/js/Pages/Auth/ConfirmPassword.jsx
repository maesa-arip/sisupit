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
        <Card className="max-w-md mx-auto mt-10 border border-[#e5e5e5] bg-white shadow-sm dark:bg-[#151515] dark:border-[#262626] rounded-xl">
            <CardHeader className="pb-5 border-b border-[#e5e5e5] bg-transparent dark:border-[#262626]">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Konfirmasi Kata Sandi</CardTitle>
                <CardDescription className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Ini adalah area aman aplikasi. Harap konfirmasi kata sandi Anda sebelum melanjutkan ke halaman berikutnya.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={onHandleSubmit}>
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">Kata Sandi</Label>
                        <div className="relative flex items-center">
                            <Input
                                id="password" 
                                name="password" 
                                type={showPassword ? 'text' : 'password'} 
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full h-11 pr-11 border-[#e5e5e5] bg-white rounded-md focus-visible:ring-1 focus-visible:ring-[#b42826] focus-visible:border-[#b42826] dark:border-[#333] dark:bg-[#101010] dark:text-gray-100 dark:focus-visible:ring-gray-500 dark:focus-visible:border-gray-500 transition-colors"
                            />
                            <button
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute z-10 flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-md right-0.5 top-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? <IconEyeOff className="w-5 h-5" stroke={1.5} /> : <IconEye className="w-5 h-5" stroke={1.5} />}
                            </button>
                        </div>
                        {errors.password && <InputError message={errors.password} />}
                    </div>

                    <div className="flex items-center justify-end mt-6">
                        <Button 
                            type="submit" 
                            disabled={processing}
                            className="h-10 px-6 text-sm font-medium text-white transition-colors rounded-md bg-[#b42826] hover:bg-[#9a2220] focus-visible:ring-2 focus-visible:ring-[#b42826]/50 disabled:opacity-70 disabled:cursor-not-allowed"
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