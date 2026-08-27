import HeaderTitle from '@/Components/HeaderTitle';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { Link } from '@inertiajs/react';
import { IconFileDescription } from '@tabler/icons-react';

/**
 * Kerangka bersama halaman informasi publik (TASK_19): Syarat & Ketentuan, Kebijakan
 * Privasi, Pusat Bantuan, Tentang, Paket & Lisensi. Menyatukan kepala halaman, lebar,
 * dan navigasi antar-dokumen supaya kelimanya terasa satu keluarga — bukan lima halaman lepas.
 *
 * RUPA (permintaan user 2026-08-26): mengikuti halaman FASILITAS (`Pages/Hydrants/Index.jsx`,
 * `Pages/Pumps/Index.jsx`, `Pages/FireStations/Index.jsx`) — skala huruf, jarak, dan bentuk
 * kartunya sama persis. Sebelumnya halaman-halaman ini punya bahasa visualnya sendiri: hero
 * gradient `PublicPageHeader` (judul `text-3xl font-black`) plus pembungkus `max-w-4xl px-4
 * py-6 sm:py-10` DI DALAM container AppLayout yang sudah ber-padding — jadi jaraknya
 * bertumpuk dan tak ada halaman lain di aplikasi ini yang setebal itu. Sekarang:
 *   - kepala halaman  : `HeaderTitle` (ikon sebaris + `text-lg lg:text-2xl font-bold`)
 *   - pembungkus      : `flex w-full flex-col space-y-6 pb-32`, tanpa max-width & padding
 *                       sendiri (AppLayout sudah memberi `max-w-7xl` + `p-4 lg:p-8`)
 *   - kartu           : `rounded-xl border-border bg-card shadow-sm` + `CardContent p-5`
 * Jangan kembalikan hero/max-width lokal tanpa menanyakan user.
 */
export function InfoShell({ icon, eyebrow, title, subtitle, children, footerNote }) {
	return (
		<div className="relative flex w-full flex-col space-y-6 pb-32">
			<div className="flex flex-col items-start justify-between gap-y-4 sm:flex-row sm:items-center">
				<HeaderTitle title={title} subtitle={subtitle} icon={icon} />

				{/* Slot kanan kepala halaman — bentuk & posisi sama dengan halaman fasilitas.
				    Di sini dipakai versi/kategori dokumen (dulu "eyebrow" di atas judul hero). */}
				{eyebrow && (
					<span className="rounded-md border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground/80 sm:shrink-0">
						{eyebrow}
					</span>
				)}
			</div>

			<div className="flex w-full flex-col gap-5">{children}</div>

			{footerNote && <p className="text-xs leading-relaxed text-muted-foreground">{footerNote}</p>}

			<InfoNav />
		</div>
	);
}

/** Satu bagian dokumen: judul bernomor + isi. */
export function Section({ number, title, children }) {
	return (
		<Card className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
			<CardContent className="p-5">
				<h2 className="flex items-start gap-2.5 text-sm font-bold text-foreground">
					{number && (
						<span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-[10px] font-bold text-destructive">
							{number}
						</span>
					)}
					<span>{title}</span>
				</h2>
				<div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
			</CardContent>
		</Card>
	);
}

/** Daftar berpoin dengan gaya seragam (dipakai lintas dokumen). */
export function Bullets({ items }) {
	return (
		<ul className="ml-1 space-y-2">
			{items.map((item, index) => (
				<li key={index} className="flex gap-2.5">
					<span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-destructive/70" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}

/**
 * Kotak penegasan; `tone` destructive dipakai khusus untuk hal yang menyangkut keselamatan.
 * Berdiri sejajar dengan `Section` (kartu), jadi bentuknya ikut kartu fasilitas.
 */
export function Callout({ tone = 'muted', title, children }) {
	const toneClass =
		tone === 'destructive'
			? 'border-destructive/40 bg-destructive/5'
			: tone === 'info'
				? 'border-info/40 bg-info/5'
				: 'border-border bg-accent/40';

	return (
		<div className={`rounded-xl border p-5 shadow-sm ${toneClass}`}>
			{title && <p className="text-sm font-bold text-foreground">{title}</p>}
			<div className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{children}</div>
		</div>
	);
}

/**
 * Baris "istilah → isi" untuk data instansi/aplikasi. Penekanannya mengikuti kartu fasilitas:
 * ISI yang menonjol (foreground), LABEL sebagai keterangan kecil (muted) — bukan sebaliknya.
 */
export function DefinitionRow({ label, value }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:gap-4">
			<span className="w-full text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:w-56 sm:shrink-0 sm:pt-0.5">
				{label}
			</span>
			<span className="text-sm font-medium text-foreground">{value || '—'}</span>
		</div>
	);
}

/** Navigasi antar dokumen informasi — muncul di kaki setiap halaman. */
function InfoNav() {
	const links = [
		{ href: route('info.help'), label: 'Pusat Bantuan' },
		{ href: route('info.terms'), label: 'Syarat & Ketentuan' },
		{ href: route('info.privacy'), label: 'Kebijakan Privasi' },
		{ href: route('info.about'), label: 'Tentang Aplikasi' },
		{ href: route('info.pricing'), label: 'Paket & Lisensi' },
	];

	return (
		<div className="flex flex-col gap-3">
			{/* Kepala kolom bergaya halaman fasilitas ("Sebaran Titik Hydrant"): ikon + text-sm semibold. */}
			<div className="flex items-center gap-2 px-1">
				<IconFileDescription className="h-4 w-4 text-muted-foreground" />
				<h2 className="text-sm font-semibold text-foreground">Dokumen lain</h2>
			</div>

			{/* Bentuk chip sama dengan chip filter status di halaman fasilitas. */}
			<div className="flex flex-wrap gap-2">
				{links.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className="whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted"
					>
						{link.label}
					</Link>
				))}
			</div>
		</div>
	);
}

/**
 * Layout kelima halaman info/legal — AppLayout untuk SEMUA pengunjung, termasuk tamu
 * (permintaan user 2026-08-25). Dulu tamu diberi PublicLayout (chrome navbar+footer milik
 * landing page) sehingga bilah bawah hilang di tengah jalan; sejak TASK_35 justru footer
 * AppLayout-lah satu-satunya jalan tamu ke halaman-halaman ini, jadi kehilangan bilahnya
 * tepat setelah sampai terasa seperti buntu. Landing page yang melahirkan chrome itu tidak
 * jadi dipakai. Pola sama dengan halaman fasilitas publik (`Pages/Hydrants/Index.jsx`).
 */
export function infoLayout(title) {
	return (page) => <AppLayout children={page} title={title} />;
}
