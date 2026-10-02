import { AppEmpty } from '@/Components/AppSection';
import HeaderTitle from '@/Components/HeaderTitle';
import InputError from '@/Components/InputError';
import { Button } from '@/Components/ui/button';
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
				<Button variant="ghost" className="h-10 rounded-xl bg-muted/60" asChild>
					<Link href={route('forum.index')}>
						<IconExternalLink /> Buka Forum
					</Link>
				</Button>
			</div>

			<div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
				{tabs.map((item) => (
					<button
						key={item.key}
						type="button"
						onClick={() =>
							router.get(route('admin.forum.index'), { tab: item.key }, { preserveScroll: true })
						}
						className={cn(
							'h-9 flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition-colors',
							tab === item.key
								? 'bg-card text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground',
						)}
					>
						{item.label}
						{item.count > 0 ? ` (${item.count})` : ''}
					</button>
				))}
			</div>

			{/* Antrean moderasi = satu daftar bergrup (TASK_69 bagian 24) - dulu satu kartu per tulisan dengan
			    meta 11px & tombol bergaris. Aksi bertint di baris sendiri, logika & rute tidak berubah. */}
			{items.length === 0 ? (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<AppEmpty
						icon={IconShieldCheck}
						title={
							tab === 'menunggu'
								? 'Tidak ada pertanyaan yang menunggu tinjauan.'
								: tab === 'dilaporkan'
									? 'Tidak ada laporan konten yang terbuka.'
									: 'Belum ada pertanyaan yang disembunyikan.'
						}
					/>
				</div>
			) : (
				<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
					{tab !== 'dilaporkan' &&
						items.map((thread) => (
							<div key={thread.id} className="space-y-1.5 px-4 py-3.5">
								<div className="flex flex-wrap items-center gap-2">
									<ForumStatusBadge status={thread.status} />
									<span className="text-[13px] text-muted-foreground">
										{thread.author} · {timeAgo(thread.created_at)}
									</span>
								</div>
								<Link href={route('forum.show', thread.id)} className="block">
									<h3 className="break-words text-[15px] font-semibold leading-snug text-foreground hover:underline">
										{thread.title}
									</h3>
								</Link>
								<p className="whitespace-pre-line text-[13px] leading-snug text-muted-foreground">
									{thread.excerpt}
								</p>
								{thread.moderation_reason && (
									<p className="text-[13px] text-muted-foreground">
										Alasan: {thread.moderation_reason}
										{thread.moderator ? ` - oleh ${thread.moderator}` : ''}
									</p>
								)}
								<div className="flex flex-wrap gap-2 pt-1.5">
									{thread.status === 'menunggu' && (
										<Button
											variant="green"
											className="h-9 rounded-xl"
											onClick={() => act(route('admin.forum.threads.approve', thread.id))}
										>
											<IconCircleCheck /> Setujui
										</Button>
									)}
									{thread.status === 'disembunyikan' ? (
										<Button
											variant="ghost"
											className="h-9 rounded-xl bg-muted/60"
											onClick={() => act(route('admin.forum.threads.restore', thread.id))}
										>
											<IconEye /> Pulihkan
										</Button>
									) : (
										<Button
											variant="ghost"
											className="h-9 rounded-xl bg-muted/60"
											onClick={() => setHideTarget(route('admin.forum.threads.hide', thread.id))}
										>
											<IconEyeOff /> Tolak / Sembunyikan
										</Button>
									)}
								</div>
							</div>
						))}

					{tab === 'dilaporkan' &&
						items.map((item) => (
							<div key={item.key} className="space-y-1.5 px-4 py-3.5">
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
										{item.type === 'post' ? 'Balasan' : 'Pertanyaan'}
									</span>
									{item.status !== 'tampil' && <ForumStatusBadge status={item.status} />}
									<span className="rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
										{item.reports.length} laporan
									</span>
								</div>
								<Link href={route('forum.show', item.thread_id)} className="block">
									<p className="text-[13px] text-muted-foreground hover:underline">
										{item.thread_title}
									</p>
								</Link>
								<p className="whitespace-pre-line text-[15px] leading-snug text-foreground">
									{item.excerpt}
								</p>
								<ul className="space-y-1 rounded-xl bg-muted/50 p-3 text-[13px] text-muted-foreground">
									{item.reports.map((report, index) => (
										<li key={index}>
											<span className="font-semibold text-foreground">{report.reason}</span>
											{report.note ? ` - ${report.note}` : ''}
										</li>
									))}
								</ul>
								<div className="flex flex-wrap gap-2 pt-1.5">
									{item.status === 'tampil' && (
										<Button
											variant="red"
											className="h-9 rounded-xl"
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
										variant="ghost"
										className="h-9 rounded-xl bg-muted/60"
										onClick={() => act(route('admin.forum.flags.dismiss', [item.type, item.id]))}
									>
										<IconX /> Abaikan Laporan
									</Button>
								</div>
							</div>
						))}
				</div>
			)}

			<Dialog open={Boolean(hideTarget)} onOpenChange={(open) => !open && closeHide()}>
				<DialogContent>
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
