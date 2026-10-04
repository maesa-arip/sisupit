import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { useForm } from '@inertiajs/react';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useRef, useState } from 'react';

// hasPassword dari ProfileController::edit - akun Google tak punya password, jadi
// konfirmasinya mengetik HAPUS (server memeriksa aturan yang sama).
export default function DeleteUserForm({ className = '', hasPassword = true }) {
	const field = hasPassword ? 'password' : 'confirmation';
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
		[field]: '',
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
			<CardHeader className="border-b border-border/70 bg-transparent pb-4">
				<div className="flex items-center gap-3">
					<div className="rounded-xl bg-destructive/10 p-2 text-destructive">
						<IconAlertTriangle size={20} stroke={1.5} />
					</div>
					<div>
						<CardTitle className="text-[17px] font-semibold tracking-tight text-foreground">
							Hapus Akun
						</CardTitle>
						<CardDescription className="mt-1 text-sm text-muted-foreground">
							Hapus identitas Anda dari Sisupit secara permanen.
						</CardDescription>
					</div>
				</div>
			</CardHeader>

			<CardContent className="pt-5">
				<div className="max-w-2xl">
					<p className="mb-5 text-sm text-muted-foreground">
						Nama, email, nomor telepon, alamat, foto profil, foto KTP, dan tautan login Google Anda akan
						dihapus, dan akun ini tidak bisa dipakai masuk lagi. Laporan kejadian yang pernah Anda kirim,
						beserta nama & nomor kontak yang tercantum di laporan itu, tetap disimpan instansi sebagai arsip
						penanganan resmi sesuai Kebijakan Privasi. Proses ini tidak dapat dibatalkan.
					</p>

					<Button
						variant="destructive"
						onClick={confirmUserDeletion}
						className="h-10 rounded-xl bg-destructive px-4 text-sm font-medium transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
					>
						Hapus Akun Permanen
					</Button>
				</div>

				<Modal show={confirmingUserDeletion} onClose={closeModal}>
					<form onSubmit={deleteUser} className="rounded-2xl border border-border/70 bg-card p-5 sm:p-6">
						<h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
							<IconAlertTriangle className="h-5 w-5 text-destructive" />
							Apakah Anda yakin?
						</h2>

						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							Identitas Anda akan dihapus permanen dan akun ini tidak bisa dipakai masuk lagi.{' '}
							{hasPassword
								? 'Masukkan kata sandi Anda untuk mengonfirmasi.'
								: 'Ketik HAPUS (huruf besar) untuk mengonfirmasi.'}
						</p>

						<div className="mt-5">
							<Label htmlFor={field} className="sr-only">
								{hasPassword ? 'Kata Sandi' : 'Konfirmasi'}
							</Label>
							<Input
								id={field}
								type={hasPassword ? 'password' : 'text'}
								name={field}
								ref={passwordInput}
								value={data[field]}
								onChange={(e) => setData(field, e.target.value)}
								autoComplete="off"
								className="block h-10 w-full rounded-xl border-border bg-background focus-visible:ring-1 focus-visible:ring-destructive sm:w-3/4"
								placeholder={hasPassword ? 'Masukkan kata sandi Anda' : 'HAPUS'}
							/>
							{errors[field] && <InputError message={errors[field]} className="mt-2" />}
						</div>

						<div className="mt-8 flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								className="h-9 rounded-xl border-border bg-card text-foreground hover:bg-accent"
								onClick={closeModal}
							>
								Batal
							</Button>
							<Button
								variant="destructive"
								className="h-9 rounded-lg bg-destructive hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/50"
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
