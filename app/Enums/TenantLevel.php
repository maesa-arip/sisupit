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
