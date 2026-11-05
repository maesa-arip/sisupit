import StarRating, { ratingLabel } from '@/Components/AppReview/StarRating';
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
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Textarea } from '@/Components/ui/textarea';
import { cn, flashMessage } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import { IconLoader2 } from '@tabler/icons-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const COMMENT_MAX = 500; // = AppReview::COMMENT_MAX

/**
 * Form ulasan aplikasi (TASK_86) - dipakai kartu ajakan di dashboard dan Profil > Ulasan Aplikasi.
 * `review` = prop server AppReview::formProps(): { mine, tags }. `initialRating` mengisi bintang
 * yang sudah diketuk di kartu ajakan. Rupanya sengaja kartu Sisupit biasa, bukan tiruan dialog
 * rating sistem iOS/Android (Apple melarang tiruan dialog App Store).
 */
export default function AppReviewDialog({ open, onOpenChange, review, initialRating = 0 }) {
	const mine = review?.mine;
	const tagOptions = review?.tags ?? [];
	const form = useForm({
		rating: mine?.rating ?? initialRating,
		tags: mine?.tags ?? [],
		comment: mine?.comment ?? '',
		allow_public: mine?.allow_public ?? false,
	});

	// Bintang dari kartu ajakan bisa berubah di antara dua pembukaan dialog.
	useEffect(() => {
		if (open && !mine && initialRating) form.setData('rating', initialRating);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, initialRating]);

	const toggleTag = (tag) =>
		form.setData(
			'tags',
			form.data.tags.includes(tag) ? form.data.tags.filter((t) => t !== tag) : [...form.data.tags, tag],
		);

	const submit = (e) => {
		e.preventDefault();
		form.post(route('app-review.store'), {
			preserveScroll: true,
			onSuccess: (success) => {
				const flash = flashMessage(success);
				if (flash?.message) toast[flash.type](flash.message);
				onOpenChange(false);
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<form onSubmit={submit} className="space-y-5">
					<DialogHeader>
						<DialogTitle>{mine ? 'Ubah Ulasan Anda' : 'Ulas Sisupit'}</DialogTitle>
						<DialogDescription>
							Seberapa membantu Sisupit bagi Anda? Ulasan dibaca tim kami untuk memperbaiki aplikasi.
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col items-center gap-1">
						<StarRating value={form.data.rating} onChange={(v) => form.setData('rating', v)} size="lg" />
						<span className="h-5 text-sm font-medium text-muted-foreground">
							{ratingLabel(form.data.rating)}
						</span>
						<InputError message={form.errors.rating} />
					</div>

					{tagOptions.length > 0 && (
						<div className="space-y-2">
							<Label>
								Yang paling terasa <span className="font-normal text-muted-foreground">(opsional)</span>
							</Label>
							<div className="flex flex-wrap gap-2">
								{tagOptions.map((tag) => {
									const selected = form.data.tags.includes(tag.value);
									return (
										<button
											key={tag.value}
											type="button"
											aria-pressed={selected}
											onClick={() => toggleTag(tag.value)}
											className={cn(
												'flex h-9 items-center rounded-full border px-3 text-[13px] font-medium transition-colors active:scale-[0.97] motion-reduce:active:scale-100',
												selected
													? 'border-primary/30 bg-primary/10 text-primary'
													: 'border-border/70 bg-card text-foreground/80 hover:bg-muted',
											)}
										>
											{tag.label}
										</button>
									);
								})}
							</div>
							<InputError message={form.errors.tags} />
						</div>
					)}

					<div className="grid gap-1.5">
						<Label htmlFor="app-review-comment">
							Ceritakan pengalaman Anda{' '}
							<span className="font-normal text-muted-foreground">(opsional)</span>
						</Label>
						<Textarea
							id="app-review-comment"
							value={form.data.comment}
							rows={4}
							maxLength={COMMENT_MAX}
							placeholder="Mis. Laporan saya cepat ditanggapi dan saya bisa memantau petugas di peta."
							onChange={(e) => form.setData('comment', e.target.value)}
						/>
						<div className="flex items-start justify-between gap-3">
							{form.errors.comment ? <InputError message={form.errors.comment} /> : <span />}
							<span className="shrink-0 text-xs tabular-nums text-muted-foreground">
								{form.data.comment.length}/{COMMENT_MAX}
							</span>
						</div>
					</div>

					<div className="flex items-start justify-between gap-4">
						<div className="grid gap-1">
							<Label htmlFor="app-review-public">Boleh ditampilkan sebagai testimoni</Label>
							<p className="text-xs leading-snug text-muted-foreground">
								Komentar Anda bisa tampil di halaman depan bersama nama depan dan peran Anda, setelah
								ditinjau admin.
							</p>
						</div>
						<Switch
							id="app-review-public"
							checked={!!form.data.allow_public}
							onCheckedChange={(checked) => form.setData('allow_public', checked)}
						/>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						<Button
							type="button"
							variant="ghost"
							className="rounded-xl"
							onClick={() => onOpenChange(false)}
						>
							Batal
						</Button>
						<Button type="submit" className="rounded-xl" disabled={form.processing || !form.data.rating}>
							{form.processing && <IconLoader2 className="h-4 w-4 animate-spin" />}
							{mine ? 'Simpan Ulasan' : 'Kirim Ulasan'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
