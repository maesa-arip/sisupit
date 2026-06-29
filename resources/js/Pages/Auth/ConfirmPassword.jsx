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
		<Card className="mx-auto mt-10 max-w-md rounded-xl border border-border bg-card shadow-sm">
			<CardHeader className="border-b border-border bg-transparent pb-5">
				<CardTitle className="text-lg font-semibold text-foreground">Konfirmasi Kata Sandi</CardTitle>
				<CardDescription className="mt-1 text-sm text-muted-foreground">
					Ini adalah area aman aplikasi. Harap konfirmasi kata sandi Anda sebelum melanjutkan ke halaman
					berikutnya.
				</CardDescription>
			</CardHeader>
			<CardContent className="pt-6">
				<form onSubmit={onHandleSubmit}>
					<div className="space-y-1.5">
						<Label htmlFor="password" className="text-sm font-medium text-foreground">
							Kata Sandi
						</Label>
						<div className="relative flex items-center">
							<Input
								id="password"
								name="password"
								type={showPassword ? 'text' : 'password'}
								value={data.password}
								onChange={(e) => setData('password', e.target.value)}
								className="h-11 w-full rounded-md border-border bg-background pr-11 transition-colors focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
							/>
							<button
								type="button"
								onClick={() => setShowPassword(!showPassword)}
								className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
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

					<div className="mt-6 flex items-center justify-end">
						<Button
							type="submit"
							disabled={processing}
							className="h-10 rounded-md bg-destructive px-6 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-70"
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
