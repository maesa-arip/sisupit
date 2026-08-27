<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

class Report extends Model
{
    use SoftDeletes, Tenantable;

    /**
     * Jenis kejadian dari tombol pilihan cepat form Lapor Darurat. SUMBER TUNGGAL —
     * dipakai `ReportRequest` (validasi), `Admin\AgencyController` (aturan auto-centang OPD),
     * dan kolom `reports.incident_type`. Empat yang pertama = kebakaran, `lainnya` = darurat
     * non-kebakaran (detail wajib, lihat ReportRequest).
     *
     * @var list<string>
     */
    public const INCIDENT_TYPES = ['rumah', 'toko', 'kendaraan', 'lahan', 'lainnya'];

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'title',
        'incident_type',
        'description',
        'address',
        'lat',
        'lng',
        'status',
        'rejected_reason',
        'rejected_at',
        'rejected_by',
        'resolved_at',
        'resolved_by',
        'photo',
        'province_code',
        'city_code',
        'district_code',
        'village_code',
    ];

    protected $casts = [
        'rejected_at' => 'datetime',
        'resolved_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Siapa yang menutup insiden ini (ReportActionController::resolve) dan siapa yang
     * menolaknya (::reject). Nullable tanpa backfill — laporan yang ditutup/ditolak
     * sebelum kolomnya ada memang tak diketahui pelakunya (FINDINGS #88).
     *
     * NAMA METODENYA SENGAJA BUKAN `resolvedBy`/`rejectedBy` (pola ReportAgency), melainkan
     * `resolver`/`rejector` mengikuti `ReportResolution::creator()` untuk `created_by`.
     * Alasannya mengikat: model ini dikirim UTUH ke halaman detail, dan relasi diserialisasi
     * dengan nama ter-snake_case sehingga `resolvedBy` akan MENIMPA kolom `resolved_by`
     * di JSON — atributnya berubah dari angka jadi objek tanpa galat apa pun.
     */
    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function rejector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    /**
     * Get all of the helpers for the Report
     */
    public function helpers(): HasMany
    {
        return $this->hasMany(ReportHelper::class, 'report_id', 'id');
    }

    public function officers(): HasMany
    {
        return $this->hasMany(ReportOfficer::class, 'report_id', 'id');
    }

    // Galeri foto laporan (FINDINGS #17). Kolom `photo` lama tetap = foto sampul.
    public function photos(): HasMany
    {
        return $this->hasMany(ReportPhoto::class, 'report_id', 'id');
    }

    // Unit/armada yang dikerahkan ke insiden ini (TASK_09).
    public function reportUnits(): HasMany
    {
        return $this->hasMany(ReportUnit::class, 'report_id', 'id');
    }

    // OPD/instansi terkait yang dilibatkan di insiden ini (TASK_27).
    public function reportAgencies(): HasMany
    {
        return $this->hasMany(ReportAgency::class, 'report_id', 'id');
    }

    // Berita Acara / Laporan Kegiatan Penyelamatan (append-only: entri sementara & final).
    public function resolutions(): HasMany
    {
        return $this->hasMany(ReportResolution::class, 'report_id', 'id');
    }

    // 3. Relasi ke wilayah
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

    public function scopeFilter($query, array $filters)
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(function ($query) use ($search) {
                // Cari berdasarkan judul, alamat, atau nama pelapor
                $query->where('title', 'like', '%'.$search.'%')
                    ->orWhere('address', 'like', '%'.$search.'%')
                    ->orWhere('name', 'like', '%'.$search.'%');
            });
        });
    }

    /**
     * Scope untuk Sorting / Pengurutan
     */
    public function scopeSorting($query, array $sorts)
    {
        $query->when($sorts['field'] ?? null, function ($query, $field) use ($sorts) {
            // Urutkan berdasarkan field dan direction (asc/desc)
            $query->orderBy($field, $sorts['direction'] ?? 'asc');
        });
    }
}
