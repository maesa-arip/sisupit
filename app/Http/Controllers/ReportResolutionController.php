<?php

namespace App\Http\Controllers;

use App\Events\ReportFeedChanged;
use App\Events\ReportRecordChanged;
use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\ReportResolutionLog;
use App\Models\ReportResolutionPhoto;
use App\Models\ReportVictim;
use App\Models\Tenant;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

// Berita Acara / Laporan Kejadian (FINDINGS #39; dulu "Laporan Kegiatan Penyelamatan").
// SEJAK TASK_67 (permintaan user 2026-09-29): tiap kejadian punya SATU entri `sementara` dan
// SATU entri `final`, keduanya bisa DISUNTING (sementara oleh petugas mana pun di wilayahnya,
// final oleh admin), dan setiap perubahan dicatat di report_resolution_logs. Dulu append-only:
// tiap simpan membuat entri baru. Entri yang terlanjur ganda TIDAK dihapus - "entri aktif"
// adalah yang TERBARU per status (activeEntry()), sisanya tampil sebagai arsip.
// Alur resolve() di ReportActionController TIDAK diubah; berita acara diisi belakangan.
class ReportResolutionController extends Controller
{
    // Foto KTP korban = PII → disk privat (storage/app), diakses hanya lewat ktp() bergerbang.
    private const KTP_DISK = 'local';

