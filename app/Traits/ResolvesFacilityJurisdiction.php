<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Kode wilayah untuk pendataan fasilitas (hydrant, hydrant warga, SKKL/pompa, pos pemadam).
 *
 * Sebelumnya keempat controller menyalin tiga baris yang sama:
 *
 *     $validated['district_code'] = $user->district_code ?? $request->district_code;
 *
 * Aturan "yurisdiksi admin menang atas isi form" itu benar dan dipertahankan di sini, tapi ia
 * hanya menjaga level yang DIKUNCI. Level yang masih terbuka diterima apa adanya, tanpa
 * memeriksa apakah pilihannya masih berada di dalam level di atasnya — sehingga admin kota
 * Denpasar bisa menyimpan aset dengan `city_code` Denpasar tapi `district_code`/`village_code`
 * milik kabupaten lain (mis. karena pin digeser melewati batas kota lalu auto-fill peta ikut
 * berpindah). Barisnya tetap terlihat oleh admin itu — `Tenantable` menyaring per kota — jadi
 * datanya rusak diam-diam, tanpa gejala.
 *
 * Pemeriksaannya memakai bentuk kode wilayah BPS yang dipakai laravolt/indonesia: kode tiap
 * level selalu diawali kode induknya (provinsi 51 → kota 5171 → kecamatan 517101 → desa
 * 5171012008). Jadi konsistensinya bisa dipastikan TANPA query ke tabel `indonesia_*` sama
 * sekali — penting karena tabel referensi itu tidak selalu terisi di semua environment (mis. test).
 *
 * PANJANG kodenya diambil dari isi tabel wilayah, bukan dari lebar kolom: seluruh 7.285 baris
 * `indonesia_districts` berkode 6 digit dan 83.762 desa 10 digit, sedangkan kolom `char(7)` di
 * migrasi (baik milik repo ini maupun milik paket laravolt) sekadar lebih longgar. Sampai
 * 2026-08-25 konstanta di bawah menyebut kecamatan 7 digit, sehingga `parentCode()` memotong
 * desa `5171012008` menjadi `5171012` alih-alih `517101` — kode yang tak dimiliki kecamatan mana
 * pun, tak akan pernah cocok dengan `district_code` staf, dan karena itu barisnya hilang
 * diam-diam dari pandangan staf tingkat kecamatan (FINDINGS #79).
 */
trait ResolvesFacilityJurisdiction
{
    /** Panjang kode wilayah per level, sesuai isi tabel `indonesia_*` (lihat catatan di atas). */
    private const CODE_LENGTHS = ['province' => 2, 'city' => 4, 'district' => 6, 'village' => 10];

    /**
     * Gabungkan yurisdiksi admin (yang mengunci) dengan pilihan form (untuk level yang masih
     * terbuka), pastikan rantainya konsisten, lalu lengkapi level atas yang kosong.
     *
     * @return array{province_code: ?string, city_code: ?string, district_code: ?string, village_code: ?string}
     *
     * @throws ValidationException bila kode wilayah yang dikirim berada di luar induknya
     */
    protected function resolveJurisdictionCodes(Request $request): array
    {
        $user = auth()->user();

        // Kolom wilayah user yang kosong = tidak mengunci level itu (aturan yang sama dipakai
        // Tenantable & User::scopeNotifiableForReport), jadi '' diperlakukan sama dengan NULL.
        $province = $this->jurisdictionCode($user->province_code) ?? $this->jurisdictionCode($request->input('province_code'));
        $city = $this->jurisdictionCode($user->city_code) ?? $this->jurisdictionCode($request->input('city_code'));
        $district = $this->jurisdictionCode($user->district_code) ?? $this->jurisdictionCode($request->input('district_code'));
        $village = $this->jurisdictionCode($user->village_code) ?? $this->jurisdictionCode($request->input('village_code'));

        $errors = [];

        if ($city && $province && ! str_starts_with($city, $province)) {
            $errors['city_code'] = 'Kabupaten/Kota yang dipilih berada di luar provinsi yang berlaku untuk akun Anda.';
        }

        if ($district && $city && ! str_starts_with($district, $city)) {
            $errors['district_code'] = 'Kecamatan yang dipilih berada di luar Kabupaten/Kota yang berlaku — periksa kembali titik pin dan pilihan wilayahnya.';
        }

        // Desa dicek terhadap kecamatan bila ada; kalau kecamatan kosong, kota sudah cukup
        // untuk membuktikan desanya berada di luar wewenang.
        $villageParent = $district ?: $city;

        if ($village && $villageParent && ! str_starts_with($village, $villageParent)) {
            $errors['village_code'] = 'Desa/Kelurahan yang dipilih berada di luar wilayah yang berlaku — periksa kembali titik pin dan pilihan wilayahnya.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        // Level atas yang kosong diturunkan dari level bawah yang sudah terbukti konsisten.
        // Form lama hanya mengirim desa (mis. daftar SKKL) sehingga `district_code` kosong dan
        // rekap per kecamatan jadi bolong padahal datanya sebenarnya ada di kode desa itu.
        $district = $district ?: $this->parentCode($village, 'district');
        $city = $city ?: $this->parentCode($district, 'city');
        $province = $province ?: $this->parentCode($city, 'province');

        return [
            'province_code' => $province,
            'city_code' => $city,
            'district_code' => $district,
            'village_code' => $village,
        ];
    }

    /**
     * Sama seperti resolveJurisdictionCodes(), tapi langsung ditempelkan ke data tervalidasi.
     * `$only` untuk model yang tidak menyimpan seluruh level (mis. form hydrant yang tidak
     * pernah mengirim provinsi).
     */
    protected function withJurisdictionCodes(array $validated, Request $request, ?array $only = null): array
    {
        $codes = $this->resolveJurisdictionCodes($request);

        if ($only !== null) {
            $codes = array_intersect_key($codes, array_flip($only));
        }

        return array_merge($validated, $codes);
    }

    /**
     * Kode kecamatan dari kode desa (5171012008 → 517101). Dipakai juga di luar jalur simpan —
     * mis. rekap air per desa yang perlu menyebut kecamatannya saat desanya tak dikenal —
     * supaya panjang kode wilayah hanya ditulis di SATU tempat.
     */
    protected function districtCodeFromVillage(?string $villageCode): ?string
    {
        return $this->parentCode($villageCode, 'district');
    }

    private function jurisdictionCode($value): ?string
    {
        $value = is_string($value) ? trim($value) : $value;

        return ($value === null || $value === '') ? null : (string) $value;
    }

    /** Potong kode wilayah menjadi kode induknya; null bila panjangnya tak dikenal. */
    private function parentCode(?string $code, string $level): ?string
    {
        $length = self::CODE_LENGTHS[$level];

        return ($code !== null && strlen($code) > $length) ? substr($code, 0, $length) : null;
    }
}
