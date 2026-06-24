# CONVENTIONS — {{APP_NAME}}

> Pola yang **WAJIB ditiru** saat mengedit repo ini, diturunkan dari kode yang sudah
> ada (bukan preferensi umum). Tujuan: perubahan baru tidak terlihat asing.
> Untuk tiap pola, cantumkan **contoh file nyata** sebagai patokan.

## Backend

| Aspek | Konvensi repo ini | Contoh file |
|-------|-------------------|-------------|
| Layering | <!-- mis. Controller tipis → Service → Model --> | `path` |
| Validasi | <!-- Form Request? inline? --> | `path` |
| Otorisasi | <!-- Policy? middleware? cek manual? --> | `path` |
| Format response | <!-- envelope { success, data, message }? --> | `path` |
| Penanganan error | <!-- exception handler terpusat? --> | `path` |
| Penamaan | <!-- file/class/method/kolom --> | — |
| Status/enum | <!-- enum class? const? string? --> | `path` |
| <!-- uang --> Transaksi uang | <!-- transaction + lock + journal? --> | `path` |

## Frontend

| Aspek | Konvensi repo ini | Contoh file |
|-------|-------------------|-------------|
| Pemanggilan API | <!-- service layer? fetch langsung? --> | `path` |
| Loading/empty/error | <!-- komponen status apa yang dipakai --> | `path` |
| Form & validasi | <!-- rhf+zod? formik? --> | `path` |
| Design token/warna | <!-- token CSS? tailwind? warna mentah? --> | `path` |
| Routing & guard | <!-- protected/role guard --> | `path` |
| State/data fetching | <!-- react-query? redux? useState? --> | `path` |
| Format uang/tanggal | <!-- helper apa --> | `path` |

## Git / commit
<!-- ISI: gaya pesan commit, branch, dari history. -->

## ANTI-POLA YANG ADA DI REPO (jangan ditiru, jangan diperluas)
<!-- ISI: hal jelek yang sudah terlanjur ada. Saat menyentuh area ini, ikuti pola
yang BENAR (di atas), bukan yang jelek ini — tapi jangan refactor massal di luar scope. -->
- ...

## Keputusan teknis terkunci
<!-- ISI: versi/library/konfigurasi yang tidak boleh diubah tanpa task khusus. -->
- ...
