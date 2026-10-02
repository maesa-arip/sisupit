import { IconBolt, IconBug, IconFlame, IconTree } from '@tabler/icons-react';

/**
 * Ikon + warna jenis kejadian sebuah laporan, dibaca dari kata kunci JUDULNYA. SUMBER
 * TUNGGAL - dulu hanya hidup di Admin/Dashboard.jsx, sehingga halaman Arsip & Riwayat
 * memasang api untuk setiap baris dan satu insiden terlihat beda jenis di dua layar
 * (keluhan user 2026-10-02).
 *
 * Judul, bukan `incident_type`: jenis non-kebakaran (`lainnya`) judulnya diketik warga
 * ("Pohon tumbang", "Sarang tawon"), jadi justru judul yang membedakannya.
 *
 * @returns {{ Icon: import('react').ComponentType, className: string }}
 */
export function reportIcon(report) {
	const t = (report?.title || '').toLowerCase();

	if (t.includes('pohon')) {
		// Teal - selaras warna teks "Hydrant" di kartu Peta Pemantauan.
		return { Icon: IconTree, className: 'text-teal bg-teal/10' };
	}
	if (t.includes('hewan') || t.includes('ular') || t.includes('tawon')) {
		return { Icon: IconBug, className: 'text-warning bg-warning/10' };
	}
	if (t.includes('listrik') || t.includes('korsleting')) {
		return { Icon: IconBolt, className: 'text-info bg-info/10' };
	}

	return { Icon: IconFlame, className: 'text-destructive bg-destructive/10' };
}
