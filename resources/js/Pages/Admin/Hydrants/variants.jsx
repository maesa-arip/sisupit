import { Link } from '@inertiajs/react';

/**
 * Dua jenis hydrant, satu set halaman.
 *
 * Hydrant resmi (`hydrants`) dan hydrant swadaya warga (`hydrant_wargas`) punya TABEL dan
 * ROUTE sendiri-sendiri — pengecualian aturan yang disetujui user 2026-08-19, lihat
 * `prompt/docs/PENGECUALIAN_ATURAN.md` #1. Yang TIDAK ikut dipisah adalah tampilannya:
 * Index/Create/Edit memakai komponen yang sama dan hanya dibedakan prop `variant`, supaya
 * bagi pengguna keduanya terasa satu menu bertab, dan supaya perbaikan peta/auto-fill
 * wilayah cukup dikerjakan sekali.
 *
 * Nama route hidup HANYA di berkas ini. Kalau menambah jenis hydrant ketiga (semoga tidak),
 * cukup tambah satu entri di sini.
 */
export const HYDRANT_VARIANTS = {
	resmi: {
		tab: 'Hydrant Resmi',
		head: 'Manajemen Hydrant',
		title: 'Manajemen Jaringan Hydrant',
		subtitle: 'Kelola hydrant milik instansi/PDAM di wilayah Anda.',
		addLabel: 'Tambah Hydrant',
		createHead: 'Registrasi Hydrant Baru',
		createTitle: 'Registrasi Hydrant Baru',
		createSubtitle: 'Pendataan spasial dan teknis fasilitas hydrant.',
		editHead: 'Edit Hydrant',
		editTitle: 'Perbarui Data Hydrant',
		editSubtitle: 'Koreksi data teknis & titik koordinat hydrant.',
		// Debit air opsional: hydrant resmi milik PDAM/instansi, angkanya dipegang mereka.
		debitRequired: false,
		routes: {
			index: 'admin.hydrants.index',
			create: 'admin.hydrants.create',
			store: 'admin.hydrants.store',
			edit: 'admin.hydrants.edit',
			update: 'admin.hydrants.update',
			destroy: 'admin.hydrants.destroy',
		},
	},
	warga: {
		tab: 'Hydrant Warga',
		head: 'Manajemen Hydrant Warga',
		title: 'Manajemen Hydrant Warga',
		subtitle: 'Hydrant swadaya banjar/desa — ikut dihitung sebagai debit air SKKL.',
		addLabel: 'Tambah Hydrant Warga',
		createHead: 'Registrasi Hydrant Warga',
		createTitle: 'Registrasi Hydrant Warga',
		createSubtitle: 'Pendataan hydrant swadaya masyarakat — muncul di menu SKKL.',
		editHead: 'Edit Hydrant Warga',
		editTitle: 'Perbarui Data Hydrant Warga',
		editSubtitle: 'Koreksi data teknis & titik koordinat hydrant warga.',
		// Debit air WAJIB: rekap "berapa total debit air di desa ini" berdiri di atas
		// kelengkapan data ini, dan satu baris kosong sudah cukup membuat totalnya menyesatkan.
		debitRequired: true,
		routes: {
			index: 'admin.hydrant-warga.index',
			create: 'admin.hydrant-warga.create',
			store: 'admin.hydrant-warga.store',
			edit: 'admin.hydrant-warga.edit',
			update: 'admin.hydrant-warga.update',
			destroy: 'admin.hydrant-warga.destroy',
		},
	},
};

export const hydrantVariant = (variant) => HYDRANT_VARIANTS[variant] ?? HYDRANT_VARIANTS.resmi;

/** Tab pemisah dua jenis hydrant: pindah halaman & route, tapi dibaca sebagai satu menu. */
export function HydrantTabs({ active }) {
	return (
		<div className="inline-flex rounded-lg border border-input bg-background p-1">
			{Object.entries(HYDRANT_VARIANTS).map(([key, config]) => (
				<Link
					key={key}
					href={route(config.routes.index)}
					className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
						active === key
							? 'bg-teal-600 text-white dark:bg-teal'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					}`}
				>
					{config.tab}
				</Link>
			))}
		</div>
	);
}
