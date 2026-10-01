# Rekap Tampilan per Peran & Status Rombakan apple-design

> Branch `feat/mobile-native-polish` (TASK_69). Diperbarui 2026-10-02 (bagian 12: halaman B & C dirombak). Sumber: `php artisan route:list`
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
| A - Dirombak penuh | 73 |
| B - Dirombak sebagian | 10 |
| C - Gaya umum saja | 0 |
| D - Tidak disentuh | 5 |

## Tampilan per peran

### Tamu (belum login) - 18 tampilan (11 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/forgot-password` | `Auth/ForgotPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/login` | `Auth/Login.jsx` |
| B | `/register` | `Auth/Register.jsx` |
| B | `/reset-password/{token}` | `Auth/ResetPassword.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Warga - 27 tampilan (22 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Relawan - 28 tampilan (23 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Petugas Damkar - 36 tampilan (31 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/dashboard` | `Petugas/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| A | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Admin - 81 tampilan (74 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| A | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| A | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
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
| A | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| A | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| A | `/admin/units` | `Admin/Units/Index.jsx` |
| A | `/admin/units/create` | `Admin/Units/Create.jsx` |
| A | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| A | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| B | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Superadmin - 81 tampilan (74 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| A | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| A | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
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
| A | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| A | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| A | `/admin/units` | `Admin/Units/Index.jsx` |
| A | `/admin/units/create` | `Admin/Units/Create.jsx` |
| A | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/email` | `Mail/Index.jsx` |
| A | `/email/tulis` | `Mail/Create.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/regu` | `Regu/Index.jsx` |
| A | `/relawan` | `Volunteers/Index.jsx` |
| A | `/relawan/{id}` | `Volunteers/Show.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| B | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Pejabat / Eksekutif - 26 tampilan (21 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### OPD / Instansi Terkait - 25 tampilan (20 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| A | `/` | `Spotlight.jsx` |
| A | `/dashboard` | `Opd/Dashboard.jsx` |
| A | `/fire-stations` | `FireStations/Index.jsx` |
| A | `/forum` | `Forum/Index.jsx` |
| A | `/forum/tanya` | `Forum/Create.jsx` |
| A | `/forum/{thread}` | `Forum/Show.jsx` |
| A | `/hydrants` | `Hydrants/Index.jsx` |
| A | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| A | `/paket-lisensi` | `Info/Pricing.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/pumps` | `Pumps/Index.jsx` |
| A | `/pusat-bantuan` | `Info/Help.jsx` |
| A | `/reports` | `Front/Reports/Index.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| A | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| A | `/spotlight` | `Spotlight.jsx` |
| A | `/syarat-ketentuan` | `Info/Terms.jsx` |
| A | `/tentang` | `Info/About.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/home` | `Home.jsx` |
| B | `/landing` | `Landing.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| D | `/guideline` | `Guideline.jsx` |

## Semua berkas halaman

### A - Dirombak penuh (73)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Agencies/Create.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Agencies/Edit.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Agencies/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) + AlertDialog |
| `resources/js/Pages/Admin/Announcements/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Announcements/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/AssignPermissions/Edit.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/AssignPermissions/Index.jsx` | Kartu ponsel ala /admin/users, cari type=search |
| `resources/js/Pages/Admin/Banjars/Form.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Banjars/Index.jsx` | Satu daftar bergrup + AlertDialog |
| `resources/js/Pages/Admin/Dashboard.jsx` | Statistik ala widget, StandbyCard; ponsel: angka + label, insiden maks 5 |
| `resources/js/Pages/Admin/FireStations/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
| `resources/js/Pages/Admin/Forum/Index.jsx` | Tab segmented control, pil, tipografi baca; kartu moderasi sengaja dipertahankan |
| `resources/js/Pages/Admin/Hydrants/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
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
| `resources/js/Pages/Admin/Pumps/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
| `resources/js/Pages/Admin/Reports/Index.jsx` | Triase: satu daftar bergrup (+keyboard), metadata ringkas di ponsel, peta bermaterial |
| `resources/js/Pages/Admin/Roles/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Roles/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/Roles/Index.jsx` | Kartu ponsel ala /admin/users (tanpa pita abu, Ubah), cari type=search |
| `resources/js/Pages/Admin/RouteAccesses/Create.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/RouteAccesses/Edit.jsx` | Form bergaris rambut ala iOS (tiap isian/grup satu baris), tombol standar |
| `resources/js/Pages/Admin/RouteAccesses/Index.jsx` | Kartu ponsel ala /admin/users (tanpa pita abu, Ubah), cari type=search |
| `resources/js/Pages/Admin/Settings/Edit.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Tenants/Form.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Admin/Units/Create.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Units/Edit.jsx` | Form bergaris rambut ala iOS, kartu max-w-2xl |
| `resources/js/Pages/Admin/Units/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) + AlertDialog |
| `resources/js/Pages/Admin/Users/Create.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Edit.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Index.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Dashboard.jsx` | Sapaan, Lapor Darurat, StandbyCard bersakelar; ponsel: riwayat 3 baris, kartu ringkas |
| `resources/js/Pages/ErrorHandling.jsx` | Layar galat iOS tanpa kartu |
| `resources/js/Pages/FireStations/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup |
| `resources/js/Pages/Forum/Create.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Forum/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Forum/Show.jsx` | Judul besar, pil, label seksi iOS, isi 15px |
| `resources/js/Pages/Front/Reports/Create.jsx` | Judul besar + 5 kartu bergrup (Lokasi, Wilayah, Jenis, Keterangan, Foto) |
| `resources/js/Pages/Front/Reports/Edit.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Front/Reports/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Front/Reports/Resolution/Create.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Front/Reports/Show.jsx` | Bilah navigasi iOS, judul besar, status pil, modal & label apple |
| `resources/js/Pages/Front/Reports/Thanks.jsx` | Layar konfirmasi iOS: ikon sukses di tengah, nomor & waktu sebagai baris |
| `resources/js/Pages/Hydrants/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup |
| `resources/js/Pages/Info/About.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Help.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Pricing.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Privacy.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Info/Terms.jsx` | InfoShell: lebar baca max-w-3xl, teks 15px, judul seksi 17px, pil |
| `resources/js/Pages/Mail/Create.jsx` | Form bergaris rambut ala iOS, tombol standar |
| `resources/js/Pages/Mail/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Monitoring/Map.jsx` | Gaya Apple Maps: kontrol & panel Lapisan bermaterial, gerak pegas |
| `resources/js/Pages/Opd/Dashboard.jsx` | Daftar bergrup; ponsel tanpa lokasi & kalimat penjelas |
| `resources/js/Pages/Petugas/Dashboard.jsx` | Ponsel: baris misi cuma waktu + jarak; kepala peta material |
| `resources/js/Pages/Profile/CompleteProfile.jsx` | Form bergaris rambut ala iOS |
| `resources/js/Pages/Profile/Edit.jsx` | Tata letak ala Settings iOS; Keluar jadi baris merah di bawah |
| `resources/js/Pages/Pumps/Index.jsx` | Kolom cari ala iOS tanpa kartu, tombol terdekat bertint, daftar bergrup |
| `resources/js/Pages/Regu/Index.jsx` | Satu daftar bergrup (dulu kartu terpisah) |
| `resources/js/Pages/Spotlight.jsx` | Judul besar normal-case, CTA 17px, warna dekorasi ikut mode gelap |
| `resources/js/Pages/Volunteers/Index.jsx` | Ponsel: baris kontak (avatar bulat, seluruh kartu bisa diketuk); desktop kisi |
| `resources/js/Pages/Volunteers/Show.jsx` | Kartu kontak iOS: avatar bulat, tombol kontak, baris informasi |

### B - Dirombak sebagian (10)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Announcements/Index.jsx` | Tabel superadmin: kolom sekunder disembunyikan di ponsel; masih tabel |
| `resources/js/Pages/Admin/Tenants/Index.jsx` | Tabel superadmin: kolom sekunder disembunyikan di ponsel; masih tabel |
| `resources/js/Pages/Auth/ConfirmPassword.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Auth/ForgotPassword.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Auth/Login.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Auth/Register.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Auth/ResetPassword.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Auth/VerifyEmail.jsx` | Ikon aplikasi (Login/Daftar), judul besar, fokus lembut; tata letak dua kolom dipertahankan |
| `resources/js/Pages/Home.jsx` | Halaman pemasaran: sapuan token & warna mode gelap; tata letak lama |
| `resources/js/Pages/Landing.jsx` | Halaman pemasaran: sapuan token & warna mode gelap; tata letak lama |

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

## Sisa yang belum dirombak penuh (status B)

1. `Auth/* (6 halaman)` - Tata letak dua kolom (form + foto) dipertahankan; baru ikon aplikasi, judul, fokus
1. `Landing, Home` - Halaman pemasaran; baru sapuan token & perbaikan warna mode gelap
1. `Admin/Announcements/Index, Admin/Tenants/Index` - Tabel superadmin; kolom sekunder disembunyikan di ponsel, masih berupa tabel
