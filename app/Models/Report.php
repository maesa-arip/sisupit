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
     * Jenis kejadian dari form Lapor Darurat. SUMBER TUNGGAL — dipakai `ReportRequest`
     * (validasi), `Admin\AgencyController` (aturan auto-centang OPD), dan kolom
     * `reports.incident_type`. Sejak form dipecah dua tab (2026-08-27) daftar ini memuat
     * `kebakaran_lainnya` = kebakaran yang jenisnya diketik sendiri warga; ia KEBAKARAN,
     * jadi aturan darurat-first berlaku (foto/detail opsional). Hanya `lainnya` yang berarti
     * darurat NON-kebakaran (detail wajib, lihat ReportRequest).
     *
     * @var list<string>
     */
    public const INCIDENT_TYPES = ['rumah', 'toko', 'kendaraan', 'lahan', 'kebakaran_lainnya', 'lainnya'];

    /**
     * Bagian dari INCIDENT_TYPES yang berarti KEBAKARAN. Ditulis di sini supaya penambahan
     * jenis kebakaran berikutnya tidak perlu diingat-ingat di tempat lain — `AgencySeeder`
     * membacanya untuk menentukan OPD mana yang tercentang otomatis.
     *
     * @var list<string>
     */
    public const FIRE_INCIDENT_TYPES = ['rumah', 'toko', 'kendaraan', 'lahan', 'kebakaran_lainnya'];

    /**
     * Asal-usul TITIK laporan (TASK_52, #104) — SUMBER TUNGGAL. Menjawab satu pertanyaan
     * yang sebelumnya tak bisa dijawab dari data mana pun: "boleh saya percaya pin ini?".
     *
     * Tiap nilai diturunkan dari BUKTI, bukan dari peran pengirimnya. Karena itu tidak ada
     * nilai khusus untuk alur telepon Pusat Komando (TASK_28): menurunkannya dari peran akan
     * mengklaim "titik dipilih operator" pada petugas yang kebetulan melapor dari TKP
     * sungguhan — klaim yang bisa salah (bentuk #90). Laporan telepon jatuh sendiri ke
     * `ditandai_manual`, dan itu memang benar apa adanya.
     *
     * Kembarannya di sisi klien adalah `LOCATION_SOURCE_META` di `resources/js/lib/utils.js`
     * (dijaga ReportLocationSourceTest) — menambah nilai berarti mengubah keduanya.
     *
     * @var list<string>
     */
    public const LOCATION_SOURCES = ['gps_pelapor', 'ditandai_manual', 'tanpa_referensi', 'dikoreksi_petugas'];

    /**
     * Batas "pelapor masih di lokasi" (meter). Ditulis SEKALI di sini dan hanya dibaca
     * server: klien mengirim koordinat & akurasi MENTAH, tidak menghitung dan tidak
     * menyimpulkan apa pun. Klien yang ikut memutuskan = dua rumus yang bisa menyimpang
     * (#79/#84) sekaligus vonis yang bisa dipalsukan.
     *
     * 300 m (keputusan user 2026-08-31), sengaja longgar: warga lazimnya LARI dulu dari api
     * baru mengeluarkan ponselnya, jadi ambang yang ketat akan menuduh pelapor yang justru
     * benar-benar ada di sana.
     */
    public const JARAK_PELAPOR_MAKS_M = 300;

    protected $fillable = [
        'user_id',
        'name',
        'phone',
        'title',
        'incident_type',
        'description',
        'address',
        // Alamat hasil reverse-geocode dari TITIK laporan (TASK_49) — pasangan `address`
        // yang berisi patokan ketikan manusia. Mesin menulis ke sini, manusia ke sana.
        'geo_address',
        'lat',
        'lng',
        // Asal-usul titik (TASK_52). Ketiganya nullable tanpa backfill — laporan lama &
        // klien lama tak mengirimnya, dan layar membacanya sebagai "tidak tercatat".
        'location_source',
        'location_accuracy_m',
        'reporter_distance_m',
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

    /**
     * Alamat yang ditampilkan saat sebuah laporan diringkas jadi SATU baris "di mana"
     * (daftar, kartu, popup peta, dashboard). Alamat mesin lebih dulu karena ia dijamin
     * cocok dengan pin; patokan ketikan warga jadi cadangan — ia bisa kosong (kebakaran =
     * darurat-first, ReportRequest membuatnya opsional) dan bisa menerangkan tempat tanpa
     * menyebut alamatnya sama sekali.
     *
     * SATU aturan, SATU tempat: sebelum TASK_49 kesembilan layar itu membaca `address`
     * langsung, dan begitu kolom itu berhenti ditimpa alamat mesin, sebagian di antaranya
     * akan menampilkan baris kosong tanpa ada yang sadar. Kembarannya di sisi klien adalah
     * `alamatLaporan()` di `resources/js/lib/utils.js` — ubah keduanya bersamaan.
     */
    public function alamatTampil(): ?string
    {
        return $this->geo_address ?: $this->address;
    }

    /**
     * Tetapkan asal-usul titik sebuah laporan BARU dari bukti yang dikirim form (TASK_52).
     * Memulangkan pasangan kolom siap simpan: `location_source` + `reporter_distance_m`.
     *
     * Jaraknya dihitung di PHP (haversine), BUKAN lewat `selectRaw` — `acos()`/`radians()`
     * tidak tersedia di SQLite bawaan PHP yang dipakai lokal & testing, jadi versi SQL-nya
     * hanya jalan di MySQL produksi (pelajaran #64, pola yang sama sudah dipakai
     * `Front\PompaController::haversineKm()`).
     *
     * Koordinat pelapor MASUK ke sini, tapi tidak pernah keluar lagi: yang dipulangkan cuma
     * jaraknya (keputusan privasi user 2026-08-31). Jangan menambahkan `reporter_lat/lng`
     * ke nilai kembalian "biar bisa diaudit" — itu membalik keputusan itu tanpa bertanya.
     *
     * @return array{location_source: string, reporter_distance_m: int|null}
     */
    public static function asalTitikDari(?float $reporterLat, ?float $reporterLng, float $lat, float $lng): array
    {
        // Posisi pelapor tak diketahui (izin lokasi ditolak, GPS gagal, atau klien lama yang
        // memang tak mengirimnya). Titiknya TIDAK divonis salah — ia hanya tak punya
        // pembanding, dan itu keadaan tersendiri yang harus terbaca apa adanya di layar.
        if ($reporterLat === null || $reporterLng === null) {
            return ['location_source' => 'tanpa_referensi', 'reporter_distance_m' => null];
        }

        $meter = (int) round(self::jarakMeter($reporterLat, $reporterLng, $lat, $lng));

        return [
            'location_source' => $meter <= self::JARAK_PELAPOR_MAKS_M ? 'gps_pelapor' : 'ditandai_manual',
            'reporter_distance_m' => $meter,
        ];
    }

    /** Jarak dua titik di permukaan bumi (meter). */
    private static function jarakMeter(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadius * 2 * atan2(sqrt($a), sqrt(1 - $a));
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
