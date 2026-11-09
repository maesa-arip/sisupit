import AppReviewDialog from '@/Components/AppReview/AppReviewDialog';
import StarRating from '@/Components/AppReview/StarRating';
import { router } from '@inertiajs/react';
import { IconMessageStar, IconX } from '@tabler/icons-react';
import { useState } from 'react';

/**
 * Ajakan ulasan aplikasi di dashboard (TASK_86). Tampil hanya bila server mengirim prop
 * `appReviewPrompt` (AppReview::shouldAsk - bukan akun demo, belum mengulas, tidak sedang di
 * misi, akun cukup lama, tidak baru ditunda) dan hanya di route dashboard. Kartu biasa di alur
 * halaman seperti Banner pengumuman (#184): JANGAN dijadikan pop-up yang menghadang, fixed, atau
 * sticky - ini aplikasi darurat, dan ulasan tak boleh berdiri di antara pengguna dan tugasnya.
 */
export default function AppReviewPrompt({ review }) {
	const [hidden, setHidden] = useState(false);
	const [rating, setRating] = useState(0);
	const [open, setOpen] = useState(false);

	if (hidden) return null;

	const dismiss = (never) => {
		setHidden(true);
		router.post(route('app-review.dismiss'), { never }, { preserveScroll: true, preserveState: true });
	};

	const pick = (value) => {
		setRating(value);
		setOpen(true);
	};

	return (
		<div className="rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm">
			<div className="flex items-start gap-3">
				<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
					<IconMessageStar className="h-4 w-4" stroke={2} />
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold leading-snug text-foreground">
						Bagaimana pengalaman Anda memakai Sisupit?
					</p>
					<p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
						Ketuk bintang untuk memberi ulasan. Masukan Anda membantu kami memperbaiki aplikasi.
					</p>
					<StarRating value={rating} onChange={pick} className="-ml-2 mt-1" />
					<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
						<button
							type="button"
							onClick={() => dismiss(false)}
							className="py-1 text-[13px] font-medium text-muted-foreground transition-opacity hover:text-foreground active:opacity-70"
						>
							Nanti saja
						</button>
						<button
							type="button"
							onClick={() => dismiss(true)}
							className="py-1 text-[13px] font-medium text-muted-foreground transition-opacity hover:text-foreground active:opacity-70"
						>
							Jangan tanya lagi
						</button>
					</div>
				</div>
				<button
					type="button"
					onClick={() => dismiss(false)}
					aria-label="Tutup ajakan ulasan"
					className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
				>
					<IconX className="h-4 w-4" stroke={2} />
				</button>
			</div>

			<AppReviewDialog open={open} onOpenChange={setOpen} review={review} initialRating={rating} />
		</div>
	);
}
