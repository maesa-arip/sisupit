import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { IconChevronRight } from '@tabler/icons-react';

/**
 * Primitif tampilan bersama untuk KEEMPAT dashboard (warga/relawan, admin/pejabat,
 * petugas, OPD).
 *
 * Kenapa ada: keluhan user 2026-09-09 "versi mobile masih seperti versi desktop hanya di
 * layar kecil". Akarnya bukan satu halaman melainkan satu KEBIASAAN yang terulang di
 * keempatnya, jadi bentuknya dikerjakan di satu tempat supaya keempat layar tidak menyimpang
 * sendiri-sendiri - bentuk yang sama sudah pernah menagih harganya di navigasi (#71/#53).
 *
 * DUA ATURAN YANG LAHIR DARI KOREKSI USER 2026-09-09, dan keduanya MEMBALIK bentuk yang
 * sempat dipasang hari itu juga. Jangan hidupkan lagi tanpa menanyakan user:
 *
 *   1. TIDAK ADA YANG MENEMPEL TEPI LAYAR. Permintaan user: "jangan ada tampilan yang full
 *      kanan kiri harus tetap ada margin atau padding". Daftar sempat dibuat menempel tepi
 *      lewat margin negatif seukuran padding halaman (`-mx-4`); itu DICABUT. Konsekuensinya
 *      konstanta `BLEED` ikut hilang - kalau kelak ada yang butuh, itu keputusan user lagi,
 *      bukan detail teknis. Dijaga `DashboardMobileShellTest`.
 *
 *   2. TIDAK ADA PITA YANG MENEMPEL SAAT DIGULIR. Sempat ada sapaan yang menyusut jadi baris
 *      ringkas `fixed` di bawah header PLUS judul seksi yang ikut lengket. Keduanya DICABUT:
 *      header `AppLayout` sendiri sudah `sticky`, jadi yang terjadi adalah pita-pita bertumpuk
 *      yang memakan layar dan membuat gulir terasa berlapis ("scrollnya menumpuk"). Satu pita
 *      lengket di satu layar sudah cukup, dan pita itu milik AppLayout.
 */

/**
 * Sapaan kepala halaman. Di ponsel TANPA bingkai kartu - kepala halaman yang berbingkai
 * adalah hal pertama yang membuat layar terbaca sebagai halaman web. `framed` menghidupkan
 * bingkainya lagi mulai `md` (dipakai dashboard admin, yang di desktop memang memakai kartu
 * kepala berisi tanggal & tombol aksi).
 */
export function AppGreeting({ title, meta, trailing, framed = false, className }) {
	return (
		<div
			className={cn(
				'flex flex-col items-start justify-between gap-3 md:flex-row md:items-center md:gap-4',
				framed && 'md:rounded-2xl md:border md:border-border md:bg-card md:p-5 md:shadow-sm lg:p-6',
				className,
			)}
		>
			<div className="min-w-0">
				<h1 className="truncate text-xl font-bold tracking-tight text-foreground md:text-2xl lg:text-3xl">
					{title}
				</h1>
				{meta && <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 md:mt-2">{meta}</div>}
			</div>
			{trailing}
		</div>
	);
}

/**
 * Satu seksi dashboard: label + isi. Label seksi di ponsel adalah teks mikro berhuruf besar
 * (idiom yang sudah dipakai repo ini untuk subjudul kartu statistik), bukan judul setebal
 * `text-lg` yang di layar sempit bersaing dengan judul halaman; mulai `md` ia kembali jadi
 * judul biasa berikut ikonnya. Ia TIDAK menempel saat digulir (lihat aturan 2 di atas).
 */
export function AppSection({ title, icon: Icon, action, count, children, className }) {
	return (
		<section className={cn('space-y-2.5 md:space-y-4', className)}>
			<div className="flex items-center justify-between gap-3 px-0.5">
				<h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground md:text-lg md:normal-case md:tracking-tight md:text-foreground">
					{Icon && <Icon className="hidden h-5 w-5 text-muted-foreground md:block" />}
					{title}
					{count != null && (
						<span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-bold text-foreground/80">
							{count}
						</span>
					)}
				</h2>
				{action && (
					<Link
						href={action.href}
						className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-destructive md:text-xs"
					>
						{action.label ?? 'Lihat semua'}
						<IconChevronRight className="h-3.5 w-3.5" />
					</Link>
				)}
			</div>
			{children}
		</section>
	);
}

/**
 * Wadah daftar: kartu berbingkai dengan sudut membulat di SEMUA ukuran layar, barisnya
 * dipisah garis rambut. Ia sengaja TIDAK menempel tepi layar (aturan 1 di atas).
 */
export function AppList({ className, children }) {
	return (
		<div
			className={cn(
				'divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-sm',
				className,
			)}
		>
			{children}
		</div>
	);
}

/**
 * Keadaan kosong sebuah seksi. Bentuknya sengaja seragam di keempat dashboard: keadaan
 * kosong yang berbeda-beda rupa terbaca seperti layar yang rusak, bukan seperti "memang
 * belum ada isinya" (pelajaran TASK_45/#94).
 */
export function AppEmpty({ icon: Icon, title, description }) {
	return (
		<div className="flex flex-col items-center justify-center px-6 py-10 text-center">
			{Icon && (
				<div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
					<Icon className="h-6 w-6" stroke={1.5} />
				</div>
			)}
			<h3 className="text-sm font-bold text-foreground">{title}</h3>
			{description && (
				<p className="mt-1 max-w-[280px] text-xs font-medium text-muted-foreground">{description}</p>
			)}
		</div>
	);
}

/**
 * Satu baris daftar yang bisa diketuk. `min-h-[64px]` supaya sasaran sentuhnya nyaman di
 * ponsel, dan `active:` memberi umpan balik ketukan - di WebView APK tak ada kursor yang
 * bisa hover, jadi tanpa keadaan aktif sebuah ketukan terasa tidak tercatat.
 *
 * `trailing` diletakkan di kolom kanan berdampingan dengan tanda panah, bukan di baris
 * sendiri berbatas garis seperti bentuk lama - garis pemisah di DALAM satu baris membuat
 * satu insiden terbaca sebagai dua entri.
 */
export function AppListRow({ href, leading, title, meta, trailing, className }) {
	const body = (
		<>
			{leading}
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-destructive">
					{title}
				</div>
				{meta && (
					<div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-muted-foreground">
						{meta}
					</div>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-2">
				{trailing}
				<IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
			</div>
		</>
	);

	const classes = cn(
		'group flex min-h-[64px] w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted active:bg-muted md:px-5 md:py-4',
		className,
	);

	if (!href) return <div className={classes}>{body}</div>;

	return (
		<Link href={href} className={classes}>
			{body}
		</Link>
	);
}
