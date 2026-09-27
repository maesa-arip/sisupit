import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
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
import { cn, flashMessage, timeAgo } from '@/lib/utils';
import { ForumStatusBadge } from '@/Pages/Forum/Partials/ForumParts';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { IconCircleCheck, IconExternalLink, IconEye, IconEyeOff, IconShieldCheck, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const withToast = {
	preserveScroll: true,
	onSuccess: (success) => {
		const flash = flashMessage(success);
		if (flash) toast[flash.type](flash.message);
	},
};

/**
 * Antrean moderasi Forum Warga (TASK_54). Isi tiap tab disaring server per kabupaten admin.
 * Tab "Menunggu" dibuka pertama: pertanyaan warga tidak tayang sampai ada yang meninjaunya,
 * jadi antrean yang terlupakan = forum yang tampak mati tanpa gejala.
 */
export default function Index({ tab, items, counts }) {
	const [hideTarget, setHideTarget] = useState(null);
	const form = useForm({ reason: '' });

	const tabs = [
		{ key: 'menunggu', label: 'Menunggu', count: counts.menunggu },
		{ key: 'dilaporkan', label: 'Dilaporkan', count: counts.dilaporkan },
		{ key: 'disembunyikan', label: 'Disembunyikan' },
	];

	const act = (url) => router.post(url, {}, withToast);

	const closeHide = () => {
		form.reset();
		setHideTarget(null);
	};

	const submitHide = () =>
		form.post(hideTarget, {
			...withToast,
			onSuccess: (success) => {
				withToast.onSuccess(success);
				closeHide();
			},
		});

	return (
		<div className="flex w-full flex-col space-y-6 pb-32">
			<Head title="Moderasi Forum" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Moderasi Forum"
					subtitle="Tinjau pertanyaan warga dan tindak laporan konten di kabupaten Anda."
					icon={IconShieldCheck}
				/>
				<Button variant="outline" size="sm" asChild>
					<Link href={route('forum.index')}>
						<IconExternalLink /> Buka Forum
					</Link>
				</Button>
			</div>

			<div className="no-scrollbar flex gap-2 overflow-x-auto">
				{tabs.map((item) => (
					<button
						key={item.key}
						type="button"
						onClick={() =>
							router.get(route('admin.forum.index'), { tab: item.key }, { preserveScroll: true })
						}
						className={cn(
							'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
							tab === item.key
								? 'border-primary/30 bg-primary/10 text-primary'
								: 'border-input bg-transparent text-muted-foreground hover:bg-accent',
						)}
					>
						{item.label}
						{item.count > 0 ? ` (${item.count})` : ''}
					</button>
				))}
			</div>

			<div className="flex flex-col gap-3">
				{items.length === 0 && (
					<div className="rounded-xl border border-dashed border-input p-8 text-center">
						<p className="text-sm font-medium text-foreground">
							{tab === 'menunggu'
								? 'Tidak ada pertanyaan yang menunggu tinjauan.'
								: tab === 'dilaporkan'
									? 'Tidak ada laporan konten yang terbuka.'
									: 'Belum ada pertanyaan yang disembunyikan.'}
						</p>
					</div>
				)}

				{tab !== 'dilaporkan' &&
					items.map((thread) => (
						<Card key={thread.id} className="rounded-xl shadow-sm">
							<CardContent className="space-y-2 p-4">
								<div className="flex flex-wrap items-center gap-2">
									<ForumStatusBadge status={thread.status} />
									<span className="text-[11px] text-muted-foreground">
										{thread.author} · {timeAgo(thread.created_at)}
									</span>
								</div>
								<Link href={route('forum.show', thread.id)} className="block">
									<h3 className="text-sm font-semibold text-foreground hover:underline">
										{thread.title}
									</h3>
								</Link>
								<p className="whitespace-pre-line text-xs text-muted-foreground">{thread.excerpt}</p>
								{thread.moderation_reason && (
									<p className="text-[11px] text-muted-foreground">
										Alasan: {thread.moderation_reason}
										{thread.moderator ? ` - oleh ${thread.moderator}` : ''}
									</p>
								)}
								<div className="flex flex-wrap gap-2 pt-1">
									{thread.status === 'menunggu' && (
										<Button
											size="sm"
											variant="green"
											onClick={() => act(route('admin.forum.threads.approve', thread.id))}
										>
											<IconCircleCheck /> Setujui
										</Button>
									)}
									{thread.status === 'disembunyikan' ? (
										<Button
											size="sm"
											variant="outline"
											onClick={() => act(route('admin.forum.threads.restore', thread.id))}
										>
											<IconEye /> Pulihkan
										</Button>
									) : (
										<Button
											size="sm"
											variant="outline"
											onClick={() => setHideTarget(route('admin.forum.threads.hide', thread.id))}
										>
											<IconEyeOff /> Tolak / Sembunyikan
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					))}

				{tab === 'dilaporkan' &&
					items.map((item) => (
						<Card key={item.key} className="rounded-xl shadow-sm">
							<CardContent className="space-y-2 p-4">
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
										{item.type === 'post' ? 'Balasan' : 'Pertanyaan'}
									</span>
									{item.status !== 'tampil' && <ForumStatusBadge status={item.status} />}
									<span className="text-[11px] font-semibold text-destructive">
										{item.reports.length} laporan
									</span>
								</div>
								<Link href={route('forum.show', item.thread_id)} className="block">
									<p className="text-xs text-muted-foreground hover:underline">{item.thread_title}</p>
								</Link>
								<p className="whitespace-pre-line text-sm text-foreground">{item.excerpt}</p>
								<ul className="space-y-1 rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground">
									{item.reports.map((report, index) => (
										<li key={index}>
											<span className="font-semibold text-foreground">{report.reason}</span>
											{report.note ? ` - ${report.note}` : ''}
										</li>
									))}
								</ul>
								<div className="flex flex-wrap gap-2 pt-1">
									{item.status === 'tampil' && (
										<Button
											size="sm"
											variant="red"
											onClick={() =>
												setHideTarget(
													route(
														item.type === 'post'
															? 'admin.forum.posts.hide'
															: 'admin.forum.threads.hide',
														item.id,
													),
												)
											}
										>
											<IconEyeOff /> Sembunyikan
										</Button>
									)}
									<Button
										size="sm"
										variant="outline"
										onClick={() => act(route('admin.forum.flags.dismiss', [item.type, item.id]))}
									>
										<IconX /> Abaikan Laporan
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
			</div>

			<Dialog open={Boolean(hideTarget)} onOpenChange={(open) => !open && closeHide()}>
				<DialogContent className="max-w-[calc(100vw-2rem)] rounded-xl sm:max-w-lg">
					<DialogHeader>
						<DialogTitle>Sembunyikan tulisan</DialogTitle>
						<DialogDescription>
							Penulis tetap bisa melihat tulisannya beserta alasan ini. Tindakan ini bisa dipulihkan.
						</DialogDescription>
					</DialogHeader>
					<Textarea
						rows={3}
						maxLength={300}
						value={form.data.reason}
						onChange={(e) => form.setData('reason', e.target.value)}
						placeholder="Alasan, misalnya: informasi keliru soal nomor darurat"
					/>
					{form.errors.reason && <InputError message={form.errors.reason} />}
					<DialogFooter className="gap-2">
						<Button variant="ghost" onClick={closeHide}>
							Batal
						</Button>
						<Button
							variant="red"
							disabled={form.processing || !form.data.reason.trim()}
							onClick={submitHide}
						>
							Sembunyikan
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Moderasi Forum" />;
