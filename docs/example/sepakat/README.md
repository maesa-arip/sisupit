# Bentuk bilah navigasi bawah yang SUDAH DISEPAKATI

Berkas di folder ini **arsip**, bukan kode hidup. Tidak diimpor siapa pun, tidak ikut
`npm run build` (Vite hanya menelusuri `resources/js/`). Berekstensi `.txt` supaya tak ada
tooling yang menyangkanya modul.

Gunanya satu: saat sebuah bentuk sudah disetujui user lalu bentuk berikutnya dicoba,
bentuk lama harus bisa dipulihkan **persis** - bukan dikira-kira lagi dari ingatan.

## Cara memulihkan sebuah varian

```
cp "docs/example/sepakat/<N>-MobileBottomNav.jsx.txt" resources/js/Layouts/Partials/MobileBottomNav.jsx
npm run build
```

Lalu periksa TIGA angka yang terikat pada tinggi bilah, sebab keduanya hidup di berkas
LAIN dan tidak ikut terpulihkan:

| Angka | Tinggal di | Varian 1 | Varian 2 |
|---|---|---|---|
| Ruang konten | `resources/js/Layouts/AppLayout.jsx` | `pb-[calc(6rem+env(safe-area-inset-bottom))]` | `pb-[calc(5rem+env(safe-area-inset-bottom))]` |
| Tombol Kirim melayang | `resources/js/Pages/Front/Reports/Create.jsx` | `bottom-[calc(5rem+env(safe-area-inset-bottom))]` | `bottom-[calc(4rem+env(safe-area-inset-bottom))]` |
| Jarak popover ke bilah | di dalam `MobileBottomNav.jsx` (`FloatingPanel`) | `bottom-[88px]` | `bottom-[72px]` |

---

## SEPAKAT 1 - bilah penuh menempel tepi bawah (2026-09-01)

Disetujui user 2026-09-01 setelah empat putaran; referensinya `menu 1..4.png`.

- Bilah **selebar layar**, menempel `bottom-0`, `border-t`, `bg-card`, tinggi **80px**
  (`h-20`) + `env(safe-area-inset-bottom)`.
- **Lima slot** sama rata (`grid-cols-5`): Beranda, Fasilitas, **Lapor**, Riwayat,
  Menu/Masuk.
- Penanda aktif = **kotak solid `bg-destructive` `rounded-xl` selebar slot yang
  membungkus ikon DAN label** (`w-full py-2`, tinggi ~54px). Bidang terisi hanya milik
  slot aktif; slot lain glyph telanjang.
- Glyph **18px**, label **12px** `text-xs`, kelimanya glyph monokrom - **tanpa ikon
  brand**. Slot Lapor memakai `IconFlame` dari item `report.create` milik `navItems.js`.
- Keadaan popover terbuka = `bg-accent` netral (BUKAN merah), supaya "aktif" dan
  "terbuka" tak tertukar.

Alasan tiap angkanya ada di FINDINGS #106 dan di komentar berkas arsipnya sendiri.

---

## SEPAKAT 2 - minimalis, tanpa bidang penanda aktif (2026-09-01)

Disetujui user 2026-09-01, referensinya `Menu 6.png`. **Inilah bentuk yang berlaku sekarang.**
Dibangun DARI sepakat 1 lalu dilucuti - bukan dari bentuk kapsul yang sempat dicoba di
antaranya (lihat catatan di bawah).

- Bilah **selebar layar**, menempel `bottom-0`, `bg-card`, tinggi **64px** (`h-16`) +
  `env(safe-area-inset-bottom)`.
- Pemisah dari konten = **box-shadow dua lapis**, bukan `border-t` (penyempurnaan atas
  permintaan user, hari yang sama): lapis 1 garis rambut `0 -1px 0 0 hsl(var(--border))` yang
  terbaca di mode terang MAUPUN gelap, lapis 2 angkatan lembut yang hanya kasatmata di mode
  terang. Dipakai sebagai shadow supaya tak menambah 1px ke tinggi kotaknya - `h-16` terikat
  pada angka di dua berkas lain.
- **Lima slot** sama rata (`grid-cols-5`): Beranda, Fasilitas, **Lapor**, Riwayat,
  Menu/Masuk. Semua sederajat - tak ada tombol melayang, tak ada slot yang ditonjolkan.
- Penanda aktif = **WARNA + TEBAL HURUF SAJA** (`text-destructive` + `font-semibold`).
  Tidak ada kotak, pil, kapsul, garis, titik, maupun bidang apa pun.
- Glyph **16px** (`h-4 w-4`), label **12px** `text-xs`, jarak ikon-label **8px** (`gap-2`).
- Keadaan popover terbuka = `bg-accent` netral. Ini satu-satunya bidang yang tersisa di
  bilah, dan justru itu gunanya: karena "aktif" tak punya bidang, keduanya mustahil
  tertukar.
- Ikon padat vs garis (pembeda aktif di referensi) SENGAJA tidak ditiru - @tabler tak punya
  varian padat untuk `IconMenu2` & `IconHistory`, jadi sebagian slot akan memadat dan
  sebagian tidak.

**Harga bentuk ini:** slot "Lapor" kehilangan seluruh penonjolan tetapnya dan kini sama rata
dengan empat tujuan lain. Di aplikasi darurat itu bukan harga yang sepele - disadari &
diterima saat menyepakatinya.

---

## Bentuk yang DICOBA lalu ditinggalkan (tidak diarsipkan di sini)

**Kapsul melayang + tombol bulat "Lapor"** (referensi `menu 5.png`), 2026-09-01: kapsul
`rounded-full` mengambang di atas dasar layar, mula-mula dengan tombol bulat merah di samping
kanan, lalu dipindah bertengger di tengah. Dinilai user **"kurang sesuai"**. Ada di riwayat
git bila sewaktu-waktu dibutuhkan; sengaja tidak disimpan sebagai berkas arsip supaya folder
ini hanya berisi bentuk yang benar-benar disepakati.

