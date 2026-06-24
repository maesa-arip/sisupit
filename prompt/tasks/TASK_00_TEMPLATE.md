# TASK [ID] — [JUDUL SINGKAT]
# Sertakan bersama MASTER_PROMPT.md, ARCHITECTURE_MAP.md, CONVENTIONS.md

<!--
CETAKAN WORK ORDER. Salin jadi TASK_0N_nama.md untuk setiap perbaikan/perubahan.
Isi sebelum mulai. Tujuannya memaksa: reproduce → root cause → fix minimal → verifikasi.
-->

| Field | Isi |
|-------|-----|
| ID | TASK_0N |
| Severity | P0 / P1 / P2 / P3 |
| Tipe | bugfix / security / refactor terbatas / fitur kecil / perf |
| Sumber | FINDINGS_LOG #.. / permintaan user |
| Status | TODO / IN PROGRESS / DONE |

---

## 1. Deskripsi masalah / tujuan
<!-- ISI: apa yang salah atau apa yang diminta. Konkret. -->

## 2. Reproduce (bukti masalah ada)
<!-- ISI: langkah/kondisi persis yang memicu, atau test yang gagal. Untuk fitur kecil:
kondisi awal & hasil yang diharapkan. -->

## 3. Root cause
<!-- ISI: SEBAB sebenarnya di file:line mana. Isi SETELAH investigasi, bukan tebakan. -->

## 4. Rencana fix (perubahan terkecil yang benar)
<!-- ISI: file yang akan diubah + apa perubahannya. Pastikan ikut CONVENTIONS.md. -->
- `path/to/file` — ...

## 5. Blast radius
<!-- ISI: siapa lagi memakai kode ini? efek samping? area yang perlu diuji ulang? -->

## 6. Rencana verifikasi
- [ ] Baseline test sebelum: `php artisan test` → catat hasil (baseline: 65 passed)
- [ ] Tambah/ubah regression test (Pest, ikuti pola `tests/Feature/Sisupit/*`)
- [ ] Test sesudah hijau
- [ ] Verifikasi manual: <!-- langkah end-to-end -->
- [ ] `npm run build` lulus (jangan commit `public/build` kecuali diminta)

## 7. Rollback
<!-- ISI: cara mengembalikan jika ada masalah (commit fokus → revert). -->

---

## Acceptance criteria
- [ ] Masalah hilang / tujuan tercapai (terbukti via verifikasi)
- [ ] Tidak ada regresi (test ≥ baseline 65 passed)
- [ ] Diff minimal & sesuai konvensi (`prompt/docs/CONVENTIONS.md`)
- [ ] Dokumen terkait diupdate (`prompt/docs/ARCHITECTURE_MAP.md`/`FINDINGS_LOG.md`) bila perlu
