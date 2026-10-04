import { IconAlertTriangle, IconFlame } from '@tabler/icons-react';

/**
 * Ikon + warna jenis kejadian sebuah laporan. SUMBER TUNGGAL - dulu hanya hidup di
 * Admin/Dashboard.jsx, sehingga halaman Arsip & Riwayat memasang api untuk setiap baris dan
 * satu insiden terlihat beda jenis di dua layar (keluhan user 2026-10-02).
 *
 * HANYA dua ikon, dari `incident_type` yang dipilih pelapor (tab Kebakaran / Non-Kebakaran):
 * kebakaran -> api, non-kebakaran (`lainnya`) -> tanda peringatan. Dulu ikon ditebak dari
 * kata di JUDUL yang diketik bebas - "tokek" jadi api, "ular" jadi serangga, dan daftar kata kuncinya
 * tak akan pernah lengkap; user 2026-10-05 memilih disederhanakan jadi dua ini saja.
 * Tanpa `incident_type` (laporan lama sebelum form dipecah) -> api, seperti sebelumnya.
 *
 * @returns {{ Icon: import('react').ComponentType, className: string }}
 */
export function reportIcon(report) {
	if (report?.incident_type === 'lainnya') {
		return { Icon: IconAlertTriangle, className: 'text-warning bg-warning/10' };
	}

	return { Icon: IconFlame, className: 'text-destructive bg-destructive/10' };
}
