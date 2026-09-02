<?php

namespace App\Enums;

enum TenantLevel: string
{
    case DESA = 'desa';
    case KECAMATAN = 'kecamatan';
    case KABUPATEN = 'kabupaten';
    case PROVINSI = 'provinsi';

    /**
     * Rank wilayah dari paling spesifik (desa) ke paling luas (provinsi).
     * Dipakai untuk menentukan sampai level mana notifikasi boleh cascade naik.
     */
    public function rank(): int
    {
        return match ($this) {
            self::DESA => 4,
            self::KECAMATAN => 3,
            self::KABUPATEN => 2,
            self::PROVINSI => 1,
        };
    }

    /**
     * Tingkat yurisdiksi yang tersirat dari kode wilayah: kolom TERDALAM yang terisi.
     * Sumber kebenaran tunggal untuk penurunan tingkat (dipakai Admin\UserController
     * dan User::jurisdictionLevel).
     *
     * `null` = tidak punya kode wilayah sama sekali, dan itu punya DUA makna yang tidak
     * bisa dibedakan dari bentuk datanya (#56) — pembedanya PERAN:
     *   - peran staf (User::STAFF_ROLES) → yurisdiksi nasional yang memang sengaja luas;
     *   - selain itu (warga/relawan) → profil belum lengkap.
     * Jangan pernah menyimpulkan salah satunya dari NULL saja.
     */
    public static function forCodes(?string $province, ?string $city, ?string $district, ?string $village): ?self
    {
        return match (true) {
            (bool) $village => self::DESA,
            (bool) $district => self::KECAMATAN,
            (bool) $city => self::KABUPATEN,
            (bool) $province => self::PROVINSI,
            default => null,
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::DESA => 'Desa/Kelurahan',
            self::KECAMATAN => 'Kecamatan',
            self::KABUPATEN => 'Kota/Kabupaten',
            self::PROVINSI => 'Provinsi',
        };
    }

    public static function options(): array
    {
        return collect(self::cases())->map(fn ($case) => [
            'value' => $case->value,
            'label' => $case->label(),
        ])->values()->toArray();
    }
}
