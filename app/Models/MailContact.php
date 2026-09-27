<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Collection;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

/**
 * Daftar putih penerima Email Dinas (TASK_56). Ter-scope wilayah via Tenantable (pola Agency),
 * jadi tiap kabupaten mengelola daftarnya sendiri lewat Admin\MailContactController.
 *
 * INILAH SATU-SATUNYA SUMBER GERBANG KIRIM. `agencies.email` tetap sekadar detail kontak
 * instansi dan TIDAK memberi izin kirim: dua sumber untuk satu gerbang berarti dua cara
 * mencabut izin dan dua tempat yang bisa menyimpang. Supaya alamat tak perlu diketik dua kali,
 * tarikDariAgency() MENYALIN baris master OPD ke sini — tindakan yang terlihat, bukan sumber
 * kedua yang bekerja diam-diam di belakang gerbang.
 */
class MailContact extends Model
{
    use SoftDeletes, Tenantable;

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Alamat pada $emails yang TIDAK ada di daftar putih wilayah ini (atau nonaktif).
     * Array kosong = semua penerima boleh dikirimi.
     *
     * Dipakai MailSendRequest untuk tulis baru, BALAS, dan TERUSKAN — ketiganya lewat satu
     * aturan. Penyaringnya DAFTAR PUTIH: alamat yang tak dikenal ditolak, bukan alamat tertentu
     * yang dilarang. Daftar hitam selalu ketinggalan saat ada anggota baru, tanpa galat.
     *
     * Perbandingan case-insensitive: penerima mengetik "Camat@Kota.go.id" dan "camat@kota.go.id"
     * untuk kotak surat yang sama, dan gerbang yang menolak karena beda huruf besar akan
     * terbaca sebagai kerusakan, bukan sebagai aturan.
     *
     * @param  array<int, string>  $emails
     * @return array<int, string>
     */
    public static function alamatTakDikenal(array $emails): array
    {
        $terdaftar = static::query()
            ->where('is_active', true)
            ->pluck('email')
            ->map(fn ($email) => self::normalkan($email))
            ->all();

        return collect($emails)
            ->reject(fn ($email) => in_array(self::normalkan($email), $terdaftar, true))
            ->values()
            ->all();
    }

    /**
     * Kontak aktif wilayah ini untuk pemilih penerima di layar. Dikirim sebagai DAFTAR supaya
     * pengirim memilih, bukan mengetik bebas: kotak isian bebas yang lalu ditolak server adalah
     * bentuk #105 — layar menjanjikan lebih longgar daripada yang server izinkan.
     */
    public static function untukPemilih(): Collection
    {
        return static::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'jabatan', 'instansi', 'email']);
    }

    /**
     * Salin instansi ber-email dari master OPD ke daftar kontak wilayah ini. Mengembalikan
     * jumlah baris BARU yang dibuat.
     *
     * Kedua query ter-Tenantable, jadi hanya master & kontak wilayah sendiri yang tersentuh.
     * Pencegahan ganda di sini (bukan lewat unique constraint): SoftDeletes membuat baris
     * terhapus tetap memegang slot unique-nya, sehingga constraint justru akan menolak
     * penarikan ulang kontak yang pernah dihapus.
     */
    public static function tarikDariAgency(array $tenantCodes): int
    {
        $sudahAda = static::withTrashed()
            ->pluck('email')
            ->map(fn ($email) => self::normalkan($email))
            ->all();

        $baru = 0;

        Agency::query()
            ->where('is_active', true)
            ->whereNotNull('email')
            ->get(['name', 'email', 'contact_person'])
            ->each(function (Agency $agency) use (&$baru, &$sudahAda, $tenantCodes) {
                $email = self::normalkan($agency->email);

                if ($email === '' || in_array($email, $sudahAda, true)) {
                    return;
                }

                static::create([
                    'name' => $agency->contact_person ?: $agency->name,
                    'instansi' => $agency->name,
                    'email' => $agency->email,
                    'is_active' => true,
                ] + $tenantCodes);

                $sudahAda[] = $email;
                $baru++;
            });

        return $baru;
    }

    private static function normalkan(?string $email): string
    {
        return mb_strtolower(trim((string) $email));
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function (Builder $query, $search) {
            $query->where(function (Builder $query) use ($search) {
                $query->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('jabatan', 'like', '%'.$search.'%')
                    ->orWhere('instansi', 'like', '%'.$search.'%');
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
