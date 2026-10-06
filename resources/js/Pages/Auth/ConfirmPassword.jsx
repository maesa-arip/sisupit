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
		<Card className="mx-auto mt-10 max-w-md border-0 bg-transparent shadow-none">
			<CardHeader className="items-center bg-transparent pb-2 text-center">
				<img src="/icon.png" alt="" className="mx-auto mb-4 h-16 w-16 rounded-2xl shadow-sm" />
				<CardTitle className="text-3xl font-bold tracking-tight text-foreground">
					Konfirmasi Kata Sandi
				</CardTitle>
				<CardDescription className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
					Ini adalah area aman aplikasi. Harap konfirmasi kata sandi Anda sebelum melanjutkan ke halaman
					berikutnya.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				<form onSubmit={onHandleSubmit}>
					<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-colors focus-within:border-primary/40">
						<div className="relative px-4 pb-2 pt-3">
							<Label htmlFor="password" className="block text-[13px] font-medium text-muted-foreground">
								Kata Sandi
							</Label>
							<div className="relative">
								<Input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									value={data.password}
									autoComplete="current-password"
									onChange={(e) => setData('password', e.target.value)}
									className="h-9 w-full rounded-none border-0 bg-transparent p-0 text-[17px] shadow-none focus-visible:ring-0"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
								>
									{showPassword ? (
										<IconEyeOff className="h-5 w-5" stroke={1.5} />
									) : (
										<IconEye className="h-5 w-5" stroke={1.5} />
									)}
								</button>
							</div>
							{errors.password && <InputError message={errors.password} />}
						</div>
					</div>

					<div className="mt-6 flex items-center justify-end">
						<Button
							type="submit"
							disabled={processing}
							className="h-12 w-full rounded-xl bg-destructive px-6 text-[17px] font-semibold text-destructive-foreground transition-[color,background-color,transform] hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:active:scale-100"
						>
							{processing ? <IconLoader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
							Konfirmasi
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

ConfirmPassword.layout = (page) => <AppLayout children={page} title="Konfirmasi Password" />;
