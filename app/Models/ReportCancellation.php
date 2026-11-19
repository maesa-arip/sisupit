<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Pengajuan pembatalan laporan (TASK_91). Petugas MENGAJUKAN (alasan wajib), admin MEMUTUSKAN.
 * Disetujui = laporan berstatus `dibatalkan` (Report::STATUS_DIBATALKAN).
 *
 * Kedua gerbang hidup DI SINI saja dan dipakai dua tempat: endpoint di ReportActionController
 * dan prop tombol di ReportController::show (`canRequestCancellation`/`canDecideCancellation`)
 * - tombol yang dihitung dengan rumus kedua akan menyimpang dan berakhir 403 (bentuk #94/#101).
 *
 * Tanpa Tenantable: selalu dicapai lewat laporannya, yang wilayahnya diperiksa gerbang ini.
 */
class ReportCancellation extends Model
{
    public const STATUS_MENUNGGU = 'menunggu';

    public const STATUS_DISETUJUI = 'disetujui';

    public const STATUS_DITOLAK = 'ditolak';

    /** Laporan yang sudah diverifikasi & belum ditutup - tahap di mana tim bisa sudah berangkat. */
    public const CANCELLABLE_STATUSES = ['pending', 'handling'];

    /**
     * Admin membatalkan LANGSUNG (tanpa pengajuan petugas) - termasuk laporan mentah: pelapor bisa
     * membatalkan sebelum diverifikasi, dan "Dibatalkan" lebih jujur daripada "Ditolak" (hoaks).
     */
    public const DIRECT_CANCELLABLE_STATUSES = ['TERLAPOR', 'pending', 'handling'];

    public const REASON_MIN = 5;

    public const REASON_MAX = 500;

    protected $guarded = [];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    public function report()
    {
        return $this->belongsTo(Report::class)->withoutGlobalScopes();
    }

    public static function pendingFor(Report $report): ?self
    {
        return self::where('report_id', $report->id)->where('status', self::STATUS_MENUNGGU)->latest('id')->first();
    }

    /** Petugas di wilayah laporan, laporan sedang berjalan, belum ada pengajuan yang menunggu. */
    public static function canRequest(User $user, Report $report): bool
    {
        return $user->hasRole('petugas')
            && in_array($report->status, self::CANCELLABLE_STATUSES, true)
            && $user->withinReportJurisdiction($report)
            && ! self::pendingFor($report);
    }

    /** Admin/superadmin di wilayah laporan, ada pengajuan yang menunggu. Pasangan approve()/reject(). */
    public static function canDecide(User $user, Report $report): bool
    {
        return $user->hasAnyRole(['admin', 'superadmin'])
            && in_array($report->status, self::CANCELLABLE_STATUSES, true)
            && $user->withinReportJurisdiction($report)
            && (bool) self::pendingFor($report);
    }

    /** Admin/superadmin di wilayah laporan, tanpa pengajuan yang menunggu (itu diputuskan lewat canDecide). */
    public static function canCancelDirectly(User $user, Report $report): bool
    {
        return $user->hasAnyRole(['admin', 'superadmin'])
            && in_array($report->status, self::DIRECT_CANCELLABLE_STATUSES, true)
            && $user->withinReportJurisdiction($report)
            && ! self::pendingFor($report);
    }

    /**
     * Bentuk untuk halaman detail. Nama pengaju/pemutus hanya untuk rekan kerja & pengawas
     * ($withActors), sama dengan audiens jejak penutupan (FINDINGS #88) - pelapor cukup alasannya.
     */
    public function toDetail(bool $withActors): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            // Dibatalkan langsung oleh admin (tanpa pengajuan petugas): pengaju = pemutus.
            'is_direct' => $this->requested_by !== null && $this->requested_by === $this->decided_by,
            'reason' => $this->reason,
            'requested_at' => $this->created_at,
            'requester_name' => $withActors ? $this->requester_name : null,
            'decided_at' => $this->decided_at,
            'decider_name' => $withActors ? $this->decider_name : null,
            'decision_note' => $withActors ? $this->decision_note : null,
        ];
    }
}
