/**
 * Label jenis kejadian untuk layar admin OPD (TASK_27). Nilainya sendiri (`rumah`, `toko`, ...)
 * berasal dari server lewat prop `incident_types` (Report::INCIDENT_TYPES) — yang ditaruh di
 * sini HANYA teks tampilannya, disamakan dengan tombol pilihan cepat di form Lapor Darurat
 * (Front/Reports/Create.jsx) supaya admin membaca istilah yang sama dengan warga.
 */
export const INCIDENT_LABELS = {
	rumah: 'Rumah',
	toko: 'Toko',
	kendaraan: 'Kendaraan',
	lahan: 'Lahan',
	lainnya: 'Bukan Kebakaran',
};
