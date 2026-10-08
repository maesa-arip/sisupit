<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Hydrant;
use App\Models\Regu;
use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // ====================================================================
        // JALUR 1: DASHBOARD PEJABAT, ADMIN, & SUPERADMIN (PUSAT KOMANDO)
        // ====================================================================
        if ($user->hasAnyRole(['admin', 'superadmin', 'pejabat'])) {

            // Kartu "Relawan Standby" = RELAWAN siaga saja, sama persis dengan daftar yang dibuka
            // kartunya (front.volunteers.index ?status=siaga). Dulu petugas ikut dihitung ("selalu
            // dianggap siaga"), sehingga admin Denpasar membaca 98 lalu mendapati 13 orang di
            // daftarnya - 85 selisihnya petugas (#133, pilihan user 2026-09-29).
            $queryHelpers = User::role('relawan')->where('is_standby', true);
            $queryHydrant = Hydrant::query();
            $queryReportsActive = Report::whereIn('status', ['pending', 'handling', 'TERLAPOR']);
            // Total laporan selesai (sepanjang waktu) — selaras dgn kartu "Total Penanganan"
            // di dashboard yang mengarah ke daftar laporan ?status=resolved.
            $queryReportsResolved = Report::where('status', 'resolved');
            $queryRecentList = Report::query();

            // ISOLASI YURISDIKSI
            if (! $user->hasRole('superadmin')) {
                // Rumus "tingkat tersempit yang menang" hidup di User (lihat
                // narrowestJurisdictionColumn) karena ia juga menentukan channel realtime yang
                // membangunkan dashboard ini — kalau saringan & channel diturunkan dari rumus
                // berbeda, dashboard diam saat ada kejadian yang sebenarnya masuk daftarnya.
                $column = $user->narrowestJurisdictionColumn();
                $levelCode = $column ? $user->{$column} : null;

                if ($levelCode) {
                    $queryHelpers->where($column, $levelCode);
                    $queryHydrant->where($column, $levelCode);
                    $queryReportsActive->where($column, $levelCode);
                    $queryReportsResolved->where($column, $levelCode);
                    $queryRecentList->where($column, $levelCode);
                }
            }

            $stats = [
                'active_reports' => (clone $queryReportsActive)->count(),
                'standby_helpers' => (clone $queryHelpers)->count(),
                'active_hydrants' => (clone $queryHydrant)->count(),
                'resolved_this_month' => (clone $queryReportsResolved)->count(),
            ];

            $recentReports = (clone $queryRecentList)->orderBy('created_at', 'desc')->limit(5)->get()
                ->map(fn ($report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'incident_type' => $report->incident_type,
                    'location' => $report->alamatTampil(),
                    'time' => $report->created_at->diffForHumans(),
                    'status' => $report->status,
                ]);

            // Jika dia Pejabat (tapi bukan Admin/Superadmin), kirim flag isPejabat untuk menyembunyikan tombol Edit
            $isPejabat = $user->hasRole('pejabat') && ! $user->hasAnyRole(['admin', 'superadmin']);

            // Pejabat (permintaan user 2026-10-08): insiden selesai yang butuh Laporan Kejadian
            // beserta keadaannya - belum dibuat / sementara / final. HANYA LIHAT: barisnya menuju
            // detail, tempat pejabat sudah read-only (canManageResolution = staf saja). Yang
            // belum dibuat didahulukan, lalu yang baru sementara.
            $resolutionReports = null;
            $resolutionPendingCount = null;
            if ($isPejabat) {
                // Jumlah yang belum final - daftar di bawah dibatasi 10 baris.
                $resolutionPendingCount = (clone $queryReportsResolved)
                    ->whereDoesntHave('resolutions', fn ($q) => $q->where('status', 'final'))
                    ->count();
                $resolutionReports = (clone $queryReportsResolved)
                    ->withExists([
                        'resolutions as has_resolution',
                        'resolutions as has_final' => fn ($q) => $q->where('status', 'final'),
                    ])
                    ->orderBy('has_final')
                    ->orderBy('has_resolution')
                    ->orderBy('updated_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(fn ($report) => [
                        'id' => $report->id,
                        'title' => $report->title,
                        'incident_type' => $report->incident_type,
                        'location' => $report->alamatTampil(),
                        'time' => $report->updated_at->diffForHumans(),
                        'resolution_state' => $report->has_final ? 'final' : ($report->has_resolution ? 'sementara' : 'belum'),
                    ]);
            }

            return Inertia::render('Admin/Dashboard', [
                'stats' => $stats,
                'recentReports' => $recentReports->toArray(),
                'resolutionReports' => $resolutionReports?->toArray(),
                'resolutionPendingCount' => $resolutionPendingCount,
                'isPejabat' => $isPejabat,
                'feed_channel' => $user->reportFeedChannel(),
            ]);
        }

        // ====================================================================
        // JALUR 2: DASHBOARD PETUGAS DAMKAR (OPERASIONAL TAKTIS)
        // ====================================================================
        if ($user->hasRole('petugas')) {
            $queryMissions = Report::whereIn('status', ['pending', 'handling', 'TERLAPOR']);

            // Isolasi Misi: Petugas hanya melihat misi di wilayah penugasannya
            $column = $user->narrowestJurisdictionColumn();
            $levelCode = $column ? $user->{$column} : null;
            if ($levelCode) {
                $queryMissions->where($column, $levelCode);
            }

            // Regu yang sedang meluncur ke tiap misi (TASK_60) dibaca dari SNAPSHOT di baris
            // responder, sama dengan manifes halaman detail - bukan dari keanggotaan regu hari ini.
            $activeMissions = $queryMissions
                ->with(['officers' => fn ($q) => $q->whereNotNull('regu_name')->select('id', 'report_id', 'regu_name')])
                ->orderBy('created_at', 'desc')->get()->map(fn ($report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'incident_type' => $report->incident_type,
                    'location' => $report->alamatTampil(),
                    'lat' => $report->lat,
                    'lng' => $report->lng,
                    'time' => $report->created_at->diffForHumans(),
                    'created_at' => $report->created_at,
                    'status' => $report->status,
                    'regus' => $report->officers->pluck('regu_name')->unique()->sort()->values(),
                ]);

            // Regu milik petugas yang login - ditampilkan di kepala dashboard.
            $myRegu = Regu::milik($user);

            // Antrian pasca-insiden: laporan yang SUDAH selesai ditangani tapi berita acara
            // (Laporan Kegiatan Penyelamatan) BELUM DIBUAT SAMA SEKALI. Setelah resolve(),
            // laporan hilang dari daftar misi aktif — tanpa antrian ini petugas kesulitan
            // menemukannya lagi untuk melengkapi dokumentasi. Ter-scope wilayah sama dgn misi
            // (selaras authorizeStaff di ReportResolutionController: staf dalam yurisdiksi).
            //
            // Dulu saringannya "belum ada entri FINAL". Sejak TASK_49 entri final ditutup
            // ADMIN, jadi bentuk lama membuat insiden yang sudah petugas isi menggantung
            // selamanya di kartunya menunggu orang lain — antrian yang tak bisa dibereskan
            // sendiri terbaca sebagai bug (pelajaran TASK_45/#94). Yang dituntut dari petugas
            // adalah entri sementaranya; begitu itu ada, tugasnya di sini selesai.
            $queryPending = Report::where('status', 'resolved')
                ->whereDoesntHave('resolutions');
            if ($levelCode) {
                $queryPending->where($column, $levelCode);
            }

            $pendingResolutions = $queryPending->orderBy('updated_at', 'desc')->limit(20)->get()
                ->map(fn ($report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'incident_type' => $report->incident_type,
                    'location' => $report->alamatTampil(),
                    'time' => $report->updated_at->diffForHumans(),
                    // `has_draft` DIHAPUS bersama saringan lama: isi antrian ini kini selalu
                    // "belum ada entri sama sekali", jadi flag itu hanya bisa bernilai satu —
                    // dan flag yang cuma punya satu nilai adalah klaim yang menunggu keliru.
                    'created_at' => $report->created_at,
                ]);

            return Inertia::render('Petugas/Dashboard', [
                'activeMissions' => $activeMissions->toArray(),
                'pendingResolutions' => $pendingResolutions->toArray(),
                'myRegu' => $myRegu ? ['name' => $myRegu->name, 'is_leader' => $myRegu->isLeader($user)] : null,
                'feed_channel' => $user->reportFeedChannel(),
                // Titik awal peta taktis = pusat wilayah tersempit akun (kolom `meta` laravolt:
                // {lat, long} per kecamatan/kabupaten). Dulu koordinat Denpasar ditulis mati di JSX,
                // keliru untuk tenant lain. `users` tak punya kolom lat/lng (lihat FINDINGS #174).
                'tenant_location' => $this->regionCenter($user),
                // Banner "HP belum siap menerima sirine" (#182): 0 = tak satu HP pun terdaftar.
                'fcm_device_count' => $user->fcmTokens()->count(),
            ]);
        }

        // ====================================================================
        // JALUR 2b: DASHBOARD OPD / INSTANSI TERKAIT (TASK_27)
        // ====================================================================
        // Mitra eksternal: yang relevan baginya HANYA insiden yang instansinya diminta
        // membantu — bukan seluruh laporan wilayah. Karena itu daftar diambil lewat
        // report_agencies (keanggotaan), bukan lewat kode wilayah, dan withoutGlobalScopes
        // dipakai agar permintaan lintas kelurahan tetap terlihat. Pembatasnya = agency_id
        // akun itu sendiri, yang merupakan re-check ownership pengganti Tenantable (ATURAN EMAS #7).
        if ($user->hasRole('opd')) {
            $requests = [];

            if ($user->agency_id) {
                $requests = Report::withoutGlobalScopes()
                    ->whereHas('reportAgencies', fn ($q) => $q->where('agency_id', $user->agency_id))
                    ->with(['reportAgencies' => fn ($q) => $q->where('agency_id', $user->agency_id)])
                    ->latest('created_at')
                    ->limit(30)
                    ->get()
                    ->map(function ($report) {
                        $pivot = $report->reportAgencies->first();

                        return [
                            'id' => $report->id,
                            'title' => $report->title,
                            'incident_type' => $report->incident_type,
                            'location' => $report->alamatTampil(),
                            'time' => $report->created_at->diffForHumans(),
                            'status' => $report->status,
                            'requires_confirmation' => (bool) $pivot?->requires_confirmation,
                            'confirmation_label' => $pivot?->confirmation_label,
                            'confirmed_at' => $pivot?->confirmed_at,
                        ];
                    });
            }

            return Inertia::render('Opd/Dashboard', [
                // Relasi $user->agency TIDAK dipakai: Agency ber-Tenantable, sedangkan akun OPD
                // sengaja tanpa kode wilayah (mitra luar, relevansinya keanggotaan bukan wilayah)
                // sehingga relasi itu kena cabang "tanpa kode wilayah → whereRaw('1 = 0')" (#44)
                // dan mengembalikan null. Akibatnya dashboard menuduh akun yang SUDAH tertaut
                // "belum ditautkan ke instansi mana pun". Pembatasnya tetap agency_id akun itu
                // sendiri — re-check ownership yang sama seperti query $requests di atas
                // (ATURAN EMAS #7).
                'agencyName' => $user->agency_id
                    ? Agency::withoutGlobalScopes()->whereKey($user->agency_id)->value('name')
                    : null,
                'requests' => $requests,
                'feed_channel' => $user->reportFeedChannel(),
            ]);
        }

        // ====================================================================
        // JALUR 3: DASHBOARD PUBLIK (WARGA & RELAWAN)
        // ====================================================================

        // 1. Data Riwayat Laporan Milik Sendiri (Di-bypass Tenantable agar terlihat walau melapor di luar kota)
        $myReports = Report::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // 1b. Laporan milik sendiri yang MASIH berjalan (#165) - kartu "Laporan Anda" di puncak
        // Beranda supaya pelapor tak perlu mencari status lewat Riwayat. Bypass Tenantable sama
        // seperti 1.: kepemilikan (`user_id`) adalah gerbangnya. Digabung tidak ikut - yang
        // bergerak adalah laporan induknya, dan Riwayat tetap menampilkannya.
        $activeReports = Report::withoutGlobalScopes()
            ->where('user_id', $user->id)
            ->whereIn('status', ['TERLAPOR', 'pending', 'handling'])
            ->latest('created_at')
            ->limit(3)
            ->get(['id', 'title', 'status', 'created_at']);

        // 2. Data Radar Khusus Relawan (Di-filter berdasarkan area relawan)
        $nearbyEmergencies = [];
        if ($user->hasRole('relawan')) {
            $queryEmergencies = Report::whereIn('status', ['pending', 'TERLAPOR']);

            $column = $user->narrowestJurisdictionColumn();
            $levelCode = $column ? $user->{$column} : null;

            if ($levelCode) {
                $queryEmergencies->where($column, $levelCode);
            }

            $nearbyEmergencies = $queryEmergencies->orderBy('created_at', 'desc')->get()->map(fn ($report) => [
                'id' => $report->id,
                'title' => $report->title,
                'incident_type' => $report->incident_type,
                'location' => $report->alamatTampil(),
                'time' => $report->created_at->diffForHumans(),
                'status' => $report->status,
            ]);
        }

        // 2b. Tugas yang sedang/pernah ditangani relawan ini — DI-BYPASS Tenantable agar
        // tugasnya sendiri tetap terlihat walau insidennya di luar desanya (feed di bawah
        // ter-scope desa, jadi tugas lintas wilayah akan hilang dari tab "Tugas Saya").
        $myTasks = [];
        if ($user->hasRole('relawan')) {
            $myTasks = Report::withoutGlobalScopes()
                ->with(['helpers.user'])
                ->whereHas('helpers', fn ($q) => $q->where('user_id', $user->id))
                ->whereNotIn('status', ['ditolak', Report::STATUS_DIGABUNG])
                ->latest('created_at')
                ->get();
        }

        // 3. Data Feed Laporan untuk TABS (Butuh Respons / Tugas Saya / Semua Laporan)
        // Tanpa withoutGlobalScopes() agar tunduk ke scope Tenantable: feed otomatis
        // terbatas ke wilayah (desa/kecamatan/kabupaten/provinsi) milik warga yang melihat,
        // konsisten dengan $nearbyEmergencies di atas.
        $reportsFeed = Report::with(['helpers.user'])
            // Laporan ditolak & laporan ganda yang sudah digabung (TASK_55) tak tampil di
            // radar/feed publik - yang digabung akan terbaca sebagai kejadian kedua.
            ->whereNotIn('status', ['ditolak', Report::STATUS_DIGABUNG])
            ->latest('created_at')
            ->paginate(request()->load ?? 6)
            ->withQueryString();

        return Inertia::render('Dashboard', [
            'myReports' => $myReports,
            'activeReports' => $activeReports,
            'isRelawan' => $user->hasRole('relawan'),
            'nearbyEmergencies' => $nearbyEmergencies,
            'myTasks' => $myTasks,
            'page_data' => [
                'reports' => $reportsFeed,  // Sekarang page_data.reports terisi dengan sempurna!
            ],
            'feed_channel' => $user->reportFeedChannel(),
            // Banner "HP belum siap menerima sirine" (#182) - hanya relawan yang menerima sirine.
            'fcm_device_count' => $user->hasRole('relawan') ? $user->fcmTokens()->count() : null,
        ]);
    }

    /**
     * Pusat wilayah akun dari data laravolt (`indonesia_districts`/`indonesia_cities`.meta),
     * dari yang tersempit. Cadangan Denpasar bila kode wilayah kosong atau meta tak berisi.
     */
    private function regionCenter(User $user): array
    {
        foreach (['indonesia_districts' => $user->district_code, 'indonesia_cities' => $user->city_code] as $table => $code) {
            if (! $code) {
                continue;
            }

            $meta = json_decode((string) DB::table($table)->where('code', $code)->value('meta'), true);
            if (isset($meta['lat'], $meta['long'])) {
                return ['lat' => (float) $meta['lat'], 'lng' => (float) $meta['long']];
            }
        }

        return ['lat' => -8.65, 'lng' => 115.22];
    }
}
