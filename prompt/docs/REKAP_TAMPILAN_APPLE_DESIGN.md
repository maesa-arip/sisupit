# Rekap Tampilan per Peran & Status Rombakan apple-design

> Branch `feat/mobile-native-polish` (TASK_69). Dibangkitkan 2026-10-01 dari `php artisan route:list`
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
| A - Dirombak penuh | 19 |
| B - Dirombak sebagian | 42 |
| C - Gaya umum saja | 22 |
| D - Tidak disentuh | 5 |

## Tampilan per peran

### Tamu (belum login) - 18 tampilan (0 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/forgot-password` | `Auth/ForgotPassword.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/login` | `Auth/Login.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/register` | `Auth/Register.jsx` |
| B | `/reset-password/{token}` | `Auth/ResetPassword.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Warga - 27 tampilan (4 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/reports` | `Front/Reports/Index.jsx` |
| C | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Relawan - 28 tampilan (4 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/dashboard` | `Dashboard.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/complete-profile` | `Profile/CompleteProfile.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/reports` | `Front/Reports/Index.jsx` |
| C | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Petugas Damkar - 36 tampilan (8 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/dashboard` | `Petugas/Dashboard.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/email/tulis` | `Mail/Create.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/email` | `Mail/Index.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/regu` | `Regu/Index.jsx` |
| C | `/relawan` | `Volunteers/Index.jsx` |
| C | `/relawan/{id}` | `Volunteers/Show.jsx` |
| C | `/reports` | `Front/Reports/Index.jsx` |
| C | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Admin - 81 tampilan (20 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/admin/fire-stations` | `Admin/FireStations/Index.jsx` |
| A | `/admin/fire-stations/create` | `Admin/FireStations/Create.jsx` |
| A | `/admin/fire-stations/{fire_station}/edit` | `Admin/FireStations/Edit.jsx` |
| A | `/admin/hydrant-warga` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrant-warga/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrant-warga/{hydrant_warga}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/pumps` | `Admin/Pumps/Index.jsx` |
| A | `/admin/pumps/create` | `Admin/Pumps/Create.jsx` |
| A | `/admin/pumps/{pump}/edit` | `Admin/Pumps/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| B | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| B | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
| B | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| B | `/admin/announcements/create` | `Admin/Announcements/Create.jsx` |
| B | `/admin/announcements/edit/{announcement}` | `Admin/Announcements/Edit.jsx` |
| B | `/admin/assign-permissions` | `Admin/AssignPermissions/Index.jsx` |
| B | `/admin/assign-permissions/edit/{role}` | `Admin/AssignPermissions/Edit.jsx` |
| B | `/admin/banjars` | `Admin/Banjars/Index.jsx` |
| B | `/admin/banjars/create` | `Admin/Banjars/Form.jsx` |
| B | `/admin/banjars/{banjar}/edit` | `Admin/Banjars/Form.jsx` |
| B | `/admin/email` | `Admin/Mail/Settings.jsx` |
| B | `/admin/mail-contacts` | `Admin/MailContacts/Index.jsx` |
| B | `/admin/mail-contacts/create` | `Admin/MailContacts/Create.jsx` |
| B | `/admin/mail-contacts/{mail_contact}/edit` | `Admin/MailContacts/Edit.jsx` |
| B | `/admin/notifikasi-petugas` | `Admin/NotificationLevel/Edit.jsx` |
| B | `/admin/permissions` | `Admin/Permissions/Index.jsx` |
| B | `/admin/permissions/create` | `Admin/Permissions/Create.jsx` |
| B | `/admin/permissions/edit/{permission}` | `Admin/Permissions/Edit.jsx` |
| B | `/admin/reports` | `Admin/Reports/Index.jsx` |
| B | `/admin/roles` | `Admin/Roles/Index.jsx` |
| B | `/admin/roles/create` | `Admin/Roles/Create.jsx` |
| B | `/admin/roles/edit/{role}` | `Admin/Roles/Edit.jsx` |
| B | `/admin/route-accesses` | `Admin/RouteAccesses/Index.jsx` |
| B | `/admin/route-accesses/create` | `Admin/RouteAccesses/Create.jsx` |
| B | `/admin/route-accesses/edit/{routeAccess}` | `Admin/RouteAccesses/Edit.jsx` |
| B | `/admin/settings` | `Admin/Settings/Edit.jsx` |
| B | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| B | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| B | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| B | `/admin/units` | `Admin/Units/Index.jsx` |
| B | `/admin/units/create` | `Admin/Units/Create.jsx` |
| B | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/email/tulis` | `Mail/Create.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/admin/forum` | `Admin/Forum/Index.jsx` |
| C | `/email` | `Mail/Index.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/regu` | `Regu/Index.jsx` |
| C | `/relawan` | `Volunteers/Index.jsx` |
| C | `/relawan/{id}` | `Volunteers/Show.jsx` |
| C | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Superadmin - 81 tampilan (20 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/admin/fire-stations` | `Admin/FireStations/Index.jsx` |
| A | `/admin/fire-stations/create` | `Admin/FireStations/Create.jsx` |
| A | `/admin/fire-stations/{fire_station}/edit` | `Admin/FireStations/Edit.jsx` |
| A | `/admin/hydrant-warga` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrant-warga/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrant-warga/{hydrant_warga}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/hydrants` | `Admin/Hydrants/Index.jsx` |
| A | `/admin/hydrants/create` | `Admin/Hydrants/Create.jsx` |
| A | `/admin/hydrants/{hydrant}/edit` | `Admin/Hydrants/Edit.jsx` |
| A | `/admin/pumps` | `Admin/Pumps/Index.jsx` |
| A | `/admin/pumps/create` | `Admin/Pumps/Create.jsx` |
| A | `/admin/pumps/{pump}/edit` | `Admin/Pumps/Edit.jsx` |
| A | `/admin/users` | `Admin/Users/Index.jsx` |
| A | `/admin/users/create` | `Admin/Users/Create.jsx` |
| A | `/admin/users/edit/{user}` | `Admin/Users/Edit.jsx` |
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/admin/agencies` | `Admin/Agencies/Index.jsx` |
| B | `/admin/agencies/create` | `Admin/Agencies/Create.jsx` |
| B | `/admin/agencies/{agency}/edit` | `Admin/Agencies/Edit.jsx` |
| B | `/admin/announcements` | `Admin/Announcements/Index.jsx` |
| B | `/admin/announcements/create` | `Admin/Announcements/Create.jsx` |
| B | `/admin/announcements/edit/{announcement}` | `Admin/Announcements/Edit.jsx` |
| B | `/admin/assign-permissions` | `Admin/AssignPermissions/Index.jsx` |
| B | `/admin/assign-permissions/edit/{role}` | `Admin/AssignPermissions/Edit.jsx` |
| B | `/admin/banjars` | `Admin/Banjars/Index.jsx` |
| B | `/admin/banjars/create` | `Admin/Banjars/Form.jsx` |
| B | `/admin/banjars/{banjar}/edit` | `Admin/Banjars/Form.jsx` |
| B | `/admin/email` | `Admin/Mail/Settings.jsx` |
| B | `/admin/mail-contacts` | `Admin/MailContacts/Index.jsx` |
| B | `/admin/mail-contacts/create` | `Admin/MailContacts/Create.jsx` |
| B | `/admin/mail-contacts/{mail_contact}/edit` | `Admin/MailContacts/Edit.jsx` |
| B | `/admin/notifikasi-petugas` | `Admin/NotificationLevel/Edit.jsx` |
| B | `/admin/permissions` | `Admin/Permissions/Index.jsx` |
| B | `/admin/permissions/create` | `Admin/Permissions/Create.jsx` |
| B | `/admin/permissions/edit/{permission}` | `Admin/Permissions/Edit.jsx` |
| B | `/admin/reports` | `Admin/Reports/Index.jsx` |
| B | `/admin/roles` | `Admin/Roles/Index.jsx` |
| B | `/admin/roles/create` | `Admin/Roles/Create.jsx` |
| B | `/admin/roles/edit/{role}` | `Admin/Roles/Edit.jsx` |
| B | `/admin/route-accesses` | `Admin/RouteAccesses/Index.jsx` |
| B | `/admin/route-accesses/create` | `Admin/RouteAccesses/Create.jsx` |
| B | `/admin/route-accesses/edit/{routeAccess}` | `Admin/RouteAccesses/Edit.jsx` |
| B | `/admin/settings` | `Admin/Settings/Edit.jsx` |
| B | `/admin/tenants` | `Admin/Tenants/Index.jsx` |
| B | `/admin/tenants/create` | `Admin/Tenants/Form.jsx` |
| B | `/admin/tenants/edit/{tenant}` | `Admin/Tenants/Form.jsx` |
| B | `/admin/units` | `Admin/Units/Index.jsx` |
| B | `/admin/units/create` | `Admin/Units/Create.jsx` |
| B | `/admin/units/{unit}/edit` | `Admin/Units/Edit.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/email/tulis` | `Mail/Create.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/admin/forum` | `Admin/Forum/Index.jsx` |
| C | `/email` | `Mail/Index.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/regu` | `Regu/Index.jsx` |
| C | `/relawan` | `Volunteers/Index.jsx` |
| C | `/relawan/{id}` | `Volunteers/Show.jsx` |
| C | `/reports/edit/{report}` | `Front/Reports/Edit.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/reports/{report}/resolution/create` | `Front/Reports/Resolution/Create.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### Pejabat / Eksekutif - 26 tampilan (5 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/dashboard` | `Admin/Dashboard.jsx` |
| A | `/peta-pemantauan` | `Monitoring/Map.jsx` |
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/reports (mode pemantau)` | `Admin/Reports/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

### OPD / Instansi Terkait - 25 tampilan (3 dirombak penuh)

| Status | URL | Berkas halaman |
|---|---|---|
| A | `/profile` | `Profile/Edit.jsx` |
| A | `/reports/create` | `Front/Reports/Create.jsx` |
| A | `/reports/show/{report}` | `Front/Reports/Show.jsx` |
| B | `/confirm-password` | `Auth/ConfirmPassword.jsx` |
| B | `/dashboard` | `Opd/Dashboard.jsx` |
| B | `/fire-stations` | `FireStations/Index.jsx` |
| B | `/hydrants` | `Hydrants/Index.jsx` |
| B | `/pumps` | `Pumps/Index.jsx` |
| B | `/verify-email` | `Auth/VerifyEmail.jsx` |
| C | `(halaman galat 403/404/500)` | `ErrorHandling.jsx` |
| C | `/` | `Spotlight.jsx` |
| C | `/forum` | `Forum/Index.jsx` |
| C | `/forum/tanya` | `Forum/Create.jsx` |
| C | `/forum/{thread}` | `Forum/Show.jsx` |
| C | `/home` | `Home.jsx` |
| C | `/kebijakan-privasi` | `Info/Privacy.jsx` |
| C | `/landing` | `Landing.jsx` |
| C | `/paket-lisensi` | `Info/Pricing.jsx` |
| C | `/pusat-bantuan` | `Info/Help.jsx` |
| C | `/reports` | `Front/Reports/Index.jsx` |
| C | `/reports/thanks/{report}` | `Front/Reports/Thanks.jsx` |
| C | `/spotlight` | `Spotlight.jsx` |
| C | `/syarat-ketentuan` | `Info/Terms.jsx` |
| C | `/tentang` | `Info/About.jsx` |
| D | `/guideline` | `Guideline.jsx` |

## Semua berkas halaman

### A - Dirombak penuh (19)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Dashboard.jsx` | Statistik ala widget, StandbyCard; ponsel: angka + label, insiden maks 5 |
| `resources/js/Pages/Admin/FireStations/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/FireStations/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
| `resources/js/Pages/Admin/Hydrants/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Hydrants/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
| `resources/js/Pages/Admin/Pumps/Create.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Pumps/Edit.jsx` | Kartu tunggal dipecah: Cari lokasi, Area yurisdiksi, Detail fasilitas, Koordinat |
| `resources/js/Pages/Admin/Pumps/Index.jsx` | Daftar satu kartu bergrup, AlertDialog, cari type=search, chip & paginasi primer |
| `resources/js/Pages/Admin/Users/Create.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Edit.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Admin/Users/Index.jsx` | Form bergrup (GroupedForm), segmented control, aksi ikon, label peran, arah urut |
| `resources/js/Pages/Dashboard.jsx` | Sapaan, Lapor Darurat, StandbyCard bersakelar; ponsel: riwayat 3 baris, kartu ringkas |
| `resources/js/Pages/Front/Reports/Create.jsx` | Judul besar + 5 kartu bergrup (Lokasi, Wilayah, Jenis, Keterangan, Foto) |
| `resources/js/Pages/Front/Reports/Show.jsx` | Bilah navigasi iOS, judul besar, status pil, modal & label apple |
| `resources/js/Pages/Monitoring/Map.jsx` | Gaya Apple Maps: kontrol & panel Lapisan bermaterial, gerak pegas |
| `resources/js/Pages/Petugas/Dashboard.jsx` | Ponsel: baris misi cuma waktu + jarak; kepala peta material |
| `resources/js/Pages/Profile/Edit.jsx` | Tata letak ala Settings iOS; Keluar jadi baris merah di bawah |

### B - Dirombak sebagian (42)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Agencies/Create.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/Agencies/Edit.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/Agencies/Index.jsx` | Modal hapus jadi AlertDialog; daftar lama |
| `resources/js/Pages/Admin/Announcements/Create.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Announcements/Edit.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Announcements/Index.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/AssignPermissions/Edit.jsx` | Tombol & kartu form diseragamkan, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/AssignPermissions/Index.jsx` | Tombol & kartu form diseragamkan, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Banjars/Form.jsx` | Tombol Simpan/Atur ulang & kartu diseragamkan; isian lama |
| `resources/js/Pages/Admin/Banjars/Index.jsx` | Modal hapus jadi AlertDialog; daftar lama |
| `resources/js/Pages/Admin/Mail/Settings.jsx` | Tombol Simpan/Atur ulang & kartu diseragamkan; isian lama |
| `resources/js/Pages/Admin/MailContacts/Create.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/MailContacts/Edit.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/MailContacts/Index.jsx` | Modal hapus jadi AlertDialog; daftar lama |
| `resources/js/Pages/Admin/NotificationLevel/Edit.jsx` | Tombol Simpan/Atur ulang & kartu diseragamkan; isian lama |
| `resources/js/Pages/Admin/Permissions/Create.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Permissions/Edit.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Permissions/Index.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Reports/Index.jsx` | Aksen seleksi primer, cari type=search; tata letak triase lama |
| `resources/js/Pages/Admin/Roles/Create.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Roles/Edit.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Roles/Index.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/RouteAccesses/Create.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/RouteAccesses/Edit.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/RouteAccesses/Index.jsx` | Tombol Kembali/Simpan/Atur ulang, kartu form max-w-2xl, teks Indonesia; tata letak lama |
| `resources/js/Pages/Admin/Settings/Edit.jsx` | Tombol Simpan/Atur ulang & kartu diseragamkan; isian lama |
| `resources/js/Pages/Admin/Tenants/Form.jsx` | Tombol Simpan/Atur ulang & kartu diseragamkan; isian lama |
| `resources/js/Pages/Admin/Tenants/Index.jsx` | Tombol tambah pil; tabel lama |
| `resources/js/Pages/Admin/Units/Create.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/Units/Edit.jsx` | Tombol Kembali/Simpan, kartu form max-w-2xl; isian lama |
| `resources/js/Pages/Admin/Units/Index.jsx` | Modal hapus jadi AlertDialog; daftar lama |
| `resources/js/Pages/Auth/ConfirmPassword.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/Auth/ForgotPassword.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/Auth/Login.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/Auth/Register.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/Auth/ResetPassword.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/Auth/VerifyEmail.jsx` | Judul besar, fokus primer lembut, tombol bereaksi; tata letak dua kolom lama |
| `resources/js/Pages/FireStations/Index.jsx` | Daftar jadi satu kartu bergrup + cari type=search; kartu filter atas masih bentuk lama |
| `resources/js/Pages/Hydrants/Index.jsx` | Daftar jadi satu kartu bergrup + cari type=search; kartu filter atas masih bentuk lama |
| `resources/js/Pages/Mail/Create.jsx` | Tombol Kembali/Simpan & kartu form diseragamkan; isian lama |
| `resources/js/Pages/Opd/Dashboard.jsx` | Ikut AppSection baru + kotak peringatan 2xl |
| `resources/js/Pages/Pumps/Index.jsx` | Daftar jadi satu kartu bergrup + cari type=search; kartu filter atas masih bentuk lama |

### C - Gaya umum saja (22)

| Berkas | Keterangan |
|---|---|
| `resources/js/Pages/Admin/Forum/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/ErrorHandling.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Forum/Create.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Forum/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Forum/Show.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Front/Reports/Edit.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Front/Reports/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Front/Reports/Resolution/Create.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Front/Reports/Thanks.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Home.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Info/About.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Info/Help.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Info/Pricing.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Info/Privacy.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Info/Terms.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Landing.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Mail/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Profile/CompleteProfile.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Regu/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Spotlight.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Volunteers/Index.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |
| `resources/js/Pages/Volunteers/Show.jsx` | Hanya lewat primitif & sapuan (tombol, kartu, radius, tipografi, judul); tata letak tak disentuh |

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

## Kandidat rombakan berikutnya (status C yang paling sering dibuka)

1. `Front/Reports/Index` - Riwayat/daftar laporan - dibuka warga, relawan, petugas, OPD
1. `Front/Reports/Resolution/Create` - Laporan Kejadian / berita acara - form panjang petugas
1. `Front/Reports/Thanks` - Layar terima kasih sesudah melapor
1. `Profile/CompleteProfile` - Layar pertama setiap akun baru
1. `Volunteers/Index & Show` - Daftar relawan untuk staf
1. `Regu/Index` - Manajemen regu & danru
1. `Forum/Index, Show, Create` - Forum warga (bila fitur dinyalakan per kabupaten)
1. `Front/Reports/Edit` - Ubah laporan oleh pelapor - kembaran Form Lapor yang sudah dirombak
