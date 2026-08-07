<?php

namespace App\Enums;

/**
 * Paket layanan sebuah tenant/kabupaten (TASK_19, rencana TASK_18 slice 1).
 *
 * AWAS: ini BUKAN `TenantLevel` — enum itu sudah ada dan artinya level wilayah
 * (desa/kecamatan/kabupaten/provinsi). Yang di sini murni komersial: bagaimana
 * kabupaten memakai SISUPIT, bukan seberapa luas wilayahnya.
 */
enum TenantEdition: string
{
    case SEWA = 'sewa';
    case BELI = 'beli';

    public function label(): string
    {
        return match ($this) {
            self::SEWA => 'Sewa (Berlangganan)',
            self::BELI => 'Beli (Lisensi Perpetual)',
        };
    }

    /** Ringkasan hak pakai — dipakai halaman Syarat & Ketentuan dan Paket & Lisensi. */
    public function description(): string
    {
        return match ($this) {
            self::SEWA => 'Hak pakai selama masa berlangganan aktif, termasuk pemeliharaan, '
                .'pembaruan, dan dukungan teknis. Kode sumber tetap milik pengembang.',
            self::BELI => 'Hak pakai perpetual tanpa biaya sewa, disertai penyerahan salinan '
                .'kode sumber sebagai aset instansi. Hosting tetap dikelola bersama.',
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
