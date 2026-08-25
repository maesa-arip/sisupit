import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';

/**
 * Nama wilayah pemerintah, diambil dari nama instansi tenant yang sedang dibuka
 * ("Dinas Pemadam Kebakaran dan Penyelamatan Kota Denpasar" → "Kota Denpasar").
 *
 * Ada karena keterangan hydrant resmi menyebut PEMILIKNYA (permintaan user 2026-08-25) dan
 * berkas ini melayani SEMUA tenant: menulis "Kota Denpasar" apa adanya akan terbaca juga oleh
 * admin Badung. Nama wilayah tidak punya kolomnya sendiri di tabel `tenants` — yang ada hanya
 * `nama_instansi` (dan `city_code`, yang butuh query ke `indonesia_cities`), jadi diambil dari
 * ekornya. Nama instansi bisa disunting admin lewat /admin/tenants, karena itu kegagalan
 * pencocokan TIDAK boleh menghasilkan kalimat rusak: `subtitle` di bawah memakai
 * "daerah setempat" sebagai gantinya.
 */
export function tenantWilayah(namaInstansi) {
	const match = /(Kota|Kabupaten)\s+\S.*$/.exec(namaInstansi ?? '');

	return match ? match[0].trim() : 'daerah setempat';
}

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
 *
 * `subtitle` adalah FUNGSI, bukan string, karena keterangan hydrant resmi menyebut nama
 * wilayah pemiliknya sehingga isinya bergantung tenant yang sedang dibuka. Sengaja fungsi di
 * KEDUA varian meski warga tak memakai argumennya: bentuk yang seragam membuat pemanggilnya
 * tak perlu tahu varian mana yang dinamis — dan itu mencegah lahirnya `if (variant === ...)`
 * yang justru dihindari berkas ini.
 */
export const HYDRANT_VARIANTS = {
	resmi: {
		// "Hydrant" saja, bukan "Hydrant Resmi" (permintaan user 2026-08-20): kata "Resmi"
		// hanya punya arti sebagai lawan kata "Warga", dan itu sudah dibawa tombol di sebelahnya.
		tab: 'Hydrant',
		blurb: 'Tampil di halaman publik Lokasi Hydrant.',
		head: 'Manajemen Hydrant',
		title: 'Manajemen Jaringan Hydrant',
		subtitle: ({ wilayah }) =>
			`Hidran yang dimiliki oleh pemerintah ${wilayah} di bawah pengelolaan PDAM dan Damkar.`,
		addLabel: 'Tambah Hydrant',
		createHead: 'Registrasi Hydrant Baru',
		createTitle: 'Registrasi Hydrant Baru',
		createSubtitle: 'Pendataan spasial dan teknis fasilitas hydrant.',
		editHead: 'Edit Hydrant',
		editTitle: 'Perbarui Data Hydrant',
		editSubtitle: 'Koreksi data teknis & titik koordinat hydrant.',
		typeLabel: 'Konstruksi',
		typePlaceholder: 'Pilih Jenis',
		typeOptions: ['Stick', 'Jongkok'],
		typeDefault: 'Stick',
		statusOptions: ['Aktif', 'Perbaikan'],
		statusDefault: 'Aktif',
		// Tekanan air = sifat jaringan pipa bertekanan, jadi hanya relevan di sini.
		showWaterPressure: true,
		waterField: 'debit_lpm',
		waterLabel: 'Debit Air',
		waterUnit: '(liter/menit)',
		waterPlaceholder: 'Misal: 500',
		// Opsional: hydrant resmi milik PDAM/instansi, angkanya dipegang mereka.
		waterRequired: false,
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
		blurb: 'Dibaca di menu SKKL dan ikut dihitung sebagai simpanan air desa — bukan di halaman Lokasi Hydrant.',
		head: 'Manajemen Hydrant Warga',
		title: 'Manajemen Hydrant Warga',
		subtitle: () => 'Potensi sumber air yang terdata di suatu wilayah, bersumber dari perorangan/swasta.',
		addLabel: 'Tambah Hydrant Warga',
		createHead: 'Registrasi Hydrant Warga',
		createTitle: 'Registrasi Hydrant Warga',
		createSubtitle: 'Pendataan hydrant swadaya masyarakat — muncul di menu SKKL.',
		editHead: 'Edit Hydrant Warga',
		editTitle: 'Perbarui Data Hydrant Warga',
		editSubtitle: 'Koreksi data teknis & titik koordinat hydrant warga.',
		// Kosakata hydrant warga BEDA dari hydrant resmi sejak 2026-08-21 (permintaan user),
		// bukan cuma beda wajib/opsional — alasan tiap perubahan ada di migrasi
		// `2026_08_21_100000_reshape_hydrant_warga_water_fields.php`. Ringkasnya: yang didata
		// di sini bukan hydrant jalanan bertekanan, melainkan tandon/groundtank swadaya.
		typeLabel: 'Sumber Air',
		typePlaceholder: 'Pilih Sumber Air',
		typeOptions: ['Tandon', 'Groundtank'],
		// Tanpa nilai awal: bentuk tandon tidak bisa ditebak, dan default yang diam-diam
		// tersimpan menghasilkan data yang tak pernah dilihat petugas.
		typeDefault: '',
		statusOptions: ['Belum Modifikasi', 'Sudah Modifikasi'],
		statusDefault: 'Belum Modifikasi',
		// Tandon berisi air diam — tak ada tekanan yang bisa dinilai.
		showWaterPressure: false,
		waterField: 'capacity_liter',
		waterLabel: 'Kapasitas Volume',
		waterUnit: '(liter)',
		waterPlaceholder: 'Misal: 5000',
		// WAJIB: rekap "berapa simpanan air di desa ini" berdiri di atas kelengkapan data ini,
		// dan satu baris kosong sudah cukup membuat totalnya menyesatkan.
		waterRequired: true,
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
 * Dua tombol pemilih jenis hydrant. Bentuk final setelah tiga kali revisi:
 *
 *   v1 kecil & yang non-aktif TRANSPARAN → gagal: yang non-aktif terbaca sebagai teks biasa,
 *      jadi pengguna tak sadar ada tombol kedua sama sekali.
 *   v2 tab selebar konten dua baris → gagal ke arah sebaliknya: terlalu besar.
 *   v3 dua pill `rounded-full` yang keduanya terisi warna — kontrasnya benar, bentuknya yang
 *      tidak: pill bundar itu satu-satunya di halaman admin dan jadi terbaca sebagai chip
 *      filter, bukan perpindahan halaman.
 *   v4 (ini, permintaan user 2026-08-20) memakai <Button> yang sama persis dengan tombol
 *      "Hydrant Warga" & "Tambah Aset SKKL" di /admin/pumps — sudut `rounded-md`, tinggi `sm`.
 *      Halaman ini dan SKKL saling merujuk terus-menerus, jadi tombolnya wajib sebentuk.
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
						<Button
							key={key}
							size="sm"
							variant={isActive ? 'default' : 'secondary'}
							className={
								isActive
									? 'border-none bg-teal-600 text-white shadow-none hover:bg-teal-700 dark:bg-teal dark:hover:bg-teal/90'
									: undefined
							}
							asChild
						>
							<Link href={route(config.routes[target])} aria-current={isActive ? 'page' : undefined}>
								{config.tab}
								{count !== undefined && ` (${count})`}
							</Link>
						</Button>
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
