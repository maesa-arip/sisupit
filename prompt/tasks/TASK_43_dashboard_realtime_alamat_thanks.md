# TASK 43 — Dashboard realtime, aksara asing di form lapor, & status terkini di halaman Thanks

| Field | Isi |
|-------|-----|
| ID | TASK_43 |
| Severity | P2 |
| Tipe | bugfix + fitur kecil |
| Sumber | permintaan user 2026-08-27 → FINDINGS_LOG #83 (adendum), #84, #85 |
| Status | DONE (kode) — sisa verifikasi manual §6 |

---

## 1. Permintaan

Satu pesan user, tiga hal:

> "Dashboard auto update saat ada kejadian sekarang masih perlu reload, di report create juga
> sama muncul huruf korea saat input manual, Di report/thanks auto update sesuai keadaan terkini"

Dua keputusan cakupan ditanyakan lebih dulu dan dijawab **"ya keduanya, kerjakan semuanya"**:
dashboard OPD ikut, dan keenam form fasilitas admin ikut disaring aksaranya.

---

## 2. Bagian A — Dashboard tidak pernah auto-update (#84)

### Akar

Dua lapis, keduanya perlu:

1. **Tak ada siaran saat laporan DIBUAT.** `ReportStatusChanged` baru lahir pada transisi
   berikutnya, jadi peristiwa paling penting — laporan darurat masuk — tidak menyiarkan apa pun.
2. **Tak ada channel yang bisa didengar dashboard.** `report-tracking.{id}` adalah channel
   PER-LAPORAN: untuk mendengarnya kita harus sudah tahu id-nya, padahal yang ditunggu dashboard
   justru laporan yang belum ada. Realtime karena itu cuma terpasang di satu berkas
   (`Reports/Show.jsx`) sejak #28.

### Yang dibangun

| Berkas | Perubahan |
|--------|-----------|
| `app/Models/User.php` | `narrowestJurisdictionColumn()` (rumus "tingkat tersempit menang", sebelumnya ditulis ulang di 4 tempat) + `reportFeedChannel()` |
| `app/Events/ReportFeedChanged.php` | **BARU.** `for(Report, ?status)` menentukan channel; `broadcastWith()` membatasi payload |
| `routes/channels.php` | `reports.all` + `reports.{level}.{code}`, keduanya diotorisasi dengan MEMBANDINGKAN ke `reportFeedChannel()` |
| `app/Http/Controllers/ReportController.php` | dispatch saat laporan dibuat |
| `app/Http/Controllers/ReportActionController.php` | dispatch di 5 titik, berdampingan dengan `ReportStatusChanged` |
| `app/Http/Controllers/DashboardController.php` | 3 salinan rumus wilayah → helper; prop `feed_channel` untuk 4 dashboard |
| `resources/js/hooks/use-report-feed.js` | **BARU.** langganan channel + jeda 1 detik; APA yang dimuat ulang diputuskan halaman |
| 4 halaman dashboard | `useReportFeed(feed_channel, …)` |

### Keputusan yang mengikat (jangan dibongkar tanpa membaca ini)

1. **Saringan dan channel WAJIB satu rumus.** Dashboard menyaring dengan "tingkat tersempit
   yang menang"; nama channel diturunkan dari rumus yang sama. Kalau keduanya diturunkan
   sendiri-sendiri, dashboard **diam** saat ada kejadian yang sebenarnya masuk daftarnya —
   tanpa galat, tanpa gejala. Bentuk yang sama dengan #60/#78.
2. **Otorisasi channel tidak menulis aturannya lagi.** `routes/channels.php` cuma
   membandingkan permintaan ke `User::reportFeedChannel()`. Satu aturan, bukan dua.
3. **Payload = aba-aba, bukan data** (`reportId` + `status`). Penerimanya SATU WILAYAH PENUH.
   Yang menampilkan datanya tetap server lewat `router.reload()`, sehingga scope Tenantable &
   otorisasi halaman dihitung ulang di sana.
4. **JANGAN gabungkan dengan `ReportStatusChanged`.** Satu payload berlaku untuk semua channel
   sebuah event, dan payload `ReportStatusChanged` memuat **alasan penolakan** — menggabungkannya
   berarti menyiarkan alasan penolakan sebuah laporan ke seluruh wilayah.
5. **Superadmin selalu `reports.all`,** sekalipun kolom wilayahnya terisi: dashboardnya memang
   tidak disaring wilayah sama sekali.
