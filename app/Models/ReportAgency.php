<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Pelibatan satu OPD pada satu insiden (TASK_27) — pola ReportUnit.
 *
 * Kolom snapshot (agency_name / requires_confirmation / confirmation_label) diisi saat
 * pelibatan dan TIDAK ikut berubah saat master OPD diedit: catatan insiden harus tetap
 * berbunyi seperti saat kejadian karena ikut jadi bahan Berita Acara.
 */
class ReportAgency extends Model
{
    /** Permintaan terkirim, OPD belum merespons. */
    public const STATUS_NOTIFIED = 'notified';

    /** OPD menyatakan menerima/merespons permintaan. */
    public const STATUS_RESPONDED = 'responded';

    /** OPD menyatakan tidak bisa menangani. */
    public const STATUS_DECLINED = 'declined';

    /** Konfirmasi ditekan sendiri oleh akun instansi. */
    public const SOURCE_OPD = 'opd';

    /** Konfirmasi dicatatkan Pusat Komando atas laporan lisan/telepon. */
    public const SOURCE_OPERATOR = 'operator';

    protected $guarded = [];

    protected $casts = [
        'notified_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'requires_confirmation' => 'boolean',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function agency(): BelongsTo
    {
        return $this->belongsTo(Agency::class);
    }

    public function notifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'notified_by');
    }

    public function confirmedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    /** Masih menunggu tindakan yang dijanjikan (mis. PLN belum memadamkan listrik). */
    public function isAwaitingConfirmation(): bool
    {
        return $this->requires_confirmation && $this->confirmed_at === null;
    }
}
