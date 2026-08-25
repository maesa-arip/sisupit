# Sisupit DAMKAR — CLAUDE CODE INSTRUCTIONS (EXISTING APP)

Sistem Informasi Kesiapsiagaan untuk Pemadam Kebakaran Terintegrasi — platform pelaporan
dan koordinasi kebakaran/darurat real-time. Warga melapor → Pusat Komando (petugas/admin)
memvalidasi → petugas/relawan merespons dengan tracking lokasi live → insiden ditutup.

<!-- Diisi saat onboarding (TASK_01, 2026-06-25). Ini "otak permanen" untuk bekerja di repo ini. -->

Saat sesi dimulai, baca file berikut secara penuh sebelum melakukan apapun:
1. `prompt/MASTER_PROMPT.md` — disiplin perubahan, standar audit, keamanan regresi
2. `prompt/docs/ARCHITECTURE_MAP.md` — peta codebase (modul, alur request, entitas, route, auth)
3. `prompt/docs/CONVENTIONS.md` — pola yang WAJIB ditiru + anti-pola yang ada
3b. `prompt/docs/PENGECUALIAN_ATURAN.md` — daftar aturan yang SENGAJA ditekuk atas persetujuan
   user (jangan "perbaiki" pengecualian ini diam-diam; kalau menemukan pelanggaran baru,
   konfirmasi ke user dulu beserta alasannya, lalu catat di sana)
4. `.claude/skills/sisupit-ui/SKILL.md` — konvensi frontend (otomatis aktif saat menyentuh `resources/js/`)
5. File task aktif yang tertera di STATUS di bawah (jika ada)

Setelah membaca, ringkas dalam 3–5 poin rencanamu untuk task ini, lalu
**tunggu konfirmasi sebelum mengedit kode apapun**.

---

## STATUS SAAT INI

