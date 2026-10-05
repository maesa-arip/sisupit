# mobile/ - Titik Temu Wrapper Android & iOS

Folder ini adalah **satu-satunya tempat bersama** antara wrapper **Android** (APK,
`com.sisupit.app`) dan wrapper **iOS** (WKWebView) Sisupit. Keduanya membungkus web yang
sama (`https://sisupit.com`), jadi keduanya harus memenuhi **kontrak yang sama** dengan web.

Kenapa folder ini ada: proyek Android (`C:\Users\Admin\AndroidStudioProjects\SisupitWebView`)
**tidak punya git**, dan proyek iOS dikerjakan di Mac terpisah. Tanpa tempat bersama, setiap
perubahan di APK/web hanya tercatat di memori sesi dan iOS tertinggal tanpa tahu apa yang
berubah. Repo web ini sudah ada di GitHub dan bisa di-`git pull` dari Mac, jadi di sinilah
kontraknya disimpan.

## Isi

| Berkas | Isi | Siapa yang memperbarui |
|---|---|---|
| [`ATURAN_NOTIFIKASI.md`](ATURAN_NOTIFIKASI.md) | Versi ringkas untuk dibaca: siapa dapat notifikasi apa, kapan, bunyinya apa (laporan masuk, verifikasi, OPD, status pelapor) | siapa pun yang mengubah notifikasi/suara |
| [`KONTRAK.md`](KONTRAK.md) | Kontrak web ↔ native: User-Agent, jembatan JS `window.AndroidBridge`, endpoint, payload push, deep-link | siapa pun yang mengubah web ATAU wrapper |
| [`PERILAKU_WEBVIEW.md`](PERILAKU_WEBVIEW.md) | Perilaku native yang dipasang Android dan WAJIB ditiru iOS (cookie, GPS, kamera/foto, unduhan, tautan luar, inset, tarik-untuk-refresh) | sisi Android saat menambah perilaku |
| [`CHANGELOG_ANDROID.md`](CHANGELOG_ANDROID.md) | Riwayat rilis APK + apa yang harus di-port ke iOS per rilis | sisi Android, SETIAP rilis APK |
| [`PARITAS.md`](PARITAS.md) | Matriks fitur Android vs iOS + celah di server yang merugikan iOS | kedua sisi |
| [`aset/suara/`](aset/suara/) | Berkas suara PERSIS yang dipaket di APK saat ini | sisi Android saat suara berubah |

`docs/ios/PROMPT_SISUPIT_IOS.md` tetap jadi prompt pembuka proyek iOS (penyiapan Mac,
jebakan khas iOS), tapi **isinya dibekukan per 2026-08-11**. Bila ia berbeda dengan folder
ini, **folder ini yang berlaku**.

## Aturan main

1. **Web adalah hukum.** Kedua wrapper menyesuaikan diri dengan web, bukan sebaliknya.
   Mengubah web demi satu platform wajib dicatat di `KONTRAK.md` dan dicek dampaknya ke
   platform lain.
2. **Nama jembatan `window.AndroidBridge` TIDAK diganti**, walau keliru untuk iOS. iOS
   menyuntikkan shim bernama sama (lihat `KONTRAK.md` §2). Mengganti nama = menyentuh
   banyak berkas web yang stabil dan memutus APK lama yang masih beredar.
3. **Metode jembatan baru selalu OPSIONAL di sisi web** - dipanggil hanya bila
   `typeof window.AndroidBridge.namaMetode === 'function'`. Dengan begitu APK/iOS lama
   dan browser biasa tidak rusak.
4. **Setiap rilis APK** → tambah entri di `CHANGELOG_ANDROID.md` dengan bagian
   "Yang harus dilakukan iOS", lalu perbarui kolom Android di `PARITAS.md`.
5. **Setiap rilis iOS** → perbarui kolom iOS di `PARITAS.md` (dan centang butir di
   `CHANGELOG_ANDROID.md` yang sudah di-port).
6. Kode sumber wrapper **tidak** disimpan di sini - folder ini berisi kontrak, catatan,
   dan aset bersama saja. Proyek iOS sebaiknya punya repo git sendiri.

## Alur kerja sisi iOS (Mac)

```sh
git clone git@github.com:maesa-arip/sisupit.git   # sekali
cd sisupit && git pull                              # tiap mulai sesi
git log --oneline -- mobile/                        # apa yang berubah sejak terakhir
```

Baca `CHANGELOG_ANDROID.md` dari atas sampai entri yang sudah di-port, kerjakan butir
"Yang harus dilakukan iOS", lalu perbarui `PARITAS.md` dan commit.

## Keadaan per 2026-09-30

- APK **1.1.5 / versionCode 7**, targetSdk 36, sedang uji tertutup Google Play
  (12 penguji × 14 hari).
- Web produksi @`9988587e` (#158 push iOS status pelapor & nada OPD terdeploy).
- iOS: sedang dikerjakan (lihat `PARITAS.md`).
