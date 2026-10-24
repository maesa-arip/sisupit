<?php

namespace App\Listeners;

use Illuminate\Mail\Events\MessageSending;

/**
 * Logo petir di kepala email (#217) dikirim sebagai gambar SISIPAN (cid), bukan tautan ke
 * https://sisupit.com/icon.png: Gmail tidak pernah mengambil tautan itu (nol permintaan
 * GoogleImageProxy di log nginx prod 2026-10-25) dan menampilkannya sebagai gambar rusak.
 * Gambar sisipan ikut di dalam email, jadi tampil tanpa unduhan luar dan tanpa "Tampilkan gambar".
 *
 * Kepala email (vendor/mail/html/header.blade.php) merujuk `cid:sisupit-logo`; listener ini
 * melampirkan berkasnya ke SETIAP email yang merujuknya, sehingga notifikasi, DinasMail, dan
 * email bawaan Laravel (reset/verifikasi) tertangani di satu titik.
 */
class SisipkanLogoEmail
{
    public const CID = 'sisupit-logo';

    public function handle(MessageSending $event): void
    {
        $html = $event->message->getHtmlBody();

        if (is_string($html) && str_contains($html, 'cid:'.self::CID)) {
            $event->message->embedFromPath(public_path('icon.png'), self::CID, 'image/png');
        }
    }
}
