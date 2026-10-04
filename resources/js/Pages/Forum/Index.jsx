import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import { Button } from '@/Components/ui/button';
import { CardContent } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { cn, timeAgo } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
	IconCircleCheck,
	IconMessageCircle,
	IconMessages,
	IconPin,
	IconPlus,
	IconSearch,
	IconShieldCheck,
} from '@tabler/icons-react';
import { EmergencyNotice, ForumStatusBadge } from './Partials/ForumParts';

const TABS = [
	{ key: 'semua', label: 'Semua' },
	{ key: 'belum_dijawab', label: 'Belum Dijawab' },
	{ key: 'saya', label: 'Pertanyaan Saya' },
];

/**
 * Forum Tanya Jawab Warga per kabupaten (TASK_54). Isinya disaring server (Tenantable +
 * status); halaman ini tidak menyaring apa pun sendiri.
 */
export default function Index({ threads, filters, wilayah, canModerate, pendingCount }) {
	const { data, setData, get } = useForm({ search: filters?.search || '' });

	const applyTab = (tab) =>
		router.get(route('forum.index'), { tab, search: data.search }, { preserveState: true, preserveScroll: true });

	const handleSearch = (e) => {
		e.preventDefault();
		get(route('forum.index', { tab: filters.tab }), { preserveState: true, preserveScroll: true });
	};

	return (
		<div className="flex w-full flex-col space-y-6 pb-32">
			<Head title="Forum Warga" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Forum Warga"
					subtitle={`Tanya jawab kesiapsiagaan kebakaran${wilayah ? ` - ${wilayah}` : ''}`}
					icon={IconMessages}
				/>
				<div className="flex gap-2">
					{canModerate && (
						<Button variant="ghost" className="h-10 rounded-xl bg-muted/60" asChild>
							<Link href={route('admin.forum.index')}>
								<IconShieldCheck /> Moderasi{pendingCount > 0 ? ` (${pendingCount})` : ''}
							</Link>
						</Button>
					)}
					<Button className="h-10 rounded-xl px-5 text-[15px]" asChild>
						<Link href={route('forum.create')}>
							<IconPlus /> Tanya
						</Link>
					</Button>
				</div>
			</div>

			<EmergencyNotice />

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				<form onSubmit={handleSearch} className="relative w-full max-w-md">
					<IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Cari judul pertanyaan..."
						className="h-10 pl-9"
						value={data.search}
						onChange={(e) => setData('search', e.target.value)}
					/>
				</form>
				<div className="no-scrollbar flex gap-2 overflow-x-auto">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => applyTab(tab.key)}
							className={cn(
								'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
								filters.tab === tab.key
									? 'border-primary/30 bg-primary/10 text-primary'
									: 'border-input bg-transparent text-muted-foreground hover:bg-accent',
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex flex-col gap-3">
				{threads.data.length > 0 ? (
					<>
						<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
							{threads.data.map((thread) => (
								<Link key={thread.id} href={route('forum.show', thread.id)} className="block">
									<div className="transition-colors hover:bg-muted/40 active:bg-muted">
										<CardContent className="flex flex-col gap-1.5 p-4">
											<div className="flex flex-wrap items-center gap-2">
												{thread.is_pinned && (
													<span className="flex shrink-0 items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-semibold text-info">
														<IconPin className="size-3" /> Disematkan
													</span>
												)}
												{thread.status !== 'tampil' && (
													<ForumStatusBadge status={thread.status} />
												)}
												{thread.has_official_answer && (
													<span className="flex shrink-0 items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
														<IconShieldCheck className="size-3" /> Dijawab Damkar
													</span>
												)}
												{thread.has_accepted_answer && (
													<span className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
														<IconCircleCheck className="size-3" /> Terjawab
													</span>
												)}
											</div>
											<h3 className="line-clamp-2 text-sm font-semibold text-foreground">
												{thread.title}
											</h3>
											<p className="line-clamp-2 text-xs text-muted-foreground">
												{thread.excerpt}
											</p>
											<div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
												<span className="truncate">
													{thread.is_mine ? 'Anda' : thread.author} ·{' '}
													{timeAgo(thread.last_activity_at ?? thread.created_at)}
												</span>
												<span className="ml-auto flex shrink-0 items-center gap-1">
													<IconMessageCircle className="size-3.5" /> {thread.replies_count}
												</span>
											</div>
										</CardContent>
									</div>
								</Link>
							))}
						</div>

						<PaginationLinks links={threads.links} />
					</>
				) : (
					<div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-sm">
						<p className="text-sm font-medium text-foreground">
							{filters.search
								? 'Tidak ada pertanyaan yang cocok dengan pencarian.'
								: filters.tab === 'saya'
									? 'Anda belum pernah bertanya.'
									: filters.tab === 'belum_dijawab'
										? 'Semua pertanyaan sudah dibalas.'
										: 'Belum ada pertanyaan di forum ini.'}
						</p>
						<p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
							Tanyakan soal pencegahan kebakaran, alat pemadam di rumah, atau fasilitas air di lingkungan
							Anda.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Forum Warga" />;
