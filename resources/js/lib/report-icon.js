import { IconAlertTriangle, IconBolt, IconBug, IconFlame, IconPaw, IconTree } from '@tabler/icons-react';

// Cermin Report::FIRE_INCIDENT_TYPES (app/Models/Report.php).
const FIRE_TYPES = ['rumah', 'toko', 'kendaraan', 'lahan', 'kebakaran_lainnya'];

// Dicocokkan per KATA, bukan potongan huruf: dulu `includes('ular')` juga kena "regular"/"seluler".
const TREE = ['pohon', 'dahan', 'ranting'];
// @tabler tak punya ikon ular/tokek - jejak kaki = "hewan" secara umum (keluhan user 2026-10-05:
// judul "tokek" berikon api, judul "ular" berikon serangga).
const ANIMAL = [
	'hewan',
	'binatang',
	'ular',
	'kobra',
	'piton',
	'sanca',
	'tokek',
	'biawak',
	'kadal',
	'cicak',
	'buaya',
	'monyet',
	'kera',
	'anjing',
	'kucing',
	'musang',
	'tikus',
	'kelelawar',
	'burung',
	'ayam',
	'sapi',
	'babi',
	'kambing',
];
const INSECT = ['tawon', 'lebah', 'tabuhan', 'semut', 'serangga', 'kalajengking', 'lipan', 'kelabang'];
const ELECTRIC = ['listrik', 'korsleting', 'korslet', 'kabel', 'tiang'];

/**
 * Ikon + warna jenis kejadian sebuah laporan. SUMBER TUNGGAL - dulu hanya hidup di
 * Admin/Dashboard.jsx, sehingga halaman Arsip & Riwayat memasang api untuk setiap baris dan
 * satu insiden terlihat beda jenis di dua layar (keluhan user 2026-10-02).
 *
 * `incident_type` kebakaran -> selalu api (judul "kebakaran kandang ayam" tetap api). Selain itu
 * judul yang membedakan: jenis non-kebakaran (`lainnya`) judulnya diketik warga ("Pohon tumbang",
 * "Sarang tawon"). `lainnya` yang judulnya tak dikenali -> tanda peringatan, BUKAN api.
 * Tanpa `incident_type` (laporan lama / payload lama) -> api, seperti sebelumnya.
 *
 * @returns {{ Icon: import('react').ComponentType, className: string }}
 */
export function reportIcon(report) {
	const type = report?.incident_type ?? null;
	const fire = { Icon: IconFlame, className: 'text-destructive bg-destructive/10' };

	if (FIRE_TYPES.includes(type)) return fire;

	const words = new Set((report?.title || '').toLowerCase().split(/[^a-z]+/));
	const has = (list) => list.some((w) => words.has(w));

	if (has(TREE)) {
		// Teal - selaras warna teks "Hydrant" di kartu Peta Pemantauan.
		return { Icon: IconTree, className: 'text-teal bg-teal/10' };
	}
	if (has(ANIMAL)) {
		return { Icon: IconPaw, className: 'text-warning bg-warning/10' };
	}
	if (has(INSECT)) {
		return { Icon: IconBug, className: 'text-warning bg-warning/10' };
	}
	if (has(ELECTRIC)) {
		return { Icon: IconBolt, className: 'text-info bg-info/10' };
	}

	return type ? { Icon: IconAlertTriangle, className: 'text-warning bg-warning/10' } : fire;
}
