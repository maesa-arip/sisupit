import ApplicationLogo from '@/Components/ApplicationLogo';

import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
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

	return (
		<div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
			<div className="flex flex-col px-6 py-4">
				<ApplicationLogo size="size-12" />
				
				<div className="flex flex-col items-center justify-center py-12 lg:py-48">
					<div className="flex flex-col w-full gap-6 mx-auto lg:w-1/2">
						<div className="grid gap-2 text-center">
							{status && (
								<Alert variant="success">
									<AlertDescription>{status}</AlertDescription>
								</Alert>
							)}
							<h1>
								
							<ThemeSwitcher/>
							</h1>
							<h1 className="text-3xl font-bold">Masuk</h1>
							<p className="text-balance text-muted-foreground">
								Masukan email anda dibawah ini untuk masuk ke akun anda
							</p>
						</div>
							
						<form onSubmit={onHandleSubmit}>
							<div className="grid gap-4">
								<div className="grid gap-2">
									<Label htmlFor="email">Email</Label>

									<Input
										id="email"
										type="email"
										name="email"
										value={data.email}
										autoComplete="username"
										placeholder="mahesa.deary@gmail.com"
										onChange={(e) => setData(e.target.name, e.target.value)}
									/>
									{errors.email && <InputError message={errors.email} />}
								</div>
								<div className="grid gap-2">
									<div className="flex items-center">
										<Label htmlFor="password">Password</Label>
										{canResetPassword && (
											<Link
												href={route('password.request')}
												className="inline-block ml-auto text-sm underline"
											>
												Lupa Password
											</Link>
										)}
									</div>
								</div>
								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									value={data.password}
									onChange={(e) => setData(e.target.name, e.target.value)}
								/>
								{errors.password && <InputError message={errors.password} />}

								<div className="grid gap-2">
									<div className="flex space-x-2 items-top">
										<Checkbox
											id="remember"
											name="remember"
											checked={data.remember}
											onCheckedChange={(checked) => setData('remember', checked)}
										/>
										<div className="grid gap-1.5 leading-none">
											<Label htmlFor="remember">Ingat Saya</Label>
										</div>
									</div>
									{errors.remember && <InputError message={errors.remember} />}
								</div>
								<Button
									type="submit"
									variant="orange"
									size="sm"
									className="w-full"
									disabled={processing}
								>
									Masuk
								</Button>
							</div>
						</form>
						<div className="flex items-center justify-center mt-4">
							<Button
									variant="blue"
									size="sm"
									className="w-full"
									disabled={processing}
								>
									<a href="/auth/google">Login Google</a>
									
								</Button>
                       
                    </div>
						<div className="mt-4 text-sm text-center">
							Belum punya akun?{' '}
							<Link href={route('register')} className="underline">
								Daftar
							</Link>
						</div>
					</div>
				</div>
			</div>
			<div className="hidden bg-muted lg:block">
				<img
					src="/images/login.webp"
					alt="Login"
					className="h-full w-full object-cover dark:brightness-[0.4] dark:grayscale"
				/>
			</div>
		</div>
	);
}

Login.layout = (page) => <GuestLayout children={page} title="Login" />;
