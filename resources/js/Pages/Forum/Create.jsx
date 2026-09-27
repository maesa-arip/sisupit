import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { announceFormErrors, containsEmergencyWords, FORUM_LIMITS, lengthHint } from '@/lib/forum';
import { flashMessage } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconInfoCircle, IconMessagePlus } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmergencyConfirmDialog, EmergencyNotice } from './Partials/ForumParts';

export default function Create({ wilayah, needsApproval }) {
	const { data, setData, post, processing, errors } = useForm({ title: '', body: '' });
	const [confirmOpen, setConfirmOpen] = useState(false);

	const send = () =>
		post(route('forum.store'), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
			onError: (errs) => {
				// Galat per isian WAJIB diumumkan juga, bukan cuma dirender di bawah isiannya - lihat
				// announceFormErrors (#122). Catatan: 429 dari limiter & 419 TIDAK sampai ke callback ini
				// (Inertia 2.0.3 tak meneruskannya ke onError) - lihat FINDINGS #123/#124.
				if (announceFormErrors(errs, { title: 'title', body: 'body' })) return;
				toast.error('Pertanyaan belum terkirim. Coba lagi sebentar lagi.');
			},
		});

	const handleSubmit = (e) => {
		e.preventDefault();

		if (containsEmergencyWords(data.title, data.body)) {
			setConfirmOpen(true);
			return;
		}

		send();
	};

	return (
		<div className="flex w-full flex-col space-y-6 pb-32">
			<Head title="Ajukan Pertanyaan" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Ajukan Pertanyaan"
					subtitle={`Forum Warga${wilayah ? ` - ${wilayah}` : ''}`}
					icon={IconMessagePlus}
				/>
				<Button variant="outline" size="sm" asChild>
					<Link href={route('forum.index')}>
						<IconArrowLeft /> Kembali
					</Link>
				</Button>
			</div>

			<EmergencyNotice />

			<Card className="max-w-3xl">
				<CardContent className="p-5">
					<form className="space-y-5" onSubmit={handleSubmit}>
						<div className="grid gap-1.5">
							<Label htmlFor="title">Judul pertanyaan</Label>
							<Input
								id="title"
								value={data.title}
								maxLength={FORUM_LIMITS.threadTitle.max}
								onChange={(e) => setData('title', e.target.value)}
								placeholder="Contoh: Berapa lama APAR rumah tangga boleh dipakai?"
							/>
							<p className="text-right text-[11px] text-muted-foreground">
								{lengthHint(data.title, FORUM_LIMITS.threadTitle)}
							</p>
							{errors.title && <InputError message={errors.title} />}
						</div>

						<div className="grid gap-1.5">
							<Label htmlFor="body">Isi pertanyaan</Label>
							<Textarea
								id="body"
								rows={6}
								value={data.body}
								maxLength={FORUM_LIMITS.threadBody.max}
								onChange={(e) => setData('body', e.target.value)}
								placeholder="Ceritakan konteksnya. Jangan cantumkan nomor telepon, alamat rumah, atau data pribadi orang lain."
							/>
							<p className="text-right text-[11px] text-muted-foreground">
								{lengthHint(data.body, FORUM_LIMITS.threadBody)}
							</p>
							{errors.body && <InputError message={errors.body} />}
						</div>

						{needsApproval && (
							<div className="flex items-start gap-3 rounded-md border border-border bg-accent/40 p-3">
								<IconInfoCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
								<p className="text-xs leading-relaxed text-muted-foreground">
									Pertanyaan ditinjau admin Damkar sebelum tayang. Sampai disetujui, hanya Anda dan
									admin yang bisa melihatnya.
								</p>
							</div>
						)}

						<div className="flex justify-end">
							<Button type="submit" size="sm" disabled={processing}>
								Kirim Pertanyaan
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<EmergencyConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				onContinue={() => {
					setConfirmOpen(false);
					send();
				}}
			/>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Ajukan Pertanyaan" />;
