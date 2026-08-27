<?php

namespace App\Models;

use App\Traits\Tenantable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;
use Laravolt\Indonesia\Models\Village;

/**
 * Master banjar — satuan komunitas Bali di bawah desa/kelurahan (permintaan user 2026-08-26).
 * Ter-scope wilayah via Tenantable (pola `Agency`/`Unit`), jadi tiap kabupaten mengelola
 * daftarnya sendiri lewat Admin\BanjarController.
 *
 * Banjar BUKAN tingkat kelima Tenantable. Trait itu alat kontrol akses yang bekerja di empat
 * kolom BPS; banjar lebih halus dari desa dan sifatnya deskriptif — dipakai untuk menandai
 * kepemilikan tandon swadaya dan asal warga, bukan untuk membatasi siapa melihat apa.
 * Menambahkannya ke sana akan memaksa SELURUH modul memahami banjar tanpa manfaat akses apa pun.
 */
class Banjar extends Model
{
    use SoftDeletes, Tenantable;

    /** Jenis banjar. Keduanya daftar yang BERBEDA dengan jumlah berbeda — lihat migrasinya. */
    public const JENIS = ['dinas', 'adat'];

    /**
     * Tingkat keyakinan sebuah baris — BUKAN jenis banjar yang berbeda.
     * `usulan` = diketik warga saat melengkapi profil karena banjarnya belum ada di master;
     * `terverifikasi` = berasal dari daftar resmi atau sudah ditinjau admin.
     * Keduanya tetap boleh dipilih di dropdown: menyembunyikan usulan berarti warga berikutnya
     * di desa yang sama mengetik ulang nama yang sama dan lahirlah duplikat.
     */
    public const STATUS_TERVERIFIKASI = 'terverifikasi';

    public const STATUS_USULAN = 'usulan';

    public const STATUSES = [self::STATUS_TERVERIFIKASI, self::STATUS_USULAN];

    protected $guarded = [];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function village()
    {
        return $this->belongsTo(Village::class, 'village_code', 'code');
    }

