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

    /**
     * Isian yang dicatat di riwayat perubahan (TASK_67), berurutan seperti form. `korban`
     * bukan kolom melainkan ringkasan relasinya. Foto & penggantian KTP dicatat terpisah oleh
     * controller (ditambah/dihapus) - jumlah yang sama bukan berarti isinya sama.
     */
    public const SNAPSHOT_LABELS = [
        'jenis_kejadian' => 'Jenis Kejadian',
        'sumber_informasi' => 'Sumber Informasi',
        'occurred_at' => 'Waktu Kejadian',
        'kerugian' => 'Estimasi Kerugian',
        'volume_air' => 'Volume Air',
        'lokasi_alamat' => 'Alamat',
        'kelurahan' => 'Desa/Kelurahan',
        'kecamatan' => 'Kecamatan',
        'pemilik_nama' => 'Nama Pemilik',
        'pemilik_umur' => 'Umur Pemilik',
        'tim_atensi' => 'Tim yang Atensi',
        'kronologi' => 'Kronologi',
        'korban' => 'Korban',
    ];

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

    public function logs(): HasMany
    {
        return $this->hasMany(ReportResolutionLog::class);
    }

    /**
     * Potret isian untuk riwayat perubahan (TASK_67): semua nilai sebagai TEKS yang dibaca
     * manusia (waktu dalam WITA, korban diringkas), kosong = null. Relasi victims WAJIB
     * dimuat segar oleh pemanggil.
     */
    public function snapshot(): array
    {
        $blank = fn ($value) => ($value === null || trim((string) $value) === '') ? null : trim((string) $value);

        $row = [];
        foreach (array_keys(self::SNAPSHOT_LABELS) as $field) {
            $row[$field] = in_array($field, ['occurred_at', 'korban'], true) ? null : $blank($this->{$field});
        }

        $row['occurred_at'] = $this->occurred_at
            ? $this->occurred_at->copy()->setTimezone(config('app.local_timezone'))->format('d-m-Y H:i')
            : null;
        $row['korban'] = $this->victims->isEmpty() ? null : $this->victims
            ->sortBy('id')
            ->map(fn ($v) => trim(($v->nama ?: 'Tanpa nama')
                .($v->kondisi ? " ({$v->kondisi})" : '')
                .($v->ktp_path ? ' [KTP]' : '')))
            ->implode('; ');

        return $row;
    }
}
