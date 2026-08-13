import NavLink from '@/Components/NavLink';
import { cn } from '@/lib/utils';
import { Fragment } from 'react';
import { buildNavSections } from './navItems';

/**
 * Navigasi vertikal untuk layar besar — dipakai dua kali:
 *   - AppLayout ≥lg : sidebar penuh berlabel
 *   - AppLayout md  : rail ikon (`compact`), label & judul seksi disembunyikan lewat CSS
 *
 * Daftar menunya TIDAK ditulis di sini melainkan di `navItems.js`. Sejak 2026-08-13
 * komponen ini satu-satunya pemakai navItems.js: <MobileBottomNav/> dikembalikan ke
 * daftar miliknya sendiri atas permintaan user — lihat catatan di navItems.js.
 */
export default function Sidebar({ url, auth, compact = false }) {
	const sections = buildNavSections({ auth, url });

	// Komponen Header Seksi Menu (Tipografi Taktis/Militeristik). Di mode rail judulnya
	// tak muat, jadi diganti garis pemisah tipis agar pengelompokan tetap terbaca.
	const NavHeading = ({ children }) => (
		<>
			{compact && <div className="mx-auto my-2 h-px w-8 shrink-0 bg-border lg:hidden" />}
			<div
				className={cn(
					'mb-1 mt-6 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground first:mt-2',
					compact && 'hidden lg:block',
				)}
			>
				{children}
			</div>
		</>
	);

	return (
		<nav
			className={cn(
				'no-scrollbar flex w-full flex-col items-start gap-0.5 overflow-y-auto px-3 pb-24 text-sm lg:px-4',
				// Mode rail (tablet): ikon saja di tengah, label disembunyikan lewat CSS —
				// bukan cabang render terpisah, supaya tak ada dua daftar menu lagi.
				compact &&
					'items-center px-2 lg:items-start lg:px-4 [&>a]:justify-center lg:[&>a]:justify-start [&>button]:justify-center lg:[&>button]:justify-start [&_span]:hidden lg:[&_span]:inline',
			)}
		>
			{sections.map((section) => (
				<Fragment key={section.key}>
					<NavHeading>{section.title}</NavHeading>
					{section.items.map((item) => (
						<NavLink
							key={item.key}
							url={item.url}
							active={item.active}
							title={item.title}
							icon={item.icon}
							// Warna merah hanya untuk state non-active; saat active biarkan NavLink
							// memakai text-destructive-foreground bawaannya (kalau text-destructive
							// ikut dikirim, ia menimpa warna teks active → teks tak terlihat).
							className={
								item.variant === 'danger' && !item.active
									? 'text-destructive hover:bg-destructive/10'
									: undefined
							}
							{...(item.linkProps ?? {})}
						/>
					))}
				</Fragment>
			))}
		</nav>
	);
}
