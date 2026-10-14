<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;

/**
 * Pengunjung unik per hari (TASK_79). Dibaca lewat agregat di Admin\SiteVisitController;
 * ditulis oleh middleware RecordSiteVisit. Disapu sesudah KEEP_DAYS (lihat routes/console.php):
 * pilihan periode terpanjang di halaman statistik = 365 hari.
 */
class SiteVisitor extends Model
{
    use Prunable;

    public const KEEP_DAYS = 400;

    protected $table = 'site_visitors_daily';

    public $timestamps = false;

    protected $guarded = [];

    public function prunable(): Builder
    {
        return static::where('date', '<', now(config('app.local_timezone'))->subDays(self::KEEP_DAYS)->toDateString());
    }
}
