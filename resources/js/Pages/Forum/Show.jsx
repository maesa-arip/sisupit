import InputError from '@/Components/InputError';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/Components/ui/dialog';
import { Textarea } from '@/Components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { announceFormErrors, containsEmergencyWords } from '@/lib/forum';
import { cn, flashMessage, roleLabel, roleTone, timeAgo } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconArrowLeft,
	IconCircleCheck,
	IconEye,
	IconEyeOff,
	IconFlag,
	IconPin,
	IconShieldCheck,
	IconTrash,
} from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmergencyConfirmDialog, ForumStatusBadge, ForumText } from './Partials/ForumParts';

const withToast = {
	preserveScroll: true,
	onSuccess: (success) => {
		const flash = flashMessage(success);
		if (flash) toast[flash.type](flash.message);
	},
};

function AuthorLine({ name, roles, isMine, createdAt, official }) {
	return (
		<div className="flex flex-wrap items-center gap-2 text-xs">
			<span className="font-semibold text-foreground">{isMine ? `${name} (Anda)` : name}</span>
			<span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', roleTone(roles))}>
				{roleLabel(roles)}
			</span>
			{official && (
				<span className="flex items-center gap-1 rounded-md border border-success/20 bg-success/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">
					<IconShieldCheck className="size-3" /> Jawaban Resmi Damkar
				</span>
			)}
			<span className="text-muted-foreground">· {timeAgo(createdAt)}</span>
		</div>
	);
}

