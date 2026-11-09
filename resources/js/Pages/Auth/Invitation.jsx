import ApplicationLogo from '@/Components/ApplicationLogo';
import InputError from '@/Components/InputError';
import ThemeSwitcher from '@/Components/ThemeSwitcher';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import GuestLayout from '@/Layouts/GuestLayout';
import { Link, router, useForm } from '@inertiajs/react';
import { IconEye, IconEyeOff, IconLoader2, IconMapPin, IconShieldCheck } from '@tabler/icons-react';
import { useState } from 'react';

const fieldClass = 'h-9 w-full rounded-none border-0 bg-transparent p-0 text-[17px] shadow-none focus-visible:ring-0';
const labelClass = 'block text-[13px] font-medium text-muted-foreground';
const submitClass =
	'h-12 w-full rounded-xl bg-destructive text-[17px] font-semibold text-destructive-foreground transition-[color,background-color,transform] hover:bg-destructive/90 active:scale-[0.98] disabled:opacity-70 motion-reduce:active:scale-100';

/**
 * Halaman tautan undangan petugas (2026-11-06, InvitationController). Tiga keadaan dari server:
 * `guest` (buat akun baru dengan email undangan, atau masuk bila sudah punya akun), `same`
 * (sedang masuk dengan email undangan - cukup Terima), `other` (masuk dengan akun lain).
 */
