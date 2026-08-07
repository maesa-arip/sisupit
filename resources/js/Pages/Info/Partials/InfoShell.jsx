import PublicPageHeader from '@/Components/PublicPageHeader';
import { Card, CardContent } from '@/Components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { Link } from '@inertiajs/react';

/**
 * Kerangka bersama halaman informasi publik (TASK_19): Syarat & Ketentuan, Kebijakan
 * Privasi, Pusat Bantuan, Tentang, Paket & Lisensi. Menyatukan hero, lebar baca, dan
 * navigasi antar-dokumen supaya kelimanya terasa satu keluarga — bukan lima halaman lepas.
 */
export function InfoShell({ icon, eyebrow, title, subtitle, children, footerNote }) {
	return (
		<div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
			<PublicPageHeader icon={icon} eyebrow={eyebrow} title={title} subtitle={subtitle} />

			<div className="mt-6 space-y-4">{children}</div>

			{footerNote && <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{footerNote}</p>}

			<InfoNav />
		</div>
	);
}

/** Satu bagian dokumen: judul bernomor + isi. */
export function Section({ number, title, children }) {
	return (
		<Card>
			<CardContent className="p-5 sm:p-6">
				<h2 className="flex items-start gap-2.5 text-base font-bold text-foreground sm:text-lg">
					{number && (
						<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-xs font-black text-destructive">
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

/** Kotak penegasan; `tone` destructive dipakai khusus untuk hal yang menyangkut keselamatan. */
export function Callout({ tone = 'muted', title, children }) {
	const toneClass =
		tone === 'destructive'
			? 'border-destructive/40 bg-destructive/5'
			: tone === 'info'
				? 'border-info/40 bg-info/5'
				: 'border-border bg-accent/40';

	return (
		<div className={`rounded-lg border p-4 ${toneClass}`}>
			{title && <p className="text-sm font-bold text-foreground">{title}</p>}
			<div className="mt-1 text-sm leading-relaxed text-muted-foreground">{children}</div>
		</div>
	);
}

/** Baris "istilah → isi" untuk data instansi/aplikasi. */
export function DefinitionRow({ label, value }) {
	return (
		<div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-0 sm:flex-row sm:gap-4">
			<span className="w-full text-xs font-bold uppercase tracking-wide text-foreground sm:w-56 sm:shrink-0">
				{label}
			</span>
			<span className="text-sm text-muted-foreground">{value || '—'}</span>
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
		<div className="mt-8 border-t border-border pt-5">
			<p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Dokumen lain</p>
			<div className="mt-3 flex flex-wrap gap-2">
				{links.map((link) => (
					<Link
						key={link.href}
						href={link.href}
						className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
					>
						{link.label}
					</Link>
				))}
			</div>
		</div>
	);
}

/**
 * Layout adaptif yang dipakai kelima halaman: tamu → chrome publik (navbar+footer landing),
 * sudah login → AppLayout bersidebar. Pola sama dengan halaman fasilitas publik
 * (`Pages/Hydrants/Index.jsx`).
 */
export function infoLayout(title) {
	return (page) =>
		page.props?.auth?.user ? (
			<AppLayout children={page} title={title} />
		) : (
			<PublicLayout children={page} title={title} />
		);
}