/** Satu dialog untuk dua kebutuhan beralasan: melaporkan konten & menyembunyikannya. */
function ReasonDialog({ target, onClose, flagReasons }) {
	const isFlag = target?.mode === 'flag';
	const { data, setData, post, processing, errors, reset } = useForm({ reason: '', note: '' });

	const close = () => {
		reset();
		onClose();
	};

	const submit = () =>
		post(target.url, {
			...withToast,
			onSuccess: (success) => {
				withToast.onSuccess(success);
				close();
			},
		});

	return (
		<Dialog open={Boolean(target)} onOpenChange={(open) => !open && close()}>
			<DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{isFlag ? 'Laporkan tulisan ini' : 'Sembunyikan tulisan ini'}</DialogTitle>
					<DialogDescription>
						{isFlag
							? 'Laporan dikirim ke admin Damkar kabupaten Anda. Penulis tidak diberi tahu siapa yang melapor.'
							: 'Penulis tetap bisa melihat tulisannya beserta alasan di bawah ini. Tindakan ini bisa dipulihkan.'}
					</DialogDescription>
				</DialogHeader>

				{isFlag ? (
					<div className="space-y-3">
						<div className="flex flex-wrap gap-2">
							{flagReasons.map((reason) => (
								<button
									key={reason.value}
									type="button"
									onClick={() => setData('reason', reason.value)}
									className={cn(
										'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
										data.reason === reason.value
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-input text-muted-foreground hover:bg-accent',
									)}
								>
									{reason.label}
								</button>
							))}
						</div>
						{errors.reason && <InputError message={errors.reason} />}
						<Textarea
							rows={3}
							maxLength={300}
							value={data.note}
							onChange={(e) => setData('note', e.target.value)}
							placeholder="Keterangan tambahan (opsional)"
						/>
					</div>
				) : (
					<div className="space-y-1.5">
						<Textarea
							rows={3}
							maxLength={300}
							value={data.reason}
							onChange={(e) => setData('reason', e.target.value)}
							placeholder="Alasan, misalnya: menyebar nomor telepon pribadi"
						/>
						{errors.reason && <InputError message={errors.reason} />}
					</div>
				)}

				<DialogFooter className="gap-2">
					<Button variant="ghost" onClick={close}>
						Batal
					</Button>
					<Button variant={isFlag ? 'default' : 'red'} disabled={processing || !data.reason} onClick={submit}>
						{isFlag ? 'Kirim Laporan' : 'Sembunyikan'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

export default function Show({ thread, posts, can, flagReasons }) {
	const [reasonTarget, setReasonTarget] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [confirmOpen, setConfirmOpen] = useState(false);
	const { data, setData, post, processing, errors, reset } = useForm({ body: '' });

	const sendReply = () =>
		post(route('forum.reply', thread.id), {
			...withToast,
			onSuccess: (success) => {
				withToast.onSuccess(success);
				reset();
			},
			onError: (errs) => {
				// Sama dengan form pertanyaan: galat per isian ikut diumumkan (#122).
				if (announceFormErrors(errs, { body: 'reply-body' })) return;
				toast.error('Balasan belum terkirim. Coba lagi sebentar lagi.');
			},
		});

	const handleReply = (e) => {
		e.preventDefault();
		if (containsEmergencyWords(data.body)) {
			setConfirmOpen(true);
			return;
		}
		sendReply();
	};

	const act = (url) => router.post(url, {}, withToast);

	return (
		<div className="flex w-full flex-col space-y-4 pb-32">
			<Head title={thread.title} />

			<div>
				<Button variant="ghost" size="sm" asChild className="-ml-2">
					<Link href={route('forum.index')}>
						<IconArrowLeft /> Forum Warga
					</Link>
				</Button>
			</div>

			{thread.status !== 'tampil' && (
				<div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-xs leading-relaxed text-foreground">
					<div className="mb-1">
						<ForumStatusBadge status={thread.status} />
					</div>
					{thread.status === 'menunggu'
						? 'Pertanyaan ini belum tayang. Hanya penulis dan admin yang bisa melihatnya sampai admin menyetujuinya.'
						: `Pertanyaan ini disembunyikan admin${thread.moderation_reason ? `: ${thread.moderation_reason}` : '.'}`}
				</div>
			)}

			<Card className="rounded-xl shadow-sm">
				<CardContent className="space-y-3 p-5">
					{thread.is_pinned && (
						<span className="inline-flex items-center gap-1 rounded-md border border-info/30 bg-info/10 px-2 py-0.5 text-[10px] font-bold uppercase text-info">
							<IconPin className="size-3" /> Disematkan
						</span>
					)}
					<h1 className="text-lg font-bold leading-snug text-foreground lg:text-xl">{thread.title}</h1>
					<AuthorLine
						name={thread.author}
						roles={thread.author_roles}
						isMine={thread.is_mine}
						createdAt={thread.created_at}
					/>
					<ForumText text={thread.body} />

					<div className="flex flex-wrap gap-2 border-t border-border pt-3">
						{can.moderate && thread.status === 'menunggu' && (
							<Button
								size="sm"
								variant="green"
								onClick={() => act(route('admin.forum.threads.approve', thread.id))}
							>
								<IconCircleCheck /> Setujui
							</Button>
						)}
						{can.moderate && thread.status === 'tampil' && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => act(route('admin.forum.threads.pin', thread.id))}
							>
								<IconPin /> {thread.is_pinned ? 'Lepas Sematan' : 'Sematkan'}
							</Button>
						)}
						{can.moderate && thread.status !== 'disembunyikan' && (
							<Button
								size="sm"
								variant="outline"
								onClick={() =>
									setReasonTarget({ mode: 'hide', url: route('admin.forum.threads.hide', thread.id) })
								}
							>
								<IconEyeOff /> Sembunyikan
							</Button>
						)}
						{can.moderate && thread.status === 'disembunyikan' && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => act(route('admin.forum.threads.restore', thread.id))}
							>
								<IconEye /> Pulihkan
							</Button>
						)}
						{!thread.is_mine && thread.status === 'tampil' && (
							<Button
								size="sm"
								variant="ghost"
								disabled={thread.flagged_by_me}
								onClick={() => setReasonTarget({ mode: 'flag', url: route('forum.flag', thread.id) })}
							>
								<IconFlag /> {thread.flagged_by_me ? 'Sudah dilaporkan' : 'Laporkan'}
							</Button>
						)}
						{thread.is_mine && (
							<Button
								size="sm"
								variant="ghost"
								className="text-destructive"
								onClick={() =>
									setDeleteTarget({ url: route('forum.destroy', thread.id), label: 'pertanyaan' })
								}
							>
								<IconTrash /> Hapus
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<h2 className="px-1 pt-2 text-sm font-bold text-foreground">
				{posts.length > 0 ? `${posts.length} Balasan` : 'Belum ada balasan'}
			</h2>

			<div className="flex flex-col gap-3">
				{posts.map((item) => {
					const accepted = thread.accepted_post_id === item.id;
					const hidden = item.status !== 'tampil';

					return (
						<Card
							key={item.id}
							className={cn(
								'rounded-xl shadow-sm',
								item.is_official && 'border-success/30',
								accepted && 'border-primary/40',
								hidden && 'opacity-70',
							)}
						>
							<CardContent className="space-y-2 p-4">
								<div className="flex flex-wrap items-center gap-2">
									{accepted && (
										<span className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">
											<IconCircleCheck className="size-3" /> Paling Membantu
										</span>
									)}
									{hidden && <ForumStatusBadge status={item.status} />}
								</div>
								<AuthorLine
									name={item.author}
									roles={item.author_roles}
									isMine={item.is_mine}
									createdAt={item.created_at}
									official={item.is_official}
								/>
								<ForumText text={item.body} />
								{hidden && item.moderation_reason && (
									<p className="text-[11px] text-muted-foreground">
										Alasan: {item.moderation_reason}
									</p>
								)}

								<div className="flex flex-wrap gap-1">
									{can.accept && !hidden && !item.is_mine && (
										<Button
											size="sm"
											variant="ghost"
											onClick={() => act(route('forum.posts.accept', [thread.id, item.id]))}
										>
											<IconCircleCheck /> {accepted ? 'Batalkan tanda' : 'Paling membantu'}
										</Button>
									)}
									{can.moderate &&
										(hidden ? (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => act(route('admin.forum.posts.restore', item.id))}
											>
												<IconEye /> Pulihkan
											</Button>
										) : (
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													setReasonTarget({
														mode: 'hide',
														url: route('admin.forum.posts.hide', item.id),
													})
												}
											>
												<IconEyeOff /> Sembunyikan
											</Button>
										))}
									{!item.is_mine && !hidden && (
										<Button
											size="sm"
											variant="ghost"
											disabled={item.flagged_by_me}
											onClick={() =>
												setReasonTarget({
													mode: 'flag',
													url: route('forum.posts.flag', [thread.id, item.id]),
												})
											}
										>
											<IconFlag /> {item.flagged_by_me ? 'Sudah dilaporkan' : 'Laporkan'}
										</Button>
									)}
									{item.is_mine && (
										<Button
											size="sm"
											variant="ghost"
											className="text-destructive"
											onClick={() =>
												setDeleteTarget({
													url: route('forum.posts.destroy', [thread.id, item.id]),
													label: 'balasan',
												})
											}
										>
											<IconTrash /> Hapus
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{can.reply ? (
				<Card className="rounded-xl shadow-sm">
					<CardContent className="p-4">
						<form onSubmit={handleReply} className="space-y-2">
							<Textarea
								id="reply-body"
								rows={4}
								maxLength={3000}
								value={data.body}
								onChange={(e) => setData('body', e.target.value)}
								placeholder={
									can.answerOfficially
										? 'Tulis jawaban - akan bertanda "Jawaban Resmi Damkar".'
										: 'Tulis balasan. Jangan cantumkan data pribadi orang lain.'
								}
							/>
							{errors.body && <InputError message={errors.body} />}
							<div className="flex justify-end">
								<Button type="submit" size="sm" disabled={processing || !data.body.trim()}>
									Kirim Balasan
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			) : (
				thread.status !== 'tampil' && (
					<p className="px-1 text-xs text-muted-foreground">Balasan dibuka setelah pertanyaan tayang.</p>
				)
			)}

			<ReasonDialog target={reasonTarget} onClose={() => setReasonTarget(null)} flagReasons={flagReasons} />

			<AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Hapus {deleteTarget?.label} ini?</AlertDialogTitle>
						<AlertDialogDescription>
							Tulisan yang dihapus tidak bisa dikembalikan dari layar.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Batal</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() => router.delete(deleteTarget.url, withToast)}
						>
							Hapus
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<EmergencyConfirmDialog
				open={confirmOpen}
				onOpenChange={setConfirmOpen}
				onContinue={() => {
					setConfirmOpen(false);
					sendReply();
				}}
			/>
		</div>
	);
}

Show.layout = (page) => <AppLayout children={page} title="Forum Warga" />;
