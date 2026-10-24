import { filledFieldsClass } from '@/Components/GroupedForm';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { flashMessage } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { IconLock } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

// TASK_82: akun Google/Apple belum punya kata sandi (hasPassword dari ProfileController::edit),
// jadi form ganti sandi - yang wajib "kata sandi saat ini" - mustahil lolos. Kepemilikan email
// dibuktikan dengan kode 6 angka; setelah berhasil hasPassword jadi true dan Edit.jsx menampilkan
// UpdatePasswordForm biasa.
const inputClass = 'h-11 rounded-xl border-border bg-background focus-visible:ring-2 focus-visible:ring-primary/30';

export default function CreatePasswordForm({ email, className = '' }) {
	const codeInput = useRef();
	const passwordInput = useRef();
	const [codeSent, setCodeSent] = useState(false);

	const sendForm = useForm({});
	const { data, setData, errors, post, reset, processing } = useForm({
		code: '',
		password: '',
		password_confirmation: '',
	});

	const showFlash = (page) => {
		const flash = flashMessage(page);
		if (flash?.message) toast[flash.type](flash.message);
	};

	const sendCode = () => {
		sendForm.post(route('password.setup-code'), {
			preserveScroll: true,
			onSuccess: (page) => {
				showFlash(page);
				setCodeSent(true);
				setTimeout(() => codeInput.current?.focus(), 0);
			},
		});
	};

	const createPassword = (e) => {
		e.preventDefault();
		post(route('password.setup'), {
			preserveScroll: true,
			onSuccess: (page) => {
				reset();
				showFlash(page);
			},
			onError: (errors) => {
				if (errors.code) {
					reset('code');
					codeInput.current?.focus();
				} else if (errors.password) {
					reset('password', 'password_confirmation');
					passwordInput.current?.focus();
				}
			},
		});
	};

	return (
		<Card className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
			<CardHeader className="border-b border-border/70 bg-transparent pb-4">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-primary/10 p-2 text-primary">
						<IconLock size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-[17px] font-semibold tracking-tight text-foreground">
							Buat Kata Sandi
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Akun Anda masuk lewat Google/Apple dan belum punya kata sandi. Buat kata sandi agar bisa
							masuk juga dengan email.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				{!codeSent ? (
					<div className="max-w-xl space-y-4">
						<p className="text-sm text-muted-foreground">
							Kami akan mengirim kode 6 angka ke{' '}
							<span className="font-medium text-foreground">{email || 'email Anda'}</span> untuk
							memastikan email ini milik Anda.
						</p>
						{sendForm.errors.code && <InputError message={sendForm.errors.code} />}
						<div className="flex flex-wrap items-center gap-3">
							<Button
								type="button"
								onClick={sendCode}
								className="h-10 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
								disabled={sendForm.processing}
							>
								{sendForm.processing ? 'Mengirim...' : 'Kirim Kode'}
							</Button>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setCodeSent(true)}
								className="h-10 rounded-xl px-3 text-sm font-medium"
							>
								Sudah punya kode
							</Button>
						</div>
					</div>
				) : (
					<form onSubmit={createPassword} className={`max-w-xl space-y-5 ${filledFieldsClass}`}>
						<div className="space-y-1.5">
							<Label htmlFor="code" className="text-sm font-medium text-foreground">
								Kode dari Email
							</Label>
							<Input
								id="code"
								name="code"
								ref={codeInput}
								value={data.code}
								onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
								inputMode="numeric"
								autoComplete="one-time-code"
								maxLength={6}
								placeholder="6 angka"
								className={`${inputClass} tracking-[0.3em] placeholder:tracking-normal`}
							/>
							{errors.code && <InputError message={errors.code} />}
							{sendForm.errors.code && <InputError message={sendForm.errors.code} />}
							<p className="text-xs text-muted-foreground">
								Dikirim ke {email || 'email Anda'}, berlaku 10 menit. Tidak masuk? Periksa folder Spam,
								atau{' '}
								<button
									type="button"
									onClick={sendCode}
									disabled={sendForm.processing}
									className="font-medium text-primary underline-offset-2 hover:underline disabled:opacity-50"
								>
									kirim ulang kode
								</button>
								.
							</p>
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
								onChange={(e) => setData('password', e.target.value)}
								type="password"
								autoComplete="new-password"
								className={inputClass}
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
								onChange={(e) => setData('password_confirmation', e.target.value)}
								type="password"
								autoComplete="new-password"
								className={inputClass}
							/>
							{errors.password_confirmation && <InputError message={errors.password_confirmation} />}
						</div>

						<div className="pt-2">
							<Button
								className="h-10 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
								disabled={processing || data.code.length !== 6}
							>
								Buat Kata Sandi
							</Button>
						</div>
					</form>
				)}
			</CardContent>
		</Card>
	);
}