    /**
     * Form isi/sunting SATU entri (`?status=sementara|final`, TASK_67). Bila entri aktif status
     * itu sudah ada, form menyuntingnya; bila belum, prefill dari entri aktif lain (Final
     * tinggal mengoreksi Sementara) atau dari data laporan.
     */
    public function create(Request $request, $id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeStaff($report);

        $status = $request->query('status') === 'final' ? 'final' : 'sementara';
        abort_if($status === 'final' && ! $this->canFinalize(), 403, 'Laporan kejadian final hanya boleh diisi admin.');

        $report->load([
            'user:id,name', 'user.roles:id,name', 'village', 'district',
            'officers.user:id,name', 'helpers.user:id,name',
            'reportUnits.unit:id,name',
            // OPD yang dilibatkan ikut jadi "tim yang atensi di TKP" (permintaan user
            // 2026-08-27). Namanya dibaca dari kolom SNAPSHOT `agency_name` di pivot, bukan
            // dari master `agencies` - berita acara adalah dokumen historis, isinya tak boleh
            // ikut berubah saat master OPD di-rename (aturan yang sama dipakai ReportsExport).
            'reportAgencies',
        ]);

        $target = $this->activeEntry($report->id, $status);
        // Sumber prefill: entri yang disunting, atau entri terbaru status lain.
        $latest = $target ?? ReportResolution::with(['victims', 'photos'])
            ->where('report_id', $report->id)
            ->latest('id')
            ->first();

        // "Tim yg atensi di TKP" diambil dari DATA SISTEM: armada/unit yang dikerahkan +
        // petugas + relawan yang tercatat menangani insiden ini + OPD yang diminta membantu.
        // OPD diberi penanda "(OPD)" karena berita acara ini dokumen resmi yang dibaca pihak
        // lain: tanpa penanda, mitra luar tak bisa dibedakan dari armada & personel Damkar
        // sendiri (keputusan user 2026-08-27).
        //
        // Petugas beregu dikelompokkan di bawah NAMA REGU-nya (TASK_60): "Regu A (Made, Ketut)",
        // berkurung seperti penanda "(OPD)". Namanya dari SNAPSHOT report_officers.regu_name -
        // dokumen resmi menyebut regu saat kejadian, bukan nama regu hari ini. Petugas tanpa
        // regu tetap disebut perorangan.
        $petugas = $report->officers
            ->groupBy(fn ($officer) => $officer->regu_name ?? '')
            ->sortKeys()
            ->flatMap(fn ($rows, $regu) => $regu === ''
                ? $rows->pluck('user.name')
                : [$regu.' ('.$rows->pluck('user.name')->filter()->implode(', ').')']);

        $timAtensi = $report->reportUnits->pluck('unit.name')
            ->merge($petugas)
            ->merge($report->helpers->pluck('user.name'))
            ->merge($report->reportAgencies->pluck('agency_name')->filter()->map(fn ($name) => $name.' (OPD)'))
            ->filter()
            ->unique()
            ->implode(', ');

        // Sumber informasi terisi sendiri HANYA bila laporannya masuk lewat aplikasi. Yang
        // membedakan: peran pemilik laporan. `ReportController::store()` selalu menulis
        // `auth()->id()`, jadi laporan yang diketik operator (alur telepon TASK_28) ber-user_id
        // operator itu sendiri - itulah satu-satunya jejak yang tersimpan. Untuk laporan
        // seperti itu kolomnya sengaja DIBIARKAN KOSONG: sumber sebenarnya cuma operator yang
        // tahu, dan kalimat umum yang terisi otomatis cenderung dibiarkan apa adanya sehingga
        // sumber yang asli tak pernah tercatat (keputusan user 2026-08-27).
        $sumberInformasi = $report->user && $report->user->hasAnyRole(User::STAFF_ROLES)
            ? null
            : ReportResolution::SUMBER_APLIKASI;

        // Jenis kejadian default diambil dari JUDUL insiden.
        $prefill = $latest ? [
            'jenis_kejadian' => $latest->jenis_kejadian ?: $report->title,
            'sumber_informasi' => $latest->sumber_informasi ?: $sumberInformasi,
            'occurred_at' => $this->toLocalInput($latest->occurred_at),
            'lokasi_alamat' => $latest->lokasi_alamat,
            'kelurahan' => $latest->kelurahan,
            'kecamatan' => $latest->kecamatan,
            'pemilik_nama' => $latest->pemilik_nama,
            'pemilik_umur' => $latest->pemilik_umur,
            'kerugian' => $latest->kerugian,
            'volume_air' => $latest->volume_air,
            'tim_atensi' => $latest->tim_atensi ?: $timAtensi,
            'kronologi' => $latest->kronologi,
            // `id` ikut supaya korban yang sama DISUNTING, bukan dibuat ulang - dan bila berasal
            // dari entri status lain, KTP-nya disalin server (store()).
            'victims' => $latest->victims->map(fn ($v) => [
                'id' => $v->id,
                'nama' => $v->nama,
                'tanggal_lahir' => optional($v->tanggal_lahir)->format('Y-m-d'),
                'alamat' => $v->alamat,
                'kondisi' => $v->kondisi,
                'ktp_url' => $v->ktp_path ? route('reports.resolution.ktp', [$report->id, $v->id]) : null,
            ])->values(),
            'photos' => $latest->photos->map(fn ($p) => ['id' => $p->id, 'path' => $p->path])->values(),
        ] : [
            'jenis_kejadian' => $report->title,
            'sumber_informasi' => $sumberInformasi,
            'lokasi_alamat' => $report->alamatTampil(),
            'kelurahan' => optional($report->village)->name,
            'kecamatan' => optional($report->district)->name,
            'occurred_at' => $this->toLocalInput($report->created_at),
            'tim_atensi' => $timAtensi,
            'victims' => [],
            'photos' => [],
        ];

        return inertia('Front/Reports/Resolution/Create', [
            'report' => [
                'id' => $report->id,
                'title' => $report->title,
                'address' => $report->address,
                // Data pelapor → tombol "Ambil dari data pelapor" pada bagian korban.
                'reporter_name' => $report->name ?: optional($report->user)->name,
                'reporter_address' => $report->address,
            ],
            'prefill' => $prefill,
            'hasPrevious' => (bool) $latest,
            // Entri yang diisi form ini, dan apakah ia sudah ada (menyunting) atau baru.
            'target' => $status,
            'isEdit' => (bool) $target,
            'timAtensiSuggestion' => $timAtensi,
            // Tanpa prop ini, satu-satunya petunjuk bahwa petugas tak boleh memfinalkan
            // adalah 403 SETELAH seluruh berita acara diisi.
            'canFinalize' => $this->canFinalize(),
        ]);
    }

