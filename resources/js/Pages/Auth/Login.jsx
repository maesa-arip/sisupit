import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { IconBrandAndroid, IconDownload, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react';
import { useEffect, useState } from 'react';

export default function Login({ status, canResetPassword }) {
	const [isWebView, setIsWebView] = useState(true);
	useEffect(() => {
		const checkWebView = () => {
			const ua = navigator.userAgent || navigator.vendor || window.opera;
			const isAndroidWebView = /wv|Android.*Version\/[\d\.]+/i.test(ua);
			const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
			const isInAppBrowser = /FBAV|FBAN|Instagram|Line|Twitter|MicroMessenger/i.test(ua);
			const isMyOwnApp = /SisupitApp/i.test(ua);

			return isAndroidWebView || isIOSWebView || isInAppBrowser || isMyOwnApp;
		};
		setIsWebView(checkWebView());
	}, []);
	const [isGoogleLoading, setIsGoogleLoading] = useState(false);
	const [googleError, setGoogleError] = useState(null);
	const [showPassword, setShowPassword] = useState(false);

	const { data, setData, post, processing, errors, reset } = useForm({
		email: '',
		password: '',
		remember: false,
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('login'), {
			onFinish: () => reset('password'),
		});
	};

	// Di aplikasi WebView, account picker native HP mengembalikan Google ID token ke sini.
	useEffect(() => {
		window.onGoogleCredential = (idToken) => {
			if (!idToken) {
				setIsGoogleLoading(false);
				return;
			}
			router.post(
				route('google.native'),
				{ credential: idToken },
				{
					onError: () => setIsGoogleLoading(false),
					onFinish: () => setIsGoogleLoading(false),
				},
			);
		};
		// Dipanggil native saat user membatalkan atau gagal memilih akun.
		window.onGoogleSignInCancelled = () => setIsGoogleLoading(false);
		// Dipanggil native saat login Google gagal (mis. SHA-1 belum terdaftar di Google Cloud).
		// Tanpa ini picker bisa muncul lalu "diam" saat memilih akun.
		window.onGoogleSignInError = (msg) => {
			setIsGoogleLoading(false);
			setGoogleError(msg || 'Login Google gagal. Silakan coba lagi.');
		};
		return () => {
			delete window.onGoogleCredential;
			delete window.onGoogleSignInCancelled;
			delete window.onGoogleSignInError;
		};
	}, []);

	const handleGoogleLogin = () => {
		setGoogleError(null);
		setIsGoogleLoading(true);
		// Di dalam aplikasi WebView: gunakan account picker bawaan HP via jembatan native.
		if (window.AndroidBridge && typeof window.AndroidBridge.signInWithGoogle === 'function') {
			window.AndroidBridge.signInWithGoogle();
			return; // hasil kembali lewat window.onGoogleCredential
		}
		// Browser biasa: alur OAuth redirect standar.
		window.location.href = '/auth/google';
	};

	return (
		<div className="w-full bg-background lg:grid lg:min-h-screen lg:grid-cols-2">
			{/* PANE KIRI: AREA FORM */}
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
							<h1 className="text-2xl font-bold tracking-tight text-foreground">Selamat Datang</h1>
							<p className="mt-2 text-sm text-muted-foreground">Portal Akses Sistem Pelaporan Darurat</p>
						</div>

						{status && (
							<Alert
								variant="success"
								className="rounded-md border-success/20 bg-success/10 text-success"
							>
								<AlertDescription>{status}</AlertDescription>
							</Alert>
						)}

						{googleError && (
							<Alert variant="destructive" className="rounded-md">
								<AlertDescription>{googleError}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={onHandleSubmit} className="space-y-5">
							{/* Input Email */}
							<div className="space-y-1.5">
								<Label htmlFor="email" className="text-sm font-medium text-foreground">
									Email
								</Label>
								<Input
									id="email"
									type="email"
									name="email"
									value={data.email}
									autoComplete="username"
									placeholder="nama@email.com"
									onChange={(e) => setData(e.target.name, e.target.value)}
									className="h-11 w-full rounded-md border-border bg-background transition-colors focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
								/>
								{errors.email && <InputError message={errors.email} />}
							</div>

							{/* Input Password */}
							<div className="space-y-1.5">
								<div className="flex items-center justify-between">
									<Label htmlFor="password" className="text-sm font-medium text-foreground">
										Kata Sandi
									</Label>
									{canResetPassword && (
										<Link
											href={route('password.request')}
											className="text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
										>
											Lupa Password?
										</Link>
									)}
								</div>
								<div className="relative flex items-center">
									<Input
										id="password"
										name="password"
										type={showPassword ? 'text' : 'password'}
										autoComplete="current-password"
										value={data.password}
										placeholder="Masukkan kata sandi"
										onChange={(e) => setData(e.target.name, e.target.value)}
										className="h-11 w-full rounded-md border-border bg-background pr-12 transition-colors focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive"
									/>

									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
										aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
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

							{/* Checkbox Ingat Saya */}
							<div className="flex items-center space-x-2 pt-1">
								<Checkbox
									id="remember"
									name="remember"
									checked={data.remember}
									onChange={(e) => setData('remember', e.target.checked)}
									onCheckedChange={(checked) => setData('remember', checked)}
									className="rounded-sm border-input focus-visible:ring-destructive data-[state=checked]:border-destructive data-[state=checked]:bg-destructive"
								/>
								<Label
									htmlFor="remember"
									className="cursor-pointer select-none text-sm font-medium text-muted-foreground"
								>
									Ingat Saya
								</Label>
							</div>

							<Button
								type="submit"
								disabled={processing || isGoogleLoading}
								className="mt-2 h-11 w-full rounded-md bg-destructive text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50 disabled:cursor-not-allowed disabled:opacity-70"
							>
								{processing ? <IconLoader2 className="h-5 w-5 animate-spin" /> : 'Masuk Akun'}
							</Button>
						</form>

						{/* Garis Pemisah (Divider) */}
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t border-border" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-3 text-muted-foreground">Atau lanjutkan dengan</span>
							</div>
						</div>

						{/* Tombol Register Google */}
						<Button
							type="button"
							variant="outline"
							disabled={processing || isGoogleLoading}
							onClick={handleGoogleLogin}
							className="flex h-11 w-full items-center justify-center gap-2.5 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
						>
							{isGoogleLoading ? (
								<IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
							) : (
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M23.7449 12.27C23.7449 11.48 23.6749 10.73 23.5549 10H12.2549V14.51H18.7249C18.4349 15.99 17.5849 17.24 16.3249 18.09V21.09H20.1849C22.4449 19.01 23.7449 15.92 23.7449 12.27Z"
										fill="#4285F4"
									/>
									<path
										d="M12.2549 24C15.4949 24 18.2049 22.92 20.1849 21.09L16.3249 18.09C15.2449 18.81 13.8749 19.25 12.2549 19.25C9.13491 19.25 6.47491 17.14 5.52491 14.29H1.54492V17.38C3.51492 21.3 7.56491 24 12.2549 24Z"
										fill="#34A853"
									/>
									<path
										d="M5.52491 14.29C5.27491 13.57 5.14491 12.8 5.14491 12C5.14491 11.2 5.28491 10.43 5.52491 9.71V6.62H1.54492C0.724923 8.24 0.254913 10.06 0.254913 12C0.254913 13.94 0.724923 15.76 1.54492 17.38L5.52491 14.29Z"
										fill="#FBBC05"
									/>
									<path
										d="M12.2549 4.75C14.0249 4.75 15.6049 5.36 16.8549 6.55L20.2749 3.13C18.2049 1.19 15.4949 0 12.2549 0C7.56491 0 3.51492 2.7 1.54492 6.62L5.52491 9.71C6.47491 6.86 9.13491 4.75 12.2549 4.75Z"
										fill="#EA4335"
									/>
								</svg>
							)}
							{isGoogleLoading ? 'Mengalihkan...' : 'Lanjutkan dengan Google'}
						</Button>

						{/* Link Daftar */}
						<div className="text-center text-sm text-muted-foreground">
							Belum punya akun?{' '}
							<Link
								href={route('register')}
								className="font-medium text-destructive transition-colors hover:text-destructive/80 hover:underline"
							>
								Daftar Sekarang
							</Link>
						</div>
						{/* --- UNDUH APLIKASI --- */}
						{!isWebView && (
							<div className="mt-4 flex w-full flex-col items-center">
								<a
									href="/apk/sisupit.apk"
									download="Sisupit.apk"
									className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 font-medium text-foreground shadow-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-muted-foreground/50 sm:w-auto"
								>
									<div className="flex items-center justify-center rounded-md bg-success/10 p-1">
										<IconBrandAndroid
											className="h-5 w-5 text-success"
											stroke={2}
										/>
									</div>
									<span className="text-sm">Unduh Aplikasi Android</span>
									<IconDownload className="ml-1 h-4 w-4 text-muted-foreground" stroke={2} />
								</a>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* PANE KANAN: AREA GAMBAR */}
			<div className="relative z-0 hidden border-l border-border bg-foreground lg:block">
				{/* Overlay gelap merata ringan (fixed dark scrim atas foto, tidak ikut tema) */}
				<div className="absolute inset-0 z-10 bg-black/20 mix-blend-multiply"></div>

				{/* Overlay gradient dari bawah ke atas agar teks kontras dan terbaca jelas */}
				<div className="absolute inset-x-0 bottom-0 z-20 h-[60%] bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

				{/* Ganti nama file gambar sesuai dengan yang Anda upload */}
				<img src="/images/Damkar.png" alt="Ilustrasi Damkar" className="h-full w-full object-cover" />

				{/* Teks Overlay (Damkar Kota Denpasar) — putih fixed di atas foto, bukan token tema */}
				<div className="absolute bottom-16 left-12 z-30">
					<h2 className="text-4xl font-black uppercase tracking-tight text-white drop-shadow-lg">
						Damkar Kota
						<br />
						Denpasar
					</h2>
					{/* Garis aksen merah taktis */}
					<div className="mt-5 h-1.5 w-16 rounded-full bg-destructive"></div>
					<p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-white/70">
						Pantang Pulang Sebelum Padam
					</p>
				</div>
			</div>
		</div>
	);
}

Login.layout = (page) => <GuestLayout children={page} title="Masuk Akun" />;
