import { Link } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

/**
 * Paginasi standar Sisupit - SATU-SATUNYA pola (permintaan user 2026-10-05: tampilan /hydrants untuk
 * semua halaman). Tombol kecil di tengah, halaman aktif merah brand, panah untuk sebelumnya/berikutnya.
 *
 * Nomor yang tampil mengikuti pola baku: halaman PERTAMA & TERAKHIR selalu ada, halaman aktif +-1, dan
 * "..." untuk celah - celah yang hanya satu halaman langsung ditulis nomornya. Contoh 20 halaman:
 *   hal. 1 -> < 1 2 ... 20 >    hal. 7 -> < 1 ... 6 7 8 ... 20 >    hal. 20 -> < 1 ... 19 20 >
 * Maks 9 tombol, sama di semua lebar layar. Sejarah: (1) semua nomor dalam satu baris -> halaman di HP
 * bisa digeser kanan-kiri; (2) lalu di HP hanya aktif +-1 -> di hal. 1 tampil "< 1 2 >" seolah hanya ada
 * 2 halaman (keluhan user 2026-10-05).
 *
 * `links` = array tautan paginator Laravel: `paginator.links` (paginate() biasa) atau `meta.links`
 * (Resource collection). Halaman aktif & terakhir dibaca dari label bernomor; URL nomor yang tidak
 * dikirim Laravel (jendela onEachSide) dibentuk dengan mengganti parameter `page` pada salah satu
 * tautannya - murni string, aman untuk SSR. Tidak dirender bila hanya ada satu halaman.
 */
export default function PaginationLinks({ links }) {
	if (!links || links.length <= 3) return null;

	const numbered = links.slice(1, -1).filter((link) => /^\d+$/.test(String(link.label).trim()));
	const current = Number(numbered.find((link) => link.active)?.label ?? 1);
	const lastPage = Math.max(...numbered.map((link) => Number(link.label)));
	const sample = numbered.find((link) => link.url)?.url;

	const pageUrl = (page) => {
		const known = numbered.find((link) => Number(link.label) === page)?.url;
		if (known) return known;
		if (!sample) return null;

		return /([?&])page=\d+/.test(sample)
			? sample.replace(/([?&])page=\d+/, `$1page=${page}`)
			: `${sample}${sample.includes('?') ? '&' : '?'}page=${page}`;
	};

	// Daftar nomor: pertama, terakhir, aktif +-1; celah satu halaman ditulis, celah lebih lebar jadi "...".
	const pages = [...new Set([1, current - 1, current, current + 1, lastPage])]
		.filter((page) => page >= 1 && page <= lastPage)
		.sort((a, b) => a - b);
	const items = [];
	pages.forEach((page, i) => {
		const prev = pages[i - 1];
		if (prev && page - prev === 2) items.push(prev + 1);
		else if (prev && page - prev > 2) items.push(`gap-${page}`);
		items.push(page);
	});

	const base = 'inline-flex items-center rounded-lg py-1.5 text-xs font-semibold transition-colors';
	const idle = 'border border-border bg-card text-foreground/80 hover:bg-muted';
	const disabled = 'pointer-events-none cursor-not-allowed opacity-50';

	const arrow = (link, Icon, label) => (
		<Link
			href={link?.url}
			preserveScroll
			aria-label={label}
			className={`${base} ${idle} px-2 ${!link?.url ? disabled : ''}`}
		>
			<Icon className="h-4 w-4" stroke={2} />
		</Link>
	);

	return (
		<div className="flex w-full min-w-0 max-w-full justify-center pb-4 pt-4">
			<nav aria-label="Navigasi halaman" className="flex max-w-full flex-wrap justify-center gap-1">
				{arrow(links[0], IconChevronLeft, 'Halaman sebelumnya')}
				{items.map((item) =>
					typeof item === 'string' ? (
						<span
							key={item}
							className="inline-flex items-center px-1.5 text-xs font-semibold text-muted-foreground"
						>
							...
						</span>
					) : (
						<Link
							key={item}
							href={pageUrl(item)}
							preserveScroll
							aria-current={item === current ? 'page' : undefined}
							className={`${base} px-3 ${item === current ? 'bg-primary text-primary-foreground' : idle}`}
						>
							{item}
						</Link>
					),
				)}
				{arrow(links[links.length - 1], IconChevronRight, 'Halaman berikutnya')}
			</nav>
		</div>
	);
}
