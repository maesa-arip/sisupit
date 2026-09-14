import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { Button } from '@/Components/ui/button';
import { forumStatusMeta } from '@/lib/forum';
import { cn, NOMOR_DARURAT_NASIONAL } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconAlertTriangle, IconFlame, IconPhone } from '@tabler/icons-react';
import { Fragment } from 'react';

/**
 * Penjaga jalur darurat di forum (TASK_54). Bukan hiasan: risiko terbesar forum di aplikasi
 * pemadam adalah warga menulis "rumah tetangga terbakar" di sini, tempat yang tidak memicu
 * verifikasi, siaran, maupun sirine apa pun.
 */
export function EmergencyNotice({ className }) {
	// Nomor nasional, BUKAN `tenant.telepon_darurat`: prop tenant di-resolve dari SUBDOMAIN yang
	// sedang dibuka, sedangkan forum milik kabupaten AKUN - warga Badung di apex akan disodori
	// nomor Denpasar (pelajaran halaman Thanks, TASK_17). 113 benar di mana pun.
	const nomor = NOMOR_DARURAT_NASIONAL;

	return (
		<div
			className={cn(
				'flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between',
				className,
			)}
		>
			<div className="flex items-start gap-3">
				<IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
				<div>
					<p className="text-sm font-semibold text-foreground">Sedang ada kejadian? Jangan tulis di forum.</p>
					<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
						Forum tidak dipantau petugas secara langsung. Kejadian darurat hanya tertangani lewat laporan
						atau telepon.
					</p>
				</div>
			</div>
			<div className="flex shrink-0 gap-2">
				<Button variant="red" size="sm" asChild>
					<Link href={route('front.reports.create')}>
						<IconFlame /> Lapor Darurat
					</Link>
				</Button>
				<Button variant="outline" size="sm" asChild>
					<a href={`tel:${nomor}`}>
						<IconPhone /> {nomor}
					</a>
				</Button>
			</div>
		</div>
	);
}

/** Dialog yang MENANYAKAN ulang (bukan memblokir) saat tulisan memuat kata darurat. */
export function EmergencyConfirmDialog({ open, onOpenChange, onContinue }) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Apakah ini kejadian yang sedang berlangsung?</AlertDialogTitle>
					<AlertDialogDescription>
						Tulisan Anda menyebut kata yang biasa dipakai saat terjadi kebakaran atau keadaan darurat. Forum
						tidak memberi tahu petugas. Kalau kejadiannya sedang terjadi, laporkan sekarang.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="gap-2">
					<AlertDialogCancel onClick={onContinue}>Bukan, kirim ke forum</AlertDialogCancel>
					<Button variant="red" asChild>
						<Link href={route('front.reports.create')}>
							<IconFlame /> Ya, Lapor Darurat
						</Link>
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

export function ForumStatusBadge({ status }) {
	const meta = forumStatusMeta(status);

	return (
		<span className={cn('shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase', meta.tone)}>
			{meta.label}
		</span>
	);
}

const LINK_PATTERN = /(https?:\/\/[^\s]+)/g;

/**
 * Teks polos milik pengguna. TIDAK ada dangerouslySetInnerHTML: tautan dipecah jadi elemen
 * <a> sungguhan dan sisanya dirender React (ter-escape). Baris baru dipertahankan.
 */
export function ForumText({ text, className }) {
	const parts = String(text ?? '').split(LINK_PATTERN);

	return (
		<p className={cn('whitespace-pre-line break-words text-sm leading-relaxed text-foreground', className)}>
			{parts.map((part, index) =>
				index % 2 === 1 ? (
					<a
						key={index}
						href={part}
						target="_blank"
						rel="nofollow noopener noreferrer"
						className="text-info underline underline-offset-2"
					>
						{part}
					</a>
				) : (
					<Fragment key={index}>{part}</Fragment>
				),
			)}
		</p>
	);
}
