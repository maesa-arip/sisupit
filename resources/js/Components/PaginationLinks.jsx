import { Link } from '@inertiajs/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

/**
 * Paginasi standar Sisupit - SATU-SATUNYA pola, disalin dari halaman /hydrants (permintaan user
 * 2026-10-05: "gunakan /hydrant sebagai contoh, ganti semua yang lain dengan itu"). Tombol kecil di
 * tengah, halaman aktif merah brand.
 *
 * Ponsel: hanya panah kiri, halaman aktif +-1, panah kanan. Dulu SEMUA nomor (hingga ~13 tombol) dalam
 * satu baris tak-terlipat; di dalam wadah flex barisnya mendorong lebar halaman sehingga seluruh
 * halaman bisa digeser kanan-kiri di HP (keluhan user 2026-10-05). Mulai `sm` semua nomor tampil;
 * `flex-wrap` + `max-w-full` tetap menjaga agar tak pernah melebihi layar.
 *
 * `links` = array tautan paginator Laravel: `paginator.links` untuk paginate() biasa, atau
 * `collection.meta.links` untuk Resource collection. Elemen pertama/terakhir = Sebelumnya/Berikutnya,
 * dirender sebagai panah saja (labelnya hanya untuk aria-label). Label nomor bisa berisi entitas HTML
 * ("...") - karena itu dangerouslySetInnerHTML, persis seperti /hydrants. Tidak dirender bila hanya
 * ada satu halaman.
 */
export default function PaginationLinks({ links }) {
	if (!links || links.length <= 3) return null;

	const last = links.length - 1;
	const activeIndex = links.findIndex((link, index) => link.active && index > 0 && index < last);

	// Tombol nomor yang jauh dari halaman aktif (dan "...") disembunyikan di ponsel.
	const mobileHidden = (index) =>
		index !== 0 && index !== last && (activeIndex < 0 || Math.abs(index - activeIndex) > 1);

	return (
		<div className="flex w-full min-w-0 max-w-full justify-center pb-4 pt-4">
			<div className="flex max-w-full flex-wrap justify-center gap-1">
				{links.map((link, index) => {
					const className = `items-center rounded-lg py-1.5 text-xs font-semibold transition-colors ${
						link.active
							? 'bg-primary text-primary-foreground'
							: 'border border-border bg-card text-foreground/80 hover:bg-muted'
					} ${!link.url && 'pointer-events-none cursor-not-allowed opacity-50'} ${
						mobileHidden(index) ? 'hidden sm:inline-flex' : 'inline-flex'
					}`;

					// Sebelumnya/Berikutnya cukup ikon (permintaan user 2026-10-05: lebih ringkas).
					if (index === 0 || index === last) {
						const Icon = index === 0 ? IconChevronLeft : IconChevronRight;
						return (
							<Link
								key={index}
								href={link.url}
								preserveScroll
								aria-label={index === 0 ? 'Halaman sebelumnya' : 'Halaman berikutnya'}
								className={`${className} px-2`}
							>
								<Icon className="h-4 w-4" stroke={2} />
							</Link>
						);
					}

					return (
						<Link
							key={index}
							href={link.url}
							preserveScroll
							className={`${className} px-3`}
							dangerouslySetInnerHTML={{ __html: link.label }}
						/>
					);
				})}
			</div>
		</div>
	);
}
