import { groupedRowsClass } from '@/Components/GroupedForm';
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Checkbox } from '@/Components/ui/checkbox';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { flashMessage } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconArrowLeft, IconInfoCircle, IconPencilPlus, IconSend } from '@tabler/icons-react';
import { toast } from 'sonner';

/**
 * Tulis surat dinas (TASK_56).
 *
 * Penerima DIPILIH dari daftar, tidak pernah diketik bebas: server hanya menerima alamat yang
 * ada di Daftar Penerima, dan kotak isian bebas yang lalu ditolak server adalah bentuk #105 -
 * layar menjanjikan lebih longgar daripada yang server izinkan.
 */
export default function Create({ contacts = [], mailbox }) {
	const { data, setData, post, processing, errors } = useForm({
		to: [],
		cc: [],
		subject: '',
		body: '',
	});

	const togglePenerima = (medan, email) => {
		setData(medan, data[medan].includes(email) ? data[medan].filter((e) => e !== email) : [...data[medan], email]);
	};

	const onHandleSubmit = (e) => {
		e.preventDefault();
		post(route('mail.store'), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash) toast[flash.type](flash.message);
			},
		});
	};

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Tulis Surat Dinas" />

			<div className="mb-2 flex flex-col items-start justify-between gap-y-4 lg:flex-row lg:items-center">
				<HeaderTitle
					title="Tulis Surat Dinas"
					subtitle={
						mailbox?.address
							? `Dikirim dari ${mailbox.name ? `${mailbox.name} <${mailbox.address}>` : mailbox.address}`
							: 'Surat keluar ke pejabat.'
					}
					icon={IconPencilPlus}
				/>
				<Button className="rounded-full" variant="outline" size="sm" asChild>
					<Link href={route('mail.index')}>
						<IconArrowLeft className="mr-1.5 size-4" /> Kembali
					</Link>
				</Button>
			</div>

			<div className="w-full max-w-2xl">
				<Card className="w-full max-w-2xl">
					<CardContent className="p-5 sm:p-6">
						{contacts.length === 0 ? (
							<div className="flex items-start gap-3 rounded-2xl border border-warning/20 bg-warning/10 p-3 text-warning">
								<IconInfoCircle className="mt-0.5 h-5 w-5 shrink-0" />
								<p className="text-xs font-medium leading-relaxed">
									Belum ada penerima terdaftar untuk wilayah ini. Minta admin mengisi Daftar Penerima
									Email lebih dulu - surat hanya bisa dikirim ke alamat yang ada di daftar itu.
								</p>
							</div>
						) : (
							<form
								className={groupedRowsClass}
								onSubmit={onHandleSubmit}
							>
								<div className="space-y-2">
									<Label>Penerima</Label>
									<div className="max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-input p-2">
										{contacts.map((contact) => (
											<label
												key={contact.id}
												className="flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-accent"
											>
												<Checkbox
													className="mt-0.5"
													checked={data.to.includes(contact.email)}
													onCheckedChange={() => togglePenerima('to', contact.email)}
												/>
												<span className="min-w-0 flex-1">
													<span className="block truncate text-sm font-medium text-foreground">
														{contact.name}
													</span>
													<span className="block truncate text-xs text-muted-foreground">
														{[contact.jabatan, contact.instansi]
															.filter(Boolean)
															.join(' . ') || contact.email}
													</span>
												</span>
											</label>
										))}
									</div>
									{errors.to && <InputError message={errors.to} />}
								</div>

								<div className="space-y-2">
									<Label htmlFor="subject">Perihal</Label>
									<Input
										id="subject"
										value={data.subject}
										onChange={(e) => setData('subject', e.target.value)}
										placeholder="Laporan Kejadian Kebakaran"
									/>
									{errors.subject && <InputError message={errors.subject} />}
								</div>

								<div className="space-y-2">
									<Label htmlFor="body">Isi surat</Label>
									<Textarea
										id="body"
										rows={12}
										value={data.body}
										onChange={(e) => setData('body', e.target.value)}
										placeholder="Dengan hormat,"
									/>
									<p className="text-xs text-muted-foreground">
										Tanda tangan yang disetel admin ikut ditambahkan di bawah isi surat.
									</p>
									{errors.body && <InputError message={errors.body} />}
								</div>

								<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
									<Button className="h-11 rounded-xl" type="button" variant="ghost" asChild>
										<Link href={route('mail.index')}>Batal</Link>
									</Button>
									<Button
										className="h-11 rounded-xl px-6"
										type="submit"
										disabled={processing || data.to.length === 0}
									>
										<IconSend className="mr-2 h-4 w-4" /> Kirim
									</Button>
								</div>
							</form>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

Create.layout = (page) => <AppLayout children={page} title="Tulis Surat Dinas" />;
