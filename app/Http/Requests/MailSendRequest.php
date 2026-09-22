<?php

namespace App\Http\Requests;

use App\Http\Controllers\Front\MailController;
use App\Models\MailContact;
use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

/**
 * Gerbang penerima Email Dinas (TASK_56). SATU-SATUNYA tempat aturan "hanya boleh ke alamat
 * yang terdaftar" ditulis.
 *
 * WAJIB dipakai oleh KETIGA jalur kirim — tulis baru, BALAS, dan TERUSKAN. Lubang yang paling
 * sering kelupaan bukan tombol "tulis baru" melainkan dua yang lain: membalas sebuah surat
 * terasa seperti melanjutkan percakapan, bukan seperti mengirim ke alamat baru, padahal bagi
 * server keduanya sama saja. Menyalin aturan ini ke jalur kedua = dua aturan yang akan
 * menyimpang, dan yang menyimpang tidak pernah bergalat.
 *
 * Bentuknya DAFTAR PUTIH: alamat yang tak dikenal ditolak. Daftar hitam ("jangan ke domain X")
 * selalu ketinggalan saat ada anggota baru — aturan yang sama sudah tertulis di CONVENTIONS.md
 * untuk penyaring status laporan.
 */
class MailSendRequest extends FormRequest
{
    /**
     * Gerbang peran & ketersediaan kotak surat dijalankan DI SINI, bukan hanya di controller.
     *
     * Alasannya urutan, dan ia sempat terbukti salah: FormRequest divalidasi SEBELUM method
     * controller dipanggil, sehingga gerbang yang hanya ada di controller membuat POST ke
     * fitur yang mati dijawab galat validasi "alamat tidak ada di Daftar Penerima" (302) —
     * bukan 404. Jawaban itu mengaku bahwa endpoint-nya ada DAN membocorkan cara kerja
     * daftar putihnya kepada orang yang seharusnya tidak melihat fiturnya sama sekali.
     *
     * Daftar perannya SATU (MailController::PERAN_PENGIRIM) dan ketersediaan kotak suratnya
     * dihitung SATU fungsi (Tenant::mailboxFor) — yang berulang di sini cuma pemanggilannya.
     */
    public function authorize(): bool
    {
        abort_unless($this->user()?->hasAnyRole(MailController::PERAN_PENGIRIM), 403);
        abort_if(Tenant::mailboxFor($this->user()) === null, 404);

        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'subject' => trim((string) $this->subject),
            'body' => trim((string) $this->body),
            'to' => array_values(array_filter((array) $this->input('to', []))),
            'cc' => array_values(array_filter((array) $this->input('cc', []))),
        ]);
    }

    public function rules(): array
    {
        return [
            'subject' => ['required', 'string', 'min:3', 'max:200'],
            'body' => ['required', 'string', 'min:10', 'max:20000'],
            'to' => ['required', 'array', 'min:1', 'max:20'],
            'to.*' => ['required', 'email', 'max:255'],
            'cc' => ['nullable', 'array', 'max:20'],
            'cc.*' => ['required', 'email', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            // Ter-Tenantable: daftar yang diadu adalah kontak milik kabupaten pengirim saja,
            // jadi alamat sah milik kabupaten lain pun ditolak di sini.
            $takDikenal = MailContact::alamatTakDikenal(array_merge(
                (array) $this->input('to', []),
                (array) $this->input('cc', []),
            ));

            if ($takDikenal === []) {
                return;
            }

            $validator->errors()->add('to', 'Alamat berikut tidak ada di Daftar Penerima: '
                .implode(', ', $takDikenal)
                .'. Minta admin menambahkannya lebih dulu.');
        });
    }

    public function attributes(): array
    {
        return [
            'subject' => 'Perihal',
            'body' => 'Isi surat',
            'to' => 'Penerima',
            'cc' => 'Tembusan',
        ];
    }
}