    /**
     * Simpan entri sementara/final (TASK_67): MENYUNTING entri aktif status itu bila sudah
     * ada, membuatnya bila belum. Tiap simpan yang mengubah sesuatu meninggalkan satu baris
     * riwayat.
     */
    public function store(Request $request, $id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeStaff($report);

        $validated = $request->validate([
            'status' => 'required|in:sementara,final',
            'jenis_kejadian' => 'nullable|string|max:255',
            'sumber_informasi' => 'nullable|string|max:255',
            'occurred_at' => 'nullable|date',
            'lokasi_alamat' => 'nullable|string|max:255',
            'kelurahan' => 'nullable|string|max:255',
            'kecamatan' => 'nullable|string|max:255',
            'pemilik_nama' => 'nullable|string|max:255',
            'pemilik_umur' => 'nullable|integer|min:0|max:200',
            'kerugian' => 'nullable|string|max:255',
            // Teks bebas, bukan numeric — lihat catatan di migrasinya.
            'volume_air' => 'nullable|string|max:255',
            'tim_atensi' => 'nullable|string|max:2000',
            'kronologi' => 'nullable|string|max:5000',
            'victims' => 'nullable|array',
            'victims.*.nama' => 'nullable|string|max:255',
            'victims.*.tanggal_lahir' => 'nullable|date',
            'victims.*.alamat' => 'nullable|string|max:255',
            'victims.*.kondisi' => 'nullable|string|max:255',
            'victims.*.ktp' => 'nullable|image|max:2048',
            'victims.*.id' => 'nullable|integer',
            'victims.*.remove_ktp' => 'nullable|boolean',
            // Foto lama yang DIPERTAHANKAN (TASK_67): milik entri ini, atau milik entri status
            // lain yang disalin. Foto entri ini yang tak disebut di sini dihapus.
            'keep_photo_ids' => 'nullable|array',
            'keep_photo_ids.*' => 'integer',
            // Batas jumlah WAJIB sama dengan MAX_PHOTOS di Resolution/Create.jsx (dijaga
            // UploadSizeLimitTest). Tanpa batas, 8 foto x 5 MB + KTP korban sudah melewati
            // post_max_size server dan dijawab 413 sebelum validasi ini sempat berbicara (#132).
            'photos' => 'nullable|array|max:8',
            'photos.*' => 'image|max:2048',
        ]);

        // Entri FINAL adalah dokumen yang dipertanggungjawabkan keluar, jadi penutupnya admin
        // (permintaan user 2026-08-28). Dicek di SERVER, bukan cukup dengan menyembunyikan
        // tombolnya: tombol yang hilang tidak menghentikan request yang dibuat tangan.
        abort_if($validated['status'] === 'final' && ! $this->canFinalize(), 403, 'Berita acara final hanya boleh ditutup admin.');

        // Berkas dihapus SESUDAH transaksi berhasil: menghapusnya di dalam transaksi yang lalu
        // gagal meninggalkan baris yang menunjuk berkas yang sudah tak ada.
        $filesToDelete = [];

        DB::transaction(function () use ($request, $report, $validated, &$filesToDelete) {
            // Dua petugas menyimpan bersamaan tak boleh sama-sama "membuat" entri sementara.
            Report::withoutGlobalScopes()->whereKey($report->id)->lockForUpdate()->first();

            $fields = [
                'jenis_kejadian' => $validated['jenis_kejadian'] ?? null,
                'sumber_informasi' => $validated['sumber_informasi'] ?? null,
                'occurred_at' => $this->fromLocalInput($validated['occurred_at'] ?? null),
                'lokasi_alamat' => $validated['lokasi_alamat'] ?? null,
                'kelurahan' => $validated['kelurahan'] ?? null,
                'kecamatan' => $validated['kecamatan'] ?? null,
                'pemilik_nama' => $validated['pemilik_nama'] ?? null,
                'pemilik_umur' => $validated['pemilik_umur'] ?? null,
                'kerugian' => $validated['kerugian'] ?? null,
                'volume_air' => $validated['volume_air'] ?? null,
                'tim_atensi' => $validated['tim_atensi'] ?? null,
                'kronologi' => $validated['kronologi'] ?? null,
            ];

            $resolution = $this->activeEntry($report->id, $validated['status']);
            $before = $resolution?->snapshot();

            if ($resolution) {
                $resolution->update($fields);
            } else {
                $resolution = ReportResolution::create([
                    'report_id' => $report->id,
                    'created_by' => auth()->id(),
                    'status' => $validated['status'],
                    ...$fields,
                ]);
                $resolution->setRelation('victims', collect());
                $resolution->setRelation('photos', collect());
            }

            $extra = [];
            $filesToDelete = [
                ...$this->syncVictims($request, $report, $resolution, $extra),
                ...$this->syncPhotos($request, $report, $resolution, $before !== null, $extra),
            ];

            $resolution->load(['victims', 'photos']);

            if ($before === null) {
                ReportResolutionLog::record($resolution, ReportResolutionLog::ACTION_CREATED);
            } elseif ($changes = [...ReportResolutionLog::diff($before, $resolution->snapshot()), ...$extra]) {
                ReportResolutionLog::record($resolution, ReportResolutionLog::ACTION_UPDATED, $changes);
            }
        });

        foreach ($filesToDelete as [$disk, $path]) {
            Storage::disk($disk)->delete($path);
        }

        $label = $validated['status'] === 'final' ? 'final' : 'sementara';

        // Halaman detail yang sedang terbuka pihak lain ikut menampilkan entri baru ini
        // tanpa refresh (#113). Yang paling dirugikan sebelumnya justru alur normalnya:
        // petugas mengisi entri `sementara`, lalu admin - satu-satunya yang boleh
        // mem-final-kannya sejak TASK_49 - menatap layar yang masih kosong.
        broadcast(new ReportRecordChanged($report->id));
        // Antrian "Menunggu Berita Acara" di dashboard petugas lain di wilayah ini juga
        // harus tahu insiden ini sudah punya entri - siaran di atas hanya didengar halaman
        // detail, jadi tanpa ini kartunya tertinggal berbunyi "Buat Laporan" sampai di-refresh.
        broadcast(ReportFeedChanged::for($report));

        return to_route('reports.show', $report->id)
            ->with('success', "Berita acara ($label) berhasil disimpan.");
    }

