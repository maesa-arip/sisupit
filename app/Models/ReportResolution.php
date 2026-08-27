<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportResolution extends Model
{
    /**
     * Bunyi kolom "Sumber Informasi" untuk laporan yang MASUK LEWAT APLIKASI (warga menekan
     * Lapor Darurat sendiri). SUMBER TUNGGAL — dibaca `ReportResolutionController::create()`
     * dan `SeedDemoIncident`; kalimat ini dulu ditulis mati di seeder saja, dan kalimat yang
     * ditulis dua kali akan menyimpang tanpa gejala (pelajaran FINDINGS #80).
     *
     * Laporan yang DIKETIK operator sengaja tidak punya nilai otomatis: sumber sebenarnya
     * (telepon 113 / laporan langsung / instansi lain) hanya operator yang tahu.
     */
    public const SUMBER_APLIKASI = 'Laporan warga melalui aplikasi Sisupit';

    protected $fillable = [
        'report_id',
        'created_by',
        'status',
        'jenis_kejadian',
        'sumber_informasi',
        'occurred_at',
        'lokasi_alamat',
        'kelurahan',
        'kecamatan',
        'pemilik_nama',
        'pemilik_umur',
        'kerugian',
        // Volume air yang dipakai memadamkan. TEKS BEBAS seperti `kerugian` — "±3 tangki".
        'volume_air',
        'tim_atensi',
        'kronologi',
    ];

    protected $casts = [
        'occurred_at' => 'datetime',
    ];

    public function report(): BelongsTo
    {
        return $this->belongsTo(Report::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function victims(): HasMany
    {
        return $this->hasMany(ReportVictim::class);
    }

    public function photos(): HasMany
    {
        return $this->hasMany(ReportResolutionPhoto::class);
    }
}
