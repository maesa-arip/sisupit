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
Task aktif   : TASK_50 (prompt/tasks/TASK_50_suara_notifikasi_bertingkat.md) — SELESAI (kode)
                2026-08-28. Permintaan user: laporan yang BARU MASUK ke admin/petugas harus
                berbunyi BEDA dari broadcast sesudah verifikasi; sirine hanya untuk broadcast;
                konfirmasi OPD (PLN) juga dibedakan. Empat keputusan user dijawab lebih dulu:
                payload tak dikenal TETAP sirine (gagal berisik lebih aman daripada gagal diam
                untuk layanan kebakaran), notif balik ke PELAPOR pakai bunyi BAWAAN sistem,
                nada DIBUAT SENDIRI, dan judul tahap masuk boleh diubah.
                TIGA FAKTA YANG MENENTUKAN BENTUK PEKERJAANNYA, semuanya baru ketahuan setelah
                menelusuri kode: (1) laporan masuk & broadcast memakai KELAS + JUDUL yang sama
                persis (ReportController:448 vs ReportActionController:81), jadi keluhan user
                tepat — tak ada satu pun jalan membedakannya; (2) di ANDROID suara melekat pada
                notification channel, BUKAN payload, dan setelan channel PERMANEN — server tak
                bisa mengirim "mainkan berkas X", ia hanya bisa mengirim penanda lalu wrapper
                memilih channel, sehingga membedakan suara = MENAMBAH channel dan WAJIB rebuild
                APK; komentar "Tanpa sirine: ini kabar koordinasi" di AgencyConfirmation cuma
                benar untuk iOS; (3) aplikasi .exe yang dipakai admin TIDAK memakai FCM sama
                sekali — ia mendengar Reverb di App.Models.User.{id}, sehingga konfirmasi PLN
                TIDAK PERNAH tiba di layar Pusat Komando (via() kedua kelas Agency tanpa
                'broadcast'). Ikutan yang ikut terbetulkan: `report_status` juga lewat channel
                darurat, jadi WARGA PELAPOR selama ini dibangunkan sirine menembus mode senyap
                tiap kali status laporannya berubah.
                TIGA TINGKAT, pembedanya TINDAKAN yang diminta — bukan topik (ini yang menjaga
                daftar suara tidak beranak-pinak): triase (nada NAIK, laporan belum diverifikasi)
                → panggilan meluncur (SIRINE, tetap) → koordinasi (nada TURUN). Arah nada dipilih
                karena terbaca tanpa dihafal. Sirine harus tetap berarti SATU hal saja; laporan
                mentah bisa hoaks, dan sirine untuk yang belum tentu benar melatih orang
                mengabaikan sirine — lalu broadcast sungguhan ikut terabaikan.
                YANG MENGIKAT: (a) penanda tahap TIDAK BOLEH bernama `type` —
                BroadcastNotificationCreated::broadcastWith() melakukan array_merge(data,
                ['type' => nama kelas]), jadi kunci itu DITIMPA di jalur siaran; Android akan
                melihat nilai kita dan .exe TIDAK, tanpa galat di mana pun. Namanya `alert_stage`;
                (b) jeda antar-pengulangan TAK BISA diatur di Android (FLAG_INSISTENT mengulang
                sampai notifikasi ditutup, tanpa kendali jumlah/jeda) sehingga jeda DIBANGUN KE
                DALAM masuk.wav (2,4 dtk sunyi di ekor → berdenting tiap ~3,7 dtk); (c) Android
                tak bisa "5×" — koordinasi berbunyi SEKALI di ponsel, 5× di .exe, disengaja
                karena pendengarnya berbeda; (d) "berbunyi sampai diklik" tak cukup mengandalkan
                klik: toast Windows menyingkir sendiri ke Pusat Tindakan, jadi suara juga
                berhenti saat jendela utama dibuka/difokuskan, lewat tray, atau batas waktu.
                Nada dibangkitkan docs/sounds/buat_nada.py (WAV 22,05 kHz — satu-satunya format
                yang diterima Android, Chromium, DAN iOS tanpa konversi; ffmpeg tak terpasang).
                Penjaga: NotificationSoundStageTest BARU (5 test) yang mengadu payload SIARAN
                sungguhan, bukan toArray(); EMPAT di antaranya dibuktikan MERAH lewat sabotase
                sengaja (penanda dinamai `type`, pemanggil lupa tahap, 'broadcast' dicabut).
                Test 363 → 368 passed (1428 assertions), Pint PASS. npm run build TIDAK perlu
                (nol berkas resources/js/ berubah). TANPA migrasi/route/perubahan skema.
                DI LUAR REPO (keduanya tanpa git, catatan di memori): SisupitDesktop —
                siren.html → suara.html, tabel TINGKAT, judul kini dari SERVER bukan ditulis
                mati lagi di main.js; ketiga suara dibuktikan berbunyi lewat CDP, konfirmasi
                tepat 5 putaran. SisupitWebView — tiga channel BARU di samping
                emergency_channel_v4 yang TIDAK disentuh; gradlew assembleDebug LULUS, APK
                15,0 MB, ketiga suara terbukti terpaket di res/raw/.
                SISA: `npm run dist` installer .exe, pasang APK, verifikasi di perangkat
                (FLAG_INSISTENT di Android O+ BELUM diuji), lalu deploy Bagian A.
               TASK_49 (prompt/tasks/TASK_49_alamat_detail_yurisdiksi_berita_acara.md) — SELESAI
                (kode) 2026-08-28. Satu pesan user, TUJUH butir; DUA di antaranya ternyata SUDAH
                selesai sejak TASK_45 dan hanya diverifikasi ulang, tidak dikerjakan lagi:
                "sumber informasi otomatis" & "OPD masuk tim atensi" (keduanya sudah dikunci
                ReportResolutionTest). Kalau di layar belum terlihat, itu soal DEPLOY, bukan kode.
                Empat keputusan ditanyakan lebih dulu & dijawab user: alamat DISIMPAN sebagai kolom
                baru (bukan di-geocode ulang tiap buka halaman); penerima notif konfirmasi OPD
                mengikuti aturan siaran yang SUDAH ADA; antrian petugas jadi "belum ada entri sama
                sekali"; dan patokan tetap bernama "Patokan Lokasi" di kedua layar.
                (A) ALAMAT DI DETAIL LAPORAN (temuan #95). Panel "Alamat Presisi" adalah KLAIM tanpa
                penjamin, sebab `reports.address` memikul DUA makna: ReportController::store()
                menulis patokan yang DIKETIK warga, lalu correctLocation() MENIMPA kolom yang sama
                dengan `display_name` Nominatim. Akibatnya panel itu bisa kosong (laporan kebakaran
                sah tanpa patokan — darurat-first), bisa berisi kalimat yang menunjuk tempat lain
                dari pin tepat di atasnya, dan bisa berubah sendiri setelah responder mengoreksi pin
                — ketiganya tanpa galat. Tak bisa diperbaiki di layar saja: alamat hasil geocode
                TAK PERNAH sampai ke server (form sudah lama menghitungnya sebagai state
                `fullAddress` sejak TASK_28, tapi useForm tak pernah mengirimnya). Kini kolom BARU
                `reports.geo_address` — mesin menulis ke sana, manusia tetap memegang `address`;
                detail jadi dua baris (Alamat / Patokan Lokasi). Laporan LAMA di-reverse-geocode
                SEKALI saat halaman dibuka sebagai cadangan TAMPILAN, tidak ditulis balik ke DB.
                TIGA hal yang mengikat: (1) payload IncidentLocationCorrected berganti nama
                `address` → `geoAddress` — nama lama akan mendarat di tempat patokan di layar
                penerima, persis bug ini; (2) SEMBILAN layar meringkas laporan jadi satu baris
                "di mana" dengan membaca `address` langsung, dan begitu kolom itu berhenti ditimpa
                alamat mesin sebagian akan menampilkan baris KOSONG tanpa ada yang sadar — aturannya
                kini satu tempat, `Report::alamatTampil()` + `alamatLaporan()` di lib/utils.js;
                (3) `fullAddress` BUKAN lagi state terpisah melainkan field form `geo_address`.
                (B) YURISDIKSI PETUGAS OTOMATIS KABUPATEN. `defaultLevelFor()` di Users/Index.jsx
                selalu memilih tingkat TERDALAM milik pengguna, sama untuk semua peran — akun warga
                berdesa lengkap yang diangkat jadi petugas lahir ber-yurisdiksi SATU DESA, dan
                yurisdiksi yang terlalu sempit tak pernah bergalat, ia cuma membuat daftar &
                notifikasi petugas itu sepi tanpa alasan yang terlihat. Kini kamus
                ROLE_DEFAULT_LEVEL (DATA, bukan cabang `if`). Ia USULAN, bukan kunci: dua penjaga
                lama tetap berlaku lebih dulu (admin tak boleh memberi lebih luas dari dirinya;
                pengguna harus punya kode wilayah sampai tingkat itu), dan bila kabupaten tak
                tersedia ia jatuh ke perilaku lama. Nilainya diadu dengan enum TenantLevel di
                server — bukan kamus lawan kamus (pelajaran #79).
                (C) KONFIRMASI OPD (PLN) DIKABARKAN LEBIH LUAS. Dulu hanya admin+petugas sewilayah
                + `report_officers`. Kini + relawan siaga dengan ceiling-nya SENDIRI
                (KEY_NOTIFY_LEVEL_RELAWAN + is_standby, persis aturan approve() — menyalin ceiling
                petugas ke sini diam-diam melebarkan jangkauan relawan di luar setelan admin),
                + `report_helpers` (tabel ini TIDAK PERNAH dibaca di sini, sehingga relawan yang
                sudah TIBA di TKP justru satu-satunya yang tak tahu listrik sudah padam), + PELAPOR.
                Yang mencatat konfirmasi tetap tak dikabari tindakannya sendiri.
                (D) BERITA ACARA: `volume_air` + `report_victims.kondisi` (Kondisi Korban).
                `volume_air` sengaja TEKS BEBAS mengikuti preseden `kerugian` ("±1jt") — yang
                ditulis petugas di lapangan "±3 tangki", bukan bilangan bersatuan tetap. `kondisi`
                IKUT dihitung sebagai isi baris korban, kalau tidak korban yang baru diketahui
                kondisinya (belum teridentifikasi namanya) dilewati diam-diam sebagai baris kosong.
                (E) FINAL = ADMIN. Digerbangi di SERVER (`canFinalize()`), bukan cukup tombol yang
                disembunyikan. IKUTAN WAJIB: antrian "Menunggu Berita Acara" di dashboard petugas
                kini menyaring "belum ada entri SAMA SEKALI" — bentuk lama ("belum final") membuat
                insiden yang sudah petugas isi menggantung selamanya menunggu admin, dan antrian
                yang tak bisa dibereskan sendiri terbaca sebagai bug (pelajaran TASK_45/#94).
                Prop `has_draft` ikut DIHAPUS: isi antrian kini selalu satu keadaan, dan flag yang
                cuma punya satu nilai adalah klaim yang menunggu keliru.
                Penjaga: ReportAddressPatokanTest BARU (6 test) + AssignRoleDefaultLevelTest BARU
                (3) + 2 di ReportAgencyTest + 4 di ReportResolutionTest; SEBELAS dari lima belas
                dibuktikan MERAH dulu. Dua test lama disesuaikan (bukan dilemahkan): aktor entri
                final di append-only test jadi admin, dan antrian petugas menuntut item HILANG
                setelah entri sementara.
                Test 348 → 363 passed (1415 assertions), Pint PASS, npm run build lulus.
                DUA MIGRASI aditif & nullable, TANPA backfill — sudah dijalankan di DB dev LOKAL
                (laragon), BELUM di prod/staging/dev VPS. TANPA perubahan route/channel.
                TERDEPLOY 2026-08-28 @09cbf9fd ke prod/staging/dev, ff dari ead12f76, SEKALIGUS
                dengan TASK_46, TASK_47, TASK_48 & penyetelan style basemap yang selama ini belum
                pernah ter-commit. DUA commit: ed47bebe kode + 09cbf9fd aset build. Urutan
                dev → staging → prod. DUA MIGRASI aditif (geo_address; volume_air + kondisi) DONE
                di ketiga env, 0 pending. Cadangan mysqldump ketiga DB lebih dulu di VPS
                `/root/backup-predeploy-20260827-232724` (17 MB per env, "Dump completed").
                `composer install` DILEWATI & route cache TIDAK dibangun ulang — routes/ dan
                composer.lock TIDAK berubah di rentang ini (diperiksa dengan git diff --stat).
                docker/tiles/data/ (1,5 GB: mbtiles, pbf, shapefile pantai, font) TIDAK ikut —
                dikecualikan .gitignore-nya sendiri; hanya 14 berkas skrip/style yang masuk repo.
                Verifikasi: data prod UTUH (72 users / 22 reports / 51 hydrants / 320 banjars /
                1 berita acara, sama persis pra-migrasi); ketiga domain `/` & `/hydrants` 200;
                bundel BARU Show-CsTXjJ3Y.js 200 & LAMA Show-Dj9hYIh5.js 404 di ketiganya; tile
                /tiles/styles/sisupit/… 200; POST /broadcasting/auth 403; nginx/php8.2-fpm/reverb/
                reverb-staging/reverb-dev active + container tileserver healthy; 0 berkas
                root-owned pasca-chown; 0 ERROR baru (ERROR terakhir ketiga env 2026-08-26 06:07 =
                queue worker "Connection refused" lama). Ketiga kolom baru & Report::alamatTampil()
                diperiksa HIDUP di prod lewat skrip bootstrap Laravel.
                CATATAN DATA: 22 laporan prod semuanya ber-`geo_address` KOSONG (tanpa backfill,
                memang begitu desainnya) dan 8 di antaranya juga tanpa patokan — kedelapan itu
                akan mengandalkan cadangan reverse-geocode di layar saat detailnya dibuka, jadi
                pastikan Nominatim (127.0.0.1:8088) hidup. Laporan BARU langsung terisi sendiri.
                GOTCHA BARU: `php artisan tinker <berkas.php>` MENGGANTUNG menunggu stdin lewat
                plink (bukan gagal — ia diam sampai timeout) dan `--execute` dengan nama kelas
                ber-namespace hancur oleh kutipan berlapis plink→bash→PHP ("T_NS_SEPARATOR").
                Yang berhasil: skrip PHP berdiri sendiri yang me-require vendor/autoload.php +
                bootstrap/app.php, di-pscp lalu dijalankan `php` biasa.
                SISA: verifikasi manual §6 file task (di browser).
               TASK_48 (prompt/tasks/TASK_48_status_ditolak_verifikasi_laporan.md) — SELESAI
                (kode) 2026-08-27. Laporan user: laporan yang DITOLAK muncul dengan nama status
                yang salah di Verifikasi Laporan, plus permintaan chip filter "Ditolak".
                AKAR (#94): Admin/Reports/Index.jsx memelihara kamus status SENDIRI
                (`STATUS_META`) — ia ada karena butuh warna pin/titik/legenda yang tak
                disediakan Components/StatusBadge.jsx — dan kamus itu berhenti di EMPAT status;
                `ditolak` lahir di #24 tapi tak pernah menyusul ke sini. Karena markerStyle()
                dan StatusBadge lokal sama-sama bercadangan `|| STATUS_META.pending`, status tak
                dikenal TIDAK tampil apa adanya melainkan MENGAKU JADI STATUS LAIN: laporan yang
                sudah ditolak berlencana KUNING "Laporan Terverifikasi" berpin kuning, tanpa
                galat, tanpa gejala lain. Bentuk yang sama dengan #90 — cadangan sebuah kamus
                adalah KLAIM, bukan "tidak dikenal".
                LAYAR KEDUA berakar sama, ikut diperbaiki atas persetujuan user (dipilih dari
                dua opsi): Monitoring/Map.jsx `REPORT_STATUS` juga berhenti di empat status,
                padahal MonitoringMapController MEMANG mengirim laporan `ditolak` dan
                `reportHidden` menyembunyikannya sejak awal. Chip status dirender DARI daftar
                itu → tak ada saklar untuk menyalakannya, sehingga kejadian yang ditolak TAK
                PERNAH bisa ditampilkan di Peta Pemantauan meski datanya sampai ke browser;
                komentar di berkas itu yang berbunyi "tetap bisa dinyalakan lewat chip status"
                sudah lama tidak benar.
                SISI SERVER NOL PERUBAHAN: Admin\ReportController::index sudah
                `where('status', $status)` generik dan ReportsExport::STATUS_LABELS sudah punya
                'ditolak' => 'Ditolak' sejak TASK_39 — filter DAN Export Excel langsung benar
                begitu chipnya ada.
                YANG MENGIKAT: chip "Ditolak" TIDAK ditampilkan ke pemantau (pejabat/relawan,
                canVerify=false). Mereka memakai halaman yang SAMA lewat front.reports.index,
                dan ReportController::index menyaring whereNotIn('status',['TERLAPOR','ditolak'])
                — chip yang selalu memulangkan daftar kosong terbaca sebagai bug (pelajaran
                TASK_45). Keduanya kini didaftar SEKALI di `MONITOR_HIDDEN_STATUSES` yang dipakai
                pill MAUPUN legenda; jangan dipecah lagi jadi dua saringan.
                Penjaga: ReportStatusDictionaryTest BARU (4 test, TIGA dibuktikan merah dulu).
                Yang pertama sengaja TIDAK mengadu kamus dengan kamus (pelajaran #79): ia
                MENOLAK laporan lewat endpoint sungguhan, membaca status yang benar-benar
                tertulis di kolomnya, lalu menuntut kedua kamus layar mengenal string itu. Kamus
                ekspor dibaca lewat refleksi — konstantanya private dan visibilitas produksi
                TIDAK dilonggarkan demi test.
                Daftar "SEMUA peta status" di CONVENTIONS.md ikut dilengkapi: kedua kamus ini
                dulu tak tercantum di sana, dan itulah sebabnya keduanya menyimpang tanpa ada
                yang sadar.
                Test 344 → 348 passed (1350 assertions), Pint PASS, npm run build lulus. TANPA
                migrasi/route/perubahan skema/sentuhan server.
                SISA: verifikasi visual §6 file task + deploy (frontend saja).
               TASK_47 (prompt/tasks/TASK_47_tab_jenis_kejadian_lapor.md) — SELESAI (kode)
                2026-08-27. Permintaan user: pemilih jenis kejadian di /reports/create dipecah
                DUA TAB berikon — Kebakaran (aktif otomatis, tombol pilihan seperti sekarang +
                tombol "Lainnya" yang membuka isian teks) dan Non Kebakaran (langsung isian
                teks). Ikon IconFiretruck & IconAmbulance; bentuk tab & kelas trigger disalin
                dari Pages/Info/Terms.jsx — satu-satunya pemakai Tabs yang sudah ada, supaya
                tab di sini tidak jadi dialek kedua.
                YANG MENENTUKAN BENTUK PEKERJAANNYA (ditanyakan & disetujui user lebih dulu):
                tombol "Lainnya" DI DALAM tab kebakaran TIDAK BISA memakai nilai `lainnya`
                yang sudah ada, sebab satu nilai itu mengikat TIGA perilaku — ReportRequest
                mewajibkan foto+deskripsi+patokan untuknya, ReportsExport mencetak labelnya
                "Bukan Kebakaran" di rekap pimpinan, dan Agency::recommendedIdsFor() sengaja
                tak merekomendasikan OPD untuknya. Memakai ulang nilai itu = kebakaran gudang
                tercetak "Bukan Kebakaran" di dokumen resmi DAN warganya diwajibkan memotret
                api. Karena itu jenis BARU `kebakaran_lainnya` (Report::INCIDENT_TYPES), plus
                konstanta BARU Report::FIRE_INCIDENT_TYPES supaya "jenis kebakaran mana saja"
                ditulis satu tempat (AgencySeeder dulu menyalinnya tangan).
                DUA hal yang mengikat: (1) aturan validasi di ReportRequest SENGAJA tidak
                diubah — pembandingnya tetap SATU nilai (`=== 'lainnya'`), bukan "bukan salah
                satu jenis kebakaran", karena incident_type nullable dan kosong tak boleh
                mendadak berarti "wajib foto" bagi laporan lama/klien lama; `kebakaran_lainnya`
                otomatis jatuh ke aturan kebakaran. (2) Isian judul bebas ditulis SEKALI di
                luar TabsContent (placeholder-nya saja yang beda per tab) supaya kedua tab tak
                memelihara isian kembar.
                Penjaga: ReportIncidentTypeTabTest BARU (4 test, KEEMPATNYA dibuktikan merah
                dulu), termasuk parity daftar jenis di form vs Rule::in server dan parity label
                (jenis tanpa label tercetak mentah di Excel — pelajaran #39).
                Test 340 → 344 passed (1306 assertions), Pint PASS, prettier PASS, npm run
                build lulus. TANPA migrasi/route/perubahan skema.
                SISA: verifikasi visual §6 file task + LANGKAH PASCA-DEPLOY §7 — kolom
                agencies.default_incident_types itu DATA, jadi OPD yang sudah ada di
                prod/staging/dev TIDAK akan tercentang otomatis untuk "Kebakaran Lainnya"
                sampai dicentang ulang lewat /admin/agencies, satu kali per environment.
                SENGAJA tidak ditambal cabang kode yang mengenali nama jenis (aturan TASK_27).
               TASK_46 (prompt/tasks/TASK_46_basemap_self_host_tileserver.md) — SELESAI &
                TERPASANG 2026-08-27. Laporan user: "di maps muncul api key required carto.com".
                BUKAN galat aplikasi — CARTO mulai MENCAP setiap tile-nya ("API KEY REQUIRED /
                carto.com/basemaps/apikey"); tile tetap dikirim HTTP 200 berisi peta yang benar,
                cuma bertulisan melintang. Karena itu nol gejala teknis: tak ada galat, tak ada
                tile gagal muat, tak ada baris log. AKAR: `MAP_TILE_URL` TIDAK PERNAH diisi di
                environment mana pun, jadi ke-14 peta jatuh ke cadangan CARTO di
                config/services.php (kembarannya CARTO_VOYAGER di lib/utils.js) — dan ketiga
                domain live terbukti menyajikan URL itu. PELAJARAN YANG LEBIH BESAR DARI BUG-NYA:
                nilai cadangan yang menunjuk LAYANAN PIHAK KETIGA TANPA AKUN bukan jaring
                pengaman, melainkan ketergantungan tak tercatat — selama env tak diisi,
                "sementara" itu jadi konfigurasi produksi yang sesungguhnya, dan perubahan
                kebijakan pihak lain mengubah semua peta bersamaan. Mekanisme runtime-inject
                (TASK_25) sendiri bekerja BENAR; yang keliru isi cadangannya.
                FIX (keputusan user dari 4 pilihan): basemap DI-SELF-HOST. `docker/tiles/` BARU
                (TileServer-GL + vector tiles hasil tilemaker dari bali.osm.pbf MILIK NOMINATIM,
                bbox SAMA dengan extract-bali.ps1 supaya cakupan peta/geocoding/rute tak
                berbeda-beda; style OSM Bright + font Noto Sans), sepola docker/nominatim &
                docker/osrm. Cadangan di config & utils.js dipindah ke tile OSM resmi — BUKAN
                sumber produksi, hanya supaya env yang lupa diisi menampilkan peta terbaca, bukan
                peta bercap atau layar kosong.
                EMPAT hal yang mengikat: (1) tile ditarik BROWSER, bukan server — jadi beda dari
                Nominatim/OSRM yang cukup loopback, tile server WAJIB publik; di VPS disajikan
                Nginx di /tiles/ dengan proxy_cache + limit_except GET HEAD. (2) TANPA
                `data/fonts/`, tile TETAP tergambar rapi TAPI TANPA satu pun nama jalan/desa, dan
                tileserver TIDAK melaporkan galat apa pun — "peta polos" = periksa FONT, bukan
                style; style bawaan image (basic-preview) juga begitu. (3) tilemaker TANPA --bbox
                berhenti gagal TAPI ber-EXIT CODE 0, jadi skrip memeriksa keberadaan berkas
                hasilnya, bukan status keluarnya. (4) Data vektor sampai z14; zoom lebih jauh
                dioverzoom dan tetap tajam (diuji s/d z19) — jangan naikkan maxzoom "supaya lebih
                tajam", ukuran mbtiles meledak tanpa perbaikan yang terlihat.
                DUA KEJUTAN DI SERVER: port 8080/8081/8082 SUDAH DIPAKAI tiga instance Reverb →
                tile server memakai 8083 dan diikat 127.0.0.1 saja; dan image tileserver-gl tak
                membawa wget MAUPUN curl sehingga healthcheck-nya gagal selamanya (container
                "unhealthy" padahal melayani — status palsu yang menyesatkan) → diganti
                `node -e "fetch(...)"`.
                Ikutan yang ikut dibetulkan: dari 14 pemanggilan L.tileLayer hanya 5 yang
                memasang `attribution`; kesembilan sisanya kini memakai string yang PERSIS sama
                (data tile turunan OSM/ODbL mewajibkan atribusi).
                Test tetap 340 passed (1284 assertions), Pint PASS, npm run build lulus. TANPA
                migrasi/route/perubahan skema/sentuhan DB.
                TERPASANG di prod/staging/dev 2026-08-27: /opt/geo/tiles, location /tiles/ di
                ketiga situs (cadangan *.bak-tiles-*), proxy_cache_path sebagai berkas BARU
                /etc/nginx/conf.d/sisupit-tiles-cache.conf (nginx.conf TIDAK disunting — ia sudah
                meng-include conf.d di dalam http{}), MAP_TILE_URL di ketiga .env menunjuk
                DOMAINNYA SENDIRI. TANPA deploy kode, TANPA rebuild — persis yang dijanjikan
                desain runtime-inject TASK_25. Verifikasi: ketiga domain 0 rujukan cartocdn,
                tile 200 (36.715 B), @2x 200, POST /tiles/ 403, x-tile-cache HIT, kelima service
                active, 0 ERROR baru. PERUBAHAN KODE BELUM DI-COMMIT & belum dideploy (sengaja —
                perbaikan petanya murni env var); ikutkan rilis berikutnya.
                TEMUAN BARU #93 OPEN (sengaja tidak dikerjakan): resources/js/lib/utils.js memuat
                BYTE NUL MENTAH di dalam regex AKSARA_TAK_TERBACA (TASK_43) — itu sebabnya grep
                memperlakukannya sebagai berkas biner. Kalau ada tool yang membuang byte itu,
                regexnya tetap SAH tapi berubah makna dan alamatTerbaca() menyaring alamat secara
                keliru tanpa gejala. Fix satu baris + test; menunggu keputusan user.
               TASK_45 (prompt/tasks/TASK_45_berita_acara_otomatis_dan_akun_opd.md) — SELESAI
                (kode) 2026-08-27. Satu pesan user, LIMA permintaan; dua keputusan ditanyakan
                lebih dulu (laporan yang diketik operator: kolom sumber DIKOSONGKAN, bukan diisi
                kalimat umum; OPD di tim atensi DITANDAI "(OPD)").
                (A) SUMBER INFORMASI BERITA ACARA OTOMATIS. Cabang prefill untuk berita acara
                PERTAMA tak pernah menyertakan sumber_informasi. Sinyal pembeda yang TERSIMPAN
                cuma satu: PERAN pemilik reports.user_id — ReportController::store() selalu
                menulis auth()->id(), jadi laporan yang diketik operator (alur telepon TASK_28)
                ber-user_id operator itu sendiri. Warga lapor lewat aplikasi → terisi;
                operator input manual → SENGAJA KOSONG (sumber sebenarnya cuma operator yang
                tahu, dan kalimat umum yang terisi otomatis cenderung dibiarkan apa adanya).
                Kalimatnya jadi ReportResolution::SUMBER_APLIKASI — dulu ditulis mati di
                SeedDemoIncident saja, dan kalimat yang ditulis dua kali menyimpang tanpa
                gejala (pelajaran #80).
                (B) OPD MASUK TIM ATENSI, bertanda "(OPD)" supaya mitra luar bisa dibedakan dari
                armada & personel Damkar di dokumen resmi. Namanya dibaca dari kolom SNAPSHOT
                report_agencies.agency_name, BUKAN master agencies — berita acara dokumen
                historis, isinya tak boleh berubah saat master OPD di-rename (aturan yang sama
                sudah berlaku di ReportsExport). Dikunci test.
                (C) PROFIL SALAH PERAN (temuan #90). Profile/Edit.jsx memakai tangga tiga
                cabang relawan → admin/petugas → "Anggota Masyarakat". Datanya tak pernah
                kurang (auth.user.role membawa SEMUA peran); yang salah bentuk kodenya —
                cabang terakhir sebuah tangga bukan "tidak dikenal", melainkan sebuah KLAIM.
                Karena itu BUKAN cuma opd yang salah: pejabat DAN superadmin pun berbunyi
                "Anggota Masyarakat" sejak peran-peran itu lahir. Kini kamus ROLE_LABELS +
                roleLabel()/roleTone() di lib/utils.js (pola facilityStatusLabel). TIGA hal
                yang mengikat: urutan daftarnya BERARTI (akun bisa berperan ganda, yang tampil
                yang paling menentukan wewenangnya); peran tak dikenal berbunyi "Peran belum
                ditetapkan" — JANGAN dikembalikan jadi "Anggota Masyarakat", klaim itulah
                bugnya; lencana perisai ikut "bukan warga biasa", bukan daftar dua peran.
                (D) RIWAYAT OPD SELALU KOSONG (temuan #91). ReportController::index() cuma
                punya dua jalur & keduanya mustahil berisi bagi OPD: tab "Riwayat Saya"
                menyaring user_id (OPD tak pernah membuat laporan) dan tab "Semua Laporan"
                ber-Tenantable sedangkan akun OPD sengaja TANPA kode wilayah (#44) →
                whereRaw('1 = 0'). Kini ada agencyIndex(): insiden yang INSTANSINYA diminta
                membantu, gerbang keanggotaan report_agencies — pola yang SAMA dengan show()
                ($isAgencyPartner) & dashboard OPD. withoutGlobalScopes() wajib (permintaan
                bisa datang dari kelurahan mana pun) sehingga re-check ownership-nya agency_id
                akun itu (ATURAN EMAS #7); akun OPD TANPA instansi melihat KOSONG, bukan
                semuanya. Kedua tab disembunyikan lewat prop scope:'agency' — tab yang selalu
                memulangkan daftar kosong terbaca sebagai bug.
                (E) UBAH PERAN JADI OPD (temuan #89). Frontend & assignRole() SUDAH lengkap
                sejak TASK_27 (pemilih instansi, validasi agency_id wajib, pelepasan tautan
                saat peran pindah); yang menghalangi satu nama di satu array —
                assignableRoleNames() untuk admin non-superadmin tak memuat 'opd'. Janggal,
                sebab admin kabupaten justru pemegang /admin/agencies: bisa MENDAFTARKAN
                instansinya tapi tak bisa MEMBUATKAN akunnya. BUKAN eskalasi: opd di luar
                User::STAFF_ROLES, dan penautan instansinya dijaga Agency::whereKey() yang
                ber-Tenantable. JANGAN memasukkan admin/superadmin ke daftar itu.
                Penjaga: RoleLabelParityTest BARU (mengadu ROLE_LABELS dengan peran yang NYATA
                ada di tabel roles, lalu memastikan Profile/Edit tak menyusun namanya sendiri —
                pola MobileNavParityTest), + 3 test di masing-masing ReportResolutionTest,
                OpdDashboardTest, UserAssignRoleTest. SEPULUH dari sebelas dibuktikan merah
                dulu; yang ke-11 penjaga regresi (kode lama pun memulangkan kosong untuk OPD
                tanpa instansi, tapi karena alasan keliru).
                Test 329 → 340 passed (1284 assertions), Pint PASS, npm run build lulus.
                TANPA migrasi/route/perubahan skema. SISA: verifikasi manual §6 file task.
                TERDEPLOY 2026-08-27 @221ae7ed ke prod/staging/dev, SEKALIGUS dengan TASK_44.
               TASK_44 (prompt/tasks/TASK_44_koreksi_pin_peta_detail_jejak_penutup.md) — SELESAI
                (kode) 2026-08-27. Satu pesan user, tiga permintaan; dua keputusan cakupan
                ditanyakan lebih dulu (klik marker → popup + tombol, bukan langsung pindah;
                penutup tampil di detail + ekspor + daftar, sekaligus catat penolaknya).
                (A) PIN KOREKSI LOKASI MELOMPAT BALIK (temuan #86). Dua lapis di
                Front/Reports/Show.jsx: effect peta MEMBONGKAR-PASANG marker TKP tiap redraw
                (remove() lalu bangun ulang dari incidentLocation), dan posisi hasil geseran
                cuma hidup di `pendingPosition` — state yang TAK PERNAH ikut menggambar
                marker, ia baru dibaca saat tombol Konfirmasi ditekan. Pemicunya justru orang
                yang sedang mengoreksi: responder ber-status `arrived` masih
                isCurrentlyResponding, jadi watchPosition MILIKNYA memanggil setOfficerList
                tiap tik GPS → officerList ada di dependensi effect → pin kembali ke titik
                asal. Tanpa galat, tanpa gejala lain. Kini marker DIPAKAI ULANG antar redraw
                (pola renderMarker yang memang sudah begitu untuk responder) dan posisinya
                `pendingPosition ?? incidentLocation`. DUA hal yang mengikat: dragstart/dragend
                menjaga isDraggingIncidentRef sehingga redraw TIDAK memanggil setLatLng selama
                pin dipegang (tanpa ini pin direnggut persis saat jari masih menahannya), dan
                `pendingPosition` SENGAJA di luar dependensi effect — effect itu melepas &
                menyambung ulang channel Echo serta menggambar ulang rute OSRM. setIcon() juga
                tak lagi dipanggil tiap redraw (ia membangun ulang elemen DOM marker).
                (B) PETA PEMANTAUAN TAK PUNYA JALAN KE DETAIL (temuan #87): marker kejadian
                cuma bindPopup. Bukan kekurangan data — MonitoringMapController sudah lama
                mengirim `id`. Kini popup punya tombol "Lihat Detail". Bentuknya `<a href>`
                ASLI, bukan hanya handler: popup Leaflet itu HTML mentah sehingga <Link>
                Inertia tak bisa dipakai, dan bila handler popupopen gagal terpasang tautannya
                tetap berfungsi (muat ulang penuh); handler hanya menaikkannya jadi
                router.visit(). Tak ada permukaan otorisasi baru — halaman itu sudah bergerbang
                petugas|admin|superadmin|pejabat dan ter-scope yurisdiksi, sama dengan
                ReportController::show.
                (C) PENUTUP INSIDEN TAK BERJEJAK (temuan #88): resolve() hanya menulis
                status='resolved' — pertanyaan "siapa yang menutup insiden ini?" TAK BISA
                dijawab dari data mana pun. reject() setengah jalan sejak #24: menyimpan KAPAN
                & KENAPA, tidak SIAPA. Kini migrasi ADITIF resolved_by/resolved_at/rejected_by
                (nullable, nullOnDelete), tampil di halaman detail + daftar /admin/reports +
                Export Excel (32 → 35 kolom, LAST_COLUMN AF → AI). EMPAT hal yang mengikat:
                (1) relasinya bernama resolver()/rejector(), BUKAN resolvedBy()/rejectedBy() —
                model Report dikirim UTUH ke halaman detail dan relasi diserialisasi
                ter-snake_case, jadi `resolvedBy` akan MENIMPA kolom `resolved_by` di JSON
                (angka berubah jadi objek tanpa galat); pola yang diikuti
                ReportResolution::creator(); (2) resolved_at BUKAN kembaran "Jam Selesai" di
                rekap — yang itu dari finished_at responder terakhir, yang ini saat Pusat
                Komando menutup, keduanya bisa berjarak jauh; (3) TANPA backfill, laporan lama
                berbunyi "tidak tercatat"/"-" alih-alih mengarang nama; (4) audiens jejaknya
                staf/pejabat/relawan lewat satu gerbang canSeeClosureActor — kartu "Laporan
                Ditolak" sendiri terbuka untuk pelapor, jadi menampilkan nama petugas penolak
                KE PELAPOR adalah keputusan tersendiri; ubah di satu tempat itu bila
                dikehendaki. Penjaga: ReportClosureActorTest (6 test, KEENAMNYA dibuktikan
                merah dulu), salah satunya mengunci panjang TIGA daftar berkas ekspor
                (heading, nilai map(), columnWidths) supaya penambahan kolom berikutnya tak
                bisa lolos setengah jalan & menggeser seluruh rekap tanpa galat.
                Test 323 → 329 passed (1253 assertions), Pint PASS, npm run build lulus.
                SISA: verifikasi manual §6 file task + jalankan migrasi di dev/staging/prod
                (aditif; route & channel TIDAK berubah jadi route cache tak wajib dibangun).
                TERDEPLOY 2026-08-27 @221ae7ed ke prod/staging/dev (dua commit: 43b676a0 kode,
                221ae7ed aset build), urutan dev → staging → prod. Migrasi closure-actor
                dijalankan di ketiga env (DONE, 0 pending); cadangan mysqldump ketiga DB di VPS
                `/root/backup-predeploy-20260827-061314` (17 MB per env, "Dump completed").
                Data prod TIDAK berubah (72 users / 19 reports / 51 hydrants / 320 banjars, sama
                persis pra-migrasi). Verifikasi: ketiga domain HTTP 200, bundel BARU
                Map-CsHP4DWU.js 200 & bundel LAMA Map-Slx_bSFP.js 404 di ketiganya, POST
                /broadcasting/auth 403, nginx/php8.2-fpm/reverb/reverb-staging/reverb-dev active,
                0 berkas root-owned pasca-chown, dan 0 ERROR baru (ERROR terakhir di ketiga env
                bertanggal 2026-08-26 06:07 = queue worker "Connection refused" lama).
                Route cache TIDAK dibangun ulang — routes/ tak berubah di rentang ini.
                `composer install` dilewati (composer.json & .lock tak berubah).
               TASK_43 (prompt/tasks/TASK_43_dashboard_realtime_alamat_thanks.md) — SELESAI
                (kode) 2026-08-27. Satu pesan user, tiga permintaan; dua keputusan cakupan
                ditanyakan dan dijawab "ya keduanya".
                (A) DASHBOARD TAK PERNAH AUTO-UPDATE (temuan #84). Dua lapis: tak ada siaran
                sama sekali saat laporan DIBUAT (ReportStatusChanged baru lahir pada transisi
                BERIKUTNYA), dan tak ada channel yang bisa didengar dashboard —
                report-tracking.{id} itu channel PER-LAPORAN, untuk mendengarnya harus sudah
                tahu id-nya, padahal yang ditunggu dashboard justru laporan yang belum ada.
                Kini ada event ReportFeedChanged + channel per tingkat wilayah
                (reports.{province|city|district|village}.{kode}, reports.all,
                reports.agency.{id}). EMPAT hal yang mengikat: (1) saringan dashboard dan nama
                channel WAJIB satu rumus — rumus "tingkat tersempit menang" yang dulu ditulis
                ulang di 4 tempat kini jadi User::narrowestJurisdictionColumn(), sebab kalau
                keduanya diturunkan sendiri-sendiri dashboard DIAM saat ada kejadian yang
                sebenarnya masuk daftarnya, tanpa gejala (bentuk #60/#78); (2) channels.php
                TIDAK menulis aturannya lagi, ia membandingkan permintaan ke
                User::reportFeedChannel(); (3) payloadnya ABA-ABA (reportId+status saja) karena
                penerimanya satu wilayah penuh — yang menampilkan datanya tetap server lewat
                router.reload(); (4) JANGAN digabung ke ReportStatusChanged: satu payload
                berlaku untuk semua channel sebuah event, dan payload itu memuat ALASAN
                PENOLAKAN — menggabungkannya = menyiarkan alasan penolakan ke seluruh wilayah.
                Superadmin selalu reports.all meski kolom wilayahnya terisi (dashboardnya
                memang tak disaring); kolom kosong tetap berarti DUA hal (#56): staf=nasional,
                non-staf=null. OPD memakai channel instansi, bukan wilayah (#44). Halaman
                warga/relawan MENGGABUNGKAN halaman pertama yang segar (bukan mengganti daftar)
                dan menembak route('dashboard') alih-alih router.reload(), karena setelah "muat
                lebih banyak" URL sudah pindah ke ?page=N. SISA RISIKO: dispatch ada di 6 titik
                (mengikuti pola ReportStatusChanged yang memang 5 titik) — transisi status BARU
                yang lupa menyiarkannya bikin dashboard diam untuk transisi itu.
                (B) HURUF KOREA DI FORM LAPOR (adendum #83). Penilaian TASK_42 bahwa "layar lain
                tidak terdampak" KELIRU: Front/Reports/Create.jsx menaruh display_name mentah di
                panel "Alamat Lengkap (otomatis)" + tombol "Salin ke patokan" + dropdown, dan
                ENAM form fasilitas admin menyimpannya ke kolom `address` sehingga aksaranya
                MASUK KE DATA. Kini satu helper alamatTerbaca() di lib/utils.js membuang SEGMEN
                (dipisah koma) beraksara di luar rentang Latin; "Café Romano" tetap utuh.
                CompleteProfile SENGAJA tidak ikut disaring — di sana yang benar bukan "alamat
                yang disaring" melainkan nama wilayah hasil pencocokan (TASK_42).
                GeocodeController TETAP tak disentuh.
                (C) THANKS BERHENTI DI LANGKAH PERTAMA (temuan #85): tahap aktifnya dipaku
                `i === 0` dan controller bahkan tak mengirim kolom status, jadi laporan yang
                sudah selesai pun berbunyi "Laporan Masuk". Kini status dikirim, stepper dibaca
                dari STEP_STATUS yang sejajar dengan STEPS, `ditolak` jadi keterangan tersendiri
                (jalan buntu, bukan langkah kelima), dan perubahannya masuk lewat channel &
                event yang SUDAH ADA — tanpa permukaan otorisasi baru.
                Test 310 → 323 passed (1234 assertions), 13 penjaga baru di
                ReportFeedRealtimeTest, EMPAT di antaranya dibuktikan merah dulu. Pint PASS,
                npm run build lulus. Tanpa migrasi/route/perubahan skema.
                CATATAN: saat mengerjakan ini saya sempat menjalankan `git checkout` pada
                Pages/Admin/Dashboard.jsx dan itu menghapus perubahan TASK_41 yang belum
                ter-commit di sana (label "Siaga"/"Non Aktif"); sudah dipulihkan & diperiksa
                simetris dengan kembarannya. JANGAN pakai git checkout di repo ini selama
                masih banyak perubahan belum ter-commit.
                SISA: verifikasi manual §6 file task (butuh dua browser + Reverb hidup).
                TERDEPLOY 2026-08-27 @2f8a676e ke prod/staging/dev, SEKALIGUS dengan TASK_39,
                TASK_40, TASK_41, dan TASK_42 yang selama ini belum pernah ter-commit — kelimanya
                naik dalam satu rentang commit 3efe158d..2f8a676e (8 commit, dipecah per task).
                Urutannya dev → staging → prod. TIGA MIGRASI baru (banjars, banjar_id, status)
                dijalankan di ketiga env, semuanya ADITIF sehingga tak ada risiko kehilangan data;
                cadangan mysqldump ketiga DB tetap diambil lebih dulu di VPS
                `/root/backup-predeploy-20260827-010411`. `composer install` DILEWATI (composer.json
                & .lock tak berubah di rentang ini). Verifikasi sesudahnya: data prod TIDAK berubah
                (59 users / 8 reports / 51 hydrants / 6 pompas / 0 hydrant_wargas; banjars baru = 0
                baris — MASTER BANJAR PROD & STAGING MASIH KOSONG, jadi saklar kewajiban banjar
                belum boleh dinyalakan di sana), ketiga domain HTTP 200, POST /broadcasting/auth
                403 di ketiganya (terdaftar & menolak yang tak berhak — BUKAN 404 seperti #55),
                REVERB_APP_KEY terisi di ketiga .env, ketiga service reverb aktif, chunk
                use-report-feed-*.js hadir di ketiga env, dan manifest produksi menunjuk 164 entri
                tanpa satu pun berkas hilang. Route cache DIBANGUN ULANG di ketiga env — wajib,
                karena rentang ini mengubah routes/web.php (rute banjar) dan routes/channels.php.
               TASK_42 (prompt/tasks/TASK_42_aksara_asing_deteksi_lokasi.md) — SELESAI (kode)
                2026-08-26. Laporan user: "saat pertama daftar ada tulisan korea di otomatis
                detect lokasi saat akan mengisi yurisdiksi". Layar Lengkapi Profil menaruh
                `display_name` MENTAH dari Nominatim ke kalimat "Lokasi terdeteksi di sekitar
                <X>. Wilayah di bawah sudah terisi otomatis" — dan `display_name` SELALU
                diawali objek terdekat, yang namanya adalah tag `name` OSM apa adanya, ditulis
                kontributornya dalam aksara apa pun. Nyata di data kita sendiri di koridor
                Kuta–Pemogan: "Рынок, Jalan Pandawa…", "エアアジア, Sunset Road…",
                "Длинная улица всякого, Jalan Raya Legian…". PENTING: `accept-language=id`
                yang sudah dikirim GeocodeController TIDAK bisa menolong — parameter itu hanya
                memilih di antara varian `name:<lang>`, tak pernah menyentuh tag `name` utama.
                Jadi JANGAN "perbaiki" ini di GeocodeController: memfilter aksara di sisi server
                merusak lima layar lain demi satu layar. Fix ada di pemakai datanya: banner kini
                dirangkai dari NAMA WILAYAH HASIL PENCOCOKAN (matchedVill/Dist/City/Prov, dari
                tabel indonesia_*), sehingga dijamin berbahasa Indonesia DAN dijamin sama dengan
                isi dropdown di bawahnya — dulu tak ada yang menjamin keduanya nyambung. Nol
                yang cocok = banner tidak muncul (dulu ia tetap mengklaim "sudah terisi otomatis"
                di atas dropdown kosong). Desa gagal dicocokkan = satu baris tambahan yang
                menyuruh memilih sendiri (permintaan user), dibaca dari `data.village_code`
                supaya hilang sendiri begitu desanya dipilih. SENGAJA TIDAK diikutkan:
                Front/Reports/Create.jsx (`fullAddress`) & keempat form fasilitas admin
                (`address: display_name`) — di sana yang diminta memang ALAMAT, dan nama landmark
                beraksara apa pun justru menolong responder; yang keliru di CompleteProfile bukan
                "ada nama POI" melainkan "nama POI dipakai sebagai JUDUL WILAYAH". Satu berkas
                kode, tanpa migrasi/route/perubahan sisi server. Test tetap 310 passed (1182
                assertions), npm run build lulus, chunk CompleteProfile diperiksa 0 `display_name`.
                Temuan #83 FIXED. SISA: verifikasi visual §5 file task.
               TASK_41 (prompt/tasks/TASK_41_nomor_113_wajah_info_siaga.md) — SELESAI (kode)
                2026-08-26. Satu pesan user, tiga permintaan. (1) NOMOR DARURAT 112 → 113 (113
                = nomor pemadam kebakaran nasional; 112 = darurat umum). Angkanya ternyata
                dipaku di EMPAT BELAS tempat tanpa sumber bersama (temuan #80), jadi mengganti
                nomor darurat = operasi yang harus tepat 14 kali dan satu yang terlewat membuat
                aplikasi menyebut DUA nomor darurat berbeda tanpa galat apa pun. Kini ada
                konstanta tunggal `NOMOR_DARURAT_NASIONAL` di lib/utils.js yang dibaca kesembilan
                berkas frontend; sisi server SENGAJA masih 4 literal (ReportController,
                MonitoringMapController, PosPemadamController, TenantSeeder) — menyatukannya
                menuntut kunci config + HandleInertiaRequests, keputusan tersendiri. Ikutan yang
                ikut dibetulkan: kalimat "telepon {nomor instansi} atau {nasional}" berbunyi
                "113 atau 113" bagi tenant yang belum mengisi nomornya, karena cadangannya sama
                — bagian "atau …" kini muncul hanya bila kedua nomor berbeda.
                (2) WAJAH LIMA HALAMAN INFO/LEGAL ikut halaman FASILITAS (font, jarak, bentuk
                kartu). Akarnya di InfoShell.jsx: hero `PublicPageHeader` (judul text-3xl
                font-black) + pembungkus `max-w-4xl px-4 py-6 sm:py-10` DI DALAM AppLayout yang
                sudah ber-`max-w-7xl p-4 lg:p-8` — paddingnya bertumpuk. Kini `HeaderTitle` +
                `flex w-full flex-col space-y-6 pb-32`, kartu `rounded-xl shadow-sm` + `p-5`,
                judul seksi `text-sm font-bold`, chip InfoNav `rounded-md`. `eyebrow` PINDAH ke
                slot KANAN baris kepala (tempat yang di halaman fasilitas memang disediakan untuk
                aksi). DefinitionRow DIBALIK penekanannya: isi yang foreground, label yang muted.
                ISI dokumen tidak disentuh sama sekali. AKIBAT: `PublicPageHeader` kini TANPA
                PEMAKAI (temuan #81) — halaman fasilitas berhenti memakainya 2026-08-25; berkasnya
                SENGAJA tidak dihapus karena CLAUDE.md sendiri menyimpan instruksi "jangan
                dihapus" yang lahir dari konteks yang kini berubah, jadi pencabutannya keputusan
                user. Komentar "PublicPageHeader tetap hidup" di tiga berkas fasilitas sudah
                dibetulkan supaya tidak menyesatkan sesi berikutnya.
                (3) Kartu "Mode Kesiapan" (dua kartu KEMBAR: Pages/Dashboard.jsx relawan &
                Pages/Admin/Dashboard.jsx pejabat — selalu ubah keduanya): label jadi
                "Siaga"/"Non Aktif" menggantikan "Siaga Aktif"/"Mulai Siaga". Bentuk lama tidak
                simetris — satu keadaan, satu ajakan — sehingga tak jelas mana yang berlaku.
                Judul kartu "Mode Kesiapan" TETAP.
                Test tetap 295 passed (1104 assertions), npm run build lulus, Pint PASS. Tanpa
                migrasi/route/perubahan kontrak API. SISA: verifikasi visual §5 file task.
               TASK_40 (prompt/tasks/TASK_40_skkl_pompa_dan_master_banjar.md) — SELESAI (kode)
                2026-08-26. Enam permintaan user sekaligus. (1-3) Hydrant warga KELUAR dari
                daftar Manajemen SKKL admin — kolom kapasitas & chip "Belum/Sudah Modifikasi"
                ikut hilang sebagai konsekuensi, dan "Ringkasan Air Desa" PINDAH ke menu Hydrant
                Warga dengan satu satuan saja (liter). HANYA di menu admin: /pumps publik & layer
                SKKL Peta Pemantauan TETAP menggabungkan dua sumber (keputusan user, dikunci
                test) — karena itu chip status di Pages/Pumps/Index.jsx TETAP berisi empat, jangan
                diseragamkan dengan halaman admin. Karena sumbernya tinggal satu, PompaController
                kembali ke paginasi Eloquent biasa (paginator manual dibuang). Kartu rekap muncul
                karena controller MENGIRIM prop `summary`, bukan karena komponen memeriksa
                `variant === 'warga'`. (4) Bug sidebar: entri hydrant hanya menyorot
                /admin/hydrants, jadi tab Hydrant Warga membuat sidebar tak menyorot apa pun.
                (5-6) MASTER BANJAR baru: tabel `banjars` (+ `jenis` dinas/adat nullable, kolom
                `code` untuk kode SLS bila kelak ada), `banjar_id` NULLABLE di hydrant_wargas &
                users, CRUD /admin/banjars, GET /api/banjars/{villageCode}, dropdown di form
                hydrant warga (lewat `showBanjar` di variants.jsx = DATA) & layar Lengkapi Profil,
                serta perintah `sisupit:import-banjar berkas.csv [--apply]`.
                EMPAT hal yang mengikat: (a) kolom nullable meski "wajib" — 71 akun prod & semua
                staf/OPD tak berbanjar, NOT NULL memaksa migrasi mengarang nilai; (b) kewajiban =
                SAKLAR (Setting::KEY_REQUIRE_BANJAR) default MATI, dan server MENOLAK
                menyalakannya selama master kosong (dropdown kosong yang diwajibkan = pendaftaran
                warga terkunci, gema #61); (c) banjar BUKAN tingkat kelima Tenantable — ia
                deskriptif, bukan alat kontrol akses; (d) /api/banjars WAJIB dikecualikan dari
                EnsureProfileComplete, kalau tidak halaman lengkapi-profil memantulkan
                panggilannya sendiri dan dropdown kosong selamanya tanpa galat (ditemukan test).
                DATA BANJAR: tidak ada unduhan resmi berisi NAMA se-Bali — yang publik hanya
                rekap JUMLAH (PDF DPMA 2025 diperiksa: 4 halaman). OSM juga tak bisa dipakai
                (query ke Nominatim kita: hanya 105 objek "Banjar ...", mayoritas balai banjar/
                halte, cuma 6 batas administratif). Nama diminta ke BPS Kota (banjar = SLS,
                bernama & BERKODE), Bagian Pemerintahan/Dinas PMD, atau MDA/DPMA untuk adat;
                rekap publik dipakai sebagai PENGUJI KELENGKAPAN per kecamatan.
                IMPORTIR: menerima .xlsx & .csv (Laravel Excel sudah jadi dependensi), judul
                kolom berbahasa Indonesia (Nama Banjar/Kelurahan/Alamat), dan NAMA desa —
                bukan cuma kode. Nama desa TIDAK unik se-Indonesia (KUTA ada di 8 kabupaten),
                jadi kecocokan ganda DITOLAK; pakai --city. Beda ejaan hanya diterima dengan
                --fuzzy dan HANYA bila rangka konsonannya sama persis (Klod=Kelod) — kriteria
                "jarak huruf" sempat dicoba dan langsung mengusulkan CATUR→SANUR, dua desa yang
                berbeda; JANGAN diganti levenshtein.
                Berkas user docs/List Nama Banjar Denpasar.xlsx (138 baris) sudah diimpor ke DB
                DEV: 123 banjar, tapi baru menutupi 18 DARI 43 desa Denpasar — 25 desa masih
                kosong, jadi kewajiban banjar BELUM boleh dinyalakan. 11 baris di berkas itu
                sebenarnya milik Badung (Catur/Blahkiuh/Kuta).
                Penjaga: BanjarMasterTest (12), HydrantWargaSkklTest & FacilityVillageCodeRepairTest
                disesuaikan. Test 282 → 295 passed (1104 assertions), npm run build lulus. SISA: verifikasi manual §7 + isi master banjar sebelum menyalakan
                kewajiban.
                ADENDUM 2026-08-26 (§9 file task, temuan #82 FIXED): banjar bisa tersimpan di
                bawah desa yang BUKAN miliknya — `exists:banjars,id` cuma membuktikan barisnya
                ada, dan effect di kedua form hydrant hanya me-refetch pilihan tanpa
                mengosongkan `banjar_id`, sehingga menggeser pin (yang menimpa village_code)
                membuat tandon desa A tercatat di banjar desa B tanpa galat. Kini satu aturan
                `Banjar::assertBelongsToVillage()`. DUA hal yang mengikat: banjar diadu dengan
                village_code HASIL withJurisdictionCodes (bukan isi request — akun yang desanya
                terkunci menang), dan pengosongan di form WAJIB lewat ref (tanpa syarat = layar
                Edit menghapus banjar yang sedang dibuka). Test 295 → 298 passed (1113
                assertions). BELUM dikerjakan, menunggu keputusan user: T2 penjaga saklar wajib
                masih global bukan per-desa (18 dari 43 desa Denpasar terisi → 25 desa akan
                terkunci), T3 banjar tak bisa diubah setelah diisi, T4 banjar tak tampil di
                daftar hydrant warga.
                ADENDUM 2026-08-26 (§10 file task): WARGA BOLEH MENGUSULKAN BANJAR yang belum
                terdaftar, lewat keadaan kosong dropdown. User sempat mengusulkan tabel usulan
                TERPISAH; disodori konsekuensinya lalu memilih SATU TABEL + kolom `status`
                (terverifikasi/usulan). Alasan yang mengikat: dua FK sudah menunjuk `banjars`,
                jadi tabel terpisah menuntut FK kedua di dua tabel (bentuk #60/#71), dan
                menyetujui usulan cukup MEMBALIK KOLOM sehingga id tetap & penunjuknya utuh —
                bandingkan PENGECUALIAN #1 poin 4 (pindah = hapus+buat ulang, id hilang).
                Baru: POST /api/banjars (wajib login, throttle, DIKECUALIKAN dari
                EnsureProfileComplete), Banjar::normalkanNama() (semua jadi "Banjar <Nama>"),
                rangkaNama()+cariSerupa() (vokal dibuang + th=t/dh=d/kh=k; JANGAN diganti
                Levenshtein), admin verify() + penyaring status. Ketiga layar kini memakai
                SATU komponen resources/js/Components/BanjarField.jsx — dibuat karena tiga
                salinan sudah menyimpang dan itulah #82; jangan dipecah lagi. Usulan TETAP
                muncul di dropdown (bertanda), nama mirip DITAWARKAN bukan digabung, `jenis`
                tidak ditebak. Test 298 → 305 passed. Data: panen 42 situs desa menghasilkan
                220 nama di 21 desa (docs/banjar_denpasar_hasil_panen.csv, BELUM di-apply —
                ada 4 bentrokan ejaan di docs/banjar_denpasar_konflik_ejaan.csv).
                LANJUTAN (§11 file task): master DEV TERISI — 216 baris diterapkan (123 → 319
                banjar, 18 → 33 dari 43 desa, 0 duplikat); 4 bentrokan ejaan diselesaikan dengan
                MEMBUANG salinan panen & mempertahankan ejaan DB. KETIGA ENV VPS TERISI 2026-08-27
                (prod, staging, dev): 318 baris di 32 desa, diimpor dari snapshot docs/banjar_master_denpasar.csv
                (ekspor 318 baris `terverifikasi` dari DB dev; baris `usulan` uji coba
                SENGAJA tidak ikut). Ditinjau dulu tanpa --apply di kedua env: 318 baru,
                0 ditolak. Integritas nol pelanggaran di keduanya (0 desa tak dikenal,
                0 rantai kode tak konsisten, 0 duplikat). Denpasar punya 43 desa, jadi
                cakupannya 32/43 dan SAKLAR KEWAJIBAN BANJAR TETAP MATI di ketiga env
                (diperiksa: tak ada baris setting `require_banjar` di mana pun = default
                mati). DB dev LOKAL (laragon) tetap 319/33 desa karena desa ke-33 di sana
                hanya berisi baris usulan uji itu; dev di VPS ikut 318/32 seperti prod. T4 selesai
                (banjar tampil di daftar hydrant warga, ikut array meta tersaring — bukan
                percabangan varian). T3 selesai (PATCH /profile/banjar + kartu di Profile/Edit;
                DESA TIDAK ikut dikirim, yang berlaku village_code akun). T2: rencana penjaga
                per-desa DIBATALKAN — setelah ada usulan warga, dropdown kosong bukan jalan
                buntu, dan menuntut kelengkapan 100% membuat kewajiban tak akan pernah bisa
                dinyalakan; diganti cakupanDesa() yang menampilkan "33 dari 43 desa" di sebelah
                saklarnya. Test 310 passed. SISA: verifikasi visual + deploy migrasi & master.
                DATA CONTOH (§12 file task): HydrantWargaSeeder BARU — 12 tandon di 12 desa,
                4 kecamatan. Tabel hydrant_wargas kosong sejak TASK_30, itu sebabnya kartu
                "Ringkasan Air Desa" tak pernah muncul (bukan bug). Aturan seeder: TITIK
                (centroid desa + geseran TETAP) yang menentukan desa, banjar dirujuk lewat NAMA
                bukan id (id beda antar env), rantai kode diturunkan dari kode desa — ketiganya
                buah #78. Satu baris sengaja berkapasitas NULL untuk menguji unknown_capacity.
                Idempoten (name+village_code). Dev: 12 baris, /pumps publik jadi 18, integritas
                nol pelanggaran di 5 pemeriksaan.
               TASK_39 (prompt/tasks/TASK_39_export_excel_laporan.md) — SELESAI (kode)
                2026-08-26. Permintaan user: isi Export Excel di Verifikasi Laporan sudah
                tertinggal jauh dari data yang dikumpulkan aplikasi. Dua jenis masalah, yang
                pertama LEBIH SERIUS dari kelihatannya: (a) SALAH NAMA — label status di berkas
                masih kosakata lama ("Terlapor (Belum Divalidasi)"/"Menunggu Respons"/"Sedang
                Ditangani") padahal layar sudah lama memakai kamus kanonik STATUS_META (Laporan
                Masuk/Laporan Terverifikasi/Penanganan/Selesai), jadi satu laporan punya DUA
                nama antara layar operator dan berkas yang dikirim ke pimpinan; dan status
                `ditolak` (#24) tak punya label sama sekali sehingga tercetak mentah + alasan
                penolakannya tak pernah ikut. (b) KOLOM HILANG — incident_type, OPD terkait +
                konfirmasinya, armada, jumlah foto, ringkasan Berita Acara belum pernah ada
                padahal datanya sudah lama terisi. Kini 22 → 32 kolom (LAST_COLUMN 'V' → 'AF';
                jumlah heading, LAST_COLUMN, dan columnWidths harus SELALU sama — sudah dicek).
                Catatan yang mengikat: "Taksiran Kerugian" itu TEKS BEBAS ("±1jt"), jangan
                diformat sebagai angka; nama OPD dibaca dari kolom denormalisasi
                `report_agencies.agency_name` supaya rekap lama tetap terbaca walau master OPD
                berganti nama; armada di-withTrashed karena rekap ini dokumen historis;
                "Konfirmasi OPD" hanya menghitung yang `requires_confirmation` = DATA, JANGAN
                diganti `if (agency_name === 'PLN')`; jumlah foto punya cadangan ke kolom lama
                `reports.photo` supaya laporan pra-#17 tak tercatat 0. SENGAJA TIDAK diekspor:
                identitas korban & KTP (hanya JUMLAH korban — xlsx gampang berpindah tangan
                sementara KTP dijaga gerbang baca tersendiri; dikunci test), kronologi & tim
                atensi. Nomor laporan LP-YYYY-NNNNN memakai rumus yang SAMA dengan
                reportNumber() di lib/utils.js — kalau satu diubah yang lain harus ikut.
                Tenantable TIDAK disentuh (tak ada withoutGlobalScopes).
                Test 279 → 282 passed (1072 assertions), ReportExportTest 6 → 9.
                SISA: verifikasi manual buka berkasnya di Excel (§6 file task).
               TASK_38 (prompt/tasks/TASK_38_panjang_kode_kecamatan.md) — SELESAI (kode)
                2026-08-25, permintaan user setelah membaca temuan #79 di TASK_37.
                ResolvesFacilityJurisdiction::CODE_LENGTHS memakai kecamatan 7 DIGIT padahal
                SELURUH 7.285 baris indonesia_districts 6 digit (517101), desa 10 digit.
                Angka 7 itu rupanya diambil dari LEBAR KOLOM char(district_code, 7) di migrasi
                (dan char(code,7) milik paket laravolt) — kolom longgar BUKAN berarti kodenya
                sepanjang itu; panjang kode wilayah dibaca dari ISI tabel indonesia_*.
                Akibatnya parentCode() menurunkan district_code = 5171012, kode yang tak
                dimiliki kecamatan mana pun, sehingga baris itu tak akan pernah cocok dengan
                district_code staf (6 digit) dan lenyap dari pandangan staf tingkat kecamatan
                tanpa gejala (bentuk yang sama dengan #60). str_starts_with() tetap benar apa
                pun angkanya, jadi tak ada yang menolak apa pun — bug ini hanya terlihat saat
                kode turunannya diadu dengan indonesia_districts. Fix: konstanta jadi 6, helper
                BARU districtCodeFromVillage() supaya panjang kode wilayah cuma ditulis SATU
                tempat (konstanta sementara DISTRICT_CODE_LENGTH di PompaController dihapus),
                dan FacilityJurisdictionTest dibetulkan — berkas itu ikut mematok 5171012
                sehingga menghijaukan asumsi yang salah. PELAJARAN: test yang cuma mengadu KODE
                dengan KODE tidak menjaga apa pun; penjaga barunya mengadu kode turunan dengan
                TABEL WILAYAH (dibuktikan merah dengan konstanta lama). Kolom char(7) SENGAJA
                dibiarkan (7 ≥ 6). Temuan #79 FIXED. Test 270 → 271 passed. Tanpa migrasi,
                tanpa perubahan frontend. Data dev bersih (0 baris berkode 7 digit di 8 tabel).
                TERDEPLOY 2026-08-25 @76cfccd8 ke prod/staging/dev. Query pemeriksaan §6 sudah
                dijalankan di produksi: 0 baris berkode kecamatan ≠ 6 digit di kedelapan tabel,
                jadi fix ini murni pencegahan — tak ada data yang perlu dibetulkan.
               TASK_37 (prompt/tasks/TASK_37_kode_desa_ringkasan_skkl.md) — SELESAI (kode)
                2026-08-25. Laporan user: di /admin/pumps kartu "Ringkasan Air Desa" ada baris
                berjudul ANGKA (5171012001), bukan nama desa. Gejalanya satu baris, akarnya
                data: seeder fasilitas MENGARANG kode desa — HydrantSeeder menebaknya dari KATA
                di alamat (33 dari 51 hydrant berkode yang tak pernah ada di indonesia_villages),
                Pompa/PosPemadamSeeder menulis kode + komentar yang tak cocok (5171012001 diberi
                komentar "Sanur Kaja", padahal Sanur Kaja = 5171012009). Yang kodenya kebetulan
                SAH pun banyak menunjuk desa keliru (Pos "Kuta" tersimpan di TUBAN, "Mengwi" di
                MUNGGU). Kode desa salah tak pernah menghentikan apa pun — daftar tampil, peta
                menggambar dari lat/lng, Tenantable menyaring per kota — yang meleset senyap:
                rekap per desa, filter per kecamatan, dan visibilitas bagi staf ber-kecamatan.
                Fix dua lapis. (1) Layar: waterSummary() TAK PERNAH lagi menampilkan kode; desa
                tak dikenal berjudul "Desa tidak dikenal · Kec. <nama>". ATURAN: kode wilayah
                bukan identitas tempat, jangan pernah dijadikan judul cadangan. (2) Data:
                perintah BARU `php artisan sisupit:fix-facility-village-codes` — default TINJAU,
                menulis hanya dengan --apply. Desa ditentukan ulang dari TITIK fasilitas lewat
                reverse-geocode via Api\GeocodeController (JANGAN panggil Nominatim langsung;
                lewat controller itu supaya cache 24 jam & kunci ~1 req/detik tetap satu pintu),
                centroid desa terdekat hanya cadangan (--offline). Kode yang SAH tak pernah
                ditimpa, cuma dilaporkan, kecuali diminta --include-mismatch. Seeder: 
                HydrantSeeder::getWilayahCodes() DIHAPUS → hydrantRegions() (kode per hydrant,
                pasangan tetap hydrantCoordinates(), hasil reverse-geocode yang di-hardcode);
                Pompa & PosPemadam dibetulkan satu per satu. Untuk data contoh, TITIK yang
                menentukan desa — bukan teks alamat — karena pin itulah yang dipakai peta,
                yurisdiksi, dan rekap ("Pos Sektor Juanda (Renon)" jadi SUMERTA KELOD, pin tidak
                digeser). Temuan #78 FIXED; temuan BARU #79 OPEN (sengaja tidak dikerjakan):
                ResolvesFacilityJurisdiction::CODE_LENGTHS bilang kecamatan 7 digit padahal
                SELURUH indonesia_districts 6 digit, jadi parentCode() bisa menulis district_code
                yang tak cocok dengan siapa pun — FacilityJurisdictionTest ikut mematok asumsi
                salah itu. Test 263 → 270 passed. TANPA perubahan frontend (npm run build tidak
                perlu). TERDEPLOY 2026-08-25 @76cfccd8 ke prod/staging/dev.
                DATA SUDAH DIBERSIHKAN di keempat DB (dev lokal + prod/staging/dev VPS):
                `--include-mismatch --apply`, 64 baris per env, atas persetujuan user setelah
                membaca tinjauannya; cadangan mysqldump keempat tabel fasilitas ada di VPS
                `/root/backup-kodedesa-20260825-100727`. Verifikasi sesudahnya: 0 kode desa tak
                dikenal, rantai kode desa↔kecamatan konsisten, jumlah baris tak berubah
                (51 hydrant/0 warga/6 pompa/7 pos), rekap produksi kini berbunyi PEMECUTAN,
                SANUR KAJA, TEGAL KERTHA, SESETAN, BENOA, PETANG. SISA: verifikasi visual §6.
               TASK_36 (prompt/tasks/TASK_36_keterangan_hidran.md) — SELESAI (kode)
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
                wajah yang sudah login. PublicPageHeader dulu TETAP dipakai kelima
                halaman info/legal lewat InfoShell; sejak TASK_41 (2026-08-26) halaman-halaman
                itu ikut memakai HeaderTitle, jadi komponen itu kini TANPA PEMAKAI — lihat
                temuan #81, nasibnya menunggu keputusan user.
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
Test      : php artisan test            (baseline 2026-08-28: 368 passed, 1428 assertions —
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
