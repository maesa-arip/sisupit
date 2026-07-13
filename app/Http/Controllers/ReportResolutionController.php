<?php

namespace App\Http\Controllers;

use App\Models\Report;
use App\Models\ReportResolution;
use App\Models\ReportVictim;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

// Berita Acara / Laporan Kegiatan Penyelamatan (FINDINGS #39). APPEND-ONLY: tiap simpan
// membuat entri BARU (status `sementara` atau `final`) — entri lama tidak ditimpa, agar
// data awal (sementara) & data hasil investigasi (final) bisa dibandingkan. Alur resolve()
// di ReportActionController TIDAK diubah; berita acara diisi belakangan oleh staf.
class ReportResolutionController extends Controller
{
    // Foto KTP korban = PII → disk privat (storage/app), diakses hanya lewat ktp() bergerbang.
    private const KTP_DISK = 'local';

    /**
     * Form buat berita acara baru. Prefill dari entri terbaru (bila ada) agar entri Final
     * tinggal mengoreksi entri Sementara; jika belum ada, prefill dari data laporan.
     */
    public function create($id)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeStaff($report);

        $report->load([
            'user:id,name', 'village', 'district',
            'officers.user:id,name', 'helpers.user:id,name',
            'reportUnits.unit:id,name',
        ]);

        $latest = ReportResolution::with('victims')
            ->where('report_id', $report->id)
            ->latest('id')
            ->first();

        // "Tim yg atensi di TKP" diambil dari DATA SISTEM: armada/unit yang dikerahkan +
        // petugas + relawan yang tercatat menangani insiden ini.
        $timAtensi = $report->reportUnits->pluck('unit.name')
            ->merge($report->officers->pluck('user.name'))
            ->merge($report->helpers->pluck('user.name'))
            ->filter()
            ->unique()
            ->implode(', ');

        // Jenis kejadian default diambil dari JUDUL insiden.
        $prefill = $latest ? [
            'jenis_kejadian' => $latest->jenis_kejadian ?: $report->title,
            'sumber_informasi' => $latest->sumber_informasi,
            'occurred_at' => optional($latest->occurred_at)->format('Y-m-d\TH:i'),
            'lokasi_alamat' => $latest->lokasi_alamat,
            'kelurahan' => $latest->kelurahan,
            'kecamatan' => $latest->kecamatan,
            'pemilik_nama' => $latest->pemilik_nama,
            'pemilik_umur' => $latest->pemilik_umur,
            'kerugian' => $latest->kerugian,
            'tim_atensi' => $latest->tim_atensi ?: $timAtensi,
            'kronologi' => $latest->kronologi,
            'victims' => $latest->victims->map(fn ($v) => [
                'nama' => $v->nama,
                'tanggal_lahir' => optional($v->tanggal_lahir)->format('Y-m-d'),
                'alamat' => $v->alamat,
            ])->values(),
        ] : [
            'jenis_kejadian' => $report->title,
            'lokasi_alamat' => $report->address,
            'kelurahan' => optional($report->village)->name,
            'kecamatan' => optional($report->district)->name,
            'occurred_at' => optional($report->created_at)->format('Y-m-d\TH:i'),
            'tim_atensi' => $timAtensi,
            'victims' => [],
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
            'timAtensiSuggestion' => $timAtensi,
        ]);
    }

    /**
     * Simpan berita acara baru (entri sementara/final). Append-only.
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
            'tim_atensi' => 'nullable|string|max:2000',
            'kronologi' => 'nullable|string|max:5000',
            'victims' => 'nullable|array',
            'victims.*.nama' => 'nullable|string|max:255',
            'victims.*.tanggal_lahir' => 'nullable|date',
            'victims.*.alamat' => 'nullable|string|max:255',
            'victims.*.ktp' => 'nullable|image|max:5120',
            'photos' => 'nullable|array',
            'photos.*' => 'image|max:5120',
        ]);

        DB::transaction(function () use ($request, $report, $validated) {
            $resolution = ReportResolution::create([
                'report_id' => $report->id,
                'created_by' => auth()->id(),
                'status' => $validated['status'],
                'jenis_kejadian' => $validated['jenis_kejadian'] ?? null,
                'sumber_informasi' => $validated['sumber_informasi'] ?? null,
                'occurred_at' => $validated['occurred_at'] ?? null,
                'lokasi_alamat' => $validated['lokasi_alamat'] ?? null,
                'kelurahan' => $validated['kelurahan'] ?? null,
                'kecamatan' => $validated['kecamatan'] ?? null,
                'pemilik_nama' => $validated['pemilik_nama'] ?? null,
                'pemilik_umur' => $validated['pemilik_umur'] ?? null,
                'kerugian' => $validated['kerugian'] ?? null,
                'tim_atensi' => $validated['tim_atensi'] ?? null,
                'kronologi' => $validated['kronologi'] ?? null,
            ]);

            foreach ((array) $request->input('victims', []) as $i => $victim) {
                // Lewati baris korban yang benar-benar kosong (tanpa data & tanpa KTP).
                $ktpFile = $request->file("victims.$i.ktp");
                $isEmpty = empty($victim['nama']) && empty($victim['tanggal_lahir'])
                    && empty($victim['alamat']) && ! $ktpFile;
                if ($isEmpty) {
                    continue;
                }

                $resolution->victims()->create([
                    'nama' => $victim['nama'] ?? null,
                    'tanggal_lahir' => $victim['tanggal_lahir'] ?? null,
                    'alamat' => $victim['alamat'] ?? null,
                    'ktp_path' => $ktpFile ? $ktpFile->store('ktp', self::KTP_DISK) : null,
                ]);
            }

            foreach ((array) $request->file('photos', []) as $file) {
                $resolution->photos()->create(['path' => $file->store('resolutions', 'public')]);
            }
        });

        $label = $validated['status'] === 'final' ? 'final' : 'sementara';

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

        return back()->with('success', 'Entri berita acara dihapus.');
    }

    /**
     * Streaming foto KTP korban dari disk PRIVAT. Bergerbang: hanya staf di wilayah laporan.
     * KTP tidak pernah dapat URL publik (PII).
     */
    public function ktp($id, $victimId)
    {
        $report = Report::withoutGlobalScopes()->findOrFail($id);
        $this->authorizeStaff($report);

        $victim = ReportVictim::whereHas('resolution', fn ($q) => $q->where('report_id', $report->id))
            ->findOrFail($victimId);

        abort_if(! $victim->ktp_path || ! Storage::disk(self::KTP_DISK)->exists($victim->ktp_path), 404);

        return Storage::disk(self::KTP_DISK)->response($victim->ktp_path);
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
}
