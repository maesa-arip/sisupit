import InputError from '@/Components/InputError';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useRef } from 'react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
	const user = usePage().props.auth.user;
	// console.log(user)
	const fileInputKTP = useRef(null);
	const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
		name: user.name ?? '',
		email: user.email ?? '',
		phone: user.phone ?? '',
		ktp: user.ktp ?? null,
	});
	console.log(data);
	// const onHandleChange = (e) => setData(e.target.name, e.target.value);
	const onHandleChange = (e) => {
		const key = e.target.name;
		const value = e.target.type === 'file' ? e.target.files[0] : e.target.value;
		setData(key, value);
	};
	const onHandleSubmit = (e) => {
		e.preventDefault();
		patch(route('profile.update'));
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle>Profile Information</CardTitle>

				<CardDescription>Update your account's profile information and email address.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={onHandleSubmit} className="mt-6 space-y-6">
					<div>
						<Label htmlFor="name">Nama</Label>
						<Input id="name" name="name" value={data.name} onChange={onHandleChange} autoComplete="name" />
						{errors.name && <InputError className="mt-2" message={errors.name} />}
					</div>
					<div>
						<Label htmlFor="email">EMail</Label>
						<Input
							id="email"
							name="email"
							value={data.email}
							onChange={onHandleChange}
							autoComplete="email"
						/>
						{errors.email && <InputError className="mt-2" message={errors.email} />}
					</div>
					<div>
						<Label htmlFor="phone">Nomor Telp</Label>
						<Input
							id="phone"
							name="phone"
							value={data.phone}
							onChange={onHandleChange}
							autoComplete="phone"
						/>
						{errors.phone && <InputError className="mt-2" message={errors.phone} />}
					</div>

					<div className="grid w-full items-center gap-1.5">
						<Label htmlFor="ktp">KTP</Label>
						<Input
							name="ktp"
							id="ktp"
							type="file"
							ref={fileInputKTP}
							onChange={onHandleChange}
						/>
						{errors.ktp && <InputError message={errors.ktp} />}
					</div>

					{mustVerifyEmail && user.email_verified_at === null && (
						<div>
							<p className="mt-2 text-sm text-foreground">
								Your email address is unverified.
								<Link
									href={route('verification.send')}
									method="post"
									as="button"
									className="text-sm underline rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
								>
									Click here to re-send the verification email.
								</Link>
							</p>

							{status === 'verification-link-sent' && (
								<Alert variant="success">
									<AlertDescription>
										A new verification link has been sent to your email address.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					<div className="flex items-center gap-4">
						<Button variant="orange" size="lg" disabled={processing}>
							Save
						</Button>

						<Transition
							show={recentlySuccessful}
							enter="transition ease-in-out"
							enterFrom="opacity-0"
							leave="transition ease-in-out"
							leaveTo="opacity-0"
						>
							<p className="text-sm text-muted-foreground">Saved.</p>
						</Transition>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
