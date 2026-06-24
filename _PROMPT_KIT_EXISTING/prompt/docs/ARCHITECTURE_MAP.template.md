# ARCHITECTURE MAP — {{APP_NAME}}

> Hasil onboarding (TASK_01). Peta faktual codebase existing. Update saat struktur
> berubah. Semua klaim harus merujuk file nyata; tandai `?` untuk yang belum pasti.

## Stack & perintah
```
Stack     : {{STACK}}             (dari composer.json/package.json/...)
Build     : {{BUILD_CMD}}
Test      : {{TEST_CMD}}          (status saat onboarding: {{lulus/gagal/none}})
Run       : {{RUN_CMD}}
Lint      : {{LINT_CMD}}
```

## Struktur folder utama
<!-- ISI: folder & tanggung jawabnya. -->
```
{{REPO_LAYOUT}}
backend/   — ...
frontend/  — ...
```

## Modul & tanggung jawab
<!-- ISI: per modul/domain besar, apa fungsinya & file kuncinya. -->
| Modul | Tanggung jawab | File kunci |
|-------|----------------|-----------|
| Auth | ... | `path` |
| ... | ... | ... |

## Alur request (contoh kritikal)
<!-- ISI: 1-2 alur penting end-to-end, mis. checkout / login. -->
```
Request → Route → Controller → Service → Model/DB → Resource → Response
(sebutkan file nyata di tiap langkah)
```

## Autentikasi & otorisasi
<!-- ISI: mekanisme login, token/session, role/permission, cara cek akses. -->

## Entitas / model data
<!-- ISI: tabel/model utama + relasi. -->
| Entitas | Relasi penting | Catatan (soft delete? uang? snapshot?) |
|---------|----------------|----------------------------------------|
| ... | ... | ... |

## Endpoint / route
<!-- ISI: ringkas daftar route dari file routing. Atau rujuk API_CONTRACT bila ada. -->
```
METHOD /path → Controller@action  (auth? permission?)
```

## Test
<!-- ISI: ada test? di mana? cakupan area kritis? hasil run terakhir. -->

## Catatan & area berisiko
<!-- ISI: bagian yang rumit/rapuh/penting untuk diingat sebelum mengedit. -->
