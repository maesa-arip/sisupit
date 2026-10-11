<?php

namespace App\Http\Requests;

use Illuminate\Validation\Validator;

/**
 * Lapor TANPA LOGIN (TASK_77). Aturan isian laporan tetap SATU - diwarisi utuh dari
 * ReportRequest - supaya laporan tamu & laporan akun tak pernah berbeda syarat (mis. desa wajib).
 * Yang ditambahkan hanya yang khas tamu:
 *
 * - `phone` WAJIB: tanpa akun, nomor inilah satu-satunya jalan Pusat Komando menelepon balik.
 *   Tidak diverifikasi (keputusan user 2026-10-11: tanpa OTP), jadi telepon balik itulah
 *   verifikasinya.
 * - Lapis pelindung pertama (selalu aktif, tanpa pihak ketiga): honeypot `website` yang
 *   tersembunyi dari manusia, dan jeda isi minimal sejak form dibuka (dicatat di sesi oleh
 *   ReportController::create). Penolakannya BERSUARA, bukan sukses palsu yang biasa dipakai
 *   melawan bot: di aplikasi darurat, manusia yang salah tertangkap lalu mengira laporannya
 *   terkirim jauh lebih mahal daripada bot yang tahu ia ditolak.
 */
class GuestReportRequest extends ReportRequest
{
    /** Jeda minimal (detik) antara form dibuka dan dikirim. Form lapor mustahil diisi manusia lebih cepat. */
    public const MIN_FILL_SECONDS = 3;

    /** Kunci sesi waktu form tamu dibuka (ditulis ReportController::create). */
    public const SESSION_FORM_OPENED_AT = 'guest_report_form_opened_at';

    public const BOT_MESSAGE = 'Laporan tidak dapat dikirim. Muat ulang halaman lalu coba lagi. Dalam keadaan darurat, telepon 113.';

    protected function prepareForValidation(): void
    {
        // Nomor ditulis seragam 08xx: "+62 812-3456 7890", "62812..." dan "0812 3456 7890" adalah
        // nomor yang sama, dan batas kirim per nomor tak boleh bisa dielak dengan spasi.
        $phone = preg_replace('/[\s\-().]/', '', (string) $this->input('phone'));
        if (str_starts_with($phone, '+62')) {
            $phone = '0'.substr($phone, 3);
        } elseif (str_starts_with($phone, '62')) {
            $phone = '0'.substr($phone, 2);
        }

        $this->merge(['phone' => $phone]);
    }

    public function rules(): array
    {
        return [
            ...parent::rules(),
            // Nomor seluler Indonesia (08 + 8-11 digit). Telepon rumah ditolak: Pusat Komando
            // perlu nomor yang dibawa pelapor, bukan yang tertinggal di rumah yang terbakar.
            'phone' => ['required', 'regex:/^08\d{8,11}$/'],
            'website' => ['prohibited'],
            'turnstile_token' => ['nullable', 'string', 'max:4096'],
            // Dikirim klien bila widget Turnstile tak bisa dimuat (Cloudflare tak terjangkau).
            'turnstile_status' => ['nullable', 'in:error'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.required' => 'Nomor HP wajib diisi agar petugas bisa menghubungi Anda.',
            'phone.regex' => 'Nomor HP tidak valid. Contoh: 081234567890.',
            'website.prohibited' => self::BOT_MESSAGE,
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                $openedAt = $this->session()->get(self::SESSION_FORM_OPENED_AT);

                if (! $openedAt || now()->timestamp - (int) $openedAt < self::MIN_FILL_SECONDS) {
                    $validator->errors()->add('form', self::BOT_MESSAGE);
                }
            },
        ];
    }
}
