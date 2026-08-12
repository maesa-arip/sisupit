<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

/**
 * OPD/instansi terkait (TASK_27): BPBD, PLN, PMI, Dinkes, ... Ter-scope wilayah via Tenantable
 * (pola Unit), jadi tiap kabupaten mengelola daftarnya sendiri lewat Admin\AgencyController.
 *
 * Perilaku khusus tiap OPD adalah DATA, bukan cabang kode: lihat `default_incident_types`
 * (auto-centang) dan `requires_confirmation`/`confirmation_label` (mis. PLN wajib mengonfirmasi
 * listrik padam). Menambah OPD baru — termasuk yang butuh konfirmasi sendiri — tidak boleh
 * menuntut perubahan kode.
 */
class Agency extends Model
{
    use SoftDeletes, Tenantable;

    protected $guarded = [];

    protected $casts = [
        'default_incident_types' => 'array',
        'requires_confirmation' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function reportAgencies(): HasMany
    {
        return $this->hasMany(ReportAgency::class);
    }

    /** Akun berperan `opd` yang mewakili instansi ini (bisa lebih dari satu — piket bergantian). */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Id OPD yang TERCENTANG OTOMATIS untuk jenis kejadian ini (rekomendasi, bukan paksaan —
     * operator tetap bebas meng-uncentang). Ter-scope wilayah lewat Tenantable seperti query
     * Agency lainnya. Laporan lama tanpa `incident_type` (kolomnya baru ada di TASK_27) tidak
     * menghasilkan rekomendasi apa pun: memberi tebakan lebih buruk daripada tidak memberi.
     *
     * Pencocokan dilakukan di PHP, bukan `whereJsonContains`, karena dukungan JSON berbeda
     * antara SQLite (lokal & testing) dan MySQL (produksi) — dan daftar OPD per wilayah
     * memang pendek, jadi tak ada alasan menukar keandalan dengan mikro-optimasi.
     *
     * @return \Illuminate\Support\Collection<int, int>
     */
    public static function recommendedIdsFor(?string $incidentType)
    {
        if (! $incidentType) {
            return collect();
        }

        return static::query()
            ->where('is_active', true)
            ->get(['id', 'default_incident_types'])
            ->filter(fn (self $agency) => in_array($incidentType, (array) $agency->default_incident_types, true))
            ->pluck('id')
            ->values();
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function (Builder $query, $search) {
            $query->where(function (Builder $query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('code', 'like', '%'.$search.'%')
                    ->orWhere('category', 'like', '%'.$search.'%');
            });
        });
    }

    public function province()
    {
        return $this->belongsTo(Province::class, 'province_code', 'code');
    }

    public function city()
    {
        return $this->belongsTo(City::class, 'city_code', 'code');
    }

    public function district()
    {
        return $this->belongsTo(District::class, 'district_code', 'code');
    }

    public function village()
    {
        return $this->belongsTo(Village::class, 'village_code', 'code');
    }
}
