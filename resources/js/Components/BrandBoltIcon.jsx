/**
 * Petir SISUPIT sebagai GLYPH, bukan gambar.
 *
 * Bentuknya ditelusuri dari `public/logo.png` (petir putih di dalam plat merah) lalu
 * dilepas dari platnya: poligon 7 titik, cocok 99,1% IoU terhadap petir aslinya.
 * Sumber vektornya `public/bolt.svg`; berkas PNG `public/bolt-white.png` &
 * `public/bolt-red.png` ada untuk pemakaian di luar React (mis. aset unduhan) - JANGAN
 * dipakai di navigasi, alasannya di bawah.
 *
 * KENAPA KOMPONEN, BUKAN <img src="/icon.png"> - ini akar FINDINGS #106. Slot "Lapor"
 * bilah bawah pernah memakai berkas itu (2026-08-19 s/d 2026-09-01) dan berkas itu sendiri
 * sebuah KOTAK MERAH UTUH, jadi satu slot selalu tampak aktif di semua halaman sementara
 * empat tetangganya glyph telanjang. Pelajarannya tercatat di temuan itu: **aturan warna
 * hanya berlaku sejauh warna itu ditulis di KODE** - begitu sebuah aset membawa warnanya
 * sendiri, ia lolos dari setiap pemeriksaan yang membaca kelas. Komponen ini mengembalikan
 * warna ke kode: `stroke="currentColor"` dan `fill="none"`, jadi ia mustahil memerah
 * sendiri dan ikut `text-destructive`/`text-muted-foreground` persis seperti ikon @tabler
 * di sebelahnya.
 *
 * GARIS saat diam, PADAT saat aktif (`filled`, permintaan user 2026-09-06). Bawaannya
 * GARIS: bidang terisi di antara empat glyph garis punya bobot visual lebih berat tanpa
 * alasan - itu yang ditolak di #106 putaran kedua. Yang membuat versi padat SAH di sini
 * adalah syaratnya: ia hanya muncul saat slotnya aktif, dan "bidang terisi HANYA milik slot
 * aktif" justru aturan yang lahir dari putaran kedua itu sendiri. JANGAN membalik nilai
 * bawaannya jadi padat - begitu ia terisi di halaman mana pun, #106 kembali.
 *
 * `filled` SENGAJA menambahkan fill TANPA mencabut stroke-nya. Siluet luarnya karena itu
 * identik di kedua keadaan (tepi luar = path + setengah stroke, sama-sama), jadi ikonnya
 * tidak melompat besar-kecil tiap pindah halaman - yang berubah hanya bagian dalamnya.
 * Mencabut stroke saat padat akan mengecilkannya sekitar satu piksel di ukuran bilah.
 *
 * KONTRAK PROPSNYA SENGAJA MENIRU @tabler/icons-react (`size`, `stroke`, `className`,
 * sisanya diteruskan) supaya ia bisa dipakai di tempat yang mengharapkan ikon @tabler tanpa
 * pemanggilnya perlu tahu bedanya - `MobileBottomNav` memanggil `<Icon className="h-4 w-4"
 * stroke={1.75} />` untuk KELIMA slotnya lewat satu komponen `SlotContent`.
 *
 * JANGAN tertukar dengan `IconBolt` @tabler: di repo ini petir @tabler sudah dipakai untuk
 * jenis kejadian LISTRIK/korsleting (`Pages/Admin/Dashboard.jsx`, `Pages/Admin/Agencies/
 * Index.jsx`). Yang ini identitas aplikasi, bukan jenis kejadian - karena itu namanya
 * berbeda, supaya keduanya tak pernah tersambar autocomplete yang sama.
 */
export default function BrandBoltIcon({ size = 24, stroke = 2, filled = false, className, ...props }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={filled ? 'currentColor' : 'none'}
			stroke="currentColor"
			strokeWidth={stroke}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden="true"
			{...props}
		>
			<path d="M11.79 2.00 L15.21 2.00 L13.07 9.92 L16.41 9.97 L9.00 22.00 L10.59 11.19 L7.59 11.08 Z" />
		</svg>
	);
}

/**
 * Kembaran PADAT, dipakai saat slotnya aktif. Ia ada sebagai KOMPONEN TERSENDIRI - bukan
 * `<BrandBoltIcon filled/>` di tempat pemanggilan - supaya petir ini dipanggil dengan cara yang
 * SAMA PERSIS dengan pasangan padat @tabler (`IconClock`/`IconClockFilled` dst.) yang dipakai
 * empat slot lain. Bilah karena itu cukup punya satu mekanisme (`icon` + `iconActive`); tanpa ini
 * slot "Lapor" akan jadi satu-satunya yang butuh jalur khusus, dan jalur khusus untuk satu slot
 * persis yang membuat #106 hidup lama.
 */
export function BrandBoltIconFilled(props) {
	return <BrandBoltIcon {...props} filled />;
}
