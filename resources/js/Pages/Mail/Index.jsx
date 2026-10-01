import HeaderTitle from '@/Components/HeaderTitle';
import { Button } from '@/Components/ui/button';
import { CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconAlertTriangle, IconMail, IconPencilPlus, IconSearch, IconSend } from '@tabler/icons-react';

/**
 * Surat dinas yang sudah dikirim dari kotak surat kabupaten ini (TASK_56).
 * Daftarnya APPEND-ONLY: tak ada tombol ubah maupun hapus - ia jejak, bukan draf.
 */
export default function Index({ messages, filters, mailbox }) {
	const { data, setData, get } = useForm({
		search: filters?.search || '',
	});

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('mail.index'), { preserveState: true, preserveScroll: true });
	};

	const tanggal = (nilai) =>
		new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(nilai));

	return (
		<div className="flex h-full w-full flex-col space-y-6">
			<Head title="Email Dinas" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Email Dinas"
					subtitle={
						mailbox?.address
							? `Dikirim dari ${mailbox.name ? `${mailbox.name} <${mailbox.address}>` : mailbox.address}`
							: 'Surat keluar ke pejabat.'
					}
					icon={IconMail}
				/>
				<Button size="sm" asChild>
					<Link href={route('mail.create')}>
						<IconPencilPlus className="mr-1.5 h-4 w-4" /> Tulis Surat
					</Link>
				</Button>
			</div>

			<form onSubmit={handleSearch} className="relative max-w-md">
				<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Cari perihal atau pengirim..."
					className="h-10 pl-9"
					value={data.search}
					onChange={(e) => setData('search', e.target.value)}
				/>
			</form>

			<div className="flex flex-col gap-3">
				{messages.data && messages.data.length > 0 ? (
					<>
						<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
							{messages.data.map((message) => (
								<div key={message.id} className="transition-colors hover:bg-muted/40 active:bg-muted">
									<CardContent className="flex flex-row items-start gap-3 p-3 sm:p-4">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
												message.status === 'gagal'
													? 'bg-destructive/10 text-destructive'
													: 'bg-muted text-muted-foreground'
											}`}
										>
											{message.status === 'gagal' ? (
												<IconAlertTriangle className="h-5 w-5" />
											) : (
												<IconSend className="h-5 w-5" />
											)}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<h3 className="truncate text-sm font-semibold text-foreground">
													{message.subject}
												</h3>
												{message.status === 'gagal' && (
													<span className="shrink-0 rounded-lg border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-[11px] font-bold uppercase text-destructive">
														Gagal
													</span>
												)}
											</div>
											<p className="mt-0.5 truncate text-xs text-muted-foreground">
												Kepada {message.penerima || '-'}
											</p>
											<p className="mt-1 text-[11px] text-muted-foreground">
												{message.sender_name} . {tanggal(message.created_at)}
											</p>
										</div>
									</CardContent>
								</div>
							))}
						</div>

						<div className="mt-2 flex flex-col items-center justify-between gap-3 sm:flex-row">
							<span className="text-[11px] font-medium text-muted-foreground">
								Menampilkan {messages.from} - {messages.to} dari {messages.total} surat
							</span>

							{messages.links && messages.links.length > 3 && (
								<div className="flex flex-wrap justify-center gap-1">
									{messages.links.map((link, index) =>
										link.url ? (
											<Link
												key={index}
												href={link.url}
												preserveScroll
												className={`rounded-2xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
													link.active
														? 'border-primary bg-primary text-primary-foreground shadow-sm'
														: 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
												}`}
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										) : (
											<span
												key={index}
												className="rounded-2xl border border-input px-3 py-1.5 text-xs font-semibold text-muted-foreground/40"
												dangerouslySetInnerHTML={{ __html: link.label }}
											/>
										),
									)}
								</div>
							)}
						</div>
					</>
				) : (
					<div className="rounded-2xl border border-dashed border-input p-10 text-center">
						<span className="text-sm text-muted-foreground">Belum ada surat yang dikirim dari sini.</span>
					</div>
				)}
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Email Dinas" />;
