import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm } from '@inertiajs/react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
	const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
	const passwordInput = useRef();

	const {
		data,
		setData,
		delete: destroy,
		processing,
		reset,
		errors,
		clearErrors,
	} = useForm({
		password: '',
	});

	const confirmUserDeletion = () => {
		setConfirmingUserDeletion(true);
	};

	const deleteUser = (e) => {
		e.preventDefault();

		destroy(route('profile.destroy'), {
			preserveScroll: true,
			onSuccess: () => closeModal(),
			onError: () => passwordInput.current.focus(),
			onFinish: () => reset(),
		});
	};

	const closeModal = () => {
		setConfirmingUserDeletion(false);
		clearErrors();
		reset();
	};

	return (
		<Card className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm ${className}`}>
			<CardHeader className="border-b border-border bg-transparent pb-5">
				<div className="flex items-center gap-3">
					<div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2 text-destructive">
						<IconAlertTriangle size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-base font-semibold text-foreground">Hapus Akun</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				<div className="max-w-2xl">
					<p className="mb-5 text-sm text-muted-foreground">
						Sebelum menghapus akun Anda, harap unduh data atau informasi apa pun yang ingin Anda simpan.
						Proses ini tidak dapat dibatalkan.
					</p>

					<Button
						variant="destructive"
						onClick={confirmUserDeletion}
						className="h-9 rounded-md bg-destructive px-4 text-sm font-medium transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
					>
						Hapus Akun Permanen
					</Button>
				</div>

				<Modal show={confirmingUserDeletion} onClose={closeModal}>
					<form onSubmit={deleteUser} className="rounded-xl border border-border bg-card p-6 sm:p-8">
						<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
							<IconAlertTriangle className="h-5 w-5 text-destructive" />
							Apakah Anda yakin?
						</h2>

						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Setelah akun Anda dihapus, semua sumber daya dan datanya akan dihapus secara permanen.
							Silakan masukkan kata sandi Anda untuk mengonfirmasi bahwa Anda ingin menghapus akun Anda
							secara permanen.
						</p>

						<div className="mt-5">
							<Label htmlFor="password" className="sr-only">
								Password
							</Label>
							<Input
								id="password"
								type="password"
								name="password"
								ref={passwordInput}
								value={data.password}
								onChange={(e) => setData('password', e.target.value)}
								className="block h-10 w-full rounded-md border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive sm:w-3/4"
								placeholder="Masukkan kata sandi Anda"
							/>
							{errors.password && <InputError message={errors.password} className="mt-2" />}
						</div>

						<div className="mt-8 flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								className="h-9 rounded-md border-border bg-card text-foreground hover:bg-accent"
								onClick={closeModal}
							>
								Batal
							</Button>
							<Button
								variant="destructive"
								className="h-9 rounded-md bg-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
								disabled={processing}
							>
								Ya, Hapus Akun Saya
							</Button>
						</div>
					</form>
				</Modal>
			</CardContent>
		</Card>
	);
}
