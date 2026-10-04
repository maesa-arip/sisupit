import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { useForm } from '@inertiajs/react';
import { IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';

export default function ResetPassword({ token, email }) {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const { data, setData, post, processing, errors, reset } = useForm({
		token: token,
		email: email,
		password: '',
		password_confirmation: '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('password.store'), {
			onFinish: () => reset('password', 'password_confirmation'),
		});
	};

	return (
		<div className="w-full bg-background lg:grid lg:min-h-screen lg:grid-cols-2">
			{/* PANE KIRI: AREA FORM */}
			<div className="relative z-0 flex flex-col bg-background px-6 py-6 lg:px-12">
				{/* Header: Logo & Theme Switcher */}
				<div className="mb-6 flex w-full items-center justify-between pt-2 lg:mb-0">
					<ApplicationLogo />
					<ThemeSwitcher />
				</div>

				{/* Container Form */}
				<div className="z-10 flex flex-1 flex-col justify-center">
					<div className="mx-auto w-full max-w-sm space-y-8">
						{/* Judul */}
						<div className="text-center">
							<h1 className="text-3xl font-bold tracking-tight text-foreground">Buat Sandi Baru</h1>
							<p className="mt-2 text-[15px] text-muted-foreground">
								Silakan buat kata sandi baru yang aman dan mudah Anda ingat.
							</p>
						</div>

						<form onSubmit={onHandleSubmit} className="space-y-4">
							{/* Input Email (Read-Only) */}
							<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-colors focus-within:border-primary/40">
								<div className="relative px-4 pb-2 pt-3">
									<Label
										htmlFor="email"
										className="block text-[13px] font-medium text-muted-foreground"
									>
										Email
									</Label>
									<Input
										id="email"
										type="email"
										name="email"
										value={data.email}
										autoComplete="username"
										readOnly
										onChange={(e) => setData('email', e.target.value)}
										className="h-11 w-full cursor-not-allowed rounded-xl border-border bg-muted text-muted-foreground transition-colors focus-visible:ring-0"
									/>
									{errors.email && <InputError message={errors.email} />}
								</div>

								{/* Input Kata Sandi Baru */}
								<div className="relative px-4 pb-2 pt-3">
									<Label
										htmlFor="password"
										className="block text-[13px] font-medium text-muted-foreground"
									>
										Kata Sandi Baru
									</Label>
									<div className="relative">
										<Input
											id="password"
											name="password"
											type={showPassword ? 'text' : 'password'}
											value={data.password}
											autoComplete="new-password"
											placeholder="••••••••"
											onChange={(e) => setData('password', e.target.value)}
											className="h-9 w-full rounded-none border-0 bg-transparent p-0 text-[17px] shadow-none focus-visible:ring-0"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
											aria-label={
												showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
											}
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

								{/* Input Konfirmasi Kata Sandi */}
								<div className="relative px-4 pb-2 pt-3">
									<Label
										htmlFor="password_confirmation"
										className="block text-[13px] font-medium text-muted-foreground"
									>
										Konfirmasi Sandi Baru
									</Label>
									<div className="relative">
										<Input
											id="password_confirmation"
											name="password_confirmation"
											type={showConfirmPassword ? 'text' : 'password'}
											value={data.password_confirmation}
											autoComplete="new-password"
											placeholder="••••••••"
											onChange={(e) => setData('password_confirmation', e.target.value)}
											className="h-9 w-full rounded-none border-0 bg-transparent p-0 text-[17px] shadow-none focus-visible:ring-0"
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-0.5 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
											aria-label={
												showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
											}
										>
											{showConfirmPassword ? (
												<IconEyeOff className="h-5 w-5" stroke={1.5} />
											) : (
												<IconEye className="h-5 w-5" stroke={1.5} />
											)}
										</button>
									</div>
									{errors.password_confirmation && (
										<InputError message={errors.password_confirmation} />
									)}
								</div>
							</div>

							<Button
								type="submit"
								disabled={processing}
								className="mt-4 h-12 w-full rounded-xl bg-destructive text-[17px] font-semibold text-destructive-foreground transition-[color,background-color,transform] hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 motion-reduce:active:scale-100"
							>
								{processing ? <IconLoader2 className="h-5 w-5 animate-spin" /> : 'Simpan Sandi Baru'}
							</Button>
						</form>
					</div>
				</div>
			</div>

			{/* PANE KANAN: AREA GAMBAR */}
			<div className="relative z-0 hidden border-l border-border bg-muted lg:block">
				<div className="absolute inset-0 z-10 bg-black/10 mix-blend-multiply dark:bg-black/60"></div>
				<img src="/images/login.webp" alt="Atur ulang kata sandi" className="h-full w-full object-cover" />
			</div>
		</div>
	);
}

ResetPassword.layout = (page) => <GuestLayout children={page} title="Atur Ulang Kata Sandi" />;
