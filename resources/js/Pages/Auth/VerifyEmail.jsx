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
		<div className="w-full bg-background lg:grid lg:min-h-screen lg:grid-cols-2">
			{/* PANE KIRI */}
			<div className="relative z-0 flex flex-col bg-background px-6 py-6 lg:px-12">
				<div className="mb-12 flex w-full items-center justify-between pt-2 lg:mb-0">
					<ApplicationLogo />
					<ThemeSwitcher />
				</div>

				<div className="z-10 flex flex-1 flex-col justify-center">
					<div className="mx-auto w-full max-w-sm space-y-8">
						<div className="mb-4 flex justify-center">
							<div className="rounded-full bg-destructive/10 p-4 text-destructive">
								<IconMail className="h-10 w-10" stroke={1.5} />
							</div>
						</div>

						<div className="text-center">
							<h1 className="text-2xl font-bold tracking-tight text-foreground">Verifikasi Email</h1>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								Terima kasih telah mendaftar! Sebelum memulai, mohon verifikasi alamat email Anda dengan
								mengklik tautan yang baru saja kami kirimkan. Jika Anda tidak menerimanya, kami akan
								mengirimkan ulang.
							</p>
						</div>

						{status === 'verification-link-sent' && (
							<Alert
								variant="success"
								className="rounded-md border-green-200 bg-green-50 text-green-800 dark:border-success/20 dark:bg-success/10 dark:text-success"
							>
								<AlertDescription>
									Tautan verifikasi baru telah dikirimkan ke alamat email yang Anda berikan saat
									pendaftaran.
								</AlertDescription>
							</Alert>
						)}

						<form onSubmit={onHandleSubmit} className="space-y-5">
							<Button
								type="submit"
								disabled={processing}
								className="h-11 w-full rounded-md bg-destructive text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{processing ? <IconLoader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
								Kirim Ulang Email Verifikasi
							</Button>
						</form>

						<div className="text-center text-sm">
							<Link
								href={route('logout')}
								method="post"
								as="button"
								className="font-medium text-muted-foreground transition-colors hover:text-destructive"
							>
								Keluar Akun
							</Link>
						</div>
					</div>
				</div>
			</div>

			{/* PANE KANAN */}
			<div className="relative z-0 hidden border-l border-border bg-muted lg:block">
				<div className="absolute inset-0 z-10 bg-black/10 mix-blend-multiply dark:bg-black/60"></div>
				<img src="/images/login.webp" alt="Verify Email" className="h-full w-full object-cover" />
			</div>
		</div>
	);
}

VerifyEmail.layout = (page) => <GuestLayout children={page} title="Verifikasi Email" />;