6. **Kolom wilayah kosong punya dua makna** (#56/TASK_23): staf = nasional, non-staf = profil
   belum lengkap → `null`, bukan `reports.all`.
7. **OPD tidak ikut skema wilayah** — akun OPD sengaja tanpa kode wilayah (#44); ia mendengar
   di `reports.agency.{id}`.
8. **Halaman warga/relawan menggabungkan, bukan mengganti.** Feed-nya punya state lokal
   (gulir-tak-berujung), jadi halaman pertama yang segar DIGABUNGKAN: baris lama diperbarui di
   tempatnya, yang benar-benar baru masuk di puncak. Dan ia menembak `route('dashboard')`
   alih-alih `router.reload()`, karena setelah "muat lebih banyak" URL sudah pindah ke `?page=N`
   — memuat ulang URL itu akan mengambil halaman N, padahal kejadian baru ada di halaman 1.

**Sisa risiko yang diterima:** dispatch `ReportFeedChanged` ditulis di 6 titik (mengikuti pola
`ReportStatusChanged` yang memang sudah 5 titik). Transisi status BARU yang lupa menyiarkannya
akan membuat dashboard diam untuk transisi itu. Yang dijaga tetap satu tempat adalah ATURANNYA
(`ReportFeedChanged::for`), bukan pemicunya.

---

## 3. Bagian B — Aksara asing di form lapor & form fasilitas (#83 adendum)

Penilaian saya di TASK_42 bahwa "layar lain tidak terdampak" **keliru**. `display_name` mentah
juga dipakai di:

- `Front/Reports/Create.jsx` — panel "Alamat Lengkap (otomatis)" (mode input manual Pusat
  Komando), tombol "Salin ke patokan", cadangan badge lokasi, dua baris dropdown pencarian.
- **Enam form fasilitas admin** (`Hydrants`/`Pumps`/`FireStations` × Create/Edit) — di sana ia
  masuk ke kolom `address`, jadi aksaranya **tersimpan ke data**, bukan sekadar tampil.

Fix: `alamatTerbaca()` di `lib/utils.js` — membuang SEGMEN (dipisah koma) yang memuat aksara di
luar rentang Latin, menyisakan sisanya utuh. Terbukti:

```
"Рынок, Jalan Pandawa, Legian, Kuta"      → "Jalan Pandawa, Legian, Kuta"
"エアアジア, Sunset Road, Kuta"            → "Sunset Road, Kuta"
"서울식당, Jalan Raya Pemogan, Pemogan"    → "Jalan Raya Pemogan, Pemogan"
"Café Romano (pizzeria), Jalan Legian"    → "Café Romano (pizzeria), Jalan Legian"   ← utuh
```

**CompleteProfile TIDAK ikut disaring** — ia tetap memakai penyelesaian TASK_42 (nama wilayah
hasil pencocokan). Di sana yang benar bukan "alamat yang disaring" melainkan "bukan alamat sama
sekali": kalimatnya bicara soal wilayah.

**`GeocodeController` TIDAK disentuh** — memfilter di proxy berarti membuang informasi yang di
layar lain justru benar, dan `accept-language=id` memang tak bisa mencegah ini (parameter itu
hanya memilih di antara varian `name:<lang>`, tak menyentuh tag `name` utama).

---

## 4. Bagian C — Halaman Thanks tidak menunjukkan keadaan terkini (#85)

Mini-steppernya menandai tahap aktif dengan `i === 0` — **dipaku, bukan dibaca** — dan
`ReportController::thanks()` bahkan tidak mengirim kolom `status`. Sejak #38 halaman ini
ber-ID dan bisa dibuka ulang, jadi laporan yang sudah selesai pun tetap berbunyi "Laporan Masuk".

Fix: `status` ikut dikirim; `STEP_STATUS` sejajar dengan `STEPS`; warna tiap tahap mengikuti
kamus status kanonik (StatusBadge); `ditolak` jadi keterangan tersendiri karena ia jalan buntu,
bukan langkah kelima. Perubahan berikutnya masuk lewat channel `report-tracking.{id}` dan event
`ReportStatusChanged` yang **sudah ada** — pelapor memang sudah berhak di sana, jadi tidak ada
permukaan otorisasi baru.

---

## 5. Verifikasi otomatis

- [x] Baseline `php artisan test` **sebelum**: 310 passed (1182 assertions)
- [x] **Sesudah**: 323 passed (1234 assertions) — 13 test baru, nol regresi
- [x] **Uji-merah:** `reportFeedChannel()` dipaksa selalu `reports.all` dan `ReportFeedChanged::for()`
      dipangkas jadi 2 tingkat → 4 test langsung merah; setelah dipulihkan, hijau lagi. Penjaganya
      benar-benar menangkap kerusakan, bukan sekadar menghijaukan asumsi (pelajaran #79).
- [x] `vendor/bin/pint --test app/ routes/` PASS
- [x] `npm run build` lulus (client + SSR)
- [x] Chunk hasil build diperiksa: `use-report-feed-*.js` memuat `ReportFeedChanged`,
      `Thanks-*.js` memuat `report-tracking`

## 6. Verifikasi manual (BELUM dijalankan — butuh dua browser + Reverb hidup)

Prasyarat: `REVERB_APP_KEY` dkk. terisi di server dan `php artisan reverb:start` berjalan.
Tanpa itu `window.Echo` tidak ada dan semua fitur di bawah **diam tanpa galat** (degradasi
sengaja, lihat `echo.js`).

- [ ] Dua jendela: petugas di `/dashboard`, warga melapor dari jendela lain. Kartu & peta taktis
      petugas harus bergerak sendiri dalam ~1 detik, **tanpa reload**.
- [ ] Ulangi untuk admin (`Admin/Dashboard`), warga/relawan (`Dashboard`), dan OPD (`Opd/Dashboard`
      — pakai laporan yang instansinya dilibatkan).
- [ ] Staf desa A tidak boleh ikut bergerak saat kejadian di desa B. Periksa juga di Network:
      `/broadcasting/auth` untuk channel desa B harus 403.
- [ ] Relawan yang sudah menekan "muat lebih banyak" beberapa kali: saat kejadian baru masuk,
      daftar yang sudah digulir **tidak boleh** kembali ke halaman satu.
- [ ] `/lapor` sebagai Pusat Komando, geser pin ke sekitar Kuta/Pemogan: panel "Alamat Lengkap
      (otomatis)" tidak boleh memuat aksara non-Latin; "Salin ke patokan" ikut bersih.
- [ ] Tambah hydrant/pompa/pos di titik yang sama → kolom Alamat yang TERSIMPAN bersih.
- [ ] Buka `/reports/thanks/{id}` sebagai pelapor, lalu dari jendela lain verifikasi laporannya:
      stepper harus berpindah ke "Terverifikasi" sendiri, badge ikut berubah.
- [ ] Tolak sebuah laporan → halaman Thanks-nya menampilkan keterangan "ditolak", bukan stepper.

## 7. Blast radius

- **Tak ada migrasi, tak ada perubahan skema, tak ada route baru.** Yang bertambah: satu event,
  dua definisi channel, satu prop Inertia per dashboard, satu hook frontend.
- `ReportStatusChanged` dan channel `report-tracking.{id}` **tidak diubah sama sekali** —
  `Reports/Show.jsx` tak tersentuh.
- Bila Reverb mati/`REVERB_APP_KEY` kosong, seluruh bagian A & C **kembali ke perilaku lama**
  (perlu reload) tanpa galat: `useReportFeed` dan efek di Thanks sama-sama dijaga `if (!window.Echo)`.
- Beban server: tiap siaran memicu satu `router.reload()` per dashboard yang terbuka di wilayah
  itu. Jedanya 1 detik menyatukan rentetan siaran satu insiden jadi satu pemuatan ulang.

## 8. Catatan kejadian selama pengerjaan

Saya menjalankan `git checkout -- resources/js/Pages/Admin/Dashboard.jsx` untuk membatalkan
patch yang gagal, dan itu **ikut menghapus perubahan TASK_41 yang belum ter-commit** di berkas
itu (label kartu "Mode Kesiapan": `'Siaga Aktif' : 'Mulai Siaga'` seharusnya sudah jadi
`'Siaga' : 'Non Aktif'`). Sudah dipulihkan dari kembarannya di `Pages/Dashboard.jsx`, berikut
komentar penjelasnya, dan diperiksa simetris. Tidak ada perubahan TASK_41 lain di berkas itu
(berkas ini tak memuat nomor darurat). **Pelajaran: jangan pakai `git checkout` pada berkas di
repo yang punya banyak perubahan belum ter-commit.**

## 9. Rollback

`git revert` commit ini. Satu event baru bisa dihapus tanpa sisa; tak ada keadaan tersimpan.

---

## Acceptance criteria
- [x] Keempat dashboard memperbarui diri saat ada kejadian, ter-scope wilayah/instansi masing-masing
- [x] Aksara non-Latin tak lagi tampil di form lapor maupun tersimpan ke alamat fasilitas
- [x] Halaman Thanks menunjukkan status terkini dan ikut berubah tanpa reload
- [x] Tidak ada regresi (323 passed, naik dari baseline 310)
- [x] Penjaga baru dibuktikan merah lebih dulu
- [x] `FINDINGS_LOG.md` #84 & #85 dicatat FIXED, #83 diberi adendum
- [x] `ARCHITECTURE_MAP.md` diperbarui (event, channel, alur feed)
- [ ] Verifikasi manual §6
