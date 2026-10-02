# Rekap Tampilan per Peran & Status Rombakan apple-design

> Branch `feat/mobile-native-polish` (TASK_69). Diperbarui 2026-10-02 (bagian 12-13: semua halaman B & C dirombak; bagian 15: peta disembunyikan di ponsel untuk 7 halaman fasilitas & laporan, /admin/reports dirombak ulang; bagian 16: AUDIT VISUAL ULANG 390px - label lama terbukti terlalu optimis, lihat "Sisa"). Sumber: `php artisan route:list`
> (URL + middleware peran) dan komponen Inertia yang dirender tiap controller, lalu digabung dengan
> riwayat rombakan TASK_69. Route yang hanya bergerbang login dibagi per peran dari logika controller.

## Legenda status

| Kode | Status | Artinya |
|---|---|---|
| **A** | Dirombak penuh | Tata letak ditata ulang ala iOS (bukan sekadar warna/kelas) |
| **B** | Dirombak sebagian | Tombol, kartu, modal, teks, atau daftar diseragamkan; tata letak inti masih lama |
| **C** | Gaya umum saja | Hanya ikut perubahan global: tombol, kartu, isian, dialog, radius, tipografi, skala judul |
| **D** | Tidak disentuh | Panduan / kode mati, sengaja dikecualikan |

Perubahan global (berlaku ke SEMUA status A-C): hover hanya di perangkat ber-kursor, tap highlight mati,
tombol mengecil saat ditekan, isian 16px (iOS tak zoom), material kaca header/bilah bawah/menu,
judul halaman besar, sidebar bertint, status pil, radius 2xl, tipografi tanpa font-black/kapital renggang.

## Ringkasan

Total **88 halaman** (tanpa Partials & berkas konfigurasi).

| Status | Jumlah |
|---|---|
| A - Dirombak penuh | 80 |
| B - Dirombak sebagian | 3 |
| C - Gaya umum saja | 0 |
| D - Tidak disentuh | 5 |

## Tampilan per peran

