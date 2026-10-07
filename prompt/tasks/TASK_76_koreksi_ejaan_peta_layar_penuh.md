# TASK_76 — Pencarian lokasi toleran salah ketik + pemilih peta layar penuh di ponsel

| Field | Isi |
|-------|-----|
| ID | TASK_76 |
| Severity | P2 |
| Tipe | perbaikan UX + bug pencarian |
| Sumber | FINDINGS_LOG #192 / permintaan user 2026-10-07 |
| Status | DONE di branch feat/bottomnav-apple-design - belum dideploy, belum diuji di HP |

---

## 1. Tujuan

User: "di google maps saat saya cari wngiri muncul wanagiri, sedangkan disini tidak, user bisa saja typo,
cek cara google maps mengatasi itu ... serta bagaimana best practice untuk tampilan maps nya karena sekarang
terasa sangat kecil dan susah digunakan". Empat butir diajukan, jawaban user: "kerjakan semua, langsung butir 1-4".

1. Koreksi ejaan dari kamus nama wilayah sendiri + "Menampilkan hasil untuk X".
2. Desa kembar diurutkan: kabupaten tenant dulu.
3. Pemilih lokasi layar penuh di ponsel (lembar "Pakai lokasi ini"); pratinjau sedikit lebih besar; desktop tetap.
4. Test penjaga + uji visual 390px + dokumen.

## 2. Kondisi awal (direproduksi)

Nominatim publik & lokal: wngiri, wanagri, ubd, snur, seseten, tbanan = 0 hasil; wanagiri (4), ubud (2), sanur (4),
sesetan (1), tabanan (2). Peta form lapor 280 px di ponsel, ~200 px tersisa setelah kolom cari.

Riset: Google Places Autocomplete mencocokkan dengan koreksi ejaan & transliterasi, lalu mengurutkan dengan sinyal
lokasi/popularitas. Photon (geocoder OSM) punya mode longgar untuk typo, tapi menambah layanan Java/OpenSearch di
VPS - ditolak demi kamus lokal. Pola pemilih lokasi Google Maps/Gojek/Grab: layar penuh, cari di atas, pin diam di
tengah, lembar alamat + tombol konfirmasi di bawah.

## 3. Yang dikerjakan

- **Server** `app/Http/Controllers/Api/GeocodeController.php`
  - `correctSpelling()` / `closestDictionaryWord()` / `placeWordDictionary()` - hanya bila semua cadangan lama nihil.
    Rincian aturan & contoh salah koreksi yang memaksa aturannya: FINDINGS #192.
  - Header `X-Geocode-Corrected-Query` (konstanta `CORRECTED_HEADER`); bentuk JSON tak berubah.
  - `tenantCityFirst()` untuk setiap hasil pencarian.
- **Klien** `resources/js/Pages/Front/Reports/Create.jsx`
  - `correctedQuery` dari header -> baris "Menampilkan hasil untuk X" di atas daftar hasil.
  - `mapExpanded`: wadah peta yang sama jadi `fixed inset-0 z-[60]`; tombol "Layar penuh" (sm:hidden), fokus kolom cari
    di < 640px membuka; tombol kembali, Esc, dan "Pakai lokasi ini" menutup. `PullToRefreshLock`, kunci gulir body.
  - Pratinjau `h-[min(42dvh,380px)] min-h-[280px]` (sm+ 340px seperti sebelumnya).

## 4. Verifikasi

- `GeocodeControllerTest` +10, `ReportMapFullscreenPickerTest` 2; sabotase koreksi + urutan -> 6 merah, dipulihkan `cmp`.
- Playwright headless 390x844 (langkah & angka di FINDINGS #192). Skrip: `uji192.cjs` (folder job 6c244388/tmp,
  tempat playwright-core terpasang).
- Langkah manual di HP: buka /reports/create -> ketuk kolom cari (harus layar penuh, bilah bawah & Kirim tertutup) ->
  ketik "wngiri" (harus "Menampilkan hasil untuk Wanagiri") -> pilih -> geser peta -> "Pakai lokasi ini" -> baris
  lokasi di form sama dengan lembar tadi. Tarik peta ke bawah di APK tidak boleh me-refresh halaman.

## 5. Sisa / di luar scope

- Tombol Kembali APK tidak menutup layar penuh (sama dengan dialog) - FINDINGS #192.
- 6 halaman admin fasilitas mendapat koreksi tanpa petunjuk "Menampilkan hasil untuk".
- Nama jalan (bukan nama wilayah) belum bisa dikoreksi - kamus hanya kab/kec/desa/banjar.
