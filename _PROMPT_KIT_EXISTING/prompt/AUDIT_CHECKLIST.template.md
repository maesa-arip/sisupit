# AUDIT CHECKLIST — {{APP_NAME}}

Daftar periksa untuk audit aplikasi existing. Hasil setiap temuan dicatat ke
`docs/FINDINGS_LOG.md` (severity P0–P3 + lokasi `file:line` + dampak). **Audit =
membaca & mencatat, bukan memperbaiki.** Perbaikan jadi task terpisah.

Severity: **P0** keamanan/uang/kehilangan data · **P1** bug fungsional ·
**P2** inkonsistensi/teknis-debt · **P3** kosmetik/minor.

---

## 1. Keamanan (P0/P1)

- [ ] Endpoint sensitif punya authentication + authorization (bukan hanya auth)
- [ ] Tidak ada IDOR — objek dicek kepemilikannya (policy/ownership), bukan hanya ID valid
- [ ] Input divalidasi server-side; tidak percaya data dari client
- [ ] Tidak ada SQL/command injection (query parameterized, tidak string-concat)
- [ ] Rahasia tidak ter-commit (key/token/password) — cek `.env`, history, hardcode
- [ ] Password di-hash, token tidak bocor di log/response
- [ ] CORS, rate limit, dan header keamanan wajar
- [ ] Upload file divalidasi (tipe, ukuran, path traversal)
- [ ] <!-- uang → --> Alur finansial: transaction + lock, idempotent, debit=kredit, no hard delete

## 2. Korektness / Bug (P1)

- [ ] Error ditangani, bukan ditelan (`catch {}`) atau dibiarkan crash
- [ ] Edge case: null/empty/0/negatif/concurrent/timezone/rounding uang
- [ ] State machine status objek konsisten (tidak bisa lompat status ilegal)
- [ ] Race condition pada resource bersama (booking/saldo/stok) terkunci benar
- [ ] Tanggal/waktu: simpan UTC, konversi tampilan benar

## 3. Konsistensi (P2)

- [ ] Format response API seragam (envelope sama di semua endpoint)
- [ ] Penamaan & struktur folder konsisten dengan konvensi dominan
- [ ] Frontend: setiap fetch punya loading/empty/error state
- [ ] UI: pakai design token, bukan warna mentah; komponen reuse, bukan duplikat
- [ ] Pesan error untuk user ramah & konsisten (bukan dump objek error)

## 4. Kualitas & Teknis-Debt (P2/P3)

- [ ] Kode mati / duplikasi / komentar TODO basi
- [ ] `console.log` / debug tertinggal
- [ ] Magic string/number (status, role) tidak dipakai langsung — pakai enum/const
- [ ] Fungsi raksasa / logika bisnis bocor ke controller/komponen
- [ ] Dependency usang/rentan (cek `npm audit` / `composer audit` jika tersedia)

## 5. Test & Build (P1/P2)

- [ ] `{{BUILD_CMD}}` lulus dari kondisi bersih
- [ ] `{{TEST_CMD}}` lulus; catat test yang merah/skip
- [ ] Cakupan test untuk alur kritis (auth, uang, checkout) memadai
- [ ] `{{LINT_CMD}}` bersih atau warning terdokumentasi

## 6. Performa (P2/P3)

- [ ] Query N+1 (eager-load kurang) di list/relasi
- [ ] Index DB untuk kolom yang sering difilter
- [ ] Payload API tidak over-fetch; pagination ada untuk list besar
- [ ] Frontend: bundle besar / render ulang berlebihan yang jelas

---

> Tidak semua harus dikerjakan sekaligus. Prioritaskan P0 → P1, baru P2/P3.
