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
        <Card className="max-w-md mx-auto mt-10 border border-border bg-card shadow-sm rounded-xl">
            <CardHeader className="pb-5 border-b border-border bg-transparent">
                <CardTitle className="text-lg font-semibold text-foreground">Konfirmasi Kata Sandi</CardTitle>
                <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Ini adalah area aman aplikasi. Harap konfirmasi kata sandi Anda sebelum melanjutkan ke halaman berikutnya.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={onHandleSubmit}>
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium text-foreground">Kata Sandi</Label>
                        <div className="relative flex items-center">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full h-11 pr-11 border-border bg-background rounded-md focus-visible:ring-1 focus-visible:ring-destructive focus-visible:border-destructive transition-colors"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute z-10 flex items-center justify-center w-10 h-10 transition-colors -translate-y-1/2 rounded-md right-0.5 top-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
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
                            className="h-10 px-6 text-sm font-medium text-destructive-foreground transition-colors rounded-md bg-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:opacity-70 disabled:cursor-not-allowed"
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