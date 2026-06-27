# MASTER PROMPT — Sisupit (EXISTING APP MAINTENANCE)
# Versi 1.0

Dokumen ini adalah **sumber kebenaran disiplin kerja** untuk merawat, mengaudit, dan
memperbaiki aplikasi Sisupit (Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran
Terintegrasi) yang **sudah ada**. Bukan untuk membangun dari nol.

Setiap sesi menerima: file ini + `docs/ARCHITECTURE_MAP.md` + `docs/CONVENTIONS.md`
+ satu file task aktif. Kerjakan **satu task** sampai tuntas, lalu berhenti & laporkan.

---

## PRINSIP UTAMA

> **Kode yang sudah jalan adalah aset, bukan beban.** Tugasmu memperbaiki yang rusak
> dengan risiko serendah mungkin — bukan menulis ulang sesuai selera.

1. **Understand → Change → Verify.** Jangan pernah mengedit file yang belum kamu baca utuh.
2. **Reversibilitas.** Perubahan harus mudah di-review & di-rollback (commit kecil & fokus).
3. **Match, don't impose.** Ikuti gaya yang dominan di sekitarnya, sekalipun bukan gaya favoritmu.
4. **Surface, don't surprise.** Kalau menemukan sesuatu yang aneh/berisiko/di luar scope,
   laporkan ke user atau catat di `FINDINGS_LOG.md` — jangan diam-diam mengubah.

---

## DISIPLIN PERUBAHAN (CHANGE DISCIPLINE)

- **Scope kunci:** satu task = satu tujuan. Tolak godaan "sekalian rapikan".
- **Diff minimal:** hanya baris yang perlu. Jangan ubah whitespace/format file lain.
- **Tanpa rename/move massal** kecuali memang itu isi task-nya.
- **Tanpa upgrade dependency** kecuali task memintanya (upgrade = task tersendiri).
- **Tanpa menambah abstraksi/library baru** untuk fix kecil — pakai yang sudah ada
  (38 komponen UI di `resources/js/Components/ui/*`, helper `HasFile`/`flashMessage`, dll).
- **Hapus kode hanya bila yakin mati** (cari pemakaian dulu) dan jelaskan kenapa.
- **Komentar & dokumen** ikut gaya repo (Bahasa Indonesia); jangan tambah komentar berlebihan.

---

## KEAMANAN REGRESI (REGRESSION SAFETY)

1. **Baseline dulu:** jalankan `php artisan test` sebelum menyentuh apa pun. Baseline
   saat onboarding (2026-06-25): **65 passed, 164 assertions**, tidak ada yang merah/skip.
2. **Reproduce bug** sebelum memperbaiki — buktikan ia ada (test gagal / langkah manual).
3. **Tambah/ubah test** untuk bug yang diperbaiki — repo punya Pest, ikuti pola
   `tests/Feature/Sisupit/*` (per-domain, bukan per-controller).
4. **Sesudah fix:** test minimal kembali hijau seperti baseline (atau lebih hijau,
   tidak boleh kurang dari 65 passed).
5. **Build wajib lulus:** `npm run build` (vite build + vite build --ssr).
6. **Jangan commit `public/build`** kecuali memang diminta — file itu ter-track di git
   tapi build ulang menghasilkan diff besar yang tidak terkait task.

---

## STANDAR INVESTIGASI BUG

```
1. Reproduce      → kondisi & langkah persis yang memicu
2. Isolate        → file:line dan jalur eksekusi yang terlibat
3. Root cause     → SEBAB sebenarnya, bukan gejala (jangan tambal di permukaan)
4. Blast radius   → siapa lagi memakai kode ini? efek samping fix?
5. Fix            → perubahan terkecil yang menyelesaikan akar masalah
6. Verify         → test + manual; pastikan tidak ada regresi
```

Jangan menambal gejala (mis. `try/catch` kosong, `?? default`) jika akar masalahnya
bisa diperbaiki. Kalau hanya bisa mitigasi sementara, tandai jelas + buat temuan follow-up.

---

## STANDAR KODE (IKUTI YANG EXISTING)

Lihat `docs/CONVENTIONS.md` untuk pola konkret repo ini. Yang wajib diperhatikan di
Sisupit khususnya:

- **Setiap kali memakai `withoutGlobalScopes()`**, wajib diikuti re-check otorisasi
  manual (ownership atau role) — ini pernah jadi sumber bug IDOR nyata di codebase ini.
- **Otorisasi dicampur 3 cara** (middleware `role:`, manual `hasRole()`/`hasAnyRole()`,
  satu Policy `UserPolicy`) — saat menambah endpoint mutasi baru yang menerima model lain
  (mis. `User $user` dari route binding), **selalu** tambahkan authorize check eksplisit,
  jangan andalkan middleware grup saja (route grup bisa salah, terbukti pernah terjadi).
- **Tidak ada alur finansial aktif** (scaffolding Midtrans sudah dihapus total
  2026-06-27, FINDINGS_LOG #15) — jika task membuka jalur uang baru, treat sebagai
  keputusan arsitektur, bukan fix kecil: transaction + lock + idempotent + tidak ada
  hard delete transaksi.
- **Role check pakai `hasRole()`/`hasAnyRole()`** dari Spatie Permission — jangan
  bandingkan kolom string manual.

---

## ANTI-POLA YANG DILARANG SAAT MEMPERBAIKI

- Menulis ulang modul besar untuk fix kecil
- "Drive-by refactor" file yang tak terkait task
- Menonaktifkan/menghapus test agar "hijau"
- Menelan error diam-diam (`catch {}`) untuk menyembunyikan gejala — termasuk pola yang
  sudah ada (`flashMessage(MessageType::ERROR->message(error: $e->getMessage()))`)
  yang menampilkan pesan exception mentah ke user; jangan diperluas ke controller baru
- Mengubah kontrak API/skema DB tanpa mencatat & tanpa perlu
- Menambah TODO tanpa tindakan, atau meninggalkan `console.log`/debug
- Menjalankan `npm run build` lalu commit `public/build` tanpa diminta

---

## LAPORAN TASK

Setelah menyelesaikan task, berhenti dan buat laporan:

```
## LAPORAN TASK [ID] — [JUDUL]

### Masalah & akar penyebab
- Gejala: ...
- Root cause: file:line — ...

### Perubahan
- path/to/file — apa yang diubah & kenapa (diff ringkas)

### Verifikasi
- Test: [baseline 65 passed → sekarang hijau] / langkah manual
- Build: [npm run build lulus]

### Blast radius / risiko sisa
- ...

### Temuan baru (dicatat ke FINDINGS_LOG, tidak dikerjakan)
- ...

### Aman di-merge?
[YA / TIDAK — alasan]
```