    public function hydrantWargas(): HasMany
    {
        return $this->hasMany(HydrantWarga::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Pilihan banjar untuk satu desa — sumber dropdown di form hydrant warga & lengkapi profil.
     *
     * TANPA Tenantable: dipakai juga oleh warga yang sedang melengkapi profil, yang justru
     * BELUM punya kode wilayah sehingga scope-nya akan menolak semuanya (aturan #44). Kode desa
     * yang diminta sudah membatasi hasilnya ke satu desa, dan isinya hanya nama banjar — tak
     * ada data pribadi. Ini re-check pengganti yang disyaratkan ATURAN EMAS #7.
     *
     * @return \Illuminate\Support\Collection<int, array{id:int,name:string,jenis:?string}>
     */
    public static function optionsForVillage(?string $villageCode)
    {
        if (! $villageCode) {
            return collect();
        }

        return static::withoutGlobalScope('tenant')
            ->where('village_code', $villageCode)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'jenis', 'status'])
            ->map(fn (self $banjar) => [
                'id' => $banjar->id,
                'name' => $banjar->name,
                'jenis' => $banjar->jenis,
                // Dipakai layar untuk menandai baris yang belum ditinjau. Usulan TETAP
                // ditawarkan — lihat alasan di konstanta STATUS_USULAN.
                'status' => $banjar->status,
            ])
            ->values();
    }

    /**
     * Pastikan banjar yang dipilih memang milik desa yang sedang disimpan.
     *
     * KENAPA PERLU, padahal dropdown-nya sudah disaring per desa: yang menentukan desa sebuah
     * baris BUKAN pilihan terakhir pengguna, melainkan hasil penyelarasan yurisdiksi
     * (ResolvesFacilityJurisdiction) — dan `village_code` bisa berubah SESUDAH banjar dipilih.
     * Di form fasilitas, menggeser pin membuat reverse-geocode menimpa kode wilayah (TASK_32),
     * sementara `banjar_id` yang sudah terlanjur terpilih ikut terkirim apa adanya. Hasilnya
     * tandon desa A tercatat di bawah banjar desa B tanpa satu pun galat — persis bentuk #78:
     * tak ada yang menolak apa pun, yang rusak hanya rekapnya, diam-diam.
     *
     * Karena itu pemeriksaannya berdiri di SATU tempat bersama `optionsForVillage()`: daftar
     * yang ditawarkan dan pasangan yang diterima harus tunduk pada aturan yang sama, kalau
     * tidak keduanya akan berjalan sendiri-sendiri begitu salah satunya disunting.
     *
     * TANPA Tenantable, alasan yang sama dengan optionsForVillage(): pemanggilnya termasuk warga
     * yang belum punya kode wilayah (#44). Re-check pengganti yang disyaratkan ATURAN EMAS #7
     * adalah kecocokan desa itu sendiri — syarat yang justru LEBIH sempit daripada scope
     * kabupaten, sebab desa selalu berada di dalam satu kabupaten.
     *
     * `is_active` SENGAJA tidak ikut diperiksa: status itu mengatur apa yang DITAWARKAN, bukan
     * apa yang sah. Menonaktifkan sebuah banjar tidak boleh membuat tandon yang sudah lama
     * menunjuk ke sana gagal disimpan ulang saat catatannya disunting.
     *
     * @throws ValidationException bila banjar tidak berada di desa tersebut
     */
    public static function assertBelongsToVillage($banjarId, ?string $villageCode): void
    {
        if ($banjarId === null || $banjarId === '') {
            return;
        }

        // Banjar terpilih tapi desanya kosong: tak ada yang bisa diadu, dan banjar tanpa desa
        // induk tak pernah sah. Ditolak, bukan dibiarkan lolos sebagai "belum bisa diperiksa".
        if ($villageCode === null || $villageCode === '') {
            throw ValidationException::withMessages([
                'banjar_id' => 'Pilih Desa/Kelurahan dulu sebelum memilih banjar.',
            ]);
        }

        $banjar = static::withoutGlobalScope('tenant')->find($banjarId);

        if (! $banjar || (string) $banjar->village_code !== $villageCode) {
            throw ValidationException::withMessages([
                'banjar_id' => 'Banjar yang dipilih bukan milik Desa/Kelurahan ini — periksa kembali titik pin dan pilihan wilayahnya.',
            ]);
        }
    }

    /**
     * Satu bentuk penulisan nama banjar untuk seluruh tabel: "Banjar <Nama>".
     *
     * Seluruh 123 baris hasil impor berkas Pemkot memakai bentuk ini, jadi ia bukan selera
     * melainkan konvensi yang sudah berlaku. Tanpa penyeragaman di titik masuk, warga akan
     * mengetik "Br. Tegal", "banjar tegal", dan "Tegal" untuk banjar yang SAMA — persis
     * skenario yang membuat tabel ini dibuat alih-alih kolom teks bebas (lihat migrasinya).
     * Awalan apa pun yang diketik warga dilucuti dulu supaya tak lahir "Banjar Banjar Tegal".
     */
    public static function normalkanNama(string $nama): string
    {
        $nama = preg_replace('/\s+/u', ' ', trim($nama));
        $nama = preg_replace('/^(banjar|banjer|br\.?|bj\.?)\s+/iu', '', $nama);

        return 'Banjar '.trim($nama);
    }

    /**
     * Rangka nama untuk MENDETEKSI kemiripan — tidak pernah dipakai untuk menulis.
     *
     * Aturannya sama dengan `--fuzzy` di `sisupit:import-banjar`: vokal dibuang karena
     * Klod/Kelod adalah desa yang sama. Ditambah th=t, dh=d, kh=k — varian ejaan Bali yang
     * lazim dan sudah terbukti nyata di data ini (DB memuat "Kertha Dharma" sementara situs
     * resmi desanya menulis "Kerta Dharma"; keduanya banjar yang sama).
     *
     * JANGAN diganti jarak Levenshtein. Kriteria itu sudah dicoba di importir dan langsung
     * mengusulkan CATUR → SANUR, dua desa yang sama sekali berbeda.
     */
    public static function rangkaNama(string $nama): string
    {
        $n = strtolower(preg_replace('/^banjar\s+/iu', '', static::normalkanNama($nama)));
        $n = preg_replace('/[^a-z]/', '', $n);
        $n = str_replace(['th', 'dh', 'kh'], ['t', 'd', 'k'], $n);

        return preg_replace('/[aeiou]/', '', $n);
    }

    /**
     * Banjar di desa yang sama yang namanya "mirip" — calon duplikat.
     *
     * Dikembalikan APA ADANYA supaya pemanggil bisa menawarkannya ke pengguna ("maksud Anda
     * Banjar Tegal Sari?") alih-alih memutuskan sendiri. Menggabungkan dua nama mirip secara
     * otomatis adalah persis kesalahan yang dicegah di importir.
     */
    public static function cariSerupa(?string $villageCode, string $nama): ?self
    {
        if (! $villageCode) {
            return null;
        }

        $rangka = static::rangkaNama($nama);

        return static::withoutGlobalScope('tenant')
            ->where('village_code', $villageCode)
            ->get()
            ->first(fn (self $b) => static::rangkaNama($b->name) === $rangka);
    }

    public function scopeFilter(Builder $query, array $filters): void
    {
        $query->when($filters['search'] ?? null, function ($query, $search) {
            $query->where(fn ($q) => $q->where('name', 'like', '%'.$search.'%')
                ->orWhere('code', 'like', '%'.$search.'%'));
        })->when($filters['jenis'] ?? null, function ($query, $jenis) {
            if ($jenis !== 'Semua') {
                $query->where('jenis', $jenis);
            }
        })->when($filters['status'] ?? null, function ($query, $status) {
            if ($status !== 'Semua') {
                $query->where('status', $status);
            }
        });
    }
}