export default function Invitation(props) {
	const [showPassword, setShowPassword] = useState(false);
	const { data, setData, post, processing, errors, reset } = useForm({
		name: '',
		phone: '',
		password: '',
		password_confirmation: '',
		terms: false,
	});

	const submit = (e) => {
		e.preventDefault();
		post(route('invitations.accept', props.token), {
			onFinish: () => reset('password', 'password_confirmation'),
		});
	};

	return (
		<div className="flex min-h-dvh flex-col bg-background px-6 py-6">
			<div className="mb-8 flex w-full items-center justify-between pt-2">
				<ApplicationLogo />
				<ThemeSwitcher />
			</div>

			<div className="mx-auto w-full max-w-sm flex-1 space-y-6">
				<div className="text-center">
					<img src="/icon.png" alt="" className="mx-auto mb-5 h-16 w-16 rounded-2xl shadow-sm" />
					<h1 className="text-2xl font-bold tracking-tight text-foreground">
						{props.valid ? 'Undangan Menjadi Petugas' : 'Undangan Tidak Berlaku'}
					</h1>
				</div>

				{!props.valid ? (
					<div className="space-y-4 text-center">
						<p className="text-[15px] leading-relaxed text-muted-foreground">
							Tautan ini sudah dipakai, dibatalkan, atau kedaluwarsa. Minta admin Damkar mengirim undangan
							baru.
						</p>
						<Button asChild variant="outline" className="h-11 w-full rounded-xl">
							<Link href={route('login')}>Ke halaman Masuk</Link>
						</Button>
					</div>
				) : (
					<>
						<div className="space-y-2 rounded-2xl border border-border/70 bg-card p-4 text-sm shadow-sm">
							<p className="leading-relaxed text-foreground">
								{props.inviter ? <b>{props.inviter}</b> : 'Admin'} mengundang <b>{props.email}</b>{' '}
								menjadi petugas.
							</p>
							<p className="flex items-start gap-2 text-foreground">
								<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
								<span>
									Wilayah tugas: <b className="capitalize">{(props.region || '-').toLowerCase()}</b>
								</span>
							</p>
							<p className="text-xs leading-relaxed text-muted-foreground">
								Wilayah tugas sudah ditetapkan admin - Anda tidak perlu mengisinya. Tempat tinggal bisa
								dicatat di isian Alamat Tinggal pada halaman Profil.
							</p>
						</div>

						{errors.email && <InputError message={errors.email} />}

						{props.mode === 'same' && (
							<Button type="button" disabled={processing} onClick={submit} className={submitClass}>
								{processing ? <IconLoader2 className="h-5 w-5 animate-spin" /> : 'Terima Undangan'}
							</Button>
						)}

						{props.mode === 'other' && (
							<div className="space-y-3 text-center">
								<p className="text-sm leading-relaxed text-muted-foreground">
									Anda sedang masuk sebagai <b className="text-foreground">{props.currentEmail}</b>.
									Undangan ini untuk <b className="text-foreground">{props.email}</b> - keluar dulu,
									lalu buka lagi tautan undangan.
								</p>
								<Button
									type="button"
									variant="outline"
									className="h-11 w-full rounded-xl"
									onClick={() => router.post(route('logout'))}
								>
									Keluar
								</Button>
							</div>
						)}

						{props.mode === 'guest' && props.accountExists && (
							<div className="space-y-3 text-center">
								<p className="text-sm leading-relaxed text-muted-foreground">
									Email ini sudah punya akun. Masuk dulu - Anda akan kembali ke halaman ini untuk
									menerima undangan.
								</p>
								<Button asChild className={submitClass}>
									<a href={route('invitations.login', props.token)}>Masuk</a>
								</Button>
							</div>
						)}

						{props.mode === 'guest' && !props.accountExists && (
							<form onSubmit={submit} className="space-y-4">
								<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
									<div className="px-4 pb-2 pt-3">
										<Label className={labelClass}>Email</Label>
										<p className="flex h-9 items-center text-[17px] text-muted-foreground">
											{props.email}
										</p>
									</div>
									<div className="px-4 pb-2 pt-3">
										<Label htmlFor="name" className={labelClass}>
											Nama Lengkap
										</Label>
										<Input
											id="name"
											value={data.name}
											autoComplete="name"
											placeholder="Masukkan nama lengkap..."
											onChange={(e) => setData('name', e.target.value)}
											className={fieldClass}
										/>
										{errors.name && <InputError message={errors.name} />}
									</div>
									<div className="px-4 pb-2 pt-3">
										<Label htmlFor="phone" className={labelClass}>
											No. HP (opsional)
										</Label>
										<Input
											id="phone"
											type="tel"
											inputMode="tel"
											value={data.phone}
											autoComplete="tel"
											placeholder="08xxxxxxxxxx"
											onChange={(e) => setData('phone', e.target.value)}
											className={fieldClass}
										/>
										{errors.phone && <InputError message={errors.phone} />}
									</div>
									<div className="px-4 pb-2 pt-3">
										<Label htmlFor="password" className={labelClass}>
											Kata Sandi
										</Label>
										<div className="relative">
											<Input
												id="password"
												type={showPassword ? 'text' : 'password'}
												value={data.password}
												autoComplete="new-password"
												placeholder="Buat kata sandi"
												onChange={(e) => setData('password', e.target.value)}
												className={`${fieldClass} pr-12`}
											/>
											<button
												type="button"
												onClick={() => setShowPassword(!showPassword)}
												className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"
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
									<div className="px-4 pb-2 pt-3">
										<Label htmlFor="password_confirmation" className={labelClass}>
											Konfirmasi Kata Sandi
										</Label>
										<Input
											id="password_confirmation"
											type={showPassword ? 'text' : 'password'}
											value={data.password_confirmation}
											autoComplete="new-password"
											placeholder="Ulangi kata sandi"
											onChange={(e) => setData('password_confirmation', e.target.value)}
											className={fieldClass}
										/>
									</div>
								</div>

								<div className="space-y-1.5">
									<label htmlFor="terms" className="flex items-start gap-2.5">
										<Checkbox
											id="terms"
											checked={data.terms}
											onCheckedChange={(checked) => setData('terms', Boolean(checked))}
											className="mt-0.5"
										/>
										<span className="text-sm leading-relaxed text-muted-foreground">
											Saya menyetujui{' '}
											<Link
												href={route('info.terms')}
												className="font-medium text-destructive hover:underline"
											>
												Syarat &amp; Ketentuan
											</Link>{' '}
											dan{' '}
											<Link
												href={route('info.privacy')}
												className="font-medium text-destructive hover:underline"
											>
												Kebijakan Privasi
											</Link>
											.
										</span>
									</label>
									{errors.terms && <InputError message={errors.terms} />}
								</div>

								<Button type="submit" disabled={processing} className={submitClass}>
									{processing ? (
										<IconLoader2 className="h-5 w-5 animate-spin" />
									) : (
										<>
											<IconShieldCheck className="h-5 w-5" /> Buat Akun Petugas
										</>
									)}
								</Button>
							</form>
						)}
					</>
				)}
			</div>
		</div>
	);
}

Invitation.layout = (page) => <GuestLayout children={page} title="Undangan Petugas" />;
