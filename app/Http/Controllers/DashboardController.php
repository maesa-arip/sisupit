<?php

namespace App\Http\Controllers;

use App\Models\Agency;
use App\Models\Hydrant;
use App\Models\Pompa;
use App\Models\PosPemadam;
use App\Models\Regu;
use App\Models\Report;
use App\Models\ReportAgency;
use App\Models\ReportResolution;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        // ====================================================================
        // JALUR 1: DASHBOARD ADMIN & SUPERADMIN (PUSAT KOMANDO) - TASK_72
        // ====================================================================
        if ($user->hasAnyRole(['admin', 'superadmin'])) {
            $data = $this->commandCenter($user);

            // Superadmin (fase 6): papan per wilayah + kesehatan sistem di atas Pusat Komando lintas wilayah.
            if ($user->hasRole('superadmin')) {
                $data['regions'] = $this->regionBoard();
                $data['systemHealth'] = $this->systemHealth();
            }

            return Inertia::render('Admin/Dashboard', $data);
        }

        // ====================================================================
        // JALUR 1b: DASHBOARD PEJABAT (PEMANTAU)
        // ====================================================================
        // Sejak TASK_72 pejabat punya halaman sendiri (keputusan user 2026-10-04): ringkasan layanan
        // strategis tanpa tombol aksi (fase 5, officialOverview()).
        if ($user->hasRole('pejabat')) {
            return Inertia::render('Pejabat/Dashboard', $this->officialOverview($user));
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
            // TASK_72: tiap misi membawa hitungan responder AKTIF (en_route/arrived) dan apakah petugas
            // ini sendiri sudah meluncur / tercatat jaga kantor - penentu baris "Butuh Unit" vs "Sedang
            // Ditangani" dan tombol aksi cepatnya di dashboard.
            $live = fn ($q) => $q->whereIn('status', ['en_route', 'arrived']);
            $activeMissions = $queryMissions
                ->with(['officers' => fn ($q) => $q->whereNotNull('regu_name')->select('id', 'report_id', 'regu_name')])
                ->withCount(['officers as officers_live_count' => $live, 'helpers as helpers_live_count' => $live])
                ->withExists([
                    'officers as i_responded' => fn ($q) => $live($q)->where('user_id', $user->id),
                    'jagaKantor as i_stay' => fn ($q) => $q->where('user_id', $user->id),
                ])
                ->orderBy('created_at', 'desc')->get()->map(fn ($report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'location' => $report->alamatTampil(),
                    'lat' => $report->lat,
                    'lng' => $report->lng,
                    'time' => $report->created_at->diffForHumans(),
                    'created_at' => $report->created_at,
                    'status' => $report->status,
                    'regus' => $report->officers->pluck('regu_name')->unique()->sort()->values(),
                    'officers_count' => $report->officers_live_count,
                    'helpers_count' => $report->helpers_live_count,
                    'i_responded' => (bool) $report->i_responded,
                    'i_stay' => (bool) $report->i_stay,
                ]);

            // Regu milik petugas yang login - ditampilkan di kepala dashboard.
            $myRegu = Regu::milik($user);
            $reguMembers = $myRegu ? $myRegu->members()->get(['users.id', 'users.name']) : collect();

            // "Misi Saya" (TASK_72): insiden yang petugas INI sedang tuju / sudah tiba. Lepas Tenantable
            // seperti `myTasks` relawan - re-check-nya baris report_officers milik user ini sendiri
            // (ATURAN EMAS #7), supaya misi lintas wilayah yang sudah ia ambil tetap terlihat.
            $myMissions = Report::withoutGlobalScopes()
                ->whereIn('status', ['pending', 'handling'])
                ->whereHas('officers', fn ($q) => $live($q)->where('user_id', $user->id))
                ->with(['reportAgencies:id,report_id,agency_name,requires_confirmation,confirmed_at'])
                ->latest('created_at')
                ->get()
                ->map(function (Report $report) use ($user, $reguMembers) {
                    $mine = DB::table('report_officers')->where('report_id', $report->id)->where('user_id', $user->id)
                        ->first(['status', 'dispatched_at', 'arrived_at']);

                    return [
                        'id' => $report->id,
                        'title' => $report->title,
                        'location' => $report->alamatTampil(),
                        'lat' => $report->lat,
                        'lng' => $report->lng,
                        'status' => $report->status,
                        'my_status' => $mine?->status,
                        'dispatched_at' => $mine?->dispatched_at ? Carbon::parse($mine->dispatched_at)->toIso8601String() : null,
                        'arrived_at' => $mine?->arrived_at ? Carbon::parse($mine->arrived_at)->toIso8601String() : null,
                        'agencies' => $report->reportAgencies->map(fn ($a) => [
                            'name' => $a->agency_name,
                            'waiting' => $a->requires_confirmation && ! $a->confirmed_at,
                        ])->values(),
                        'water' => $this->nearestWater($report->lat, $report->lng),
                        'regu' => $this->reguManifest($report->id, $reguMembers),
                    ];
                });

            // Papan regu untuk DANRU (TASK_72): per insiden terverifikasi yang sudah menyentuh regunya
            // (minimal satu anggota Meluncur / Jaga di Kantor), siapa yang belum memilih - calon
            // "alpha" (TASK_66) selagi masih bisa diingatkan, bukan sesudah insiden ditutup.
            $reguBoard = [];
            if ($myRegu && $myRegu->isLeader($user)) {
                $reguBoard = $activeMissions->where('status', '!=', 'TERLAPOR')
                    ->map(fn ($m) => ['id' => $m['id'], 'title' => $m['title'], 'members' => $this->reguManifest($m['id'], $reguMembers)])
                    ->filter(fn ($row) => collect($row['members'])->contains(fn ($x) => $x['state'] !== 'belum'))
                    ->values()
                    ->toArray();
            }

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
                'myMissions' => $myMissions->toArray(),
                'reguBoard' => $reguBoard,
                'feed_channel' => $user->reportFeedChannel(),
                // Titik awal peta taktis = pusat wilayah tersempit akun (kolom `meta` laravolt:
                // {lat, long} per kecamatan/kabupaten). Dulu koordinat Denpasar ditulis mati di JSX,
                // keliru untuk tenant lain. `users` tak punya kolom lat/lng (lihat FINDINGS #174).
                'tenant_location' => $this->regionCenter($user),
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
                            'location' => $report->alamatTampil(),
                            'time' => $report->created_at->diffForHumans(),
                            'status' => $report->status,
                            'requires_confirmation' => (bool) $pivot?->requires_confirmation,
                            'confirmation_label' => $pivot?->confirmation_label,
                            'confirmed_at' => $pivot?->confirmed_at,
                            // TASK_72: konfirmasi langsung dari dashboard (agency_id = body confirmAgency),
                            // tombol arah ke TKP, dan durasi sejak diminta.
                            'agency_id' => $pivot?->agency_id,
                            'lat' => $report->lat,
                            'lng' => $report->lng,
                            'created_at' => $report->created_at?->toIso8601String(),
                            'notified_at' => $pivot?->notified_at,
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

        // 2. Kejadian di wilayah (TASK_72, keputusan user 2026-10-04): HANYA yang sudah diverifikasi
        // (pending/handling) di KECAMATAN akun, maks 3, tanpa data pelapor - kesadaran situasi, bukan feed.
        // TERLAPOR tak tampil (belum tentu benar), digabung/ditolak/selesai juga tidak. Tenantable dilepas
        // karena scope warga berhenti di DESA, lebih sempit dari keputusan; pembatasnya kolom kecamatan
        // akun sendiri + daftar kolom yang dipetakan eksplisit di bawah (tanpa user_id/nama/telepon).
        $areaIncidents = [];
        $areaColumn = $user->district_code ? 'district_code' : ($user->city_code ? 'city_code' : null);
        if ($areaColumn) {
            $areaIncidents = Report::withoutGlobalScopes()
                ->where($areaColumn, $user->{$areaColumn})
                ->whereIn('status', ['pending', 'handling'])
                ->latest('created_at')
                ->limit(3)
                ->get()
                ->map(fn (Report $r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'location' => $r->alamatTampil(),
                    'status' => $r->status,
                    'created_at' => $r->created_at?->toIso8601String(),
                ])
                ->toArray();
        }

        // 3. Fasilitas terdekat (TASK_72): pos pemadam & hydrant aktif di KABUPATEN akun. Data publik - sama
        // dengan halaman /fire-stations & /hydrants yang terbuka untuk tamu - jadi Tenantable dilepas dan
        // dibatasi kolom kota akun. Klien mengurutkan ulang dengan GPS; tanpa GPS urutan = jarak ke pusat
        // wilayah akun (regionCenter). Hydrant dibatasi 300 terdekat supaya muatan halaman tetap kecil.
        $center = $this->regionCenter($user);
        $byCenter = fn ($row) => $this->haversineMeters($center['lat'], $center['lng'], (float) $row->lat, (float) $row->lng);
        $facilities = ['stations' => [], 'hydrants' => [], 'center' => $center];
        if ($user->city_code) {
            $facilities['stations'] = PosPemadam::withoutGlobalScopes()
                ->where('city_code', $user->city_code)->whereNotNull('lat')->whereNotNull('lng')
                ->get(['id', 'name', 'address', 'phone', 'lat', 'lng'])
                ->sortBy($byCenter)->values()
                ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'address' => $p->address, 'phone' => $p->phone, 'lat' => (float) $p->lat, 'lng' => (float) $p->lng])
                ->toArray();
            $facilities['hydrants'] = Hydrant::withoutGlobalScopes()
                ->where('city_code', $user->city_code)->where('status', 'Aktif')->whereNotNull('lat')->whereNotNull('lng')
                ->get(['id', 'name', 'lat', 'lng', 'water_pressure'])
                ->sortBy($byCenter)->take(300)->values()
                ->map(fn ($h) => ['id' => $h->id, 'name' => $h->name, 'water_pressure' => $h->water_pressure, 'lat' => (float) $h->lat, 'lng' => (float) $h->lng])
                ->toArray();
        }

        // 4. Relawan (TASK_72). Tugas & hitungan kontribusi lepas Tenantable dengan gerbang baris
        // report_helpers milik relawan ini sendiri (ATURAN EMAS #7) - tugas lintas wilayahnya tetap terlihat.
        $needHelp = [];
        $activeTasks = [];
        $tasksDone = 0;
        if ($user->hasRole('relawan')) {
            $live = fn ($q) => $q->whereIn('status', ['en_route', 'arrived']);

            // "Butuh bantuan sekarang": terverifikasi & masih berjalan di wilayah relawan, yang belum ia ikuti.
            // Query SERVER - tab lama "Butuh Respons" hanya menyaring halaman feed yang kebetulan termuat.
            $queryNeed = Report::whereIn('status', ['pending', 'handling'])
                ->whereDoesntHave('helpers', fn ($q) => $live($q)->where('user_id', $user->id));
            $column = $user->narrowestJurisdictionColumn();
            if ($column) {
                $queryNeed->where($column, $user->{$column});
            }
            $needHelp = $queryNeed
                ->withCount(['officers as officers_count' => $live, 'helpers as helpers_count' => $live])
                ->latest('created_at')
                ->limit(20)
                ->get()
                ->map(fn (Report $r) => [
                    'id' => $r->id,
                    'title' => $r->title,
                    'location' => $r->alamatTampil(),
                    'status' => $r->status,
                    'lat' => $r->lat,
                    'lng' => $r->lng,
                    'created_at' => $r->created_at?->toIso8601String(),
                    'officers_count' => $r->officers_count,
                    'helpers_count' => $r->helpers_count,
                ])
                ->toArray();

            $activeTasks = Report::withoutGlobalScopes()
                ->whereIn('status', ['pending', 'handling'])
                ->whereHas('helpers', fn ($q) => $live($q)->where('user_id', $user->id))
                ->latest('created_at')
                ->get()
                ->map(function (Report $r) use ($user) {
                    $mine = DB::table('report_helpers')->where('report_id', $r->id)->where('user_id', $user->id)
                        ->first(['status', 'started_at', 'arrived_at']);

                    return [
                        'id' => $r->id,
                        'title' => $r->title,
                        'location' => $r->alamatTampil(),
                        'lat' => $r->lat,
                        'lng' => $r->lng,
                        'my_status' => $mine?->status,
                        'started_at' => $mine?->started_at ? Carbon::parse($mine->started_at)->toIso8601String() : null,
                        'arrived_at' => $mine?->arrived_at ? Carbon::parse($mine->arrived_at)->toIso8601String() : null,
                    ];
                })
                ->toArray();

            $tasksDone = DB::table('report_helpers')->where('user_id', $user->id)->where('status', 'finished')->count();
        }

        return Inertia::render('Dashboard', [
            'myReports' => $myReports,
            'activeReports' => $activeReports,
            'isRelawan' => $user->hasRole('relawan'),
            'areaIncidents' => $areaIncidents,
            'areaLevel' => $areaColumn === 'district_code' ? 'kecamatan' : ($areaColumn ? 'kabupaten' : null),
            'facilities' => $facilities,
            'needHelp' => $needHelp,
            'activeTasks' => $activeTasks,
            'tasksDone' => $tasksDone,
            'feed_channel' => $user->reportFeedChannel(),
        ]);
    }

    /**
     * Isi dashboard Pusat Komando (admin & superadmin), TASK_72. Satu pertanyaan utama: "laporan
     * mana yang harus saya putuskan sekarang?" - jadi antrian triase (TERLAPOR, terlama di atas)
     * adalah blok pertama, disusul papan kejadian aktif, angka kunci, pekerjaan tertunda, dan
     * sumber daya siaga.
     *
     * Report/Hydrant/Regu ber-Tenantable, jadi wilayahnya sudah tersaring di data-layer; saringan
     * kolom eksplisit di bawah HANYA untuk relawan (User tak memakai Tenantable) dan sama persis
     * dengan daftar `/relawan?status=siaga` yang dibuka kartunya (#133).
     */
    private function commandCenter(User $user): array
    {
        $column = $user->hasRole('superadmin') ? null : $user->narrowestJurisdictionColumn();
        $levelCode = $column ? $user->{$column} : null;
        $iso = fn ($time) => $time?->toIso8601String();

        // --- 1. Antrian triase: laporan yang menunggu keputusan verifikasi, TERLAMA dulu.
        $triageQuery = Report::where('status', 'TERLAPOR');
        $triage = (clone $triageQuery)
            ->with('candidateOf:id,title')
            ->withCount('photos')
            ->oldest('created_at')
            ->limit(20)
            ->get()
            ->map(fn (Report $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'location' => $r->alamatTampil(),
                'created_at' => $iso($r->created_at),
                'photo' => $r->photo,
                // Galeri kosong pada laporan lama = foto sampul di kolom `photo` (pola ReportController).
                'photos_count' => $r->photos_count ?: ($r->photo ? 1 : 0),
                'has_coords' => $r->lat !== null && $r->lng !== null,
                'duplicate_of' => $r->candidateOf ? ['id' => $r->candidateOf->id, 'title' => $r->candidateOf->title] : null,
            ]);

        // --- 2. Papan kejadian aktif. Responder aktif = baris en_route/arrived (finished = sudah ditutup).
        $live = fn ($q) => $q->whereIn('status', ['en_route', 'arrived']);
        $active = Report::whereIn('status', ['pending', 'handling'])
            ->withCount([
                'officers as officers_count' => $live,
                'helpers as helpers_count' => $live,
                'officers as officers_arrived_count' => fn ($q) => $q->where('status', 'arrived'),
                'reportAgencies as agencies_waiting_count' => fn ($q) => $q->where('requires_confirmation', true)->whereNull('confirmed_at'),
            ])
            ->latest('created_at')
            ->limit(30)
            ->get()
            ->map(fn (Report $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'location' => $r->alamatTampil(),
                'status' => $r->status,
                'created_at' => $iso($r->created_at),
                'officers_count' => $r->officers_count,
                'officers_arrived_count' => $r->officers_arrived_count,
                'helpers_count' => $r->helpers_count,
                'agencies_waiting_count' => $r->agencies_waiting_count,
            ]);

        // Eskalasi di atas: terverifikasi tapi belum satu pun responder bergerak (terlama dulu),
        // baru sisanya (terbaru dulu, urutan query).
        [$unmanned, $manned] = $active->partition(fn ($r) => $r['officers_count'] + $r['helpers_count'] === 0);
        $active = $unmanned->sortBy('created_at')->concat($manned)->values();

        // --- 3. Angka kunci. "Hari ini" = hari JAM DINDING (WITA), batasnya dikonversi ke UTC (#134).
        $todayStart = now(config('app.local_timezone'))->startOfDay()->utc();
        $weekAgo = now()->subDays(7);

        $kpis = [
            'incoming_today' => Report::where('created_at', '>=', $todayStart)->count(),
            // Sama persis dengan daftar admin.reports.index?status=aktif yang dibuka kartunya.
            'active_now' => Report::whereIn('status', ['TERLAPOR', 'pending', 'handling'])->count(),
            // Lapor -> diverifikasi. Hanya laporan yang punya approved_at (kolom baru, tanpa backfill).
            'median_approval' => $this->medianMinutes(
                Report::where('created_at', '>=', $weekAgo)->whereNotNull('approved_at')
                    ->get(['created_at', 'approved_at'])
                    ->map(fn ($r) => $r->created_at->diffInSeconds($r->approved_at))
            ),
            // Lapor -> petugas PERTAMA meluncur.
            'median_response' => $this->medianMinutes(
                Report::where('reports.created_at', '>=', $weekAgo)
                    ->join('report_officers', 'report_officers.report_id', '=', 'reports.id')
                    ->whereNotNull('report_officers.dispatched_at')
                    ->groupBy('reports.id', 'reports.created_at')
                    ->get(['reports.created_at', DB::raw('MIN(report_officers.dispatched_at) as first_dispatch')])
                    ->map(fn ($r) => $r->created_at->diffInSeconds(Carbon::parse($r->first_dispatch)))
            ),
        ];

        // --- 4. Pekerjaan tertunda.
        // Laporan Kejadian belum final, insiden 30 hari terakhir: insiden dari sebelum fitur Berita
        // Acara ada (#39) tak pernah punya entri, dan menghitungnya membuat angka ini tak bisa nol.
        $baQuery = Report::where('status', 'resolved')
            ->where('created_at', '>=', now()->subDays(30))
            ->whereDoesntHave('resolutions', fn ($q) => $q->where('status', 'final'));
        $baItems = (clone $baQuery)->withCount('resolutions')->latest('updated_at')->limit(5)->get()
            ->map(fn (Report $r) => [
                'id' => $r->id,
                'title' => $r->title,
                'location' => $r->alamatTampil(),
                'has_draft' => $r->resolutions_count > 0,
            ]);

        // OPD yang diminta konfirmasi tapi belum menjawab, pada insiden yang masih berjalan.
        // whereHas('report') tunduk Tenantable laporan, jadi pivot wilayah lain tak ikut.
        $agencyQuery = ReportAgency::query()
            ->where('requires_confirmation', true)
            ->whereNull('confirmed_at')
            ->whereHas('report', fn ($q) => $q->whereIn('status', ['pending', 'handling']));
        $agencyItems = (clone $agencyQuery)->with('report:id,title')->latest('id')->limit(5)->get()
            ->map(fn (ReportAgency $a) => [
                'report_id' => $a->report_id,
                'agency_name' => $a->agency_name,
                'label' => $a->confirmation_label,
                'title' => $a->report?->title,
            ]);

        // --- 5. Sumber daya siaga.
        $volunteers = User::role('relawan')->where('is_standby', true);
        if ($levelCode) {
            $volunteers->where($column, $levelCode);
        }

        return [
            'triage' => $triage->toArray(),
            'triageTotal' => (clone $triageQuery)->count(),
            'activeIncidents' => $active->toArray(),
            'kpis' => $kpis,
            'pendingWork' => [
                'ba_total' => (clone $baQuery)->count(),
                'ba_items' => $baItems->toArray(),
                'agency_total' => (clone $agencyQuery)->count(),
                'agency_items' => $agencyItems->toArray(),
                // Sama dengan admin.hydrants.index?status=Perbaikan yang dibuka barisnya.
                'hydrant_repair' => Hydrant::where('status', 'Perbaikan')->count(),
            ],
            'resources' => [
                'standby_volunteers' => $volunteers->count(),
                'regus' => Regu::count(),
                'hydrants_total' => Hydrant::count(),
                'hydrants_active' => Hydrant::where('status', 'Aktif')->count(),
            ],
            'feed_channel' => $user->reportFeedChannel(),
        ];
    }

    /** Median durasi (detik) dibulatkan ke menit + jumlah sampelnya, atau null bila belum ada sampel. */
    private function medianMinutes(Collection $seconds): ?array
    {
        $sorted = $seconds->filter(fn ($s) => $s !== null && $s >= 0)->sort()->values();
        if ($sorted->isEmpty()) {
            return null;
        }

        $n = $sorted->count();
        $mid = intdiv($n, 2);
        $median = $n % 2 ? $sorted[$mid] : ($sorted[$mid - 1] + $sorted[$mid]) / 2;

        return ['minutes' => (int) round($median / 60), 'sample' => $n];
    }

    /**
     * Tiga sumber air terdekat ke TKP (hydrant resmi yang tidak dalam perbaikan + SKKL), TASK_72 -
     * informasi yang paling dicari petugas di jalan. Ber-Tenantable (wilayah petugas), disaring kotak
     * ±0,02 derajat (~2 km) dulu lalu diurutkan jarak garis lurus.
     */
    private function nearestWater($lat, $lng): array
    {
        if ($lat === null || $lng === null || ! is_numeric($lat) || ! is_numeric($lng)) {
            return [];
        }
        $lat = (float) $lat;
        $lng = (float) $lng;
        $box = fn ($q) => $q->whereBetween('lat', [$lat - 0.02, $lat + 0.02])->whereBetween('lng', [$lng - 0.02, $lng + 0.02]);

        $hydrants = $box(Hydrant::query())->where('status', '!=', 'Perbaikan')->get(['id', 'name', 'lat', 'lng', 'water_pressure'])
            ->map(fn ($h) => [
                'kind' => 'hydrant', 'id' => $h->id, 'name' => $h->name,
                'detail' => $h->water_pressure ? 'Tekanan '.strtolower($h->water_pressure) : null,
                'lat' => (float) $h->lat, 'lng' => (float) $h->lng,
            ]);
        $pumps = $box(Pompa::query())->where('status', '!=', 'Perbaikan')->get(['id', 'name', 'lat', 'lng', 'capacity_lpm'])
            ->map(fn ($p) => [
                'kind' => 'skkl', 'id' => $p->id, 'name' => $p->name,
                'detail' => $p->capacity_lpm ? $p->capacity_lpm.' L/menit' : null,
                'lat' => (float) $p->lat, 'lng' => (float) $p->lng,
            ]);

        return $hydrants->concat($pumps)
            ->map(fn ($w) => $w + ['distance_m' => (int) round($this->haversineMeters($lat, $lng, $w['lat'], $w['lng']))])
            ->sortBy('distance_m')
            ->take(3)
            ->values()
            ->toArray();
    }

    private function haversineMeters(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $r = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return 2 * $r * asin(sqrt($a));
    }

    /**
     * Keadaan tiap anggota regu untuk satu insiden (TASK_72): tiba / meluncur / jaga / belum memilih.
     * Dibaca dari baris report_officers & report_jaga_kantor milik ANGGOTA regu hari ini - ini papan
     * kerja yang sedang berjalan, bukan riwayat (riwayat memakai snapshot regu_name di halaman detail).
     */
    private function reguManifest(int $reportId, Collection $members): array
    {
        if ($members->isEmpty()) {
            return [];
        }
        $ids = $members->pluck('id');
        $officers = DB::table('report_officers')->where('report_id', $reportId)->whereIn('user_id', $ids)
            ->whereIn('status', ['en_route', 'arrived'])->pluck('status', 'user_id');
        $staying = DB::table('report_jaga_kantor')->where('report_id', $reportId)->whereIn('user_id', $ids)->pluck('user_id')->flip();

        $order = ['tiba' => 0, 'meluncur' => 1, 'jaga' => 2, 'belum' => 3];

        return $members->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->name,
            'state' => match (true) {
                ($officers[$m->id] ?? null) === 'arrived' => 'tiba',
                isset($officers[$m->id]) => 'meluncur',
                isset($staying[$m->id]) => 'jaga',
                default => 'belum',
            },
        ])->sortBy(fn ($m) => [$order[$m['state']], $m['name']])->values()->toArray();
    }

    /**
     * Isi dashboard pejabat (pemantau), TASK_72 fase 5. Satu pertanyaan utama: "apakah layanan berjalan
     * baik, dan di mana masalahnya?" - jadi strategis & tanpa tombol aksi: situasi saat ini, kinerja per
     * periode, tren, titik rawan per kecamatan, kesiapan sarana, Laporan Kejadian final.
     *
     * Report/Hydrant/Pompa/PosPemadam ber-Tenantable (wilayah pejabat). Saringan kolom eksplisit ditambahkan
     * sama seperti jalur lain (narrowestJurisdictionColumn), dan relawan disaring manual (User tanpa Tenantable).
     */
    private function officialOverview(User $user): array
    {
        $column = $user->narrowestJurisdictionColumn();
        $levelCode = $column ? $user->{$column} : null;
        $scoped = fn ($q) => $levelCode ? $q->where($column, $levelCode) : $q;

        $tz = config('app.local_timezone');
        $periods = ['7' => '7 hari', '30' => '30 hari', '90' => '90 hari', 'tahun' => 'Tahun ini'];
        $period = array_key_exists((string) request('periode'), $periods) ? (string) request('periode') : '30';
        $start = $period === 'tahun'
            ? now($tz)->startOfYear()->utc()
            : now($tz)->subDays((int) $period - 1)->startOfDay()->utc();

        // Kejadian = laporan yang bukan ditolak (hoaks) & bukan laporan ganda yang digabung (TASK_55).
        // Kolom ber-awalan `reports.`: kueri median menggabung report_officers, yang juga punya `status`.
        $incidents = fn () => Report::query()
            ->when($levelCode, fn ($q) => $q->where("reports.{$column}", $levelCode))
            ->whereNotIn('reports.status', ['ditolak', Report::STATUS_DIGABUNG]);
        $inPeriod = fn () => $incidents()->where('reports.created_at', '>=', $start);

        $total = $inPeriod()->count();
        $resolved = $inPeriod()->where('reports.status', 'resolved')->count();

        // Lapor -> petugas PERTAMA meluncur / tiba (kolom report_officers, sama dengan dashboard admin).
        $firstOfficer = fn (string $col) => $inPeriod()
            ->join('report_officers', 'report_officers.report_id', '=', 'reports.id')
            ->whereNotNull("report_officers.{$col}")
            ->groupBy('reports.id', 'reports.created_at')
            ->get(['reports.created_at', DB::raw("MIN(report_officers.{$col}) as first_at")])
            ->map(fn ($r) => $r->created_at->diffInSeconds(Carbon::parse($r->first_at)));

        // Korban hanya dari Laporan Kejadian FINAL: entri sementara & final menyalin korban yang sama,
        // jadi menjumlahkan keduanya menghitung satu orang dua kali. Kerugian TIDAK dijumlahkan - kolomnya
        // teks bebas ("±50 juta"), dan menjumlahkan teks hanya menghasilkan angka palsu.
        $victims = DB::table('report_victims')
            ->join('report_resolutions', 'report_resolutions.id', '=', 'report_victims.report_resolution_id')
            ->where('report_resolutions.status', 'final')
            ->whereIn('report_resolutions.report_id', $inPeriod()->select('reports.id'))
            ->count();

        // Tren: harian (7 hari), mingguan (30/90 hari), bulanan (tahun ini) - di kalender WITA.
        $unit = $period === '7' ? 'day' : ($period === 'tahun' ? 'month' : 'week');
        $bucketKey = fn (Carbon $t) => match ($unit) {
            'day' => $t->format('Y-m-d'),
            'week' => $t->copy()->startOfWeek()->format('Y-m-d'),
            'month' => $t->format('Y-m'),
        };
        $counts = $inPeriod()->get(['reports.created_at'])
            ->countBy(fn ($r) => $bucketKey($r->created_at->copy()->setTimezone($tz)));
        $trend = [];
        $cursor = $start->copy()->setTimezone($tz);
        $end = now($tz);
        $cursor = match ($unit) {
            'week' => $cursor->startOfWeek(),
            'month' => $cursor->startOfMonth(),
            default => $cursor->startOfDay(),
        };
        while ($cursor <= $end) {
            $key = $bucketKey($cursor);
            $trend[] = [
                'key' => $key,
                'label' => match ($unit) {
                    'day' => $cursor->translatedFormat('D d/m'),
                    'week' => $cursor->translatedFormat('d M'),
                    'month' => $cursor->translatedFormat('M'),
                },
                'count' => $counts[$key] ?? 0,
            ];
            $cursor = match ($unit) {
                'day' => $cursor->addDay(),
                'week' => $cursor->addWeek(),
                'month' => $cursor->addMonth(),
            };
        }

        // Titik rawan per kecamatan (periode terpilih), 8 teratas.
        $byDistrict = $inPeriod()
            ->select('district_code', DB::raw('COUNT(*) as total'))
            ->groupBy('district_code')
            ->orderByDesc('total')
            ->limit(8)
            ->get();
        $districtNames = DB::table('indonesia_districts')->whereIn('code', $byDistrict->pluck('district_code')->filter())->pluck('name', 'code');
        $districts = $byDistrict->map(fn ($row) => [
            'code' => $row->district_code,
            'name' => $row->district_code ? ucwords(strtolower($districtNames[$row->district_code] ?? $row->district_code)) : 'Tanpa kecamatan',
            'total' => (int) $row->total,
        ])->values()->toArray();

        $volunteers = fn () => $scoped(User::role('relawan'));

        $finals = ReportResolution::query()
            ->where('status', 'final')
            ->whereIn('report_id', $incidents()->select('reports.id'))
            ->with('report:id,title,created_at')
            ->withCount('victims')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(fn (ReportResolution $r) => [
                'id' => $r->id,
                'report_id' => $r->report_id,
                'title' => $r->report?->title,
                'date' => ($r->occurred_at ?? $r->report?->created_at)?->toIso8601String(),
                'victims' => $r->victims_count,
            ]);

        return [
            'period' => $period,
            'periods' => $periods,
            // Situasi SAAT INI (bukan periode) - kalimat pembuka layar.
            'situation' => [
                'waiting' => $incidents()->where('status', 'TERLAPOR')->count(),
                'verified' => $incidents()->where('status', 'pending')->count(),
                'handling' => $incidents()->where('status', 'handling')->count(),
            ],
            'performance' => [
                'total' => $total,
                'resolved' => $resolved,
                'resolved_pct' => $total ? (int) round($resolved / $total * 100) : null,
                'median_response' => $this->medianMinutes($firstOfficer('dispatched_at')),
                'median_arrival' => $this->medianMinutes($firstOfficer('arrived_at')),
                'victims' => $victims,
            ],
            'trend' => $trend,
            'trendUnit' => $unit,
            'districts' => $districts,
            'readiness' => [
                'hydrants_total' => Hydrant::count(),
                'hydrants_active' => Hydrant::where('status', 'Aktif')->count(),
                'skkl' => Pompa::count(),
                'stations' => PosPemadam::count(),
                'volunteers_total' => $volunteers()->count(),
                'volunteers_standby' => $volunteers()->where('is_standby', true)->count(),
            ],
            'finalReports' => $finals->toArray(),
            'feed_channel' => $user->reportFeedChannel(),
        ];
    }

    /**
     * Papan per wilayah untuk superadmin (TASK_72 fase 6): satu baris per kabupaten/kota yang punya tenant
     * aktif ATAU kejadian berjalan - antrian verifikasi, kejadian ditangani, dan umur laporan menunggu
     * yang tertua. Superadmin dilewati Tenantable, jadi kuerinya memang lintas wilayah. Urutan: wilayah
     * dengan laporan menunggu tertua di atas - itulah yang sedang tak terlayani.
     */
    private function regionBoard(): array
    {
        $open = Report::whereIn('status', ['TERLAPOR', 'pending', 'handling'])
            ->get(['city_code', 'status', 'created_at'])
            ->groupBy(fn ($r) => $r->city_code ?? '');
        $tenants = Tenant::where('is_active', true)->get(['city_code', 'nama_instansi', 'subdomain'])->keyBy('city_code');

        $codes = $tenants->keys()->merge($open->keys())->filter()->unique()->values();
        $cityNames = DB::table('indonesia_cities')->whereIn('code', $codes)->pluck('name', 'code');

        return $codes->map(function ($code) use ($open, $tenants, $cityNames) {
            $rows = $open->get($code, collect());
            $waiting = $rows->where('status', 'TERLAPOR');

            return [
                // Kunci koleksi berupa string angka diubah PHP jadi int - kode wilayah selalu string di aplikasi ini.
                'city_code' => (string) $code,
                'name' => $tenants[$code]->nama_instansi ?? ucwords(strtolower($cityNames[$code] ?? $code)),
                'city' => ucwords(strtolower($cityNames[$code] ?? $code)),
                'has_tenant' => $tenants->has($code),
                'waiting' => $waiting->count(),
                'active' => $rows->whereIn('status', ['pending', 'handling'])->count(),
                'oldest_waiting_at' => $waiting->min('created_at')?->toIso8601String(),
            ];
        })
            ->sortBy(fn ($r) => [$r['oldest_waiting_at'] ?? '9999', -$r['active'], $r['name']])
            ->values()
            ->toArray();
    }

    /**
     * Kesehatan sistem yang BISA DIBUKTIKAN dari server (TASK_72 fase 6): antrian queue (driver database)
     * yang menunggu & umur tertuanya, serta job gagal. Status realtime dibaca klien (use-realtime-status).
     * Tabel yang tak ada (driver queue lain) dilaporkan null, bukan nol - nol akan berbohong "sehat".
     */
    private function systemHealth(): array
    {
        $hasJobs = Schema::hasTable('jobs');
        $hasFailed = Schema::hasTable('failed_jobs');
        $oldest = $hasJobs ? DB::table('jobs')->min('created_at') : null;

        return [
            'queue_pending' => $hasJobs ? DB::table('jobs')->count() : null,
            'queue_oldest_at' => $oldest ? Carbon::createFromTimestamp($oldest)->toIso8601String() : null,
            'failed_24h' => $hasFailed ? DB::table('failed_jobs')->where('failed_at', '>=', now()->subDay())->count() : null,
            'failed_total' => $hasFailed ? DB::table('failed_jobs')->count() : null,
        ];
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
