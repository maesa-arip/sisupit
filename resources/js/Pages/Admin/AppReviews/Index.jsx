import StarRating from '@/Components/AppReview/StarRating';
import { AppEmpty } from '@/Components/AppSection';
import HeaderTitle from '@/Components/HeaderTitle';
import PaginationLinks from '@/Components/PaginationLinks';
import { FilterPill } from '@/Components/ReportFilterFields';
import { Button } from '@/Components/ui/button';
import AppLayout from '@/Layouts/AppLayout';
import { cn, flashMessage, roleLabel, timeAgo } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { IconEye, IconEyeOff, IconFileSpreadsheet, IconMessageStar } from '@tabler/icons-react';
import { toast } from 'sonner';

const RANGE_LABELS = { 30: '30 hari', 90: '90 hari', 365: '1 tahun', semua: 'Semua waktu' };

/**
 * Ulasan aplikasi (TASK_86). Isi disaring server per kabupaten admin (Tenantable AppReview);
 * ringkasan tak menghitung akun demo. Tab "Menunggu" = ulasan yang pemiliknya izinkan jadi
 * testimoni tapi belum ditinjau - yang disetujui tampil di Spotlight & Landing.
 */
export default function Index({ reviews, filters, summary, counts, options }) {
	const visit = (changes) =>
		router.get(
			route('admin.app-reviews.index'),
			{ ...filters, ...changes, page: undefined },
			{ preserveScroll: true, preserveState: true },
		);

	const togglePublish = (review) =>
		router.post(
			route('admin.app-reviews.publish', review.id),
			{},
			{
				preserveScroll: true,
				onSuccess: (success) => {
					const flash = flashMessage(success);
					if (flash?.message) toast[flash.type](flash.message);
				},
			},
		);

	const { tab, ...exportFilters } = filters;
	const tabs = [
		{ key: 'semua', label: 'Semua' },
		{ key: 'menunggu', label: 'Menunggu Tinjauan', count: counts.menunggu },
		{ key: 'testimoni', label: 'Testimoni Tampil', count: counts.testimoni },
	];
	const maxBar = Math.max(1, ...summary.distribution.map((row) => row.total));
	const platformLabel = (value) => options.platforms.find((p) => p.value === value)?.label ?? value;

	return (
		<div className="flex w-full flex-col space-y-6 pb-32">
			<Head title="Ulasan Aplikasi" />

			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle
					title="Ulasan Aplikasi"
					subtitle="Penilaian pengguna terhadap Sisupit dari semua platform: browser, Android, iOS, dan desktop."
					icon={IconMessageStar}
				/>
				<Button variant="outline" className="h-10 rounded-xl" asChild>
					<a href={route('admin.app-reviews.export', exportFilters)}>
						<IconFileSpreadsheet /> Ekspor Excel
					</a>
				</Button>
			</div>

			{/* --- RINGKASAN --- */}
			<div className="grid gap-4 md:grid-cols-3">
				<div className="flex flex-col justify-center rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Rata-rata</p>
					<div className="mt-1 flex items-baseline gap-2">
						<span className="text-4xl font-bold tabular-nums text-foreground">
							{summary.average !== null ? summary.average.toLocaleString('id-ID') : '-'}
						</span>
						<span className="text-sm text-muted-foreground">dari 5</span>
					</div>
					<StarRating value={Math.round(summary.average ?? 0)} className="mt-1" />
					<p className="mt-2 text-[13px] text-muted-foreground">
						{summary.total.toLocaleString('id-ID')} ulasan
					</p>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						Sebaran bintang
					</p>
					<div className="mt-3 space-y-1.5">
						{summary.distribution.map((row) => (
							<div key={row.rating} className="flex items-center gap-2 text-[13px]">
								<span className="w-3 shrink-0 tabular-nums text-muted-foreground">{row.rating}</span>
								<div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
									<div
										className="h-full rounded-full bg-warning"
										style={{ width: `${(row.total / maxBar) * 100}%` }}
									/>
								</div>
								<span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">
									{row.total}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
						Per platform
					</p>
					{summary.by_platform.length === 0 ? (
						<p className="mt-3 text-[13px] text-muted-foreground">Belum ada data.</p>
					) : (
						<div className="mt-3 divide-y divide-border/70">
							{summary.by_platform.map((row) => (
								<div
									key={row.platform}
									className="flex items-center justify-between gap-3 py-1.5 text-[13px]"
								>
									<span className="text-foreground">{platformLabel(row.platform)}</span>
									<span className="tabular-nums text-muted-foreground">
										{row.average.toLocaleString('id-ID')} · {row.total} ulasan
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* --- TAB & SARINGAN --- */}
			<div className="space-y-3">
				<div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
					{tabs.map((item) => (
						<button
							key={item.key}
							type="button"
							onClick={() => visit({ tab: item.key })}
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

				<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
					<FilterPill active={filters.rating === ''} onClick={() => visit({ rating: '' })}>
						Semua bintang
					</FilterPill>
					{[5, 4, 3, 2, 1].map((star) => (
						<FilterPill
							key={star}
							active={filters.rating === String(star)}
							onClick={() => visit({ rating: String(star) })}
						>
							{star} bintang
						</FilterPill>
					))}
				</div>
				<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
					<FilterPill active={filters.platform === ''} onClick={() => visit({ platform: '' })}>
						Semua platform
					</FilterPill>
					{options.platforms.map((p) => (
						<FilterPill
							key={p.value}
							active={filters.platform === p.value}
							onClick={() => visit({ platform: p.value })}
						>
							{p.label}
						</FilterPill>
					))}
				</div>
				<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
					<FilterPill active={filters.role === ''} onClick={() => visit({ role: '' })}>
						Semua peran
					</FilterPill>
					{options.roles.map((role) => (
						<FilterPill key={role} active={filters.role === role} onClick={() => visit({ role })}>
							{roleLabel(role)}
						</FilterPill>
					))}
				</div>
				<div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
					{options.ranges.map((range) => (
						<FilterPill key={range} active={filters.range === range} onClick={() => visit({ range })}>
							{RANGE_LABELS[range] ?? range}
						</FilterPill>
					))}
				</div>
			</div>

			{/* --- DAFTAR --- */}
			{reviews.data.length === 0 ? (
				<div className="rounded-2xl border border-border/70 bg-card shadow-sm">
					<AppEmpty
						icon={IconMessageStar}
						title={
							tab === 'menunggu'
								? 'Tidak ada ulasan yang menunggu tinjauan testimoni.'
								: tab === 'testimoni'
									? 'Belum ada testimoni yang tampil.'
									: 'Belum ada ulasan untuk saringan ini.'
						}
					/>
				</div>
			) : (
				<div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
					{reviews.data.map((review) => (
						<div key={review.id} className="space-y-1.5 px-4 py-3.5">
							<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
								<StarRating value={review.rating} size="sm" />
								<span className="text-[13px] font-semibold text-foreground">{review.user_name}</span>
								<span className="text-[13px] text-muted-foreground">
									{roleLabel(review.role)} · {platformLabel(review.platform)} ·{' '}
									{timeAgo(review.updated_at)}
								</span>
								{review.is_demo && (
									<span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
										Demo
									</span>
								)}
								{review.approved_at ? (
									<span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
										Testimoni tampil
									</span>
								) : (
									review.can_publish && (
										<span className="rounded-full border border-warning/20 bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
											Boleh jadi testimoni
										</span>
									)
								)}
							</div>
							{review.tags.length > 0 && (
								<div className="flex flex-wrap gap-1.5">
									{review.tags.map((tag) => (
										<span
											key={tag}
											className="rounded-full bg-muted px-2 py-0.5 text-[12px] font-medium text-muted-foreground"
										>
											{tag}
										</span>
									))}
								</div>
							)}
							{review.comment && (
								<p className="whitespace-pre-line break-words text-[14px] leading-snug text-foreground">
									{review.comment}
								</p>
							)}
							{review.approved_at && review.approver && (
								<p className="text-[12px] text-muted-foreground">
									Tampil sebagai "{review.public_name}" - disetujui {review.approver}
								</p>
							)}
							{(review.approved_at || review.can_publish) && (
								<div className="pt-1">
									<Button
										variant={review.approved_at ? 'ghost' : 'green'}
										className="h-9 rounded-xl"
										onClick={() => togglePublish(review)}
									>
										{review.approved_at ? (
											<>
												<IconEyeOff /> Turunkan testimoni
											</>
										) : (
											<>
												<IconEye /> Tampilkan sebagai testimoni
											</>
										)}
									</Button>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			<PaginationLinks links={reviews.links} />
		</div>
	);
}

Index.layout = (page) => <AppLayout children={page} title="Ulasan Aplikasi" />;
