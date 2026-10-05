<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

class FcmToken extends Model
{
    use Prunable;

    protected $fillable = ['user_id', 'token', 'device_type'];

    /**
     * Token yang tak terlihat 270 hari (TASK_73). updated_at = "terakhir terlihat", disentuh
     * FcmController::store saat aplikasi dibuka dalam keadaan masuk.
     *
     * Ambangnya SENGAJA 270 hari (batas kedaluwarsa FCM untuk Android), bukan "basi 1 bulan"
     * anjuran Firebase: petugas yang jarang membuka aplikasi tetap harus menerima sirine.
     * Pembersih utama adalah DeleteInvalidFcmToken (token yang ditolak FCM); ini hanya sapu
     * sisa. Berjalan lewat `model:prune` di routes/console.php - butuh cron schedule:run.
     */
    public function prunable(): Builder
    {
        return static::where('updated_at', '<', now()->subDays(270));
    }
}