    /**
     * Hapus satu entri berita acara (mis. salah input). Menghapus juga file KTP privat &
     * foto kejadian miliknya. Staf + yurisdiksi.
     */
    public function destroy($id, $resolutionId)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeStaff($report);

        $resolution = ReportResolution::with(['victims', 'photos'])
            ->where('report_id', $report->id)
            ->findOrFail($resolutionId);

        // Sejak entri final bisa disunting & dicatat (TASK_67), menghapusnya ikut jadi wewenang
        // penutupnya - kalau tidak, petugas bisa menghilangkan entri final beserta riwayatnya.
        abort_if($resolution->status === 'final' && ! $this->canFinalize(), 403, 'Laporan kejadian final hanya boleh dihapus admin.');

        DB::transaction(function () use ($resolution) {
            foreach ($resolution->victims as $victim) {
                if ($victim->ktp_path) {
                    Storage::disk(self::KTP_DISK)->delete($victim->ktp_path);
                }
            }
            foreach ($resolution->photos as $photo) {
                Storage::disk('public')->delete($photo->path);
            }
            // Baris korban & foto ikut terhapus lewat cascade FK.
            $resolution->delete();
        });

        broadcast(new ReportRecordChanged($report->id));
        // Entri terakhir yang dihapus mengembalikan insiden ke antrian dashboard petugas.
        broadcast(ReportFeedChanged::for($report));

