import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { IconLock } from '@tabler/icons-react';
import { useRef } from 'react';

export default function UpdatePasswordForm({ className = '' }) {
	const passwordInput = useRef();
	const currentPasswordInput = useRef();

	const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
		current_password: '',
		password: '',
		password_confirmation: '',
	});

	const onHandleChange = (e) => setData(e.target.name, e.target.value);

	const updatePassword = (e) => {
		e.preventDefault();
		put(route('password.update'), {
			preserveScroll: true,
			onSuccess: () => reset(),
			onError: (errors) => {
				if (errors.password) {
					reset('password', 'password_confirmation');
					passwordInput.current.focus();
				}
				if (errors.current_password) {
					reset('current_password');
					currentPasswordInput.current.focus();
				}
			},
		});
	};

	return (
		<Card className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
			<CardHeader className="border-b border-border bg-transparent pb-5">
				<div className="flex items-center gap-3">
					<div className="rounded-lg border border-border bg-muted p-2 text-muted-foreground">
						<IconLock size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-base font-semibold text-foreground">Keamanan Kata Sandi</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Pastikan akun Anda menggunakan kata sandi yang panjang dan acak agar tetap aman.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				<form onSubmit={updatePassword} className="max-w-xl space-y-5">
					<div className="space-y-1.5">
						<Label htmlFor="current_password" className="text-sm font-medium text-foreground">
							Kata Sandi Saat Ini
						</Label>
						<Input
							id="current_password"
							name="current_password"
							ref={currentPasswordInput}
							value={data.current_password}
							onChange={onHandleChange}
							type="password"
							autoComplete="current-password"
							className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
						/>
						{errors.current_password && <InputError message={errors.current_password} />}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="password" className="text-sm font-medium text-foreground">
							Kata Sandi Baru
						</Label>
						<Input
							id="password"
							name="password"
							ref={passwordInput}
							value={data.password}
							onChange={onHandleChange}
							type="password"
							autoComplete="new-password"
							className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
						/>
						{errors.password && <InputError message={errors.password} />}
					</div>

					<div className="space-y-1.5">
						<Label htmlFor="password_confirmation" className="text-sm font-medium text-foreground">
							Konfirmasi Kata Sandi Baru
						</Label>
						<Input
							id="password_confirmation"
							name="password_confirmation"
							value={data.password_confirmation}
							onChange={onHandleChange}
							type="password"
							autoComplete="new-password"
							className="h-10 rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive"
						/>
						{errors.password_confirmation && <InputError message={errors.password_confirmation} />}
					</div>

					<div className="flex items-center gap-4 pt-2">
						<Button
							className="h-9 rounded-md bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
							disabled={processing}
						>
							Perbarui Kata Sandi
						</Button>

						<Transition
							show={recentlySuccessful}
							enter="transition ease-in-out duration-300"
							enterFrom="opacity-0 translate-x-2"
							enterTo="opacity-100 translate-x-0"
							leave="transition ease-in-out duration-300"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<p className="text-sm font-medium text-success">Tersimpan.</p>
						</Transition>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
