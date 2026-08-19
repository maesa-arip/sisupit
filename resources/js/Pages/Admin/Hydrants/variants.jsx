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
		blurb: 'Hydrant milik instansi/PDAM. Tampil di halaman publik Lokasi Hydrant.',
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
		blurb: 'Hydrant swadaya banjar/desa. Dibaca di menu SKKL dan ikut dihitung sebagai debit air desa — bukan di halaman Lokasi Hydrant.',
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

/**
 * Dua pill pemilih jenis hydrant. Bentuk final setelah dua kali revisi (user, 2026-08-19):
 *
 *   v1 kecil & yang non-aktif TRANSPARAN → gagal: yang non-aktif terbaca sebagai teks biasa,
 *      jadi pengguna tak sadar ada tombol kedua sama sekali.
 *   v2 tab selebar konten dua baris → gagal ke arah sebaliknya: terlalu besar.
 *   v3 (ini) dua pill ringkas yang KEDUANYA TERISI warna — hijau = sedang dibuka, abu = bisa
 *      diklik. Kuncinya bukan ukuran, melainkan kontras: pill abu yang terisi langsung terbaca
 *      sebagai tombol, sedangkan latar transparan tidak.
 *
 * `counts` ditempel inline dalam kurung, bukan sebagai baris kedua — menambah informasi
 * "ini dua kumpulan data" tanpa menambah tinggi.
 */
export function HydrantTabs({ active, counts = {}, target = 'index' }) {
	return (
		<div>
			<div className="flex flex-wrap items-center gap-2">
				{Object.entries(HYDRANT_VARIANTS).map(([key, config]) => {
					const isActive = active === key;
					const count = counts?.[key];

					return (
						<Link
							key={key}
							href={route(config.routes[target])}
							aria-current={isActive ? 'page' : undefined}
							className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
								isActive
									? 'bg-teal-600 text-white shadow-sm hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90'
									: 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
							}`}
						>
							{config.tab}
							{count !== undefined && ` (${count})`}
						</Link>
					);
				})}
			</div>
			{/* Satu baris penjelas untuk sisi yang sedang dibuka — menjawab "bedanya apa" tanpa
			    membuat pengguna menebak dari nama tombolnya saja. */}
			<p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">{hydrantVariant(active).blurb}</p>
		</div>
	);
}

/**
 * Penanda jenis untuk halaman Edit. SENGAJA bukan tab: di sana pengguna sedang menyunting satu
 * baris tertentu, jadi "pindah jenis" tak punya arti dan satu klik tak sengaja akan membuang
 * perubahan yang belum disimpan. Yang dibutuhkan hanya kepastian sedang menyunting yang mana.
 */
export function HydrantVariantBadge({ variant }) {
	const config = hydrantVariant(variant);

	return (
		<span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 dark:border-teal/30 dark:bg-teal/10 dark:text-teal">
			{config.tab}
		</span>
	);
}
