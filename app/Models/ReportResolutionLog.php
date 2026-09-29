<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Riwayat perubahan satu entri Laporan Kejadian (TASK_67). Pola HydrantLog (TASK_59):
 * APPEND-ONLY, ditulis EKSPLISIT dari ReportResolutionController dalam transaksi yang sama
 * dengan simpannya (bukan model event), penyunting di-snapshot supaya riwayat tetap terbaca
 * walau akunnya dihapus. `changes` = [{field, label, old, new}] - hanya yang berubah.
 */
class ReportResolutionLog extends Model
{
    public const UPDATED_AT = null;

    public const ACTION_CREATED = 'dibuat';

    public const ACTION_UPDATED = 'diubah';

    private const EDITOR_ROLES = ['superadmin', 'admin', 'petugas'];

    protected $guarded = [];

    protected $casts = [
        'changes' => 'array',
    ];

    public function resolution()
    {
        return $this->belongsTo(ReportResolution::class, 'report_resolution_id');
    }

    public static function record(ReportResolution $resolution, string $action, ?array $changes = null): self
    {
        $user = auth()->user();

        return static::create([
            'report_resolution_id' => $resolution->id,
            'user_id' => $user?->id,
            'user_name' => $user?->name ?? 'Sistem',
            'user_role' => collect(self::EDITOR_ROLES)->first(fn ($role) => $user?->hasRole($role)),
            'action' => $action,
            'changes' => $changes,
        ]);
    }

    /**
     * Beda antara dua potret entri (ReportResolution::snapshot()). Potret berisi TEKS yang
     * dibaca manusia, jadi perbandingan string di sini tak tersandung "-8.69" vs "-8.6900"
     * seperti getChanges() (pelajaran TASK_59): angka & tanggal sudah diformat lebih dulu.
     */
    public static function diff(array $before, array $after): array
    {
        $rows = [];
        foreach (ReportResolution::SNAPSHOT_LABELS as $field => $label) {
            $old = $before[$field] ?? null;
            $new = $after[$field] ?? null;
            if ((string) $old !== (string) $new) {
                $rows[] = ['field' => $field, 'label' => $label, 'old' => $old, 'new' => $new];
            }
        }

        return $rows;
    }
}
