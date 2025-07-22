import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
	const { data, setData, post, processing, errors } = useForm({
		email: '',
	});

	const onHandleSubmit = (e) => {
		e.preventDefault();

		post(route('password.email'));
	};

	return (
		<>
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
								<h1 className="text-3xl font-bold">Lupa Password</h1>
								<p className="text-balance text-muted-foreground">
									Forgot your password? No problem. Just let us know your email address and we will
									email you a password reset link that will allow you to choose a new one.
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
											placeholder="mahesa.deary@gmail.com"
											onChange={(e) => setData('email', e.target.value)}
										/>
										{errors.email && <InputError message={errors.email} />}
									</div>
									<Button
										type="submit"
										variant="orange"
										size="sm"
										className="w-full"
										disabled={processing}
									>
										Email Password Reset Link
									</Button>
								</div>
							</form>
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
		</>
	);
}
ForgotPassword.layout = (page) => <GuestLayout children={page} title="Lupa Password" />;
