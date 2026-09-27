<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Surat dinas yang dikirim Damkar kabupaten ke pejabat (TASK_56).
 *
 * MAILABLE PERTAMA DI REPO INI — sebelum ini aplikasi hanya mengirim email bawaan framework
 * (verifikasi pendaftaran & reset password). Bentuknya karena itu jadi patokan; catat di
 * CONVENTIONS.md bila ditambah Mailable kedua.
 *
 * Alamat & nama pengirim DISUNTIKKAN dari tenant, bukan dari config/mail.php: tiap kabupaten
 * punya kotak suratnya sendiri, dan surat dinas tidak boleh terkirim dari alamat sistem
 * Sisupit (TASK_56 §1.2). Alamatnya sendiri dikunci ke akun kotak suratnya — Gmail menulis
 * ulang header From yang tak cocok dengan akun, jadi alamat bebas menghasilkan surat yang
 * tampil berbeda dari yang tertulis di layar.
 *
 * SENGAJA tidak memakai layout markdown bawaan Laravel: layout itu membawa tanda tangan
 * "Laravel"/nama aplikasi di kakinya, dan surat resmi instansi tak boleh berkaki merek
 * perangkat lunak.
 */
class DinasMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $judul,
        public string $isi,
        public string $fromAddress,
        public ?string $fromName = null,
        // BUKAN `$replyTo`: Mailable sudah punya properti bernama itu (tanpa tipe), dan
        // properti promoted bertipe dengan nama yang sama membuat kelasnya gagal dimuat.
        public ?string $balasKe = null,
        public ?string $tandaTangan = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            from: new Address($this->fromAddress, $this->fromName ?: null),
            replyTo: $this->balasKe ? [new Address($this->balasKe)] : [],
            subject: $this->judul,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.dinas',
            with: [
                'isi' => $this->isi,
                'tandaTangan' => $this->tandaTangan,
            ],
        );
    }
}
