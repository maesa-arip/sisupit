# TASK_39 — Isi Export Excel di Verifikasi Laporan diselaraskan dengan data hari ini
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

| Field | Isi |
|-------|-----|
| ID | TASK_39 |
| Severity | P2 |
| Tipe | bugfix + fitur kecil |
| Sumber | permintaan user 2026-08-26 ("pada menu itu ada export excel, perbaiki isiannya karena sudah banyak berubah dari awal laporan dibuat") |
| Status | DONE (kode) — sisa verifikasi manual §6 |

---

## 1. Masalah

`app/Exports/ReportsExport.php` dibuat saat laporan masih sederhana dan tak pernah menyusul
perubahan sesudahnya. Dua jenis masalah, dan yang pertama lebih serius daripada kelihatannya:

**a. Salah nama, bukan sekadar kurang lengkap.**
- Label status di berkas ekspor masih kosakata LAMA: "Terlapor (Belum Divalidasi)", "Menunggu
  Respons", "Sedang Ditangani". Layar Verifikasi Laporan sudah lama memakai kamus kanonik
  (`STATUS_META` di `Admin/Reports/Index.jsx`): **Laporan Masuk / Laporan Terverifikasi /
  Penanganan / Selesai**. Jadi satu laporan punya dua nama — satu di layar operator, satu di
  berkas yang dikirim ke pimpinan.
- Status **`ditolak`** (ada sejak FINDINGS #24) tidak punya label sama sekali di sana, sehingga
  selnya tercetak `ditolak` mentah, dan **alasan penolakannya tidak pernah ikut** padahal
  justru itu yang dicari saat laporan hoax dipertanyakan.

**b. Kolom yang tak pernah ada padahal datanya sudah lama terisi:** `incident_type` (TASK_27),
OPD terkait + konfirmasinya (TASK_27), armada yang dikerahkan (TASK_09), jumlah foto
(FINDINGS #17), dan ringkasan Berita Acara (FINDINGS #39).

## 2. Perubahan

`app/Exports/ReportsExport.php` — 22 → **32 kolom** (`LAST_COLUMN` 'V' → 'AF'):

| Kolom baru | Sumber | Catatan |
|---|---|---|
| No. Laporan | turunan `id`+tahun | rumus SAMA dengan `reportNumber()` di `lib/utils.js`; kolom `ID` mentah tetap ada karena itu yang dipakai URL detail |
| Jenis Kejadian | `reports.incident_type` | label seiring `INCIDENT_TYPES` di form lapor warga |
| Alasan Ditolak | `rejected_reason` + `rejected_at` | hanya terisi untuk status `ditolak`; tanpa alasan tertulis tetap menyebut waktunya |
| Armada Dikerahkan | `report_units.unit.name` | `withTrashed()` — armada yang kemudian dihapus tak boleh menghapus jejak pernah dikerahkan |
| OPD Terkait | `report_agencies.agency_name` | nama diambil dari pivot yang sengaja didenormalisasi, jadi rekap lama tetap terbaca walau master OPD berganti nama |
| Konfirmasi OPD | `requires_confirmation` + `confirmed_at` | "PLN: sudah - 26-08-2026 12:30" / "PLN: menunggu". Yang dihitung hanya yang memang butuh konfirmasi — itu DATA, jangan diganti `if (agency_name === 'PLN')` |
| Jml. Foto | `report_photos` | jatuh ke kolom lama `reports.photo` bila galerinya kosong, supaya laporan pra-#17 tak tercatat 0 foto |
| Berita Acara | `report_resolutions.status` | Final / Sementara / Belum ada |
| Taksiran Kerugian | `report_resolutions.kerugian` | kolomnya **teks bebas** ("±1jt"), jadi tidak diformat sebagai angka |
| Jml. Korban | `report_victims` | **jumlah saja** |

Label status diperbaiki ke kamus kanonik + `ditolak` → "Ditolak". Urutan kolom dirapikan
(identitas kejadian → pelapor → lokasi → status → linimasa → sumber daya → penutupan), lebar
kolom & perataan tengah menyesuaikan.

## 3. Yang SENGAJA tidak diekspor

- **Identitas korban & berkas KTP** (`report_victims.nama`, `ktp_path` di disk privat) — yang
  ikut hanya jumlahnya. Berkas xlsx gampang berpindah tangan lewat WhatsApp/email, sementara
  KTP di aplikasi ini dijaga gerbang baca tersendiri (`ReportResolutionController::ktp`).
  Dikunci test: nama korban tidak boleh muncul di sheet.
- **Kronologi & tim atensi** — teks panjang bebas yang merusak lebar kolom dan memang
  tempatnya di dokumen Berita Acara, bukan di rekap baris-per-laporan.
- `jenis_kejadian` versi Berita Acara (klasifikasi petugas saat menutup insiden) — mudah
  ditambahkan bila diminta, tapi berpotensi rancu berdampingan dengan "Jenis Kejadian" milik
  pelapor.

## 4. Blast radius

Hanya berkas ekspor. Query TETAP lewat scope `Tenantable` milik `Report` (tidak ada
`withoutGlobalScopes()`), jadi admin tetap hanya mengekspor wilayahnya sendiri — dijaga test
lama yang tidak diubah. Filter `search`/`status` dari layar tetap diteruskan apa adanya.
Eager-load bertambah 5 relasi; `FromQuery` tetap memotong query per chunk sehingga jumlah
query tidak tumbuh per baris.

## 5. Penjaga

`tests/Feature/Sisupit/ReportExportTest.php` 6 → **9 test**:
- isi baru benar-benar sampai ke sheet (nomor laporan, jenis kejadian, armada, OPD, Berita
  Acara, kerugian) **dan** nama korban TIDAK ikut;
- laporan ditolak berlabel "Ditolak" berikut alasannya;
- kosakata status sama dengan layar ("Laporan Masuk", bukan "Terlapor (Belum Divalidasi)").

## 6. Verifikasi

- [x] `php artisan test` → 279 → **282 passed (1072 assertions)**
- [x] Pint bersih
- [ ] **Manual (SISA):** buka `/admin/reports` → kebab → Export Excel. Periksa di Excel:
  1. kop & header tabel melebar sampai kolom **AF**, tidak ada kolom terpotong;
  2. laporan yang ditolak menampilkan "Ditolak" + alasannya;
  3. laporan yang sudah punya Berita Acara final menampilkan "Final" + taksiran kerugian;
  4. filter status/kata kunci di layar ikut terbawa ke berkas (tertulis di kop).

## 7. Rollback

Satu commit fokus → `git revert`. Tidak ada perubahan skema/DB.
