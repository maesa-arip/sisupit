# MASTER PROMPT — {{APP_NAME}} (EXISTING APP MAINTENANCE)
# Versi 1.0

Dokumen ini adalah **sumber kebenaran disiplin kerja** untuk merawat, mengaudit, dan
memperbaiki aplikasi {{APP_NAME}} yang **sudah ada**. Bukan untuk membangun dari nol.

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
- **Tanpa menambah abstraksi/library baru** untuk fix kecil — pakai yang sudah ada.
- **Hapus kode hanya bila yakin mati** (cari pemakaian dulu) dan jelaskan kenapa.
- **Komentar & dokumen** ikut gaya repo; jangan tambah komentar berlebihan.

---

## KEAMANAN REGRESI (REGRESSION SAFETY)

1. **Baseline dulu:** jalankan `{{TEST_CMD}}` sebelum menyentuh apa pun. Catat yang sudah merah.
2. **Reproduce bug** sebelum memperbaiki — buktikan ia ada (test gagal / langkah manual).
3. **Tambah/ubah test** untuk bug yang diperbaiki bila repo punya test (regression test).
4. **Sesudah fix:** test minimal kembali hijau seperti baseline (atau lebih hijau).
5. **Tak ada test sama sekali?** Verifikasi manual end-to-end & tulis langkahnya di file task.
6. **Build & lint** (`{{BUILD_CMD}}`, `{{LINT_CMD}}`) harus tetap lulus.

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

Lihat `docs/CONVENTIONS.md` untuk pola konkret repo ini. Prinsip umum:
- Tiru pola layer yang sudah ada (controller/service/repo, atau apa pun strukturnya)
- Penanganan error & format response mengikuti pola dominan repo
- Validasi & otorisasi lewat mekanisme yang sudah dipakai (jangan bikin jalur baru)
- <!-- ISI: jika app pakai uang → -->
  Proses uang dalam transaction + lock; jangan hard delete transaksi finansial;
  total debit = kredit per journal

---

## ANTI-POLA YANG DILARANG SAAT MEMPERBAIKI

- Menulis ulang modul besar untuk fix kecil
- "Drive-by refactor" file yang tak terkait task
- Menonaktifkan/menghapus test agar "hijau"
- Menelan error diam-diam (`catch {}`) untuk menyembunyikan gejala
- Mengubah kontrak API/skema DB tanpa mencatat & tanpa perlu
- Menambah TODO tanpa tindakan, atau meninggalkan `console.log`/debug

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
- Test: [baseline X gagal → sekarang hijau] / langkah manual
- Build & lint: [lulus]

### Blast radius / risiko sisa
- ...

### Temuan baru (dicatat ke FINDINGS_LOG, tidak dikerjakan)
- ...

### Aman di-merge?
[YA / TIDAK — alasan]
```