        return back()->with('success', 'Entri berita acara dihapus.');
    }

    /**
     * PDF satu entri Laporan Kejadian (TASK_68, permintaan user 2026-09-29). Gerbang BACA
     * (staf + pejabat sewilayah) - dokumen yang sama sudah bisa dibaca mereka di layar.
     * KTP korban SENGAJA tidak ikut (PII, gerbang bacanya tersendiri): berkas PDF gampang
     * berpindah tangan, sama alasannya dengan Export Excel yang hanya membawa JUMLAH korban.
     */
    public function pdf($id, $resolutionId)
    {
        $report = Report::withoutGlobalScopes()->with(['village', 'district'])->findOrFail($id);
        $this->authorizeView($report);

        $resolution = ReportResolution::with(['victims', 'photos', 'creator:id,name', 'logs' => fn ($q) => $q->latest('id')])
            ->where('report_id', $report->id)
            ->findOrFail($resolutionId);

        $isActive = ! ReportResolution::where('report_id', $report->id)
            ->where('status', $resolution->status)
            ->where('id', '>', $resolution->id)
            ->exists();

        // Foto disisipkan sebagai data URI (bukan URL) supaya dompdf tak perlu mengambil
        // lewat jaringan. Butuh ekstensi GD; tanpa GD fotonya dilewati, dokumennya tetap jadi.
        $photos = extension_loaded('gd')
            ? $resolution->photos
                ->filter(fn ($p) => Storage::disk('public')->exists($p->path))
                ->map(fn ($p) => 'data:'.(Storage::disk('public')->mimeType($p->path) ?: 'image/jpeg').';base64,'
                    .base64_encode(Storage::disk('public')->get($p->path)))
                ->values()
            : collect();

        $tz = config('app.local_timezone');
        $nomor = Report::nomorLaporan($report);
        $lastEdit = $resolution->logs->firstWhere('action', ReportResolutionLog::ACTION_UPDATED);

        $pdf = Pdf::loadView('pdf.laporan-kejadian', [
            'report' => $report,
            'resolution' => $resolution,
            'nomor' => $nomor,
            'isActive' => $isActive,
            'tenant' => Tenant::forCity($report->city_code) ?? Tenant::default(),
            'photos' => $photos,
            'photosSkipped' => $resolution->photos->count() - $photos->count(),
            'occurredAt' => $resolution->occurred_at?->copy()->setTimezone($tz),
            'createdAt' => $resolution->created_at?->copy()->setTimezone($tz),
            'lastEdit' => $lastEdit,
            'lastEditAt' => $lastEdit?->created_at?->copy()->setTimezone($tz),
            'printedAt' => now($tz),
            'printedBy' => auth()->user()->name,
        ])->setPaper('a4');

        return $pdf->download("laporan-kejadian-{$nomor}-{$resolution->status}.pdf");
    }

    /**
     * Streaming foto KTP korban dari disk PRIVAT. Bergerbang: hanya staf di wilayah laporan.
     * KTP tidak pernah dapat URL publik (PII).
     */
    public function ktp($id, $victimId)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeView($report);

        $victim = ReportVictim::whereHas('resolution', fn ($q) => $q->where('report_id', $report->id))
            ->findOrFail($victimId);

        abort_if(! $victim->ktp_path || ! Storage::disk(self::KTP_DISK)->exists($victim->ktp_path), 404);

        return Storage::disk(self::KTP_DISK)->response($victim->ktp_path);
    }

    /**
     * Entri AKTIF satu status = yang terbaru (TASK_67). Entri lama yang terlanjur ganda dari
     * masa append-only tetap tersimpan sebagai arsip.
     */
    private function activeEntry(int $reportId, string $status): ?ReportResolution
    {
        return ReportResolution::with(['victims', 'photos'])
            ->where('report_id', $reportId)
            ->where('status', $status)
            ->latest('id')
            ->first();
    }

    /**
     * Korban dari form: ber-`id` milik entri ini = disunting; ber-`id` milik entri LAIN pada
     * laporan yang sama = disalin berikut KTP-nya (Final dibuat dari Sementara); tanpa `id` =
     * baru. Korban entri ini yang tak dikirim lagi dihapus. Memulangkan berkas yang harus
     * dihapus sesudah transaksi.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function syncVictims(Request $request, Report $report, ReportResolution $resolution, array &$extra): array
    {
        $own = $resolution->victims->keyBy('id');
        $others = ReportVictim::whereHas('resolution', fn ($q) => $q->where('report_id', $report->id))
            ->where('report_resolution_id', '!=', $resolution->id)
            ->get()
            ->keyBy('id');

        $kept = [];
        $delete = [];
        $ktpChanged = [];

        foreach ((array) $request->input('victims', []) as $i => $victim) {
            $ktpFile = $request->file("victims.$i.ktp");
            $removeKtp = filter_var($victim['remove_ktp'] ?? false, FILTER_VALIDATE_BOOLEAN);
            $victimId = isset($victim['id']) ? (int) $victim['id'] : null;
            $existing = $victimId ? $own->get($victimId) : null;
            $source = $victimId && ! $existing ? $others->get($victimId) : null;

            // `kondisi` ikut dihitung sebagai isi (TASK_49); KTP lama yang ikut terbawa juga isi.
            $hasKtp = $ktpFile || (! $removeKtp && ($existing?->ktp_path || $source?->ktp_path));
            $isEmpty = empty($victim['nama']) && empty($victim['tanggal_lahir'])
                && empty($victim['alamat']) && empty($victim['kondisi']) && ! $hasKtp;
            if ($isEmpty) {
                continue;
            }

            $data = [
                'nama' => $victim['nama'] ?? null,
                'tanggal_lahir' => $victim['tanggal_lahir'] ?? null,
                'alamat' => $victim['alamat'] ?? null,
                'kondisi' => $victim['kondisi'] ?? null,
            ];
            $label = ($victim['nama'] ?? null) ?: 'Korban '.($i + 1);

            if ($existing) {
                if ($ktpFile || ($removeKtp && $existing->ktp_path)) {
                    if ($existing->ktp_path) {
                        $delete[] = [self::KTP_DISK, $existing->ktp_path];
                    }
                    $data['ktp_path'] = $ktpFile ? $ktpFile->store('ktp', self::KTP_DISK) : null;
                    $ktpChanged[] = $label.($ktpFile ? ' (diganti)' : ' (dihapus)');
                }
                $existing->update($data);
                $kept[] = $existing->id;

                continue;
            }

            if ($ktpFile) {
                $data['ktp_path'] = $ktpFile->store('ktp', self::KTP_DISK);
            } elseif (! $removeKtp && $source?->ktp_path && Storage::disk(self::KTP_DISK)->exists($source->ktp_path)) {
                // SALINAN berkas, bukan path yang sama: menghapus salah satu entri tak boleh
                // menghapus KTP milik entri lainnya.
                $copy = 'ktp/'.Str::random(40).'.'.pathinfo($source->ktp_path, PATHINFO_EXTENSION);
                Storage::disk(self::KTP_DISK)->copy($source->ktp_path, $copy);
                $data['ktp_path'] = $copy;
            }

            $kept[] = $resolution->victims()->create($data)->id;
        }

        foreach ($own->except($kept) as $gone) {
            if ($gone->ktp_path) {
                $delete[] = [self::KTP_DISK, $gone->ktp_path];
            }
            $gone->delete();
        }

        if ($ktpChanged) {
            $extra[] = ['field' => 'ktp', 'label' => 'KTP Korban', 'old' => null, 'new' => implode(', ', $ktpChanged)];
        }

        return $delete;
    }

    /**
     * Foto: `keep_photo_ids` milik entri ini dipertahankan, milik entri lain disalin, sisanya
     * dihapus; unggahan baru ditambahkan. Batas 8 (= MAX_PHOTOS di form) berlaku untuk
     * TOTALNYA - validasi `photos|max:8` hanya melihat unggahan baru.
     *
     * @return array<int, array{0: string, 1: string}>
     */
    private function syncPhotos(Request $request, Report $report, ReportResolution $resolution, bool $isEdit, array &$extra): array
    {
        $keepIds = collect((array) $request->input('keep_photo_ids', []))->map(fn ($id) => (int) $id)->all();
        $own = $resolution->photos->keyBy('id');
        $others = ReportResolutionPhoto::whereHas('resolution', fn ($q) => $q->where('report_id', $report->id))
            ->where('report_resolution_id', '!=', $resolution->id)
            ->whereIn('id', $keepIds)
            ->get();
        $uploads = (array) $request->file('photos', []);

        if ($own->only($keepIds)->count() + $others->count() + count($uploads) > 8) {
            throw ValidationException::withMessages(['photos' => 'Foto kejadian paling banyak 8.']);
        }

        $delete = [];
        $removed = 0;
        foreach ($own->except($keepIds) as $gone) {
            $delete[] = ['public', $gone->path];
            $gone->delete();
            $removed++;
        }

        $added = 0;
        foreach ($others as $source) {
            if (Storage::disk('public')->exists($source->path)) {
                $copy = 'resolutions/'.Str::random(40).'.'.pathinfo($source->path, PATHINFO_EXTENSION);
                Storage::disk('public')->copy($source->path, $copy);
                $resolution->photos()->create(['path' => $copy]);
                $added++;
            }
        }
        foreach ($uploads as $file) {
            $resolution->photos()->create(['path' => $file->store('resolutions', 'public')]);
            $added++;
        }

        if ($isEdit && ($added || $removed)) {
            $extra[] = [
                'field' => 'foto',
                'label' => 'Foto Kejadian',
                'old' => null,
                'new' => collect([$added ? "{$added} ditambah" : null, $removed ? "{$removed} dihapus" : null])->filter()->implode(', '),
            ];
        }

        return $delete;
    }

    /**
     * Siapa yang boleh MENUTUP berita acara sebagai `final` (permintaan user 2026-08-28).
     * Petugas tetap boleh mengisi entri `sementara` — dialah yang ada di lokasi — tapi versi
     * yang dianggap sah keluar ditutup admin. Yurisdiksinya sudah dijamin authorizeStaff()
     * yang dipanggil lebih dulu; fungsi ini hanya menjawab soal PERAN.
     */
    private function canFinalize(): bool
    {
        return auth()->user()->hasAnyRole(['admin', 'superadmin']);
    }

    /**
     * "Waktu Kejadian" untuk isian form: jam DINDING pengguna (WITA), bukan UTC.
     *
     * Isian tanggal+jam itu tak membawa zona waktu, jadi apa pun yang dikirim ke sini dibaca
     * mentah oleh petugas. Dulu created_at dicetak dalam zona aplikasi (UTC): laporan yang
     * masuk 06:57 WITA muncul di form sebagai 22:57 HARI SEBELUMNYA (temuan #134).
     */
    private function toLocalInput($value): ?string
    {
        return $value ? Carbon::parse($value)->setTimezone(config('app.local_timezone'))->format('Y-m-d\TH:i') : null;
    }

    /**
     * Kebalikan toLocalInput(): jam yang DIKETIK petugas adalah jam dinding (WITA) dan wajib
     * diubah ke UTC sebelum disimpan, seperti setiap timestamp lain di DB. Tanpa ini jam itu
     * tersimpan seolah UTC lalu browser menambah 8 jam saat menampilkannya - petugas menulis
     * 02:45, halaman detail berbunyi 10:45 (#134).
     */
    private function fromLocalInput(?string $value): ?Carbon
    {
        return $value ? Carbon::parse($value, config('app.local_timezone'))->utc() : null;
    }

    /**
     * Hanya petugas/admin/superadmin, dan hanya di wilayah laporan (ATURAN EMAS #7 —
     * report di-fetch withoutGlobalScopes, jadi batas wilayah dicek manual di sini).
     */
    private function authorizeStaff(Report $report): void
    {
        $user = auth()->user();
        abort_unless($user->hasAnyRole(['petugas', 'admin', 'superadmin']), 403, 'Akses Ditolak.');
        abort_unless($user->withinReportJurisdiction($report), 403, 'Insiden ini di luar wilayah penugasan Anda.');
    }

    /**
     * Gerbang BACA (read-only) berita acara/KTP: staf ATAU pejabat daerah, keduanya dibatasi
     * ke wilayah laporan. Pejabat setara admin dalam melihat, tapi TIDAK boleh mengelola —
     * karena itu create/store/destroy tetap memakai authorizeStaff (selaras ReportController::show).
     */
    private function authorizeView(Report $report): void
    {
        $user = auth()->user();
        abort_unless($user->hasAnyRole(['petugas', 'admin', 'superadmin', 'pejabat']), 403, 'Akses Ditolak.');
        abort_unless($user->withinReportJurisdiction($report), 403, 'Insiden ini di luar wilayah penugasan Anda.');
    }
}