```
Task aktif   : TASK_36 (prompt/tasks/TASK_36_keterangan_hidran.md) — SELESAI (kode)
                2026-08-25. Permintaan user: ganti keterangan dua jenis hidran di menu admin.
                Hidran = "dimiliki pemerintah <wilayah>, dikelola PDAM & Damkar"; Hidran Warga =
                "potensi sumber air ... perorangan/swasta". Yang PENTING: nama kota TIDAK
                dipaku — variants.jsx satu berkas untuk SEMUA tenant, jadi "Kota Denpasar"
                yang ditulis mati akan terbaca juga oleh admin Badung tanpa gejala apa pun.
                Ditanyakan ke user → pilih "ikut nama instansi tenant". Tabel tenants tak punya
                kolom nama wilayah, jadi helper BARU tenantWilayah() mengambil EKOR
                `nama_instansi` ("...Kota Denpasar" → "Kota Denpasar"); nama instansi bisa
                disunting admin lewat /admin/tenants sehingga kegagalan pencocokan jatuh ke
                "daerah setempat" — kalimatnya tetap utuh, tak pernah rusak. `subtitle` kedua
                varian jadi FUNGSI (bukan string) supaya pemanggil tak perlu tahu varian mana
                yang dinamis — mencegah lahirnya `if (variant === 'warga')` yang memang
                dihindari berkas itu. `blurb` dirampingkan jadi "di mana datanya muncul" saja
                agar tak ada dua kalimat yang mengatakan hal sama di satu halaman. Subtitle
                halaman publik /hydrants SENGAJA tak disentuh (kalimat pencarian warga, bukan
                definisi kepemilikan). Penjaga: test di TenantBrandingTest.
                Test 262 → 263 passed (1012 assertions), npm run build lulus.
                TERDEPLOY 2026-08-25 @410697e2 ke prod/staging/dev; chunk produksi diperiksa
                dan NOL memuat "Kota Denpasar" (bukti nama dirangkai runtime, bukan ter-bake).
                SISA: verifikasi visual §5.
               TASK_35 (prompt/tasks/TASK_35_bottomnav_tombol_masuk_tamu.md) — SELESAI (kode)
                2026-08-25. Permintaan user: "saat belum login menu jadi tombol login, jika
                sudah login baru jadi menu". Slot ke-5 MobileBottomNav kini dua wujud —
                tombol "Masuk" bagi tamu, popover "Menu" bagi yang sudah login. Bagi pengguna
                yang sudah login TIDAK ADA yang berubah. Tujuan tombol TIDAK dipaku: diambil
                dari item `login` navItems.js (aturan #71) dan kalau item itu hilang slotnya
                jatuh kembali jadi popover, bukan tombol mati; `login` sengaja TIDAK masuk
                BAR_ITEM_KEYS (daftar itu cuma menyaring isi popover, dan MobileNavParityTest
                mematok jumlah kuncinya = 8). HARGA yang disetujui user lewat pratinjau dua
                bentuk (alternatifnya: geser Menu ke slot Riwayat — DITOLAK): bagi tamu empat
                tautan legal hanya lewat footer AppLayout dan "Daftar Baru" hanya lewat tautan
                di halaman login. KEDUANYA satu-satunya jalan tersisa — kalau footer legal atau
                tautan daftar itu dihapus/dipindah, menu-menu itu hilang dari ponsel tanpa
                gejala apa pun (mekanisme #71). Tabelnya ada di §4 file task.
                Test 260 → 261 passed, npm run build lulus.
                TERDEPLOY 2026-08-25 @208c0e26 ke prod/staging/dev (frontend saja, tanpa
                migrasi/route). SISA: verifikasi visual §6.
                ADENDUM (§8 file task, permintaan user hari yang sama): tamu yang mengetuk
                "Fasilitas" KEHILANGAN bilah bawah — bukan salah bilahnya, tapi LAYOUT halaman
                tujuannya. Tiga halaman fasilitas + Info/Partials/InfoShell.jsx (5 halaman
                info/legal) memakai layout adaptif `tamu → PublicLayout, login → AppLayout`,
                dan PublicLayout (chrome landing) memang tak merender MobileBottomNav. Jadi
                bilah mengantar tamu ke tempat yang membuang bilah itu sendiri — dan sejak
                TASK_35 jalur footer → halaman legal justru satu-satunya jalan tamu ke sana.
                Keempat berkas kini SELALU AppLayout; konten halaman tidak disentuh, pengguna
                yang sudah login tak merasakan apa pun. PublicLayout TIDAK dihapus: pemakainya
                tinggal Pages/Landing.jsx (/landing) dan docblock-nya kini menyebut dirinya
                pemakai tunggal — JANGAN pakai ulang untuk halaman yang bisa dicapai dari
                bilah bawah. Penjaga: test kelima di MobileNavParityTest.
                Test 261 → 262 passed (1010 assertions). TERDEPLOY 2026-08-25 @6e75dd4e ke
                prod/staging/dev. LANJUTAN (permintaan user setelah melihat hasilnya):
                percabangan `isGuest` di BADAN tiga halaman fasilitas IKUT DIBUANG — dulu tamu
                dapat hero PublicPageHeader + max-w-6xl (bertumpuk dengan container AppLayout),
                yang login dapat HeaderTitle + lebar penuh; kini satu wajah untuk semua, yaitu
                wajah yang sudah login. PublicPageHeader TETAP dipakai kelima halaman
                info/legal lewat InfoShell — jangan dihapus.
                Penyeragaman ini TERDEPLOY 2026-08-25 @020c4021 ke prod/staging/dev.
               TASK_34 (prompt/tasks/TASK_34_notifikasi_pejabat.md) — SELESAI (kode)
                2026-08-25. Temuan #77: peran `pejabat` TIDAK PERNAH menerima notifikasi apa
                pun — keempat jalur notif (laporan masuk, broadcast, konfirmasi OPD, notif
                pelapor) tak satu pun menyebutnya, jadi lonceng webnya selalu kosong tanpa
                gejala. Penyaringan peran ada di PEMANGGIL (`User::role('petugas'|'relawan')`),
                bukan di scopeNotifiableForReport — scope-nya sendiri sudah siap melayani
                pejabat lewat User::STAFF_ROLES. Akar kedua: routes/channels.php masih
                `['admin','superadmin','petugas']` padahal #41 sudah membuka halaman detail
                insiden untuk pejabat → halamannya terbuka tapi badge status & marker responder
                DIAM (satu-satunya jejak: /broadcasting/auth 403). Ini kekambuhan bentuk #41;
                saat menambah peran ke sebuah kemampuan, telusuri SEMUA gerbangnya (halaman,
                channel, notifikasi, navigasi). Fix: blok penerima ketiga di approve() dengan
                kunci setting SENDIRI `Setting::KEY_NOTIFY_LEVEL_PEJABAT` (default KABUPATEN —
                sengaja terpisah supaya menurunkan jangkauan petugas tak diam-diam memutus
                pejabat; dropdown ketiga di /admin/settings), `pejabat` masuk $isStaff di
                channels.php (tetap dikunci withinReportJurisdiction → #31 utuh), dan mode
                siaga dibuka untuk pejabat lewat konstanta BARU `User::STANDBY_ROLES`
                (['relawan','pejabat']) — TANPA migrasi, kolom `users.is_standby` sudah ada di
                semua baris dengan default true. `toggleStandby` PINDAH dari VolunteerController
                ke ProfileController, route `volunteer.standby` → `profile.standby` (pejabat
                mem-POST ke endpoint bernama "volunteer" akan terbaca sebagai bug); jangan buat
                alias nama lama. Admin & petugas SENGAJA tidak diberi saklar siaga — mematikan
                notifikasi Pusat Komando berarti laporan warga menganggur tanpa ada yang tahu.
                Kartu "Mode Kesiapan" di Admin/Dashboard.jsx meniru persis kartu relawan.
                Notifikasinya PERSIS milik petugas (EmergencyAlertNotification, sirine ikut),
                pembedanya cuma `user_role: 'pejabat'` di payload FCM — keputusan user.
                Test 251 → 260 passed (1004 assertions), npm run build lulus.
                TERDEPLOY 2026-08-25 @66d4cbca ke prod/staging/dev. TANPA migrasi (kolom
                is_standby sudah ada); route cache TIDAK aktif di server jadi route baru
                langsung terpakai — tetap periksa bootstrap/cache/routes-*.php tiap kali
                sebuah deploy mengubah routes/. Produksi punya 3 akun pejabat, ketiganya
                siaga aktif → mulai menerima siaran.
                SISA: verifikasi manual per peran (§6 file task), termasuk memastikan wrapper
                Android/iOS tidak tersandung nilai user_role baru.
               TASK_33 (prompt/tasks/TASK_33_hydrant_warga_sumber_air.md) — SELESAI (kode)
                2026-08-21. Satu pesan user, empat permintaan, SEMUANYA hanya di hydrant warga
                (`hydrant_wargas`) — tabel `hydrants` tidak disentuh sedikit pun.
                (1) "Konstruksi" (Stick/Jongkok) → "Sumber Air" (Tandon/Groundtank; user menulis
                "Grountank", ejaan baku dipilih atas persetujuannya). (2) Status Aktif/Perbaikan
                → "Terdaftar Belum/Sudah Dimodifikasi" (nilai DB: `Belum Modifikasi`/`Sudah
                Modifikasi`) — yang ditanya di tandon warga bukan "rusak atau tidak" melainkan
                apakah mulutnya sudah bisa dihisap mobil pemadam. (3) Kolom `water_pressure`
                DIBUANG dari hydrant warga (tandon berisi air diam). (4) `debit_lpm` DIBUANG,
                diganti `capacity_liter` — BUKAN ganti nama: satuannya berubah dari aliran
                (liter/menit) jadi simpanan (liter). Karena itu rekap desa di /admin/pumps
                TIDAK bisa lagi menjumlahkan keduanya (TASK_30 sengaja menyamakan satuannya
                justru supaya bisa) → `debitSummary()` jadi `waterSummary()` yang mengirim DUA
                pasang angka per desa, dipisahkan kunci BARU `water_metric` dari toSkklRow()
                (BUKAN `source` — yang menentukan boleh-tidaknya dijumlahkan adalah satuannya,
                dan nama tabel di logika perhitungan akan pecah begitu ada sumber SKKL ketiga);
                kartunya jadi "Ringkasan Air Desa" berbaris "Debit pompa" + "Kapasitas warga".
                Ketiga keputusan di atas (satuan, ejaan, nasib data lama) DITANYAKAN ke user
                lebih dulu; data lama dikosongkan, angka lama TIDAK dibawa.
                Konsekuensi: PENGECUALIAN #1 diperbarui — kedua tabel hydrant TIDAK LAGI KEMBAR
                dan itu disengaja; pertanyaan saat menambah kolom berubah dari "salin ke
                sebelah" jadi "apakah konsepnya berlaku di kedua sisi?". Beda kosakata hidup
                sebagai DATA di Admin/Hydrants/variants.jsx (typeLabel/typeOptions/statusOptions/
                showWaterPressure/waterField...), BUKAN percabangan `if (variant === 'warga')`
                di dua form. Temuan #76 (dicegah sebelum tayang): enam tempat menulis hukum
                warna sebagai `status === 'Aktif' ? biru : merah`, yang dengan status ketiga &
                keempat memerahkan SELURUH hydrant warga padahal tak ada yang rusak → helper
                tunggal `facilityStatusIsFaulty()`; JANGAN menulis `status === 'Aktif'` lagi.
                Ikutannya: chip filter status di daftar SKKL (/admin/pumps & /pumps) WAJIB
                memuat KEEMPAT status — filternya berjalan di level query atas dua tabel, jadi
                chip yang tak lengkap membuang separuh daftar tanpa gejala apa pun.
                Test 250 → 251 passed (984 assertions), npm run build lulus.
                TERDEPLOY 2026-08-21 @1acb0e20 ke prod/staging/dev berikut migrasinya. Karena
                migrasi ini MENGHAPUS kolom, isi `hydrant_wargas` dihitung dulu di ketiga env
                (0 baris di semua) sebelum dijalankan — lakukan hal yang sama tiap kali sebuah
                migrasi drop kolom. Data prod utuh: 71 users/145 reports/51 hydrants/6 pompas.
                SISA: verifikasi visual manual (§6 file task).
               TASK_32 (prompt/tasks/TASK_32_form_fasilitas_yurisdiksi.md) — SELESAI (kode)
                2026-08-20. Satu pesan user, enam permintaan di form fasilitas admin.
                (1) Tab "Hydrant Resmi" → "Hydrant"; (2) dua pill `rounded-full` diganti
                <Button size="sm"> yang sebentuk dengan tombol /admin/pumps — riwayat v1–v4
                ada di komentar Admin/Hydrants/variants.jsx, JANGAN hidupkan lagi bentuk yang
                sudah ditolak. (3) Temuan #73: chip "1. Klik Area Peta"/"2. Geser Pin" ber-
                `z-[400]` (angka dari skala z-index INTERNAL Leaflet, padahal chip-nya elemen
                halaman biasa) menembus dialog "Pakai Lokasi Saat Ini" (z-50) & header sticky
                (z-40) → jadi z-10 di enam berkas. Aturan turunan: overlay di atas peta hanya
                boleh z-index satu/dua digit. (4) Temuan #74: menggeser pin terasa "tidak
                mengisi apa-apa" karena reverse-geocode ber-rate-limit ~1 req/dtk tanpa satu
                pun indikator, dan kegagalannya cuma masuk console → kini badge "Mendeteksi
                wilayah...", toast.error saat gagal, plus jurisdictionMismatch() (lib/utils.js)
                yang MEMPERINGATKAN (bukan memblokir — nama OSM tak selalu selengkap tabel
                wilayah) bila pin keluar dari wilayah tugas. (5) Temuan #75 (P1, senyap):
                keempat controller fasilitas hanya menjaga level yang DIKUNCI akun; level
                terbuka diterima apa adanya sehingga admin kota bisa menyimpan aset ber-desa
                milik kabupaten lain dan barisnya tetap terlihat olehnya (Tenantable menyaring
                per kota) → trait BARU app/Traits/ResolvesFacilityJurisdiction.php: rantai kode
                diperiksa lewat AWALAN kode BPS (51→5171→5171012→5171012006), TANPA query
                indonesia_* karena tabel itu kosong di test; tidak cocok = ValidationException;
                level atas yang kosong diturunkan dari kode desa. Jangan lagi menulis
                `$user->x_code ?? $request->x_code` per controller. Penjaga:
                tests/Feature/Sisupit/FacilityJurisdictionTest.php (11 test).
                Test 239 → 250 passed (972 assertions), npm run build lulus.
                SISA: verifikasi visual/interaktif manual di browser (§6 file task).
               TASK_31 (prompt/tasks/TASK_31_menu_mobile_lengkap.md) — SELESAI (kode) 2026-08-19.
                Permintaan user: "pastikan semua menu di desktop muncul di mobile". Audit
                membuktikan SEMBILAN menu desktop tak pernah muncul di ponsel (Manajemen SKKL,
                Pos Pemadam, OPD Terkait, Instansi/Kabupaten, 4 tautan Bantuan & Legal, Daftar
                Baru) — buah dari pengecualian "dua daftar menu" 2026-08-13. Pengecualian itu
                DICABUT atas persetujuan user: isi kedua popover MobileBottomNav kini dibangun
                dari buildNavSections() (navItems.js), sumber yang sama dengan sidebar. BENTUK
                popover melayang TETAP (keputusan user 2026-08-13 tidak dibatalkan) — yang
                berubah hanya dari mana isinya diambil. Bilah memegang empat jangkar tetap
                lewat daftar KUNCI (BAR_ITEM_KEYS/FASILITAS_ITEM_KEYS), slot ke-5 "Menu" kini
                untuk SEMUA peran (dulu admin saja) dan memuat seksi sisanya — sehingga menu
                baru otomatis mendarat di sana tanpa menyentuh berkas bottom-nav. Harga yang
                disetujui user: bagi non-admin "Profil" jadi satu ketukan lebih dalam. Temuan
                #71 dicatat & FIXED; #53/#54 FIXED lagi. Penjaga baru:
                tests/Feature/Sisupit/MobileNavParityTest.php. Test 236 → 239 passed.
                ADENDUM (§8 file task, permintaan user "tombol mobile tidak menyatu dengan
                sistem" → didiskusikan dulu, 3 arah berpratinjau): temuan #72. Bilah bawah
                berhenti punya bahasa visual sendiri — ikon 20px (dulu 28px), stroke TETAP
                saat aktif, label 12px (dulu 10px). Ikon diselaraskan: Beranda IconHome→
                IconDashboard, Fasilitas IconFiretruck→IconMapPin (IconFiretruck kembali
                berarti Pos Pemadam saja). Popover: panah rotate-45 dibuang, token disamakan
                dengan DropdownMenuContent, baris min-h-[48px].
                REVISI (dua putaran, hari yang sama): (a) penanda aktif FINAL = kotak
                rounded-xl bg-destructive berikon putih (dialek NavLink sidebar) — varian
                "garis tipis" sempat dicoba lalu ditolak user, jangan dihidupkan lagi;
                (b) slot "Lapor" FINAL memakai ikon brand /icon.png yang MENGGANTIKAN kotak
                ikon slot (32px), bukan ditaruh di dalamnya — penumpukan itulah yang tadi
                memunculkan dua nuansa merah; karena itu slot ini TAK BOLEH diberi latar
                merah saat aktif, penandanya cincin. Prop imageSrc ditambahkan ke NavItem/
                SlotContent supaya slot ini tetap satu komponen dengan slot lain;
                (c) ATURAN BARU yang mengikat halaman lain: MERAH = LOKASI saja. Tombol
                pembuka popover dulu ikut memerah saat panelnya terbuka sehingga dua slot
                tampak aktif — kini keadaan "terbuka" memakai bg-accent netral +
                aria-expanded, hover ikut netral, tautan aktif dapat aria-current="page".
                REVISI 2026-08-20 (permintaan user, membatalkan sebagian (a)): blok merah
                solid ternyata hanya dikehendaki di SLOT BILAH. Baris aktif di DALAM popover
                Fasilitas & Menu kembali ke bentuk production — tint 10% + teks/ikon sewarna
                jenisnya (bg-teal/10 text-teal dst.; bg-destructive/10 untuk item tanpa warna
                jenis) + font-semibold + aria-current. Alasan user: di dalam panel, blok merah
                terbaca seperti tombol darurat, bukan "kamu di sini". Ukuran ikon 20px/label
                12px hasil #72 SENGAJA tidak dikembalikan ke 28px (ditanyakan & ditolak user).
                Dua bentuk penanda aktif dalam satu berkas = PENGECUALIAN ATURAN #2
                (prompt/docs/PENGECUALIAN_ATURAN.md) — jangan "seragamkan" lagi diam-diam.
                Test tetap 250 passed, npm run build lulus.
                SISA: verifikasi visual/interaktif manual per peran (§6 + §8 file task).
               TASK_30 (prompt/tasks/TASK_30_hydrant_warga_skkl.md) — SELESAI (kode) 2026-08-18.
                Enam permintaan user sekaligus. (1) Status fasilitas kini berbunyi "Berfungsi/
                Tidak Berfungsi" di SEMUA modul fasilitas — LABEL saja lewat `facilityStatusLabel()`
                di lib/utils.js, nilai DB tetap 'Aktif'/'Perbaikan' (hukum warna peta & filter tak
                tersentuh). (2) Kolom BARU `hydrants.water_pressure` (Tekanan Keras/Sedang/Kecil).
                (3) HYDRANT WARGA: TABEL SENDIRI `hydrant_wargas` + model HydrantWarga + route
                admin.hydrant-warga.* (revisi 2026-08-19 atas permintaan user; awalnya satu tabel
                berkolom `ownership`). Pemisahan tabel ini = PENGECUALIAN ATURAN yang disetujui
                user — daftar lengkap pengecualian ada di prompt/docs/PENGECUALIAN_ATURAN.md,
                entri #1, termasuk harganya: menambah kolom hydrant = DUA migrasi. Yang TIDAK
                dikembarkan: komponen React (Admin/Hydrants/{Index,Create,Edit}.jsx melayani dua
                route lewat prop `variant`; nama route ada di Admin/Hydrants/variants.jsx) →
                bagi pengguna keduanya tampak satu menu bertab. Dibaca di menu SKKL + /pumps
                publik + layer SKKL Peta Pemantauan; TIDAK muncul di /hydrants publik. (4) Kolom `debit_lpm` (liter/menit, WAJIB untuk hydrant warga)
                + kartu "Ringkasan Debit Air" per desa di /admin/pumps — satuannya sengaja sama
                dengan `pompas.capacity_lpm` supaya bisa dijumlahkan. (5) "Manajemen Pompa" →
                "Manajemen SKKL" — TEKS UI SAJA, route admin.pumps.*/model Pompa/tabel pompas
                TETAP. (6) Popup "Pakai Lokasi Saat Ini?" di 3 form Tambah fasilitas admin
                (Components/UseCurrentLocationDialog.jsx) — form lapor warga & Pusat Komando
                SENGAJA tidak tersentuh (di sana GPS otomatis memang benar). Plus dua temuan:
                #63 FIXED (konfirmasi OPD dulu berhenti sebagai flash message — Pusat Komando &
                petugas di lokasi tak pernah tahu listrik sudah padam; kini AgencyConfirmation-
                Notification) dan #64 OPEN sebagian (haversine SQL memakai acos/radians yang tak
                ada di SQLite; sisi /hydrants belum dipindah ke PHP). Ikon responder di peta
                detail insiden 28→40 px. Test 227 → 236 passed.
                SISA: verifikasi manual di browser (daftar periksa §6 file task) + jalankan
                `php artisan migrate` di staging/produksi sebelum deploy frontend.
               TASK_29 (prompt/tasks/TASK_29_tenantable_hierarkis.md) — SELESAI & TERDEPLOY
                2026-08-13 (prod/staging/dev @787593c). `Tenantable` jadi HIERARKIS: untuk tiap
                tingkat yang dimiliki user, baris harus NULL ATAU sama — dulu ia memilih SATU
                kolom (tersempit) lalu menuntut cocok persis, sehingga master OPD/armada yang
                disimpan admin tingkat kota (district/village NULL) TIDAK TERLIHAT oleh staf
                ber-kecamatan/desa: 6 dari 18 staf Denpasar melihat daftar OPD kosong tanpa
                pesan galat. Bukan aturan baru — `User::scopeNotifiableForReport` sudah lama
                memakai makna "kolom NULL = wewenang lebih luas"; ini menyelaraskannya.
                TIDAK mengubah penerima notifikasi (User tak memakai trait ini) dan TIDAK
                melebarkan visibilitas laporan — dibuktikan di data prod: 0 dari 18 akun
                berubah, hanya 5 baris data master yang terbuka. Temuan #60 FIXED.
                Test 215 → 222 passed.
               TASK_28 (prompt/tasks/TASK_28_pilih_lokasi_manual.md) — SELESAI (kode) 2026-08-13.
                Pilih lokasi manual saat Pusat Komando input kejadian: dropdown bertingkat
                Provinsi→Kabupaten→Kecamatan→Desa, pin melompat ke centroid wilayah terpilih
                (kolom `meta` tabel indonesia_*, ikut terkirim /api/regions/*), lalu digeser
                sedikit. Provinsi/kabupaten terisi dari YURISDIKSI OPERATOR (bukan string
                'Bali' di kode) & tetap bisa diganti. Gerbangnya prop `region_picker` dari
                ReportController::create — null untuk warga, jadi alur pelaporan warga
                (GPS + geser pin) tidak berubah sama sekali. Aturan penting: di mode manual
                geser pin TIDAK menimpa kode wilayah (pilihan operator = sumber kebenaran);
                tombol "Ikuti pin peta" mengembalikan perilaku lama. Test 212 → 215 passed.
                ADENDUM 2026-08-13 (§ADENDUM file task, permintaan user): keempat dropdown
                masih terlalu lambat saat operator mengangkat telepon, jadi pola
                `admin/hydrants/create` disalin ke form lapor — kotak "Cari Lokasi Kejadian"
                (debounce 1 detik lewat proxy GeocodeController) yang melompatkan pin DAN
                mengisi provinsi..desa otomatis, plus peta bisa diklik (`UserLeafletMap`
                prop baru `clickToPlace`, default false = form warga tak berubah). Dropdown
                tetap ada sebagai koreksi & tetap mengunci mode manual. Guard "lengkapi
                sampai desa" kini berlaku untuk semua Pusat Komando (server mewajibkan desa,
                pencocokan nama OSM sering berhenti di kecamatan). Lalu BUG dari user: geser
                pin terasa "diam" karena `resolveLocation()` menghitung alamat lalu membuangnya
                di mode manual (`locSubtitle` memilih label wilayah) — kini ada panel read-only
                "Alamat Lengkap (otomatis)" bertiga keadaan (mencari/ada/belum ada) + tombol
                "Salin ke patokan"; patokan TIDAK diisi otomatis karena itu teks manusia.
                Lalu keluhan berikutnya: "gema mer" nihil padahal Google Maps menampilkannya —
                Nominatim mencocokkan KATA UTUH. `GeocodeController::search` kini punya
                fallback: bila nihil & query >1 kata, cari ulang TANPA kata terakhir lalu
                saring hasilnya memakai kata itu sebagai AWALAN (kandidat dikembalikan apa
                adanya bila awalan tak cocok). Query dipendekkan itu biasanya sudah di cache
                → nyaris tanpa panggilan tambahan. Test 224 → 227 passed.
                SISA: verifikasi manual di browser (daftar periksa §6 + §ADENDUM file task).
               TASK_27 (prompt/tasks/TASK_27_opd_terkait.md) — SELESAI (kode) 2026-08-12.
                OPD terkait: saat verifikasi/broadcast, operator memilih instansi luar (BPBD/PLN/
                dst.) yang ikut diberi tahu. Kebakaran → OPD default TERCENTANG OTOMATIS tapi bisa
                di-uncentang. Daftarnya DINAMIS lewat /admin/agencies; "butuh konfirmasi" (mis. PLN
                "listrik sudah dipadamkan") juga DATA (`requires_confirmation`+`confirmation_label`),
                bukan `if` bernama instansi — jangan pernah menulis `if (code === 'pln')`.
                Auto-centang butuh kolom BARU `reports.incident_type` (dulu dibuang setelah
                validasi). Akun OPD = peran `opd` + `users.agency_id`; konfirmasi boleh dari OPD
                sendiri maupun dicatatkan operator (`confirmed_source`). Konfirmasi tertunda TIDAK
                memblokir "Selesai", hanya peringatan. Test 201 → 212 passed. SISA: verifikasi
                manual end-to-end + isi master OPD tiap kabupaten lewat /admin/agencies.
               TASK_26 (prompt/tasks/TASK_26_ios_prasyarat_server.md) — SELESAI (kode) 2026-08-12.
                Prasyarat server untuk wrapper iOS: (a) payload FCM kini punya blok `apns`
                di samping `android` — tanpa itu notifikasi darurat TIDAK PERNAH muncul di
                iPhone karena data-only dianggap background push; (b) verifikasi `aud` Google
                jadi DAFTAR PUTIH (Web + iOS Client ID) karena GIDSignIn iOS menerbitkan token
                ber-aud iOS Client ID; (c) `device_type` tak lagi dipaku 'android'.
                Test 193 → 201 passed. SISA: isi GOOGLE_IOS_CLIENT_ID di server + VERIFIKASI
                MANUAL di device Android nyata (notif + login Google) sebelum rilis, dan
                commit ulang public/build (297 berkas) agar device_type sampai ke produksi.
                Pembangunan app iOS-nya sendiri dipandu docs/ios/PROMPT_SISUPIT_IOS.md (Mac).
               TASK_24 (prompt/tasks/TASK_24_app_env_produksi.md) — SELESAI 2026-08-11.
                Produksi tadinya jalan dengan APP_ENV=local + APP_DEBUG=true → jejak galat
                & isi environment terbuka ke publik, dan halaman ErrorHandling tak pernah
                terpakai. Kini APP_ENV=production + APP_DEBUG=false (staging/dev ikut
                APP_DEBUG=false). Perubahan .env server saja, cadangan .env.bak-57-*.
                Temuan #57 FIXED.
               TASK_25 (prompt/tasks/TASK_25_reverb_config_runtime.md) — SELESAI 2026-08-11.
                Konfigurasi Reverb sisi browser dibaca RUNTIME (config/services.php →
                window.REVERB_CONFIG → echo.js), pola sama dengan MAP_TILE_URL. Sebelumnya
                dipaku saat build lewat VITE_REVERB_*, sehingga window.Echo TAK PERNAH ada
                di semua env dan host terpaku satu domain. Temuan #58 FIXED. SISA: cek di
                browser bahwa WS staging menyambung ke staging.sisupit.com.
               TASK_22 (prompt/tasks/TASK_22_broadcasting_auth.md) — SELESAI 2026-08-11.
                `bootstrap/app.php` kini memuat `channels:` sehingga POST /broadcasting/auth
                terdaftar; sebelumnya SEMUA channel privat mati diam-diam (Echo.private gagal
                otorisasi tanpa gejala). `routes/channels.php` pakai withoutGlobalScopes agar
                responder lintas desa tak ikut tertutup Tenantable. Temuan #55 FIXED.
                SISA: verifikasi end-to-end di produksi setelah deploy (curl /broadcasting/auth
                harus 419/302, bukan 404) + marker responder bergerak di halaman Show.
               TASK_23 (prompt/tasks/TASK_23_makna_wilayah_kosong.md) — SELESAI 2026-08-11.
                Kolom wilayah kosong kini punya aturan bernama: `User::STAFF_ROLES` (staf =
                sengaja luas) vs non-staf (= profil belum lengkap), tingkat diturunkan lewat
                `TenantLevel::forCodes()`. Cabang jaring pengaman "keempat kolom NULL = nasional"
                dibatasi ke staf — relawan berprofil kosong tak lagi dibanjiri siaran darurat
                se-Indonesia. Temuan #56 FIXED (dua "zona mati" yang dicatat di #56 ternyata
                by-design & dikunci test — koreksinya ada di entri #56). SISA: jalankan query
                verifikasi '0'/'' di DB produksi.
               TASK_21 (prompt/tasks/TASK_21_panel_menu_mobile.md) — DIBALIKKAN 2026-08-13
                atas permintaan user: MobileBottomNav.jsx dipulihkan ke bentuk pra-TASK_20
                (commit ea96039) — dua popover melayang, slot ke-5 = popover "Menu" untuk
                admin/superadmin & tautan Profil/Masuk untuk peran lain. Yang DIPERTAHANKAN:
                breakpoint md:hidden + padding safe-area (versi lama lg:hidden akan menabrak
                rail sidebar md di AppLayout). Konsekuensi diterima: #53/#54 terbuka lagi,
                tautan legal di ponsel hanya lewat footer AppLayout, dan daftar menu jadi dua
                tempat (navItems.js untuk Sidebar + MobileBottomNav.jsx sendiri).
                MobileMenuPanel.jsx & hooks/use-sheet-history.js DIHAPUS (pulihkan dari 2a1e2b6).
                Catatan lengkap: "Catatan pembalikan #53/#54" di FINDINGS_LOG.
                Isi TASK_21 aslinya, sebagai arsip: SELESAI 2026-08-08,
                branch `worktree-mobile-menu-drawer`. Panel "Menu" mobile berhenti menuang
                sidebar desktop ke Sheet: daftar menu pindah ke Partials/navItems.js sebagai
                satu-satunya sumber DATA, penyajian per permukaan jadi berbeda. Mobile kini
                drawer-dari-bawah bertitik-henti + kepala identitas + petak aksi cepat +
                seksi admin terlipat + pencarian; Back perangkat menutup panel; safe-area
                dihormati. Temuan #54 FIXED. SISA: verifikasi visual/interaktif manual
                (daftar periksa di file task) — repo tak punya browser automation.
               TASK_20 (prompt/tasks/TASK_20_navigasi_mobile_tablet.md) — SELESAI 2026-08-07,
                branch `feat/mobile-nav-legal`. Menu Bantuan & Legal kini terjangkau di
                mobile lewat Sheet berisi <Sidebar/> yang sama (duplikasi daftar menu
                dihapus), rail ikon untuk tablet md, tautan legal di footer AppLayout.
                Temuan #53 FIXED. SISA: verifikasi visual responsif manual (daftar periksa
                ada di file task) — repo tak punya browser automation.
               TASK_19 (prompt/tasks/TASK_19_halaman_legal_bantuan.md) — SELESAI 2026-08-04,
                DI-COMMIT 2026-08-07 (f5793c7). Halaman legal/bantuan publik (S&K, Privasi, Pusat Bantuan,
                Tentang, Paket & Lisensi) + persetujuan S&K saat daftar. Kolom
                `tenants.edition`/`features` + enum TenantEdition DIBUAT di sini (bagian
                data TASK_18 slice 1); temuan #48 FIXED, #49/#50 dicatat OPEN.
                ADENDUM 2026-08-07 (§6 file task): dua draf legal di `docs/*.docx` digabung ke
                `/syarat-ketentuan` bertab (Pengguna Umum + Pengguna Berkontrak); penyedia
                kini `PT Tawarin Dimana Aja`, S&K naik ke versi 2.0. Temuan BARU #51 (PKS
                masih menyebut MAESA perorangan) & #52 (alamat kantor PT kosong) OPEN.
               TASK_18 (prompt/tasks/TASK_18_edition_sewa_beli.md) — SISA: guard #45
                (EnsureTenantHostMatchesStaff), slice 2 (resolver halaman), slice 3 (modul
                per-tenant), slice 4 (tenant:export). Lapisan data edition sudah ada.
                TASK_17 multi-tenant subdomain SELESAI slice 1-3 (2026-07-25, belum di-commit).
                Sebelumnya: TASK_10, 06, 11, 14, 12, 13, 07, 15, 16 SELESAI
                2026-06-28 (9 task) + TASK_09 armada/Unit SELESAI 2026-06-29.
                TASK_08 (chat) DITUNDA atas keputusan user.
                #9 mass-reformat Pint/Prettier SELESAI 2026-06-29 (PR formatting terpisah).
                Sisa: nihil (hanya TASK_08 chat yang ditunda).
Backlog (urut prioritas, sumber: prompt/docs/FINDINGS_LOG.md) :
   1. #24 P1  [SELESAI] Tolak Data rusak (route salah) → status `ditolak` + arsip  (TASK_10)
   2. #16 P2  [SELESAI] Notif balik ke pelapor tiap transisi status  (TASK_06)
      + #25 P2 [SELESAI] Lonceng/inbox notifikasi web di header AppLayout  (TASK_11)
   3. #28 P2  [SELESAI] Broadcast perubahan status → halaman Show update real-time  (TASK_14)
   4. #26 P2  [SELESAI] take-action/arrive dibatasi ke wilayah laporan  (TASK_12)
   5. #27 P2  [SELESAI] Aksi "Batal Meluncur" (un-respond) bagi responder  (TASK_13)
   6. #17 P2  [SELESAI] Laporan multi-foto (galeri report_photos)  (TASK_07)
   6. #17 P2  Laporan multi-foto (galeri)  (TASK_07)
   7. #18 P2  Kanal chat/koordinasi per insiden  (TASK_08 — DITUNDA atas keputusan user 2026-06-28)
   8. #30 P2  [SELESAI] Edit laporan diperbaiki (pelapor+TERLAPOR, konten+kelola foto)  (TASK_16)
   9. #29 P3  [SELESAI] Batch minor: category dead ref, guard status aksi, casing import  (TASK_15)
   9. #9  P3  [SELESAI] Mass-reformat Pint/Prettier (81 PHP + 122 JS/JSX, PR terpisah)  2026-06-29
  10. #19 P3  [SELESAI] Manajemen armada/Unit & dispatch  (TASK_09, 2026-06-29)
   Temuan lama #1-#8,#10-#15,#20-#23 closed (FIXED).
Selesai      : TASK_01 (onboarding), TASK_02 (P0 IDOR relawan/profil),
               TASK_03 (P1 PII feed dashboard), TASK_04 (batch P2/P3: route debug,
               webpush auth, helper nested, dead code, CI lint informational, naming),
               TASK_05 Bagian A (dokumentasi keputusan dual-access #6) — semua per 2026-06-25
Onboarding   : [x] selesai (TASK_01, 2026-06-25)
```

---

## STACK & PERINTAH

```
Stack     : PHP 8.2 + Laravel ^11.31, Inertia v2 + React 18, Vite 6, Tailwind v3,
            Pest v3, SQLite (lokal & testing), spatie/laravel-permission, laravolt/indonesia,
            Reverb (WebSocket), FCM + WebPush (push notification)
Build     : npm run build
Test      : php artisan test            (baseline 2026-08-25: 263 passed, 1012 assertions —
            angka lama "65 passed, 164 assertions" per 2026-06-25 sudah jauh tertinggal)
Run (dev) : composer dev
Lint      : vendor/bin/pint  /  npm run format (auto-fix, BUKAN check-only — tidak ada di CI)
```

> Jalankan `php artisan test` **sebelum** dan **sesudah** setiap perubahan untuk menjaga regresi.

---

## ATURAN EMAS (BROWNFIELD — JANGAN DILANGGAR)

1. **Baca sebelum tulis.** Tidak ada edit sebelum memahami modul yang akan disentuh
   (`prompt/docs/ARCHITECTURE_MAP.md` + baca file terkait).
2. **Diff sekecil mungkin** untuk menuntaskan task. Jangan reformat, rename, atau
   refactor file/baris yang tidak terkait dengan task.
3. **Tiru konvensi existing** (penamaan, struktur folder, gaya kode, pola error) —
   lihat `prompt/docs/CONVENTIONS.md`. Jangan paksakan gaya baru.
4. **Jaga regresi:** jalankan test sebelum & sesudah. Tak ada test untuk area itu?
   Verifikasi manual & tulis langkahnya di file task.
5. **Jangan hapus/timpa** kode yang tidak kamu buat tanpa menjelaskan alasan lebih dulu.
   Jika isi file bertentangan dengan deskripsi task, surface dulu — jangan main timpa.
6. **Satu task = satu tujuan.** Temuan baru di luar scope → catat ke
   `prompt/docs/FINDINGS_LOG.md`, jangan kerjakan diam-diam.
7. **`withoutGlobalScopes()` wajib diikuti re-check otorisasi/ownership manual** — ini
   pengganti satu-satunya untuk proteksi yang biasanya dipegang `Tenantable` scope, dan
   pernah jadi sumber bug IDOR nyata di codebase ini.
8. **Setiap endpoint/skema/perilaku yang berubah** → update dokumen terkait di `prompt/docs/`.

---

## ALUR KERJA PER TASK

```
1. Pilih temuan dari prompt/docs/FINDINGS_LOG.md → buat file task dari
   prompt/tasks/TASK_00_TEMPLATE.md
2. Reproduce (buktikan bug ada) → root cause (di file:line mana) → rencana fix
3. Tentukan blast radius (apa lagi yang dipakai kode ini?)
4. Terapkan fix minimal → jalankan test → verifikasi manual
5. Update FINDINGS_LOG (status FIXED) + dokumen terkait + laporan task
```

---

## STRUKTUR DOKUMEN

```
sisupit/
├── CLAUDE.md                         ← file ini
├── prompt/
│   ├── MASTER_PROMPT.md
│   ├── AUDIT_CHECKLIST.md
│   ├── tasks/{TASK_00_TEMPLATE.md, TASK_01_onboarding.md, ...}
│   └── docs/{ARCHITECTURE_MAP.md, CONVENTIONS.md, FINDINGS_LOG.md,
│             PENGECUALIAN_ATURAN.md}
├── .claude/skills/sisupit-ui/SKILL.md
├── _PROMPT_KIT_EXISTING/             ← kit asal (template kosong, referensi — bukan output)
└── (app/, resources/, routes/, database/, dst. — kode aplikasi existing)
```

---

## Hal-Hal Penting yang Tidak Berubah dari Audit Sebelumnya

Catatan operasional dari sesi kerja sebelumnya (Fase 0–7, lihat git history/working tree
uncommitted) yang masih relevan dan **sudah diverifikasi benar di kode saat ini**:

- Dead library/loan subsystem (`Book`, `Loan`, `Fine`, dst.) sudah dihapus (Fase 0).
- `routes/admin.php` & `routes/web.php` sudah punya `role:admin|superadmin` yang benar
  (bug bypass admin sebelumnya sudah diperbaiki) — **tapi lihat FINDINGS_LOG #1 untuk
  IDOR baru yang tidak terkait perbaikan ini**.
- `ReportController::authorizeReportAccess()` sudah benar mencegah IDOR pada laporan milik
  user lain.
- `ReportActionController` sudah punya role check eksplisit di setiap method aksi.
- `EmergencyAlertNotification` sudah mengonsolidasi 4 Notification class lama.
- `app/Http/Controllers/Api/GeocodeController.php` adalah satu-satunya jalur ke Nominatim
  (cache 24h + lock rate-limit). `docker/nominatim/` siap untuk migrasi self-hosted,
  belum di-deploy.
- `.env.testing` (SQLite in-memory) sudah benar terpisah dari DB dev.
- Rate limiter `report-create` (5/10menit) sudah aktif di `front.reports.store`.

Detail lengkap & temuan BARU dari audit 2026-06-25 (termasuk yang masih terbuka) ada di
`prompt/docs/FINDINGS_LOG.md` — jangan duplikasi pencatatan, rujuk file itu sebagai sumber
kebenaran tunggal untuk status temuan.
