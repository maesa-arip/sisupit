import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconLoader2 } from '@tabler/icons-react';

export default function ForgotPassword({ status }) {
	const { data, setData, post, processing, errors } = useForm({
		email: '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('password.email'));
	};

	return (
		<div className="w-full bg-background lg:grid lg:min-h-screen lg:grid-cols-2">
			{/* PANE KIRI */}
			<div className="relative z-0 flex flex-col bg-background px-6 py-6 lg:px-12">
				{/* Header: Logo & Theme Switcher */}
				<div className="mb-12 flex w-full items-center justify-between pt-2 lg:mb-0">
					<ApplicationLogo />
					<ThemeSwitcher />
				</div>

				{/* Container Form */}
				<div className="z-10 flex flex-1 flex-col justify-center">
					<div className="mx-auto w-full max-w-sm space-y-8">
						{/* Judul */}
						<div className="text-center">
							<h1 className="text-2xl font-bold tracking-tight text-foreground">Lupa Kata Sandi?</h1>
							<p className="mt-2 text-sm text-muted-foreground">
								Tidak masalah. Masukkan alamat email Anda dan kami akan mengirimkan tautan untuk
								mengatur ulang kata sandi.
							</p>
						</div>

						{status && (
							<Alert
								variant="success"
								className="rounded-md border-green-200 bg-green-50 text-green-800 dark:border-success/20 dark:bg-success/10 dark:text-success"
							>
								<AlertDescription>{status}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={onHandleSubmit} className="space-y-5">
							<div className="space-y-1.5">
								<Label htmlFor="email" className="text-sm font-medium text-foreground">
									Email Terdaftar
								</Label>
								<Input
									id="email"
									type="email"
									name="email"
									value={data.email}
									placeholder="nama@email.com"
									onChange={(e) => setData('email', e.target.value)}
									className="h-11 w-full rounded-md border-border bg-background transition-colors focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
								/>
								{errors.email && <InputError message={errors.email} />}
							</div>

							<Button
								type="submit"
								disabled={processing}
								className="mt-2 h-11 w-full rounded-md bg-destructive text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{processing ? <IconLoader2 className="h-5 w-5 animate-spin" /> : 'Kirim Tautan Reset'}
							</Button>
						</form>

						<div className="text-center text-sm">
							<Link
								href={route('login')}
								className="flex items-center justify-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-destructive"
							>
								<IconArrowLeft className="h-4 w-4" /> Kembali ke halaman Masuk
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* PANE KANAN */}
			<div className="relative z-0 hidden border-l border-border bg-muted lg:block">
				<div className="absolute inset-0 z-10 bg-black/10 mix-blend-multiply dark:bg-black/60"></div>
				<img
					src="/images/login.webp"
					alt="Forgot Password Illustration"
					className="h-full w-full object-cover"
				/>
			</div>
		</div>
	);
}

ForgotPassword.layout = (page) => <GuestLayout children={page} title="Lupa Password" />;