### Tamu (belum login) - 18 tampilan (17 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forgot-password` | `Auth/ForgotPassword.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/login` | `Auth/Login.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/register` | `Auth/Register.jsx` |
| A | `/reset-password/{token}` | `Auth/ResetPassword.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Warga - 27 tampilan (24 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Relawan - 28 tampilan (25 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Petugas Damkar - 36 tampilan (32 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Petugas/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| B | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Admin - 81 tampilan (77 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| A | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| A | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
| A | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| A | `/admin/announcements/create` | `Admin/Announcements/Create.jsx` |
| A | `/admin/announcements/edit/{announcement}` | `Admin/Announcements/Edit.jsx` |
| A | `/admin/assign-permissions` | `Admin/AssignPermissions/Index.jsx` |
| A | `/admin/assign-permissions/edit/{role}` | `Admin/AssignPermissions/Edit.jsx` |
| A | `/admin/banjars` | `Admin/Banjars/Index.jsx` |
| A | `/admin/banjars/create` | `Admin/Banjars/Form.jsx` |
| A | `/admin/banjars/{banjar}/edit` | `Admin/Banjars/Form.jsx` |
| A | `/admin/email` | `Admin/Mail/Settings.jsx` |
| A | `/admin/fire-stations` | `Admin/FireStations/Index.jsx` |
| A | `/admin/fire-stations/create` | `Admin/FireStations/Create.jsx` |
| A | `/admin/fire-stations/{fire_station}/edit` | `Admin/FireStations/Edit.jsx` |
| A | `/admin/forum` | `Admin/Forum/Index.jsx` |
| A | `/admin/hydrant-warga` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrant-warga/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrant-warga/{hydrant_warga}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/mail-contacts` | `Admin/MailContacts/Index.jsx` |
| A | `/admin/mail-contacts/create` | `Admin/MailContacts/Create.jsx` |
| A | `/admin/mail-contacts/{mail_contact}/edit` | `Admin/MailContacts/Edit.jsx` |
| A | `/admin/notifikasi-petugas` | `Admin/NotificationLevel/Edit.jsx` |
| A | `/admin/permissions` | `Admin/Permissions/Index.jsx` |
| A | `/admin/permissions/create` | `Admin/Permissions/Create.jsx` |
| A | `/admin/permissions/edit/{permission}` | `Admin/Permissions/Edit.jsx` |
| A | `/admin/pumps` | `Admin/Pumps/Index.jsx` |
| A | `/admin/pumps/create` | `Admin/Pumps/Create.jsx` |
| A | `/admin/pumps/{pump}/edit` | `Admin/Pumps/Edit.jsx` |
| A | `/admin/reports` | `Admin/Reports/Index.jsx` |
| A | `/admin/roles` | `Admin/Roles/Index.jsx` |
| A | `/admin/roles/create` | `Admin/Roles/Create.jsx` |
| A | `/admin/roles/edit/{role}` | `Admin/Roles/Edit.jsx` |
| A | `/admin/route-accesses` | `Admin/RouteAccesses/Index.jsx` |
| A | `/admin/route-accesses/create` | `Admin/RouteAccesses/Create.jsx` |
| A | `/admin/route-accesses/edit/{routeAccess}` | `Admin/RouteAccesses/Edit.jsx` |
| A | `/admin/settings` | `Admin/Settings/Edit.jsx` |
| A | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| A | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| A | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| A | `/admin/units` | `Admin/Units/Index.jsx` |
| A | `/admin/units/create` | `Admin/Units/Create.jsx` |
| A | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| B | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Superadmin - 81 tampilan (77 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| A | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| A | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
| A | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| A | `/admin/announcements/create` | `Admin/Announcements/Create.jsx` |
| A | `/admin/announcements/edit/{announcement}` | `Admin/Announcements/Edit.jsx` |
| A | `/admin/assign-permissions` | `Admin/AssignPermissions/Index.jsx` |
| A | `/admin/assign-permissions/edit/{role}` | `Admin/AssignPermissions/Edit.jsx` |
| A | `/admin/banjars` | `Admin/Banjars/Index.jsx` |
| A | `/admin/banjars/create` | `Admin/Banjars/Form.jsx` |
| A | `/admin/banjars/{banjar}/edit` | `Admin/Banjars/Form.jsx` |
| A | `/admin/email` | `Admin/Mail/Settings.jsx` |
| A | `/admin/fire-stations` | `Admin/FireStations/Index.jsx` |
| A | `/admin/fire-stations/create` | `Admin/FireStations/Create.jsx` |
| A | `/admin/fire-stations/{fire_station}/edit` | `Admin/FireStations/Edit.jsx` |
| A | `/admin/forum` | `Admin/Forum/Index.jsx` |
| A | `/admin/hydrant-warga` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrant-warga/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrant-warga/{hydrant_warga}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/mail-contacts` | `Admin/MailContacts/Index.jsx` |
| A | `/admin/mail-contacts/create` | `Admin/MailContacts/Create.jsx` |
| A | `/admin/mail-contacts/{mail_contact}/edit` | `Admin/MailContacts/Edit.jsx` |
| A | `/admin/notifikasi-petugas` | `Admin/NotificationLevel/Edit.jsx` |
| A | `/admin/permissions` | `Admin/Permissions/Index.jsx` |
| A | `/admin/permissions/create` | `Admin/Permissions/Create.jsx` |
| A | `/admin/permissions/edit/{permission}` | `Admin/Permissions/Edit.jsx` |
| A | `/admin/pumps` | `Admin/Pumps/Index.jsx` |
| A | `/admin/pumps/create` | `Admin/Pumps/Create.jsx` |
| A | `/admin/pumps/{pump}/edit` | `Admin/Pumps/Edit.jsx` |
| A | `/admin/reports` | `Admin/Reports/Index.jsx` |
| A | `/admin/roles` | `Admin/Roles/Index.jsx` |
| A | `/admin/roles/create` | `Admin/Roles/Create.jsx` |
| A | `/admin/roles/edit/{role}` | `Admin/Roles/Edit.jsx` |
| A | `/admin/route-accesses` | `Admin/RouteAccesses/Index.jsx` |
| A | `/admin/route-accesses/create` | `Admin/RouteAccesses/Create.jsx` |
| A | `/admin/route-accesses/edit/{routeAccess}` | `Admin/RouteAccesses/Edit.jsx` |
| A | `/admin/settings` | `Admin/Settings/Edit.jsx` |
| A | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| A | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| A | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| A | `/admin/units` | `Admin/Units/Index.jsx` |
| A | `/admin/units/create` | `Admin/Units/Create.jsx` |
| A | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| B | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Pejabat / Eksekutif - 26 tampilan (23 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### OPD / Instansi Terkait - 25 tampilan (22 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| A | `/dashboard` | `Opd/Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/home` | `Home.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/landing` | `Landing.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| B | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| B | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| A | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

## Semua berkas halaman

### A - Dirombak penuh (80)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Agencies/Create.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Agencies/Edit.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Agencies/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) + AlertDialog |
| `resources/js/Pages/Admin/Announcements/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Announcements/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Announcements/Index.jsx` | Tabel ramping: di ponsel tinggal 3 kolom inti dalam kartu bergaris tipis; kolom sekunder mulai md |
| `resources/js/Pages/Admin/AssignPermissions/Edit.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/AssignPermissions/Index.jsx` | Kartu ponsel ala /admin/users, cari type=search |
| `resources/js/Pages/Admin/Banjars/Form.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Banjars/Index.jsx` | Satu daftar bergrup + AlertDialog |
| `resources/js/Pages/Admin/Dashboard.jsx` | Statistik ala widget, StandbyCard; ponsel: angka + label, insiden maks 5 |
| `resources/js/Pages/Admin/FireStations/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer; peta desktop saja |
| `resources/js/Pages/Admin/Forum/Index.jsx` | Tab segmented control; antrean moderasi satu daftar bergrup, aksi bertint (bagian 24) |
| `resources/js/Pages/Admin/Hydrants/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer; peta desktop saja |
| `resources/js/Pages/Admin/Mail/Settings.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/MailContacts/Create.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/MailContacts/Edit.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/MailContacts/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) + AlertDialog |
| `resources/js/Pages/Admin/NotificationLevel/Edit.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Permissions/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Permissions/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Permissions/Index.jsx` | Kartu ponsel ala /admin/users (tanpa pita abu, Ubah), cari type=search |
| `resources/js/Pages/Admin/Pumps/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Pumps/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Pumps/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer; peta desktop saja |
| `resources/js/Pages/Admin/Reports/Index.jsx` | Baris ala Mail iOS (judul utuh, umur di kanan, lencana pil di baris sendiri), banner triase bertint, chip digeser di ponsel; ponsel tanpa peta - ketuk baris = detail (bagian 15) |
| `resources/js/Pages/Admin/Roles/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Roles/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Roles/Index.jsx` | Kartu ponsel ala /admin/users (tanpa pita abu, Ubah), cari type=search |
| `resources/js/Pages/Admin/RouteAccesses/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/RouteAccesses/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/RouteAccesses/Index.jsx` | Kartu ponsel ala /admin/users (tanpa pita abu, Ubah), cari type=search |
| `resources/js/Pages/Admin/Settings/Edit.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Tenants/Form.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Tenants/Index.jsx` | Tabel ramping: di ponsel tinggal 3 kolom inti dalam kartu bergaris tipis; kolom sekunder mulai md |
| `resources/js/Pages/Admin/Units/Create.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Units/Edit.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Units/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) + AlertDialog |
| `resources/js/Pages/Admin/Users/Create.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Edit.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Index.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Auth/ConfirmPassword.jsx` | Grup isian ala layar masuk iOS (satu kartu bergaris rambut, label di dalam baris, isian 17px), ikon aplikasi, tombol 48px |
| `resources/js/Pages/Auth/ForgotPassword.jsx` | Grup isian ala layar masuk iOS (satu kartu bergaris rambut, label di dalam baris, isian 17px), ikon aplikasi, tombol 48px |
| `resources/js/Pages/Auth/Login.jsx` | Grup isian ala layar masuk iOS (satu kartu bergaris rambut, label di dalam baris, isian 17px), ikon aplikasi, tombol 48px |
| `resources/js/Pages/Auth/Register.jsx` | Grup isian ala layar masuk iOS (satu kartu bergaris rambut, label di dalam baris, isian 17px), ikon aplikasi, tombol 48px |
| `resources/js/Pages/Auth/ResetPassword.jsx` | Grup isian ala layar masuk iOS (satu kartu bergaris rambut, label di dalam baris, isian 17px), ikon aplikasi, tombol 48px |
| `resources/js/Pages/Auth/VerifyEmail.jsx` | Layar pesan iOS: ikon dalam lingkaran, judul besar, teks 15px, tombol 48px |
| `resources/js/Pages/Dashboard.jsx` | Sapaan, Lapor Darurat, StandbyCard bersakelar; ponsel: riwayat 3 baris, kartu ringkas |
| `resources/js/Pages/ErrorHandling.jsx` | Layar galat iOS tanpa kartu |
| `resources/js/Pages/FireStations/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup; peta desktop saja |
| `resources/js/Pages/Forum/Create.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Forum/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Forum/Show.jsx` | Judul besar, pil, label seksi iOS, isi 15px |
| `resources/js/Pages/Front/Reports/Create.jsx` | Judul besar + 5 kartu bergrup (Lokasi, Wilayah, Jenis, Keterangan, Foto) |
| `resources/js/Pages/Front/Reports/Edit.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Front/Reports/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Front/Reports/Resolution/Create.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Front/Reports/Thanks.jsx` | Layar konfirmasi iOS: ikon sukses di tengah, nomor & waktu sebagai baris |
| `resources/js/Pages/Home.jsx` | Petak pintasan bertint, tanpa <hr>, karusel & judul seksi tipografi iOS |
| `resources/js/Pages/Hydrants/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup; peta desktop saja |
| `resources/js/Pages/Info/About.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Help.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Pricing.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Privacy.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Terms.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Landing.jsx` | Kartu bergaris tipis, teks baca 15/17px, warna CTA & ikon jadi token tema |
| `resources/js/Pages/Mail/Create.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Mail/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Monitoring/Map.jsx` | Gaya Apple Maps: kontrol & panel Lapisan bermaterial, gerak pegas |
| `resources/js/Pages/Opd/Dashboard.jsx` | Daftar bergrup; ponsel tanpa lokasi & kalimat penjelas |
| `resources/js/Pages/Petugas/Dashboard.jsx` | Ponsel: baris misi cuma waktu + jarak; kepala peta material |
| `resources/js/Pages/Profile/CompleteProfile.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Pumps/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup; peta desktop saja |
| `resources/js/Pages/Regu/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Spotlight.jsx` | Judul besar normal-case, CTA 17px, warna dekorasi ikut mode gelap |
| `resources/js/Pages/Volunteers/Index.jsx` | Ponsel: baris kontak (avatar bulat, seluruh kartu bisa diketuk); desktop kisi |

### B - Dirombak sebagian (3)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Front/Reports/Show.jsx` | Bagian atas ala iOS (Informasi insiden bergrup, peta bermaterial, judul panel 17px); panel kanan (OPD terkait, manifes, Laporan Kejadian) masih sub-kartu bergaris |
| `resources/js/Pages/Profile/Edit.jsx` | Kepala & wilayah ala Settings iOS, isian terisi; kartu "Informasi Profil"/sandi/hapus akun masih berkepala kartu web |
| `resources/js/Pages/Volunteers/Show.jsx` | Baris kontak iOS; kartu sampul profil masih gaya web |

### C - Gaya umum saja (0)

| Berkas | Keterangan |
|---|---|

### D - Tidak disentuh (5)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Front/Settings/Create.jsx` | Kode mati (tanpa route) - sengaja tidak dirombak |
| `resources/js/Pages/Front/Settings/Edit.jsx` | Kode mati (tanpa route) - sengaja tidak dirombak |
| `resources/js/Pages/Front/Settings/Index.jsx` | Kode mati (tanpa route) - sengaja tidak dirombak |
| `resources/js/Pages/Guideline.jsx` | Halaman panduan sistem warna - sengaja dikecualikan |
| `resources/js/Pages/Payments/Success.jsx` | Kode mati (tanpa route) - sengaja tidak dirombak |

## Komponen bersama yang ikut dirombak

- `resources/js/Components/HeaderTitle.jsx` - Judul besar ala iOS (dipakai 60 halaman)
- `resources/js/Components/GroupedForm.jsx` - FormSection, FormField, LockedField, SegmentedControl
- `resources/js/Components/StandbyCard.jsx` - Mode Kesiapan bersakelar (dashboard relawan & pejabat)
- `resources/js/Components/AppSection.jsx` - AppGreeting, AppSection, AppList, AppListRow, AppEmpty
- `resources/js/Components/ReportCard.jsx` - Kartu kejadian; ringkas di ponsel
- `resources/js/Components/StatusBadge.jsx` - Status jadi pil
- `resources/js/Components/NavLink.jsx` - Sorotan bertint primer
- `resources/js/Components/ui/*` - Button (tinted, tekan), Card, Table, Badge, Input, Select, Dialog, Popover, Dropdown, Command
- `resources/js/Layouts/AppLayout.jsx` - Header material, sidebar abu tipis, lonceng bulat
- `resources/js/Layouts/Partials/MobileBottomNav.jsx` - Bilah material, slot bereaksi saat ditekan, panel tumbuh dari tombol
- `resources/js/Pages/Profile/Partials/*` - Isian h-11, fokus primer lembut, kepala kartu bertint

## Sisa yang belum dirombak penuh

**Audit visual ulang 2026-10-02 (bagian 16).** Rekap sebelumnya menyatakan 83 halaman "dirombak penuh"
padahal `/admin/reports` dan banyak halaman lain hanya berganti pembungkus (Card -> grup) & kelas.
Seluruh halaman yang bisa dibuka di lokal dipotret di 390x844 per peran (puppeteer-core + Chrome),
lalu yang lama dirombak sungguhan: Detail Insiden (bagian atas), Daftar Relawan, 4 halaman RBAC,
daftar Pengguna di ponsel, 6 daftar fasilitas (judul utuh), 31 form admin (isian terisi), keadaan
kosong, pop-up lokasi, Forum, halaman Info. Status di atas kini dari FOTO, bukan dari riwayat commit.

Masih B (sebagian): Detail Insiden panel kanan, Profil (kartu form), Profil Relawan.

**Belum diverifikasi visual** (tetap A menurut kode, perlu dicek di HP): `/email` & `/email/tulis`
(404 di lokal - fitur email mati), halaman milik warga (`/reports` warga, ubah laporan, terima kasih -
tak ada akun warga di lokal), `/admin/settings` (403 untuk admin), Dashboard OPD (tak ada akun OPD),
Landing (belum dinilai), halaman galat (lokal memakai halaman 404 bawaan Laravel).

D tetap 5 halaman (panduan & kode mati) yang sengaja tidak dirombak.
