# TASK_65 — Telepon/WhatsApp saat konfirmasi, rentang tanggal Export, gulir "Atur Anggota"

| Field | Isi |
|-------|-----|
| ID | TASK_65 |
| Severity | P2 |
| Tipe | fitur kecil + bugfix (APK) |
| Sumber | permintaan user 2026-09-29 (dipecah TASK_64-68) |
| Status | DONE & TERDEPLOY 2026-09-30 @66b8ee52 ke dev/staging/prod; APK 1.1.4 terbit @af2c51b5 |

---

## 1. Tujuan
1. "Kasi pilihan telp biasa atau WhatsApp saat akan konfirmasi laporan".
2. "Isikan rentang waktu export laporan".
3. "Scroll di atur anggota regu saat tarik kebawah bukan datanya yang scroll tapi pagenya jadi
   sering malah ke refresh di webview".

## 2. Kondisi awal & akar
1. Panel verifikasi admin (`Show.jsx`, `TERLAPOR && canVerify`) hanya punya satu tautan `tel:` di
   tengah kalimat.
2. `Admin\ReportController::export` hanya meneruskan `search` & `status`.
3. **Akarnya di APK, bukan halaman**: `MainActivity` membungkus WebView dengan
   `SwipeRefreshLayout` tanpa pemeriksaan gulir anak. Layout itu hanya melihat posisi gulir
   HALAMAN (`WebView.canScrollVertically(-1)`), jadi selama halaman di puncak SETIAP tarikan ke
   bawah - termasuk di dalam daftar dialog yang masih bisa digulir ke atas - direbut jadi muat
   ulang. CSS `overscroll-behavior` (sudah ada di `html, body`) tak bisa mencegahnya: gestur itu
   dicegat native sebelum sampai ke halaman. Ikutan di halaman: yang bergulir seluruh
   `DialogContent`, bukan daftarnya, sehingga judul & pencarian ikut hilang.

## 3. Perubahan
1. `Show.jsx`: `reporterPhone` (nomor `tel` apa adanya, WA dinormalkan 08xx -> 628xx pola
   `Volunteers/Show.jsx`, pesan pembuka menyebut nomor LP) + tombol **Telepon** & **WhatsApp**
   di panel verifikasi. Tanpa nomor = tanpa tombol.
2. Export: parameter `from`/`to` (`Y-m-d`, tanggal WITA, inklusif; `to >= from` hanya bila `from`
   diisi). `ReportsExport` mengonversi batasnya ke UTC (#134) dan kop baris 3 menyebut
   "Periode: ..." ("Semua Tanggal" bila kosong). Pop-up: dua `DatePicker` (bukan input native,
   #108), rentang terbalik menonaktifkan tombol Unduh.
3. Web: `ui/dialog.jsx` memasang `PullToRefreshLock` DI DALAM `DialogPrimitive.Content` (hanya
   terpasang selama terbuka) yang memanggil `AndroidBridge.setPullToRefreshEnabled(false/true)`
   secara OPSIONAL, dengan hitungan untuk dialog bertumpuk. Daftar anggota `/regu` bergulir
   sendiri (`max-h-[45vh] overflow-y-auto overscroll-contain`).
   APK (`C:\Users\Admin\AndroidStudioProjects\SisupitWebView`, di luar git; cadangan
   `*.bak-v113`): method `@JavascriptInterface setPullToRefreshEnabled(boolean)` + refresh
   dinyalakan lagi di `onPageFinished` (muat ulang penuh tak boleh mewarisi keadaan mati).
   Versi 1.1.3/vc5 -> **1.1.4/vc6**.

## 4. Blast radius
- Kunci refresh berlaku untuk SEMUA `Dialog` (bukan AlertDialog/Sheet/Popover). Disengaja: dialog
  lain yang bergulir punya masalah yang sama.
- APK LAMA: tak punya method itu -> panggilan dilewati, perilaku lama tetap (refresh tak sengaja
  masih bisa terjadi, tapi daftar kini bergulir sendiri). Perbaikan penuh butuh APK 1.1.4 terpasang.

## 5. Verifikasi
- [x] `ReportExportTest` +3 (rentang WITA di kedua tepi, kop "Semua Tanggal", rentang terbalik &
  format salah ditolak) - sabotase konversi UTC dibuktikan MERAH, pulih `cmp`.
- [x] `ReportVerifyContactTest` BARU (2), `DialogPullToRefreshTest` BARU (2) - sabotase kunci
  dialog dibuktikan MERAH, pulih `cmp`.
- [x] Suite 591 passed (2724), Pint & prettier bersih, build lulus.
- [ ] Manual: di APK 1.1.4 buka `/regu` -> Atur Anggota -> gulir daftar ke atas & bawah saat
  halaman di puncak: tidak memuat ulang; tutup dialog lalu tarik halaman: refresh kembali jalan.
- [ ] Manual: tombol WhatsApp membuka obrolan ke nomor pelapor berisi pesan pembuka.

## 6. Rollback
Revert commit TASK_65. APK: pulihkan `MainActivity.java.bak-v113` & `build.gradle.bak-v113`.
