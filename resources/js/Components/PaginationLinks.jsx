import { Link } from '@inertiajs/react';

/**
 * Paginasi standar Sisupit - SATU-SATUNYA pola, disalin dari halaman /hydrants (permintaan user
 * 2026-10-05: "gunakan /hydrant sebagai contoh, ganti semua yang lain dengan itu"). Tombol kecil di
 * tengah, halaman aktif merah brand, baris bisa digeser di ponsel.
 *
 * `links` = array tautan paginator Laravel: `paginator.links` untuk paginate() biasa, atau
 * `collection.meta.links` untuk Resource collection. Label ("Sebelumnya"/"Berikutnya") datang dari
 * lang/id/pagination.php, bisa berisi entitas HTML (&laquo;) - karena itu dangerouslySetInnerHTML,
 * persis seperti /hydrants. Tidak dirender bila hanya ada satu halaman.
 */
export default function PaginationLinks({ links }) {
	if (!links || links.length <= 3) return null;

	return (
		<div className="scrollbar-hide flex justify-center overflow-x-auto pb-4 pt-4">
			<div className="flex gap-1">
				{links.map((link, index) => (
					<Link
						key={index}
						href={link.url}
						preserveScroll
						className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
							link.active
								? 'bg-primary text-primary-foreground'
								: 'border border-border bg-card text-foreground/80 hover:bg-muted'
						} ${!link.url && 'pointer-events-none cursor-not-allowed opacity-50'}`}
						dangerouslySetInnerHTML={{ __html: link.label }}
					/>
				))}
			</div>
		</div>
	);
}
